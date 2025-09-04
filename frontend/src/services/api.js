import axios from 'axios'

// Fixed API URL to correct port
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Create axios instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API service functions
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password) => api.post('/auth/register', { email, password }),
  getProfile: () => api.get('/users/profile')
}

export const opportunityService = {
  scoreFit: (companyId, opportunityId) => 
    api.post('/opportunities/score-fit', { companyId, opportunityId }),
  batchScore: (scoringRequests) => 
    api.post('/opportunities/batch-score', { scoringRequests })
}

export const supplierService = {
  analyze: (companyId, analysisData) => 
    api.post('/suppliers/analyze', { companyId, analysisData }),
  getAnalysisHistory: (companyId) => 
    api.get(`/suppliers/${companyId}/analysis-history`),
  batchAnalyze: (companyIds) => 
    api.post('/suppliers/batch-analyze', { companyIds })
}

export const partnershipService = {
  findMatches: (companyId, options) => 
    api.post('/partnerships/find-matches', { companyId, options }),
  analyzeLift: (partnershipData) => 
    api.post('/partnerships/analyze-lift', { partnershipData }),
  multiPartnerAnalysis: (companies, opportunities) => 
    api.post('/partnerships/multi-partner-analysis', { companies, opportunities })
}

export const eventService = {
  recommend: (companyId, options) => 
    api.post('/events/recommend', { companyId, options }),
  getRecommendations: (companyId) => 
    api.get(`/events/${companyId}/recommendations`),
  optimizePortfolio: (companyId, budget, timeframe, constraints) => 
    api.post('/events/portfolio-optimization', { companyId, budget, timeframe, constraints })
}

export const analysisService = {
  comprehensive: (companyId, opportunityIds, analysisOptions) => 
    api.post('/analysis/comprehensive', { companyId, opportunityIds, analysisOptions }),
  compareCompanies: (companyIds, opportunityId) => 
    api.post('/analysis/compare-companies', { companyIds, opportunityId }),
  getMarketInsights: (companyId) => 
    api.get(`/analysis/market-insights/${companyId}`),
  getOpportunitiesForCompany: (companyId, options = {}) => 
    api.get(`/opportunities/for-company/${companyId}`, { params: options })
}

export const userService = {
  getCompanies: () => api.get('/users/companies'),
  createCompany: (companyData) => api.post('/users/companies', companyData),
  updateCompany: (companyId, companyData) => 
    api.put(`/users/companies/${companyId}`, companyData),
  deleteCompany: (companyId) => api.delete(`/users/companies/${companyId}`)
}

export const relationshipIntelligenceService = {
  // Organizations
  getOrganizations: (params = {}) => 
    api.get('/relationship-intelligence/organizations', { params }),
  getOrganization: (id) => 
    api.get(`/relationship-intelligence/organizations/${id}`),
  
  // People
  getPeople: (params = {}) => 
    api.get('/relationship-intelligence/people', { params }),
  getPerson: (id) => 
    api.get(`/relationship-intelligence/people/${id}`),
  
  // Connections
  findConnectionPaths: (fromPersonId, toPersonId, maxDegrees = 3) => 
    api.get(`/relationship-intelligence/connections/paths`, { 
      params: { fromPersonId, toPersonId, maxDegrees } 
    }),
  getConnections: (personId) => 
    api.get(`/relationship-intelligence/connections/${personId}`),
  getNetworkAnalysis: (personId) => 
    api.get(`/relationship-intelligence/network-analysis/${personId}`),
  
  // Events
  getEvents: (params = {}) => 
    api.get('/relationship-intelligence/events', { params }),
  getEvent: (id) => 
    api.get(`/relationship-intelligence/events/${id}`),
  
  // Opportunities
  getOpportunities: (params = {}) => 
    api.get('/relationship-intelligence/opportunities', { params }),
  getOpportunity: (id) => 
    api.get(`/relationship-intelligence/opportunities/${id}`),
  
  // Insights
  getInsights: (params = {}) => 
    api.get('/relationship-intelligence/insights', { params }),
  generateInsights: (organizationIds, personIds, connectionType) => 
    api.post('/relationship-intelligence/insights/generate', { 
      organizationIds, personIds, connectionType 
    })
}

export const waitlistService = {
  join: (email) => api.post('/auth/waitlist', { email })
}