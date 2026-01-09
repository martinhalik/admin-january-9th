-- Flexible Taxonomy Schema - Supports Any Hierarchy Depth
-- Replaces the rigid 3-level system with a self-referential tree

-- ============================================================================
-- REQUIRED EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "ltree"; -- For hierarchical queries

-- ============================================================================
-- FLEXIBLE HIERARCHY TABLE
-- ============================================================================

-- Single table for all taxonomy nodes (categories, subcategories, services, etc.)
CREATE TABLE taxonomy_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Hierarchy
  parent_id UUID REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,
  path LTREE, -- Materialized path for fast queries (e.g., 'goods.brand.health_beauty')
  level INTEGER NOT NULL DEFAULT 0, -- 0 = root category, 1 = subcategory, etc.
  
  -- Node data
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  full_name TEXT, -- Full hierarchical name (e.g., "Health & Beauty - Sexual Wellness - Prostate")
  description TEXT,
  keywords TEXT[], -- For search
  
  -- Node type (optional - for UI display)
  node_type TEXT DEFAULT 'node', -- 'category', 'subcategory', 'service', etc.
  
  -- UI metadata
  icon TEXT,
  color TEXT,
  
  -- Ordering and status
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  
  -- Search optimization
  search_vector TSVECTOR,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(parent_id, slug), -- Slugs must be unique within same parent
  CHECK (level >= 0 AND level <= 10) -- Max 10 levels deep
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Path-based queries (find all descendants)
CREATE INDEX idx_taxonomy_nodes_path ON taxonomy_nodes USING GIST (path);
CREATE INDEX idx_taxonomy_nodes_parent ON taxonomy_nodes(parent_id);

-- Level-based queries (find all nodes at level X)
CREATE INDEX idx_taxonomy_nodes_level ON taxonomy_nodes(level);

-- Search
CREATE INDEX idx_taxonomy_nodes_search ON taxonomy_nodes USING GIN (search_vector);
CREATE INDEX idx_taxonomy_nodes_name_trgm ON taxonomy_nodes USING GIN (name gin_trgm_ops);
CREATE INDEX idx_taxonomy_nodes_keywords ON taxonomy_nodes USING GIN (keywords);

-- Active nodes
CREATE INDEX idx_taxonomy_nodes_active ON taxonomy_nodes(is_active) WHERE is_active = true;

-- Popular nodes
CREATE INDEX idx_taxonomy_nodes_usage ON taxonomy_nodes(usage_count DESC);

-- ============================================================================
-- TRACKING TABLES (simplified - reference nodes by ID)
-- ============================================================================

-- Usage tracking
CREATE TABLE taxonomy_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,
  deal_id TEXT,
  search_query TEXT,
  user_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_log_node ON taxonomy_usage_log(node_id);
CREATE INDEX idx_usage_log_created ON taxonomy_usage_log(created_at DESC);

-- Search misses
CREATE TABLE taxonomy_search_misses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_query TEXT NOT NULL,
  search_context JSONB,
  deal_id TEXT,
  miss_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_misses_query ON taxonomy_search_misses(search_query);
CREATE INDEX idx_search_misses_count ON taxonomy_search_misses(miss_count DESC);

-- User suggestions
CREATE TABLE taxonomy_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_type TEXT NOT NULL, -- 'new_node', 'merge', 'move', 'delete'
  node_id UUID REFERENCES taxonomy_nodes(id) ON DELETE SET NULL,
  suggested_name TEXT,
  suggested_parent_id UUID REFERENCES taxonomy_nodes(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  user_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by TEXT
);

CREATE INDEX idx_suggestions_status ON taxonomy_suggestions(status);
CREATE INDEX idx_suggestions_type ON taxonomy_suggestions(suggestion_type);

-- ============================================================================
-- MATERIALIZED VIEW FOR SEARCH (Fast Full-Text Search)
-- ============================================================================

CREATE MATERIALIZED VIEW taxonomy_search_view AS
SELECT 
  n.id AS node_id,
  n.name AS node_name,
  n.slug AS node_slug,
  n.full_name,
  n.level,
  n.node_type,
  n.path,
  n.keywords,
  n.usage_count,
  n.is_active,
  
  -- Parent chain for breadcrumbs
  (
    SELECT array_agg(p.name ORDER BY p.level)
    FROM taxonomy_nodes p
    WHERE n.path @> p.path AND p.id != n.id
  ) AS parent_names,
  
  -- Full path as text for display
  (
    SELECT string_agg(p.name, ' > ' ORDER BY p.level)
    FROM taxonomy_nodes p
    WHERE n.path @> p.path
  ) AS full_path,
  
  -- Search text (combined for full-text search)
  (
    n.name || ' ' || 
    COALESCE(n.full_name, '') || ' ' ||
    COALESCE(array_to_string(n.keywords, ' '), '')
  ) AS search_text
FROM taxonomy_nodes n
WHERE n.is_active = true;

