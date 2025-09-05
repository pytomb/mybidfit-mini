const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/server');

describe('Healthz Endpoint Tests', () => {
  it('should return comprehensive health check information', async () => {
    const response = await request(app)
      .get('/healthz');
    
    // Accept either 200 (healthy) or 503 (unhealthy) - both are valid responses
    assert.ok([200, 503].includes(response.status), 'Should return either 200 or 503 status');

    // Verify response structure
    assert.ok(['healthy', 'unhealthy'].includes(response.body.status), 'Should report either healthy or unhealthy status');
    assert.ok(response.body.timestamp, 'Should have timestamp');
    assert.ok(typeof response.body.uptime === 'number', 'Should have uptime');
    assert.ok(response.body.version, 'Should have version');
    assert.ok(response.body.environment, 'Should have environment');
    assert.ok(response.body.checks, 'Should have health checks object');

    // Verify health checks structure
    const checks = response.body.checks;
    assert.ok('database' in checks, 'Should check database');
    assert.ok('memory' in checks, 'Should check memory');
    assert.ok('dependencies' in checks, 'Should check dependencies');
    assert.ok('memoryUsage' in checks, 'Should include memory usage stats');

    // Verify memory usage structure
    const memUsage = checks.memoryUsage;
    assert.ok(typeof memUsage.rss === 'number', 'Should have RSS memory');
    assert.ok(typeof memUsage.heapTotal === 'number', 'Should have heap total');
    assert.ok(typeof memUsage.heapUsed === 'number', 'Should have heap used');
    assert.ok(typeof memUsage.external === 'number', 'Should have external memory');

    console.log('✅ Healthz endpoint test passed');
    console.log(`💚 Status: ${response.body.status}`);
    console.log(`🗄️ Database: ${checks.database}`);
    console.log(`💾 Memory: ${checks.memory}`);
    console.log(`📊 Heap used: ${memUsage.heapUsed}MB`);
    console.log(`⏱️ Uptime: ${response.body.uptime}s`);
  });

  it('should handle basic /health endpoint as well', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    assert.strictEqual(response.body.status, 'healthy', 'Should report healthy status');
    assert.ok(response.body.timestamp, 'Should have timestamp');
    assert.ok(typeof response.body.uptime === 'number', 'Should have uptime');

    console.log('✅ Basic health endpoint test passed');
  });

  it('should include environment information', async () => {
    const response = await request(app)
      .get('/healthz');
    
    // Accept either 200 (healthy) or 503 (unhealthy) - both are valid responses
    assert.ok([200, 503].includes(response.status), 'Should return either 200 or 503 status');

    assert.ok(response.body.environment, 'Should include environment');
    assert.ok(['development', 'test', 'staging', 'production'].includes(response.body.environment), 
              'Should have valid environment');

    console.log(`✅ Environment test passed: ${response.body.environment}`);
  });
});