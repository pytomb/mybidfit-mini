#!/usr/bin/env node

/**
 * Database Health Monitor
 * Real-time database performance monitoring and health checking
 * Complements the existing data integrity validator with performance metrics
 */

const { Database } = require('../../src/database/connection');
const fs = require('fs');
const path = require('path');

class DatabaseHealthMonitor {
  constructor() {
    this.db = Database.getInstance();
    this.metricsFile = path.join(__dirname, '../observability/database-metrics.json');
    this.reportFile = path.join(__dirname, '../observability/database-health.md');
    this.metrics = {
      startTime: Date.now(),
      connectionTests: 0,
      queryTests: 0,
      integrityChecks: 0,
      errors: [],
      warnings: [],
      performance: []
    };
    
    // Ensure observability directory exists
    const obsDir = path.dirname(this.metricsFile);
    if (!fs.existsSync(obsDir)) {
      fs.mkdirSync(obsDir, { recursive: true });
    }
  }

  async logMetric(operation, duration, success, details = {}) {
    const metric = {
      timestamp: new Date().toISOString(),
      operation,
      duration,
      success,
      details
    };
    
    this.metrics.performance.push(metric);
    
    if (success) {
      console.log(`✅ ${operation}: ${duration}ms`, details);
    } else {
      console.error(`❌ ${operation}: ${duration}ms`, details);
      this.metrics.errors.push(metric);
    }
    
    return metric;
  }

  async testConnection() {
    const startTime = Date.now();
    this.metrics.connectionTests++;
    
    try {
      await this.db.connect();
      
      // Test basic connectivity
      const result = await this.db.query('SELECT NOW() as server_time, version() as version');
      const duration = Date.now() - startTime;
      
      // Test connection pool status
      const poolInfo = {
        total: this.db.pool?.totalCount || 0,
        idle: this.db.pool?.idleCount || 0,
        waiting: this.db.pool?.waitingCount || 0
      };
      
      await this.logMetric('Connection Test', duration, true, {
        serverTime: result.rows[0]?.server_time,
        version: result.rows[0]?.version?.split(' ')[0],
        pool: poolInfo
      });
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logMetric('Connection Test', duration, false, {
        error: error.message
      });
      return false;
    }
  }

  async measureQueryPerformance() {
    const queries = [
      { 
        name: 'Simple Select', 
        query: 'SELECT 1 as test',
        expectedMs: 10
      },
      { 
        name: 'Schema Info', 
        query: 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = $1', 
        params: ['public'],
        expectedMs: 50
      },
      { 
        name: 'Users Count', 
        query: 'SELECT COUNT(*) FROM users WHERE is_active = true',
        expectedMs: 100
      },
      { 
        name: 'Companies Count', 
        query: 'SELECT COUNT(*) FROM companies',
        expectedMs: 100
      },
      { 
        name: 'Join Query', 
        query: `SELECT COUNT(*) 
                FROM users u 
                LEFT JOIN companies c ON LOWER(TRIM(u.company_name)) = LOWER(TRIM(c.name))`,
        expectedMs: 500
      }
    ];
    
    const results = [];
    
    for (const { name, query, params = [], expectedMs } of queries) {
      const startTime = Date.now();
      this.metrics.queryTests++;
      
      try {
        const result = await this.db.query(query, params);
        const duration = Date.now() - startTime;
        
        const performanceGrade = this.getPerformanceGrade(duration, expectedMs);
        const success = duration < (expectedMs * 2); // Warn if 2x slower than expected
        
        await this.logMetric(`Query: ${name}`, duration, success, {
          rowCount: result.rowCount,
          expectedMs,
          performanceGrade,
          efficiency: Math.round((expectedMs / duration) * 100)
        });
        
        results.push({ 
          name, 
          duration, 
          success, 
          rowCount: result.rowCount, 
          expectedMs,
          performanceGrade
        });
        
      } catch (error) {
        const duration = Date.now() - startTime;
        await this.logMetric(`Query: ${name}`, duration, false, {
          error: error.message,
          expectedMs
        });
        
        results.push({ 
          name, 
          duration, 
          success: false, 
          error: error.message,
          expectedMs 
        });
      }
    }
    
    return results;
  }

