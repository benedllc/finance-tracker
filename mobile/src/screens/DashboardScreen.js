import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/commonStyles';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Navigation is handled automatically by App.js
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.dashboardHeader}>
          <View style={styles.dashboardNav}>
            <Text style={styles.dashboardLogo}>NFApps</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { paddingVertical: 8, paddingHorizontal: 16 }]}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  Profile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { paddingVertical: 8, paddingHorizontal: 16 }]}
                onPress={handleLogout}
              >
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView style={styles.dashboardContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              Welcome back, {user?.full_name || user?.username}!
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Here's what's happening with your account
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>👤</Text>
            <Text style={styles.cardTitle}>Profile</Text>
            <Text style={styles.cardDescription}>
              Manage your account settings and preferences
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.cardLink}>View Profile →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>📊</Text>
            <Text style={styles.cardTitle}>Statistics</Text>
            <Text style={styles.cardDescription}>
              View your activity and usage statistics
            </Text>
            <Text style={[styles.cardLink, { color: '#9ca3af' }]}>
              Coming Soon
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>⚙️</Text>
            <Text style={styles.cardTitle}>Settings</Text>
            <Text style={styles.cardDescription}>
              Configure your application preferences
            </Text>
            <Text style={[styles.cardLink, { color: '#9ca3af' }]}>
              Coming Soon
            </Text>
          </View>

          <View style={[styles.card, { marginBottom: 32 }]}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 12,
              }}
            >
              Account Information
            </Text>
            <View style={{ gap: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontWeight: '600', color: '#4b5563' }}>
                  Username:
                </Text>
                <Text style={{ color: '#1f2937' }}>{user?.username}</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontWeight: '600', color: '#4b5563' }}>
                  Email:
                </Text>
                <Text style={{ color: '#1f2937' }}>{user?.email}</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontWeight: '600', color: '#4b5563' }}>
                  Member Since:
                </Text>
                <Text style={{ color: '#1f2937' }}>
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
