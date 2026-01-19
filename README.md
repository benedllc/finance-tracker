# NFApps - Unified Software Framework

A comprehensive full-stack application framework consisting of a Flask REST API backend with React web frontend and React Native mobile application.

## 🏗️ Architecture Overview

This project implements a **clean separation of concerns** architecture:

- **Backend (Flask)**: RESTful API handling authentication, business logic, and data persistence
- **Web Frontend (React)**: Modern web application with routing and state management
- **Mobile Frontend (React Native)**: Cross-platform mobile app for iOS and Android

### Key Features

- 🔐 **JWT Authentication**: Secure token-based authentication across all platforms
- 🗄️ **SQLite Database**: Easy-to-use database with scalability path to PostgreSQL/MySQL
- 🌐 **CORS Enabled**: Seamless communication between frontend and backend
- 📱 **Cross-Platform**: Unified experience across web and mobile
- ⚡ **RESTful API**: Clean, standardized API endpoints
- 🔧 **Modular Design**: Easy to maintain and extend

## 📁 Project Structure

```
NFApps/
├── backend/           # Flask REST API
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── config.py
│   ├── run.py
│   └── requirements.txt
├── web/              # React Web Application
│   ├── src/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── mobile/           # React Native Mobile App
    ├── src/
    │   ├── screens/
    │   ├── context/
    │   ├── services/
    │   └── styles/
    ├── App.js
    └── package.json
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+ (for backend)
- Node.js 16+ (for web and mobile)
- npm or yarn
- Expo CLI (for mobile development)

### Backend Setup

See [backend/README.md](./backend/README.md) for detailed instructions.

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
python run.py
```

Backend will run on `http://localhost:5000`

### Web Frontend Setup

See [web/README.md](./web/README.md) for detailed instructions.

```powershell
cd web
npm install
npm run dev
```

Web app will run on `http://localhost:3000`

### Mobile Frontend Setup

See [mobile/README.md](./mobile/README.md) for detailed instructions.

```powershell
cd mobile
npm install
npm start
```

## 🔌 API Endpoints

### Authentication

- `POST /api/signup` - Register new user
- `POST /api/login` - Authenticate user
- `GET /api/profile` - Get user profile (requires auth)
- `PUT /api/profile` - Update user profile (requires auth)

### Health Check

- `GET /api/health` - API health status

## 🔐 Authentication Flow

1. User registers or logs in via `/api/signup` or `/api/login`
2. Server validates credentials and returns JWT token
3. Client stores token (localStorage for web, AsyncStorage for mobile)
4. Client includes token in `Authorization: Bearer <token>` header for protected routes
5. Server validates token and processes request

## 🛠️ Technology Stack

### Backend
- **Flask**: Lightweight Python web framework
- **PyJWT**: JSON Web Token implementation
- **SQLite**: Embedded database (easily upgradable)
- **Werkzeug**: Password hashing and security utilities
- **Flask-CORS**: Cross-origin resource sharing

### Web Frontend
- **React 18**: Modern UI library
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Vite**: Fast build tool and dev server

### Mobile Frontend
- **React Native**: Cross-platform mobile framework
- **Expo**: Development and build toolchain
- **React Navigation**: Native navigation
- **Axios**: HTTP client
- **AsyncStorage**: Persistent storage

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 🔄 Development Workflow

1. **Start Backend**: Run Flask server first
2. **Start Web/Mobile**: Run frontend applications
3. **Make Changes**: Edit code in respective directories
4. **Test**: Use the applications to test functionality
5. **Commit**: Commit changes to version control

## 🌐 Environment Configuration

### Backend (.env)
```
SECRET_KEY=your-secret-key-here
DATABASE_PATH=database.db
JWT_EXPIRATION_HOURS=24
FLASK_ENV=development
FLASK_DEBUG=True
```

### Web (Built-in proxy via Vite)
API calls are proxied to `http://localhost:5000`

### Mobile (src/services/api.js)
Update `API_BASE_URL` based on your environment:
- Android Emulator: `http://10.0.2.2:5000`
- iOS Simulator: `http://localhost:5000`
- Physical Device: `http://<your-ip>:5000`

## 🚀 Deployment

### Backend
- Deploy to Heroku, AWS, DigitalOcean, or any Python hosting
- Migrate to PostgreSQL for production
- Set environment variables
- Configure CORS origins

### Web
- Build: `npm run build`
- Deploy to Netlify, Vercel, or any static hosting
- Configure API endpoint

### Mobile
- Build with Expo: `expo build:android` or `expo build:ios`
- Submit to Google Play / App Store
- Or use Expo's over-the-air updates

## 📝 Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] OAuth integration (Google, Facebook)
- [ ] Role-based access control
- [ ] Profile picture upload
- [ ] Push notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

## 🤝 Contributing

This is a template framework. Feel free to:
- Add new features
- Improve existing functionality
- Fix bugs
- Enhance documentation

## 📄 License

This project is provided as-is for educational and development purposes.

## 👥 Support

For issues or questions:
1. Check the individual README files in each directory
2. Review the API documentation
3. Examine the code comments

---

**Built with ❤️ using Flask, React, and React Native**
