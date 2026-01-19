"""
Migration: Add keycloak_id to users table for Keycloak SSO
Run this before deploying Keycloak auth
"""

import sqlite3
import os

def migrate(db_path):
    """Add keycloak_id column to users table"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'keycloak_id' not in columns:
        print("Adding keycloak_id column to users table...")
        cursor.execute('ALTER TABLE users ADD COLUMN keycloak_id TEXT UNIQUE')
        conn.commit()
        print("Migration complete: keycloak_id column added")
    else:
        print("keycloak_id column already exists, skipping")
    
    # Make password_hash nullable for Keycloak users
    # SQLite doesn't support ALTER COLUMN, so we need to check if new users can have NULL password
    # For existing users with passwords, they'll still work
    # New Keycloak users won't have passwords
    
    conn.close()
    print("Migration finished")


if __name__ == '__main__':
    db_path = os.getenv('DATABASE_PATH', 'database.db')
    migrate(db_path)
