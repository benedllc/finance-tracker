import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <h1 className="dashboard-logo">BENED</h1>
          <nav className="dashboard-links">
            <Link to="/dashboard" className="nav-link active">
              Dashboard
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin/users" className="nav-link">
                Admin
              </Link>
            )}
            <Link to="/profile" className="nav-link">
              Profile
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2 className="welcome-title">
            Welcome back, {user?.full_name || user?.username}!
            {user?.role === 'admin' && (
              <span style={{
                marginLeft: '10px',
                padding: '4px 12px',
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Admin
              </span>
            )}
          </h2>
          <p className="welcome-subtitle">Here's what's happening with your account</p>
        </div>

        <div className="dashboard-grid">
          {user?.role === 'admin' && (
            <div className="dashboard-card" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <div className="card-icon">👑</div>
              <h3 style={{color: 'white'}}>Admin Panel</h3>
              <p style={{color: 'rgba(255,255,255,0.9)'}}>Manage users and system settings</p>
              <Link to="/admin/users" className="card-link" style={{
                color: 'white',
                borderColor: 'white'
              }}>
                Manage Users →
              </Link>
            </div>
          )}

          <div className="dashboard-card">
            <div className="card-icon">💰</div>
            <h3>Finance Tracker</h3>
            <p>Track your income, expenses, and budget</p>
            <Link to="/finance" className="card-link">
              Open Finance Tracker →
            </Link>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👤</div>
            <h3>Profile</h3>
            <p>Manage your account settings and preferences</p>
            <Link to="/profile" className="card-link">
              View Profile →
            </Link>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Statistics</h3>
            <p>View your activity and usage statistics</p>
            <button className="card-link" disabled>
              Coming Soon
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Configure your application preferences</p>
            <button className="card-link" disabled>
              Coming Soon
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📱</div>
            <h3>Mobile App</h3>
            <p>Download our mobile app for iOS and Android</p>
            <button className="card-link" disabled>
              Coming Soon
            </button>
          </div>
        </div>

        <div className="info-section">
          <h3>Account Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Username:</span>
              <span className="info-value">{user?.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since:</span>
              <span className="info-value">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
