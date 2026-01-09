/**
 * Re-seed Supabase with data from generatedMockDeals
 * This ensures Supabase has consistent IDs and data with the frontend mocks
 */

import { createClient } from '@supabase/supabase-js';
import { generatedMockDeals } from '../frontend/src/data/generatedMockDeals';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FrontendDeal {
  id: string;
  title: string;
  location: string;
  category: string;
  subcategory?: string;
  division: string;
  dealStart: string;
  dealEnd: string;
  quality: string;
  status: string;
  campaignStage?: 'draft' | 'won' | 'lost';
  wonSubStage?: string;
  draftSubStage?: string;
  lostSubStage?: string;
  stats?: {
    revenue: number;
    purchases: number;
    views: number;
    conversionRate: number;
  };
  content?: {
    media?: Array<{
      id: string;
      url: string;
      isFeatured?: boolean;
      type: string;
    }>;
    description?: string;
    highlights?: any[];
    finePoints?: any[];
  };
}

function convertToSupabaseDeal(deal: FrontendDeal) {
  // Extract city from location (e.g., "Chicago, IL" -> "Chicago")
  const city = deal.location.split(',')[0].trim();
  
  // Extract merchant name from location or use a default
  const merchant = deal.location.split('-')[0]?.trim() || 'Merchant';
  
  // Get the first/featured image URL for backward compatibility
  const imageUrl = deal.content?.media?.find(m => m.isFeatured)?.url || 
                   deal.content?.media?.[0]?.url || 
                   '';
  
  // Convert date from "2. 9. 2026" to "2026-09-02" (ISO format)
  const convertDate = (dateStr: string): string => {
    try {
      // Handle format: "2. 9. 2026" or "02. 09. 2026"
      const parts = dateStr.split('.').map(p => p.trim());
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      return dateStr; // Return as-is if format doesn't match
    } catch (e) {
      console.error(`Error converting date: ${dateStr}`, e);
      return dateStr;
    }
  };
  
  return {
    id: deal.id,
    title: deal.title,
    location: deal.location,
    merchant: merchant,
    city: city,
    division: deal.division,
    category: deal.category,
    subcategory: deal.subcategory || '',
    campaign_stage: deal.campaignStage || 'won',
    status: deal.status,
    won_sub_stage: deal.wonSubStage || null,
    draft_sub_stage: deal.draftSubStage || null,
    lost_sub_stage: deal.lostSubStage || null,
    revenue: deal.stats?.revenue || 0,
    purchases: deal.stats?.purchases || 0,
    views: deal.stats?.views || 0,
    conversion_rate: deal.stats?.conversionRate || 0,
    margin: 50, // Default margin
    deal_start: convertDate(deal.dealStart),
    deal_end: convertDate(deal.dealEnd),
    quality: deal.quality,
    image_url: imageUrl,
    content: deal.content || {}, // Store full content including media array
  };
}

async function reseedDatabase() {
  console.log('🔄 Re-seeding Supabase from generatedMockDeals...');
  console.log(`📊 Total deals to seed: ${generatedMockDeals.length}`);
  
  try {
    // Delete existing deals
    console.log('🗑️  Deleting existing deals...');
    const { error: deleteError } = await supabase
      .from('deals')
      .delete()
      .neq('id', ''); // Delete all records
    
    if (deleteError) {
      console.error('Error deleting existing deals:', deleteError);
      throw deleteError;
    }
    
    console.log('✅ Existing deals deleted');
    
    // Insert new deals in batches
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < generatedMockDeals.length; i += batchSize) {
      const batch = generatedMockDeals.slice(i, i + batchSize);
      const supabaseDeals = batch.map(convertToSupabaseDeal);
      
      const { error: insertError, data } = await supabase
        .from('deals')
        .insert(supabaseDeals);
      
      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        throw insertError;
      }
      
      inserted += batch.length;
      console.log(`✅ Inserted ${inserted}/${generatedMockDeals.length} deals`);
    }
    
    console.log('🎉 Database re-seeded successfully!');
    console.log(`📈 Total deals inserted: ${inserted}`);
    
    // Verify the data
    const { count, error: countError } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`✅ Verification: ${count} deals in database`);
    }
    
  } catch (error) {
    console.error('❌ Error re-seeding database:', error);
    process.exit(1);
  }
}

reseedDatabase();

