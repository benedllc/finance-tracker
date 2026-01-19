import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userAPI } from '../services/api'
import './Dashboard.css'
import './Profile.css'

function Profile() {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    program_start_date: user?.program_start_date || '',
    graduation_date: user?.graduation_date || ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const isSubmitting = useRef(false)

  // Initialize form data once when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        program_start_date: user.program_start_date || '',
        graduation_date: user.graduation_date || ''
      })
    }
  }, []) // Empty dependency - only run once on mount

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatPhoneNumber = (value) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Apply phone formatting if it's the phone field
    const formattedValue = name === 'phone' ? formatPhoneNumber(value) : value
    
    setFormData({
      ...formData,
      [name]: formattedValue
    })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Form submitted, isEditing:', isEditing)
    
    // Only submit if we're actually in edit mode
    if (!isEditing) {
      console.log('Not in edit mode, ignoring submit')
      return
    }
    
    // Prevent double submission
    if (isSubmitting.current || loading) {
      console.log('Already submitting, ignoring')
      return
    }
    
    console.log('Submitting form data:', formData)
    
    // Clean up empty strings to null for dates
    const dataToSend = {
      ...formData,
      program_start_date: formData.program_start_date || null,
      graduation_date: formData.graduation_date || null
    }
    
    console.log('Data being sent to API:', dataToSend)
    
    isSubmitting.current = true
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await userAPI.updateProfile(dataToSend)
      // Update user context WITHOUT triggering useEffect
      updateUser(response.user)
      setSuccess('Profile updated successfully!')
      console.log('Update successful')
      // Exit edit mode after short delay
      setTimeout(() => {
        setIsEditing(false)
        isSubmitting.current = false
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile')
      isSubmitting.current = false
      console.error('Update failed:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleEditClick = (e) => {
    e.preventDefault() // Prevent any form submission
    e.stopPropagation() // Stop event bubbling
    // Reset success/error messages and enter edit mode
    setError('')
    setSuccess('')
    setIsEditing(true)
  }

  const handleCancel = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Cancel clicked')
    setFormData({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      program_start_date: user?.program_start_date || '',
      graduation_date: user?.graduation_date || ''
    })
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <h1 className="dashboard-logo">NFApps</h1>
          <nav className="dashboard-links">
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/profile" className="nav-link active">
              Profile
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="profile-container">
          <div className="profile-header">
            <h2>Profile Settings</h2>
            <p>Manage your account information</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="profile-card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="form-value">{user?.username}</div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="form-value">{user?.email}</div>
              </div>

              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="form-value">{user?.full_name || 'Not provided'}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="(555) 123-4567"
                  />
                ) : (
                  <div className="form-value">{user?.phone || 'Not provided'}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="program_start_date">Program Start Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    id="program_start_date"
                    name="program_start_date"
                    value={formData.program_start_date}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="form-value">
                    {user?.program_start_date 
                      ? new Date(user.program_start_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) 
                      : 'Not set'}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="graduation_date">Graduation Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    id="graduation_date"
                    name="graduation_date"
                    value={formData.graduation_date}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="form-value">
                    {user?.graduation_date 
                      ? new Date(user.graduation_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) 
                      : 'Not set'}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Account Created</label>
                <div className="form-value">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </div>
              </div>

              <div className="form-group">
                <label>Role</label>
                <div className="form-value">
                  <span className={`role-badge ${user?.role || 'member'}`}>
                    {user?.role || 'member'}
                  </span>
                </div>
              </div>

              <div className="profile-actions">
                {isEditing ? (
                  <>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleEditClick}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile
