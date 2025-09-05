
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
 * Fetches detailed information for a specific opportunity by its notice ID
 * @param {string} noticeId - The SAM.gov notice ID for the opportunity
 * @param {object} options - Additional options
 * @param {boolean} options.includeAttachments - Include attachment details (default: true)
 * @param {boolean} options.includeContacts - Include contact information (default: true)
 * @param {boolean} options.includeAmendments - Include amendments if any (default: true)
 * @returns {Promise<object>} - Detailed opportunity information
 */
async function fetchOpportunityDetails(noticeId, options = {}) {
  if (!API_KEY) {
    throw new Error('SAM.gov API key not configured.');
  }

  if (!noticeId || typeof noticeId !== 'string') {
    throw new Error('Valid notice ID is required for fetching opportunity details');
  }

  const {
    includeAttachments = true,
    includeContacts = true,
    includeAmendments = true
  } = options;

  // Generate cache key for detailed fetch
  const detailCacheKey = generateCacheKey({
    operation: 'opportunity_detail',
    noticeId,
    includeAttachments,
    includeContacts,
    includeAmendments
  });

  // Check cache first
  const cachedResponse = getCachedResponse(detailCacheKey);
  if (cachedResponse) {
    console.log(`📋 Returning cached opportunity detail for ${noticeId}`);
    return cachedResponse;
  }

  try {
    console.log(`🔍 Fetching detailed information for opportunity: ${noticeId}`);
    
    // SAM.gov detail endpoint - using the opportunities endpoint with specific notice ID
    const detailEndpoint = `${API_BASE_URL}/opportunities/v2/search`;
    
    const searchParams = {
      api_key: API_KEY,
      noticeid: noticeId,
      limit: 1, // We only want this specific opportunity
      includeawarded: 'Yes', // Include if already awarded
      includeclosed: 'Yes' // Include if closed
    };

    const response = await axios.get(detailEndpoint, {
      params: searchParams,
      timeout: 45000, // Longer timeout for detail fetch
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MyBidFit/1.0'
      }
    });

    if (!response.data || !response.data._embedded || !response.data._embedded.opportunities) {
      throw new Error(`No opportunity found with notice ID: ${noticeId}`);
    }

    const opportunities = response.data._embedded.opportunities;
    if (opportunities.length === 0) {
      throw new Error(`No opportunity found with notice ID: ${noticeId}`);
    }

    const opportunity = opportunities[0];
    
    // Enhance opportunity data with additional processing
    const enhancedOpportunity = await enhanceOpportunityDetails(opportunity, {
      includeAttachments,
      includeContacts,
      includeAmendments
    });

    console.log(`✅ Successfully fetched details for opportunity: ${opportunity.title || noticeId}`);
    
    // Cache the enhanced response
    setCachedResponse(detailCacheKey, enhancedOpportunity);
    
    return enhancedOpportunity;

  } catch (error) {
    // Enhanced error handling for detail fetch
    if (error.code === 'ECONNABORTED') {
      const timeoutError = new Error(`Timeout fetching details for opportunity ${noticeId}`);
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    
    if (error.response) {
      const statusError = new Error(`SAM.gov detail fetch failed: ${error.response.status} for notice ${noticeId}`);
      statusError.status = error.response.status;
      statusError.noticeId = noticeId;
      statusError.data = error.response.data;
      
      // Add specific error messages for detail fetch
      switch (error.response.status) {
        case 404:
          statusError.message = `Opportunity not found: ${noticeId} may have been removed or notice ID is incorrect`;
          break;
        case 401:
          statusError.message = 'SAM.gov API authentication failed: Invalid or expired API key for detail fetch';
          break;
        case 403:
          statusError.message = 'SAM.gov API access forbidden: Check API key permissions for detail access';
          break;
        case 429:
          statusError.message = 'SAM.gov API rate limit exceeded: Please wait before making more detail requests';
          break;
      }
      
      console.error(`SAM.gov Detail Fetch Error [${error.response.status}] for ${noticeId}:`, error.response.data);
      throw statusError;
    }
    
    console.error(`Error fetching opportunity details for ${noticeId}:`, error.message);
    throw error;
  }
}

/**
 * Enhances opportunity data with additional processing and normalization
 * @param {object} opportunity - Raw opportunity data from SAM.gov
 * @param {object} options - Enhancement options
 * @returns {Promise<object>} - Enhanced opportunity data
 */
