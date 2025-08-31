const { test, describe } = require('node:test');
const assert = require('node:assert');

// Import the service (will work with mock data)
const { OpportunityScoringService } = require('../../src/services/opportunityScoring');

describe('Panel of Judges Algorithm (Algorithm 3)', () => {
  let opportunityScoring;

  test('should initialize Panel of Judges with 5 specialized judges', () => {
    opportunityScoring = new OpportunityScoringService();
    
    assert.ok(opportunityScoring.judges, 'Should have judges property');
    
    // Verify the 5 specialized judges are present
    const expectedJudges = ['technical', 'domain', 'value', 'innovation', 'relationship'];
    for (const judgeName of expectedJudges) {
      assert.ok(opportunityScoring.judges[judgeName], `Should have ${judgeName} judge`);
    }
  });

  test('should provide explainable AI scoring with transparent reasoning', async () => {
    opportunityScoring = new OpportunityScoringService();
    
    const mockSupplier = {
      companyName: 'Tech Solutions Inc',
      capabilities: ['Web Development', 'Mobile Apps', 'Cloud Services'],
      certifications: ['ISO 9001', 'SOC 2'],
      pastPerformance: {
        successRate: 0.95,
        onTimeDelivery: 0.92,
        clientSatisfaction: 4.7
      }
    };

    const mockOpportunity = {
      title: 'Software Development Services',
      description: 'Need custom software development for government portal',
      requirements: ['JavaScript', 'Node.js', 'React', 'Security Clearance'],
      budget: 500000,
      timeline: '12 months'
    };

    const result = await opportunityScoring.scoreOpportunity(mockSupplier, mockOpportunity);

    // Test core innovation: Panel of Judges with explainable scoring
    assert.ok(result.overallScore, 'Should provide overall score');
    assert.ok(typeof result.overallScore === 'number', 'Overall score should be numeric');
    assert.ok(result.overallScore >= 0 && result.overallScore <= 10, 'Score should be between 0-10');

    assert.ok(result.judgeScores, 'Should include individual judge scores');
    assert.strictEqual(Object.keys(result.judgeScores).length, 5, 'Should have 5 specialized judges');
    
    // Verify each judge provides explainable reasoning
    for (const [judgeName, judgeResult] of Object.entries(result.judgeScores)) {
      assert.ok(judgeResult.score, `${judgeName} judge should provide score`);
      assert.ok(judgeResult.reasoning, `${judgeName} judge should provide reasoning`);
      assert.ok(judgeResult.evidence, `${judgeName} judge should provide evidence`);
      assert.ok(typeof judgeResult.score === 'number', `${judgeName} score should be numeric`);
    }

    assert.ok(result.explanation, 'Should provide overall explanation');
    assert.ok(result.recommendations, 'Should include actionable recommendations');
    assert.ok(Array.isArray(result.recommendations), 'Recommendations should be an array');
    assert.ok(result.recommendations.length > 0, 'Should provide at least one recommendation');
  });

  test('should validate bias mitigation through multiple judge perspectives', async () => {
    opportunityScoring = new OpportunityScoringService();
    
    const mockSupplier = {
      companyName: 'Specialized AI Company',
      capabilities: ['Machine Learning', 'AI Research', 'Data Science'],
      certifications: ['AI Ethics Certification'],
      pastPerformance: {
        successRate: 0.98,
        onTimeDelivery: 0.85,
        clientSatisfaction: 4.9
      }
    };

    const mockOpportunity = {
      title: 'AI-Powered Analytics Platform',
      description: 'Building next-generation AI analytics',
      requirements: ['Machine Learning', 'Python', 'TensorFlow', 'Innovation'],
      budget: 1000000,
      timeline: '18 months'
    };

    const result = await opportunityScoring.scoreOpportunity(mockSupplier, mockOpportunity);

    // Test bias mitigation: no single judge should dominate
    const judgeScores = Object.values(result.judgeScores).map(j => j.score);
    const maxScore = Math.max(...judgeScores);
    const minScore = Math.min(...judgeScores);
    const scoreRange = maxScore - minScore;

    // Ensure diverse perspectives (scores shouldn't be identical or too similar)
    assert.ok(scoreRange > 0.5, 'Judges should provide diverse perspectives, not identical scores');

    // Verify different judges emphasize different aspects
    const technicalScore = result.judgeScores.technical.score;
    const innovationScore = result.judgeScores.innovation.score;
    const relationshipScore = result.judgeScores.relationship.score;

    // Innovation judge should rate AI company higher on innovation than relationship
    assert.ok(innovationScore > relationshipScore, 'Innovation judge should value innovation aspects more');

    // Each judge should provide distinct reasoning
    const reasonings = Object.values(result.judgeScores).map(j => j.reasoning);
    const uniqueReasonings = new Set(reasonings);
    assert.strictEqual(reasonings.length, uniqueReasonings.size, 'Each judge should provide unique reasoning');
  });

  test('should handle edge cases and invalid inputs gracefully', async () => {
    opportunityScoring = new OpportunityScoringService();

    // Test with minimal supplier data
    const minimalSupplier = { companyName: 'Minimal Company' };
    const minimalOpportunity = { title: 'Basic Opportunity' };

    const result = await opportunityScoring.scoreOpportunity(minimalSupplier, minimalOpportunity);
    
    assert.ok(result.overallScore !== null, 'Should handle minimal data');
    assert.ok(result.judgeScores, 'Should still provide judge scores for minimal data');
    assert.ok(result.explanation, 'Should provide explanation even for minimal data');
    
    // Scores should be lower for minimal data but still valid
    assert.ok(result.overallScore >= 0, 'Minimal data should result in low but valid score');
  });

  test('should provide consistent scoring for identical inputs', async () => {
    opportunityScoring = new OpportunityScoringService();
    
    const supplier = {
      companyName: 'Consistent Test Company',
      capabilities: ['Software Development'],
      certifications: ['ISO 9001']
    };

    const opportunity = {
      title: 'Consistent Test Opportunity',
      requirements: ['Software Development']
    };

    // Run scoring multiple times
    const result1 = await opportunityScoring.scoreOpportunity(supplier, opportunity);
    const result2 = await opportunityScoring.scoreOpportunity(supplier, opportunity);

    // Scores should be consistent for identical inputs
    assert.strictEqual(result1.overallScore, result2.overallScore, 'Identical inputs should produce consistent scores');
    
    for (const judgeName of Object.keys(result1.judgeScores)) {
      assert.strictEqual(
        result1.judgeScores[judgeName].score,
        result2.judgeScores[judgeName].score,
        `${judgeName} judge should provide consistent scores`
      );
    }
  });

  test('should complete scoring within performance requirements', async () => {
    opportunityScoring = new OpportunityScoringService();
    
    const complexSupplier = {
      companyName: 'Complex Enterprise Solutions',
      capabilities: Array(50).fill().map((_, i) => `Capability ${i + 1}`),
      certifications: Array(20).fill().map((_, i) => `Certification ${i + 1}`),
      pastPerformance: {
        successRate: 0.95,
        onTimeDelivery: 0.92,
        clientSatisfaction: 4.7
      }
    };

    const complexOpportunity = {
      title: 'Large Scale Government Contract',
      description: 'Complex multi-year development project with extensive requirements',
      requirements: Array(30).fill().map((_, i) => `Requirement ${i + 1}`),
      budget: 5000000,
      timeline: '36 months'
    };

    const startTime = Date.now();
    const result = await opportunityScoring.scoreOpportunity(complexSupplier, complexOpportunity);
    const executionTime = Date.now() - startTime;

    // Performance requirement: should complete within 2 seconds even for complex data
    assert.ok(executionTime < 2000, `Scoring should complete within 2 seconds, took ${executionTime}ms`);
    assert.ok(result.overallScore, 'Should still return valid results for complex data');
  });
});