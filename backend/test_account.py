import sqlite3

conn = sqlite3.connect('database.db')

# Get the schema
schema = conn.execute('SELECT sql FROM sqlite_master WHERE name="accounts"').fetchone()
print('=== ACCOUNTS TABLE SCHEMA ===')
print(schema[0] if schema else 'No schema found')
print()

# Try to insert a test account
print('=== TESTING INSERT ===')
try:
    cursor = conn.execute('''
        INSERT INTO accounts (user_id, account_name, account_type, balance, is_active)
        VALUES (1, 'Test Cash', 'cash', 100.00, 1)
    ''')
    conn.commit()
    print(f'✓ Account created with ID: {cursor.lastrowid}')
    
    # Try to select it back
    account = conn.execute('SELECT * FROM accounts WHERE id = ?', (cursor.lastrowid,)).fetchone()
    print(f'✓ Retrieved account: {account}')
    
    # Clean up
    conn.execute('DELETE FROM accounts WHERE id = ?', (cursor.lastrowid,))
    conn.commit()
    print('✓ Test account deleted')
    
except Exception as e:
    print(f'✗ Error: {e}')

conn.close()
