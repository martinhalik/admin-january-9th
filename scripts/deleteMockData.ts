/**
 * Script to delete all mock/seeded data from Supabase
 * Keeps only real Salesforce data (sf-* IDs)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteMockData() {
  console.log('\n🗑️  Deleting all mock/seeded data...\n');
  
  // Delete mock deals (gen-*)
  console.log('Deleting mock deals (gen-*)...');
  const { error: dealsError, count: dealsCount } = await supabase
    .from('deals')
    .delete({ count: 'exact' })
    .like('id', 'gen-%');
  
  if (dealsError) {
    console.error('❌ Error deleting mock deals:', dealsError);
  } else {
    console.log(`✅ Deleted ${dealsCount} mock deals`);
  }
  
  // Delete mock merchant accounts (merchant-*)
  console.log('\nDeleting mock merchant accounts (merchant-*)...');
  const { error: accountsError, count: accountsCount } = await supabase
    .from('merchant_accounts')
    .delete({ count: 'exact' })
    .like('id', 'merchant-%');
  
  if (accountsError) {
    console.error('❌ Error deleting mock accounts:', accountsError);
  } else {
    console.log(`✅ Deleted ${accountsCount} mock merchant accounts`);
  }
  
  // Delete mock employees (emp-*)
  console.log('\nDeleting mock employees (emp-*)...');
  const { error: employeesError, count: employeesCount } = await supabase
    .from('employees')
    .delete({ count: 'exact' })
    .like('id', 'emp-%');
  
  if (employeesError) {
    console.error('❌ Error deleting mock employees:', employeesError);
  } else {
    console.log(`✅ Deleted ${employeesCount} mock employees`);
  }
  
  console.log('\n✅ Mock data cleanup complete!');
  
  // Show remaining data
  const { count: remainingDeals } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true });
  
  const { count: remainingAccounts } = await supabase
    .from('merchant_accounts')
    .select('*', { count: 'exact', head: true });
  
  const { count: remainingEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n📊 Remaining data (all real Salesforce data):');
  console.log(`   Deals: ${remainingDeals}`);
  console.log(`   Merchant Accounts: ${remainingAccounts}`);
  console.log(`   Employees: ${remainingEmployees}`);
}

deleteMockData();




