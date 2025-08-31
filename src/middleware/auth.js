const jwt = require('jsonwebtoken');
const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const db = Database.getInstance();

    // Get user from database to ensure they're still active
    const result = await db.query(`
      SELECT id, email, first_name, last_name, company_name, role, is_active
      FROM users 
      WHERE id = $1
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account is disabled'
      });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      companyName: user.company_name,
      role: user.role
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid access token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access token expired'
      });
    }

    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Authentication failed'
    });
  }
};

// Middleware to check if user has required role
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({
        error: `${requiredRole} role required`
      });
    }

    next();
  };
};

// Middleware for admin-only routes
const requireAdmin = requireRole('admin');

// Optional authentication (for routes that work better with auth but don't require it)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const db = Database.getInstance();

    // Get user from database
    const result = await db.query(`
      SELECT id, email, first_name, last_name, company_name, role, is_active
      FROM users 
      WHERE id = $1 AND is_active = true
    `, [decoded.userId]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        role: user.role
      };
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    // If token verification fails, continue without user
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  optionalAuth
};