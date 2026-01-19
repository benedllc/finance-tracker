import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Landing.css'

function Landing() {
  const { user, login } = useAuth()

  return (
    <div className="landing-container">
      <header className="landing-header">
        <nav className="nav">
          <h1 className="logo">BENED Finance</h1>
          <div className="nav-links">
            {user ? (
              <Link to="/finance" className="btn btn-primary">
                Go to Finance
              </Link>
            ) : (
              <button onClick={login} className="btn btn-primary">
                Sign In
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero">
          <h1 className="hero-title">BENED Finance Tracker</h1>
          <p className="hero-subtitle">
            Track your finances, manage receipts, and stay on budget
          </p>
          <p className="hero-description">
            A simple and powerful tool to manage your personal finances,
            track transactions, and organize receipts with OCR technology
          </p>
          {!user && (
            <div className="hero-actions">
              <button onClick={login} className="btn btn-primary btn-large">
                Get Started
              </button>
            </div>
          )}
        </section>

        <section className="features">
          <h2 className="features-title">Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Track Transactions</h3>
              <p>Log income and expenses across multiple accounts</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>Receipt OCR</h3>
              <p>Upload receipts and extract data automatically</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics</h3>
              <p>Visualize spending patterns and trends</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure</h3>
              <p>Your data is protected with enterprise-grade security</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2026 BENED. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Landing
