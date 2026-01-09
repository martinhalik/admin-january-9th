/**
 * Apply performance optimizations migration and refresh materialized view
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('\n🚀 Applying performance optimizations...\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'performance_optimizations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded\n');
    
    // Execute the migration (note: Supabase client can't execute multi-statement SQL directly)
    // You'll need to run this via Supabase dashboard or SQL editor
    console.log('⚠️  Please run this migration via Supabase SQL Editor:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy the contents of supabase/migrations/performance_optimizations.sql');
    console.log('   5. Paste and run\n');
    
    // Test if materialized view exists
    const { data, error } = await supabase
      .from('employee_account_stats')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Materialized view not found. Please apply the migration first.\n');
      console.log('Error:', error.message);
    } else {
      console.log('✅ Materialized view exists!\n');
      
      // Refresh the materialized view
      console.log('🔄 Refreshing employee_account_stats view...');
      const { error: refreshError } = await supabase.rpc('refresh_employee_account_stats');
      
      if (refreshError) {
        console.log('⚠️  Note: Manual refresh might be needed via SQL Editor:');
        console.log('   REFRESH MATERIALIZED VIEW CONCURRENTLY employee_account_stats;');
      } else {
        console.log('✅ Materialized view refreshed successfully!\n');
      }
      
      // Show some stats
      const { data: stats, error: statsError } = await supabase
        .from('employee_account_stats')
        .select('*')
        .order('accounts_count', { ascending: false })
        .limit(5);
      
      if (!statsError && stats) {
        console.log('📊 Top 5 employees by account count:');
        stats.forEach((emp: any, idx: number) => {
          console.log(`${idx + 1}. ${emp.employee_name} (${emp.employee_role.toUpperCase()}): ${emp.accounts_count} accounts, ${emp.deals_count} deals`);
        });
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyMigration();