  getPerformanceGrade(actual, expected) {
    const ratio = actual / expected;
    if (ratio <= 1) return 'excellent';
    if (ratio <= 1.5) return 'good';
    if (ratio <= 2) return 'fair';
    if (ratio <= 3) return 'poor';
    return 'critical';
  }

  async checkTableHealth() {
    const startTime = Date.now();
    this.metrics.integrityChecks++;
    
    const checks = [];
    
    try {
      // Check for required tables and their health
      const tablesResult = await this.db.query(`
        SELECT 
          schemaname,
          tablename,
          attname as column_name,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
      `);
      
      const tableStats = tablesResult.rows;
      const requiredTables = ['users', 'companies', 'opportunities'];
      const foundTables = [...new Set(tableStats.map(row => row.tablename))];
      
      for (const table of requiredTables) {
        if (foundTables.includes(table)) {
          const stats = tableStats.find(s => s.tablename === table);
          checks.push({ 
            table, 
            exists: true, 
            status: '✅',
            stats: stats ? {
              inserts: stats.inserts || 0,
              updates: stats.updates || 0,
              deletes: stats.deletes || 0
            } : null
          });
        } else {
          checks.push({ table, exists: false, status: '❌' });
          this.metrics.warnings.push(`Missing required table: ${table}`);
        }
      }
      
      const duration = Date.now() - startTime;
      await this.logMetric('Table Health Check', duration, true, {
        tablesFound: foundTables.length,
        requiredTables: requiredTables.length,
        totalActivity: tableStats.reduce((sum, t) => sum + (t.inserts || 0) + (t.updates || 0) + (t.deletes || 0), 0)
      });
      
      return checks;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logMetric('Table Health Check', duration, false, {
        error: error.message
      });
      return [];
    }
  }

