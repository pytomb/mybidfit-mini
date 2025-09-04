/**
 * A/B Testing Framework for SQL vs Graph-Enhanced Query Performance
 * 
 * This framework enables systematic comparison of traditional PostgreSQL queries
 * versus graph-enhanced queries using the entity_relationships table.
 */

const { Database } = require('../database/connection');
const { OpportunityScoringService } = require('./opportunityScoring');
const { EnhancedOpportunityScoringService } = require('./enhancedOpportunityScoring');
const { PartnershipMatchingService } = require('./partnershipMatching');
const { EnhancedPartnershipMatchingService } = require('./enhancedPartnershipMatching');
const { logger } = require('../utils/logger');

class ABTestingFramework {
  constructor() {
    this.db = Database.getInstance();
    
    // Service instances for A/B testing
    this.services = {
      basic: {
        opportunity: new OpportunityScoringService(),
        partnership: new PartnershipMatchingService()
      },
      enhanced: {
        opportunity: new EnhancedOpportunityScoringService(),
        partnership: new EnhancedPartnershipMatchingService()
      }
    };

    // Test configuration
    this.config = {
      sampleSize: process.env.AB_TEST_SAMPLE_SIZE || 100,
      confidenceLevel: 0.95,
      significanceThreshold: 0.05,
      maxTestDuration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      metrics: [
        'response_time',
        'accuracy_score', 
        'user_satisfaction',
        'business_value',
        'recommendation_quality'
      ]
    };
  }

