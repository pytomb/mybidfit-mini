/**
 * Performance Monitoring and Comparison System
 * 
 * Monitors performance metrics for SQL vs graph-enhanced queries and provides
 * comprehensive analytics and recommendations for optimization.
 */

const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

class PerformanceMonitor {
  constructor() {
    this.db = Database.getInstance();
    
    // Performance thresholds
    this.thresholds = {
      // Response time thresholds (milliseconds)
      response_time: {
        excellent: 500,
        good: 1000,
        acceptable: 2000,
        poor: 5000
      },
      
      // Score improvement thresholds (percentage)
      score_improvement: {
        significant: 15,
        moderate: 8,
        minimal: 3
      },
      
      // Memory usage thresholds (MB)
      memory_usage: {
        low: 50,
        medium: 100,
        high: 200,
        critical: 500
      },

      // Query complexity scores
      query_complexity: {
        simple: 1,
        moderate: 3,
        complex: 6,
        very_complex: 10
      }
    };

    // Initialize performance tracking
    this.initializePerformanceTracking();
  }

  /**
   * Initialize performance tracking tables
   * @private
   */
  async initializePerformanceTracking() {
    try {
      // Performance metrics table
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS performance_metrics (
          id SERIAL PRIMARY KEY,
          service_type VARCHAR(50) NOT NULL,
          variant VARCHAR(20) NOT NULL,
          company_id INTEGER,
          opportunity_id INTEGER,
          execution_time INTEGER NOT NULL,
          memory_usage FLOAT,
          cpu_usage FLOAT,
          query_count INTEGER,
          result_quality_score FLOAT,
          user_satisfaction_score FLOAT,
          business_value_score FLOAT,
          timestamp TIMESTAMP DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'
        )
      `);

      // Performance baselines table
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS performance_baselines (
          id SERIAL PRIMARY KEY,
          service_type VARCHAR(50) NOT NULL,
          variant VARCHAR(20) NOT NULL,
          metric_name VARCHAR(50) NOT NULL,
          baseline_value FLOAT NOT NULL,
          confidence_interval_lower FLOAT,
          confidence_interval_upper FLOAT,
          sample_size INTEGER,
          last_updated TIMESTAMP DEFAULT NOW(),
          UNIQUE(service_type, variant, metric_name)
        )
      `);

      // Performance alerts table
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS performance_alerts (
          id SERIAL PRIMARY KEY,
          alert_type VARCHAR(50) NOT NULL,
          service_type VARCHAR(50) NOT NULL,
          variant VARCHAR(20),
          severity VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          metric_value FLOAT,
          threshold_value FLOAT,
          resolved BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          resolved_at TIMESTAMP
        )
      `);

      logger.info('Performance monitoring tables initialized');
    } catch (error) {
      logger.error('Failed to initialize performance tracking:', error);
    }
  }

  /**
   * Record performance metrics for a service execution
   * @param {Object} metrics - Performance metrics
   * @returns {Promise<number>} Recorded metric ID
   */
  async recordMetrics(metrics) {
    try {
      const result = await this.db.query(`
        INSERT INTO performance_metrics 
        (service_type, variant, company_id, opportunity_id, execution_time,
         memory_usage, cpu_usage, query_count, result_quality_score,
         user_satisfaction_score, business_value_score, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        metrics.serviceType,
        metrics.variant,
        metrics.companyId || null,
        metrics.opportunityId || null,
        metrics.executionTime,
        metrics.memoryUsage || null,
        metrics.cpuUsage || null,
        metrics.queryCount || null,
        metrics.resultQualityScore || null,
        metrics.userSatisfactionScore || null,
        metrics.businessValueScore || null,
        JSON.stringify(metrics.metadata || {})
      ]);

      const metricId = result.rows[0].id;

      // Check for performance alerts
      await this.checkPerformanceAlerts(metrics);

