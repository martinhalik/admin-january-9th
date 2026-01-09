-- Enhanced Taxonomy Schema with Hierarchy + Flexibility
-- Allows services to exist in multiple paths while maintaining structure
-- Includes improvement/evolution capabilities

-- ============================================================================
-- REQUIRED EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable trigram fuzzy text search (for semantic search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- CORE TAXONOMY TABLES
-- ============================================================================

-- Main categories (top level: Food & Drink, Beauty/Wellness, etc.)
CREATE TABLE taxonomy_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name for UI
  color TEXT, -- Hex color for UI
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subcategories/Tags (middle level: Alternative Medicine, Spa, etc.)
CREATE TABLE taxonomy_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Services (leaf level: Swedish Massage, Hot Stone Massage, etc.)
CREATE TABLE taxonomy_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  keywords TEXT[], -- For enhanced search
  search_vector TSVECTOR, -- Full-text search
  usage_count INTEGER DEFAULT 0, -- Track popularity
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- HIERARCHICAL RELATIONSHIPS (Many-to-Many for Flexibility)
-- ============================================================================

-- Categories can have multiple subcategories
-- Subcategories can belong to multiple categories
CREATE TABLE taxonomy_category_subcategories (
  category_id UUID REFERENCES taxonomy_categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES taxonomy_subcategories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Mark the "main" category for a subcategory
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (category_id, subcategory_id)
);

-- Subcategories can have multiple services
-- Services can belong to multiple subcategories (this is key!)
CREATE TABLE taxonomy_subcategory_services (
  subcategory_id UUID REFERENCES taxonomy_subcategories(id) ON DELETE CASCADE,
  service_id UUID REFERENCES taxonomy_services(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Mark the "main" subcategory for a service
  relevance_score DECIMAL(3,2) DEFAULT 1.0, -- How relevant (0.0-1.0) for ranking
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (subcategory_id, service_id)
);

-- ============================================================================
-- COMPUTED/MATERIALIZED PATHS FOR FAST QUERIES
-- ============================================================================

-- Materialized view of full paths for efficient display
CREATE MATERIALIZED VIEW taxonomy_full_paths AS
SELECT 
  s.id as service_id,
  s.name as service_name,
  s.slug as service_slug,
  sc.id as subcategory_id,
  sc.name as subcategory_name,
  sc.slug as subcategory_slug,
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  tss.is_primary as is_primary_subcategory,
  tcs.is_primary as is_primary_category,
  tss.relevance_score,
  -- Full path for display: "Food & Drink > Restaurant > Italian"
  c.name || ' > ' || sc.name || ' > ' || s.name as full_path,
  -- Short path for display: "Restaurant > Italian"
  sc.name || ' > ' || s.name as short_path,
  s.usage_count
FROM taxonomy_services s
JOIN taxonomy_subcategory_services tss ON s.id = tss.service_id
JOIN taxonomy_subcategories sc ON tss.subcategory_id = sc.id
JOIN taxonomy_category_subcategories tcs ON sc.id = tcs.subcategory_id
JOIN taxonomy_categories c ON tcs.category_id = c.id
WHERE s.is_active = true 
  AND sc.is_active = true 
  AND c.is_active = true
ORDER BY s.usage_count DESC, c.sort_order, sc.sort_order, s.name;

-- Index for fast refresh
CREATE UNIQUE INDEX idx_taxonomy_full_paths 
ON taxonomy_full_paths (service_id, subcategory_id, category_id);

-- ============================================================================
-- TAXONOMY IMPROVEMENT & EVOLUTION
-- ============================================================================

-- Track suggestions for improving the taxonomy
CREATE TABLE taxonomy_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'new_service',
    'new_subcategory', 
    'new_category',
    'add_relationship',
    'remove_relationship',
    'merge_services',
    'split_service',
    'rename'
  )),
  entity_type TEXT CHECK (entity_type IN ('service', 'subcategory', 'category')),
  entity_id UUID, -- Reference to existing entity if applicable
  suggested_name TEXT,
  suggested_parent_id UUID,
  suggested_relationships JSONB, -- Store complex relationship suggestions
  reason TEXT,
  context JSONB, -- Additional context (deal_id, search_query, etc.)
  suggested_by UUID, -- User who made suggestion
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track search queries that didn't find results (to improve taxonomy)
CREATE TABLE taxonomy_search_misses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_query TEXT NOT NULL,
  search_context JSONB, -- Filters applied, user context, etc.
  user_id UUID,
  deal_id UUID,
  miss_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track actual usage to understand patterns