CREATE UNIQUE INDEX idx_taxonomy_search_view_id ON taxonomy_search_view(node_id);
CREATE INDEX idx_taxonomy_search_view_name_trgm ON taxonomy_search_view USING GIN (node_name gin_trgm_ops);
CREATE INDEX idx_taxonomy_search_view_text ON taxonomy_search_view USING GIN (to_tsvector('english', search_text));
CREATE INDEX idx_taxonomy_search_view_level ON taxonomy_search_view(level);
CREATE INDEX idx_taxonomy_search_view_usage ON taxonomy_search_view(usage_count DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update search vector on insert/update
CREATE OR REPLACE FUNCTION update_taxonomy_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    NEW.name || ' ' || 
    COALESCE(NEW.full_name, '') || ' ' ||
    COALESCE(array_to_string(NEW.keywords, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER taxonomy_search_vector_update
  BEFORE INSERT OR UPDATE ON taxonomy_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_taxonomy_search_vector();

-- Function to update path on insert/update
CREATE OR REPLACE FUNCTION update_taxonomy_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path LTREE;
BEGIN
  IF NEW.parent_id IS NULL THEN
    -- Root node
    NEW.path := text2ltree(NEW.slug);
    NEW.level := 0;
  ELSE
    -- Get parent's path
    SELECT path, level INTO parent_path, NEW.level
    FROM taxonomy_nodes
    WHERE id = NEW.parent_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent node not found';
    END IF;
    
    NEW.path := parent_path || text2ltree(NEW.slug);
    NEW.level := NEW.level + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER taxonomy_path_update
  BEFORE INSERT OR UPDATE ON taxonomy_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_taxonomy_path();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_node_usage(node_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE taxonomy_nodes
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = node_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_taxonomy_search()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY taxonomy_search_view;
END;
$$ LANGUAGE plpgsql;

-- Function to search taxonomy (for RPC calls from frontend)
CREATE OR REPLACE FUNCTION search_taxonomy(
  search_query TEXT,
  parent_filter UUID DEFAULT NULL,
  level_filter INTEGER DEFAULT NULL,
  limit_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  node_id UUID,
  node_name TEXT,
  node_slug TEXT,
  full_name TEXT,
  level INTEGER,
  node_type TEXT,
  full_path TEXT,
  parent_names TEXT[],
  usage_count INTEGER,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.node_id,
    v.node_name,
    v.node_slug,
    v.full_name,
    v.level,
    v.node_type,
    v.full_path,
    v.parent_names,
    v.usage_count,
    (
      ts_rank(to_tsvector('english', v.search_text), plainto_tsquery('english', search_query)) +
      similarity(v.node_name, search_query) +
      (v.usage_count::FLOAT / 1000.0)
    ) AS relevance_score
  FROM taxonomy_search_view v
  JOIN taxonomy_nodes n ON v.node_id = n.id
  WHERE 
    (
      v.search_text ILIKE '%' || search_query || '%' OR
      to_tsvector('english', v.search_text) @@ plainto_tsquery('english', search_query)
    )
    AND (parent_filter IS NULL OR n.parent_id = parent_filter)
    AND (level_filter IS NULL OR v.level = level_filter)
  ORDER BY relevance_score DESC, v.usage_count DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Function to get node with full hierarchy
CREATE OR REPLACE FUNCTION get_node_hierarchy(node_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  level INTEGER,
  full_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE hierarchy AS (
    -- Start with the target node
    SELECT n.id, n.name, n.slug, n.level, n.path
    FROM taxonomy_nodes n
    WHERE n.id = node_uuid
    
    UNION ALL
    
    -- Recursively get ancestors
    SELECT p.id, p.name, p.slug, p.level, p.path
    FROM taxonomy_nodes p
    INNER JOIN hierarchy h ON p.id = (
      SELECT parent_id FROM taxonomy_nodes WHERE id = h.id
    )
  )
  SELECT 
    h.id,
    h.name,
    h.slug,
    h.level,
    (SELECT string_agg(name, ' > ' ORDER BY level) FROM hierarchy) AS full_path
  FROM hierarchy
  ORDER BY h.level;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE taxonomy_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_search_misses ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (can tighten later with auth)
CREATE POLICY "Allow all operations" ON taxonomy_nodes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON taxonomy_usage_log FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON taxonomy_search_misses FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON taxonomy_suggestions FOR ALL USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE taxonomy_nodes IS 'Flexible hierarchical taxonomy supporting any depth';
COMMENT ON COLUMN taxonomy_nodes.path IS 'Materialized path using ltree for fast hierarchy queries';
COMMENT ON COLUMN taxonomy_nodes.level IS '0 = root category, 1 = subcategory, 2+ = deeper levels';
COMMENT ON COLUMN taxonomy_nodes.full_name IS 'Full hierarchical name for display';
COMMENT ON FUNCTION search_taxonomy IS 'Full-text search across taxonomy with relevance ranking';

















