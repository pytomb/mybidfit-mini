const { EntityCombinator } = require('./EntityCombinator');
const { LiftCalculator } = require('./LiftCalculator');
const { ContributionAnalyzer } = require('./ContributionAnalyzer');
const { StrategyGenerator } = require('./StrategyGenerator');
const { logger } = require('../../utils/logger');

/**
 * PartnerLiftCore - Main orchestrator for partner lift analysis
 * Coordinates between specialized analysis modules
 */
class PartnerLiftCore {
  constructor(db, supplierAnalysisService) {
    this.db = db;
    this.supplierAnalysisService = supplierAnalysisService;
    
    this.entityCombinator = new EntityCombinator();
    this.liftCalculator = new LiftCalculator();
    this.contributionAnalyzer = new ContributionAnalyzer();
    this.strategyGenerator = new StrategyGenerator();
  }

  /**
   * Main entry point for partner lift analysis
   * @param {number} companyAId - First company ID
   * @param {number} companyBId - Second company ID  
   * @param {number} opportunityId - Opportunity ID
   * @returns {Object} Complete partner lift analysis
   */
  async analyzePartnershipLift(companyAId, companyBId, opportunityId) {
    try {
      logger.info(`Starting partner lift analysis: ${companyAId} + ${companyBId} for opportunity ${opportunityId}`);

      // 1. Fetch entities
      const [companyA, companyB, opportunity] = await Promise.all([
        this.getCompany(companyAId),
        this.getCompany(companyBId),  
        this.getOpportunity(opportunityId)
      ]);

      // 2. Calculate individual scores
      const [scoreA, scoreB] = await Promise.all([
        this.supplierAnalysisService.calculateSupplierScore(companyA, opportunity),
        this.supplierAnalysisService.calculateSupplierScore(companyB, opportunity)
      ]);

      // 3. Create combined entity
      const combinedEntity = this.entityCombinator.createCombinedEntity(companyA, companyB);
      
      // 4. Calculate combined score  
      const combinedScore = await this.supplierAnalysisService.calculateSupplierScore(combinedEntity, opportunity);

      // 5. Analyze lift and improvements
      const liftAnalysis = this.liftCalculator.calculateLift(scoreA, scoreB, combinedScore);
      const requirementImprovements = this.liftCalculator.identifyRequirementImprovements(
        scoreA, scoreB, combinedScore, opportunity
      );

      // 6. Calculate contributions using Shapley values
      const contributions = this.contributionAnalyzer.calculateShapleyValues(scoreA, scoreB, combinedScore);
      const keyContributionsA = this.contributionAnalyzer.identifyKeyContributions(scoreA, combinedScore, companyA);
      const keyContributionsB = this.contributionAnalyzer.identifyKeyContributions(scoreB, combinedScore, companyB);

      // 7. Generate partnership strategy
      const strategy = this.strategyGenerator.generatePartnershipStrategy(
        companyA, companyB, liftAnalysis, requirementImprovements, contributions
      );

      // 8. Store analysis results
      await this.storePartnerLiftAnalysis(companyAId, companyBId, opportunityId, liftAnalysis, contributions);

      // 9. Compile final analysis
      const analysis = {
        metadata: {
          companyA: { id: companyA.id, name: companyA.name },
          companyB: { id: companyB.id, name: companyB.name },
          opportunity: { id: opportunity.id, title: opportunity.title },
          analyzedAt: new Date().toISOString()
        },
        individualScores: {
          companyA: scoreA,
          companyB: scoreB
        },
        combinedScore,
        combinedEntity,
        liftAnalysis,
        requirementImprovements,
        contributions: {
          ...contributions,
          keyContributionsA,
          keyContributionsB
        },
        strategy,
        recommendation: this.strategyGenerator.generateRecommendation(liftAnalysis)
      };

      logger.info(`Partner lift analysis completed: ${liftAnalysis.lift.percentage.toFixed(1)}% lift`);
      return analysis;

    } catch (error) {
      logger.error('Partner lift analysis failed:', error);
      throw error;
    }
  }

  /**
   * Calculate coordination complexity between two companies
   */
  assessCoordinationComplexity(companyA, companyB) {
    let complexity = 0;
    
    // Different sizes increase complexity
    if (companyA.size_category !== companyB.size_category) {
      complexity += 2;
    }
    
    // Different locations increase complexity
    if (companyA.headquarters_state !== companyB.headquarters_state) {
      complexity += 1;
    }
    
    // Many overlapping capabilities increase complexity
    const sharedCaps = (companyA.capabilities || []).filter(
      cap => (companyB.capabilities || []).includes(cap)
    );
    if (sharedCaps.length > 3) {
      complexity += 1;
    }
    
    return Math.min(5, complexity);
  }

  /**
   * Categorize synergy level
   */
  categorizeSynergy(liftPercentage) {
    if (liftPercentage > 40) return 'exceptional';
    if (liftPercentage > 25) return 'strong';
    if (liftPercentage > 15) return 'moderate';
    if (liftPercentage > 5) return 'minimal';
    return 'negligible';
  }

  /**
   * Assess coordination risk
   */
  assessCoordinationRisk(liftPercentage) {
    // Higher lifts often come with higher coordination risks
    if (liftPercentage > 50) return 0.4;
    if (liftPercentage > 30) return 0.3;
    if (liftPercentage > 15) return 0.2;
    return 0.1;
  }

  /**
   * Store analysis results
   */
  async storePartnerLiftAnalysis(companyAId, companyBId, opportunityId, liftAnalysis, contributions) {
    try {
      // Store the analysis results in partnership_recommendations table
      await this.db.query(`
        UPDATE partnership_recommendations 
        SET 
          estimated_value_increase = $3,
          recommended_for_opportunities = array_append(recommended_for_opportunities, $4),
          updated_at = NOW()
        WHERE company_a_id = $1 AND company_b_id = $2
      `, [
        companyAId,
        companyBId,
        liftAnalysis.lift.percentage,
        opportunityId
      ]);
    } catch (error) {
      logger.error('Failed to store partner lift analysis:', error);
    }
  }

  /**
   * Get company by ID
   */
  async getCompany(companyId) {
    const result = await this.db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (result.rows.length === 0) throw new Error('Company not found');
    return result.rows[0];
  }

  /**
   * Get opportunity by ID
   */
  async getOpportunity(opportunityId) {
    const result = await this.db.query('SELECT * FROM opportunities WHERE id = $1', [opportunityId]);
    if (result.rows.length === 0) throw new Error('Opportunity not found');
    return result.rows[0];
  }
}

module.exports = { PartnerLiftCore };