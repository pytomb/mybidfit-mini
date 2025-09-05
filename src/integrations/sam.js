
const axios = require('axios');

const API_KEY = process.env.SAM_GOV_API_KEY;
const API_BASE_URL = 'https://api.sam.gov';
const API_ENDPOINT = `${API_BASE_URL}/opportunities/v2/search`;

// Generate default date range (last 30 days)
function getDefaultDateRange() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    postedFrom: `${(thirtyDaysAgo.getMonth() + 1).toString().padStart(2, '0')}/${thirtyDaysAgo.getDate().toString().padStart(2, '0')}/${thirtyDaysAgo.getFullYear()}`,
    postedTo: `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`
  };
}

// Common search parameter defaults with data management
const DEFAULT_PARAMS = {
  limit: 10, // Small default to prevent large data loads
  offset: 0,
  ptype: 'p', // Only posted opportunities
  ...getDefaultDateRange() // Add mandatory date range
};

// Data management constants
const MAX_SAFE_LIMIT = 100; // Maximum records per request
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache TTL
const MAX_TOTAL_RESULTS = 1000; // Hard limit on total results to prevent memory issues

// Simple in-memory cache for API responses
const responseCache = new Map();

/**
 * Generates a cache key from search parameters
 * @param {object} params - Search parameters
 * @returns {string} - Cache key
 */
function generateCacheKey(params) {
  const sortedParams = Object.keys(params).sort().reduce((result, key) => {
    result[key] = params[key];
    return result;
  }, {});
  return JSON.stringify(sortedParams);
}

/**
 * Validates and sanitizes search parameters to prevent excessive data loads
 * @param {object} params - Raw search parameters
 * @returns {object} - Sanitized parameters
 */
function sanitizeParams(params) {
  const sanitized = { ...params };
  
  // Enforce maximum limit to prevent large data loads
  if (sanitized.limit && sanitized.limit > MAX_SAFE_LIMIT) {
    console.warn(`Limiting request size from ${sanitized.limit} to ${MAX_SAFE_LIMIT} records`);
    sanitized.limit = MAX_SAFE_LIMIT;
  }
  
  // Ensure offset doesn't exceed reasonable bounds
  if (sanitized.offset && sanitized.offset > MAX_TOTAL_RESULTS) {
    throw new Error(`Offset ${sanitized.offset} exceeds maximum allowed (${MAX_TOTAL_RESULTS})`);
  }
  
  return sanitized;
}

/**
 * Checks cache for existing response
 * @param {string} cacheKey - Cache key to check
 * @returns {object|null} - Cached response or null
 */
function getCachedResponse(cacheKey) {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  
  // Clean up expired cache entry
  if (cached) {
    responseCache.delete(cacheKey);
  }
  
  return null;
}

/**
 * Stores response in cache
 * @param {string} cacheKey - Cache key
 * @param {object} data - Response data
 */
