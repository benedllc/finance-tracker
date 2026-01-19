from functools import wraps
from flask import request, jsonify
from app.models import User
import jwt
from config import config
import os


def require_role(*allowed_roles):
    """
    Decorator to require specific roles for routes
    Usage: @require_role('admin') or @require_role('admin', 'staff')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get token from header
            token = None
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                try:
                    token = auth_header.split(' ')[1]
                except IndexError:
                    return jsonify({'error': 'Invalid token format'}), 401
            
            if not token:
                return jsonify({'error': 'Token is missing'}), 401
            
            try:
                # Decode token
                config_name = os.getenv('FLASK_ENV', 'development')
                secret_key = config[config_name].SECRET_KEY
                data = jwt.decode(token, secret_key, algorithms=['HS256'])
                
                # Get user from database
                current_user = User.get_by_id(data['user_id'])
                
                if not current_user:
                    return jsonify({'error': 'User not found'}), 401
                
                # Check if user is active
                if current_user.status != 'active':
                    return jsonify({'error': 'Account is inactive'}), 403
                
                # Check role
                if current_user.role not in allowed_roles:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                
                # Pass user to the route
                return f(current_user, *args, **kwargs)
                
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token has expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401
            except Exception as e:
                return jsonify({'error': f'Authentication error: {str(e)}'}), 500
        
        return decorated_function
    return decorator


def log_action(user_id, action, entity_type=None, entity_id=None, details=None):
    """Log an action to the audit log"""
    from app.database import get_db
    
    ip_address = request.remote_addr if request else None
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, action, entity_type, entity_id, details, ip_address))
        conn.commit()
