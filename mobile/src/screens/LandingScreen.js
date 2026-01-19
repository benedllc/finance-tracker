import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import styles from '../styles/commonStyles';

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView style={styles.landingContainer}>
        <View style={styles.landingHero}>
          <Text style={styles.heroTitle}>Welcome to NFApps</Text>
          <Text style={styles.heroSubtitle}>
            Your unified platform for seamless experiences
          </Text>
          <Text style={styles.heroDescription}>
            Built with a powerful Flask backend and modern React Native frontend
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonOutline]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[styles.buttonText, styles.buttonTextOutline]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            Platform Features
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>🔐</Text>
            <Text style={styles.cardTitle}>Secure Authentication</Text>
            <Text style={styles.cardDescription}>
              JWT-based authentication ensuring secure access
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>🌐</Text>
            <Text style={styles.cardTitle}>Cross-Platform</Text>
            <Text style={styles.cardDescription}>
              Unified experience across web and mobile
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>⚡</Text>
            <Text style={styles.cardTitle}>Fast & Scalable</Text>
            <Text style={styles.cardDescription}>
              Built on modern technologies for optimal performance
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>🔧</Text>
            <Text style={styles.cardTitle}>Modular Architecture</Text>
            <Text style={styles.cardDescription}>
              Clean separation of concerns for easy maintenance
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
