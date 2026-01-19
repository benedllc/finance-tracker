"""
Database migration to add phone and profile_picture to users table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, get_db

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    init_db(db_path)
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if columns exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Add phone column if it doesn't exist
        if 'phone' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN phone TEXT')
            print("✓ Added 'phone' column to users table")
        else:
            print("✓ 'phone' column already exists")
        
        # Add profile_picture column if it doesn't exist
        if 'profile_picture' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN profile_picture TEXT')
            print("✓ Added 'profile_picture' column to users table")
        else:
            print("✓ 'profile_picture' column already exists")
        
        conn.commit()
        print("\n✓ Migration completed successfully!")

if __name__ == '__main__':
    migrate()
