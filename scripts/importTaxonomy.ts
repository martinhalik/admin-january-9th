/**
 * Import Taxonomy from CSV
 * 
 * This script imports the Groupon taxonomy CSV into our flexible hierarchy.
 * It handles:
 * - Many-to-many relationships (services can belong to multiple categories)
 * - Smart slug generation
 * - Keyword extraction for search
 * - Duplicate detection across different contexts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csv from 'csv-parser';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Types
interface TaxonomyRow {
  serviceName: string;
  subcategory: string;
  category: string;
}

interface Category {
  name: string;
  slug: string;
  description?: string;
}

interface Subcategory {
  name: string;
  slug: string;
  description?: string;
}

interface Service {
  name: string;
  slug: string;
  keywords: string[];
}

// Helper functions
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

function extractKeywords(serviceName: string, subcategory: string): string[] {
  const keywords = new Set<string>();
  
  // Split service name into words
  const serviceWords = serviceName
    .toLowerCase()
    .split(/[\s-/()]+/)
    .filter(word => word.length > 2); // Ignore very short words
  
  serviceWords.forEach(word => keywords.add(word));
  
  // Add subcategory words
  const subcatWords = subcategory
    .toLowerCase()
    .split(/[\s-/()]+/)
    .filter(word => word.length > 2);
  
  subcatWords.forEach(word => keywords.add(word));
  
  // Add common variations
  if (serviceName.toLowerCase().includes('massage')) {
    keywords.add('massage');
    keywords.add('therapy');
  }
  if (serviceName.toLowerCase().includes('facial')) {
    keywords.add('facial');
    keywords.add('skin');
    keywords.add('skincare');
  }
  
  return Array.from(keywords);
}

function normalizeCategory(category: string): string {
  // Clean up category names
  return category.trim().replace(/\s+/g, ' ');
}

async function main() {
  const csvPath = process.argv[2] || path.join(
    process.env.HOME || '',
    'Downloads',
    'Full Merchant Taxonomy - Snapshot Oct 2025 - Q2 2025 Taxonomy.csv'
  );

  console.log('🚀 Starting taxonomy import...');
  console.log('📁 Reading from:', csvPath);

  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found:', csvPath);
    process.exit(1);
  }

  // Data structures to collect unique entities and relationships
  const categories = new Map<string, Category>();
  const subcategories = new Map<string, Subcategory>();
  const services = new Map<string, Service>();
  
  // Track relationships
  const categorySubcategoryLinks = new Map<string, Set<string>>(); // cat_slug -> Set<subcat_slug>
  const subcategoryServiceLinks = new Map<string, Set<string>>(); // subcat_slug -> Set<service_slug>
  const serviceSubcategoryLinks = new Map<string, Set<string>>(); // service_slug -> Set<subcat_slug>
  
  // Track which is the "primary" (first seen) relationship
  const primarySubcategoryForService = new Map<string, string>();

  // Parse CSV
  const rows: TaxonomyRow[] = [];
  
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv({
        headers: ['serviceName', 'subcategory', 'category'],
        skipLines: 0,
      }))
      .on('data', (row: TaxonomyRow) => {
        // Skip header row
        if (row.serviceName === 'Service Name') return;
        
        // Skip empty rows
        if (!row.serviceName || !row.subcategory || !row.category) return;
        
        rows.push({
          serviceName: row.serviceName.trim(),
          subcategory: row.subcategory.trim(),
          category: normalizeCategory(row.category),
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Parsed ${rows.length} rows from CSV`);

  // Process rows and build data structures
  for (const row of rows) {
    const catSlug = generateSlug(row.category);
    const subcatSlug = generateSlug(row.subcategory);
    const serviceSlug = generateSlug(row.serviceName);

    // Collect unique categories
    if (!categories.has(catSlug)) {
      categories.set(catSlug, {
        name: row.category,
        slug: catSlug,
      });
    }

    // Collect unique subcategories
    if (!subcategories.has(subcatSlug)) {
      subcategories.set(subcatSlug, {
        name: row.subcategory,
        slug: subcatSlug,
      });
    }

    // Collect unique services
    if (!services.has(serviceSlug)) {
      services.set(serviceSlug, {
        name: row.serviceName,
        slug: serviceSlug,
        keywords: extractKeywords(row.serviceName, row.subcategory),
      });
      // First time we see this service, mark this subcategory as primary
      primarySubcategoryForService.set(serviceSlug, subcatSlug);
    }

    // Track category-subcategory relationships
    if (!categorySubcategoryLinks.has(catSlug)) {
      categorySubcategoryLinks.set(catSlug, new Set());
    }
    categorySubcategoryLinks.get(catSlug)!.add(subcatSlug);

    // Track subcategory-service relationships (many-to-many!)
    if (!subcategoryServiceLinks.has(subcatSlug)) {
      subcategoryServiceLinks.set(subcatSlug, new Set());
    }
    subcategoryServiceLinks.get(subcatSlug)!.add(serviceSlug);

    // Track reverse: service-subcategory relationships
    if (!serviceSubcategoryLinks.has(serviceSlug)) {
      serviceSubcategoryLinks.set(serviceSlug, new Set());
    }
    serviceSubcategoryLinks.get(serviceSlug)!.add(subcatSlug);
  }

  console.log(`\n📈 Statistics:`);
  console.log(`   Categories: ${categories.size}`);
  console.log(`   Subcategories: ${subcategories.size}`);
  console.log(`   Services: ${services.size}`);
  
  // Count services with multiple contexts
  const multiContextServices = Array.from(serviceSubcategoryLinks.entries())
    .filter(([_, subcats]) => subcats.size > 1);
  console.log(`   Services in multiple contexts: ${multiContextServices.length}`);
  
  if (multiContextServices.length > 0) {
    console.log(`\n🔍 Examples of multi-context services:`);
    multiContextServices.slice(0, 10).forEach(([serviceSlug, subcats]) => {
      const service = services.get(serviceSlug)!;
      const subcatNames = Array.from(subcats)
        .map(slug => subcategories.get(slug)?.name)
        .join(', ');
      console.log(`   "${service.name}" → ${subcatNames}`);
    });
  }

  // Confirm before import
  console.log(`\n⚠️  This will insert data into Supabase. Continue? (Ctrl+C to cancel)`);
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log(`\n💾 Inserting data into Supabase...`);

  // Insert categories
  console.log(`\n1️⃣  Inserting ${categories.size} categories...`);
  const categoryData = Array.from(categories.values()).map((cat, idx) => ({
    name: cat.name,
    slug: cat.slug,
    sort_order: idx,
  }));
  
  const { data: insertedCategories, error: catError } = await supabase
    .from('taxonomy_categories')
    .upsert(categoryData, { onConflict: 'slug' })
    .select();
  
  if (catError) {
    console.error('❌ Error inserting categories:', catError);
    throw catError;
  }
  console.log(`✅ Inserted ${insertedCategories?.length} categories`);

  // Insert subcategories
  console.log(`\n2️⃣  Inserting ${subcategories.size} subcategories...`);
  const subcategoryData = Array.from(subcategories.values()).map((subcat, idx) => ({
    name: subcat.name,
    slug: subcat.slug,
    sort_order: idx,
  }));
  
  const { data: insertedSubcategories, error: subcatError } = await supabase
    .from('taxonomy_subcategories')
    .upsert(subcategoryData, { onConflict: 'slug' })
    .select();
  
  if (subcatError) {
    console.error('❌ Error inserting subcategories:', subcatError);
    throw subcatError;
  }
  console.log(`✅ Inserted ${insertedSubcategories?.length} subcategories`);

  // Insert services
  console.log(`\n3️⃣  Inserting ${services.size} services...`);
  const serviceData = Array.from(services.values()).map(service => ({
    name: service.name,
    slug: service.slug,
    keywords: service.keywords,
  }));
  
  // Insert in batches to avoid timeout
  const batchSize = 1000;
  let insertedServicesCount = 0;
  
  for (let i = 0; i < serviceData.length; i += batchSize) {
    const batch = serviceData.slice(i, i + batchSize);
    const { data: batchInserted, error: serviceError } = await supabase
      .from('taxonomy_services')
      .upsert(batch, { onConflict: 'slug' })
      .select();
    
    if (serviceError) {
      console.error(`❌ Error inserting services batch ${i}-${i + batchSize}:`, serviceError);
      throw serviceError;
    }
    insertedServicesCount += batchInserted?.length || 0;
    console.log(`   Progress: ${insertedServicesCount}/${services.size}`);
  }
  console.log(`✅ Inserted ${insertedServicesCount} services`);

  // Create lookup maps for IDs
  const categoryIdMap = new Map(
    insertedCategories?.map(c => [c.slug, c.id]) || []
  );
  const subcategoryIdMap = new Map(
    insertedSubcategories?.map(s => [s.slug, s.id]) || []
  );
  
  // Get service IDs
  const { data: allServices } = await supabase
    .from('taxonomy_services')
    .select('id, slug');
  const serviceIdMap = new Map(
    allServices?.map(s => [s.slug, s.id]) || []
  );

  // Insert category-subcategory relationships
  console.log(`\n4️⃣  Creating category-subcategory relationships...`);
  const catSubcatRelationships = [];
  for (const [catSlug, subcatSlugs] of categorySubcategoryLinks.entries()) {
    const categoryId = categoryIdMap.get(catSlug);
    if (!categoryId) continue;
    
    for (const subcatSlug of subcatSlugs) {
      const subcategoryId = subcategoryIdMap.get(subcatSlug);
      if (!subcategoryId) continue;
      
      catSubcatRelationships.push({
        category_id: categoryId,
        subcategory_id: subcategoryId,
        is_primary: true, // For now, mark all as primary
      });
    }
  }
  
  const { error: catSubcatError } = await supabase
    .from('taxonomy_category_subcategories')
    .upsert(catSubcatRelationships, { 
      onConflict: 'category_id,subcategory_id',
      ignoreDuplicates: true 
    });
  
  if (catSubcatError) {
    console.error('❌ Error creating category-subcategory relationships:', catSubcatError);
    throw catSubcatError;
  }
  console.log(`✅ Created ${catSubcatRelationships.length} category-subcategory links`);

  // Insert subcategory-service relationships (many-to-many - this is key!)
  console.log(`\n5️⃣  Creating subcategory-service relationships...`);
  const subcatServiceRelationships = [];
  
  for (const [subcatSlug, serviceSlugs] of subcategoryServiceLinks.entries()) {
    const subcategoryId = subcategoryIdMap.get(subcatSlug);
    if (!subcategoryId) continue;
    
    for (const serviceSlug of serviceSlugs) {
      const serviceId = serviceIdMap.get(serviceSlug);
      if (!serviceId) continue;
      
      // Check if this is the primary subcategory for this service
      const isPrimary = primarySubcategoryForService.get(serviceSlug) === subcatSlug;
      
      subcatServiceRelationships.push({
        subcategory_id: subcategoryId,
        service_id: serviceId,
        is_primary: isPrimary,
        relevance_score: isPrimary ? 1.0 : 0.8, // Primary = 1.0, secondary = 0.8
      });
    }
  }
  
  // Insert in batches
  const relationshipBatchSize = 5000;
  let insertedRelationshipsCount = 0;
  
  for (let i = 0; i < subcatServiceRelationships.length; i += relationshipBatchSize) {
    const batch = subcatServiceRelationships.slice(i, i + relationshipBatchSize);
    const { error: subcatServiceError } = await supabase
      .from('taxonomy_subcategory_services')
      .upsert(batch, { 
        onConflict: 'subcategory_id,service_id',
        ignoreDuplicates: true 
      });
    
    if (subcatServiceError) {
      console.error(`❌ Error creating subcategory-service relationships batch ${i}-${i + relationshipBatchSize}:`, subcatServiceError);
      throw subcatServiceError;
    }
    insertedRelationshipsCount += batch.length;
    console.log(`   Progress: ${insertedRelationshipsCount}/${subcatServiceRelationships.length}`);
  }
  console.log(`✅ Created ${insertedRelationshipsCount} subcategory-service links`);

  // Refresh materialized view
  console.log(`\n6️⃣  Refreshing materialized view...`);
  const { error: refreshError } = await supabase.rpc('refresh_taxonomy_paths');
  if (refreshError) {
    console.error('❌ Error refreshing materialized view:', refreshError);
    // Don't throw - this is not critical
  } else {
    console.log(`✅ Materialized view refreshed`);
  }

  console.log(`\n✨ Import complete!`);
  console.log(`\n📊 Final Statistics:`);
  console.log(`   Categories: ${categories.size}`);
  console.log(`   Subcategories: ${subcategories.size}`);
  console.log(`   Services: ${services.size}`);
  console.log(`   Services with multiple contexts: ${multiContextServices.length}`);
  console.log(`   Total relationships: ${subcatServiceRelationships.length}`);
}

main().catch(console.error);
















