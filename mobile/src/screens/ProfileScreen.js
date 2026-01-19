import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import styles from '../styles/commonStyles';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    username: user?.username || '',
    full_name: user?.full_name || '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    // Navigation is handled automatically by App.js
  };

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await userAPI.updateProfile(formData);
      updateUser(response.user);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: user?.email || '',
      username: user?.username || '',
      full_name: user?.full_name || '',
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
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
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  Dashboard
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
          <View style={styles.profileHeader}>
            <Text style={styles.profileTitle}>Profile Settings</Text>
            <Text style={styles.profileSubtitle}>
              Manage your account information
            </Text>
          </View>

          {error ? (
            <View style={styles.errorMessage}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successMessage}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(value) => handleChange('username', value)}
                  editable={!loading}
                />
              ) : (
                <View style={styles.formValue}>
                  <Text>{user?.username}</Text>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(value) => handleChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              ) : (
                <View style={styles.formValue}>
                  <Text>{user?.email}</Text>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.full_name}
                  onChangeText={(value) => handleChange('full_name', value)}
                  editable={!loading}
                />
              ) : (
                <View style={styles.formValue}>
                  <Text>{user?.full_name || 'Not provided'}</Text>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Member Since</Text>
              <View style={styles.formValue}>
                <Text>
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.profileActions}>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.flexButton, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.buttonSecondary,
                      styles.flexButton,
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={handleCancel}
                    disabled={loading}
                  >
                    <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.buttonText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
