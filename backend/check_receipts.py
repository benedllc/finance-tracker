import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'database.db')
print(f"Database path: {db_path}")
print(f"Database exists: {os.path.exists(db_path)}")

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check receipts
    receipts = cursor.execute('SELECT id, file_name, user_id FROM receipts ORDER BY id').fetchall()
    print(f"\n=== RECEIPTS ({len(receipts)} total) ===")
    for r in receipts:
        print(f"ID: {r[0]}, File: {r[1]}, User: {r[2]}")
    
    # Check for duplicates
    duplicates = cursor.execute('''
        SELECT file_name, COUNT(*) as count 
        FROM receipts 
        GROUP BY file_name 
        HAVING count > 1
    ''').fetchall()
    
    if duplicates:
        print(f"\n=== DUPLICATE FILE NAMES ({len(duplicates)}) ===")
        for dup in duplicates:
            print(f"{dup[0]}: {dup[1]} copies")
    else:
        print("\nNo duplicate file names found")
    
    # Check transactions with receipts
    trans_with_receipts = cursor.execute('''
        SELECT t.id, t.description, t.receipt_id, r.file_name
        FROM transactions t
        JOIN receipts r ON t.receipt_id = r.id
        ORDER BY t.id
    ''').fetchall()
    
    print(f"\n=== TRANSACTIONS WITH RECEIPTS ({len(trans_with_receipts)}) ===")
    for t in trans_with_receipts:
        print(f"Trans ID: {t[0]}, Desc: {t[1]}, Receipt ID: {t[2]}, File: {t[3]}")
    
    conn.close()
else:
    print("Database file not found!")
