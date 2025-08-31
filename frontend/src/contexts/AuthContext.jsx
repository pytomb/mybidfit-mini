import React, { createContext, useState, useContext, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      // Validate token and get user info
      getUserProfile()
    } else {
      setLoading(false)
    }
  }, [token])

  const getUserProfile = async () => {
    try {
      const response = await api.get('/users/profile')
      setUser(response.data.data)
    } catch (error) {
      // Token invalid, remove it
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('🔑 Attempting login for:', email)
      const response = await api.post('/auth/login', { email, password })
      console.log('📊 Login response received:', response)
      console.log('📊 Response data:', response.data)
      
      const { token: newToken, user: userData } = response.data
      console.log('🎫 Token extracted:', newToken ? 'Present' : 'Missing')
      console.log('👤 User data:', userData)
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      
      console.log('✅ Login successful, token stored')
      return { success: true }
    } catch (error) {
      console.error('❌ Login error:', error)
      console.error('❌ Error response:', error.response)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    }
  }

  const register = async (email, password) => {
    try {
      const response = await api.post('/auth/register', { email, password })
      const { token: newToken, user: userData } = response.data
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}