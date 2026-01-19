# Receipt Gallery Testing Guide

## Test Environment
- **Backend**: http://localhost:5000 (Flask server running)
- **Frontend**: http://localhost:3003 (Vite dev server running)
- **Login**: admin@bened.com / admin123

## Test Scenarios

### 1. Empty State Test
**Steps**:
1. Login at http://localhost:3003
2. Click "💰 Finance" in navigation
3. Click "📄 Receipts" tab
4. If you see receipts, delete them all first
5. Verify empty state displays with "📄" icon and message

**Expected Result**:
- Shows "No receipts yet" message
- "Upload Receipt" button visible
- No error messages

---

### 2. Upload Different File Types

#### Test 2A: Image Upload (JPG/PNG)
**Steps**:
1. Click "Upload Receipt" button
2. Select a JPG or PNG image
3. Wait for upload to complete

**Expected Result**:
- Receipt appears in **Unlinked Receipts** section at top
- Yellow border around receipt card
- Image thumbnail displays correctly
- "⚠️ Not Linked" badge visible
- Three buttons: "🔗 Link to Transaction", "View", "Delete"

#### Test 2B: PDF Upload
**Steps**:
1. Click "Upload Receipt" button
2. Select a PDF file
3. Wait for upload

**Expected Result**:
- PDF appears in Unlinked section
- Shows 📄 icon with RED background (#fee2e2)
- Same yellow border and "Not Linked" badge
- All action buttons visible

#### Test 2C: Email Upload (.eml)
**Steps**:
1. Click "Upload Receipt"
2. Select an .eml file (email)
3. Upload

**Expected Result**:
- Shows 📧 icon with BLUE background (#dbeafe)
- Appears in Unlinked section

#### Test 2D: Text File Upload (.txt)
**Steps**:
1. Upload a .txt file
2. Verify appearance

**Expected Result**:
- Shows 📝 icon with YELLOW background (#fef3c7)

#### Test 2E: Word Document (.docx)
**Steps**:
1. Upload a .docx file

**Expected Result**:
- Shows 📘 icon with PURPLE background (#e0e7ff)

---

### 3. Link Receipt to Transaction

**Steps**:
1. Ensure you have at least one unlinked receipt
2. Click "🔗 Link to Transaction" button on a receipt
3. Transaction modal should open
4. Verify the receipt picker dropdown shows your receipt selected
5. Fill in transaction details:
   - **Account**: Select any account (or create one)
   - **Category**: Select a category
   - **Amount**: Enter amount (e.g., 50.00)
   - **Type**: Expense or Income
   - **Description**: Receipt test transaction
   - **Date**: Today's date
6. Click "Save Transaction"

**Expected Result**:
- Transaction modal closes
- Receipt **disappears from Unlinked section**
- Receipt **appears in Linked Receipts section** below
- Linked section shows:
  - Green checkmark header "✅ Linked Receipts (1)"
  - Larger thumbnail (120x120px)
  - Full transaction details:
    * Description in bold
    * Amount in large font (color-coded: red for expense, green for income)
    * Category name with icon
    * Account name
    * Transaction date
    * Receipt filename (small gray text)
  - Three action buttons: "📝 View Transaction", "🔓 Unlink", "Delete"

---

### 4. View Transaction from Receipt

**Steps**:
1. Ensure you have at least one linked receipt
2. Click "📝 View Transaction" button (blue button)

**Expected Result**:
- Transaction modal opens
- All fields populated with transaction data
- Receipt picker shows the linked receipt
- You can edit and save changes

---

### 5. Unlink Receipt

**Steps**:
1. In Linked Receipts section, find a receipt
2. Click "🔓 Unlink" button (orange button)
3. Wait for operation to complete

**Expected Result**:
- Receipt **moves back to Unlinked section** at top
- Yellow border returns
- "⚠️ Not Linked" badge appears
- Warning banner count increases
- Transaction still exists but no longer has receipt attached

---

### 6. View Full-Size Receipt

**Steps**:
1. Click on any receipt thumbnail (in either section)

**Expected Result**:
- New browser tab opens
- Full-size receipt displays
- URL format: `http://localhost:5000/api/finance/receipts/files/[UUID]_[filename]`

**Alternative**:
- Click "View" button (in Unlinked section)

---

### 7. Delete Receipt

**Steps**:
1. Click "Delete" button on any receipt (red button)
2. Confirm deletion if prompted

**Expected Result**:
- Receipt immediately removed from gallery
- File deleted from server
- Database record removed
- If receipt was linked, transaction remains but receipt_id becomes null

---

### 8. Multiple Receipts Management

**Steps**:
1. Upload 5+ receipts of different types (images, PDFs, etc.)
2. Link 3 of them to transactions
3. Leave 2 unlinked

**Expected Result**:
- Yellow warning banner shows: "⚠️ 2 Receipts Need Linking"
- Unlinked section displays 2 receipts in grid
- Linked section shows: "✅ Linked Receipts (3)"
- Each section displays correctly formatted
- No layout overlap or CSS issues

---

### 9. Transaction List Receipt Display

**Steps**:
1. Go to "Transactions" tab
2. Find a transaction with a receipt attached

**Expected Result**:
- Small 50x50 thumbnail appears in transaction row
- 📎 icon visible next to amount
- Clicking thumbnail opens full receipt

---

### 10. Edge Cases

#### Test 10A: Upload Invalid File Type
**Steps**:
1. Try uploading .exe, .zip, or other unsupported file

**Expected Result**:
- Error message: "Invalid file type. Allowed: PNG, JPG, JPEG, PDF, HEIC, TXT, DOC, DOCX, EML, MSG"
- Upload fails gracefully
- No broken state

#### Test 10B: Large File Upload
**Steps**:
1. Upload a very large image (10MB+)

**Expected Result**:
- Upload succeeds or shows appropriate error
- No frontend crash
- Loading indicator visible during upload

#### Test 10C: Receipt Without Transaction
**Steps**:
1. Upload receipt
2. Try to link to transaction
3. Cancel modal without saving
4. Close transaction modal

**Expected Result**:
- Receipt remains in Unlinked section
- No orphaned data
- Can try linking again

#### Test 10D: Delete Linked Receipt
**Steps**:
1. Delete a receipt that's linked to a transaction
2. Go to Transactions tab
3. Find that transaction

**Expected Result**:
- Receipt deleted successfully
- Transaction still exists
- No broken thumbnail in transaction list
- No 404 errors in console

---

## Visual Verification Checklist

### Unlinked Section
- [ ] Yellow warning banner with count
- [ ] Yellow borders around all cards
- [ ] Grid layout (3-4 columns depending on screen width)
- [ ] "⚠️ Not Linked" badge on each card
- [ ] File type icons display correctly
- [ ] Image thumbnails load properly
- [ ] Error fallback works for broken images

### Linked Section
- [ ] Green checkmark header "✅ Linked Receipts"
- [ ] Horizontal list layout (one per row)
- [ ] 120x120 thumbnails (larger than unlinked)
- [ ] Transaction description in bold (18px)
- [ ] Amount in large font (20px, bold)
- [ ] Amount color: GREEN for income, RED for expense
- [ ] Category icon + name visible
- [ ] Account name visible
- [ ] Date formatted correctly
- [ ] Receipt filename in small gray text
- [ ] Three action buttons aligned vertically

### Action Buttons
- [ ] "🔗 Link to Transaction" - Green (#10b981)
- [ ] "📝 View Transaction" - Blue (#3b82f6)
- [ ] "🔓 Unlink" - Orange (#f59e0b)
- [ ] "View" - Default button style
- [ ] "Delete" - Red/danger style
- [ ] All buttons have hover effects
- [ ] All buttons clickable with clear feedback

---

## Browser Console Checks

### No Errors Expected
Open browser DevTools (F12) and check Console tab:
- [ ] No 404 errors for receipt files
- [ ] No CORS errors
- [ ] No React rendering errors
- [ ] No "undefined" property access errors

### Network Tab
- [ ] GET /api/finance/receipts returns 200 OK
- [ ] GET /api/finance/transactions returns 200 OK
- [ ] POST /api/finance/receipts/upload returns 201 Created
- [ ] PUT /api/finance/transactions/:id returns 200 OK (for linking)
- [ ] DELETE /api/finance/receipts/:id returns 200 OK

---

## Performance Tests

### Load Time
- [ ] Receipts tab loads within 1 second
- [ ] Images lazy-load properly
- [ ] No jank when scrolling

### Responsiveness
- [ ] Gallery adjusts to window resize
- [ ] Mobile view (narrow screen) shows single column
- [ ] Tablet view shows 2 columns
- [ ] Desktop shows 3-4 columns

---

## Accessibility Tests

### Keyboard Navigation
- [ ] Tab through all buttons
- [ ] Enter key triggers button actions
- [ ] Focus indicators visible

### Screen Reader
- [ ] Button labels are descriptive
- [ ] Images have alt text
- [ ] Section headers are semantic

---

## Data Integrity Tests

### Database Consistency
After all tests, check backend database:

```bash
cd "c:\Project Finance Tacker\backend"
python check_db.py
```

Verify:
- [ ] All uploaded receipts have records in `receipts` table
- [ ] Linked receipts have matching `receipt_id` in `transactions` table
- [ ] Deleted receipts removed from database
- [ ] File paths match actual files in `uploads/receipts/`

---

## Rollback Plan (If Issues Found)

If critical bugs discovered:

1. **Stop Servers**: CTRL+C in both terminals
2. **Git Status**: Check what files changed
3. **Revert Changes**: Use git to rollback if needed
4. **Report Issue**: Document what broke and when
5. **Debug**: Use browser DevTools and backend logs

---

## Success Criteria

✅ **Test passes if**:
- All file types upload successfully
- File type icons display correctly with appropriate colors
- Unlinked and Linked sections render properly
- Linking workflow works end-to-end
- Unlinking moves receipt back to workbench
- No console errors
- No broken images
- Transaction details display correctly
- All buttons functional

❌ **Test fails if**:
- Upload errors for supported file types
- Wrong icons or colors for file types
- Sections overlap or have layout issues
- Linking doesn't update UI
- Unlinking throws error
- Console shows errors
- Images don't load
- Buttons don't work

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark Task 1 & 5 as complete
2. 🎯 Move to **Task 2**: Visual thumbnail dropdown
3. 📱 Begin **Task 4**: Mobile inline camera integration

If issues found:
1. Document all bugs with screenshots
2. Prioritize by severity (critical, major, minor)
3. Fix critical bugs first
4. Re-test after fixes
5. Update documentation

---

**Testing Date**: _________________
**Tester**: _________________
**Results**: PASS / FAIL
**Notes**: 
_________________________________
_________________________________
_________________________________
