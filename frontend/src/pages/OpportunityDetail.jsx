import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureFlags, FeatureGate } from '../contexts/FeatureFlagsContext'
import { opportunityService, userService } from '../services/api'

const OpportunityDetail = () => {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const { hasFeature, isPilotUser } = useFeatureFlags()
  const [opportunity, setOpportunity] = useState(null)
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [scoring, setScoring] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scoringLoading, setScoringLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated, id])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load user's companies
      const companiesResponse = await userService.getCompanies()
      setCompanies(companiesResponse.data.data.companies)
      
      if (companiesResponse.data.data.companies.length > 0) {
        setSelectedCompany(companiesResponse.data.data.companies[0])
      }
      
      // Load mock opportunity data
      loadMockOpportunity(id)
      
    } catch (err) {
      setError('Failed to load opportunity details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMockOpportunity = (opportunityId) => {
    // Mock opportunity data - in production this would come from API
    const mockOpportunities = {
      1: {
        id: 1,
        title: "Government Contract: AI-Driven Data Analytics Platform",
        description: "This high-value opportunity requires expertise in secure cloud environments, large-scale data processing, and advanced AI/ML model deployment. Your recent project with [Client Name] is a direct match.",
        type: "government",
        value: "$2.5M",
        deadline: "2024-02-15",
        location: "Washington, DC",
        buyer_organization: "Department of Health and Human Services",
        required_capabilities: ["AI/ML", "Cloud Computing", "Data Analytics", "Security Compliance"],
        required_certifications: ["FedRAMP", "SOC2"],
        required_experience_years: 5,
        project_value_min: 2000000,
        project_value_max: 2500000,
        industry: "healthcare",
        detailed_requirements: [
          "Design and implement scalable AI/ML pipeline for healthcare data analysis",
          "Ensure HIPAA compliance and security best practices",
          "Integrate with existing government systems and databases",
          "Provide comprehensive documentation and training",
          "24/7 support and maintenance for 3 years"
        ]
      },
      2: {
        id: 2,
        title: "Private Sector: Enterprise SaaS Integration Specialist",
        description: "Seeking a partner to integrate a new CRM system with existing enterprise applications. Requires deep knowledge of API development and secure data migration.",
        type: "private",
        value: "$450K",
        deadline: "2024-01-30",
        location: "Remote",
        buyer_organization: "TechCorp Industries",
        required_capabilities: ["API Development", "System Integration", "Data Migration"],
        required_certifications: ["Salesforce Certified"],
        required_experience_years: 3,
        project_value_min: 400000,
        project_value_max: 500000,
        industry: "technology",
        detailed_requirements: [
          "Integrate Salesforce CRM with existing ERP system",
          "Migrate customer data from legacy system",
          "Develop custom APIs for real-time synchronization",
          "Ensure data security and privacy compliance",
          "Provide user training and documentation"
        ]
      }
    }
    
    setOpportunity(mockOpportunities[opportunityId] || null)
  }

  const runScoring = async () => {
    if (!selectedCompany) return
    
    setScoringLoading(true)
    setError('')
    
    try {
      const response = await opportunityService.scoreFit(selectedCompany.id, opportunity.id)
      setScoring(response.data.data)
    } catch (err) {
      setError('Failed to score opportunity fit')
      console.error(err)
    } finally {
      setScoringLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Please log in to view opportunity details</h2>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Loading opportunity details...</div>
  }

  if (!opportunity) {
    return (
      <div className="error">
        Opportunity not found
        <Link to="/dashboard" className="btn btn-secondary" style={{ marginLeft: '20px' }}>
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h1>{opportunity.title}</h1>
          <p style={{ color: 'var(--text-medium)', fontSize: '16px' }}>
            {opportunity.buyer_organization} • {opportunity.location}
          </p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Opportunity Details */}
      <section style={{ marginBottom: '30px' }}>
        <div className="card">
          <h3>Opportunity Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px' }}>
            <div>
              <p><strong>Project Value:</strong> {opportunity.value}</p>
              <p><strong>Deadline:</strong> {opportunity.deadline}</p>
              <p><strong>Industry:</strong> {opportunity.industry}</p>
              <p><strong>Required Experience:</strong> {opportunity.required_experience_years}+ years</p>
            </div>
            <div>
              <p><strong>Required Capabilities:</strong></p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                {opportunity.required_capabilities.map(capability => (
                  <span 
                    key={capability}
                    style={{
                      background: 'var(--primary-blue)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    {capability}
                  </span>
                ))}
              </div>
              <p><strong>Required Certifications:</strong> {opportunity.required_certifications.join(', ')}</p>
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h4>Description</h4>
            <p>{opportunity.description}</p>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h4>Detailed Requirements</h4>
            <ul>
              {opportunity.detailed_requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Company Selection & Scoring */}
      <section style={{ marginBottom: '30px' }}>
        <FeatureGate 
          feature="AI_OPPORTUNITY_SCORING"
          fallback={
            <div className="card feature-locked">
              <h3>AI-Powered Fit Analysis</h3>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Get advanced AI scoring analysis to determine how well this opportunity matches your capabilities.</p>
                <div className="coming-soon-badge" style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  backgroundColor: '#ffc107',
                  color: '#333',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '15px'
                }}>
                  Premium Feature
                </div>
                <p className="small-text">This feature will be available with your premium subscription or pilot access.</p>
              </div>
            </div>
          }
        >
          <div className="card">
            <h3>AI-Powered Fit Analysis {isPilotUser() && <span style={{color: 'var(--secondary-green)', fontSize: '12px'}}>✨ PILOT</span>}</h3>
            
            {companies.length > 0 ? (
              <div>
                <div className="form-group">
                  <label htmlFor="company-select">Select Company to Analyze:</label>
                  <select
                    id="company-select"
                    value={selectedCompany?.id || ''}
                    onChange={(e) => {
                      const company = companies.find(c => c.id === parseInt(e.target.value))
                      setSelectedCompany(company)
                      setScoring(null) // Reset scoring when company changes
                    }}
                  >
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={runScoring}
                  className="btn btn-primary"
                  disabled={!selectedCompany || scoringLoading}
                >
                  {scoringLoading ? 'Analyzing Fit...' : 'Analyze Opportunity Fit'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Create a company profile to get AI-powered fit analysis</p>
                <Link to="/profile" className="btn btn-primary">Create Company Profile</Link>
              </div>
            )}
          </div>
        </FeatureGate>
      </section>

      {/* Scoring Results */}
      {scoring && hasFeature('AI_OPPORTUNITY_SCORING') && (
        <section style={{ marginBottom: '30px' }}>
          <div className="card">
            <h3>Fit Analysis Results</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div className="match-score good" style={{ fontSize: '18px', padding: '15px 25px' }}>
                Overall Score: {scoring.overallScore}% - {scoring.verdict}
              </div>
            </div>

            {/* Panel of Judges Breakdown */}
            {scoring.judgeScores && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Panel of Judges Analysis</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {Object.entries(scoring.judgeScores).map(([judgeName, judgeResult]) => (
                    <div key={judgeName} className="card" style={{ padding: '15px' }}>
                      <h5 style={{ textTransform: 'capitalize', marginBottom: '10px' }}>
                        {judgeName.replace(/([A-Z])/g, ' $1').trim()} Judge
                      </h5>
                      <div className={`match-score ${judgeResult.score >= 80 ? 'good' : judgeResult.score >= 60 ? 'medium' : 'low'}`}>
                        {judgeResult.score}%
                      </div>
                      <p style={{ fontSize: '12px', marginTop: '8px' }}>
                        {judgeResult.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {scoring.recommendations && scoring.recommendations.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Recommendations</h4>
                <ul>
                  {scoring.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {scoring.nextSteps && scoring.nextSteps.length > 0 && (
              <div>
                <h4>Next Steps</h4>
                <ul>
                  {scoring.nextSteps.map((step, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}

export default OpportunityDetail