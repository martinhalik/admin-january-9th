# Neutral Color Scheme for Filter Components

## Issue
The AccountOwnerFilter component was using the project's primary color (green `#007C1F`) for active/selected states throughout, which:
1. Violated UI/UX guidelines (green should be reserved for success states)
2. Created poor contrast and readability issues
3. Was inconsistent with standard filter UI patterns

## Color Mappings Changed

### Button States
| State | Before | After |
|-------|--------|-------|
| Active (Owner selected) | `type="primary"` (green) | Custom blue `#1890ff` |
| Inactive (All Owners) | Default | Default (no change) |

### Dropdown Menu Items
| Element | Before | After |
|---------|--------|-------|
| Selected background | `token.colorPrimaryBg` (light green) | `token.colorFillSecondary` (light gray) |
| Check icon color | `token.colorSuccess` (green) | `#1890ff` (blue) |
| Avatar border (selected) | `getRoleColor(emp.role)` with shadow | `token.colorBorder` (neutral) |

## Implementation

### Active Filter Button
```typescript
<Button
  style={{
    background: '#1890ff',      // Ant Design standard blue
    borderColor: '#1890ff',
    color: '#fff',
  }}
>
  {/* Avatar + Name + ChevronDown */}
</Button>
```

### Menu Item (Selected State)
```typescript
{
  style: {
    background: isSelected ? token.colorFillSecondary : 'transparent',
  },
  label: (
    <Space>
      <Avatar style={{ border: `2px solid ${token.colorBorder}` }} />
      <div>
        <Text>{emp.name}</Text>
        {isSelected && <Check size={16} style={{ color: '#1890ff' }} />}
      </div>
    </Space>
  ),
}
```

## Color Tokens Used

### Neutral Colors (Gray Scale)
- `token.colorFillSecondary` - Light gray fill for selected menu items
- `token.colorBorder` - Standard border color
- `token.colorTextSecondary` - Secondary text color

### Accent Colors
- `#1890ff` - Ant Design standard blue (used for active states and checkmarks)
- `#fff` - White text on colored backgrounds

## Files Modified
- `frontend/src/components/AccountOwnerFilter.tsx`

## Design Rationale

### Why Blue Instead of Green?
1. **Industry Standard**: Blue is universally recognized for active/selected states in UI
2. **Accessibility**: Better contrast ratios for text readability
3. **Semantic Clarity**: Green is reserved for success/completion states
4. **Consistency**: Matches Ant Design's default primary color before customization

### Why Light Gray for Selected Menu Items?
1. **Subtle Indication**: Clear but not overwhelming visual feedback
2. **Ant Design Standard**: Matches default hover/selected states in dropdowns
3. **Readability**: Maintains high contrast for text content
4. **Professional**: Clean, modern appearance

## Testing Checklist
- [x] Active filter button shows blue background
- [x] Button text is white and readable
- [x] Selected menu item has light gray background
- [x] Check icon is blue, not green
- [x] Avatar borders are neutral, not role-colored when selected
- [x] Color scheme is consistent across all filter states

## Related Design Tokens

```typescript
// Project-specific (from App.tsx)
colorPrimary: "#007C1F"  // Green - only for brand elements, not filters

// Ant Design defaults (used for filters)
colorInfo: "#1890ff"      // Blue - for informational/active states
colorFillSecondary: "rgba(0, 0, 0, 0.06)" // Light gray - for subtle backgrounds
```

## Impact
This change affects only the AccountOwnerFilter component. Other uses of `token.colorPrimaryBg` in the codebase (like search highlighting in OrganizationHierarchy) are contextually appropriate and were not changed.




