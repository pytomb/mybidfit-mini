const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

/**
 * Middleware to update user analysis count after successful scoring
 */
const updateAnalysisCount = async (req, res, next) => {
  // Store the original json method
  const originalJson = res.json;
  
  // Override res.json to intercept successful responses
  res.json = function(data) {
    // Check if this was a successful scoring operation
    if (data && data.success && req.path.includes('score-fit')) {
      updateUserAnalysisCount(req.user.id)
        .catch(error => logger.error('Failed to update analysis count:', error));
    }
    
    // Call the original json method
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Update user's analysis count and last analysis timestamp
 */
const updateUserAnalysisCount = async (userId) => {
  try {
    const db = Database.getInstance();
    
    await db.query(`
      UPDATE users 
      SET 
        analysis_count = COALESCE(analysis_count, 0) + 1,
        last_analysis_at = NOW()
      WHERE id = $1
    `, [userId]);
    
    logger.info('Analysis count updated', { userId });
    
  } catch (error) {
    logger.error('Error updating analysis count:', error);
    throw error;
  }
};

/**
 * Check if user has exceeded their free analysis limit
 */
const checkUsageLimit = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const db = Database.getInstance();
    
    // Get user's current usage and subscription status
    const result = await db.query(`
      SELECT 
        analysis_count,
        is_paid,
        subscription_tier
      FROM users 
      WHERE id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];
    const analysisCount = user.analysis_count || 0;
    const isPaid = user.is_paid || false;

    // Define usage limits
    const FREE_LIMIT = 3;
    const PAID_LIMITS = {
      'starter': 50,
      'professional': 200,
      'enterprise': -1 // unlimited
    };

    // Check if user has exceeded their limit
    if (!isPaid && analysisCount >= FREE_LIMIT) {
      return res.status(429).json({
        success: false,
        error: 'Free analysis limit exceeded. Please upgrade to continue.',
        details: {
          currentUsage: analysisCount,
          limit: FREE_LIMIT,
          isPaid: false,
          upgradeRequired: true
        }
      });
    }

    if (isPaid && user.subscription_tier) {
      const paidLimit = PAID_LIMITS[user.subscription_tier] || FREE_LIMIT;
      if (paidLimit > 0 && analysisCount >= paidLimit) {
        return res.status(429).json({
          success: false,
          error: `${user.subscription_tier} plan limit exceeded. Please upgrade to continue.`,
          details: {
            currentUsage: analysisCount,
            limit: paidLimit,
            isPaid: true,
            subscriptionTier: user.subscription_tier,
            upgradeRequired: true
          }
        });
      }
    }

    // Add usage info to request for use in response
    req.userUsage = {
      analysisCount,
      isPaid,
      subscriptionTier: user.subscription_tier,
      remainingAnalyses: isPaid ? 
        (PAID_LIMITS[user.subscription_tier] > 0 ? PAID_LIMITS[user.subscription_tier] - analysisCount : 'unlimited') :
        Math.max(0, FREE_LIMIT - analysisCount)
    };

    next();

  } catch (error) {
    logger.error('Usage limit check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check usage limits',
      details: error.message
    });
  }
};

/**
 * Add usage tracking info to successful responses
 */
const addUsageInfo = (req, res, next) => {
  // Store the original json method
  const originalJson = res.json;
  
  // Override res.json to add usage info
  res.json = function(data) {
    // Add usage info to successful responses
    if (data && data.success && req.userUsage) {
      data.usage = req.userUsage;
    }
    
    // Call the original json method
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  updateAnalysisCount,
  updateUserAnalysisCount,
  checkUsageLimit,
  addUsageInfo
};