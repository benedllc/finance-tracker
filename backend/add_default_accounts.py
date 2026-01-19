"""
Add default cash account for existing users who don't have any accounts
"""

import sqlite3

def add_default_accounts():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    db = conn.cursor()
    
    # Find users without any accounts
    users_without_accounts = db.execute('''
        SELECT u.id, u.username
        FROM users u
        LEFT JOIN accounts a ON u.id = a.user_id
        WHERE a.id IS NULL
        GROUP BY u.id
    ''').fetchall()
    
    if not users_without_accounts:
        print("✓ All users already have accounts")
        return
    
    print(f"Found {len(users_without_accounts)} users without accounts")
    
    # Create default cash account for each user
    for user in users_without_accounts:
        try:
            db.execute('''
                INSERT INTO accounts (user_id, account_name, account_type, balance, is_active)
                VALUES (?, 'Cash', 'cash', 0.00, 1)
            ''', (user['id'],))
            print(f"✓ Created default cash account for user: {user['username']}")
        except Exception as e:
            print(f"✗ Failed to create account for user {user['username']}: {e}")
    
    conn.commit()
    conn.close()
    print("✓ Migration completed!")

if __name__ == '__main__':
    add_default_accounts()
