-- Tax Tracking System Migration
-- Supports multi-tier tax rates (TAX1 9.2%, TAX2 2.5%, etc.)
-- Tracks tax flags per item (F=food, R=regular, T=tobacco, N=non-taxable)
-- Enables tax analytics and reporting

-- Table 1: Tax Types (reusable tax definitions)
CREATE TABLE IF NOT EXISTS tax_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tax_code TEXT NOT NULL,  -- TAX1, TAX2, STATE, CITY, etc.
    tax_name TEXT NOT NULL,  -- "State Sales Tax", "Food Tax", "City Tax"
    default_rate REAL,  -- Default percentage rate (9.20, 2.50, etc.)
    description TEXT,  -- "Non-food items at 9.2%"
    is_active INTEGER DEFAULT 1,  -- Soft delete flag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, tax_code)  -- One TAX1 per user
);

-- Table 2: Receipt Taxes (actual taxes applied to specific receipts)
CREATE TABLE IF NOT EXISTS receipt_taxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id INTEGER NOT NULL,
    tax_type_id INTEGER,  -- NULL if not matched to a tax_type
    tax_code TEXT NOT NULL,  -- TAX1, TAX2, STATE, etc.
    tax_description TEXT,  -- "State Sales Tax"
    tax_rate REAL,  -- Actual rate applied (9.20, 2.50)
    tax_amount REAL NOT NULL,  -- Dollar amount ($9.37, $2.84)
    taxable_subtotal REAL,  -- Subtotal this tax was calculated on
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (tax_type_id) REFERENCES tax_types(id) ON DELETE SET NULL
);

-- Table 3: Item Tax Flags (which tax applies to each item)
CREATE TABLE IF NOT EXISTS item_tax_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_item_id INTEGER NOT NULL,
    tax_flag TEXT,  -- F, R, T, N (Food, Regular, Tobacco, Non-taxable)
    tax_type_id INTEGER,  -- Which tax this flag corresponds to
    is_taxable INTEGER DEFAULT 1,  -- 0 for N (non-taxable)
    item_tax_amount REAL,  -- Calculated tax for this item
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receipt_item_id) REFERENCES receipt_items(id) ON DELETE CASCADE,
    FOREIGN KEY (tax_type_id) REFERENCES tax_types(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tax_types_user ON tax_types(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_types_code ON tax_types(tax_code);
CREATE INDEX IF NOT EXISTS idx_receipt_taxes_receipt ON receipt_taxes(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_taxes_type ON receipt_taxes(tax_type_id);
CREATE INDEX IF NOT EXISTS idx_item_tax_flags_item ON item_tax_flags(receipt_item_id);
CREATE INDEX IF NOT EXISTS idx_item_tax_flags_type ON item_tax_flags(tax_type_id);

-- Add column to receipts table for quick tax total lookup (denormalized for performance)
ALTER TABLE receipts ADD COLUMN total_tax_amount REAL DEFAULT 0;

-- Trigger to update receipts.total_tax_amount when receipt_taxes changes
CREATE TRIGGER IF NOT EXISTS update_receipt_tax_total
AFTER INSERT ON receipt_taxes
BEGIN
    UPDATE receipts
    SET total_tax_amount = (
        SELECT COALESCE(SUM(tax_amount), 0)
        FROM receipt_taxes
        WHERE receipt_id = NEW.receipt_id
    )
    WHERE id = NEW.receipt_id;
END;

-- Trigger for DELETE
CREATE TRIGGER IF NOT EXISTS update_receipt_tax_total_delete
AFTER DELETE ON receipt_taxes
BEGIN
    UPDATE receipts
    SET total_tax_amount = (
        SELECT COALESCE(SUM(tax_amount), 0)
        FROM receipt_taxes
        WHERE receipt_id = OLD.receipt_id
    )
    WHERE id = OLD.receipt_id;
END;

-- Trigger for UPDATE
CREATE TRIGGER IF NOT EXISTS update_receipt_tax_total_update
AFTER UPDATE ON receipt_taxes
BEGIN
    UPDATE receipts
    SET total_tax_amount = (
        SELECT COALESCE(SUM(tax_amount), 0)
        FROM receipt_taxes
        WHERE receipt_id = NEW.receipt_id
    )
    WHERE id = NEW.receipt_id;
END;