async function enhanceOpportunityDetails(opportunity, options = {}) {
  const {
    includeAttachments = true,
    includeContacts = true,
    includeAmendments = true
  } = options;

  try {
    const enhanced = {
      ...opportunity,
      
      // Enhanced metadata
      _enhanced: {
        processedAt: new Date().toISOString(),
        dataQualityScore: calculateDataQualityScore(opportunity),
        completenessScore: calculateCompletenessScore(opportunity),
        enhancementVersion: '1.0'
      },

      // Normalized and parsed data
      _parsed: {
        title: cleanText(opportunity.title),
        description: cleanText(opportunity.description),
        
        // Extract and normalize NAICS codes
        naicsCodes: extractNaicsCodes(opportunity),
        
        // Extract and normalize PSC codes
        pscCodes: extractPscCodes(opportunity),
        
        // Parse dates with error handling
        dates: parseDates(opportunity),
        
        // Parse and normalize financial information
        financial: parseFinancialInfo(opportunity),
        
        // Parse location information
        location: parseLocationInfo(opportunity),
        
        // Extract and normalize contact information
        contacts: includeContacts ? parseContactInfo(opportunity) : [],
        
        // Extract and process attachments
        attachments: includeAttachments ? parseAttachments(opportunity) : [],
        
        // Extract set-aside information
        setAside: parseSetAsideInfo(opportunity),
        
        // Extract agency and office information
        agency: parseAgencyInfo(opportunity),
        
        // Parse opportunity type and classification
        classification: parseClassificationInfo(opportunity)
      },

      // Risk and opportunity indicators
      _analysis: {
        riskFactors: identifyRiskFactors(opportunity),
        opportunityFactors: identifyOpportunityFactors(opportunity),
        competitiveIndicators: identifyCompetitiveIndicators(opportunity),
        requirementsComplexity: assessRequirementsComplexity(opportunity)
      }
    };

    // Add amendment information if requested and available
    if (includeAmendments && opportunity.amendments) {
      enhanced._parsed.amendments = parseAmendments(opportunity.amendments);
      enhanced._analysis.hasAmendments = true;
      enhanced._analysis.amendmentCount = opportunity.amendments.length;
    }

    return enhanced;

  } catch (error) {
    console.warn(`Warning: Error enhancing opportunity details: ${error.message}`);
    // Return original opportunity with minimal enhancement if processing fails
    return {
      ...opportunity,
      _enhanced: {
        processedAt: new Date().toISOString(),
        enhancementError: error.message,
        enhancementVersion: '1.0'
      }
    };
  }
}

/**
 * Fetches multiple opportunity details in batch with efficient processing
 * @param {Array<string>} noticeIds - Array of notice IDs to fetch
 * @param {object} options - Batch processing options
 * @param {number} options.batchSize - Number of requests to process simultaneously (default: 3)
 * @param {number} options.delayBetweenBatches - Delay in ms between batches (default: 1000)
 * @returns {Promise<Array<object>>} - Array of enhanced opportunity details
 */
