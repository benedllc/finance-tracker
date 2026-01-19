# Finance Tracker API Documentation

## Base URL
All finance endpoints are prefixed with `/api/finance`

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 📊 ACCOUNTS

### GET /api/finance/accounts
Get all accounts for the current user

**Response:**
```json
{
  "accounts": [
    {
      "id": 1,
      "name": "Cash",
      "type": "cash",
      "balance": 500.00,
      "currency": "USD",
      "is_active": 1,
      "created_at": "2025-11-03T12:00:00"
    }
  ]
}
```

### POST /api/finance/accounts
Create a new account

**Request Body:**
```json
{
  "name": "Savings Account",
  "type": "bank",
  "balance": 1000.00,
  "currency": "USD"
}
```

**Response:** `201 Created`

### PUT /api/finance/accounts/:id
Update an account

**Request Body:**
```json
{
  "name": "Updated Name",
  "balance": 1500.00,
  "is_active": true
}
```

### DELETE /api/finance/accounts/:id
Deactivate an account (soft delete)

---

## 💰 TRANSACTIONS

### GET /api/finance/transactions
Get transactions with optional filters

**Query Parameters:**
- `account_id` (int) - Filter by account
- `category_id` (int) - Filter by category
- `start_date` (string) - Format: YYYY-MM-DD
- `end_date` (string) - Format: YYYY-MM-DD
- `type` (string) - "income" or "expense"
- `limit` (int) - Default: 100
- `offset` (int) - Default: 0

**Response:**
```json
{
  "transactions": [
    {
      "id": 1,
      "account_id": 1,
      "category_id": 5,
      "amount": 50.00,
      "type": "expense",
      "description": "Grocery shopping",
      "transaction_date": "2025-11-03",
      "account_name": "Cash",
      "category_name": "Food & Dining",
      "category_icon": "🍔",
      "category_color": "#ef4444"
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

### POST /api/finance/transactions
Create a new transaction (automatically updates account balance)

**Request Body:**
```json
{
  "account_id": 1,
  "category_id": 5,
  "amount": 50.00,
  "type": "expense",
  "description": "Grocery shopping",
  "transaction_date": "2025-11-03"
}
```

**Response:** `201 Created`

### PUT /api/finance/transactions/:id
Update a transaction (recalculates account balance)

**Request Body:**
```json
{
  "amount": 60.00,
  "category_id": 6,
  "description": "Updated description"
}
```

### DELETE /api/finance/transactions/:id
Delete a transaction (reverts account balance)

---

## 📁 CATEGORIES

### GET /api/finance/categories
Get all categories (default + user custom)

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Salary",
      "type": "income",
      "icon": "💼",
      "color": "#10b981",
      "is_default": 1
    },
    {
      "id": 15,
      "name": "Custom Category",
      "type": "expense",
      "icon": "📝",
      "color": "#6b7280",
      "is_default": 0
    }
  ]
}
```

### POST /api/finance/categories
Create a custom category

**Request Body:**
```json
{
  "name": "My Custom Category",
  "type": "expense",
  "icon": "🎯",
  "color": "#8b5cf6"
}
```

---

## 📈 STATISTICS

### GET /api/finance/statistics/summary
Get financial summary

**Query Parameters:**
- `start_date` (string) - Optional: YYYY-MM-DD
- `end_date` (string) - Optional: YYYY-MM-DD

**Response:**
```json
{
  "total_balance": 2500.00,
  "total_income": 3000.00,
  "total_expenses": 1200.00,
  "net_savings": 1800.00,
  "top_categories": [
    {
      "name": "Food & Dining",
      "icon": "🍔",
      "color": "#ef4444",
      "total": 350.00,
      "transaction_count": 15
    }
  ]
}
```

### GET /api/finance/statistics/monthly
Get monthly income/expense trends

**Query Parameters:**
- `months` (int) - Default: 6 (last 6 months)

**Response:**
```json
{
  "monthly_data": [
    {
      "month": "2025-05",
      "income": 2000.00,
      "expenses": 800.00,
      "net": 1200.00
    },
    {
      "month": "2025-06",
      "income": 2500.00,
      "expenses": 1200.00,
      "net": 1300.00
    }
  ]
}
```

---

## 🎯 Default Categories

The system comes with 17 pre-configured categories:

**Income Categories:**
1. 💼 Salary (#10b981)
2. 💰 Bonus (#10b981)
3. 📊 Investment (#10b981)
4. 🎁 Gift (#10b981)

**Expense Categories:**
5. 🍔 Food & Dining (#ef4444)
6. 🚗 Transportation (#f59e0b)
7. 🏠 Housing (#3b82f6)
8. 💡 Utilities (#8b5cf6)
9. 🎬 Entertainment (#ec4899)
10. 🏥 Healthcare (#06b6d4)
11. 👕 Shopping (#f43f5e)
12. 📚 Education (#6366f1)
13. ✈️ Travel (#14b8a6)
14. 💳 Bills (#64748b)
15. 🔧 Maintenance (#f97316)
16. 🎯 Personal Care (#a855f7)
17. 📝 Other (#6b7280)

---

## ✅ Key Features

- **Automatic Balance Updates**: Creating, updating, or deleting transactions automatically adjusts account balances
- **Flexible Filtering**: Filter transactions by account, category, date range, and type
- **Category Management**: Use default categories or create custom ones
- **Statistics**: Get comprehensive financial summaries and trends
- **Pagination**: Transactions endpoint supports limit/offset for large datasets
- **Modular Design**: All endpoints can be used by future tools (goals, AI coaching, etc.)

---

## 🔒 Security

- All endpoints require authentication
- Users can only access their own financial data
- Account ownership is verified before any modifications
- Soft deletes for accounts (deactivation instead of deletion)

---

## 💡 Usage Examples

### Create an account and add a transaction
```javascript
// 1. Create account
POST /api/finance/accounts
{ "name": "Cash", "type": "cash", "balance": 100 }

// 2. Add expense transaction
POST /api/finance/transactions
{
  "account_id": 1,
  "category_id": 5,
  "amount": 25.50,
  "type": "expense",
  "description": "Lunch at cafe"
}
// Account balance automatically updated to 74.50

// 3. Get summary
GET /api/finance/statistics/summary
// Returns total balance, income, expenses, and top spending categories
```
