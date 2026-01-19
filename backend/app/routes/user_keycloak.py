"""
BENED Finance Tracker - User Routes with Keycloak Auth
"""

from flask import Blueprint, request, jsonify, g
from app.utils.keycloak import keycloak_required
from app.database import get_db

bp = Blueprint('user', __name__, url_prefix='/api')


def get_user_from_keycloak():
    """Get user from database using Keycloak user info"""
    keycloak_id = g.keycloak_user['sub']
    with get_db() as db:
        cursor = db.execute('SELECT * FROM users WHERE keycloak_id = ?', (keycloak_id,))
        return cursor.fetchone()


@bp.route('/profile', methods=['GET'])
@keycloak_required
def get_profile():
    """Get current user's profile"""
    user = get_user_from_keycloak()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': {
            'id': user['id'],
            'keycloak_id': user['keycloak_id'],
            'email': user['email'],
            'username': user['username'],
            'full_name': user['full_name'],
            'role': user['role'],
            'status': user['status'],
            'created_at': user['created_at']
        }
    }), 200


@bp.route('/profile', methods=['PUT'])
@keycloak_required
def update_profile():
    """Update current user's profile"""
    user = get_user_from_keycloak()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update allowed fields
    full_name = data.get('full_name', user['full_name'])
    
    try:
        with get_db() as db:
            db.execute('''
                UPDATE users 
                SET full_name = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (full_name, user['id']))
            db.commit()
            
            # Reload user
            cursor = db.execute('SELECT * FROM users WHERE id = ?', (user['id'],))
            updated_user = cursor.fetchone()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': updated_user['id'],
                'keycloak_id': updated_user['keycloak_id'],
                'email': updated_user['email'],
                'username': updated_user['username'],
                'full_name': updated_user['full_name'],
                'role': updated_user['role'],
                'status': updated_user['status'],
                'created_at': updated_user['created_at']
            }
        }), 200
    except Exception as e:
        print(f"Error updating profile: {e}")
        return jsonify({'error': 'Failed to update profile'}), 500
