import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureFlags, FeatureGate } from '../contexts/FeatureFlagsContext'
import { relationshipIntelligenceService } from '../services/api'

const RelationshipIntelligence = () => {
  const { user, isAuthenticated } = useAuth()
  const { hasFeature } = useFeatureFlags()
  
  // State management
  const [activeTab, setActiveTab] = useState('organizations')
  const [organizations, setOrganizations] = useState([])
  const [people, setPeople] = useState([])
  const [events, setEvents] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Connection path finder
  const [connectionSearch, setConnectionSearch] = useState({
    fromPersonId: '',
    toPersonId: '',
    paths: [],
    searching: false
  })
  
  // Filters
  const [filters, setFilters] = useState({
    organizationType: '',
    influenceScore: '',
    searchTerm: '',
    eventType: '',
    opportunityType: ''
  })

  useEffect(() => {
    if (isAuthenticated && hasFeature('relationship_intelligence_atlanta')) {
      loadData()
    }
  }, [isAuthenticated, hasFeature, activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      switch (activeTab) {
        case 'organizations':
          await loadOrganizations()
          break
        case 'people':
          await loadPeople()
          break
        case 'events':
          await loadEvents()
          break
        case 'opportunities':
          await loadOpportunities()
          break
        case 'insights':
          await loadInsights()
          break
        default:
          break
      }
    } catch (err) {
      setError('Failed to load relationship intelligence data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadOrganizations = async () => {
    const response = await relationshipIntelligenceService.getOrganizations(filters)
    if (response.data.success) {
      setOrganizations(response.data.data.organizations)
    }
  }

  const loadPeople = async () => {
    const response = await relationshipIntelligenceService.getPeople(filters)
    if (response.data.success) {
      setPeople(response.data.data.people)
    }
  }

  const loadEvents = async () => {
    const response = await relationshipIntelligenceService.getEvents(filters)
    if (response.data.success) {
      setEvents(response.data.data.events)
    }
  }

  const loadOpportunities = async () => {
    const response = await relationshipIntelligenceService.getOpportunities(filters)
    if (response.data.success) {
      setOpportunities(response.data.data.opportunities)
    }
  }

  const loadInsights = async () => {
    const response = await relationshipIntelligenceService.getInsights(filters)
    if (response.data.success) {
      setInsights(response.data.data.insights)
    }
  }

  const findConnectionPaths = async () => {
    if (!connectionSearch.fromPersonId || !connectionSearch.toPersonId) {
      alert('Please select both source and target people')
      return
    }

    try {
      setConnectionSearch(prev => ({ ...prev, searching: true }))
      const response = await relationshipIntelligenceService.findConnectionPaths(
        connectionSearch.fromPersonId, 
        connectionSearch.toPersonId
      )
      
      if (response.data.success) {
        setConnectionSearch(prev => ({
          ...prev,
          paths: response.data.data.paths
        }))
      }
    } catch (err) {
      console.error('Error finding connection paths:', err)
      alert('Failed to find connection paths')
    } finally {
      setConnectionSearch(prev => ({ ...prev, searching: false }))
    }
  }

  const getInfluenceScoreClass = (score) => {
    if (score >= 8) return 'high'
    if (score >= 5) return 'medium'
    return 'low'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Please log in to access relationship intelligence</h2>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    )
  }

  return (
    <FeatureGate 
      feature="relationship_intelligence_atlanta"
      fallback={
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Relationship Intelligence</h2>
          <div className="card feature-locked">
            <h3>Metro Atlanta Relationship Intelligence</h3>
            <p>Discover professional connections and networking opportunities in the Atlanta area.</p>
            <div className="pilot-badge">Pilot Program Only</div>
            <p className="small-text">This feature is currently available to select pilot users only.</p>
          </div>
        </div>
      }
    >
      <div style={{ marginBottom: '30px' }}>
        <div className="section-header">
          <h2>📊 Metro Atlanta Relationship Intelligence</h2>
          <p>Discover professional connections, networking opportunities, and strategic relationships in the Atlanta market.</p>
          <div className="pilot-badge">✨ Pilot Feature - Atlanta PoC</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs" style={{ marginBottom: '30px' }}>
        {[
          { id: 'organizations', label: '🏢 Organizations', count: organizations.length },
          { id: 'people', label: '👥 People', count: people.length },
          { id: 'events', label: '📅 Events', count: events.length },
          { id: 'opportunities', label: '💼 Opportunities', count: opportunities.length },
          { id: 'insights', label: '🧠 Insights', count: insights.length }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Connection Path Finder */}
      {activeTab === 'people' && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3>🔍 Connection Path Finder</h3>
          <p>Find the shortest connection path between two people in your network.</p>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
              <label>From Person:</label>
              <select
                value={connectionSearch.fromPersonId}
                onChange={(e) => setConnectionSearch(prev => ({ ...prev, fromPersonId: e.target.value }))}
              >
                <option value="">Select person...</option>
                {people.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name} - {person.title} at {person.organization_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
              <label>To Person:</label>
              <select
                value={connectionSearch.toPersonId}
                onChange={(e) => setConnectionSearch(prev => ({ ...prev, toPersonId: e.target.value }))}
              >
                <option value="">Select person...</option>
                {people.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name} - {person.title} at {person.organization_name}
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={findConnectionPaths}
              disabled={connectionSearch.searching}
              style={{ height: 'fit-content' }}
            >
              {connectionSearch.searching ? 'Searching...' : 'Find Path'}
            </button>
          </div>

          {/* Connection Paths Results */}
          {connectionSearch.paths.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Connection Paths Found:</h4>
              {connectionSearch.paths.map((path, index) => (
                <div key={index} className="connection-path" style={{ 
                  padding: '10px', 
                  margin: '10px 0', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  borderLeft: '4px solid #007bff'
                }}>
                  <strong>Path {index + 1} ({path.degree} degree{path.degree !== 1 ? 's' : ''})</strong>
                  <div style={{ marginTop: '5px' }}>
                    {path.path.map((step, stepIndex) => (
                      <span key={stepIndex}>
                        {step.name}
                        {stepIndex < path.path.length - 1 && ' → '}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading">
          <p>Loading {activeTab}...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error">{error}</div>
      )}

      {/* Organizations Tab */}
      {activeTab === 'organizations' && !loading && (
        <div className="card-grid">
          {organizations.map(org => (
            <div key={org.id} className="card">
              <h3>{org.name}</h3>
              <div className="organization-type">{org.type.toUpperCase()}</div>
              <div className={`influence-score ${getInfluenceScoreClass(org.influence_score)}`}>
                Influence Score: {org.influence_score}/10
              </div>
              <div className="collaboration-score">
                Collaboration Score: {org.collaboration_score}/10
              </div>
              <p>{org.description}</p>
              {org.website && (
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  Visit Website
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* People Tab */}
      {activeTab === 'people' && !loading && (
        <div className="card-grid">
          {people.map(person => (
            <div key={person.id} className="card">
              <h3>{person.name}</h3>
              <div className="person-title">{person.title}</div>
              <div className="organization-name">{person.organization_name}</div>
              <div className="networking-score">
                Networking Score: {person.networking_score}/10
              </div>
              <p>{person.bio}</p>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                <strong>Interests:</strong> {person.interests?.join(', ') || 'Not specified'}
              </div>
              {person.linkedin_url && (
                <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  LinkedIn Profile
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && !loading && (
        <div className="card-grid">
          {events.map(event => (
            <div key={event.id} className="card">
              <h3>{event.name}</h3>
              <div className="event-type">{event.type.toUpperCase()}</div>
              <div className="event-date">📅 {formatDate(event.date)}</div>
              <div className="event-location">📍 {event.location}</div>
              <p>{event.description}</p>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                <strong>Networking Value:</strong> {event.networking_value}/10
              </div>
              {event.registration_url && (
                <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Register for Event
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Opportunities Tab */}
      {activeTab === 'opportunities' && !loading && (
        <div className="card-grid">
          {opportunities.map(opportunity => (
            <div key={opportunity.id} className="card">
              <h3>{opportunity.title}</h3>
              <div className="opportunity-type">{opportunity.type.toUpperCase()}</div>
              <div className="relationship-requirement">
                Relationship Strength: {opportunity.relationship_strength_required}/10
              </div>
              <p>{opportunity.description}</p>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                <strong>Key Contacts:</strong> {opportunity.key_contacts?.join(', ') || 'Not specified'}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <strong>Value:</strong> ${(opportunity.estimated_value / 1000).toLocaleString()}K
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && !loading && (
        <div className="card-grid">
          {insights.map(insight => (
            <div key={insight.id} className="card">
              <h3>{insight.insight_type.replace('_', ' ').toUpperCase()}</h3>
              <div className="confidence-score">
                Confidence: {insight.confidence_score}/10
              </div>
              <p>{insight.insight_text}</p>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                Generated on {formatDate(insight.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && activeTab === 'organizations' && organizations.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No Organizations Found</h3>
          <p>No organizations match your current filters.</p>
        </div>
      )}

      {!loading && activeTab === 'people' && people.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No People Found</h3>
          <p>No people match your current filters.</p>
        </div>
      )}

      {!loading && activeTab === 'events' && events.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No Events Found</h3>
          <p>No upcoming events match your criteria.</p>
        </div>
      )}

      {!loading && activeTab === 'opportunities' && opportunities.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No Opportunities Found</h3>
          <p>No business opportunities match your current filters.</p>
        </div>
      )}

      {!loading && activeTab === 'insights' && insights.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No Insights Available</h3>
          <p>No relationship insights have been generated yet.</p>
        </div>
      )}
    </FeatureGate>
  )
}

export default RelationshipIntelligence