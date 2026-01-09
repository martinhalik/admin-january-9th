import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkData() {
  // Count accounts
  const { count: accountCount } = await supabase
    .from('merchant_accounts')
    .select('*', { count: 'exact', head: true });
  
  console.log('Total merchant accounts:', accountCount);
  
  // Get all accounts with owner names
  const { data: accounts } = await supabase
    .from('merchant_accounts_with_owners')
    .select('name, owner_name')
    .order('name');
  
  console.log('\nAccounts:');
  accounts?.forEach(acc => {
    console.log(`  ${acc.name} → ${acc.owner_name || 'Unassigned'}`);
  });
  
  // Count by owner
  const { data: distribution } = await supabase
    .from('merchant_accounts_with_owners')
    .select('owner_name')
    .not('owner_name', 'is', null);
  
  const counts: Record<string, number> = {};
  distribution?.forEach(d => {
    counts[d.owner_name] = (counts[d.owner_name] || 0) + 1;
  });
  
  console.log('\nDistribution:');
  Object.entries(counts).forEach(([name, count]) => {
    console.log(`  ${name}: ${count} accounts`);
  });
}

checkData();




