import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { useLocation, useNavigate, BrowserRouter } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext()

// Keycloak configuration
const KEYCLOAK_URL = 'https://auth.bened.works'
const KEYCLOAK_REALM = 'Bened'
const KEYCLOAK_CLIENT_ID = 'bened-finance'

const KEYCLOAK_AUTH_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`
const KEYCLOAK_LOGOUT_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Inner provider that has access to router context
const AuthProviderInner = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState(null)
  const [callbackProcessed, setCallbackProcessed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const clearSession = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setAccessToken(null)
  }, [])

  // Process OAuth callback
  useEffect(() => {
    const processCallback = async () => {
      // Only process on callback page with code
      if (location.pathname !== '/callback') return
      if (callbackProcessed) return
      
      const urlParams = new URLSearchParams(location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')
      
      if (error) {
        console.error('[Auth] OAuth error:', error)
        setCallbackProcessed(true)
        setLoading(false)
        navigate('/login?error=' + error, { replace: true })
        return
      }
      
      if (!code) {
        console.error('[Auth] No code in callback')
        setCallbackProcessed(true)
        setLoading(false)
        navigate('/login?error=no_code', { replace: true })
        return
      }

      console.log('[Auth] Processing OAuth callback with code...')
      setCallbackProcessed(true)
      
      try {
        const redirectUri = window.location.origin + '/callback'
        console.log('[Auth] Calling API with redirect_uri:', redirectUri)
        
        const response = await api.post('/auth/callback', {
          code: code,
          redirect_uri: redirectUri
        })
        
        console.log('[Auth] API response received')
        const { access_token, refresh_token, user: userData } = response.data
        
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        localStorage.setItem('user', JSON.stringify(userData))
        
        api.defaults.headers.common['Authorization'] = 'Bearer ' + access_token
        setUser(userData)
        setAccessToken(access_token)
        setLoading(false)
        
        console.log('[Auth] Login successful, navigating to /finance')
        navigate('/finance', { replace: true })
      } catch (err) {
        console.error('[Auth] Callback API error:', err)
        setLoading(false)
        navigate('/login?error=auth_failed', { replace: true })
      }
    }

    processCallback()
  }, [location.pathname, location.search, callbackProcessed, navigate])

  // Check existing session (only if not on callback page)
  useEffect(() => {
    const checkSession = async () => {
      // Skip if on callback page
      if (location.pathname === '/callback') return
      
      const token = localStorage.getItem('access_token')
      const savedUser = localStorage.getItem('user')
      
      if (token && savedUser) {
        try {
          api.defaults.headers.common['Authorization'] = 'Bearer ' + token
          const response = await api.get('/auth/me')
          setUser(response.data.user)
          setAccessToken(token)
        } catch (error) {
          console.log('[Auth] Session check failed:', error.message)
          clearSession()
        }
      }
      
      setLoading(false)
    }

    checkSession()
  }, [location.pathname, clearSession])

  const login = useCallback(() => {
    const redirectUri = window.location.origin + '/callback'
    const state = Math.random().toString(36).substring(7)
    
    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: state
    })
    
    window.location.href = KEYCLOAK_AUTH_URL + '?' + params.toString()
  }, [])

  const logout = useCallback(() => {
    clearSession()
    
    const redirectUri = window.location.origin + '/'
    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      post_logout_redirect_uri: redirectUri
    })
    
    window.location.href = KEYCLOAK_LOGOUT_URL + '?' + params.toString()
  }, [clearSession])

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const value = {
    user,
    loading,
    accessToken,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Wrapper component that provides router context
export const AuthProvider = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProviderInner>{children}</AuthProviderInner>
    </BrowserRouter>
  )
}
