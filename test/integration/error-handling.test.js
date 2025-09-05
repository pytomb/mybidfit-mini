const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/server');

describe('Central Error Handling Tests', () => {
  it('should handle 404 errors with proper structure', async () => {
    const response = await request(app)
      .get('/api/nonexistent-endpoint')
      .expect(404);

    // Verify error response structure
    assert.strictEqual(response.body.success, false, 'Should indicate failure');
    assert.ok(response.body.error, 'Should contain error object');
    
    const error = response.body.error;
    assert.ok(error.message.includes('Route GET /api/nonexistent-endpoint'), 'Should include route info');
    assert.strictEqual(error.code, 'NOT_FOUND', 'Should have correct error code');
    assert.strictEqual(error.status, 404, 'Should have correct status');
    assert.ok(error.correlationId, 'Should have correlation ID');
    assert.ok(error.timestamp, 'Should have timestamp');
    assert.strictEqual(error.path, '/api/nonexistent-endpoint', 'Should have correct path');
    assert.strictEqual(error.method, 'GET', 'Should have correct method');

    console.log('✅ 404 error handling test passed');
    console.log(`📊 Correlation ID: ${error.correlationId}`);
  });

  it('should handle authentication errors with proper structure', async () => {
    const response = await request(app)
      .get('/api/profiles')
      .expect(401);

    // Verify authentication error structure
    assert.strictEqual(response.body.success, false, 'Should indicate failure');
    assert.ok(response.body.error, 'Should contain error object');
    
    const error = response.body.error;
    assert.ok(error.message.includes('token'), 'Should indicate token issue');
    assert.strictEqual(error.status, 401, 'Should have correct status');
    assert.ok(error.correlationId, 'Should have correlation ID');
    assert.ok(error.timestamp, 'Should have timestamp');

    console.log('✅ Authentication error handling test passed');
  });

  it('should include correlation ID in response headers', async () => {
    const response = await request(app)
      .get('/api/nonexistent-endpoint')
      .expect(404);

    // Verify correlation ID is in both response body and headers
    const headerCorrelationId = response.headers['x-correlation-id'];
    const bodyCorrelationId = response.body.error.correlationId;
    
    assert.ok(headerCorrelationId, 'Should have correlation ID in headers');
    assert.strictEqual(headerCorrelationId, bodyCorrelationId, 'Header and body correlation IDs should match');

    console.log('✅ Correlation ID header test passed');
    console.log(`🔗 Correlation ID: ${headerCorrelationId}`);
  });

  it('should handle validation errors properly', async () => {
    // Test invalid JSON payload
    const response = await request(app)
      .post('/api/profiles')
      .set('Content-Type', 'application/json')
      .send('invalid json')
      .expect(400);

    assert.strictEqual(response.body.success, false, 'Should indicate failure');
    assert.ok(response.body.error, 'Should contain error object');
    assert.ok(response.body.error.correlationId, 'Should have correlation ID');

    console.log('✅ Validation error handling test passed');
  });

  it('should include stack trace in development mode', async () => {
    // Only test if not in production
    if (process.env.NODE_ENV !== 'production') {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      const error = response.body.error;
      // Stack trace should be present in non-production environments
      assert.ok(error.stack, 'Should include stack trace in development');
      console.log('✅ Development stack trace test passed');
    } else {
      console.log('⏭️ Skipping stack trace test in production mode');
    }
  });

  it('should handle health check endpoint correctly', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    assert.strictEqual(response.body.status, 'healthy', 'Should return healthy status');
    assert.ok(response.body.timestamp, 'Should have timestamp');
    assert.ok(typeof response.body.uptime === 'number', 'Should have uptime');

    console.log('✅ Health check test passed');
    console.log(`💚 Server uptime: ${response.body.uptime}s`);
  });
});