const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { testServer } = require('../setup/test-server');
const { testDb } = require('../setup/test-database');

/**
 * Supertest Integration Test Demo
 * 
 * This test demonstrates proper supertest usage with the existing test infrastructure,
 * including testing the enhanced validation middleware and rate limiting.
 */
describe('Supertest Integration Demo - Enhanced API Testing', () => {
  let app;
  let testUser;
  let authToken;

  before(async () => {
    // Setup test server and get app instance for supertest
    await testServer.setup();
    app = testServer.getApp();
    
    // Setup test database with standardized data
    await testDb.setup();
    await testDb.createFullTestData();
    
    // Get a test user for authenticated requests
    testUser = await testDb.getTestUser('test-auth@example.com');
  });

  after(async () => {
    await testServer.cleanup();
    await testDb.cleanup();
  });

  beforeEach(async () => {
    // Get fresh auth token for each test
    if (testUser) {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123!' // Standard test password
        });
      
      if (loginResponse.status === 200 && loginResponse.body.token) {
        authToken = loginResponse.body.token;
      }
    }
  });

  describe('Authentication Endpoints with Supertest', () => {
    test('should register new user with proper validation', async () => {
      const newUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.token);
      assert.strictEqual(response.body.user.email, newUser.email);
    });

    test('should reject registration with invalid password', async () => {
      const invalidUser = {
        email: `test-invalid-${Date.now()}@example.com`,
        password: 'weak', // Too weak - should fail validation
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.ok(response.body.errors);
      assert.ok(response.body.errors.some(err => err.path.includes('password')));
    });

    test('should login with valid credentials', async () => {
      if (!testUser) {
        throw new Error('Test user not available');
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123!'
        })
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.token);
      assert.strictEqual(response.body.user.email, testUser.email);
    });

    test('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      assert.strictEqual(response.body.success, false);
      assert.ok(response.body.error);
    });
  });

  describe('Opportunity Routes with Enhanced Validation', () => {
    test('should require authentication for opportunities endpoint', async () => {
      const response = await request(app)
        .get('/api/opportunities')
        .expect(401);

      assert.ok(response.body.error);
    });

    test('should fetch opportunities with valid authentication', async () => {
      if (!authToken) {
        throw new Error('Auth token not available');
      }

      const response = await request(app)
        .get('/api/opportunities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.ok(typeof response.body.count === 'number');
      assert.ok(Array.isArray(response.body.opportunities));
    });

    test('should validate query parameters for opportunity search', async () => {
      if (!authToken) {
        throw new Error('Auth token not available');
      }

      // Test with invalid NAICS code format
      const response = await request(app)
        .get('/api/opportunities')
        .query({
          naicsCode: 'invalid-format', // Should be 6 digits
          setAside: 'Total_Small_Business',
          minAmount: 10000
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.ok(response.body.errors);
    });

    test('should accept valid opportunity search parameters', async () => {
      if (!authToken) {
        throw new Error('Auth token not available');
      }

      const response = await request(app)
        .get('/api/opportunities')
        .query({
          naicsCode: '541511',
          setAside: 'Total_Small_Business',
          minAmount: 10000,
          maxAmount: 100000,
          state: 'VA',
          limit: 10
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.searchParams);
      assert.strictEqual(response.body.searchParams.naicsCode, '541511');
    });

    test('should get specific opportunity by ID', async () => {
      if (!authToken) {
        throw new Error('Auth token not available');
      }

      const response = await request(app)
        .get('/api/opportunities/test-opp-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.opportunityId, 'test-opp-123');
    });
  });

  describe('Profile Routes with Enhanced Validation', () => {
    test('should require authentication for profile endpoints', async () => {
      const response = await request(app)
        .get('/api/profiles/me')
        .expect(401);

      assert.ok(response.body.error);
    });

    test('should get current user profile', async () => {
      if (!authToken) {
        throw new Error('Auth token not available');
      }

      const response = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Profile might not exist yet, so either 404 or 200 is acceptable
      if (response.status === 200) {
        assert.ok(response.body.profile);
      }
    });

    test('should create company profile with valid data', async () => {
      if (!authToken) {
        throw new Error('Auth token not available');
      }

      const profileData = {
        name: 'Test Company Profile',
        summary: 'A test company for integration testing',
        naics: ['541511', '541512'],
        businessType: 'LLC',
        employeeCount: 25,
        annualRevenue: 1000000,
        capabilities: ['Software Development', 'Web Design'],
        certifications: ['8(a)', 'SDVOSB'],
        website: 'https://testcompany.com',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'VA',
          zipCode: '12345'
        },
        serviceAreas: ['Virginia', 'Maryland', 'Washington DC']
      };

      const response = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(201);

      assert.strictEqual(response.body.message, 'Company profile created successfully');
      assert.ok(response.body.profile);
      assert.strictEqual(response.body.profile.name, profileData.name);
    });
  });

  describe('Rate Limiting with Supertest', () => {
    test('should demonstrate rate limiting on auth endpoints', async () => {
      const invalidCredentials = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send(invalidCredentials)
        );
      }

      const responses = await Promise.all(promises);
      
      // First 5 should be 401 (unauthorized), 6th should be 429 (rate limited)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      assert.ok(rateLimitedResponses.length > 0, 'Rate limiting should trigger after multiple failures');
    });
  });

  describe('Error Handling with Supertest', () => {
    test('should return proper error structure for validation failures', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email', // Invalid email format
          password: 'weak', // Weak password
          // Missing required fields
        })
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.ok(Array.isArray(response.body.errors));
      assert.ok(response.body.errors.length > 0);
    });

    test('should handle server errors gracefully', async () => {
      if (!authToken) {
        throw new Error('Auth token not available');
      }

      // Test with invalid profile ID format to trigger error handling
      const response = await request(app)
        .get('/api/profiles/invalid-uuid-format')
        .set('Authorization', `Bearer ${authToken}`);

      // Should handle the error gracefully, not crash
      assert.ok([404, 400, 500].includes(response.status));
      assert.ok(response.body.error);
    });
  });
});