function setCachedResponse(cacheKey, data) {
  // Prevent cache from growing too large
  if (responseCache.size >= 50) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Fetches opportunities from the SAM.gov API with data management.
 *
 * @param {object} params - The search parameters.
 * @returns {Promise<object>} - A promise that resolves to the search results.
 */
async function fetchOpportunities(params = {}) {
  if (!API_KEY) {
    throw new Error('SAM.gov API key not configured.');
  }

  // Sanitize parameters to prevent excessive data loads
  const sanitizedParams = sanitizeParams(params);
  
  // Generate cache key (exclude API key from cache key)
  const cacheKey = generateCacheKey(sanitizedParams);
  
  // Check cache first
  const cachedResponse = getCachedResponse(cacheKey);
  if (cachedResponse) {
    console.log('📋 Returning cached SAM.gov response');
    return cachedResponse;
  }

  try {
    // Merge with defaults and ensure API key is included
    const searchParams = {
      ...DEFAULT_PARAMS,
      ...sanitizedParams,
      api_key: API_KEY,
    };

    console.log(`🔍 Fetching ${searchParams.limit} opportunities from SAM.gov (offset: ${searchParams.offset})`);
    console.log(`📊 Cache key: ${cacheKey.substring(0, 50)}...`);

    const response = await axios.get(API_ENDPOINT, {
      params: searchParams,
      timeout: 30000, // 30 second timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MyBidFit/1.0'
      }
    });
    
    // Validate response structure
    if (!response.data) {
      throw new Error('No data returned from SAM.gov API');
    }
    
    // Log response info
    const opportunityCount = response.data._embedded?.opportunities?.length || 0;
    const totalCount = response.data.page?.totalElements || 0;
    console.log(`✅ Retrieved ${opportunityCount} opportunities (${totalCount} total available)`);
    
    // Cache the response
    setCachedResponse(cacheKey, response.data);
    
    return response.data;
  } catch (error) {
    // Enhanced error handling
    if (error.code === 'ECONNABORTED') {
      const timeoutError = new Error('Request to SAM.gov API timed out');
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    
    if (error.response) {
      // Server responded with error status
      const statusError = new Error(`SAM.gov API request failed: ${error.response.status} ${error.response.statusText}`);
      statusError.status = error.response.status;
      statusError.data = error.response.data;
      
      // Add specific error messages for common status codes
      switch (error.response.status) {
        case 401:
          statusError.message = 'SAM.gov API authentication failed: Invalid or expired API key';
          break;
        case 403:
          statusError.message = 'SAM.gov API access forbidden: Check API key permissions';
          break;
        case 429:
          statusError.message = 'SAM.gov API rate limit exceeded: Please wait before making more requests';
          break;
        case 500:
        case 502:
        case 503:
          statusError.message = 'SAM.gov API server error: Please try again later';
          break;
      }
      
      console.error(`SAM.gov API Error [${error.response.status}]:`, error.response.data);
      throw statusError;
    } else if (error.request) {
      // Network error - no response received
      const networkError = new Error('Network error: Unable to reach SAM.gov API');
      networkError.code = 'NETWORK_ERROR';
      console.error('Network error connecting to SAM.gov:', error.message);
      throw networkError;
    } else {
      // Request setup error
      console.error('Error setting up SAM.gov API request:', error.message);
      throw error;
    }
  }
}

/**
 * Validates API key configuration
 * @returns {boolean} - True if API key is configured
 */
function isConfigured() {
  return Boolean(API_KEY && API_KEY.trim().length > 0);
}

/**
 * Gets API configuration status
 * @returns {object} - Configuration status information
 */
function getStatus() {
  return {
    configured: isConfigured(),
    endpoint: API_ENDPOINT,
    hasKey: Boolean(API_KEY),
    keyLength: API_KEY ? API_KEY.length : 0
  };
}

/**
 * Searches for opportunities with specific filters
 * @param {object} filters - Search filters
 * @param {string} filters.keywords - Search keywords
 * @param {string} filters.naics - NAICS code
 * @param {string} filters.state - State abbreviation
 * @param {number} filters.limit - Number of results to return (default: 10)
 * @param {number} filters.offset - Offset for pagination (default: 0)
 * @returns {Promise<object>} - Search results
 */
async function searchOpportunities({
  keywords,
  naics,
  state,
  limit = 10,
  offset = 0,
  ...additionalParams
} = {}) {
  const params = {
    limit,
    offset,
    ...additionalParams
  };

  if (keywords) {
    params.q = keywords;
  }
  
  if (naics) {
    params.naics = naics;
  }
  
  if (state) {
    params.state = state;
  }

  return await fetchOpportunities(params);
}

/**
 * Gets opportunities posted within a date range
 * @param {string} fromDate - Start date (MM/DD/YYYY format)
 * @param {string} toDate - End date (MM/DD/YYYY format)  
 * @param {object} additionalParams - Additional search parameters
 * @returns {Promise<object>} - Search results
 */
async function getOpportunitiesByDateRange(fromDate, toDate, additionalParams = {}) {
  return await fetchOpportunities({
    postedFrom: fromDate,
    postedTo: toDate,
    ...additionalParams
  });
}

/**
 * Gets active opportunities (not archived or deleted)
 * @param {object} params - Additional search parameters
 * @returns {Promise<object>} - Search results
 */
async function getActiveOpportunities(params = {}) {
  return await fetchOpportunities({
    ...params,
    ptype: 'p' // Posted opportunities only
  });
}

/**
 * Safely fetches multiple pages of opportunities with built-in limits
 * @param {object} params - Search parameters
 * @param {number} maxPages - Maximum pages to fetch (default: 5)
 * @param {number} maxRecords - Maximum total records to return (default: 500) 
 * @returns {Promise<object>} - Consolidated results
 */
async function fetchOpportunitiesWithPagination(params = {}, maxPages = 5, maxRecords = 500) {
  const results = [];
  const pageSize = Math.min(params.limit || DEFAULT_PARAMS.limit, MAX_SAFE_LIMIT);
  let currentOffset = params.offset || 0;
  let totalFetched = 0;
  let totalAvailable = 0;
  
  console.log(`📄 Starting paginated fetch: ${maxPages} pages max, ${maxRecords} records max`);
  
  for (let page = 0; page < maxPages && totalFetched < maxRecords; page++) {
    const pageParams = {
      ...params,
      limit: Math.min(pageSize, maxRecords - totalFetched),
      offset: currentOffset
    };
    
    console.log(`📄 Fetching page ${page + 1}/${maxPages} (offset: ${currentOffset})`);
    
    try {
      const response = await fetchOpportunities(pageParams);
      
      if (!response._embedded?.opportunities) {
        break;
      }
      
      const opportunities = response._embedded.opportunities;
      results.push(...opportunities);
      totalFetched += opportunities.length;
      totalAvailable = response.page?.totalElements || 0;
      
      console.log(`📄 Page ${page + 1} complete: ${opportunities.length} records (${totalFetched} total)`);
      
      // Stop if we've reached the end
      if (opportunities.length < pageSize || totalFetched >= totalAvailable) {
        console.log(`📄 Reached end of data (fetched: ${totalFetched}, available: ${totalAvailable})`);
        break;
      }
      
      currentOffset += pageSize;
      
      // Add delay between pages to be respectful to API
      if (page < maxPages - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`❌ Error fetching page ${page + 1}:`, error.message);
      throw error;
    }
  }
  
  return {
    _embedded: {
      opportunities: results
    },
    page: {
      size: pageSize,
      totalElements: totalAvailable,
      totalPages: Math.ceil(totalAvailable / pageSize),
      number: Math.floor(params.offset || 0 / pageSize),
      actuallyFetched: totalFetched,
      fetchedPages: Math.min(maxPages, Math.ceil(totalFetched / pageSize))
    },
    _meta: {
      dataManagement: {
        paginationUsed: true,
        maxPagesRequested: maxPages,
        maxRecordsRequested: maxRecords,
        actualRecordsFetched: totalFetched,
        cacheHits: 0 // Would need to track this
      }
    }
  };
}

/**
 * Gets a focused dataset for specific analysis (prevents large data loads)
 * @param {object} searchCriteria - Specific search criteria
 * @param {string} searchCriteria.naics - NAICS code for targeted search
 * @param {string} searchCriteria.state - State for geographic focus
 * @param {Array<string>} searchCriteria.keywords - Array of keywords
 * @param {number} maxResults - Maximum results to return (default: 50)
 * @returns {Promise<object>} - Focused search results
 */
async function getFocusedOpportunities({ naics, state, keywords = [], maxResults = 50 } = {}) {
  // Build focused query to minimize data load
  const queryParts = [];
  
  if (keywords.length > 0) {
    queryParts.push(keywords.join(' AND '));
  }
  
  const params = {
    limit: Math.min(maxResults, MAX_SAFE_LIMIT),
    offset: 0
  };
  
  if (queryParts.length > 0) {
    params.q = queryParts.join(' ');
  }
  
  if (naics) {
    params.naics = naics;
  }
  
  if (state) {
    params.state = state;
  }
  
  // Add additional filters to reduce dataset size
  params.ptype = 'p'; // Posted only
  // Note: Default date range is already applied in fetchOpportunities
  
  console.log(`🎯 Focused search: NAICS=${naics}, State=${state}, Keywords=${keywords.join(',')}, Max=${maxResults}`);
  
  return await fetchOpportunities(params);
}

/**
 * Clears the response cache to free memory
 */
function clearCache() {
  const cacheSize = responseCache.size;
  responseCache.clear();
  console.log(`🧹 Cleared SAM.gov cache (${cacheSize} entries)`);
}

/**
 * Gets cache statistics
 * @returns {object} - Cache statistics
 */
function getCacheStats() {
  return {
    size: responseCache.size,
    maxSize: 50,
    ttlMs: CACHE_TTL_MS,
    entries: Array.from(responseCache.keys()).map(key => ({
      key: key.substring(0, 50) + '...',
      age: Date.now() - responseCache.get(key).timestamp
    }))
  };
}

module.exports = {
  // Core functions
  fetchOpportunities,
  searchOpportunities,
  getOpportunitiesByDateRange,
  getActiveOpportunities,
  
  // Data management functions
  fetchOpportunitiesWithPagination,
  getFocusedOpportunities,
  
  // Configuration and status
  isConfigured,
  getStatus,
  
  // Cache management
  clearCache,
  getCacheStats,
  
  // Constants
  API_ENDPOINT,
  DEFAULT_PARAMS,
  MAX_SAFE_LIMIT,
  MAX_TOTAL_RESULTS
};
