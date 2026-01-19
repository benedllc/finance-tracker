# NFApps Web - React Application

A modern React web application with routing, authentication, and API integration.

## 🎯 Features

- Modern React 18 with hooks
- React Router for navigation
- JWT authentication with context API
- Responsive design
- Axios for API calls
- Vite for fast development and builds
- Protected routes

## 📁 Project Structure

```
web/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx         # Landing page
│   │   ├── Landing.css
│   │   ├── Login.jsx           # Login page
│   │   ├── Signup.jsx          # Signup page
│   │   ├── Auth.css            # Auth pages styles
│   │   ├── Dashboard.jsx       # Dashboard page
│   │   ├── Dashboard.css
│   │   └── Profile.jsx         # Profile page
│   ├── context/
│   │   └── AuthContext.jsx    # Authentication state management
│   ├── services/
│   │   └── api.js             # API service layer
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── index.html                 # HTML template
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies
└── .gitignore               # Git ignore rules
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Backend server running on `http://localhost:5000`

### Installation

1. **Navigate to web directory**
   ```powershell
   cd web
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Start development server**
   ```powershell
   npm run dev
   ```

The application will open at `http://localhost:3000`

## 📱 Application Pages

### 1. Landing Page (`/`)
- Welcome message
- Feature highlights
- Navigation to Login/Signup
- Auto-redirects to Dashboard if logged in

### 2. Login Page (`/login`)
- Email/Username and password fields
- Form validation
- Error handling
- Link to signup page
- Auto-redirects to Dashboard after login

### 3. Signup Page (`/signup`)
- Email, username, password, and full name fields
- Form validation
- Error handling
- Link to login page
- Auto-redirects to Dashboard after signup

### 4. Dashboard Page (`/dashboard`)
- Welcome message with user's name
- Quick access cards
- Account information
- Navigation to Profile
- Logout button
- Protected route (requires authentication)

### 5. Profile Page (`/profile`)
- View user information
- Edit profile
- Update email, username, and full name
- Success/error messages
- Protected route (requires authentication)

## 🔐 Authentication Flow

1. User enters credentials on Login/Signup page
2. Form data sent to backend API
3. Backend validates and returns JWT token
4. Token stored in localStorage
5. AuthContext updates user state
6. User redirected to Dashboard
7. Protected routes check authentication status

### Authentication Context

The `AuthContext` provides:
- `user`: Current user object
- `loading`: Loading state
- `signup(data)`: Register new user
- `login(data)`: Authenticate user
- `logout()`: Clear session
- `updateUser(userData)`: Update user state

### Protected Routes

Routes wrapped with `ProtectedRoute` component:
- Checks if user is authenticated
- Redirects to login if not authenticated
- Shows loading indicator during auth check

### Public Routes

Routes wrapped with `PublicRoute` component:
- Redirects to dashboard if already authenticated
- Allows access for non-authenticated users

## 🔌 API Integration

### API Service (`src/services/api.js`)

All API calls go through the centralized API service:

```javascript
import { authAPI, userAPI } from './services/api'

// Sign up
const response = await authAPI.signup(data)

// Login
const response = await authAPI.login(data)

// Get profile
const response = await userAPI.getProfile()

// Update profile
const response = await userAPI.updateProfile(data)
```

### Axios Interceptors

**Request Interceptor:**
- Automatically adds JWT token to all requests
- Reads token from localStorage

**Response Interceptor:**
- Handles 401 errors
- Clears token and redirects to login

### API Configuration

Backend URL is configured in `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}
```

## 🎨 Styling

### CSS Architecture

- `index.css`: Global styles and resets
- `Landing.css`: Landing page styles
- `Auth.css`: Login and Signup page styles
- `Dashboard.css`: Dashboard and Profile page styles

### Design System

**Colors:**
- Primary: `#2563eb` (Blue)
- Secondary: `#e5e7eb` (Gray)
- Background: `#f5f5f5`
- Text: `#1f2937` (Dark)
- Error: `#dc2626` (Red)
- Success: `#059669` (Green)

