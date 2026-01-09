/**
 * Script to check if deals have account_owner_id assigned
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccountOwners() {
  console.log('\n🔍 Checking account owner assignments...\n');
  
  // Check deals
  const { data: deals, error: dealsError } = await supabase
    .from('deals')
    .select('id, title, account_id, account_owner_id')
    .like('id', 'sf-%')
    .limit(10);
  
  if (dealsError) {
    console.error('❌ Error fetching deals:', dealsError);
    return;
  }
  
  console.log('📊 Sample Deals (first 10):');
  console.log('─'.repeat(80));
  
  let withOwner = 0;
  let withAccount = 0;
  let withoutBoth = 0;
  
  for (const deal of deals || []) {
    const hasOwner = !!deal.account_owner_id;
    const hasAccount = !!deal.account_id;
    
    if (hasOwner) withOwner++;
    if (hasAccount) withAccount++;
    if (!hasOwner && !hasAccount) withoutBoth++;
    
    console.log(`Deal: ${deal.title.substring(0, 40).padEnd(40)}`);
    console.log(`  account_id:       ${deal.account_id || '(null)'}`);
    console.log(`  account_owner_id: ${deal.account_owner_id || '(null)'}`);
    console.log('');
  }
  
  // Get total counts
  const { count: totalDeals } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .like('id', 'sf-%');
  
  const { count: dealsWithOwner } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .like('id', 'sf-%')
    .not('account_owner_id', 'is', null);
  
  const { count: dealsWithAccount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .like('id', 'sf-%')
    .not('account_id', 'is', null);
  
  console.log('─'.repeat(80));
  console.log('📈 Summary:');
  console.log(`Total SF deals:           ${totalDeals}`);
  console.log(`Deals with account_id:    ${dealsWithAccount} (${((dealsWithAccount || 0) / (totalDeals || 1) * 100).toFixed(1)}%)`);
  console.log(`Deals with account_owner: ${dealsWithOwner} (${((dealsWithOwner || 0) / (totalDeals || 1) * 100).toFixed(1)}%)`);
  console.log('');
  
  // Check accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('merchant_accounts')
    .select('id, name, account_owner_id')
    .like('id', 'sf-%')
    .limit(5);
  
  if (accountsError) {
    console.error('❌ Error fetching accounts:', accountsError);
    return;
  }
  
  console.log('🏢 Sample Accounts (first 5):');
  console.log('─'.repeat(80));
  
  for (const account of accounts || []) {
    console.log(`Account: ${account.name.substring(0, 40).padEnd(40)}`);
    console.log(`  ID: ${account.id}`);
    console.log(`  account_owner_id: ${account.account_owner_id || '(null)'}`);
    console.log('');
  }
  
  const { count: totalAccounts } = await supabase
    .from('merchant_accounts')
    .select('*', { count: 'exact', head: true })
    .like('id', 'sf-%');
  
  const { count: accountsWithOwner } = await supabase
    .from('merchant_accounts')
    .select('*', { count: 'exact', head: true })
    .like('id', 'sf-%')
    .not('account_owner_id', 'is', null);
  
  console.log('─'.repeat(80));
  console.log(`Total SF accounts:            ${totalAccounts}`);
  console.log(`Accounts with account_owner:  ${accountsWithOwner} (${((accountsWithOwner || 0) / (totalAccounts || 1) * 100).toFixed(1)}%)`);
  console.log('');
  
  // Check employees
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .like('id', 'sf-%');
  
  console.log('👥 Employees:');
  console.log('─'.repeat(80));
  console.log(`Total SF employees: ${totalEmployees}`);
  console.log('');
  
  // Sample a deal with an account to trace the issue
  const { data: dealWithAccount } = await supabase
    .from('deals')
    .select('id, title, account_id, account_owner_id')
    .like('id', 'sf-%')
    .not('account_id', 'is', null)
    .limit(1)
    .single();
  
  if (dealWithAccount) {
    console.log('🔬 Detailed investigation of one deal:');
    console.log('─'.repeat(80));
    console.log(`Deal: ${dealWithAccount.title}`);
    console.log(`  ID: ${dealWithAccount.id}`);
    console.log(`  account_id: ${dealWithAccount.account_id}`);
    console.log(`  account_owner_id: ${dealWithAccount.account_owner_id || '(null)'}`);
    
    if (dealWithAccount.account_id) {
      const { data: linkedAccount } = await supabase
        .from('merchant_accounts')
        .select('id, name, account_owner_id')
        .eq('id', dealWithAccount.account_id)
        .single();
      
      if (linkedAccount) {
        console.log(`\nLinked Account: ${linkedAccount.name}`);
        console.log(`  account_owner_id: ${linkedAccount.account_owner_id || '(null)'}`);
        
        if (linkedAccount.account_owner_id) {
          const { data: owner } = await supabase
            .from('employees')
            .select('id, name, email')
            .eq('id', linkedAccount.account_owner_id)
            .single();
          
          if (owner) {
            console.log(`\nAccount Owner: ${owner.name} (${owner.email})`);
            console.log(`  ID: ${owner.id}`);
          } else {
            console.log(`\n⚠️  Account owner ID exists but employee not found!`);
          }
        } else {
          console.log(`\n⚠️  Account has no account_owner_id!`);
        }
      }
    }
  }
}

checkAccountOwners().catch(console.error);




