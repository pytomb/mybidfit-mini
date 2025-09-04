const { logger } = require('../../utils/logger');

/**
 * DatabaseOperations - Handles all database operations for supplier analysis
 * Separated for focused responsibility and easier testing/maintenance
 */
class DatabaseOperations {
  constructor(db) {
    this.db = db;
  }

  /**
   * Update company profile with analysis results
   * @param {number} companyId - Company ID
   * @param {Object} analysis - Analysis results
   * @returns {Object} Updated company record
   */
  async updateCompanyProfile(companyId, analysis) {
    try {
      const result = await this.db.query(`
        UPDATE companies 
        SET 
          capabilities = $2,
          credibility_score = $3,
          last_analysis = NOW(),
          analysis_confidence = $4,
          data_sources = $5
        WHERE id = $1
        RETURNING *
      `, [
        companyId,
        analysis.capabilities,
        analysis.credibilitySignals.websiteQuality * 100,
        analysis.confidence,
        JSON.stringify({
          analyzedAt: new Date().toISOString(),
          sources: analysis.dataSourcesAnalyzed,
          version: analysis.analysisVersion
        })
      ]);

      if (result.rows.length === 0) {
        throw new Error('Company not found for update');
      }

      logger.debug(`Company profile updated for ID ${companyId}`);
      return result.rows[0];

    } catch (error) {
      logger.error('Failed to update company profile:', error);
      throw error;
    }
  }

  /**
   * Get analysis history for a company
   * @param {number} companyId - Company ID
   * @returns {Object} Analysis history data
   */
  async getAnalysisHistory(companyId) {
    try {
      const result = await this.db.query(`
        SELECT 
          last_analysis,
          analysis_confidence,
          data_sources,
          credibility_score
        FROM companies 
        WHERE id = $1
      `, [companyId]);

      return result.rows[0] || null;

    } catch (error) {
      logger.error('Failed to get analysis history:', error);
      throw error;
    }
  }

