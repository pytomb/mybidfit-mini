import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureFlags, FeatureGate } from '../contexts/FeatureFlagsContext'
import { analysisService, userService } from '../services/api'

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth()
  const { hasFeature, isPilotUser, loadFeatureFlags } = useFeatureFlags()
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
      loadFeatureFlags() // Load feature flags on dashboard access
    }
  }, [isAuthenticated])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load user's companies
      const companiesResponse = await userService.getCompanies()
      setCompanies(companiesResponse.data.data.companies)
      
      if (companiesResponse.data.data.companies.length > 0) {
        const firstCompany = companiesResponse.data.data.companies[0]
        setSelectedCompany(firstCompany)
        
        // Load real opportunities for the company
        loadOpportunitiesForCompany(firstCompany)
      }
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadOpportunitiesForCompany = async (company) => {
    try {
      const response = await analysisService.getOpportunitiesForCompany(company.id)
      if (response.data.success) {
        const opportunities = response.data.data.opportunities.map(opp => ({
          id: opp.id,
          title: opp.title,
          matchScore: opp.match_score || 0,
          description: opp.description,
          type: opp.buyer_type,
          value: opp.project_value_min ? `$${(opp.project_value_min / 1000)}K - $${(opp.project_value_max / 1000)}K` : 'TBD',
          deadline: opp.submission_deadline ? new Date(opp.submission_deadline).toLocaleDateString() : 'TBD',
          matchDescription: opp.match_description || 'Potential Match',
          location: opp.location,
          industry: opp.industry,
          confidenceLevel: opp.confidence_level
        }))
        setOpportunities(opportunities)
      } else {
        console.error('Failed to load opportunities:', response.data.error)
        setOpportunities([])
      }
    } catch (error) {
      console.error('Error loading opportunities:', error)
      setOpportunities([])
    }
  }

  const getMatchScoreClass = (score) => {
    if (score >= 90) return 'good'
    if (score >= 75) return 'medium'
    return 'low'
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Please log in to access your dashboard</h2>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading">
        <p>Loading your personalized dashboard...</p>
      </div>
    )
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <>
      {/* Welcome Section */}
      <section style={{ marginBottom: '30px' }}>
        <div className="section-header">
          <h2>Welcome back{user?.email && `, ${user.email}`}!</h2>
          <p>Here's your personalized opportunity dashboard powered by AI matching.</p>
        </div>
      </section>

      {/* Company Selector */}
      {companies.length > 0 && (
        <section style={{ marginBottom: '30px' }}>
          <div className="form-group">
            <label htmlFor="company-select">Select Company Profile:</label>
            <select
              id="company-select"
              value={selectedCompany?.id || ''}
              onChange={(e) => {
                const company = companies.find(c => c.id === parseInt(e.target.value))
                setSelectedCompany(company)
                if (company) loadOpportunitiesForCompany(company)
              }}
            >
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* No Companies Alert */}
      {companies.length === 0 && (
        <section style={{ marginBottom: '30px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <h3>Complete Your Profile to Get Started</h3>
            <p>Create your company profile to unlock personalized opportunity matching.</p>
            <Link to="/profile" className="btn btn-primary">
              Create Company Profile
            </Link>
          </div>
        </section>
      )}

      {/* Opportunities Section */}
      {selectedCompany && opportunities.length > 0 && (
        <section style={{ marginBottom: '30px' }}>
          <div className="section-header">
            <h2>Personalized Opportunities for {selectedCompany.name}</h2>
            <p>Our AI-powered engine constantly scans for the best matches based on your unique capabilities and goals.</p>
          </div>
          
          <div className="card-grid">
            {opportunities.map(opportunity => (
              <div key={opportunity.id} className="card">
                <h3>{opportunity.title}</h3>
                <div className={`match-score ${getMatchScoreClass(opportunity.matchScore)}`}>
                  Match Score: {opportunity.matchScore}% - {
                    opportunity.matchScore >= 90 ? 'Exceptional Fit' :
                    opportunity.matchScore >= 75 ? 'Strong Alignment' :
                    'Growth Potential'
                  }
                </div>
                <p>{opportunity.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                  <div>
                    <strong>Value:</strong> {opportunity.value}<br />
                    <strong>Deadline:</strong> {opportunity.deadline}
                  </div>
                  <Link 
                    to={`/opportunity/${opportunity.id}`}
                    className="btn btn-secondary"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section style={{ marginBottom: '30px' }}>
        <div className="section-header">
          <h2>Quick Actions</h2>
          <p>Explore more features to maximize your success.</p>
        </div>
        
        <div className="card-grid">
          {/* AI Analysis - Available for pilot users */}
          <FeatureGate 
            feature="COMPANY_ANALYSIS"
            fallback={
              <div className="card feature-locked">
                <h3>AI Analysis</h3>
                <p>Get comprehensive analysis of your company's strengths and improvement opportunities.</p>
                <div className="coming-soon-badge">Coming Soon</div>
                <p className="small-text">This feature will be available in the next update.</p>
              </div>
            }
          >
            <div className="card">
              <h3>AI Analysis</h3>
              <p>Get comprehensive analysis of your company's strengths and improvement opportunities.</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (selectedCompany) {
                    // Navigate to analysis page when implemented
                    window.location.href = `/analysis/${selectedCompany.id}`
                  }
                }}
              >
                Run Analysis
              </button>
              {isPilotUser() && (
                <div className="pilot-badge">✨ Pilot Feature</div>
              )}
            </div>
          </FeatureGate>
          
          {/* Partnership Matching - Premium feature */}
          <FeatureGate 
            feature="PARTNERSHIP_MATCHING"
            fallback={
              <div className="card feature-locked">
                <h3>Find Partners</h3>
                <p>Discover complementary businesses for joint ventures and larger projects.</p>
                <div className="premium-badge">Premium Feature</div>
                <p className="small-text">Upgrade to access partnership matching.</p>
              </div>
            }
          >
            <div className="card">
              <h3>Find Partners</h3>
              <p>Discover complementary businesses for joint ventures and larger projects.</p>
              <Link 
                to="/partner-fit" 
                className="btn btn-primary"
              >
                Find Partners
              </Link>
            </div>
          </FeatureGate>
          
          {/* Event Recommendations - Premium feature */}
          <FeatureGate 
            feature="EVENT_RECOMMENDATIONS"
            fallback={
              <div className="card feature-locked">
                <h3>Event Recommendations</h3>
                <p>Get personalized networking and industry event recommendations.</p>
                <div className="premium-badge">Premium Feature</div>
                <p className="small-text">Upgrade to access event recommendations.</p>
              </div>
            }
          >
            <div className="card">
              <h3>Event Recommendations</h3>
              <p>Get personalized networking and industry event recommendations.</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (selectedCompany) {
                    // Navigate to events page when implemented
                    window.location.href = `/events/${selectedCompany.id}`
                  }
                }}
              >
                View Events
              </button>
            </div>
          </FeatureGate>

          {/* ROI Analysis - Available for pilot users */}
          <FeatureGate feature="ROI_ANALYSIS">
            <div className="card">
              <h3>ROI Analysis</h3>
              <p>Calculate return on investment for opportunities and partnerships.</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (selectedCompany) {
                    // Navigate to ROI analysis when implemented  
                    alert('ROI Analysis feature coming soon!')
                  }
                }}
              >
                Analyze ROI
              </button>
              {isPilotUser() && (
                <div className="pilot-badge">✨ Pilot Feature</div>
              )}
            </div>
          </FeatureGate>
        </div>
      </section>
    </>
  )
}

export default Dashboard