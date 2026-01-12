# Lazy Loading Implementation for Account Selector and Filter

## Overview

Implemented proper lazy loading with loading states for the AccountSelector component and AccountOwnerFilter to improve UX when opening the modal before data is fully loaded.

## Problem

When opening the AccountSelector modal before merchant accounts were loaded from Supabase, users would see "No accounts found" instead of a proper loading indicator. This created a poor user experience and confusion.

## Solution

### 1. Created Async Data Loading Function

**File: `frontend/src/data/accountOwnerAssignments.ts`**

- Added `getMerchantAccountsWithOwnersAsync()` function that:
  - Returns cached data if available and valid (within 5 minutes)
  - Loads fresh data from Supabase if cache is expired or empty
  - Properly handles errors and returns empty array on failure

```typescript
export async function getMerchantAccountsWithOwnersAsync(): Promise<MerchantAccount[]> {
  // If cache is valid, return it immediately
  const now = Date.now();
  if (accountsCache && (now - cacheTimestamp < CACHE_DURATION)) {
    return accountsCache;
  }
  
  // Otherwise, load fresh data
  const accounts = await loadMerchantAccounts();
  return accounts;
}
```

### 2. Updated AccountSelector Component

**File: `frontend/src/components/AccountSelector.tsx`**

Changes:
- Added `isLoadingAccounts` state to track loading status
- Added `merchantAccounts` state to store loaded accounts
- Added `useEffect` hook to load accounts on mount using the async function
- Updated render logic to show loading spinner when `isLoadingAccounts` is true
- Shows "Loading accounts..." message with spinner during data fetch
- Only shows "No accounts found" after data is loaded and truly empty
- Passed `isLoadingData` prop to AccountOwnerFilter

### 3. Updated AccountOwnerFilter Component

**File: `frontend/src/components/AccountOwnerFilter.tsx`**

Changes:
- Added `isLoadingData` optional prop to accept loading state from parent
- Updated button to show loading spinner when `isLoadingData` is true
- Disabled button interactions during loading
- Hidden button content while loading to show clean spinner

### 4. Updated Accounts Page

**File: `frontend/src/pages/Accounts.tsx`**

Changes:
- Added `merchantAccountsList` state to store loaded accounts
- Updated data loading logic to use `getMerchantAccountsWithOwnersAsync()`
- Replaced all references from `merchantAccountsWithOwners` to `merchantAccountsList`
- Passed `isLoadingData={dataLoading}` to AccountOwnerFilter

### 5. Cleaned Up Deals Page

**File: `frontend/src/pages/Deals.tsx`**

Changes:
- Removed unused `merchantAccountsWithOwners` import

## User Experience Improvements

### Before
1. Open AccountSelector modal
2. See "No accounts found" immediately
3. Data loads in background
4. Accounts suddenly appear (confusing)

### After
1. Open AccountSelector modal
2. See loading spinner with "Loading accounts..." message
3. Smooth transition to loaded accounts
4. Only shows "No accounts found" if truly no results after loading

## Loading States

### AccountSelector
```
┌─────────────────────────────────────┐
│  Search accounts...   [Filter ↓]    │
├─────────────────────────────────────┤
│                                     │
│           ⟳  (spinner)              │
│      Loading accounts...            │
│                                     │
└─────────────────────────────────────┘
```

### AccountOwnerFilter
```
┌──────────────────┐
│  ⟳  (spinner)   │  ← Loading state
└──────────────────┘

or

┌──────────────────┐
│  👥 All Owners ↓ │  ← Loaded state
└──────────────────┘
```

## Technical Details

### Caching Strategy
- Cache duration: 5 minutes (`CACHE_DURATION = 5 * 60 * 1000`)
- Cache automatically invalidates after expiration
- Fresh data loaded on first request or cache expiration
- Subsequent requests within cache window return instantly

### Error Handling
- Network errors caught and logged
- Returns empty array on error
- Component shows "No accounts found" (not error state)
- User can retry by refreshing

### Performance
- Uses existing cache mechanism from `accountOwnerAssignments.ts`
- No redundant API calls within cache window
- Loading state prevents user confusion
- Filter disabled during loading (prevents errors)

## Testing

To test the lazy loading:

1. **Clear cache and reload:**
   - Open DevTools Console
   - Refresh the page
   - Immediately open AccountSelector modal
   - Should see loading spinner

2. **Test filter loading:**
   - Open AccountSelector modal before data loads
   - Account Owner filter button should show spinner
   - Filter should be disabled until data loads

3. **Test cached data:**
   - Open modal after data is loaded
   - Should show accounts immediately
   - No loading spinner (cache hit)

## Files Modified

1. `frontend/src/data/accountOwnerAssignments.ts` - Added async function
2. `frontend/src/components/AccountSelector.tsx` - Added loading state
3. `frontend/src/components/AccountOwnerFilter.tsx` - Added loading prop
4. `frontend/src/pages/Accounts.tsx` - Updated to use async loading
5. `frontend/src/pages/Deals.tsx` - Cleaned up unused import

## Backward Compatibility

- Old synchronous `getMerchantAccountsWithOwners()` function still available
- Legacy `merchantAccountsWithOwners` export maintained for compatibility
- Existing code continues to work (returns empty array if not loaded)
- New code should use `getMerchantAccountsWithOwnersAsync()` for better UX