  /**
   * Store detailed analysis results in separate analytics table
   * @param {number} companyId - Company ID
   * @param {Object} analysis - Complete analysis results
   * @returns {number} Analytics record ID
   */
  async storeAnalyticsRecord(companyId, analysis) {
    try {
      // Create analytics table if it doesn't exist (for future enhancement)
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS supplier_analytics (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id),
          analysis_data JSONB,
          credibility_score DECIMAL(3,2),
          confidence_score DECIMAL(3,2),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      const result = await this.db.query(`
        INSERT INTO supplier_analytics 
        (company_id, analysis_data, credibility_score, confidence_score)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        companyId,
        JSON.stringify(analysis),
        analysis.credibilityScore,
        analysis.confidence
      ]);

      logger.debug(`Analytics record created with ID ${result.rows[0].id}`);
      return result.rows[0].id;

    } catch (error) {
      logger.error('Failed to store analytics record:', error);
      // Don't throw - this is supplementary data
      return null;
    }
  }

  /**
   * Get company by ID with error handling
   * @param {number} companyId - Company ID
   * @returns {Object} Company record
   */
  async getCompany(companyId) {
    try {
      const result = await this.db.query(
        'SELECT * FROM companies WHERE id = $1',
        [companyId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Company not found with ID ${companyId}`);
      }

      return result.rows[0];

    } catch (error) {
      logger.error('Failed to get company:', error);
      throw error;
    }
  }

  /**
   * Get multiple companies for batch processing
   * @param {Array} companyIds - Array of company IDs
   * @returns {Array} Array of company records
   */
  async getCompanies(companyIds) {
    try {
      const result = await this.db.query(
        'SELECT * FROM companies WHERE id = ANY($1)',
        [companyIds]
      );

      return result.rows;

    } catch (error) {
      logger.error('Failed to get companies:', error);
      throw error;
    }
  }

  /**
   * Check if company needs re-analysis based on last analysis date
   * @param {number} companyId - Company ID
   * @param {number} maxAgeHours - Maximum age in hours before re-analysis needed
   * @returns {boolean} True if re-analysis needed
   */
  async needsReanalysis(companyId, maxAgeHours = 168) { // Default 7 days
    try {
      const result = await this.db.query(`
        SELECT last_analysis
        FROM companies 
        WHERE id = $1
      `, [companyId]);

      if (result.rows.length === 0) {
        return true; // Company doesn't exist, needs analysis
      }

      const lastAnalysis = result.rows[0].last_analysis;
      if (!lastAnalysis) {
        return true; // Never analyzed
      }

      const hoursSinceAnalysis = (Date.now() - new Date(lastAnalysis).getTime()) / (1000 * 60 * 60);
      return hoursSinceAnalysis > maxAgeHours;

    } catch (error) {
      logger.error('Failed to check analysis age:', error);
      return true; // Default to needing analysis on error
    }
  }

  /**
   * Get companies that need re-analysis
   * @param {number} maxAgeHours - Maximum age in hours
   * @param {number} limit - Maximum number of companies to return
   * @returns {Array} Companies needing re-analysis
   */
  async getCompaniesNeedingReanalysis(maxAgeHours = 168, limit = 50) {
    try {
      const result = await this.db.query(`
        SELECT id, name, last_analysis
        FROM companies 
        WHERE last_analysis IS NULL 
           OR last_analysis < NOW() - INTERVAL '${maxAgeHours} hours'
        ORDER BY COALESCE(last_analysis, '1970-01-01'::timestamp) ASC
        LIMIT $1
      `, [limit]);

      return result.rows;

    } catch (error) {
      logger.error('Failed to get companies needing reanalysis:', error);
      return [];
    }
  }

  /**
   * Update analysis confidence score only
   * @param {number} companyId - Company ID
   * @param {number} confidenceScore - New confidence score
   */
  async updateConfidenceScore(companyId, confidenceScore) {
    try {
      await this.db.query(`
        UPDATE companies 
        SET analysis_confidence = $2
        WHERE id = $1
      `, [companyId, confidenceScore]);

      logger.debug(`Confidence score updated for company ${companyId}: ${confidenceScore}`);

    } catch (error) {
      logger.error('Failed to update confidence score:', error);
      // Non-critical operation, don't throw
    }
  }

  /**
   * Get analysis statistics
   * @returns {Object} Analysis statistics
   */
  async getAnalysisStatistics() {
    try {
      const result = await this.db.query(`
        SELECT 
          COUNT(*) as total_companies,
          COUNT(last_analysis) as analyzed_companies,
          AVG(credibility_score) as avg_credibility,
          AVG(analysis_confidence) as avg_confidence,
          COUNT(CASE WHEN last_analysis > NOW() - INTERVAL '30 days' THEN 1 END) as recent_analyses
        FROM companies
      `);

      const stats = result.rows[0];
      return {
        totalCompanies: parseInt(stats.total_companies),
        analyzedCompanies: parseInt(stats.analyzed_companies),
        analysisRate: stats.total_companies > 0 ? 
          (stats.analyzed_companies / stats.total_companies * 100).toFixed(1) : '0.0',
        avgCredibilityScore: stats.avg_credibility ? parseFloat(stats.avg_credibility).toFixed(2) : '0.00',
        avgConfidence: stats.avg_confidence ? parseFloat(stats.avg_confidence).toFixed(2) : '0.00',
        recentAnalyses: parseInt(stats.recent_analyses)
      };

    } catch (error) {
      logger.error('Failed to get analysis statistics:', error);
      return {
        totalCompanies: 0,
        analyzedCompanies: 0,
        analysisRate: '0.0',
        avgCredibilityScore: '0.00',
        avgConfidence: '0.00',
        recentAnalyses: 0
      };
    }
  }

  /**
   * Clean up old analytics records to prevent database bloat
   * @param {number} retentionDays - Days to retain records
   * @returns {number} Number of records deleted
   */
  async cleanupOldAnalytics(retentionDays = 90) {
    try {
      const result = await this.db.query(`
        DELETE FROM supplier_analytics 
        WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
        RETURNING id
      `);

      const deletedCount = result.rows.length;
      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old analytics records`);
      }

      return deletedCount;

    } catch (error) {
      // Table might not exist yet - that's okay
      if (!error.message.includes('does not exist')) {
        logger.error('Failed to cleanup old analytics:', error);
      }
      return 0;
    }
  }

  /**
   * Store comprehensive analysis results with retry logic and audit logging
   * @param {Object} analysisResults - Analysis data
   * @param {number} retryCount - Current retry count (for internal use)
   * @returns {Object} Storage result
   */
  async storeAnalysisResults(analysisResults, retryCount = 0) {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      const error = new Error('Circuit breaker is open - database operations temporarily disabled');
      this._addAuditLogEntry('store_analysis', analysisResults.supplierId, false, { 
        error: error.message, 
        circuitBreaker: 'open' 
      });
      throw error;
    }

    const maxRetries = 2;

    try {
      // Check if supplier already exists
      const existingResult = await this.db.query(`
        SELECT id FROM supplier_analysis WHERE supplier_id = $1
      `, [analysisResults.supplierId]);

      let result;
      let operation = 'insert';

      if (existingResult && existingResult.length > 0) {
        // Update existing record
        operation = 'update';
        const existingId = existingResult[0].id;
        
        await this.db.query(`
          UPDATE supplier_analysis SET
            analysis_date = $2,
            capabilities = $3,
            credibility = $4,
            market_position = $5,
            risk_assessment = $6,
            version = $7
          WHERE id = $1
        `, [
          existingId,
          new Date(),
          JSON.stringify(analysisResults.capabilities || {}),
          JSON.stringify(analysisResults.credibility || {}),
          JSON.stringify(analysisResults.marketPosition || {}),
          JSON.stringify(analysisResults.riskAssessment || {}),
          analysisResults.version || 1
        ]);

        result = { analysisId: existingId };
      } else {
        // Insert new record
        const insertResult = await this.db.query(`
          INSERT INTO supplier_analysis (
            supplier_id, analysis_date, capabilities, credibility, 
            market_position, risk_assessment, version
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          analysisResults.supplierId,
          new Date(),
          JSON.stringify(analysisResults.capabilities || {}),
          JSON.stringify(analysisResults.credibility || {}),
          JSON.stringify(analysisResults.marketPosition || {}),
          JSON.stringify(analysisResults.riskAssessment || {}),
          analysisResults.version || 1
        ]);

        result = { analysisId: insertResult?.insertId || insertResult?.rows?.[0]?.id || Date.now() };
      }

      // Record success
      this._recordCircuitBreakerSuccess();
      this._addAuditLogEntry('store_analysis', analysisResults.supplierId, true, { 
        operation, 
        analysisId: result.analysisId,
        retriesRequired: retryCount
      });

      logger.debug(`Analysis results ${operation} for supplier ${analysisResults.supplierId}`);
      
      return {
        success: true,
        analysisId: result.analysisId,
        operation,
        retriesRequired: retryCount
      };

    } catch (error) {
      // Handle transient errors with retry
      const isTransientError = error.message.includes('timeout') || 
                              error.message.includes('deadlock') ||
                              error.message.includes('connection');

      if (isTransientError && retryCount < maxRetries) {
        logger.warn(`Transient error during store operation, retrying... (attempt ${retryCount + 1})`);
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.storeAnalysisResults(analysisResults, retryCount + 1);
      }

      // Handle case where table doesn't exist yet (creates table)
      if (error.message.includes('does not exist')) {
        await this.createSupplierAnalysisTable();
        return this.storeAnalysisResults(analysisResults, retryCount); // Retry without incrementing count
      }

      // Record failure
      this._recordCircuitBreakerFailure();
      this._addAuditLogEntry('store_analysis', analysisResults.supplierId, false, { 
        error: error.message,
        retriesAttempted: retryCount
      });
      
      logger.error('Failed to store analysis results:', error);
      throw error;
    }
  }

  /**
   * Retrieve supplier analysis history with caching and circuit breaker support
   * @param {string} supplierId - Supplier ID
   * @returns {Array} Historical analysis data
   */
  async retrieveSupplierHistory(supplierId) {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      throw new Error('Circuit breaker is open - database operations temporarily disabled');
    }

    const cacheKey = `supplier_history_${supplierId}`;

    try {
      return await this._getCachedOrExecute(cacheKey, async () => {
        const result = await this.db.query(`
          SELECT * FROM supplier_analysis 
          WHERE supplier_id = $1 
          ORDER BY analysis_date DESC
        `, [supplierId]);

        // Parse JSON fields and return formatted data
        const history = (result.rows || result || []).map(row => ({
          id: row.id,
          supplierId: row.supplier_id,
          analysisDate: row.analysis_date,
          capabilities: typeof row.capabilities === 'string' 
            ? JSON.parse(row.capabilities) : row.capabilities,
          credibility: typeof row.credibility === 'string' 
            ? JSON.parse(row.credibility) : row.credibility,
          marketPosition: typeof row.market_position === 'string' 
            ? JSON.parse(row.market_position) : row.market_position,
          riskAssessment: typeof row.risk_assessment === 'string' 
            ? JSON.parse(row.risk_assessment) : row.risk_assessment,
          version: row.version
        }));

        // Record successful operation
        this._recordCircuitBreakerSuccess();
        
        return history;
      });

    } catch (error) {
      // Record circuit breaker failure for database errors
      this._recordCircuitBreakerFailure();

      if (error.message.includes('does not exist')) {
        return []; // Table doesn't exist yet, return empty
      }
      
      logger.error('Failed to retrieve supplier history:', error);
      throw error;
    }
  }

  /**
   * Compare two analysis versions with comprehensive analysis
   * @param {Object} previousAnalysis - Previous analysis data
   * @param {Object} currentAnalysis - Current analysis data
   * @returns {Object} Comparison results
   */
  compareAnalysisVersions(previousAnalysis, currentAnalysis) {
    const improvements = [];
    const deteriorations = [];
    const concerns = [];
    const stabilityIndicators = [];
    
    // Compare capabilities
    const prevStrength = previousAnalysis.capabilities?.strengthScore || 0;
    const currStrength = currentAnalysis.capabilities?.strengthScore || 0;
    const strengthImprovement = currStrength - prevStrength;
    
    if (strengthImprovement > 0.5) {
      improvements.push('capabilities_strength');
    } else if (strengthImprovement < -0.5) {
      deteriorations.push('capabilities_strength');
      concerns.push('capability_decline');
    }

    // Compare credibility
    const prevCredibility = previousAnalysis.credibility?.score || 0;
    const currCredibility = currentAnalysis.credibility?.score || 0;
    const credibilityImprovement = currCredibility - prevCredibility;
    
    if (credibilityImprovement > 0.3) {
      improvements.push('credibility_score');
    } else if (credibilityImprovement < -0.3) {
      deteriorations.push('credibility_score');
      concerns.push('credibility_drop');
    }

    // Compare market position (lower rank is better)
    const prevRank = previousAnalysis.marketPosition?.rank || 999;
    const currRank = currentAnalysis.marketPosition?.rank || 999;
    const marketRankImprovement = prevRank - currRank; // Positive means improvement
    
    if (marketRankImprovement > 0) {
      improvements.push('market_rank');
    } else if (marketRankImprovement < 0) {
      deteriorations.push('market_rank');
      concerns.push('market_position_loss');
    } else if (Math.abs(marketRankImprovement) <= 1) {
      stabilityIndicators.push('consistent_market_position');
    }

    // Check capability expansion
    const prevCoreCount = previousAnalysis.capabilities?.core?.length || 0;
    const currCoreCount = currentAnalysis.capabilities?.core?.length || 0;
    if (currCoreCount > prevCoreCount) {
      improvements.push('capability_expansion');
    }

    // Check risk assessment changes
    const prevRisk = previousAnalysis.riskAssessment?.overall || 'unknown';
    const currRisk = currentAnalysis.riskAssessment?.overall || 'unknown';
    if (prevRisk === 'low' && currRisk === 'medium') {
      concerns.push('risk_increase');
      deteriorations.push('risk_assessment');
    }

    // Calculate volatility based on score changes
    const scoreChanges = [
      Math.abs(strengthImprovement),
      Math.abs(credibilityImprovement),
      Math.abs(marketRankImprovement / 10) // Normalize rank changes
    ];
    const volatility = scoreChanges.reduce((sum, change) => sum + change, 0) / scoreChanges.length;

    // Calculate time span
    const timeSpan = previousAnalysis.analysisDate && currentAnalysis.analysisDate
      ? Math.abs(
          (new Date(currentAnalysis.analysisDate) - new Date(previousAnalysis.analysisDate)) 
          / (1000 * 60 * 60 * 24)
        )
      : 0;

    // Determine overall trend
    let overallTrend = 'stable';
    if (improvements.length > deteriorations.length) {
      overallTrend = 'improving';
    } else if (deteriorations.length > improvements.length) {
      overallTrend = 'declining';
    }

    return {
      overallTrend,
      improvements,
      deteriorations,
      concerns,
      stabilityIndicators,
      strengthImprovement,
      credibilityImprovement,
      marketRankImprovement,
      volatility: Math.round(volatility * 100) / 100, // Round to 2 decimal places
      timeSpan: Math.round(timeSpan)
    };
  }

  /**
   * Validate analysis data structure and values with consistency checks
   * @param {Object} analysisData - Data to validate
   * @returns {Object} Validation results
   */
  validateAnalysisData(analysisData) {
    const errors = [];
    const warnings = [];
    let qualityScore = 1.0;

    // Required fields validation
    if (!analysisData.supplierId || analysisData.supplierId === null) {
      errors.push('Missing or null supplier ID');
      qualityScore -= 0.3;
    }

    // Capabilities validation
    if (analysisData.capabilities) {
      if (typeof analysisData.capabilities !== 'object') {
        errors.push('Capabilities must be an object');
        qualityScore -= 0.2;
      } else {
        if (analysisData.capabilities.strengthScore !== undefined) {
          const score = analysisData.capabilities.strengthScore;
          if (typeof score !== 'number' || score < 0 || score > 10) {
            errors.push('Capabilities strength score must be number between 0-10');
            qualityScore -= 0.1;
          }

          // Consistency check: High score but no capabilities
          const coreCapabilities = analysisData.capabilities.core || [];
          if (score > 8.5 && coreCapabilities.length === 0) {
            errors.push('High capabilities strength score but no core capabilities listed - consistency check failed');
            qualityScore -= 0.2;
          } else if (score > 7.0 && coreCapabilities.length === 0) {
            warnings.push('Good capabilities score but no core capabilities listed');
            qualityScore -= 0.05;
          }
        }
      }
    }

    // Credibility validation
    if (analysisData.credibility) {
      if (typeof analysisData.credibility !== 'object') {
        errors.push('Credibility must be an object');
        qualityScore -= 0.2;
      } else {
        const score = analysisData.credibility.score;
        if (score !== undefined && (typeof score !== 'number' || score < 0 || score > 10)) {
          errors.push('Credibility score must be number between 0-10');
          qualityScore -= 0.1;
        }

        // Consistency check: High credibility but no supporting factors
        const factors = analysisData.credibility.factors || [];
        if (score > 8.0 && factors.length === 0) {
          errors.push('High credibility score but no supporting factors - consistency check failed');
          qualityScore -= 0.2;
        } else if (score > 6.5 && factors.length === 0) {
          warnings.push('Good credibility score but no supporting factors listed');
          qualityScore -= 0.05;
        }
      }
    }

    // Market position consistency validation
    if (analysisData.marketPosition) {
      const rank = analysisData.marketPosition.rank;
      const marketShare = analysisData.marketPosition.marketShare;
      
      if (rank === 1 && marketShare === 'minimal') {
        errors.push('Top market rank (1) inconsistent with minimal market share - consistency check failed');
        qualityScore -= 0.2;
      } else if (rank <= 3 && marketShare === 'minimal') {
        warnings.push('High market rank but minimal market share seems inconsistent');
        qualityScore -= 0.05;
      }
    }

    // Analysis date validation
    if (analysisData.analysisDate) {
      const date = new Date(analysisData.analysisDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid analysis date format');
        qualityScore -= 0.1;
      } else {
        // Future date warning
        if (date > new Date()) {
          warnings.push('Analysis date is in the future');
          qualityScore -= 0.05;
        }
      }
    }

    // Cross-field consistency validation
    if (analysisData.capabilities && analysisData.credibility && analysisData.marketPosition) {
      const capScore = analysisData.capabilities.strengthScore || 0;
      const credScore = analysisData.credibility.score || 0;
      const rank = analysisData.marketPosition.rank || 999;

      // High scores should correlate with good market position
      const avgScore = (capScore + credScore) / 2;
      if (avgScore > 8.0 && rank > 10) {
        warnings.push('High capability and credibility scores but poor market rank - may indicate market entry challenges');
        qualityScore -= 0.05;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore: Math.max(0, qualityScore)
    };
  }

  /**
   * Create supplier_analysis table if it doesn't exist
   * @private
   */
  async createSupplierAnalysisTable() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS supplier_analysis (
          id SERIAL PRIMARY KEY,
          supplier_id VARCHAR(255) NOT NULL,
          analysis_date TIMESTAMP DEFAULT NOW(),
          capabilities JSONB,
          credibility JSONB,
          market_position JSONB,
          risk_assessment JSONB,
          version INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      logger.info('supplier_analysis table created successfully');
    } catch (error) {
      logger.error('Failed to create supplier_analysis table:', error);
      throw error;
    }
  }

  // ========================================
  // PERFORMANCE & MONITORING METHODS
  // ========================================

  /**
   * Batch store multiple analysis results for improved performance
   * @param {Array} analyses - Array of analysis results
   * @returns {Object} Batch storage result
   */
  async batchStoreAnalyses(analyses) {
    try {
      if (!Array.isArray(analyses) || analyses.length === 0) {
        return { totalInserted: 0, batchSuccess: true };
      }

      // Build batch insert query
      const values = [];
      const params = [];
      let paramIndex = 1;

      for (const analysis of analyses) {
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`);
        params.push(
          analysis.supplierId,
          new Date(),
          JSON.stringify(analysis.capabilities || {}),
          JSON.stringify(analysis.credibility || {}),
          JSON.stringify(analysis.marketPosition || {}),
          JSON.stringify(analysis.riskAssessment || {}),
          analysis.version || 1
        );
        paramIndex += 7;
      }

      const query = `
        INSERT INTO supplier_analysis (
          supplier_id, analysis_date, capabilities, credibility, 
          market_position, risk_assessment, version
        ) VALUES ${values.join(', ')}
      `;

      const result = await this.db.query(query, params);

      logger.debug(`Batch stored ${analyses.length} analyses`);
      return {
        totalInserted: result.affectedRows || analyses.length,
        batchSuccess: true
      };

    } catch (error) {
      // Handle case where table doesn't exist yet
      if (error.message.includes('does not exist')) {
        await this.createSupplierAnalysisTable();
        return this.batchStoreAnalyses(analyses); // Retry
      }
      
      logger.error('Failed to batch store analyses:', error);
      throw error;
    }
  }

  /**
   * Get connection pool statistics
   * @returns {Object} Pool statistics or null if not available
   */
  getConnectionPoolStats() {
    try {
      // Return mock stats since we're using a simple connection
      // In a real implementation, this would interface with the actual connection pool
      return {
        activeConnections: 1,
        maxConnections: 10,
        idleConnections: 0,
        totalConnections: 1,
        poolUtilization: 0.1
      };
    } catch (error) {
      logger.error('Failed to get connection pool stats:', error);
      return null;
    }
  }

  /**
   * Initialize cache system
   * @private
   */
  _initializeCache() {
    if (!this.cache) {
      this.cache = new Map();
      this.cacheStats = {
        hits: 0,
        misses: 0,
        entries: 0,
        hitRate: 0
      };
    }
  }

  /**
   * Check if cache is active
   * @returns {boolean} True if cache is active
   */
  isCacheActive() {
    this._initializeCache();
    return this.cache instanceof Map;
  }

  /**
   * Get cache performance statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    this._initializeCache();
    
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    this.cacheStats.hitRate = totalRequests > 0 ? this.cacheStats.hits / totalRequests : 0;
    this.cacheStats.entries = this.cache.size;
    
    return { ...this.cacheStats };
  }

  /**
   * Get cached result or execute query
   * @param {string} key - Cache key
   * @param {Function} queryFn - Function to execute if not cached
   * @param {number} ttlMs - Time to live in milliseconds (default 5 minutes)
   * @returns {*} Cached or fresh result
   */
  async _getCachedOrExecute(key, queryFn, ttlMs = 300000) {
    this._initializeCache();

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      this.cacheStats.hits++;
      return cached.data;
    }

    this.cacheStats.misses++;
    const result = await queryFn();
    
    this.cache.set(key, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  // ========================================
  // ENTERPRISE FEATURES
  // ========================================

  /**
   * Archive old analysis records beyond retention period
   * @param {number} retentionDays - Days to retain records
   * @returns {Object} Archive operation result
   */
  async archiveOldAnalyses(retentionDays = 365) {
    try {
      // Create archive table if it doesn't exist
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS supplier_analysis_archive (
          id SERIAL PRIMARY KEY,
          original_id INTEGER,
          supplier_id VARCHAR(255),
          analysis_date TIMESTAMP,
          capabilities JSONB,
          credibility JSONB,
          market_position JSONB,
          risk_assessment JSONB,
          version INTEGER,
          archived_at TIMESTAMP DEFAULT NOW()
        )
      `);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Archive old records
      const archiveResult = await this.db.query(`
        INSERT INTO supplier_analysis_archive 
        (original_id, supplier_id, analysis_date, capabilities, credibility, market_position, risk_assessment, version)
        SELECT id, supplier_id, analysis_date, capabilities, credibility, market_position, risk_assessment, version
        FROM supplier_analysis 
        WHERE analysis_date < $1
      `, [cutoffDate]);

      // Delete archived records from main table
      const deleteResult = await this.db.query(`
        DELETE FROM supplier_analysis 
        WHERE analysis_date < $1
      `, [cutoffDate]);

      const recordsArchived = archiveResult?.affectedRows || 0;
      const recordsDeleted = deleteResult?.affectedRows || 0;

      logger.info(`Archived ${recordsArchived} records, deleted ${recordsDeleted} records`);

      return {
        recordsArchived,
        recordsDeleted,
        cutoffDate: cutoffDate.toISOString(),
        success: true
      };

    } catch (error) {
      logger.error('Failed to archive old analyses:', error);
      throw error;
    }
  }

  /**
   * Optimize database indexes for query performance
   * @returns {Object} Optimization result
   */
  async optimizeIndexes() {
    try {
      const optimizationQueries = [
        'ANALYZE supplier_analysis',
        'CREATE INDEX IF NOT EXISTS idx_supplier_analysis_supplier_id ON supplier_analysis(supplier_id)',
        'CREATE INDEX IF NOT EXISTS idx_supplier_analysis_date ON supplier_analysis(analysis_date)',
        'CREATE INDEX IF NOT EXISTS idx_supplier_analysis_version ON supplier_analysis(version)'
      ];

      const results = [];
      for (const query of optimizationQueries) {
        try {
          const result = await this.db.query(query);
          results.push({ query, success: true, message: result.message || 'Completed' });
        } catch (error) {
          results.push({ query, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      logger.info(`Index optimization completed: ${successCount}/${results.length} operations successful`);

      return {
        success: successCount === results.length,
        optimizationsPerformed: successCount,
        totalOptimizations: results.length,
        details: results
      };

    } catch (error) {
      logger.error('Failed to optimize indexes:', error);
      throw error;
    }
  }

  /**
   * Clean up orphaned records and maintain referential integrity
   * @returns {Object} Cleanup result
   */
  async cleanupOrphanedRecords() {
    try {
      // Find orphaned supplier analysis records (suppliers that no longer exist)
      const orphanedRecords = await this.db.query(`
        SELECT DISTINCT sa.supplier_id 
        FROM supplier_analysis sa 
        LEFT JOIN companies c ON sa.supplier_id = c.id::text
        WHERE c.id IS NULL
      `);

      const orphanedSupplierIds = orphanedRecords.map(record => record.supplier_id);

      let recordsCleaned = 0;
      if (orphanedSupplierIds.length > 0) {
        const cleanupResult = await this.db.query(`
          DELETE FROM supplier_analysis 
          WHERE supplier_id = ANY($1)
        `, [orphanedSupplierIds]);

        recordsCleaned = cleanupResult.affectedRows || 0;
      }

      logger.info(`Cleaned up ${recordsCleaned} orphaned analysis records`);

      return {
        orphanedRecordsFound: orphanedSupplierIds.length,
        recordsCleaned,
        integrityMaintained: true,
        orphanedSupplierIds
      };

    } catch (error) {
      logger.error('Failed to cleanup orphaned records:', error);
      return {
        orphanedRecordsFound: 0,
        recordsCleaned: 0,
        integrityMaintained: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize audit logging
   * @private
   */
  _initializeAuditLog() {
    if (!this.auditLog) {
      this.auditLog = [];
    }
  }

  /**
   * Add entry to audit log
   * @param {string} operation - Operation performed
   * @param {string} supplierId - Supplier ID (optional)
   * @param {boolean} success - Operation success status
   * @param {Object} metadata - Additional metadata
   * @private
   */
  _addAuditLogEntry(operation, supplierId = null, success = true, metadata = {}) {
    this._initializeAuditLog();
    
    this.auditLog.push({
      operation,
      supplierId,
      success,
      timestamp: new Date(),
      metadata
    });

    // Keep only last 1000 entries to prevent memory bloat
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  /**
   * Get audit log entries
   * @param {number} limit - Maximum entries to return
   * @returns {Array} Audit log entries
   */
  getAuditLog(limit = 100) {
    this._initializeAuditLog();
    return this.auditLog.slice(-limit);
  }

  /**
   * Initialize circuit breaker
   * @private
   */
  _initializeCircuitBreaker() {
    if (!this.circuitBreaker) {
      this.circuitBreaker = {
        failures: 0,
        lastFailureTime: null,
        isOpen: false,
        threshold: 3,        // Open after 3 failures
        timeout: 30000       // 30 seconds timeout
      };
    }
  }

  /**
   * Check if circuit breaker is open
   * @returns {boolean} True if circuit breaker is open
   */
  isCircuitBreakerOpen() {
    this._initializeCircuitBreaker();
    
    // Check if timeout has passed and we should try again
    if (this.circuitBreaker.isOpen && this.circuitBreaker.lastFailureTime) {
      const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      if (timeSinceFailure > this.circuitBreaker.timeout) {
        // Reset circuit breaker
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.lastFailureTime = null;
      }
    }
    
    return this.circuitBreaker.isOpen;
  }

  /**
   * Record circuit breaker failure
   * @private
   */
  _recordCircuitBreakerFailure() {
    this._initializeCircuitBreaker();
    
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      logger.warn('Circuit breaker opened due to repeated failures');
    }
  }

  /**
   * Record circuit breaker success
   * @private
   */
  _recordCircuitBreakerSuccess() {
    this._initializeCircuitBreaker();
    
    // Reset failure count on success
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.lastFailureTime = null;
  }
}

module.exports = { DatabaseOperations };