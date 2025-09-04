/**
 * Enhanced Opportunity Scoring Service with Graph Relationship Intelligence
 * 
 * This service extends the basic Panel of Judges scoring system with multi-hop
 * relationship analysis using the GraphQueryService for richer context.
 */

const { OpportunityScoringService } = require('./opportunityScoring');
const GraphQueryService = require('./GraphQueryService');
const { logger } = require('../utils/logger');

class EnhancedOpportunityScoringService extends OpportunityScoringService {
  constructor() {
    super();
    this.graphService = new GraphQueryService();
    
    // Enhanced judges that utilize graph relationship data
    this.enhancedJudges = {
      technical: new GraphEnhancedTechnicalJudge(this.graphService),
      domain: new GraphEnhancedDomainJudge(this.graphService),
      value: new GraphEnhancedValueJudge(this.graphService),
      innovation: new GraphEnhancedInnovationJudge(this.graphService),
      relationship: new GraphEnhancedRelationshipJudge(this.graphService)
    };
  }

  /**
   * Enhanced scoring with graph relationship context
   * @param {number} companyId - Company ID
   * @param {number} opportunityId - Opportunity ID
   * @returns {Promise<Object>} Enhanced scoring results with relationship context
   */
  async scoreOpportunityFitEnhanced(companyId, opportunityId) {
    try {
      logger.info(`Enhanced graph-aware scoring: opportunity ${opportunityId} for company ${companyId}`);

      // Get basic company and opportunity data
      const [company, opportunity] = await Promise.all([
        this.getCompany(companyId),
        this.getOpportunity(opportunityId)
      ]);

      // Get graph relationship context
      const relationshipContext = await this.graphService.findConnectedEntities(
        companyId, 'company', 3, // 3 degrees of separation
        ['worked_with', 'competes_for', 'partners_with', 'bid_on', 'similar_to']
      );

      // Get existing partnership recommendations
      const potentialPartners = await this.graphService.findPotentialPartners(companyId, 5);

      // Enhanced scoring with graph context
      const enhancedScoring = await this.scoreOpportunityWithGraph(
        company, opportunity, relationshipContext, potentialPartners
      );

      // Store enhanced results
      await this.storeEnhancedScoringResults(
        companyId, opportunityId, enhancedScoring, relationshipContext
      );

      logger.info(`Enhanced scoring complete: ${enhancedScoring.overallScore}% (vs ${enhancedScoring.basicScore}% basic)`);

      return {
        ...enhancedScoring,
        companyId,
        opportunityId,
        companyName: company.name,
        opportunityTitle: opportunity.title,
        graphEnhancementBonus: enhancedScoring.overallScore - enhancedScoring.basicScore,
        relationshipInsights: this.generateRelationshipInsights(relationshipContext, potentialPartners)
      };

    } catch (error) {
      logger.error('Enhanced opportunity scoring failed:', error);
      throw error;
    }
  }

  /**
   * Core enhanced scoring logic with graph relationships
   * @private
   */
  async scoreOpportunityWithGraph(company, opportunity, relationships, partners) {
    // Get basic score first
    const basicScoring = await this.scoreOpportunity(company, opportunity);
    
    if (!basicScoring || basicScoring.overallScore === 0) {
      return basicScoring; // Hard constraints failed, graph can't help
    }

    // Run enhanced judges with graph context
    const enhancedEvaluations = await this.runEnhancedPanelOfJudges(
      company, opportunity, relationships, partners
    );

    // Calculate enhanced overall score
    const enhancedOverallScore = this.calculateEnhancedOverallScore(
      enhancedEvaluations, basicScoring.overallScore
    );

    // Generate enhanced recommendations
    const enhancedRecommendations = this.generateEnhancedRecommendations(
      enhancedEvaluations, relationships, partners, company, opportunity
    );

    return {
      ...basicScoring,
      basicScore: basicScoring.overallScore,
      overallScore: enhancedOverallScore,
      enhancedJudgeScores: enhancedEvaluations,
      enhancedRecommendations,
      relationshipContext: relationships.slice(0, 10), // Top 10 relationships
      partnershipOpportunities: partners.slice(0, 5), // Top 5 potential partners
      graphMetrics: {
        totalRelationships: relationships.length,
        strongRelationships: relationships.filter(r => r.total_strength > 0.7).length,
        partnershipOptions: partners.length,
        networkCentrality: await this.graphService.calculateEntityCentrality(company.id, 'company')
      }
    };
  }

