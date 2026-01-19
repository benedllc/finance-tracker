import sys
sys.path.insert(0, '.')

from app.database import init_db, get_db
from app.models import User

init_db('database.db')

print("=" * 60)
print("CURRENT USERS")
print("=" * 60)

with get_db() as conn:
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, role, status FROM users')
    users = cursor.fetchall()
    
    if users:
        for u in users:
            user_dict = dict(u)
            print(f"ID {user_dict['id']}: {user_dict['username']:15} | {user_dict['email']:25} | {user_dict['role']:10} | {user_dict['status']}")
    else:
        print("No users found")

print("=" * 60)
print("\nTo make a user admin, enter their ID below")
print("Or press Enter to create a new admin user")
print()

user_input = input("User ID (or press Enter for new): ").strip()

if user_input:
    # Promote existing user
    user_id = int(user_input)
    user = User.get_by_id(user_id)
    if user:
        user.update(role='admin', status='active')
        print(f"\n✓ User '{user.username}' is now an admin!")
    else:
        print(f"\n✗ User ID {user_id} not found")
else:
    # Create new admin
    print("\nCreating new admin user...")
    email = "admin@nfapps.com"
    username = "admin"
    password = "admin123"
    
    user = User.create(email, username, password, "Admin User")
    if user:
        user.update(role='admin')
        print("\n✓ Admin user created successfully!")
        print(f"  Username: {username}")
        print(f"  Password: {password}")
        print(f"  Email: {email}")
    else:
        print("\n✗ Failed - user may already exist. Try promoting existing user instead.")
