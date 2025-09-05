#!/usr/bin/env node

/**
 * Government Opportunities Services Validator
 * 
 * Validates the government opportunities services including:
 * - Government Opportunity Ingestion Service
 * - Opportunity Deduplication Service
 * - SAM.gov Integration Extensions
 * - Service integration and dependencies
 * 
 * Usage: node .claude/scripts/validate-gov-services.js
 */

const fs = require('fs');
const path = require('path');

class GovernmentServicesValidator {
  constructor() {
    this.services = [];
    this.issues = [];
    this.warnings = [];
    this.recommendations = [];
    this.serviceFiles = [
      'src/services/governmentOpportunityIngestionService.js',
      'src/services/opportunityDeduplicationService.js',
      'src/integrations/sam.js'
    ];
  }

  /**
   * Main validation function
   */
  async validateServices() {
    console.log('🔧 Validating Government Opportunities Services...');
    console.log('==================================================');
    console.log('');

    // Check service files exist
    await this.validateServiceFiles();

    // Validate each service
    await this.validateGovernmentIngestionService();
    await this.validateDeduplicationService();
    await this.validateSAMIntegration();

    // Validate service dependencies
    await this.validateServiceDependencies();

    // Validate service patterns and standards
    await this.validateServicePatterns();

    return this.generateServicesReport();
  }

  /**
   * Validate service files exist and are readable
   */
  async validateServiceFiles() {
    console.log('📁 Checking service files...');

    for (const serviceFile of this.serviceFiles) {
      const fullPath = path.resolve(serviceFile);
      const exists = fs.existsSync(fullPath);
      const serviceName = path.basename(serviceFile, '.js');

      if (exists) {
        try {
          const stats = fs.statSync(fullPath);
          const content = fs.readFileSync(fullPath, 'utf8');
          
          this.services.push({
            name: serviceName,
            path: serviceFile,
            size: stats.size,
            lines: content.split('\n').length,
            exists: true,
            content: content
          });

          console.log(`✅ ${serviceName}: ${stats.size} bytes, ${content.split('\n').length} lines`);
        } catch (error) {
          this.addIssue('SERVICE_READ_ERROR', 
            `Cannot read service file: ${serviceFile} - ${error.message}`,
            { service: serviceName, path: serviceFile, error: error.message }
          );
          console.log(`❌ ${serviceName}: Read error`);
        }
      } else {
        this.addIssue('SERVICE_FILE_MISSING', 
          `Service file not found: ${serviceFile}`,
          { service: serviceName, path: serviceFile }
        );
        console.log(`❌ ${serviceName}: Not found`);
      }
    }

    console.log('');
  }

