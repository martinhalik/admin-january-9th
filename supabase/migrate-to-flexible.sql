-- Migration Script: Convert Old 3-Level Schema to Flexible Hierarchy
-- This preserves existing data and converts it to the new structure

-- ============================================================================
-- STEP 1: Backup existing data (optional but recommended)
-- ============================================================================

-- You can skip this if you're okay losing the old data
-- CREATE TABLE taxonomy_categories_backup AS SELECT * FROM taxonomy_categories;
-- CREATE TABLE taxonomy_subcategories_backup AS SELECT * FROM taxonomy_subcategories;
-- CREATE TABLE taxonomy_services_backup AS SELECT * FROM taxonomy_services;

-- ============================================================================
-- STEP 2: Drop old schema (if it exists)
-- ============================================================================

-- Drop materialized view first
DROP MATERIALIZED VIEW IF EXISTS taxonomy_full_paths CASCADE;

-- Drop relationship tables
DROP TABLE IF EXISTS taxonomy_subcategory_services CASCADE;
DROP TABLE IF EXISTS taxonomy_category_subcategories CASCADE;

-- Drop tracking tables (we'll recreate them)
DROP TABLE IF EXISTS taxonomy_suggestions CASCADE;
DROP TABLE IF EXISTS taxonomy_search_misses CASCADE;
DROP TABLE IF EXISTS taxonomy_usage_log CASCADE;

-- Drop main tables
DROP TABLE IF EXISTS taxonomy_services CASCADE;
DROP TABLE IF EXISTS taxonomy_subcategories CASCADE;
DROP TABLE IF EXISTS taxonomy_categories CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS search_services CASCADE;
DROP FUNCTION IF EXISTS refresh_taxonomy_paths CASCADE;

-- ============================================================================
-- STEP 3: Confirm - Ready for new schema
-- ============================================================================

-- Now you're ready to apply the new flexible schema
-- Run: supabase/taxonomy-flexible-schema.sql

















