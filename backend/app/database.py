import sqlite3
from contextlib import contextmanager
import os

DATABASE_PATH = None


def init_db(db_path):
    """Initialize the database and create tables if they don't exist"""
    global DATABASE_PATH
    DATABASE_PATH = db_path
    
    # Create database directory if it doesn't exist
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keycloak_id TEXT UNIQUE,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                full_name TEXT,
                role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member', 'graduate', 'staff', 'user')),
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
                program_start_date DATE,
                graduation_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create accounts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                account_name TEXT NOT NULL,
                account_type TEXT NOT NULL CHECK(account_type IN ('checking', 'savings', 'credit_card', 'cash')),
                institution TEXT,
                balance DECIMAL(10, 2) DEFAULT 0.00,
                credit_limit DECIMAL(10, 2),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
        
        # Create categories table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                color TEXT,
                icon TEXT,
                parent_id INTEGER,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
            )
        ''')
        
        # Create receipts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS receipts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                display_name TEXT,
                file_size INTEGER,
                ocr_text TEXT,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
        
        # Create transactions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                account_id INTEGER NOT NULL,
                category_id INTEGER,
                type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
                amount DECIMAL(10, 2) NOT NULL,
                description TEXT,
                transaction_date DATE NOT NULL,
                notes TEXT,
                receipt_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE SET NULL
            )
        ''')
        
        # Create receipt_items table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS receipt_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                receipt_id INTEGER NOT NULL,
                transaction_id INTEGER,
                item_description TEXT,
                amount DECIMAL(10, 2),
                category_id INTEGER,
                FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
                FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            )
        ''')
        
        # Create budgets table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                category_id INTEGER NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                period TEXT DEFAULT 'monthly' CHECK(period IN ('weekly', 'monthly', 'yearly')),
                start_date DATE NOT NULL,
                end_date DATE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )
        ''')
        
        # Create audit_log table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                entity_type TEXT,
                entity_id INTEGER,
                details TEXT,
                ip_address TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        ''')
        
        # Insert default categories
        _insert_default_categories(cursor)
        
        # Migrations: Add display_name column if it doesn't exist
        try:
            cursor.execute("SELECT display_name FROM receipts LIMIT 1")
        except:
            print("Adding display_name column to receipts table...")
            cursor.execute("ALTER TABLE receipts ADD COLUMN display_name TEXT")
        
        conn.commit()
        print(f"Database initialized at {db_path}")


def _insert_default_categories(cursor):
    """Insert default system categories"""
    default_categories = [
        # Income categories
        ('Wages/Salary', 'income', '#10b981', '💼', True),
        ('Government Benefits', 'income', '#3b82f6', '🏛️', True),
        ('Family Support', 'income', '#8b5cf6', '👨‍👩‍👧', True),
        ('Other Income', 'income', '#6b7280', '💰', True),
        
        # Expense categories
        ('Housing', 'expense', '#ef4444', '🏠', True),
        ('Transportation', 'expense', '#f59e0b', '🚗', True),
        ('Food - Groceries', 'expense', '#22c55e', '🛒', True),
        ('Food - Dining Out', 'expense', '#84cc16', '🍽️', True),
        ('Personal Care', 'expense', '#ec4899', '💇', True),
        ('Healthcare', 'expense', '#06b6d4', '🏥', True),
        ('Clothing', 'expense', '#a855f7', '👕', True),
        ('Communication', 'expense', '#14b8a6', '📱', True),
        ('Debt Payments', 'expense', '#dc2626', '💳', True),
        ('Entertainment', 'expense', '#f97316', '🎬', True),
        ('Savings', 'expense', '#059669', '🏦', True),
        ('Utilities', 'expense', '#eab308', '⚡', True),
        ('Other', 'expense', '#64748b', '📝', True),
    ]
    
    for name, type_, color, icon, is_default in default_categories:
        cursor.execute('''
            INSERT OR IGNORE INTO categories (name, type, color, icon, is_default)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, type_, color, icon, is_default))


@contextmanager
def get_db():
    """Get database connection as context manager"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def dict_from_row(row):
    """Convert SQLite Row to dictionary"""
    return dict(zip(row.keys(), row)) if row else None
