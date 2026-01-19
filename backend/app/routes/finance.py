"""
Finance Tracker Routes
Provides API endpoints for accounts, transactions, categories, and budgets
"""

from flask import Blueprint, request, jsonify, send_file
from app.utils.auth import token_required
from app.database import get_db
from datetime import datetime
import os

finance_bp = Blueprint('finance', __name__)


# ============================================
# ACCOUNTS ENDPOINTS
# ============================================

@finance_bp.route('/accounts', methods=['GET'])
@token_required
def get_accounts(current_user):
    """Get all accounts for the current user"""
    try:
        with get_db() as db:
            accounts = db.execute('''
                SELECT id, account_name as name, account_type as type, balance, 
                       'USD' as currency, is_active, created_at
                FROM accounts
                WHERE user_id = ?
                ORDER BY created_at DESC
            ''', (current_user.id,)).fetchall()
            
            return jsonify({
                'accounts': [dict(row) for row in accounts]
            }), 200
    except Exception as e:
        print(f"Error fetching accounts: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch accounts'}), 500


@finance_bp.route('/accounts', methods=['POST'])
@token_required
def create_account(current_user):
    """Create a new account"""
    try:
        data = request.get_json()
        name = data.get('name')
        account_type = data.get('type', 'cash')
        balance = float(data.get('balance', 0))
        
        if not name:
            return jsonify({'error': 'Account name is required'}), 400
        
        with get_db() as db:
            cursor = db.execute('''
                INSERT INTO accounts (user_id, account_name, account_type, balance, is_active)
                VALUES (?, ?, ?, ?, 1)
            ''', (current_user.id, name, account_type, balance))
            db.commit()
            
            # Get the created account
            account = db.execute('''
                SELECT id, account_name as name, account_type as type, balance, 
                       'USD' as currency, is_active, created_at
                FROM accounts WHERE id = ?
            ''', (cursor.lastrowid,)).fetchone()
            
            return jsonify({
                'message': 'Account created successfully',
                'account': dict(account)
            }), 201
    except Exception as e:
        print(f"Error creating account: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to create account'}), 500


@finance_bp.route('/accounts/<int:account_id>', methods=['PUT'])
@token_required
def update_account(current_user, account_id):
    """Update an account"""
    try:
        data = request.get_json()
        
        with get_db() as db:
            # Verify ownership
            account = db.execute('SELECT user_id FROM accounts WHERE id = ?', (account_id,)).fetchone()
            if not account or account['user_id'] != current_user.id:
                return jsonify({'error': 'Account not found'}), 404
            
            # Build update query
            update_fields = []
            values = []
            
            if 'name' in data:
                update_fields.append('account_name = ?')
                values.append(data['name'])
            if 'type' in data:
                update_fields.append('account_type = ?')
                values.append(data['type'])
            if 'balance' in data:
                update_fields.append('balance = ?')
                values.append(float(data['balance']))
            if 'is_active' in data:
                update_fields.append('is_active = ?')
                values.append(1 if data['is_active'] else 0)
            
            if not update_fields:
                return jsonify({'error': 'No fields to update'}), 400
            
            values.append(account_id)
            db.execute(f'''
                UPDATE accounts
                SET {', '.join(update_fields)}
                WHERE id = ?
            ''', values)
            db.commit()
            
            # Get updated account
            updated = db.execute('''
                SELECT id, account_name as name, account_type as type, balance, 
                       'USD' as currency, is_active, created_at
                FROM accounts WHERE id = ?
            ''', (account_id,)).fetchone()
            
            return jsonify({
                'message': 'Account updated successfully',
                'account': dict(updated)
            }), 200
    except Exception as e:
        print(f"Error updating account: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to update account'}), 500


@finance_bp.route('/accounts/<int:account_id>', methods=['DELETE'])
@token_required
def delete_account(current_user, account_id):
    """Delete (deactivate) an account"""
    try:
        with get_db() as db:
            # Verify ownership
            account = db.execute('SELECT user_id FROM accounts WHERE id = ?', (account_id,)).fetchone()
            if not account or account['user_id'] != current_user.id:
                return jsonify({'error': 'Account not found'}), 404
            
            # Soft delete by setting is_active to 0
            db.execute('UPDATE accounts SET is_active = 0 WHERE id = ?', (account_id,))
            db.commit()
            
            return jsonify({'message': 'Account deactivated successfully'}), 200
    except Exception as e:
        print(f"Error deleting account: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to delete account'}), 500


@finance_bp.route('/accounts/<int:account_id>/permanent', methods=['DELETE'])
@token_required
def permanently_delete_account(current_user, account_id):
    """Permanently delete an account and all its transactions"""
    print(f"=== PERMANENT DELETE REQUEST: account_id={account_id}, user={current_user.id} ===")
    try:
        with get_db() as db:
            # Verify ownership
            account = db.execute('SELECT user_id FROM accounts WHERE id = ?', (account_id,)).fetchone()
            if not account or account['user_id'] != current_user.id:
                print(f"Account not found or not owned by user")
                return jsonify({'error': 'Account not found'}), 404
            
            print(f"Deleting transactions for account {account_id}...")
            # Delete all transactions associated with this account
            db.execute('DELETE FROM transactions WHERE account_id = ?', (account_id,))
            
            print(f"Deleting account {account_id}...")
            # Delete the account
            db.execute('DELETE FROM accounts WHERE id = ?', (account_id,))
            db.commit()
            
            print(f"Successfully permanently deleted account {account_id}")
            return jsonify({'message': 'Account permanently deleted successfully'}), 200
    except Exception as e:
        print(f"Error permanently deleting account: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to permanently delete account'}), 500


# ============================================
# TRANSACTIONS ENDPOINTS
# ============================================

@finance_bp.route('/transactions', methods=['GET'])
@token_required
def get_transactions(current_user):
    """Get transactions for the current user with optional filters"""
    try:
        # Get query parameters
        account_id = request.args.get('account_id', type=int)
        category_id = request.args.get('category_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        transaction_type = request.args.get('type')  # income or expense
        limit = request.args.get('limit', type=int, default=100)
        offset = request.args.get('offset', type=int, default=0)
        
        with get_db() as db:
            # Build query with filters
            query = '''
                SELECT 
                    t.id, t.account_id, t.category_id, t.amount, t.type,
                    t.description, t.transaction_date, t.created_at, t.receipt_id,
                    a.account_name as account_name,
                    c.name as category_name, c.icon as category_icon, c.color as category_color
                FROM transactions t
                LEFT JOIN accounts a ON t.account_id = a.id
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE a.user_id = ?
            '''
            params = [current_user.id]
            
            if account_id:
                query += ' AND t.account_id = ?'
                params.append(account_id)
            
            if category_id:
                query += ' AND t.category_id = ?'
                params.append(category_id)
            
            if start_date:
                query += ' AND t.transaction_date >= ?'
                params.append(start_date)
            
            if end_date:
                query += ' AND t.transaction_date <= ?'
                params.append(end_date)
            
            if transaction_type:
                query += ' AND t.type = ?'
                params.append(transaction_type)
            
            query += ' ORDER BY t.transaction_date DESC, t.created_at DESC'
            query += ' LIMIT ? OFFSET ?'
            params.extend([limit, offset])
            
            transactions = db.execute(query, params).fetchall()
            
            # Get total count for pagination
            count_query = '''
                SELECT COUNT(*) as total
                FROM transactions t
                LEFT JOIN accounts a ON t.account_id = a.id
                WHERE a.user_id = ?
            '''
            count_params = [current_user.id]
            
            if account_id:
                count_query += ' AND t.account_id = ?'
                count_params.append(account_id)
            if category_id:
                count_query += ' AND t.category_id = ?'
                count_params.append(category_id)
            if start_date:
                count_query += ' AND t.transaction_date >= ?'
                count_params.append(start_date)
            if end_date:
                count_query += ' AND t.transaction_date <= ?'
                count_params.append(end_date)
            if transaction_type:
                count_query += ' AND t.type = ?'
                count_params.append(transaction_type)
            
            total = db.execute(count_query, count_params).fetchone()['total']
            
            return jsonify({
                'transactions': [dict(row) for row in transactions],
                'total': total,
                'limit': limit,
                'offset': offset
            }), 200
    except Exception as e:
        print(f"Error fetching transactions: {e}")
        return jsonify({'error': 'Failed to fetch transactions'}), 500


@finance_bp.route('/transactions', methods=['POST'])
@token_required
def create_transaction(current_user):
    """Create a new transaction"""
    try:
        data = request.get_json()
        
        account_id = data.get('account_id')
        category_id = data.get('category_id')
        amount = data.get('amount')
        transaction_type = data.get('type')
        description = data.get('description', '')
        transaction_date = data.get('transaction_date')
        receipt_id = data.get('receipt_id')  # Optional receipt link
        
        # Validation
        if not all([account_id, amount, transaction_type]):
            return jsonify({'error': 'Account, amount, and type are required'}), 400
        
        if transaction_type not in ['income', 'expense']:
            return jsonify({'error': 'Type must be income or expense'}), 400
        
        with get_db() as db:
            # Verify account ownership
            account = db.execute('''
                SELECT id, balance FROM accounts 
                WHERE id = ? AND user_id = ?
            ''', (account_id, current_user.id)).fetchone()
            
            if not account:
                return jsonify({'error': 'Account not found'}), 404
            
            # Use current date if not provided
            if not transaction_date:
                transaction_date = datetime.now().strftime('%Y-%m-%d')
            
            amount = float(amount)
            
            # Create transaction
            # If receipt_id is provided, unlink it from any other transactions first
            if receipt_id:
                db.execute('''
                    UPDATE transactions 
                    SET receipt_id = NULL 
                    WHERE receipt_id = ? AND user_id = ?
                ''', (receipt_id, current_user.id))
            
            cursor = db.execute('''
                INSERT INTO transactions 
                (user_id, account_id, category_id, amount, type, description, transaction_date, receipt_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (current_user.id, account_id, category_id, amount, transaction_type, description, transaction_date, receipt_id))
            
            # Update account balance
            if transaction_type == 'income':
                new_balance = account['balance'] + amount
            else:
                new_balance = account['balance'] - amount
            
            db.execute('UPDATE accounts SET balance = ? WHERE id = ?', (new_balance, account_id))
            db.commit()
            
            # Get the created transaction with full details
            transaction = db.execute('''
                SELECT 
                    t.id, t.account_id, t.category_id, t.amount, t.type,
                    t.description, t.transaction_date, t.created_at, t.receipt_id,
                    a.account_name as name,
                    c.name as category_name, c.icon as category_icon, c.color as category_color
                FROM transactions t
                LEFT JOIN accounts a ON t.account_id = a.id
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.id = ?
            ''', (cursor.lastrowid,)).fetchone()
            
            return jsonify({
                'message': 'Transaction created successfully',
                'transaction': dict(transaction)
            }), 201
    except Exception as e:
        print(f"Error creating transaction: {e}")
        return jsonify({'error': 'Failed to create transaction'}), 500


@finance_bp.route('/transactions/<int:transaction_id>', methods=['PUT'])
@token_required
def update_transaction(current_user, transaction_id):
    """Update a transaction"""
    try:
        data = request.get_json()
        
        with get_db() as db:
            # Get existing transaction and verify ownership
            existing = db.execute('''
                SELECT t.*, a.user_id, a.balance
                FROM transactions t
                JOIN accounts a ON t.account_id = a.id
                WHERE t.id = ?
            ''', (transaction_id,)).fetchone()
            
            if not existing or existing['user_id'] != current_user.id:
                return jsonify({'error': 'Transaction not found'}), 404
            
            # Revert old transaction effect on balance
            old_amount = existing['amount']
            old_type = existing['type']
            account_id = existing['account_id']
            current_balance = existing['balance']
            
            if old_type == 'income':
                reverted_balance = current_balance - old_amount
            else:
                reverted_balance = current_balance + old_amount
            
            # Update transaction fields
            new_amount = float(data.get('amount', existing['amount']))
            new_type = data.get('type', existing['type'])
            new_category_id = data.get('category_id', existing['category_id'])
            new_description = data.get('description', existing['description'])
            new_date = data.get('transaction_date', existing['transaction_date'])
            new_receipt_id = data.get('receipt_id')  # Allow None to unlink receipt
            
            # If receipt_id is being changed to a new receipt, unlink that receipt from other transactions
            if new_receipt_id and new_receipt_id != existing['receipt_id']:
                db.execute('''
                    UPDATE transactions 
                    SET receipt_id = NULL 
                    WHERE receipt_id = ? AND user_id = ? AND id != ?
                ''', (new_receipt_id, current_user.id, transaction_id))
            
            db.execute('''
                UPDATE transactions
                SET amount = ?, type = ?, category_id = ?, description = ?, transaction_date = ?, receipt_id = ?
                WHERE id = ?
            ''', (new_amount, new_type, new_category_id, new_description, new_date, new_receipt_id, transaction_id))
            
            # Apply new transaction effect on balance
            if new_type == 'income':
                new_balance = reverted_balance + new_amount
            else:
                new_balance = reverted_balance - new_amount
            
            db.execute('UPDATE accounts SET balance = ? WHERE id = ?', (new_balance, account_id))
            db.commit()
            
            # Get updated transaction
            updated = db.execute('''
                SELECT 
                    t.id, t.account_id, t.category_id, t.amount, t.type,
                    t.description, t.transaction_date, t.created_at, t.receipt_id,
                    a.account_name as name,
                    c.name as category_name, c.icon as category_icon, c.color as category_color
                FROM transactions t
                LEFT JOIN accounts a ON t.account_id = a.id
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.id = ?
            ''', (transaction_id,)).fetchone()
            
            return jsonify({
                'message': 'Transaction updated successfully',
                'transaction': dict(updated)
            }), 200
    except Exception as e:
        print(f"Error updating transaction: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to update transaction'}), 500


@finance_bp.route('/transactions/<int:transaction_id>', methods=['DELETE'])
@token_required
def delete_transaction(current_user, transaction_id):
    """Delete a transaction"""
    try:
        with get_db() as db:
            # Get transaction and verify ownership
            transaction = db.execute('''
                SELECT t.*, a.user_id, a.balance
                FROM transactions t
                JOIN accounts a ON t.account_id = a.id
                WHERE t.id = ?
            ''', (transaction_id,)).fetchone()
            
            if not transaction or transaction['user_id'] != current_user.id:
                return jsonify({'error': 'Transaction not found'}), 404
            
            # Revert transaction effect on balance
            amount = transaction['amount']
            transaction_type = transaction['type']
            account_id = transaction['account_id']
            current_balance = transaction['balance']
            
            if transaction_type == 'income':
                new_balance = current_balance - amount
            else:
                new_balance = current_balance + amount
            
            db.execute('UPDATE accounts SET balance = ? WHERE id = ?', (new_balance, account_id))
            db.execute('DELETE FROM transactions WHERE id = ?', (transaction_id,))
            db.commit()
            
            return jsonify({'message': 'Transaction deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting transaction: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to delete transaction'}), 500


# ============================================
# CATEGORIES ENDPOINTS
# ============================================

@finance_bp.route('/categories', methods=['GET'])
@token_required
def get_categories(current_user):
    """Get all categories (default + user custom)"""
    try:
        with get_db() as db:
            categories = db.execute('''
                SELECT id, name, type, icon, color, is_default
                FROM categories
                WHERE user_id IS NULL OR user_id = ?
                ORDER BY is_default DESC, name ASC
            ''', (current_user.id,)).fetchall()
            
            return jsonify({
                'categories': [dict(row) for row in categories]
            }), 200
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return jsonify({'error': 'Failed to fetch categories'}), 500


@finance_bp.route('/categories', methods=['POST'])
@token_required
def create_category(current_user):
    """Create a custom category"""
    try:
        data = request.get_json()
        
        name = data.get('name')
        category_type = data.get('type', 'expense')
        icon = data.get('icon', '📁')
        color = data.get('color', '#6b7280')
        
        if not name:
            return jsonify({'error': 'Category name is required'}), 400
        
        if category_type not in ['income', 'expense']:
            return jsonify({'error': 'Type must be income or expense'}), 400
        
        with get_db() as db:
            cursor = db.execute('''
                INSERT INTO categories (user_id, name, type, icon, color, is_default)
                VALUES (?, ?, ?, ?, ?, 0)
            ''', (current_user.id, name, category_type, icon, color))
            db.commit()
            
            # Get created category
            category = db.execute('''
                SELECT id, name, type, icon, color, is_default
                FROM categories WHERE id = ?
            ''', (cursor.lastrowid,)).fetchone()
            
            return jsonify({
                'message': 'Category created successfully',
                'category': dict(category)
            }), 201
    except Exception as e:
        print(f"Error creating category: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to create category'}), 500


# ============================================
# STATISTICS ENDPOINTS
# ============================================

@finance_bp.route('/statistics/summary', methods=['GET'])
@token_required
def get_summary(current_user):
    """Get financial summary (total income, expenses, balance)"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        with get_db() as db:
            # Total balance across all active accounts
            total_balance = db.execute('''
                SELECT COALESCE(SUM(balance), 0) as total
                FROM accounts
                WHERE user_id = ? AND is_active = 1
            ''', (current_user.id,)).fetchone()['total']
            
            # Build transaction filters
            date_filter = ''
            params = [current_user.id]
            
            if start_date:
                date_filter += ' AND t.transaction_date >= ?'
                params.append(start_date)
            if end_date:
                date_filter += ' AND t.transaction_date <= ?'
                params.append(end_date)
            
            # Total income
            income = db.execute(f'''
                SELECT COALESCE(SUM(t.amount), 0) as total
                FROM transactions t
                JOIN accounts a ON t.account_id = a.id
                WHERE a.user_id = ? AND t.type = 'income'{date_filter}
            ''', params).fetchone()['total']
            
            # Total expenses
            expenses = db.execute(f'''
                SELECT COALESCE(SUM(t.amount), 0) as total
                FROM transactions t
                JOIN accounts a ON t.account_id = a.id
                WHERE a.user_id = ? AND t.type = 'expense'{date_filter}
            ''', params).fetchone()['total']
            
            # Spending by category
            category_params = [current_user.id, current_user.id]
            if start_date:
                category_params.append(start_date)
            if end_date:
                category_params.append(end_date)
                
            category_breakdown = db.execute(f'''
                SELECT 
                    c.name, c.icon, c.color,
                    COALESCE(SUM(t.amount), 0) as total,
                    COUNT(t.id) as transaction_count
                FROM categories c
                LEFT JOIN transactions t ON c.id = t.category_id 
                    AND t.type = 'expense'
                LEFT JOIN accounts a ON t.account_id = a.id
                WHERE (c.user_id IS NULL OR c.user_id = ?) 
                    AND (a.user_id = ? OR a.user_id IS NULL){date_filter}
                GROUP BY c.id, c.name, c.icon, c.color
                HAVING total > 0
                ORDER BY total DESC
                LIMIT 10
            ''', category_params).fetchall()
            
            return jsonify({
                'total_balance': float(total_balance),
                'total_income': float(income),
                'total_expenses': float(expenses),
                'net_savings': float(income - expenses),
                'top_categories': [dict(row) for row in category_breakdown]
            }), 200
    except Exception as e:
        print(f"Error fetching summary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch summary'}), 500


@finance_bp.route('/statistics/monthly', methods=['GET'])
@token_required
def get_monthly_stats(current_user):
    """Get monthly income/expense trends"""
    try:
        months = request.args.get('months', type=int, default=6)
        
        with get_db() as db:
            # Get monthly data for the last N months
            monthly_data = db.execute('''
                SELECT 
                    strftime('%Y-%m', t.transaction_date) as month,
                    t.type,
                    SUM(t.amount) as total
                FROM transactions t
                JOIN accounts a ON t.account_id = a.id
                WHERE a.user_id = ?
                    AND t.transaction_date >= date('now', '-' || ? || ' months')
                GROUP BY month, t.type
                ORDER BY month ASC
            ''', (current_user.id, months)).fetchall()
            
            # Organize data by month
            monthly_summary = {}
            for row in monthly_data:
                month = row['month']
                if month not in monthly_summary:
                    monthly_summary[month] = {'month': month, 'income': 0, 'expenses': 0}
                
                if row['type'] == 'income':
                    monthly_summary[month]['income'] = float(row['total'])
                else:
                    monthly_summary[month]['expenses'] = float(row['total'])
            
            # Convert to list and calculate net
            result = []
            for month_data in monthly_summary.values():
                month_data['net'] = month_data['income'] - month_data['expenses']
                result.append(month_data)
            
            return jsonify({
                'monthly_data': result
            }), 200
    except Exception as e:
        print(f"Error fetching monthly stats: {e}")
        return jsonify({'error': 'Failed to fetch monthly statistics'}), 500


# ============================================
# RECEIPTS ENDPOINTS
# ============================================

@finance_bp.route('/receipts', methods=['GET'])
@token_required
def get_receipts(current_user):
    """Get all receipts for the current user"""
    try:
        with get_db() as db:
            receipts = db.execute('''
                SELECT r.*, 
                       t.description as transaction_description,
                       t.amount as transaction_amount
                FROM receipts r
                LEFT JOIN transactions t ON r.id = t.receipt_id
                WHERE r.user_id = ?
                ORDER BY r.upload_date DESC
            ''', (current_user.id,)).fetchall()
            
            # Convert to dict and add image URL
            receipts_list = []
            for row in receipts:
                receipt = dict(row)
                # Extract just the filename from the path
                if receipt.get('file_path'):
                    filename = os.path.basename(receipt['file_path'])
                    receipt['image_url'] = f'/api/finance/receipts/files/{filename}'
                receipts_list.append(receipt)
            
            return jsonify(receipts_list), 200
    except Exception as e:
        print(f"Error fetching receipts: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch receipts'}), 500


@finance_bp.route('/receipts/upload', methods=['POST'])
@token_required
def upload_receipt(current_user):
    """Upload a receipt image"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'pdf', 'heic', 'txt', 'doc', 'docx', 'eml', 'msg'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, PDF, HEIC, TXT, DOC, DOCX, EML, MSG'}), 400
        
        # Create uploads directory if it doesn't exist
        import os
        uploads_dir = 'uploads/receipts'
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Generate unique filename
        from werkzeug.utils import secure_filename
        import uuid
        unique_filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
        file_path = os.path.join(uploads_dir, unique_filename)
        
        # Save file
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        # Save to database
        with get_db() as db:
            cursor = db.execute('''
                INSERT INTO receipts (user_id, file_path, file_name, file_size)
                VALUES (?, ?, ?, ?)
            ''', (current_user.id, file_path, file.filename, file_size))
            db.commit()
            receipt_id = cursor.lastrowid
            
            # Fetch the created receipt
            receipt = db.execute('SELECT * FROM receipts WHERE id = ?', (receipt_id,)).fetchone()
            
            return jsonify(dict(receipt)), 201
    except Exception as e:
        print(f"Error uploading receipt: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to upload receipt'}), 500


@finance_bp.route('/receipts/<int:receipt_id>', methods=['GET'])
@token_required
def get_receipt(current_user, receipt_id):
    """Get a specific receipt with its items"""
    try:
        with get_db() as db:
            # Get receipt
            receipt = db.execute('''
                SELECT * FROM receipts WHERE id = ? AND user_id = ?
            ''', (receipt_id, current_user.id)).fetchone()
            
            if not receipt:
                return jsonify({'error': 'Receipt not found'}), 404
            
            # Get receipt items
            items = db.execute('''
                SELECT ri.*, c.name as category_name, c.icon as category_icon
                FROM receipt_items ri
                LEFT JOIN categories c ON ri.category_id = c.id
                WHERE ri.receipt_id = ?
            ''', (receipt_id,)).fetchall()
            
            receipt_dict = dict(receipt)
            receipt_dict['items'] = [dict(item) for item in items]
            
            return jsonify(receipt_dict), 200
    except Exception as e:
        print(f"Error fetching receipt: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch receipt'}), 500


@finance_bp.route('/receipts/<int:receipt_id>', methods=['DELETE'])
@token_required
def delete_receipt(current_user, receipt_id):
    """Delete a receipt and its file"""
    try:
        with get_db() as db:
            # Get receipt to verify ownership and get file path
            receipt = db.execute('''
                SELECT * FROM receipts WHERE id = ? AND user_id = ?
            ''', (receipt_id, current_user.id)).fetchone()
            
            if not receipt:
                return jsonify({'error': 'Receipt not found'}), 404
            
            # Delete file
            import os
            if os.path.exists(receipt['file_path']):
                os.remove(receipt['file_path'])
            
            # Delete from database (cascade will delete items)
            db.execute('DELETE FROM receipts WHERE id = ?', (receipt_id,))
            db.commit()
            
            return jsonify({'message': 'Receipt deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting receipt: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to delete receipt'}), 500


@finance_bp.route('/receipts/<int:receipt_id>', methods=['PUT'])
@token_required
def update_receipt(current_user, receipt_id):
    """Update receipt details (like display name)"""
    try:
        data = request.get_json()
        display_name = data.get('display_name')
        
        if not display_name:
            return jsonify({'error': 'Display name is required'}), 400
        
        with get_db() as db:
            # Verify receipt ownership
            receipt = db.execute('''
                SELECT * FROM receipts WHERE id = ? AND user_id = ?
            ''', (receipt_id, current_user.id)).fetchone()
            
            if not receipt:
                return jsonify({'error': 'Receipt not found'}), 404
            
            # Update display name
            db.execute('''
                UPDATE receipts SET display_name = ? WHERE id = ?
            ''', (display_name, receipt_id))
            db.commit()
            
            return jsonify({'message': 'Receipt updated successfully'}), 200
    except Exception as e:
        print(f"Error updating receipt: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to update receipt'}), 500


@finance_bp.route('/receipts/<int:receipt_id>/items', methods=['POST'])
@token_required
def add_receipt_items(current_user, receipt_id):
    """Add itemized breakdown to a receipt"""
    try:
        data = request.get_json()
        items = data.get('items', [])
        
        if not items:
            return jsonify({'error': 'No items provided'}), 400
        
        with get_db() as db:
            # Verify receipt ownership
            receipt = db.execute('''
                SELECT * FROM receipts WHERE id = ? AND user_id = ?
            ''', (receipt_id, current_user.id)).fetchone()
            
            if not receipt:
                return jsonify({'error': 'Receipt not found'}), 404
            
            # Delete existing items
            db.execute('DELETE FROM receipt_items WHERE receipt_id = ?', (receipt_id,))
            
            # Insert new items
            for item in items:
                db.execute('''
                    INSERT INTO receipt_items 
                    (receipt_id, item_description, amount, category_id, transaction_id)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    receipt_id,
                    item.get('description'),
                    item.get('amount'),
                    item.get('category_id'),
                    item.get('transaction_id')
                ))
            
            db.commit()
            
            return jsonify({'message': 'Receipt items saved successfully'}), 200
    except Exception as e:
        print(f"Error saving receipt items: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to save receipt items'}), 500


@finance_bp.route('/receipts/<int:receipt_id>/extract-text', methods=['POST'])
@token_required
def extract_receipt_text(current_user, receipt_id):
    """Extract text from receipt using OCR"""
    try:
        with get_db() as db:
            # Verify receipt exists and belongs to user
            receipt = db.execute('''
                SELECT id, file_path
                FROM receipts
                WHERE id = ? AND user_id = ?
            ''', (receipt_id, current_user.id)).fetchone()
            
            if not receipt:
                return jsonify({'error': 'Receipt not found'}), 404
            
            # Get absolute file path
            from pathlib import Path
            backend_dir = Path(__file__).parent.parent.parent
            # file_path already contains 'uploads/receipts/' prefix from database
            file_path = backend_dir / receipt['file_path']
            
            if not file_path.exists():
                return jsonify({'error': 'Receipt file not found'}), 404
            
            # Extract text using OCR service
            from app.services.ocr import extract_text_from_receipt, parse_receipt_lines, suggest_total_line
            
            result = extract_text_from_receipt(str(file_path))
            print(f"DEBUG: OCR result type: {type(result)}")
            print(f"DEBUG: OCR result: {result}")
            
            # If result is a dict (from OpenAI Vision), use it directly
            if isinstance(result, dict):
                structured_data = result.get('structured_data', {})
                
                # Filter out invalid items (store name, $0 items, missing description)
                items = structured_data.get('items', [])
                print(f"DEBUG: Raw items from AI: {len(items)}")
                for idx, item in enumerate(items):
                    print(f"  Item {idx}: {item.get('description')} - ${item.get('total_price', 0)}")
                
                filtered_items = []
                store_name = structured_data.get('store_name', '').lower()
                print(f"DEBUG: Store name: '{store_name}'")
                
                for item in items:
                    # Validate item
                    description = item.get('description', '').strip()
                    total_price = float(item.get('total_price', 0))
                    
                    # Exclude if:
                    # - No description
                    # - Price is $0 or negative
                    # - Description matches store name (case insensitive)
                    if description and total_price > 0:
                        # Don't add if description is just the store name
                        if description.lower() != store_name:
                            filtered_items.append(item)
                            print(f"  ✓ Keeping: {description} ${total_price}")
                        else:
                            print(f"  ✗ Filtered (matches store name): {description}")
                    else:
                        print(f"  ✗ Filtered (invalid): {description} ${total_price}")
                
                # Update structured data with filtered items
                structured_data['items'] = filtered_items
                
                # Build lines from filtered items
                lines = []
                for item in filtered_items:
                    desc = item.get('description', 'Item')
                    sku = item.get('sku', '')
                    amount = item.get('total_price', item.get('amount', 0))
                    
                    if sku:
                        lines.append(f"{desc} (SKU: {sku}) ${amount:.2f}")
                    else:
                        lines.append(f"{desc} ${amount:.2f}")
                
                # DON'T add total line to selectable items - it's handled separately
                # Total is displayed as editable field at top of modal
                
                # No suggested_total_line since we removed it from items
                suggested_total_line = None
                
                return jsonify({
                    'receipt_id': receipt_id,
                    'raw_text': structured_data.get('store_name', ''),
                    'lines': lines,
                    'suggested_total_line': suggested_total_line,
                    'structured_data': structured_data  # Include merchant info with filtered items
                }), 200
            
            # Fallback to Tesseract (string result)
            raw_text = result if isinstance(result, str) else ''
            lines = parse_receipt_lines(raw_text)
            suggested_total_idx = suggest_total_line(lines)
            
            return jsonify({
                'receipt_id': receipt_id,
                'raw_text': raw_text,
                'lines': lines,
                'suggested_total_line': suggested_total_idx
            }), 200
            
    except Exception as e:
        print(f"Error extracting receipt text: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to extract text: {str(e)}'}), 500


@finance_bp.route('/receipts/<int:receipt_id>/itemize', methods=['POST'])
@token_required
def itemize_receipt(current_user, receipt_id):
    """Save itemized receipt data with validation, including taxes, merchant, SKUs, and tax flags"""
    try:
        data = request.get_json()
        items = data.get('items', [])
        transaction_id = data.get('transaction_id')
        receipt_total = data.get('receipt_total')  # Total from receipt
        merchant_name = data.get('merchant_name')  # Merchant/store name
        taxes = data.get('taxes', [])  # Tax breakdown [{code, rate, amount, description}]
        
        if not items:
            return jsonify({'error': 'No items provided'}), 400
        
        with get_db() as db:
            # Verify receipt exists and belongs to user
            receipt = db.execute('''
                SELECT id FROM receipts
                WHERE id = ? AND user_id = ?
            ''', (receipt_id, current_user.id)).fetchone()
            
            if not receipt:
                return jsonify({'error': 'Receipt not found'}), 404
            
            # Calculate item total
            item_total = sum(float(item.get('amount', 0)) for item in items)
            
            # Calculate tax total
            tax_total = sum(float(tax.get('amount', 0)) for tax in taxes)
            
            # Expected total with taxes
            expected_total = item_total + tax_total
            
            # Update receipt with merchant and total tax
            if merchant_name:
                db.execute('''
                    UPDATE receipts 
                    SET merchant_name = ?, total_tax_amount = ?
                    WHERE id = ?
                ''', (merchant_name, tax_total, receipt_id))
            else:
                db.execute('''
                    UPDATE receipts 
                    SET total_tax_amount = ?
                    WHERE id = ?
                ''', (tax_total, receipt_id))
            
            # Validate against receipt total if provided
            if receipt_total:
                receipt_total_float = float(receipt_total)
                # Allow $0.01 tolerance for rounding
                if abs(receipt_total_float - expected_total) > 0.01:
                    return jsonify({
                        'error': 'Item total + Tax does not match receipt total',
                        'item_total': round(item_total, 2),
                        'tax_total': round(tax_total, 2),
                        'expected_total': round(expected_total, 2),
                        'receipt_total': round(receipt_total_float, 2),
                        'difference': round(abs(receipt_total_float - expected_total), 2)
                    }), 400
            
            # Validate against transaction amount if linked
            if transaction_id:
                transaction = db.execute('''
                    SELECT amount FROM transactions
                    WHERE id = ? AND user_id = ?
                ''', (transaction_id, current_user.id)).fetchone()
                
                if not transaction:
                    return jsonify({'error': 'Transaction not found'}), 404
                
                tx_amount = abs(float(transaction['amount']))
                
                # Allow $0.01 tolerance for rounding
                if abs(tx_amount - expected_total) > 0.01:
                    return jsonify({
                        'error': 'Receipt total does not match transaction amount',
                        'receipt_total': round(expected_total, 2),
                        'transaction_amount': round(tx_amount, 2),
                        'difference': round(abs(tx_amount - expected_total), 2)
                    }), 400
            
            # Delete existing items and taxes for this receipt
            db.execute('DELETE FROM receipt_items WHERE receipt_id = ?', (receipt_id,))
            db.execute('DELETE FROM receipt_taxes WHERE receipt_id = ?', (receipt_id,))
            db.execute('''
                DELETE FROM item_tax_flags 
                WHERE receipt_item_id IN (
                    SELECT id FROM receipt_items WHERE receipt_id = ?
                )
            ''', (receipt_id,))
            
            # Insert new items
            for item in items:
                cursor = db.execute('''
                    INSERT INTO receipt_items 
                    (receipt_id, transaction_id, item_description, amount, category_id, sku, custom_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    receipt_id,
                    transaction_id,
                    item.get('description', ''),
                    item.get('amount', 0),
                    item.get('category_id'),
                    item.get('sku'),
                    item.get('custom_name')
                ))
                
                # Get the inserted item ID
                item_id = cursor.lastrowid
                
                # Insert tax flag if present
                tax_flag = item.get('tax_flag')
                if tax_flag:
                    db.execute('''
                        INSERT INTO item_tax_flags 
                        (receipt_item_id, tax_flag, is_taxable)
                        VALUES (?, ?, ?)
                    ''', (
                        item_id,
                        tax_flag,
                        1 if tax_flag != 'N' else 0
                    ))
            
            # Insert taxes
            for tax in taxes:
                db.execute('''
                    INSERT INTO receipt_taxes 
                    (receipt_id, tax_code, tax_description, tax_rate, tax_amount)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    receipt_id,
                    tax.get('code', ''),
                    tax.get('description'),
                    tax.get('rate'),
                    tax.get('amount', 0)
                ))
            
            db.commit()
            
            return jsonify({
                'message': 'Receipt itemized successfully',
                'receipt_id': receipt_id,
                'items_count': len(items),
                'item_total': round(item_total, 2),
                'tax_total': round(tax_total, 2),
                'total': round(expected_total, 2)
            }), 200
            
    except Exception as e:
        print(f"Error itemizing receipt: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to itemize receipt: {str(e)}'}), 500


@finance_bp.route('/receipts/files/<filename>', methods=['GET'])
def serve_receipt_file(filename):
    """Serve uploaded receipt files"""
    try:
        # Get the base directory (backend folder, not app folder)
        from flask import current_app
        import pathlib
        backend_dir = pathlib.Path(__file__).parent.parent.parent
        
        # Construct the file path from backend directory
        file_path = backend_dir / 'uploads' / 'receipts' / filename
        
        # Check if file exists
        if not file_path.exists():
            print(f"File not found: {file_path}")
            return jsonify({'error': 'File not found'}), 404
        
        # Determine mimetype
        mimetype = 'image/jpeg'
        if filename.lower().endswith('.png'):
            mimetype = 'image/png'
        elif filename.lower().endswith('.pdf'):
            mimetype = 'application/pdf'
        elif filename.lower().endswith('.heic'):
            mimetype = 'image/heic'
        
        return send_file(str(file_path), mimetype=mimetype)
    except Exception as e:
        print(f"Error serving receipt file: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to serve file'}), 500
