"""
Quick script to create an admin user or promote existing user
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, get_db
from app.models import User

# Initialize database
db_path = os.path.join(os.path.dirname(__file__), 'database.db')
init_db(db_path)

print("=" * 60)
print("QUICK ADMIN SETUP")
print("=" * 60)

# List existing users
with get_db() as conn:
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, role FROM users')
    users = cursor.fetchall()
    
    if users:
        print("\nExisting users:")
        for user in users:
            print(f"  ID {user['id']}: {user['username']} ({user['email']}) - Role: {user['role']}")
        print()

# Prompt for action
print("What would you like to do?")
print("1. Create NEW admin user")
print("2. Promote EXISTING user to admin by ID")
print()

# Get choice - try raw_input for Python 2 compatibility
try:
    choice = raw_input("Enter 1 or 2: ").strip()
except NameError:
    choice = input("Enter 1 or 2: ").strip()

if choice == "1":
    # Create new admin
    print("\nEnter details for new admin user:")
    try:
        email = raw_input("Email: ").strip()
        username = raw_input("Username: ").strip()
        password = raw_input("Password: ").strip()
    except NameError:
        email = input("Email: ").strip()
        username = input("Username: ").strip()
        password = input("Password: ").strip()
    
    user = User.create(email, username, password)
    if user:
        user.update(role='admin')
        print(f"\n✓ Created admin user '{username}' successfully!")
    else:
        print("\n✗ Failed to create user (may already exist)")

elif choice == "2":
    # Promote existing
    if not users:
        print("\n✗ No users found to promote")
    else:
        try:
            user_id = raw_input("Enter user ID to promote: ").strip()
        except NameError:
            user_id = input("Enter user ID to promote: ").strip()
        
        user = User.get_by_id(int(user_id))
        if user:
            user.update(role='admin')
            print(f"\n✓ Promoted '{user.username}' to admin!")
        else:
            print(f"\n✗ User ID {user_id} not found")
else:
    print("\n✗ Invalid choice")

print("\nDone!")
