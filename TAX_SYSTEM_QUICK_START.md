# 🚀 Tax System Quick Start Guide

## ✅ What's Been Implemented

### Complete Tax Tracking System
- **Multi-tier tax support**: TAX1, TAX2, TAX3, etc. with individual rates
- **Item-level tax flags**: F (food), R (regular), T (tobacco), N (non-taxable)
- **Editable tax breakdown UI**: Add, edit, remove tax entries
- **Real-time validation**: Visual feedback when totals match or mismatch
- **Full database persistence**: All tax data saved with referential integrity

---

## 🧪 How to Test

### Test 1: Receipt with Multi-Tier Taxes (Walmart)

1. **Start the servers** (if not already running):
   ```powershell
   # Backend
   cd "c:\Project Finance Tacker\backend"
   python run.py
   
   # Frontend (separate terminal)
   cd "c:\Project Finance Tacker\web"
   npm run dev
   ```

2. **Navigate to Finance page** (http://localhost:5173)

3. **Find a receipt** in the receipts list (or upload a new one)

4. **Click "Extract Text with AI"**

5. **Review the Tax Breakdown section**:
   - Should show extracted taxes (e.g., TAX1 9.20% $9.37)
   - Should show TAX2 if present (e.g., TAX2 2.50% $2.84)
   - Tax amounts should be editable

6. **Check Item Tax Flags**:
   - Look for colored badges next to SKU field
   - Green "F" badge = Food item (2.5% tax)
   - Yellow "R" badge = Regular item (9.2% tax)

7. **Verify Summary Calculation**:
   - Subtotal (Items): Sum of all item prices
   - Tax: Sum of all tax amounts
   - Receipt Total: Should match subtotal + tax
   - Look for green ✅ checkmark if totals match
   - Look for red ⚠️ warning if mismatch

8. **Save Itemization**:
   - Assign categories to all items
   - Click "Save Itemization"
   - System validates: Items + Taxes = Receipt Total = Transaction Amount

---

### Test 2: Manual Tax Entry

1. **Extract a receipt** that has no taxes detected

2. **Click "+ Add Tax Line"** in Tax Breakdown section

3. **Enter tax details**:
   - Code: "STATE"
   - Rate: "8.5"
   - Amount: "10.50"
   - Description: "State Sales Tax"

4. **Verify validation**:
   - Summary should update to show $10.50 tax
   - Validation warning should appear if total doesn't match

5. **Add another tax** (optional):
   - Click "+ Add Tax Line" again
   - Code: "CITY"
   - Rate: "1.5"
   - Amount: "1.85"
   - Description: "City Tax"

6. **Delete a tax line**:
   - Click 🗑️ button next to any tax
   - Verify total recalculates

7. **Save and verify**:
   - Click "Save Itemization"
   - Check database has both tax entries

---

### Test 3: Tax Editing

1. **Extract receipt** with AI

2. **OCR extracts wrong tax amount** (e.g., $9.35 instead of $9.37)

3. **Edit the tax amount**:
   - Click in the amount field
   - Change to correct value: "9.37"
   - Watch summary recalculate in real-time

4. **Verify validation updates**:
   - Red warning should disappear if totals now match
   - Green checkmark should appear

5. **Save corrected data**

---

## 🎨 Visual Indicators

### Tax Flag Badges
- 🟢 **F** (Food): Green background, #065f46 text
- 🟡 **R** (Regular): Yellow/amber background, #92400e text  
- 🔴 **T** (Tobacco): Red background, #991b1b text
- ⚪ **N** (Non-taxable): Gray background, #475569 text

### Validation Status
- ✅ **Green Checkmark**: Items + Taxes = Receipt Total (perfect match)
- ⚠️ **Red Warning**: Mismatch detected with detailed breakdown

### Tax Breakdown Section
- 🎨 **Gradient background**: Yellow/amber theme (#fef3c7 to #fde68a)
- 💰 **Header icon**: Makes section visually distinct
- ➕ **Add Tax Line**: Orange button in header
- 🗑️ **Delete buttons**: Red delete button for each tax line

---

## 🗄️ What's Saved in Database

### receipt_taxes Table
```
receipt_id | tax_code | tax_description | tax_rate | tax_amount
-----------|----------|-----------------|----------|------------
11         | TAX1     | State Sales Tax | 9.20     | 9.37
11         | TAX2     | Food Tax        | 2.50     | 2.84
```

### item_tax_flags Table
```
receipt_item_id | tax_flag | is_taxable
----------------|----------|------------
145             | F        | 1
146             | F        | 1
147             | R        | 1
148             | R        | 1
```

### receipts Table (updated)
```
id | ... | merchant_name | total_tax_amount
---|-----|---------------|------------------
11 | ... | Walmart       | 12.21
```

---

## 🐛 Troubleshooting

### Issue: No taxes extracted
**Solution**: 
1. Check if receipt has visible tax lines
2. Use "+ Add Tax Line" to add manually
3. Old receipts might use tax1/tax2 fields (still supported)

### Issue: Tax flag badges not showing
**Solution**:
1. Verify OCR extracted tax_flag field (check browser console)
2. Some receipts don't show flags - normal for some stores
3. Tax flags are optional - system works without them

### Issue: Totals don't match
**Solution**:
1. Check if all items are selected
2. Verify tax amounts are correct
3. System allows ±$0.01 tolerance for rounding
4. Confirm dialog shows detailed breakdown - use to identify mismatch

### Issue: "Items + Taxes ≠ Receipt Total" on save
**Solution**:
1. Red warning box shows exact mismatch amount
2. Edit tax amounts or item prices to fix
3. Or adjust receipt total if OCR extracted wrong total
4. System enforces validation to prevent data corruption

---

## 🔍 Inspect Database

### View all taxes for a receipt:
```powershell
cd "c:\Project Finance Tacker\backend"
python -c "import sqlite3; conn = sqlite3.connect('database.db'); cursor = conn.cursor(); cursor.execute('SELECT * FROM receipt_taxes WHERE receipt_id = 11'); print('\n'.join([str(r) for r in cursor.fetchall()])); conn.close()"
```

### View tax flags for items:
```powershell
python -c "import sqlite3; conn = sqlite3.connect('database.db'); cursor = conn.cursor(); cursor.execute('SELECT ri.item_description, itf.tax_flag FROM receipt_items ri JOIN item_tax_flags itf ON ri.id = itf.receipt_item_id WHERE ri.receipt_id = 11'); print('\n'.join([f'{r[0]}: {r[1]}' for r in cursor.fetchall()])); conn.close()"
```

### Check receipt total tax:
```powershell
python -c "import sqlite3; conn = sqlite3.connect('database.db'); cursor = conn.cursor(); cursor.execute('SELECT id, merchant_name, total_tax_amount FROM receipts WHERE id = 11'); print(cursor.fetchone()); conn.close()"
```

---

## 📊 Expected Test Results

### Walmart Receipt (#11):
- **Items**: 18 items totaling $117.48
- **TAX1**: 9.20% = $9.37 (non-food items)
- **TAX2**: 2.50% = $2.84 (food items)
- **Total**: $117.48 + $12.21 = $129.69 ✅
- **Tax Flags**: Mix of F and R badges
- **Validation**: Green checkmark (totals match)

### Manual Entry Test:
- **Add 2 tax lines**: STATE 8.5% $10.50, CITY 1.5% $1.85
- **Total Tax**: $12.35
- **Items**: $145.50
- **Expected Total**: $157.85
- **Validation**: Green if receipt total matches

---

## ✅ Success Criteria

1. ✅ Tax Breakdown section renders with extracted taxes
2. ✅ Tax amounts are editable (type in field, value updates)
3. ✅ "+ Add Tax Line" creates new editable row
4. ✅ 🗑️ button removes tax line
5. ✅ Tax flag badges appear next to SKU (F, R, T, N)
6. ✅ Summary shows: Subtotal + Tax = Total
7. ✅ Green checkmark when totals match
8. ✅ Red warning when totals mismatch
9. ✅ Save stores all data in database tables
10. ✅ Validation enforces: Items + Taxes = Receipt Total

---

## 🎯 Next Steps (Future)

### Still TODO:
1. **Replace window.confirm() with custom modal** (UX improvement)
2. **"View/Edit Itemization" for already-processed receipts** (allow re-editing)
3. **Tax analytics dashboard** (reports, trends, export)
4. **Merchant tracking integration** (link SKUs to merchants)

### To Start Testing:
```powershell
# Backend
cd "c:\Project Finance Tacker\backend"
python run.py

# Frontend (new terminal)
cd "c:\Project Finance Tacker\web"
npm run dev
```

Then go to: http://localhost:5173 → Finance → Click receipt → Extract Text with AI

---

**STATUS**: Ready for testing! 🚀
**All core tax features implemented and functional.**
