-- Add content JSONB column to store full deal content including media array
ALTER TABLE deals ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb;

-- Create index for content queries
CREATE INDEX IF NOT EXISTS idx_deals_content ON deals USING gin(content);

-- Add comment explaining the structure
COMMENT ON COLUMN deals.content IS 'Stores deal content including media array, description, highlights, and fine points. Structure: {media: [{id, url, isFeatured, type}], description: string, highlights: array, finePoints: array}';




