const { fetch } = require('undici'); // Node.js 18+ built-in fetch alternative

/**
 * ApiTestClient - HTTP client for real API integration testing
 * Handles authentication, request/response cycles, and common test scenarios
 */
class ApiTestClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.authToken = null;
    this.userId = null;
    this.userEmail = null;
  }

  /**
   * Login with test credentials and store JWT token
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login response data
   */
  async login(email, password) {
    try {
      const response = await this.request('POST', '/api/auth/login', {
        email,
        password
      });

      if (response.token) {
        this.authToken = response.token;
        this.userId = response.user?.id;
        this.userEmail = response.user?.email;
        console.log(`✅ Logged in as ${email} (ID: ${this.userId})`);
      } else {
        console.error('❌ Login failed - no token received');
      }

      return response;
    } catch (error) {
      console.error(`❌ Login failed for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Login with default test user credentials
   */
  async loginAsTestUser() {
    return this.login('test-auth@example.com', 'testpass123');
  }

  /**
   * Login with admin test user credentials
   */
  async loginAsAdmin() {
    return this.login('test-admin@example.com', 'testpass123');
  }

  /**
   * Logout and clear authentication
   */
  logout() {
    this.authToken = null;
    this.userId = null;
    this.userEmail = null;
  }

  /**
   * Make authenticated HTTP request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint (relative to base URL)
   * @param {Object} data - Request body data
   * @param {Object} options - Additional options (headers, etc.)
   * @returns {Promise<Object>} Response data
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add authentication if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const fetchOptions = {
      method,
      headers
    };

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }

    try {
      console.log(`🌐 ${method} ${endpoint}${this.authToken ? ' (authenticated)' : ''}`);
      const response = await fetch(url, fetchOptions);
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = { text: await response.text() };
      }

      // Add response metadata
      responseData._status = response.status;
      responseData._statusText = response.statusText;
      responseData._ok = response.ok;

      if (!response.ok) {
        console.error(`❌ ${method} ${endpoint} failed:`, response.status, responseData);
      }

      return responseData;
    } catch (error) {
      console.error(`❌ Request failed: ${method} ${endpoint}`, error.message);
      throw error;
    }
  }

  /**
   * Make GET request
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  /**
   * Make POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * Make PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  /**
   * Make DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  /**
   * Track analytics event (convenience method)
   */
  async trackEvent(event, properties = {}) {
    return this.post('/api/analytics/track', {
      event,
      properties
    });
  }

  /**
   * Get conversion funnel data (admin endpoint)
   */
  async getConversionFunnel(days = 30) {
    return this.get(`/api/analytics/conversion-funnel?days=${days}`);
  }

  /**
   * Test authentication by accessing protected endpoint
   */
  async testAuth() {
    try {
      const response = await this.get('/api/auth/me');
      return response._ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user info
   */
  getUserInfo() {
    return {
      id: this.userId,
      email: this.userEmail,
      isAuthenticated: !!this.authToken,
      token: this.authToken
    };
  }

  /**
   * Create test supplier data
   */
  async createTestSupplier(supplierData = {}) {
    const defaultSupplier = {
      name: `Test Supplier ${Date.now()}`,
      email: `supplier${Date.now()}@test.com`,
      capabilities: ['Web Development', 'API Integration'],
      location: 'Test City',
      ...supplierData
    };

    return this.post('/api/suppliers', defaultSupplier);
  }

  /**
   * Run supplier analysis
   */
  async runSupplierAnalysis(supplierId, analysisType = 'full') {
    return this.post('/api/analysis/supplier', {
      supplierId,
      analysisType
    });
  }

  /**
   * Get analysis results
   */
  async getAnalysisResults(analysisId) {
    return this.get(`/api/analysis/${analysisId}`);
  }
}

/**
 * Test helper functions for common assertions
 */
class ApiTestHelpers {
  /**
   * Assert successful API response
   */
  static assertSuccess(response, message = 'API request should succeed') {
    if (!response._ok) {
      throw new Error(`${message}: ${response._status} ${response._statusText} - ${JSON.stringify(response)}`);
    }
    return response;
  }

  /**
   * Assert API response has specific status
   */
  static assertStatus(response, expectedStatus, message) {
    if (response._status !== expectedStatus) {
      throw new Error(`${message}: Expected ${expectedStatus}, got ${response._status} - ${JSON.stringify(response)}`);
    }
    return response;
  }

  /**
   * Assert API response contains required fields
   */
  static assertFields(response, fields, message = 'Response should contain required fields') {
    const missing = fields.filter(field => !(field in response));
    if (missing.length > 0) {
      throw new Error(`${message}: Missing fields [${missing.join(', ')}] in response: ${JSON.stringify(response)}`);
    }
    return response;
  }

  /**
   * Wait for a condition to be true (useful for async operations)
   */
  static async waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }
}

module.exports = { ApiTestClient, ApiTestHelpers };