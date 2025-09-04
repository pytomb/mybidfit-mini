import React from 'react'
import { Link } from 'react-router-dom'

const CaseStudies = () => {
  return (
    <div className="container">
      <div className="hero-professional">
        <h1>Success Stories</h1>
        <p className="hero-subtitle">
          Real results from our pilot program participants
        </p>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Pilot Program in Progress</h2>
          <p>
            We're currently working with select partners in our pilot program. 
            As we gather results and success stories, we'll share them here.
          </p>
        </div>

        <div className="card-grid">
          <div className="card card-competitive">
            <div className="pilot-badge">Pilot Phase</div>
            <h3>Professional Services Firm</h3>
            <p>
              Currently testing our AI-powered opportunity analysis system 
              to improve their bid success rate and reduce research time.
            </p>
            <div className="pilot-stats">
              <div className="stat">
                <span className="stat-number">-</span>
                <span className="stat-label">Time Saved</span>
              </div>
              <div className="stat">
                <span className="stat-number">-</span>
                <span className="stat-label">Success Rate</span>
              </div>
            </div>
          </div>

          <div className="card card-competitive">
            <div className="pilot-badge">Pilot Phase</div>
            <h3>Consulting Company</h3>
            <p>
              Testing our intelligent matching system to identify 
              high-value opportunities that align with their capabilities.
            </p>
            <div className="pilot-stats">
              <span className="pilot-note">Results pending completion of pilot phase</span>
            </div>
          </div>

          <div className="card card-competitive">
            <div className="pilot-badge">Pilot Phase</div>
            <h3>Technology Solutions Provider</h3>
            <p>
              Evaluating our comprehensive analysis tools to streamline 
              their opportunity evaluation and decision-making process.
            </p>
            <div className="pilot-stats">
              <span className="pilot-note">Data collection in progress</span>
            </div>
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

        <div className="authentic-message">
          <h3>Honest Progress Update</h3>
          <p>
            We believe in transparency. Rather than showing fake case studies, 
            we're sharing real progress from our pilot program. As participants 
            complete the program and achieve results, we'll update this page 
            with genuine success stories and measurable outcomes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CaseStudies