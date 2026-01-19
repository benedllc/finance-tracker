#!/usr/bin/env python3
"""
Tax Tracking System Migration Script
Adds tables for multi-tier tax tracking, tax flags, and tax analytics
"""

import sqlite3
import os
import sys

# Get the backend directory
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BACKEND_DIR, 'database.db')
MIGRATION_FILE = os.path.join(BACKEND_DIR, 'migrations', 'add_tax_tracking.sql')

def run_migration():
    """Execute the tax tracking migration"""
    
    print("=" * 60)
    print("TAX TRACKING SYSTEM MIGRATION")
    print("=" * 60)
    print(f"\nDatabase: {DB_PATH}")
    print(f"Migration: {MIGRATION_FILE}")
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"\n❌ ERROR: Database not found at {DB_PATH}")
        return False
    
    # Check if migration file exists
    if not os.path.exists(MIGRATION_FILE):
        print(f"\n❌ ERROR: Migration file not found at {MIGRATION_FILE}")
        return False
    
    # Read migration SQL
    with open(MIGRATION_FILE, 'r') as f:
        migration_sql = f.read()
    
    try:
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("\n📊 Checking existing schema...")
        
        # Check what tables already exist
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN ('tax_types', 'receipt_taxes', 'item_tax_flags')
        """)
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        if existing_tables:
            print(f"⚠️  Found existing tax tables: {', '.join(existing_tables)}")
            response = input("\nThese tables will be recreated. Continue? (yes/no): ")
            if response.lower() != 'yes':
                print("\n❌ Migration cancelled")
                return False
        
        # Check if receipts table has total_tax_amount column
        cursor.execute("PRAGMA table_info(receipts)")
        columns = [row[1] for row in cursor.fetchall()]
        if 'total_tax_amount' in columns:
            print("✅ Column 'total_tax_amount' already exists in receipts table")
        
        print("\n🚀 Running migration...")
        
        # Execute migration
        cursor.executescript(migration_sql)
        conn.commit()
        
        print("\n✅ Migration completed successfully!")
        
        # Verify tables were created
        print("\n📋 Verifying tables...")
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN ('tax_types', 'receipt_taxes', 'item_tax_flags')
            ORDER BY name
        """)
        tables = cursor.fetchall()
        
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"  ✓ {table_name}: {count} rows")
        
        # Verify indexes
        print("\n📇 Verifying indexes...")
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='index' AND name LIKE 'idx_tax%' OR name LIKE '%_tax_%'
            ORDER BY name
        """)
        indexes = cursor.fetchall()
        print(f"  ✓ Created {len(indexes)} indexes")
        for idx in indexes:
            print(f"    - {idx[0]}")
        
        # Verify triggers
        print("\n⚡ Verifying triggers...")
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='trigger' AND name LIKE '%tax%'
            ORDER BY name
        """)
        triggers = cursor.fetchall()
        print(f"  ✓ Created {len(triggers)} triggers")
        for trigger in triggers:
            print(f"    - {trigger[0]}")
        
        conn.close()
        
        print("\n" + "=" * 60)
        print("✅ TAX TRACKING SYSTEM READY")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Update OCR extraction to populate tax data ✓ (Already done)")
        print("2. Update frontend to display and edit taxes")
        print("3. Update itemize endpoint to save tax data")
        print("4. Add tax analytics and reporting")
        
        return True
        
    except sqlite3.Error as e:
        print(f"\n❌ Database error: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
