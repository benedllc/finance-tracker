"""
BENED Finance Tracker - Super Admin Configuration
Hardcoded super admin users with full system access
"""

# Super admin Keycloak IDs - these users have full admin access
SUPER_ADMIN_KEYCLOAK_IDS = [
    '9fc5dab9-ac45-47b5-8742-cad00ab70c3b',  # jeremy.waltrip
]

# Super admin usernames (fallback check)
SUPER_ADMIN_USERNAMES = [
    'jeremy.waltrip',
]


def is_super_admin(user):
    """
    Check if a user is a super admin
    
    Args:
        user: User object with keycloak_id and/or username attributes
        
    Returns:
        bool: True if user is a super admin
    """
    # Check by keycloak_id
    keycloak_id = getattr(user, 'keycloak_id', None)
    if keycloak_id and keycloak_id in SUPER_ADMIN_KEYCLOAK_IDS:
        return True
    
    # Check by username
    username = getattr(user, 'username', None)
    if username and username in SUPER_ADMIN_USERNAMES:
        return True
    
    return False


def is_admin(user):
    """
    Check if a user has admin privileges (super admin or regular admin role)
    
    Args:
        user: User object with role attribute
        
    Returns:
        bool: True if user is an admin
    """
    if is_super_admin(user):
        return True
    
    role = getattr(user, 'role', None)
    return role == 'admin'
