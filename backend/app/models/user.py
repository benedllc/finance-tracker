from app.database import get_db, dict_from_row
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import sqlite3


class User:
    """User model for database operations"""
    
    def __init__(self, id=None, email=None, username=None, password_hash=None, 
                 full_name=None, phone=None, profile_picture=None,
                 role='member', status='active', 
                 program_start_date=None, graduation_date=None,
                 created_at=None, updated_at=None):
        self.id = id
        self.email = email
        self.username = username
        self.password_hash = password_hash
        self.full_name = full_name
        self.phone = phone
        self.profile_picture = profile_picture
        self.role = role
        self.status = status
        self.program_start_date = program_start_date
        self.graduation_date = graduation_date
        self.created_at = created_at
        self.updated_at = updated_at
    
    @staticmethod
    def create(email, username, password, full_name=None):
        """Create a new user"""
        password_hash = generate_password_hash(password)
        
        with get_db() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute(
                    '''INSERT INTO users (email, username, password_hash, full_name)
                       VALUES (?, ?, ?, ?)''',
                    (email, username, password_hash, full_name)
                )
                conn.commit()
                user_id = cursor.lastrowid
                return User.get_by_id(user_id)
            except sqlite3.IntegrityError:
                return None
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            row = cursor.fetchone()
            return User.from_db_row(row) if row else None
    
    @staticmethod
    def get_by_email(email):
        """Get user by email"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
            row = cursor.fetchone()
            return User.from_db_row(row) if row else None
    
    @staticmethod
    def get_by_username(username):
        """Get user by username"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            row = cursor.fetchone()
            return User.from_db_row(row) if row else None
    
    @staticmethod
    def from_db_row(row):
        """Create User instance from database row"""
        if not row:
            return None
        # Convert row to dict to handle both old and new schema
        row_dict = dict(row)
        return User(
            id=row_dict['id'],
            email=row_dict['email'],
            username=row_dict['username'],
            password_hash=row_dict['password_hash'],
            full_name=row_dict.get('full_name'),
            phone=row_dict.get('phone'),
            profile_picture=row_dict.get('profile_picture'),
            role=row_dict.get('role', 'member'),
            status=row_dict.get('status', 'active'),
            program_start_date=row_dict.get('program_start_date'),
            graduation_date=row_dict.get('graduation_date'),
            created_at=row_dict['created_at'],
            updated_at=row_dict['updated_at']
        )
    
    def verify_password(self, password):
        """Verify password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def update(self, **kwargs):
        """Update user information"""
        allowed_fields = ['email', 'username', 'full_name', 'phone', 'profile_picture',
                         'role', 'status', 'program_start_date', 'graduation_date']
        
        # Include fields that are in allowed list and were explicitly provided
        update_fields = {}
        for k, v in kwargs.items():
            if k in allowed_fields:
                # For date and phone fields, treat empty strings as None
                if k in ['program_start_date', 'graduation_date', 'phone']:
                    if v and v.strip():  # Has actual content
                        update_fields[k] = v
                    else:
                        update_fields[k] = None
                # For other fields, skip if None or empty
                elif v is not None and v != '':
                    update_fields[k] = v
        
        print(f"[User.update] Fields to update: {update_fields}")
        
        if not update_fields:
            print("[User.update] No fields to update")
            return False
        
        update_fields['updated_at'] = datetime.utcnow().isoformat()
        
        with get_db() as conn:
            cursor = conn.cursor()
            set_clause = ', '.join([f'{k} = ?' for k in update_fields.keys()])
            values = list(update_fields.values()) + [self.id]
            
            print(f"[User.update] SQL: UPDATE users SET {set_clause} WHERE id = {self.id}")
            print(f"[User.update] Values: {values}")
            
            try:
                cursor.execute(
                    f'UPDATE users SET {set_clause} WHERE id = ?',
                    values
                )
                conn.commit()
                rowcount = cursor.rowcount
                print(f"[User.update] Rows affected: {rowcount}")
                return rowcount > 0
            except sqlite3.IntegrityError as e:
                print(f"[User.update] IntegrityError: {e}")
                return False
            except Exception as e:
                print(f"[User.update] Error: {e}")
                return False
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary (exclude sensitive data by default)"""
        user_dict = {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'full_name': self.full_name,
            'phone': self.phone,
            'profile_picture': self.profile_picture,
            'role': self.role,
            'status': self.status,
            'program_start_date': self.program_start_date,
            'graduation_date': self.graduation_date,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
        
        if include_sensitive:
            user_dict['password_hash'] = self.password_hash
        
        return user_dict
    
    @staticmethod
    def get_all_users():
        """Get all users (admin only)"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
            rows = cursor.fetchall()
            return [User.from_db_row(row) for row in rows]
    
    def has_role(self, required_role):
        """Check if user has required role"""
        role_hierarchy = {'admin': 3, 'staff': 2, 'member': 1, 'graduate': 1}
        return role_hierarchy.get(self.role, 0) >= role_hierarchy.get(required_role, 0)
