# Account Owner Filter Fix

## Issue
BD users were seeing "All Owners" in the filter dropdown even though they should see their own name, and they were only seeing their 4 accounts instead of all 50 when selecting "All Owners".

## Root Cause
The `accountOwnerFilter` state was initialized to `null` for all roles, which meant:
1. BD/MD users would see "All Owners" as the default label
2. When filter was `null`, role-based filtering was still being applied (restricting BD/MD to their own accounts)

## Solution

### 1. Initialize Filter Based on Role (Accounts.tsx & Deals.tsx)

```typescript
// Initialize account owner filter based on role
// BD/MD users should see their own accounts by default
const getInitialOwnerFilter = () => {
  if (currentRole === 'bd' || currentRole === 'md') {
    return currentUser.employeeId;
  }
  return null;
};

const [accountOwnerFilter, setAccountOwnerFilter] = useState<string | null>(getInitialOwnerFilter);

// Update filter when role changes
useEffect(() => {
  if (currentRole === 'bd' || currentRole === 'md') {
    setAccountOwnerFilter(currentUser.employeeId);
  }
}, [currentRole, currentUser.employeeId]);
```

### 2. Simplified Filtering Logic

**Accounts.tsx:**
```typescript
// When account owner filter is set, show those accounts
// When null, show ALL accounts (no role-based filtering)
const baseAccounts = accountOwnerFilter 
  ? merchantAccountsWithOwners.filter(acc => acc.accountOwner?.id === accountOwnerFilter)
  : merchantAccountsWithOwners; // Show ALL accounts when filter is null
```

**Deals.tsx:**
```typescript
// Apply role-based filtering to deals
const roleFilteredDeals = useMemo(() => {
  // If user selects a specific account owner, show that owner's deals
  if (accountOwnerFilter) {
    return allDeals.filter(deal => {
      if (!deal.accountId) return true; // Keep deals without account ID
      const account = merchantAccountsWithOwners.find(acc => acc.id === deal.accountId);
      return account?.accountOwner?.id === accountOwnerFilter;
    });
  }
  
  // If no filter, show ALL deals (no role-based filtering)
  return allDeals;
}, [allDeals, accountOwnerFilter]);
```

## Behavior After Fix

### BD/MD Users
- **Default state**: Filter shows their name (e.g., "Alex Thompson") with 4 accounts
- **When clicking "All Owners"**: Filter shows "All Owners" with all 50 accounts
- **When selecting another owner**: Filter shows that owner's name with their accounts

### DSM/MM Users
- **Default state**: Filter shows "All Owners" with all 50 accounts
- **When selecting an owner**: Filter shows that owner's name with their accounts

### Admin/Executive Users
- Filter is hidden (they always see everything)

## Files Modified
1. `frontend/src/pages/Accounts.tsx`
2. `frontend/src/pages/Deals.tsx`

## Database State
- 50 merchant accounts seeded
- 13 account owners (BD/MD roles)
- 5 accounts intentionally unassigned
- Realistic distribution: 3-4 accounts per owner




