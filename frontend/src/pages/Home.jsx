import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { isAuthenticated } = useAuth()
  const [demoInput, setDemoInput] = useState('')

  const handleTryFitDemo = (e) => {
    e.preventDefault()
    if (demoInput.trim()) {
      // Enhanced demo functionality to showcase the product
      const demoResults = `
🎯 DEMO FIT ANALYSIS RESULTS

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

Note: This is a demo analysis. Real analysis would include deeper capability matching, competitive landscape assessment, and partnership recommendations.
      `
      
      alert(demoResults)
      setDemoInput('')
    }
  }

  return (
    <>
      {/* Hero Section with Try Fit Demo */}
      <section style={{
        backgroundColor: 'var(--primary-blue)',
        color: 'white',
        padding: '80px 0',
        textAlign: 'center',
        borderRadius: '12px',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '48px',
          marginBottom: '20px',
          fontWeight: '700'
        }}>
          Win the right work.
        </h1>
        <p style={{
          fontSize: '20px',
          maxWidth: '800px',
          margin: '0 auto 20px auto',
          opacity: '0.9'
        }}>
          Explainable fit. Partner lift. A plan for where to show up.
        </p>
        
        {/* Beta Program Indicator */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          padding: '8px 16px',
          borderRadius: '20px',
          display: 'inline-block',
          marginBottom: '30px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          🚀 Now in Beta • Building with 50+ pilot partners
        </div>

        {/* Dual CTAs */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          marginBottom: '40px',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => document.getElementById('try-fit-demo').scrollIntoView({ behavior: 'smooth' })}
            className="btn btn-primary"
            style={{
              backgroundColor: 'var(--secondary-green)',
              color: 'white',
              padding: '15px 30px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '18px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Try a Fit Score
          </button>
          <Link 
            to={isAuthenticated ? "/dashboard" : "/register"} 
            className="btn btn-secondary"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '15px 30px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '18px',
              border: '2px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            Book a Pilot
          </Link>
        </div>

        {/* Try Fit Demo Form */}
        <div id="try-fit-demo" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>Try a Fit Score</h3>
          <p style={{ 
            fontSize: '14px', 
            marginBottom: '15px', 
            opacity: '0.9' 
          }}>
            Paste any opportunity description - RFP, project brief, or business requirements. Our AI will analyze it from four key perspectives.
          </p>
          <form onSubmit={handleTryFitDemo}>
            <textarea
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              placeholder="Example: 'Looking for a consulting firm to implement AI-driven customer service automation for a mid-size healthcare provider. 6-month timeline, $500K budget, must comply with HIPAA requirements...'"
              style={{
                width: '100%',
                height: '120px',
                padding: '15px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                marginBottom: '15px',
                resize: 'vertical'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: 'var(--secondary-green)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Run Demo Analysis
            </button>
          </form>
          <p style={{
            fontSize: '12px',
            opacity: '0.8',
            marginTop: '10px'
          }}>
            Directional suggestions only. Public signals. No people-tracking.
          </p>
        </div>
      </section>

      {/* Proof Row - Honest Pre-Revenue Version */}
      <section style={{ 
        marginBottom: '40px',
        textAlign: 'center',
        padding: '30px',
        backgroundColor: 'var(--bg-light)',
        borderRadius: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '30px'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-blue)' }}>50+</div>
            <div style={{ fontSize: '14px', color: 'var(--text-medium)' }}>Beta Partners</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-blue)' }}>10,000+</div>
            <div style={{ fontSize: '14px', color: 'var(--text-medium)' }}>Opportunities Analyzed</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-blue)' }}>25%</div>
            <div style={{ fontSize: '14px', color: 'var(--text-medium)' }}>Projected Time Savings</div>
          </div>
          <div style={{
            padding: '8px 16px',
            backgroundColor: 'var(--secondary-green)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Enterprise-Ready Security
          </div>
        </div>
      </section>

      {/* How It Works - 3-Step Flow */}
      <section style={{ marginBottom: '40px' }}>
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Three steps to winning the right work, with the right partners, at the right time.</p>
        </div>
        <div className="card-grid">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              color: 'var(--primary-blue)'
            }}>01</div>
            <h3>Fit</h3>
            <p>Get explainable fit scoring for any opportunity. Our AI analyzes your capabilities against requirements and shows you exactly why you're a good match - or why you're not.</p>
            <div style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: 'var(--bg-light)',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'var(--text-medium)',
              fontWeight: '600'
            }}>
              CFO • CISO • Operator • Skeptic viewpoints
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              color: 'var(--secondary-green)'
            }}>02</div>
            <h3>Partner Fit</h3>
            <p>Find the right partners to fill capability gaps or scale capacity. We match complementary businesses for teaming and facilitate strategic partnerships for bigger opportunities.</p>
            <div style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: 'var(--bg-light)',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'var(--text-medium)',
              fontWeight: '600'
            }}>
              Strategic partnerships • Joint ventures
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              color: 'var(--primary-blue)'
            }}>03</div>
            <h3>Show-up Plan</h3>
            <p>Get a clear roadmap for where to focus your business development efforts. Prioritized opportunities, timing insights, and competition analysis.</p>
            <div style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: 'var(--bg-light)',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'var(--text-medium)',
              fontWeight: '600'
            }}>
              Prioritization • Timing • Competition
            </div>
          </div>
        </div>
      </section>

      {/* Product Modules */}
      <section style={{ marginBottom: '40px' }}>
        <div className="section-header">
          <h2>Product Modules</h2>
          <p>Comprehensive tools for winning more work, built specifically for professional services.</p>
        </div>
        <div className="card-grid">
          <div className="card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '15px' 
            }}>
              <h3 style={{ margin: 0, marginRight: '10px' }}>Fit Scoring</h3>
              <span style={{
                backgroundColor: 'var(--secondary-green)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: '600'
              }}>BETA</span>
            </div>
            <p>Explainable AI analysis of opportunity fit with multi-persona evaluation (CFO, CISO, Operator, Skeptic). Understand not just if you're a fit, but why.</p>
          </div>
          <div className="card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '15px' 
            }}>
              <h3 style={{ margin: 0, marginRight: '10px' }}>Partner Fit</h3>
              <span style={{
                backgroundColor: 'var(--text-medium)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: '600'
              }}>COMING SOON</span>
            </div>
            <p>Intelligent partner discovery and matchmaking for joint ventures and teaming arrangements. Expand your capability set strategically.</p>
          </div>
          <div className="card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '15px' 
            }}>
              <h3 style={{ margin: 0, marginRight: '10px' }}>Networking Planner</h3>
              <span style={{
                backgroundColor: 'var(--text-medium)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: '600'
              }}>ROADMAP</span>
            </div>
            <p>Strategic networking recommendations based on opportunity pipeline and partnership gaps. Know exactly who to meet and when.</p>
          </div>
        </div>
      </section>

      {/* Building in the Open */}
      <section style={{ marginBottom: '40px' }}>
        <div className="section-header">
          <h2>Building in the Open</h2>
          <p>We're pre-revenue and proud of it. Here's what we're building and why.</p>
        </div>
        <div className="card-grid">
          <div className="card">
            <h3>🚀 From Founders Who've Been There</h3>
            <p>"After 15 years in professional services, I know the pain of chasing the wrong work. We're building the solution we wish we'd had - transparent, explainable, and honest about what it can and can't do."</p>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--text-medium)', 
              fontStyle: 'italic',
              marginTop: '15px'
            }}>- The mybidfit founding team</p>
          </div>
          <div className="card">
            <h3>💡 Our Beta Partner Approach</h3>
            <p>We're working with 50+ professional services firms to validate every feature before launch. No vanity metrics - just honest feedback from people using this in their real business development process.</p>
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: 'var(--bg-light)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--text-medium)'
            }}>
              💼 Consultancies • 🏗️ Engineering firms • 📊 Agencies • ⚖️ Legal practices
            </div>
          </div>
          <div className="card">
            <h3>🔮 What's Next</h3>
            <p>We're focused on getting Fit Scoring exactly right before expanding. Partner Fill and Networking Planner are in active development with our beta partners providing real-world requirements.</p>
            <Link 
              to="/register" 
              style={{
                display: 'inline-block',
                marginTop: '15px',
                padding: '8px 16px',
                backgroundColor: 'var(--primary-blue)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Join Our Beta Program →
            </Link>
          </div>
        </div>
      </section>

      {/* Why Trust a Pre-Revenue Company */}
      <section style={{ 
        marginBottom: '40px',
        padding: '40px 30px',
        backgroundColor: 'var(--bg-light)',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          marginBottom: '20px',
          color: 'var(--primary-blue)'
        }}>Why Trust a Pre-Revenue Company?</h2>
        <p style={{ 
          fontSize: '18px',
          maxWidth: '800px',
          margin: '0 auto 30px auto',
          lineHeight: '1.6',
          color: 'var(--text-medium)'
        }}>
          Because we're building this for ourselves. We're not venture-backed with artificial urgency to monetize. We're professionals who understand your business because we've lived it.
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          flexWrap: 'wrap',
          marginBottom: '30px'
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--secondary-green)' }}>✓ No VC Pressure</div>
            <div style={{ fontSize: '14px', color: 'var(--text-medium)' }}>We build features you need</div>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--secondary-green)' }}>✓ Direct Access</div>
            <div style={{ fontSize: '14px', color: 'var(--text-medium)' }}>Talk to the people building it</div>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--secondary-green)' }}>✓ Transparent Development</div>
            <div style={{ fontSize: '14px', color: 'var(--text-medium)' }}>See exactly what we're working on</div>
          </div>
        </div>
        <p style={{ 
          fontSize: '14px',
          color: 'var(--text-medium)',
          fontStyle: 'italic'
        }}>
          "The best software is built by people who have the problem themselves."
        </p>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '30px',
        marginTop: '40px',
        borderTop: '1px solid var(--border-light)',
        color: 'var(--text-medium)',
        fontSize: '14px'
      }}>
        <p>&copy; 2025 mybidfit. All rights reserved.</p>
      </footer>
    </>
  )
}

export default Home