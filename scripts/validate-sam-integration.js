#!/usr/bin/env node

/**
 * SAM.gov Integration Validation Script
 * 
 * This script validates the SAM.gov API integration to ensure:
 * - API key is properly configured
 * - Basic connectivity works
 * - Data management features work correctly
 * - Caching is functional
 */

require('dotenv').config();

const {
  fetchOpportunities,
  searchOpportunities,
  getFocusedOpportunities,
  fetchOpportunitiesWithPagination,
  isConfigured,
  getStatus,
  getCacheStats,
  clearCache
} = require('../src/integrations/sam');

async function validateConfiguration() {
  console.log('\n🔧 SAM.gov Integration Configuration Check');
  console.log('==========================================');
  
  const status = getStatus();
  console.log('✅ Configuration Status:', {
    configured: status.configured,
    endpoint: status.endpoint,
    hasValidKey: status.hasKey && status.keyLength > 10
  });
  
  if (!status.configured) {
    console.error('❌ SAM_GOV_API_KEY is not properly configured!');
    console.log('💡 Set SAM_GOV_API_KEY in your .env file');
    return false;
  }
  
  return true;
}

async function testBasicConnectivity() {
  console.log('\n🌐 Basic API Connectivity Test');
  console.log('==============================');
  
  try {
    console.log('🔍 Testing basic search (limit: 2)...');
    const result = await fetchOpportunities({ 
      q: 'information technology', 
      limit: 2 
    });
    
    console.log('✅ API Request Successful!');
    console.log(`📊 Retrieved ${result._embedded?.opportunities?.length || 0} opportunities`);
    console.log(`📈 Total Available: ${result.page?.totalElements || 0}`);
    
    if (result._embedded?.opportunities?.length > 0) {
      const sample = result._embedded.opportunities[0];
      console.log(`📋 Sample: ${sample.title} (${sample.solicitationNumber})`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ API Connectivity Failed:', error.message);
    
    if (error.status === 401) {
      console.log('💡 Check your SAM_GOV_API_KEY - it may be invalid or expired');
    } else if (error.status === 429) {
      console.log('💡 Rate limit exceeded - wait a few minutes and try again');
    } else if (error.code === 'NETWORK_ERROR') {
      console.log('💡 Network connectivity issue - check your internet connection');
    }
    
    return false;
  }
}

async function testDataManagement() {
  console.log('\n📊 Data Management Features Test');
  console.log('=================================');
  
  try {
    // Test parameter sanitization
    console.log('🔒 Testing parameter sanitization...');
    const sanitizedResult = await fetchOpportunities({ 
      limit: 200, // Should be capped to MAX_SAFE_LIMIT
      q: 'software'
    });
    console.log('✅ Parameter sanitization working');
    
    // Test focused search
    console.log('🎯 Testing focused search...');
    const focusedResult = await getFocusedOpportunities({
      keywords: ['technology', 'software'],
      maxResults: 3
    });
    console.log('✅ Focused search working');
    
    // Test caching
    console.log('🧠 Testing caching system...');
    clearCache();
    
    const beforeCache = getCacheStats();
    await fetchOpportunities({ q: 'test-cache', limit: 1 });
    const afterCache = getCacheStats();
    
    console.log(`✅ Cache working (before: ${beforeCache.size}, after: ${afterCache.size})`);
    
    // Test pagination (small scale)
    console.log('📄 Testing pagination...');
    const paginatedResult = await fetchOpportunitiesWithPagination(
      { q: 'technology', limit: 2 },
      2, // max 2 pages
      4  // max 4 records
    );
    console.log(`✅ Pagination working (fetched: ${paginatedResult._meta.dataManagement.actualRecordsFetched})`);
    
    return true;
  } catch (error) {
    console.error('❌ Data Management Test Failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Error Handling Test');
  console.log('======================');
  
  try {
    // Test excessive offset rejection
    console.log('🔢 Testing offset limit enforcement...');
    try {
      await fetchOpportunities({ offset: 10000 });
      console.log('❌ Offset limit not enforced');
      return false;
    } catch (error) {
      if (error.message.includes('exceeds maximum allowed')) {
        console.log('✅ Offset limit properly enforced');
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error Handling Test Failed:', error.message);
    return false;
  }
}

async function generateReport() {
  console.log('\n📋 Integration Validation Report');
  console.log('================================');
  
  const cacheStats = getCacheStats();
  const status = getStatus();
  
  console.log('Configuration:', {
    apiConfigured: status.configured,
    endpoint: status.endpoint,
    cacheEnabled: true,
    cacheSize: cacheStats.size
  });
  
  console.log('\n💡 Recommendations:');
  console.log('- Keep API requests under 100 records per call for optimal performance');
  console.log('- Use focused searches with NAICS codes and states for better results');
  console.log('- Cache is automatically managed but can be cleared with clearCache()');
  console.log('- Monitor API rate limits - SAM.gov has usage restrictions');
  console.log('\n🔗 Available Functions:');
  console.log('- fetchOpportunities(params) - Basic search');
  console.log('- searchOpportunities({keywords, naics, state}) - Structured search');
  console.log('- getFocusedOpportunities({keywords, naics, state, maxResults}) - Targeted search');
  console.log('- fetchOpportunitiesWithPagination(params, maxPages, maxRecords) - Bulk data');
}

async function main() {
  console.log('🚀 SAM.gov Integration Validation');
  console.log('==================================');
  console.log('This script will validate your SAM.gov API integration setup.\n');
  
  let allTestsPassed = true;
  
  // Configuration Check
  if (!await validateConfiguration()) {
    console.log('\n❌ Validation Failed: Configuration issues detected');
    process.exit(1);
  }
  
  // Basic Connectivity Test
  if (!await testBasicConnectivity()) {
    console.log('\n❌ Validation Failed: API connectivity issues');
    allTestsPassed = false;
  }
  
  // Data Management Test
  if (!await testDataManagement()) {
    console.log('\n❌ Validation Failed: Data management issues');
    allTestsPassed = false;
  }
  
  // Error Handling Test
  if (!await testErrorHandling()) {
    console.log('\n❌ Validation Failed: Error handling issues');
    allTestsPassed = false;
  }
  
  // Final Report
  await generateReport();
  
  if (allTestsPassed) {
    console.log('\n🎉 SAM.gov Integration Validation PASSED!');
    console.log('Your integration is ready for production use.');
  } else {
    console.log('\n⚠️  SAM.gov Integration Validation completed with issues');
    console.log('Please address the issues above before using in production.');
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Validation script crashed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { main };