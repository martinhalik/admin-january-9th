# Supabase Setup Instructions

## Step 1: Run the Migration

Run this SQL in your Supabase SQL Editor to add the `content` column:

```sql
-- Add content JSONB column to store full deal content including media array
ALTER TABLE deals ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb;

-- Create index for content queries
CREATE INDEX IF NOT EXISTS idx_deals_content ON deals USING gin(content);

-- Add comment explaining the structure
COMMENT ON COLUMN deals.content IS 'Stores deal content including media array, description, highlights, and fine points. Structure: {media: [{id, url, isFeatured, type}], description: string, highlights: array, finePoints: array}';
```

Or run the migration file:
```bash
psql $DATABASE_URL < supabase/migrations/add_content_column.sql
```

## Step 2: Re-seed the Database

Run the reseed script to populate Supabase with data from generatedMockDeals:

```bash
cd scripts
npx tsx reseedSupabaseFromGenerated.ts
```

This will:
- Delete all existing deals in Supabase
- Insert all deals from `generatedMockDeals` with consistent IDs
- Store the full `content.media` array in the new `content` column

## Step 3: Verify

After reseeding, verify in your Supabase dashboard that:
1. The `content` column exists
2. Deals have the `content.media` array populated
3. Deal IDs match those in `generatedMockDeals`

## How It Works

### Data Flow
1. **Deals Table**: Loads from Supabase (with fallback to mock data)
2. **Deal Detail**: Loads from Supabase if ID exists, otherwise from generatedMockDeals
3. **Saves**: Updates both localStorage AND Supabase when content changes

### Content Storage
- Supabase stores the full `content` object as JSONB
- Includes `media` array with all images (not just one `image_url`)
- Preserves AI-generated descriptions, highlights, and fine points

### Sync Behavior
- Reads prioritize Supabase (latest data)
- Writes go to both localStorage (fast) and Supabase (persistent)
- If Supabase sync fails, localStorage still succeeds (best-effort sync)




