"""
Quick script to fix all db = get_db() to use with statement
"""
import re

# Read the file
with open('app/routes/finance.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all functions that have db = get_db() and fix them
# This is a manual fix list based on what we know needs fixing

fixes = [
    # update_account - lines 80-133
    (
        '''@finance_bp.route('/accounts/<int:account_id>', methods=['PUT'])
@token_required
def update_account(current_user, account_id):
    """Update an account"""
    try:
        data = request.get_json()
        db = get_db()
        
        # Verify ownership
        account = db.execute('SELECT user_id FROM accounts WHERE id = ?', (account_id,)).fetchone()''',
        '''@finance_bp.route('/accounts/<int:account_id>', methods=['PUT'])
@token_required
def update_account(current_user, account_id):
    """Update an account"""
    try:
        data = request.get_json()
        with get_db() as db:
            # Verify ownership
            account = db.execute('SELECT user_id FROM accounts WHERE id = ?', (account_id,)).fetchone()'''
    ),
]

for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        print(f"Fixed a pattern")
    else:
        print(f"Pattern not found!")

# Write back
with open('app/routes/finance.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
