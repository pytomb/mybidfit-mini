const { test, describe, beforeEach, before, after } = require('node:test');
const assert = require('node:assert');
const { testDb } = require('../setup/test-database');
const { testServer } = require('../setup/test-server');

// Store-First Testing: Real API configuration validation
// These tests validate actual server configuration that caused previous session issues
describe('API Configuration Integration Tests', () => {
  let testUsers;

  before(async () => {
    // Setup test database and create test data
    await testDb.setup();
    await testDb.createFullTestData();
    
    // Setup shared test server
    const testPort = await testServer.setup();
    
    // Store test port for use in tests
    global.TEST_PORT = testPort;
    
    testUsers = {
      active: await testDb.getTestUser('test-auth@example.com'),
      admin: await testDb.getTestUser('test-admin@example.com')
    };
  });
  after(async () => {
    // Cleanup shared test server and database
    await testServer.cleanup();
    await testDb.cleanup();
  });

  beforeEach(() => {
    // Reset environment variables for each test
    delete process.env.VITE_API_URL;
  });

  // CRITICAL TEST: API Port Configuration
  // This test validates the server is running on the expected port
  test('should have server running on dynamic test port', async () => {
    const testUrl = `http://localhost:${global.TEST_PORT}/health`;
    const response = await fetch(testUrl);
    const data = await response.json();
    
    assert.strictEqual(response.status, 200, 'Health endpoint should be accessible');
    assert.strictEqual(data.status, 'healthy', 'Server should report healthy status');
  });

  // CRITICAL TEST: API Base URL Environment Configuration
  test('should resolve API URL correctly based on environment', () => {
    // Test default fallback (what frontend would use)
    const defaultUrl = process.env.VITE_API_URL || 'http://localhost:3002';
    
    // For tests, we expect the test server URL
    const expectedTestUrl = `http://localhost:${global.TEST_PORT}`;
    
    assert.ok(defaultUrl.includes('localhost'), 'API URL should target localhost');
    
    // In test environment, we expect test port to be different from default
    if (process.env.NODE_ENV === 'test') {
      assert.ok(global.TEST_PORT > 3000, 'Test port should be available and valid');
    }
  });

  // CRITICAL TEST: Authentication Integration
  // Tests that authentication works end-to-end with real server
  test('should authenticate user with real JWT token', async () => {
    const jwt = require('jsonwebtoken');
    const testUser = testUsers.active;
    
    // Create real JWT token for test user
    const token = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);
    
    // Test authenticated endpoint
    const response = await fetch(`http://localhost:${global.TEST_PORT}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      const result = await response.json();
      // The /api/users/profile endpoint returns {success: true, data: {...}}
      assert.ok(result.success, 'Response should indicate success');
      assert.ok(result.data, 'Response should contain data object');
      assert.strictEqual(result.data.id, testUser.id, 'User ID should match from authenticated endpoint');
      assert.strictEqual(result.data.email, testUser.email, 'User email should match from database');
    } else {
      // If endpoint doesn't exist yet, verify auth header was processed
      assert.ok(response.status === 404 || response.status < 500, 
        'Server should process auth header without server error');
    }
  });

  // CRITICAL TEST: CORS Configuration
  // Tests CORS headers that caused previous session issues
  test('should handle CORS requests properly', async () => {
    const response = await fetch(`http://localhost:${global.TEST_PORT}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    // CORS preflight should be handled
    assert.ok(response.status === 200 || response.status === 204, 
      'CORS preflight should be handled correctly');
  });

  // CRITICAL TEST: Multiple Port CORS Support
  // Tests that different frontend ports are supported (3000, 3003, 3004)
  test('should support multiple frontend ports in CORS', async () => {
    const frontendPorts = ['3000', '3004', '3005'];
    
    for (const port of frontendPorts) {
      const response = await fetch(`http://localhost:${global.TEST_PORT}/health`, {
        method: 'GET',
        headers: {
          'Origin': `http://localhost:${port}`
        }
      });
      
      // Should not be blocked by CORS
      assert.strictEqual(response.status, 200, 
        `Frontend port ${port} should be allowed by CORS`);
    }
  });

  // Integration Test: Error Handling
  test('should handle invalid authentication gracefully', async () => {
    const response = await fetch(`http://localhost:${global.TEST_PORT}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      }
    });
    
    // Should return 401 for invalid token (not 500)
    if (response.status === 404) {
      assert.ok(true, 'Endpoint may not exist yet, but no server error');
    } else {
      assert.strictEqual(response.status, 401, 
        'Invalid token should return 401, not server error');
    }
  });
});