  /**
   * Validate Government Opportunity Ingestion Service
   */
  async validateGovernmentIngestionService() {
    console.log('🏛️  Validating Government Opportunity Ingestion Service...');

    const service = this.services.find(s => s.name === 'governmentOpportunityIngestionService');
    if (!service) {
      this.addIssue('MISSING_INGESTION_SERVICE', 'Government Opportunity Ingestion Service not found');
      return;
    }

    const content = service.content;

    // Check for required class definition
    if (!content.includes('class GovernmentOpportunityIngestionService')) {
      this.addIssue('MISSING_INGESTION_CLASS', 
        'GovernmentOpportunityIngestionService class not found',
        { service: 'governmentOpportunityIngestionService' }
      );
    } else {
      console.log('✅ GovernmentOpportunityIngestionService class found');
    }

    // Check for required methods
    const requiredMethods = [
      'ingestOpportunities',
      'processOpportunityBatch',
      'normalizeOpportunityData',
      'scoreOpportunity',
      'storeOpportunity',
      'deduplicateOpportunity'
    ];

    for (const method of requiredMethods) {
      if (content.includes(`async ${method}(`) || content.includes(`${method}(`)) {
        console.log(`✅ Method found: ${method}`);
      } else {
        this.addWarning('MISSING_METHOD',
          `Missing method '${method}' in GovernmentOpportunityIngestionService`,
          { service: 'governmentOpportunityIngestionService', method: method }
        );
      }
    }

    // Check for proper error handling
    if (!content.includes('try {') || !content.includes('catch')) {
      this.addWarning('MISSING_ERROR_HANDLING',
        'GovernmentOpportunityIngestionService should implement proper error handling'
      );
    } else {
      console.log('✅ Error handling patterns found');
    }

    // Check for database integration
    if (!content.includes('pool.query') && !content.includes('db.')) {
      this.addWarning('MISSING_DATABASE_INTEGRATION',
        'GovernmentOpportunityIngestionService should integrate with database'
      );
    } else {
      console.log('✅ Database integration found');
    }

    // Check for SAM.gov integration
    if (!content.includes('sam.js') && !content.includes('SAM') && !content.includes('fetchOpportunity')) {
      this.addWarning('MISSING_SAM_INTEGRATION',
        'GovernmentOpportunityIngestionService should integrate with SAM.gov API'
      );
    } else {
      console.log('✅ SAM.gov integration patterns found');
    }

    // Check for Panel of Judges integration
    if (!content.includes('PanelOfJudges') && !content.includes('scoreOpportunity')) {
      this.addWarning('MISSING_JUDGES_INTEGRATION',
        'GovernmentOpportunityIngestionService should integrate with Panel of Judges'
      );
    } else {
      console.log('✅ Panel of Judges integration patterns found');
    }

    console.log('');
  }

  /**
   * Validate Opportunity Deduplication Service
   */
  async validateDeduplicationService() {
    console.log('🔍 Validating Opportunity Deduplication Service...');

    const service = this.services.find(s => s.name === 'opportunityDeduplicationService');
    if (!service) {
      this.addIssue('MISSING_DEDUPLICATION_SERVICE', 'Opportunity Deduplication Service not found');
      return;
    }

    const content = service.content;

    // Check for required class definition
    if (!content.includes('class OpportunityDeduplicationService')) {
      this.addIssue('MISSING_DEDUPLICATION_CLASS',
        'OpportunityDeduplicationService class not found',
        { service: 'opportunityDeduplicationService' }
      );
    } else {
      console.log('✅ OpportunityDeduplicationService class found');
    }

    // Check for required methods
    const requiredMethods = [
      'findDuplicates',
      'calculateSimilarity',
      'mergeDuplicates',
      'resolveConflicts',
      'findExistingOpportunity'
    ];

    for (const method of requiredMethods) {
      if (content.includes(`async ${method}(`) || content.includes(`${method}(`)) {
        console.log(`✅ Method found: ${method}`);
      } else {
        this.addWarning('MISSING_DEDUP_METHOD',
          `Missing method '${method}' in OpportunityDeduplicationService`,
          { service: 'opportunityDeduplicationService', method: method }
        );
      }
    }

    // Check for similarity algorithms
    const similarityAlgorithms = [
      'calculateTitleSimilarity',
      'calculateDateSimilarity',
      'calculateAgencySimilarity',
      'calculateSolicitationSimilarity'
    ];

    let algorithmsFound = 0;
    for (const algorithm of similarityAlgorithms) {
      if (content.includes(algorithm)) {
        algorithmsFound++;
        console.log(`✅ Algorithm found: ${algorithm}`);
      }
    }

    if (algorithmsFound < 2) {
      this.addWarning('INSUFFICIENT_ALGORITHMS',
        'OpportunityDeduplicationService should implement multiple similarity algorithms'
      );
    } else {
      console.log(`✅ Found ${algorithmsFound} similarity algorithms`);
    }

    // Check for fuzzy matching libraries
    if (content.includes('fuzzball') || content.includes('string-similarity') || content.includes('levenshtein')) {
      console.log('✅ Fuzzy matching library integration found');
    } else {
      this.addWarning('MISSING_FUZZY_MATCHING',
        'OpportunityDeduplicationService should use fuzzy string matching libraries'
      );
    }

    // Check for audit trail functionality
    if (content.includes('audit') || content.includes('log') || content.includes('history')) {
      console.log('✅ Audit trail functionality found');
    } else {
      this.addWarning('MISSING_AUDIT_TRAIL',
        'OpportunityDeduplicationService should maintain audit trails for deduplication actions'
      );
    }

    console.log('');
  }

