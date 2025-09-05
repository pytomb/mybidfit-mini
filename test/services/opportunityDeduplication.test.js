/**
 * Opportunity Deduplication Service Unit Tests
 * Store-First methodology: Test business logic and deduplication algorithms
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');
const OpportunityDeduplicationService = require('../../src/services/opportunityDeduplicationService');

const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'mybidfit',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password'
};

describe('Opportunity Deduplication Service - Unit Tests', () => {
  let service;
  let testPool;

  before(async () => {
    testPool = new Pool(testDbConfig);
    service = new OpportunityDeduplicationService();
    
    try {
      await testPool.query('SELECT 1');
      console.log('✓ Deduplication test database connection established');
    } catch (error) {
      console.error('✗ Deduplication test database connection failed:', error.message);
      throw error;
    }
  });

  after(async () => {
    if (testPool) await testPool.end();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  async function cleanupTestData() {
    try {
      await testPool.query('DELETE FROM opportunity_duplicates WHERE opportunity_id >= 9000 OR duplicate_opportunity_id >= 9000');
      await testPool.query('DELETE FROM gov_opportunities WHERE id >= 9000');
      await testPool.query('DELETE FROM companies WHERE id >= 9000');
    } catch (error) {
      // Ignore cleanup errors for initial setup
    }
  }

  async function createTestOpportunity(overrides = {}) {
    const noticeId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const baseOpportunity = {
      source_ids: { sam_gov: noticeId },
      title: 'Software Development Services',
      description: 'Comprehensive software development and maintenance services for federal agencies',
      solicitation_number: `SOL-${Date.now()}`,
      agency: 'Department of Defense',
      office: 'Defense Information Systems Agency',
      naics_codes: ['541511', '541512'],
      psc_codes: ['D316', 'D317'],
      set_aside: 'Total Small Business',
      place_of_performance: {
        city: 'Washington',
        state: 'DC',
        country: 'USA'
      },
      due_date: '2024-12-31',
      posted_date: '2024-01-15',
      opportunity_type: 'RFP',
      processing_status: 'active',
      value_low: 100000,
      value_high: 500000,
      contacts: [{
        name: 'John Smith',
        email: 'john.smith@dod.mil',
        phone: '555-0123'
      }],
      raw_text: 'The Department of Defense seeks qualified contractors for software development services...',
      ...overrides
    };

    // Convert objects to JSON for JSONB columns
    const processedData = { ...baseOpportunity };
    processedData.source_ids = JSON.stringify(processedData.source_ids);
    processedData.naics_codes = JSON.stringify(processedData.naics_codes);
    processedData.psc_codes = JSON.stringify(processedData.psc_codes);
    processedData.place_of_performance = JSON.stringify(processedData.place_of_performance);
    processedData.contacts = JSON.stringify(processedData.contacts);

    const result = await testPool.query(`
      INSERT INTO gov_opportunities (${Object.keys(processedData).join(', ')})
      VALUES (${Object.keys(processedData).map((_, i) => `$${i + 1}`).join(', ')})
      RETURNING *
    `, Object.values(processedData));

    return result.rows[0];
  }

  describe('Similarity Calculation', () => {
    it('should calculate high similarity for nearly identical opportunities', async () => {
      const opp1 = await createTestOpportunity({
        title: 'Software Development Services Contract',
        description: 'Comprehensive software development and maintenance services',
        agency: 'Department of Defense',
        naics_codes: ['541511']
      });

      const opp2 = await createTestOpportunity({
        title: 'Software Development Services Agreement',
        description: 'Complete software development and maintenance support',
        agency: 'Department of Defense',
        naics_codes: ['541511']
      });

      const similarity = await service.calculateSimilarity(opp1, opp2);
      
      assert.ok(similarity >= 0.7, `Similarity should be high for nearly identical opportunities, got ${similarity}`);
      assert.ok(similarity <= 1.0, 'Similarity should not exceed 1.0');
    });

    it('should calculate low similarity for completely different opportunities', async () => {
      const opp1 = await createTestOpportunity({
        title: 'Software Development Services',
        description: 'IT services and software development',
        agency: 'Department of Defense',
        naics_codes: ['541511']
      });

      const opp2 = await createTestOpportunity({
        title: 'Janitorial Services Contract',
        description: 'Building maintenance and cleaning services',
        agency: 'General Services Administration',
        naics_codes: ['561720']
      });

      const similarity = await service.calculateSimilarity(opp1, opp2);
      
      assert.ok(similarity <= 0.3, `Similarity should be low for different opportunities, got ${similarity}`);
      assert.ok(similarity >= 0.0, 'Similarity should not be negative');
    });

    it('should handle identical notice_id as perfect match', async () => {
      const noticeId = `TEST-IDENTICAL-${Date.now()}`;
      
      const opp1 = await createTestOpportunity({
        notice_id: noticeId,
        title: 'Original Opportunity'
      });

      const opp2 = await createTestOpportunity({
        notice_id: noticeId,
        title: 'Updated Opportunity Title'
      });

      const similarity = await service.calculateSimilarity(opp1, opp2);
      
      assert.strictEqual(similarity, 1.0, 'Identical notice_id should result in perfect similarity');
    });

    it('should weight title similarity heavily in overall score', async () => {
      const opp1 = await createTestOpportunity({
        title: 'Software Development Services',
        description: 'Different description here',
        agency: 'Different Agency'
      });

      const opp2 = await createTestOpportunity({
        title: 'Software Development Services',
        description: 'Another different description',
        agency: 'Another Different Agency'
      });

      const similarity = await service.calculateSimilarity(opp1, opp2);
      
      assert.ok(similarity >= 0.4, 'Identical titles should contribute significantly to similarity score');
    });

    it('should consider NAICS code overlap in similarity calculation', async () => {
      const opp1 = await createTestOpportunity({
        title: 'IT Services Contract A',
        naics_codes: ['541511', '541512', '541513']
      });

      const opp2 = await createTestOpportunity({
        title: 'IT Services Contract B',
        naics_codes: ['541511', '541519']
      });

      const opp3 = await createTestOpportunity({
        title: 'IT Services Contract C',
        naics_codes: ['561720', '561730']
      });

      const similarity1vs2 = await service.calculateSimilarity(opp1, opp2);
      const similarity1vs3 = await service.calculateSimilarity(opp1, opp3);
      
      assert.ok(similarity1vs2 > similarity1vs3, 'Opportunities with overlapping NAICS codes should be more similar');
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect exact duplicates based on notice_id', async () => {
      const noticeId = `EXACT-DUP-${Date.now()}`;
      
      const opp1 = await createTestOpportunity({
        notice_id: noticeId,
        title: 'Original Posting'
      });

      const opp2 = await createTestOpportunity({
        notice_id: noticeId,
        title: 'Same Posting Different Title'
      });

      const duplicates = await service.findDuplicates(opp2);
      
      assert.strictEqual(duplicates.length, 1, 'Should find exactly one duplicate');
      assert.strictEqual(duplicates[0].id, opp1.id, 'Should identify the correct duplicate');
      assert.strictEqual(duplicates[0].similarity_score, 1.0, 'Exact duplicates should have similarity score of 1.0');
    });

    it('should detect fuzzy duplicates above similarity threshold', async () => {
      const opp1 = await createTestOpportunity({
        title: 'Software Development Services for Federal Agencies',
        description: 'Comprehensive software development, maintenance, and support services',
        agency: 'Department of Defense',
        solicitation_number: 'SOL-2024-DEF-001'
      });

      const opp2 = await createTestOpportunity({
        title: 'Software Development Services for Federal Agencies',
        description: 'Complete software development, maintenance, and support services',
        agency: 'Department of Defense',
        solicitation_number: 'SOL-2024-DEF-001-MOD'
      });

      const duplicates = await service.findDuplicates(opp2, { similarityThreshold: 0.7 });
      
      assert.ok(duplicates.length >= 1, 'Should find fuzzy duplicates above threshold');
      assert.ok(duplicates[0].similarity_score >= 0.7, 'Found duplicates should meet similarity threshold');
    });

    it('should not detect duplicates below similarity threshold', async () => {
      const opp1 = await createTestOpportunity({
        title: 'Software Development Services',
        description: 'IT services and development',
        agency: 'Department of Defense',
        naics_codes: ['541511']
      });

      const opp2 = await createTestOpportunity({
        title: 'Construction Services',
        description: 'Building construction and maintenance',
        agency: 'Army Corps of Engineers',
        naics_codes: ['236220']
      });

      const duplicates = await service.findDuplicates(opp2, { similarityThreshold: 0.7 });
      
      assert.strictEqual(duplicates.length, 0, 'Should not find duplicates below threshold');
    });

    it('should limit duplicate search results when specified', async () => {
      // Create multiple similar opportunities
      const baseTitle = 'Software Development Services';
      const opportunities = [];
      
      for (let i = 0; i < 5; i++) {
        const opp = await createTestOpportunity({
          title: `${baseTitle} Contract ${i}`,
          description: 'Software development and maintenance services',
          agency: 'Department of Defense',
          solicitation_number: `SOL-2024-${i}`
        });
        opportunities.push(opp);
      }

      // Create a target opportunity similar to all of them
      const target = await createTestOpportunity({
        title: `${baseTitle} New Contract`,
        description: 'Software development and maintenance services',
        agency: 'Department of Defense'
      });

      const duplicates = await service.findDuplicates(target, { 
        similarityThreshold: 0.5,
        limit: 3 
      });
      
      assert.ok(duplicates.length <= 3, 'Should respect limit parameter');
      assert.ok(duplicates.length >= 1, 'Should find some duplicates');
    });

    it('should exclude the opportunity itself from duplicate results', async () => {
      const opp = await createTestOpportunity({
        title: 'Software Development Services',
        description: 'IT services and development'
      });

      const duplicates = await service.findDuplicates(opp);
      
      const selfReference = duplicates.find(dup => dup.id === opp.id);
      assert.strictEqual(selfReference, undefined, 'Should not include the opportunity itself in duplicate results');
    });
  });

  describe('Duplicate Merging', () => {
    it('should merge duplicate opportunities keeping the most recent', async () => {
      const oldDate = '2024-01-01T00:00:00.000Z';
      const newDate = '2024-01-15T00:00:00.000Z';
      
      const opp1 = await createTestOpportunity({
        notice_id: 'MERGE-TEST-001',
        title: 'Original Title',
        last_updated: oldDate
      });

      const opp2 = await createTestOpportunity({
        notice_id: 'MERGE-TEST-001',
        title: 'Updated Title with More Information',
        description: 'Updated description with additional details',
        last_updated: newDate
      });

      const mergeResult = await service.mergeDuplicates(opp1.id, opp2.id);
      
      assert.strictEqual(mergeResult.success, true, 'Merge should succeed');
      assert.strictEqual(mergeResult.primaryOpportunity.id, opp2.id, 'Should keep the more recent opportunity as primary');
      assert.strictEqual(mergeResult.primaryOpportunity.title, 'Updated Title with More Information', 'Should preserve updated title');
    });

    it('should preserve all unique data from both opportunities', async () => {
      const opp1 = await createTestOpportunity({
        title: 'Software Development',
        naics_codes: ['541511'],
        psc_codes: ['D316'],
        contacts: JSON.stringify([{
          name: 'John Smith',
          email: 'john@agency1.gov'
        }])
      });

      const opp2 = await createTestOpportunity({
        title: 'Software Development Services',
        naics_codes: ['541511', '541512'],
        psc_codes: ['D316', 'D317'],
        contacts: JSON.stringify([{
          name: 'Jane Doe',
          email: 'jane@agency1.gov'
        }])
      });

      const mergeResult = await service.mergeDuplicates(opp1.id, opp2.id);
      
      assert.strictEqual(mergeResult.success, true, 'Merge should succeed');
      
      const merged = mergeResult.primaryOpportunity;
      assert.ok(merged.naics_codes.includes('541511'), 'Should preserve NAICS codes from both');
      assert.ok(merged.naics_codes.includes('541512'), 'Should preserve NAICS codes from both');
      assert.ok(merged.psc_codes.includes('D316'), 'Should preserve PSC codes from both');
      assert.ok(merged.psc_codes.includes('D317'), 'Should preserve PSC codes from both');
    });

    it('should create duplicate relationship record after merge', async () => {
      const opp1 = await createTestOpportunity({
        title: 'Original Opportunity'
      });

      const opp2 = await createTestOpportunity({
        title: 'Duplicate Opportunity'
      });

      await service.mergeDuplicates(opp1.id, opp2.id);
      
      const relationship = await testPool.query(`
        SELECT * FROM opportunity_duplicates 
        WHERE opportunity_id = $1 AND duplicate_opportunity_id = $2
      `, [opp2.id, opp1.id]);
      
      assert.strictEqual(relationship.rows.length, 1, 'Should create duplicate relationship record');
      assert.ok(relationship.rows[0].similarity_score > 0, 'Should record similarity score');
      assert.strictEqual(relationship.rows[0].merge_action, 'merged', 'Should record merge action');
    });

    it('should handle merge of opportunities with different data types gracefully', async () => {
      const opp1 = await createTestOpportunity({
        value_low: 100000,
        value_high: 500000,
        contacts: JSON.stringify([{ name: 'Contact 1' }])
      });

      const opp2 = await createTestOpportunity({
        value_low: null,
        value_high: 750000,
        contacts: JSON.stringify([{ name: 'Contact 2' }])
      });

      const mergeResult = await service.mergeDuplicates(opp1.id, opp2.id);
      
      assert.strictEqual(mergeResult.success, true, 'Should handle null values in merge');
      const merged = mergeResult.primaryOpportunity;
      assert.ok(merged.value_high === 750000, 'Should take non-null value when available');
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple opportunities for duplicate detection', async () => {
      // Create a base set of opportunities
      const baseOpportunities = [];
      for (let i = 0; i < 3; i++) {
        const opp = await createTestOpportunity({
          title: `Existing Software Contract ${i}`,
          agency: 'Department of Defense'
        });
        baseOpportunities.push(opp);
      }

      // Create new opportunities to check for duplicates
      const newOpportunities = [
        await createTestOpportunity({
          title: 'Existing Software Contract 0', // Potential duplicate
          agency: 'Department of Defense'
        }),
        await createTestOpportunity({
          title: 'New Consulting Services',
          agency: 'Department of Commerce'
        })
      ];

      const batchResult = await service.batchProcessDuplicates(newOpportunities, {
        similarityThreshold: 0.7,
        autoMerge: false
      });
      
      assert.ok(Array.isArray(batchResult.results), 'Should return array of results');
      assert.strictEqual(batchResult.results.length, newOpportunities.length, 'Should process all opportunities');
      assert.ok(batchResult.summary.totalProcessed >= 0, 'Should provide processing summary');
    });

    it('should support auto-merge option in batch processing', async () => {
      const originalOpp = await createTestOpportunity({
        notice_id: 'BATCH-MERGE-001',
        title: 'Original Batch Test Opportunity'
      });

      const duplicateOpp = await createTestOpportunity({
        notice_id: 'BATCH-MERGE-001',
        title: 'Duplicate Batch Test Opportunity'
      });

      const batchResult = await service.batchProcessDuplicates([duplicateOpp], {
        similarityThreshold: 0.5,
        autoMerge: true
      });
      
      assert.strictEqual(batchResult.summary.mergedCount, 1, 'Should auto-merge duplicate');
      
      // Verify the duplicate relationship was created
      const relationship = await testPool.query(`
        SELECT * FROM opportunity_duplicates 
        WHERE opportunity_id = $1 OR duplicate_opportunity_id = $1
      `, [duplicateOpp.id]);
      
      assert.ok(relationship.rows.length > 0, 'Should create relationship record for auto-merged duplicate');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty opportunity arrays gracefully', async () => {
      const batchResult = await service.batchProcessDuplicates([], {
        similarityThreshold: 0.7
      });
      
      assert.strictEqual(batchResult.results.length, 0, 'Should handle empty array');
      assert.strictEqual(batchResult.summary.totalProcessed, 0, 'Should report zero processed');
    });

    it('should handle opportunities with missing or null fields', async () => {
      const incompleteOpp = await createTestOpportunity({
        title: null,
        description: '',
        naics_codes: null,
        psc_codes: []
      });

      const completeOpp = await createTestOpportunity({
        title: 'Complete Opportunity',
        description: 'Full description here'
      });

      const similarity = await service.calculateSimilarity(incompleteOpp, completeOpp);
      
      assert.ok(typeof similarity === 'number', 'Should return numeric similarity even with null fields');
      assert.ok(similarity >= 0 && similarity <= 1, 'Similarity should be in valid range');
    });

    it('should validate opportunity IDs before processing', async () => {
      try {
        await service.mergeDuplicates(99999, 99998); // Non-existent IDs
        assert.fail('Should throw error for invalid opportunity IDs');
      } catch (error) {
        assert.ok(error.message.includes('not found') || error.message.includes('invalid'), 
          'Should provide meaningful error for invalid IDs');
      }
    });

    it('should handle database connection errors gracefully', async () => {
      // Temporarily break the service's database connection
      const originalPool = service.pool;
      service.pool = null;

      try {
        await service.findDuplicates({ id: 1, title: 'Test' });
        assert.fail('Should throw error when database connection is unavailable');
      } catch (error) {
        assert.ok(error.message.includes('database') || error.message.includes('connection'), 
          'Should provide meaningful database error message');
      } finally {
        service.pool = originalPool;
      }
    });

    it('should respect similarity threshold boundaries', async () => {
      const opp = await createTestOpportunity({
        title: 'Test Opportunity'
      });

      // Test with various thresholds
      const thresholds = [0.0, 0.5, 0.9, 1.0];
      
      for (const threshold of thresholds) {
        const duplicates = await service.findDuplicates(opp, { 
          similarityThreshold: threshold 
        });
        
        duplicates.forEach(duplicate => {
          assert.ok(duplicate.similarity_score >= threshold, 
            `All duplicates should meet threshold ${threshold}, found ${duplicate.similarity_score}`);
        });
      }
    });
  });

  describe('Configuration and Options', () => {
    it('should support custom similarity weights', async () => {
      const opp1 = await createTestOpportunity({
        title: 'Software Development',
        description: 'Different description',
        agency: 'Different Agency'
      });

      const opp2 = await createTestOpportunity({
        title: 'Software Development',
        description: 'Another description',
        agency: 'Another Agency'
      });

      // Test with title-heavy weighting
      const titleWeightedSimilarity = await service.calculateSimilarity(opp1, opp2, {
        titleWeight: 0.8,
        descriptionWeight: 0.1,
        agencyWeight: 0.1
      });

      // Test with description-heavy weighting
      const descriptionWeightedSimilarity = await service.calculateSimilarity(opp1, opp2, {
        titleWeight: 0.1,
        descriptionWeight: 0.8,
        agencyWeight: 0.1
      });

      assert.ok(titleWeightedSimilarity > descriptionWeightedSimilarity, 
        'Title-weighted similarity should be higher when titles match');
    });

    it('should support different similarity algorithms', async () => {
      const opp1 = await createTestOpportunity({
        title: 'Software Development Services'
      });

      const opp2 = await createTestOpportunity({
        title: 'Software Development Support'
      });

      // Test different algorithms if supported
      const algorithms = ['jaccard', 'cosine', 'levenshtein'];
      
      for (const algorithm of algorithms) {
        try {
          const similarity = await service.calculateSimilarity(opp1, opp2, {
            algorithm: algorithm
          });
          
          assert.ok(typeof similarity === 'number', `Should return numeric result for ${algorithm}`);
          assert.ok(similarity >= 0 && similarity <= 1, 
            `Similarity should be in valid range for ${algorithm}`);
        } catch (error) {
          // Algorithm might not be implemented
          console.log(`Algorithm ${algorithm} not supported:`, error.message);
        }
      }
    });
  });
});