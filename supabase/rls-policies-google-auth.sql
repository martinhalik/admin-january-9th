-- Row Level Security Policies for Google Auth Integration
-- This script adds RLS policies to ensure only authenticated Groupon users can access data
-- Run this in your Supabase SQL Editor after setting up Google OAuth

-- ============================================
-- Enable Row Level Security on All Tables
-- ============================================

-- Enable RLS on deals table
ALTER TABLE IF EXISTS deals ENABLE ROW LEVEL SECURITY;

-- Enable RLS on accounts table (if exists)
ALTER TABLE IF EXISTS accounts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on employees table (if exists)
ALTER TABLE IF EXISTS employees ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop Existing Permissive Policies
-- ============================================

-- Remove the old "Allow all operations" policy if it exists
DROP POLICY IF EXISTS "Allow all operations" ON deals;
DROP POLICY IF EXISTS "Allow all operations" ON accounts;
DROP POLICY IF EXISTS "Allow all operations" ON employees;

-- ============================================
-- Create Policies for Authenticated Groupon Users
-- ============================================

-- Deals Table Policies
-- ----------------------------------------

-- Allow Groupon users to SELECT deals
CREATE POLICY "Allow groupon users to read deals"
ON deals FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email')::text LIKE '%@groupon.com'
);

-- Allow Groupon users to INSERT deals
CREATE POLICY "Allow groupon users to create deals"
ON deals FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'email')::text LIKE '%@groupon.com'
);

-- Allow Groupon users to UPDATE deals
CREATE POLICY "Allow groupon users to update deals"
ON deals FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email')::text LIKE '%@groupon.com'
)
WITH CHECK (
  (auth.jwt() ->> 'email')::text LIKE '%@groupon.com'
);

-- Allow Groupon users to DELETE deals
CREATE POLICY "Allow groupon users to delete deals"
ON deals FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'email')::text LIKE '%@groupon.com'
);

-- Accounts Table Policies (if table exists)
-- ----------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
    -- Allow Groupon users to SELECT accounts
    EXECUTE 'CREATE POLICY "Allow groupon users to read accounts"
    ON accounts FOR SELECT
    TO authenticated
    USING (
      (auth.jwt() ->> ''email'')::text LIKE ''%@groupon.com''
    )';

    -- Allow Groupon users to INSERT accounts
    EXECUTE 'CREATE POLICY "Allow groupon users to create accounts"
    ON accounts FOR INSERT
    TO authenticated
    WITH CHECK (
      (auth.jwt() ->> ''email'')::text LIKE ''%@groupon.com''
    )';

    -- Allow Groupon users to UPDATE accounts
    EXECUTE 'CREATE POLICY "Allow groupon users to update accounts"
    ON accounts FOR UPDATE
    TO authenticated
    USING (
      (auth.jwt() ->> ''email'')::text LIKE ''%@groupon.com''
    )
    WITH CHECK (
      (auth.jwt() ->> ''email'')::text LIKE ''%@groupon.com''
    )';

    -- Allow Groupon users to DELETE accounts
    EXECUTE 'CREATE POLICY "Allow groupon users to delete accounts"
    ON accounts FOR DELETE
    TO authenticated
    USING (
      (auth.jwt() ->> ''email'')::text LIKE ''%@groupon.com''
    )';
  END IF;
END
$$;

-- Employees Table Policies (if table exists)
-- ----------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
    -- Allow Groupon users to SELECT employees
    EXECUTE 'CREATE POLICY "Allow groupon users to read employees"
    ON employees FOR SELECT
    TO authenticated
    USING (
      (auth.jwt() ->> ''email'')::text LIKE ''%@groupon.com''
    )';

    -- Allow Groupon users to INSERT employees
    EXECUTE 'CREATE POLICY "Allow groupon users to create employees"
    ON employees FOR INSERT
    TO authenticated
    WITH CHECK (
      (auth.jwt() ->> ''email'')::text LIKE ''%@groupon.com''
    )';

    -- Allow Groupon users to UPDATE employees
    EXECUTE 'CREATE POLICY "Allow groupon users to update employees"
    ON employees FOR UPDATE
    TO authenticated
    USING (
      (auth.jwt() ->> ''email'')::text LIKE ''%@groupon.com''
    )
    WITH CHECK (
      (auth.jwt() ->> ''email'')::text LIKE ''%@groupon.com''
    )';

    -- Allow Groupon users to DELETE employees
    EXECUTE 'CREATE POLICY "Allow groupon users to delete employees"
    ON employees FOR DELETE
    TO authenticated
    USING (
      (auth.jwt() ->> ''email'')::text LIKE ''%@groupon.com''
    )';
  END IF;
END
$$;

-- ============================================
-- Helper Function: Get Current User Email
-- ============================================

-- Create a helper function to get the current user's email
-- This can be used in application code or other policies
CREATE OR REPLACE FUNCTION auth.current_user_email()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email')::text,
    ''
  );
$$ LANGUAGE SQL STABLE;

-- ============================================
-- Helper Function: Check if User is Groupon Employee
-- ============================================

-- Create a helper function to check if the current user is a Groupon employee
CREATE OR REPLACE FUNCTION auth.is_groupon_user()
RETURNS BOOLEAN AS $$
  SELECT (auth.jwt() ->> 'email')::text LIKE '%@groupon.com';
$$ LANGUAGE SQL STABLE;

-- ============================================
-- Test the Policies
-- ============================================

-- Test that the helper functions work
-- Run these after setting up authentication:
-- SELECT auth.current_user_email();  -- Should return your email
-- SELECT auth.is_groupon_user();     -- Should return true if you're signed in with @groupon.com

-- ============================================
-- Notes
-- ============================================

-- 1. These policies ensure that only authenticated users with @groupon.com emails can access data
-- 2. Anonymous users (not signed in) will be denied access to all tables
-- 3. Authenticated users with non-Groupon emails will be denied access
-- 4. The application-level check in AuthContext.tsx provides an additional layer of security
-- 5. You can extend these policies to implement more granular permissions based on user roles

-- ============================================
-- Optional: Create Audit Log Table
-- ============================================

-- Uncomment to create an audit log for authentication events
/*
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow admins to read audit logs
CREATE POLICY "Only admins can read audit logs"
ON auth_audit_log FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email')::text IN ('admin1@groupon.com', 'admin2@groupon.com')
);

-- Allow system to insert audit logs
CREATE POLICY "Allow system to create audit logs"
ON auth_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);
*/

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Row Level Security policies have been successfully applied!';
  RAISE NOTICE 'All tables now require Groupon email authentication.';
  RAISE NOTICE 'Test your access by querying: SELECT auth.is_groupon_user();';
END
$$;




