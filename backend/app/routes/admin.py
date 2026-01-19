from flask import Blueprint, request, jsonify
from app.models import User
from app.utils.rbac import require_role, log_action
from datetime import datetime

bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@bp.route('/users', methods=['GET'])
@require_role('admin')
def get_all_users(current_user):
    """Get all users (admin only)"""
    log_action(current_user.id, 'VIEW_ALL_USERS')
    
    users = User.get_all_users()
    return jsonify({
        'users': [user.to_dict() for user in users],
        'total': len(users)
    }), 200


@bp.route('/users/<int:user_id>', methods=['GET'])
@require_role('admin')
def get_user_details(current_user, user_id):
    """Get specific user details"""
    log_action(current_user.id, 'VIEW_USER', 'user', user_id)
    
    user = User.get_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200


@bp.route('/users/<int:user_id>', methods=['PUT'])
@require_role('admin')
def update_user(current_user, user_id):
    """Update user information (admin only)"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    user = User.get_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Log the action
    log_action(current_user.id, 'UPDATE_USER', 'user', user_id, str(data))
    
    # Update user
    success = user.update(
        email=data.get('email'),
        username=data.get('username'),
        full_name=data.get('full_name'),
        role=data.get('role'),
        status=data.get('status'),
        program_start_date=data.get('program_start_date'),
        graduation_date=data.get('graduation_date')
    )
    
    if not success:
        return jsonify({'error': 'Failed to update user'}), 500
    
    # Reload user data
    updated_user = User.get_by_id(user_id)
    
    return jsonify({
        'message': 'User updated successfully',
        'user': updated_user.to_dict()
    }), 200


@bp.route('/users/<int:user_id>', methods=['DELETE'])
@require_role('admin')
def deactivate_user(current_user, user_id):
    """Deactivate a user (soft delete)"""
    if user_id == current_user.id:
        return jsonify({'error': 'Cannot deactivate your own account'}), 400
    
    user = User.get_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    log_action(current_user.id, 'DEACTIVATE_USER', 'user', user_id)
    
    # Set status to inactive
    success = user.update(status='inactive')
    
    if not success:
        return jsonify({'error': 'Failed to deactivate user'}), 500
    
    return jsonify({'message': 'User deactivated successfully'}), 200


@bp.route('/analytics', methods=['GET'])
@require_role('admin')
def get_analytics(current_user):
    """Get system-wide analytics"""
    from app.database import get_db
    
    log_action(current_user.id, 'VIEW_ANALYTICS')
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Total users by role
        cursor.execute('''
            SELECT role, COUNT(*) as count, status
            FROM users
            GROUP BY role, status
        ''')
        user_stats = [dict(row) for row in cursor.fetchall()]
        
        # Total accounts
        cursor.execute('SELECT COUNT(*) as count FROM accounts')
        total_accounts = cursor.fetchone()['count']
        
        # Total transactions
        cursor.execute('SELECT COUNT(*) as count FROM transactions')
        total_transactions = cursor.fetchone()['count']
        
        # Recent signups (last 30 days)
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM users
            WHERE created_at >= date('now', '-30 days')
        ''')
        recent_signups = cursor.fetchone()['count']
    
    return jsonify({
        'user_stats': user_stats,
        'total_accounts': total_accounts,
        'total_transactions': total_transactions,
        'recent_signups': recent_signups
    }), 200


@bp.route('/audit-log', methods=['GET'])
@require_role('admin')
def get_audit_log(current_user):
    """Get recent audit log entries"""
    from app.database import get_db
    
    limit = request.args.get('limit', 100, type=int)
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT a.*, u.username
            FROM audit_log a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC
            LIMIT ?
        ''', (limit,))
        logs = [dict(row) for row in cursor.fetchall()]
    
    return jsonify({'logs': logs}), 200
