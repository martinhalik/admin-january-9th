-- Performance optimization migration
-- Adds indexes and optimizations for large datasets

-- ============================================
-- ADDITIONAL INDEXES FOR EMPLOYEES
-- ============================================

-- Composite index for role + status (common filter combination)
CREATE INDEX IF NOT EXISTS idx_employees_role_status ON employees(role, status);

-- Index for name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_employees_name_lower ON employees(LOWER(name));

-- Index for email searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_employees_email_lower ON employees(LOWER(email));

-- Full-text search index for employees
CREATE INDEX IF NOT EXISTS idx_employees_search ON employees 
  USING gin(to_tsvector('english', name || ' ' || email || ' ' || role_title));

-- ============================================
-- ADDITIONAL INDEXES FOR MERCHANT ACCOUNTS
-- ============================================

-- Composite index for account_owner_id + status (common filter)
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_owner_status ON merchant_accounts(account_owner_id, status);

-- Index for name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_name_lower ON merchant_accounts(LOWER(name));

-- ============================================
-- ADDITIONAL INDEXES FOR DEALS
-- ============================================

-- Composite index for account_id + campaign_stage (common filter)
CREATE INDEX IF NOT EXISTS idx_deals_account_campaign ON deals(account_id, campaign_stage);

-- Index for account_owner_id (denormalized field for fast filtering)
CREATE INDEX IF NOT EXISTS idx_deals_account_owner ON deals(account_owner_id);

-- Composite index for filtering by owner and stage
CREATE INDEX IF NOT EXISTS idx_deals_owner_stage ON deals(account_owner_id, campaign_stage);

-- ============================================
-- MATERIALIZED VIEW FOR OWNER STATISTICS
-- ============================================

-- Create materialized view for quick access to owner statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS employee_account_stats AS
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  e.role as employee_role,
  e.avatar as employee_avatar,
  COUNT(DISTINCT ma.id) as accounts_count,
  COUNT(DISTINCT d.id) as deals_count,
  SUM(CASE WHEN ma.status = 'active' THEN 1 ELSE 0 END) as active_accounts_count,
  SUM(CASE WHEN ma.potential = 'high' THEN 1 ELSE 0 END) as high_potential_count,
  SUM(CASE WHEN ma.potential = 'mid' THEN 1 ELSE 0 END) as mid_potential_count,
  SUM(CASE WHEN ma.potential = 'low' THEN 1 ELSE 0 END) as low_potential_count,
  SUM(CASE WHEN d.campaign_stage = 'won' THEN 1 ELSE 0 END) as won_deals_count,
  SUM(CASE WHEN d.campaign_stage = 'draft' THEN 1 ELSE 0 END) as draft_deals_count
FROM employees e
LEFT JOIN merchant_accounts ma ON e.id = ma.account_owner_id
LEFT JOIN deals d ON ma.id = d.account_id
WHERE e.role IN ('bd', 'md', 'mm', 'dsm')
  AND e.status = 'active'
GROUP BY e.id, e.name, e.role, e.avatar;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_employee_account_stats_role ON employee_account_stats(employee_role);
CREATE INDEX IF NOT EXISTS idx_employee_account_stats_name ON employee_account_stats(employee_name);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_employee_account_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY employee_account_stats;
END;
$$;

-- ============================================
-- QUERY OPTIMIZATION SETTINGS
-- ============================================

-- Analyze tables to update query planner statistics
ANALYZE employees;
ANALYZE merchant_accounts;
ANALYZE deals;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON INDEX idx_employees_role_status IS 'Optimizes queries filtering by role and status';
COMMENT ON INDEX idx_employees_search IS 'Full-text search for employee names, emails, and roles';
COMMENT ON INDEX idx_merchant_accounts_owner_status IS 'Optimizes queries for owner accounts with status filter';
COMMENT ON INDEX idx_deals_account_campaign IS 'Optimizes deal queries by account and campaign stage';
COMMENT ON MATERIALIZED VIEW employee_account_stats IS 'Cached statistics for employee accounts and deals. Refresh periodically with refresh_employee_account_stats()';




