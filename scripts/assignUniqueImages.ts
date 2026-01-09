/**
 * Assign unique, relevant images to deals using Unsplash API
 * 
 * Usage:
 *   npx ts-node scripts/assignUniqueImages.ts [--dry-run] [--limit 50]
 * 
 * Prerequisites:
 *   - Set UNSPLASH_ACCESS_KEY in environment
 *   - Set SUPABASE_URL and SUPABASE_ANON_KEY in environment
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

// Search keywords mapping by category/subcategory for relevant images
const categoryKeywords: Record<string, string[]> = {
  "Food & Drink": [
    "restaurant food", "gourmet dish", "fine dining", "chef cooking", "food plating",
    "brunch table", "dinner plate", "cocktail bar", "coffee shop", "bakery pastry",
    "sushi japanese", "italian pasta", "steakhouse", "wine dinner", "farm table"
  ],
  "Activities & Entertainment": [
    "entertainment venue", "concert hall", "bowling alley", "escape room", "arcade games",
    "comedy show", "live music", "art gallery", "theater performance", "museum exhibit",
    "karaoke night", "trivia night", "mini golf", "laser tag", "virtual reality"
  ],
  "Health & Beauty": [
    "spa treatment", "massage therapy", "facial skincare", "salon hair", "manicure nails",
    "yoga studio", "meditation wellness", "gym fitness", "personal training", "beauty salon",
    "aromatherapy", "hot stone massage", "facial mask", "body wrap", "wellness retreat"
  ],
  "Travel & Tourism": [
    "hotel room", "resort pool", "city tour", "travel destination", "beach vacation",
    "mountain retreat", "boutique hotel", "travel adventure", "sightseeing", "vacation resort",
    "cruise ship", "historic landmark", "tourist attraction", "scenic view", "luxury suite"
  ],
  "Automotive": [
    "car wash", "auto detailing", "car interior", "auto service", "car care",
    "vehicle maintenance", "tire service", "car polish", "auto repair", "car showroom"
  ],
  "Education": [
    "classroom learning", "art workshop", "cooking class", "dance lesson", "music lesson",
    "pottery class", "photography workshop", "language learning", "craft workshop", "seminar"
  ],
  "Pet Services": [
    "dog grooming", "pet spa", "dog training", "pet boarding", "cat grooming",
    "pet daycare", "veterinary care", "pet salon", "dog walking", "pet photography"
  ]
};

// Subcategory-specific keywords for more relevant images
const subcategoryKeywords: Record<string, string> = {
  "Restaurant": "restaurant dining table",
  "Cafe": "coffee shop interior",
  "Bar": "cocktail bar nightlife",
  "Food Tour": "food tour tasting",
  "Cooking Class": "cooking class kitchen",
  "Tour": "guided tour group",
  "Show": "live performance stage",
  "Adventure": "outdoor adventure activity",
  "Museum": "museum art exhibit",
  "Sports": "sports activity recreation",
  "Spa": "spa relaxation massage",
  "Salon": "hair salon beauty",
  "Massage": "massage therapy wellness",
  "Fitness": "gym workout fitness",
  "Wellness": "wellness meditation yoga",
  "Hotel": "hotel room luxury",
  "Resort": "resort vacation pool",
  "Attractions": "tourist attraction landmark",
  "Cruise": "cruise ship ocean",
  "Tours": "city tour sightseeing",
  "Car Wash": "car wash cleaning",
  "Detailing": "auto detailing polish",
  "Oil Change": "auto service maintenance",
  "Repair": "auto repair garage",
  "Classes": "classroom education",
  "Workshops": "workshop hands-on",
  "Training": "training session",
  "Courses": "learning course",
  "Grooming": "pet grooming salon",
  "Boarding": "pet boarding facility",
  "Vet": "veterinary clinic"
};

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
    username: string;
  };
}

interface Deal {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
}

// Cache to track used images and avoid duplicates
const usedImageIds = new Set<string>();
const imageCache: Map<string, UnsplashImage[]> = new Map();

async function fetchUnsplashImages(query: string, page: number = 1): Promise<UnsplashImage[]> {
  const cacheKey = `${query}-${page}`;
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30&page=${page}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1'
        }
      }
    );
    
    if (!response.ok) {
      if (response.status === 403) {
        console.error('⚠️  Unsplash API rate limit reached. Wait an hour or upgrade your API access.');
      }
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const images = data.results as UnsplashImage[];
    imageCache.set(cacheKey, images);
    
    return images;
  } catch (error) {
    console.error(`Error fetching images for "${query}":`, error);
    return [];
  }
}

async function getUniqueImageForDeal(deal: Deal): Promise<string | null> {
  // Build search query from subcategory first (more specific), then category
  let searchQuery: string;
  
  if (deal.subcategory && subcategoryKeywords[deal.subcategory]) {
    searchQuery = subcategoryKeywords[deal.subcategory];
  } else {
    const keywords = categoryKeywords[deal.category] || categoryKeywords["Food & Drink"];
    // Use a random keyword from the category to get variety
    const index = Math.floor(Math.random() * keywords.length);
    searchQuery = keywords[index];
  }
  
  // Try to find an unused image
  for (let page = 1; page <= 3; page++) {
    const images = await fetchUnsplashImages(searchQuery, page);
    
    for (const image of images) {
      if (!usedImageIds.has(image.id)) {
        usedImageIds.add(image.id);
        // Use 'regular' size (1080px) - good balance of quality and performance
        return `${image.urls.regular}&w=800&q=80`;
      }
    }
    
    // Add delay between pages to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // If we couldn't find a unique image, return a random one from the first page
  const images = await fetchUnsplashImages(searchQuery, 1);
  if (images.length > 0) {
    const randomImage = images[Math.floor(Math.random() * images.length)];
    return `${randomImage.urls.regular}&w=800&q=80`;
  }
  
  return null;
}

async function main() {
  // Validate environment
  if (!UNSPLASH_ACCESS_KEY) {
    console.error('❌ UNSPLASH_ACCESS_KEY is required');
    console.error('   Get your free key at: https://unsplash.com/developers');
    process.exit(1);
  }
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY are required');
    process.exit(1);
  }
  
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(arg => arg.startsWith('--limit'));
  const limit = limitArg ? parseInt(limitArg.split('=')[1] || args[args.indexOf('--limit') + 1]) : undefined;
  
  console.log('🖼️  Unique Image Assignment Script\n');
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  if (limit) console.log(`   Limit: ${limit} deals`);
  console.log('');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Fetch all deals
  console.log('📦 Fetching deals from Supabase...');
  let query = supabase
    .from('deals')
    .select('id, title, category, subcategory')
    .order('created_at', { ascending: true });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data: deals, error } = await query;
  
  if (error) {
    console.error('❌ Error fetching deals:', error);
    process.exit(1);
  }
  
  if (!deals || deals.length === 0) {
    console.log('⚠️  No deals found in database');
    process.exit(0);
  }
  
  console.log(`   Found ${deals.length} deals\n`);
  
  // Process deals in batches
  const batchSize = 10; // Process 10 at a time to respect rate limits
  const results: { id: string; imageUrl: string }[] = [];
  let processed = 0;
  let failed = 0;
  
  console.log('🔄 Assigning unique images...\n');
  
  for (let i = 0; i < deals.length; i += batchSize) {
    const batch = deals.slice(i, i + batchSize);
    
    for (const deal of batch) {
      const imageUrl = await getUniqueImageForDeal(deal);
      
      if (imageUrl) {
        results.push({ id: deal.id, imageUrl });
        processed++;
        process.stdout.write(`   ✓ ${deal.title.substring(0, 50)}...\r`);
      } else {
        failed++;
        console.log(`   ✗ Failed to get image for: ${deal.title}`);
      }
    }
    
    // Progress update every batch
    console.log(`   Progress: ${processed}/${deals.length} (${Math.round(processed/deals.length*100)}%)`);
    
    // Rate limit: wait between batches
    if (i + batchSize < deals.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`\n✅ Image assignment complete`);
  console.log(`   Success: ${processed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Unique images used: ${usedImageIds.size}\n`);
  
  if (dryRun) {
    console.log('🔍 DRY RUN - Sample URLs:');
    results.slice(0, 5).forEach(r => {
      console.log(`   ${r.id}: ${r.imageUrl.substring(0, 80)}...`);
    });
    console.log('\n   Run without --dry-run to apply changes');
    return;
  }
  
  // Update Supabase
  console.log('📤 Updating Supabase...');
  let updated = 0;
  
  for (const result of results) {
    const { error: updateError } = await supabase
      .from('deals')
      .update({ image_url: result.imageUrl })
      .eq('id', result.id);
    
    if (updateError) {
      console.error(`   ✗ Error updating ${result.id}:`, updateError.message);
    } else {
      updated++;
    }
    
    // Show progress every 50 updates
    if (updated % 50 === 0) {
      console.log(`   Updated ${updated}/${results.length}...`);
    }
  }
  
  console.log(`\n🎉 Done! Updated ${updated} deals with unique images`);
}

main().catch(console.error);