async function fetchOpportunityDetailsBatch(noticeIds, options = {}) {
  const {
    batchSize = 3,
    delayBetweenBatches = 1000,
    includeAttachments = true,
    includeContacts = true,
    includeAmendments = true
  } = options;

  if (!Array.isArray(noticeIds) || noticeIds.length === 0) {
    throw new Error('Valid array of notice IDs is required for batch fetch');
  }

  console.log(`📦 Starting batch fetch for ${noticeIds.length} opportunities (batch size: ${batchSize})`);
  
  const results = [];
  const errors = [];
  
  // Process in batches to respect rate limits
  for (let i = 0; i < noticeIds.length; i += batchSize) {
    const batch = noticeIds.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(noticeIds.length / batchSize)} (${batch.length} items)`);
    
    // Process batch items in parallel
    const batchPromises = batch.map(async (noticeId) => {
      try {
        const details = await fetchOpportunityDetails(noticeId, {
          includeAttachments,
          includeContacts,
          includeAmendments
        });
        return { noticeId, success: true, data: details };
      } catch (error) {
        console.error(`❌ Failed to fetch details for ${noticeId}:`, error.message);
        return { noticeId, success: false, error: error.message };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    // Separate successful results from errors
    batchResults.forEach(result => {
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push(result);
      }
    });
    
    // Add delay between batches (except for the last batch)
    if (i + batchSize < noticeIds.length && delayBetweenBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  console.log(`📦 Batch fetch completed: ${results.length} successful, ${errors.length} failed`);
  
  if (errors.length > 0) {
    console.warn('❌ Failed notice IDs:', errors.map(e => e.noticeId).join(', '));
  }
  
  return {
    successful: results,
    failed: errors,
    summary: {
      totalRequested: noticeIds.length,
      successful: results.length,
      failed: errors.length,
      successRate: Math.round((results.length / noticeIds.length) * 100)
    }
  };
}

// Helper functions for data enhancement and parsing

function calculateDataQualityScore(opportunity) {
  let score = 0;
  let maxScore = 0;
  
  // Check for required fields
  const requiredFields = ['title', 'description', 'postedDate', 'type'];
  requiredFields.forEach(field => {
    maxScore += 10;
    if (opportunity[field]) score += 10;
  });
  
  // Check for optional but valuable fields
  const valuableFields = ['awardNumber', 'naicsCode', 'placeOfPerformance', 'contacts'];
  valuableFields.forEach(field => {
    maxScore += 5;
    if (opportunity[field]) score += 5;
  });
  
  return Math.round((score / maxScore) * 100);
}

function calculateCompletenessScore(opportunity) {
  let score = 0;
  const totalFields = Object.keys(opportunity).length;
  const filledFields = Object.values(opportunity).filter(value => 
    value !== null && value !== undefined && value !== ''
  ).length;
  
  return Math.round((filledFields / totalFields) * 100);
}

function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.trim().replace(/\s+/g, ' ').replace(/[\r\n\t]/g, ' ');
}

function extractNaicsCodes(opportunity) {
  const codes = [];
  
  // Check various fields where NAICS codes might be stored
  if (opportunity.naicsCode) {
    codes.push(opportunity.naicsCode);
  }
  
  if (opportunity.classification && opportunity.classification.naicsCode) {
    codes.push(opportunity.classification.naicsCode);
  }
  
  // Extract from description if pattern matches
  const naicsPattern = /NAICS[\s:]*([\d,\s]+)/gi;
  const description = opportunity.description || '';
  const matches = description.match(naicsPattern);
  if (matches) {
    matches.forEach(match => {
      const extractedCodes = match.replace(/NAICS[\s:]*/, '').split(/[,\s]+/).filter(code => /^\d{6}$/.test(code));
      codes.push(...extractedCodes);
    });
  }
  
  // Return unique codes
  return [...new Set(codes)].filter(code => /^\d{6}$/.test(code));
}

function extractPscCodes(opportunity) {
  const codes = [];
  
  if (opportunity.pscCode) {
    codes.push(opportunity.pscCode);
  }
  
  if (opportunity.classification && opportunity.classification.pscCode) {
    codes.push(opportunity.classification.pscCode);
  }
  
  return [...new Set(codes)];
}

function parseDates(opportunity) {
  const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toISOString();
    } catch (error) {
      return null;
    }
  };
  
  return {
    posted: parseDate(opportunity.postedDate),
    due: parseDate(opportunity.responseDeadLine || opportunity.dueDate),
    popStart: parseDate(opportunity.performancePeriod?.startDate),
    popEnd: parseDate(opportunity.performancePeriod?.endDate),
    lastModified: parseDate(opportunity.lastModified)
  };
}

function parseFinancialInfo(opportunity) {
  const parseAmount = (amount) => {
    if (!amount) return null;
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const cleaned = amount.replace(/[$,]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };
  
  return {
    estimatedValue: parseAmount(opportunity.awardAmount),
    minimumValue: parseAmount(opportunity.minAwardAmount),
    maximumValue: parseAmount(opportunity.maxAwardAmount),
    currency: 'USD'
  };
}

function parseLocationInfo(opportunity) {
  const location = opportunity.placeOfPerformance || {};
  return {
    city: location.city || null,
    state: location.state || null,
    country: location.country || 'USA',
    zipCode: location.zip || null,
    address: location.streetAddress || null
  };
}

function parseContactInfo(opportunity) {
  const contacts = [];
  
  if (opportunity.pointOfContact) {
    contacts.push({
      type: 'primary',
      name: opportunity.pointOfContact.fullName,
      email: opportunity.pointOfContact.email,
      phone: opportunity.pointOfContact.phone,
      title: opportunity.pointOfContact.title
    });
  }
  
  if (opportunity.contacts && Array.isArray(opportunity.contacts)) {
    opportunity.contacts.forEach(contact => {
      contacts.push({
        type: contact.type || 'general',
        name: contact.fullName || contact.name,
        email: contact.email,
        phone: contact.phone,
        title: contact.title
      });
    });
  }
  
  return contacts;
}

function parseAttachments(opportunity) {
  if (!opportunity.attachments || !Array.isArray(opportunity.attachments)) {
    return [];
  }
  
  return opportunity.attachments.map(attachment => ({
    filename: attachment.filename || attachment.name,
    description: attachment.description,
    size: attachment.size,
    type: attachment.mimeType || attachment.type,
    url: attachment.url,
    lastModified: attachment.lastModified
  }));
}

function parseSetAsideInfo(opportunity) {
  const setAside = opportunity.setAside || opportunity.typeOfSetAside;
  if (!setAside) return null;
  
  // Normalize set-aside types
  const normalizedSetAsides = {
    'Total Small Business': 'Total_Small_Business',
    'Service-Disabled Veteran-Owned Small Business': 'SDVOSB',
    'Women-Owned Small Business': 'WOSB',
    'HUBZone Small Business': 'HUBZone',
    '8(a) Small Business': '8(a)',
    'Historically Underutilized Business Zone Small Business': 'HUBZone'
  };
  
  return normalizedSetAsides[setAside] || setAside;
}

function parseAgencyInfo(opportunity) {
  return {
    name: opportunity.department || opportunity.agency || opportunity.organizationName,
    office: opportunity.office || opportunity.organizationName,
    subAgency: opportunity.subAgency
  };
}

function parseClassificationInfo(opportunity) {
  return {
    type: opportunity.type || opportunity.opportunityType,
    category: opportunity.category,
    solicitationNumber: opportunity.solicitationNumber,
    awardNumber: opportunity.awardNumber
  };
}

function identifyRiskFactors(opportunity) {
  const risks = [];
  
  // Check for tight deadlines
  if (opportunity.responseDeadLine) {
    const daysUntilDue = Math.ceil((new Date(opportunity.responseDeadLine) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 14) {
      risks.push('Tight deadline - less than 14 days to respond');
    }
  }
  
  // Check for incumbent advantages
  if (opportunity.description && opportunity.description.toLowerCase().includes('incumbent')) {
    risks.push('Potential incumbent advantage mentioned');
  }
  
  // Check for complex requirements
  const description = (opportunity.description || '').toLowerCase();
  const complexityIndicators = ['security clearance', 'classified', 'complex', 'multiple locations', 'integration'];
  complexityIndicators.forEach(indicator => {
    if (description.includes(indicator)) {
      risks.push(`Complex requirements: ${indicator}`);
    }
  });
  
  return risks;
}

function identifyOpportunityFactors(opportunity) {
  const factors = [];
  
  // Check for small business set-asides
  if (opportunity.setAside && opportunity.setAside.toLowerCase().includes('small business')) {
    factors.push('Small business set-aside opportunity');
  }
  
  // Check for multi-year opportunities
  if (opportunity.description && opportunity.description.toLowerCase().includes('multi-year')) {
    factors.push('Multi-year contract opportunity');
  }
  
  // Check for strategic keywords
  const description = (opportunity.description || '').toLowerCase();
  const strategicKeywords = ['innovation', 'modernization', 'digital transformation', 'cloud'];
  strategicKeywords.forEach(keyword => {
    if (description.includes(keyword)) {
      factors.push(`Strategic opportunity: ${keyword}`);
    }
  });
  
  return factors;
}

function identifyCompetitiveIndicators(opportunity) {
  const indicators = [];
  
  // Estimate competition level based on opportunity characteristics
  const description = (opportunity.description || '').toLowerCase();
  
  if (description.includes('pre-qualified') || description.includes('idiq')) {
    indicators.push('May have pre-qualified vendors - moderate competition');
  }
  
  if (description.includes('broad agency announcement') || description.includes('baa')) {
    indicators.push('BAA - typically high competition');
  }
  
  if (opportunity.setAside && opportunity.setAside.toLowerCase().includes('small business')) {
    indicators.push('Small business set-aside - reduced competition pool');
  }
  
  return indicators;
}

function assessRequirementsComplexity(opportunity) {
  const description = (opportunity.description || '').toLowerCase();
  let complexityScore = 1; // Base score
  
  // Check for complexity indicators
  const complexityFactors = [
    'security clearance', 'classified', 'multiple locations', 'integration',
    'legacy systems', 'migration', 'complex', 'enterprise', 'scalable'
  ];
  
  complexityFactors.forEach(factor => {
    if (description.includes(factor)) {
      complexityScore += 1;
    }
  });
  
  return Math.min(complexityScore, 5); // Cap at 5
}

function parseAmendments(amendments) {
  if (!Array.isArray(amendments)) return [];
  
  return amendments.map(amendment => ({
    amendmentNumber: amendment.amendmentNumber,
    description: amendment.description,
    postedDate: amendment.postedDate,
    type: amendment.type || 'general'
  }));
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
  
  // Enhanced detail fetching functions
  fetchOpportunityDetails,
  fetchOpportunityDetailsBatch,
  enhanceOpportunityDetails,
  
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
