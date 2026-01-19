from flask import Blueprint, request, jsonify
from app.models import User
from app.utils import (
    generate_token,
    validate_email,
    validate_password,
    validate_username
)

bp = Blueprint('auth', __name__, url_prefix='/api')


@bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    email = data.get('email', '').strip()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()
    
    # Validate email
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate username
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    is_valid, error_msg = validate_username(username)
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    # Validate password
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    is_valid, error_msg = validate_password(password)
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    # Check if user already exists
    if User.get_by_email(email):
        return jsonify({'error': 'Email already registered'}), 409
    
    if User.get_by_username(username):
        return jsonify({'error': 'Username already taken'}), 409
    
    # Create user
    user = User.create(
        email=email,
        username=username,
        password=password,
        full_name=full_name if full_name else None
    )
    
    if not user:
        return jsonify({'error': 'Failed to create user'}), 500
    
    # Create default cash account for new user
    try:
        from app.database import get_db
        db = get_db()
        db.execute('''
            INSERT INTO accounts (user_id, account_name, account_type, balance, is_active)
            VALUES (?, 'Cash', 'cash', 0.00, 1)
        ''', (user.id,))
        db.commit()
    except Exception as e:
        print(f"Warning: Failed to create default account for user {user.id}: {e}")
        # Don't fail signup if account creation fails
    
    # Generate token
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'User created successfully',
        'token': token,
        'user': user.to_dict()
    }), 201


@bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return token"""
    data = request.get_json()
    
    # Validate required fields
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    identifier = data.get('email') or data.get('username')
    password = data.get('password', '')
    
    if not identifier:
        return jsonify({'error': 'Email or username is required'}), 400
    
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    
    # Find user by email or username
    user = User.get_by_email(identifier) or User.get_by_username(identifier)
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Verify password
    if not user.verify_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate token
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200
