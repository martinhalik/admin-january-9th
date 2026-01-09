-- Migration: Add deal aggregation functions for performance
-- Run this in Supabase SQL Editor

-- Function to get deal counts by division with category breakdown
CREATE OR REPLACE FUNCTION get_deal_aggregations()
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'byDivision', (
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
    ),
    'byStage', (
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
    ),
    'total', (SELECT COUNT(*) FROM deals),
    'lastUpdated', NOW()
  );
$$;




