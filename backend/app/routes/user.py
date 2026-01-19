from flask import Blueprint, request, jsonify
from app.utils import token_required

bp = Blueprint('user', __name__, url_prefix='/api')


@bp.route('/profile', methods=['GET'])
@token_required
def get_profile(user):
    """Get current user's profile"""
    return jsonify({
        'user': user.to_dict()
    }), 200


@bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(user):
    """Update current user's profile"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Check if email is being changed and if it's already taken
    new_email = data.get('email')
    if new_email and new_email != user.email:
        from app.models import User
        existing = User.get_by_email(new_email)
        if existing and existing.id != user.id:
            return jsonify({'error': 'Email already in use'}), 409
    
    # Check if username is being changed and if it's already taken
    new_username = data.get('username')
    if new_username and new_username != user.username:
        from app.models import User
        existing = User.get_by_username(new_username)
        if existing and existing.id != user.id:
            return jsonify({'error': 'Username already taken'}), 409
    
    # Debug logging
    print(f"Received data: {data}")
    print(f"Program start date: {data.get('program_start_date')}")
    print(f"Graduation date: {data.get('graduation_date')}")
    
    # Update user
    success = user.update(
        email=data.get('email'),
        username=data.get('username'),
        full_name=data.get('full_name'),
        phone=data.get('phone'),
        program_start_date=data.get('program_start_date'),
        graduation_date=data.get('graduation_date')
    )
    
    print(f"Update success: {success}")
    
    if not success:
        return jsonify({'error': 'Failed to update profile'}), 500
    
    # Reload user data
    from app.models import User
    updated_user = User.get_by_id(user.id)
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': updated_user.to_dict()
    }), 200
