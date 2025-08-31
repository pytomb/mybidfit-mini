#!/usr/bin/env node

const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');

/**
 * Database optimization script for production-ready performance
 * Analyzes current database state and applies optimizations
 */

async function optimizeDatabase() {
  const db = Database.getInstance();
  
  try {
    logger.info('🚀 Starting database optimization...');
    
    await db.connect();
    logger.info('✅ Database connected');
    
    // 1. Analyze current indexes
    logger.info('📊 Analyzing current database indexes...');
    const indexesResult = await db.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    logger.info(`📋 Found ${indexesResult.rows.length} existing indexes:`);
    for (const index of indexesResult.rows) {
      logger.info(`   ${index.tablename}: ${index.indexname}`);
    }
    
    // 2. Analyze table sizes and statistics
    logger.info('📈 Analyzing table statistics...');
    const statsResult = await db.query(`
      SELECT 
        schemaname,
        relname as tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    `);
    
    logger.info('📊 Table statistics:');
    for (const stat of statsResult.rows) {
      logger.info(`   ${stat.tablename}: ${stat.live_rows} rows, ${stat.dead_rows} dead`);
    }
    
    // 3. Check for missing critical indexes (beyond what schema.sql provides)
    logger.info('🔍 Adding performance-critical indexes...');
    
    const optimizationIndexes = [
      {
        name: 'idx_partner_matches_match_score_desc',
        table: 'partner_matches',
        definition: 'CREATE INDEX IF NOT EXISTS idx_partner_matches_match_score_desc ON partner_matches (match_score DESC, match_type)',
        purpose: 'Optimize partner matching queries with score-based ordering'
      },
      {
        name: 'idx_companies_size_region',
        table: 'companies',
        definition: 'CREATE INDEX IF NOT EXISTS idx_companies_size_region ON companies (size_category, headquarters_state)',
        purpose: 'Optimize filtering by company size and location'
      },
      {
        name: 'idx_opportunities_value_deadline',
        table: 'opportunities',
        definition: 'CREATE INDEX IF NOT EXISTS idx_opportunities_value_deadline ON opportunities (project_value_min, submission_deadline)',
        purpose: 'Optimize opportunity searches by value and deadline'
      },
      {
        name: 'idx_partner_profiles_capacity_open',
        table: 'partner_profiles',
        definition: 'CREATE INDEX IF NOT EXISTS idx_partner_profiles_capacity_open ON partner_profiles (open_to_partnership, current_capacity)',
        purpose: 'Optimize partner availability queries'
      },
      {
        name: 'idx_companies_credibility_projects',
        table: 'companies',
        definition: 'CREATE INDEX IF NOT EXISTS idx_companies_credibility_projects ON companies (credibility_score DESC, total_projects DESC)',
        purpose: 'Optimize company ranking and credibility queries'
      }
    ];
    
    let indexesCreated = 0;
    for (const index of optimizationIndexes) {
      try {
        logger.info(`⚡ Creating index: ${index.name} - ${index.purpose}`);
        await db.query(index.definition);
        indexesCreated++;
      } catch (error) {
        if (error.code === '42P07') { // Index already exists
          logger.info(`   ✓ Index ${index.name} already exists`);
        } else {
          logger.warn(`   ⚠️ Failed to create index ${index.name}:`, error.message);
        }
      }
    }
    
    logger.info(`✅ Created ${indexesCreated} new performance indexes`);
    
    // 4. Update table statistics for query planner
    logger.info('📊 Updating table statistics for query planner...');
    const tables = ['companies', 'opportunities', 'partner_profiles', 'partner_matches', 
                   'scoring_results', 'partnership_recommendations'];
    
    for (const table of tables) {
      try {
        await db.query(`ANALYZE ${table}`);
        logger.info(`   ✓ Analyzed ${table}`);
      } catch (error) {
        logger.warn(`   ⚠️ Failed to analyze ${table}:`, error.message);
      }
    }
    
    // 5. Test query performance on critical operations
    logger.info('⏱️ Testing query performance...');
    
    const performanceTests = [
      {
        name: 'Partner search with capabilities filter',
        query: `
          SELECT pp.id, c.name, c.capabilities 
          FROM partner_profiles pp 
          JOIN companies c ON pp.company_id = c.id 
          WHERE pp.open_to_partnership = true 
            AND c.capabilities && ARRAY['Cloud Migration', 'API Development']
          ORDER BY c.credibility_score DESC
          LIMIT 10
        `
      },
      {
        name: 'Opportunity matching by industry and value',
        query: `
          SELECT id, title, industry, project_value_min, project_value_max
          FROM opportunities 
          WHERE industry = 'Healthcare' 
            AND project_value_max >= 500000
            AND submission_deadline > NOW()
          ORDER BY project_value_max DESC
          LIMIT 5
        `
      },
      {
        name: 'Partner matches with multi-persona scores',
        query: `
          SELECT pm.*, c1.name as seeker_name, c2.name as partner_name
          FROM partner_matches pm
          JOIN partner_profiles pp1 ON pm.seeker_id = pp1.id
          JOIN partner_profiles pp2 ON pm.partner_id = pp2.id
          JOIN companies c1 ON pp1.company_id = c1.id
          JOIN companies c2 ON pp2.company_id = c2.id
          WHERE pm.match_score >= 0.75
          ORDER BY pm.match_score DESC
          LIMIT 10
        `
      }
    ];
    
    const performanceResults = [];
    for (const test of performanceTests) {
      const startTime = Date.now();
      try {
        const result = await db.query(test.query);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        performanceResults.push({
          name: test.name,
          duration,
          rowCount: result.rows.length,
          status: 'success'
        });
        
        logger.info(`   ✅ ${test.name}: ${duration}ms (${result.rows.length} rows)`);
      } catch (error) {
        performanceResults.push({
          name: test.name,
          status: 'error',
          error: error.message
        });
        logger.warn(`   ❌ ${test.name}: Failed - ${error.message}`);
      }
    }
    
    // 6. Database health check
    logger.info('🏥 Running database health check...');
    
    const healthChecks = [
      {
        name: 'Connection pool usage',
        query: 'SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = \'active\''
      },
      {
        name: 'Database size',
        query: 'SELECT pg_size_pretty(pg_database_size(current_database())) as size'
      },
      {
        name: 'Largest tables',
        query: `
          SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
          LIMIT 5
        `
      }
    ];
    
    for (const check of healthChecks) {
      try {
        const result = await db.query(check.query);
        logger.info(`   📊 ${check.name}:`, result.rows);
      } catch (error) {
        logger.warn(`   ⚠️ ${check.name}: Failed - ${error.message}`);
      }
    }
    
    // 7. Generate optimization report
    const avgQueryTime = performanceResults
      .filter(r => r.status === 'success')
      .reduce((sum, r) => sum + r.duration, 0) / performanceResults.filter(r => r.status === 'success').length;
    
    const optimizationReport = {
      indexesAnalyzed: indexesResult.rows.length,
      indexesCreated: indexesCreated,
      avgQueryTime: Math.round(avgQueryTime),
      performanceTests: performanceResults,
      tablesOptimized: tables.length,
      status: avgQueryTime < 100 ? 'EXCELLENT' : avgQueryTime < 500 ? 'GOOD' : 'NEEDS_ATTENTION'
    };
    
    logger.info('📋 Database Optimization Summary:');
    logger.info(`   Existing indexes: ${optimizationReport.indexesAnalyzed}`);
    logger.info(`   New indexes created: ${optimizationReport.indexesCreated}`);
    logger.info(`   Average query time: ${optimizationReport.avgQueryTime}ms`);
    logger.info(`   Performance status: ${optimizationReport.status}`);
    
    return optimizationReport;
    
  } catch (error) {
    logger.error('💥 Database optimization failed:', error);
    throw error;
  } finally {
    await db.disconnect();
    logger.info('🔌 Database connection closed');
  }
}

// Run optimization
if (require.main === module) {
  optimizeDatabase()
    .then((report) => {
      logger.info('✅ Database optimization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Database optimization failed');
      process.exit(1);
    });
}

module.exports = { optimizeDatabase };