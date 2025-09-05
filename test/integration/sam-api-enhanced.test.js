const { 
  fetchOpportunities, 
  searchOpportunities,
  getOpportunitiesByDateRange,
  getActiveOpportunities,
  isConfigured,
  getStatus,
  API_ENDPOINT,
  DEFAULT_PARAMS
} = require('../../src/integrations/sam');
const axios = require('axios');

// Load environment variables for testing
require('dotenv').config();

// Mock axios for offline testing
jest.mock('axios');
const mockedAxios = axios;

describe('SAM.gov API Integration - Enhanced Tests', () => {
  let originalApiKey;

  beforeAll(() => {
    originalApiKey = process.env.SAM_GOV_API_KEY;
  });

  afterAll(() => {
    process.env.SAM_GOV_API_KEY = originalApiKey;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration Management', () => {
    it('should detect API key configuration correctly', () => {
      // Test with actual environment
      expect(isConfigured()).toBe(true);
      
      const status = getStatus();
      expect(status.configured).toBe(true);
      expect(status.hasKey).toBe(true);
      expect(status.endpoint).toBe(API_ENDPOINT);
      expect(status.keyLength).toBeGreaterThan(10);
    });

    it('should handle missing API key', () => {
      const tempKey = process.env.SAM_GOV_API_KEY;
      delete process.env.SAM_GOV_API_KEY;
      
      // Re-require the module to pick up env changes
      jest.resetModules();
      const samWithoutKey = require('../../src/integrations/sam');
      
      expect(samWithoutKey.isConfigured()).toBe(false);
      
      const status = samWithoutKey.getStatus();
      expect(status.configured).toBe(false);
      expect(status.hasKey).toBe(false);
      
      process.env.SAM_GOV_API_KEY = tempKey;
    });
  });

  describe('Core Functionality - Mocked Tests', () => {
    beforeEach(() => {
      // Setup default mock response
      const mockResponse = {
        data: {
          _embedded: {
            opportunities: [
              {
                solicitationNumber: 'TEST-001',
                title: 'Test Software Development',
                type: 'RFP',
                fullParentPathName: 'Department of Test',
                postedDate: '2025-01-01',
                responseDeadline: '2025-02-01',
                estimatedValue: { amount: 100000 }
              }
            ]
          },
          page: {
            size: 10,
            totalElements: 1,
            totalPages: 1,
            number: 0
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);
    });

    it('should fetch opportunities with proper headers and params', async () => {
      await fetchOpportunities({ q: 'software' });
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        API_ENDPOINT,
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'software',
            api_key: expect.any(String),
            ...DEFAULT_PARAMS
          }),
          timeout: 30000,
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'User-Agent': 'MyBidFit/1.0'
          })
        })
      );
    });

    it('should use searchOpportunities helper correctly', async () => {
      await searchOpportunities({
        keywords: 'software',
        naics: '541511',
        state: 'VA',
        limit: 5
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        API_ENDPOINT,
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'software',
            naics: '541511',
            state: 'VA',
            limit: 5,
            api_key: expect.any(String)
          })
        })
      );
    });

    it('should handle date range searches', async () => {
      await getOpportunitiesByDateRange('01/01/2025', '12/31/2025', { limit: 20 });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        API_ENDPOINT,
        expect.objectContaining({
          params: expect.objectContaining({
            postedFrom: '01/01/2025',
            postedTo: '12/31/2025',
            limit: 20,
            api_key: expect.any(String)
          })
        })
      );
    });

    it('should handle active opportunities search', async () => {
      await getActiveOpportunities({ q: 'technology' });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        API_ENDPOINT,
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'technology',
            ptype: 'p',
            api_key: expect.any(String)
          })
        })
      );
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 30000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      mockedAxios.get.mockRejectedValue(timeoutError);

      await expect(fetchOpportunities({ q: 'test' }))
        .rejects
        .toThrow('Request to SAM.gov API timed out');
    });

    it('should handle 401 authentication errors with detailed message', async () => {
      const authError = new Error('Request failed with status code 401');
      authError.response = {
        status: 401,
        statusText: 'Unauthorized',
        data: { message: 'Invalid API key' }
      };
      mockedAxios.get.mockRejectedValue(authError);

      try {
        await fetchOpportunities({ q: 'test' });
      } catch (error) {
        expect(error.message).toBe('SAM.gov API authentication failed: Invalid or expired API key');
        expect(error.status).toBe(401);
        expect(error.data).toEqual({ message: 'Invalid API key' });
      }
    });

    it('should handle rate limiting errors with retry guidance', async () => {
      const rateLimitError = new Error('Request failed with status code 429');
      rateLimitError.response = {
        status: 429,
        statusText: 'Too Many Requests',
        data: { message: 'Rate limit exceeded' }
      };
      mockedAxios.get.mockRejectedValue(rateLimitError);

      try {
        await fetchOpportunities({ q: 'test' });
      } catch (error) {
        expect(error.message).toBe('SAM.gov API rate limit exceeded: Please wait before making more requests');
        expect(error.status).toBe(429);
      }
    });

    it('should handle server errors appropriately', async () => {
      const serverError = new Error('Request failed with status code 500');
      serverError.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: { message: 'Internal server error' }
      };
      mockedAxios.get.mockRejectedValue(serverError);

      try {
        await fetchOpportunities({ q: 'test' });
      } catch (error) {
        expect(error.message).toBe('SAM.gov API server error: Please try again later');
        expect(error.status).toBe(500);
      }
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.request = {}; // Indicates request was made but no response
      mockedAxios.get.mockRejectedValue(networkError);

      try {
        await fetchOpportunities({ q: 'test' });
      } catch (error) {
        expect(error.message).toBe('Network error: Unable to reach SAM.gov API');
        expect(error.code).toBe('NETWORK_ERROR');
      }
    });

    it('should handle empty response data', async () => {
      mockedAxios.get.mockResolvedValue({ data: null });

      await expect(fetchOpportunities({ q: 'test' }))
        .rejects
        .toThrow('No data returned from SAM.gov API');
    });
  });

  describe('Data Structure Validation', () => {
    it('should return properly structured data', async () => {
      const mockResponse = {
        data: {
          _embedded: {
            opportunities: [
              {
                solicitationNumber: 'TEST-001',
                title: 'Test Opportunity',
                type: 'RFP',
                fullParentPathName: 'Department of Test',
                postedDate: '2025-01-01',
                responseDeadline: '2025-02-01'
              }
            ]
          },
          page: {
            size: 10,
            totalElements: 1,
            totalPages: 1,
            number: 0
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchOpportunities({ q: 'test' });

      // Validate expected structure
      expect(result).toHaveProperty('_embedded');
      expect(result).toHaveProperty('page');
      expect(result._embedded).toHaveProperty('opportunities');
      expect(result.page).toHaveProperty('totalElements');
      
      // Validate opportunity structure
      const opportunity = result._embedded.opportunities[0];
      expect(opportunity).toHaveProperty('solicitationNumber');
      expect(opportunity).toHaveProperty('title');
      expect(opportunity).toHaveProperty('type');
      expect(opportunity).toHaveProperty('postedDate');
      expect(opportunity).toHaveProperty('responseDeadline');
    });

    it('should handle empty results gracefully', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          _embedded: { opportunities: [] },
          page: { size: 10, totalElements: 0, totalPages: 0, number: 0 }
        }
      });

      const result = await fetchOpportunities({ q: 'nonexistentquery123' });
      
      expect(result._embedded.opportunities).toHaveLength(0);
      expect(result.page.totalElements).toBe(0);
    });
  });
});

