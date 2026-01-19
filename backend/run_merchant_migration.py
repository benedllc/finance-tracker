"""
Run merchant tracking migration
"""
import sqlite3
import os
from pathlib import Path

def run_migration():
    # Get database path
    backend_dir = Path(__file__).parent
    db_path = backend_dir / 'database.db'
    migration_path = backend_dir / 'migrations' / 'add_merchant_location_tracking.sql'
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        return False
    
    if not migration_path.exists():
        print(f"❌ Migration file not found at {migration_path}")
        return False
    
    try:
        # Read migration SQL
        with open(migration_path, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        # Connect to database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        print("🔄 Running merchant tracking migration...")
        
        # Execute migration
        cursor.executescript(migration_sql)
        conn.commit()
        
        print("✅ Migration completed successfully")
        
        # Verify tables created
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN ('merchants', 'merchant_products', 'product_price_history')
            ORDER BY name
        """)
        tables = cursor.fetchall()
        
        print(f"\n📊 Created tables: {len(tables)}")
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table[0]})")
            columns = cursor.fetchall()
            print(f"\n  {table[0]}:")
            for col in columns:
                print(f"    - {col[1]} ({col[2]})")
        
        # Verify indexes
        cursor.execute("""
            SELECT name, tbl_name FROM sqlite_master 
            WHERE type='index' AND tbl_name IN ('merchants', 'merchant_products', 'product_price_history', 'receipts')
            AND name NOT LIKE 'sqlite_%'
            ORDER BY tbl_name, name
        """)
        indexes = cursor.fetchall()
        
        print(f"\n📑 Created indexes: {len(indexes)}")
        for idx in indexes:
            print(f"  - {idx[0]} on {idx[1]}")
        
        # Check if merchant_id column added to receipts
        cursor.execute("PRAGMA table_info(receipts)")
        receipt_columns = cursor.fetchall()
        has_merchant_id = any(col[1] == 'merchant_id' for col in receipt_columns)
        
        if has_merchant_id:
            print("\n✅ merchant_id column added to receipts table")
        else:
            print("\n⚠️ WARNING: merchant_id column NOT found in receipts table")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == '__main__':
    success = run_migration()
    exit(0 if success else 1)
