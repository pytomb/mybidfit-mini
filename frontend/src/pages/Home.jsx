import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { isAuthenticated } = useAuth()
  const [demoInput, setDemoInput] = useState('')
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [showVideoDemo, setShowVideoDemo] = useState(false)
  const [demoResults, setDemoResults] = useState('')

  const handleTryFitDemo = (e) => {
    e.preventDefault()
    if (demoInput.trim()) {
      // Enhanced demo functionality to showcase the product
      const results = `🎯 DEMO FIT ANALYSIS RESULTS

📊 OVERALL FIT SCORE: 72/100 (Good Match)

👔 CFO PERSPECTIVE (68/100):
✓ Clear revenue model and budget allocation
⚠️ ROI timeline may be optimistic 
• Recommend pilot phase approach

🔒 CISO PERSPECTIVE (85/100):
✓ Security requirements well-defined
✓ Compliance framework matches capabilities
• Strong technical alignment

⚙️ OPERATOR PERSPECTIVE (71/100):
✓ Implementation timeline realistic
⚠️ Resource requirements may strain capacity
• Consider phased delivery approach

🤔 SKEPTIC PERSPECTIVE (64/100):
⚠️ Success metrics could be more specific
⚠️ Risk mitigation plans need detail
• Request more information on dependencies

💡 RECOMMENDATIONS:
1. Pursue this opportunity with adjusted timeline
2. Prepare detailed risk mitigation plan
3. Consider strategic partnership for capacity gaps
4. Focus on pilot phase to prove value

Note: This is a demo analysis. Real analysis would include deeper capability matching, competitive landscape assessment, and partnership recommendations.`
      
      setDemoResults(results)
      setShowDemoModal(true)
      setDemoInput('')
    }
  }

  const playDemoVideo = () => {
    setShowVideoDemo(true)
  }

  const VideoModal = () => {
    if (!showVideoDemo) return null
    
    return (
      <div className="modal-overlay" onClick={() => setShowVideoDemo(false)}>
        <div className="modal-professional video-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">MyBidFit 2-Minute Demo</h2>
            <button 
              className="modal-close"
              onClick={() => setShowVideoDemo(false)}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="video-placeholder">
              <div className="video-content">
                <div className="play-icon">▶</div>
                <p>Demo Video</p>
                <p className="video-description">
                  See how MyBidFit analyzes opportunities in 30 seconds and provides 
                  plain English recommendations that help you win more deals.
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowVideoDemo(false)}
            >
              Close
            </button>
            <Link 
              to="/register" 
              className="btn-premium-enterprise"
              data-cta-type="primary"
              data-conversion-path="video-demo"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const DemoModal = () => {
    if (!showDemoModal) return null
    
    return (
      <div className="modal-overlay" onClick={() => setShowDemoModal(false)}>
        <div className="modal-professional" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Demo Analysis Results</h2>
            <button 
              className="modal-close"
              onClick={() => setShowDemoModal(false)}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <pre className="demo-results">{demoResults}</pre>
          </div>
          <div className="modal-footer">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowDemoModal(false)}
            >
              Close
            </button>
            <Link 
              to="/register" 
              className="btn-premium-enterprise"
              data-cta-type="primary"
              data-conversion-path="demo-results"
            >
              Join Pilot Program
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <DemoModal />
      <VideoModal />
      
      {/* Hero Section - Enhanced CTA Hierarchy */}
      <section className="hero-professional">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="kinetic-gradient-professional hero-title-enhanced">
              Stop Chasing Bad Deals.
              <span className="hero-accent">Start Winning the Right Ones.</span>
            </h1>
            <p className="hero-subtitle-professional">
              MyBidFit's AI analyzes opportunities in 30 seconds, telling you exactly why to bid or walk away—so you can focus on deals you'll actually win.
            </p>
            
            <div className="hero-badge-beta">
              🎯 SMB-Focused • No Enterprise Minimums
            </div>

            <div className="hero-stats-professional">
              <span className="hero-stat">⚡ 30-Second AI Analysis</span>
              <span className="hero-stat">📊 Plain English Explanations</span>
              <span className="hero-stat">🤝 Partnership Discovery</span>
            </div>

            {/* Enhanced CTA Hierarchy */}
            <div className="hero-actions-enterprise">
              <div className="cta-primary-group">
                <Link 
                  to={isAuthenticated ? "/dashboard" : "/register"} 
                  className="btn-premium-enterprise cta-ripple"
                  data-cta-type="primary"
                  data-conversion-path="hero-direct"
                >
                  <span className="cta-text">Start Free Trial</span>
                  <span className="cta-icon">→</span>
                </Link>
                <div className="trust-indicators-inline">
                  <span className="trust-item">No credit card required</span>
                  <span className="trust-item">5-minute setup</span>
                </div>
              </div>
              
              <div className="cta-secondary-group">
                <button 
                  onClick={playDemoVideo}
                  className="btn-secondary-enterprise"
                  data-cta-type="secondary"
                  data-conversion-path="hero-video"
                >
                  <span className="cta-icon">▶</span>
                  <span className="cta-text">Watch 2-Min Demo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section - Enhanced CTAs */}
      <section className="trust-section section">
        <div className="social-proof-cta">
          <h3>Be Among the First to Transform Your Sales Process</h3>
          <p className="section-description">Early adopters are already seeing the difference in their opportunity qualification.</p>
          
          <div className="social-cta-group">
            <Link 
              to="/register" 
              className="btn-premium-enterprise"
              data-cta-type="primary"
              data-conversion-path="early-adopter"
            >
              Join Early Adopters
            </Link>
            <button 
              onClick={() => document.getElementById('try-fit-demo').scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary-enterprise"
              data-cta-type="secondary"
              data-conversion-path="pilot-demo"
            >
              Try the Demo
            </button>
            <Link 
              to="/case-studies" 
              className="btn-tertiary-enterprise"
              data-cta-type="tertiary"
              data-conversion-path="case-studies"
            >
              Read Success Stories
            </Link>
          </div>
        </div>
        
        <div className="trust-grid-professional">
          <div className="testimonial-card">
            <blockquote className="testimonial-quote">
              "The pilot completely changed how I evaluate opportunities. I can't imagine going back to the old way."
            </blockquote>
            <p className="testimonial-attribution">Beta Tester, IT Services</p>
          </div>
          <div className="testimonial-card">
            <blockquote className="testimonial-quote">
              "In just two weeks of testing, I identified three partnerships I never would have considered."
            </blockquote>
            <p className="testimonial-attribution">Pilot User, Government Contractor</p>
          </div>
        </div>
        
        <div className="trust-indicators">
          <div className="trust-indicator">
            <span className="trust-number">🚀 10</span>
            <span className="trust-label">Companies in Active Pilots</span>
          </div>
          <div className="trust-indicator">
            <span className="trust-number">🎯</span>
            <span className="trust-label">Atlanta Chamber of Commerce Member</span>
          </div>
          <div className="trust-indicator">
            <span className="trust-number">🏆</span>
            <span className="trust-label">2024 Startup Showcase Finalist</span>
          </div>
        </div>
      </section>

      {/* Value Props Section - Enhanced Comparison CTAs */}
      <section className="value-section section">
        <div className="comparison-cta-section">
          <h3>Why Choose MyBidFit Over Enterprise Solutions</h3>
          <p>Built for SMBs who need results, not complexity. Compare us to Outreach.io and Highspot.com.</p>
          
          <div className="comparison-actions">
            <Link 
              to="/features" 
              className="btn-premium-enterprise"
              data-cta-type="primary"
              data-conversion-path="feature-comparison"
            >
              Compare Features
            </Link>
            <button 
              onClick={() => alert('Comparison guide coming soon!')}
              className="btn-secondary-enterprise"
              data-cta-type="secondary"
              data-conversion-path="download-guide"
            >
              Download Comparison Guide
            </button>
            <Link 
              to="/register" 
              className="btn-tertiary-enterprise"
              data-cta-type="tertiary"
              data-conversion-path="comparison-trial"
            >
              Start Your Trial
            </Link>
          </div>
        </div>
        
        <div className="feature-grid">
          <div className="feature-card feature-card-primary">
            <div className="feature-icon feature-icon-primary">⚡</div>
            <div className="feature-header">
              <h3 className="feature-title">30-Second AI Analysis</h3>
              <span className="badge badge-success badge-inline">vs Manual Processes</span>
            </div>
            <p className="feature-description">Get instant opportunity analysis while competitors spend hours in spreadsheets. Our AI does the heavy lifting so you can focus on winning.</p>
          </div>
          <div className="feature-card feature-card-secondary">
            <div className="feature-icon feature-icon-secondary">📊</div>
            <div className="feature-header">
              <h3 className="feature-title">Plain English Explanations</h3>
              <span className="badge badge-info badge-inline">vs Complex Dashboards</span>
            </div>
            <p className="feature-description">No confusing enterprise interfaces. Get clear recommendations in language that makes sense to business owners, not data scientists.</p>
          </div>
          <div className="feature-card feature-card-tertiary">
            <div className="feature-icon feature-icon-tertiary">🤝</div>
            <div className="feature-header">
              <h3 className="feature-title">Partnership Discovery</h3>
              <span className="badge badge-warning badge-inline">Unique to MyBidFit</span>
            </div>
            <p className="feature-description">Find teaming partners automatically. Enterprise tools focus on solo competition—we help you win through strategic partnerships.</p>
          </div>
          <div className="feature-card feature-card-quaternary">
            <div className="feature-icon feature-icon-quaternary">🎯</div>
            <div className="feature-header">
              <h3 className="feature-title">SMB-Focused</h3>
              <span className="badge badge-primary badge-inline">vs Enterprise Minimums</span>
            </div>
            <p className="feature-description">No 100-seat minimums or enterprise complexity. Designed for teams of 1-50 who need powerful tools without enterprise overhead.</p>
          </div>
        </div>
      </section>

      {/* Competitive Advantage */}
      <section className="pilot-benefits-section section">
        <div className="section-header">
          <h2 className="section-title">Built Different for SMBs</h2>
          <p className="section-description">While enterprise tools serve Fortune 500s, we're built for the 99% of businesses that need results without complexity.</p>
        </div>
        <div className="pilot-grid">
          <div className="pilot-card pilot-card-shape">
            <div className="pilot-header">
              <h3 className="pilot-title">⚡ 5-Minute Setup</h3>
            </div>
            <p className="pilot-description">No 6-month implementations. No dedicated IT teams required. Upload an opportunity, get your analysis, start winning better deals today.</p>
          </div>
          <div className="pilot-card pilot-card-free">
            <div className="pilot-header">
              <h3 className="pilot-title">💰 SMB Pricing</h3>
            </div>
            <p className="pilot-description">Pay for value, not enterprise bloat. No 100-seat minimums, no forced annual contracts. Start with what you need, scale when you're ready.</p>
          </div>
          <div className="pilot-card pilot-card-advantage">
            <div className="pilot-header">
              <h3 className="pilot-title">🤝 Partnership Focus</h3>
            </div>
            <p className="pilot-description">Enterprise tools assume you compete alone. We know SMBs win through partnerships—our AI finds your perfect teaming opportunities.</p>
          </div>
        </div>
      </section>

      {/* Demo Section - Enhanced Multi-Path CTAs */}
      <section id="try-fit-demo" className="demo-section section">
        <div className="demo-cta-matrix">
          <div className="demo-cta-primary">
            <h3>See the 30-Second Analysis in Action</h3>
            <p className="section-description">
              Paste any RFP or opportunity description. Experience how MyBidFit cuts through the noise with plain English recommendations.
            </p>
          </div>
          
          <div className="demo-container">
            <div className="demo-card-professional">
              <form onSubmit={handleTryFitDemo} className="demo-form">
                <textarea
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  placeholder="Example: 'Healthcare provider needs cybersecurity consulting. 6-month timeline, $500K budget, HIPAA compliance required, must have healthcare experience...'"
                  className="demo-textarea"
                />
                <button
                  type="submit"
                  className="btn-demo-instant cta-ripple"
                  data-cta-type="primary"
                  data-conversion-path="instant-demo"
                >
                  Get Instant Analysis
                </button>
              </form>
              <p className="demo-disclaimer">
                Live demo with real AI analysis. Full features available in free trial.
              </p>
            </div>
          </div>
          
          <div className="demo-cta-alternatives">
            <button 
              onClick={playDemoVideo}
              className="btn-secondary-enterprise"
              data-cta-type="secondary"
              data-conversion-path="demo-video"
            >
              Watch Video Demo
            </button>
            <button 
              onClick={() => alert('Demo scheduling coming soon!')}
              className="btn-secondary-enterprise"
              data-cta-type="secondary"
              data-conversion-path="schedule-demo"
            >
              Schedule Live Demo
            </button>
            <Link 
              to="/features" 
              className="btn-tertiary-enterprise"
              data-cta-type="tertiary"
              data-conversion-path="explore-features"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Final Conversion Section - Enterprise-Grade */}
      <section className="final-conversion-section">
        <div className="conversion-header">
          <h2>Ready to Be Part of the Revolution?</h2>
          <p>Join forward-thinking SMB sellers testing the future of opportunity intelligence.</p>
        </div>
        
        <div className="conversion-cta-matrix">
          <div className="conversion-primary">
            <Link 
              to="/register" 
              className="btn-premium-final cta-ripple"
              data-cta-type="primary"
              data-conversion-path="final-conversion"
            >
              <span className="cta-text">Reserve Your Free Trial Spot</span>
              <span className="cta-icon">🚀</span>
            </Link>
            <div className="scarcity-indicator">
              <span className="spots-remaining">Only 15 spots remaining this month</span>
            </div>
          </div>
          
          <div className="conversion-alternatives">
            <button 
              onClick={() => alert('Demo scheduling coming soon!')}
              className="btn-secondary-enterprise"
              data-cta-type="secondary"
              data-conversion-path="final-demo"
            >
              Schedule Demo Call
            </button>
            <button 
              onClick={() => alert('Comparison guide coming soon!')}
              className="btn-secondary-enterprise"
              data-cta-type="secondary"
              data-conversion-path="final-guide"
            >
              Download Comparison Guide
            </button>
            <Link 
              to="/about" 
              className="btn-tertiary-enterprise"
              data-cta-type="tertiary"
              data-conversion-path="final-learn"
            >
              Learn More
            </Link>
          </div>
          
          <div className="trust-badge-enterprise">
            <span className="trust-item">Limited spots available</span>
            <span className="trust-item">No credit card required</span>
            <span className="trust-item">Cancel anytime</span>
          </div>
        </div>
        
        <div className="founder-story-container">
          <div className="founder-story-card">
            <blockquote className="founder-quote">
              "While enterprise tools lock out SMBs with complexity and cost, we're proving that powerful AI can be simple, affordable, and focused on what actually matters: winning the right deals."
            </blockquote>
            <p className="founder-attribution">
              Built by SMB veterans for SMB success stories.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-professional">
        <p className="footer-text">&copy; 2025 mybidfit. All rights reserved.</p>
      </footer>
    </>
  )
}

export default Home