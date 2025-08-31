const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

/**
 * Feature Flag Service for MyBidFit
 * Manages feature access for different user types and pilot programs
 */
class FeatureFlagService {
  constructor() {
    this.db = Database.getInstance();
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    // Define pilot user flag configuration
    this.pilotFlags = this.getPilotUserFlags();
    this.adminFlags = this.getAdminFlags();
    this.defaultFlags = this.getDefaultFlags();
  }

  /**
   * Pilot User Feature Flags - For the 10 IT services sales people
   */
  getPilotUserFlags() {
    return {
      // Core features (always enabled for pilot)
      BASIC_OPPORTUNITY_MATCHING: true,
      COMPANY_PROFILE_MANAGEMENT: true,
      DASHBOARD_ACCESS: true,
      USER_PROFILE_MANAGEMENT: true,
      
      // AI & Analytics features (enabled for pilot testing)
      AI_OPPORTUNITY_SCORING: true,
      MARKET_INTELLIGENCE: true,
      COMPANY_ANALYSIS: true,
      OPPORTUNITY_RECOMMENDATIONS: true,
      
      // Advanced features (enabled after pilot validation)
      PARTNERSHIP_MATCHING: process.env.PILOT_PARTNERSHIP_ENABLED === 'true',
      EVENT_RECOMMENDATIONS: process.env.PILOT_EVENTS_ENABLED === 'true',
      BATCH_ANALYSIS: false, // Enterprise only
      
      // Premium features (testing revenue potential)
      ROI_ANALYSIS: true,
      COMPREHENSIVE_SCORING: true,
      JUDGE_BREAKDOWN: true,
      
      // Experimental features (A/B testing)
      ENHANCED_DASHBOARD: process.env.PILOT_ENHANCED_UI === 'true',
      ADVANCED_FILTERING: true,
      REAL_TIME_MATCHING: false, // Not ready yet
      
      // Relationship Intelligence (Atlanta PoC)
      relationship_intelligence_atlanta: process.env.PILOT_RELATIONSHIP_INTELLIGENCE === 'true'
    };
  }

  /**
   * Admin/Developer Feature Flags 
   */
  getAdminFlags() {
    return {
      // All pilot flags enabled
      ...this.getPilotUserFlags(),
      
      // Admin-only features
      ADMIN_DASHBOARD: true,
      FEATURE_FLAG_MANAGEMENT: true,
      USER_MANAGEMENT: true,
      SYSTEM_ANALYTICS: true,
      
      // Developer features
      DEBUG_SCORING: true,
      API_TESTING: true,
      MOCK_DATA_ACCESS: true,
      
      // All premium features
      SHAPLEY_ANALYSIS: true,
      PORTFOLIO_OPTIMIZATION: true,
      MULTI_PARTNER_ANALYSIS: true,
      PARTNERSHIP_BUNDLES: true
    };
  }

  /**
   * Default Feature Flags - For regular users (post-pilot)
   */
  getDefaultFlags() {
    return {
      // Basic features only
      BASIC_OPPORTUNITY_MATCHING: true,
      COMPANY_PROFILE_MANAGEMENT: true,
      DASHBOARD_ACCESS: true,
      USER_PROFILE_MANAGEMENT: true,
      
      // Limited AI features
      AI_OPPORTUNITY_SCORING: false,
      MARKET_INTELLIGENCE: false,
      COMPANY_ANALYSIS: false,
      
      // All advanced features disabled
      PARTNERSHIP_MATCHING: false,
      EVENT_RECOMMENDATIONS: false,
      BATCH_ANALYSIS: false,
      ROI_ANALYSIS: false,
      COMPREHENSIVE_SCORING: false,
      JUDGE_BREAKDOWN: false,
      
      // No experimental features
      ENHANCED_DASHBOARD: false,
      ADVANCED_FILTERING: false,
      REAL_TIME_MATCHING: false,
      
      // Relationship Intelligence disabled by default
      relationship_intelligence_atlanta: false
    };
  }

  /**
   * Get feature flags for a specific user
   */
  async getFlagsForUser(userId) {
    try {
      const cacheKey = `user_flags_${userId}`;
      const cached = this.getCachedValue(cacheKey);
      if (cached) return cached;

      // Get user info to determine flag set
      const user = await this.getUserInfo(userId);
      
      let flags;
      if (this.isPilotUser(user)) {
        flags = this.pilotFlags;
        logger.info(`Pilot user flags loaded for ${user.email}`);
      } else if (this.isAdminUser(user)) {
        flags = this.adminFlags;
        logger.info(`Admin flags loaded for ${user.email}`);
      } else {
        flags = this.defaultFlags;
        logger.info(`Default flags loaded for ${user.email}`);
      }

      // Apply any database overrides
      const overrides = await this.getDatabaseFlags(userId);
      const finalFlags = { ...flags, ...overrides };

      // Cache the result
      this.setCachedValue(cacheKey, finalFlags);
      
      return finalFlags;

    } catch (error) {
      logger.error('Error getting user flags:', error);
      return this.defaultFlags; // Fail safe
    }
  }

