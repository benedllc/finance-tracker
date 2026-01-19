"""
Quick script to create admin user with default credentials
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
print("CREATING ADMIN USER")
print("=" * 60)

# Create admin with default credentials
email = "admin@bened.com"
username = "admin"
password = "admin123"

user = User.create(email, username, password)
if user:
    user.update(role='admin')
    print(f"\n✓ Admin user created successfully!")
    print(f"  Email: {email}")
    print(f"  Username: {username}")
    print(f"  Password: {password}")
    print(f"\n  Login at: http://localhost:3000/login")
else:
    print("\n✗ Failed to create user (may already exist)")
    print("Checking existing users...")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, email, role FROM users')
        users = cursor.fetchall()
        if users:
            print("\nExisting users:")
            for u in users:
                print(f"  {u['username']} ({u['email']}) - Role: {u['role']}")

print("\nDone!")
