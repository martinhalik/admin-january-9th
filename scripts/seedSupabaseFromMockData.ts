/**
 * Seed Supabase with mock deals data
 * Run with: npx tsx scripts/seedSupabaseFromMockData.ts
 */

import { createClient } from '@supabase/supabase-js';
import { deals as mockDeals } from '../frontend/src/data/mockDeals';
import { generatedMockDeals } from '../frontend/src/data/generatedMockDeals';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables - try multiple locations
dotenv.config({ path: join(__dirname, '../frontend/.env.local') });
dotenv.config({ path: join(__dirname, '../frontend/.env') });
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Make sure frontend/.env.local has:');
  console.error('  VITE_SUPABASE_URL=your-url');
  console.error('  VITE_SUPABASE_ANON_KEY=your-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface MockDeal {
  id: string;
  title: string;
  location: string;
  category: string;
  subcategory?: string;
  division: string;
  dealStart: string;
  dealEnd: string;
  quality: 'Ace' | 'Good' | 'Fair';
  status: string;
  campaignStage?: 'draft' | 'won' | 'lost';
  wonSubStage?: 'scheduled' | 'live' | 'paused' | 'sold_out' | 'ended';
  draftSubStage?: string;
  lostSubStage?: string;
  stats?: {
    revenue: number;
    purchases: number;
    views: number;
    conversionRate: number;
  };
  content?: {
    media?: Array<{ url: string; isFeatured?: boolean }>;
  };
}

function convertDateToISO(dateStr: string): string {
  // Convert "DD. M. YYYY" or "DD.M.YYYY" to ISO date
  const match = dateStr.match(/^(\d{1,2})[.\s]+(\d{1,2})[.\s]+(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

function convertMockDealToSupabase(deal: MockDeal) {
  // Extract merchant name from location (e.g., "Chimi's Fresh-Mex, St. Louis" -> "Chimi's Fresh-Mex")
  const merchant = deal.location.split(',')[0].trim();
  const city = deal.location.split(',')[1]?.trim() || deal.division.split('(')[0].trim();
  
  return {
    id: deal.id,
    title: deal.title,
    location: deal.location,
    merchant: merchant,
    city: city,
    division: deal.division,
    category: deal.category,
    subcategory: deal.subcategory || null,
    campaign_stage: deal.campaignStage || 'draft',
    status: deal.status,
    won_sub_stage: deal.wonSubStage || null,
    draft_sub_stage: deal.draftSubStage || null,
    lost_sub_stage: deal.lostSubStage || null,
    revenue: deal.stats?.revenue || 0,
    purchases: deal.stats?.purchases || 0,
    views: deal.stats?.views || 0,
    conversion_rate: deal.stats?.conversionRate || 0,
    margin: 0, // Not in mock data
    deal_start: convertDateToISO(deal.dealStart),
    deal_end: convertDateToISO(deal.dealEnd),
    quality: deal.quality,
    image_url: deal.content?.media?.find(m => m.isFeatured)?.url || deal.content?.media?.[0]?.url || null,
  };
}

async function seedDeals() {
  console.log('🌱 Starting Supabase seed...\n');
  
  // Combine all mock deals
  const allMockDeals = [...mockDeals, ...generatedMockDeals] as MockDeal[];
  console.log(`📊 Found ${allMockDeals.length} mock deals to migrate\n`);
  
  // Convert to Supabase format
  const supabaseDeals = allMockDeals.map(convertMockDealToSupabase);
  
  // Delete existing data
  console.log('🗑️  Clearing existing deals...');
  const { error: deleteError } = await supabase
    .from('deals')
    .delete()
    .neq('id', ''); // Delete all
  
  if (deleteError) {
    console.error('❌ Error clearing deals:', deleteError);
  } else {
    console.log('✅ Cleared existing deals\n');
  }
  
  // Insert in batches of 100 (Supabase limit)
  const batchSize = 100;
  let inserted = 0;
  let failed = 0;
  
  for (let i = 0; i < supabaseDeals.length; i += batchSize) {
    const batch = supabaseDeals.slice(i, i + batchSize);
    console.log(`📤 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(supabaseDeals.length / batchSize)} (${batch.length} deals)...`);
    
    const { data, error } = await supabase
      .from('deals')
      .insert(batch)
      .select();
    
    if (error) {
      console.error(`❌ Error inserting batch:`, error.message);
      failed += batch.length;
    } else {
      inserted += data?.length || 0;
      console.log(`✅ Inserted ${data?.length} deals`);
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`   Total deals: ${supabaseDeals.length}`);
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All deals migrated successfully!');
  } else {
    console.log('\n⚠️  Some deals failed to migrate. Check errors above.');
  }
  
  // Verify counts
  const { count } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n✅ Verified: ${count} deals in database`);
  
  // Show breakdown by stage
  const { data: stages } = await supabase
    .from('deals')
    .select('campaign_stage');
  
  if (stages) {
    const breakdown = stages.reduce((acc, d) => {
      acc[d.campaign_stage] = (acc[d.campaign_stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📈 Breakdown by stage:');
    Object.entries(breakdown).forEach(([stage, count]) => {
      console.log(`   ${stage}: ${count} deals`);
    });
  }
}

// Run the seed
seedDeals()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