CREATE TABLE taxonomy_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES taxonomy_services(id) ON DELETE CASCADE,
  deal_id UUID,
  user_id UUID,
  subcategory_id UUID REFERENCES taxonomy_subcategories(id),
  category_id UUID REFERENCES taxonomy_categories(id),
  search_query TEXT, -- What they searched before selecting
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- DEAL INTEGRATION
-- ============================================================================

-- Link deals to services (replace rigid category strings)
CREATE TABLE deal_services (
  deal_id TEXT NOT NULL, -- Your deal ID
  service_id UUID REFERENCES taxonomy_services(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Main service for the deal
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (deal_id, service_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Full-text search on services
CREATE INDEX idx_services_search ON taxonomy_services USING gin(search_vector);
CREATE INDEX idx_services_name_trgm ON taxonomy_services USING gin(name gin_trgm_ops);
CREATE INDEX idx_services_keywords ON taxonomy_services USING gin(keywords);
CREATE INDEX idx_services_usage ON taxonomy_services(usage_count DESC);

-- Fast category/subcategory lookups
CREATE INDEX idx_cat_subcat_category ON taxonomy_category_subcategories(category_id);
CREATE INDEX idx_cat_subcat_subcategory ON taxonomy_category_subcategories(subcategory_id);
CREATE INDEX idx_subcat_services_subcategory ON taxonomy_subcategory_services(subcategory_id);
CREATE INDEX idx_subcat_services_service ON taxonomy_subcategory_services(service_id);
CREATE INDEX idx_subcat_services_primary ON taxonomy_subcategory_services(service_id) WHERE is_primary = true;

-- Deal lookups
CREATE INDEX idx_deal_services_deal ON deal_services(deal_id);
CREATE INDEX idx_deal_services_service ON deal_services(service_id);

-- Suggestion tracking
CREATE INDEX idx_suggestions_status ON taxonomy_suggestions(status);
CREATE INDEX idx_suggestions_type ON taxonomy_suggestions(suggestion_type, entity_type);
CREATE INDEX idx_search_misses_query ON taxonomy_search_misses(search_query);
CREATE INDEX idx_usage_log_service ON taxonomy_usage_log(service_id);
CREATE INDEX idx_usage_log_deal ON taxonomy_usage_log(deal_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update search_vector when service changes
CREATE OR REPLACE FUNCTION update_service_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    to_tsvector('english', 
      NEW.name || ' ' || 
      COALESCE(NEW.description, '') || ' ' ||
      COALESCE(array_to_string(NEW.keywords, ' '), '')
    );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_service_search_vector
BEFORE INSERT OR UPDATE ON taxonomy_services
FOR EACH ROW
EXECUTE FUNCTION update_service_search_vector();

-- Auto-increment usage_count when service is used
CREATE OR REPLACE FUNCTION increment_service_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE taxonomy_services 
  SET usage_count = usage_count + 1 
  WHERE id = NEW.service_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_service_usage
AFTER INSERT ON taxonomy_usage_log
FOR EACH ROW
EXECUTE FUNCTION increment_service_usage();

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_taxonomy_paths()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY taxonomy_full_paths;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Search function with ranking
CREATE OR REPLACE FUNCTION search_services(
  search_query TEXT,
  category_filter UUID DEFAULT NULL,
  subcategory_filter UUID DEFAULT NULL,
  limit_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  service_id UUID,
  service_name TEXT,
  service_slug TEXT,
  category_name TEXT,
  subcategory_name TEXT,
  full_path TEXT,
  relevance REAL,
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    tfp.service_id,
    tfp.service_name,
    tfp.service_slug,
    tfp.category_name,
    tfp.subcategory_name,
    tfp.full_path,
    GREATEST(
      ts_rank(s.search_vector, plainto_tsquery('english', search_query)) * 2,
      similarity(s.name, search_query)
    ) as relevance,
    s.usage_count
  FROM taxonomy_full_paths tfp
  JOIN taxonomy_services s ON tfp.service_id = s.id
  WHERE (
    s.search_vector @@ plainto_tsquery('english', search_query)
    OR s.name ILIKE '%' || search_query || '%'
    OR similarity(s.name, search_query) > 0.3
  )
  AND (category_filter IS NULL OR tfp.category_id = category_filter)
  AND (subcategory_filter IS NULL OR tfp.subcategory_id = subcategory_filter)
  ORDER BY relevance DESC, s.usage_count DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Get all paths for a service (show where it appears in hierarchy)
CREATE OR REPLACE FUNCTION get_service_paths(service_uuid UUID)
RETURNS TABLE (
  category_name TEXT,
  subcategory_name TEXT,
  full_path TEXT,
  is_primary_path BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tfp.category_name,
    tfp.subcategory_name,
    tfp.full_path,
    (tfp.is_primary_category AND tfp.is_primary_subcategory) as is_primary_path
  FROM taxonomy_full_paths tfp
  WHERE tfp.service_id = service_uuid
  ORDER BY is_primary_path DESC, tfp.category_name, tfp.subcategory_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS (Row Level Security) - Optional
-- ============================================================================

-- Enable RLS on suggestion tables to control who can suggest/approve
ALTER TABLE taxonomy_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_search_misses ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_usage_log ENABLE ROW LEVEL SECURITY;

-- Everyone can read taxonomy
ALTER TABLE taxonomy_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read taxonomy" ON taxonomy_categories FOR SELECT USING (true);
CREATE POLICY "Everyone can read taxonomy" ON taxonomy_subcategories FOR SELECT USING (true);
CREATE POLICY "Everyone can read taxonomy" ON taxonomy_services FOR SELECT USING (true);

-- Only authenticated users can suggest improvements
CREATE POLICY "Authenticated users can suggest" ON taxonomy_suggestions 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only admins can approve/reject suggestions
CREATE POLICY "Admins can review suggestions" ON taxonomy_suggestions 
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE taxonomy_categories IS 'Top-level categories (Food & Drink, Beauty/Wellness, etc.)';
COMMENT ON TABLE taxonomy_subcategories IS 'Mid-level groupings (Alternative Medicine, Spa, Restaurant, etc.)';
COMMENT ON TABLE taxonomy_services IS 'Specific services/offerings (Swedish Massage, Italian Restaurant, etc.)';
COMMENT ON TABLE taxonomy_category_subcategories IS 'Many-to-many: Subcategories can appear in multiple categories';
COMMENT ON TABLE taxonomy_subcategory_services IS 'Many-to-many: Services can appear in multiple subcategories (key flexibility!)';
COMMENT ON TABLE taxonomy_suggestions IS 'Track user suggestions for improving the taxonomy structure';
COMMENT ON TABLE taxonomy_search_misses IS 'Track failed searches to identify gaps in taxonomy';
COMMENT ON TABLE taxonomy_usage_log IS 'Track actual usage to understand patterns and improve relevance';
COMMENT ON TABLE deal_services IS 'Link deals to services (replaces rigid category strings)';
COMMENT ON MATERIALIZED VIEW taxonomy_full_paths IS 'Pre-computed full paths for efficient display and search';

