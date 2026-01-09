-- Migration to optimize dashboard load by pre-calculating statistics
-- Run this in your Supabase SQL Editor

-- 1. Create indexes for faster aggregation
CREATE INDEX IF NOT EXISTS idx_deals_division ON deals(division);
CREATE INDEX IF NOT EXISTS idx_deals_category ON deals(category);
CREATE INDEX IF NOT EXISTS idx_deals_campaign_stage ON deals(campaign_stage);
CREATE INDEX IF NOT EXISTS idx_deals_won_sub_stage ON deals(won_sub_stage);

-- 2. Create a materialized view for pre-calculated stats
-- This view stores the heavy aggregation results so they can be read instantly
DROP MATERIALIZED VIEW IF EXISTS deal_stats_mv CASCADE;

CREATE MATERIALIZED VIEW deal_stats_mv AS
SELECT
  1 as id, -- Constant ID for unique index
  -- Group 1: By Division and Category
  (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT 
        COALESCE(division, 'Unknown') as division,
        COUNT(*) as total,
        (
          SELECT json_agg(json_build_object('name', category, 'count', cnt))
          FROM (
            SELECT 
              COALESCE(category, 'Other') as category,
              COUNT(*) as cnt
            FROM deals d2
            WHERE COALESCE(d2.division, 'Unknown') = COALESCE(d1.division, 'Unknown')
            GROUP BY category
            ORDER BY cnt DESC
            LIMIT 10
          ) cats
        ) as categories
      FROM deals d1
      GROUP BY division
      ORDER BY total DESC
    ) t
  ) as by_division,
  
  -- Group 2: By Stage
  (
    SELECT json_build_object(
      'draft', COUNT(*) FILTER (WHERE campaign_stage = 'draft'),
      'won', COUNT(*) FILTER (WHERE campaign_stage = 'won'),
      'live', COUNT(*) FILTER (WHERE campaign_stage = 'won' AND won_sub_stage = 'live'),
      'lost', COUNT(*) FILTER (WHERE campaign_stage = 'lost'),
      'scheduled', COUNT(*) FILTER (WHERE campaign_stage = 'won' AND won_sub_stage = 'scheduled'),
      'paused', COUNT(*) FILTER (WHERE campaign_stage = 'won' AND won_sub_stage = 'paused'),
      'ended', COUNT(*) FILTER (WHERE campaign_stage = 'won' AND won_sub_stage = 'ended')
    )
    FROM deals
  ) as by_stage,
  
  -- Total count
  (SELECT COUNT(*) FROM deals) as total_count,
  
  -- Timestamp
  NOW() as last_updated;

-- 3. Create unique index to allow concurrent refreshes
CREATE UNIQUE INDEX idx_deal_stats_mv_id ON deal_stats_mv (id);

-- 3b. Grant permissions to allow anon/authenticated users to read the view
GRANT SELECT ON deal_stats_mv TO anon, authenticated, service_role;

-- 4. Update the RPC function to read from the MV (instant response)
-- Added SECURITY DEFINER to bypass RLS policies on the underlying tables/view
CREATE OR REPLACE FUNCTION get_deal_aggregations()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Return the pre-calculated data from the view
  SELECT json_build_object(
      'byDivision', by_division,
      'byStage', by_stage,
      'total', total_count,
      'lastUpdated', last_updated
    )
  INTO result
  FROM deal_stats_mv
  LIMIT 1;
  
  -- If view is empty (first run), try to refresh it
  IF result IS NULL THEN
    PERFORM refresh_deal_stats();
    
    SELECT json_build_object(
      'byDivision', by_division,
      'byStage', by_stage,
      'total', total_count,
      'lastUpdated', last_updated
    )
    INTO result
    FROM deal_stats_mv
    LIMIT 1;
  END IF;

  RETURN result;
END;
$$;

-- 5. Helper function to refresh stats (call this after bulk updates)
CREATE OR REPLACE FUNCTION refresh_deal_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY deal_stats_mv;
END;
$$;