  /**
   * Validate SAM.gov Integration
   */
  async validateSAMIntegration() {
    console.log('🌐 Validating SAM.gov Integration...');

    const service = this.services.find(s => s.name === 'sam');
    if (!service) {
      this.addIssue('MISSING_SAM_INTEGRATION', 'SAM.gov integration file not found');
      return;
    }

    const content = service.content;

    // Check for new detail fetching functions
    const newFunctions = [
      'fetchOpportunityDetails',
      'fetchOpportunityDetailsBatch',
      'parseOpportunityDetails',
      'normalizeOpportunityData'
    ];

    for (const func of newFunctions) {
      if (content.includes(`async function ${func}`) || content.includes(`function ${func}`) || content.includes(`${func}:`)) {
        console.log(`✅ Function found: ${func}`);
      } else {
        this.addWarning('MISSING_SAM_FUNCTION',
          `Missing function '${func}' in SAM.gov integration`,
          { service: 'sam', function: func }
        );
      }
    }

    // Check for batch processing capability
    if (content.includes('Batch') && content.includes('Promise.all')) {
      console.log('✅ Batch processing capability found');
    } else {
      this.addWarning('MISSING_BATCH_PROCESSING',
        'SAM.gov integration should support batch processing'
      );
    }

    // Check for rate limiting
    if (content.includes('rate') || content.includes('delay') || content.includes('throttle')) {
      console.log('✅ Rate limiting implementation found');
    } else {
      this.addWarning('MISSING_RATE_LIMITING',
        'SAM.gov integration should implement rate limiting'
      );
    }

    // Check for caching
    if (content.includes('cache') || content.includes('Cache')) {
      console.log('✅ Caching implementation found');
    } else {
      this.addWarning('MISSING_CACHING',
        'SAM.gov integration should implement response caching'
      );
    }

    // Check for error handling
    if (content.includes('try {') && content.includes('catch') && content.includes('retry')) {
      console.log('✅ Comprehensive error handling found');
    } else {
      this.addWarning('INCOMPLETE_ERROR_HANDLING',
        'SAM.gov integration should implement retry logic and comprehensive error handling'
      );
    }

    // Check for API key management
    if (content.includes('API_KEY') || content.includes('process.env')) {
      console.log('✅ API key management found');
    } else {
      this.addWarning('MISSING_API_KEY_MANAGEMENT',
        'SAM.gov integration should properly manage API keys'
      );
    }

    console.log('');
  }

