"""
Finance Tracker Routes
Provides API endpoints for accounts, transactions, categories, and budgets
"""

from flask import Blueprint, request, jsonify
from app.utils.auth import token_required
from app.database import get_db
from datetime import datetime

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
        return jsonify({'error': 'Failed to delete account'}), 500


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
                t.description, t.transaction_date, t.created_at,
                a.name as account_name,
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
        cursor = db.execute('''
            INSERT INTO transactions 
            (account_id, category_id, amount, type, description, transaction_date)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (account_id, category_id, amount, transaction_type, description, transaction_date))
        
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
                t.description, t.transaction_date, t.created_at,
                a.name as account_name,
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
        
        db.execute('''
            UPDATE transactions
            SET amount = ?, type = ?, category_id = ?, description = ?, transaction_date = ?
            WHERE id = ?
        ''', (new_amount, new_type, new_category_id, new_description, new_date, transaction_id))
        
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
                t.description, t.transaction_date, t.created_at,
                a.name as account_name,
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
        ''', params + ['income'] if date_filter else params).fetchone()['total']
        
        # Total expenses
        expenses = db.execute(f'''
            SELECT COALESCE(SUM(t.amount), 0) as total
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE a.user_id = ? AND t.type = 'expense'{date_filter}
        ''', params + ['expense'] if date_filter else params).fetchone()['total']
        
        # Spending by category
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
        ''', [current_user.id, current_user.id] + (params[1:] if date_filter else [])).fetchall()
        
        return jsonify({
            'total_balance': float(total_balance),
            'total_income': float(income),
            'total_expenses': float(expenses),
            'net_savings': float(income - expenses),
            'top_categories': [dict(row) for row in category_breakdown]
        }), 200
    except Exception as e:
        print(f"Error fetching summary: {e}")
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
