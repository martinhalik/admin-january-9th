#!/usr/bin/env tsx

/**
 * Check Dashboard Data
 * This script checks if the dashboard aggregation function is working
 * and if there are deals in the database.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from frontend/.env
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please check frontend/.env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDashboardData() {
  console.log('🔍 Checking Dashboard Data...\n');

  // 1. Check if deals exist
  console.log('1️⃣  Checking for deals in database...');
  const { data: deals, error: dealsError, count } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: false })
    .limit(5);

  if (dealsError) {
    console.error('❌ Error fetching deals:', dealsError.message);
  } else {
    console.log(`✅ Found ${count} deals in database`);
    if (deals && deals.length > 0) {
      console.log(`   Sample deal: "${deals[0].title}" (${deals[0].division})`);
    }
  }

  // 2. Check if aggregation function exists
  console.log('\n2️⃣  Checking for get_deal_aggregations function...');
  const { data: funcData, error: funcError } = await supabase
    .rpc('get_deal_aggregations');

  if (funcError) {
    console.error('❌ Function error:', funcError.message);
    console.log('\n📋 TO FIX THIS:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run the migration file:');
    console.log('      supabase/migrations/optimize_dashboard_load.sql');
    console.log('   4. Or run: supabase/migrations/COPY_THIS_TO_SUPABASE.sql');
  } else {
    console.log('✅ Function exists and returned data');
    if (funcData) {
      console.log(`   Total deals: ${funcData.total}`);
      console.log(`   Divisions: ${funcData.byDivision?.length || 0}`);
      console.log(`   Last updated: ${funcData.lastUpdated || 'N/A'}`);
      
      // Show division breakdown
      if (funcData.byDivision && funcData.byDivision.length > 0) {
        console.log('\n   📊 Division Breakdown:');
        funcData.byDivision.forEach((div: any) => {
          console.log(`      • ${div.division}: ${div.total} deals`);
          if (div.categories && div.categories.length > 0) {
            console.log(`        Categories: ${div.categories.map((c: any) => `${c.name} (${c.count})`).join(', ')}`);
          }
        });
      }
      
      // Show stage breakdown
      if (funcData.byStage) {
        console.log('\n   📈 Stage Breakdown:');
        console.log(`      • Draft: ${funcData.byStage.draft || 0}`);
        console.log(`      • Won: ${funcData.byStage.won || 0}`);
        console.log(`      • Live: ${funcData.byStage.live || 0}`);
        console.log(`      • Lost: ${funcData.byStage.lost || 0}`);
      }
    }
  }

  // 3. Check divisions directly
  console.log('\n3️⃣  Checking divisions directly from deals table...');
  const { data: divisionData } = await supabase
    .from('deals')
    .select('division')
    .limit(1000);

  if (divisionData) {
    const divisionCounts = divisionData.reduce((acc: any, deal: any) => {
      const div = deal.division || 'Unknown';
      acc[div] = (acc[div] || 0) + 1;
      return acc;
    }, {});
    
    console.log('✅ Divisions found in first 1000 deals:');
    Object.entries(divisionCounts).forEach(([division, count]) => {
      console.log(`   • ${division}: ${count}`);
    });
  }

  console.log('\n✨ Check complete!');
}

checkDashboardData().catch(console.error);