  /**
   * Validate service dependencies and integration
   */
  async validateServiceDependencies() {
    console.log('🔗 Validating Service Dependencies...');

    // Check that services can import each other where needed
    const ingestionService = this.services.find(s => s.name === 'governmentOpportunityIngestionService');
    const deduplicationService = this.services.find(s => s.name === 'opportunityDeduplicationService');
    const samIntegration = this.services.find(s => s.name === 'sam');

    if (ingestionService) {
      // Ingestion service should import deduplication service
      if (ingestionService.content.includes('opportunityDeduplicationService') || 
          ingestionService.content.includes('OpportunityDeduplicationService')) {
        console.log('✅ Ingestion service imports deduplication service');
      } else {
        this.addWarning('MISSING_DEDUP_IMPORT',
          'GovernmentOpportunityIngestionService should import OpportunityDeduplicationService'
        );
      }

      // Ingestion service should import SAM integration
      if (ingestionService.content.includes('./sam') || 
          ingestionService.content.includes('../integrations/sam')) {
        console.log('✅ Ingestion service imports SAM integration');
      } else {
        this.addWarning('MISSING_SAM_IMPORT',
          'GovernmentOpportunityIngestionService should import SAM.gov integration'
        );
      }

      // Ingestion service should import database utilities
      if (ingestionService.content.includes('pool') || 
          ingestionService.content.includes('database')) {
        console.log('✅ Ingestion service has database integration');
      } else {
        this.addWarning('MISSING_DATABASE_IMPORT',
          'GovernmentOpportunityIngestionService should import database utilities'
        );
      }
    }

    // Check for proper module exports
    for (const service of this.services) {
      if (!service.content.includes('module.exports') && !service.content.includes('export')) {
        this.addWarning('MISSING_MODULE_EXPORT',
          `Service ${service.name} should export its functionality`,
          { service: service.name }
        );
      } else {
        console.log(`✅ ${service.name} has proper exports`);
      }
    }

    console.log('');
  }

