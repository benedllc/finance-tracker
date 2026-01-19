# NFApps Mobile - React Native Application

A cross-platform mobile application built with React Native and Expo, featuring authentication and profile management.

## 🎯 Features

- Cross-platform (iOS & Android)
- React Navigation for native navigation
- JWT authentication with AsyncStorage
- Responsive UI with native components
- Axios for API calls
- Expo for easy development and deployment
- Protected screens

## 📁 Project Structure

```
mobile/
├── src/
│   ├── screens/
│   │   ├── LandingScreen.js    # Welcome screen
│   │   ├── LoginScreen.js      # Login screen
│   │   ├── SignupScreen.js     # Signup screen
│   │   ├── DashboardScreen.js  # Dashboard screen
│   │   └── ProfileScreen.js    # Profile screen
│   ├── context/
│   │   └── AuthContext.js      # Authentication state management
│   ├── services/
│   │   └── api.js              # API service layer
│   └── styles/
│       └── commonStyles.js     # Shared styles
├── App.js                      # Main app component
├── app.json                    # Expo configuration
├── babel.config.js             # Babel configuration
├── package.json                # Dependencies
└── .gitignore                 # Git ignore rules
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator
- Expo Go app on physical device (optional)
- Backend server running

### Installation

1. **Navigate to mobile directory**
   ```powershell
   cd mobile
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Configure API URL**
   
   Edit `src/services/api.js` and update `API_BASE_URL`:
   
   ```javascript
   // For Android Emulator
   const API_BASE_URL = 'http://10.0.2.2:5000/api';
   
   // For iOS Simulator
   const API_BASE_URL = 'http://localhost:5000/api';
   
   // For physical device (replace with your computer's IP)
   const API_BASE_URL = 'http://192.168.1.XXX:5000/api';
   ```

4. **Start Expo development server**
   ```powershell
   npm start
   ```

5. **Run on device/emulator**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app on physical device

## 📱 Application Screens

### 1. Landing Screen
- Welcome message
- Feature highlights
- Navigation to Login/Signup
- Scrollable content

### 2. Login Screen
- Email/Username and password fields
- Form validation
- Error handling
- Loading indicator
- Link to signup screen
- Auto-navigates to Dashboard after login

### 3. Signup Screen
- Email, username, password, and full name fields
- Form validation
- Error handling
- Loading indicator
- Link to login screen
- Auto-navigates to Dashboard after signup

### 4. Dashboard Screen
- Welcome message with user's name
- Feature cards
- Account information
- Navigation to Profile
- Logout button
- Protected screen (requires authentication)

### 5. Profile Screen
- View user information
- Edit profile mode
- Update email, username, and full name
- Save/Cancel buttons
- Success/error messages
- Protected screen (requires authentication)

## 🔐 Authentication Flow

1. User enters credentials on Login/Signup screen
2. Form data sent to backend API
3. Backend validates and returns JWT token
4. Token stored in AsyncStorage
5. AuthContext updates user state
6. Navigation automatically switches to authenticated screens
7. Protected screens check authentication status

### Authentication Context

The `AuthContext` provides:
- `user`: Current user object
- `loading`: Loading state
- `signup(data)`: Register new user
- `login(data)`: Authenticate user
- `logout()`: Clear session
- `updateUser(userData)`: Update user state

### Navigation Structure

The app uses conditional navigation based on authentication:

```javascript
{user ? (
  // Authenticated screens
  <Stack.Screen name="Dashboard" component={DashboardScreen} />
  <Stack.Screen name="Profile" component={ProfileScreen} />
) : (
  // Public screens
  <Stack.Screen name="Landing" component={LandingScreen} />
  <Stack.Screen name="Login" component={LoginScreen} />
  <Stack.Screen name="Signup" component={SignupScreen} />
)}
```

## 🔌 API Integration

### API Service (`src/services/api.js`)

All API calls go through the centralized API service:

```javascript
import { authAPI, userAPI } from '../services/api'

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
- Reads token from AsyncStorage

**Response Interceptor:**
- Handles 401 errors
- Clears token from AsyncStorage

### API URL Configuration

Update based on your environment:

| Environment | URL |
|-------------|-----|
| Android Emulator | `http://10.0.2.2:5000/api` |
| iOS Simulator | `http://localhost:5000/api` |
| Physical Device | `http://<your-ip>:5000/api` |

**Find your IP address:**
```powershell
# Windows
ipconfig

# Look for IPv4 Address under your network adapter
```

## 🎨 Styling

### Style Architecture

All styles are centralized in `src/styles/commonStyles.js` using React Native's `StyleSheet.create()`:

- Container styles
- Authentication screens styles
- Form styles
- Button styles
- Card styles
- Profile styles

### Design System

**Colors:**
- Primary: `#2563eb` (Blue)
- Secondary: `#e5e7eb` (Gray)
- Background: `#f5f5f5`
- Text: `#1f2937` (Dark)
- Error: `#dc2626` (Red)
- Success: `#059669` (Green)

**Components:**
- Cards with shadow and elevation
- Rounded corners (8-12)
- Smooth transitions
- Native feedback on touch
- Consistent spacing

### Responsive Design

- Uses Flexbox for layouts
- Safe area insets for notched devices
- Keyboard avoiding views for forms
- ScrollView for long content

## 📦 Dependencies

