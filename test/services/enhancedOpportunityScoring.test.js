/**
 * Enhanced Opportunity Scoring Service Tests
 * Store-First methodology: Test enhanced graph-aware scoring
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');
const { EnhancedOpportunityScoringService } = require('../../src/services/enhancedOpportunityScoring');

const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'mybidfit_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password'
};

describe('Enhanced Opportunity Scoring Service - Graph Intelligence', () => {
  let service;
  let testPool;
  let testCompanyId;
  let testOpportunityId;
  let testPartnerCompanyId;

  before(async () => {
    testPool = new Pool(testDbConfig);
    service = new EnhancedOpportunityScoringService();
    
    try {
      await testPool.query('SELECT 1');
      console.log('✓ Enhanced scoring test database connection established');
    } catch (error) {
      console.error('✗ Enhanced scoring test database connection failed:', error.message);
      throw error;
    }
  });

  after(async () => {
    if (testPool) await testPool.end();
    if (service) await service.graphService.close();
  });

  beforeEach(async () => {
    await cleanupTestData();
    await createEnhancedTestData();
  });

  async function cleanupTestData() {
    try {
      await testPool.query('DELETE FROM entity_relationships WHERE source_id >= 9000 OR target_id >= 9000');
      await testPool.query('DELETE FROM scoring_results WHERE company_id >= 9000 OR opportunity_id >= 9000');
      await testPool.query('DELETE FROM companies WHERE id >= 9000');
      await testPool.query('DELETE FROM opportunities WHERE id >= 9000');
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  async function createEnhancedTestData() {
    // Create test companies with relationships
    const companyResult = await testPool.query(`
      INSERT INTO companies (
        id, name, capabilities, industries, service_regions, 
        size_category, years_experience, team_size, credibility_score,
        certifications, technologies
      ) VALUES (
        9001, 'Enhanced Test Solutions', 
        ARRAY['software development', 'data analytics', 'AI research'],
        ARRAY['technology', 'healthcare'], 
        ARRAY['US-East', 'US-West'],
        'medium', 10, 35, 88.5,
        ARRAY['ISO27001', 'SOC2'], ARRAY['machine learning', 'cloud computing']
      ) RETURNING id
    `);
    testCompanyId = companyResult.rows[0].id;

    // Create partner company
    const partnerResult = await testPool.query(`
      INSERT INTO companies (
        id, name, capabilities, industries, service_regions,
        size_category, years_experience, team_size, credibility_score
      ) VALUES (
        9002, 'Complementary Partner Co',
        ARRAY['cybersecurity', 'compliance', 'risk management'],
        ARRAY['technology', 'finance'],
        ARRAY['US-Central', 'Canada'],
        'small', 8, 20, 92.0
      ) RETURNING id
    `);
    testPartnerCompanyId = partnerResult.rows[0].id;

    // Create opportunity requiring combined capabilities
    const opportunityResult = await testPool.query(`
      INSERT INTO opportunities (
        id, title, required_capabilities, preferred_capabilities,
        required_experience_years, buyer_organization, buyer_type, industry,
        required_certifications
      ) VALUES (
        9001, 'Secure AI Healthcare Platform',
        ARRAY['software development', 'data analytics', 'cybersecurity'],
        ARRAY['AI research', 'compliance', 'healthcare experience'],
        8, 'MedTech Systems Inc', 'private', 'healthcare',
        ARRAY['ISO27001', 'HIPAA']
      ) RETURNING id
    `);
    testOpportunityId = opportunityResult.rows[0].id;

    // Create strategic relationships
    await testPool.query(`
      INSERT INTO entity_relationships (
        source_id, source_type, target_id, target_type,
        relationship_type, strength, confidence, metadata
      ) VALUES 
      (9001, 'company', 9002, 'company', 'partners_with', 0.85, 0.9, '{"project_history": "3_successful_collaborations"}'),
      (9001, 'company', 9001, 'opportunity', 'similar_experience', 0.75, 0.8, '{"industry_match": "healthcare"}'),
      (9002, 'company', 9001, 'opportunity', 'capability_match', 0.7, 0.85, '{"security_expertise": true}')
    `);
  }

  describe('Enhanced Scoring Integration', () => {
    it('should provide enhanced scoring results with graph context', async () => {
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      // Verify enhanced results structure
      assert.ok(result, 'Should return enhanced results');
      assert.ok(typeof result.overallScore === 'number', 'Should have enhanced overall score');
      assert.ok(typeof result.basicScore === 'number', 'Should include basic score for comparison');
      assert.ok(typeof result.graphEnhancementBonus === 'number', 'Should calculate enhancement bonus');
      assert.ok(Array.isArray(result.relationshipInsights), 'Should provide relationship insights');
      assert.ok(Array.isArray(result.relationshipContext), 'Should include relationship context');
      assert.ok(Array.isArray(result.partnershipOpportunities), 'Should include partnership opportunities');
    });

    it('should show improved scores when graph relationships support the match', async () => {
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      // Enhanced score should be higher than basic score when partnerships help
      assert.ok(result.overallScore >= result.basicScore, 'Enhanced score should not be lower than basic');
      
      if (result.partnershipOpportunities.length > 0) {
        assert.ok(
          result.overallScore > result.basicScore, 
          'Enhanced score should improve when partnerships are available'
        );
        assert.ok(
          result.graphEnhancementBonus > 0,
          'Should have positive graph enhancement bonus with partnerships'
        );
      }
    });

    it('should provide graph metrics for network analysis', async () => {
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      assert.ok(result.graphMetrics, 'Should include graph metrics');
      assert.ok(typeof result.graphMetrics.totalRelationships === 'number', 'Should count total relationships');
      assert.ok(typeof result.graphMetrics.strongRelationships === 'number', 'Should count strong relationships');
      assert.ok(typeof result.graphMetrics.partnershipOptions === 'number', 'Should count partnership options');
      assert.ok(result.graphMetrics.networkCentrality, 'Should include network centrality');
    });
  });

  describe('Graph-Enhanced Judges', () => {
    it('should use graph data in relationship judge evaluation', async () => {
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      const relationshipJudge = result.enhancedJudgeScores?.relationship;
      assert.ok(relationshipJudge, 'Should have relationship judge evaluation');
      assert.ok(typeof relationshipJudge.score === 'number', 'Should have relationship score');
      assert.ok(relationshipJudge.confidence > 0.8, 'Should have high confidence with graph data');
      
      // Should mention graph analysis in reasoning
      assert.ok(
        relationshipJudge.reasoning.toLowerCase().includes('graph') ||
        relationshipJudge.reasoning.toLowerCase().includes('network'),
        'Should reference graph/network analysis in reasoning'
      );
    });

    it('should detect partnership opportunities in technical evaluation', async () => {
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      // Technical judge should identify cybersecurity gap that partner can fill
      const technicalJudge = result.enhancedJudgeScores?.technical;
      if (technicalJudge && technicalJudge.graphEnhancements) {
        const hasPartnershipEnhancement = technicalJudge.graphEnhancements.enhancements.some(e =>
          e.toLowerCase().includes('partner') || e.toLowerCase().includes('covers')
        );
        
        if (result.partnershipOpportunities.length > 0) {
          assert.ok(hasPartnershipEnhancement, 'Should identify partnership opportunities for missing capabilities');
        }
      }
    });
  });

  describe('Relationship Insights Generation', () => {
    it('should generate relevant relationship insights', async () => {
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      assert.ok(Array.isArray(result.relationshipInsights), 'Should provide relationship insights');
      
      result.relationshipInsights.forEach(insight => {
        assert.ok(insight.type, 'Insight should have a type');
        assert.ok(insight.title, 'Insight should have a title');
        assert.ok(insight.description, 'Insight should have a description');
        assert.ok(insight.impact, 'Insight should indicate impact');
        assert.ok(['positive', 'negative', 'neutral'].includes(insight.impact), 'Impact should be valid');
      });
    });

    it('should identify partnership opportunities in insights', async () => {
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      const partnershipInsight = result.relationshipInsights.find(i => 
        i.type === 'partnership_opportunity'
      );
      
      if (result.partnershipOpportunities.length > 0) {
        assert.ok(partnershipInsight, 'Should identify partnership opportunities when available');
        assert.ok(partnershipInsight.partnerId, 'Partnership insight should include partner ID');
        assert.strictEqual(partnershipInsight.impact, 'positive', 'Partnership should have positive impact');
      }
    });
  });

  describe('Enhanced Recommendations', () => {
    it('should generate graph-enhanced recommendations', async () => {
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      assert.ok(Array.isArray(result.enhancedRecommendations), 'Should provide enhanced recommendations');
      
      result.enhancedRecommendations.forEach(rec => {
        assert.ok(rec.type, 'Recommendation should have a type');
        assert.ok(rec.priority, 'Recommendation should have a priority');
        assert.ok(['high', 'medium', 'low'].includes(rec.priority), 'Priority should be valid');
        assert.ok(rec.title, 'Recommendation should have a title');
        assert.ok(rec.description, 'Recommendation should have a description');
      });
    });

    it('should suggest strategic partnerships when appropriate', async () => {
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      const strategicPartnership = result.enhancedRecommendations.find(r => 
        r.type === 'strategic_partnership'
      );
      
      if (result.partnershipOpportunities.length > 0) {
        assert.ok(strategicPartnership, 'Should suggest strategic partnerships when available');
        assert.ok(strategicPartnership.partnerId, 'Partnership recommendation should include partner ID');
        assert.ok(strategicPartnership.expectedImpact, 'Should indicate expected impact');
      }
    });

    it('should suggest network leverage when strong connections exist', async () => {
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      // If we have strong network connections, should suggest leveraging them
      const strongConnections = result.relationshipContext.filter(r => r.total_strength > 0.7);
      
      if (strongConnections.length > 0) {
        const networkRec = result.enhancedRecommendations.find(r => 
          r.type === 'network_leverage'
        );
        
        assert.ok(networkRec, 'Should suggest network leverage when strong connections exist');
        assert.strictEqual(networkRec.priority, 'medium', 'Network leverage should be medium priority');
      }
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle missing graph relationships gracefully', async () => {
      // Create isolated company with no relationships
      const isolatedCompany = await testPool.query(`
        INSERT INTO companies (
          id, name, capabilities, industries, years_experience
        ) VALUES (
          9999, 'Isolated Company', ARRAY['basic service'], ARRAY['other'], 2
        ) RETURNING id
      `);

      const result = await service.scoreOpportunityFitEnhanced(
        isolatedCompany.rows[0].id, testOpportunityId
      );
      
      // Should still provide results even without relationships
      assert.ok(result, 'Should handle companies with no relationships');
      assert.ok(typeof result.overallScore === 'number', 'Should still calculate score');
      assert.strictEqual(result.graphEnhancementBonus, 0, 'Should have zero enhancement bonus with no relationships');
      assert.strictEqual(result.relationshipContext.length, 0, 'Should have empty relationship context');
    });

    it('should not degrade basic scoring performance', async () => {
      // Enhanced scoring should not perform worse than basic scoring
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      assert.ok(result.overallScore >= result.basicScore, 'Enhanced score should not be worse than basic');
      assert.ok(result.graphEnhancementBonus >= 0, 'Enhancement bonus should not be negative');
    });

    it('should handle database connection errors', async () => {
      // This would test error handling for graph service failures
      // In a real implementation, you might mock the graph service to throw errors
      try {
        const result = await service.scoreOpportunityFitEnhanced(99999, 99999);
        assert.fail('Should throw error for non-existent entities');
      } catch (error) {
        assert.ok(error.message.includes('not found'), 'Should provide meaningful error message');
      }
    });
  });

  describe('Graph Context Storage', () => {
    it('should store enhanced results with graph metadata', async () => {
      const result = await service.scoreOpportunityFitEnhanced(testCompanyId, testOpportunityId);
      
      // Check that enhanced results were stored
      const storedResult = await testPool.query(`
        SELECT supporting_evidence, analysis_version
        FROM scoring_results 
        WHERE company_id = $1 AND opportunity_id = $2
      `, [testCompanyId, testOpportunityId]);
      
      assert.ok(storedResult.rows.length > 0, 'Should store enhanced results');
      assert.strictEqual(storedResult.rows[0].analysis_version, 'enhanced_v1', 'Should mark as enhanced version');
      
      const evidence = JSON.parse(storedResult.rows[0].supporting_evidence);
      assert.ok(typeof evidence.basicScore === 'number', 'Should store basic score');
      assert.ok(typeof evidence.enhancedScore === 'number', 'Should store enhanced score');
      assert.ok(typeof evidence.graphEnhancementBonus === 'number', 'Should store enhancement bonus');
    });
  });
});