"""
Migration: Add SKU and enhanced receipt item fields
Adds future-proof product linking capabilities
"""
import sqlite3
from pathlib import Path

# Get database path
db_path = Path(__file__).parent / 'database.db'

print("=" * 80)
print("MIGRATION: Adding SKU and enhanced receipt fields")
print("=" * 80)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(receipt_items)")
    columns = [col[1] for col in cursor.fetchall()]
    
    # Add new columns if they don't exist
    migrations = [
        ("sku", "TEXT", "SKU/UPC/Product code"),
        ("quantity", "INTEGER DEFAULT 1", "Item quantity"),
        ("unit_price", "DECIMAL(10, 2)", "Price per unit"),
        ("tax_code", "TEXT", "Tax code (F/N/R)"),
        ("department", "TEXT", "Department code"),
    ]
    
    for column_name, column_type, description in migrations:
        if column_name not in columns:
            print(f"✅ Adding column: {column_name} ({description})")
            cursor.execute(f"ALTER TABLE receipt_items ADD COLUMN {column_name} {column_type}")
        else:
            print(f"⏭️  Column {column_name} already exists")
    
    # Add enhanced receipt metadata columns
    cursor.execute("PRAGMA table_info(receipts)")
    receipt_columns = [col[1] for col in cursor.fetchall()]
    
    receipt_migrations = [
        ("store_id", "TEXT", "Store number/ID"),
        ("store_address", "TEXT", "Store address"),
        ("store_phone", "TEXT", "Store phone"),
        ("transaction_time", "TEXT", "Transaction time"),
        ("terminal_id", "TEXT", "Terminal/register ID"),
        ("approval_code", "TEXT", "Payment approval code"),
        ("card_last_4", "TEXT", "Last 4 of card"),
        ("subtotal", "DECIMAL(10, 2)", "Subtotal before tax"),
        ("tax_amount", "DECIMAL(10, 2)", "Tax amount"),
    ]
    
    for column_name, column_type, description in receipt_migrations:
        if column_name not in receipt_columns:
            print(f"✅ Adding receipt column: {column_name} ({description})")
            cursor.execute(f"ALTER TABLE receipts ADD COLUMN {column_name} {column_type}")
        else:
            print(f"⏭️  Receipt column {column_name} already exists")
    
    conn.commit()
    print("\n" + "=" * 80)
    print("✅ Migration completed successfully!")
    print("=" * 80)
    print("\nYour database now supports:")
    print("  • SKU/UPC codes for product linking")
    print("  • Item quantities and unit prices")
    print("  • Tax codes and department tracking")
    print("  • Enhanced store and transaction metadata")
    print("  • Future-proof for product catalog integration")
    print("=" * 80)
    
except Exception as e:
    print(f"\n❌ Migration failed: {e}")
    conn.rollback()
finally:
    conn.close()
