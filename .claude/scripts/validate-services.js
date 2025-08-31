#!/usr/bin/env node

/**
 * CLI tool to validate service import/export consistency
 * Usage: node .claude/scripts/validate-services.js
 */

const path = require('path');
const { ServiceConsistencyValidator } = require('../validators/service-consistency-validator');

async function main() {
  console.log('🔍 Service Import/Export Consistency Validator');
  console.log('============================================');
  console.log('');

  try {
    // Initialize validator with project settings
    const validator = new ServiceConsistencyValidator({
      projectRoot: process.cwd(),
      serviceDir: 'src/services',
      testDir: 'test',
      strictMode: true,
      logLevel: 'info'
    });

    // Run comprehensive validation
    const report = await validator.validateServiceConsistency();

    // Display results
    console.log('');
    displayValidationResults(report);

    // Generate fix suggestions
    if (report.issues.length > 0) {
      console.log('');
      generateFixSuggestions(report);
    }

    // Exit with appropriate code
    process.exit(report.summary.status === 'PASSED' ? 0 : 1);

  } catch (error) {
    console.error('💥 Service validation failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function displayValidationResults(report) {
  console.log('📋 Service Consistency Report');
  console.log('============================');
  console.log(`Status: ${getStatusIcon(report.summary.status)} ${report.summary.status}`);
  console.log(`Services: ${report.summary.totalServices}`);
  console.log(`Tests: ${report.summary.totalTests}`);
  console.log(`Test Coverage: ${report.summary.testCoverage}%`);
  console.log(`Issues: ${report.summary.totalIssues} critical, ${report.summary.totalWarnings} warnings`);
  console.log('');

  // Display critical issues
  if (report.issues.length > 0) {
    console.log('🚨 Critical Issues:');
    console.log('==================');
    for (const issue of report.issues) {
      console.log(`❌ ${issue.code}: ${issue.message}`);
      if (issue.line) {
        console.log(`   Line: ${issue.line}`);
      }
      if (issue.details && issue.details.suggestion) {
        console.log(`   💡 Suggestion: ${issue.details.suggestion}`);
      }
      if (issue.details && issue.details.importStatement) {
        console.log(`   📄 Current: ${issue.details.importStatement}`);
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
      if (warning.line) {
        console.log(`   Line: ${warning.line}`);
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
      console.log('');
    }
  }

  // Service analysis summary
  console.log('📊 Service Analysis:');
  console.log('===================');
  for (const service of report.services) {
    const exportCount = service.exports.moduleExports.length + service.exports.namedExports.length;
    const classCount = service.classes.length;
    console.log(`📁 ${service.name}:`);
    console.log(`   Classes: ${classCount}, Exports: ${exportCount}, Style: ${service.exports.exportStyle || 'unknown'}`);
    if (service.classes.length > 0) {
      console.log(`   Classes: ${service.classes.map(c => c.name).join(', ')}`);
    }
  }
  console.log('');

  // Test analysis summary  
  console.log('🧪 Test Analysis:');
  console.log('=================');
  for (const test of report.tests) {
    const serviceImports = test.serviceImports.length;
    const instantiations = test.instantiations.length;
    console.log(`📁 ${test.name}:`);
    console.log(`   Service Imports: ${serviceImports}, Instantiations: ${instantiations}`);
    if (test.serviceImports.length > 0) {
      console.log(`   Imports: ${test.serviceImports.map(i => path.basename(i.module)).join(', ')}`);
    }
  }

  // Success/failure message
  console.log('');
  if (report.summary.status === 'PASSED') {
    console.log('✅ Service consistency validation completed successfully!');
    console.log('   All services and tests have consistent import/export patterns.');
  } else {
    console.log('❌ Service consistency validation failed!');
    console.log('   Please fix the critical issues above before proceeding.');
  }
}

function generateFixSuggestions(report) {
  console.log('🔧 Automated Fix Suggestions:');
  console.log('=============================');
  
  for (const issue of report.issues) {
    if (issue.code === 'IMPORT_EXPORT_MISMATCH' && issue.details.suggestion) {
      console.log(`💡 Fix for ${issue.code}:`);
      console.log(`   Replace: ${issue.details.importStatement}`);
      console.log(`   With:    ${issue.details.suggestion}`);
      console.log('');
    }
    
    if (issue.code === 'CLASS_NOT_EXPORTED' && issue.details.suggestion) {
      console.log(`💡 Fix for ${issue.code}:`);
      console.log(`   ${issue.details.suggestion}`);
      console.log('');
    }
  }
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

module.exports = { main, displayValidationResults, generateFixSuggestions };