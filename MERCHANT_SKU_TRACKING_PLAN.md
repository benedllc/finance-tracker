# 🏪 Merchant & SKU Tracking Implementation Plan

## Overview
Building a system to track products (by SKU) per merchant location with price history and custom naming. This enables price trend analysis, merchant spending tracking, and personalized product names.

---

## 🎯 Core Problems Being Solved

### Problem 1: AI Extracting Store Name as Item
**Issue:** OpenAI Vision sees "Walmart" at top of receipt and adds it as an item with $0.00 price.

**Solution:** Update OCR prompt to explicitly exclude header/footer information from items list. Only extract actual products with prices > $0.

### Problem 2: SKU Numbers Are Store-Specific
**Issue:** Same UPC can exist across stores, but pricing is different. Need to track SKU per merchant.

**Solution:** Create `merchant_products` table with composite key: (user_id, merchant_id, sku)

### Problem 3: OCR Product Names Are Cryptic
**Issue:** "GV CREAMER" is not readable. User wants to rename to "Great Value French Vanilla Creamer"

**Solution:** User can rename products. System remembers custom names and auto-suggests on future receipts.

### Problem 4: Need Price Tracking Over Time
**Issue:** Want to know if prices are going up/down and by how much.

**Solution:** Store every price in `product_price_history` table. Calculate trends, averages, min/max.

### Problem 5: Multiple Store Locations
**Issue:** User shops at 3 different Walmarts. Need to track location-specific data.

**Solution:** Store full address in merchants table. "Walmart - 6234 W Glendale" vs "Walmart - 2501 W Happy Valley"

---

## 📊 Database Schema

### New Tables

```sql
-- Merchants with location tracking
CREATE TABLE merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,  -- "Walmart"
    address TEXT,        -- "6234 W Glendale Ave, Glendale, AZ 85301"
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    first_visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_visit_date DATETIME,
    total_visits INTEGER DEFAULT 1,
    total_spent DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, name, address)
);

-- Products per merchant (SKU-based tracking)
CREATE TABLE merchant_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    merchant_id INTEGER NOT NULL,
    sku TEXT NOT NULL,
    custom_name TEXT,      -- User's rename
    original_name TEXT,    -- Raw OCR text
    category_id INTEGER,
    first_seen_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_date DATETIME,
    times_purchased INTEGER DEFAULT 1,
    last_price DECIMAL(10,2),
    avg_price DECIMAL(10,2),
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE(user_id, merchant_id, sku)
);

-- Price history for trend analysis
CREATE TABLE product_price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_product_id INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    recorded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    receipt_id INTEGER,
    receipt_item_id INTEGER,
    FOREIGN KEY (merchant_product_id) REFERENCES merchant_products(id),
    FOREIGN KEY (receipt_id) REFERENCES receipts(id),
    FOREIGN KEY (receipt_item_id) REFERENCES receipt_items(id)
);
```

### Modified Tables

```sql
-- Add merchant link to receipts
ALTER TABLE receipts ADD COLUMN merchant_id INTEGER REFERENCES merchants(id);

-- Receipt items already have SKU fields (from previous migration)
-- No changes needed to receipt_items table
```

---

## 🔄 Data Flow

### Receipt Upload → Extraction Flow

```
1. User uploads receipt photo
   ↓
2. OpenAI Vision extracts:
   - Merchant name + address + phone
   - Items with SKU, description, prices
   - Subtotal, tax, total
   ↓
3. Find or create merchant record
   - Match by: user_id + name + address
   - Update: last_visit_date, total_visits
   ↓
4. For each item:
   - Find or create merchant_product (user_id + merchant_id + sku)
   - If exists: Show custom_name (if renamed)
   - If new: Show original_name from OCR
   ↓
5. User can:
   - Edit merchant name
   - Edit item SKU
   - Edit item price
   - Rename products (save to custom_name)
   ↓
6. On save itemization:
   - Update merchant: total_spent += receipt_total
   - Update merchant_products: times_purchased++, last_price, avg/min/max
   - Insert product_price_history records
```

