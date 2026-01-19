"""
Admin user setup script
Run this to create the first admin user or promote an existing user to admin

Usage:
    python setup_admin.py list                          # List all users
    python setup_admin.py promote <user_id>             # Promote user to admin
    python setup_admin.py create <email> <username> <password> [full_name]
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, get_db
from app.models import User
from config import config

def list_users():
    """List all users"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, email, role, status FROM users')
        users = cursor.fetchall()
        
        if not users:
            print("No users found in database.")
            return []
        
        print("\n=== Current Users ===")
        for user in users:
            print(f"ID: {user['id']:3} | Username: {user['username']:15} | Email: {user['email']:25} | Role: {user['role']:10} | Status: {user['status']}")
        print("=" * 80 + "\n")
        return users

def promote_to_admin(user_id):
    """Promote a user to admin role"""
    try:
        user_id = int(user_id)
    except ValueError:
        print(f"Error: Invalid user ID '{user_id}'")
        return False
    
    user = User.get_by_id(user_id)
    if not user:
        print(f"Error: User with ID {user_id} not found")
        return False
    
    if user.role == 'admin':
        print(f"User '{user.username}' is already an admin")
        return True
    
    success = user.update(role='admin', status='active')
    if success:
        print(f"✓ Successfully promoted '{user.username}' to admin role")
        return True
    else:
        print(f"✗ Failed to promote user")
        return False

def create_admin_user(email, username, password, full_name=None):
    """Create a new admin user"""
    print(f"\nCreating admin user: {username}")
    
    # Create user
    user = User.create(email, username, password, full_name)
    if not user:
        print("✗ Failed to create user (username or email may already exist)")
        return False
    
    # Promote to admin
    success = user.update(role='admin')
    if success:
        print(f"✓ Successfully created admin user: {username}")
        print(f"  Email: {email}")
        if full_name:
            print(f"  Name: {full_name}")
        return True
    else:
        print("✗ Failed to set admin role")
        return False

def print_usage():
    """Print usage information"""
    print(__doc__)

def main():
    # Initialize database
    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    init_db(db_path)
    
    print("=" * 80)
    print("NFApps - Admin User Setup")
    print("=" * 80)
    
    if len(sys.argv) < 2:
        print_usage()
        print("\nListing all users...\n")
        list_users()
        return
    
    command = sys.argv[1].lower()
    
    if command == 'list':
        list_users()
    
    elif command == 'promote':
        if len(sys.argv) < 3:
            print("Error: Missing user ID")
            print("Usage: python setup_admin.py promote <user_id>")
            print("\nAvailable users:")
            list_users()
        else:
            promote_to_admin(sys.argv[2])
    
    elif command == 'create':
        if len(sys.argv) < 5:
            print("Error: Missing required arguments")
            print("Usage: python setup_admin.py create <email> <username> <password> [full_name]")
        else:
            email = sys.argv[2]
            username = sys.argv[3]
            password = sys.argv[4]
            full_name = sys.argv[5] if len(sys.argv) > 5 else None
            create_admin_user(email, username, password, full_name)
    
    else:
        print(f"Error: Unknown command '{command}'")
        print_usage()

if __name__ == '__main__':
    main()
