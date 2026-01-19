import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  safeArea: {
    flex: 1,
  },

  // Auth screens
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#667eea',
  },

  authCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  authHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },

  authLogo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },

  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },

  authSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },

  // Form styles
  formGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },

  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },

  inputFocused: {
    borderColor: '#2563eb',
  },

  inputError: {
    borderColor: '#dc2626',
  },

  // Button styles
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },

  buttonSecondary: {
    backgroundColor: '#e5e7eb',
  },

  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2563eb',
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonTextSecondary: {
    color: '#1f2937',
  },

  buttonTextOutline: {
    color: '#2563eb',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  // Message styles
  errorMessage: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },

  successMessage: {
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  successText: {
    color: '#059669',
    fontSize: 14,
  },

  // Landing screen
  landingContainer: {
    flex: 1,
    backgroundColor: 'white',
  },

  landingHero: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },

  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },

  heroSubtitle: {
    fontSize: 18,
    color: '#4b5563',
    marginBottom: 8,
    textAlign: 'center',
  },

  heroDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },

  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  // Dashboard
  dashboardHeader: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  dashboardNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dashboardLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },

  dashboardContent: {
    flex: 1,
    padding: 16,
  },

  welcomeSection: {
    marginBottom: 24,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },

  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },

  // Card styles
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cardIcon: {
    fontSize: 36,
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },

  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },

  cardLink: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },

  // Link styles
  linkText: {
    color: '#2563eb',
    fontWeight: '600',
  },

  centerText: {
    textAlign: 'center',
  },

  // Profile
  profileHeader: {
    padding: 16,
    backgroundColor: 'white',
  },

  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },

  profileSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },

  formValue: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    fontSize: 16,
    color: '#1f2937',
  },

  profileActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  flexButton: {
    flex: 1,
  },
});
