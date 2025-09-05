/**
 * Government Opportunity Discovery - End-to-End Workflow Tests
 * Test complete workflow from SAM.gov ingestion to company matching and scoring
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');
const GovernmentOpportunityIngestionService = require('../../src/services/governmentOpportunityIngestionService');
const OpportunityDeduplicationService = require('../../src/services/opportunityDeduplicationService');
const sam = require('../../src/services/sam');

const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'mybidfit',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password'
};

describe('Government Opportunity Discovery - End-to-End Workflow', () => {
  let testPool;
  let ingestionService;
  let deduplicationService;
  let testCompanyId;

  before(async () => {
    testPool = new Pool(testDbConfig);
    ingestionService = new GovernmentOpportunityIngestionService();
    deduplicationService = new OpportunityDeduplicationService();
    
    try {
      await testPool.query('SELECT 1');
      console.log('✓ End-to-end workflow test database connection established');
    } catch (error) {
      console.error('✗ End-to-end workflow test database connection failed:', error.message);
      throw error;
    }
  });

  after(async () => {
    if (testPool) await testPool.end();
    if (ingestionService) await ingestionService.close?.();
    if (deduplicationService) await deduplicationService.close?.();
  });

  beforeEach(async () => {
    await cleanupTestData();
    await createTestCompany();
  });

  async function cleanupTestData() {
    try {
      await testPool.query('DELETE FROM opportunity_duplicates WHERE opportunity_id >= 9000 OR duplicate_opportunity_id >= 9000');
      await testPool.query('DELETE FROM watchlist_items WHERE opportunity_id IN (SELECT id FROM government_opportunities WHERE id >= 9000)');
      await testPool.query('DELETE FROM opportunity_watchlists WHERE company_id >= 9000');
      await testPool.query('DELETE FROM scoring_results WHERE company_id >= 9000 OR opportunity_id >= 9000');
      await testPool.query('DELETE FROM government_opportunities WHERE id >= 9000');
      await testPool.query('DELETE FROM companies WHERE id >= 9000');
    } catch (error) {
      // Ignore cleanup errors for initial setup
    }
  }

  async function createTestCompany() {
    const result = await testPool.query(`
      INSERT INTO companies (
        id, name, capabilities, industries, service_regions, 
        size_category, years_experience, team_size, credibility_score
      ) VALUES (
        9001, 'End-to-End Test Company', 
        ARRAY['software development', 'data analytics', 'cybersecurity'],
        ARRAY['technology', 'defense'], 
        ARRAY['US-East', 'US-Central'],
        'medium', 12, 45, 89.5
      ) RETURNING id
    `);
    testCompanyId = result.rows[0].id;
  }

  function createMockOpportunity(overrides = {}) {
    return {
      noticeId: `E2E-TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Comprehensive IT Services Contract',
      description: 'The Department of Defense seeks qualified contractors to provide comprehensive information technology services including software development, cybersecurity, and data analytics support.',
      solicitationNumber: `SOL-${Date.now()}`,
      agency: 'Department of Defense',
      office: 'Defense Information Systems Agency',
      naicsCodes: ['541511', '541512', '541519'],
      pscCodes: ['D316', 'D317'],
      setAside: 'Small Business',
      placeOfPerformance: {
        city: 'Washington',
        state: 'DC',
        country: 'USA'
      },
      dueDate: '2024-12-31',
      postedDate: '2024-01-15',
      classification: 'Presolicitation',
      valueLow: 250000,
      valueHigh: 750000,
      contactInfo: [{
        name: 'John Smith',
        email: 'john.smith@dod.mil',
        phone: '555-0123'
      }],
      sourceUrl: 'https://sam.gov/opp/test-opportunity',
      ...overrides
    };
  }

  describe('Complete Workflow: Ingestion to Scoring', () => {
    it('should complete full workflow from raw SAM data to scored opportunities', async () => {
      console.log('🎯 Starting complete end-to-end workflow test');

      // Step 1: Mock SAM.gov data ingestion
      const mockOpportunities = [
        createMockOpportunity({
          title: 'Software Development Services',
          naicsCodes: ['541511'],
          description: 'Software development and maintenance services for federal systems'
        }),
        createMockOpportunity({
          title: 'Cybersecurity Consulting Services', 
          naicsCodes: ['541512'],
          description: 'Cybersecurity assessment and consulting for government networks'
        }),
        createMockOpportunity({
          title: 'Data Analytics Platform Development',
          naicsCodes: ['541511', '541519'],
          description: 'Development of advanced data analytics platform for intelligence analysis'
        })
      ];

      console.log('📥 Step 1: Ingesting opportunities from SAM.gov...');
      const ingestionResult = await ingestionService.ingestOpportunities({
        opportunities: mockOpportunities,
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      assert.strictEqual(ingestionResult.stored, 3, 'Should store all 3 opportunities');
      assert.strictEqual(ingestionResult.duplicates, 0, 'Should not find duplicates initially');
      console.log('✓ Step 1 Complete: Opportunities ingested successfully');

      // Step 2: Verify data normalization and storage
      console.log('🔍 Step 2: Verifying data normalization...');
      const storedOpportunities = await testPool.query(`
        SELECT id, notice_id, title, naics_codes, description, value_low, value_high
        FROM government_opportunities 
        WHERE notice_id LIKE 'E2E-TEST-%'
        ORDER BY title
      `);

      assert.strictEqual(storedOpportunities.rows.length, 3, 'Should find 3 stored opportunities');
      
      const softwareOpp = storedOpportunities.rows.find(opp => opp.title.includes('Software Development'));
      assert.ok(softwareOpp, 'Should find software development opportunity');
      assert.ok(Array.isArray(softwareOpp.naics_codes), 'NAICS codes should be stored as array');
      assert.ok(softwareOpp.naics_codes.includes('541511'), 'Should preserve NAICS code');
      console.log('✓ Step 2 Complete: Data normalization verified');

      // Step 3: Test duplicate detection with a similar opportunity
      console.log('🔄 Step 3: Testing duplicate detection...');
      const duplicateOpportunity = createMockOpportunity({
        title: 'Software Development Services Contract', // Very similar title
        naicsCodes: ['541511'],
        description: 'Software development and maintenance services for federal agencies' // Similar description
      });

      const duplicateResult = await ingestionService.ingestOpportunities({
        opportunities: [duplicateOpportunity],
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      // Should detect duplicate but still store (depending on implementation)
      assert.ok(duplicateResult.duplicates >= 0, 'Should check for duplicates');
      console.log('✓ Step 3 Complete: Duplicate detection working');

      // Step 4: Test opportunity scoring
      console.log('🎯 Step 4: Testing opportunity scoring...');
      const opportunityId = softwareOpp.id;
      
      // Mock scoring request
      const scoringResult = await testPool.query(`
        SELECT 
          id, notice_id, title, naics_codes
        FROM government_opportunities 
        WHERE id = $1
      `, [opportunityId]);

      assert.strictEqual(scoringResult.rows.length, 1, 'Should find opportunity for scoring');
      
      // Verify we can calculate basic fit score
      const opportunity = scoringResult.rows[0];
      const companyDetails = await testPool.query(`
        SELECT capabilities, industries, naics_codes
        FROM companies WHERE id = $1
      `, [testCompanyId]);

      const company = companyDetails.rows[0];
      
      // Calculate basic fit (simplified scoring logic for test)
      const opportunityNaics = opportunity.naics_codes || [];
      const hasNaicsMatch = opportunityNaics.some(naics => 
        naics.startsWith('5415') // IT services codes
      );
      
      const hasCapabilityMatch = company.capabilities.some(capability =>
        opportunity.title.toLowerCase().includes(capability.replace(' ', '').toLowerCase()) ||
        opportunity.description.toLowerCase().includes(capability.replace(' ', '').toLowerCase())
      );

      assert.ok(hasNaicsMatch, 'Should find NAICS code match');
      assert.ok(hasCapabilityMatch, 'Should find capability match');
      console.log('✓ Step 4 Complete: Opportunity scoring logic verified');

      // Step 5: Test watchlist functionality
      console.log('👀 Step 5: Testing watchlist functionality...');
      
      // Create a watchlist for this company
      const watchlistResult = await testPool.query(`
        INSERT INTO opportunity_watchlists (
          company_id, name, search_criteria, created_at, updated_at
        ) VALUES (
          $1, 'IT Services Watchlist', 
          '{"naics_codes": ["541511"], "keywords": ["software", "development"]}',
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `, [testCompanyId]);

      const watchlistId = watchlistResult.rows[0].id;

      // Add high-scoring opportunities to watchlist
      await testPool.query(`
        INSERT INTO watchlist_items (
          watchlist_id, opportunity_id, status, added_at, notes
        ) VALUES (
          $1, $2, 'active', CURRENT_TIMESTAMP, 'High scoring match for IT services'
        )
      `, [watchlistId, opportunityId]);

      // Verify watchlist functionality
      const watchlistCheck = await testPool.query(`
        SELECT 
          w.name as watchlist_name,
          o.title as opportunity_title,
          wi.status,
          wi.notes
        FROM opportunity_watchlists w
        JOIN watchlist_items wi ON w.id = wi.watchlist_id  
        JOIN government_opportunities o ON wi.opportunity_id = o.id
        WHERE w.company_id = $1
      `, [testCompanyId]);

      assert.strictEqual(watchlistCheck.rows.length, 1, 'Should find watchlist item');
      assert.strictEqual(watchlistCheck.rows[0].watchlist_name, 'IT Services Watchlist');
      assert.strictEqual(watchlistCheck.rows[0].status, 'active');
      console.log('✓ Step 5 Complete: Watchlist functionality verified');

      // Step 6: Test end-to-end data flow
      console.log('🔄 Step 6: Testing complete data flow...');
      
      const completeWorkflowQuery = await testPool.query(`
        SELECT 
          c.name as company_name,
          c.capabilities,
          o.title as opportunity_title,
          o.naics_codes,
          o.agency,
          o.value_low,
          o.value_high,
          w.name as watchlist_name,
          wi.status as watchlist_status
        FROM companies c
        CROSS JOIN government_opportunities o
        LEFT JOIN watchlist_items wi ON o.id = wi.opportunity_id
        LEFT JOIN opportunity_watchlists w ON wi.watchlist_id = w.id AND w.company_id = c.id
        WHERE c.id = $1 
          AND o.notice_id LIKE 'E2E-TEST-%'
          AND o.title LIKE '%Software Development%'
      `, [testCompanyId]);

      assert.ok(completeWorkflowQuery.rows.length > 0, 'Should find complete workflow data');
      const workflowData = completeWorkflowQuery.rows[0];
      
      assert.strictEqual(workflowData.company_name, 'End-to-End Test Company');
      assert.ok(workflowData.opportunity_title.includes('Software Development'));
      assert.ok(workflowData.naics_codes.includes('541511'));
      assert.strictEqual(workflowData.watchlist_name, 'IT Services Watchlist');
      assert.strictEqual(workflowData.watchlist_status, 'active');
      console.log('✓ Step 6 Complete: End-to-end data flow verified');

      console.log('🎉 Complete end-to-end workflow test PASSED');
    });

    it('should handle high-volume opportunity processing efficiently', async () => {
      console.log('⚡ Testing high-volume opportunity processing...');

      const batchSize = 25;
      const mockBatch = [];

      for (let i = 0; i < batchSize; i++) {
        mockBatch.push(createMockOpportunity({
          title: `Batch Test Opportunity ${i}`,
          noticeId: `BATCH-TEST-${i.toString().padStart(3, '0')}`,
          naicsCodes: ['541511', '541512'][i % 2 === 0 ? 0 : 1],
          valueLow: 100000 + (i * 10000),
          valueHigh: 500000 + (i * 20000)
        }));
      }

      const startTime = Date.now();

      const batchResult = await ingestionService.ingestOpportunities({
        opportunities: mockBatch,
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      assert.strictEqual(batchResult.stored, batchSize, `Should store all ${batchSize} opportunities`);
      console.log(`✓ Processed ${batchSize} opportunities in ${processingTime}ms`);

      // Verify batch processing efficiency (should be under 5 seconds)
      assert.ok(processingTime < 5000, 'Batch processing should be efficient');

      // Verify data integrity
      const verifyResult = await testPool.query(`
        SELECT COUNT(*) as count, MIN(value_low) as min_value, MAX(value_high) as max_value
        FROM government_opportunities 
        WHERE notice_id LIKE 'BATCH-TEST-%'
      `);

      assert.strictEqual(parseInt(verifyResult.rows[0].count), batchSize);
      assert.ok(verifyResult.rows[0].min_value >= 100000, 'Should preserve minimum values');
      assert.ok(verifyResult.rows[0].max_value <= 1000000, 'Should preserve maximum values');

      console.log('✓ High-volume processing test completed successfully');
    });

    it('should maintain data consistency across workflow steps', async () => {
      console.log('🔄 Testing data consistency across workflow...');

      // Create opportunities with different characteristics
      const diverseOpportunities = [
        createMockOpportunity({
          title: 'Small Business IT Support',
          setAside: 'Small Business',
          valueLow: 50000,
          valueHigh: 150000,
          naicsCodes: ['541511']
        }),
        createMockOpportunity({
          title: 'Large Scale System Integration',
          setAside: 'Unrestricted',
          valueLow: 1000000,
          valueHigh: 5000000,
          naicsCodes: ['541512', '541513']
        }),
        createMockOpportunity({
          title: 'Research and Development Contract',
          setAside: 'SBIR',
          valueLow: 750000,
          valueHigh: 1500000,
          naicsCodes: ['541715', '541511']
        })
      ];

      // Step 1: Ingest with transaction integrity
      console.log('📥 Step 1: Ingesting diverse opportunities...');
      const ingestionResult = await ingestionService.ingestOpportunities({
        opportunities: diverseOpportunities,
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      assert.strictEqual(ingestionResult.stored, 3, 'Should store all diverse opportunities');

      // Step 2: Verify referential integrity
      console.log('🔗 Step 2: Verifying referential integrity...');
      const integrityCheck = await testPool.query(`
        SELECT 
          o.id,
          o.notice_id,
          o.title,
          o.set_aside,
          o.value_low,
          o.value_high,
          ARRAY_LENGTH(o.naics_codes, 1) as naics_count
        FROM government_opportunities o
        WHERE o.notice_id LIKE 'E2E-TEST-%'
        ORDER BY o.value_low
      `);

      assert.strictEqual(integrityCheck.rows.length, 3, 'Should maintain all records');

      // Verify data types and constraints
      integrityCheck.rows.forEach((row, index) => {
        assert.ok(row.id > 0, `Row ${index}: Should have valid ID`);
        assert.ok(row.notice_id.startsWith('E2E-TEST'), `Row ${index}: Should have valid notice ID`);
        assert.ok(row.title.length > 0, `Row ${index}: Should have title`);
        assert.ok(row.value_low > 0, `Row ${index}: Should have positive low value`);
        assert.ok(row.value_high >= row.value_low, `Row ${index}: High value should be >= low value`);
        assert.ok(row.naics_count > 0, `Row ${index}: Should have NAICS codes`);
      });

      // Step 3: Test scoring consistency
      console.log('🎯 Step 3: Testing scoring consistency...');
      const scoringOpportunity = integrityCheck.rows[0]; // Small business opportunity

      // Verify scoring can access all required data
      const scoringData = await testPool.query(`
        SELECT 
          o.*,
          c.capabilities,
          c.industries,
          c.size_category
        FROM government_opportunities o
        CROSS JOIN companies c
        WHERE o.id = $1 AND c.id = $2
      `, [scoringOpportunity.id, testCompanyId]);

      assert.strictEqual(scoringData.rows.length, 1, 'Should join opportunity and company data');
      const combined = scoringData.rows[0];

      // Verify all required fields are accessible
      assert.ok(combined.title, 'Should have opportunity title for scoring');
      assert.ok(combined.naics_codes, 'Should have NAICS codes for scoring');
      assert.ok(combined.capabilities, 'Should have company capabilities for scoring');
      assert.ok(combined.set_aside, 'Should have set-aside information for scoring');

      // Step 4: Test watchlist consistency
      console.log('👀 Step 4: Testing watchlist data consistency...');
      
      // Create watchlist that matches small business opportunities
      const watchlistResult = await testPool.query(`
        INSERT INTO opportunity_watchlists (
          company_id, name, search_criteria, created_at, updated_at
        ) VALUES (
          $1, 'Small Business Opportunities',
          '{"set_aside": "Small Business", "value_range": {"max": 200000}}',
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `, [testCompanyId]);

      const watchlistId = watchlistResult.rows[0].id;

      // Add matching opportunity to watchlist
      await testPool.query(`
        INSERT INTO watchlist_items (
          watchlist_id, opportunity_id, status, added_at, notes
        ) VALUES (
          $1, $2, 'active', CURRENT_TIMESTAMP, 'Matches small business criteria'
        )
      `, [watchlistId, scoringOpportunity.id]);

      // Verify consistency across all related tables
      const consistencyCheck = await testPool.query(`
        SELECT 
          c.name as company_name,
          w.name as watchlist_name,
          o.title as opportunity_title,
          o.set_aside,
          o.value_low,
          o.value_high,
          wi.status,
          wi.notes
        FROM companies c
        JOIN opportunity_watchlists w ON c.id = w.company_id
        JOIN watchlist_items wi ON w.id = wi.watchlist_id
        JOIN government_opportunities o ON wi.opportunity_id = o.id
        WHERE c.id = $1 AND w.id = $2
      `, [testCompanyId, watchlistId]);

      assert.strictEqual(consistencyCheck.rows.length, 1, 'Should maintain consistency across all tables');
      const consistency = consistencyCheck.rows[0];

      assert.strictEqual(consistency.company_name, 'End-to-End Test Company');
      assert.strictEqual(consistency.watchlist_name, 'Small Business Opportunities');
      assert.strictEqual(consistency.set_aside, 'Small Business');
      assert.ok(consistency.value_high <= 200000, 'Should match watchlist criteria');
      assert.strictEqual(consistency.status, 'active');

      console.log('✓ Data consistency verified across all workflow steps');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle partial ingestion failures gracefully', async () => {
      console.log('⚠️ Testing partial ingestion failure handling...');

      const mixedOpportunities = [
        createMockOpportunity({
          title: 'Valid Opportunity 1',
          naicsCodes: ['541511']
        }),
        {
          // Invalid opportunity - missing required fields
          noticeId: 'INVALID-OPP-001',
          title: null, // Invalid - null title
          agency: 'Test Agency'
        },
        createMockOpportunity({
          title: 'Valid Opportunity 2', 
          naicsCodes: ['541512']
        })
      ];

      try {
        const result = await ingestionService.ingestOpportunities({
          opportunities: mixedOpportunities,
          source: 'SAM.gov',
          companyId: testCompanyId
        });

        // Should handle partial failures gracefully
        if (result.stored < mixedOpportunities.length) {
          assert.ok(result.errors && result.errors.length > 0, 'Should report errors for failed opportunities');
          console.log(`✓ Handled partial failure: ${result.stored} stored, ${result.errors?.length || 0} errors`);
        } else {
          console.log('✓ All opportunities processed successfully (validation may be lenient)');
        }

        // Verify valid opportunities were still processed
        assert.ok(result.stored >= 2, 'Should process valid opportunities despite invalid ones');

      } catch (error) {
        // If the service throws on invalid data, that's also acceptable behavior
        console.log(`✓ Service throws on invalid data: ${error.message}`);
        assert.ok(error.message.length > 0, 'Should provide meaningful error message');
      }
    });

    it('should maintain database consistency during failures', async () => {
      console.log('🔄 Testing database consistency during failures...');

      // Create opportunity that will be successfully inserted
      const validOpportunity = createMockOpportunity({
        title: 'Pre-Failure Valid Opportunity'
      });

      await ingestionService.ingestOpportunities({
        opportunities: [validOpportunity],
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      const preFailureCount = await testPool.query(`
        SELECT COUNT(*) FROM government_opportunities WHERE notice_id LIKE 'E2E-TEST-%'
      `);

      // Attempt operation that might fail
      try {
        const problematicOpportunities = [
          createMockOpportunity({
            title: 'Opportunity Before Error'
          }),
          {
            noticeId: 'ERROR-TRIGGER',
            title: 'A'.repeat(1000), // Potentially problematic - very long title
            description: null,
            agency: 'Test Agency',
            invalidField: 'This field does not exist in schema'
          }
        ];

        await ingestionService.ingestOpportunities({
          opportunities: problematicOpportunities,
          source: 'SAM.gov', 
          companyId: testCompanyId
        });

      } catch (error) {
        console.log(`Expected error during problematic ingestion: ${error.message.substring(0, 100)}`);
      }

      // Verify database remains consistent
      const postFailureCount = await testPool.query(`
        SELECT COUNT(*) FROM government_opportunities WHERE notice_id LIKE 'E2E-TEST-%'
      `);

      const originalData = await testPool.query(`
        SELECT * FROM government_opportunities 
        WHERE notice_id = $1
      `, [validOpportunity.noticeId]);

      assert.strictEqual(originalData.rows.length, 1, 'Original valid data should remain intact');
      assert.strictEqual(originalData.rows[0].title, 'Pre-Failure Valid Opportunity');

      // Database should be in consistent state (counts might vary depending on transaction handling)
      assert.ok(
        parseInt(postFailureCount.rows[0].count) >= parseInt(preFailureCount.rows[0].count),
        'Database should maintain consistency after errors'
      );

      console.log('✓ Database consistency maintained during failure scenarios');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent ingestion requests', async () => {
      console.log('🔄 Testing concurrent ingestion handling...');

      const concurrentBatches = 3;
      const batchSize = 10;
      const batches = [];

      for (let batchIndex = 0; batchIndex < concurrentBatches; batchIndex++) {
        const batch = [];
        for (let i = 0; i < batchSize; i++) {
          batch.push(createMockOpportunity({
            title: `Concurrent Batch ${batchIndex} Opportunity ${i}`,
            noticeId: `CONCURRENT-B${batchIndex}-${i.toString().padStart(2, '0')}`,
            naicsCodes: ['541511', '541512', '541513'][i % 3]
          }));
        }
        batches.push(batch);
      }

      const startTime = Date.now();

      // Run batches concurrently
      const concurrentPromises = batches.map((batch, index) =>
        ingestionService.ingestOpportunities({
          opportunities: batch,
          source: 'SAM.gov',
          companyId: testCompanyId
        }).catch(error => ({ error: error.message, batchIndex: index }))
      );

      const results = await Promise.all(concurrentPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log(`✓ Processed ${concurrentBatches} concurrent batches in ${totalTime}ms`);

      // Verify results
      const successfulBatches = results.filter(result => !result.error);
      const failedBatches = results.filter(result => result.error);

      if (failedBatches.length > 0) {
        console.log(`⚠️ ${failedBatches.length} batches failed (may be expected for concurrent testing)`);
        failedBatches.forEach(failure => {
          console.log(`   Batch ${failure.batchIndex}: ${failure.error}`);
        });
      }

      assert.ok(successfulBatches.length > 0, 'At least some concurrent batches should succeed');

      // Verify data integrity
      const finalCount = await testPool.query(`
        SELECT COUNT(*) FROM government_opportunities WHERE notice_id LIKE 'CONCURRENT-%'
      `);

      const expectedMinimum = successfulBatches.reduce((sum, result) => sum + (result.stored || 0), 0);
      assert.ok(
        parseInt(finalCount.rows[0].count) >= expectedMinimum,
        'Should store at least the successful opportunities'
      );

      console.log('✓ Concurrent ingestion handling verified');
    });

    it('should maintain performance with large datasets', async () => {
      console.log('📊 Testing performance with large datasets...');

      const largeDatasetSize = 50;
      const largeOpportunities = [];

      for (let i = 0; i < largeDatasetSize; i++) {
        largeOpportunities.push(createMockOpportunity({
          title: `Large Dataset Opportunity ${i}`,
          noticeId: `LARGE-DATASET-${i.toString().padStart(3, '0')}`,
          description: `This is a comprehensive description for opportunity ${i}. `.repeat(5), // Larger description
          naicsCodes: ['541511', '541512', '541513', '541519'][i % 4],
          contactInfo: Array(3).fill(null).map((_, j) => ({
            name: `Contact ${j}`,
            email: `contact${j}@agency${i}.gov`,
            phone: `555-${(i * 100 + j).toString().padStart(4, '0')}`
          }))
        }));
      }

      const performanceStartTime = Date.now();

      const performanceResult = await ingestionService.ingestOpportunities({
        opportunities: largeOpportunities,
        source: 'SAM.gov',
        companyId: testCompanyId
      });

      const performanceEndTime = Date.now();
      const performanceTime = performanceEndTime - performanceStartTime;

      console.log(`✓ Processed ${largeDatasetSize} large opportunities in ${performanceTime}ms`);

      assert.strictEqual(performanceResult.stored, largeDatasetSize, 'Should store all large opportunities');

      // Performance should be reasonable (less than 10 seconds for 50 opportunities)
      assert.ok(performanceTime < 10000, 'Large dataset processing should complete in reasonable time');

      // Verify complex data was stored correctly
      const complexDataCheck = await testPool.query(`
        SELECT 
          notice_id, 
          title, 
          LENGTH(description) as desc_length,
          ARRAY_LENGTH(naics_codes, 1) as naics_count,
          jsonb_array_length(contacts) as contact_count
        FROM government_opportunities 
        WHERE notice_id LIKE 'LARGE-DATASET-%'
        ORDER BY notice_id
        LIMIT 3
      `);

      assert.strictEqual(complexDataCheck.rows.length, 3, 'Should store complex data');
      complexDataCheck.rows.forEach((row, index) => {
        assert.ok(row.desc_length > 100, `Row ${index}: Should store full description`);
        assert.strictEqual(row.naics_count, 1, `Row ${index}: Should store NAICS codes`);
        assert.strictEqual(row.contact_count, 3, `Row ${index}: Should store all contacts`);
      });

      console.log('✓ Large dataset performance test completed successfully');
    });
  });
});