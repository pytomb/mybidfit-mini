#!/usr/bin/env node

/**
 * Comprehensive validation runner for MyBidFit platform
 * Runs all quality prevention validators in the correct order
 * Usage: node .claude/scripts/run-all-validators.js [--quick] [--fix]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const quickMode = args.includes('--quick');
  const fixMode = args.includes('--fix');
  
  console.log('🔍 MyBidFit Comprehensive Quality Validation');
  console.log('============================================');
  console.log(`Mode: ${quickMode ? 'Quick' : 'Complete'} ${fixMode ? '+ Auto-fix' : ''}`);
  console.log('');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  try {
    // 1. Database Integrity Validation (Critical)
    console.log('🏗️  Step 1: Database Integrity Validation');
    console.log('=========================================');
    const dbResult = await runValidator(
      'node .claude/scripts/validate-data-integrity.js src/database/schema.sql',
      'Database integrity and foreign key relationships',
      true
    );
    updateResults(results, dbResult, 'database_integrity');

    // 2. Service Consistency Validation (Critical)
    console.log('🔧 Step 2: Service Consistency Validation');
    console.log('========================================');
    const serviceResult = await runValidator(
      'node .claude/scripts/validate-services.js',
      'Service import/export consistency',
      true
    );
    updateResults(results, serviceResult, 'service_consistency');

    // 3. Test Generation Validation (High Priority)
    console.log('🧪 Step 3: Test Generation Validation');
    console.log('====================================');
    const testResult = await runValidator(
      'node .claude/scripts/validate-test-generation.js',
      'Test coverage and Store-First methodology',
      !quickMode
    );
    updateResults(results, testResult, 'test_generation');

    // 4. PostgreSQL Compatibility Check (Optional in quick mode)
    if (!quickMode) {
      console.log('🐘 Step 4: PostgreSQL Compatibility Check');
      console.log('=========================================');
      const pgResult = await runValidator(
        'node .claude/scripts/validate-postgres-compatibility.js system',
        'PostgreSQL system query compatibility',
        false
      );
      updateResults(results, pgResult, 'postgres_compatibility');
    }

    // 5. Migration Validation (if migrate.js exists)
    const migrateFile = 'scripts/migrate.js';
    if (fs.existsSync(migrateFile)) {
      console.log('📜 Step 5: Migration Validation');
      console.log('===============================');
      const migrationResult = await runValidator(
        `node .claude/scripts/validate-migration.js ${migrateFile}`,
        'Database migration SQL validation',
        false
      );
      updateResults(results, migrationResult, 'migration_validation');
    }

    // Display comprehensive results
    displayComprehensiveResults(results);

    // Generate action plan if there are issues
    if (results.failed > 0) {
      generateActionPlan(results);
    }

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('💥 Validation suite failed:', error.message);
    process.exit(1);
  }
}

async function runValidator(command, description, isCritical) {
  console.log(`🔍 ${description}...`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ PASSED');
    console.log('');
    
    return {
      status: 'PASSED',
      output: output,
      isCritical: isCritical
    };
    
  } catch (error) {
    const status = error.status === 1 ? 'FAILED' : 'ERROR';
    console.log(`${status === 'FAILED' ? '❌' : '💥'} ${status}`);
    
    // Show first few lines of error output for context
    const errorLines = error.stdout ? error.stdout.split('\n').slice(-10) : [];
    const contextLines = errorLines.filter(line => 
      line.includes('❌') || line.includes('critical') || line.includes('Issues:') || line.includes('Status:')
    );
    
    if (contextLines.length > 0) {
      console.log('Key issues:');
      contextLines.slice(0, 3).forEach(line => {
        console.log(`  ${line.trim()}`);
      });
    }
    
    console.log('');
    
    return {
      status: status,
      output: error.stdout || error.message,
      isCritical: isCritical,
      details: contextLines
    };
  }
}

function updateResults(results, validatorResult, validatorName) {
  if (validatorResult.status === 'PASSED') {
    results.passed++;
  } else {
    results.failed++;
    if (!validatorResult.isCritical) {
      results.warnings++;
    }
  }
  
  results.details.push({
    name: validatorName,
    ...validatorResult
  });
}

function displayComprehensiveResults(results) {
  console.log('📊 Comprehensive Validation Results');
  console.log('===================================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log('');

  // Show status for each validator
  console.log('📋 Validation Breakdown:');
  console.log('========================');
  
  for (const detail of results.details) {
    const icon = detail.status === 'PASSED' ? '✅' : 
                 detail.isCritical ? '🚨' : '⚠️';
    const priority = detail.isCritical ? '(CRITICAL)' : '(WARNING)';
    
    console.log(`${icon} ${detail.name.replace(/_/g, ' ')}: ${detail.status} ${detail.status !== 'PASSED' ? priority : ''}`);
  }
  
  console.log('');
  
  // Overall assessment
  const criticalFailures = results.details.filter(d => d.status !== 'PASSED' && d.isCritical).length;
  
  if (criticalFailures === 0) {
    console.log('🎉 Overall Status: READY FOR DEVELOPMENT');
    console.log('   All critical quality gates passed. Minor warnings can be addressed during development.');
  } else {
    console.log('🚨 Overall Status: CRITICAL ISSUES FOUND');
    console.log(`   ${criticalFailures} critical issues must be resolved before proceeding with major development work.`);
  }
}

function generateActionPlan(results) {
  console.log('');
  console.log('🔧 Action Plan to Resolve Issues:');
  console.log('=================================');
  
  const criticalIssues = results.details.filter(d => d.status !== 'PASSED' && d.isCritical);
  const warnings = results.details.filter(d => d.status !== 'PASSED' && !d.isCritical);
  
  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES (Fix immediately):');
    criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.name.replace(/_/g, ' ')}:`);
      if (issue.details && issue.details.length > 0) {
        issue.details.slice(0, 2).forEach(detail => {
          console.log(`   • ${detail.replace(/^\s*[❌⚠️]\s*/, '').trim()}`);
        });
      }
      console.log(`   🔧 Fix: Run 'node .claude/scripts/validate-${issue.name.split('_')[0]}.js' for detailed fixes`);
      console.log('');
    });
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (Address when possible):');
    warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning.name.replace(/_/g, ' ')}: ${warning.status}`);
    });
    console.log('');
  }
  
  console.log('💡 Quick Fix Commands:');
  console.log('=====================');
  console.log('# Re-run specific validators for detailed fix guidance:');
  console.log('node .claude/scripts/validate-data-integrity.js src/database/schema.sql');
  console.log('node .claude/scripts/validate-services.js');
  console.log('node .claude/scripts/validate-test-generation.js');
  console.log('');
  console.log('# For complete documentation:');
  console.log('cat .claude/README.md');
}

function showUsage() {
  console.log('🔍 MyBidFit Comprehensive Quality Validation');
  console.log('Usage: node .claude/scripts/run-all-validators.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --quick     Run only critical validators (faster)');
  console.log('  --fix       Attempt to auto-fix issues where possible');
  console.log('');
  console.log('Examples:');
  console.log('  node .claude/scripts/run-all-validators.js');
  console.log('  node .claude/scripts/run-all-validators.js --quick');
  console.log('  node .claude/scripts/run-all-validators.js --quick --fix');
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, runValidator, updateResults, displayComprehensiveResults };