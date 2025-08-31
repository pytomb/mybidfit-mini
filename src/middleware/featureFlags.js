const { getInstance: getFeatureFlagService } = require('../services/featureFlags');
const { logger } = require('../utils/logger');

/**
 * Feature Flag Middleware for API Protection
 * Protects routes based on user's feature flags
 */

/**
 * Create middleware to check if user has specific feature flag
 */
function requireFeature(featureName) {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required to access this feature',
          feature: featureName
        });
      }

      const featureFlagService = getFeatureFlagService();
      const hasFeature = await featureFlagService.hasFeature(req.user.id, featureName);

      if (!hasFeature) {
        logger.warn(`Feature access denied: ${featureName} for user ${req.user.id}`);
        
        return res.status(403).json({
          success: false,
          error: 'This feature is not available for your account',
          feature: featureName,
          message: 'Contact support to learn about accessing premium features'
        });
      }

      // Feature is available, continue to next middleware
      next();

    } catch (error) {
      logger.error('Feature flag check failed:', error);
      
      // In case of error, deny access to be safe
      return res.status(500).json({
        success: false,
        error: 'Unable to verify feature access',
        feature: featureName
      });
    }
  };
}

/**
 * Create middleware to check multiple features (user must have ALL)
 */
function requireFeatures(featureNames) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          features: featureNames
        });
      }

      const featureFlagService = getFeatureFlagService();
      const userId = req.user.id;

      // Check all required features
      const featureChecks = await Promise.all(
        featureNames.map(async (featureName) => ({
          feature: featureName,
          hasAccess: await featureFlagService.hasFeature(userId, featureName)
        }))
      );

      const missingFeatures = featureChecks
        .filter(check => !check.hasAccess)
        .map(check => check.feature);

      if (missingFeatures.length > 0) {
        logger.warn(`Multiple feature access denied for user ${userId}:`, missingFeatures);
        
        return res.status(403).json({
          success: false,
          error: 'Missing required features',
          missingFeatures,
          message: 'This functionality requires additional features'
        });
      }

      next();

    } catch (error) {
      logger.error('Multiple feature flag check failed:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Unable to verify feature access',
        features: featureNames
      });
    }
  };
}

/**
 * Create middleware to check if user has ANY of the specified features
 */
function requireAnyFeature(featureNames) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          features: featureNames
        });
      }

      const featureFlagService = getFeatureFlagService();
      const userId = req.user.id;

      // Check if user has any of the required features
      const featureChecks = await Promise.all(
        featureNames.map(featureName => 
          featureFlagService.hasFeature(userId, featureName)
        )
      );

      const hasAnyFeature = featureChecks.some(hasAccess => hasAccess);

      if (!hasAnyFeature) {
        logger.warn(`No alternative feature access for user ${userId}:`, featureNames);
        
        return res.status(403).json({
          success: false,
          error: 'Access denied - no alternative features available',
          requiredFeatures: featureNames,
          message: 'You need at least one of these features to access this functionality'
        });
      }

      next();

    } catch (error) {
      logger.error('Alternative feature flag check failed:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Unable to verify feature access'
      });
    }
  };
}

/**
 * Add user's feature flags to request object for use in route handlers
 */
function addFeatureFlagsToRequest() {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.id) {
        const featureFlagService = getFeatureFlagService();
        req.userFlags = await featureFlagService.getFlagsForUser(req.user.id);
        
        logger.debug(`Feature flags loaded for user ${req.user.id}:`, Object.keys(req.userFlags));
      } else {
        req.userFlags = {};
      }

      next();

    } catch (error) {
      logger.error('Error loading feature flags:', error);
      req.userFlags = {}; // Empty flags on error
      next();
    }
  };
}

/**
 * Conditional response based on feature flags
 * Returns different data based on what features user has
 */
function conditionalResponse(conditions) {
  return async (req, res, next) => {
    try {
      if (!req.userFlags) {
        // If flags not loaded, load them
        const featureFlagService = getFeatureFlagService();
        req.userFlags = req.user ? 
          await featureFlagService.getFlagsForUser(req.user.id) : {};
      }

      // Add feature-based conditionals to request
      req.featureConditions = {};
      
      for (const [conditionName, featureName] of Object.entries(conditions)) {
        req.featureConditions[conditionName] = req.userFlags[featureName] === true;
      }

      next();

    } catch (error) {
      logger.error('Error setting up conditional response:', error);
      req.featureConditions = {};
      next();
    }
  };
}

/**
 * Feature flag info endpoint middleware
 * Adds feature flag status to API responses
 */
function addFeatureFlagInfo() {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to add feature flag info
    res.json = function(data) {
      // Add feature flags to response if user is authenticated
      if (req.user && req.userFlags) {
        // Only include enabled features in response to reduce payload
        const enabledFeatures = Object.entries(req.userFlags)
          .filter(([feature, enabled]) => enabled)
          .map(([feature]) => feature);

        // Add to response
        if (typeof data === 'object' && data !== null) {
          data._featureFlags = {
            enabled: enabledFeatures,
            count: enabledFeatures.length
          };
        }
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
}

module.exports = {
  requireFeature,
  requireFeatures, 
  requireAnyFeature,
  addFeatureFlagsToRequest,
  conditionalResponse,
  addFeatureFlagInfo
};