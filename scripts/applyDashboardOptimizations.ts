/**
 * Apply dashboard optimizations migration guide
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndGuide() {
  console.log('\n🚀 Checking Dashboard Optimization Status...\n');
  
  // 1. Check if the optimized RPC function exists and uses Materialized View
  console.log('Checking for get_deal_aggregations function...');
  const start = Date.now();
  const { data, error } = await supabase.rpc('get_deal_aggregations');
  const duration = Date.now() - start;
  
  if (error) {
    console.log('❌ get_deal_aggregations function NOT found or error accessing it.');
    console.log(`   Error: ${error.message}\n`);
  } else {
    console.log(`✅ get_deal_aggregations function exists (Response time: ${duration}ms)`);
    console.log(`   Returns ${data?.total?.toLocaleString() ?? 0} deals`);
    
    if (duration > 1000) {
      console.log('⚠️  Response time > 1s. It might not be using Materialized View yet.\n');
    } else {
      console.log('⚡ Response time is good. If this is consistent, optimizations might be working.\n');
    }
  }

  // 2. Guide to apply migration
  console.log('📄 To ensure pre-calculated values (Materialized View) are used:');
  console.log('================================================================');
  
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', 'optimize_dashboard_load.sql');
  
  if (fs.existsSync(migrationPath)) {
    console.log(`Found migration file: ${migrationPath}`);
    console.log('\nPlease run the following SQL in your Supabase Dashboard (SQL Editor):');
    console.log('----------------------------------------------------------------');
    // Read and print the first few lines as preview
    const content = fs.readFileSync(migrationPath, 'utf-8');
    const lines = content.split('\n').slice(0, 15);
    console.log(lines.join('\n'));
    console.log('... (copy the full content of supabase/migrations/optimize_dashboard_load.sql) ...');
    console.log('----------------------------------------------------------------\n');
  } else {
    console.log(`❌ Migration file not found at ${migrationPath}`);
  }

  console.log('Instructions:');
  console.log('1. Go to Supabase Dashboard -> SQL Editor');
  console.log('2. Create a new query');
  console.log('3. Copy/paste content of supabase/migrations/optimize_dashboard_load.sql');
  console.log('4. Run the query');
  console.log('5. This will create/replace get_deal_aggregations function and deal_stats_mv materialized view.');
}

checkAndGuide();


