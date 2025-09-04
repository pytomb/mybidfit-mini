import React from 'react'
import { Link } from 'react-router-dom'

const About = () => {
  return (
    <div className="container">
      <div className="hero-professional">
        <h1>About MyBidFit</h1>
        <p className="hero-subtitle">
          Built by people who understand the problem
        </p>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Our Story</h2>
          <p>
            MyBidFit was born from real frustration with the endless hours spent 
            researching opportunities that never quite fit.
          </p>
        </div>

        <div className="authentic-story">
          <div className="story-content">
            <h3>The Problem We Know Too Well</h3>
            <p>
              We've been there - spending hours researching opportunities, trying to figure out 
              if they're worth pursuing, only to discover after all that work that they weren't 
              a good fit. The scattered research, the uncertainty, the time wasted on opportunities 
              that were never going to work.
            </p>

            <h3>Our Solution</h3>
            <p>
              We're building an AI system that does the heavy lifting of opportunity analysis 
              and matching, so you can focus on what you do best - delivering value to clients.
            </p>

            <h3>Why We're Different</h3>
            <ul className="authentic-list">
              <li>
                <strong>We've felt your pain:</strong> Built by people who have spent countless 
                hours on opportunity research that led nowhere.
              </li>
              <li>
                <strong>Honest about our progress:</strong> We're pre-revenue and in pilot phase. 
                No fake metrics or inflated claims.
              </li>
              <li>
                <strong>Focused approach:</strong> We solve one problem really well rather than 
                trying to be everything to everyone.
              </li>
            </ul>
          </div>
        </div>

        <div className="pilot-program-info">
          <div className="pilot-badge">Currently in Pilot Phase</div>
          <h3>Join Us in Building the Solution</h3>
          <p>
            We're working with select partners to validate and refine our approach. 
            If you're tired of spending hours on research that doesn't pan out, 
            we'd love to work with you to build something better.
          </p>
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
      </div>
    </div>
  )
}

export default About