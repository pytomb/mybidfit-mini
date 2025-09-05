const { ZodError } = require('zod');
const { logger } = require('../utils/logger');

/**
 * Format Zod validation errors for API responses
 * @param {ZodError} error - Zod validation error
 * @returns {Object} Formatted error response
 */
const formatZodError = (error) => {
  // Handle various error object structures
  const errorArray = error?.errors || error?.issues || [];
  const errors = Array.isArray(errorArray) ? errorArray.map(err => ({
    field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || 'unknown'),
    message: err.message || 'Validation error',
    code: err.code || 'unknown'
  })) : [];

  return {
    error: 'Validation failed',
    details: errors,
    errorCount: errors.length
  };
};

/**
 * Create validation middleware for a specific schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {('body'|'query'|'params')} property - Request property to validate
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return async (req, res, next) => {
    try {
      // Parse and validate the request data
      const validatedData = await schema.parseAsync(req[property]);
      
      // Replace request data with validated/transformed data
      req[property] = validatedData;
      
      // Log successful validation in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Validation passed for ${req.method} ${req.path}`);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Log validation errors
        logger.warn('Validation error:', {
          path: req.path,
          method: req.method,
          errors: error.errors
        });
        
        // Return formatted validation error
        return res.status(400).json(formatZodError(error));
      }
      
      // Handle unexpected errors
      logger.error('Unexpected validation error:', error);
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
};

/**
 * Validate multiple request properties at once
 * @param {Object} schemas - Object with schemas for different properties
 * @returns {Function} Express middleware function
 */
const validateMultiple = (schemas) => {
  return async (req, res, next) => {
    try {
      const validationPromises = [];
      const properties = [];
      
      // Validate each property
      for (const [property, schema] of Object.entries(schemas)) {
        if (schema && req[property]) {
          validationPromises.push(schema.parseAsync(req[property]));
          properties.push(property);
        }
      }
      
      // Wait for all validations to complete
      const results = await Promise.all(validationPromises);
      
      // Replace request data with validated data
      results.forEach((data, index) => {
        req[properties[index]] = data;
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation error:', {
          path: req.path,
          method: req.method,
          errors: error.errors
        });
        
        return res.status(400).json(formatZodError(error));
      }
      
      logger.error('Unexpected validation error:', error);
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
};

/**
 * Validate request headers
 * @param {import('zod').ZodSchema} schema - Zod schema for headers
 * @returns {Function} Express middleware function
 */
const validateHeaders = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedHeaders = await schema.parseAsync(req.headers);
      req.headers = { ...req.headers, ...validatedHeaders };
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Header validation error:', {
          path: req.path,
          method: req.method,
          errors: error.errors
        });
        
        return res.status(400).json({
          error: 'Invalid request headers',
          details: formatZodError(error).details
        });
      }
      
      logger.error('Unexpected header validation error:', error);
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
};

/**
 * Create a conditional validation middleware
 * @param {Function} condition - Function to determine if validation should run
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {string} property - Request property to validate
 * @returns {Function} Express middleware function
 */
const validateIf = (condition, schema, property = 'body') => {
  return async (req, res, next) => {
    if (condition(req)) {
      return validate(schema, property)(req, res, next);
    }
    next();
  };
};

/**
 * Sanitize and validate pagination parameters
 */
const paginationSchema = require('zod').z.object({
  limit: require('zod').z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 20)
    .pipe(require('zod').z.number().int().min(1).max(100)),
  offset: require('zod').z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 0)
    .pipe(require('zod').z.number().int().nonnegative()),
  sort: require('zod').z
    .string()
    .optional()
    .default('created_at'),
  order: require('zod').z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
});

/**
 * Common ID validation schema
 */
const idParamSchema = require('zod').z.object({
  id: require('zod').z.string().uuid('Invalid ID format')
});

/**
 * Integer ID validation schema (for opportunities, etc.)
 */
const intIdParamSchema = require('zod').z.object({
  id: require('zod').z.string().transform(val => parseInt(val, 10)).pipe(require('zod').z.number().int().positive('Invalid ID'))
});

module.exports = {
  validate,
  validateMultiple,
  validateHeaders,
  validateIf,
  formatZodError,
  // Export common schemas
  paginationSchema,
  idParamSchema,
  intIdParamSchema
};