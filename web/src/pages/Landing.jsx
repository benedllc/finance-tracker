import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Landing.css'

function Landing() {
  const { user } = useAuth()

  return (
    <div className="landing-container">
      <header className="landing-header">
        <nav className="nav">
          <h1 className="logo">NFApps</h1>
          <div className="nav-links">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero">
          <h1 className="hero-title">Welcome to NFApps</h1>
          <p className="hero-subtitle">
            Your unified platform for seamless web and mobile experiences
          </p>
          <p className="hero-description">
            Built with a powerful Flask backend and modern React frontends,
            NFApps provides a scalable foundation for your applications
          </p>
          {!user && (
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-large">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Sign In
              </Link>
            </div>
          )}
        </section>

        <section className="features">
          <h2 className="features-title">Platform Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure Authentication</h3>
              <p>JWT-based authentication ensuring secure access across all platforms</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Cross-Platform</h3>
              <p>Unified experience across web and mobile applications</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Scalable</h3>
              <p>Built on modern technologies for optimal performance</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>Modular Architecture</h3>
              <p>Clean separation of concerns for easy maintenance and growth</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2025 NFApps. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Landing
