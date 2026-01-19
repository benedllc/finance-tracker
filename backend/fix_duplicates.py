import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'database.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Finding duplicate receipt assignments...")

# Find transactions with duplicate receipts
duplicates = cursor.execute('''
    SELECT receipt_id, GROUP_CONCAT(id) as transaction_ids, COUNT(*) as count
    FROM transactions
    WHERE receipt_id IS NOT NULL
    GROUP BY receipt_id
    HAVING count > 1
''').fetchall()

if duplicates:
    print(f"\nFound {len(duplicates)} receipts linked to multiple transactions:")
    for dup in duplicates:
        receipt_id = dup[0]
        trans_ids = dup[1].split(',')
        count = dup[2]
        print(f"\nReceipt ID {receipt_id} is linked to {count} transactions: {trans_ids}")
        
        # Keep the first transaction, unlink the rest
        print(f"Keeping transaction {trans_ids[0]}, unlinking the others...")
        for trans_id in trans_ids[1:]:
            cursor.execute('UPDATE transactions SET receipt_id = NULL WHERE id = ?', (trans_id,))
            print(f"  - Unlinked transaction {trans_id}")
    
    conn.commit()
    print("\n✅ Fixed all duplicate receipt assignments!")
else:
    print("✅ No duplicate receipt assignments found")

# Show final state
print("\n=== FINAL STATE ===")
receipts_with_trans = cursor.execute('''
    SELECT r.id, r.file_name, t.id as trans_id, t.description
    FROM receipts r
    LEFT JOIN transactions t ON r.id = t.receipt_id
    ORDER BY r.id
''').fetchall()

for row in receipts_with_trans:
    if row[2]:  # has transaction
        print(f"Receipt {row[0]} ({row[1]}) -> Transaction {row[2]} ({row[3] or 'no description'})")
    else:
        print(f"Receipt {row[0]} ({row[1]}) -> NOT LINKED")

conn.close()
print("\n✅ Database cleanup complete!")
