/**
 * Script to check if deals reference accounts that don't exist
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccountMismatch() {
  console.log('\n🔍 Checking for deals referencing non-existent accounts...\n');
  
  // Get deals WITHOUT account_id
  const { data: dealsWithoutAccount } = await supabase
    .from('deals')
    .select('id, title, merchant')
    .like('id', 'sf-%')
    .is('account_id', null)
    .limit(3);
  
  console.log('Sample deals WITHOUT account_id:');
  for (const deal of dealsWithoutAccount || []) {
    console.log(`  - ${deal.title} (${deal.merchant})`);
  }
  console.log('');
  
  // Get deals WITH account_id
  const { data: dealsWithAccount } = await supabase
    .from('deals')
    .select('id, title, merchant, account_id')
    .like('id', 'sf-%')
    .not('account_id', 'is', null)
    .limit(3);
  
  console.log('Sample deals WITH account_id:');
  for (const deal of dealsWithAccount || []) {
    console.log(`  - ${deal.title} (${deal.merchant}) -> ${deal.account_id}`);
    
    // Check if account exists
    const { data: account } = await supabase
      .from('merchant_accounts')
      .select('id, name')
      .eq('id', deal.account_id)
      .single();
    
    if (account) {
      console.log(`    ✅ Account exists: ${account.name}`);
    } else {
      console.log(`    ❌ Account NOT FOUND in database!`);
    }
  }
  console.log('');
  
  console.log('💡 Hypothesis: The Salesforce sync is setting account_id on deals,');
  console.log('   but those accounts were not synced because:');
  console.log('   1. Account fetch has date filters (10 years back)');
  console.log('   2. Account fetch is limited to 50,000 accounts');
  console.log('   3. Opportunity fetch includes ALL Live deals (no date limit)');
  console.log('');
  console.log('   So Live deals from older accounts reference accounts that');
  console.log('   were created >10 years ago and are not in our database.');
}

checkAccountMismatch().catch(console.error);




