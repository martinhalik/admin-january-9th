# Filtering & Role-Based Views

## Overview

The application implements comprehensive filtering with role-based default views for deals, accounts, and other resources.

## Features

### 1. Role-Based Default Filtering

Users automatically see data relevant to their role:

- **Account Executives**: See their own deals and accounts
- **Regional Managers**: See their team's deals and accounts
- **Sales Directors**: See their region's deals and accounts
- **Executives**: See all deals and accounts

### 2. Account Owner Filter

On the Deals page, users can filter by:
- **All Owners**: See all deals (if permitted by role)
- **My Deals**: Deals where they are the account owner
- **My Team's Deals**: Deals owned by their team members

### 3. Campaign Stage Filters

Filter deals by stage:
- Draft
- Won (Live, Scheduled, Paused, Ended)
- Lost

### 4. Additional Filters

- **Division**: North America, Europe, Asia Pacific, etc.
- **Category**: Food & Drink, Health & Beauty, etc.
- **Quality**: Ace, Good, Fair
- **Revenue Range**: Min/max revenue filter
- **Search**: Text search across title, merchant, location

## Implementation

### Role Detection

```typescript
// frontend/src/contexts/RoleViewContext.tsx
const detectUserRole = (userId: string): UserRole => {
  const employee = findEmployeeById(userId);
  
  if (employee?.position.includes('Account Executive')) return 'account_executive';
  if (employee?.position.includes('Regional Manager')) return 'regional_manager';
  if (employee?.position.includes('Director')) return 'director';
  return 'executive';
};
```

### Account Owner Filter

```typescript
// frontend/src/components/AccountOwnerFilter.tsx
<Select
  value={ownerFilter}
  onChange={setOwnerFilter}
  options={[
    { value: 'all', label: 'All Owners' },
    { value: 'my_deals', label: 'My Deals' },
    { value: 'my_team', label: "My Team's Deals" }
  ]}
/>
```

### Applying Filters

```typescript
// frontend/src/contexts/RoleViewContext.tsx
const applyRoleBasedFilter = (deals: Deal[], role: UserRole, userId: string) => {
  if (ownerFilter === 'my_deals') {
    return deals.filter(d => d.account_owner_id === userId);
  }
  
  if (ownerFilter === 'my_team') {
    const teamIds = getTeamMemberIds(userId);
    return deals.filter(d => teamIds.includes(d.account_owner_id));
  }
  
  // Role-based filtering
  switch (role) {
    case 'account_executive':
      return deals.filter(d => d.account_owner_id === userId);
    case 'regional_manager':
      const teamIds = getTeamMemberIds(userId);
      return deals.filter(d => teamIds.includes(d.account_owner_id));
    default:
      return deals;  // Show all
  }
};
```

## UI Components

### Account Owner Filter

Located in header of Deals page:

```tsx
<AccountOwnerFilter
  value={ownerFilter}
  onChange={setOwnerFilter}
  userRole={role}
  disabled={loading}
/>
```

### Campaign Stage Tabs

```tsx
<Tabs
  activeKey={campaignStage}
  onChange={setCampaignStage}
  items={[
    { key: 'all', label: 'All', count: totalCount },
    { key: 'draft', label: 'Draft', count: draftCount },
    { key: 'won', label: 'Won', count: wonCount },
    { key: 'lost', label: 'Lost', count: lostCount },
  ]}
/>
```

### Filter Controls

```tsx
<FilterControls>
  <Select label="Division" options={divisions} />
  <Select label="Category" options={categories} />
  <Select label="Quality" options={['Ace', 'Good', 'Fair']} />
  <InputNumber label="Min Revenue" />
  <InputNumber label="Max Revenue" />
  <Input label="Search" placeholder="Search deals..." />
</FilterControls>
```

## Data Flow

```
User Role
   ↓
RoleViewContext (detect role)
   ↓
Apply default filters based on role
   ↓
User can override with Account Owner Filter
   ↓
Additional filters applied (stage, division, etc.)
   ↓
Filtered data displayed
```

## Database Structure

### Deals Table

```sql
deals (
  id,
  title,
  account_id,
  account_owner_id,      -- Foreign key to employees
  opportunity_owner_id,  -- Deal owner (might differ from account owner)
  campaign_stage,        -- draft | won | lost
  won_sub_stage,         -- live | scheduled | paused | sold_out | ended
  draft_sub_stage,       -- prospecting | presentation | etc.
  division,
  category,
  quality,
  revenue,
  ...
)
```

### Employees Table

```sql
employees (
  id,
  name,
  email,
  position,
  manager_id,  -- For org hierarchy
  ...
)
```

## Configuration

### Default Filters by Role

```typescript
const defaultFilters = {
  account_executive: {
    ownerFilter: 'my_deals',
    showAllOption: false,
  },
  regional_manager: {
    ownerFilter: 'my_team',
    showAllOption: true,
  },
  director: {
    ownerFilter: 'all',
    showAllOption: true,
  },
  executive: {
    ownerFilter: 'all',
    showAllOption: true,
  },
};
```

## User Preferences

Users can save their preferred filters:

```typescript
// Saved to localStorage
const preferences = {
  defaultOwnerFilter: 'my_deals',
  defaultCampaignStage: 'draft',
  defaultDivision: 'North America',
  // ...
};
```

## Performance

### Optimizations

1. **Backend Filtering**: Filters applied at database level via Supabase queries
2. **Indexed Columns**: `account_owner_id`, `campaign_stage`, `division` indexed
3. **Lazy Loading**: Load counts separately from data
4. **Caching**: Filter results cached in context

### Example Query

```typescript
let query = supabase
  .from('deals')
  .select('*', { count: 'exact' });

if (ownerFilter === 'my_deals') {
  query = query.eq('account_owner_id', userId);
}

if (campaignStage !== 'all') {
  query = query.eq('campaign_stage', campaignStage);
}

if (division) {
  query = query.eq('division', division);
}

const { data, error, count } = await query;
```

## Testing

### Test Cases

1. ✅ Account Executive sees only their deals by default
2. ✅ Regional Manager can switch between "My Deals" and "My Team"
3. ✅ Executives see all deals
4. ✅ Filters combine correctly (owner + stage + division)
5. ✅ Search works across filtered results
6. ✅ URL state reflects filters (shareable links)

## Troubleshooting

### Filters Not Working

1. Check if `account_owner_id` is populated on deals
2. Verify user role detection in RoleViewContext
3. Check browser console for filter-related errors

### Performance Issues

1. Ensure database indexes exist on filtered columns
2. Check if too many records loaded (pagination?)
3. Verify filters applied at database level, not client-side

## Future Enhancements

- [ ] Save custom filter presets
- [ ] Share filter views with team
- [ ] Advanced filter builder (AND/OR logic)
- [ ] Filter by date range
- [ ] Filter by custom fields
- [ ] Export filtered results

## Related Files

- `frontend/src/contexts/RoleViewContext.tsx` - Role detection and filtering
- `frontend/src/components/AccountOwnerFilter.tsx` - Owner filter UI
- `frontend/src/pages/Deals.tsx` - Deals page with filters
- `frontend/src/lib/supabase.ts` - Database queries with filters