### Core Dependencies
- **react (18.2.0)**: UI library
- **react-native (0.72.6)**: Native platform
- **expo (~49.0.15)**: Development platform
- **@react-navigation/native (6.1.9)**: Navigation
- **@react-navigation/native-stack (6.9.17)**: Stack navigator
- **axios (1.6.2)**: HTTP client
- **@react-native-async-storage/async-storage (1.18.2)**: Persistent storage

### Supporting Dependencies
- **expo-status-bar**: Status bar component
- **react-native-screens**: Native screen components
- **react-native-safe-area-context**: Safe area handling

## 🛠️ Available Scripts

### Start Development Server
```powershell
npm start
# or
expo start
```

### Run on Android
```powershell
npm run android
# or
expo start --android
```

### Run on iOS
```powershell
npm run ios
# or
expo start --ios
```

### Run on Web (experimental)
```powershell
npm run web
# or
expo start --web
```

## 🔧 Configuration

### Expo Configuration (`app.json`)

```json
{
  "expo": {
    "name": "NFApps Mobile",
    "slug": "nfapps-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "ios": {
      "bundleIdentifier": "com.nfapps.mobile"
    },
    "android": {
      "package": "com.nfapps.mobile"
    }
  }
}
```

### Environment Setup

For different environments, create environment-specific API configurations:

```javascript
const ENV = {
  dev: {
    apiUrl: 'http://10.0.2.2:5000/api'
  },
  staging: {
    apiUrl: 'https://staging-api.nfapps.com/api'
  },
  prod: {
    apiUrl: 'https://api.nfapps.com/api'
  }
};

const getEnvVars = (env = 'dev') => ENV[env];
export default getEnvVars;
```

## 📱 Testing on Devices

### Android Emulator

1. Install Android Studio
2. Create AVD (Android Virtual Device)
3. Start emulator
4. Run `npm run android`

### iOS Simulator (Mac only)

1. Install Xcode
2. Install Xcode Command Line Tools
3. Run `npm run ios`

### Physical Device

1. Install Expo Go app from App Store or Play Store
2. Ensure device is on same network as your computer
3. Scan QR code from terminal
4. Update API URL to your computer's IP address

## 🚀 Building for Production

### Android (APK/AAB)

```powershell
# Build APK for testing
expo build:android -t apk

# Build AAB for Play Store
expo build:android -t app-bundle
```

### iOS (IPA)

```powershell
expo build:ios
```

### Modern Build System (EAS Build)

1. **Install EAS CLI**
   ```powershell
   npm install -g eas-cli
   ```

2. **Configure EAS**
   ```powershell
   eas build:configure
   ```

3. **Build for Android**
   ```powershell
   eas build --platform android
   ```

4. **Build for iOS**
   ```powershell
   eas build --platform ios
   ```

### App Store Submission

1. Build production version
2. Test thoroughly
3. Prepare app store assets (screenshots, description, etc.)
4. Submit to Apple App Store / Google Play Store

## 🐛 Troubleshooting

### Expo server not starting
```powershell
# Clear cache
expo start -c
```

### Android emulator connection issues
```powershell
# Check ADB devices
adb devices

# Restart ADB
adb kill-server
adb start-server
```

### iOS simulator not opening
```powershell
# List available simulators
xcrun simctl list devices

# Open specific simulator
open -a Simulator
```

### API connection issues

1. Verify backend is running
2. Check API URL matches your environment
3. Test API with Postman
4. Check network permissions
5. Verify CORS settings on backend

### AsyncStorage errors
```powershell
# Clear app data
# Android: Settings > Apps > Expo Go > Storage > Clear Data
# iOS: Hold app icon > Remove App
```

### Metro bundler errors
```powershell
# Reset Metro cache
expo start -c

# Clear watchman
watchman watch-del-all
```

## 🎯 Best Practices

### Performance
- Use `React.memo()` for expensive components
- Implement `useMemo()` and `useCallback()` hooks
- Optimize images and assets
- Use FlatList for long lists
- Avoid inline styles and functions

### Navigation
- Use proper screen names
- Implement deep linking
- Handle back button on Android
- Preserve navigation state

### Storage
- Keep AsyncStorage data minimal
- Use encrypted storage for sensitive data
- Implement data migration strategies
- Clear old data periodically

### Error Handling
- Always use try-catch for async operations
- Show user-friendly error messages
- Log errors for debugging
- Implement error boundaries

## 🔄 Adding New Features

### Add a new screen

1. **Create screen component**
   ```javascript
   // src/screens/NewScreen.js
   import React from 'react'
   import { View, Text } from 'react-native'
   
   export default function NewScreen() {
     return (
       <View>
         <Text>New Screen</Text>
       </View>
     )
   }
   ```

2. **Add to navigation**
   ```javascript
   // App.js
   import NewScreen from './src/screens/NewScreen'
   
   <Stack.Screen name="New" component={NewScreen} />
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

### Add native functionality

Use Expo SDK modules:
```powershell
expo install expo-camera expo-location expo-notifications
```

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [Expo AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)

## 🔐 Security Considerations

- Store only JWT token in AsyncStorage
- Implement secure storage for sensitive data
- Use HTTPS in production
- Validate all user inputs
- Implement certificate pinning
- Use ProGuard/R8 for Android
- Enable App Transport Security for iOS

---

**Mobile app is ready! Start the Expo server and scan the QR code to run on your device.**
