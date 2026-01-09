-- Migration: Add draft_data column to workflow_schemas
-- This column stores auto-saved draft changes before publishing

ALTER TABLE workflow_schemas 
ADD COLUMN IF NOT EXISTS draft_data JSONB;

-- Add comment explaining the column
COMMENT ON COLUMN workflow_schemas.draft_data IS 'Auto-saved draft changes (phases, stages, tasks) before publishing to production';














