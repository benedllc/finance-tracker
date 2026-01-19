"""
BENED Finance Tracker - Keycloak Authentication Routes
Handles OAuth2/OIDC flow with Keycloak
"""

from flask import Blueprint, request, jsonify, g
from app.utils.keycloak import (
    get_keycloak_config,
    exchange_code_for_tokens,
    verify_keycloak_token,
    refresh_tokens,
    keycloak_required
)
from app.database import get_db

bp = Blueprint('auth', __name__, url_prefix='/api')


@bp.route('/auth/config', methods=['GET'])
def get_config():
    """Return Keycloak configuration for frontend"""
    return jsonify(get_keycloak_config()), 200


@bp.route('/auth/callback', methods=['POST'])
def auth_callback():
    """
    Exchange authorization code for tokens
    Called by frontend after Keycloak redirect
    """
    data = request.get_json()
    print(f"[AUTH] Callback received: {data}")
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    code = data.get('code')
    redirect_uri = data.get('redirect_uri')
    
    if not code:
        return jsonify({'error': 'Authorization code is required'}), 400
    
    if not redirect_uri:
        return jsonify({'error': 'Redirect URI is required'}), 400
    
    print(f"[AUTH] Exchanging code for tokens with redirect_uri: {redirect_uri}")
    
    # Exchange code for tokens
    tokens = exchange_code_for_tokens(code, redirect_uri)
    
    if not tokens:
        print("[AUTH] Token exchange failed!")
        return jsonify({'error': 'Failed to exchange code for tokens'}), 401
    
    print(f"[AUTH] Token exchange successful, verifying access token...")
    
    # Verify the access token and get user info
    access_token = tokens.get('access_token')
    user_info = verify_keycloak_token(access_token)
    
    if not user_info:
        print("[AUTH] Token verification failed!")
        return jsonify({'error': 'Failed to verify token'}), 401
    
    print(f"[AUTH] Token verified, user: {user_info.get('email')}")
    
    # Ensure user exists in our database (create if first login)
    user = ensure_user_exists(user_info)
    
    print(f"[AUTH] User ensured: {user}")
    
    return jsonify({
        'access_token': tokens.get('access_token'),
        'refresh_token': tokens.get('refresh_token'),
        'expires_in': tokens.get('expires_in'),
        'user': user
    }), 200


@bp.route('/auth/refresh', methods=['POST'])
def refresh():
    """Refresh access token using refresh token"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    refresh_token = data.get('refresh_token')
    
    if not refresh_token:
        return jsonify({'error': 'Refresh token is required'}), 400
    
    tokens = refresh_tokens(refresh_token)
    
    if not tokens:
        return jsonify({'error': 'Failed to refresh token'}), 401
    
    # Verify the new access token
    user_info = verify_keycloak_token(tokens.get('access_token'))
    
    if not user_info:
        return jsonify({'error': 'Failed to verify refreshed token'}), 401
    
    user = ensure_user_exists(user_info)
    
    return jsonify({
        'access_token': tokens.get('access_token'),
        'refresh_token': tokens.get('refresh_token'),
        'expires_in': tokens.get('expires_in'),
        'user': user
    }), 200


@bp.route('/auth/me', methods=['GET'])
@keycloak_required
def get_current_user():
    """Get current user info from token"""
    user = ensure_user_exists(g.keycloak_user)
    return jsonify({'user': user}), 200


def ensure_user_exists(keycloak_user):
    """
    Ensure user exists in local database
    Creates user on first login, updates on subsequent logins
    Returns user dict
    """
    from app.config.admins import SUPER_ADMIN_KEYCLOAK_IDS, SUPER_ADMIN_USERNAMES
    
    keycloak_id = keycloak_user['sub']
    email = keycloak_user.get('email', '')
    username = keycloak_user.get('preferred_username', email)
    
    with get_db() as db:
        # Check if user exists by keycloak_id
        cursor = db.execute(
            'SELECT * FROM users WHERE keycloak_id = ?',
            (keycloak_id,)
        )
        user = cursor.fetchone()
        
        if user:
            # Update user info from Keycloak
            db.execute('''
                UPDATE users 
                SET email = ?, full_name = ?, username = ?, updated_at = CURRENT_TIMESTAMP
                WHERE keycloak_id = ?
            ''', (
                email,
                keycloak_user.get('name', ''),
                keycloak_user.get('preferred_username', email),
                keycloak_id
            ))
            db.commit()
            
            # Fetch updated user
            cursor = db.execute('SELECT * FROM users WHERE keycloak_id = ?', (keycloak_id,))
            user = cursor.fetchone()
        else:
            # Create new user
            new_username = keycloak_user.get('preferred_username', email)
            full_name = keycloak_user.get('name', '')
            
            # Check for super admin or admin role
            is_super_admin = (keycloak_id in SUPER_ADMIN_KEYCLOAK_IDS or 
                             new_username in SUPER_ADMIN_USERNAMES)
            roles = keycloak_user.get('roles', [])
            role = 'admin' if (is_super_admin or 'admin' in roles) else 'user'
            
            db.execute('''
                INSERT INTO users (keycloak_id, email, username, full_name, role, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ''', (keycloak_id, email, new_username, full_name, role))
            db.commit()
            
            # Get the new user
            cursor = db.execute('SELECT * FROM users WHERE keycloak_id = ?', (keycloak_id,))
            user = cursor.fetchone()
            
            # Create default cash account for new user
            if user:
                try:
                    db.execute('''
                        INSERT INTO accounts (user_id, account_name, account_type, balance, is_active)
                        VALUES (?, 'Cash', 'cash', 0.00, 1)
                    ''', (user['id'],))
                    db.commit()
                except Exception as e:
                    print(f"Warning: Failed to create default account: {e}")
        
        if user:
            return {
                'id': user['id'],
                'keycloak_id': user['keycloak_id'],
                'email': user['email'],
                'username': user['username'],
                'full_name': user['full_name'],
                'role': user['role'],
                'created_at': user['created_at']
            }
    
    return None


# Keep old endpoints for backward compatibility during transition
@bp.route('/signup', methods=['POST'])
def signup():
    """Deprecated - use Keycloak registration"""
    return jsonify({
        'error': 'Direct signup is disabled. Please use Keycloak authentication.',
        'redirect': '/login'
    }), 410


@bp.route('/login', methods=['POST'])
def login():
    """Deprecated - use Keycloak login"""
    return jsonify({
        'error': 'Direct login is disabled. Please use Keycloak authentication.',
        'redirect': '/login'
    }), 410
