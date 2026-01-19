"""
Keycloak Authentication for BENED Finance Tracker
Validates JWT tokens issued by Keycloak
"""

import os
import requests
import jwt
from functools import wraps
from flask import request, jsonify, g
from jwt import PyJWKClient

# Keycloak Configuration
KEYCLOAK_URL = os.getenv('KEYCLOAK_URL', 'https://auth.bened.works')
KEYCLOAK_REALM = os.getenv('KEYCLOAK_REALM', 'Bened')
KEYCLOAK_CLIENT_ID = os.getenv('KEYCLOAK_CLIENT_ID', 'bened-finance')
KEYCLOAK_CLIENT_SECRET = os.getenv('KEYCLOAK_CLIENT_SECRET')

# Derived URLs
KEYCLOAK_ISSUER = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
KEYCLOAK_JWKS_URI = f"{KEYCLOAK_ISSUER}/protocol/openid-connect/certs"
KEYCLOAK_TOKEN_URL = f"{KEYCLOAK_ISSUER}/protocol/openid-connect/token"

# Cache for JWKS client
_jwks_client = None

def get_jwks_client():
    """Get or create cached JWKS client"""
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(KEYCLOAK_JWKS_URI)
    return _jwks_client


def verify_keycloak_token(token):
    """
    Verify a Keycloak JWT token and return user info
    Returns dict with user info or None if invalid
    """
    try:
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=KEYCLOAK_ISSUER,
            audience="account",  # Keycloak uses 'account' as default audience
            options={"verify_aud": False}  # Be flexible with audience
        )
        
        return {
            'sub': payload.get('sub'),
            'email': payload.get('email'),
            'email_verified': payload.get('email_verified', False),
            'name': payload.get('name'),
            'given_name': payload.get('given_name'),
            'family_name': payload.get('family_name'),
            'preferred_username': payload.get('preferred_username'),
            'roles': payload.get('realm_access', {}).get('roles', [])
        }
    except jwt.ExpiredSignatureError:
        print("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


def exchange_code_for_tokens(code, redirect_uri):
    """
    Exchange authorization code for tokens
    Returns dict with access_token, refresh_token, id_token
    """
    try:
        response = requests.post(
            KEYCLOAK_TOKEN_URL,
            data={
                'grant_type': 'authorization_code',
                'client_id': KEYCLOAK_CLIENT_ID,
                'client_secret': KEYCLOAK_CLIENT_SECRET,
                'code': code,
                'redirect_uri': redirect_uri
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Token exchange failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Token exchange error: {e}")
        return None


def refresh_tokens(refresh_token):
    """
    Refresh access token using refresh token
    Returns dict with new tokens
    """
    try:
        response = requests.post(
            KEYCLOAK_TOKEN_URL,
            data={
                'grant_type': 'refresh_token',
                'client_id': KEYCLOAK_CLIENT_ID,
                'client_secret': KEYCLOAK_CLIENT_SECRET,
                'refresh_token': refresh_token
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Token refresh failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"Token refresh error: {e}")
        return None


def keycloak_required(f):
    """
    Decorator to require valid Keycloak token
    Sets g.keycloak_user with user info from token
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        token = parts[1]
        user_info = verify_keycloak_token(token)
        
        if not user_info:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        g.keycloak_user = user_info
        return f(*args, **kwargs)
    
    return decorated_function


def get_keycloak_config():
    """Return Keycloak configuration for frontend"""
    return {
        'url': KEYCLOAK_URL,
        'realm': KEYCLOAK_REALM,
        'clientId': KEYCLOAK_CLIENT_ID,
        'authUrl': f"{KEYCLOAK_ISSUER}/protocol/openid-connect/auth",
        'tokenUrl': f"{KEYCLOAK_ISSUER}/protocol/openid-connect/token",
        'logoutUrl': f"{KEYCLOAK_ISSUER}/protocol/openid-connect/logout",
        'userInfoUrl': f"{KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo"
    }
