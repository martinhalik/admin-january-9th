# Design System Documentation

## Overview
This document outlines the design system decisions for the admin application, ensuring consistency across all pages and components.

## Design Tokens

### Spacing
Always use Ant Design's design tokens from `theme.useToken()` instead of hardcoded values:

- `token.marginXXS` - 4px - Extra extra small margins
- `token.marginXS` - 8px - Extra small margins (gaps between related items)
- `token.marginSM` - 12px - Small margins
- `token.margin` - 16px - Default margin
- `token.marginMD` - 20px - Medium margin
- `token.marginLG` - 24px - Large margin (section spacing)
- `token.marginXL` - 32px - Extra large margin
- `token.marginXXL` - 48px - Extra extra large margin

### Padding
Use Ant Design padding tokens:

- `token.paddingXXS` - 4px
- `token.paddingXS` - 8px
- `token.paddingSM` - 12px
- `token.padding` - 16px
- `token.paddingMD` - 20px
- `token.paddingLG` - 24px
- `token.paddingXL` - 32px

### Colors
Always use Ant Design color tokens - **NEVER hardcode colors**:

#### Primary Colors
- `token.colorPrimary` - Primary brand color
- `token.colorPrimaryBg` - Primary background (light tint)
- `token.colorPrimaryBgHover` - Primary background hover state
- `token.colorPrimaryBorder` - Primary border color
- `token.colorPrimaryHover` - Primary hover state
- `token.colorPrimaryActive` - Primary active/pressed state

#### Text Colors
- `token.colorText` - Primary text color
- `token.colorTextSecondary` - Secondary text color (less emphasis)
- `token.colorTextTertiary` - Tertiary text color (least emphasis)
- `token.colorTextDisabled` - Disabled text color
- `token.colorTextHeading` - Heading text color

#### Background Colors
- `token.colorBgBase` - Base background color
- `token.colorBgContainer` - Container background
- `token.colorBgElevated` - Elevated container background
- `token.colorBgLayout` - Layout background
- `token.colorBgSpotlight` - Spotlight/highlight background

#### Border Colors
- `token.colorBorder` - Default border color
- `token.colorBorderSecondary` - Secondary border (lighter)

#### Status Colors
- `token.colorSuccess` - Success state color
- `token.colorSuccessBg` - Success background
- `token.colorWarning` - Warning state color
- `token.colorWarningBg` - Warning background
- `token.colorError` - Error state color
- `token.colorErrorBg` - Error background
- `token.colorInfo` - Info state color
- `token.colorInfoBg` - Info background

### Border Radius
- `token.borderRadius` - 6px - Default border radius
- `token.borderRadiusSM` - 4px - Small border radius
- `token.borderRadiusLG` - 8px - Large border radius
- `token.borderRadiusXS` - 2px - Extra small border radius

### Typography
- `token.fontSize` - 14px - Default font size
- `token.fontSizeSM` - 12px - Small font size
- `token.fontSizeLG` - 16px - Large font size
- `token.fontSizeXL` - 20px - Extra large font size
- `token.fontSizeHeading1` - 38px - H1 heading
- `token.fontSizeHeading2` - 30px - H2 heading
- `token.fontSizeHeading3` - 24px - H3 heading
- `token.fontSizeHeading4` - 20px - H4 heading
- `token.fontSizeHeading5` - 16px - H5 heading
- `token.lineHeight` - Line height ratio
- `token.lineHeightHeading` - Heading line height ratio

### Shadows
- `token.boxShadow` - Default box shadow
- `token.boxShadowSecondary` - Secondary (lighter) shadow
- `token.boxShadowTertiary` - Tertiary (lightest) shadow

## Page Header Components

We use specialized header components for different page types to maintain consistency while allowing flexibility.

### ListPageHeader
Used for pages with lists/tables (Deals, Accounts, etc.)

**Features:**
- Page title (Typography.Title level 4)
- Action buttons (right-aligned)
- Optional tabs for filtering/categorization
- Search and filter controls
- Consistent spacing using design tokens

**Spacing:**
- Header to tabs: `token.marginSM`
- Tabs to search: `token.marginXS`
- Search to content: `token.margin`
- Container padding: `token.paddingLG` (top/bottom), 20px (left/right - to align with Layout)

**Usage:**
```tsx
<ListPageHeader
  title="Deals"
  actions={[
    <Button key="process">Process All Deals</Button>,
    <Button key="create" type="primary">Create Deal</Button>
  ]}
  tabs={[...]}
  searchBar={<Input placeholder="Search..." />}
  filters={<AccountOwnerFilter />}
/>
```

### DetailPageHeader
Used for detail pages (DealDetail, AccountDetail, etc.)

**Features:**
- Breadcrumbs for navigation
- Page title with metadata
- Action buttons
- Optional tabs for different sections

**Spacing:**
- Breadcrumbs to title: `token.marginSM`
- Title to tabs: `token.margin`
- Header padding: `token.paddingLG`

**Usage:**
```tsx
<DetailPageHeader
  breadcrumbs={<DynamicBreadcrumbs />}
  title="Deal Name"
  subtitle="Account Name"
  actions={[...]}
  tabs={[...]}
/>
```

### SimplePageHeader
Used for simple/utility pages (Dashboard, Tasks, etc.)

**Features:**
- Page title (Typography.Title level 2)
- Optional subtitle
- Optional action buttons
- Minimal styling

**Spacing:**
- Title margin bottom: `token.marginLG`
- Container padding: `token.paddingLG`

**Usage:**
```tsx
<SimplePageHeader
  title="Dashboard"
  subtitle="Welcome back!"
  actions={[...]}
/>
```

## Common Patterns

### Page Container
```tsx
<div style={{
  paddingTop: token.paddingLG,
  paddingBottom: token.paddingLG,
  paddingLeft: 20,  // Fixed for alignment with Layout
  paddingRight: 20,
}}>
```

### Header with Actions
```tsx
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: token.marginSM,
}}>
  <Title level={4} style={{ margin: 0 }}>Page Title</Title>
  <Space size="small">
    {/* Action buttons */}
  </Space>
</div>
```

### Search Bar Container
```tsx
<div style={{
  display: "flex",
  gap: token.marginXS,
  marginBottom: token.margin,
  flexWrap: "wrap",
}}>
  <Input placeholder="Search..." style={{ flex: 1 }} />
  {/* Additional controls */}
</div>
```

### Filter Sidebar Layout
```tsx
<div style={{
  display: "flex",
  gap: token.margin,
  minHeight: "calc(100vh - 96px)",
}}>
  <div style={{ flex: 1, minWidth: 0 }}>
    {/* Main content */}
  </div>
  {sidebarOpen && (
    <div style={{ width: 320, flexShrink: 0 }}>
      {/* Sidebar content */}
    </div>
  )}
</div>
```

## Icon Sizing

### Lucide Icons
- Small buttons/inline: `size={12}`
- Default buttons: `size={16}`
- Large buttons: `size={20}`
- Headers: `size={24}`

### Ant Design Icons
Use default sizing, they automatically scale with button/context size.

## Button Guidelines

### Primary Actions
- Use `type="primary"` for main CTA
- Include icon for better recognition
- Size: `"middle"` (default) or `"large"` for prominent actions

### Secondary Actions
- Use default button (no type) for secondary actions
- Use `type="text"` for low-emphasis actions
- Group related actions in `<Space size="small">`

### Disabled States
Use `disabled` prop, never style manually

## Table Guidelines

### Consistent Column Widths
Define width for action columns and fixed-width columns:
```tsx
{
  title: "Actions",
  key: "actions",
  width: 120,
  align: "center" as const,
}
```

### Row Actions
- Edit: Text button with Edit icon
- View: Primary button (small)
- Delete: Danger button or dropdown menu item

## Form Guidelines

### Spacing
- Form item margin bottom: Use Ant Design's default
- Form sections: `token.marginLG` between sections
- Form buttons: `token.marginXL` margin top

### Validation
Use Ant Design's built-in validation, never create custom validation UI

## Modal Guidelines

### Sizing
- Small: 520px
- Medium: 720px
- Large: 960px
- Full-width: Use `width="100vw"` for complex editors

### Footer
Use `footer` prop for consistent button placement:
```tsx
footer={
  <Space>
    <Button onClick={onCancel}>Cancel</Button>
    <Button type="primary" onClick={onOk}>Save</Button>
  </Space>
}
```

## Card Guidelines

### Spacing
- Card margin bottom: `token.marginLG`
- Card border radius: `token.borderRadiusLG`
- Card body padding: `token.padding`

### Shadows
Use `boxShadow: token.boxShadow` for elevation

## Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Stack header actions vertically
- Full-width search bars
- Bottom sheet for filters
- Reduced padding: `token.paddingSM`

## Accessibility

### Color Contrast
All text must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)

### Focus States
Let Ant Design handle focus states - don't override `outline`

### ARIA Labels
- Add `aria-label` to icon-only buttons
- Use `title` prop for tooltips
- Ensure all interactive elements are keyboard accessible

## Animation

### Transitions
Use Ant Design's motion tokens:
- `token.motionDurationSlow` - 0.3s
- `token.motionDurationMid` - 0.2s
- `token.motionDurationFast` - 0.1s

### Easing
- `token.motionEaseInOut` - General transitions
- `token.motionEaseOut` - Entrances
- `token.motionEaseIn` - Exits

## Z-Index Layers

Use Ant Design's z-index system:
- Dropdown: 1050
- Modal: 1000
- Message: 1010
- Notification: 1010
- Tooltip: 1060

Never hardcode z-index values; use `token.zIndexPopupBase` + offset if needed.

## Best Practices

1. **Always use design tokens** - Never hardcode spacing, colors, or sizes
2. **Component consistency** - Use the appropriate PageHeader component for your page type
3. **Spacing rhythm** - Maintain consistent spacing relationships across pages
4. **Color purpose** - Use semantic color tokens (colorSuccess, colorError) for their intended purpose
5. **Mobile-first** - Consider mobile experience from the start
6. **Accessibility** - Test with keyboard navigation and screen readers
7. **Performance** - Use Ant Design's built-in optimizations (virtualization, lazy loading)
8. **Documentation** - Update this document when introducing new patterns

## Migration Checklist

When updating existing pages:

- [ ] Replace hardcoded spacing with `token.margin*` and `token.padding*`
- [ ] Replace hardcoded colors with `token.color*`
- [ ] Replace hardcoded border radius with `token.borderRadius*`
- [ ] Use appropriate PageHeader component
- [ ] Ensure consistent button sizing and spacing
- [ ] Remove inline styles where possible (use Ant Design props)
- [ ] Test responsive behavior
- [ ] Verify accessibility (keyboard nav, focus states)
- [ ] Check color contrast ratios
- [ ] Update any custom animations to use motion tokens




