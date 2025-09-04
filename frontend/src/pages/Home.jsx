import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { isAuthenticated } = useAuth()
{/* Demo-related state removed for soft launch - no demo functionality needed yet
  const [demoInput, setDemoInput] = useState('')
  const [showVideoDemo, setShowVideoDemo] = useState(false)
  const [demoResults, setDemoResults] = useState('')
  */}
{/* const [showDemoModal, setShowDemoModal] = useState(false) - Removed for soft launch */}

{/* Demo event handlers removed for soft launch - no demo functionality needed
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
  */}

{/* VideoModal component removed for soft launch - no video demo available yet
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
  */}

{/* DemoModal component removed for soft launch - no demo functionality needed
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
  */}

  return (
    <>
      {/* <DemoModal /> - Removed for soft launch */}
      {/* <VideoModal /> - Removed for soft launch */}
      
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
            
{/* Hero badge removed for soft launch - no unverified claims
            <div className="hero-badge-beta">
              🎯 SMB-Focused • No Enterprise Minimums
            </div>
            */}

            <div className="hero-stats-professional">
              <span className="hero-stat">⚡ 30-Second AI Analysis</span>
              <span className="hero-stat">📊 Easy to Understand</span>
              <span className="hero-stat">🤝 Dynamic Partnership Analysis</span>
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
              
{/* Video demo button removed for soft launch - no video available yet
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
              */}
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
{/* Try the Demo and Success Stories removed for soft launch
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
            */}
          </div>
        </div>
        
{/* Testimonial quotes removed for soft launch - unverified claims
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
        */}
        
{/* Trust indicators removed for soft launch - unverified claims
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
        */}
      </section>

{/* Value Props Section - Why Choose MyBidFit section hidden for fact-checking
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
              to="/features"
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
      */}

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

{/* Demo Section removed for soft launch - Get Instant Analysis not ready
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
              onClick={playDemoVideo}
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
      */}

{/* Professional Comparison Section removed for soft launch - needs fact checking
      <section className="comparison-section section">
        <div className="section-header">
          <h2>Why Choose MyBidFit Over Enterprise Solutions?</h2>
          <p>Skip scattered research chaos. Our AI delivers verified, cross-referenced opportunities that match your sweet spot.</p>
        </div>
        
        <div className="comparison-table">
          <div className="comparison-header">
            <div className="feature-col">Features</div>
            <div className="mybidfit-col">MyBidFit</div>
            <div className="competitor-col">Outreach.io</div>
            <div className="competitor-col">Highspot</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature">Search Method</div>
            <div className="mybidfit advantage">Natural language AI 🧠</div>
            <div className="competitor">Complex filters</div>
            <div className="competitor">Manual research</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature">Minimum Contract</div>
            <div className="mybidfit advantage">None - Start free 🎯</div>
            <div className="competitor">$12K+/year</div>
            <div className="competitor">$25K+/year</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature">Data Quality</div>
            <div className="mybidfit advantage">Cross-referenced & validated ✓</div>
            <div className="competitor">User-generated data</div>
            <div className="competitor">Static databases</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature">SMB Focus</div>
            <div className="mybidfit advantage">Built for growing businesses ✓</div>
            <div className="competitor">Enterprise-focused</div>
            <div className="competitor">Enterprise-focused</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature">AI Matching</div>
            <div className="mybidfit advantage">Purpose-built for opportunities ✓</div>
            <div className="competitor">General sales tools</div>
            <div className="competitor">Content management</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature">Partnership Discovery</div>
            <div className="mybidfit advantage">Built-in teaming intelligence ✓</div>
            <div className="competitor">Not available</div>
            <div className="competitor">Not available</div>
          </div>
        </div>
        
        <div className="comparison-cta-section">
          <div className="section-header">
            <h3>Ready to Experience the Difference?</h3>
            <p>Join SMBs who've moved beyond enterprise complexity to AI that actually works for growing businesses.</p>
          </div>
          
          <div className="social-cta-group">
            <Link 
              to="/register" 
              className="btn-premium-enterprise"
              data-cta-type="primary"
              data-conversion-path="comparison-trial"
            >
              Start Free Trial
            </Link>
            <button 
              onClick={playDemoVideo}
              className="btn-secondary-enterprise"
              data-cta-type="secondary"
              data-conversion-path="comparison-demo"
            >
              Watch Demo
            </button>
            <button 
              to="/features"
              className="btn-tertiary-enterprise"
              data-cta-type="tertiary"
              data-conversion-path="comparison-guide"
            >
              Download Full Comparison
            </button>
          </div>
        </div>
      </section>
      */}

      {/* Professional Pilot Program Section */}
      <section className="pilot-section section">
        <div className="section-header">
          <h2 style={{color: 'white'}}>Join the MyBidFit Pilot Program</h2>
          <p style={{color: 'rgba(255, 255, 255, 0.9)'}}>
            Be part of the future of opportunity intelligence. Limited spots available for forward-thinking SMBs.
          </p>
        </div>
        
        <div className="pilot-grid">
          <div className="pilot-card">
            <div className="pilot-badge">Early Access</div>
            <h3 style={{color: 'white', fontSize: '20px', marginBottom: '16px'}}>🚀 First to Market</h3>
            <p style={{color: 'rgba(255, 255, 255, 0.9)'}}>
              Get exclusive access to features before public launch. Your feedback shapes the future of opportunity analysis.
            </p>
          </div>
          
          <div className="pilot-card">
            <div className="pilot-badge">Direct Input</div>
            <h3 style={{color: 'white', fontSize: '20px', marginBottom: '16px'}}>💬 Shape the Product</h3>
            <p style={{color: 'rgba(255, 255, 255, 0.9)'}}>
              Weekly feedback sessions. Direct line to founders. Build the tool that perfectly fits your workflow.
            </p>
          </div>
          
          <div className="pilot-card">
            <div className="pilot-badge">Founder's Pricing</div>
            <h3 style={{color: 'white', fontSize: '20px', marginBottom: '16px'}}>💰 Locked-In Rates</h3>
            <p style={{color: 'rgba(255, 255, 255, 0.9)'}}>
              Pilot pricing locked for life. No price increases, no surprise fees. Founder's commitment to early believers.
            </p>
          </div>
        </div>
        
        <div className="pilot-cta" style={{textAlign: 'center', position: 'relative', zIndex: 2, marginTop: '40px'}}>
          <Link 
            to="/register" 
            className="btn-premium-enterprise"
            data-cta-type="primary"
            data-conversion-path="pilot-join"
            style={{fontSize: '20px', padding: '20px 40px'}}
          >
            Apply for Pilot Program
          </Link>
          <div className="cta-trust" style={{color: 'rgba(255, 255, 255, 0.8)', marginTop: '16px'}}>
            <span className="cta-trust-icon">✓</span>
            <span>Only 15 spots remaining this month</span>
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
              onClick={playDemoVideo}
              className="btn-secondary-enterprise"
              data-cta-type="secondary"
              data-conversion-path="final-demo"
            >
              Schedule Demo Call
            </button>
            <button 
              to="/features"
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