-- Migration: Add Merchant Location & SKU Tracking
-- Purpose: Enable tracking products by SKU per merchant with price history
-- Created: 2024
-- Dependencies: Requires receipts, receipt_items tables

-- Merchants table with location tracking
CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    first_visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_visit_date DATETIME,
    total_visits INTEGER DEFAULT 1,
    total_spent DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name, address)
);

CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_name ON merchants(name);

-- Merchant products with SKU tracking
CREATE TABLE IF NOT EXISTS merchant_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    merchant_id INTEGER NOT NULL,
    sku TEXT NOT NULL,
    custom_name TEXT,
    original_name TEXT,
    category_id INTEGER,
    first_seen_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_date DATETIME,
    times_purchased INTEGER DEFAULT 1,
    last_price DECIMAL(10,2),
    avg_price DECIMAL(10,2),
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    UNIQUE(user_id, merchant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_merchant_products_user_merchant ON merchant_products(user_id, merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_products_sku ON merchant_products(sku);
CREATE INDEX IF NOT EXISTS idx_merchant_products_merchant ON merchant_products(merchant_id);

-- Product price history for trend analysis
CREATE TABLE IF NOT EXISTS product_price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_product_id INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    recorded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    receipt_id INTEGER,
    receipt_item_id INTEGER,
    FOREIGN KEY (merchant_product_id) REFERENCES merchant_products(id) ON DELETE CASCADE,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE SET NULL,
    FOREIGN KEY (receipt_item_id) REFERENCES receipt_items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON product_price_history(merchant_product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON product_price_history(recorded_date);
CREATE INDEX IF NOT EXISTS idx_price_history_receipt ON product_price_history(receipt_id);

-- Add merchant_id to receipts table
ALTER TABLE receipts ADD COLUMN merchant_id INTEGER REFERENCES merchants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_receipts_merchant ON receipts(merchant_id);
