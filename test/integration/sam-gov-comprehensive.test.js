const { fetchOpportunities } = require('../../src/integrations/sam');
const axios = require('axios');

// Mock axios for offline testing
jest.mock('axios');
const mockedAxios = axios;

describe('SAM.gov API Integration - Comprehensive Tests', () => {
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

  describe('API Configuration and Environment', () => {
    it('should have SAM_GOV_API_KEY environment variable configured', () => {
      expect(process.env.SAM_GOV_API_KEY).toBeDefined();
      expect(process.env.SAM_GOV_API_KEY).not.toBe('');
      expect(process.env.SAM_GOV_API_KEY.length).toBeGreaterThan(10);
    });

    it('should throw error when API key is not configured', async () => {
      const tempKey = process.env.SAM_GOV_API_KEY;
      delete process.env.SAM_GOV_API_KEY;
      
      await expect(fetchOpportunities({ q: 'test' }))
        .rejects
        .toThrow('SAM.gov API key not configured.');
      
      process.env.SAM_GOV_API_KEY = tempKey;
    });
  });

  describe('Mock API Response Testing', () => {
    it('should handle successful API response', async () => {
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
            size: 20,
            totalElements: 1,
            totalPages: 1,
            number: 0
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await fetchOpportunities({ q: 'software' });
      
      expect(result).toBeDefined();
      expect(result._embedded.opportunities).toBeInstanceOf(Array);
      expect(result._embedded.opportunities).toHaveLength(1);
      expect(result._embedded.opportunities[0].solicitationNumber).toBe('TEST-001');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.sam.gov/opportunities/v2/search',
        {
          params: {
            q: 'software',
            api_key: process.env.SAM_GOV_API_KEY
          }
        }
      );
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('Network Error');
      apiError.response = {
        status: 500,
        data: { message: 'Internal Server Error' }
      };

      mockedAxios.get.mockRejectedValueOnce(apiError);

      await expect(fetchOpportunities({ q: 'test' }))
        .rejects
        .toThrow('Network Error');
    });

    it('should handle 401 unauthorized errors', async () => {
      const authError = new Error('Request failed with status code 401');
      authError.response = {
        status: 401,
        data: { message: 'Invalid API key' }
      };

      mockedAxios.get.mockRejectedValueOnce(authError);

      await expect(fetchOpportunities({ q: 'test' }))
        .rejects
        .toThrow('Request failed with status code 401');
    });

    it('should handle rate limiting (429) errors', async () => {
      const rateLimitError = new Error('Request failed with status code 429');
      rateLimitError.response = {
        status: 429,
        data: { message: 'Rate limit exceeded' }
      };

      mockedAxios.get.mockRejectedValueOnce(rateLimitError);

      await expect(fetchOpportunities({ q: 'test' }))
        .rejects
        .toThrow('Request failed with status code 429');
    });
  });

  describe('Parameter Validation', () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({
        data: {
          _embedded: { opportunities: [] },
          page: { size: 20, totalElements: 0, totalPages: 0, number: 0 }
        }
      });
    });

    it('should pass through search parameters correctly', async () => {
      const searchParams = {
        q: 'software development',
        limit: 10,
        offset: 0,
        postedFrom: '01/01/2025',
        postedTo: '12/31/2025',
        ntype: 'p,k'
      };

      await fetchOpportunities(searchParams);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.sam.gov/opportunities/v2/search',
        {
          params: {
            ...searchParams,
            api_key: process.env.SAM_GOV_API_KEY
          }
        }
      );
    });

    it('should handle empty parameters', async () => {
      await fetchOpportunities({});

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.sam.gov/opportunities/v2/search',
        {
          params: {
            api_key: process.env.SAM_GOV_API_KEY
          }
        }
      );
    });
  });

  describe('Data Structure Validation', () => {
    it('should return expected data structure', async () => {
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
            size: 20,
            totalElements: 1,
            totalPages: 1,
            number: 0
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await fetchOpportunities({ q: 'test' });

      // Validate expected structure
      expect(result).toHaveProperty('_embedded');
      expect(result).toHaveProperty('page');
      expect(result._embedded).toHaveProperty('opportunities');
      expect(result.page).toHaveProperty('totalElements');
      expect(result.page).toHaveProperty('size');
      
      // Validate opportunity structure
      const opportunity = result._embedded.opportunities[0];
      expect(opportunity).toHaveProperty('solicitationNumber');
      expect(opportunity).toHaveProperty('title');
      expect(opportunity).toHaveProperty('type');
      expect(opportunity).toHaveProperty('postedDate');
      expect(opportunity).toHaveProperty('responseDeadline');
    });
  });
});

