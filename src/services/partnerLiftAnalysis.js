const { PartnerLiftCore } = require('./partnerLift/PartnerLiftCore');
const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');
const { OpportunityScoringService } = require('./opportunityScoring');

/**
 * PartnerLiftAnalysisService - Analyzes how much partnering improves opportunity win probability
 * 
 * This service quantifies the "lift" provided by strategic partnerships by:
 * 1. Analyzing individual supplier scores
 * 2. Creating a combined "virtual entity" from both partners  
 * 3. Calculating the combined entity's score
 * 4. Measuring the improvement (lift) over individual performance
 * 5. Providing partnership recommendations based on lift metrics
 * 
 * REFACTORED: Core logic moved to modular architecture in ./partnerLift/ directory
 * - EntityCombinator: Handles company combination logic
 * - LiftCalculator: Calculates partnership lift metrics
 * - ContributionAnalyzer: Implements Shapley value calculations
 * - StrategyGenerator: Generates partnership strategies
 * - PartnerLiftCore: Orchestrates all modules
 */
class PartnerLiftAnalysisService {
  constructor() {
    this.db = Database.getInstance();
    this.scoringService = new OpportunityScoringService();
    this.core = new PartnerLiftCore(this.db, this.scoringService);
  }

  /**
   * Algorithm 5: Partner Lift Analysis
   * Quantifies how partnering changes opportunity success probability
   * 
   * @param {number} companyAId - First company ID
   * @param {number} companyBId - Second company ID  
   * @param {number} opportunityId - Opportunity ID
   * @returns {Object} Complete partner lift analysis
   */
  async analyzePartnerLift(companyAId, companyBId, opportunityId) {
    try {
      logger.info(`Analyzing partner lift for companies ${companyAId} + ${companyBId} on opportunity ${opportunityId}`);

      // Delegate to modular core system
      const analysis = await this.core.analyzePartnershipLift(companyAId, companyBId, opportunityId);

      logger.info(`Partner lift analysis completed: ${analysis.liftAnalysis.lift.percentage.toFixed(1)}% lift (${analysis.recommendation.decision})`);
      return analysis;

    } catch (error) {
      logger.error('Partner lift analysis failed:', error);
      throw error;
    }
  }

  /**
   * Legacy method support - delegates to core modules
   */
  async scoreOpportunityFit(companyId, opportunityId) {
    return await this.scoringService.scoreOpportunityFit(companyId, opportunityId);
  }

  /**
   * Helper methods - delegated to core
   */
  assessCoordinationComplexity(companyA, companyB) {
    return this.core.assessCoordinationComplexity(companyA, companyB);
  }

  categorizeSynergy(liftPercentage) {
    return this.core.categorizeSynergy(liftPercentage);
  }

  assessCoordinationRisk(liftPercentage) {
    return this.core.assessCoordinationRisk(liftPercentage);
  }

  async storePartnerLiftAnalysis(companyAId, companyBId, opportunityId, liftAnalysis, contributions) {
    return await this.core.storePartnerLiftAnalysis(companyAId, companyBId, opportunityId, liftAnalysis, contributions);
  }

  async getCompany(companyId) {
    return await this.core.getCompany(companyId);
  }

  async getOpportunity(opportunityId) {
    return await this.core.getOpportunity(opportunityId);
  }
}

module.exports = { PartnerLiftAnalysisService };