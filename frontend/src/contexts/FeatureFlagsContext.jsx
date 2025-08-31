import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const FeatureFlagsContext = createContext()

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext)
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider')
  }
  return context
}

export const FeatureFlagsProvider = ({ children }) => {
  const [featureFlags, setFeatureFlags] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load feature flags when user is authenticated
  const loadFeatureFlags = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get feature flags from the API
      const response = await api.get('/api/users/feature-flags')
      
      if (response.data.success) {
        setFeatureFlags(response.data.data.flags || {})
      } else {
        throw new Error('Failed to load feature flags')
      }
      
    } catch (err) {
      console.error('Error loading feature flags:', err)
      setError(err.message || 'Failed to load feature flags')
      
      // Set default flags on error (basic access only)
      setFeatureFlags({
        BASIC_OPPORTUNITY_MATCHING: true,
        COMPANY_PROFILE_MANAGEMENT: true,
        DASHBOARD_ACCESS: true,
        USER_PROFILE_MANAGEMENT: true
      })
      
    } finally {
      setLoading(false)
    }
  }

  // Check if user has a specific feature
  const hasFeature = (featureName) => {
    return featureFlags[featureName] === true
  }

  // Check if user has any of the specified features
  const hasAnyFeature = (featureNames) => {
    return featureNames.some(featureName => hasFeature(featureName))
  }

  // Check if user has all of the specified features
  const hasAllFeatures = (featureNames) => {
    return featureNames.every(featureName => hasFeature(featureName))
  }

  // Get list of enabled features
  const getEnabledFeatures = () => {
    return Object.entries(featureFlags)
      .filter(([feature, enabled]) => enabled)
      .map(([feature]) => feature)
  }

  // Feature flag categories for easy checking
  const getFeaturesByCategory = () => {
    const enabled = getEnabledFeatures()
    
    return {
      core: enabled.filter(f => [
        'BASIC_OPPORTUNITY_MATCHING',
        'COMPANY_PROFILE_MANAGEMENT', 
        'DASHBOARD_ACCESS',
        'USER_PROFILE_MANAGEMENT'
      ].includes(f)),
      
      aiAnalytics: enabled.filter(f => [
        'AI_OPPORTUNITY_SCORING',
        'MARKET_INTELLIGENCE',
        'COMPANY_ANALYSIS',
        'COMPREHENSIVE_SCORING',
        'JUDGE_BREAKDOWN'
      ].includes(f)),
      
      partnerships: enabled.filter(f => [
        'PARTNERSHIP_MATCHING',
        'SHAPLEY_ANALYSIS',
        'MULTI_PARTNER_ANALYSIS',
        'PARTNERSHIP_BUNDLES'
      ].includes(f)),
      
      premium: enabled.filter(f => [
        'ROI_ANALYSIS',
        'EVENT_RECOMMENDATIONS',
        'PORTFOLIO_OPTIMIZATION',
        'BATCH_ANALYSIS'
      ].includes(f)),
      
      experimental: enabled.filter(f => [
        'ENHANCED_DASHBOARD',
        'ADVANCED_FILTERING',
        'REAL_TIME_MATCHING',
        'relationship_intelligence_atlanta'
      ].includes(f))
    }
  }

  // Check if user is in pilot program
  const isPilotUser = () => {
    return hasFeature('AI_OPPORTUNITY_SCORING') && hasFeature('MARKET_INTELLIGENCE')
  }

  // Check if user has premium features
  const hasPremiumAccess = () => {
    return hasAnyFeature(['ROI_ANALYSIS', 'EVENT_RECOMMENDATIONS', 'PORTFOLIO_OPTIMIZATION'])
  }

  // Refresh feature flags (useful after account upgrades)
  const refreshFeatureFlags = async () => {
    await loadFeatureFlags()
  }

  const value = {
    featureFlags,
    loading,
    error,
    hasFeature,
    hasAnyFeature,
    hasAllFeatures,
    getEnabledFeatures,
    getFeaturesByCategory,
    isPilotUser,
    hasPremiumAccess,
    refreshFeatureFlags,
    loadFeatureFlags
  }

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

// Higher-order component for feature-gated components
export const withFeatureFlag = (featureName, FallbackComponent = null) => {
  return (WrappedComponent) => {
    return (props) => {
      const { hasFeature, loading } = useFeatureFlags()
      
      if (loading) {
        return <div className="loading">Loading features...</div>
      }
      
      if (!hasFeature(featureName)) {
        if (FallbackComponent) {
          return <FallbackComponent {...props} />
        }
        
        return (
          <div className="feature-unavailable">
            <h3>Feature Not Available</h3>
            <p>This feature is not available for your account type.</p>
            <p>Contact support to learn about accessing premium features.</p>
          </div>
        )
      }
      
      return <WrappedComponent {...props} />
    }
  }
}

// Feature gate component for conditional rendering
export const FeatureGate = ({ 
  feature, 
  features, // array of features (user needs ALL)
  anyFeatures, // array of features (user needs ANY)
  children, 
  fallback = null,
  fallbackText = "This feature is not available for your account."
}) => {
  const { hasFeature, hasAllFeatures, hasAnyFeature, loading } = useFeatureFlags()
  
  if (loading) {
    return <div className="loading">Loading...</div>
  }
  
  let hasAccess = false
  
  if (feature) {
    hasAccess = hasFeature(feature)
  } else if (features) {
    hasAccess = hasAllFeatures(features)
  } else if (anyFeatures) {
    hasAccess = hasAnyFeature(anyFeatures)
  }
  
  if (!hasAccess) {
    if (fallback) {
      return fallback
    }
    
    return (
      <div className="feature-gate-blocked">
        <p>{fallbackText}</p>
      </div>
    )
  }
  
  return children
}

export default FeatureFlagsProvider