      return metricId;
    } catch (error) {
      logger.error('Failed to record performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive performance comparison report
   * @param {string} serviceType - Service type ('opportunity_scoring', 'partnership_matching')
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Performance comparison report
   */
  async getPerformanceComparison(serviceType, options = {}) {
    try {
      const timeRange = options.timeRange || '7 days';
      const minSampleSize = options.minSampleSize || 10;

      // Get performance data for both variants
      const performanceData = await this.db.query(`
        SELECT 
          variant,
          COUNT(*) as sample_size,
          AVG(execution_time) as avg_execution_time,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY execution_time) as median_execution_time,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time) as p95_execution_time,
          STDDEV(execution_time) as execution_time_stddev,
          AVG(memory_usage) as avg_memory_usage,
          AVG(cpu_usage) as avg_cpu_usage,
          AVG(result_quality_score) as avg_quality_score,
          AVG(user_satisfaction_score) as avg_satisfaction_score,
          AVG(business_value_score) as avg_business_value,
          AVG(query_count) as avg_query_count
        FROM performance_metrics 
        WHERE service_type = $1 
          AND timestamp >= NOW() - INTERVAL '${timeRange}'
        GROUP BY variant
        HAVING COUNT(*) >= $2
      `, [serviceType, minSampleSize]);

      if (performanceData.rows.length < 2) {
        return {
          status: 'insufficient_data',
          message: `Need at least ${minSampleSize} samples for each variant`,
          available_data: performanceData.rows
        };
      }

      // Calculate comparison metrics
      const comparison = this.calculateComparisonMetrics(performanceData.rows);

      // Get performance trends
      const trends = await this.getPerformanceTrends(serviceType, timeRange);

      // Generate recommendations
      const recommendations = this.generatePerformanceRecommendations(comparison, trends);

      // Get current alerts
      const alerts = await this.getCurrentAlerts(serviceType);

      return {
        status: 'success',
        service_type: serviceType,
        time_range: timeRange,
        comparison,
        trends,
        recommendations,
        alerts,
        generated_at: new Date()
      };

    } catch (error) {
      logger.error('Failed to generate performance comparison:', error);
      throw error;
    }
  }

  /**
   * Calculate comparison metrics between variants
   * @private
   */
  calculateComparisonMetrics(performanceData) {
    const basic = performanceData.find(p => p.variant === 'basic');
    const enhanced = performanceData.find(p => p.variant === 'enhanced');

    if (!basic || !enhanced) {
      return { status: 'missing_variant_data' };
    }

    const comparison = {
      execution_time: {
        basic: {
          avg: parseFloat(basic.avg_execution_time).toFixed(2),
          median: parseFloat(basic.median_execution_time).toFixed(2),
          p95: parseFloat(basic.p95_execution_time).toFixed(2),
          stddev: parseFloat(basic.execution_time_stddev).toFixed(2)
        },
        enhanced: {
          avg: parseFloat(enhanced.avg_execution_time).toFixed(2),
          median: parseFloat(enhanced.median_execution_time).toFixed(2),
          p95: parseFloat(enhanced.p95_execution_time).toFixed(2),
          stddev: parseFloat(enhanced.execution_time_stddev).toFixed(2)
        },
        difference: {
          avg_ms: parseFloat(enhanced.avg_execution_time - basic.avg_execution_time).toFixed(2),
          avg_percentage: (((enhanced.avg_execution_time - basic.avg_execution_time) / basic.avg_execution_time) * 100).toFixed(1),
          median_ms: parseFloat(enhanced.median_execution_time - basic.median_execution_time).toFixed(2),
          p95_ms: parseFloat(enhanced.p95_execution_time - basic.p95_execution_time).toFixed(2)
        }
      },

      quality_metrics: {
        result_quality: {
          basic: parseFloat(basic.avg_quality_score || 0).toFixed(2),
          enhanced: parseFloat(enhanced.avg_quality_score || 0).toFixed(2),
          improvement: parseFloat((enhanced.avg_quality_score || 0) - (basic.avg_quality_score || 0)).toFixed(2)
        },
        user_satisfaction: {
          basic: parseFloat(basic.avg_satisfaction_score || 0).toFixed(2),
          enhanced: parseFloat(enhanced.avg_satisfaction_score || 0).toFixed(2),
          improvement: parseFloat((enhanced.avg_satisfaction_score || 0) - (basic.avg_satisfaction_score || 0)).toFixed(2)
        },
        business_value: {
          basic: parseFloat(basic.avg_business_value || 0).toFixed(2),
          enhanced: parseFloat(enhanced.avg_business_value || 0).toFixed(2),
          improvement: parseFloat((enhanced.avg_business_value || 0) - (basic.avg_business_value || 0)).toFixed(2)
        }
      },

      resource_usage: {
        memory: {
          basic: parseFloat(basic.avg_memory_usage || 0).toFixed(2),
          enhanced: parseFloat(enhanced.avg_memory_usage || 0).toFixed(2),
          difference_mb: parseFloat((enhanced.avg_memory_usage || 0) - (basic.avg_memory_usage || 0)).toFixed(2)
        },
        cpu: {
          basic: parseFloat(basic.avg_cpu_usage || 0).toFixed(2),
          enhanced: parseFloat(enhanced.avg_cpu_usage || 0).toFixed(2),
          difference_percentage: parseFloat((enhanced.avg_cpu_usage || 0) - (basic.avg_cpu_usage || 0)).toFixed(2)
        },
        queries: {
          basic: parseFloat(basic.avg_query_count || 0).toFixed(1),
          enhanced: parseFloat(enhanced.avg_query_count || 0).toFixed(1),
          difference: parseFloat((enhanced.avg_query_count || 0) - (basic.avg_query_count || 0)).toFixed(1)
        }
      },

      sample_sizes: {
        basic: parseInt(basic.sample_size),
        enhanced: parseInt(enhanced.sample_size)
      },

      overall_assessment: this.assessOverallPerformance(basic, enhanced)
    };

    return comparison;
  }

  /**
   * Assess overall performance between variants
   * @private
   */
  assessOverallPerformance(basic, enhanced) {
    let score = 0;
    const factors = [];

    // Performance penalty/bonus
    const timeDiff = enhanced.avg_execution_time - basic.avg_execution_time;
    const timePercentage = (timeDiff / basic.avg_execution_time) * 100;
    
    if (timePercentage <= 20) { // Within 20% is acceptable
      score += 2;
      factors.push('Acceptable performance overhead');
    } else if (timePercentage <= 50) {
      score += 1;
      factors.push('Moderate performance overhead');
    } else {
      score -= 1;
      factors.push('High performance overhead');
    }

    // Quality improvements
    const qualityImprovment = (enhanced.avg_quality_score || 0) - (basic.avg_quality_score || 0);
    if (qualityImprovment > 0.1) {
      score += 2;
      factors.push('Significant quality improvement');
    } else if (qualityImprovment > 0.05) {
      score += 1;
      factors.push('Moderate quality improvement');
    }

    // Business value
    const businessValueImprovement = (enhanced.avg_business_value || 0) - (basic.avg_business_value || 0);
    if (businessValueImprovement > 0.1) {
      score += 2;
      factors.push('Strong business value increase');
    } else if (businessValueImprovement > 0.05) {
      score += 1;
      factors.push('Moderate business value increase');
    }

    // Resource usage
    const memoryIncrease = (enhanced.avg_memory_usage || 0) - (basic.avg_memory_usage || 0);
    if (memoryIncrease > 100) { // >100MB increase
      score -= 1;
      factors.push('High memory usage increase');
    } else if (memoryIncrease > 50) {
      factors.push('Moderate memory usage increase');
    }

    let assessment;
    if (score >= 4) assessment = 'Excellent - Enhanced version strongly recommended';
    else if (score >= 2) assessment = 'Good - Enhanced version recommended with minor tradeoffs';
    else if (score >= 0) assessment = 'Acceptable - Enhanced version viable but consider optimization';
    else assessment = 'Poor - Enhanced version needs significant optimization';

    return {
      score,
      assessment,
      factors,
      recommendation: score >= 1 ? 'enhanced' : 'basic'
    };
  }

  /**
   * Get performance trends over time
   * @private
   */
  async getPerformanceTrends(serviceType, timeRange) {
    const trendsQuery = await this.db.query(`
      SELECT 
        DATE_TRUNC('day', timestamp) as date,
        variant,
        AVG(execution_time) as avg_execution_time,
        AVG(result_quality_score) as avg_quality_score,
        COUNT(*) as sample_count
      FROM performance_metrics 
      WHERE service_type = $1 
        AND timestamp >= NOW() - INTERVAL '${timeRange}'
      GROUP BY DATE_TRUNC('day', timestamp), variant
      ORDER BY date, variant
    `, [serviceType]);

    const trends = {
      dates: [],
      basic: { execution_time: [], quality_score: [], sample_count: [] },
      enhanced: { execution_time: [], quality_score: [], sample_count: [] }
    };

    // Process trends data
    const dateMap = new Map();
    
    for (const row of trendsQuery.rows) {
      const date = row.date.toISOString().split('T')[0];
      
      if (!dateMap.has(date)) {
        dateMap.set(date, {});
        trends.dates.push(date);
      }
      
      dateMap.get(date)[row.variant] = {
        execution_time: parseFloat(row.avg_execution_time),
        quality_score: parseFloat(row.avg_quality_score || 0),
        sample_count: parseInt(row.sample_count)
      };
    }

    // Fill trends arrays
    for (const date of trends.dates) {
      const dayData = dateMap.get(date);
      
      trends.basic.execution_time.push(dayData.basic?.execution_time || null);
      trends.basic.quality_score.push(dayData.basic?.quality_score || null);
      trends.basic.sample_count.push(dayData.basic?.sample_count || 0);
      
      trends.enhanced.execution_time.push(dayData.enhanced?.execution_time || null);
      trends.enhanced.quality_score.push(dayData.enhanced?.quality_score || null);
      trends.enhanced.sample_count.push(dayData.enhanced?.sample_count || 0);
    }

    return trends;
  }

  /**
   * Generate performance recommendations
   * @private
   */
  generatePerformanceRecommendations(comparison, trends) {
    const recommendations = [];

    if (comparison.overall_assessment) {
      const assessment = comparison.overall_assessment;
      
      if (assessment.score >= 2) {
        recommendations.push({
          type: 'implementation',
          priority: 'high',
          title: 'Deploy Enhanced Version',
          description: assessment.assessment,
          factors: assessment.factors,
          action: 'Proceed with enhanced graph-based implementation'
        });
      } else if (assessment.score >= 0) {
        recommendations.push({
          type: 'optimization',
          priority: 'medium',
          title: 'Optimize Enhanced Version',
          description: 'Enhanced version shows promise but needs optimization',
          action: 'Focus on performance optimization before full deployment'
        });
      } else {
        recommendations.push({
          type: 'reconsider',
          priority: 'high',
          title: 'Significant Optimization Required',
          description: 'Enhanced version currently underperforms',
          action: 'Major optimization required or consider alternative approaches'
        });
      }
    }

    // Performance-specific recommendations
    const timeDiffPercentage = parseFloat(comparison.execution_time.difference.avg_percentage);
    if (timeDiffPercentage > 100) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Address Execution Time',
        description: `Enhanced version is ${timeDiffPercentage.toFixed(1)}% slower than basic version`,
        action: 'Optimize graph queries, consider caching, or implement connection pooling'
      });
    } else if (timeDiffPercentage > 50) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Monitor Performance Impact',
        description: `Enhanced version shows ${timeDiffPercentage.toFixed(1)}% performance overhead`,
        action: 'Monitor user experience and consider optimization if needed'
      });
    }

    // Quality improvements
    const qualityImprovement = parseFloat(comparison.quality_metrics.result_quality.improvement);
    if (qualityImprovement > 0.15) {
      recommendations.push({
        type: 'value',
        priority: 'high',
        title: 'Significant Quality Improvement',
        description: `Enhanced version provides ${qualityImprovement.toFixed(2)} quality improvement`,
        action: 'Highlight quality improvements in user communications'
      });
    }

    // Resource usage warnings
    const memoryDiff = parseFloat(comparison.resource_usage.memory.difference_mb);
    if (memoryDiff > 200) {
      recommendations.push({
        type: 'resource',
        priority: 'high',
        title: 'High Memory Usage',
        description: `Enhanced version uses ${memoryDiff.toFixed(1)}MB more memory`,
        action: 'Optimize memory usage or ensure adequate server resources'
      });
    }

    return recommendations;
  }

  /**
   * Check for performance alerts
   * @private
   */
  async checkPerformanceAlerts(metrics) {
    const alerts = [];

    // Check execution time thresholds
    if (metrics.executionTime > this.thresholds.response_time.poor) {
      alerts.push({
        type: 'slow_response',
        severity: 'critical',
        message: `Execution time ${metrics.executionTime}ms exceeds poor threshold`,
        metricValue: metrics.executionTime,
        thresholdValue: this.thresholds.response_time.poor
      });
    } else if (metrics.executionTime > this.thresholds.response_time.acceptable) {
      alerts.push({
        type: 'slow_response',
        severity: 'warning',
        message: `Execution time ${metrics.executionTime}ms exceeds acceptable threshold`,
        metricValue: metrics.executionTime,
        thresholdValue: this.thresholds.response_time.acceptable
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > this.thresholds.memory_usage.critical) {
      alerts.push({
        type: 'high_memory',
        severity: 'critical',
        message: `Memory usage ${metrics.memoryUsage}MB is critical`,
        metricValue: metrics.memoryUsage,
        thresholdValue: this.thresholds.memory_usage.critical
      });
    }

    // Store alerts
    for (const alert of alerts) {
      await this.db.query(`
        INSERT INTO performance_alerts 
        (alert_type, service_type, variant, severity, message, metric_value, threshold_value)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        alert.type, metrics.serviceType, metrics.variant,
        alert.severity, alert.message, alert.metricValue, alert.thresholdValue
      ]);
    }
  }

  /**
   * Get current unresolved alerts
   * @private
   */
  async getCurrentAlerts(serviceType) {
    const result = await this.db.query(`
      SELECT alert_type, variant, severity, message, metric_value, threshold_value, created_at
      FROM performance_alerts 
      WHERE service_type = $1 AND resolved = FALSE
      ORDER BY created_at DESC
      LIMIT 20
    `, [serviceType]);

    return result.rows;
  }

  /**
   * Create performance dashboard data
   * @param {Object} options - Dashboard options
   * @returns {Promise<Object>} Dashboard data
   */
  async createDashboard(options = {}) {
    try {
      const timeRange = options.timeRange || '24 hours';
      
      // Get overview metrics
      const overview = await this.db.query(`
        SELECT 
          service_type,
          variant,
          COUNT(*) as total_requests,
          AVG(execution_time) as avg_response_time,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time) as p95_response_time,
          COUNT(CASE WHEN execution_time > $1 THEN 1 END) as slow_requests
        FROM performance_metrics 
        WHERE timestamp >= NOW() - INTERVAL '${timeRange}'
        GROUP BY service_type, variant
      `, [this.thresholds.response_time.acceptable]);

      // Get recent alerts
      const recentAlerts = await this.db.query(`
        SELECT * FROM performance_alerts 
        WHERE created_at >= NOW() - INTERVAL '${timeRange}'
        ORDER BY created_at DESC
        LIMIT 10
      `);

      // Get service comparisons
      const comparisons = {};
      const services = ['opportunity_scoring', 'partnership_matching'];
      
      for (const service of services) {
        try {
          comparisons[service] = await this.getPerformanceComparison(service, { 
            timeRange,
            minSampleSize: 5 
          });
        } catch (error) {
          comparisons[service] = { status: 'error', message: error.message };
        }
      }

      return {
        timeRange,
        overview: overview.rows,
        recentAlerts: recentAlerts.rows,
        comparisons,
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Failed to create performance dashboard:', error);
      throw error;
    }
  }
}

module.exports = { PerformanceMonitor };