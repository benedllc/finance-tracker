import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Dashboard.css'
import './Admin.css'

function AdminUsers() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      navigate('/dashboard')
      return
    }

    fetchUsers()
  }, [user, navigate])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/users')
      setUsers(response.data.users)
      setFilteredUsers(response.data.users)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort users
  useEffect(() => {
    let result = [...users]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      // Handle null/undefined values
      if (!aVal) return 1
      if (!bVal) return -1

      // Handle date sorting
      if (sortField === 'created_at') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    setFilteredUsers(result)
  }, [users, searchTerm, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with default descending
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleEditUser = (userToEdit) => {
    setEditingUser({ ...userToEdit })
  }

  const handleSaveUser = async () => {
    try {
      await api.put(`/admin/users/${editingUser.id}`, editingUser)
      setEditingUser(null)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user')
    }
  }

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return
    }

    try {
      await api.delete(`/admin/users/${userId}`)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate user')
    }
  }

  const getRoleBadgeClass = (role) => {
    const classes = {
      admin: 'badge-admin',
      member: 'badge-member',
      graduate: 'badge-graduate',
      staff: 'badge-staff'
    }
    return classes[role] || 'badge-default'
  }

  const getStatusBadgeClass = (status) => {
    const classes = {
      active: 'badge-active',
      inactive: 'badge-inactive',
      suspended: 'badge-suspended'
    }
    return classes[status] || 'badge-default'
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-nav">
            <h1 className="dashboard-logo">BENED Admin</h1>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="loading">Loading users...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <h1 className="dashboard-logo">BENED Admin</h1>
          <nav className="dashboard-links">
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/admin/users" className="nav-link active">
              Manage Users
            </Link>
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
        <div className="admin-container">
          <div className="admin-header">
            <h2>User Management</h2>
            <p>Showing {filteredUsers.length} of {users.length} users</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Search Bar */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by username, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')} className="sortable">
                    ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('username')} className="sortable">
                    Username {sortField === 'username' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('email')} className="sortable">
                    Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('full_name')} className="sortable">
                    Full Name {sortField === 'full_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('role')} className="sortable">
                    Role {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('status')} className="sortable">
                    Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('created_at')} className="sortable">
                    Created {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.full_name || '-'}</td>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(u.status)}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-small btn-primary"
                            onClick={() => handleEditUser(u)}
                          >
                            Edit
                          </button>
                          {u.id !== user?.id && u.status === 'active' && (
                            <button
                              className="btn-small btn-danger"
                              onClick={() => handleDeactivateUser(u.id)}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit User</h3>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={editingUser.username}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, username: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={editingUser.full_name || ''}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, full_name: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
              >
                <option value="member">Member</option>
                <option value="graduate">Graduate</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={editingUser.status}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSaveUser}>
                Save Changes
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
