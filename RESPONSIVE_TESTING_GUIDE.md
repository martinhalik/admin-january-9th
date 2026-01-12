# Manual Testing Guide - AI Category Selector Responsiveness

## Quick Test Using Browser DevTools

### Setup
1. Navigate to: `http://localhost:3000/deals/ai-generator?accountId=acc-1`
2. Open Chrome DevTools (F12 or Cmd+Option+I)
3. Click the device toolbar icon (Cmd+Shift+M) to enable responsive design mode

### Test Scenarios

#### 1. Mobile Small (375px - iPhone SE)
- **Set viewport:** 375 x 667
- **What to check:**
  - ✓ Fixed footer doesn't overflow horizontally
  - ✓ Text in footer is readable (doesn't get cut off)
  - ✓ Cancel and Create Deal buttons are touchable (min 32px height)
  - ✓ Status text may truncate with ellipsis
  - ✓ Cards stack vertically
  - ✓ No horizontal scrollbar

#### 2. Mobile Large (414px - iPhone 11 Pro Max)
- **Set viewport:** 414 x 896
- **What to check:**
  - ✓ More space for footer content
  - ✓ Buttons should be larger than mobile small
  - ✓ Text is more readable
  - ✓ Cards still stack vertically

#### 3. Tablet Portrait (768px - iPad)
- **Set viewport:** 768 x 1024
- **What to check:**
  - ✓ Cards still stack vertically (single column)
  - ✓ Footer has more breathing room
  - ✓ Text sizes increase
  - ✓ Good spacing between elements

#### 4. Tablet Landscape (1024px)
- **Set viewport:** 1024 x 768
- **What to check:**
  - ✓ Cards may start to show side-by-side (breakpoint at lg: 992px+)
  - ✓ Footer layout is comfortable
  - ✓ All elements well-spaced

#### 5. Desktop Small (1366px - Laptop)
- **Set viewport:** 1366 x 768
- **What to check:**
  - ✓ Two-column layout (Category + Options side-by-side)
  - ✓ Footer uses full width effectively
  - ✓ Text at comfortable reading size

#### 6. Desktop Large (1920px - Full HD)
- **Set viewport:** 1920 x 1080
- **What to check:**
  - ✓ Content doesn't get too wide (max-width: 1200px)
  - ✓ Elements reach their maximum size
  - ✓ Centered layout with appropriate margins

### Specific Elements to Test

#### Fixed Footer
The main element that was fixed:
```
DOM Path: div[style*="position: fixed"][style*="bottom: 0"]
```

**Test Actions:**
1. Scroll down the page
2. Verify footer stays at bottom
3. Check that footer doesn't cover content (100px bottom padding on content)
4. Resize window horizontally - footer should never overflow
5. With sidebar open - footer should adjust its right padding

**Expected Behavior:**
- Desktop (1920px): Footer spans full width, buttons large, text comfortable
- Mobile (375px): Footer wraps content if needed, buttons minimum size, text may truncate

#### Status Indicator (Left side of footer)
```
✓ Ready to create
3 options • Food & Drink
```

**Test:**
- Long category names should truncate with ellipsis
- Icon size scales: 32px (mobile) → 40px (desktop)
- Text is always readable

#### Action Buttons (Right side of footer)
```
[Cancel] [Create Deal]
```

**Test:**
- Buttons maintain minimum touchable size (36px) on mobile
- Gap between buttons scales responsively
- On very narrow screens (< 375px), buttons might wrap to next line
- Primary button (Create Deal) has icon + text

#### Grid Layout
**Test:**
- Resize from 375px to 1920px
- Watch cards transition from stacked to side-by-side at ~992px
- Gaps between cards should be smaller on mobile (12px) than desktop (20px)

### Testing with Sidebar Open

1. Click the "Scout" tab on the right side to open sidebar
2. Verify footer adjusts its right padding to account for sidebar
3. Resize window - footer should maintain proper spacing
4. Close sidebar - footer should animate back smoothly (0.3s transition)

### Known Edge Cases

#### Very Narrow Viewports (< 350px)
- Text will truncate more aggressively
- Buttons maintain minimum size
- Content may feel cramped but should remain functional

#### Very Wide Viewports (> 2000px)
- Content caps at 1200px width
- Extra space on sides
- No weird stretching

#### Zoomed Browser (125%, 150%)
- CSS clamp() values ensure elements scale proportionally
- Use Cmd/Ctrl + Plus/Minus to test zoom levels

## Automated Testing

Run Playwright tests to capture screenshots:

```bash
cd frontend

# Quick visual test
npx playwright test ai-category-visual.spec.ts --project=chromium

# Detailed responsive test
npx playwright test ai-category-responsive.spec.ts --project=chromium
```

Screenshots will be saved to `frontend/test-results/` directory.

## Common Issues to Look For

### ❌ Bad Responsive Behavior
- Horizontal scrollbar appears
- Text gets cut off without ellipsis
- Buttons too small to tap on mobile
- Footer content overlaps
- Cards overflow their container

### ✅ Good Responsive Behavior
- No horizontal overflow at any size
- Text truncates gracefully with "..."
- Buttons always touchable (min 32px height)
- Footer layout wraps if needed
- Smooth transitions between sizes

## Browser Testing

Test in these browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari (especially for iOS)

## Reporting Issues

If you find responsive issues:
1. Note the viewport size
2. Take a screenshot
3. Describe what's wrong
4. Include browser/OS info

Example:
```
Issue: Footer text overflows on iPhone SE
Viewport: 375 x 667
Browser: Chrome 120, iOS 17
Screenshot: [attach]
```

## Performance Note

The `clamp()` CSS function is very performant and doesn't require JavaScript calculations. The responsive behavior happens entirely in CSS, which means:
- No layout shift
- Smooth resizing
- No re-renders on resize
- Works with CSS transitions
