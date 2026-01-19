# Test Receipt Sample

If you want to test the itemization feature before installing Tesseract, here's a sample receipt text you can use to understand the expected format:

## Sample Receipt Text (What Tesseract Would Extract):

```
WALMART SUPERCENTER
123 MAIN ST
ANYTOWN, USA 12345

DATE: 11/09/2025  TIME: 14:30

GROCERIES
MILK 2% GAL          $3.99
BREAD WHEAT          $2.50
EGGS LARGE 12CT      $4.25
BANANAS LB           $1.20

HOUSEHOLD
PAPER TOWELS 6PK     $12.99
DISH SOAP            $3.75

PHARMACY
ASPIRIN 100CT        $8.50

SUBTOTAL             $37.18
TAX                  $2.82
TOTAL                $40.00

PAYMENT: VISA ****1234
THANK YOU FOR SHOPPING!
```

## How Itemization Would Work:

### Step 1: Extract Text
System detects all lines above.

### Step 2: User Confirms Total
User clicks "Set as Total" on the line: `TOTAL                $40.00`

### Step 3: User Deselects Non-Items
User deselects:
- "WALMART SUPERCENTER"
- "123 MAIN ST"
- "DATE: 11/09/2025  TIME: 14:30"
- "GROCERIES" (section header)
- "HOUSEHOLD" (section header)
- "PHARMACY" (section header)
- "SUBTOTAL             $37.18"
- "TAX                  $2.82"
- "PAYMENT: VISA ****1234"
- "THANK YOU FOR SHOPPING!"

### Step 4: User Selects Items & Assigns Categories

**Food Items** (Category: Groceries)
- ✅ MILK 2% GAL          $3.99
- ✅ BREAD WHEAT          $2.50
- ✅ EGGS LARGE 12CT      $4.25
- ✅ BANANAS LB           $1.20

**Household Items** (Category: Household)
- ✅ PAPER TOWELS 6PK     $12.99
- ✅ DISH SOAP            $3.75

**Pharmacy Items** (Category: Health)
- ✅ ASPIRIN 100CT        $8.50

### Step 5: Validation
```
Item Total: $3.99 + $2.50 + $4.25 + $1.20 + $12.99 + $3.75 + $8.50 = $37.18
Transaction Amount: $40.00
Difference: $2.82 (TAX not itemized - EXPECTED)
```

**Result**: ⚠️ Validation would fail because items total $37.18 but transaction is $40.00.

### Solution Options:

**Option A**: Include TAX as an item (category: Taxes)
- Select "TAX                  $2.82"
- Assign to "Taxes" category
- New total: $37.18 + $2.82 = $40.00 ✅

**Option B**: Adjust transaction amount to match pre-tax total
- Change transaction from $40.00 to $37.18
- Then itemization will match ✅

---

## Sample Receipt for Testing (Create as Image)

You can create a simple text image receipt for testing:

```
TARGET
456 OAK AVE
PORTLAND, OR 97205

11/09/2025  3:45 PM

CEREAL CHEERIOS     $5.49
ORANGE JUICE        $4.25
YOGURT 6PK          $3.99
TOOTHPASTE          $2.75

SUBTOTAL           $16.48
TAX (8.5%)          $1.40
TOTAL              $17.88

VISA ****5678
THANK YOU!
```

Save this as a PNG or JPG using any text-to-image tool, then test:
1. Upload to Bened Finance
2. Link to transaction ($17.88)
3. Click "Extract Text & Itemize"
4. Confirm total line
5. Select items, assign categories
6. Save!

---

## Expected Database Result:

After successful itemization:

```sql
SELECT * FROM receipt_items WHERE receipt_id = 7;
```

Would return:

| id | receipt_id | transaction_id | item_description | amount | category_id |
|----|------------|----------------|------------------|--------|-------------|
| 1  | 7          | 5              | MILK 2% GAL          | 3.99   | 2 (Groceries) |
| 2  | 7          | 5              | BREAD WHEAT          | 2.50   | 2 (Groceries) |
| 3  | 7          | 5              | EGGS LARGE 12CT      | 4.25   | 2 (Groceries) |
| 4  | 7          | 5              | BANANAS LB           | 1.20   | 2 (Groceries) |
| 5  | 7          | 5              | PAPER TOWELS 6PK     | 12.99  | 8 (Household) |
| 6  | 7          | 5              | DISH SOAP            | 3.75   | 8 (Household) |
| 7  | 7          | 5              | ASPIRIN 100CT        | 8.50   | 7 (Health) |
| 8  | 7          | 5              | TAX                  | 2.82   | 10 (Taxes) |

Total: $40.00 ✅ Matches transaction amount!

---

This system will revolutionize how users track spending by category! 🎯
