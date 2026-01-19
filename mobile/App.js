import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReceiptUploadScreen from './src/screens/ReceiptUploadScreen';
import { ActivityIndicator, View, Text } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tab navigator for authenticated users
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingTop: 12,
          paddingBottom: 28,
          height: 88,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 24,
              backgroundColor: focused ? '#eff6ff' : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 28, color: focused ? '#2563eb' : color }}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Finance" 
        component={FinanceScreen}
        options={{
          tabBarLabel: 'Finance',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 24,
              backgroundColor: focused ? '#eff6ff' : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 28, color: focused ? '#2563eb' : color }}>💰</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 24,
              backgroundColor: focused ? '#eff6ff' : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 28, color: focused ? '#2563eb' : color }}>👤</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          // Authenticated screens with bottom tabs
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="ReceiptUpload" 
              component={ReceiptUploadScreen}
              options={{ 
                presentation: 'modal',
                gestureEnabled: true,
              }}
            />
          </>
        ) : (
          // Public screens
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