  /**
   * Check if user has specific feature flag
   */
  async hasFeature(userId, featureName) {
    try {
      const flags = await this.getFlagsForUser(userId);
      const hasFeature = flags[featureName] === true;
      
      logger.debug(`Feature check: ${featureName} for user ${userId} = ${hasFeature}`);
      return hasFeature;
      
    } catch (error) {
      logger.error(`Feature check failed for ${featureName}:`, error);
      return false; // Fail closed
    }
  }

  /**
   * Check if user is a pilot user (IT services sales people)
   */
  isPilotUser(user) {
    // Pilot user identification criteria
    const pilotEmails = [
      'pilot1@itservices.com',
      'pilot2@cloudtech.com', 
      'pilot3@cybersecurity.com',
      // Add other pilot email patterns
    ];

    // Check explicit pilot emails
    if (pilotEmails.includes(user.email)) return true;

    // Check domain patterns for IT services companies
    const itServicesDomains = [
      'itservices.com',
      'cloudtech.com',
      'cybersecurity.com',
      'techsolutions.com',
      'itsupport.com'
    ];

    const userDomain = user.email.split('@')[1];
    if (itServicesDomains.includes(userDomain)) return true;

    // Check if user has IT services company profile
    // This would require a database query to companies table
    return false;
  }

  /**
   * Check if user is admin
   */
  isAdminUser(user) {
    return user.role === 'admin' || user.email.includes('@mybidfit.com');
  }

  /**
   * Get user information
   */
  async getUserInfo(userId) {
    try {
      const result = await this.db.query(
        'SELECT id, email, role, created_at FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching user info:', error);
      throw error;
    }
  }

  /**
   * Get database-stored feature flag overrides
   */
  async getDatabaseFlags(userId) {
    try {
      // For now, return empty object
      // In future, this would query a feature_flags table
      return {};
    } catch (error) {
      logger.error('Error fetching database flags:', error);
      return {};
    }
  }

  /**
   * Set feature flag for specific user (admin function)
   */
  async setUserFlag(userId, featureName, enabled) {
    try {
      // This would update the database feature_flags table
      logger.info(`Feature flag ${featureName} set to ${enabled} for user ${userId}`);
      
      // Clear cache for this user
      this.cache.delete(`user_flags_${userId}`);
      
      return true;
    } catch (error) {
      logger.error('Error setting user flag:', error);
      return false;
    }
  }

  /**
   * Get all available features and their descriptions
   */
  getFeatureDefinitions() {
    return {
      // Core Features
      BASIC_OPPORTUNITY_MATCHING: {
        name: 'Basic Opportunity Matching',
        description: 'Core opportunity matching algorithm',
        category: 'core'
      },
      COMPANY_PROFILE_MANAGEMENT: {
        name: 'Company Profile Management', 
        description: 'Create and manage company profiles',
        category: 'core'
      },
      DASHBOARD_ACCESS: {
        name: 'Dashboard Access',
        description: 'Access to main dashboard interface',
        category: 'core'
      },
      
      // AI & Analytics
      AI_OPPORTUNITY_SCORING: {
        name: 'AI Opportunity Scoring',
        description: 'Panel of Judges AI scoring system',
        category: 'ai_analytics'
      },
      MARKET_INTELLIGENCE: {
        name: 'Market Intelligence',
        description: 'Market insights and competitive analysis', 
        category: 'ai_analytics'
      },
      COMPREHENSIVE_SCORING: {
        name: 'Comprehensive Scoring',
        description: 'Detailed breakdown of scoring methodology',
        category: 'ai_analytics'
      },
      
      // Partnership Features
      PARTNERSHIP_MATCHING: {
        name: 'Partnership Matching',
        description: 'Find complementary business partners',
        category: 'partnerships'
      },
      SHAPLEY_ANALYSIS: {
        name: 'Shapley Analysis',
        description: 'Fair revenue distribution analysis',
        category: 'partnerships'
      },
      
      // Premium Features
      ROI_ANALYSIS: {
        name: 'ROI Analysis',
        description: 'Return on investment calculations',
        category: 'premium'
      },
      EVENT_RECOMMENDATIONS: {
        name: 'Event Recommendations',
        description: 'Personalized networking event suggestions',
        category: 'premium'
      },
      
      // Experimental
      ENHANCED_DASHBOARD: {
        name: 'Enhanced Dashboard',
        description: 'Next-generation dashboard interface',
        category: 'experimental'
      }
    };
  }

  /**
   * Cache management
   */
  getCachedValue(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  setCachedValue(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.cacheExpiry
    });
  }

  /**
   * Clear all cached flags (for when flags are updated)
   */
  clearCache() {
    this.cache.clear();
    logger.info('Feature flag cache cleared');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  FeatureFlagService,
  getInstance: () => {
    if (!instance) {
      instance = new FeatureFlagService();
    }
    return instance;
  }
};