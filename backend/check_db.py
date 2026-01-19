import sqlite3

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Check tables
tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print('=== Database Tables ===')
for table in tables:
    print(f'- {table[0]}')

# Check accounts table structure
print('\n=== Accounts Table Structure ===')
try:
    columns = cursor.execute("PRAGMA table_info(accounts)").fetchall()
    for col in columns:
        print(f'{col[1]} ({col[2]})')
except Exception as e:
    print(f'Accounts table does not exist: {e}')

# Check categories
print('\n=== Categories Count ===')
try:
    count = cursor.execute("SELECT COUNT(*) FROM categories").fetchone()[0]
    print(f'Total categories: {count}')
except Exception as e:
    print(f'Error: {e}')

conn.close()
