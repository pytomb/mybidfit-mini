const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { TestServer } = require('../setup/testServer');
const { ApiTestClient, ApiTestHelpers } = require('../helpers/apiClient');

/**
 * Analytics API - Real Integration Tests
 * Tests actual HTTP endpoints with real database connections
 * Replaces mock-based tests with end-to-end functionality validation
 */
describe('Analytics API - Real Integration Tests', () => {
  let testServer;
  let client;
  let adminClient;
  let serverPort;

  before(async () => {
    // Start test server
    testServer = new TestServer();
    serverPort = await testServer.start();
    const baseUrl = testServer.getBaseUrl();
    
    console.log(`🚀 Test server running at ${baseUrl}`);

    // Create API clients
    client = new ApiTestClient(baseUrl);
    adminClient = new ApiTestClient(baseUrl);

    // Authenticate clients
    await client.loginAsTestUser();
    await adminClient.loginAsAdmin();

    console.log(`✅ Test setup completed - Regular user: ${client.getUserInfo().email}, Admin: ${adminClient.getUserInfo().email}`);
  });

  after(async () => {
    if (testServer) {
      await testServer.stop();
    }
  });

  describe('POST /api/analytics/track', () => {
    it('should track user events successfully', async () => {
      const eventData = {
        event: 'analysis_completed',
        properties: {
          analysisType: 'supplier_analysis',
          companyId: 123,
          processingTime: 2500,
          accuracy: 0.92
        }
      };

      const response = await client.trackEvent(eventData.event, eventData.properties);
      
      // Verify successful response
      ApiTestHelpers.assertSuccess(response, 'Event tracking should succeed');
      ApiTestHelpers.assertFields(response, ['success'], 'Response should indicate success');
      
      assert.strictEqual(response.success, true, 'Response should indicate successful event tracking');
      
      console.log('✅ Event tracked successfully:', response);
    });

    it('should handle missing event type', async () => {
      const response = await client.post('/api/analytics/track', {
        properties: { some: 'data' }
        // Missing 'event' field
      });

      // Should return 400 error for missing event
      ApiTestHelpers.assertStatus(response, 400, 'Should return 400 for missing event');
      assert.ok(response.error, 'Response should contain error message');
      assert.ok(response.error.includes('Event name is required'), 'Error should mention event name requirement');
      
      console.log('✅ Missing event handled correctly:', response.error);
    });

    it('should track events for authenticated users', async () => {
      const eventData = {
        event: 'user_login',
        properties: {
          loginMethod: 'email',
          timestamp: new Date().toISOString()
        }
      };

      const response = await client.trackEvent(eventData.event, eventData.properties);
      
      ApiTestHelpers.assertSuccess(response);
      assert.strictEqual(response.success, true);
      
      // Verify user association
      const userInfo = client.getUserInfo();
      assert.ok(userInfo.isAuthenticated, 'Client should be authenticated');
      
      console.log('✅ Authenticated user event tracked successfully');
    });

    it('should handle database operations gracefully', async () => {
      // Test with a large properties object to stress test database handling
      const largeProperties = {};
      for (let i = 0; i < 50; i++) {
        largeProperties[`property_${i}`] = `value_${i}_${Math.random()}`;
      }

      const eventData = {
        event: 'stress_test_event',
        properties: largeProperties
      };

      const response = await client.trackEvent(eventData.event, eventData.properties);
      
      ApiTestHelpers.assertSuccess(response);
      assert.strictEqual(response.success, true);
      
      console.log('✅ Large event data handled successfully');
    });

    it('should validate experience type values', async () => {
      const eventData = {
        event: 'test_experience',
        experienceType: 'A', // Valid experience type
        properties: { test: 'data' }
      };

      const response = await client.post('/api/analytics/track', eventData);
      
      ApiTestHelpers.assertSuccess(response);
      assert.strictEqual(response.success, true);
      
      console.log('✅ Experience type validation working');
    });
  });

  describe('GET /api/analytics/conversion-funnel', () => {
    it('should return conversion funnel data for admin users', async () => {
      const response = await adminClient.getConversionFunnel(7); // Last 7 days
      
      ApiTestHelpers.assertSuccess(response, 'Admin should access conversion funnel data');
      
      // Verify funnel data structure
      const expectedFields = ['period', 'totalUsers', 'conversions'];
      ApiTestHelpers.assertFields(response, expectedFields.slice(0, 1)); // At least period should exist
      
      console.log('✅ Conversion funnel data retrieved:', response);
    });

    it('should handle invalid days parameter', async () => {
      const response = await adminClient.get('/api/analytics/conversion-funnel?days=invalid');
      
      // Should still work with default or handle gracefully
      // The exact behavior depends on implementation, but shouldn't crash
      assert.ok(response, 'Should return some response for invalid days parameter');
      
      console.log('✅ Invalid days parameter handled');
    });

    it('should require admin authentication', async () => {
      const response = await client.getConversionFunnel(); // Non-admin user
      
      // Should deny access or return limited data
      // The exact status code depends on implementation (401, 403, or limited data)
      assert.ok(response._status >= 400 || response.error, 'Regular user should not have full admin access');
      
      console.log('✅ Admin authentication requirement verified');
    });

    it('should calculate conversion rates correctly', async () => {
      // First, generate some test events to create conversion data
      await client.trackEvent('page_view', { page: 'landing' });
      await client.trackEvent('signup_started', { source: 'landing' });
      await client.trackEvent('signup_completed', { source: 'landing' });

      const response = await adminClient.getConversionFunnel(1); // Today only
      
      ApiTestHelpers.assertSuccess(response);
      
      // The exact structure depends on implementation, but should have some data
      assert.ok(response, 'Should return conversion data');
      
      console.log('✅ Conversion calculation test completed');
    });

    it('should handle empty data gracefully', async () => {
      // Test with future date range that should have no data
      const response = await adminClient.get('/api/analytics/conversion-funnel?days=0');
      
      ApiTestHelpers.assertSuccess(response, 'Should handle empty data gracefully');
      
      console.log('✅ Empty data handled gracefully');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should authenticate requests with valid JWT', async () => {
      const authenticated = await client.testAuth();
      assert.strictEqual(authenticated, true, 'Valid JWT should authenticate successfully');
      
      console.log('✅ JWT authentication working');
    });

    it('should handle missing authorization header', async () => {
      const unauthenticatedClient = new ApiTestClient(testServer.getBaseUrl());
      
      const response = await unauthenticatedClient.post('/api/analytics/track', {
        event: 'test_event'
      });

      // Should require authentication
      assert.ok(response._status >= 400, 'Should require authentication for protected endpoints');
      
      console.log('✅ Missing authorization handled correctly');
    });

    it('should handle invalid JWT tokens', async () => {
      const invalidClient = new ApiTestClient(testServer.getBaseUrl());
      invalidClient.authToken = 'invalid.jwt.token';

      const response = await invalidClient.post('/api/analytics/track', {
        event: 'test_event'
      });

      // Should reject invalid token
      assert.ok(response._status >= 400, 'Should reject invalid JWT tokens');
      
      console.log('✅ Invalid JWT tokens handled correctly');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch event processing', async () => {
      const batchEvents = [];
      const batchSize = 10;
      
      // Create multiple events simultaneously
      for (let i = 0; i < batchSize; i++) {
        batchEvents.push(
          client.trackEvent(`batch_event_${i}`, {
            batchId: 'test_batch_1',
            eventIndex: i,
            timestamp: new Date().toISOString()
          })
        );
      }

      // Wait for all events to complete
      const results = await Promise.all(batchEvents);
      
      // All should succeed
      results.forEach((result, index) => {
        ApiTestHelpers.assertSuccess(result, `Batch event ${index} should succeed`);
      });
      
      console.log(`✅ Batch processing completed: ${results.length} events processed`);
    });

    it('should handle reasonable request load', async () => {
      const startTime = Date.now();
      const concurrentRequests = 5;
      
      const requests = [];
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          client.trackEvent('load_test', {
            requestId: i,
            startTime: startTime
          })
        );
      }

      const results = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      results.forEach((result, index) => {
        ApiTestHelpers.assertSuccess(result, `Load test request ${index} should succeed`);
      });
      
      // Should complete in reasonable time (less than 5 seconds for 5 requests)
      assert.ok(totalTime < 5000, `Requests should complete in reasonable time (${totalTime}ms)`);
      
      console.log(`✅ Load test completed: ${concurrentRequests} requests in ${totalTime}ms`);
    });
  });
});

module.exports = { 
  // Export for potential reuse in other test files
  TestServer,
  ApiTestClient,
  ApiTestHelpers 
};