const request = require('supertest');
const { testServer } = require('../setup/test-server');
const { testDb } = require('../setup/test-database');

/**
 * Supertest Helper Utilities
 * 
 * Provides convenient methods for API testing with supertest,
 * including authentication helpers and common test patterns.
 */

class SupertestHelper {
  constructor() {
    this.app = null;
    this.authTokens = new Map();
  }

  /**
   * Initialize the helper with the test app
   */
  async initialize() {
    if (!this.app) {
      await testServer.setup();
      this.app = testServer.getApp();
    }
    return this.app;
  }

  /**
   * Get authenticated supertest request object
   * @param {string} userEmail - Email of test user to authenticate as
   * @returns {object} Supertest request object with authorization header
   */
  async authenticatedRequest(userEmail = 'test-auth@example.com') {
    if (!this.app) {
      await this.initialize();
    }

    // Check if we already have a token for this user
    if (!this.authTokens.has(userEmail)) {
      const testUser = await testDb.getTestUser(userEmail);
      if (!testUser) {
        throw new Error(`Test user ${userEmail} not found. Ensure test database is setup.`);
      }

      const loginResponse = await request(this.app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123!' // Standard test password
        });

      if (loginResponse.status !== 200 || !loginResponse.body.token) {
        throw new Error(`Failed to authenticate test user ${userEmail}: ${loginResponse.body.error}`);
      }

      this.authTokens.set(userEmail, loginResponse.body.token);
    }

    return request(this.app).set('Authorization', `Bearer ${this.authTokens.get(userEmail)}`);
  }

  /**
   * Get unauthenticated supertest request object
   * @returns {object} Supertest request object without authorization
   */
  async unauthenticatedRequest() {
    if (!this.app) {
      await this.initialize();
    }
    return request(this.app);
  }

  /**
   * Clear cached authentication tokens (useful between tests)
   */
  clearAuthTokens() {
    this.authTokens.clear();
  }

  /**
   * Helper method to test validation errors
   * @param {string} method - HTTP method (get, post, put, delete)
   * @param {string} path - API path
   * @param {object} data - Request data
   * @param {object} options - Options including auth requirement
   * @returns {object} Response with validation error assertions
   */
  async testValidationError(method, path, data, options = {}) {
    let req;
    
    if (options.requireAuth) {
      req = await this.authenticatedRequest(options.userEmail);
    } else {
      req = await this.unauthenticatedRequest();
    }

    const response = await req[method.toLowerCase()](path)
      .send(data)
      .expect(400);

    // Assert standard validation error structure
    if (response.body.success !== false) {
      throw new Error('Expected validation error response to have success: false');
    }
    
    if (!Array.isArray(response.body.errors)) {
      throw new Error('Expected validation error response to have errors array');
    }

    return response;
  }

  /**
   * Helper method to test successful API calls
   * @param {string} method - HTTP method
   * @param {string} path - API path  
   * @param {object} data - Request data
   * @param {object} options - Options including expected status and auth
   * @returns {object} Response
   */
  async testSuccessfulRequest(method, path, data = {}, options = {}) {
    const expectedStatus = options.expectedStatus || (method.toLowerCase() === 'post' ? 201 : 200);
    let req;

    if (options.requireAuth) {
      req = await this.authenticatedRequest(options.userEmail);
    } else {
      req = await this.unauthenticatedRequest();
    }

    let request = req[method.toLowerCase()](path);
    
    if (method.toLowerCase() === 'get' && Object.keys(data).length > 0) {
      request = request.query(data);
    } else if (Object.keys(data).length > 0) {
      request = request.send(data);
    }

    const response = await request.expect(expectedStatus);
    return response;
  }

  /**
   * Helper to test rate limiting
   * @param {string} path - API path to test
   * @param {object} data - Request data
   * @param {number} attempts - Number of attempts to make
   * @returns {Array} Array of responses
   */
  async testRateLimit(path, data, attempts = 6) {
    const req = await this.unauthenticatedRequest();
    const promises = [];

    for (let i = 0; i < attempts; i++) {
      promises.push(req.post(path).send(data));
    }

    return await Promise.all(promises);
  }

  /**
   * Setup method for tests - ensures database and server are ready
   */
  async setupTest() {
    await testServer.setup();
    await testDb.setup();
    await testDb.createFullTestData();
    this.app = testServer.getApp();
  }

  /**
   * Cleanup method for tests
   */
  async cleanupTest() {
    this.clearAuthTokens();
    await testServer.cleanup();
    await testDb.cleanup();
  }
}

/**
 * Factory functions for common test patterns
 */

/**
 * Create a test suite with automatic setup/cleanup
 * @param {string} description - Test suite description
 * @param {function} testCallback - Test callback function that receives helper instance
 */
function createTestSuite(description, testCallback) {
  const { describe, before, after } = require('node:test');
  
  describe(description, () => {
    const helper = new SupertestHelper();

    before(async () => {
      await helper.setupTest();
    });

    after(async () => {
      await helper.cleanupTest();
    });

    testCallback(helper);
  });
}

/**
 * Quick test for authenticated endpoint
 * @param {string} description - Test description
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @param {object} data - Request data
 * @param {object} expectations - Expected response properties
 */
function testAuthenticatedEndpoint(description, method, path, data = {}, expectations = {}) {
  const { test } = require('node:test');
  const assert = require('node:assert');

  test(description, async () => {
    const helper = new SupertestHelper();
    await helper.setupTest();

    try {
      const response = await helper.testSuccessfulRequest(method, path, data, {
        requireAuth: true,
        expectedStatus: expectations.status || (method.toLowerCase() === 'post' ? 201 : 200)
      });

      // Assert any additional expectations
      if (expectations.hasProperty) {
        assert.ok(response.body[expectations.hasProperty], `Expected response to have property: ${expectations.hasProperty}`);
      }

      if (expectations.equals) {
        for (const [key, value] of Object.entries(expectations.equals)) {
          assert.strictEqual(response.body[key], value, `Expected ${key} to equal ${value}`);
        }
      }
    } finally {
      await helper.cleanupTest();
    }
  });
}

// Export singleton instance and factory functions
const supertestHelper = new SupertestHelper();

module.exports = {
  SupertestHelper,
  supertestHelper,
  createTestSuite,
  testAuthenticatedEndpoint
};