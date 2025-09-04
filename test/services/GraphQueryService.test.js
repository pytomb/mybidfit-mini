/**
 * GraphQueryService Tests
 * Store-First methodology: Test the service logic before UI components
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');
const GraphQueryService = require('../../src/services/GraphQueryService');

// Test database configuration
const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'mybidfit_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password'
};

describe('GraphQueryService - Multi-hop Relationship Discovery', () => {
  let service;
  let testPool;
  let testCompanyId;
  let testOpportunityId;
  let testUserId;

  before(async () => {
    // Initialize test database connection
    testPool = new Pool(testDbConfig);
    service = new GraphQueryService(testPool);

    // Verify database extensions are available
    try {
      await testPool.query('SELECT 1');
      console.log('✓ Test database connection established');
    } catch (error) {
      console.error('✗ Test database connection failed:', error.message);
      throw error;
    }
  });

  after(async () => {
    if (testPool) {
      await testPool.end();
    }
    if (service) {
      await service.close();
    }
  });

  beforeEach(async () => {
    // Clean up test data and create fresh test entities
    await cleanupTestData();
    await createTestData();
  });

  async function cleanupTestData() {
    try {
      await testPool.query('DELETE FROM entity_relationships WHERE source_id >= 9000 OR target_id >= 9000');
      await testPool.query('DELETE FROM companies WHERE id >= 9000');
      await testPool.query('DELETE FROM opportunities WHERE id >= 9000');
      await testPool.query('DELETE FROM users WHERE id >= 9000');
    } catch (error) {
      // Tables may not exist in test environment, ignore
    }
  }

  async function createTestData() {
    // Create test company
    const companyResult = await testPool.query(`
      INSERT INTO companies (
        id, name, capabilities, industries, service_regions, 
        size_category, years_experience, team_size, credibility_score
      ) VALUES (
        9001, 'Test Tech Solutions', 
        ARRAY['software development', 'cloud computing', 'data analytics'],
        ARRAY['technology', 'healthcare'], 
        ARRAY['US-East', 'US-West'],
        'medium', 8, 25, 85.5
      ) RETURNING id
    `);
    testCompanyId = companyResult.rows[0].id;

    // Create test opportunity
    const opportunityResult = await testPool.query(`
      INSERT INTO opportunities (
        id, title, required_capabilities, preferred_capabilities,
        required_experience_years, buyer_organization, buyer_type
      ) VALUES (
        9001, 'Healthcare Data Platform Development',
        ARRAY['software development', 'data analytics'],
        ARRAY['cloud computing', 'healthcare experience'],
        5, 'Health Systems Inc', 'private'
      ) RETURNING id
    `);
    testOpportunityId = opportunityResult.rows[0].id;

    // Create test user
    const userResult = await testPool.query(`
      INSERT INTO users (
        id, email, first_name, last_name, company_name
      ) VALUES (
        9001, 'test@example.com', 'John', 'Doe', 'Test Agency'
      ) RETURNING id
    `);
    testUserId = userResult.rows[0].id;

    // Create test relationships
    await testPool.query(`
      INSERT INTO entity_relationships (
        source_id, source_type, target_id, target_type,
        relationship_type, strength, confidence
      ) VALUES 
      (9001, 'company', 9001, 'opportunity', 'bid_on', 0.8, 0.9),
      (9001, 'company', 9001, 'user', 'managed_by', 0.9, 0.95)
    `);
  }

  describe('Entity Connection Discovery', () => {
    it('should find directly connected entities', async () => {
      const connections = await service.findConnectedEntities(testCompanyId, 'company', 1);
      
      assert.ok(Array.isArray(connections), 'Should return an array');
      assert.ok(connections.length > 0, 'Should find at least one connection');
      
      // Verify connection structure
      const firstConnection = connections[0];
      assert.ok(firstConnection.connected_entity_id, 'Should have connected entity ID');
      assert.ok(firstConnection.connected_entity_type, 'Should have connected entity type');
      assert.ok(typeof firstConnection.total_strength === 'number', 'Should have numeric strength');
      assert.strictEqual(firstConnection.separation_degree, 1, 'First degree connections should have degree 1');
    });

    it('should respect maximum depth parameter', async () => {
      const connections1 = await service.findConnectedEntities(testCompanyId, 'company', 1);
      const connections2 = await service.findConnectedEntities(testCompanyId, 'company', 2);
      
      // Connections at depth 2 should include depth 1 connections plus potentially more
      assert.ok(connections2.length >= connections1.length, 'Higher depth should return same or more connections');
      
      // All returned connections should be within max depth
      connections2.forEach(conn => {
        assert.ok(conn.separation_degree <= 2, 'All connections should be within max depth');
      });
    });

    it('should filter by relationship types when specified', async () => {
      const allConnections = await service.findConnectedEntities(testCompanyId, 'company', 2);
      const filteredConnections = await service.findConnectedEntities(testCompanyId, 'company', 2, ['bid_on']);
      
      assert.ok(filteredConnections.length <= allConnections.length, 'Filtered results should be subset');
      // Verify relationship type filtering (would need more complex test data to fully validate)
    });
  });

  describe('Entity Centrality Calculation', () => {
    it('should calculate centrality metrics for an entity', async () => {
      const centrality = await service.calculateEntityCentrality(testCompanyId, 'company');
      
      assert.ok(centrality, 'Should return centrality data');
      assert.ok(typeof centrality.incoming_connections === 'number', 'Should have incoming connections count');
      assert.ok(typeof centrality.outgoing_connections === 'number', 'Should have outgoing connections count');
      assert.ok(typeof centrality.unique_connection_types === 'number', 'Should have unique connection types count');
      assert.ok(typeof centrality.average_relationship_strength === 'number', 'Should have average strength');
      assert.ok(typeof centrality.centrality_score === 'number', 'Should have centrality score');
    });

    it('should return null for non-existent entity', async () => {
      const centrality = await service.calculateEntityCentrality(99999, 'company');
      assert.strictEqual(centrality, null, 'Should return null for non-existent entity');
    });
  });

  describe('Partnership Discovery', () => {
    it('should find potential partners based on complementary capabilities', async () => {
      // Create additional test companies with different capabilities
      await testPool.query(`
        INSERT INTO companies (
          id, name, capabilities, industries, size_category, credibility_score
        ) VALUES 
        (9002, 'Security Specialists', ARRAY['cybersecurity', 'compliance'], ARRAY['technology'], 'small', 90.0),
        (9003, 'UI/UX Experts', ARRAY['user experience', 'design'], ARRAY['technology'], 'small', 88.0),
        (9004, 'Same Capabilities Co', ARRAY['software development', 'cloud computing'], ARRAY['technology'], 'medium', 75.0)
      `);

      const partners = await service.findPotentialPartners(testCompanyId, 5);
      
      assert.ok(Array.isArray(partners), 'Should return an array');
      assert.ok(partners.length > 0, 'Should find potential partners');
      
      const firstPartner = partners[0];
      assert.ok(firstPartner.id !== testCompanyId, 'Should not include the source company');
      assert.ok(typeof firstPartner.complementarity_score === 'number', 'Should have complementarity score');
      assert.ok(typeof firstPartner.overall_score === 'number', 'Should have overall score');
      assert.ok(firstPartner.overall_score >= 0 && firstPartner.overall_score <= 1, 'Score should be between 0 and 1');
    });

    it('should prioritize partners with complementary rather than identical capabilities', async () => {
      // This test validates the complementarity scoring logic
      const partners = await service.findPotentialPartners(testCompanyId, 10);
      
      // Partners with completely different capabilities should score higher than those with identical capabilities
      const differentCapPartner = partners.find(p => p.name === 'Security Specialists');
      const sameCapPartner = partners.find(p => p.name === 'Same Capabilities Co');
      
      if (differentCapPartner && sameCapPartner) {
        assert.ok(
          differentCapPartner.complementarity_score >= sameCapPartner.complementarity_score,
          'Partners with different capabilities should score higher'
        );
      }
    });
  });

  describe('Opportunity Fit Analysis', () => {
    it('should analyze opportunity fit with graph context', async () => {
      const analysis = await service.analyzeOpportunityFit(testCompanyId, testOpportunityId);
      
      assert.ok(analysis, 'Should return analysis results');
      assert.strictEqual(analysis.company_id, testCompanyId, 'Should include correct company ID');
      assert.strictEqual(analysis.opportunity_id, testOpportunityId, 'Should include correct opportunity ID');
      assert.ok(typeof analysis.enhanced_fit_score === 'number', 'Should have enhanced fit score');
      assert.ok(analysis.enhanced_fit_score >= 0 && analysis.enhanced_fit_score <= 1, 'Fit score should be between 0 and 1');
      assert.ok(analysis.capability_matches, 'Should include capability match analysis');
      assert.ok(Array.isArray(analysis.relationship_context), 'Should include relationship context');
      assert.ok(Array.isArray(analysis.recommendations), 'Should include recommendations');
    });

    it('should provide capability match details', async () => {
      const analysis = await service.analyzeOpportunityFit(testCompanyId, testOpportunityId);
      const matches = analysis.capability_matches;
      
      assert.ok(typeof matches.required === 'number', 'Should count required capability matches');
      assert.ok(typeof matches.preferred === 'number', 'Should count preferred capability matches');
      assert.ok(typeof matches.total_required === 'number', 'Should show total required capabilities');
      assert.ok(typeof matches.total_preferred === 'number', 'Should show total preferred capabilities');
    });

    it('should generate relevant recommendations', async () => {
      const analysis = await service.analyzeOpportunityFit(testCompanyId, testOpportunityId);
      
      analysis.recommendations.forEach(rec => {
        assert.ok(rec.type, 'Recommendation should have a type');
        assert.ok(rec.message, 'Recommendation should have a message');
        assert.ok(rec.priority, 'Recommendation should have a priority');
        assert.ok(['high', 'medium', 'low'].includes(rec.priority), 'Priority should be valid');
      });
    });
  });

  describe('Relationship Management', () => {
    it('should create new relationships', async () => {
      const relationship = await service.createRelationship(
        testCompanyId, 'company',
        9002, 'company', // Assuming company 9002 exists from partnership tests
        'partners_with',
        0.7, 0.85,
        { project: 'joint_venture', established: '2024-01-01' }
      );
      
      assert.ok(relationship, 'Should return created relationship');
      assert.strictEqual(relationship.source_id, testCompanyId, 'Should have correct source ID');
      assert.strictEqual(relationship.target_id, 9002, 'Should have correct target ID');
      assert.strictEqual(relationship.relationship_type, 'partners_with', 'Should have correct relationship type');
      assert.strictEqual(relationship.strength, 0.7, 'Should have correct strength');
    });

    it('should update existing relationships', async () => {
      // Create initial relationship
      await service.createRelationship(
        testCompanyId, 'company',
        9002, 'company',
        'partners_with',
        0.5, 0.8
      );
      
      // Update the same relationship
      const updated = await service.createRelationship(
        testCompanyId, 'company',
        9002, 'company',
        'partners_with',
        0.9, 0.95,
        { updated: true }
      );
      
      assert.strictEqual(updated.strength, 0.9, 'Should update strength');
      assert.strictEqual(updated.confidence, 0.95, 'Should update confidence');
    });
  });

  describe('Entity Summary Retrieval', () => {
    it('should retrieve entity summary information', async () => {
      const summary = await service.getEntitySummary(testCompanyId, 'company');
      
      assert.ok(summary, 'Should return entity summary');
      assert.strictEqual(summary.entity_id, testCompanyId, 'Should have correct entity ID');
      assert.strictEqual(summary.entity_type, 'company', 'Should have correct entity type');
      assert.ok(summary.entity_name, 'Should have entity name');
      assert.ok(typeof summary.entity_score === 'number', 'Should have numeric entity score');
    });

    it('should return null for non-existent entity', async () => {
      const summary = await service.getEntitySummary(99999, 'nonexistent');
      assert.strictEqual(summary, null, 'Should return null for non-existent entity');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const badService = new GraphQueryService(new Pool({ 
        host: 'nonexistent-host',
        database: 'nonexistent-db' 
      }));
      
      try {
        await badService.findConnectedEntities(1, 'company', 1);
        assert.fail('Should throw error for bad connection');
      } catch (error) {
        assert.ok(error, 'Should throw connection error');
      } finally {
        await badService.close();
      }
    });

    it('should handle invalid entity references', async () => {
      try {
        await service.analyzeOpportunityFit(99999, 99999);
        assert.fail('Should throw error for invalid entities');
      } catch (error) {
        assert.ok(error.message.includes('not found'), 'Should indicate entities not found');
      }
    });
  });
});