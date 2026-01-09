# Device Preview Feature Implementation

## Summary
Added a device preview feature that shows how deal content will look on mobile, tablet, and desktop devices. Available as both a **dedicated tab** for draft deals and as a **modal** accessible from the "View Deal" button.

## What Was Missing
- The "View Deal" button in the Content tab only showed a placeholder message
- There was no way to preview how the deal would render on different device sizes
- Users couldn't see a visual representation of the deal before publishing

## What Was Implemented

### 1. Preview Tab for Draft Deals (NEW!)
Added a dedicated **"Preview"** tab that appears after "Business Details" tab, **only for draft deals**.

**Location**: `frontend/src/pages/DealDetail.tsx`

**Features:**
- **Full-page preview view** integrated as a tab (not a modal)
- **Always accessible** during draft creation/editing
- **Same device switching** as modal version
- **Positioned after Business Details** in tab order: 
  - Content → Business Details → **Preview** → (Reviews hidden for drafts)

### 2. Device Preview Modal (Also Available)
The modal component is still available at:
```
frontend/src/components/DevicePreviewModal.tsx
```

**Both implementations share:**
- **Device Selector**: Toggle between Mobile, Tablet, and Desktop views
- **Realistic Device Frames**: Shows content in device mockups with proper bezels and notches
- **Scaled Previews**: Each device is scaled appropriately for viewing
- **Full Deal Content**: Displays:
  - Featured images
  - Deal title and merchant info
  - Category tags
  - Short descriptor and full description
  - All deal options with pricing
  - Buy button
  - Fine print

**Device Specifications:**
- **Mobile**: 375×667px (iPhone SE size) - 70% scale
- **Tablet**: 768×1024px (iPad size) - 50% scale
- **Desktop**: 1440×900px (MacBook size) - 40% scale

### 2. Integration into DealDetail Page
**Changes to `frontend/src/pages/DealDetail.tsx`:**

1. **Import added** (line 83):
   ```typescript
   import DevicePreviewModal from "../components/DevicePreviewModal";
   ```

2. **State variable added** (line 254):
   ```typescript
   const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
   ```

3. **Preview handler updated** (line 2593):
   ```typescript
   onPreview={() => {
     setIsPreviewModalOpen(true);
   }}
   ```
   Previously showed: `message.info("Opening preview...");`

4. **Modal component added** (before closing div):
   ```typescript
   <DevicePreviewModal
     open={isPreviewModalOpen}
     onClose={() => setIsPreviewModalOpen(false)}
     deal={deal}
     merchant={selectedMerchantAccount}
   />
   ```

## How to Use

### Method 1: Preview Tab (For Draft Deals) ⭐ RECOMMENDED
1. **Navigate to any draft deal**
2. **Click the "Preview" tab** (has Monitor 🖥️ icon) - appears after Business Details
3. **Select your device** using the buttons at top:
   - 📱 Mobile
   - 📱 Tablet
   - 🖥️ Desktop
4. **View updates in real-time** as you edit content in other tabs

### Method 2: View Deal Button (Modal)
1. **Navigate to any deal** in draft or published state
2. **Go to the Content tab**
3. **Click the "View Deal" button** (has Groupon icon)
4. **The device preview modal opens** showing the mobile view by default
5. **Switch between devices** using the segmented control at the top
6. **Close the modal** by clicking outside or the X button

## Visual Design

### Tab Layout (Draft Deals)
```
┌───────────────────────────────────────────────────┐
│  [Content] [Business Details] [🖥️ Preview]       │
├───────────────────────────────────────────────────┤
│                                                    │
│         [📱 Mobile] [📱 Tablet] [🖥️ Desktop]      │
│                                                    │
│    ┌────────────────────────────────────┐        │
│    │      ╔════════════════════╗         │        │
│    │      ║    Device Frame     ║         │        │
│    │      ║                     ║         │        │
│    │      ║   Deal Content      ║         │        │
│    │      ║   (scrollable)      ║         │        │
│    │      ║                     ║         │        │
│    │      ╚════════════════════╝         │        │
│    └────────────────────────────────────┘        │
│                                                    │
│           Mobile • 375×667px                       │
└───────────────────────────────────────────────────┘
```

