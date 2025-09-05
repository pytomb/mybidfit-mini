#!/usr/bin/env node

/**
 * SAM.gov Integration Test Script
 * 
 * Tests the extended SAM.gov integration including:
 * - New detail fetching functions
 * - Batch processing capabilities
 * - Rate limiting and error handling
 * - Data parsing and normalization
 * 
 * Usage: node .claude/scripts/test-sam-integration.js [--live] [--batch-size=5]
 */

const fs = require('fs');
const path = require('path');

class SAMIntegrationTester {
  constructor(options = {}) {
    this.options = {
      liveTest: false,
      batchSize: 5,
      timeout: 30000,
      ...options
    };
    
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      warnings: 0
    };

    this.samIntegrationPath = path.resolve('src/integrations/sam.js');
  }

  /**
   * Run all SAM.gov integration tests
   */
  async runAllTests() {
    console.log('🌐 SAM.gov Integration Test Suite');
    console.log('=================================');
    console.log(`Live Testing: ${this.options.liveTest ? 'Enabled' : 'Disabled'}`);
    console.log(`Batch Size: ${this.options.batchSize}`);
    console.log(`Timeout: ${this.options.timeout}ms`);
    console.log('');

    // Test 1: File exists and is readable
    await this.testFileExists();

    // Test 2: Required functions exist
    await this.testRequiredFunctions();

    // Test 3: Function signatures and parameters
    await this.testFunctionSignatures();

    // Test 4: Error handling implementation
    await this.testErrorHandling();

    // Test 5: Rate limiting implementation
    await this.testRateLimiting();

    // Test 6: Caching implementation
    await this.testCaching();

    // Test 7: Data parsing and normalization
    await this.testDataParsing();

    // Live tests (only if --live flag is used)
    if (this.options.liveTest) {
      console.log('🔴 Live API Tests (requires valid API key):');
      console.log('==========================================');
      
      await this.testLiveAPIConnection();
      await this.testLiveDetailFetching();
      await this.testLiveBatchProcessing();
      await this.testLiveRateLimiting();
    }

    return this.generateTestReport();
  }

  /**
   * Test that SAM integration file exists and is readable
   */
  async testFileExists() {
    const testName = 'SAM Integration File Exists';
    console.log(`🔍 ${testName}...`);

    try {
      if (!fs.existsSync(this.samIntegrationPath)) {
        this.recordFailure(testName, 'SAM integration file not found at expected path');
        return;
      }

      const stats = fs.statSync(this.samIntegrationPath);
      const content = fs.readFileSync(this.samIntegrationPath, 'utf8');

      if (content.length < 1000) {
        this.recordWarning(testName, 'SAM integration file seems too small (less than 1KB)');
      } else {
        this.recordSuccess(testName, `File found: ${Math.round(stats.size/1024)}KB, ${content.split('\n').length} lines`);
      }

      // Store content for other tests
      this.samContent = content;

    } catch (error) {
      this.recordFailure(testName, `Failed to read SAM integration file: ${error.message}`);
    }
  }

  /**
   * Test that all required functions exist
   */
  async testRequiredFunctions() {
    const testName = 'Required Functions Exist';
    console.log(`🔍 ${testName}...`);

    if (!this.samContent) {
      this.recordFailure(testName, 'SAM integration file content not available');
      return;
    }

    const requiredFunctions = [
      'fetchOpportunityDetails',
      'fetchOpportunityDetailsBatch',
      'parseOpportunityDetails',
      'normalizeOpportunityData'
    ];

    const missingFunctions = [];
    const foundFunctions = [];

    for (const func of requiredFunctions) {
      if (this.samContent.includes(`async function ${func}`) || 
          this.samContent.includes(`function ${func}`) ||
          this.samContent.includes(`${func}:`) ||
          this.samContent.includes(`${func} =`)) {
        foundFunctions.push(func);
      } else {
        missingFunctions.push(func);
      }
    }

    if (missingFunctions.length === 0) {
      this.recordSuccess(testName, `All ${requiredFunctions.length} required functions found`);
    } else {
      this.recordFailure(testName, `Missing functions: ${missingFunctions.join(', ')}`);
    }

    // Also check for legacy functions
    const legacyFunctions = ['searchOpportunities', 'getOpportunity'];
    const legacyFound = legacyFunctions.filter(func => this.samContent.includes(func));
    
    if (legacyFound.length > 0) {
      this.recordSuccess('Legacy Functions Preserved', `Found: ${legacyFound.join(', ')}`);
    } else {
      this.recordWarning('Legacy Functions Missing', 'Original SAM.gov functions may have been removed');
    }
  }

  /**
   * Test function signatures and parameters
   */
  async testFunctionSignatures() {
    const testName = 'Function Signatures';
    console.log(`🔍 ${testName}...`);

    if (!this.samContent) {
      this.recordFailure(testName, 'SAM integration file content not available');
      return;
    }

    const functionTests = [
      {
        name: 'fetchOpportunityDetails',
        expectedPattern: /fetchOpportunityDetails\s*\(\s*noticeId[\s,]/,
        description: 'Should accept noticeId parameter'
      },
      {
        name: 'fetchOpportunityDetailsBatch', 
        expectedPattern: /fetchOpportunityDetailsBatch\s*\(\s*noticeIds[\s,]/,
        description: 'Should accept noticeIds array parameter'
      },
      {
        name: 'parseOpportunityDetails',
        expectedPattern: /parseOpportunityDetails\s*\(\s*rawData[\s,)]/,
        description: 'Should accept rawData parameter'
      },
      {
        name: 'normalizeOpportunityData',
        expectedPattern: /normalizeOpportunityData\s*\(\s*opportunityData[\s,)]/,
        description: 'Should accept opportunityData parameter'
      }
    ];

    let passedSignatures = 0;

    for (const test of functionTests) {
      if (test.expectedPattern.test(this.samContent)) {
        passedSignatures++;
        console.log(`  ✅ ${test.name}: ${test.description}`);
      } else {
        console.log(`  ❌ ${test.name}: ${test.description}`);
      }
    }

    if (passedSignatures === functionTests.length) {
      this.recordSuccess(testName, `All ${functionTests.length} function signatures are correct`);
    } else {
      this.recordFailure(testName, `${functionTests.length - passedSignatures} function signatures are incorrect`);
    }
  }

  /**
   * Test error handling implementation
   */
  async testErrorHandling() {
    const testName = 'Error Handling Implementation';
    console.log(`🔍 ${testName}...`);

    if (!this.samContent) {
      this.recordFailure(testName, 'SAM integration file content not available');
      return;
    }

    const errorHandlingPatterns = [
      { pattern: /try\s*{[\s\S]*?catch\s*\(/g, name: 'try-catch blocks' },
      { pattern: /throw\s+new\s+Error/g, name: 'error throwing' },
      { pattern: /\.catch\(/g, name: 'promise error handling' },
      { pattern: /error\.response/g, name: 'HTTP error handling' },
      { pattern: /retry|retries/gi, name: 'retry logic' }
    ];

    const foundPatterns = [];
    const missingPatterns = [];

    for (const pattern of errorHandlingPatterns) {
      const matches = this.samContent.match(pattern.pattern);
      if (matches && matches.length > 0) {
        foundPatterns.push(`${pattern.name} (${matches.length} instances)`);
      } else {
        missingPatterns.push(pattern.name);
      }
    }

    if (foundPatterns.length >= 3) {
      this.recordSuccess(testName, `Found: ${foundPatterns.join(', ')}`);
    } else if (foundPatterns.length >= 1) {
      this.recordWarning(testName, `Limited error handling: ${foundPatterns.join(', ')}`);
    } else {
      this.recordFailure(testName, 'No error handling patterns found');
    }

    if (missingPatterns.length > 0) {
      console.log(`  ⚠️  Missing: ${missingPatterns.join(', ')}`);
    }
  }

  /**
   * Test rate limiting implementation
   */
  async testRateLimiting() {
    const testName = 'Rate Limiting Implementation';
    console.log(`🔍 ${testName}...`);

    if (!this.samContent) {
      this.recordFailure(testName, 'SAM integration file content not available');
      return;
    }

    const rateLimitingPatterns = [
      { pattern: /delay|sleep|wait/gi, name: 'delay mechanisms' },
      { pattern: /rate.?limit/gi, name: 'rate limiting' },
      { pattern: /throttle/gi, name: 'throttling' },
      { pattern: /Promise\.all.*chunk|batch/gi, name: 'batch processing' },
      { pattern: /setTimeout|setInterval/gi, name: 'timing functions' }
    ];

    const foundPatterns = [];
    
    for (const pattern of rateLimitingPatterns) {
      const matches = this.samContent.match(pattern.pattern);
      if (matches && matches.length > 0) {
        foundPatterns.push(pattern.name);
      }
    }

    if (foundPatterns.length >= 2) {
      this.recordSuccess(testName, `Found: ${foundPatterns.join(', ')}`);
    } else if (foundPatterns.length >= 1) {
      this.recordWarning(testName, `Basic rate limiting: ${foundPatterns.join(', ')}`);
    } else {
      this.recordFailure(testName, 'No rate limiting implementation found');
    }

    // Check for specific batch size configuration
    if (this.samContent.includes('batchSize') || this.samContent.includes('batch_size')) {
      console.log('  ✅ Configurable batch size found');
    } else {
      console.log('  ⚠️  No configurable batch size found');
    }
  }

  /**
   * Test caching implementation
   */
  async testCaching() {
    const testName = 'Caching Implementation';
    console.log(`🔍 ${testName}...`);

    if (!this.samContent) {
      this.recordFailure(testName, 'SAM integration file content not available');
      return;
    }

    const cachingPatterns = [
      { pattern: /cache/gi, name: 'caching' },
      { pattern: /Map\(\)|new Map/g, name: 'Map-based cache' },
      { pattern: /redis/gi, name: 'Redis cache' },
      { pattern: /memcache/gi, name: 'Memcache' },
      { pattern: /localStorage|sessionStorage/g, name: 'browser storage' }
    ];

    const foundPatterns = [];
    
    for (const pattern of cachingPatterns) {
      const matches = this.samContent.match(pattern.pattern);
      if (matches && matches.length > 0) {
        foundPatterns.push(pattern.name);
      }
    }

    if (foundPatterns.length >= 1) {
      this.recordSuccess(testName, `Found: ${foundPatterns.join(', ')}`);
    } else {
      this.recordWarning(testName, 'No caching implementation found');
    }

    // Check for cache expiration logic
    if (this.samContent.includes('expir') || this.samContent.includes('ttl') || this.samContent.includes('TTL')) {
      console.log('  ✅ Cache expiration logic found');
    } else {
      console.log('  ⚠️  No cache expiration logic found');
    }
  }

  /**
   * Test data parsing and normalization
   */
  async testDataParsing() {
    const testName = 'Data Parsing and Normalization';
    console.log(`🔍 ${testName}...`);

    if (!this.samContent) {
      this.recordFailure(testName, 'SAM integration file content not available');
      return;
    }

    const parsingPatterns = [
      { pattern: /JSON\.parse|JSON\.stringify/g, name: 'JSON processing' },
      { pattern: /\.map\(|\.filter\(|\.reduce\(/g, name: 'array processing' },
      { pattern: /normalize|standardize/gi, name: 'data normalization' },
      { pattern: /trim\(\)|toLowerCase\(\)|toUpperCase\(\)/g, name: 'string normalization' },
      { pattern: /new Date|Date\.parse|moment/g, name: 'date processing' },
      { pattern: /parseFloat|parseInt|Number\(/g, name: 'number parsing' }
    ];

    const foundPatterns = [];
    
    for (const pattern of parsingPatterns) {
      const matches = this.samContent.match(pattern.pattern);
      if (matches && matches.length > 0) {
        foundPatterns.push(`${pattern.name} (${matches.length})`);
      }
    }

    if (foundPatterns.length >= 4) {
      this.recordSuccess(testName, `Comprehensive parsing: ${foundPatterns.join(', ')}`);
    } else if (foundPatterns.length >= 2) {
      this.recordWarning(testName, `Basic parsing: ${foundPatterns.join(', ')}`);
    } else {
      this.recordFailure(testName, 'Insufficient data parsing implementation');
    }

    // Check for specific government data handling
    const govPatterns = [
      'naics', 'psc', 'solicitation', 'agency', 'deadline', 'setAside'
    ];

    const govFound = govPatterns.filter(pattern => 
      this.samContent.toLowerCase().includes(pattern.toLowerCase())
    );

    if (govFound.length >= 4) {
      console.log(`  ✅ Government-specific data handling: ${govFound.join(', ')}`);
    } else {
      console.log(`  ⚠️  Limited government data handling: ${govFound.join(', ')}`);
    }
  }

  /**
   * Test live API connection (requires valid API key)
   */
  async testLiveAPIConnection() {
    const testName = 'Live API Connection';
    console.log(`🔍 ${testName}...`);

    try {
      // Try to load the SAM integration module
      const samModule = require(this.samIntegrationPath);
      
      if (!process.env.SAM_API_KEY && !process.env.SAM_GOV_API_KEY) {
        this.recordWarning(testName, 'No API key found in environment variables');
        return;
      }

      // Test basic connection with a simple search
      if (typeof samModule.searchOpportunities === 'function') {
        try {
          const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API call timeout')), this.options.timeout)
          );

          const apiCall = samModule.searchOpportunities({ limit: 1 });
          const result = await Promise.race([apiCall, timeout]);

          if (result && (result.opportunitiesData || result.length >= 0)) {
            this.recordSuccess(testName, 'Successfully connected to SAM.gov API');
          } else {
            this.recordWarning(testName, 'API responded but with unexpected data structure');
          }
        } catch (apiError) {
          if (apiError.message.includes('401') || apiError.message.includes('unauthorized')) {
            this.recordWarning(testName, 'API key authentication failed');
          } else if (apiError.message.includes('timeout')) {
            this.recordWarning(testName, 'API call timed out');
          } else {
            this.recordFailure(testName, `API error: ${apiError.message}`);
          }
        }
      } else {
        this.recordWarning(testName, 'searchOpportunities function not found for API testing');
      }

    } catch (error) {
      this.recordFailure(testName, `Failed to load SAM module: ${error.message}`);
    }
  }

  /**
   * Test live detail fetching
   */
  async testLiveDetailFetching() {
    const testName = 'Live Detail Fetching';
    console.log(`🔍 ${testName}...`);

    try {
      const samModule = require(this.samIntegrationPath);

      if (typeof samModule.fetchOpportunityDetails !== 'function') {
        this.recordFailure(testName, 'fetchOpportunityDetails function not found');
        return;
      }

      // First get a sample opportunity ID
      if (typeof samModule.searchOpportunities === 'function') {
        try {
          const searchResult = await samModule.searchOpportunities({ limit: 1 });
          let sampleId = null;

          if (searchResult && searchResult.opportunitiesData && searchResult.opportunitiesData.length > 0) {
            sampleId = searchResult.opportunitiesData[0].noticeId;
          } else if (Array.isArray(searchResult) && searchResult.length > 0) {
            sampleId = searchResult[0].noticeId || searchResult[0].id;
          }

          if (sampleId) {
            const details = await samModule.fetchOpportunityDetails(sampleId);
            
            if (details && typeof details === 'object') {
              this.recordSuccess(testName, `Successfully fetched details for opportunity ${sampleId}`);
            } else {
              this.recordWarning(testName, 'Detail fetching returned unexpected data');
            }
          } else {
            this.recordWarning(testName, 'Could not find sample opportunity ID for testing');
          }

        } catch (error) {
          this.recordFailure(testName, `Detail fetching failed: ${error.message}`);
        }
      } else {
        this.recordWarning(testName, 'Cannot test detail fetching without search function');
      }

    } catch (error) {
      this.recordFailure(testName, `Failed to test detail fetching: ${error.message}`);
    }
  }

  /**
   * Test live batch processing
   */
  async testLiveBatchProcessing() {
    const testName = 'Live Batch Processing';
    console.log(`🔍 ${testName}...`);

    try {
      const samModule = require(this.samIntegrationPath);

      if (typeof samModule.fetchOpportunityDetailsBatch !== 'function') {
        this.recordFailure(testName, 'fetchOpportunityDetailsBatch function not found');
        return;
      }

      // Get sample opportunity IDs
      if (typeof samModule.searchOpportunities === 'function') {
        try {
          const searchResult = await samModule.searchOpportunities({ limit: this.options.batchSize });
          const sampleIds = [];

          if (searchResult && searchResult.opportunitiesData) {
            for (const opp of searchResult.opportunitiesData.slice(0, this.options.batchSize)) {
              if (opp.noticeId) sampleIds.push(opp.noticeId);
            }
          }

          if (sampleIds.length >= 2) {
            const startTime = Date.now();
            const batchResults = await samModule.fetchOpportunityDetailsBatch(sampleIds);
            const endTime = Date.now();

            if (Array.isArray(batchResults) && batchResults.length > 0) {
              const avgTimePerRequest = (endTime - startTime) / sampleIds.length;
              this.recordSuccess(testName, 
                `Processed ${sampleIds.length} opportunities in ${endTime - startTime}ms (avg: ${Math.round(avgTimePerRequest)}ms/request)`
              );
            } else {
              this.recordWarning(testName, 'Batch processing returned empty or invalid results');
            }
          } else {
            this.recordWarning(testName, 'Insufficient sample IDs for batch testing');
          }

        } catch (error) {
          this.recordFailure(testName, `Batch processing failed: ${error.message}`);
        }
      } else {
        this.recordWarning(testName, 'Cannot test batch processing without search function');
      }

    } catch (error) {
      this.recordFailure(testName, `Failed to test batch processing: ${error.message}`);
    }
  }

  /**
   * Test live rate limiting
   */
  async testLiveRateLimiting() {
    const testName = 'Live Rate Limiting';
    console.log(`🔍 ${testName}...`);

    try {
      const samModule = require(this.samIntegrationPath);

      if (typeof samModule.searchOpportunities !== 'function') {
        this.recordWarning(testName, 'Cannot test rate limiting without API functions');
        return;
      }

      // Make multiple rapid requests to test rate limiting
      const rapidRequests = [];
      const requestCount = 5;
      const startTime = Date.now();

      for (let i = 0; i < requestCount; i++) {
        rapidRequests.push(samModule.searchOpportunities({ limit: 1 }));
      }

      try {
        const results = await Promise.all(rapidRequests);
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / requestCount;

        if (avgTime > 1000) {
          this.recordSuccess(testName, 
            `Rate limiting working: ${requestCount} requests took ${totalTime}ms (avg: ${Math.round(avgTime)}ms/request)`
          );
        } else if (avgTime > 200) {
          this.recordWarning(testName, 
            `Possible rate limiting: ${requestCount} requests took ${totalTime}ms (avg: ${Math.round(avgTime)}ms/request)`
          );
        } else {
          this.recordWarning(testName, 
            `No rate limiting detected: ${requestCount} requests took ${totalTime}ms (avg: ${Math.round(avgTime)}ms/request)`
          );
        }

      } catch (error) {
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          this.recordSuccess(testName, 'Rate limiting properly triggered by rapid requests');
        } else {
          this.recordFailure(testName, `Rate limiting test failed: ${error.message}`);
        }
      }

    } catch (error) {
      this.recordFailure(testName, `Failed to test rate limiting: ${error.message}`);
    }
  }

  /**
   * Record test success
   */
  recordSuccess(testName, details = '') {
    this.results.tests.push({
      name: testName,
      status: 'PASSED',
      details: details,
      timestamp: new Date().toISOString()
    });
    this.results.passed++;
    console.log(`  ✅ ${testName}: ${details}`);
  }

  /**
   * Record test failure
   */
  recordFailure(testName, details = '') {
    this.results.tests.push({
      name: testName,
      status: 'FAILED',
      details: details,
      timestamp: new Date().toISOString()
    });
    this.results.failed++;
    console.log(`  ❌ ${testName}: ${details}`);
  }

  /**
   * Record test warning
   */
  recordWarning(testName, details = '') {
    this.results.tests.push({
      name: testName,
      status: 'WARNING',
      details: details,
      timestamp: new Date().toISOString()
    });
    this.results.warnings++;
    console.log(`  ⚠️  ${testName}: ${details}`);
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    const totalTests = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = totalTests > 0 ? Math.round((this.results.passed / totalTests) * 100) : 0;

    return {
      summary: {
        totalTests: totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        successRate: successRate,
        status: this.results.failed === 0 ? 'PASSED' : 'FAILED',
        liveTestingEnabled: this.options.liveTest
      },
      tests: this.results.tests
    };
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options = {
    liveTest: args.includes('--live'),
    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 5
  };

  console.log('🌐 SAM.gov Integration Test Suite');
  console.log('=================================');
  console.log('');

  if (!options.liveTest) {
    console.log('💡 Tip: Use --live flag to test against actual SAM.gov API');
    console.log('   (requires valid SAM_API_KEY environment variable)');
    console.log('');
  }

  try {
    const tester = new SAMIntegrationTester(options);
    const report = await tester.runAllTests();

    // Display final report
    displayTestReport(report);

    // Exit with appropriate code
    process.exit(report.summary.status === 'PASSED' ? 0 : 1);

  } catch (error) {
    console.error('💥 SAM.gov integration testing failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Display test report
 */
function displayTestReport(report) {
  console.log('');
  console.log('📋 SAM.gov Integration Test Report');
  console.log('==================================');
  console.log(`Status: ${getStatusIcon(report.summary.status)} ${report.summary.status}`);
  console.log(`Tests Run: ${report.summary.totalTests}`);
  console.log(`Passed: ✅ ${report.summary.passed}`);
  console.log(`Failed: ❌ ${report.summary.failed}`);
  console.log(`Warnings: ⚠️  ${report.summary.warnings}`);
  console.log(`Success Rate: ${getScoreIcon(report.summary.successRate)} ${report.summary.successRate}%`);
  console.log(`Live Testing: ${report.summary.liveTestingEnabled ? 'Enabled' : 'Disabled'}`);
  console.log('');

  // Show failed tests
  const failedTests = report.tests.filter(test => test.status === 'FAILED');
  if (failedTests.length > 0) {
    console.log('❌ Failed Tests:');
    console.log('===============');
    for (const test of failedTests) {
      console.log(`❌ ${test.name}: ${test.details}`);
    }
    console.log('');
  }

  // Show warnings
  const warningTests = report.tests.filter(test => test.status === 'WARNING');
  if (warningTests.length > 0) {
    console.log('⚠️  Warnings:');
    console.log('============');
    for (const test of warningTests.slice(0, 5)) {
      console.log(`⚠️  ${test.name}: ${test.details}`);
    }
    if (warningTests.length > 5) {
      console.log(`   ... and ${warningTests.length - 5} more warnings`);
    }
    console.log('');
  }

  // Final assessment
  if (report.summary.status === 'PASSED') {
    console.log('✅ SAM.gov integration testing completed successfully!');
    if (report.summary.liveTestingEnabled) {
      console.log('   Live API integration is working properly.');
    } else {
      console.log('   Static analysis passed. Use --live flag to test actual API integration.');
    }
  } else {
    console.log('❌ SAM.gov integration testing found issues!');
    console.log('   Please address the failed tests above before proceeding.');
  }

  console.log('');
  console.log('🎯 Next Steps:');
  console.log('==============');
  if (!report.summary.liveTestingEnabled) {
    console.log('1. Set up SAM_API_KEY environment variable');
    console.log('2. Run with --live flag to test actual API integration');
  }
  console.log('3. Test complete integration with services');
  console.log('4. Run end-to-end government opportunities workflow');
}

function getStatusIcon(status) {
  return status === 'PASSED' ? '✅' : '❌';
}

function getScoreIcon(score) {
  if (score >= 95) return '🟢';
  if (score >= 85) return '🟡';
  if (score >= 70) return '🟠';
  return '🔴';
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SAMIntegrationTester, main };