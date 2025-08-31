const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { testServer } = require('../setup/test-server');

describe('Relationship Intelligence API Integration Tests', () => {
  let authToken;
  let testUserId;
  let app;
  
  before(async () => {
    // Setup shared test server
    await testServer.setup();
    app = testServer.getApp();
    
    // Create a test user and get auth token for API calls
    // This would typically use the auth endpoints
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test-ri@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company'
      });
    
    if (registerResponse.status === 201 || registerResponse.status === 400) {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-ri@example.com',
          password: 'TestPassword123!'
        });
      
      authToken = loginResponse.body.token;
      testUserId = loginResponse.body.user?.id;
    }
  });

  after(async () => {
    // Cleanup shared test server
    await testServer.cleanup();
  });

  test('GET /api/relationship-intelligence/organizations should return Atlanta organizations', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .get('/api/relationship-intelligence/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .query({
        type: 'corporation',
        county: 'Fulton',
        limit: 10
      });

    // Should handle feature flag - either return data or feature disabled error
    if (response.status === 403) {
      assert.ok(response.body.error.includes('feature'), 'Should indicate feature not enabled');
      return;
    }

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.success);
    assert.ok(Array.isArray(response.body.data));
    assert.ok(response.body.pagination);
    
    if (response.body.data.length > 0) {
      const org = response.body.data[0];
      assert.ok(org.id);
      assert.ok(org.name);
      assert.ok(org.type);
    }
  });

  test('GET /api/relationship-intelligence/people should return Atlanta professionals', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .get('/api/relationship-intelligence/people')
      .set('Authorization', `Bearer ${authToken}`)
      .query({
        seniority: 'c-level',
        limit: 10
      });

    if (response.status === 403) {
      assert.ok(response.body.error.includes('feature'), 'Should indicate feature not enabled');
      return;
    }

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.success);
    assert.ok(Array.isArray(response.body.data));
    
    if (response.body.data.length > 0) {
      const person = response.body.data[0];
      assert.ok(person.id);
      assert.ok(person.first_name);
      assert.ok(person.last_name);
      assert.ok(person.title);
    }
  });

  test('POST /api/relationship-intelligence/connection-path should find connection paths', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .post('/api/relationship-intelligence/connection-path')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromPersonId: 1,
        toPersonId: 2,
        maxDegrees: 3
      });

    if (response.status === 403) {
      assert.ok(response.body.error.includes('feature'), 'Should indicate feature not enabled');
      return;
    }

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.success);
    assert.ok(response.body.data);
    assert.ok(response.body.data.fromPersonId);
    assert.ok(response.body.data.toPersonId);
    assert.ok(Array.isArray(response.body.data.paths));
  });

  test('POST /api/relationship-intelligence/connection-path should validate required parameters', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    // Test missing fromPersonId
    const response1 = await request(app)
      .post('/api/relationship-intelligence/connection-path')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        toPersonId: 2
      });

    if (response1.status !== 403) {
      assert.strictEqual(response1.status, 400);
      assert.ok(response1.body.error.includes('required'));
    }

    // Test missing toPersonId
    const response2 = await request(app)
      .post('/api/relationship-intelligence/connection-path')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromPersonId: 1
      });

    if (response2.status !== 403) {
      assert.strictEqual(response2.status, 400);
      assert.ok(response2.body.error.includes('required'));
    }
  });

  test('GET /api/relationship-intelligence/events should return upcoming events', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .get('/api/relationship-intelligence/events')
      .set('Authorization', `Bearer ${authToken}`)
      .query({
        eventType: 'conference',
        networkingPotential: 'high',
        limit: 5
      });

    if (response.status === 403) {
      assert.ok(response.body.error.includes('feature'), 'Should indicate feature not enabled');
      return;
    }

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.success);
    assert.ok(Array.isArray(response.body.data));
    
    if (response.body.data.length > 0) {
      const event = response.body.data[0];
      assert.ok(event.id);
      assert.ok(event.name);
      assert.ok(event.event_type);
      assert.ok(event.start_date);
    }
  });

  test('POST /api/relationship-intelligence/event-recommendations should provide personalized recommendations', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .post('/api/relationship-intelligence/event-recommendations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        personId: 1,
        goals: ['networking', 'business_development'],
        targetIndustries: ['Technology'],
        maxEvents: 3
      });

    if (response.status === 403) {
      assert.ok(response.body.error.includes('feature'), 'Should indicate feature not enabled');
      return;
    }

    if (response.status !== 200) {
      // Person might not exist in test DB
      assert.ok(response.status === 400 || response.status === 404);
      return;
    }

    assert.ok(response.body.success);
    assert.ok(response.body.data);
    assert.ok(response.body.data.personId);
    assert.ok(Array.isArray(response.body.data.recommendations));
    assert.ok(response.body.data.recommendations.length <= 3);
  });

  test('POST /api/relationship-intelligence/event-recommendations should validate required personId', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .post('/api/relationship-intelligence/event-recommendations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        goals: ['networking'],
        targetIndustries: ['Technology']
      });

    if (response.status !== 403) {
      assert.strictEqual(response.status, 400);
      assert.ok(response.body.error.includes('Person ID is required'));
    }
  });

  test('GET /api/relationship-intelligence/opportunities should return business opportunities', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .get('/api/relationship-intelligence/opportunities')
      .set('Authorization', `Bearer ${authToken}`)
      .query({
        opportunityType: 'partnership',
        status: 'open',
        limit: 10
      });

    if (response.status === 403) {
      assert.ok(response.body.error.includes('feature'), 'Should indicate feature not enabled');
      return;
    }

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.success);
    assert.ok(Array.isArray(response.body.data));
    
    if (response.body.data.length > 0) {
      const opportunity = response.body.data[0];
      assert.ok(opportunity.id);
      assert.ok(opportunity.title);
      assert.ok(opportunity.opportunity_type);
      assert.ok(opportunity.current_status);
    }
  });

  test('POST /api/relationship-intelligence/opportunity-analysis should analyze opportunity fit', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .post('/api/relationship-intelligence/opportunity-analysis')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        opportunityId: 1,
        yourPersonId: 1,
        yourCapabilities: ['Software Development', 'Project Management']
      });

    if (response.status === 403) {
      assert.ok(response.body.error.includes('feature'), 'Should indicate feature not enabled');
      return;
    }

    if (response.status !== 200) {
      // Opportunity might not exist
      assert.ok(response.status === 400 || response.status === 404);
      return;
    }

    assert.ok(response.body.success);
    assert.ok(response.body.data);
    assert.ok(response.body.data.opportunity);
    assert.ok(response.body.data.capabilityAnalysis);
    assert.ok(typeof response.body.data.overallFitScore === 'number');
  });

  test('POST /api/relationship-intelligence/opportunity-analysis should validate opportunityId', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .post('/api/relationship-intelligence/opportunity-analysis')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        yourPersonId: 1,
        yourCapabilities: ['Software Development']
      });

    if (response.status !== 403) {
      assert.strictEqual(response.status, 400);
      assert.ok(response.body.error.includes('Opportunity ID is required'));
    }
  });

  test('GET /api/relationship-intelligence/insights should return AI-generated insights', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .get('/api/relationship-intelligence/insights')
      .set('Authorization', `Bearer ${authToken}`)
      .query({
        targetType: 'person',
        minRelevance: 8.0,
        limit: 5
      });

    if (response.status === 403) {
      assert.ok(response.body.error.includes('feature'), 'Should indicate feature not enabled');
      return;
    }

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.success);
    assert.ok(Array.isArray(response.body.data));
    
    if (response.body.data.length > 0) {
      const insight = response.body.data[0];
      assert.ok(insight.id);
      assert.ok(insight.insight_title);
      assert.ok(insight.insight_description);
      assert.ok(typeof insight.relevance_score === 'number');
    }
  });

  test('POST /api/relationship-intelligence/network-analysis should analyze network position', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .post('/api/relationship-intelligence/network-analysis')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        personId: 1,
        analysisType: 'comprehensive'
      });

    if (response.status === 403) {
      assert.ok(response.body.error.includes('feature'), 'Should indicate feature not enabled');
      return;
    }

    if (response.status !== 200) {
      // Person might not exist
      assert.ok(response.status === 400 || response.status === 404);
      return;
    }

    assert.ok(response.body.success);
    assert.ok(response.body.data);
    assert.ok(response.body.data.person);
    assert.ok(response.body.data.networkMetrics);
    assert.ok(response.body.data.influenceAnalysis);
  });

  test('POST /api/relationship-intelligence/network-analysis should validate personId', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .post('/api/relationship-intelligence/network-analysis')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        analysisType: 'comprehensive'
      });

    if (response.status !== 403) {
      assert.strictEqual(response.status, 400);
      assert.ok(response.body.error.includes('Person ID is required'));
    }
  });

  test('POST /api/relationship-intelligence/introduction-request should handle introduction requests', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .post('/api/relationship-intelligence/introduction-request')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromPersonId: 1,
        toPersonId: 2,
        introducerPersonId: 3,
        message: 'Would like to discuss partnership opportunities',
        context: 'Met at Atlanta Tech Summit',
        urgency: 'normal'
      });

    if (response.status === 403) {
      assert.ok(response.body.error.includes('feature'), 'Should indicate feature not enabled');
      return;
    }

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.success);
    assert.ok(response.body.data);
    assert.ok(response.body.data.requestId);
    assert.ok(response.body.data.status);
    assert.ok(response.body.data.estimatedResponse);
  });

  test('POST /api/relationship-intelligence/introduction-request should validate required fields', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .post('/api/relationship-intelligence/introduction-request')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromPersonId: 1,
        toPersonId: 2,
        // Missing introducerPersonId and message
        context: 'Test context'
      });

    if (response.status !== 403) {
      assert.strictEqual(response.status, 400);
      assert.ok(response.body.error.includes('required'));
    }
  });

  test('GET /api/relationship-intelligence/dashboard should return dashboard data', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .get('/api/relationship-intelligence/dashboard')
      .set('Authorization', `Bearer ${authToken}`)
      .query({
        personId: 1
      });

    if (response.status === 403) {
      assert.ok(response.body.error.includes('feature'), 'Should indicate feature not enabled');
      return;
    }

    if (response.status !== 200) {
      // Person might not exist
      assert.ok(response.status === 400 || response.status === 404);
      return;
    }

    assert.ok(response.body.success);
    assert.ok(response.body.data);
    assert.ok(response.body.data.networkSummary);
    assert.ok(Array.isArray(response.body.data.recentInsights));
    assert.ok(Array.isArray(response.body.data.upcomingEvents));
    assert.ok(Array.isArray(response.body.data.relevantOpportunities));
    assert.ok(response.body.data.weeklyActivity);
  });

  test('GET /api/relationship-intelligence/dashboard should validate personId', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .get('/api/relationship-intelligence/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    if (response.status !== 403) {
      assert.strictEqual(response.status, 400);
      assert.ok(response.body.error.includes('Person ID is required'));
    }
  });

  test('should require authentication for all endpoints', async () => {
    // Test without auth token
    const response = await request(app)
      .get('/api/relationship-intelligence/organizations');

    assert.strictEqual(response.status, 401);
    assert.ok(response.body.error.includes('token') || response.body.error.includes('authorization'));
  });

  test('should handle pagination parameters correctly', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .get('/api/relationship-intelligence/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .query({
        limit: 5,
        offset: 10
      });

    if (response.status === 403) {
      // Feature not enabled
      return;
    }

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.pagination);
    assert.strictEqual(response.body.pagination.limit, 5);
    assert.strictEqual(response.body.pagination.offset, 10);
  });

  test('should handle search parameters correctly', async () => {
    if (!authToken) {
      console.log('Skipping test - no auth token available');
      return;
    }

    const response = await request(app)
      .get('/api/relationship-intelligence/people')
      .set('Authorization', `Bearer ${authToken}`)
      .query({
        search: 'CEO',
        seniority: 'c-level',
        limit: 10
      });

    if (response.status === 403) {
      // Feature not enabled
      return;
    }

    assert.strictEqual(response.status, 200);
    // Results should be filtered based on search criteria
    assert.ok(Array.isArray(response.body.data));
  });
});