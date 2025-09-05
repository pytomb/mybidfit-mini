import { mock } from 'node:test';

/**
 * Shared test helpers and utilities
 * Used across all analytics test modules
 */

// Mock database connection
export const mockDatabase = {
  query: mock.fn(),
  connect: mock.fn(),
  disconnect: mock.fn()
};

/**
 * Create mock Express request object
 * @param {Object} overrides - Properties to override in the mock request
 * @returns {Object} Mock request object
 */
export const createMockRequest = (overrides = {}) => {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    user: null,
    ip: '127.0.0.1',
    method: 'GET',
    url: '/test',
    ...overrides
  };
};

/**
 * Create mock Express response object
 * @param {Object} overrides - Properties to override in the mock response  
 * @returns {Object} Mock response object
 */
export const createMockResponse = (overrides = {}) => {
  const mockRes = {
    status: mock.fn((code) => mockRes),
    json: mock.fn((data) => mockRes),
    send: mock.fn((data) => mockRes),
    setHeader: mock.fn((name, value) => mockRes),
    cookie: mock.fn((name, value) => mockRes),
    redirect: mock.fn((url) => mockRes),
    ...overrides
  };

  return mockRes;
};

/**
 * Create mock authentication middleware
 * @param {Object} user - User object to inject into request
 * @returns {Function} Mock middleware function
 */
export const createMockAuthMiddleware = (user = null) => {
  return mock.fn((req, res, next) => {
    req.user = user;
    next();
  });
};

/**
 * Create mock admin middleware 
 * @param {boolean} isAdmin - Whether to grant admin access
 * @returns {Function} Mock admin middleware
 */
export const createMockAdminMiddleware = (isAdmin = true) => {
  return mock.fn((req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!isAdmin || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  });
};

/**
 * Mock event data generators for testing
 */
export const mockEventGenerators = {
  /**
   * Generate page view event
   * @param {Object} overrides - Properties to override
   * @returns {Object} Mock page view event
   */
  pageView: (overrides = {}) => ({
    event: 'page_view',
    properties: {
      page: '/dashboard',
      referrer: 'https://google.com',
      ...overrides.properties
    },
    timestamp: new Date().toISOString(),
    ...overrides
  }),

  /**
   * Generate analysis event
   * @param {Object} overrides - Properties to override  
   * @returns {Object} Mock analysis event
   */
  analysisEvent: (overrides = {}) => ({
    event: 'analysis_completed',
    properties: {
      analysisType: 'supplier_analysis',
      companyId: 123,
      processingTime: 2500,
      accuracy: 0.92,
      ...overrides.properties
    },
    timestamp: new Date().toISOString(),
    ...overrides
  }),

  /**
   * Generate user journey event
   * @param {string} stage - Journey stage
   * @param {Object} overrides - Properties to override
   * @returns {Object} Mock journey event
   */
  journeyEvent: (stage = 'stage1_completed', overrides = {}) => ({
    event: stage,
    properties: {
      stageNumber: parseInt(stage.match(/\d+/)?.[0] || '1'),
      completionTime: Math.random() * 60000 + 30000,
      ...overrides.properties
    },
    timestamp: new Date().toISOString(),
    ...overrides
  }),

  /**
   * Generate batch of events for testing
   * @param {number} count - Number of events to generate
   * @param {Function} generator - Event generator function
   * @returns {Array} Array of mock events
   */
  batchEvents: (count = 10, generator = mockEventGenerators.pageView) => {
    return Array.from({ length: count }, (_, index) => 
      generator({ 
        properties: { batchIndex: index },
        timestamp: new Date(Date.now() + index * 1000).toISOString()
      })
    );
  }
};

/**
 * Database query result builders
 */
