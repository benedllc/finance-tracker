import sqlite3

conn = sqlite3.connect('database.db')
conn.row_factory = sqlite3.Row
result = conn.execute('SELECT id, description, receipt_id FROM transactions ORDER BY id').fetchall()

print('\nTransactions:')
for r in result:
    row = dict(r)
    print(f"ID: {row['id']}, Description: {row['description']}, receipt_id: {row['receipt_id']}")

conn.close()
