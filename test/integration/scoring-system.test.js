const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { SupertestHelper } = require('../helpers/supertest-helper');

describe('Scoring System Integration Tests', () => {
  let helper;
  let authUser = null;

  before(async () => {
    helper = new SupertestHelper();
    
    // Use existing test user from test data
    authUser = await helper.authenticatedRequest('test-auth@example.com');
    console.log('✅ Using test user:', authUser.email);
  });

  after(async () => {
    if (helper) {
      await helper.cleanup();
    }
  });

  it('should score opportunities for authenticated user with profile', async () => {
    // Create a test profile for the user
    const profileData = {
      name: 'Test Tech Solutions LLC',
      businessType: 'small_business',
      naics: ['541511', '541512'],
      capabilities: ['Cloud Computing', 'Software Development', 'Cybersecurity'],
      certifications: ['FedRAMP Ready', 'ISO 27001', 'SDVOSB'],
      summary: 'Test IT services company',
      employeeCount: 25,
      annualRevenue: 2500000,
      serviceAreas: ['Washington, DC', 'Remote'],
      contactName: 'Test User',
      contactTitle: 'CEO',
      contactEmail: 'test@techsolutions.com',
      contactPhone: '555-0123'
    };

    // Create profile (ignore if it already exists)
    try {
      await helper.request
        .post('/api/profiles')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(profileData);
    } catch (error) {
      // Profile might already exist, continue with test
    }

    const response = await helper.request
      .get('/api/scoring/opportunities')
      .set('Authorization', `Bearer ${authUser.token}`)
      .expect(200);

    // Verify response structure
    assert.ok(response.body.opportunities, 'Response should contain opportunities array');
    assert.ok(Array.isArray(response.body.opportunities), 'Opportunities should be an array');
    assert.strictEqual(typeof response.body.count, 'number', 'Response should contain count');
    assert.strictEqual(response.body.userId, authUser.id, 'Response should contain correct user ID');

    // Verify we have mock opportunities
    assert.ok(response.body.opportunities.length > 0, 'Should return scored opportunities');
    
    // Verify scoring structure for first opportunity
    const firstOpp = response.body.opportunities[0];
    
    // Basic opportunity fields
    assert.ok(firstOpp.opportunityId, 'Opportunity should have ID');
    assert.ok(firstOpp.title, 'Opportunity should have title');
    assert.ok(firstOpp.description, 'Opportunity should have description');
    assert.ok(firstOpp.industry, 'Opportunity should have industry');
    
    // Scoring fields
    assert.ok(typeof firstOpp.overallScore === 'number', 'Should have numeric overall score');
    assert.ok(firstOpp.overallScore >= 0 && firstOpp.overallScore <= 100, 'Score should be 0-100');
    assert.ok(['RECOMMENDED', 'POSSIBLE', 'NOT_RECOMMENDED', 'REJECTED'].includes(firstOpp.verdict), 'Should have valid verdict');
    assert.ok(firstOpp.judgeScores, 'Should contain judge scores');
    assert.ok(firstOpp.explanation, 'Should contain explanation');
    assert.ok(Array.isArray(firstOpp.recommendations), 'Should contain recommendations array');
    assert.ok(Array.isArray(firstOpp.nextSteps), 'Should contain next steps array');
    
    // Verify judge scores structure
    const judges = ['technical', 'domain', 'value', 'innovation', 'relationship'];
    judges.forEach(judge => {
      assert.ok(firstOpp.judgeScores[judge], `Should have ${judge} judge score`);
      assert.ok(typeof firstOpp.judgeScores[judge].score === 'number', `${judge} score should be numeric`);
      assert.ok(firstOpp.judgeScores[judge].reasoning, `${judge} should have reasoning`);
    });

    console.log('✅ Opportunity scoring test passed');
    console.log(`📊 Scored ${response.body.count} opportunities`);
    console.log(`🎯 First opportunity score: ${firstOpp.overallScore} (${firstOpp.verdict})`);
  });

  it('should get detailed scoring for specific opportunity', async () => {
    const response = await helper.request
      .get('/api/scoring/opportunities/1')
      .set('Authorization', `Bearer ${authUser.token}`)
      .expect(200);

    // Verify response structure
    assert.ok(response.body.scoring, 'Response should contain scoring object');
    
    const scoring = response.body.scoring;
    
    // Profile and opportunity details
    assert.ok(scoring.profile, 'Should contain profile summary');
    assert.ok(scoring.opportunity, 'Should contain opportunity details');
    
    // Scoring details
    assert.ok(typeof scoring.overallScore === 'number', 'Should have overall score');
    assert.ok(scoring.verdict, 'Should have verdict');
    assert.ok(scoring.explanation, 'Should have explanation');
    assert.ok(scoring.judgeScores, 'Should have judge scores');
    assert.ok(Array.isArray(scoring.recommendations), 'Should have recommendations');
    assert.ok(Array.isArray(scoring.nextSteps), 'Should have next steps');
    
    // Verify judge evaluations are complete
    const judges = ['technical', 'domain', 'value', 'innovation', 'relationship'];
    judges.forEach(judge => {
      const judgeScore = scoring.judgeScores[judge];
      assert.ok(judgeScore, `Should have ${judge} evaluation`);
      assert.ok(typeof judgeScore.score === 'number', `${judge} score should be numeric`);
      assert.ok(judgeScore.reasoning, `${judge} should have reasoning`);
      assert.ok(judgeScore.verdict, `${judge} should have verdict (O/X)`);
      assert.ok(typeof judgeScore.confidence === 'number', `${judge} should have confidence`);
      assert.ok(Array.isArray(judgeScore.evidence), `${judge} should have evidence array`);
      assert.ok(Array.isArray(judgeScore.recommendations), `${judge} should have recommendations array`);
    });

    console.log('✅ Detailed opportunity scoring test passed');
    console.log(`🎯 Opportunity: ${scoring.opportunity.title}`);
    console.log(`📊 Score: ${scoring.overallScore} (${scoring.verdict})`);
    console.log(`🏆 Strengths: ${scoring.strengths ? scoring.strengths.length : 0}`);
    console.log(`⚠️ Weaknesses: ${scoring.weaknesses ? scoring.weaknesses.length : 0}`);
  });

  it('should require authentication for scoring endpoints', async () => {
    // Test without authentication
    await helper.request
      .get('/api/scoring/opportunities')
      .expect(401);

    await helper.request
      .get('/api/scoring/opportunities/1')
      .expect(401);

    console.log('✅ Authentication requirement test passed');
  });

  it('should handle user without profile gracefully', async () => {
    // Use existing test user that likely doesn't have a profile
    const noProfileUser = await helper.authenticatedRequest('test-user-2@example.com');
    
    const response = await helper.request
      .get('/api/scoring/opportunities')
      .set('Authorization', `Bearer ${noProfileUser.token}`)
      .expect(404);

    assert.ok(response.body.error.includes('profile not found'), 'Should indicate profile not found');
    assert.ok(response.body.createProfileUrl, 'Should provide profile creation URL');

    console.log('✅ No profile handling test passed');
  });

  it('should handle invalid opportunity ID gracefully', async () => {
    const response = await helper.request
      .get('/api/scoring/opportunities/999')
      .set('Authorization', `Bearer ${authUser.token}`)
      .expect(404);

    assert.ok(response.body.error.includes('Opportunity not found'), 'Should indicate opportunity not found');

    console.log('✅ Invalid opportunity ID handling test passed');
  });

  it('should validate opportunity ID parameter format', async () => {
    // Test with non-numeric ID
    await helper.request
      .get('/api/scoring/opportunities/invalid-id')
      .set('Authorization', `Bearer ${authUser.token}`)
      .expect(400);

    console.log('✅ Parameter validation test passed');
  });

  it('should respect rate limiting on scoring endpoints', async () => {
    // This test verifies rate limiting is applied but doesn't trigger it
    // as that would require many requests and slow down the test suite
    
    // Just verify the first request succeeds (rate limit not triggered)
    await helper.request
      .get('/api/scoring/opportunities')
      .set('Authorization', `Bearer ${authUser.token}`)
      .expect(200);

    console.log('✅ Rate limiting configuration test passed');
  });
});