**Components:**
- Cards with shadow
- Rounded corners (8-12px)
- Smooth transitions
- Responsive grid layouts
- Hover effects

### Responsive Design

Mobile-first approach with breakpoints:
```css
@media (max-width: 768px) {
  /* Mobile styles */
}
```

## 📦 Dependencies

### Core Dependencies
- **react (18.2.0)**: UI library
- **react-dom (18.2.0)**: React DOM rendering
- **react-router-dom (6.20.0)**: Routing
- **axios (1.6.2)**: HTTP client

### Dev Dependencies
- **@vitejs/plugin-react (4.2.1)**: React plugin for Vite
- **vite (5.0.8)**: Build tool and dev server

## 🛠️ Available Scripts

### Development
```powershell
npm run dev
```
Starts the development server with hot reload at `http://localhost:3000`

### Build
```powershell
npm run build
```
Creates production build in `dist/` directory

### Preview
```powershell
npm run preview
```
Preview production build locally

## 🔧 Configuration

### Vite Configuration

**Development Server:**
- Port: 3000
- Proxy: Routes `/api` to backend

**Build:**
- Output directory: `dist/`
- Minification enabled
- Source maps generated

### Environment Variables

For production, create `.env.production`:
```
VITE_API_URL=https://your-backend-url.com
```

Update `src/services/api.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
```

## 🚀 Production Deployment

### Build for Production

1. **Create production build**
   ```powershell
   npm run build
   ```

2. **Test production build**
   ```powershell
   npm run preview
   ```

### Deployment Options

#### Netlify
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

#### Vercel
1. Import project from GitHub
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

#### Traditional Hosting
1. Build the app: `npm run build`
2. Upload `dist/` folder to server
3. Configure server to serve `index.html` for all routes

### Production Checklist

- [ ] Update API URL to production backend
- [ ] Test all routes and functionality
- [ ] Verify authentication works
- [ ] Check responsive design on devices
- [ ] Test error handling
- [ ] Enable HTTPS
- [ ] Set up error monitoring
- [ ] Configure caching headers

## 🐛 Troubleshooting

### Port 3000 already in use
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### API calls failing
1. Ensure backend is running on `http://localhost:5000`
2. Check browser console for errors
3. Verify CORS is enabled on backend
4. Check network tab in DevTools

### Authentication not working
1. Clear localStorage: `localStorage.clear()`
2. Check token in localStorage
3. Verify backend returns valid JWT
4. Check token expiration

### Build errors
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

## 🎯 Best Practices

### Component Structure
- Keep components focused and small
- Use functional components with hooks
- Extract reusable logic to custom hooks
- Separate concerns (UI, logic, API calls)

### State Management
- Use Context API for global state
- Use useState for local state
- Keep state as close to usage as possible
- Avoid prop drilling

### API Calls
- Always handle loading states
- Always handle errors
- Show user feedback
- Use try-catch blocks

### Security
- Never store sensitive data in localStorage except tokens
- Validate input on frontend and backend
- Use HTTPS in production
- Implement CSRF protection

## 🔄 Adding New Features

### Add a new page

1. **Create component**
   ```jsx
   // src/pages/NewPage.jsx
   import React from 'react'
   
   function NewPage() {
     return <div>New Page</div>
   }
   
   export default NewPage
   ```

2. **Add route**
   ```jsx
   // src/App.jsx
   import NewPage from './pages/NewPage'
   
   <Route path="/new" element={<NewPage />} />
   ```

### Add API endpoint

```javascript
// src/services/api.js
export const newAPI = {
  getData: async () => {
    const response = await api.get('/new-endpoint')
    return response.data
  }
}
```

### Add protected route

```jsx
<Route 
  path="/protected" 
  element={
    <ProtectedRoute>
      <ProtectedPage />
    </ProtectedRoute>
  } 
/>
```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Axios Documentation](https://axios-http.com/)

---

**Web application is ready! Visit http://localhost:3000 to get started.**
