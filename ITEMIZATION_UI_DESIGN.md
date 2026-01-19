# 🎨 Itemization Modal UI Design

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Itemize Receipt                                      × │
│  Select items, assign categories, and confirm total        │
│  [Purple gradient header background]                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ Items total $37.18 but transaction is $40.00 - $2.82  │
│  [Red error banner - only shows if validation fails]       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Bulk Assign Category to Selected Items:                   │
│  [Choose category... ▼]                                     │
│                                                             │
│  Selected Items: 7     Item Total: $37.18                  │
│  [Blue counter]        [Green counter]                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  💡 Instructions: Click to select items, choose the        │
│  total line, then assign categories.                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [✓] MILK 2% GAL          $3.99                        │ │
│  │     🍔 Groceries                                       │ │
│  │     [Blue background - selected]                       │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [ ] WALMART SUPERCENTER                               │ │
│  │     [Set as Total]                                     │ │
│  │     [White background - not selected]                  │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [✓] BREAD WHEAT          $2.50                        │ │
│  │     🍔 Groceries                                       │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [✓] EGGS LARGE 12CT      $4.25                        │ │
│  │     🍔 Groceries                                       │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [ ] DATE: 11/09/2025     [Set as Total]              │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [✓] PAPER TOWELS 6PK     $12.99                       │ │
│  │     🏠 Household                                       │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [✓] DISH SOAP            $3.75                        │ │
│  │     🏠 Household                                       │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [✓] ASPIRIN 100CT        $8.50                        │ │
│  │     💊 Health                                          │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [ ] TOTAL                $40.00            [TOTAL]    │ │
│  │     [Green border + badge]                             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Cancel]  [💾 Save Itemization (7 items, $37.18)]        │
│  [Gray]     [Green save button with summary]               │
└─────────────────────────────────────────────────────────────┘
```

## Color Palette

### Header
- Background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Text: `#fff`

### Error Banner
- Background: `#fee2e2`
- Text: `#dc2626`
- Border: `1px solid #fecaca`

### Stats Section
- Background: `#f8fafc`
- Border: `2px solid #e2e8f0`
- Selected Counter: `#3b82f6` (blue)
- Item Total Counter: `#10b981` (green)

### Item Cards
- **Not Selected**: 
  * Background: `#fff`
  * Border: `2px solid #e2e8f0`
  * Hover: Border becomes `#3b82f6`
  
- **Selected**: 
  * Background: `#dbeafe` (light blue)
  * Border: `2px solid #e2e8f0`
  * Checkbox: `#3b82f6` with white checkmark
  
- **Total Line**: 
  * Background: `#d1fae5` (light green)
  * Border: `3px solid #10b981` (thick green)
  * Badge: `#10b981` background, `#fff` text

### Buttons
- **Cancel**: 
  * Background: `#e2e8f0`
  * Text: `#475569`
  
- **Save**: 
  * Background: `#10b981`
  * Hover: `#059669`
  * Text: `#fff`

- **Set as Total**: 
  * Background: `#f1f5f9`
  * Border: `1px solid #cbd5e1`
  * Text: `#475569`

### Category Badges
- Background: Light color
- Text: Dark gray
- Icon + Name format: "🍔 Groceries"

## Interaction States

### Item Line States:
1. **Default** (not selected, not total)
   - White background
   - Empty checkbox
   - "Set as Total" button visible

2. **Selected** (checkbox checked)
   - Light blue background
   - Filled checkbox with checkmark
   - Category badge visible (if assigned)

3. **Total Line Confirmed**
   - Light green background
   - Thick green border
   - "TOTAL" badge in top right
   - Cannot select checkbox

### Bulk Category Assignment:
1. User selects 3 items (checkboxes)
2. Selected count updates: "Selected Items: 3"
3. User opens category dropdown
4. User clicks "🍔 Groceries"
5. All 3 items instantly show "🍔 Groceries" badge

### Validation Flow:
1. User clicks "Save Itemization"
2. System checks:
   - ✅ Total line confirmed?
   - ✅ At least one item selected?
   - ✅ All items have categories?
   - ✅ Item total matches transaction?
3. If any fail: Red error banner appears
4. If all pass: Modal closes, success alert, data saved

## Responsive Behavior

### Desktop (1000px+ width):
- Modal: 90% width, max 1000px
- 2-column stats layout (Selected Items | Item Total)

### Tablet (600-1000px):
- Modal: 95% width
- Stats remain 2-column

### Mobile (< 600px):
- Modal: 95% width
- Stats stack vertically
- Buttons stack (full width each)

## Accessibility

- ✅ Click outside modal to close
- ✅ Escape key closes modal
- ✅ All interactive elements have hover states
- ✅ Clear visual feedback for all actions
- ✅ Error messages are descriptive
- ✅ Checkboxes are large (24x24px)
- ✅ Touch-friendly tap targets (48px minimum)

## Animation/Transitions

- Modal fade-in: 200ms
- Button hover: 200ms
- Item selection: Instant (no animation for responsiveness)
- Border color changes: 200ms ease

---

This design prioritizes **clarity, speed, and user control** - exactly what you need for the manual itemization workflow! 🎯
