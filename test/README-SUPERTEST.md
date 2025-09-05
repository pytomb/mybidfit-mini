# Supertest Testing Infrastructure

This directory contains a comprehensive supertest testing infrastructure for the MyBidFit API. Supertest provides an elegant way to test HTTP endpoints with better readability and maintainability compared to raw HTTP requests.

## Overview

The infrastructure consists of:

- **SupertestHelper Class**: Utility class for common testing patterns
- **Factory Functions**: Quick test creation with automatic setup/cleanup
- **Demo Tests**: Comprehensive examples showing all features
- **Example Tests**: Simple patterns for everyday use

## Files

### Core Infrastructure
- `helpers/supertest-helper.js` - Main helper class and utilities
- `setup/test-server.js` - Existing server setup (enhanced for supertest)
- `setup/test-database.js` - Database setup and test data management

### Example Tests
- `integration/supertest-demo.test.js` - Comprehensive demo of all features
- `integration/supertest-example.test.js` - Simple examples using helpers

## Quick Start

### Basic Test with Helper

```javascript
const { createTestSuite } = require('../helpers/supertest-helper');

createTestSuite('My API Tests', (helper) => {
  test('should test authenticated endpoint', async () => {
    const response = await helper.testSuccessfulRequest('GET', '/api/profiles/me', {}, {
      requireAuth: true
    });
    
    assert.ok([200, 404].includes(response.status));
  });
});
```

### Quick Authenticated Endpoint Test

```javascript
const { testAuthenticatedEndpoint } = require('../helpers/supertest-helper');

testAuthenticatedEndpoint(
  'should fetch opportunities', 
  'GET', 
  '/api/opportunities',
  { limit: 10 },
  { hasProperty: 'opportunities', equals: { success: true } }
);
```

## SupertestHelper Methods

### Authentication
- `authenticatedRequest(userEmail)` - Get supertest request with auth token
- `unauthenticatedRequest()` - Get supertest request without auth
- `clearAuthTokens()` - Clear cached authentication tokens

### Testing Patterns
- `testSuccessfulRequest(method, path, data, options)` - Test successful API calls
- `testValidationError(method, path, data, options)` - Test validation failures
- `testRateLimit(path, data, attempts)` - Test rate limiting

### Setup/Cleanup
- `setupTest()` - Initialize server and database for testing
- `cleanupTest()` - Clean up after tests

## Factory Functions

### createTestSuite(description, callback)
Creates a test suite with automatic setup and cleanup:

```javascript
createTestSuite('User Management', (helper) => {
  test('should create user', async () => {
    // helper is ready to use, no setup needed
  });
  
  // Cleanup happens automatically
});
```

### testAuthenticatedEndpoint(description, method, path, data, expectations)
Quick test for authenticated endpoints:

```javascript
testAuthenticatedEndpoint(
  'should get user profile',
  'GET',
  '/api/profiles/me',
  {},
  { hasProperty: 'profile' }
);
```

## Testing Patterns

### 1. Authentication Testing

```javascript
// Test successful login
const response = await helper.testSuccessfulRequest('POST', '/api/auth/login', {
  email: 'test@example.com',
  password: 'password123!'
});

// Test invalid login
const errorResponse = await helper.testValidationError('POST', '/api/auth/login', {
  email: 'invalid-email',
  password: 'weak'
});
```

### 2. Route Validation Testing

```javascript
// Test valid data
const response = await helper.testSuccessfulRequest('POST', '/api/profiles', {
  name: 'Test Company',
  naics: ['541511'],
  businessType: 'LLC'
}, { requireAuth: true, expectedStatus: 201 });

// Test invalid data
const errorResponse = await helper.testValidationError('POST', '/api/profiles', {
  name: '', // Empty name should fail
  naics: ['invalid'], // Invalid NAICS should fail
}, { requireAuth: true });
```

### 3. Rate Limiting Testing

```javascript
const responses = await helper.testRateLimit('/api/auth/login', {
  email: 'wrong@example.com',
  password: 'wrongpassword'
}, 6);

const rateLimitedCount = responses.filter(r => r.status === 429).length;
assert.ok(rateLimitedCount > 0, 'Should have rate limited responses');
```

