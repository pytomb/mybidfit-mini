import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureFlags, FeatureGate } from '../contexts/FeatureFlagsContext'
import axios from 'axios'

const PartnerFit = () => {
  const { user } = useAuth()
  const { hasFeature, isPilotUser } = useFeatureFlags()
  const [searchMode, setSearchMode] = useState('complementary') // 'complementary' or 'similar'
  const [searchFilters, setSearchFilters] = useState({
    industries: [],
    capabilities: [],
    certifications: [],
    regions: [],
    companySize: ''
  })
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [error, setError] = useState(null)

  // API base URL
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams({
        matchType: searchMode,
        industries: searchFilters.industries.join(','),
        capabilities: searchFilters.capabilities.join(','),
        certifications: searchFilters.certifications.join(','),
        regions: searchFilters.regions.join(','),
        companySize: searchFilters.companySize,
        minScore: 0.6,
        limit: 20
      })

      // Get auth token if user is authenticated
      const token = localStorage.getItem('authToken')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const response = await axios.get(`${API_BASE}/partner-fit/search?${queryParams}`, {
        headers
      })

      if (response.data.success) {
        setPartners(response.data.data.partners)
      } else {
        setError('Failed to load partners')
      }
    } catch (err) {
      console.error('Partner search error:', err)
      setError('Error searching for partners. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async (partnerId, message) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        alert('Please log in to send invitations')
        return
      }

      const response = await axios.post(`${API_BASE}/partner-fit/invitation`, {
        toProfileId: partnerId,
        message: message,
        opportunityDescription: 'Partnership opportunity'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        alert('Partnership invitation sent successfully!')
      } else {
        alert('Failed to send invitation: ' + response.data.error)
      }
    } catch (err) {
      console.error('Send invitation error:', err)
      alert('Error sending invitation. Please try again.')
    }
  }

  useEffect(() => {
    // Load initial partners on mount
    handleSearch()
  }, [searchMode])

  const PersonaScore = ({ persona, data }) => {
    const getScoreColor = (score) => {
      if (score >= 80) return 'var(--secondary-green)'
      if (score >= 60) return '#ffc107'
      return '#dc3545'
    }

    const personaIcons = {
      cfo: '👔',
      ciso: '🔒',
      operator: '⚙️',
      skeptic: '🤔'
    }

    return (
      <div style={{
        padding: '10px',
        borderLeft: `3px solid ${getScoreColor(data.score)}`,
        backgroundColor: 'var(--bg-light)',
        borderRadius: '0 6px 6px 0',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <span style={{ fontSize: '18px', marginRight: '8px' }}>{personaIcons[persona]}</span>
          <strong style={{ textTransform: 'uppercase', fontSize: '12px', color: 'var(--text-medium)' }}>
            {persona} ({data.score}/100)
          </strong>
        </div>
        <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-dark)' }}>{data.summary}</p>
      </div>
    )
  }

  return (
    <FeatureGate 
      feature="PARTNERSHIP_MATCHING"
      fallback={
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
            <h2>Partnership Matching</h2>
            <p>Find complementary partners to expand your capabilities and scale capacity for larger opportunities.</p>
            <div className="premium-badge" style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#333',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '20px'
            }}>
              Premium Feature
            </div>
            <p className="small-text">This feature will be available with your premium subscription or pilot access.</p>
            <p>Contact support to learn about accessing partnership matching capabilities.</p>
          </div>
        </div>
      }
    >
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div className="section-header">
          <h1>Partner Fit</h1>
          <p>Find the right partners to complement your capabilities or scale your capacity</p>
          <div style={{
            display: 'inline-block',
            padding: '6px 12px',
            backgroundColor: isPilotUser() ? 'var(--secondary-green)' : '#ffc107',
            color: 'white',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            marginTop: '10px'
          }}>
            {isPilotUser() ? '✨ PILOT FEATURE' : 'PREMIUM FEATURE'}
          </div>
        </div>

      {/* Search Mode Selector */}
      <div style={{ 
        backgroundColor: 'var(--bg-light)', 
        padding: '20px', 
        borderRadius: '12px',
        marginBottom: '30px' 
      }}>
        <h3 style={{ marginBottom: '15px' }}>What type of partner are you looking for?</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSearchMode('complementary')}
            style={{
              padding: '15px 25px',
              borderRadius: '8px',
              border: searchMode === 'complementary' ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)',
              backgroundColor: searchMode === 'complementary' ? 'white' : 'transparent',
              cursor: 'pointer',
              flex: '1',
              minWidth: '200px'
            }}
          >
            <h4 style={{ color: 'var(--primary-blue)', marginBottom: '5px' }}>
              🔧 Complementary Partner
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-medium)', margin: 0 }}>
              Fill capability gaps for specific opportunities
            </p>
          </button>
          
          <button
            onClick={() => setSearchMode('similar')}
            style={{
              padding: '15px 25px',
              borderRadius: '8px',
              border: searchMode === 'similar' ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)',
              backgroundColor: searchMode === 'similar' ? 'white' : 'transparent',
              cursor: 'pointer',
              flex: '1',
              minWidth: '200px'
            }}
          >
            <h4 style={{ color: 'var(--secondary-green)', marginBottom: '5px' }}>
              📈 Similar Partner
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-medium)', margin: 0 }}>
              Scale capacity with peer firms
            </p>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Partner Results */}
      {loading ? (
        <div className="loading">
          <p>Finding the best partners for you...</p>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '20px' }}>
            {searchMode === 'complementary' ? 'Complementary' : 'Similar'} Partners
            <span style={{ 
              fontSize: '14px', 
              color: 'var(--text-medium)', 
              marginLeft: '10px' 
            }}>
              ({partners.length} matches)
            </span>
          </h3>
          
          <div className="card-grid">
            {partners.map(partner => (
              <div key={partner.id} className="card" style={{ position: 'relative' }}>
                {/* Match Score Badge */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  backgroundColor: partner.matchScore >= 0.8 ? 'var(--secondary-green)' : 
                                 partner.matchScore >= 0.6 ? '#ffc107' : '#dc3545',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {Math.round(partner.matchScore * 100)}% Match
                </div>

                <h3 style={{ marginBottom: '10px', paddingRight: '100px' }}>{partner.name}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-medium)', marginBottom: '15px' }}>
                  {partner.description}
                </p>

                {/* Company Details */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: 'var(--bg-light)',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      📍 {partner.regions.join(', ')}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: 'var(--bg-light)',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      👥 {partner.size}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {partner.certifications.map(cert => (
                      <span key={cert} style={{
                        padding: '2px 6px',
                        backgroundColor: '#e3f2fd',
                        color: 'var(--primary-blue)',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        ✓ {cert}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Match Reasons */}
                <div style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-dark)' }}>
                    Why we matched you:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {partner.reasons.map((reason, i) => (
                      <li key={i} style={{ fontSize: '12px', marginBottom: '4px', color: 'var(--text-medium)' }}>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSelectedPartner(partner)}
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '14px'
                    }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      const message = prompt('Enter a brief message for this partnership invitation:', 
                        `Hi ${partner.name}, I'm interested in exploring a partnership opportunity. Let's discuss how we can work together.`)
                      if (message) {
                        sendInvitation(partner.id, message)
                      }
                    }}
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '14px'
                    }}
                  >
                    Contact
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partner Detail Modal */}
      {selectedPartner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>{selectedPartner.name}</h2>
              <button
                onClick={() => setSelectedPartner(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-medium)'
                }}
              >
                ×
              </button>
            </div>

            <p style={{ marginBottom: '20px', color: 'var(--text-medium)' }}>
              {selectedPartner.description}
            </p>

            {/* Multi-Persona Analysis */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>Multi-Persona Analysis</h3>
              <PersonaScore persona="cfo" data={selectedPartner.personas.cfo} />
              <PersonaScore persona="ciso" data={selectedPartner.personas.ciso} />
              <PersonaScore persona="operator" data={selectedPartner.personas.operator} />
              <PersonaScore persona="skeptic" data={selectedPartner.personas.skeptic} />
            </div>

            {/* Capabilities */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Core Capabilities</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedPartner.capabilities.map(cap => (
                  <span key={cap} style={{
                    padding: '6px 12px',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '20px',
                    fontSize: '13px'
                  }}>
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact Actions */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => {
                  const message = prompt('Enter a detailed partnership message:', 
                    `Hi ${selectedPartner.name},\n\nI've reviewed your profile and believe there's a strong partnership opportunity between our companies.\n\n${selectedPartner.reasons.join('\n')}\n\nWould you be interested in discussing this further?\n\nBest regards`)
                  if (message) {
                    sendInvitation(selectedPartner.id, message)
                    setSelectedPartner(null)
                  }
                }}
              >
                Send Partnership Invitation
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setSelectedPartner(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </FeatureGate>
  )
}

export default PartnerFit