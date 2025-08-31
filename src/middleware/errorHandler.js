const { logger } = require('../utils/logger');

/**
 * Enhanced Error Handling for MyBidFit Platform
 * Provides structured error responses, logging, and correlation tracking
 */

class ApiError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error factory functions for common scenarios
const createError = {
  validation: (message, details = null) => new ApiError(message, 400, 'VALIDATION_ERROR', details),
  notFound: (resource = 'Resource') => new ApiError(`${resource} not found`, 404, 'NOT_FOUND'),
  unauthorized: (message = 'Authentication required') => new ApiError(message, 401, 'UNAUTHORIZED'),
  forbidden: (message = 'Insufficient permissions') => new ApiError(message, 403, 'FORBIDDEN'),
  conflict: (message, details = null) => new ApiError(message, 409, 'CONFLICT', details),
  database: (message = 'Database operation failed') => new ApiError(message, 500, 'DATABASE_ERROR'),
  rateLimit: () => new ApiError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED'),
  partnerFit: {
    invalidCriteria: (details) => new ApiError('Invalid partner matching criteria', 400, 'INVALID_CRITERIA', details),
    scoringTimeout: () => new ApiError('Partner scoring request timed out', 408, 'SCORING_TIMEOUT'),
    insufficientData: (resource) => new ApiError(`Insufficient data for ${resource} analysis`, 400, 'INSUFFICIENT_DATA')
  }
};

// Enhanced error handler middleware
const errorHandler = (error, req, res, next) => {
  // Generate correlation ID for tracking
  const correlationId = req.correlationId || generateCorrelationId();
  
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  let details = null;

  // Handle ApiError instances
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    details = error.details;
  }
  // Handle database errors
  else if (error.code && error.code.startsWith('23')) { // PostgreSQL constraint violations
    if (error.code === '23505') { // Unique constraint violation
      statusCode = 409;
      message = 'Resource already exists';
      code = 'DUPLICATE_RESOURCE';
    } else if (error.code === '23503') { // Foreign key violation
      statusCode = 400;
      message = 'Referenced resource does not exist';
      code = 'INVALID_REFERENCE';
    }
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
    code = 'TOKEN_EXPIRED';
  }
  // Handle existing error patterns
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError' || error.status === 401) {
    statusCode = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (error.status === 403) {
    statusCode = 403;
    message = 'Forbidden';
    code = 'FORBIDDEN';
  } else if (error.status === 404) {
    statusCode = 404;
    message = 'Not Found';
    code = 'NOT_FOUND';
  } else if (error.message && error.status < 500) {
    statusCode = error.status || 400;
    message = error.message;
    code = 'CLIENT_ERROR';
  }

  // Log errors with appropriate detail level
  const logData = {
    correlationId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    error: {
      name: error.name,
      message: error.message,
      code: code,
      statusCode: statusCode
    }
  };

  if (statusCode >= 500) {
    logData.error.stack = error.stack;
    logger.error('Server error occurred', logData);
  } else {
    logger.warn('Client error occurred', logData);
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      status: statusCode,
      correlationId,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };

  // Add details for development/debugging
  if (details) {
    errorResponse.error.details = details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Generate unique correlation ID
function generateCorrelationId() {
  return 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Enhanced 404 handler
const notFoundHandler = (req, res, next) => {
  const error = createError.notFound(`Route ${req.method} ${req.path}`);
  next(error);
};

// Correlation ID middleware
const correlationIdMiddleware = (req, res, next) => {
  req.correlationId = req.get('X-Correlation-ID') || generateCorrelationId();
  res.set('X-Correlation-ID', req.correlationId);
  next();
};

// Request timeout middleware
const timeoutMiddleware = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      const error = new ApiError('Request timeout', 408, 'REQUEST_TIMEOUT');
      next(error);
    });
    next();
  };
};

module.exports = {
  ApiError,
  createError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  correlationIdMiddleware,
  timeoutMiddleware
};