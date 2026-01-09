# Role-Based Default Filtering Implementation

## Summary
Implemented role-based default filtering so users automatically see the appropriate deals/accounts based on their role when they first load the page.

## Filtering Rules by Role

| Role | Default Filter | What They See |
|------|---------------|---------------|
| **BD** (Business Development) | Own accounts | Only accounts/deals where they are the account owner |
| **MD** (Merchant Development) | Own accounts | Only accounts/deals where they are the account owner |
| **DSM** (Divisional Sales Manager) | Team accounts | Accounts/deals owned by anyone on their team (direct reports) |
| **MM** (Market Manager) | All accounts | All accounts/deals (will use category/division filters) |
| **Admin** | All accounts | All accounts/deals |
| **Executive** | All accounts | All accounts/deals |

## Technical Implementation

### 1. Filter Initialization

Each page (Accounts, Deals, AccountSelector) now initializes the `accountOwnerFilter` based on the current role:

```typescript
const getInitialOwnerFilter = () => {
  if (currentRole === 'bd' || currentRole === 'md') {
    return currentUser.employeeId;  // Show own accounts
  }
  if (currentRole === 'dsm') {
    return 'team';  // Special marker for team filtering
  }
  return null;  // MM, Admin, Executive see all
};
```

### 2. Team Filtering Logic

For DSM users, we use `getAllTeamMembers()` to get all direct reports recursively:

```typescript
if (accountOwnerFilter === 'team') {
  // DSM: Show accounts owned by anyone on their team
  const teamMembers = getAllTeamMembers(currentUser.employeeId);
  const teamMemberIds = teamMembers.map(m => m.id);
  return accounts.filter(acc => 
    acc.accountOwner && teamMemberIds.includes(acc.accountOwner.id)
  );
}
```

### 3. UI Display

#### BD/MD Users
- Filter shows their name with avatar
- Clear (X) button to see all accounts

#### DSM Users
- Filter shows "My Team (X)" with avatar group of team members
- Clear (X) button to see all accounts

#### MM/Admin/Executive Users
- Filter shows "All Owners" with avatar group
- No clear button needed (already showing all)

### 4. Filter Update on Role Change

When user switches roles (using "View as different role"):

```typescript
useEffect(() => {
  if (currentRole === 'bd' || currentRole === 'md') {
    setAccountOwnerFilter(currentUser.employeeId);
  } else if (currentRole === 'dsm') {
    setAccountOwnerFilter('team');
  } else {
    setAccountOwnerFilter(null);
  }
}, [currentRole, currentUser.employeeId]);
```

## Files Modified

1. **frontend/src/pages/Accounts.tsx**
   - Updated filter initialization
   - Added team filtering logic
   - Imported `getAllTeamMembers` and `getEmployeeById`

2. **frontend/src/pages/Deals.tsx**
   - Updated filter initialization
   - Added team filtering logic
   - Imported `getAllTeamMembers`

3. **frontend/src/components/AccountSelector.tsx**
   - Updated filter initialization
   - Added team filtering logic
   - Imported `getAllTeamMembers`

4. **frontend/src/components/AccountOwnerFilter.tsx**
   - Added "My Team" display for DSM users
   - Shows avatar group with team member count
   - Added clear button for team filter

## User Experience Flow

### As BD User (Alex Thompson)
1. Opens Accounts/Deals page
2. **Automatically sees** only accounts/deals assigned to Alex Thompson
3. Filter button shows "Alex Thompson" with clear (X) button
4. Can click X to see all accounts
5. Can select another owner from dropdown

### As DSM User
1. Opens Accounts/Deals page
2. **Automatically sees** accounts/deals from all team members
3. Filter button shows "My Team (5)" with team avatars
4. Can click X to see all accounts
5. Can select a specific team member from dropdown

### As MM/Admin/Executive
1. Opens Accounts/Deals page
2. **Automatically sees** all accounts/deals
3. Filter button shows "All Owners" with avatar group
4. Can filter by specific owner if needed

## Benefits

✅ **Contextual Defaults** - Each role sees relevant data immediately
✅ **Clear Visual Feedback** - Filter button shows what's being displayed
✅ **Easy Override** - X button or dropdown to change filter
✅ **Consistent Behavior** - Same logic across Accounts, Deals, and modals
✅ **Team Hierarchy** - DSM can see their team's work automatically

## Future Enhancements (MM Role)

For MM (Market Manager) role, we'll need to:
1. Add category/division filters to the UI
2. Auto-select MM's assigned division/category
3. Replace or supplement account owner filter with division filter
4. Show "My Division" or "My Market" in the filter button

## Testing Checklist

- [x] BD user sees only their accounts by default
- [x] MD user sees only their accounts by default
- [x] DSM user sees team accounts by default
- [x] Admin sees all accounts by default
- [x] Filter updates when switching roles
- [x] Clear button works for BD/MD/DSM
- [x] Can manually select different owner
- [x] Team filter shows correct count
- [x] Works in Accounts page
- [x] Works in Deals page
- [x] Works in Account Selector modal




