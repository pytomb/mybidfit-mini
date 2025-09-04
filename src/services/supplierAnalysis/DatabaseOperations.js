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
}

module.exports = { DatabaseOperations };