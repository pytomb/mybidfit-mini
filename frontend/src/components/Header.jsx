import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PilotBadge from './PilotBadge'

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <header className="header">
      <Link to="/" className="logo">
        <img 
          src="/MyBidFit_LogoA_Wordmark_original_transparent.png" 
          alt="MyBidFit Logo" 
        />
      </Link>
      <nav className="nav-links">
        <Link 
          to="/" 
          className={isActive('/') ? 'active' : ''}
        >
          Home
        </Link>
        {isAuthenticated ? (
          <>
            <Link 
              to="/dashboard" 
              className={isActive('/dashboard') ? 'active' : ''}
            >
              Dashboard
            </Link>
            <Link 
              to="/partner-fit" 
              className={isActive('/partner-fit') ? 'active' : ''}
            >
              Partner Fit
              <span style={{
                fontSize: '10px',
                backgroundColor: 'var(--secondary-green)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '8px',
                marginLeft: '6px'
              }}>
                BETA
              </span>
            </Link>
            <Link 
              to="/profile" 
              className={isActive('/profile') ? 'active' : ''}
            >
              Profile
            </Link>
            <PilotBadge size="small" style={{ marginLeft: '10px' }} />
            <button 
              onClick={logout} 
              className="btn btn-secondary"
              style={{ marginLeft: '10px' }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className={isActive('/login') ? 'active' : ''}
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="btn btn-primary"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}

export default Header