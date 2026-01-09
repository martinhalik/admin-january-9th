/**
 * Seed Supabase database with generated deals
 * 
 * Usage: 
 *   npx ts-node scripts/seedSupabase.ts [count] [--clear]
 * 
 * Examples:
 *   npx ts-node scripts/seedSupabase.ts              # Insert 300 deals
 *   npx ts-node scripts/seedSupabase.ts 100          # Insert 100 deals
 *   npx ts-node scripts/seedSupabase.ts --clear      # Clear and insert 300 deals
 *   npx ts-node scripts/seedSupabase.ts 500 --clear  # Clear and insert 500 deals
 * 
 * Note: Each deal now gets a unique, high-quality Unsplash image based on its category.
 * The generateDeals function includes 150+ unique stock photos organized by category.
 * 
 * For even more variety (fetching fresh images from Unsplash API), run:
 *   npx ts-node scripts/assignUniqueImages.ts
 */

import { createClient } from '@supabase/supabase-js';
import { generateDeals } from './generateDeals';

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  console.error('   Add them to .env file or export them:');
  console.error('   export SUPABASE_URL="https://your-project.supabase.co"');
  console.error('   export SUPABASE_ANON_KEY="your-anon-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedDeals(count: number = 300) {
  console.log(`🌱 Generating ${count} deals...`);
  const deals = generateDeals(count);
  
  console.log('📤 Uploading to Supabase...');
  
  // Convert deals to database format (snake_case)
  const dbDeals = deals.map(deal => ({
    id: deal.id,
    title: deal.title,
    location: deal.location,
    merchant: deal.merchant,
    city: deal.city,
    division: deal.division,
    category: deal.category,
    subcategory: deal.subcategory,
    campaign_stage: deal.campaignStage,
    status: deal.status,
    won_sub_stage: deal.wonSubStage || null,
    draft_sub_stage: deal.draftSubStage || null,
    lost_sub_stage: deal.lostSubStage || null,
    revenue: deal.revenue,
    purchases: deal.purchases,
    views: deal.views,
    conversion_rate: deal.conversionRate,
    margin: deal.margin,
    deal_start: deal.dealStart,
    deal_end: deal.dealEnd,
    quality: deal.quality,
    image_url: deal.imageUrl || null,
  }));
  
  // Insert in batches of 100 to avoid timeout
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < dbDeals.length; i += batchSize) {
    const batch = dbDeals.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('deals')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
      continue;
    }
    
    inserted += batch.length;
    console.log(`   Inserted ${inserted}/${dbDeals.length} deals...`);
  }
  
  console.log('\n✅ Database seeded successfully!');
  console.log(`   Total deals: ${inserted}`);
  
  // Show summary
  const { data: summary } = await supabase
    .from('deals')
    .select('campaign_stage, count');
  
  if (summary) {
    console.log('\n📊 Summary:');
    const live = deals.filter(d => d.campaignStage === 'won').length;
    const draft = deals.filter(d => d.campaignStage === 'draft').length;
    const lost = deals.filter(d => d.campaignStage === 'lost').length;
    console.log(`   Live: ${live}`);
    console.log(`   Draft: ${draft}`);
    console.log(`   Lost: ${lost}`);
  }
}

async function clearDeals() {
  console.log('🗑️  Clearing existing deals...');
  const { error } = await supabase
    .from('deals')
    .delete()
    .neq('id', ''); // Delete all
  
  if (error) {
    console.error('❌ Error clearing deals:', error);
    return false;
  }
  
  console.log('✅ Existing deals cleared');
  return true;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args.find(arg => !arg.startsWith('--')) || '300');
  const shouldClear = args.includes('--clear');
  
  console.log('🚀 Supabase Seeding Script\n');
  
  if (shouldClear) {
    const cleared = await clearDeals();
    if (!cleared) {
      process.exit(1);
    }
  }
  
  await seedDeals(count);
  
  console.log('\n🎉 Done!');
  console.log('\n📝 Next steps:');
  console.log('   1. Update your frontend API to use Supabase');
  console.log('   2. Test the deals page with real data');
  console.log('   3. Verify filtering and search work correctly');
}

main().catch(console.error);

