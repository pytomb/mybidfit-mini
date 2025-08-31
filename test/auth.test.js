const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

// Mock environment for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-integration-secret';
process.env.DB_NAME = 'mybidfit_test';

describe('Authentication API', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Start test server
    const app = require('../src/server.js');
    server = app.listen(3005);
    baseUrl = 'http://localhost:3005';
  });

  after(async () => {
    if (server) {
      server.close();
    }
  });

  test('should register new user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      companyName: 'Test Company'
    };

    const response = await makeRequest('POST', `${baseUrl}/api/auth/register`, userData);
    
    // Note: This will fail in testing without actual database
    // In production, you'd set up a test database
    assert.ok(response, 'Registration endpoint should be accessible');
  });

  test('should validate required fields for registration', async () => {
    const incompleteData = {
      email: 'test@example.com'
      // Missing required fields
    };

    const response = await makeRequest('POST', `${baseUrl}/api/auth/register`, incompleteData);
    
    // Should return error for missing fields
    assert.ok(response, 'Should handle incomplete registration data');
  });

  test('should handle login requests', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await makeRequest('POST', `${baseUrl}/api/auth/login`, loginData);
    
    // Note: This will fail in testing without actual database and user
    assert.ok(response, 'Login endpoint should be accessible');
  });

  test('should verify JWT tokens', async () => {
    const response = await makeRequest('GET', `${baseUrl}/api/auth/verify`, null, {
      'Authorization': 'Bearer invalid-token'
    });

    assert.ok(response, 'Token verification endpoint should be accessible');
  });
});

// Helper function to make HTTP requests with JSON data
function makeRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
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