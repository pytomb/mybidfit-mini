const { AIAnalysisEngine } = require('./supplierAnalysis/AIAnalysisEngine');
const { DatabaseOperations } = require('./supplierAnalysis/DatabaseOperations');
const { CapabilitiesExtractor } = require('./supplierAnalysis/CapabilitiesExtractor');
const { CredibilityScorer } = require('./supplierAnalysis/CredibilityScorer');
const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

/**
 * SupplierAnalysisService - Main service for analyzing supplier capabilities and credibility
 * 
 * REFACTORED: Core logic moved to modular architecture in ./supplierAnalysis/ directory:
 * - AIAnalysisEngine: Coordinates AI analysis and simulates OpenRouter integration
 * - CredibilityScorer: Calculates supplier credibility scores
 * - CapabilitiesExtractor: Extracts and enhances capabilities from various sources
 * - DatabaseOperations: Handles all database operations and analytics storage
 * 
 * This service now acts as a lightweight orchestrator that delegates to specialized modules.
 */
class SupplierAnalysisService {
  constructor() {
    this.db = Database.getInstance();
    this.aiEngine = new AIAnalysisEngine();
    this.dbOps = new DatabaseOperations(this.db);
    this.capabilitiesExtractor = new CapabilitiesExtractor();
    this.credibilityScorer = new CredibilityScorer();
  }

  /**
   * Algorithm 1: Supplier Analysis Engine
   * Analyzes supplier website, case studies, and documents to extract structured data
   * This is a mock implementation - in production would integrate with OpenRouter API
   * 
   * @param {number} companyId - Company ID to analyze
   * @param {Object} analysisData - Optional analysis data from external sources
   * @returns {Object} Complete supplier analysis results
   */
  async analyzeSupplier(companyId, analysisData = {}) {
    try {
      logger.info(`Starting supplier analysis for company ${companyId}`);

      // Get company data
      const company = await this.dbOps.getCompany(companyId);

      // Check if re-analysis is needed (optional optimization)
      if (!analysisData.forceReanalysis && !(await this.dbOps.needsReanalysis(companyId))) {
        logger.debug(`Company ${companyId} analyzed recently, skipping re-analysis`);
        const history = await this.dbOps.getAnalysisHistory(companyId);
        return this.buildAnalysisResponse(companyId, company, history);
      }

      // Perform comprehensive AI analysis using engine
      const analysis = await this.aiEngine.performAnalysis(company, analysisData);

      // Update company profile with results
      const updatedCompany = await this.dbOps.updateCompanyProfile(companyId, analysis);

      // Store detailed analytics for future analysis (non-blocking)
      this.dbOps.storeAnalyticsRecord(companyId, analysis).catch(err => 
        logger.warn('Failed to store analytics record:', err.message)
      );

      logger.info(`Supplier analysis completed for ${company.name} - Score: ${analysis.credibilityScore.toFixed(2)}`);
      
      return this.buildAnalysisResponse(companyId, updatedCompany, analysis);

    } catch (error) {
      logger.error('Supplier analysis failed:', error);
      throw error;
    }
  }

  /**
   * Build standardized analysis response
   */
  buildAnalysisResponse(companyId, company, analysis) {
    return {
      companyId,
      analysis: typeof analysis === 'object' && analysis.credibilityScore ? analysis : null,
      updatedProfile: company,
      confidence: analysis?.confidence || company.analysis_confidence || 0.7,
      
      // Flatten key properties for easier testing and API responses
      capabilities: analysis?.capabilities || company.capabilities || [],
      credibilityScore: analysis?.credibilityScore || company.credibility_score || 0,
      domainExpertise: analysis?.domainExpertise || 'Technology',
      technicalCapabilities: analysis?.technicalCapabilities || [],
      certifications: analysis?.certifications || [],
      extractedCapabilities: analysis?.capabilities || company.capabilities || [],
      credibilitySignals: analysis?.credibilitySignals || {},
      insights: analysis?.insights || []
    };
  }

  /**
   * Calculate supplier credibility score (standalone method)
   * @param {Object} company - Company data
   * @param {Object} analysisData - Optional analysis data
   * @returns {number} Credibility score
   */
  async calculateSupplierScore(company, analysisData = {}) {
    try {
      // If company is an ID, fetch the company data
      if (typeof company === 'number') {
        company = await this.dbOps.getCompany(company);
      }

      return this.credibilityScorer.calculateCredibilityScore(company, analysisData);
      
    } catch (error) {
      logger.error('Credibility scoring failed:', error);
      return 3.0; // Safe default score
    }
  }

  /**
   * Extract capabilities from various data sources
   * @param {Object} company - Company data
   * @param {Object} analysisData - Analysis data
   * @returns {Array} Enhanced capabilities
   */
  extractCapabilities(company, analysisData = {}) {
    return this.capabilitiesExtractor.extractEnhancedCapabilities(company, analysisData);
  }

  /**
   * Batch analyze multiple suppliers
   * @param {Array} companyIds - Array of company IDs
   * @returns {Array} Analysis results for each company
   */
  async batchAnalyzeSuppliers(companyIds) {
    const results = [];
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < companyIds.length; i += batchSize) {
      const batch = companyIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (companyId) => {
        try {
          const analysis = await this.analyzeSupplier(companyId);
          return {
            companyId,
            status: 'success',
            analysis
          };
        } catch (error) {
          logger.error(`Batch analysis failed for company ${companyId}:`, error);
          return {
            companyId,
            status: 'error',
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < companyIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info(`Batch analysis completed: ${results.filter(r => r.status === 'success').length}/${companyIds.length} successful`);
    return results;
  }

  /**
   * Get analysis history for a company
   * @param {number} companyId - Company ID
   * @returns {Object} Analysis history
   */
  async getAnalysisHistory(companyId) {
    return await this.dbOps.getAnalysisHistory(companyId);
  }

  /**
   * Get companies that need re-analysis
   * @param {number} maxAgeHours - Maximum age in hours before re-analysis
   * @param {number} limit - Maximum companies to return
   * @returns {Array} Companies needing analysis
   */
  async getCompaniesNeedingReanalysis(maxAgeHours = 168, limit = 50) {
    return await this.dbOps.getCompaniesNeedingReanalysis(maxAgeHours, limit);
  }

  /**
   * Get analysis statistics
   * @returns {Object} System-wide analysis statistics
   */
  async getAnalysisStatistics() {
    return await this.dbOps.getAnalysisStatistics();
  }

  /**
   * Clean up old analytics data
   * @param {number} retentionDays - Days to retain data
   * @returns {number} Records deleted
   */
  async cleanupOldAnalytics(retentionDays = 90) {
    return await this.dbOps.cleanupOldAnalytics(retentionDays);
  }

  // Legacy method support for backward compatibility
  
  /**
   * @deprecated Use extractCapabilities instead
   */
  extractCapabilitiesFromDescription(description) {
    return this.capabilitiesExtractor.extractCapabilitiesFromDescription(description);
  }

  /**
   * @deprecated Use credibilityScorer.inferDomainFromData instead
   */
  inferDomainFromData(analysisData) {
    return this.credibilityScorer.inferDomainFromData(analysisData);
  }

  /**
   * @deprecated Use capabilitiesExtractor.extractSpecializations instead
   */
  extractSpecializations(company, analysisData) {
    return this.capabilitiesExtractor.extractSpecializations(company, analysisData);
  }
}

module.exports = { SupplierAnalysisService };