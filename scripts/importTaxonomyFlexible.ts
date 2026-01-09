/**
 * Import Taxonomy with Flexible Hierarchy
 * 
 * Parses the CSV and creates full 6-level hierarchy:
 * 1. Category (from CSV column)
 * 2. Subcategory (from CSV column)
 * 3-6. Service hierarchy (parsed from Service Name with " - " separator)
 * 
 * Example:
 * Service Name: "Health & Beauty - Sexual Wellness - Prostate - Beads"
 * Subcategory: "Brand"
 * Category: "Goods"
 * 
 * Creates:
 * Goods (L0)
 *   └─ Brand (L1)
 *       └─ Health & Beauty (L2)
 *           └─ Sexual Wellness (L3)
 *               └─ Prostate (L4)
 *                   └─ Beads (L5)
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csv from 'csv-parser';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface CSVRow {
  'Service Name': string;
  'Subcategory (v3)': string;
  'Category (v3)': string;
}

interface TreeNode {
  name: string;
  slug: string;
  fullName: string;
  level: number;
  parentSlug: string | null;
  keywords: string[];
  nodeType: string;
}

// Helper to generate slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to extract keywords
function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();
  const words = text
    .toLowerCase()
    .split(/[\s-/()]+/)
    .filter(word => word.length > 2 && !['and', 'the', 'for', 'with'].includes(word));
  
  words.forEach(word => keywords.add(word));
  return Array.from(keywords);
}

// Parse service name into hierarchy
function parseServiceHierarchy(serviceName: string): string[] {
  // Split by " - " to get hierarchy levels
  return serviceName
    .split(' - ')
    .map(part => part.trim())
    .filter(part => part.length > 0);
}

async function main() {
  const csvPath = process.argv[2] || path.join(
    process.env.HOME || '',
    'Downloads',
    'Full Merchant Taxonomy - Snapshot Oct 2025 - Q2 2025 Taxonomy.csv'
  );

  console.log('🚀 Starting flexible taxonomy import...');
  console.log('📁 Reading from:', csvPath);

  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found:', csvPath);
    process.exit(1);
  }

  // Store all unique nodes
  const nodes = new Map<string, TreeNode>();

  // Read CSV
  const rows: CSVRow[] = [];
  
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row: CSVRow) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Parsed ${rows.length} rows from CSV\n`);

  // Process each row and build hierarchy
  for (const row of rows) {
    const category = row['Category (v3)']?.trim();
    const subcategory = row['Subcategory (v3)']?.trim();
    const serviceName = row['Service Name']?.trim();

    if (!category || !subcategory || !serviceName) continue;

    // Build full hierarchy path
    const hierarchy: Array<{ name: string; type: string }> = [
      { name: category, type: 'category' },
      { name: subcategory, type: 'subcategory' },
    ];

    // Parse service name into levels
    const serviceLevels = parseServiceHierarchy(serviceName);
    serviceLevels.forEach(level => {
      hierarchy.push({ name: level, type: 'service' });
    });

    // Create nodes for each level
    let parentSlug: string | null = null;
    let fullNameParts: string[] = [];

    hierarchy.forEach((item, index) => {
      const slug = generateSlug(item.name);
      fullNameParts.push(item.name);
      const fullName = fullNameParts.join(' - ');
      
      // Create unique key: parent_slug + slug (to handle same name under different parents)
      const nodeKey = parentSlug ? `${parentSlug}/${slug}` : slug;

      if (!nodes.has(nodeKey)) {
        nodes.set(nodeKey, {
          name: item.name,
          slug,
          fullName,
          level: index,
          parentSlug,
          keywords: extractKeywords(item.name),
          nodeType: item.type,
        });
      }

      parentSlug = slug;
    });
  }

  console.log(`📈 Statistics:`);
  console.log(`   Total unique nodes: ${nodes.size}`);
  console.log(`   Level 0 (Categories): ${Array.from(nodes.values()).filter(n => n.level === 0).length}`);
  console.log(`   Level 1 (Subcategories): ${Array.from(nodes.values()).filter(n => n.level === 1).length}`);
  console.log(`   Level 2: ${Array.from(nodes.values()).filter(n => n.level === 2).length}`);
  console.log(`   Level 3: ${Array.from(nodes.values()).filter(n => n.level === 3).length}`);
  console.log(`   Level 4: ${Array.from(nodes.values()).filter(n => n.level === 4).length}`);
  console.log(`   Level 5: ${Array.from(nodes.values()).filter(n => n.level === 5).length}`);
  console.log(`   Max depth: ${Math.max(...Array.from(nodes.values()).map(n => n.level))}`);

  console.log('\n💾 Inserting nodes into Supabase...\n');

  // Sort nodes by level (insert parents before children)
  const sortedNodes = Array.from(nodes.values()).sort((a, b) => a.level - b.level);

  // Track inserted node IDs by their slug (for parent references)
  const nodeIdMap = new Map<string, string>();

  // Insert nodes level by level
  let insertedCount = 0;
  const batchSize = 500;

  for (let level = 0; level <= 5; level++) {
    const nodesAtLevel = sortedNodes.filter(n => n.level === level);
    if (nodesAtLevel.length === 0) continue;

    console.log(`${level}️⃣  Inserting ${nodesAtLevel.length} nodes at level ${level}...`);

    for (let i = 0; i < nodesAtLevel.length; i += batchSize) {
      const batch = nodesAtLevel.slice(i, i + batchSize);
      
      const records = batch.map(node => ({
        name: node.name,
        slug: node.slug,
        full_name: node.fullName,
        parent_id: node.parentSlug ? nodeIdMap.get(node.parentSlug) || null : null,
        keywords: node.keywords,
        node_type: node.nodeType,
        is_active: true,
        sort_order: 0,
      }));

      const { data, error } = await supabase
        .from('taxonomy_nodes')
        .insert(records)
        .select('id, slug');

      if (error) {
        console.error(`❌ Error inserting batch at level ${level}:`, error);
        throw error;
      }

      // Store node IDs for parent references
      data?.forEach((record, idx) => {
        const node = batch[idx];
        nodeIdMap.set(node.slug, record.id);
      });

      insertedCount += batch.length;
      if (nodesAtLevel.length > batchSize) {
        console.log(`   Progress: ${Math.min(i + batchSize, nodesAtLevel.length)}/${nodesAtLevel.length}`);
      }
    }

    console.log(`✅ Inserted ${nodesAtLevel.length} nodes at level ${level}`);
  }

  // Refresh materialized view
  console.log(`\n6️⃣  Refreshing search view...`);
  const { error: refreshError } = await supabase.rpc('refresh_taxonomy_search');
  if (refreshError) {
    console.error('⚠️  Warning: Could not refresh search view:', refreshError.message);
    console.log('   You may need to run this manually: SELECT refresh_taxonomy_search();');
  } else {
    console.log(`✅ Search view refreshed`);
  }

  console.log(`\n✨ Import complete!`);
  console.log(`\n📊 Final Statistics:`);
  console.log(`   Total nodes inserted: ${insertedCount}`);
  console.log(`   Hierarchy depth: ${Math.max(...Array.from(nodes.values()).map(n => n.level)) + 1} levels`);
  
  // Show some examples
  console.log(`\n📖 Example hierarchies:`);
  const examples = sortedNodes
    .filter(n => n.level >= 4)
    .slice(0, 5);
  
  examples.forEach(ex => {
    console.log(`   ${ex.fullName} (Level ${ex.level})`);
  });
}

main().catch(console.error);
















