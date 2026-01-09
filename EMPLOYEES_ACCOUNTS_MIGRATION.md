# Employee and Account Management Migration

This migration adds proper employee hierarchy and merchant account management with database-backed account ownership.

## What This Adds

### New Tables
1. **employees** - Company hierarchy with roles, managers, and employee details
2. **merchant_accounts** - Merchant accounts with proper foreign key to account owners
3. Updates **deals** table with `account_id` and `account_owner_id` columns

### Features
- ✅ Real database-backed employee hierarchy
- ✅ Proper account ownership (BD/MD reps)
- ✅ Unassigned accounts (when owner leaves)
- ✅ Manager/direct reports relationships
- ✅ Views for easy querying with JOINs
- ✅ Full text search on accounts
- ✅ Row Level Security enabled

## Setup Instructions

### 1. Apply the Migration

In your Supabase SQL Editor, run:

```sql
-- Copy and paste the contents of:
supabase/migrations/add_employees_and_accounts.sql
```

This will create:
- `employees` table
- `merchant_accounts` table
- Indexes and constraints
- Views (`merchant_accounts_with_owners`, `employees_with_reports`)
- Triggers for `updated_at`

### 2. Seed the Data

Run the seed script to populate employees and merchant accounts:

```bash
# Set your Supabase credentials
export VITE_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_KEY="your-service-role-key"

# Install dependencies if needed
npm install

# Run the seed script
npx tsx scripts/seedEmployeesAndAccounts.ts
```

This will:
- Clear existing employees and accounts
- Insert ~21 employees from company hierarchy
- Insert ~50 merchant accounts
- Assign accounts to BD/MD reps
- Leave some accounts unassigned

### 3. Expected Results

After seeding, you should have:
- **21 employees** with proper hierarchy
  - 8 BD (Business Development) reps
  - 5 MD (Merchant Development) reps
  - 4 MM (Market Managers)
  - 3 DSM (Divisional Sales Managers)
  - 1 Executive
- **~50 merchant accounts**
  - ~45 assigned to BD/MD reps
  - ~5 unassigned (owner left company)
  - Distributed across all account owners

### 4. Account Distribution

The seed script distributes accounts realistically:
- Each BD/MD rep gets multiple accounts
- Distribution is even but not identical (realistic workload)
- Some accounts have no owner (turnover simulation)

Example distribution:
```
Alex Thompson (BD): 4 accounts
Sarah Chen (BD): 3 accounts
Michael Brown (MD): 4 accounts
Emily Rodriguez (MD): 3 accounts
...etc
Unassigned: 5 accounts
```

## Database Schema

### Employees Table
```sql
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  role_title TEXT NOT NULL,
  avatar TEXT,
  phone TEXT,
  manager_id TEXT REFERENCES employees(id),
  status TEXT DEFAULT 'active',
  ...
);
```

### Merchant Accounts Table
```sql
CREATE TABLE merchant_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  account_owner_id TEXT REFERENCES employees(id),
  status TEXT DEFAULT 'active',
  potential TEXT,
  deals_count INTEGER DEFAULT 0,
  ...
);
```

### Deals Table (Updated)
```sql
ALTER TABLE deals 
  ADD COLUMN account_id TEXT REFERENCES merchant_accounts(id),
  ADD COLUMN account_owner_id TEXT REFERENCES employees(id),
  ADD COLUMN opportunity_owner_id TEXT REFERENCES employees(id);
```

## Frontend Integration

The frontend will automatically fetch from Supabase using:

```typescript
import { 
  fetchEmployees, 
  fetchMerchantAccounts 
} from '../lib/supabaseData';

// Fetch employees
const employees = await fetchEmployees();

// Fetch accounts with owner details
const accounts = await fetchMerchantAccounts();

// Fetch accounts for specific owner
const ownerAccounts = await fetchAccountsForOwner(ownerId);
```

## Queries You Can Run

### See all employees with their managers
```sql
SELECT 
  e.name,
  e.role_title,
  m.name as manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
ORDER BY e.name;
```

### See accounts by owner
```sql
SELECT 
  ma.name as account_name,
  e.name as owner_name,
  e.role,
  ma.potential,
  ma.status
FROM merchant_accounts ma
LEFT JOIN employees e ON ma.account_owner_id = e.id
ORDER BY e.name, ma.name;
```

### Count accounts per owner
```sql
SELECT 
  e.name,
  e.role,
  COUNT(ma.id) as account_count
FROM employees e
LEFT JOIN merchant_accounts ma ON e.id = ma.account_owner_id
WHERE e.role IN ('bd', 'md')
GROUP BY e.id, e.name, e.role
ORDER BY account_count DESC;
```

### Find unassigned accounts
```sql
SELECT 
  name,
  business_type,
  location,
  potential
FROM merchant_accounts
WHERE account_owner_id IS NULL
ORDER BY name;
```

## Next Steps

After running this migration:

1. ✅ Update frontend to use Supabase data instead of mock data
2. ✅ Update role-based filtering to query Supabase
3. ✅ Add UI for reassigning unassigned accounts
4. ✅ Add employee management interface
5. ✅ Connect deals to accounts via `account_id`

## Troubleshooting

### "No BD/MD employees found"
Make sure you ran the seed script and employees were created successfully.

### "Supabase credentials missing"
Set the environment variables:
```bash
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
```

### "Foreign key constraint violation"
Make sure employees are seeded before merchant accounts (the script does this automatically).




