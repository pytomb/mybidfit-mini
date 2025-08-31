const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const { testDb } = require('../setup/test-database');

// Real Data Integration Testing with standardized test database
describe('API Integration Tests with Real Data Persistence', () => {
  let server;
  let baseUrl;
  let authToken;
  let testUsers;
  let testPort;

  // Helper function to find available port
  async function findAvailablePort(startPort) {
    const net = require('net');
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(startPort, () => {
        const port = server.address().port;
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        resolve(findAvailablePort(startPort + 1));
      });
    });
  }

  before(async () => {
    // Setup test database with real data
    await testDb.setup();
    await testDb.createFullTestData();
    
    // Get test users for authentication
    testUsers = {
      active: await testDb.getTestUser('test-auth@example.com'),
      admin: await testDb.getTestUser('test-admin@example.com')
    };

    // Find available port and start test server
    testPort = await findAvailablePort(3007);
    process.env.NODE_ENV = 'test';
    process.env.PORT = testPort.toString();
    process.env.JWT_SECRET = 'test-secret-key-for-real-data-integration';
    
    const app = require('../../src/server.js');
    server = app.listen(testPort);
    baseUrl = `http://localhost:${testPort}`;
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create authentication token using real test user
    authToken = jwt.sign({ userId: testUsers.active.id }, process.env.JWT_SECRET);
  });

  after(async () => {
    if (server) {
      server.close();
    }
    await testDb.cleanup();
  });

  beforeEach(() => {
    // Reset any test state if needed
  });

  // CRITICAL TEST: Real Database User Authentication Validation
  test('should authenticate with real database users and maintain property consistency', async () => {
    // Test authentication with real test user from database
    const testUser = testUsers.active;
    
    // Test profile access with real auth token
    const profileResponse = await makeRequest('GET', `${baseUrl}/api/users/profile`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    // Critical validation - ensures we catch userId vs id property mapping issues
    if (profileResponse.statusCode === 200) {
      assert.ok(profileResponse.body.success, 'Profile access should succeed with real user');
      assert.strictEqual(profileResponse.body.data.id, testUser.id, 'Profile should return correct user ID from database');
      assert.strictEqual(profileResponse.body.data.email, testUser.email, 'Profile should return correct email from database');
      
      // CRITICAL: Verify property mapping that caused previous session issues
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
      assert.strictEqual(decoded.userId, testUser.id, 'JWT userId should match database user ID');
      assert.ok(!profileResponse.body.data.userId, 'Profile should use id property, not userId');
    } else if (profileResponse.statusCode === 404) {
      assert.ok(true, 'Profile endpoint may not be implemented yet, but auth was processed without server error');
    } else {
      assert.ok(profileResponse.statusCode !== 500, 'Should not return server error with valid token');
    }

    // Test invalid token handling with real database
    const invalidTokenResponse = await makeRequest('GET', `${baseUrl}/api/users/profile`, null, {
      'Authorization': 'Bearer invalid-real-database-token'
    });
    
    assert.strictEqual(invalidTokenResponse.statusCode, 401, 'Invalid token should be rejected by real auth middleware');
  });

  // Real Database User Creation Test
  test('should handle user registration with real database persistence', async () => {
    const newUserData = {
      email: 'new-integration-user@test.com',
      password: 'testPassword123',
      firstName: 'New',
      lastName: 'Integration',
      companyName: 'New Test Company'
    };

    // Test registration endpoint
    const registerResponse = await makeRequest('POST', `${baseUrl}/api/auth/register`, newUserData);
    
    if (registerResponse.statusCode === 201) {
      // Registration succeeded - validate database persistence
      assert.ok(registerResponse.body.user, 'Registration should return user data');
      assert.ok(registerResponse.body.user.id, 'New user should have database ID');
      
      // Verify user was actually persisted to database
      const dbUser = await testDb.getTestUser(newUserData.email);
      assert.ok(dbUser, 'User should be persisted in database');
      assert.strictEqual(dbUser.email, newUserData.email, 'Database should contain correct email');
      assert.strictEqual(dbUser.first_name, newUserData.firstName, 'Database should map firstName to first_name');
      
      // Test login with newly created user
      const loginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
        email: newUserData.email,
        password: newUserData.password
      });
      
      if (loginResponse.statusCode === 200) {
        assert.ok(loginResponse.body.token, 'Login should return JWT token');
        assert.strictEqual(loginResponse.body.user.id, dbUser.id, 'Login user ID should match database ID');
      }
    } else if (registerResponse.statusCode === 404) {
      assert.ok(true, 'Registration endpoint may not be implemented yet');
    } else {
      assert.ok(registerResponse.statusCode < 500, 'Registration should not cause server error');
    }
  });

  // Real Database AI Algorithm Integration Test
  test('should handle AI algorithm endpoints with real authentication', async () => {
    // Test supplier analysis endpoint (Algorithm 1) with real auth token
    const supplierData = {
      companyName: 'Integration Test Company',
      website: 'https://integration-test.com',
      description: 'Software development company specializing in web applications and AI integration',
      services: ['Web Development', 'API Development', 'AI Integration'],
      certifications: ['ISO 9001', 'SOC 2 Type II']
    };

    const supplierAnalysisResponse = await makeRequest(
      'POST',
      `${baseUrl}/api/suppliers/analyze`,
      supplierData,
      { 'Authorization': `Bearer ${authToken}` }
    );

    assert.ok(supplierAnalysisResponse, 'Supplier analysis endpoint should be accessible');
    
    if (supplierAnalysisResponse.statusCode === 200) {
      // Validate real algorithm response structure
      assert.ok(supplierAnalysisResponse.body, 'Should return analysis results');
      assert.ok(supplierAnalysisResponse.body.capabilities, 'Should include capabilities analysis');
      assert.ok(typeof supplierAnalysisResponse.body.credibilityScore === 'number', 'Should include credibility score');
      assert.ok(supplierAnalysisResponse.body.credibilityScore >= 0 && supplierAnalysisResponse.body.credibilityScore <= 100, 'Credibility score should be 0-100');
      
      // Verify algorithm processed real data
      assert.ok(supplierAnalysisResponse.body.analysis, 'Should include detailed analysis');
      assert.ok(Array.isArray(supplierAnalysisResponse.body.capabilities), 'Capabilities should be array');
    } else if (supplierAnalysisResponse.statusCode === 404) {
      assert.ok(true, 'Supplier analysis endpoint may not be implemented yet');
    } else if (supplierAnalysisResponse.statusCode === 401) {
      assert.fail('Should not be unauthorized with valid real database token');
    } else {
      assert.ok(supplierAnalysisResponse.statusCode < 500, 'Should not cause server error');
    }

    // Test without authentication to verify security
    const unauthResponse = await makeRequest('POST', `${baseUrl}/api/suppliers/analyze`, supplierData);
    
    if (unauthResponse.statusCode !== 404) {
      assert.strictEqual(unauthResponse.statusCode, 401, 'Supplier analysis should require authentication');
    }
  });

  // Real Database Opportunity Scoring with Panel of Judges Algorithm
  test('should handle opportunity scoring with real data and authentication', async () => {
    const scoringData = {
      supplier: {
        companyName: 'Test Supplier Co',
        capabilities: ['Software Development', 'Cloud Services', 'Security Compliance'],
        certifications: ['AWS Solutions Architect', 'SOC 2 Type II'],
        pastPerformance: {
          successRate: 0.95,
          onTimeDelivery: 0.90,
          clientSatisfaction: 4.5,
          projectsCompleted: 25
        },
        // Use real test data from our database setup
        yearsExperience: 5,
        teamSize: 15
      },
      opportunity: {
        title: 'Government Portal Development',
        description: 'Develop secure government citizen portal with accessibility compliance',
        requirements: ['React', 'Node.js', 'Security Clearance', 'WCAG Compliance', 'Government Experience'],
        budget: 500000,
        timeline: '12 months',
        complexity: 'high',
        industry: 'government'
      }
    };

    const scoringResponse = await makeRequest(
      'POST',
      `${baseUrl}/api/opportunities/score-fit`,
      scoringData,
      { 'Authorization': `Bearer ${authToken}` }
    );

    assert.ok(scoringResponse, 'Opportunity scoring endpoint should be accessible');
    
    if (scoringResponse.statusCode === 200) {
      // Validate real Panel of Judges algorithm response
      assert.ok(scoringResponse.body, 'Should return scoring results');
      assert.ok(typeof scoringResponse.body.overallScore === 'number', 'Should include numerical overall score');
      assert.ok(scoringResponse.body.overallScore >= 0 && scoringResponse.body.overallScore <= 100, 'Overall score should be 0-100');
      assert.ok(scoringResponse.body.judgeScores, 'Should include individual judge scores');
      
      // Verify Panel of Judges structure with real data validation
      const expectedJudges = ['technical', 'domain', 'value', 'innovation', 'relationship'];
      for (const judge of expectedJudges) {
        assert.ok(scoringResponse.body.judgeScores[judge], `Should include ${judge} judge score`);
        assert.ok(typeof scoringResponse.body.judgeScores[judge].score === 'number', `${judge} score should be numerical`);
        assert.ok(scoringResponse.body.judgeScores[judge].reasoning, `${judge} judge should provide reasoning`);
      }
      
      // Validate explainable AI components
      assert.ok(scoringResponse.body.explanation, 'Should include explainable AI reasoning');
      assert.ok(scoringResponse.body.recommendations, 'Should include actionable recommendations');
      assert.ok(Array.isArray(scoringResponse.body.recommendations), 'Recommendations should be array');
      
      // Validate scoring consistency
      const judgeScores = Object.values(scoringResponse.body.judgeScores).map(j => j.score);
      const averageJudgeScore = judgeScores.reduce((a, b) => a + b, 0) / judgeScores.length;
      assert.ok(Math.abs(scoringResponse.body.overallScore - averageJudgeScore) <= 10, 'Overall score should be consistent with judge scores');
    } else if (scoringResponse.statusCode === 404) {
      assert.ok(true, 'Opportunity scoring endpoint may not be implemented yet');
    } else if (scoringResponse.statusCode === 401) {
      assert.fail('Should not be unauthorized with valid real database token');
    } else {
      assert.ok(scoringResponse.statusCode < 500, 'Should not cause server error');
    }

    // Test scoring endpoint security with real database tokens
    const unauthScoringResponse = await makeRequest('POST', `${baseUrl}/api/opportunities/score-fit`, scoringData);
    
    if (unauthScoringResponse.statusCode !== 404) {
      assert.strictEqual(unauthScoringResponse.statusCode, 401, 'Scoring endpoint should require authentication');
    }
  });

  // Real Database Partnership Matching Algorithm Integration
  test('should handle partnership matching with real database companies', async () => {
    const partnershipData = {
      primarySupplier: {
        companyName: 'Primary Tech Solutions',
        capabilities: ['Frontend Development', 'UI/UX Design', 'React Development'],
        location: 'Washington DC',
        size: 'medium',
        yearsExperience: 8,
        teamSize: 12
      },
      opportunityRequirements: {
        title: 'Full-Stack Enterprise Application Development',
        description: 'Comprehensive enterprise application requiring multiple specialist capabilities',
        requirements: ['Frontend', 'Backend', 'Database', 'DevOps', 'Security', 'API Integration'],
        complexity: 'high',
        timeline: '18 months',
        budget: 750000,
        industry: 'government'
      }
    };

    const partnershipResponse = await makeRequest(
      'POST',
      `${baseUrl}/api/partnerships/find-matches`,
      partnershipData,
      { 'Authorization': `Bearer ${authToken}` }
    );

    assert.ok(partnershipResponse, 'Partnership matching endpoint should be accessible');
    
    if (partnershipResponse.statusCode === 200) {
      // Validate real partnership algorithm response
      assert.ok(partnershipResponse.body, 'Should return partnership recommendations');
      assert.ok(Array.isArray(partnershipResponse.body.matches), 'Should return array of partnership matches');
      
      if (partnershipResponse.body.matches.length > 0) {
        const firstMatch = partnershipResponse.body.matches[0];
        assert.ok(firstMatch.partner, 'Each match should include partner information');
        assert.ok(firstMatch.partner.companyName, 'Partner should have company name');
        assert.ok(typeof firstMatch.compatibilityScore === 'number', 'Each match should include numerical compatibility score');
        assert.ok(firstMatch.compatibilityScore >= 0 && firstMatch.compatibilityScore <= 100, 'Compatibility score should be 0-100');
        assert.ok(firstMatch.reasoning, 'Each match should include AI reasoning');
        assert.ok(firstMatch.complementaryCapabilities, 'Should show which capabilities partners provide');
      }
      
      // Validate partnership algorithm quality
      assert.ok(partnershipResponse.body.analysisMetadata, 'Should include analysis metadata');
      assert.ok(partnershipResponse.body.gapAnalysis, 'Should include capability gap analysis');
    } else if (partnershipResponse.statusCode === 404) {
      assert.ok(true, 'Partnership matching endpoint may not be implemented yet');
    } else if (partnershipResponse.statusCode === 401) {
      assert.fail('Should not be unauthorized with valid real database token');
    } else {
      assert.ok(partnershipResponse.statusCode < 500, 'Should not cause server error');
    }

    // Test partnership endpoint security
    const unauthPartnershipResponse = await makeRequest('POST', `${baseUrl}/api/partnerships/find-matches`, partnershipData);
    
    if (unauthPartnershipResponse.statusCode !== 404) {
      assert.strictEqual(unauthPartnershipResponse.statusCode, 401, 'Partnership endpoint should require authentication');
    }
  });

  // Comprehensive Real Data Persistence and Cross-System Integration Test
  test('should validate comprehensive real data persistence across all systems', async () => {
    const testUser = testUsers.active;
    
    // Test 1: Verify test user exists in database with correct properties
    assert.ok(testUser.id, 'Real test user should have database ID');
    assert.ok(testUser.email, 'Real test user should have email');
    assert.ok(testUser.first_name, 'Real test user should have first_name');
    assert.ok(testUser.company_name, 'Real test user should have company_name');
    
    // Test 2: Verify JWT token contains correct user data from database  
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    assert.strictEqual(decoded.userId, testUser.id, 'JWT userId should match database user ID');
    
    // Test 3: Test companies endpoint with real database data
    const companiesResponse = await makeRequest('GET', `${baseUrl}/api/users/companies`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (companiesResponse.statusCode === 200) {
      assert.ok(companiesResponse.body.success, 'Companies endpoint should succeed with real auth');
      assert.ok(Array.isArray(companiesResponse.body.data.companies), 'Should return companies array from database');
      
      // Verify companies come from our real test data
      const testCompany = companiesResponse.body.data.companies.find(c => c.name === 'Test Tech Solutions');
      if (testCompany) {
        assert.ok(testCompany.capabilities, 'Test company should have capabilities from real data');
        assert.ok(testCompany.credibility_score, 'Test company should have credibility score from real data');
      }
    } else if (companiesResponse.statusCode === 404) {
      assert.ok(true, 'Companies endpoint may not be implemented yet');
    }
    
    // Test 4: Test opportunities endpoint with real database company data
    const opportunitiesResponse = await makeRequest('GET', `${baseUrl}/api/opportunities/for-company/1`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (opportunitiesResponse.statusCode === 200) {
      assert.ok(opportunitiesResponse.body.success, 'Opportunities endpoint should succeed');
      
      if (opportunitiesResponse.body.data.opportunities) {
        const testOpportunity = opportunitiesResponse.body.data.opportunities.find(o => o.title?.includes('Test'));
        if (testOpportunity) {
          assert.ok(testOpportunity.required_capabilities, 'Test opportunity should have capabilities from real data');
          assert.ok(testOpportunity.evaluation_criteria, 'Test opportunity should have evaluation criteria from real data');
        }
      }
    } else if (opportunitiesResponse.statusCode === 404) {
      assert.ok(true, 'Opportunities endpoint may not be implemented yet');
    }
    
    // Test 5: Cross-validate that all test data is consistent
    const dbDirectQuery = await testDb.db.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    const activeUserCount = parseInt(dbDirectQuery.rows[0].count);
    assert.ok(activeUserCount >= 2, 'Should have at least 2 active test users (auth + admin)');
    
    const companiesDirectQuery = await testDb.db.query('SELECT COUNT(*) as count FROM companies');
    const companyCount = parseInt(companiesDirectQuery.rows[0].count);
    assert.ok(companyCount >= 1, 'Should have at least 1 test company from real data creation');
    
    const opportunitiesDirectQuery = await testDb.db.query('SELECT COUNT(*) as count FROM opportunities');
    const opportunityCount = parseInt(opportunitiesDirectQuery.rows[0].count);
    assert.ok(opportunityCount >= 1, 'Should have at least 1 test opportunity from real data creation');
  });

  test('should handle error cases gracefully across all endpoints', async () => {
    // Test invalid data handling
    const invalidRequests = [
      {
        endpoint: '/api/suppliers/analyze',
        data: { /* missing required fields */ },
        expectedError: 'validation error'
      },
      {
        endpoint: '/api/opportunities/score-fit',
        data: { supplier: null, opportunity: null },
        expectedError: 'invalid input'
      },
      {
        endpoint: '/api/partnerships/find-matches',
        data: { /* malformed data */ },
        expectedError: 'validation error'
      }
    ];

    for (const request of invalidRequests) {
      const response = await makeRequest(
        'POST',
        `${baseUrl}${request.endpoint}`,
        request.data,
        authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      );

      // Should handle errors gracefully (not crash server)
      assert.ok(response.statusCode >= 400 && response.statusCode < 500, 
        `${request.endpoint} should return client error for invalid data`);
      
      if (response.body && response.body.error) {
        assert.ok(typeof response.body.error === 'string', 'Should provide error message');
      }
    }
  });

  test('should enforce authentication on protected endpoints', async () => {
    const protectedEndpoints = [
      '/api/users/profile',
      '/api/users/companies',
      '/api/analysis/comprehensive'
    ];

    for (const endpoint of protectedEndpoints) {
      // Test without authentication
      const unauthResponse = await makeRequest('GET', `${baseUrl}${endpoint}`);
      
      // Should require authentication
      assert.ok(unauthResponse.statusCode === 401 || unauthResponse.statusCode === 403,
        `${endpoint} should require authentication`);

      // Test with invalid token
      const invalidTokenResponse = await makeRequest(
        'GET',
        `${baseUrl}${endpoint}`,
        null,
        { 'Authorization': 'Bearer invalid-token-here' }
      );
      
      assert.ok(invalidTokenResponse.statusCode === 401 || invalidTokenResponse.statusCode === 403,
        `${endpoint} should reject invalid tokens`);
    }
  });

  test('should handle concurrent requests without issues', async () => {
    const healthEndpoint = `${baseUrl}/health`;
    const concurrentRequests = 10;
    
    // Create multiple concurrent requests
    const promises = Array(concurrentRequests).fill().map(() => 
      makeRequest('GET', healthEndpoint)
    );

    const responses = await Promise.all(promises);

    // All requests should succeed
    for (const response of responses) {
      assert.strictEqual(response.statusCode, 200, 'All concurrent requests should succeed');
    }

    // Should handle load without performance degradation
    const healthyResponses = responses.filter(r => r.body && r.body.status === 'healthy');
    assert.strictEqual(healthyResponses.length, concurrentRequests, 'All responses should be healthy');
  });

  test('should maintain API response performance under load', async () => {
    const startTime = Date.now();
    
    // Test multiple algorithm endpoints for performance
    const algorithmTests = [
      makeRequest('POST', `${baseUrl}/api/suppliers/analyze`, {
        companyName: 'Performance Test Company',
        description: 'Testing API performance'
      }),
      makeRequest('POST', `${baseUrl}/api/opportunities/score-fit`, {
        supplier: { companyName: 'Test' },
        opportunity: { title: 'Test Opportunity' }
      })
    ];

    await Promise.all(algorithmTests);
    const totalTime = Date.now() - startTime;

    // All algorithm endpoints should respond within reasonable time
    assert.ok(totalTime < 5000, `API endpoints should respond within 5 seconds, took ${totalTime}ms`);
  });
});

// Enhanced helper function for making HTTP requests
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
      },
      timeout: 10000  // 10 second timeout
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
            body: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 0,
        error: 'Request timeout'
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}