# NFApps - Behavioral Health Financial Literacy Platform
## Project Plan & Architecture

### Mission Statement
Empower individuals transitioning from incarceration through a comprehensive financial management platform that promotes financial literacy, accountability, and long-term stability.

---

## User Roles & Access Control

### Role Definitions

#### 1. **Member** (Active Program Participant)
- **Duration**: 90-day program period
- **Access**:
  - Full finance tracker functionality
  - Personal dashboard with spending insights
  - Receipt upload and categorization
  - Budget creation and tracking
  - Financial education resources
- **Data Sharing**: Aggregated (anonymized) data visible to admins for program improvement

#### 2. **Graduate** (Alumni)
- **Duration**: Lifetime access post-graduation
- **Access**:
  - Continued access to personal finance tracker
  - Read historical data
  - Add new transactions (optional: can be time-limited)
  - Export personal financial reports
- **Restrictions**: Cannot access community features (if implemented later)

#### 3. **Admin** (System Administrator)
- **Access**:
  - View all users and their roles
  - Manage user accounts (activate, deactivate, reset passwords)
  - System configuration and settings
  - Analytics dashboard (aggregated program-wide insights)
  - Export reports for grant reporting
- **Cannot**: View individual transaction details without explicit consent/audit trail

#### 4. **Staff/Counselor** (Future Phase)
- **Access**:
  - View assigned members' financial progress
  - Provide guided support and interventions
  - Send encouragement/tips
- **Privacy**: Requires member consent for access

---

## Technical Architecture

### Backend Stack
- **Framework**: Flask (Python 3.x)
- **Database**: SQLite (development) → PostgreSQL (production)
- **Authentication**: JWT tokens with role-based permissions
- **File Storage**: Local filesystem (development) → AWS S3 or Azure Blob (production)
- **OCR**: Tesseract OCR for receipt text extraction

### Frontend Stack
- **Web**: React + Vite
- **Mobile**: React Native (Expo)
- **Charts**: Chart.js or Recharts
- **State Management**: Context API + React Query for caching

### Security Measures
- Password hashing (Werkzeug)
- JWT token expiration and refresh
- Role-based middleware (@require_role decorator)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- File upload validation (type, size limits)
- HTTPS enforcement (production)
- Audit logging for sensitive operations

---

## Database Schema

### Core Tables

#### `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member', 'graduate', 'staff')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    program_start_date DATE,
    graduation_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `accounts`
```sql
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK(account_type IN ('checking', 'savings', 'credit_card', 'cash')),
    institution TEXT,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    credit_limit DECIMAL(10, 2), -- For credit cards
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `categories`
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    color TEXT, -- Hex color for charts
    icon TEXT, -- Icon name/emoji
    parent_id INTEGER, -- For subcategories
    is_system BOOLEAN DEFAULT FALSE, -- System vs user-created
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

#### `transactions`
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    category_id INTEGER,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('income', 'expense', 'transfer')),
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
);
```

#### `receipts`
```sql
CREATE TABLE receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    ocr_text TEXT, -- Extracted text from OCR
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `receipt_items`
```sql
CREATE TABLE receipt_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id INTEGER NOT NULL,
    transaction_id INTEGER,
    item_description TEXT,
    amount DECIMAL(10, 2),
    category_id INTEGER,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

#### `budgets`
```sql
CREATE TABLE budgets (
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
);
```

