const { test, describe } = require('node:test');
const assert = require('node:assert');
const http = require('http');

// Mock the database for testing
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'mybidfit_test';

describe('Server API', () => {
  test('should respond to health check', async () => {
    const app = require('../src/server.js');
    
    // Start server on test port
    const server = app.listen(3002);
    
    try {
      const response = await makeRequest('GET', 'http://localhost:3002/health');
      const data = JSON.parse(response.body);
      
      assert.strictEqual(response.statusCode, 200, 'Health check should return 200');
      assert.strictEqual(data.status, 'healthy', 'Health check should return healthy status');
      assert.ok(data.timestamp, 'Health check should include timestamp');
      assert.ok(typeof data.uptime === 'number', 'Health check should include uptime');
    } finally {
      server.close();
    }
  });

  test('should handle 404 for unknown routes', async () => {
    const app = require('../src/server.js');
    const server = app.listen(3003);
    
    try {
      const response = await makeRequest('GET', 'http://localhost:3003/nonexistent');
      const data = JSON.parse(response.body);
      
      assert.strictEqual(response.statusCode, 404, 'Unknown route should return 404');
      assert.strictEqual(data.error.message, 'Endpoint not found', '404 should have correct message');
    } finally {
      server.close();
    }
  });

  test('should have CORS headers', async () => {
    const app = require('../src/server.js');
    const server = app.listen(3004);
    
    try {
      const response = await makeRequest('OPTIONS', 'http://localhost:3004/health');
      
      assert.ok(
        response.headers['access-control-allow-origin'], 
        'Should include CORS allow-origin header'
      );
    } finally {
      server.close();
    }
  });
});

// Helper function to make HTTP requests
function makeRequest(method, url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}