import { describe } from 'node:test';

/**
 * Analytics API Test Suite - Main Orchestrator
 * 
 * This file has been refactored from a monolithic 708-line test file into
 * modular test suites for better maintainability and organization.
 * 
 * Test Coverage:
 * - Tracking Endpoints (POST /api/analytics/track)
 * - Conversion Funnel Analytics (GET /api/analytics/conversion-funnel)
 * - Middleware Integration (Authentication, Rate Limiting, Admin Access)
 * - Data Aggregation and Statistics (Time-based aggregations, metrics)
 * - Performance and Scalability (Batch operations, database optimization)
 * 
 * Shared utilities and test helpers are centralized in testHelpers.js
 */

describe('Analytics API - Complete Test Suite', async () => {
  
  // Import and run all modular test suites
  await import('./analytics/trackingEndpoints.test.js');
  await import('./analytics/conversionFunnel.test.js');
  await import('./analytics/middleware.test.js');
  await import('./analytics/dataAggregation.test.js');
  await import('./analytics/performance.test.js');
  
  // Test helpers are imported by individual test files as needed
  // Available in: ./analytics/testHelpers.js
  
});