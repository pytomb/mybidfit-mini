const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

/**
 * Create a rate limiter with custom configuration
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express rate limit middleware
 */
const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100), // limit each IP
    message: 'Too many requests, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      res.status(429).json({
        error: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000) // seconds
      });
    }
  };

  return rateLimit({ ...defaults, ...options });
};

/**
 * Rate limiter for general API endpoints
 */
const apiLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: 'Too many API requests, please slow down.'
});

/**
 * Stricter rate limiter for authentication endpoints
 */
const authLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || 15 * 60 * 1000), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || 5), // 5 requests per window
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: process.env.RATE_LIMIT_AUTH_SKIP_SUCCESSFUL === 'true',
  skipFailedRequests: process.env.RATE_LIMIT_AUTH_SKIP_FAILED === 'true',
  keyGenerator: (req, res) => {
    // Use both IP and email (if provided) for more accurate limiting
    const email = req.body?.email || '';
    // Use the default IP extraction which handles IPv6 properly
    return `auth_${req.ip}_${email}`;
  }
});

/**
 * Rate limiter for password reset endpoints
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset requests per hour
  message: 'Too many password reset requests. Please wait before trying again.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Rate limiter for registration endpoints
 */
const registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour per IP
  message: 'Too many registration attempts. Please try again later.',
  skipSuccessfulRequests: true, // Don't count successful registrations
  skipFailedRequests: false
});

/**
 * Rate limiter for waitlist signups
 */
const waitlistLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 waitlist signups per day per IP
  message: 'Too many waitlist signup attempts.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Rate limiter for data-intensive operations
 */
const heavyLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many resource-intensive requests. Please wait before trying again.'
});

/**
 * Dynamic rate limiter based on user role
 * @param {Object} limits - Object with role-based limits
 * @returns {Function} Express middleware
 */
const createRoleBasedLimiter = (limits = {}) => {
  const defaultLimits = {
    anonymous: { windowMs: 15 * 60 * 1000, max: 50 },
    user: { windowMs: 15 * 60 * 1000, max: 100 },
    premium: { windowMs: 15 * 60 * 1000, max: 500 },
    admin: { windowMs: 15 * 60 * 1000, max: 1000 }
  };

  const roleLimits = { ...defaultLimits, ...limits };

  return (req, res, next) => {
    // Get user role from request (assumes authentication middleware has run)
    const userRole = req.user?.role || 'anonymous';
    const limit = roleLimits[userRole] || roleLimits.anonymous;

    const limiter = createRateLimiter({
      ...limit,
      keyGenerator: (req, res) => {
        // Use user ID if authenticated, otherwise use IP
        return req.user?.id || `role_${req.ip}`;
      }
    });

    limiter(req, res, next);
  };
};

/**
 * Account lockout middleware for failed login attempts
 */
const loginAttempts = new Map();
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_ATTEMPTS = 5;

const accountLockout = (req, res, next) => {
  const key = req.body?.email || req.ip;
  const attempts = loginAttempts.get(key) || { count: 0, lockedUntil: null };

  // Check if account is locked
  if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60);
    logger.warn('Account locked due to failed attempts:', { key, remainingTime });
    return res.status(429).json({
      error: `Account temporarily locked. Please try again in ${remainingTime} minutes.`,
      lockedUntil: attempts.lockedUntil,
      remainingTime: remainingTime * 60 // seconds
    });
  }

  // Reset attempts if lockout has expired
  if (attempts.lockedUntil && attempts.lockedUntil <= Date.now()) {
    loginAttempts.delete(key);
  }

  // Store original json method to intercept response
  const originalJson = res.json;
  res.json = function(data) {
    // Check if login failed
    if (res.statusCode === 401) {
      attempts.count++;
      if (attempts.count >= MAX_ATTEMPTS) {
        attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
        logger.warn('Account locked after max attempts:', { key, attempts: attempts.count });
      }
      loginAttempts.set(key, attempts);
    } else if (res.statusCode === 200 || res.statusCode === 201) {
      // Reset on successful login
      loginAttempts.delete(key);
    }
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Clean up old lockout entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of loginAttempts.entries()) {
    if (attempts.lockedUntil && attempts.lockedUntil < now - LOCKOUT_DURATION) {
      loginAttempts.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  registrationLimiter,
  waitlistLimiter,
  heavyLimiter,
  createRoleBasedLimiter,
  accountLockout
};