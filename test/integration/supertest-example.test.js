const { test } = require('node:test');
const assert = require('node:assert');
const { createTestSuite, testAuthenticatedEndpoint } = require('../helpers/supertest-helper');

/**
 * Example Supertest Tests Using Helper Utilities
 * 
 * This file demonstrates how to use the supertest helper to write
 * clean, maintainable API tests with minimal boilerplate.
 */

// Example 1: Using createTestSuite for comprehensive test setup
createTestSuite('API Routes with Supertest Helper', (helper) => {
  
  test('should authenticate and fetch user profile', async () => {
    // Helper handles authentication automatically
    const response = await helper.testSuccessfulRequest('GET', '/api/profiles/me', {}, {
      requireAuth: true
    });

    // Profile might not exist, so accept both 200 and 404
    assert.ok([200, 404].includes(response.status));
  });

  test('should validate opportunity search parameters', async () => {
    // Test validation error with helpful helper method
    const response = await helper.testValidationError('GET', '/api/opportunities', {
      naicsCode: 'invalid', // Should trigger validation error
      minAmount: 'not-a-number'
    }, {
      requireAuth: true
    });

    // Helper automatically asserts error structure
    assert.ok(response.body.errors.some(err => 
      err.path.includes('naicsCode') || err.message.includes('naics')
    ));
  });

  test('should test rate limiting on login endpoint', async () => {
    const invalidCredentials = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    };

    const responses = await helper.testRateLimit('/api/auth/login', invalidCredentials, 6);
    
    // Should have some rate limited responses (429)
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    assert.ok(rateLimitedCount > 0, 'Expected some requests to be rate limited');
  });

  test('should create company profile with proper validation', async () => {
    const profileData = {
      name: 'Helper Test Company',
      summary: 'Testing with supertest helper',
      naics: ['541511'],
      businessType: 'LLC',
      capabilities: ['Testing', 'API Development']
    };

    const response = await helper.testSuccessfulRequest('POST', '/api/profiles', profileData, {
      requireAuth: true,
      expectedStatus: 201
    });

    assert.strictEqual(response.body.profile.name, profileData.name);
  });
});

// Example 2: Using testAuthenticatedEndpoint for quick tests
testAuthenticatedEndpoint(
  'should fetch opportunities with authentication', 
  'GET', 
  '/api/opportunities',
  { limit: 5 }, // query parameters
  { 
    hasProperty: 'opportunities',
    equals: { success: true }
  }
);

testAuthenticatedEndpoint(
  'should get specific opportunity by ID',
  'GET',
  '/api/opportunities/test-123',
  {},
  {
    hasProperty: 'opportunityId',
    equals: { success: true }
  }
);

// Example 3: Manual helper usage for complex scenarios
createTestSuite('Complex Authentication Scenarios', (helper) => {
  
  test('should handle multiple user authentication', async () => {
    // Test with different users if available
    const adminRequest = await helper.authenticatedRequest('test-admin@example.com');
    const userRequest = await helper.authenticatedRequest('test-auth@example.com');

    // Both should be able to access their own profiles
    const adminResponse = await adminRequest.get('/api/profiles/me');
    const userResponse = await userRequest.get('/api/profiles/me');

    // Both should succeed (200) or profile not exist (404)
    assert.ok([200, 404].includes(adminResponse.status));
    assert.ok([200, 404].includes(userResponse.status));
  });

  test('should reject unauthenticated requests properly', async () => {
    const unauthenticatedRequest = await helper.unauthenticatedRequest();
    
    // Test multiple protected endpoints
    const protectedEndpoints = [
      '/api/profiles/me',
      '/api/opportunities',
      '/api/profiles'
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await unauthenticatedRequest.get(endpoint);
      assert.strictEqual(response.status, 401, `Expected 401 for ${endpoint}`);
      assert.ok(response.body.error, `Expected error message for ${endpoint}`);
    }
  });
});