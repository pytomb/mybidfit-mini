import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/api'

const Profile = () => {
  const { user, isAuthenticated } = useAuth()
  const [companies, setCompanies] = useState([])
  const [newCompany, setNewCompany] = useState({
    name: '',
    size_category: 'small',
    industries: [],
    capabilities: [],
    certifications: [],
    headquarters_city: '',
    headquarters_state: '',
    service_regions: [],
    team_size: 5,
    years_experience: 1,
    total_projects: 0,
    technologies: []
  })
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      loadCompanies()
    }
  }, [isAuthenticated])

  const loadCompanies = async () => {
    try {
      const response = await userService.getCompanies()
      setCompanies(response.data.data.companies)
    } catch (err) {
      setError('Failed to load companies')
      console.error(err)
    }
  }

  const handleCreateCompany = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await userService.createCompany({
        ...newCompany,
        industries: newCompany.industries.filter(i => i.trim()),
        capabilities: newCompany.capabilities.filter(c => c.trim()),
        certifications: newCompany.certifications.filter(c => c.trim()),
        service_regions: newCompany.service_regions.filter(r => r.trim()),
        technologies: newCompany.technologies.filter(t => t.trim())
      })
      
      setSuccess('Company profile created successfully!')
      setShowNewCompanyForm(false)
      setNewCompany({
        name: '',
        size_category: 'small',
        industries: [],
        capabilities: [],
        certifications: [],
        headquarters_city: '',
        headquarters_state: '',
        service_regions: [],
        team_size: 5,
        years_experience: 1,
        total_projects: 0,
        technologies: []
      })
      
      // Reload companies
      loadCompanies()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create company profile')
    } finally {
      setLoading(false)
    }
  }

  const handleArrayInputChange = (field, value) => {
    setNewCompany(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim())
    }))
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Please log in to access your profile</h2>
      </div>
    )
  }

  return (
    <>
      <div className="section-header">
        <h2>My Profile</h2>
        <p>Manage your company profiles to get better opportunity matches</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* User Info */}
      <section style={{ marginBottom: '30px' }}>
        <div className="card">
          <h3>Account Information</h3>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Member since:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
        </div>
      </section>

      {/* Existing Companies */}
      <section style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Your Company Profiles ({companies.length})</h3>
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewCompanyForm(true)}
          >
            Add Company Profile
          </button>
        </div>
        
        {companies.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <h4>No Company Profiles Yet</h4>
            <p>Create your first company profile to start receiving personalized opportunity matches.</p>
          </div>
        ) : (
          <div className="card-grid">
            {companies.map(company => (
              <div key={company.id} className="card">
                <h4>{company.name}</h4>
                <p><strong>Size:</strong> {company.size_category}</p>
                <p><strong>Industries:</strong> {company.industries?.join(', ') || 'None specified'}</p>
                <p><strong>Location:</strong> {company.headquarters_city}, {company.headquarters_state}</p>
                <p><strong>Team Size:</strong> {company.team_size} people</p>
                <p><strong>Experience:</strong> {company.years_experience} years</p>
                <p><strong>Credibility Score:</strong> {company.credibility_score || 'Not assessed'}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New Company Form */}
      {showNewCompanyForm && (
        <section style={{ marginBottom: '30px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Create New Company Profile</h3>
              <button 
                onClick={() => setShowNewCompanyForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateCompany}>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Company Size</label>
                <select
                  value={newCompany.size_category}
                  onChange={(e) => setNewCompany({...newCompany, size_category: e.target.value})}
                >
                  <option value="small">Small (1-50 employees)</option>
                  <option value="medium">Medium (51-200 employees)</option>
                  <option value="large">Large (201-1000 employees)</option>
                  <option value="enterprise">Enterprise (1000+ employees)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Industries (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. technology, healthcare, finance"
                  onChange={(e) => handleArrayInputChange('industries', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Capabilities (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. cloud computing, AI/ML, web development"
                  onChange={(e) => handleArrayInputChange('capabilities', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Certifications (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Certified, ISO 9001, SOC2"
                  onChange={(e) => handleArrayInputChange('certifications', e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label>Headquarters City</label>
                  <input
                    type="text"
                    value={newCompany.headquarters_city}
                    onChange={(e) => setNewCompany({...newCompany, headquarters_city: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Headquarters State</label>
                  <input
                    type="text"
                    value={newCompany.headquarters_state}
                    onChange={(e) => setNewCompany({...newCompany, headquarters_state: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Service Regions (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. North America, Europe, Remote"
                  onChange={(e) => handleArrayInputChange('service_regions', e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label>Team Size</label>
                  <input
                    type="number"
                    min="1"
                    value={newCompany.team_size}
                    onChange={(e) => setNewCompany({...newCompany, team_size: parseInt(e.target.value)})}
                  />
                </div>

                <div className="form-group">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={newCompany.years_experience}
                    onChange={(e) => setNewCompany({...newCompany, years_experience: parseInt(e.target.value)})}
                  />
                </div>

                <div className="form-group">
                  <label>Total Projects</label>
                  <input
                    type="number"
                    min="0"
                    value={newCompany.total_projects}
                    onChange={(e) => setNewCompany({...newCompany, total_projects: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Technologies (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, PostgreSQL, Docker"
                  onChange={(e) => handleArrayInputChange('technologies', e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Company Profile'}
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  )
}

export default Profile