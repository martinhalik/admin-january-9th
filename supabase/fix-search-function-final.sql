-- FINAL FIX: Force drop all search_services function versions
-- Copy and run this EXACTLY in Supabase SQL Editor

-- Method 1: Drop with exact parameter types
DROP FUNCTION IF EXISTS public.search_services(text, uuid, integer);
DROP FUNCTION IF EXISTS public.search_services(text, uuid, uuid, integer);

-- Method 2: If above doesn't work, find and drop by OID
DO $$
DECLARE
    func_oid OID;
BEGIN
    -- Find all functions named search_services
    FOR func_oid IN 
        SELECT oid FROM pg_proc WHERE proname = 'search_services' AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_oid::regprocedure || ' CASCADE';
    END LOOP;
END $$;

-- Verify they're all gone
SELECT proname, pg_get_function_arguments(oid) as args
FROM pg_proc 
WHERE proname = 'search_services';

-- Now create the ONLY version we need
CREATE FUNCTION search_services(
  search_query TEXT,
  category_filter UUID DEFAULT NULL,
  limit_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  service_id UUID,
  service_name TEXT,
  service_slug TEXT,
  subcategory_id UUID,
  subcategory_name TEXT,
  subcategory_slug TEXT,
  category_id UUID,
  category_name TEXT,
  category_slug TEXT,
  full_path TEXT,
  short_path TEXT,
  is_primary_subcategory BOOLEAN,
  is_primary_category BOOLEAN,
  relevance_score REAL,
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    tfp.service_id,
    tfp.service_name,
    tfp.service_slug,
    tfp.subcategory_id,
    tfp.subcategory_name,
    tfp.subcategory_slug,
    tfp.category_id,
    tfp.category_name,
    tfp.category_slug,
    tfp.full_path,
    tfp.short_path,
    tfp.is_primary_subcategory,
    tfp.is_primary_category,
    GREATEST(
      ts_rank(s.search_vector, plainto_tsquery('english', search_query)) * 2,
      similarity(s.name, search_query)
    )::REAL as relevance_score,
    s.usage_count
  FROM taxonomy_full_paths tfp
  JOIN taxonomy_services s ON tfp.service_id = s.id
  WHERE (
    s.search_vector @@ plainto_tsquery('english', search_query)
    OR s.name ILIKE '%' || search_query || '%'
    OR similarity(s.name, search_query) > 0.3
  )
  AND (category_filter IS NULL OR tfp.category_id = category_filter)
  ORDER BY relevance_score DESC, s.usage_count DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Test it
SELECT service_name, category_name FROM search_services('oil', NULL, 5);














