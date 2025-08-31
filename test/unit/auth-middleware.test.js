const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const { testDb } = require('../setup/test-database');
const { authenticateToken } = require('../../src/middleware/auth');

// Store-First Testing: Start with auth middleware business logic using REAL database
describe('Auth Middleware Unit Tests (Real Database)', () => {
  let mockReq, mockRes, mockNext;
  let testUsers;

  before(async () => {
    // Setup test database and create test data
    await testDb.setup();
    await testDb.createFullTestData();
    
    // Get test users for reference in tests
    testUsers = {
      active: await testDb.getTestUser('test-auth@example.com'),
      admin: await testDb.getTestUser('test-admin@example.com'),
      inactive: await testDb.getTestUser('test-inactive@example.com')
    };

    // Set test environment
    process.env.JWT_SECRET = 'test-secret-key-for-real-auth';
  });

  after(async () => {
    // Cleanup test database
    await testDb.cleanup();
  });

  beforeEach(() => {
    // Reset request/response objects for each test
    mockReq = {
      headers: {},
      user: null
    };

    mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.jsonData = data;
        return this;
      },
      statusCode: null,
      jsonData: null
    };

    mockNext = {
      called: false,
      call: function() {
        this.called = true;
      }
    };
  });

  // CRITICAL TEST: Property mapping consistency with REAL database
  // This test would have caught the userId vs id mismatch from previous session
  test('should set correct user properties on req.user with real database', async () => {
    const testUser = testUsers.active;
    
    // Create valid JWT token with the REAL user ID from database
    const token = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);
    mockReq.headers.authorization = `Bearer ${token}`;

    // Call the REAL auth middleware with REAL database
    await authenticateToken(mockReq, mockRes, () => mockNext.call());

    // CRITICAL: Verify the exact property names that caused our session issue
    assert.ok(mockReq.user, 'req.user should be set');
    assert.strictEqual(mockReq.user.id, testUser.id, 'req.user.id should be set correctly (NOT userId)');
    assert.strictEqual(mockReq.user.email, testUser.email, 'req.user.email should match database');
    assert.strictEqual(mockReq.user.firstName, testUser.first_name, 'req.user.firstName should be mapped from first_name');
    assert.strictEqual(mockReq.user.lastName, testUser.last_name, 'req.user.lastName should be mapped from last_name');
    assert.strictEqual(mockReq.user.companyName, testUser.company_name, 'req.user.companyName should be mapped from company_name');
    assert.strictEqual(mockReq.user.role, testUser.role, 'req.user.role should match database');

    // CRITICAL: Ensure userId is NOT set (this was the bug that caused previous issues)
    assert.strictEqual(mockReq.user.userId, undefined, 'req.user.userId should NOT exist - this caused the bug!');
    
    assert.strictEqual(mockNext.called, true, 'next() should be called once');
    assert.strictEqual(mockRes.statusCode, null, 'res.status should not be called on success');
  });

  // Test JWT token validation with real database
  test('should reject invalid JWT tokens', async () => {
    mockReq.headers.authorization = 'Bearer invalid-token';

    await authenticateToken(mockReq, mockRes, () => mockNext.call());

    assert.strictEqual(mockRes.statusCode, 401, 'Should return 401 for invalid token');
    assert.ok(mockRes.jsonData.error.includes('Invalid'), 'Should return invalid token error');
    assert.strictEqual(mockNext.called, false, 'next() should not be called on auth failure');
  });

  // Test missing authorization header
  test('should reject missing authorization header', async () => {
    // No authorization header set

    await authenticateToken(mockReq, mockRes, () => mockNext.call());

    assert.strictEqual(mockRes.statusCode, 401, 'Should return 401 for missing token');
    assert.ok(mockRes.jsonData.error.includes('required'), 'Should return token required error');
    assert.strictEqual(mockNext.called, false, 'next() should not be called on auth failure');
  });

  // Test malformed authorization header
  test('should reject malformed authorization header', async () => {
    mockReq.headers.authorization = 'InvalidFormat token';

    await authenticateToken(mockReq, mockRes, () => mockNext.call());

    assert.strictEqual(mockRes.statusCode, 401, 'Should return 401 for malformed header');
    assert.strictEqual(mockNext.called, false, 'next() should not be called on auth failure');
  });

  // Test user not found in database (using non-existent ID)
  test('should reject when user not found in database', async () => {
    const token = jwt.sign({ userId: 999999 }, process.env.JWT_SECRET); // Non-existent ID
    mockReq.headers.authorization = `Bearer ${token}`;

    await authenticateToken(mockReq, mockRes, () => mockNext.call());

    assert.strictEqual(mockRes.statusCode, 401, 'Should return 401 for user not found');
    assert.ok(mockRes.jsonData.error.includes('not found'), 'Should return user not found error');
    assert.strictEqual(mockNext.called, false, 'next() should not be called on auth failure');
  });

  // Test inactive user account using REAL inactive test user
  test('should reject inactive user accounts with real database', async () => {
    const inactiveUser = testUsers.inactive;
    const token = jwt.sign({ userId: inactiveUser.id }, process.env.JWT_SECRET);
    mockReq.headers.authorization = `Bearer ${token}`;

    await authenticateToken(mockReq, mockRes, () => mockNext.call());

    assert.strictEqual(mockRes.statusCode, 401, 'Should return 401 for inactive user');
    assert.ok(mockRes.jsonData.error.includes('disabled'), 'Should return account disabled error');
    assert.strictEqual(mockNext.called, false, 'next() should not be called on auth failure');
  });

  // Test expired JWT token
  test('should reject expired JWT tokens', async () => {
    const expiredToken = jwt.sign(
      { userId: testUsers.active.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '-1h' }  // Already expired
    );
    mockReq.headers.authorization = `Bearer ${expiredToken}`;

    await authenticateToken(mockReq, mockRes, () => mockNext.call());

    assert.strictEqual(mockRes.statusCode, 401, 'Should return 401 for expired token');
    assert.ok(mockRes.jsonData.error.includes('expired'), 'Should return token expired error');
    assert.strictEqual(mockNext.called, false, 'next() should not be called on auth failure');
  });

  // Test admin user authentication with real database
  test('should authenticate admin user correctly', async () => {
    const adminUser = testUsers.admin;
    const token = jwt.sign({ userId: adminUser.id }, process.env.JWT_SECRET);
    mockReq.headers.authorization = `Bearer ${token}`;

    await authenticateToken(mockReq, mockRes, () => mockNext.call());

    assert.ok(mockReq.user, 'req.user should be set for admin');
    assert.strictEqual(mockReq.user.role, 'admin', 'Admin role should be preserved');
    assert.strictEqual(mockReq.user.id, adminUser.id, 'Admin user ID should be correct');
    assert.strictEqual(mockNext.called, true, 'next() should be called for admin auth');
  });

  // Time-Categorized Test: Instant (0-2s) - Property validation with real data
  test('[INSTANT] should validate all required user properties are present with real database', async () => {
    const testUser = testUsers.active;
    const token = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);
    mockReq.headers.authorization = `Bearer ${token}`;

    await authenticateToken(mockReq, mockRes, () => mockNext.call());

    // Validate complete user object structure from REAL database
    const requiredProperties = ['id', 'email', 'firstName', 'lastName', 'companyName', 'role'];
    requiredProperties.forEach(prop => {
      assert.ok(
        mockReq.user.hasOwnProperty(prop), 
        `req.user should have property: ${prop} (from real database)`
      );
      assert.notStrictEqual(
        mockReq.user[prop], 
        undefined, 
        `req.user.${prop} should not be undefined (real data validation)`
      );
    });
    
    // Extra validation: ensure real database fields match expected structure
    assert.strictEqual(typeof mockReq.user.id, 'number', 'User ID should be number from database');
    assert.ok(mockReq.user.email.includes('@'), 'Email should be valid format from database');
  });
});