// LIVE API TESTS (only run when explicitly enabled)
describe('SAM.gov API Integration - Live Tests', () => {
  const isLiveTestEnabled = process.env.ENABLE_LIVE_TESTS === 'true';
  
  beforeAll(() => {
    if (!isLiveTestEnabled) {
      console.log('🔸 Skipping live API tests. Set ENABLE_LIVE_TESTS=true to run live tests.');
    }
  });

  describe('Real API Connectivity', () => {
    it('should successfully fetch real opportunities', async () => {
      if (!isLiveTestEnabled) return;
      
      const result = await searchOpportunities({
        keywords: 'information technology',
        limit: 3,
      });
      
      expect(result).toBeDefined();
      expect(result._embedded).toBeDefined();
      expect(result._embedded.opportunities).toBeInstanceOf(Array);
      expect(result.page).toBeDefined();
      
      console.log(`✅ Retrieved ${result._embedded.opportunities.length} opportunities`);
      console.log(`📊 Total available: ${result.page.totalElements}`);
      
      if (result._embedded.opportunities.length > 0) {
        const firstOpp = result._embedded.opportunities[0];
        console.log(`📋 Sample: ${firstOpp.title} (${firstOpp.solicitationNumber})`);
        
        expect(firstOpp.solicitationNumber).toBeTruthy();
        expect(firstOpp.title).toBeTruthy();
      }
    }, 30000);

    it('should handle date range searches in live environment', async () => {
      if (!isLiveTestEnabled) return;
      
      // Search for opportunities posted in the last month
      const today = new Date();
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await getOpportunitiesByDateRange(
        `${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}/${lastMonth.getDate().toString().padStart(2, '0')}/${lastMonth.getFullYear()}`,
        `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`,
        { limit: 5 }
      );
      
      expect(result).toBeDefined();
      expect(result._embedded.opportunities).toBeInstanceOf(Array);
      
      console.log(`📅 Date range search: ${result._embedded.opportunities.length} opportunities`);
    }, 30000);

    it('should validate API performance', async () => {
      if (!isLiveTestEnabled) return;
      
      const startTime = Date.now();
      await getActiveOpportunities({ limit: 1 });
      const responseTime = Date.now() - startTime;
      
      console.log(`⏱️ API response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(15000); // 15 second limit for live API
    }, 20000);
  });

  describe('Integration Health Check', () => {
    it('should validate current configuration status', () => {
      const status = getStatus();
      
      console.log('🔧 SAM.gov Integration Status:', {
        configured: status.configured,
        endpoint: status.endpoint,
        hasValidKey: status.hasKey && status.keyLength > 10
      });
      
      expect(status.configured).toBe(true);
      expect(status.endpoint).toContain('api.sam.gov');
      expect(status.hasKey).toBe(true);
    });
  });
});