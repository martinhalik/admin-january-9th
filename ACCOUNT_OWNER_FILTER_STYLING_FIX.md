# Account Owner Filter Styling Fix

## Issue
The account owner filter was using a green color scheme (`token.colorPrimaryBg` and `token.colorPrimaryBorder`) which:
1. Violated design guidelines (green is typically reserved for success states, not active filters)
2. Made text hard to read with poor contrast
3. Didn't match the project's design system for active filters

## Solution
Updated the filter button to match the project's standard active filter pattern:

### Active Filter (Owner Selected)
```typescript
<Button
  type="primary"  // Uses Ant Design primary button (blue)
  style={{
    height: 32,
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}
>
  <Avatar src={selectedEmployee?.avatar} size={24} />
  <Text strong style={{ fontSize: 14, color: '#fff' }}>
    {selectedEmployee?.name}
  </Text>
  <ChevronDown size={14} style={{ color: '#fff' }} />
</Button>
```

### Inactive Filter (All Owners)
```typescript
<Button
  style={{
    height: 32,
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: token.colorFillSecondary,
    borderRadius: token.borderRadius,
    border: `1px solid ${token.colorBorder}`,
  }}
>
  <Avatar.Group maxCount={3} size={24}>
    {/* ... avatars ... */}
  </Avatar.Group>
  <Text style={{ fontSize: 14 }}>All Owners</Text>
  <ChevronDown size={14} />
</Button>
```

## Design Pattern Match
This now matches the pattern used throughout the project:
- **Deals.tsx line 1242**: `<Button type={filterSidebarOpen ? "primary" : "default"}>`
- **Primary button** = active/selected state (blue background, white text)
- **Default button** = inactive state (gray background, dark text)

## Changes Made
1. Changed selected state button from custom colors to `type="primary"`
2. Updated avatar border from role color to white (`token.colorBgContainer`)
3. Changed text and icon color to white (`#fff`) for better contrast
4. Removed custom background and border styles in favor of Ant Design defaults

## Files Modified
- `frontend/src/components/AccountOwnerFilter.tsx`

## Result
✅ Better accessibility with proper contrast ratios
✅ Consistent with project's design system
✅ Follows Ant Design best practices
✅ No green color used for active filters




