#!/usr/bin/env node

/**
 * CLI tool to validate test generation consistency and Store-First methodology
 * Usage: node .claude/scripts/validate-test-generation.js
 */

const path = require('path');
const { TestGenerationValidator } = require('../validators/test-generation-validator');

async function main() {
  console.log('🧪 Test Generation & Store-First Methodology Validator');
  console.log('=====================================================');
  console.log('');

  try {
    // Initialize validator with project settings
    const validator = new TestGenerationValidator({
      projectRoot: process.cwd(),
      serviceDir: 'src/services',
      testDir: 'test',
      strictMode: true,
      enforceStoreFirst: true,
      logLevel: 'info'
    });

    // Run comprehensive validation
    const report = await validator.validateTestGeneration();

    // Display results
    console.log('');
    displayValidationResults(report);

    // Generate specific recommendations
    if (report.issues.length > 0 || report.warnings.length > 0) {
      console.log('');
      generateTestGenerationPlan(report);
    }

    // Exit with appropriate code
    process.exit(report.summary.status === 'PASSED' ? 0 : 1);

  } catch (error) {
    console.error('💥 Test generation validation failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function displayValidationResults(report) {
  console.log('📋 Test Generation Report');
  console.log('=========================');
  console.log(`Status: ${getStatusIcon(report.summary.status)} ${report.summary.status}`);
  console.log(`Services: ${report.summary.totalServices}`);
  console.log(`Tests: ${report.summary.totalTests}`);
  console.log(`Test Coverage: ${report.summary.testCoverage}`);
  console.log(`Store-First Compliance: ${report.summary.storeFirstCompliance}%`);
  console.log(`Issues: ${report.summary.totalIssues} critical, ${report.summary.totalWarnings} warnings`);
  console.log('');

  // Display critical issues
  if (report.issues.length > 0) {
    console.log('🚨 Critical Issues:');
    console.log('==================');
    for (const issue of report.issues) {
      console.log(`❌ ${issue.code}: ${issue.message}`);
      if (issue.details && issue.details.testFile) {
        console.log(`   Test File: ${issue.details.testFile}`);
      }
      if (issue.details && issue.details.serviceFile) {
        console.log(`   Service File: ${issue.details.serviceFile}`);
      }
      if (issue.details && issue.details.importPattern) {
        console.log(`   Current Import: ${issue.details.importPattern}`);
      }
      if (issue.suggestion) {
        console.log(`   💡 Fix: ${issue.suggestion}`);
      }
      console.log('');
    }
  }

  // Display warnings
  if (report.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    console.log('============');
    for (const warning of report.warnings) {
      console.log(`⚠️  ${warning.code}: ${warning.message}`);
      if (warning.details && warning.details.testFile) {
        console.log(`   File: ${warning.details.testFile}`);
      }
      if (warning.suggestion) {
        console.log(`   💡 Suggestion: ${warning.suggestion}`);
      }
      console.log('');
    }
  }

  // Display recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    console.log('==================');
    for (const rec of report.recommendations) {
      console.log(`${getPriorityIcon(rec.priority)} ${rec.priority}: ${rec.category}`);
      console.log(`   ${rec.action}`);
      
      if (rec.details && rec.details.services) {
        console.log(`   📋 Priority Test Generation Order:`);
        rec.details.services.slice(0, 5).forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name} (${service.priority} priority) - ${service.businessLogicCount} business logic components`);
        });
        if (rec.details.services.length > 5) {
          console.log(`   ... and ${rec.details.services.length - 5} more services`);
        }
      }
      
      if (rec.details && rec.details.storeFirstBenefits) {
        console.log(`   🎯 Store-First Benefits:`);
        rec.details.storeFirstBenefits.forEach(benefit => {
          console.log(`   • ${benefit}`);
        });
      }
      console.log('');
    }
  }

  // Service analysis summary
  console.log('📊 Service Analysis:');
  console.log('===================');
  let criticalServices = 0, highServices = 0, mediumServices = 0;
  
  for (const service of report.services) {
    if (service.testPriority === 'critical') criticalServices++;
    else if (service.testPriority === 'high') highServices++;
    else mediumServices++;
    
    const hasTest = report.coverage.some(c => c.service === service.name);
    const testStatus = hasTest ? '✅' : '❌';
    
    console.log(`📁 ${service.name} (${service.testPriority}): ${testStatus}`);
    console.log(`   Classes: ${service.classes.length}, Functions: ${service.functions.length}, Business Logic: ${service.businessLogic.length}`);
    
    if (service.businessLogic.length > 0) {
      const businessItems = service.businessLogic.slice(0, 3).map(bl => bl.identifier).join(', ');
      console.log(`   Key Business Logic: ${businessItems}${service.businessLogic.length > 3 ? '...' : ''}`);
    }
  }
  console.log('');

  console.log(`Priority Distribution: ${criticalServices} critical, ${highServices} high, ${mediumServices} medium`);
  console.log('');

  // Test analysis summary  
  if (report.tests.length > 0) {
    console.log('🧪 Test Analysis:');
    console.log('=================');
    let storeFirstCompliant = 0;
    
    for (const test of report.tests) {
      const complianceIcon = test.followsStoreFirst ? '✅' : '❌';
      storeFirstCompliant += test.followsStoreFirst ? 1 : 0;
      
      console.log(`📁 ${test.name}: ${complianceIcon} Store-First`);
      console.log(`   Service Imports: ${test.serviceImports.length}, Test Cases: ${test.testCases.length}`);
      
      if (test.serviceImports.length > 0) {
        const imports = test.serviceImports.map(imp => `${path.basename(imp.module)} (${imp.type})`).join(', ');
        console.log(`   Import Patterns: ${imports}`);
      }
    }
    
    console.log('');
    console.log(`Store-First Compliance: ${storeFirstCompliant}/${report.tests.length} tests (${report.summary.storeFirstCompliance}%)`);
  }

  // Success/failure message
  console.log('');
  if (report.summary.status === 'PASSED') {
    console.log('✅ Test generation validation completed successfully!');
    console.log('   All services and tests follow consistent patterns and Store-First methodology.');
  } else {
    console.log('❌ Test generation validation found issues!');
    console.log('   Please address the critical issues to ensure consistent test patterns.');
  }
}

function generateTestGenerationPlan(report) {
  console.log('🔧 Test Generation Action Plan:');
  console.log('==============================');
  
  // Fix import/export mismatches first
  const importIssues = report.issues.filter(issue => issue.code === 'IMPORT_EXPORT_MISMATCH');
  if (importIssues.length > 0) {
    console.log('1️⃣ Fix Import/Export Mismatches (CRITICAL):');
    importIssues.forEach(issue => {
      console.log(`   📝 ${path.basename(issue.details.testFile)}:`);
      console.log(`      ${issue.suggestion}`);
    });
    console.log('');
  }
  
  // Generate missing tests
  const missingTests = report.issues.filter(issue => issue.code === 'MISSING_TEST' || issue.code === 'MISSING_HIGH_PRIORITY_TEST');
  if (missingTests.length > 0) {
    console.log('2️⃣ Generate Missing Tests (Store-First Order):');
    
    // Group by priority
    const criticalMissing = missingTests.filter(issue => issue.details.priority === 'critical');
    const highMissing = missingTests.filter(issue => issue.details.priority === 'high');
    const mediumMissing = missingTests.filter(issue => issue.details.priority === 'medium');
    
    if (criticalMissing.length > 0) {
      console.log('   🚨 Critical Priority:');
      criticalMissing.forEach(issue => {
        console.log(`      📝 Create test for ${issue.details.service}`);
        console.log(`         Focus: Business logic, calculations, core algorithms`);
      });
      console.log('');
    }
    
    if (highMissing.length > 0) {
      console.log('   🟠 High Priority:');
      highMissing.forEach(issue => {
        console.log(`      📝 Create test for ${issue.details.service}`);
        console.log(`         Focus: Data processing, matching algorithms`);
      });
      console.log('');
    }
    
    if (mediumMissing.length > 0) {
      console.log('   🟡 Medium Priority:');
      mediumMissing.slice(0, 3).forEach(issue => {
        console.log(`      📝 Create test for ${issue.details.service}`);
      });
      if (mediumMissing.length > 3) {
        console.log(`      ... and ${mediumMissing.length - 3} more`);
      }
    }
  }
  
  // Store-First compliance improvements
  const storeFirstIssues = report.warnings.filter(w => w.code === 'STORE_FIRST_VIOLATION');
  if (storeFirstIssues.length > 0) {
    console.log('3️⃣ Improve Store-First Compliance:');
    storeFirstIssues.slice(0, 3).forEach(issue => {
      console.log(`   📝 ${path.basename(issue.details.testFile)}: Focus more on business logic testing`);
    });
    if (storeFirstIssues.length > 3) {
      console.log(`   ... and ${storeFirstIssues.length - 3} more tests to improve`);
    }
    console.log('');
  }
  
  console.log('💡 Store-First Testing Guidelines:');
  console.log('=================================');
  console.log('✅ DO: Test business logic first (calculations, data processing, algorithms)');
  console.log('✅ DO: Test services and stores before UI components');
  console.log('✅ DO: Use consistent import patterns matching service exports');
  console.log('✅ DO: Focus on pure functions and data transformations');
  console.log('❌ AVOID: Starting with UI component testing');
  console.log('❌ AVOID: Testing implementation details instead of behavior');
  console.log('❌ AVOID: Mixed import patterns for the same service');
}

function getStatusIcon(status) {
  return status === 'PASSED' ? '✅' : '❌';
}

function getPriorityIcon(priority) {
  const icons = {
    'LOW': '🔵',
    'MEDIUM': '🟡',
    'HIGH': '🟠',
    'CRITICAL': '🔴'
  };
  return icons[priority] || '❓';
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, displayValidationResults, generateTestGenerationPlan };