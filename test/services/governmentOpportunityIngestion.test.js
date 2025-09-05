/**
 * Government Opportunity Ingestion Service Tests
 * Store-First methodology: Test ingestion, deduplication, and scoring workflows
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');
const GovernmentOpportunityIngestionService = require('../../src/services/governmentOpportunityIngestionService');
const OpportunityDeduplicationService = require('../../src/services/opportunityDeduplicationService');

const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'mybidfit',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password'
};

describe('Government Opportunity Ingestion Service', () => {
  let ingestionService;
  let deduplicationService;
  let testPool;
  let testCompanyId;

  before(async () => {
    testPool = new Pool(testDbConfig);
    ingestionService = new GovernmentOpportunityIngestionService();
    deduplicationService = new OpportunityDeduplicationService();
    
    try {
      await testPool.query('SELECT 1');
      console.log('✓ Government opportunities test database connection established');
      
      // Ensure government opportunity tables exist
      await ensureGovernmentTables();
    } catch (error) {
      console.error('✗ Government opportunities test database connection failed:', error.message);
      throw error;
    }
  });

  after(async () => {
    if (testPool) await testPool.end();
  });

  beforeEach(async () => {
    await cleanupTestData();
    await createTestData();
  });

  async function ensureGovernmentTables() {
    try {
      // Check if gov_opportunities table exists
      const tableCheck = await testPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'gov_opportunities'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('⚠️ Government opportunity tables not found. Run migrations first.');
        // You could run the migrations here if needed
      }
    } catch (error) {
      console.error('Error checking government tables:', error.message);
    }
  }

  async function cleanupTestData() {
    try {
      await testPool.query('DELETE FROM watchlist_items WHERE id IS NOT NULL');
      await testPool.query('DELETE FROM opportunity_watchlists WHERE id IS NOT NULL');
      await testPool.query('DELETE FROM gov_opportunity_feedback WHERE id IS NOT NULL');
      await testPool.query('DELETE FROM gov_opportunity_scores WHERE opportunity_id IS NOT NULL');
      await testPool.query('DELETE FROM gov_opportunities WHERE id IS NOT NULL');
      await testPool.query('DELETE FROM ideal_project_templates WHERE id IS NOT NULL');
      await testPool.query('DELETE FROM company_profiles WHERE id >= 99000');
    } catch (error) {
      console.error('Cleanup error (may be normal if tables do not exist yet):', error.message);
    }
  }

  async function createTestData() {
    try {
      // Create test company
      const companyResult = await testPool.query(`
        INSERT INTO company_profiles (
          id, company_name, duns_number, sam_registration, naics_codes
        ) VALUES (
          99001, 
          'Test Government Contractor', 
          '123456789', 
          true,
          '["541511", "541512"]'::jsonb
        ) RETURNING id
      `);
      testCompanyId = companyResult.rows[0].id;
    } catch (error) {
      console.error('Error creating test data:', error.message);
    }
  }

  describe('Opportunity Ingestion', () => {
    it('should ingest a new government opportunity', async () => {
      const mockOpportunity = {
        noticeId: 'TEST-NOTICE-001',
        title: 'IT Services Contract',
        solicitationNumber: 'SOL-2024-001',
        agency: 'Department of Defense',
        naicsCodes: ['541511', '541512'],
        pscCodes: ['D302', 'D399'],
        postedDate: '2024-01-15T00:00:00Z',
        responseDeadline: '2024-02-15T00:00:00Z',
        description: 'Seeking IT services for modernization project',
        type: 'Combined Synopsis/Solicitation',
        setAside: '8(a)',
        placeOfPerformance: {
          city: 'Washington',
          state: 'DC',
          country: 'USA'
        }
      };

      const result = await ingestionService.ingestOpportunities({
        opportunities: [mockOpportunity],
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      assert.ok(result, 'Should return ingestion result');
      assert.equal(result.processed, 1, 'Should process 1 opportunity');
      assert.equal(result.stored, 1, 'Should store 1 opportunity');
      assert.equal(result.errors.length, 0, 'Should have no errors');
      
      // Verify opportunity was stored in database
      const dbResult = await testPool.query(
        'SELECT * FROM gov_opportunities WHERE solicitation_number = $1',
        ['SOL-2024-001']
      );
      
      assert.equal(dbResult.rows.length, 1, 'Should find opportunity in database');
      assert.equal(dbResult.rows[0].title, 'IT Services Contract');
      assert.equal(dbResult.rows[0].agency, 'Department of Defense');
    });

    it('should handle batch ingestion with multiple opportunities', async () => {
      const mockOpportunities = [
        {
          noticeId: 'TEST-NOTICE-002',
          title: 'Cloud Services',
          solicitationNumber: 'SOL-2024-002',
          agency: 'Department of Energy',
          naicsCodes: ['518210'],
          responseDeadline: '2024-03-01T00:00:00Z'
        },
        {
          noticeId: 'TEST-NOTICE-003',
          title: 'Cybersecurity Assessment',
          solicitationNumber: 'SOL-2024-003',
          agency: 'Department of Homeland Security',
          naicsCodes: ['541519'],
          responseDeadline: '2024-03-15T00:00:00Z'
        },
        {
          noticeId: 'TEST-NOTICE-004',
          title: 'Software Development',
          solicitationNumber: 'SOL-2024-004',
          agency: 'NASA',
          naicsCodes: ['541511'],
          responseDeadline: '2024-04-01T00:00:00Z'
        }
      ];

      const result = await ingestionService.ingestOpportunities({
        opportunities: mockOpportunities,
        source: 'SAM.gov',
        companyId: testCompanyId,
        batchSize: 2  // Test batch processing
      });

      assert.ok(result, 'Should return batch ingestion result');
      assert.equal(result.processed, 3, 'Should process 3 opportunities');
      assert.equal(result.stored, 3, 'Should store 3 opportunities');
      
      // Verify all opportunities were stored
      const dbResult = await testPool.query(
        'SELECT COUNT(*) as count FROM gov_opportunities WHERE solicitation_number LIKE $1',
        ['SOL-2024-%']
      );
      
      assert.equal(dbResult.rows[0].count, 3, 'Should find all 3 opportunities in database');
    });

    it('should normalize opportunity data during ingestion', async () => {
      const mockOpportunity = {
        noticeId: 'TEST-NOTICE-005',
        title: '  IT Support Services  ',  // Extra whitespace
        solicitationNumber: 'sol-2024-005',  // Lowercase
        agency: 'DEPARTMENT OF DEFENSE',  // All caps
        naicsCodes: ['541511', '541511', '541512'],  // Duplicate
        responseDeadline: '2024-02-15',  // Date without time
        description: 'Test description with\nmultiple\nlines'
      };

      const result = await ingestionService.ingestOpportunities({
        opportunities: [mockOpportunity],
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      assert.equal(result.stored, 1, 'Should store normalized opportunity');
      
      const dbResult = await testPool.query(
        'SELECT * FROM gov_opportunities WHERE solicitation_number = $1',
        ['SOL-2024-005']  // Should be normalized to uppercase
      );
      
      assert.equal(dbResult.rows.length, 1, 'Should find normalized opportunity');
      assert.equal(dbResult.rows[0].title, 'IT Support Services', 'Title should be trimmed');
      assert.equal(dbResult.rows[0].agency, 'Department Of Defense', 'Agency should be title case');
      
      const naicsCodes = dbResult.rows[0].naics_codes;
      assert.equal(naicsCodes.length, 2, 'Should deduplicate NAICS codes');
      assert.ok(naicsCodes.includes('541511'), 'Should include NAICS 541511');
      assert.ok(naicsCodes.includes('541512'), 'Should include NAICS 541512');
    });

    it('should handle ingestion errors gracefully', async () => {
      const invalidOpportunities = [
        {
          // Missing required fields
          noticeId: 'TEST-NOTICE-ERR-1'
        },
        {
          noticeId: 'TEST-NOTICE-ERR-2',
          title: 'Valid Opportunity',
          solicitationNumber: 'SOL-2024-ERR-2',
          agency: 'Test Agency'
        },
        {
          // Invalid date format
          noticeId: 'TEST-NOTICE-ERR-3',
          title: 'Invalid Date Opportunity',
          solicitationNumber: 'SOL-2024-ERR-3',
          agency: 'Test Agency',
          responseDeadline: 'not-a-date'
        }
      ];

      const result = await ingestionService.ingestOpportunities({
        opportunities: invalidOpportunities,
        source: 'SAM.gov',
        companyId: testCompanyId,
        continueOnError: true
      });

      assert.ok(result, 'Should return result despite errors');
      assert.equal(result.processed, 3, 'Should attempt to process all opportunities');
      assert.ok(result.errors.length > 0, 'Should report errors');
      assert.equal(result.stored, 1, 'Should store valid opportunities');
    });
  });

  describe('Opportunity Scoring', () => {
    it('should score opportunities using Panel of Judges', async () => {
      // First, ingest an opportunity
      const mockOpportunity = {
        noticeId: 'TEST-NOTICE-SCORE-1',
        title: 'Perfect Match IT Services',
        solicitationNumber: 'SOL-2024-SCORE-1',
        agency: 'Department of Defense',
        naicsCodes: ['541511'],  // Matches test company
        setAside: '8(a)',
        value_estimated: 500000,
        responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()  // 30 days from now
      };

      const ingestionResult = await ingestionService.ingestOpportunities({
        opportunities: [mockOpportunity],
        source: 'SAM.gov',
        companyId: testCompanyId,
        enableScoring: true
      });

      assert.equal(ingestionResult.stored, 1, 'Should store opportunity');
      
      // Check that scoring was performed
      const scoreResult = await testPool.query(`
        SELECT * FROM gov_opportunity_scores 
        WHERE opportunity_id = (
          SELECT id FROM gov_opportunities WHERE solicitation_number = $1
        )
      `, ['SOL-2024-SCORE-1']);
      
      assert.equal(scoreResult.rows.length, 1, 'Should have scoring record');
      assert.ok(scoreResult.rows[0].overall_score >= 0, 'Should have overall score');
      assert.ok(scoreResult.rows[0].overall_score <= 100, 'Score should be between 0-100');
      assert.ok(scoreResult.rows[0].judge_scores, 'Should have individual judge scores');
    });

    it('should update scores when opportunity is updated', async () => {
      // Create initial opportunity
      const initialOpportunity = {
        noticeId: 'TEST-NOTICE-UPDATE-1',
        title: 'Initial Title',
        solicitationNumber: 'SOL-2024-UPDATE-1',
        agency: 'Test Agency',
        value_estimated: 100000
      };

      await ingestionService.ingestOpportunities({
        opportunities: [initialOpportunity],
        source: 'SAM.gov',
        companyId: testCompanyId,
        enableScoring: true
      });

      // Get initial score
      const initialScore = await testPool.query(`
        SELECT overall_score FROM gov_opportunity_scores 
        WHERE opportunity_id = (
          SELECT id FROM gov_opportunities WHERE solicitation_number = $1
        )
      `, ['SOL-2024-UPDATE-1']);

      // Update opportunity with better matching criteria
      const updatedOpportunity = {
        ...initialOpportunity,
        title: 'Perfect Match for Our Company',
        naicsCodes: ['541511'],  // Now matches company
        setAside: '8(a)',  // Added set-aside
        value_estimated: 500000  // Higher value
      };

      await ingestionService.ingestOpportunities({
        opportunities: [updatedOpportunity],
        source: 'SAM.gov',
        companyId: testCompanyId,
        enableScoring: true,
        updateExisting: true
      });

      // Get updated score
      const updatedScore = await testPool.query(`
        SELECT overall_score FROM gov_opportunity_scores 
        WHERE opportunity_id = (
          SELECT id FROM gov_opportunities WHERE solicitation_number = $1
        )
        ORDER BY created_at DESC LIMIT 1
      `, ['SOL-2024-UPDATE-1']);

      assert.ok(updatedScore.rows[0].overall_score > initialScore.rows[0].overall_score, 
        'Updated opportunity should have higher score');
    });
  });

  describe('Opportunity Deduplication', () => {
    it('should detect duplicate opportunities', async () => {
      const originalOpportunity = {
        noticeId: 'TEST-NOTICE-DUP-1',
        title: 'IT Services Contract',
        solicitationNumber: 'SOL-2024-DUP-1',
        agency: 'Department of Defense',
        responseDeadline: '2024-03-01T00:00:00Z'
      };

      // Ingest original
      await ingestionService.ingestOpportunities({
        opportunities: [originalOpportunity],
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      // Try to ingest duplicate with slightly different data
      const duplicateOpportunity = {
        noticeId: 'TEST-NOTICE-DUP-2',  // Different notice ID
        title: 'IT Services Contract',  // Same title
        solicitationNumber: 'SOL-2024-DUP-1',  // Same solicitation number
        agency: 'DoD',  // Different agency format
        responseDeadline: '2024-03-01T00:00:00Z'
      };

      const result = await ingestionService.ingestOpportunities({
        opportunities: [duplicateOpportunity],
        source: 'SAM.gov',
        companyId: testCompanyId,
        enableDeduplication: true
      });

      assert.equal(result.duplicates, 1, 'Should detect 1 duplicate');
      assert.equal(result.stored, 0, 'Should not store duplicate');
      
      // Verify only one opportunity in database
      const dbResult = await testPool.query(
        'SELECT COUNT(*) as count FROM gov_opportunities WHERE solicitation_number = $1',
        ['SOL-2024-DUP-1']
      );
      
      assert.equal(dbResult.rows[0].count, 1, 'Should have only one opportunity in database');
    });

    it('should merge duplicate opportunity data when appropriate', async () => {
      const partialOpportunity = {
        noticeId: 'TEST-NOTICE-MERGE-1',
        title: 'Construction Services',
        solicitationNumber: 'SOL-2024-MERGE-1',
        agency: 'Army Corps of Engineers'
        // Missing some fields
      };

      // Ingest partial opportunity
      await ingestionService.ingestOpportunities({
        opportunities: [partialOpportunity],
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      // Ingest more complete version
      const completeOpportunity = {
        noticeId: 'TEST-NOTICE-MERGE-2',
        title: 'Construction Services',
        solicitationNumber: 'SOL-2024-MERGE-1',  // Same solicitation
        agency: 'U.S. Army Corps of Engineers',  // More complete agency name
        naicsCodes: ['236220'],  // Additional data
        value_estimated: 1000000,  // Additional data
        responseDeadline: '2024-04-01T00:00:00Z'  // Additional data
      };

      await ingestionService.ingestOpportunities({
        opportunities: [completeOpportunity],
        source: 'SAM.gov',
        companyId: testCompanyId,
        enableDeduplication: true,
        mergeStrategy: 'enrich'
      });

      // Check merged result
      const dbResult = await testPool.query(
        'SELECT * FROM gov_opportunities WHERE solicitation_number = $1',
        ['SOL-2024-MERGE-1']
      );

      assert.equal(dbResult.rows.length, 1, 'Should still have one opportunity');
      assert.equal(dbResult.rows[0].agency, 'U.S. Army Corps of Engineers', 'Should update agency');
      assert.ok(dbResult.rows[0].naics_codes, 'Should have NAICS codes');
      assert.equal(dbResult.rows[0].value_estimated, '1000000', 'Should have value estimate');
      assert.ok(dbResult.rows[0].due_date, 'Should have response deadline');
    });

    it('should calculate similarity scores for potential duplicates', async () => {
      const opportunity1 = {
        noticeId: 'TEST-SIM-1',
        title: 'Information Technology Support Services',
        solicitationNumber: 'FA8732-24-R-0001',
        agency: 'Air Force',
        responseDeadline: '2024-03-15T00:00:00Z'
      };

      const opportunity2 = {
        noticeId: 'TEST-SIM-2',
        title: 'IT Support Services',  // Similar but not exact
        solicitationNumber: 'FA8732-24-R-0002',  // Different number
        agency: 'United States Air Force',  // Same agency, different format
        responseDeadline: '2024-03-15T00:00:00Z'  // Same deadline
      };

      // Calculate similarity
      const similarity = await deduplicationService.calculateSimilarity(opportunity1, opportunity2);
      
      assert.ok(similarity >= 0, 'Similarity should be non-negative');
      assert.ok(similarity <= 1, 'Similarity should not exceed 1');
      assert.ok(similarity > 0.5, 'Should detect moderate similarity');
      assert.ok(similarity < 0.9, 'Should not be considered exact match');
    });
  });

  describe('Watchlist Management', () => {
    it('should add opportunities to watchlists', async () => {
      // Create opportunity
      const opportunity = {
        noticeId: 'TEST-WATCH-1',
        title: 'Watchlist Test Opportunity',
        solicitationNumber: 'SOL-2024-WATCH-1',
        agency: 'Test Agency'
      };

      const ingestionResult = await ingestionService.ingestOpportunities({
        opportunities: [opportunity],
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      // Create watchlist
      const watchlistResult = await testPool.query(`
        INSERT INTO opportunity_watchlists (
          company_id, watchlist_name, filter_criteria
        ) VALUES (
          $1, 'Test Watchlist', '{"agency": "Test Agency"}'::jsonb
        ) RETURNING id
      `, [testCompanyId]);

      const watchlistId = watchlistResult.rows[0].id;

      // Get opportunity ID
      const oppResult = await testPool.query(
        'SELECT id FROM gov_opportunities WHERE solicitation_number = $1',
        ['SOL-2024-WATCH-1']
      );
      const opportunityId = oppResult.rows[0].id;

      // Add to watchlist
      await testPool.query(`
        INSERT INTO watchlist_items (
          watchlist_id, opportunity_id, company_id, added_method
        ) VALUES ($1, $2, $3, 'manual')
      `, [watchlistId, opportunityId, testCompanyId]);

      // Verify watchlist item
      const itemResult = await testPool.query(
        'SELECT * FROM watchlist_items WHERE watchlist_id = $1',
        [watchlistId]
      );

      assert.equal(itemResult.rows.length, 1, 'Should have one watchlist item');
      assert.equal(itemResult.rows[0].opportunity_id, opportunityId);
      assert.equal(itemResult.rows[0].item_status, 'watching');
    });

    it('should track watchlist item status changes', async () => {
      // Setup opportunity and watchlist (similar to above)
      const opportunity = {
        noticeId: 'TEST-STATUS-1',
        title: 'Status Tracking Opportunity',
        solicitationNumber: 'SOL-2024-STATUS-1',
        agency: 'Test Agency'
      };

      await ingestionService.ingestOpportunities({
        opportunities: [opportunity],
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      const watchlistResult = await testPool.query(`
        INSERT INTO opportunity_watchlists (
          company_id, watchlist_name
        ) VALUES ($1, 'Status Test Watchlist') RETURNING id
      `, [testCompanyId]);

      const watchlistId = watchlistResult.rows[0].id;
      
      const oppResult = await testPool.query(
        'SELECT id FROM gov_opportunities WHERE solicitation_number = $1',
        ['SOL-2024-STATUS-1']
      );
      const opportunityId = oppResult.rows[0].id;

      // Add to watchlist
      const itemResult = await testPool.query(`
        INSERT INTO watchlist_items (
          watchlist_id, opportunity_id, company_id, item_status
        ) VALUES ($1, $2, $3, 'watching') RETURNING id
      `, [watchlistId, opportunityId, testCompanyId]);

      const itemId = itemResult.rows[0].id;

      // Update status through lifecycle
      const statuses = ['evaluating', 'pursuing', 'proposal_prepared', 'proposal_submitted'];
      
      for (const status of statuses) {
        await testPool.query(
          'UPDATE watchlist_items SET item_status = $1, updated_at = NOW() WHERE id = $2',
          [status, itemId]
        );
      }

      // Verify final status
      const finalResult = await testPool.query(
        'SELECT item_status FROM watchlist_items WHERE id = $1',
        [itemId]
      );

      assert.equal(finalResult.rows[0].item_status, 'proposal_submitted', 
        'Should have final status of proposal_submitted');
    });
  });

  describe('Template Matching', () => {
    it('should match opportunities against ideal project templates', async () => {
      // Create ideal project template
      const templateResult = await testPool.query(`
        INSERT INTO ideal_project_templates (
          company_id, 
          template_name,
          preferred_naics_codes,
          preferred_agencies,
          min_contract_value,
          max_contract_value,
          preferred_set_asides
        ) VALUES (
          $1, 
          'Ideal IT Project',
          '["541511", "541512"]'::jsonb,
          '["Department of Defense", "Department of Energy"]'::jsonb,
          100000,
          1000000,
          '["8(a)", "SDVOSB"]'::jsonb
        ) RETURNING id
      `, [testCompanyId]);

      const templateId = templateResult.rows[0].id;

      // Create matching opportunity
      const matchingOpp = {
        noticeId: 'TEST-TEMPLATE-1',
        title: 'IT Services for DoD',
        solicitationNumber: 'SOL-2024-TEMPLATE-1',
        agency: 'Department of Defense',
        naicsCodes: ['541511'],
        setAside: '8(a)',
        value_estimated: 500000
      };

      // Create non-matching opportunity
      const nonMatchingOpp = {
        noticeId: 'TEST-TEMPLATE-2',
        title: 'Construction Project',
        solicitationNumber: 'SOL-2024-TEMPLATE-2',
        agency: 'Department of Agriculture',
        naicsCodes: ['236220'],
        value_estimated: 50000
      };

      // Ingest both opportunities
      await ingestionService.ingestOpportunities({
        opportunities: [matchingOpp, nonMatchingOpp],
        source: 'SAM.gov',
        companyId: testCompanyId,
        enableTemplateMatching: true
      });

      // Check template matching results
      const matchResult = await testPool.query(`
        SELECT opp.solicitation_number, opp.title
        FROM gov_opportunities opp
        WHERE EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(opp.naics_codes) AS naics
          WHERE naics IN (
            SELECT jsonb_array_elements_text(preferred_naics_codes)
            FROM ideal_project_templates WHERE id = $1
          )
        )
        AND opp.agency = ANY(
          SELECT jsonb_array_elements_text(preferred_agencies)
          FROM ideal_project_templates WHERE id = $1
        )
      `, [templateId, templateId]);

      assert.equal(matchResult.rows.length, 1, 'Should match one opportunity');
      assert.equal(matchResult.rows[0].solicitation_number, 'SOL-2024-TEMPLATE-1');
    });
  });
});

describe('Government Opportunity Integration Tests', () => {
  let testPool;

  before(async () => {
    testPool = new Pool(testDbConfig);
    await testPool.query('SELECT 1');
  });

  after(async () => {
    if (testPool) await testPool.end();
  });

  it('should complete end-to-end workflow from ingestion to watchlist', async (t) => {
    // Skip if tables don't exist
    const tableCheck = await testPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'gov_opportunities'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      t.skip('Government opportunity tables not found');
      return;
    }

    // 1. Create company
    const companyResult = await testPool.query(`
      INSERT INTO company_profiles (
        id, company_name, naics_codes
      ) VALUES (
        99999, 'Integration Test Company', '["541511"]'::jsonb
      ) RETURNING id
    `);
    const companyId = companyResult.rows[0].id;

    // 2. Ingest opportunity
    const ingestionService = new GovernmentOpportunityIngestionService();
    const opportunity = {
      noticeId: 'E2E-TEST-001',
      title: 'End-to-End Test Opportunity',
      solicitationNumber: 'E2E-SOL-001',
      agency: 'Test Agency',
      naicsCodes: ['541511']
    };

    const ingestionResult = await ingestionService.ingestOpportunities({
      opportunities: [opportunity],
      source: 'SAM.gov',
      companyId: companyId,
      enableScoring: true
    });

    assert.equal(ingestionResult.stored, 1, 'Should store opportunity');

    // 3. Verify scoring
    const scoreResult = await testPool.query(`
      SELECT * FROM gov_opportunity_scores 
      WHERE opportunity_id = (
        SELECT id FROM gov_opportunities WHERE solicitation_number = 'E2E-SOL-001'
      )
    `);
    assert.equal(scoreResult.rows.length, 1, 'Should have score');

    // 4. Create watchlist and add opportunity
    const watchlistResult = await testPool.query(`
      INSERT INTO opportunity_watchlists (
        company_id, watchlist_name
      ) VALUES ($1, 'E2E Test Watchlist') RETURNING id
    `, [companyId]);

    const oppResult = await testPool.query(
      'SELECT id FROM gov_opportunities WHERE solicitation_number = $1',
      ['E2E-SOL-001']
    );

    await testPool.query(`
      INSERT INTO watchlist_items (
        watchlist_id, opportunity_id, company_id
      ) VALUES ($1, $2, $3)
    `, [watchlistResult.rows[0].id, oppResult.rows[0].id, companyId]);

    // 5. Verify complete workflow
    const finalCheck = await testPool.query(`
      SELECT 
        opp.title,
        score.overall_score,
        wi.item_status
      FROM gov_opportunities opp
      JOIN gov_opportunity_scores score ON score.opportunity_id = opp.id
      JOIN watchlist_items wi ON wi.opportunity_id = opp.id
      WHERE opp.solicitation_number = 'E2E-SOL-001'
    `);

    assert.equal(finalCheck.rows.length, 1, 'Should have complete workflow data');
    assert.ok(finalCheck.rows[0].overall_score >= 0, 'Should have score');
    assert.equal(finalCheck.rows[0].item_status, 'watching', 'Should be in watchlist');

    // Cleanup
    await testPool.query('DELETE FROM company_profiles WHERE id = $1', [companyId]);
  });
});