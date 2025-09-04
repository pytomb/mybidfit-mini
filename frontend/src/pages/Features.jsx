import React from 'react'
import { Link } from 'react-router-dom'

const Features = () => {
  return (
    <div className="container">
      <div className="hero-professional">
        <h1>MyBidFit Features</h1>
        <p className="hero-subtitle">
          Comprehensive AI-powered opportunity analysis and matching platform
        </p>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Coming Soon</h2>
          <p>We're building something amazing for you. Our features page is currently under development.</p>
        </div>

        <div className="card-grid">
          <div className="card card-competitive">
            <h3>🤖 AI-Powered Analysis</h3>
            <p>Smart opportunity scoring and fit analysis using advanced AI algorithms.</p>
          </div>

          <div className="card card-competitive">
            <h3>📊 Real-Time Dashboard</h3>
            <p>Monitor opportunities, track progress, and get insights all in one place.</p>
          </div>

          <div className="card card-competitive">
            <h3>🔍 Smart Matching</h3>
            <p>Intelligent matching system that connects the right opportunities with the right partners.</p>
          </div>
        </div>

        <div className="hero-actions">
          <Link 
            to="/register" 
            className="btn-premium-enterprise"
            data-cta-type="primary"
          >
            Join Our Pilot Program
          </Link>
          
          <Link 
            to="/" 
            className="btn btn-secondary"
          >
            Back to Home
          </Link>
        </div>

        <div className="pilot-badge-section">
          <div className="pilot-badge">Early Access Available</div>
          <p className="pilot-description">
            Join our pilot program to get early access to features as we build them. 
            Your feedback helps shape the future of MyBidFit.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Features