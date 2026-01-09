#!/usr/bin/env tsx

/**
 * Check what categories exist in the database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  console.log('🔍 Checking categories in database...\n');

  // Get all unique categories
  const { data: deals } = await supabase
    .from('deals')
    .select('category, division')
    .limit(10000);

  if (!deals || deals.length === 0) {
    console.log('❌ No deals found');
    return;
  }

  // Count categories
  const categoryCounts: Record<string, number> = {};
  const divisionCategoryCounts: Record<string, Record<string, number>> = {};

  deals.forEach(deal => {
    const category = deal.category || 'Unknown';
    const division = deal.division || 'Unknown';

    // Overall category count
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    // Division-specific category count
    if (!divisionCategoryCounts[division]) {
      divisionCategoryCounts[division] = {};
    }
    divisionCategoryCounts[division][category] = 
      (divisionCategoryCounts[division][category] || 0) + 1;
  });

  console.log('📊 Overall Category Distribution (first 10,000 deals):');
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`   • ${category}: ${count.toLocaleString()}`);
    });

  console.log('\n📊 Category Distribution by Division:');
  Object.entries(divisionCategoryCounts).forEach(([division, categories]) => {
    console.log(`\n   ${division}:`);
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([category, count]) => {
        console.log(`      • ${category}: ${count.toLocaleString()}`);
      });
  });

  // Sample some deals
  console.log('\n📋 Sample deals:');
  deals.slice(0, 5).forEach((deal, i) => {
    console.log(`   ${i + 1}. Division: ${deal.division}, Category: ${deal.category}`);
  });
}

checkCategories().catch(console.error);