// LIVE API TESTS (only run if ENABLE_LIVE_TESTS=true)
describe('SAM.gov API Integration - Live Tests', () => {
  const isLiveTestEnabled = process.env.ENABLE_LIVE_TESTS === 'true';
  
  beforeAll(() => {
    if (!isLiveTestEnabled) {
      console.log('🔸 Skipping live API tests. Set ENABLE_LIVE_TESTS=true to run live tests.');
    }
  });

  describe('Real API Connectivity', () => {
    it('should successfully fetch real opportunities from SAM.gov', async () => {
      if (!isLiveTestEnabled) return;
      
      const searchParams = {
        q: 'information technology',
        limit: 5,
        ptype: 'p' // Only active opportunities
      };

      const result = await fetchOpportunities(searchParams);
      
      // Basic structure validation
      expect(result).toBeDefined();
      expect(result._embedded).toBeDefined();
      expect(result._embedded.opportunities).toBeInstanceOf(Array);
      expect(result.page).toBeDefined();
      expect(typeof result.page.totalElements).toBe('number');
      
      // Log results for manual verification
      console.log(`✅ Successfully retrieved ${result._embedded.opportunities.length} opportunities`);
      console.log(`📊 Total available: ${result.page.totalElements}`);
      
      if (result._embedded.opportunities.length > 0) {
        const firstOpp = result._embedded.opportunities[0];
        console.log(`📋 Sample opportunity: ${firstOpp.title} (${firstOpp.solicitationNumber})`);
        
        // Validate required fields exist
        expect(firstOpp.solicitationNumber).toBeTruthy();
        expect(firstOpp.title).toBeTruthy();
        expect(firstOpp.type).toBeTruthy();
        expect(firstOpp.postedDate).toBeTruthy();
        expect(firstOpp.responseDeadline).toBeTruthy();
      }
    }, 30000); // 30 second timeout for live API

    it('should handle various search parameters in live environment', async () => {
      if (!isLiveTestEnabled) return;
      
      // Test different search scenarios
      const testCases = [
        { params: { q: 'software', limit: 2 }, description: 'keyword search' },
        { params: { naics: '541511', limit: 2 }, description: 'NAICS code search' },
        { params: { state: 'VA', limit: 2 }, description: 'state-based search' }
      ];

      for (const testCase of testCases) {
        console.log(`🔍 Testing ${testCase.description}...`);
        
        const result = await fetchOpportunities(testCase.params);
        
        expect(result).toBeDefined();
        expect(result._embedded.opportunities).toBeInstanceOf(Array);
        
        console.log(`   ✅ ${testCase.description}: ${result._embedded.opportunities.length} results`);
      }
    }, 45000); // 45 second timeout for multiple API calls
  });

  describe('API Performance and Reliability', () => {
    it('should respond within reasonable time limits', async () => {
      if (!isLiveTestEnabled) return;
      
      const startTime = Date.now();
      
      await fetchOpportunities({ q: 'test', limit: 1 });
      
      const responseTime = Date.now() - startTime;
      console.log(`⏱️ API response time: ${responseTime}ms`);
      
      // Expect response within 10 seconds (SAM.gov can be slow)
      expect(responseTime).toBeLessThan(10000);
    }, 15000);

    it('should handle edge cases gracefully', async () => {
      if (!isLiveTestEnabled) return;
      
      // Test with parameters that should return no results
      const result = await fetchOpportunities({ 
        q: 'xyznonexistentquerythatshouldretur0results123',
        limit: 1 
      });
      
      expect(result).toBeDefined();
      expect(result._embedded.opportunities).toBeInstanceOf(Array);
      expect(result._embedded.opportunities).toHaveLength(0);
      expect(result.page.totalElements).toBe(0);
    }, 15000);
  });
});