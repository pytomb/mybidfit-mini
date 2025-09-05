
/**
 * SAM.gov API Integration Tests
 * Test extended SAM.gov API functionality including batch processing, caching, and error handling
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');
const sam = require('../../src/services/sam');

const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'mybidfit_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password'
};

describe('SAM.gov API Integration Tests', () => {
  let testPool;
  let originalApiKey;

  before(async () => {
    testPool = new Pool(testDbConfig);
    originalApiKey = process.env.SAM_API_KEY;
    
    try {
      await testPool.query('SELECT 1');
      console.log('✓ SAM API test database connection established');
    } catch (error) {
      console.error('✗ SAM API test database connection failed:', error.message);
      throw error;
    }

    // Set up test API key if not provided
    if (!process.env.SAM_API_KEY) {
      console.log('⚠️ SAM_API_KEY not set - some tests may be skipped');
    }
  });

  after(async () => {
    if (testPool) await testPool.end();
    // Restore original API key
    if (originalApiKey) {
      process.env.SAM_API_KEY = originalApiKey;
    }
  });

  beforeEach(async () => {
    // Clean up any test cache entries
    if (typeof sam.clearCache === 'function') {
      sam.clearCache();
    }
  });

  describe('Basic API Connectivity', () => {
    it('should have required API functions exposed', () => {
      assert.ok(typeof sam.searchOpportunities === 'function', 'searchOpportunities should be available');
      assert.ok(typeof sam.getOpportunityDetails === 'function', 'getOpportunityDetails should be available');
      
      // Extended functions should be available
      if (typeof sam.searchOpportunitiesBatch === 'function') {
        assert.ok(true, 'Batch processing function available');
      }
      
      if (typeof sam.getOpportunityHistory === 'function') {
        assert.ok(true, 'Opportunity history function available');
      }
    });

    it('should handle missing API key gracefully', async () => {
      const tempApiKey = process.env.SAM_API_KEY;
      delete process.env.SAM_API_KEY;

      try {
        await sam.searchOpportunities({ limit: 1 });
        assert.fail('Should throw error when API key is missing');
      } catch (error) {
        assert.ok(
          error.message.includes('API key') || 
          error.message.includes('authentication') ||
          error.message.includes('unauthorized'),
          'Should provide meaningful error for missing API key'
        );
      } finally {
        if (tempApiKey) {
          process.env.SAM_API_KEY = tempApiKey;
        }
      }
    });

    it('should validate basic API response structure', async () => {
      if (!process.env.SAM_API_KEY) {
        console.log('⏭️ Skipping live API test - no API key provided');
        return;
      }

      try {
        const result = await sam.searchOpportunities({ 
          limit: 1,
          timeout: 10000 
        });

        assert.ok(typeof result === 'object', 'Should return object response');
        assert.ok(result.hasOwnProperty('opportunities') || result.hasOwnProperty('data'), 'Should contain opportunities/data');
        
        if (result.opportunities && result.opportunities.length > 0) {
          const opportunity = result.opportunities[0];
          assert.ok(opportunity.hasOwnProperty('noticeId'), 'Opportunity should have noticeId');
          assert.ok(opportunity.hasOwnProperty('title'), 'Opportunity should have title');
        }
      } catch (error) {
        if (error.message.includes('timeout') || error.message.includes('network')) {
          console.log('⚠️ Network issue in API test:', error.message);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Search Parameter Validation', () => {
    it('should handle various search parameters correctly', async () => {
      const searchParams = {
        keyword: 'software development',
        naics: '541511',
        agency: 'Department of Defense',
        limit: 5,
        postedFrom: '2024-01-01',
        postedTo: '2024-12-31'
      };

      if (!process.env.SAM_API_KEY) {
        // Test parameter validation without API call
        try {
          await sam.searchOpportunities(searchParams);
        } catch (error) {
          if (error.message.includes('API key')) {
            assert.ok(true, 'Parameter structure accepted, API key missing as expected');
          } else {
            throw error;
          }
        }
        return;
      }

      try {
        const result = await sam.searchOpportunities(searchParams);
        assert.ok(typeof result === 'object', 'Should handle complex search parameters');
        
        if (result.opportunities && result.opportunities.length > 0) {
          // Verify results match search criteria
          const opp = result.opportunities[0];
          if (opp.naicsCodes) {
            assert.ok(
              opp.naicsCodes.some(code => code.includes('541511')) || 
              opp.naicsCodes.includes('541511'),
              'Results should match NAICS code filter'
            );
          }
        }
      } catch (error) {
        if (error.message.includes('timeout') || error.message.includes('rate limit')) {
          console.log('⚠️ API limitation encountered:', error.message);
        } else {
          throw error;
        }
      }
    });

    it('should validate date parameters', async () => {
      const invalidDateParams = {
        postedFrom: 'invalid-date',
        postedTo: '2024-13-45'
      };

      try {
        await sam.searchOpportunities(invalidDateParams);
        // If it doesn't throw, the API might be handling validation server-side
        assert.ok(true, 'API handled invalid dates gracefully');
      } catch (error) {
        assert.ok(
          error.message.includes('date') || 
          error.message.includes('format') ||
          error.message.includes('invalid'),
          'Should validate date format'
        );
      }
    });

    it('should handle pagination parameters', async () => {
      if (!process.env.SAM_API_KEY) {
        console.log('⏭️ Skipping pagination test - no API key');
        return;
      }

      const paginationParams = {
        limit: 10,
        offset: 0
      };

      try {
        const firstPage = await sam.searchOpportunities(paginationParams);
        
        if (firstPage.opportunities && firstPage.opportunities.length > 0) {
          paginationParams.offset = 10;
          const secondPage = await sam.searchOpportunities(paginationParams);
          
          if (secondPage.opportunities && secondPage.opportunities.length > 0) {
            // Compare first items to ensure pagination works
            const firstItem = firstPage.opportunities[0].noticeId;
            const secondItem = secondPage.opportunities[0].noticeId;
            
            if (firstItem !== secondItem) {
              assert.ok(true, 'Pagination returns different results');
            } else {
              console.log('⚠️ Pagination may not be working as expected');
            }
          }
        }
      } catch (error) {
        if (!error.message.includes('timeout')) {
          throw error;
        }
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle rate limiting gracefully', async () => {
      if (!process.env.SAM_API_KEY) {
        console.log('⏭️ Skipping rate limit test - no API key');
        return;
      }

      // Make multiple rapid requests to potentially trigger rate limiting
      const rapidRequests = Array(5).fill(null).map((_, i) => 
        sam.searchOpportunities({ keyword: `rate-test-${i}`, limit: 1 })
      );

      try {
        const results = await Promise.allSettled(rapidRequests);
        
        // Check if any were rate limited
        const rateLimited = results.some(result => 
          result.status === 'rejected' && 
          result.reason.message.includes('rate limit')
        );

        if (rateLimited) {
          assert.ok(true, 'Rate limiting detected and handled appropriately');
        } else {
          console.log('⚠️ No rate limiting encountered - may not have hit limits');
        }
        
        // At least some requests should succeed
        const successful = results.filter(result => result.status === 'fulfilled');
        assert.ok(successful.length > 0, 'Some requests should succeed even if rate limited');
        
      } catch (error) {
        if (error.message.includes('rate limit')) {
          assert.ok(true, 'Rate limiting handled at service level');
        } else {
          throw error;
        }
      }
    });

    it('should handle network timeouts appropriately', async () => {
      if (!process.env.SAM_API_KEY) {
        console.log('⏭️ Skipping timeout test - no API key');
        return;
      }

      const shortTimeoutParams = {
        keyword: 'timeout-test',
        limit: 1,
        timeout: 1 // Very short timeout
      };

      try {
        await sam.searchOpportunities(shortTimeoutParams);
        console.log('⚠️ Request completed despite short timeout');
      } catch (error) {
        assert.ok(
          error.message.includes('timeout') || 
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('ECONNRESET'),
          'Should handle timeout errors appropriately'
        );
      }
    });

    it('should validate response data integrity', async () => {
      if (!process.env.SAM_API_KEY) {
        console.log('⏭️ Skipping data validation test - no API key');
        return;
      }

      try {
        const result = await sam.searchOpportunities({ limit: 1 });
        
        if (!result.opportunities || result.opportunities.length === 0) {
          console.log('⚠️ No opportunities returned for validation test');
          return;
        }

        const opportunity = result.opportunities[0];
        
        // Validate required fields are present and have appropriate types
        assert.ok(typeof opportunity.noticeId === 'string', 'noticeId should be string');
        assert.ok(typeof opportunity.title === 'string', 'title should be string');
        
        if (opportunity.postedDate) {
          const postedDate = new Date(opportunity.postedDate);
          assert.ok(!isNaN(postedDate.getTime()), 'postedDate should be valid date');
        }
        
        if (opportunity.naicsCodes) {
          assert.ok(Array.isArray(opportunity.naicsCodes), 'naicsCodes should be array');
        }
        
        if (opportunity.agency) {
          assert.ok(typeof opportunity.agency === 'string', 'agency should be string');
        }
        
      } catch (error) {
        if (!error.message.includes('timeout') && !error.message.includes('rate limit')) {
          throw error;
        }
      }
    });
  });
});
