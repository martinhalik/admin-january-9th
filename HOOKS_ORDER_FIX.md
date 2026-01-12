# React Hooks Order Bug Fix

## Problem

Critical React error in `DealDetail.tsx`:

```
React has detected a change in the order of Hooks called by DealDetail. 
This will lead to bugs and errors if not fixed.

Uncaught Error: Rendered more hooks than during the previous render.
```

The component was rendering **118 hooks** on one render and **119 hooks** on the next render, violating the [Rules of Hooks](https://react.dev/link/rules-of-hooks).

## Root Cause

A `React.useEffect` hook was being called **AFTER an early return statement**:

### Before (Incorrect):

```typescript
// Line 2290-2292: Early return when no deal
if (!deal) {
  return <Card loading={true} />;
}

// Line 2295-2300: Hook called AFTER early return ❌
React.useEffect(() => {
  if (deal) {
    // ... agent logging code
  }
}, [deal?.id, selectedMerchantAccount]);
```

### What Happened:

1. **First Render** (deal = null):
   - Component executes all hooks up to line 1840
   - Reaches early return at line 2290: `if (!deal) return <Card />`
   - Returns early, **never executes the useEffect at line 2295**
   - **Total hooks: 118**

2. **Second Render** (deal exists):
   - Component executes all hooks up to line 1840
   - Skips early return (deal exists)
   - **Now executes the useEffect at line 2295**
   - **Total hooks: 119**

3. **React Detects Problem**:
   - Different number of hooks between renders (118 vs 119)
   - Throws error: "Rendered more hooks than during the previous render"

## The Fix

**Moved the useEffect BEFORE the early return statement:**

### After (Correct):

```typescript
// Line 2289-2294: Hook called BEFORE early return ✅
React.useEffect(() => {
  if (deal) {
    // ... agent logging code
  }
}, [deal?.id, selectedMerchantAccount]);

// Line 2296-2298: Early return comes after all hooks
if (!deal) {
  return <Card loading={true} />;
}
```

Now the hook is **always executed**, regardless of whether `deal` exists or not. The hook internally checks `if (deal)` before running its logic, which is the correct pattern.

## Rules of Hooks Refresher

React Hooks must follow these rules:

### ✅ DO:
- Call hooks at the **top level** of your component
- Call hooks in the **same order** every render
- Call hooks **before any early returns**

### ❌ DON'T:
- Call hooks inside conditions
- Call hooks inside loops
- Call hooks after early returns
- Call hooks inside nested functions (use at component level only)

### Examples:

**❌ Wrong:**
```typescript
if (condition) {
  useEffect(() => { ... }); // Conditional hook!
}

if (!data) return null;
useEffect(() => { ... }); // After early return!
```

**✅ Correct:**
```typescript
useEffect(() => {
  if (condition) {
    // Logic inside hook
  }
}, [condition]); // Hook always called

if (!data) return null; // Early return after hooks
```

## Testing

Created comprehensive Playwright test: `frontend/e2e/deal-detail-hooks.spec.ts`

Tests verify:
- ✅ No hooks errors when loading a deal
- ✅ No hooks errors when switching between views
- ✅ No hooks errors during loading states
- ✅ No hooks errors when deal data updates

### Run Tests:

```bash
# Run the hooks order test
npx playwright test frontend/e2e/deal-detail-hooks.spec.ts

# Run with UI for debugging
npx playwright test frontend/e2e/deal-detail-hooks.spec.ts --ui

# Run and see browser
npx playwright test frontend/e2e/deal-detail-hooks.spec.ts --headed
```

## Verification

The test monitors console for these error patterns:
- "React has detected a change in the order of Hooks"
- "Rendered more hooks than during the previous render"
- "Rendered fewer hooks than during the previous render"

If any of these appear, the test fails, catching the bug early.

## Impact

### Before Fix:
- ❌ Console filled with React errors
- ❌ Unpredictable component behavior
- ❌ Potential crashes and state corruption
- ❌ Bad developer experience

### After Fix:
- ✅ No console errors
- ✅ Predictable render behavior
- ✅ Stable component state
- ✅ Clean development experience

## Files Modified

1. **`frontend/src/pages/DealDetail.tsx`**
   - Moved `React.useEffect` from line 2295 to line 2289
   - Now appears BEFORE the early return at line 2296

2. **`frontend/e2e/deal-detail-hooks.spec.ts`** (new)
   - Comprehensive test suite for hooks order
   - Monitors console for React hooks errors
   - Tests multiple scenarios (loading, navigation, updates)

## Prevention

To prevent this in the future:

1. **Always call hooks at the top of components**
2. **Never add hooks after early returns**
3. **Use ESLint plugin**: `eslint-plugin-react-hooks` (should already be installed)
4. **Run the test suite** before committing

### ESLint Configuration

Ensure your `.eslintrc` includes:

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

This will catch most hooks order issues at development time.

## Additional Notes

The agent logging `useEffect` is safe to call even when `deal` is null because:
- It has a guard: `if (deal)` inside the effect
- The effect runs but does nothing when deal is null
- It's registered in the same position every render
- React's dependency array `[deal?.id, selectedMerchantAccount]` handles null safely

This pattern is **correct and recommended** for conditional logic inside hooks:

```typescript
useEffect(() => {
  if (dependency) {
    // Do something only when dependency exists
  }
}, [dependency]);
```

Rather than conditionally calling the hook itself:

```typescript
// ❌ WRONG - don't do this
if (dependency) {
  useEffect(() => {
    // This violates Rules of Hooks
  }, [dependency]);
}
```

## References

- [Rules of Hooks - React Docs](https://react.dev/reference/rules/rules-of-hooks)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [Common Hooks Mistakes](https://react.dev/learn/hooks-rules#only-call-hooks-at-the-top-level)