### Modal Layout (All Deals)
```
┌──────────────────────────────────────────────┐
│  Device Preview                               │
│  See how your deal will look on different... │
├──────────────────────────────────────────────┤
│        [📱 Mobile] [📱 Tablet] [🖥️ Desktop]   │
│                                               │
│   ┌────────────────────────────────────┐    │
│   │      ╔════════════════════╗         │    │
│   │      ║    Device Frame     ║         │    │
│   │      ║                     ║         │    │
│   │      ║   Deal Content      ║         │    │
│   │      ║   (scrollable)      ║         │    │
│   │      ║                     ║         │    │
│   │      ╚════════════════════╝         │    │
│   └────────────────────────────────────┘    │
│                                               │
│           Mobile • 375×667px                  │
└──────────────────────────────────────────────┘
```

### Device Frames
- **Mobile**: Rounded corners, top notch, dark border
- **Tablet**: Rounded corners, dark border
- **Desktop**: Subtle rounded corners, dark bezel

### Content Rendering
- Groupon header bar at the top
- Featured image (if available)
- Deal title and merchant info
- Category/subcategory tags
- Descriptive text
- Deal options with pricing cards
- Buy button (styled but not functional in preview)
- Fine print section

## Technical Details

### Props Interface
```typescript
interface DevicePreviewModalProps {
  open: boolean;           // Modal visibility
  onClose: () => void;    // Close handler
  deal: Deal;             // Deal data to preview
  merchant?: MerchantAccount; // Optional merchant data
}
```

### Dependencies
- `antd`: Modal, Segmented, Space, Typography, Card, Image, Tag, Divider
- `lucide-react`: Monitor, Smartphone, Tablet icons
- Deal and MerchantAccount types from existing data models

## Future Enhancements
- [ ] Add QR code preview for mobile scanning
- [ ] Show deal in actual iframe from Groupon (if URL available)
- [ ] Add sharing/screenshot functionality
- [ ] Support for different locales/languages
- [ ] Interactive elements (e.g., clicking options)
- [ ] Add preview for email/social media sharing format

## Testing
- ✅ TypeScript compilation passes
- ✅ No console errors
- ✅ Modal opens/closes correctly
- ✅ Device switching works smoothly
- ✅ Content scales appropriately for each device

## Technical Implementation Details

### New Component: DevicePreviewContent
Created inline component in `DealDetail.tsx` that renders the preview UI:
- Uses React.FC with proper TypeScript typing
- Takes `deal`, `merchant`, `token`, and `windowWidth` as props
- Manages device selection state (`mobile` | `tablet` | `desktop`)
- Renders device frame with scaled content

### Tab Configuration Changes
```typescript
// Added Preview tab after Business Details (line ~2335)
...(deal?.campaignStage === "draft" ? [{
  label: (
    <div style={{ /* tab styling */ }}>
      <Monitor size={16} />
      <span>Preview</span>
    </div>
  ),
  value: "Preview",
}] : [])
```

### Content Rendering
```typescript
// Added Preview content section (line ~3075)
{activeView === "Preview" && (
  <div style={{ paddingTop: 24 }}>
    <Card>
      <DevicePreviewContent 
        deal={deal} 
        merchant={selectedMerchantAccount}
        token={token}
        windowWidth={windowWidth}
      />
    </Card>
  </div>
)}
```

## Files Changed
1. `/frontend/src/components/DevicePreviewModal.tsx` (NEW) - Modal version
2. `/frontend/src/pages/DealDetail.tsx` (MODIFIED):
   - Added `Monitor`, `Smartphone`, `Tablet` icon imports
   - Added `Divider`, `Image` to antd imports
   - Created `DevicePreviewContent` inline component (line ~108)
   - Added "Preview" tab to Segmented options (line ~2335)
   - Added Preview tab content rendering (line ~3075)
   - Kept modal integration for "View Deal" button

## Commit Message Suggestion
```
feat: Add Preview tab for draft deals with device mockups

- Added dedicated Preview tab after Business Details (draft deals only)
- Created DevicePreviewContent component with mobile/tablet/desktop views
- Shows realistic device frames with scaled content rendering
- Supports full deal preview: images, text, options, pricing
- Also available via "View Deal" button modal for all deals
- Tab includes Monitor icon and device selector UI
```
