-- Migration: Add employees and merchant accounts tables
-- This migration adds proper account ownership and employee hierarchy management

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'bd', 'md', 'mm', 'dsm', 'executive', 'content-ops-staff', 'content-ops-manager')),
  role_title TEXT NOT NULL,
  avatar TEXT,
  phone TEXT,
  division TEXT,
  department TEXT,
  manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  location TEXT,
  hire_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for employees
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_email ON employees(email);

-- ============================================
-- MERCHANT ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  potential TEXT NOT NULL CHECK (potential IN ('high', 'mid', 'low')),
  deals_count INTEGER DEFAULT 0,
  account_owner_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  salesforce_url TEXT,
  parent_account TEXT,
  brand TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for merchant accounts
CREATE INDEX idx_merchant_accounts_owner ON merchant_accounts(account_owner_id);
CREATE INDEX idx_merchant_accounts_status ON merchant_accounts(status);
CREATE INDEX idx_merchant_accounts_potential ON merchant_accounts(potential);
CREATE INDEX idx_merchant_accounts_business_type ON merchant_accounts(business_type);
CREATE INDEX idx_merchant_accounts_location ON merchant_accounts(location);

-- Full text search for accounts
CREATE INDEX idx_merchant_accounts_search ON merchant_accounts 
  USING gin(to_tsvector('english', name || ' ' || location || ' ' || business_type));

-- ============================================
-- UPDATE DEALS TABLE
-- ============================================
-- Add account_id column to deals
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS account_id TEXT REFERENCES merchant_accounts(id) ON DELETE SET NULL;

-- Add account_owner_id for denormalized access (optional but useful for queries)
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS account_owner_id TEXT REFERENCES employees(id) ON DELETE SET NULL;

-- Add opportunity_owner_id
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS opportunity_owner_id TEXT REFERENCES employees(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deals_account_id ON deals(account_id);
CREATE INDEX IF NOT EXISTS idx_deals_account_owner_id ON deals(account_owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_opportunity_owner_id ON deals(opportunity_owner_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at for employees
CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON employees
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for merchant_accounts
CREATE TRIGGER update_merchant_accounts_updated_at 
  BEFORE UPDATE ON merchant_accounts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_accounts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth setup)
CREATE POLICY "Allow all operations on employees" ON employees
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on merchant_accounts" ON merchant_accounts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VIEWS
-- ============================================

-- View for accounts with owner details
CREATE OR REPLACE VIEW merchant_accounts_with_owners AS
SELECT 
  ma.*,
  e.name as owner_name,
  e.email as owner_email,
  e.role as owner_role,
  e.avatar as owner_avatar
FROM merchant_accounts ma
LEFT JOIN employees e ON ma.account_owner_id = e.id;

-- View for employee hierarchy with direct reports count
CREATE OR REPLACE VIEW employees_with_reports AS
SELECT 
  e.*,
  COUNT(dr.id) as direct_reports_count
FROM employees e
LEFT JOIN employees dr ON e.id = dr.manager_id
GROUP BY e.id;




