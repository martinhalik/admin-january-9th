# Scripts Directory

Utility scripts for generating and seeding deal data.

## 📁 Files

### `generateDeals.ts`
Generates realistic mock deal data.

**Usage:**
```bash
# Generate 300 deals (default)
npx ts-node scripts/generateDeals.ts

# Generate custom amount
npx ts-node scripts/generateDeals.ts 500

# Output to file
npx ts-node scripts/generateDeals.ts 300 > deals.json
```

**Output:**
- 300+ deals with realistic data
- 60% Live, 25% Draft, 15% Lost
- Varied divisions, categories, and performance

### `seedSupabase.ts`
Seeds Supabase database with generated deals.

**Prerequisites:**
1. Supabase project created
2. Schema deployed (`supabase/schema.sql`)
3. Environment variables set in `.env`:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJxxx...
   ```

**Usage:**
```bash
# Install dependencies first
npm install @supabase/supabase-js

# Seed with 300 deals
npx ts-node scripts/seedSupabase.ts

# Seed with custom amount
npx ts-node scripts/seedSupabase.ts 500

# Clear existing data and reseed
npx ts-node scripts/seedSupabase.ts --clear
```

### `syncSalesforceToSupabase.ts`
Syncs real data from Salesforce to Supabase. This is the recommended way to populate your database with production data.

**Prerequisites:**
1. Salesforce credentials (see `salesforce-config.ts`)
2. Supabase project with schema deployed
3. Environment variables set:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJxxx...
   ```

**Usage:**
```bash
# Install jsforce first
npm install

# Dry run - preview what would be synced
npm run sync:salesforce:dry

# Sync data (incremental update)
npm run sync:salesforce

# Full sync (ignore date filters)
npm run sync:salesforce:full

# Reset and re-sync (delete all SF data first, then sync fresh)
npm run sync:salesforce:reset
```

**Features:**
- **ONE-WAY SYNC**: Salesforce → Supabase only (never writes back to Salesforce)
- Syncs Accounts, Opportunities (Deals), and Users (Employees)
- Filters to US market only
- Syncs last 2 years + all live deals
- Maps Salesforce stages to Supabase deal stages
- Uses upsert for efficient incremental updates
- Maintains referential integrity
- **Reset option**: Delete all Salesforce data and re-fetch fresh (great for staging/test environments)

**Configuration:**
Edit `salesforce-config.ts` to customize:
- Stage mappings (Salesforce → Supabase)
- Role mappings for employees
- Market filters (countries)
- Date range filters

### `salesforce-config.ts`
Configuration file for Salesforce sync. Contains all mapping configurations:
- `STAGE_MAPPING`: Maps Salesforce opportunity stages to Supabase deal stages
- `ROLE_MAPPING`: Maps Salesforce user roles to employee roles
- `syncConfig`: Filters for markets, date range, batch size

### `assignUniqueImages.ts`
Assigns unique, relevant images to deals using Unsplash API. This ensures every deal has a distinct, high-quality image based on its category and subcategory.

**Prerequisites:**
1. Unsplash API access key ([Get free key](https://unsplash.com/developers))
2. Environment variables set:
   ```
   UNSPLASH_ACCESS_KEY=your-unsplash-access-key
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJxxx...
   ```

**Usage:**
```bash
# Dry run - preview without changes
npx ts-node scripts/assignUniqueImages.ts --dry-run

# Update all deals with unique images
npx ts-node scripts/assignUniqueImages.ts

# Update only first 50 deals
npx ts-node scripts/assignUniqueImages.ts --limit 50
```

**Features:**
- Fetches images from Unsplash based on deal category/subcategory
- Ensures no duplicate images across deals
- Respects API rate limits
- Supports dry-run mode for preview

## 🚀 Quick Start

1. **Set up Supabase:**
   - Follow instructions in `SUPABASE_SETUP.md`
   - Create project, run schema, get credentials

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Install dependencies:**
   ```bash
   npm install @supabase/supabase-js
   npm install -D ts-node
   ```

4. **Generate and seed:**
   ```bash
   npx ts-node scripts/seedSupabase.ts
   ```

5. **Verify:**
   - Check Supabase Table Editor
   - Should see 300+ deals
   - Test queries in SQL Editor

## 📊 Data Distribution

Generated deals include:

### Campaign Stages:
- **Live (60%)**: Active deals with performance data
- **Draft (25%)**: In-progress deals, various substages
- **Lost (15%)**: Closed/archived deals

### Divisions:
- New York: 30%
- Chicago: 20%
- Los Angeles: 20%
- San Francisco: 10%
- Other cities: 20%

### Categories:
- Food & Drink: 40%
- Activities & Entertainment: 25%
- Health & Beauty: 15%
- Travel & Tourism: 10%
- Other: 10%

### Performance Ranges:
- Revenue: $500 - $80,000
- Purchases: 20 - 2,000
- Views: 10,000 - 500,000
- Conversion Rate: 0.5% - 5%
- Margin: 15% - 60%

## 🛠️ Customization

### Adjust data distribution:

Edit `generateDeals.ts`:

```typescript
// Change division weights
const divisions = [
  { name: "New York (USA)", weight: 50 }, // Increase NY
  { name: "Chicago (USA)", weight: 10 },  // Decrease Chicago
  // ...
];

// Change category weights
const categories = [
  { name: "Food & Drink", weight: 60 },  // More food deals
  // ...
];

// Adjust stage distribution
if (rand < 0.80) {  // 80% live instead of 60%
  return { stage: "won", subStage: "live", status: "Live" };
}
```

### Add custom fields:

```typescript
const deal: Deal = {
  // ... existing fields
  customField: "your value",
  tags: ["tag1", "tag2"],
};
```

## 🔍 Testing Locally

Generate and preview data without uploading:

```bash
# Generate and view
npx ts-node scripts/generateDeals.ts 50

# Generate and save
npx ts-node scripts/generateDeals.ts 100 > test-deals.json

# View in browser
python -m json.tool test-deals.json
```

## 📝 Notes

- TypeScript execution requires `ts-node` 
- Supabase client needs environment variables
- Batch inserts in groups of 100 to avoid timeouts
- Database schema must exist before seeding

## 🆘 Troubleshooting

**"Cannot find module '@supabase/supabase-js'"**
```bash
npm install @supabase/supabase-js
```

**"Cannot find module 'ts-node'"**
```bash
npm install -D ts-node @types/node
```

**"SUPABASE_URL is not defined"**
- Create `.env` file in project root
- Add your Supabase credentials
- Restart terminal/IDE

**"Error inserting batch"**
- Check schema is deployed
- Verify table exists in Supabase
- Check data types match schema

## 💡 Tips

- Start with 100 deals to test
- Verify in Supabase dashboard before frontend
- Use `--clear` flag to reset data
- Generate more data as needed (can handle 10,000+)