export const mockQueryResults = {
  /**
   * Build successful insert result
   * @param {Object} data - Data that was inserted
   * @param {number} id - Generated ID
   * @returns {Object} Mock database result
   */
  successfulInsert: (data, id = 1) => ({
    rows: [{ id, ...data, created_at: new Date() }],
    rowCount: 1
  }),

  /**
   * Build batch insert result
   * @param {Array} dataArray - Array of data that was inserted
   * @param {number} startId - Starting ID for generated IDs
   * @returns {Object} Mock database result
   */
  batchInsert: (dataArray, startId = 1) => ({
    rows: dataArray.map((data, index) => ({
      id: startId + index,
      ...data,
      created_at: new Date()
    })),
    rowCount: dataArray.length
  }),

  /**
   * Build aggregation query result
   * @param {Array} aggregatedData - Pre-aggregated data
   * @returns {Object} Mock database result
   */
  aggregationResult: (aggregatedData) => ({
    rows: aggregatedData,
    rowCount: aggregatedData.length
  }),

  /**
   * Build empty result
   * @returns {Object} Mock empty database result
   */
  emptyResult: () => ({
    rows: [],
    rowCount: 0
  })
};

/**
 * Time-based test utilities
 */
export const timeUtils = {
  /**
   * Generate timestamp for testing
   * @param {number} offsetMinutes - Minutes to offset from now
   * @returns {string} ISO timestamp string
   */
  generateTimestamp: (offsetMinutes = 0) => {
    return new Date(Date.now() + offsetMinutes * 60 * 1000).toISOString();
  },

  /**
   * Generate date range for testing
   * @param {number} days - Number of days in range
   * @returns {Object} Start and end dates
   */
  generateDateRange: (days = 30) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      startDate: start,
      endDate: end
    };
  },

  /**
   * Generate time series data for testing
   * @param {number} points - Number of data points
   * @param {number} intervalHours - Hours between points
   * @returns {Array} Time series data points
   */
  generateTimeSeries: (points = 24, intervalHours = 1) => {
    const data = [];
    const baseTime = Date.now() - (points * intervalHours * 60 * 60 * 1000);
    
    for (let i = 0; i < points; i++) {
      data.push({
        timestamp: new Date(baseTime + (i * intervalHours * 60 * 60 * 1000)).toISOString(),
        value: Math.floor(Math.random() * 100) + 1
      });
    }
    
    return data;
  }
};

/**
 * Validation helpers for tests
 */
export const validationHelpers = {
  /**
   * Validate event data structure
   * @param {Object} event - Event object to validate
   * @returns {Object} Validation result
   */
  validateEventStructure: (event) => {
    const errors = [];
    
    if (!event.event || typeof event.event !== 'string') {
      errors.push('Event type is required and must be a string');
    }
    
    if (event.timestamp && !Date.parse(event.timestamp)) {
      errors.push('Timestamp must be a valid ISO date string');
    }
    
    if (event.properties && typeof event.properties !== 'object') {
      errors.push('Properties must be an object');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate API response structure
   * @param {Object} response - API response to validate
   * @param {Array} requiredFields - Required fields in response
   * @returns {Object} Validation result
   */
  validateApiResponse: (response, requiredFields = ['success']) => {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!(field in response)) {
        errors.push(`Required field '${field}' is missing`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      hasAllFields: requiredFields.every(field => field in response)
    };
  }
};

/**
 * Performance testing helpers
 */
export const performanceHelpers = {
  /**
   * Measure execution time of a function
   * @param {Function} fn - Function to measure
   * @returns {Object} Execution result with timing
   */
  measureExecutionTime: async (fn) => {
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await fn();
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      return {
        success: true,
        result,
        executionTime,
        performanceGrade: executionTime < 100 ? 'excellent' : 
                         executionTime < 500 ? 'good' : 
                         executionTime < 1000 ? 'acceptable' : 'needs_improvement'
      };
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;
      
      return {
        success: false,
        error,
        executionTime,
        performanceGrade: 'error'
      };
    }
  },

  /**
   * Generate load test data
   * @param {number} requestCount - Number of concurrent requests to simulate
   * @returns {Array} Array of load test scenarios
   */
  generateLoadTestScenarios: (requestCount = 100) => {
    return Array.from({ length: requestCount }, (_, index) => ({
      requestId: index + 1,
      timestamp: Date.now() + Math.random() * 1000,
      endpoint: `/api/analytics/track`,
      expectedResponseTime: 200 + Math.random() * 300
    }));
  }
};

/**
 * Reset all mocks - useful for beforeEach hooks
 */
export const resetAllMocks = () => {
  mockDatabase.query.mock.resetCalls();
  mockDatabase.connect.mock.resetCalls();
  mockDatabase.disconnect.mock.resetCalls();
};