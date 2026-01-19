import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app, g
from app.models import User


def generate_token(user_id):
    """Generate JWT token for user"""
    expiration = datetime.utcnow() + timedelta(
        hours=current_app.config['JWT_EXPIRATION_HOURS']
    )
    
    payload = {
        'user_id': user_id,
        'exp': expiration,
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm=current_app.config['JWT_ALGORITHM']
    )
    
    return token


def decode_token(token):
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=[current_app.config['JWT_ALGORITHM']]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """
    Decorator to protect routes with JWT authentication
    Supports both old local JWT and new Keycloak JWT tokens
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401
        
        # First try Keycloak token verification
        try:
            from app.utils.keycloak import verify_keycloak_token
            from app.database import get_db
            
            keycloak_user = verify_keycloak_token(token)
            if keycloak_user:
                # Get user from database by keycloak_id
                with get_db() as db:
                    cursor = db.execute(
                        'SELECT * FROM users WHERE keycloak_id = ?',
                        (keycloak_user['sub'],)
                    )
                    db_user = cursor.fetchone()
                
                    if db_user:
                        # Create a user-like object for compatibility
                        class UserWrapper:
                            def __init__(self, row):
                                self.id = row['id']
                                self.keycloak_id = row['keycloak_id']
                                self.email = row['email']
                                self.username = row['username']
                                self.full_name = row['full_name']
                                self.role = row['role']
                            
                            def to_dict(self):
                                return {
                                    'id': self.id,
                                    'keycloak_id': self.keycloak_id,
                                    'email': self.email,
                                    'username': self.username,
                                    'full_name': self.full_name,
                                    'role': self.role
                                }
                        
                        user = UserWrapper(db_user)
                        g.keycloak_user = keycloak_user
                        return f(user, *args, **kwargs)
        except Exception as e:
            print(f"Keycloak auth failed, trying local JWT: {e}")
        
        # Fall back to old local JWT verification
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Get user from database
        user = User.get_by_id(payload['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        # Pass user to the route
        return f(user, *args, **kwargs)
    
    return decorated_function


def validate_email(email):
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, None


def validate_username(username):
    """Validate username format"""
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    if not username.replace('_', '').replace('-', '').isalnum():
        return False, "Username can only contain letters, numbers, underscores, and hyphens"
    return True, None
