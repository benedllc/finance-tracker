# NFApps Backend - Flask REST API

A robust Flask REST API providing authentication and data management for web and mobile applications.

## 🎯 Features

- JWT-based authentication
- User registration and login
- Profile management
- SQLite database (production-ready for PostgreSQL/MySQL)
- Password hashing with Werkzeug
- CORS enabled for cross-origin requests
- Modular architecture for scalability

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py           # Application factory
│   ├── database.py           # Database connection and initialization
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py           # User model
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py           # Authentication routes
│   │   └── user.py           # User profile routes
│   └── utils/
│       ├── __init__.py
│       └── auth.py           # JWT utilities and validators
├── config.py                 # Configuration management
├── run.py                    # Application entry point
├── requirements.txt          # Python dependencies
├── .env.example             # Environment variables template
└── .gitignore               # Git ignore rules
```

## 🚀 Setup Instructions

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Navigate to backend directory**
   ```powershell
   cd backend
   ```

2. **Create virtual environment**
   ```powershell
   python -m venv venv
   ```

3. **Activate virtual environment**
   ```powershell
   # PowerShell
   .\venv\Scripts\Activate.ps1
   
   # Command Prompt
   .\venv\Scripts\activate.bat
   
   # Git Bash
   source venv/Scripts/activate
   ```

4. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

5. **Create environment file**
   ```powershell
   cp .env.example .env
   ```

6. **Update .env file**
   Edit `.env` and set your own secret key:
   ```
   SECRET_KEY=your-unique-secret-key-here-make-it-long-and-random
   DATABASE_PATH=database.db
   JWT_EXPIRATION_HOURS=24
   FLASK_ENV=development
   FLASK_DEBUG=True
   ```

7. **Run the application**
   ```powershell
   python run.py
   ```

The API will start on `http://localhost:5000`

## 🔌 API Endpoints

### Health Check

**GET** `/api/health`
- Check API status
- No authentication required

**Response:**
```json
{
  "status": "healthy",
  "message": "API is running"
}
```

### Authentication

**POST** `/api/signup`
- Register a new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "full_name": "John Doe" // optional
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "full_name": "John Doe",
    "created_at": "2025-10-30T12:00:00",
    "updated_at": "2025-10-30T12:00:00"
  }
}
```

**POST** `/api/login`
- Authenticate user

**Request Body:**
```json
{
  "email": "user@example.com",  // or "username": "username"
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "full_name": "John Doe",
    "created_at": "2025-10-30T12:00:00",
    "updated_at": "2025-10-30T12:00:00"
  }
}
```

### User Profile

**GET** `/api/profile`
- Get current user's profile
- Requires authentication

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "full_name": "John Doe",
    "created_at": "2025-10-30T12:00:00",
    "updated_at": "2025-10-30T12:00:00"
  }
}
```

**PUT** `/api/profile`
- Update user profile
- Requires authentication

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "newemail@example.com",  // optional
  "username": "newusername",        // optional
  "full_name": "Jane Doe"           // optional
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "email": "newemail@example.com",
    "username": "newusername",
    "full_name": "Jane Doe",
    "created_at": "2025-10-30T12:00:00",
    "updated_at": "2025-10-30T12:05:00"
  }
}
```

## 🔐 Authentication

This API uses **JWT (JSON Web Tokens)** for authentication:

1. User logs in or signs up
2. Server generates a JWT token
3. Client stores the token
4. Client includes token in `Authorization` header for protected routes
5. Server validates token and processes request

### Token Format
```
Authorization: Bearer <token>
```

### Token Expiration
Tokens expire after 24 hours (configurable in `.env`)

## 🗄️ Database

### SQLite (Development)
- Database file: `database.db`
- Automatically created on first run
- Located in project root

### PostgreSQL/MySQL (Production)
To migrate to PostgreSQL or MySQL:

1. Install appropriate database adapter:
   ```powershell
   pip install psycopg2-binary  # PostgreSQL
   # or
   pip install pymysql          # MySQL
   ```

2. Update database connection in `app/database.py`

3. Update `DATABASE_PATH` in `.env` with connection string

## ⚙️ Configuration

### Environment Variables (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT signing key | `dev-secret-key-change-in-production` |
| `DATABASE_PATH` | Database file path | `database.db` |
| `JWT_EXPIRATION_HOURS` | Token expiration time | `24` |
| `FLASK_ENV` | Flask environment | `development` |
| `FLASK_DEBUG` | Enable debug mode | `True` |

### CORS Configuration

Configured in `config.py`:
```python
CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:19006']
```

Add your production URLs to this list.

## 🧪 Testing the API

### Using cURL

**Health Check:**
```powershell
curl http://localhost:5000/api/health
```

**Sign Up:**
```powershell
curl -X POST http://localhost:5000/api/signup `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"username\":\"testuser\",\"password\":\"password123\"}'
```

**Login:**
```powershell
curl -X POST http://localhost:5000/api/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'
```

**Get Profile:**
```powershell
curl http://localhost:5000/api/profile `
  -H "Authorization: Bearer <your-token>"
```

### Using Postman

1. Create a new request
2. Set method and URL
3. Add headers if needed
4. Add JSON body for POST/PUT requests
5. Send request

## 📦 Dependencies

- **Flask (3.0.0)**: Web framework
- **Flask-CORS (4.0.0)**: CORS support
- **PyJWT (2.8.0)**: JWT implementation
- **python-dotenv (1.0.0)**: Environment variable management
- **Werkzeug (3.0.1)**: Password hashing utilities

## 🚀 Production Deployment

### Prerequisites
1. Choose a hosting platform (Heroku, AWS, DigitalOcean, etc.)
2. Set up PostgreSQL database
3. Configure environment variables

### Steps

1. **Update configuration**
   - Set production `SECRET_KEY`
   - Update `DATABASE_PATH` with production database URL
   - Set `FLASK_ENV=production`
   - Set `FLASK_DEBUG=False`
   - Update `CORS_ORIGINS` with production URLs

2. **Install production dependencies**
   ```powershell
   pip install gunicorn psycopg2-binary
   ```

3. **Create Procfile** (for Heroku)
   ```
   web: gunicorn run:app
   ```

4. **Deploy**
   ```powershell
   git push heroku main
   ```

## 🛡️ Security Best Practices

- ✅ Passwords are hashed with Werkzeug
- ✅ JWT tokens for authentication
- ✅ CORS configured for specific origins
- ⚠️ Change `SECRET_KEY` in production
- ⚠️ Use HTTPS in production
- ⚠️ Implement rate limiting
- ⚠️ Add input sanitization for production

## 🐛 Troubleshooting

### Port already in use
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F
```

### Database not found
- Ensure you're in the backend directory
- Check `DATABASE_PATH` in `.env`
- Database is created automatically on first run

### Import errors
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

## 📝 Adding New Features

### Add a new model
1. Create file in `app/models/`
2. Define model class
3. Update `app/models/__init__.py`
4. Add database table in `app/database.py`

### Add new endpoints
1. Create file in `app/routes/`
2. Define blueprint and routes
3. Register blueprint in `app/__init__.py`

### Add authentication to route
Use the `@token_required` decorator:
```python
from app.utils import token_required

@bp.route('/protected', methods=['GET'])
@token_required
def protected_route(user):
    return jsonify({'message': 'Success', 'user': user.to_dict()})
```

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

**Backend is ready! Start the frontend applications to complete the setup.**