  async checkConstraints() {
    const startTime = Date.now();
    
    try {
      // Check foreign key constraints
      const constraintsResult = await this.db.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.is_deferrable,
          tc.initially_deferred
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name
      `);
      
      // Check for constraint violations
      const violationChecks = [];
      for (const constraint of constraintsResult.rows) {
        try {
          // This query would find orphaned records
          const violationResult = await this.db.query(`
            SELECT COUNT(*) as violation_count
            FROM ${constraint.table_name} t
            LEFT JOIN ${constraint.foreign_table_name} f
              ON t.${constraint.column_name} = f.${constraint.foreign_column_name}
            WHERE t.${constraint.column_name} IS NOT NULL 
              AND f.${constraint.foreign_column_name} IS NULL
          `);
          
          const violations = violationResult.rows[0]?.violation_count || 0;
          violationChecks.push({
            constraint: constraint.constraint_name,
            table: constraint.table_name,
            violations: parseInt(violations),
            status: violations > 0 ? '❌' : '✅'
          });
          
        } catch (error) {
          violationChecks.push({
            constraint: constraint.constraint_name,
            table: constraint.table_name,
            violations: 'check_failed',
            status: '⚠️',
            error: error.message
          });
        }
      }
      
      const duration = Date.now() - startTime;
      const totalViolations = violationChecks.reduce((sum, check) => 
        sum + (typeof check.violations === 'number' ? check.violations : 0), 0
      );
      
      await this.logMetric('Constraint Check', duration, totalViolations === 0, {
        constraintsFound: constraintsResult.rows.length,
        violationChecks: violationChecks.length,
        totalViolations
      });
      
      return { constraints: constraintsResult.rows, violations: violationChecks };
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logMetric('Constraint Check', duration, false, {
        error: error.message
      });
      return { constraints: [], violations: [] };
    }
  }

  async generateHealthReport() {
    console.log('🏥 Starting comprehensive database health check...');
    
    const connectionOk = await this.testConnection();
    const queryResults = await this.measureQueryPerformance();
    const tableChecks = await this.checkTableHealth();
    const constraintInfo = await this.checkConstraints();
    
    const totalTime = Date.now() - this.metrics.startTime;
    const healthScore = this.calculateHealthScore(connectionOk, queryResults, tableChecks, constraintInfo);
    
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: totalTime,
      healthScore,
      summary: {
        connectionTests: this.metrics.connectionTests,
        queryTests: this.metrics.queryTests,
        integrityChecks: this.metrics.integrityChecks,
        errorCount: this.metrics.errors.length,
        warningCount: this.metrics.warnings.length,
        overallHealth: healthScore >= 90 ? 'excellent' : 
                      healthScore >= 75 ? 'good' : 
                      healthScore >= 60 ? 'fair' : 'poor'
      },
      connection: { success: connectionOk },
      queries: queryResults,
      tables: tableChecks,
      constraints: constraintInfo,
      errors: this.metrics.errors,
      warnings: this.metrics.warnings
    };
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    
    // Save metrics
    try {
      fs.writeFileSync(this.metricsFile, JSON.stringify(report, null, 2));
      fs.writeFileSync(this.reportFile, markdownReport);
      console.log(`📊 Database health report saved: ${this.reportFile}`);
    } catch (error) {
      console.error('❌ Failed to save health report:', error.message);
    }
    
    return { json: report, markdown: markdownReport };
  }

  calculateHealthScore(connectionOk, queryResults, tableChecks, constraintInfo) {
    let score = 100;
    
    // Connection health (20 points)
    if (!connectionOk) score -= 20;
    
    // Query performance (40 points)
    const slowQueries = queryResults.filter(q => !q.success).length;
    const queryPenalty = Math.min(40, slowQueries * 10);
    score -= queryPenalty;
    
    // Table health (20 points)
    const missingTables = tableChecks.filter(t => !t.exists).length;
    const tablePenalty = Math.min(20, missingTables * 10);
    score -= tablePenalty;
    
    // Constraint violations (20 points)
    const violations = constraintInfo.violations?.filter(v => v.violations > 0).length || 0;
    const constraintPenalty = Math.min(20, violations * 5);
    score -= constraintPenalty;
    
    return Math.max(0, Math.round(score));
  }

  generateMarkdownReport(report) {
    return `# Database Health Report

**Generated**: ${report.timestamp}
**Duration**: ${report.totalDuration}ms
**Health Score**: ${this.getHealthIcon(report.healthScore)} ${report.healthScore}/100 (${report.summary.overallHealth})

## 📊 Summary
- Connection Tests: ${report.summary.connectionTests}
- Query Performance Tests: ${report.summary.queryTests}  
- Table Health Checks: ${report.summary.integrityChecks}
- Errors: ${report.summary.errorCount}
- Warnings: ${report.summary.warningCount}

## 🔌 Connection Health
${report.connection.success ? '✅ Database connection is healthy' : '❌ Database connection issues detected'}

## ⚡ Query Performance
${report.queries.map(q => `
### ${q.name}
- Duration: ${q.duration}ms (expected: ≤${q.expectedMs}ms)
- Performance: ${q.performanceGrade}
- Status: ${q.success ? '✅' : '❌'}
${q.rowCount !== undefined ? `- Rows: ${q.rowCount}` : ''}
${q.error ? `- Error: ${q.error}` : ''}
`).join('')}

## 📋 Table Health
${report.tables.map(t => `
- ${t.status} **${t.table}**: ${t.exists ? 'Available' : 'Missing'}
${t.stats ? `  - Activity: ${t.stats.inserts} inserts, ${t.stats.updates} updates, ${t.stats.deletes} deletes` : ''}
`).join('')}

## 🔗 Constraint Health
${report.constraints.constraints.length > 0 ? `
Found ${report.constraints.constraints.length} foreign key constraints:
${report.constraints.violations.map(v => `
- ${v.status} **${v.constraint}** (${v.table}): ${typeof v.violations === 'number' ? v.violations + ' violations' : v.violations}
${v.error ? `  - Error: ${v.error}` : ''}
`).join('')}
` : 'No foreign key constraints found'}

${report.errors.length > 0 ? `
## ❌ Errors
${report.errors.map(err => `- **${err.operation}**: ${err.details.error} (${err.duration}ms)`).join('\n')}
` : ''}

${report.warnings.length > 0 ? `
## ⚠️ Warnings
${report.warnings.map(warn => `- ${warn}`).join('\n')}
` : ''}

## 🎯 Recommendations
${this.generateRecommendations(report)}

---
*Database health monitoring provides real-time visibility into database performance and integrity.*
`;
  }

  generateRecommendations(report) {
    const recommendations = [];
    
    if (!report.connection.success) {
      recommendations.push('🔴 **Critical**: Fix database connection issues immediately');
    }
    
    const slowQueries = report.queries.filter(q => q.performanceGrade === 'poor' || q.performanceGrade === 'critical');
    if (slowQueries.length > 0) {
      recommendations.push(`🟡 **Performance**: Optimize ${slowQueries.length} slow queries`);
    }
    
    const missingTables = report.tables.filter(t => !t.exists);
    if (missingTables.length > 0) {
      recommendations.push(`🔴 **Schema**: Create missing tables: ${missingTables.map(t => t.table).join(', ')}`);
    }
    
    const violations = report.constraints.violations?.filter(v => v.violations > 0) || [];
    if (violations.length > 0) {
      recommendations.push(`🔴 **Integrity**: Fix ${violations.length} foreign key constraint violations`);
    }
    
    if (report.healthScore >= 95) {
      recommendations.push('✅ **Excellent**: Database is performing optimally');
    } else if (report.healthScore >= 85) {
      recommendations.push('🟢 **Good**: Database is healthy with minor optimization opportunities');
    } else if (report.healthScore < 70) {
      recommendations.push('🔴 **Action Required**: Database needs immediate attention');
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : '✅ No specific recommendations - database is healthy!';
  }

  getHealthIcon(score) {
    if (score >= 95) return '🟢';
    if (score >= 85) return '🟡';
    if (score >= 70) return '🟠';
    return '🔴';
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'check') {
    // Full health check
    const monitor = new DatabaseHealthMonitor();
    monitor.generateHealthReport()
      .then(({ json, markdown }) => {
        console.log('\n' + markdown);
        process.exit(json.summary.errorCount > 0 ? 1 : 0);
      })
      .catch(error => {
        console.error('❌ Health check failed:', error.message);
        process.exit(1);
      });
  } else if (args[0] === 'connection') {
    // Quick connection test
    const monitor = new DatabaseHealthMonitor();
    monitor.testConnection()
      .then(success => {
        console.log(success ? '✅ Database connection healthy' : '❌ Database connection failed');
        process.exit(success ? 0 : 1);
      });
  } else if (args[0] === 'performance') {
    // Query performance test
    const monitor = new DatabaseHealthMonitor();
    monitor.measureQueryPerformance()
      .then(results => {
        const slowQueries = results.filter(r => !r.success);
        console.log(`Query Performance: ${results.length - slowQueries.length}/${results.length} passed`);
        process.exit(slowQueries.length > 0 ? 1 : 0);
      });
  } else {
    console.log(`
Database Health Monitor

Usage:
  node database-health-monitor.js [command]

Commands:
  check       Full database health check (default)
  connection  Quick connection test
  performance Query performance test only

Examples:
  # Full health report
  node .claude/scripts/database-health-monitor.js
  
  # Quick connection test
  node .claude/scripts/database-health-monitor.js connection
  
  # Performance test only
  node .claude/scripts/database-health-monitor.js performance
`);
  }
}

module.exports = DatabaseHealthMonitor;