  /**
   * Run enhanced panel of judges with graph context
   * @private
   */
  async runEnhancedPanelOfJudges(company, opportunity, relationships, partners) {
    const evaluations = {};

    // Each enhanced judge evaluates with graph context
    for (const [judgeName, judge] of Object.entries(this.enhancedJudges)) {
      evaluations[judgeName] = await judge.evaluateWithGraph(
        company, opportunity, relationships, partners
      );
    }

    return evaluations;
  }

  /**
   * Calculate enhanced overall score
   * @private
   */
  calculateEnhancedOverallScore(enhancedEvaluations, basicScore) {
    const weights = {
      technical: 0.25,
      domain: 0.25,
      value: 0.20,
      innovation: 0.15,
      relationship: 0.15 // Increased weight for relationship judge in graph-enhanced mode
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [judge, evaluation] of Object.entries(enhancedEvaluations)) {
      const weight = weights[judge] || 0.2;
      weightedSum += evaluation.score * weight;
      totalWeight += weight;
    }

    const enhancedScore = weightedSum / totalWeight;

    // Apply graph enhancement bonus (max 15% improvement over basic)
    const maxImprovement = Math.min(15, enhancedScore - basicScore);
    const finalScore = Math.min(100, basicScore + maxImprovement);

    return Math.round(finalScore);
  }

  /**
   * Generate relationship insights summary
   * @private
   */
  generateRelationshipInsights(relationships, partners) {
    const insights = [];

    // Strong network connections
    const strongConnections = relationships.filter(r => r.total_strength > 0.8);
    if (strongConnections.length > 0) {
      insights.push({
        type: 'network_strength',
        title: 'Strong Network Connections',
        description: `You have ${strongConnections.length} strong network connections that could provide references, introductions, or collaboration opportunities.`,
        impact: 'positive'
      });
    }

    // Partnership opportunities
    if (partners.length > 0) {
      const topPartner = partners[0];
      insights.push({
        type: 'partnership_opportunity',
        title: 'Strategic Partnership Available',
        description: `Partnership with ${topPartner.name} could increase win probability by leveraging complementary capabilities.`,
        impact: 'positive',
        actionable: true,
        partnerId: topPartner.id
      });
    }

    // Similar opportunity experience
    const similarOpportunities = relationships.filter(r => 
      r.connected_entity_type === 'opportunity' && r.total_strength > 0.6
    );
    if (similarOpportunities.length > 0) {
      insights.push({
        type: 'experience_match',
        title: 'Relevant Experience',
        description: `Your network shows connections to ${similarOpportunities.length} similar opportunities, indicating relevant experience.`,
        impact: 'positive'
      });
    }

    // Network gaps
    if (relationships.length < 5) {
      insights.push({
        type: 'network_gap',
        title: 'Limited Network Presence',
        description: 'Consider building more relationships in your target market to improve future opportunities.',
        impact: 'neutral',
        actionable: true
      });
    }

    return insights;
  }

  /**
   * Generate enhanced recommendations with graph context
   * @private
   */
  generateEnhancedRecommendations(evaluations, relationships, partners, company, opportunity) {
    const recommendations = [];

    // Basic recommendations from enhanced judges
    for (const [judgeName, evaluation] of Object.entries(evaluations)) {
      if (evaluation.graphRecommendations && evaluation.graphRecommendations.length > 0) {
        recommendations.push(...evaluation.graphRecommendations);
      }
    }

    // Strategic partnership recommendations
    if (partners.length > 0) {
      const topPartner = partners[0];
      if (topPartner.overall_score > 75) {
        recommendations.push({
          type: 'strategic_partnership',
          priority: 'high',
          title: `Partner with ${topPartner.name}`,
          description: `Strategic partnership could increase bid strength by ${Math.round(topPartner.complementarity_score)}% through complementary capabilities.`,
          action: 'Reach out for partnership discussion',
          partnerId: topPartner.id,
          expectedImpact: '+15-25 points'
        });
      }
    }

    // Network leverage recommendations
    const strongConnections = relationships.filter(r => r.total_strength > 0.7);
    if (strongConnections.length > 0) {
      recommendations.push({
        type: 'network_leverage',
        priority: 'medium',
        title: 'Leverage Network Connections',
        description: `You have ${strongConnections.length} strong network connections that could provide references or introductions.`,
        action: 'Request references or introductions from network connections',
        expectedImpact: '+5-10 points'
      });
    }

    return recommendations.slice(0, 10); // Limit to top 10
  }

