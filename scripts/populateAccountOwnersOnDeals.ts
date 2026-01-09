/**
 * Script to populate account_owner_id on ALL deals from their merchant accounts
 * This ensures deals inherit the account owner from their associated merchant account
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateAccountOwners() {
  console.log('\n🔄 Populating account_owner_id on all deals from merchant accounts...\n');
  
  // Get count of deals that need updating
  const { count: totalDeals } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Total deals in database: ${totalDeals}`);
  
  // Get all merchant accounts with their owners
  console.log('📥 Fetching all merchant accounts...');
  const { data: accounts, error: accountsError } = await supabase
    .from('merchant_accounts')
    .select('id, account_owner_id');
  
  if (accountsError) {
    console.error('❌ Error fetching accounts:', accountsError);
    return;
  }
  
  console.log(`   ✓ Fetched ${accounts?.length || 0} merchant accounts`);
  
  // Create a map of account_id -> account_owner_id
  const accountOwnerMap = new Map<string, string | null>();
  for (const account of accounts || []) {
    accountOwnerMap.set(account.id, account.account_owner_id);
  }
  
  // Update deals in batches
  const BATCH_SIZE = 1000;
  let offset = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  
  console.log('\n📝 Updating deals...');
  
  while (true) {
    // Fetch a batch of deals
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('id, account_id, account_owner_id')
      .not('account_id', 'is', null)
      .range(offset, offset + BATCH_SIZE - 1);
    
    if (dealsError) {
      console.error(`❌ Error fetching deals at offset ${offset}:`, dealsError);
      break;
    }
    
    if (!deals || deals.length === 0) {
      break;
    }
    
    // Prepare updates
    const updates = [];
    for (const deal of deals) {
      const correctOwnerId = accountOwnerMap.get(deal.account_id);
      
      // Only update if the owner ID is different
      if (deal.account_owner_id !== correctOwnerId) {
        updates.push({
          id: deal.id,
          account_owner_id: correctOwnerId,
        });
      } else {
        totalSkipped++;
      }
    }
    
    // Perform batch update
    if (updates.length > 0) {
      // Update each deal individually to avoid null constraint issues
      let batchUpdated = 0;
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('deals')
          .update({ account_owner_id: update.account_owner_id })
          .eq('id', update.id);
        
        if (updateError) {
          console.error(`❌ Error updating deal ${update.id}:`, updateError.message);
        } else {
          batchUpdated++;
        }
      }
      
      totalUpdated += batchUpdated;
      console.log(`   ✓ Updated ${totalUpdated} deals (batch of ${batchUpdated}/${updates.length})`);
    }
    
    offset += BATCH_SIZE;
    
    // Progress indicator
    if (offset % 5000 === 0) {
      console.log(`   ... processed ${offset} deals so far`);
    }
  }
  
  console.log(`\n✅ Done!`);
  console.log(`   Updated: ${totalUpdated} deals`);
  console.log(`   Skipped: ${totalSkipped} deals (already correct)`);
  
  // Summary statistics
  const { count: dealsWithOwner } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .not('account_owner_id', 'is', null);
  
  const { count: dealsWithAccount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .not('account_id', 'is', null);
  
  console.log(`\n📈 Final Statistics:`);
  console.log(`   Total deals: ${totalDeals}`);
  console.log(`   Deals with account: ${dealsWithAccount}`);
  console.log(`   Deals with owner: ${dealsWithOwner}`);
  console.log(`   Coverage: ${((dealsWithOwner! / totalDeals!) * 100).toFixed(1)}%`);
}

populateAccountOwners();

