const { logger } = require('../utils/logger');

// Simple request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  
  // Log response time when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

module.exports = { requestLogger };