import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Login() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/finance')
    }
  }, [isAuthenticated, navigate])

  const handleLogin = () => {
    login()
  }

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-logo">BENED</h1>
            <p className="auth-subtitle">Finance Tracker</p>
          </div>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">BENED</h1>
          <p className="auth-subtitle">Finance Tracker</p>
        </div>

        <div className="auth-content">
          <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Welcome</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '32px' }}>
            Sign in to manage your finances
          </p>

          <button 
            onClick={handleLogin}
            className="auth-button"
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🔐 Sign in with BENED Account
          </button>

          <p style={{ 
            textAlign: 'center', 
            color: '#94a3b8', 
            fontSize: '14px',
            marginTop: '24px' 
          }}>
            Don't have an account?{' '}
            <a 
              href="https://auth.bened.works/realms/Bened/protocol/openid-connect/registrations?client_id=bened-finance&response_type=code&scope=openid%20profile%20email&redirect_uri=https://finance.beneficialeducationworks.com/callback"
              style={{ color: '#3b82f6', textDecoration: 'none' }}
            >
              Register here
            </a>
          </p>
        </div>

        <div className="auth-footer">
          <p style={{ color: '#64748b', fontSize: '12px' }}>
            © 2026 BENED. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
