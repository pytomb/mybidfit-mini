#!/usr/bin/env node

/**
 * CLI tool to validate data relationship integrity
 * Usage: node .claude/scripts/validate-data-integrity.js [path-to-schema-file]
 */

const fs = require('fs');
const path = require('path');
const { DataIntegrityValidator } = require('../validators/data-integrity-validator');

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔗 Data Relationship Integrity Validator');
    console.log('Usage: node .claude/scripts/validate-data-integrity.js <schema-file-path>');
    console.log('');
    console.log('Examples:');
    console.log('  node .claude/scripts/validate-data-integrity.js src/database/schema.sql');
    console.log('  node .claude/scripts/validate-data-integrity.js scripts/migrate.js');
    process.exit(1);
  }

  const schemaFilePath = args[0];
  
  if (!fs.existsSync(schemaFilePath)) {
    console.error(`❌ File not found: ${schemaFilePath}`);
    process.exit(1);
  }

  console.log(`🔗 Validating data integrity for: ${schemaFilePath}`);
  console.log('');

  try {
    let schemaContent;
    
    // Handle both .sql files and .js files that contain SQL
    if (schemaFilePath.endsWith('.sql')) {
      schemaContent = fs.readFileSync(schemaFilePath, 'utf8');
    } else if (schemaFilePath.endsWith('.js')) {
      // Extract SQL from JavaScript files
      const jsContent = fs.readFileSync(schemaFilePath, 'utf8');
      schemaContent = extractSQLFromJavaScript(jsContent);
    } else {
      console.error('❌ Unsupported file type. Please use .sql or .js files.');
      process.exit(1);
    }

    if (!schemaContent || schemaContent.trim().length === 0) {
      console.error('❌ No SQL schema content found in file');
      process.exit(1);
    }

    // Initialize validator
    const validator = new DataIntegrityValidator({
      strictMode: true,
      logLevel: 'info'
    });

    // Run validation
    validator.validateDataIntegrity(schemaContent).then(report => {
      // Display results
      displayValidationResults(report, path.basename(schemaFilePath));

      // Exit with appropriate code
      process.exit(report.summary.status === 'PASSED' ? 0 : 1);
    });

  } catch (error) {
    console.error('💥 Data integrity validation failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function extractSQLFromJavaScript(jsContent) {
  // Look for SQL content in template literals, strings, or comments
  const sqlPatterns = [
    // Template literals with SQL keywords
    /`([^`]*(?:CREATE TABLE|ALTER TABLE|DROP TABLE|CREATE INDEX)[^`]*)`/gi,
    // String literals with SQL keywords
    /'([^']*(?:CREATE TABLE|ALTER TABLE|DROP TABLE|CREATE INDEX)[^']*)'/gi,
    /\"([^\"]*(?:CREATE TABLE|ALTER TABLE|DROP TABLE|CREATE INDEX)[^\"]*)\"/gi,
    // Multi-line template literals
    /`([\s\S]*?(?:CREATE TABLE|ALTER TABLE|DROP TABLE|CREATE INDEX)[\s\S]*?)`/gi
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

function displayValidationResults(report, filename) {
  console.log('📋 Data Integrity Report');
  console.log('========================');
  console.log(`File: ${filename}`);
  console.log(`Status: ${getStatusIcon(report.summary.status)} ${report.summary.status}`);
  console.log(`Integrity Score: ${getScoreIcon(report.summary.integrityScore)} ${report.summary.integrityScore}/100`);
  console.log(`Tables Analyzed: ${report.summary.tablesAnalyzed}`);
  console.log(`Relationships: ${report.summary.relationshipsAnalyzed}`);
  console.log(`Issues: ${report.summary.totalIssues} critical, ${report.summary.totalWarnings} warnings`);
  console.log('');

  // Display critical issues
  if (report.issues.length > 0) {
    console.log('🚨 Critical Issues:');
    console.log('==================');
    for (const issue of report.issues) {
      console.log(`❌ ${issue.code}: ${issue.message}`);
      if (issue.details && Object.keys(issue.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(issue.details, null, 2).replace(/\n/g, '\n   ')}`);
      }
      if (issue.suggestion) {
        console.log(`   💡 Suggestion: ${issue.suggestion}`);
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
      if (rec.details && rec.details.insertionOrder) {
        console.log(`   📋 Safe Insertion Order: ${rec.details.insertionOrder.join(' → ')}`);
      }
      if (rec.details && rec.details.recommendations) {
        console.log(`   📋 Index Recommendations:`);
        rec.details.recommendations.slice(0, 5).forEach(idx => {
          console.log(`      CREATE INDEX idx_${idx.table}_${idx.column} ON ${idx.table}(${idx.column});`);
        });
        if (rec.details.recommendations.length > 5) {
          console.log(`      ... and ${rec.details.recommendations.length - 5} more`);
        }
      }
      console.log('');
    }
  }

  // Table analysis summary
  console.log('📊 Table Analysis:');
  console.log('==================');
  for (const table of report.tables) {
    console.log(`📁 ${table.name}:`);
    console.log(`   Columns: ${table.columnCount}, Foreign Keys: ${table.foreignKeyCount}, Referenced By: ${table.referencedByCount}`);
  }
  console.log('');

  // Relationship summary
  if (report.relationships.length > 0) {
    console.log('🔗 Relationships:');
    console.log('=================');
    for (const rel of report.relationships.slice(0, 10)) {
      console.log(`   ${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`);
    }
    if (report.relationships.length > 10) {
      console.log(`   ... and ${report.relationships.length - 10} more relationships`);
    }
    console.log('');
  }

  // Success/failure message
  console.log('');
  if (report.summary.status === 'PASSED') {
    console.log('✅ Data integrity validation completed successfully!');
    console.log(`   Database schema has excellent data relationship integrity (${report.summary.integrityScore}/100).`);
  } else {
    console.log('❌ Data integrity validation found issues!');
    console.log('   Please address the critical issues above before proceeding with data operations.');
  }

  // MyBidFit-specific guidance
  if (report.summary.tablesAnalyzed > 0) {
    console.log('');
    console.log('🎯 MyBidFit Platform Guidance:');
    console.log('==============================');
    
    const hasPartnerProfiles = report.tables.some(t => t.name === 'partner_profiles');
    const hasCompanies = report.tables.some(t => t.name === 'companies');
    const hasMatches = report.tables.some(t => t.name === 'partner_matches');
    
    if (hasPartnerProfiles && hasCompanies) {
      console.log('✅ Core business tables (companies, partner_profiles) detected');
    }
    if (hasMatches) {
      console.log('✅ Partner matching infrastructure ready');
    }
    
    const safeInsertionOrder = report.recommendations.find(r => r.code === 'SAFE_INSERTION_ORDER');
    if (safeInsertionOrder) {
      console.log('📋 For data seeding, follow the recommended insertion order to avoid foreign key violations.');
    }
  }
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