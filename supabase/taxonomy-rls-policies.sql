-- Row Level Security Policies for Taxonomy Tables
-- These policies allow public read access and authenticated write access

-- ============================================================================
-- DISABLE RLS (Simplest approach for admin panel)
-- ============================================================================
-- For an admin panel, we can disable RLS entirely
-- If you need user-level security later, replace this with proper policies

ALTER TABLE taxonomy_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_category_subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_subcategory_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_usage_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_search_misses DISABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_suggestions DISABLE ROW LEVEL SECURITY;

-- If the materialized view has RLS (unlikely but just in case)
-- Materialized views don't have RLS, but the underlying tables do

-- ============================================================================
-- ALTERNATIVE: Enable RLS with permissive policies (if you prefer)
-- ============================================================================
-- Uncomment the following if you want RLS enabled with public read access:

/*
-- Enable RLS
ALTER TABLE taxonomy_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_category_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_subcategory_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_search_misses ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all taxonomy tables
CREATE POLICY "Allow public read access" ON taxonomy_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON taxonomy_subcategories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON taxonomy_services FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON taxonomy_category_subcategories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON taxonomy_subcategory_services FOR SELECT USING (true);

-- Allow public write access for admin operations (you may want to restrict this)
CREATE POLICY "Allow public insert" ON taxonomy_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON taxonomy_categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON taxonomy_categories FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON taxonomy_subcategories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON taxonomy_subcategories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON taxonomy_subcategories FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON taxonomy_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON taxonomy_services FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON taxonomy_services FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON taxonomy_category_subcategories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON taxonomy_category_subcategories FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON taxonomy_subcategory_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON taxonomy_subcategory_services FOR DELETE USING (true);

-- Usage tracking - allow public insert
CREATE POLICY "Allow public insert" ON taxonomy_usage_log FOR INSERT WITH CHECK (true);

-- Search misses - allow public insert
CREATE POLICY "Allow public insert" ON taxonomy_search_misses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON taxonomy_search_misses FOR UPDATE USING (true);

-- Suggestions - allow all operations
CREATE POLICY "Allow public operations" ON taxonomy_suggestions FOR ALL USING (true);
*/
