---

## 🎨 UI Changes

### Itemization Modal - Item Row Layout

**Before:**
```
[✓] GV CREAMER SKU: 078742158100 $8.94
```

**After:**
```
┌────────────────────────────────────────────────────────────┐
│ [✓] Great Value French Vanilla Creamer                    │
│     ┌────────────────┐              ┌──────────┐          │
│     │ SKU: 078742    │              │ $ 8.94   │          │
│     │ 158100         │              │   [edit] │          │
│     └────────────────┘              └──────────┘          │
│     🏷️ Groceries                                           │
│     💡 Last purchase: $8.94 (2 weeks ago)                  │
└────────────────────────────────────────────────────────────┘
```

Layout:
- Left 50%: Item description + category
- Center 25%: SKU field (editable)
- Right 25%: Price (editable)

### Product Renaming UI

**First Time Seeing Product:**
```
┌────────────────────────────────────────┐
│ ⚠️ GV CREAMER                         │  ← Gray/plain text
│    SKU: 078742158100                  │
│    $8.94                               │
│    [✏️ Rename This Product]            │
└────────────────────────────────────────┘
```

**After User Renames:**
```
┌────────────────────────────────────────┐
│ ✨ Great Value French Vanilla Creamer │  ← Blue/highlighted
│    SKU: 078742158100                  │
│    $8.94                               │
│    💬 You named this                   │
│    [✏️ Edit Name]                      │
└────────────────────────────────────────┘
```

**Next Purchase (Price Changed):**
```
┌────────────────────────────────────────┐
│ ✨ Great Value French Vanilla Creamer │
│    SKU: 078742158100                  │
│    $9.49  ⚠️ +$0.55 (6.2%)            │
│    📊 Last: $8.94 (Nov 1)             │
│    [View Price History]                │
└────────────────────────────────────────┘
```

---

## 🚀 Implementation Order

### Phase 1: Database & OCR Fixes (NOW)
1. ✅ Create migration file with new tables
2. ✅ Run migration
3. ✅ Fix OCR prompt to exclude merchant as item
4. ✅ Update OCR to extract merchant address/phone
5. ✅ Test with existing receipt

### Phase 2: Merchant Tracking (NEXT)
6. Create/update merchant on receipt save
7. Link receipts to merchants
8. Update receipts table schema

### Phase 3: Product Tracking (AFTER)
9. Create merchant_products on itemization
10. Lookup existing products by SKU+merchant
11. Display custom names when available

### Phase 4: Renaming System (THEN)
12. Add "Rename Product" button to UI
13. API endpoint for renaming
14. Visual indicators for renamed products
15. Auto-suggest renamed products on future receipts

### Phase 5: Price History (FINALLY)
16. Record prices to price_history table
17. Calculate price trends
18. Show "Last purchased" info
19. Show price change alerts

---

## 🎯 Success Metrics

After implementation, user should be able to:
- ✅ Extract receipt without merchant appearing as $0 item
- ✅ See full merchant name + address
- ✅ Rename "GV CREAMER" → "Great Value French Vanilla Creamer"
- ✅ See custom name auto-populate on next receipt
- ✅ Track that Walmart #1 has lower prices than Walmart #2
- ✅ Get alerts when product price increases
- ✅ View price history chart for any product
- ✅ See all products purchased at specific merchant
- ✅ See all receipts from specific merchant location

---

## 📝 Notes

- SKU numbers are store-specific, not universal UPCs in most cases
- Merchant matching uses: name + address (not just name)
- User can manually edit any field during itemization
- Price history is immutable (never delete, always append)
- Custom names are per user (private, not shared)

---

## 🔮 Future Enhancements (Not Now)

- External UPC database lookup (UPCitemdb API)
- Price comparison across merchants
- "Best time to buy" predictions
- Merchants page with spending analytics
- Price trends visualization charts
- Automatic merchant location detection via GPS
- Barcode scanning for SKU lookup