  /**
   * Store enhanced scoring results
   * @private
   */
  async storeEnhancedScoringResults(companyId, opportunityId, results, relationships) {
    try {
      // Store basic results using parent method
      await this.storeScoringResults(companyId, opportunityId, results.overallScore, results.enhancedJudgeScores);

      // Store relationship context in metadata
      await this.db.query(`
        UPDATE scoring_results 
        SET supporting_evidence = $3,
            analysis_version = 'enhanced_v1'
        WHERE company_id = $1 AND opportunity_id = $2
      `, [
        companyId,
        opportunityId,
        JSON.stringify({
          basicScore: results.basicScore,
          enhancedScore: results.overallScore,
          graphEnhancementBonus: results.overallScore - results.basicScore,
          relationshipCount: relationships.length,
          strongRelationshipCount: relationships.filter(r => r.total_strength > 0.7).length,
          judgeEvaluations: results.enhancedJudgeScores
        })
      ]);

      // Store relationship context for this analysis
      for (const relationship of relationships.slice(0, 5)) { // Store top 5 relationships
        await this.graphService.createRelationship(
          companyId, 'company',
          relationship.connected_entity_id, relationship.connected_entity_type,
          'analyzed_with', relationship.total_strength, 0.9,
          { 
            opportunityId, 
            analysisDate: new Date().toISOString(),
            impactOnScore: results.overallScore - results.basicScore
          }
        );
      }

    } catch (error) {
      logger.error('Failed to store enhanced scoring results:', error);
    }
  }
}

/**
 * Graph-Enhanced Technical Judge
 */
class GraphEnhancedTechnicalJudge {
  constructor(graphService) {
    this.graphService = graphService;
  }

  async evaluateWithGraph(company, opportunity, relationships, partners) {
    // Start with basic technical evaluation
    const basicEval = await this.basicTechnicalEvaluation(company, opportunity);
    
    // Apply graph enhancements
    const graphEnhancements = await this.applyGraphEnhancements(
      company, opportunity, relationships, partners, basicEval.score
    );

    return {
      ...basicEval,
      score: Math.min(100, basicEval.score + graphEnhancements.bonus),
      graphEnhancements,
      graphRecommendations: graphEnhancements.recommendations
    };
  }

  async basicTechnicalEvaluation(company, opportunity) {
    // Implement basic technical evaluation logic (similar to original TechnicalJudge)
    let score = 50;
    const evidence = [];
    const recommendations = [];

    const requiredCaps = opportunity.required_capabilities || [];
    const companyCaps = company.capabilities || [];
    const matchedCaps = requiredCaps.filter(cap => companyCaps.includes(cap));
    const capMatchRatio = requiredCaps.length > 0 ? matchedCaps.length / requiredCaps.length : 1;
    
    score += capMatchRatio * 30;
    
    if (capMatchRatio < 1) {
      recommendations.push(`Develop capabilities in: ${requiredCaps.filter(c => !companyCaps.includes(c)).join(', ')}`);
    }
    
    evidence.push(`Matches ${matchedCaps.length}/${requiredCaps.length} required technical capabilities`);

    return {
      score: Math.min(100, score),
      verdict: score >= 70 ? 'O' : 'X',
      confidence: 0.88,
      reasoning: `Technical evaluation based on capabilities match (${Math.round(capMatchRatio * 100)}%)`,
      evidence,
      recommendations
    };
  }