  /**
   * Initialize A/B test for a specific algorithm
   * @param {string} algorithm - 'opportunity_scoring' or 'partnership_matching'
   * @param {string} testName - Unique test identifier
   * @param {Object} options - Test configuration options
   * @returns {Promise<Object>} Test configuration
   */
  async initializeTest(algorithm, testName, options = {}) {
    try {
      logger.info(`Initializing A/B test: ${testName} for ${algorithm}`);

      const testConfig = {
        test_id: this.generateTestId(testName),
        algorithm,
        test_name: testName,
        start_date: new Date(),
        end_date: new Date(Date.now() + this.config.maxTestDuration),
        sample_size: options.sampleSize || this.config.sampleSize,
        traffic_split: options.trafficSplit || { basic: 50, enhanced: 50 },
        success_metrics: options.metrics || this.config.metrics,
        hypothesis: options.hypothesis || `Graph-enhanced ${algorithm} will show significant improvement over basic SQL queries`,
        status: 'active'
      };

      // Store test configuration
      await this.storeTestConfiguration(testConfig);

      // Initialize test metrics table
      await this.initializeTestMetrics(testConfig.test_id);

      logger.info(`A/B test initialized: ${testConfig.test_id}`);
      return testConfig;

    } catch (error) {
      logger.error('A/B test initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute A/B test comparison for opportunity scoring
   * @param {number} companyId - Company ID to test
   * @param {number} opportunityId - Opportunity ID to test
   * @param {string} testId - Test identifier
   * @returns {Promise<Object>} A/B test results
   */
  async runOpportunityScoringTest(companyId, opportunityId, testId) {
    const testStart = Date.now();
    
    try {
      logger.info(`Running opportunity scoring A/B test: ${testId}`);

      // Determine variant assignment (50/50 split for comparison)
      const variants = ['basic', 'enhanced'];
      const results = {};

      for (const variant of variants) {
        const variantStart = Date.now();
        
        try {
          if (variant === 'basic') {
            results[variant] = await this.services.basic.opportunity.scoreOpportunityFit(
              companyId, opportunityId
            );
          } else {
            results[variant] = await this.services.enhanced.opportunity.scoreOpportunityFitEnhanced(
              companyId, opportunityId
            );
          }
          
          results[variant].executionTime = Date.now() - variantStart;
          results[variant].variant = variant;
          
        } catch (error) {
          logger.error(`Variant ${variant} failed:`, error);
          results[variant] = {
            error: error.message,
            executionTime: Date.now() - variantStart,
            variant
          };
        }
      }

      // Calculate comparison metrics
      const comparison = this.compareOpportunityScoringResults(results.basic, results.enhanced);

      // Store test results
      await this.storeTestResults(testId, 'opportunity_scoring', companyId, opportunityId, results, comparison);

      // Calculate statistical significance if enough data
      const significance = await this.calculateStatisticalSignificance(testId, 'opportunity_scoring');

      const totalTime = Date.now() - testStart;
      logger.info(`Opportunity scoring A/B test complete: ${totalTime}ms`);

      return {
        testId,
        algorithm: 'opportunity_scoring',
        results,
        comparison,
        significance,
        metadata: {
          companyId,
          opportunityId,
          totalExecutionTime: totalTime,
          timestamp: new Date()
        }
      };

    } catch (error) {
      logger.error('Opportunity scoring A/B test failed:', error);
      throw error;
    }
  }

  /**
   * Execute A/B test comparison for partnership matching
   * @param {number} companyId - Company ID to test
   * @param {string} testId - Test identifier
   * @returns {Promise<Object>} A/B test results
   */
  async runPartnershipMatchingTest(companyId, testId) {
    const testStart = Date.now();
    
    try {
      logger.info(`Running partnership matching A/B test: ${testId}`);

      const variants = ['basic', 'enhanced'];
      const results = {};

      for (const variant of variants) {
        const variantStart = Date.now();
        
        try {
          if (variant === 'basic') {
            results[variant] = await this.services.basic.partnership.findPartnershipMatches(companyId);
          } else {
            results[variant] = await this.services.enhanced.partnership.findEnhancedPartnershipMatches(companyId);
          }
          
          results[variant].executionTime = Date.now() - variantStart;
          results[variant].variant = variant;
          
        } catch (error) {
          logger.error(`Variant ${variant} failed:`, error);
          results[variant] = {
            error: error.message,
            executionTime: Date.now() - variantStart,
            variant
          };
        }
      }

      // Calculate comparison metrics
      const comparison = this.comparePartnershipMatchingResults(results.basic, results.enhanced);

      // Store test results
      await this.storeTestResults(testId, 'partnership_matching', companyId, null, results, comparison);

      // Calculate statistical significance
      const significance = await this.calculateStatisticalSignificance(testId, 'partnership_matching');

      const totalTime = Date.now() - testStart;
      logger.info(`Partnership matching A/B test complete: ${totalTime}ms`);

      return {
        testId,
        algorithm: 'partnership_matching',
        results,
        comparison,
        significance,
        metadata: {
          companyId,
          totalExecutionTime: totalTime,
          timestamp: new Date()
        }
      };

    } catch (error) {
      logger.error('Partnership matching A/B test failed:', error);
      throw error;
    }
  }

  /**
   * Compare opportunity scoring results between variants
   * @private
   */
  compareOpportunityScoringResults(basicResult, enhancedResult) {
    if (basicResult.error || enhancedResult.error) {
      return {
        comparison: 'error',
        errorAnalysis: {
          basicError: basicResult.error || null,
          enhancedError: enhancedResult.error || null
        }
      };
    }

    const comparison = {
      scoreImprovement: enhancedResult.overallScore - basicResult.overallScore,
      scoreImprovementPercentage: ((enhancedResult.overallScore - basicResult.overallScore) / basicResult.overallScore) * 100,
      performanceImpact: enhancedResult.executionTime - basicResult.executionTime,
      performanceImpactPercentage: ((enhancedResult.executionTime - basicResult.executionTime) / basicResult.executionTime) * 100,
      
      // Quality metrics
      recommendationCount: {
        basic: basicResult.recommendations?.length || 0,
        enhanced: enhancedResult.enhancedRecommendations?.length || 0,
        improvement: (enhancedResult.enhancedRecommendations?.length || 0) - (basicResult.recommendations?.length || 0)
      },
      
      // Additional insights provided by enhanced version
      additionalInsights: {
        relationshipContext: enhancedResult.relationshipContext?.length || 0,
        partnershipOpportunities: enhancedResult.partnershipOpportunities?.length || 0,
        networkMetrics: enhancedResult.graphMetrics ? Object.keys(enhancedResult.graphMetrics).length : 0
      },

      // Overall assessment
      winner: this.determineWinner('opportunity_scoring', basicResult, enhancedResult),
      confidence: this.calculateConfidence('opportunity_scoring', basicResult, enhancedResult)
    };

    return comparison;
  }

  /**
   * Compare partnership matching results between variants
   * @private
   */
  comparePartnershipMatchingResults(basicResult, enhancedResult) {
    if (basicResult.error || enhancedResult.error) {
      return {
        comparison: 'error',
        errorAnalysis: {
          basicError: basicResult.error || null,
          enhancedError: enhancedResult.error || null
        }
      };
    }

    const comparison = {
      matchQuality: {
        basic: basicResult.topMatches?.length || 0,
        enhanced: enhancedResult.enhancedMatches?.length || 0,
        improvement: (enhancedResult.enhancedMatches?.length || 0) - (basicResult.topMatches?.length || 0)
      },
      
      performanceImpact: enhancedResult.executionTime - basicResult.executionTime,
      performanceImpactPercentage: ((enhancedResult.executionTime - basicResult.executionTime) / basicResult.executionTime) * 100,
      
      // Enhanced features
      additionalFeatures: {
        indirectOpportunities: enhancedResult.indirectOpportunities?.length || 0,
        networkStrategies: enhancedResult.networkStrategies?.length || 0,
        trustScoring: enhancedResult.enhancedMatches ? 
          enhancedResult.enhancedMatches.filter(m => m.trustScore > 75).length : 0
      },

      // Network analysis value
      networkValue: {
        centralityScore: enhancedResult.networkAnalysis?.centrality?.centrality_score || 0,
        networkReach: enhancedResult.networkAnalysis?.networkReach || 0,
        partnershipPotential: enhancedResult.networkAnalysis?.partnershipPotential || 0
      },

      winner: this.determineWinner('partnership_matching', basicResult, enhancedResult),
      confidence: this.calculateConfidence('partnership_matching', basicResult, enhancedResult)
    };

    return comparison;
  }

  /**
   * Determine winner between variants based on multiple criteria
   * @private
   */
  determineWinner(algorithm, basicResult, enhancedResult) {
    if (basicResult.error && !enhancedResult.error) return 'enhanced';
    if (!basicResult.error && enhancedResult.error) return 'basic';
    if (basicResult.error && enhancedResult.error) return 'tie';

    let basicScore = 0;
    let enhancedScore = 0;

    if (algorithm === 'opportunity_scoring') {
      // Score improvement (weighted 40%)
      if (enhancedResult.overallScore > basicResult.overallScore) enhancedScore += 40;
      else if (enhancedResult.overallScore < basicResult.overallScore) basicScore += 40;
      else { enhancedScore += 20; basicScore += 20; }

      // Additional insights (weighted 30%)
      if ((enhancedResult.relationshipContext?.length || 0) > 0) enhancedScore += 30;

      // Recommendation quality (weighted 20%)
      const enhancedRecCount = enhancedResult.enhancedRecommendations?.length || 0;
      const basicRecCount = basicResult.recommendations?.length || 0;
      if (enhancedRecCount > basicRecCount) enhancedScore += 20;
      else if (enhancedRecCount < basicRecCount) basicScore += 20;
      else { enhancedScore += 10; basicScore += 10; }

      // Performance penalty (weighted 10%)
      if (enhancedResult.executionTime <= basicResult.executionTime * 1.5) enhancedScore += 10;
      else basicScore += 10;

    } else if (algorithm === 'partnership_matching') {
      // Match quality (weighted 40%)
      const enhancedMatches = enhancedResult.enhancedMatches?.length || 0;
      const basicMatches = basicResult.topMatches?.length || 0;
      if (enhancedMatches >= basicMatches) enhancedScore += 40;
      else basicScore += 40;

      // Additional features (weighted 30%)
      if ((enhancedResult.indirectOpportunities?.length || 0) > 0) enhancedScore += 15;
      if ((enhancedResult.networkStrategies?.length || 0) > 0) enhancedScore += 15;

      // Network insights (weighted 20%)
      if (enhancedResult.networkAnalysis?.centrality?.centrality_score > 0) enhancedScore += 20;

      // Performance penalty (weighted 10%)
      if (enhancedResult.executionTime <= basicResult.executionTime * 2.0) enhancedScore += 10;
      else basicScore += 10;
    }

    if (enhancedScore > basicScore) return 'enhanced';
    if (basicScore > enhancedScore) return 'basic';
    return 'tie';
  }

  /**
   * Calculate confidence level in winner determination
   * @private
   */
  calculateConfidence(algorithm, basicResult, enhancedResult) {
    if (basicResult.error || enhancedResult.error) return 0.2;

    let confidence = 0.5; // Base confidence

    if (algorithm === 'opportunity_scoring') {
      // Score difference confidence
      const scoreDiff = Math.abs(enhancedResult.overallScore - basicResult.overallScore);
      confidence += Math.min(0.3, scoreDiff / 100);

      // Additional insights boost confidence
      if ((enhancedResult.relationshipContext?.length || 0) > 5) confidence += 0.15;
      
    } else if (algorithm === 'partnership_matching') {
      // Network analysis boosts confidence
      if (enhancedResult.networkAnalysis?.centrality?.centrality_score > 10) confidence += 0.2;
      
      // Indirect opportunities boost confidence
      if ((enhancedResult.indirectOpportunities?.length || 0) > 3) confidence += 0.15;
    }

    // Performance penalty reduces confidence
    const performanceRatio = enhancedResult.executionTime / basicResult.executionTime;
    if (performanceRatio > 3.0) confidence -= 0.2;
    else if (performanceRatio > 2.0) confidence -= 0.1;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  /**
   * Store test configuration in database
   * @private
   */
  async storeTestConfiguration(config) {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS ab_test_configs (
        test_id VARCHAR(100) PRIMARY KEY,
        algorithm VARCHAR(50) NOT NULL,
        test_name VARCHAR(200) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        sample_size INTEGER NOT NULL,
        traffic_split JSONB NOT NULL,
        success_metrics TEXT[] NOT NULL,
        hypothesis TEXT NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.db.query(`
      INSERT INTO ab_test_configs 
      (test_id, algorithm, test_name, start_date, end_date, sample_size, 
       traffic_split, success_metrics, hypothesis, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      config.test_id, config.algorithm, config.test_name,
      config.start_date, config.end_date, config.sample_size,
      JSON.stringify(config.traffic_split), config.success_metrics,
      config.hypothesis, config.status
    ]);
  }

  /**
   * Initialize test metrics table
   * @private
   */
  async initializeTestMetrics(testId) {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS ab_test_results (
        id SERIAL PRIMARY KEY,
        test_id VARCHAR(100) NOT NULL,
        algorithm VARCHAR(50) NOT NULL,
        company_id INTEGER,
        opportunity_id INTEGER,
        variant VARCHAR(20) NOT NULL,
        execution_time INTEGER NOT NULL,
        result_data JSONB NOT NULL,
        comparison_data JSONB,
        timestamp TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (test_id) REFERENCES ab_test_configs(test_id)
      )
    `);
  }

  /**
   * Store individual test results
   * @private
   */
  async storeTestResults(testId, algorithm, companyId, opportunityId, results, comparison) {
    for (const [variant, result] of Object.entries(results)) {
      await this.db.query(`
        INSERT INTO ab_test_results 
        (test_id, algorithm, company_id, opportunity_id, variant, execution_time, result_data, comparison_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        testId, algorithm, companyId, opportunityId, variant,
        result.executionTime, JSON.stringify(result),
        variant === 'enhanced' ? JSON.stringify(comparison) : null
      ]);
    }
  }

  /**
   * Calculate statistical significance for accumulated test results
   * @private
   */
  async calculateStatisticalSignificance(testId, algorithm) {
    const resultsQuery = await this.db.query(`
      SELECT variant, COUNT(*) as count, AVG(execution_time) as avg_time,
             result_data->>'overallScore' as score,
             result_data->>'error' as error
      FROM ab_test_results 
      WHERE test_id = $1 AND algorithm = $2
      GROUP BY variant, result_data->>'overallScore', result_data->>'error'
    `, [testId, algorithm]);

    if (resultsQuery.rows.length < 10) {
      return {
        sufficient_data: false,
        sample_size: resultsQuery.rows.length,
        recommendation: 'Continue testing - need at least 10 samples per variant'
      };
    }

    // Simplified statistical analysis
    const basicResults = resultsQuery.rows.filter(r => r.variant === 'basic');
    const enhancedResults = resultsQuery.rows.filter(r => r.variant === 'enhanced');

    const basicAvgTime = basicResults.reduce((sum, r) => sum + parseFloat(r.avg_time), 0) / basicResults.length;
    const enhancedAvgTime = enhancedResults.reduce((sum, r) => sum + parseFloat(r.avg_time), 0) / enhancedResults.length;

    return {
      sufficient_data: true,
      sample_size: resultsQuery.rows.length,
      performance_difference: {
        basic_avg_time: Math.round(basicAvgTime),
        enhanced_avg_time: Math.round(enhancedAvgTime),
        difference_ms: Math.round(enhancedAvgTime - basicAvgTime),
        difference_percentage: Math.round(((enhancedAvgTime - basicAvgTime) / basicAvgTime) * 100)
      },
      recommendation: enhancedAvgTime < basicAvgTime * 1.5 ? 
        'Enhanced version acceptable - provides additional value with reasonable performance cost' :
        'Enhanced version may be too slow - consider optimization'
    };
  }

  /**
   * Generate unique test ID
   * @private
   */
  generateTestId(testName) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 6);
    return `${testName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}_${random}`;
  }

  /**
   * Get test results summary
   * @param {string} testId - Test identifier
   * @returns {Promise<Object>} Test summary
   */
  async getTestSummary(testId) {
    const configResult = await this.db.query(
      'SELECT * FROM ab_test_configs WHERE test_id = $1', [testId]
    );

    if (configResult.rows.length === 0) {
      throw new Error(`Test ${testId} not found`);
    }

    const resultsQuery = await this.db.query(`
      SELECT variant, COUNT(*) as sample_size,
             AVG(execution_time) as avg_execution_time,
             AVG(CASE WHEN result_data->>'error' IS NULL 
                      THEN (result_data->>'overallScore')::float 
                      ELSE NULL END) as avg_score
      FROM ab_test_results 
      WHERE test_id = $1
      GROUP BY variant
    `, [testId]);

    return {
      config: configResult.rows[0],
      results: resultsQuery.rows,
      significance: await this.calculateStatisticalSignificance(testId, configResult.rows[0].algorithm)
    };
  }
}

module.exports = { ABTestingFramework };