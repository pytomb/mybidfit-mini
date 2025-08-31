#!/usr/bin/env node

const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');

/**
 * Data Quality Validation System for MyBidFit Platform
 * Validates data integrity, consistency, and business rule compliance
 */

async function validateDataQuality() {
  const db = Database.getInstance();
  
  try {
    logger.info('🔍 Starting comprehensive data quality validation...');
    
    await db.connect();
    logger.info('✅ Database connected');
    
    const validationResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: [],
      summary: {}
    };
    
    // 1. Data Consistency Validation
    logger.info('📊 Validating data consistency and integrity...');
    
    // Check for orphaned records
    const orphanChecks = [
      {
        name: 'Orphaned Partner Profiles',
        query: `
          SELECT COUNT(*) as count 
          FROM partner_profiles pp 
          LEFT JOIN companies c ON pp.company_id = c.id 
          WHERE c.id IS NULL
        `,
        threshold: 0
      },
      {
        name: 'Orphaned Partner Matches',
        query: `
          SELECT COUNT(*) as count 
          FROM partner_matches pm 
          LEFT JOIN partner_profiles pp1 ON pm.seeker_id = pp1.id 
          LEFT JOIN partner_profiles pp2 ON pm.partner_id = pp2.id 
          WHERE pp1.id IS NULL OR pp2.id IS NULL
        `,
        threshold: 0
      },
      {
        name: 'Orphaned Scoring Results',
        query: `
          SELECT COUNT(*) as count 
          FROM scoring_results sr 
          LEFT JOIN companies c ON sr.company_id = c.id 
          LEFT JOIN opportunities o ON sr.opportunity_id = o.id 
          WHERE c.id IS NULL OR o.id IS NULL
        `,
        threshold: 0
      }
    ];
    
    for (const check of orphanChecks) {
      try {
        const result = await db.query(check.query);
        const count = parseInt(result.rows[0].count);
        
        if (count > check.threshold) {
          validationResults.failed++;
          validationResults.issues.push({
            type: 'CRITICAL',
            category: 'Data Integrity',
            check: check.name,
            count: count,
            description: `Found ${count} orphaned records that violate referential integrity`
          });
          logger.warn(`   ⚠️ ${check.name}: ${count} orphaned records found`);
        } else {
          validationResults.passed++;
          logger.info(`   ✅ ${check.name}: No orphaned records`);
        }
      } catch (error) {
        validationResults.failed++;
        validationResults.issues.push({
          type: 'ERROR',
          category: 'Validation Error',
          check: check.name,
          error: error.message
        });
        logger.error(`   ❌ ${check.name}: Validation failed - ${error.message}`);
      }
    }
    
    // 2. Business Rules Validation
    logger.info('📋 Validating business rules compliance...');
    
    const businessRuleChecks = [
      {
        name: 'Company Credibility Score Range',
        query: `
          SELECT COUNT(*) as count 
          FROM companies 
          WHERE credibility_score < 0 OR credibility_score > 100
        `,
        threshold: 0,
        description: 'Credibility scores must be between 0-100'
      },
      {
        name: 'Partner Match Score Range',
        query: `
          SELECT COUNT(*) as count 
          FROM partner_matches 
          WHERE match_score < 0 OR match_score > 1
        `,
        threshold: 0,
        description: 'Match scores must be between 0-1'
      },
      {
        name: 'Opportunity Value Consistency',
        query: `
          SELECT COUNT(*) as count 
          FROM opportunities 
          WHERE project_value_min > project_value_max
        `,
        threshold: 0,
        description: 'Minimum project value cannot exceed maximum value'
      },
      {
        name: 'Partner Profile Capacity Range',
        query: `
          SELECT COUNT(*) as count 
          FROM partner_profiles 
          WHERE current_capacity < 0 OR current_capacity > 100
        `,
        threshold: 0,
        description: 'Partner capacity must be between 0-100%'
      },
      {
        name: 'Future Opportunity Deadlines',
        query: `
          SELECT COUNT(*) as count 
          FROM opportunities 
          WHERE submission_deadline < NOW() - INTERVAL '30 days'
        `,
        threshold: 0,
        description: 'Opportunities with very old deadlines should be cleaned up'
      }
    ];
    
    for (const check of businessRuleChecks) {
      try {
        const result = await db.query(check.query);
        const count = parseInt(result.rows[0].count);
        
        if (count > check.threshold) {
          const severity = check.name.includes('Score Range') || check.name.includes('Value Consistency') ? 'CRITICAL' : 'WARNING';
          
          if (severity === 'CRITICAL') {
            validationResults.failed++;
          } else {
            validationResults.warnings++;
          }
          
          validationResults.issues.push({
            type: severity,
            category: 'Business Rules',
            check: check.name,
            count: count,
            description: check.description
          });
          
          logger.warn(`   ⚠️ ${check.name}: ${count} violations found`);
        } else {
          validationResults.passed++;
          logger.info(`   ✅ ${check.name}: All records comply`);
        }
      } catch (error) {
        validationResults.failed++;
        validationResults.issues.push({
          type: 'ERROR',
          category: 'Validation Error',
          check: check.name,
          error: error.message
        });
        logger.error(`   ❌ ${check.name}: Validation failed - ${error.message}`);
      }
    }
    
    // 3. Data Completeness Validation
    logger.info('📝 Validating data completeness...');
    
    const completenessChecks = [
      {
        name: 'Company Required Fields',
        query: `
          SELECT COUNT(*) as count 
          FROM companies 
          WHERE name IS NULL OR name = '' 
             OR description IS NULL OR description = ''
             OR size_category IS NULL OR size_category = ''
        `,
        threshold: 0,
        description: 'Companies missing required fields (name, description, size)'
      },
      {
        name: 'Opportunity Required Fields',
        query: `
          SELECT COUNT(*) as count 
          FROM opportunities 
          WHERE title IS NULL OR title = '' 
             OR buyer_organization IS NULL OR buyer_organization = ''
             OR industry IS NULL OR industry = ''
        `,
        threshold: 0,
        description: 'Opportunities missing required fields'
      },
      {
        name: 'Partner Profile Completeness',
        query: `
          SELECT COUNT(*) as count 
          FROM partner_profiles 
          WHERE contact_email IS NULL OR contact_email = ''
             OR profile_completeness < 80
        `,
        threshold: 0,
        description: 'Partner profiles with low completeness or missing contact info'
      }
    ];
    
    for (const check of completenessChecks) {
      try {
        const result = await db.query(check.query);
        const count = parseInt(result.rows[0].count);
        
        if (count > check.threshold) {
          validationResults.warnings++;
          validationResults.issues.push({
            type: 'WARNING',
            category: 'Data Completeness',
            check: check.name,
            count: count,
            description: check.description
          });
          logger.warn(`   ⚠️ ${check.name}: ${count} incomplete records`);
        } else {
          validationResults.passed++;
          logger.info(`   ✅ ${check.name}: All records complete`);
        }
      } catch (error) {
        validationResults.failed++;
        validationResults.issues.push({
          type: 'ERROR',
          category: 'Validation Error',
          check: check.name,
          error: error.message
        });
        logger.error(`   ❌ ${check.name}: Validation failed - ${error.message}`);
      }
    }
    
    // 4. Performance and Volume Validation
    logger.info('⚡ Validating data volume and performance indicators...');
    
    const volumeChecks = [
      {
        name: 'Table Row Counts',
        query: `
          SELECT 
            'companies' as table_name, COUNT(*) as count FROM companies
          UNION ALL SELECT 'opportunities', COUNT(*) FROM opportunities
          UNION ALL SELECT 'partner_profiles', COUNT(*) FROM partner_profiles
          UNION ALL SELECT 'partner_matches', COUNT(*) FROM partner_matches
        `
      },
      {
        name: 'Dead Tuple Analysis',
        query: `
          SELECT 
            relname as table_name,
            n_dead_tup as dead_tuples,
            n_live_tup as live_tuples,
            CASE 
              WHEN n_live_tup > 0 THEN ROUND(CAST((n_dead_tup::float / n_live_tup::float) * 100 AS numeric), 2)
              ELSE 0 
            END as dead_percentage
          FROM pg_stat_user_tables
          WHERE schemaname = 'public'
          ORDER BY dead_percentage DESC
        `
      }
    ];
    
    for (const check of volumeChecks) {
      try {
        const result = await db.query(check.query);
        
        if (check.name === 'Table Row Counts') {
          logger.info(`   📊 Table Row Counts:`);
          for (const row of result.rows) {
            logger.info(`      ${row.table_name}: ${row.count} records`);
          }
          validationResults.passed++;
        } else if (check.name === 'Dead Tuple Analysis') {
          logger.info(`   🧹 Dead Tuple Analysis:`);
          let highDeadTuples = false;
          for (const row of result.rows) {
            const deadPercent = parseFloat(row.dead_percentage);
            if (deadPercent > 20) {
              highDeadTuples = true;
              logger.warn(`      ${row.table_name}: ${deadPercent}% dead tuples (${row.dead_tuples}/${row.live_tuples})`);
            } else {
              logger.info(`      ${row.table_name}: ${deadPercent}% dead tuples`);
            }
          }
          
          if (highDeadTuples) {
            validationResults.warnings++;
            validationResults.issues.push({
              type: 'WARNING',
              category: 'Performance',
              check: 'High Dead Tuple Percentage',
              description: 'Tables with >20% dead tuples may benefit from VACUUM'
            });
          } else {
            validationResults.passed++;
          }
        }
      } catch (error) {
        validationResults.failed++;
        validationResults.issues.push({
          type: 'ERROR',
          category: 'Performance Analysis',
          check: check.name,
          error: error.message
        });
        logger.error(`   ❌ ${check.name}: Analysis failed - ${error.message}`);
      }
    }
    
    // 5. Generate Final Report
    validationResults.summary = {
      totalChecks: validationResults.passed + validationResults.failed + validationResults.warnings,
      passed: validationResults.passed,
      failed: validationResults.failed,
      warnings: validationResults.warnings,
      overallStatus: validationResults.failed === 0 ? 
        (validationResults.warnings === 0 ? 'EXCELLENT' : 'GOOD') : 'NEEDS_ATTENTION',
      dataQualityScore: Math.round((validationResults.passed / (validationResults.passed + validationResults.failed + validationResults.warnings)) * 100)
    };
    
    logger.info('📋 Data Quality Validation Summary:');
    logger.info(`   Total Checks: ${validationResults.summary.totalChecks}`);
    logger.info(`   ✅ Passed: ${validationResults.summary.passed}`);
    logger.info(`   ⚠️ Warnings: ${validationResults.summary.warnings}`);
    logger.info(`   ❌ Failed: ${validationResults.summary.failed}`);
    logger.info(`   📊 Data Quality Score: ${validationResults.summary.dataQualityScore}%`);
    logger.info(`   🏆 Overall Status: ${validationResults.summary.overallStatus}`);
    
    // Log critical issues
    if (validationResults.issues.length > 0) {
      logger.info('🚨 Issues Found:');
      for (const issue of validationResults.issues) {
        if (issue.type === 'CRITICAL' || issue.type === 'ERROR') {
          logger.error(`   ${issue.type}: ${issue.check} - ${issue.description}`);
        } else {
          logger.warn(`   ${issue.type}: ${issue.check} - ${issue.description}`);
        }
      }
    }
    
    return validationResults;
    
  } catch (error) {
    logger.error('💥 Data quality validation failed:', error);
    throw error;
  } finally {
    await db.disconnect();
    logger.info('🔌 Database connection closed');
  }
}

// Run validation
if (require.main === module) {
  validateDataQuality()
    .then((results) => {
      if (results.summary.overallStatus === 'EXCELLENT') {
        logger.info('✅ Data quality validation completed - All systems optimal');
        process.exit(0);
      } else if (results.summary.overallStatus === 'GOOD') {
        logger.info('⚠️ Data quality validation completed - Minor issues detected');
        process.exit(0);
      } else {
        logger.error('❌ Data quality validation completed - Critical issues require attention');
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('❌ Data quality validation failed');
      process.exit(1);
    });
}

module.exports = { validateDataQuality };