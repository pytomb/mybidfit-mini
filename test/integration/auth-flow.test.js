const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { Database } = require('../../src/database/connection');

// Integration Testing: Full authentication flow validation
describe('Authentication Flow Integration Tests', () => {
  let server, baseUrl, db;
  let testUser = {
    email: 'integration-test@example.com',
    password: 'testpass123',
    firstName: 'Integration',
    lastName: 'Test',
    companyName: 'Test Company'
  };

  before(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-integration-secret';
    process.env.PORT = '3005';
    
    // Initialize database
    db = Database.getInstance();
    await db.connect();
    
    // Start test server
    const app = require('../../src/server.js');
    server = app.listen(3005);
    baseUrl = 'http://localhost:3005';
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  after(async () => {
    if (server) {
      server.close();
    }
    if (db) {
      // Cleanup test user
      try {
        await db.query('DELETE FROM users WHERE email = $1', [testUser.email]);
      } catch (e) {
        // Ignore cleanup errors
      }
      await db.disconnect();
    }
  });

  beforeEach(async () => {
    // Ensure clean state for each test
    try {
      await db.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    } catch (e) {
      // Ignore if user doesn't exist
    }
  });

  // CRITICAL TEST: Full registration → login → protected resource flow
  test('should complete full authentication workflow', async () => {
    // Step 1: User Registration
    const registerResponse = await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser);
    
    assert.strictEqual(registerResponse.statusCode, 201, 'Registration should succeed');
    assert.ok(registerResponse.body.message, 'Registration response should include message');
    assert.ok(registerResponse.body.user && registerResponse.body.user.id, 'Registration should return user with ID');

    // Step 2: User Login
    const loginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    assert.strictEqual(loginResponse.statusCode, 200, 'Login should succeed');
    assert.ok(loginResponse.body.token, 'Login should return JWT token');
    assert.ok(loginResponse.body.user, 'Login should return user data');

    // Step 3: Access Protected Resource (Profile)
    const token = loginResponse.body.token;
    const profileResponse = await makeRequest('GET', `${baseUrl}/api/users/profile`, null, {
      'Authorization': `Bearer ${token}`
    });

    assert.strictEqual(profileResponse.statusCode, 200, 'Profile access should succeed with valid token');
    assert.ok(profileResponse.body.success, 'Profile response should indicate success');
    assert.strictEqual(profileResponse.body.data.email, testUser.email, 'Profile should return correct user email');

    // CRITICAL VALIDATION: Verify user properties match auth middleware expectations
    // This would have caught the userId vs id property mismatch
    const userId = loginResponse.body.user.id;
    assert.ok(userId, 'Login response should include user.id (not userId)');
    assert.strictEqual(profileResponse.body.data.id, userId, 'Profile should return user with matching ID');
  });

  // CORS Integration Test - Would have caught our CORS issues
  test('should handle CORS preflight requests correctly', async () => {
    const corsOrigins = [
      'http://localhost:3000',
      'http://localhost:3003',
      'http://localhost:3004'
    ];

    for (const origin of corsOrigins) {
      const response = await makeRequest('OPTIONS', `${baseUrl}/api/auth/login`, null, {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      });

      assert.ok(response.statusCode < 400, `CORS preflight should succeed for origin ${origin}`);
      assert.ok(response.headers['access-control-allow-origin'], `Should include CORS allow-origin header for ${origin}`);
    }
  });

  // Token Validation Integration Test
  test('should validate JWT tokens correctly in middleware', async () => {
    // First, create and login user to get valid token
    await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser);
    const loginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    const validToken = loginResponse.body.token;

    // Test valid token
    const validResponse = await makeRequest('GET', `${baseUrl}/api/users/profile`, null, {
      'Authorization': `Bearer ${validToken}`
    });
    assert.strictEqual(validResponse.statusCode, 200, 'Valid token should allow access');

    // Test invalid token
    const invalidResponse = await makeRequest('GET', `${baseUrl}/api/users/profile`, null, {
      'Authorization': 'Bearer invalid-token'
    });
    assert.strictEqual(invalidResponse.statusCode, 401, 'Invalid token should be rejected');

    // Test missing token
    const noTokenResponse = await makeRequest('GET', `${baseUrl}/api/users/profile`);
    assert.strictEqual(noTokenResponse.statusCode, 401, 'Missing token should be rejected');

    // Test malformed authorization header
    const malformedResponse = await makeRequest('GET', `${baseUrl}/api/users/profile`, null, {
      'Authorization': 'InvalidFormat token'
    });
    assert.strictEqual(malformedResponse.statusCode, 401, 'Malformed auth header should be rejected');
  });

  // Database Integration Test - Property consistency
  test('should maintain consistent user properties across database and middleware', async () => {
    // Register user
    await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser);
    
    // Login to get token
    const loginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    // Get user directly from database
    const dbUser = await db.query('SELECT * FROM users WHERE email = $1', [testUser.email]);
    const userRecord = dbUser.rows[0];

    // Access profile through middleware
    const profileResponse = await makeRequest('GET', `${baseUrl}/api/users/profile`, null, {
      'Authorization': `Bearer ${loginResponse.body.token}`
    });

    // CRITICAL: Verify property mapping consistency
    assert.strictEqual(profileResponse.body.data.id, userRecord.id, 'Profile ID should match database ID');
    assert.strictEqual(profileResponse.body.data.email, userRecord.email, 'Profile email should match database email');
    
    // Verify the JWT token contains the correct user identifier
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(loginResponse.body.token, process.env.JWT_SECRET);
    assert.strictEqual(decoded.userId, userRecord.id, 'JWT should contain userId matching database ID');
  });

  // Companies API Integration Test
  test('should access companies data with valid authentication', async () => {
    // Setup user
    await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser);
    const loginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    // Access companies endpoint
    const companiesResponse = await makeRequest('GET', `${baseUrl}/api/users/companies`, null, {
      'Authorization': `Bearer ${loginResponse.body.token}`
    });

    assert.strictEqual(companiesResponse.statusCode, 200, 'Companies endpoint should be accessible with valid token');
    assert.ok(companiesResponse.body.success, 'Companies response should indicate success');
    assert.ok(Array.isArray(companiesResponse.body.data.companies), 'Companies should return array of companies');
  });

  // Opportunities API Integration Test  
  test('should access opportunities data for specific company', async () => {
    // Setup user
    await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser);
    const loginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    // Test opportunities endpoint (using company ID from sample data)
    const opportunitiesResponse = await makeRequest('GET', `${baseUrl}/api/opportunities/for-company/2`, null, {
      'Authorization': `Bearer ${loginResponse.body.token}`
    });

    assert.strictEqual(opportunitiesResponse.statusCode, 200, 'Opportunities endpoint should be accessible');
    assert.ok(opportunitiesResponse.body.success, 'Opportunities response should indicate success');
  });

  // Time-Categorized Test: Integration (2-10s) - Full workflow validation
  test('[INTEGRATION] should handle complete user lifecycle with proper error handling', async () => {
    // Test duplicate registration
    await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser);
    const duplicateResponse = await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser);
    assert.ok(duplicateResponse.statusCode >= 400, 'Duplicate registration should fail');

    // Test login with wrong password
    const wrongPasswordResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: 'wrongpassword'
    });
    assert.strictEqual(wrongPasswordResponse.statusCode, 401, 'Wrong password should be rejected');

    // Test login with correct credentials
    const correctLoginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    assert.strictEqual(correctLoginResponse.statusCode, 200, 'Correct login should succeed');

    // Test token expiration (if applicable)
    // Note: This would require a short-lived token for testing
  });
});

// Helper function for HTTP requests
function makeRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const responseData = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}