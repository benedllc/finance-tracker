import sqlite3

db_path = 'database.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
db = conn.cursor()

print("=== RECEIPTS ===")
receipts = db.execute('SELECT id, file_name, user_id FROM receipts').fetchall()
for r in receipts:
    print(f"Receipt {r['id']}: {r['file_name']}")

print("\n=== TRANSACTIONS ===")
txns = db.execute('SELECT id, description, receipt_id FROM transactions').fetchall()
for t in txns:
    print(f"Transaction {t['id']}: {t['description']} - receipt_id={t['receipt_id']}")

print("\n=== LINKED RELATIONSHIPS ===")
linked = db.execute('''
    SELECT t.id as txn_id, t.description, r.id as receipt_id, r.file_name
    FROM transactions t
    JOIN receipts r ON t.receipt_id = r.id
''').fetchall()
if linked:
    for link in linked:
        print(f"Transaction {link['txn_id']} ({link['description']}) -> Receipt {link['receipt_id']} ({link['file_name']})")
else:
    print("NO LINKED RECEIPTS FOUND IN DATABASE!")

conn.close()
