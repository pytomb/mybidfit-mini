#!/usr/bin/env node

/**
 * SAM.gov API Integration Validation Script
 * 
 * This script validates that the SAM.gov integration is working properly.
 * It can be run as part of CI/CD or manually to ensure API connectivity.
 */

const { fetchOpportunities } = require('../../src/integrations/sam');
const axios = require('axios');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log(`\n${colors.bold}${colors.cyan}🔍 ${message}${colors.reset}`);
  log(''.padEnd(message.length + 4, '='), 'cyan');
}

class SAMValidationResults {
  constructor() {
    this.tests = [];
    this.errors = [];
    this.warnings = [];
  }

  addTest(name, passed, message = '', details = null) {
    this.tests.push({ name, passed, message, details, timestamp: new Date() });
    if (passed) {
      logSuccess(`${name}: ${message}`);
    } else {
      logError(`${name}: ${message}`);
      this.errors.push({ test: name, message, details });
    }
  }

  addWarning(message, details = null) {
    this.warnings.push({ message, details, timestamp: new Date() });
    logWarning(message);
  }

  generateReport() {
    const passed = this.tests.filter(t => t.passed).length;
    const failed = this.tests.filter(t => !t.passed).length;
    
    logHeader('SAM.gov Integration Validation Report');
    log(`📊 Tests Run: ${this.tests.length}`);
    log(`✅ Passed: ${passed}`, passed > 0 ? 'green' : 'reset');
    log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
    log(`⚠️  Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'yellow' : 'reset');
    
    if (this.errors.length > 0) {
      logHeader('Failed Tests');
      this.errors.forEach(error => {
        logError(`${error.test}: ${error.message}`);
        if (error.details) {
          log(`   Details: ${JSON.stringify(error.details, null, 2)}`, 'red');
        }
      });
    }
    
    if (this.warnings.length > 0) {
      logHeader('Warnings');
      this.warnings.forEach(warning => {
        logWarning(warning.message);
      });
    }
    
    const overallStatus = failed === 0 ? 'PASSED' : 'FAILED';
    const statusColor = failed === 0 ? 'green' : 'red';
    
    log(`\n${colors.bold}Overall Status: ${colors[statusColor]}${overallStatus}${colors.reset}`);
    
    return {
      status: overallStatus,
      total: this.tests.length,
      passed,
      failed,
      warnings: this.warnings.length,
      tests: this.tests,
      errors: this.errors,
      timestamp: new Date().toISOString()
    };
  }
}

async function validateEnvironmentSetup(results) {
  logHeader('Environment Setup Validation');
  
  // Check if API key is configured
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) {
    results.addTest('API Key Configuration', false, 'SAM_GOV_API_KEY environment variable not set');
    return false;
  } else if (apiKey.length < 10) {
    results.addTest('API Key Configuration', false, 'SAM_GOV_API_KEY appears to be invalid (too short)');
    return false;
  } else {
    results.addTest('API Key Configuration', true, `API key configured (${apiKey.substring(0, 8)}...)`);
  }
  
  // Check if required modules are available
  try {
    require('axios');
    results.addTest('Dependencies', true, 'Required dependencies (axios) are available');
  } catch (error) {
    results.addTest('Dependencies', false, 'Required dependencies missing', error.message);
    return false;
  }
  
  // Check if integration module exists and can be loaded
  try {
    const { fetchOpportunities } = require('../../src/integrations/sam');
    if (typeof fetchOpportunities !== 'function') {
      results.addTest('Integration Module', false, 'fetchOpportunities is not a function');
      return false;
    }
    results.addTest('Integration Module', true, 'SAM integration module loaded successfully');
  } catch (error) {
    results.addTest('Integration Module', false, 'Cannot load SAM integration module', error.message);
    return false;
  }
  
  return true;
}

async function validateAPIConnectivity(results) {
  logHeader('API Connectivity Validation');
  
  try {
    // Test basic connectivity with minimal parameters
    logInfo('Testing basic API connectivity...');
    
    const startTime = Date.now();
    const response = await fetchOpportunities({ 
      limit: 1,
      postedFrom: '08/01/2025',
      postedTo: '09/05/2025',
      ptype: 'p' // Only active opportunities
    });
    const responseTime = Date.now() - startTime;
    
    // Validate response structure
    if (!response || typeof response !== 'object') {
      results.addTest('API Response', false, 'Invalid response structure');
      return false;
    }
    
    results.addTest('API Connectivity', true, `API responds successfully (${responseTime}ms)`);
    
    // Validate expected data structure
    if (!response.opportunitiesData) {
      results.addTest('Response Structure', false, 'Missing opportunitiesData in response');
      return false;
    }
    
    if (!Array.isArray(response.opportunitiesData)) {
      results.addTest('Response Structure', false, 'opportunitiesData is not an array');
      return false;
    }
    
    results.addTest('Response Structure', true, 'Response has valid structure');
    
    // Check pagination info
    if (typeof response.totalRecords !== 'number') {
      results.addWarning('Total records info missing or invalid');
    } else {
      results.addTest('Pagination Info', true, `Total opportunities available: ${response.totalRecords}`);
    }
    
    // Performance check
    if (responseTime > 15000) {
      results.addWarning(`API response time is high: ${responseTime}ms`);
    } else if (responseTime > 5000) {
      results.addWarning(`API response time is moderate: ${responseTime}ms`);
    } else {
      logInfo(`Good response time: ${responseTime}ms`);
    }
    
    return true;
    
  } catch (error) {
    if (error.response) {
      // API responded with an error
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      if (status === 401) {
        results.addTest('API Authentication', false, 'Invalid API key - 401 Unauthorized', message);
      } else if (status === 429) {
        results.addTest('API Rate Limit', false, 'Rate limit exceeded - 429 Too Many Requests', message);
        results.addWarning('Consider implementing request throttling');
      } else if (status >= 500) {
        results.addTest('API Server', false, `SAM.gov server error - ${status}`, message);
        results.addWarning('This may be a temporary SAM.gov service issue');
      } else {
        results.addTest('API Request', false, `API request failed - ${status}`, message);
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      results.addTest('Network Connectivity', false, 'Cannot reach SAM.gov API', error.message);
      results.addWarning('Check internet connection and firewall settings');
    } else {
      results.addTest('API Connectivity', false, 'Unknown API error', error.message);
    }
    return false;
  }
}

async function validateDataQuality(results) {
  logHeader('Data Quality Validation');
  
  try {
    // Test with specific search to get actual data
    logInfo('Testing data quality with software-related opportunities...');
    
    const response = await fetchOpportunities({
      q: 'information technology software',
      limit: 5,
      postedFrom: '01/01/2025',
      postedTo: '09/05/2025'
    });
    
    const opportunities = response.opportunitiesData || [];
    
    if (opportunities.length === 0) {
      results.addWarning('No opportunities returned for test search - may indicate API issues or no matching data');
      return true;
    }
    
    logInfo(`Retrieved ${opportunities.length} opportunities for quality analysis`);
    
    // Validate data quality of returned opportunities
    let validOpportunities = 0;
    let issuesFound = [];
    
    opportunities.forEach((opp, index) => {
      const issues = [];
      
      // Check required fields
      if (!opp.solicitationNumber) issues.push('Missing solicitation number');
      if (!opp.title) issues.push('Missing title');
      if (!opp.type) issues.push('Missing type');
      if (!opp.postedDate) issues.push('Missing posted date');
      if (!opp.responseDeadLine) issues.push('Missing response deadline');
      
      // Check data quality
      if (opp.title && opp.title.length < 10) issues.push('Title too short');
      if (opp.title && opp.title.length > 500) issues.push('Title too long');
      
      // Check date formats
      if (opp.postedDate && isNaN(Date.parse(opp.postedDate))) {
        issues.push('Invalid posted date format');
      }
      if (opp.responseDeadLine && isNaN(Date.parse(opp.responseDeadLine))) {
        issues.push('Invalid deadline date format');
      }
      
      if (issues.length === 0) {
        validOpportunities++;
      } else {
        issuesFound.push({ index, solicitationNumber: opp.solicitationNumber, issues });
      }
    });
    
    const qualityPercentage = Math.round((validOpportunities / opportunities.length) * 100);
    
    if (qualityPercentage >= 90) {
      results.addTest('Data Quality', true, `${qualityPercentage}% of opportunities have good data quality (${validOpportunities}/${opportunities.length})`);
    } else if (qualityPercentage >= 70) {
      results.addTest('Data Quality', true, `${qualityPercentage}% of opportunities have acceptable data quality (${validOpportunities}/${opportunities.length})`);
      results.addWarning('Some data quality issues detected - see details below');
    } else {
      results.addTest('Data Quality', false, `Only ${qualityPercentage}% of opportunities have good data quality (${validOpportunities}/${opportunities.length})`);
    }
    
    // Log issues found
    if (issuesFound.length > 0 && issuesFound.length <= 3) {
      issuesFound.forEach(item => {
        results.addWarning(`Quality issues in ${item.solicitationNumber}: ${item.issues.join(', ')}`);
      });
    } else if (issuesFound.length > 3) {
      results.addWarning(`Multiple data quality issues found in ${issuesFound.length} opportunities`);
    }
    
    // Sample opportunity info
    const sampleOpp = opportunities[0];
    logInfo(`Sample opportunity: "${sampleOpp.title}" (${sampleOpp.solicitationNumber})`);
    
    return true;
    
  } catch (error) {
    results.addTest('Data Quality', false, 'Failed to validate data quality', error.message);
    return false;
  }
}

async function validateSearchParameters(results) {
  logHeader('Search Parameters Validation');
  
  const testCases = [
    { params: { q: 'software', postedFrom: '01/01/2025', postedTo: '09/05/2025', limit: 2 }, description: 'Keyword search' },
    { params: { postedFrom: '08/01/2025', postedTo: '09/05/2025', limit: 2 }, description: 'Date range and limit' },
    { params: { ptype: 'p', postedFrom: '08/01/2025', postedTo: '09/05/2025', limit: 2 }, description: 'Opportunity type filter' },
    { params: { q: 'IT', limit: 1, ptype: 'p', postedFrom: '08/01/2025', postedTo: '09/05/2025' }, description: 'Multiple parameters' }
  ];
  
  let successfulTests = 0;
  
  for (const testCase of testCases) {
    try {
      logInfo(`Testing ${testCase.description}...`);
      
      const response = await fetchOpportunities(testCase.params);
      
      if (response && response.opportunitiesData && Array.isArray(response.opportunitiesData)) {
        results.addTest(`Search: ${testCase.description}`, true, `Returned ${response.opportunitiesData.length} results`);
        successfulTests++;
      } else {
        results.addTest(`Search: ${testCase.description}`, false, 'Invalid response structure');
      }
      
      // Small delay between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      results.addTest(`Search: ${testCase.description}`, false, error.message);
    }
  }
  
  if (successfulTests === testCases.length) {
    results.addTest('Search Parameters', true, 'All search parameter tests passed');
    return true;
  } else {
    results.addTest('Search Parameters', false, `${testCases.length - successfulTests} search tests failed`);
    return false;
  }
}

async function main() {
  console.log(`${colors.bold}${colors.blue}🔍 SAM.gov API Integration Validation${colors.reset}`);
  console.log(`Started at: ${new Date().toLocaleString()}`);
  console.log(`Node.js: ${process.version}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
  
  const results = new SAMValidationResults();
  
  // Step 1: Validate environment setup
  const envValid = await validateEnvironmentSetup(results);
  if (!envValid) {
    logError('Environment validation failed - stopping tests');
    results.generateReport();
    process.exit(1);
  }
  
  // Step 2: Validate API connectivity
  const connectivityValid = await validateAPIConnectivity(results);
  if (!connectivityValid) {
    logError('API connectivity validation failed - skipping data quality tests');
  } else {
    // Step 3: Validate data quality (only if connectivity works)
    await validateDataQuality(results);
    
    // Step 4: Validate search parameters
    await validateSearchParameters(results);
  }
  
  // Generate final report
  const report = results.generateReport();
  
  // Save results to file for CI/CD systems
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '../sam-validation-results.json');
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    logInfo(`Validation results saved to: ${outputPath}`);
  } catch (error) {
    results.addWarning(`Could not save results file: ${error.message}`);
  }
  
  // Exit with appropriate code
  process.exit(report.failed > 0 ? 1 : 0);
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the validation if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error during validation:', error);
    process.exit(1);
  });
}

module.exports = { main };