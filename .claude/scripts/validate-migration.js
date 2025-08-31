#!/usr/bin/env node

/**
 * CLI tool to validate database migrations before execution
 * Usage: node .claude/scripts/validate-migration.js [path-to-sql-file]
 */

const fs = require('fs');
const path = require('path');
const { DatabaseMigrationValidator } = require('../validators/database-migration-validator');

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔍 Database Migration Validator');
    console.log('Usage: node .claude/scripts/validate-migration.js <sql-file-path>');
    console.log('');
    console.log('Examples:');
    console.log('  node .claude/scripts/validate-migration.js src/database/schema.sql');
    console.log('  node .claude/scripts/validate-migration.js scripts/migrate.js');
    process.exit(1);
  }

  const sqlFilePath = args[0];
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ File not found: ${sqlFilePath}`);
    process.exit(1);
  }

  console.log(`🔍 Validating migration file: ${sqlFilePath}`);
  console.log('');

  try {
    let sqlContent;
    
    // Handle both .sql files and .js files that contain SQL
    if (sqlFilePath.endsWith('.sql')) {
      sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    } else if (sqlFilePath.endsWith('.js')) {
      // Extract SQL from JavaScript files (like our migrate.js)
      const jsContent = fs.readFileSync(sqlFilePath, 'utf8');
      sqlContent = extractSQLFromJavaScript(jsContent);
    } else {
      console.error('❌ Unsupported file type. Please use .sql or .js files.');
      process.exit(1);
    }

    if (!sqlContent || sqlContent.trim().length === 0) {
      console.error('❌ No SQL content found in file');
      process.exit(1);
    }

    // Initialize validator
    const validator = new DatabaseMigrationValidator({
      strictMode: true,
      logLevel: 'info'
    });

    // Run validation
    const report = validator.validateMigrationSQL(sqlContent, path.basename(sqlFilePath));

    // Display results
    displayValidationResults(report);

    // Exit with appropriate code
    process.exit(report.summary.status === 'PASSED' ? 0 : 1);

  } catch (error) {
    console.error('💥 Validation failed with error:', error.message);
    process.exit(1);
  }
}

function extractSQLFromJavaScript(jsContent) {
  // Look for SQL content in template literals, strings, or comments
  const sqlPatterns = [
    // Template literals with SQL
    /`([^`]*(?:CREATE|INSERT|UPDATE|DELETE|DROP|ALTER)[^`]*)`/gi,
    // String literals with SQL  
    /'([^']*(?:CREATE|INSERT|UPDATE|DELETE|DROP|ALTER)[^']*)'/gi,
    /"([^"]*(?:CREATE|INSERT|UPDATE|DELETE|DROP|ALTER)[^"]*)"/gi,
    // Multi-line strings
    /`([\s\S]*?(?:CREATE|INSERT|UPDATE|DELETE|DROP|ALTER)[\s\S]*?)`/gi
  ];

  let sqlContent = '';
  
  for (const pattern of sqlPatterns) {
    const matches = jsContent.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Remove the quotes/backticks and add to SQL content
        const cleanSQL = match.slice(1, -1)
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"');
        
        sqlContent += cleanSQL + '\n';
      }
    }
  }

  return sqlContent;
}

function displayValidationResults(report) {
  console.log('📋 Validation Report');
  console.log('==================');
  console.log(`File: ${report.filename}`);
  console.log(`Status: ${getStatusIcon(report.summary.status)} ${report.summary.status}`);
  console.log(`Risk Level: ${getRiskIcon(report.summary.riskLevel)} ${report.summary.riskLevel}`);
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

  // Success message
  if (report.summary.status === 'PASSED') {
    console.log('✅ Migration validation completed successfully!');
    console.log('   This migration should execute without the common issues we encountered previously.');
  } else {
    console.log('❌ Migration validation failed!');
    console.log('   Please address the critical issues before executing this migration.');
  }
}

function getStatusIcon(status) {
  return status === 'PASSED' ? '✅' : '❌';
}

function getRiskIcon(riskLevel) {
  const icons = {
    'MINIMAL': '🟢',
    'LOW': '🟡',
    'MEDIUM': '🟠', 
    'HIGH': '🔴',
    'CRITICAL': '🚨'
  };
  return icons[riskLevel] || '❓';
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

module.exports = { main, extractSQLFromJavaScript, displayValidationResults };