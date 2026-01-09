/**
 * Script to assign deals to merchant accounts in Supabase
 * This links existing deals to accounts with a deterministic pattern
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function assignDealsToAccounts() {
  console.log('\n🔗 Assigning deals to merchant accounts...\n');
  
  // Get all accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('merchant_accounts')
    .select('id, account_owner_id')
    .order('id');
  
  if (accountsError || !accounts) {
    console.error('❌ Error fetching accounts:', accountsError);
    return;
  }
  
  console.log(`✅ Found ${accounts.length} merchant accounts\n`);
  
  // Get all deals
  const { data: deals, error: dealsError } = await supabase
    .from('deals')
    .select('id')
    .order('id');
  
  if (dealsError || !deals) {
    console.error('❌ Error fetching deals:', dealsError);
    return;
  }
  
  console.log(`✅ Found ${deals.length} deals\n`);
  
  // Assign deals to accounts using a deterministic pattern
  // - 5% unassigned (no account_id)
  // - 95% distributed across accounts
  const updates = [];
  let unassignedCount = 0;
  let assignedCount = 0;
  
  for (let i = 0; i < deals.length; i++) {
    const deal = deals[i];
    
    // Every 20th deal is unassigned (5%)
    if (i % 20 === 0) {
      updates.push({
        id: deal.id,
        account_id: null,
        account_owner_id: null,
      });
      unassignedCount++;
    } else {
      // Distribute remaining deals across accounts
      const accountIndex = i % accounts.length;
      const account = accounts[accountIndex];
      
      updates.push({
        id: deal.id,
        account_id: account.id,
        account_owner_id: account.account_owner_id, // Denormalized for faster queries
      });
      assignedCount++;
    }
  }
  
  console.log(`📊 Assignment plan:`);
  console.log(`   Assigned to accounts: ${assignedCount}`);
  console.log(`   Unassigned: ${unassignedCount}\n`);
  
  // Update deals one by one (UPDATE doesn't support batch updates with different values)
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    
    const { error } = await supabase
      .from('deals')
      .update({
        account_id: update.account_id,
        account_owner_id: update.account_owner_id,
      })
      .eq('id', update.id);
    
    if (error) {
      console.error(`❌ Error updating deal ${update.id}:`, error.message);
      errorCount++;
    } else {
      successCount++;
      if ((i + 1) % 50 === 0) {
        console.log(`✅ Updated ${i + 1}/${updates.length} deals...`);
      }
    }
  }
  
  console.log(`\n✅ Successfully assigned ${successCount}/${updates.length} deals to accounts!`);
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} errors occurred`);
  }
  
  // Verify
  const { count: withAccountId } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .not('account_id', 'is', null);
  
  const { count: withoutAccountId } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .is('account_id', null);
  
  console.log(`\n📊 Final verification:`);
  console.log(`   Deals with account_id: ${withAccountId}`);
  console.log(`   Deals without account_id: ${withoutAccountId}`);
}

assignDealsToAccounts().catch(console.error);