#### `audit_log`
```sql
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## Feature Roadmap

### Phase 1: Foundation (Week 1-2) ✓ Core Infrastructure
- [x] User authentication system
- [ ] Role-based access control
- [ ] Admin dashboard (user management)
- [ ] Database schema implementation
- [ ] Basic profile management

### Phase 2: Finance Tracker Core (Week 3-4)
- [ ] Account management (CRUD)
- [ ] Transaction entry and listing
- [ ] Category system with defaults
- [ ] Basic dashboard with current balance
- [ ] Date filtering and search

### Phase 3: Receipt Management (Week 5-6)
- [ ] File upload endpoint (images)
- [ ] OCR integration (Tesseract)
- [ ] Receipt gallery view
- [ ] Link receipts to transactions
- [ ] Split receipt into line items

### Phase 4: Visualizations & Insights (Week 7-8)
- [ ] Dashboard charts (pie, line, bar)
- [ ] Income vs. Expenses summary
- [ ] Spending by category breakdown
- [ ] Monthly trends
- [ ] Budget vs. actual comparison

### Phase 5: Budget & Alerts (Week 9-10)
- [ ] Budget creation interface
- [ ] Real-time budget tracking
- [ ] Alert notifications (overspending)
- [ ] Savings goal tracking
- [ ] Financial health score

### Phase 6: Mobile Enhancement (Week 11-12)
- [ ] Mobile-optimized UI
- [ ] Camera integration for receipts
- [ ] Offline transaction entry
- [ ] Push notifications
- [ ] Biometric authentication

### Phase 7: Reporting & Export (Week 13-14)
- [ ] PDF report generation
- [ ] CSV export
- [ ] Monthly summary emails
- [ ] Graduation transition workflow
- [ ] Data retention policies

### Phase 8: Advanced Features (Future)
- [ ] Financial literacy modules
- [ ] Goal-setting wizard
- [ ] Debt payoff calculator
- [ ] Bill reminders
- [ ] Shared budgets (family)
- [ ] Staff counselor interface

---

## Default Categories

### Income Categories
- Wages/Salary
- Government Benefits
- Family Support
- Other Income

### Expense Categories
- **Housing**: Rent, Utilities, Maintenance
- **Transportation**: Gas, Bus Pass, Car Payment, Insurance
- **Food**: Groceries, Dining Out, Fast Food
- **Personal Care**: Toiletries, Haircuts, Hygiene
- **Healthcare**: Medications, Doctor Visits, Insurance
- **Clothing**: Clothes, Shoes, Laundry
- **Communication**: Phone, Internet
- **Debt Payments**: Credit Cards, Loans
- **Entertainment**: Movies, Hobbies, Subscriptions
- **Savings**: Emergency Fund, Long-term Savings
- **Other**: Miscellaneous

---

## API Endpoints

### Authentication
- `POST /api/signup` - Register new user
- `POST /api/login` - Login and get token
- `GET /api/profile` - Get current user
- `PUT /api/profile` - Update profile

### Admin (Role: admin)
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user role/status
- `DELETE /api/admin/users/:id` - Deactivate user
- `GET /api/admin/analytics` - System-wide statistics

### Accounts
- `GET /api/accounts` - List user's accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/:id` - Get account details
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Transactions
- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary` - Get spending summary

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create custom category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete custom category

### Receipts
- `POST /api/receipts/upload` - Upload receipt image
- `GET /api/receipts` - List user's receipts
- `GET /api/receipts/:id` - Get receipt details
- `POST /api/receipts/:id/parse` - Extract line items
- `DELETE /api/receipts/:id` - Delete receipt

### Budgets
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/:id` - Get budget details
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/status` - Current budget status

### Reports
- `GET /api/reports/monthly` - Monthly summary
- `GET /api/reports/category-breakdown` - Spending by category
- `GET /api/reports/income-expense` - Income vs expenses
- `GET /api/reports/export` - Export data (CSV/PDF)

---

## UI/UX Design Principles

### Simplicity First
- Large, clear buttons and text
- Minimal cognitive load
- One primary action per screen
- Progressive disclosure of complexity

### Visual Feedback
- Color-coded account types
- Red/green for income/expense
- Progress bars for budgets
- Icons for quick recognition

### Accessibility
- High contrast mode option
- Screen reader compatible
- Keyboard navigation
- Mobile-first responsive design

### Financial Literacy Integration
- Contextual tips and explanations
- "Why this matters" tooltips
- Celebration of milestones
- Positive reinforcement messaging

---

## Deployment Strategy

### Development Environment
- Local SQLite database
- Flask dev server (port 5000)
- Vite dev server (port 3000)
- Local file storage

### Production Environment
- **Hosting**: Heroku, Railway, or DigitalOcean
- **Database**: PostgreSQL
- **File Storage**: AWS S3 or Cloudinary
- **Domain**: Custom domain with SSL
- **Monitoring**: Error tracking (Sentry), analytics
- **Backups**: Daily automated database backups

---

## Privacy & Compliance

### Data Protection
- All financial data encrypted at rest
- Secure file storage with access controls
- No selling or sharing of user data
- GDPR-compliant data export/deletion

### User Consent
- Clear privacy policy
- Opt-in for data analytics
- Explicit consent for staff access
- Right to be forgotten implementation

### Audit Trail
- Log all admin actions
- Track data access and modifications
- Regular security audits
- Incident response plan

---

## Success Metrics

### User Engagement
- Daily active users
- Average transactions per user
- Receipt upload rate
- Budget creation rate

### Financial Outcomes
- Average savings growth
- Debt reduction trends
- Budget adherence rate
- Financial literacy quiz scores

### Program Impact
- Member completion rate
- Post-graduation engagement
- User satisfaction scores
- Longitudinal outcome tracking

---

## Next Steps

1. **Immediate**: Implement role system and admin dashboard
2. **Week 1-2**: Build finance tracker core (accounts + transactions)
3. **Week 3**: Add receipt upload and basic OCR
4. **Week 4**: Create visualization dashboard
5. **Continuous**: User testing with actual program members
6. **Iterate**: Refine based on real-world feedback

---

*Last Updated: November 3, 2025*