  async applyGraphEnhancements(company, opportunity, relationships, partners, baseScore) {
    let bonus = 0;
    const recommendations = [];
    const enhancements = [];

    // Check for partners with missing technical capabilities
    const requiredCaps = opportunity.required_capabilities || [];
    const companyCaps = company.capabilities || [];
    const missingCaps = requiredCaps.filter(cap => !companyCaps.includes(cap));

    if (missingCaps.length > 0) {
      for (const partner of partners) {
        const partnerCaps = partner.capabilities || [];
        const partnerCoversGaps = missingCaps.filter(cap => partnerCaps.includes(cap));
        
        if (partnerCoversGaps.length > 0) {
          const gapCoverage = partnerCoversGaps.length / missingCaps.length;
          const partnerBonus = Math.min(15, gapCoverage * 20 * (partner.complementarity_score / 100));
          bonus += partnerBonus;
          
          enhancements.push(`Partner ${partner.name} covers ${partnerCoversGaps.length} missing technical capabilities`);
          recommendations.push({
            type: 'technical_partnership',
            description: `Partner with ${partner.name} to cover missing capabilities: ${partnerCoversGaps.join(', ')}`,
            impact: `+${Math.round(partnerBonus)} points`
          });
          
          break; // Only use best partner
        }
      }
    }

    // Check for relevant technical experience in network
    const technicalExperience = relationships.filter(r => 
      r.connected_entity_type === 'opportunity' && 
      r.total_strength > 0.6
    ).length;

    if (technicalExperience > 2) {
      bonus += Math.min(10, technicalExperience * 2);
      enhancements.push(`Network shows ${technicalExperience} relevant technical projects`);
    }

    return {
      bonus: Math.round(bonus),
      enhancements,
      recommendations
    };
  }
}

/**
 * Graph-Enhanced Relationship Judge - Most significantly enhanced
 */
class GraphEnhancedRelationshipJudge {
  constructor(graphService) {
    this.graphService = graphService;
  }

  async evaluateWithGraph(company, opportunity, relationships, partners) {
    // Relationship judge benefits most from graph data
    let score = 30; // Lower base score, let graph data drive it
    const evidence = [];
    const recommendations = [];

    // Network centrality bonus
    const centrality = await this.graphService.calculateEntityCentrality(company.id, 'company');
    if (centrality && centrality.centrality_score > 10) {
      score += Math.min(25, centrality.centrality_score * 2);
      evidence.push(`Strong network position with centrality score: ${centrality.centrality_score}`);
    }

    // Direct relationship to buyer/industry
    const relevantConnections = relationships.filter(r => 
      (r.connected_entity_type === 'company' && r.total_strength > 0.7) ||
      (r.connected_entity_type === 'opportunity' && r.total_strength > 0.6)
    );

    score += Math.min(30, relevantConnections.length * 3);
    evidence.push(`${relevantConnections.length} strong industry/buyer connections`);

    // Partnership potential bonus
    if (partners.length > 0) {
      const bestPartner = partners[0];
      if (bestPartner.overall_score > 70) {
        score += 15;
        evidence.push(`Strong partnership option with ${bestPartner.name} (${bestPartner.overall_score}% fit)`);
        recommendations.push({
          type: 'strategic_relationship',
          description: `Leverage partnership with ${bestPartner.name} for stronger buyer relationships`,
          impact: '+15 points'
        });
      }
    }

    const verdict = score >= 70 ? 'O' : 'X';

    return {
      score: Math.min(100, score),
      verdict,
      confidence: 0.92, // Higher confidence with graph data
      reasoning: 'Graph-enhanced relationship assessment based on network analysis and partnership potential',
      evidence,
      recommendations,
      graphRecommendations: recommendations
    };
  }
}

// Placeholder enhanced judges (implement similar patterns)
class GraphEnhancedDomainJudge {
  constructor(graphService) { this.graphService = graphService; }
  async evaluateWithGraph(company, opportunity, relationships, partners) {
    // TODO: Implement domain expertise enhancement using industry relationship data
    return { score: 75, verdict: 'O', confidence: 0.8, reasoning: 'Graph-enhanced domain evaluation', evidence: [], recommendations: [] };
  }
}

class GraphEnhancedValueJudge {
  constructor(graphService) { this.graphService = graphService; }
  async evaluateWithGraph(company, opportunity, relationships, partners) {
    // TODO: Implement value enhancement using cost/partnership data
    return { score: 70, verdict: 'O', confidence: 0.78, reasoning: 'Graph-enhanced value evaluation', evidence: [], recommendations: [] };
  }
}

class GraphEnhancedInnovationJudge {
  constructor(graphService) { this.graphService = graphService; }
  async evaluateWithGraph(company, opportunity, relationships, partners) {
    // TODO: Implement innovation enhancement using technology network data
    return { score: 65, verdict: 'X', confidence: 0.75, reasoning: 'Graph-enhanced innovation evaluation', evidence: [], recommendations: [] };
  }
}

module.exports = { EnhancedOpportunityScoringService };