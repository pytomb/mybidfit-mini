const { 
  fetchOpportunities, 
  fetchOpportunitiesWithPagination,
  getFocusedOpportunities,
  clearCache,
  getCacheStats,
  MAX_SAFE_LIMIT,
  MAX_TOTAL_RESULTS
} = require('../../src/integrations/sam');
const axios = require('axios');

// Load environment variables for testing
require('dotenv').config();

// Mock axios for offline testing
jest.mock('axios');
const mockedAxios = axios;

describe('SAM.gov API Integration - Data Management Tests', () => {
  let consoleLogSpy, consoleWarnSpy, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    clearCache();
    
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Data Load Management', () => {
    it('should enforce maximum safe limit', async () => {
      const mockResponse = {
        data: {
          _embedded: { opportunities: [] },
          page: { size: 100, totalElements: 0, totalPages: 0, number: 0 }
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Try to request more than MAX_SAFE_LIMIT
      await fetchOpportunities({ limit: 1000 });

      // Verify limit was capped
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            limit: MAX_SAFE_LIMIT
          })
        })
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Limiting request size from 1000 to ${MAX_SAFE_LIMIT}`)
      );
    });

    it('should reject excessive offset values', async () => {
      await expect(fetchOpportunities({ 
        offset: MAX_TOTAL_RESULTS + 1 
      })).rejects.toThrow(`Offset ${MAX_TOTAL_RESULTS + 1} exceeds maximum allowed (${MAX_TOTAL_RESULTS})`);
    });

    it('should use default parameters for safe data loading', async () => {
      const mockResponse = {
        data: {
          _embedded: { opportunities: [] },
          page: { size: 10, totalElements: 0, totalPages: 0, number: 0 }
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await fetchOpportunities();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            limit: 10,
            offset: 0,
            ptype: 'p'
          })
        })
      );
    });
  });

  describe('Caching System', () => {
    beforeEach(() => {
      const mockResponse = {
        data: {
          _embedded: {
            opportunities: [{ solicitationNumber: 'TEST-001', title: 'Test Opportunity' }]
          },
          page: { size: 10, totalElements: 1, totalPages: 1, number: 0 }
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);
    });

    it('should cache API responses', async () => {
      const params = { q: 'software', limit: 5 };

      // First request - should hit API
      await fetchOpportunities(params);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Second request with same params - should use cache
      await fetchOpportunities(params);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // No additional API call

      expect(consoleLogSpy).toHaveBeenCalledWith('📋 Returning cached SAM.gov response');
    });

    it('should cache different parameter combinations separately', async () => {
      await fetchOpportunities({ q: 'software' });
      await fetchOpportunities({ q: 'hardware' });
      await fetchOpportunities({ q: 'software' }); // Should use cache

      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Two different queries
    });

    it('should provide cache statistics', async () => {
      await fetchOpportunities({ q: 'test1' });
      await fetchOpportunities({ q: 'test2' });

      const stats = getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(50);
      expect(stats.ttlMs).toBe(5 * 60 * 1000);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries[0]).toHaveProperty('key');
      expect(stats.entries[0]).toHaveProperty('age');
    });

    it('should clear cache manually', async () => {
      await fetchOpportunities({ q: 'test' });
      
      let stats = getCacheStats();
      expect(stats.size).toBe(1);
      
      clearCache();
      
      stats = getCacheStats();
      expect(stats.size).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith('🧹 Cleared SAM.gov cache (1 entries)');
    });

    it('should prevent cache from growing too large', async () => {
      // Mock 60 different requests to exceed cache limit of 50
      for (let i = 0; i < 60; i++) {
        await fetchOpportunities({ q: `test${i}` });
      }
      
      const stats = getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(50);
    });
  });

  describe('Paginated Data Fetching', () => {
    it('should handle pagination correctly', async () => {
      const mockPage1 = {
        data: {
          _embedded: {
            opportunities: Array(10).fill().map((_, i) => ({ 
              solicitationNumber: `TEST-${i + 1}`, 
              title: `Opportunity ${i + 1}` 
            }))
          },
          page: { size: 10, totalElements: 25, totalPages: 3, number: 0 }
        }
      };
      
      const mockPage2 = {
        data: {
          _embedded: {
            opportunities: Array(10).fill().map((_, i) => ({ 
              solicitationNumber: `TEST-${i + 11}`, 
              title: `Opportunity ${i + 11}` 
            }))
          },
          page: { size: 10, totalElements: 25, totalPages: 3, number: 1 }
        }
      };
      
      const mockPage3 = {
        data: {
          _embedded: {
            opportunities: Array(5).fill().map((_, i) => ({ 
              solicitationNumber: `TEST-${i + 21}`, 
              title: `Opportunity ${i + 21}` 
            }))
          },
          page: { size: 10, totalElements: 25, totalPages: 3, number: 2 }
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockPage1)
        .mockResolvedValueOnce(mockPage2)
        .mockResolvedValueOnce(mockPage3);

      const result = await fetchOpportunitiesWithPagination({ q: 'test' }, 3, 25);

      expect(result._embedded.opportunities).toHaveLength(25);
      expect(result.page.actuallyFetched).toBe(25);
      expect(result._meta.dataManagement.paginationUsed).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);

      // Verify proper offset progression
      expect(mockedAxios.get).toHaveBeenNthCalledWith(1, expect.any(String), 
        expect.objectContaining({ params: expect.objectContaining({ offset: 0 }) }));
      expect(mockedAxios.get).toHaveBeenNthCalledWith(2, expect.any(String), 
        expect.objectContaining({ params: expect.objectContaining({ offset: 10 }) }));
      expect(mockedAxios.get).toHaveBeenNthCalledWith(3, expect.any(String), 
        expect.objectContaining({ params: expect.objectContaining({ offset: 20 }) }));
    });

    it('should respect maximum record limits in pagination', async () => {
      const mockResponse = {
        data: {
          _embedded: {
            opportunities: Array(10).fill().map((_, i) => ({ 
              solicitationNumber: `TEST-${i + 1}`, 
              title: `Opportunity ${i + 1}` 
            }))
          },
          page: { size: 10, totalElements: 1000, totalPages: 100, number: 0 }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchOpportunitiesWithPagination({ q: 'test' }, 2, 15);

      // Should stop at 15 records even though more pages are available
      expect(result._embedded.opportunities).toHaveLength(20); // 2 pages of 10 each
      expect(result._meta.dataManagement.maxRecordsRequested).toBe(15);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle pagination errors gracefully', async () => {
      clearCache(); // Clear cache to ensure fresh requests
      
      const mockPage1 = {
        data: {
          _embedded: { opportunities: Array(5).fill({ title: 'Test' }) },
          page: { size: 10, totalElements: 20, totalPages: 2, number: 0 }
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockPage1)
        .mockRejectedValueOnce(new Error('Network error on page 2'));

      await expect(fetchOpportunitiesWithPagination({ q: 'unique-test-query' }, 2, 20))
        .rejects.toThrow('Network error on page 2');

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error fetching page 2:', 'Network error on page 2');
    });
  });

  describe('Focused Search', () => {
    beforeEach(() => {
      clearCache(); // Clear cache to prevent test interference
      const mockResponse = {
        data: {
          _embedded: {
            opportunities: [{ solicitationNumber: 'FOCUSED-001', title: 'Focused Opportunity' }]
          },
          page: { size: 10, totalElements: 1, totalPages: 1, number: 0 }
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);
    });

    it('should build focused queries correctly', async () => {
      await getFocusedOpportunities({
        naics: '541511',
        state: 'VA',
        keywords: ['software', 'development'],
        maxResults: 25
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'software AND development',
            naics: '541511',
            state: 'VA',
            limit: 25,
            ptype: 'p',
            responseDeadline: expect.any(String)
          })
        })
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🎯 Focused search: NAICS=541511, State=VA, Keywords=software,development, Max=25'
      );
    });

    it('should limit focused search results', async () => {
      await getFocusedOpportunities({ maxResults: 200 });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            limit: MAX_SAFE_LIMIT // Should be capped
          })
        })
      );
    });

    it('should handle empty focused search criteria', async () => {
      await getFocusedOpportunities();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            limit: 50,
            ptype: 'p',
            responseDeadline: expect.any(String)
          })
        })
      );
    });
  });

  describe('Data Management Logging', () => {
    beforeEach(() => {
      const mockResponse = {
        data: {
          _embedded: { opportunities: [{ title: 'Test' }] },
          page: { size: 10, totalElements: 100, totalPages: 10, number: 0 }
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);
    });

    it('should log data fetch information', async () => {
      await fetchOpportunities({ q: 'software', limit: 20 });

      expect(consoleLogSpy).toHaveBeenCalledWith('🔍 Fetching 20 opportunities from SAM.gov (offset: 0)');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/📊 Cache key: .*/));
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Retrieved 1 opportunities (100 total available)');
    });

    it('should log pagination progress', async () => {
      const mockResponse = {
        data: {
          _embedded: { opportunities: Array(5).fill({ title: 'Test' }) },
          page: { size: 10, totalElements: 5, totalPages: 1, number: 0 }
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await fetchOpportunitiesWithPagination({ q: 'test' }, 2, 20);

      expect(consoleLogSpy).toHaveBeenCalledWith('📄 Starting paginated fetch: 2 pages max, 20 records max');
      expect(consoleLogSpy).toHaveBeenCalledWith('📄 Fetching page 1/2 (offset: 0)');
      expect(consoleLogSpy).toHaveBeenCalledWith('📄 Page 1 complete: 5 records (5 total)');
      expect(consoleLogSpy).toHaveBeenCalledWith('📄 Reached end of data (fetched: 5, available: 5)');
    });
  });
});