### 4. Error Handling Testing

```javascript
// Test 401 for unauthenticated requests
const unauthReq = await helper.unauthenticatedRequest();
const response = await unauthReq.get('/api/profiles/me').expect(401);

// Test 404 for non-existent resources
const authReq = await helper.authenticatedRequest();
const notFoundResponse = await authReq.get('/api/profiles/non-existent-id').expect(404);
```

## Integration with Existing Infrastructure

This supertest infrastructure integrates seamlessly with the existing test setup:

- **TestServer Class**: Uses existing `testServer.getApp()` method
- **Test Database**: Uses existing `testDb` utilities for data management
- **Environment Setup**: Respects existing test environment configuration
- **Logging**: Integrates with existing logger for test output

## Running Tests

```bash
# Run all integration tests (includes supertest tests)
npm run test:integration

# Run specific supertest demo
npx node --test test/integration/supertest-demo.test.js

# Run supertest examples
npx node --test test/integration/supertest-example.test.js

# Run all tests with test data setup
npm test
```

## Best Practices

### 1. Use Helpers for Common Patterns
Instead of writing repetitive supertest code, use the provided helpers:

```javascript
// ❌ Verbose and repetitive
const app = testServer.getApp();
const loginResponse = await request(app).post('/api/auth/login').send({...});
const token = loginResponse.body.token;
const response = await request(app).get('/api/profiles').set('Authorization', `Bearer ${token}`);

// ✅ Clean and maintainable
const response = await helper.testSuccessfulRequest('GET', '/api/profiles', {}, {
  requireAuth: true
});
```

### 2. Test Both Success and Failure Cases
Always test both valid and invalid scenarios:

```javascript
// Test success case
await helper.testSuccessfulRequest('POST', '/api/profiles', validData, { requireAuth: true });

// Test validation failure
await helper.testValidationError('POST', '/api/profiles', invalidData, { requireAuth: true });
```

### 3. Use Factory Functions for Simple Tests
For straightforward endpoint testing, use factory functions:

```javascript
testAuthenticatedEndpoint('should get opportunities', 'GET', '/api/opportunities', {}, {
  hasProperty: 'opportunities'
});
```

### 4. Group Related Tests
Use `createTestSuite` to group related tests with shared setup:

```javascript
createTestSuite('Profile Management', (helper) => {
  test('should create profile', async () => { /* test */ });
  test('should update profile', async () => { /* test */ });
  test('should delete profile', async () => { /* test */ });
});
```

## Advanced Features

### Multiple User Testing
Test with different user roles:

```javascript
const adminRequest = await helper.authenticatedRequest('test-admin@example.com');
const userRequest = await helper.authenticatedRequest('test-auth@example.com');

// Test admin-only endpoints
const adminResponse = await adminRequest.get('/api/admin/users');

// Test regular user endpoints  
const userResponse = await userRequest.get('/api/profiles/me');
```

### Custom Assertions
Add custom assertions for your specific API:

```javascript
function assertSuccessResponse(response, expectedProperties = []) {
  assert.strictEqual(response.body.success, true);
  expectedProperties.forEach(prop => {
    assert.ok(response.body.hasOwnProperty(prop), `Expected property: ${prop}`);
  });
}

const response = await helper.testSuccessfulRequest('GET', '/api/opportunities', {}, {
  requireAuth: true
});
assertSuccessResponse(response, ['opportunities', 'count']);
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**: Ensure test database has proper test users
2. **Server Not Starting**: Check if port is available and environment is set correctly  
3. **Database Connection Issues**: Verify test database configuration
4. **Token Caching Issues**: Use `helper.clearAuthTokens()` between tests if needed

### Debug Mode
Enable detailed logging for debugging:

```javascript
// Set environment variable for detailed logs
process.env.LOG_LEVEL = 'debug';
```

This supertest infrastructure makes API testing much more maintainable and reduces the boilerplate code needed for comprehensive test coverage.