  /**
   * Validate service patterns and standards
   */
  async validateServicePatterns() {
    console.log('📐 Validating Service Patterns and Standards...');

    for (const service of this.services) {
      // Check for class-based architecture
      if (service.content.includes('class ') && service.content.includes('constructor')) {
        console.log(`✅ ${service.name}: Class-based architecture`);
      } else {
        this.addWarning('NON_CLASS_ARCHITECTURE',
          `Service ${service.name} should use class-based architecture`,
          { service: service.name }
        );
      }

      // Check for async/await usage
      if (service.content.includes('async ') && service.content.includes('await ')) {
        console.log(`✅ ${service.name}: Uses async/await`);
      } else {
        this.addWarning('MISSING_ASYNC_AWAIT',
          `Service ${service.name} should use async/await for asynchronous operations`,
          { service: service.name }
        );
      }

      // Check for JSDoc documentation
      const jsdocCount = (service.content.match(/\/\*\*/g) || []).length;
      if (jsdocCount >= 3) {
        console.log(`✅ ${service.name}: Has JSDoc documentation (${jsdocCount} blocks)`);
      } else {
        this.addWarning('INSUFFICIENT_DOCUMENTATION',
          `Service ${service.name} should have more comprehensive JSDoc documentation`,
          { service: service.name, jsdocBlocks: jsdocCount }
        );
      }

      // Check for error handling patterns
      const tryCount = (service.content.match(/try\s*{/g) || []).length;
      const catchCount = (service.content.match(/catch\s*\(/g) || []).length;
      if (tryCount > 0 && tryCount === catchCount) {
        console.log(`✅ ${service.name}: Proper error handling (${tryCount} try-catch blocks)`);
      } else {
        this.addWarning('INCONSISTENT_ERROR_HANDLING',
          `Service ${service.name} has inconsistent error handling patterns`,
          { service: service.name, tryBlocks: tryCount, catchBlocks: catchCount }
        );
      }

      // Check for logging
      if (service.content.includes('console.log') || service.content.includes('logger')) {
        console.log(`✅ ${service.name}: Has logging implementation`);
      } else {
        this.addWarning('MISSING_LOGGING',
          `Service ${service.name} should implement logging for debugging and monitoring`,
          { service: service.name }
        );
      }

      // Check for validation
      if (service.content.includes('validate') || service.content.includes('schema') || service.content.includes('required')) {
        console.log(`✅ ${service.name}: Has input validation`);
      } else {
        this.addWarning('MISSING_INPUT_VALIDATION',
          `Service ${service.name} should implement input validation`,
          { service: service.name }
        );
      }
    }

    console.log('');
  }

  /**
   * Add issue to validation results
   */
  addIssue(code, message, details = {}) {
    this.issues.push({
      code,
      message,
      severity: 'critical',
      details,
      suggestion: this.generateSuggestion(code, details)
    });
  }

  /**
   * Add warning to validation results
   */
  addWarning(code, message, details = {}) {
    this.warnings.push({
      code,
      message,
      severity: 'warning',
      details,
      suggestion: this.generateSuggestion(code, details)
    });
  }

  /**
   * Add recommendation
   */
  addRecommendation(code, category, action, details = {}) {
    this.recommendations.push({
      code,
      category,
      priority: this.determinePriority(code),
      action,
      details
    });
  }

  /**
   * Generate fix suggestion
   */
  generateSuggestion(code, details) {
    switch (code) {
      case 'SERVICE_FILE_MISSING':
        return `Create the missing service file at ${details.path}`;
      case 'MISSING_INGESTION_CLASS':
        return 'Implement GovernmentOpportunityIngestionService class with required methods';
      case 'MISSING_DEDUPLICATION_CLASS':
        return 'Implement OpportunityDeduplicationService class with similarity algorithms';
      case 'MISSING_METHOD':
        return `Implement the ${details.method} method in ${details.service}`;
      case 'MISSING_SAM_INTEGRATION':
        return 'Import and integrate SAM.gov API functions';
      case 'MISSING_DATABASE_INTEGRATION':
        return 'Add database pool connection and query methods';
      case 'MISSING_ERROR_HANDLING':
        return 'Implement try-catch blocks with proper error logging';
      case 'MISSING_BATCH_PROCESSING':
        return 'Add batch processing capability with Promise.all';
      case 'MISSING_RATE_LIMITING':
        return 'Implement rate limiting to respect API limits';
      case 'INSUFFICIENT_ALGORITHMS':
        return 'Implement multiple similarity algorithms for better deduplication';
      default:
        return 'Review the service implementation and follow established patterns';
    }
  }

  /**
   * Determine priority
   */
  determinePriority(code) {
    const criticalCodes = ['SERVICE_FILE_MISSING', 'MISSING_INGESTION_CLASS', 'MISSING_DEDUPLICATION_CLASS'];
    const highCodes = ['MISSING_METHOD', 'MISSING_SAM_INTEGRATION', 'MISSING_DATABASE_INTEGRATION'];
    const mediumCodes = ['MISSING_ERROR_HANDLING', 'MISSING_BATCH_PROCESSING'];

    if (criticalCodes.includes(code)) return 'CRITICAL';
    if (highCodes.includes(code)) return 'HIGH';
    if (mediumCodes.includes(code)) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate services report
   */
  generateServicesReport() {
    const summary = {
      status: this.issues.length === 0 ? 'PASSED' : 'FAILED',
      servicesAnalyzed: this.services.length,
      expectedServices: this.serviceFiles.length,
      totalIssues: this.issues.length,
      totalWarnings: this.warnings.length,
      serviceHealthScore: this.calculateServiceHealthScore()
    };

    return {
      summary,
      issues: this.issues,
      warnings: this.warnings,
      recommendations: this.recommendations,
      services: this.services.map(service => ({
        name: service.name,
        path: service.path,
        size: service.size,
        lines: service.lines,
        exists: service.exists
      }))
    };
  }

  /**
   * Calculate service health score
   */
  calculateServiceHealthScore() {
    const expectedServices = this.serviceFiles.length;
    const foundServices = this.services.length;
    const baseScore = (foundServices / expectedServices) * 100;
    const penalties = this.issues.length * 15 + this.warnings.length * 3;
    return Math.max(0, Math.round(baseScore - penalties));
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔧 Government Opportunities Services Validator');
  console.log('==============================================');
  console.log('');

  try {
    const validator = new GovernmentServicesValidator();
    const report = await validator.validateServices();

    // Display results
    displayServicesValidationResults(report);

    // Exit with appropriate code
    process.exit(report.summary.status === 'PASSED' ? 0 : 1);

  } catch (error) {
    console.error('💥 Services validation failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Display services validation results
 */
function displayServicesValidationResults(report) {
  console.log('');
  console.log('📋 Government Opportunities Services Report');
  console.log('==========================================');
  console.log(`Status: ${getStatusIcon(report.summary.status)} ${report.summary.status}`);
  console.log(`Services Found: ${report.summary.servicesAnalyzed}/${report.summary.expectedServices}`);
  console.log(`Issues: ${report.summary.totalIssues} critical, ${report.summary.totalWarnings} warnings`);
  console.log(`Service Health Score: ${getScoreIcon(report.summary.serviceHealthScore)} ${report.summary.serviceHealthScore}/100`);
  console.log('');

  // Service status
  console.log('🔧 Service Status:');
  console.log('=================');
  for (const service of report.services) {
    const status = service.exists ? '✅' : '❌';
    const info = service.exists ? `${service.lines} lines, ${Math.round(service.size/1024)}KB` : 'Not found';
    console.log(`${status} ${service.name}: ${info}`);
  }
  console.log('');

  // Critical issues
  if (report.issues.length > 0) {
    console.log('🚨 Critical Issues:');
    console.log('==================');
    for (const issue of report.issues) {
      console.log(`❌ ${issue.code}: ${issue.message}`);
      if (issue.suggestion) {
        console.log(`   💡 Fix: ${issue.suggestion}`);
      }
      console.log('');
    }
  }

  // Key warnings
  if (report.warnings.length > 0) {
    console.log('⚠️  Key Warnings:');
    console.log('================');
    const keyWarnings = report.warnings.filter(w => 
      w.code.includes('MISSING_') || w.code.includes('INTEGRATION')
    );
    
    for (const warning of keyWarnings.slice(0, 10)) {
      console.log(`⚠️  ${warning.message}`);
      if (warning.suggestion) {
        console.log(`   💡 ${warning.suggestion}`);
      }
      console.log('');
    }

    if (report.warnings.length > keyWarnings.length) {
      console.log(`   ... and ${report.warnings.length - keyWarnings.length} more warnings`);
    }
  }

  // Service readiness assessment
  console.log('');
  console.log('📊 Service Readiness Assessment:');
  console.log('================================');
  
  const ingestionReady = report.services.some(s => s.name === 'governmentOpportunityIngestionService') &&
                        !report.issues.some(i => i.code === 'MISSING_INGESTION_CLASS');
  const deduplicationReady = report.services.some(s => s.name === 'opportunityDeduplicationService') &&
                            !report.issues.some(i => i.code === 'MISSING_DEDUPLICATION_CLASS');
  const samReady = report.services.some(s => s.name === 'sam');

  console.log(`Ingestion Service: ${ingestionReady ? '✅' : '❌'} ${ingestionReady ? 'Ready' : 'Needs implementation'}`);
  console.log(`Deduplication Service: ${deduplicationReady ? '✅' : '❌'} ${deduplicationReady ? 'Ready' : 'Needs implementation'}`);
  console.log(`SAM.gov Integration: ${samReady ? '✅' : '❌'} ${samReady ? 'Ready' : 'Needs implementation'}`);

  // Final assessment
  console.log('');
  if (report.summary.status === 'PASSED') {
    console.log('✅ Government Opportunities Services validation completed successfully!');
    console.log('   Your services are ready for testing and integration.');
  } else {
    console.log('❌ Services validation found critical issues!');
    console.log('   Please address the critical issues above before proceeding.');
  }

  console.log('');
  console.log('🎯 Next Steps:');
  console.log('==============');
  console.log('1. Address any critical issues found above');
  console.log('2. Test SAM.gov integration: node .claude/scripts/test-sam-integration.js');
  console.log('3. Run integration tests: npm test -- --grep "government"');
  console.log('4. Test complete Week 1 implementation');
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

module.exports = { GovernmentServicesValidator, main };