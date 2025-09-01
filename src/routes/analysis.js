const express = require('express');
const { SupplierAnalysisService } = require('../services/supplierAnalysis');
const { OpportunityScoringService } = require('../services/opportunityScoring');
const { PartnershipMatchingService } = require('../services/partnershipMatching');
const { PartnerLiftAnalysisService } = require('../services/partnerLiftAnalysis');
const { EventRecommendationService } = require('../services/eventRecommendations');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature, addFeatureFlagsToRequest } = require('../middleware/featureFlags');

const router = express.Router();

// Initialize services
const supplierAnalysisService = new SupplierAnalysisService();
const opportunityScoringService = new OpportunityScoringService();
const partnershipMatchingService = new PartnershipMatchingService();
const partnerLiftAnalysisService = new PartnerLiftAnalysisService();
const eventRecommendationService = new EventRecommendationService();

/**
 * POST /api/analysis/comprehensive
 * Run comprehensive analysis using all 5 algorithms
 */
router.post('/comprehensive', authenticateToken, requireFeature('COMPREHENSIVE_SCORING'), async (req, res) => {
  try {
    const { companyId, opportunityIds = [], analysisOptions = {} } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const results = {
      companyId,
      analysisTimestamp: new Date().toISOString(),
      algorithms: {}
    };

    // Algorithm 1: Supplier Analysis
    try {
      results.algorithms.supplierAnalysis = await supplierAnalysisService.analyzeSupplier(
        companyId, 
        analysisOptions.supplierData
      );
    } catch (error) {
      results.algorithms.supplierAnalysis = { error: error.message };
    }

    // Algorithm 2: Partnership Matching
    try {
      results.algorithms.partnershipMatching = await partnershipMatchingService.findPartnershipMatches(
        companyId, 
        analysisOptions.partnershipOptions
      );
    } catch (error) {
      results.algorithms.partnershipMatching = { error: error.message };
    }

    // Algorithm 3: Opportunity Scoring (if opportunities provided)
    if (opportunityIds.length > 0) {
      results.algorithms.opportunityScoring = [];
      for (const opportunityId of opportunityIds.slice(0, 5)) { // Limit to 5 opportunities
        try {
          const scoring = await opportunityScoringService.scoreOpportunityFit(companyId, opportunityId);
          results.algorithms.opportunityScoring.push(scoring);
        } catch (error) {
          results.algorithms.opportunityScoring.push({
            opportunityId,
            error: error.message
          });
        }
      }
    }

    // Algorithm 4: Event Recommendations
    try {
      results.algorithms.eventRecommendations = await eventRecommendationService.recommendEvents(
        companyId, 
        analysisOptions.eventOptions
      );
    } catch (error) {
      results.algorithms.eventRecommendations = { error: error.message };
    }

    // Algorithm 5: Partnership Lift Analysis (if partnerships available)
    if (results.algorithms.partnershipMatching && 
        results.algorithms.partnershipMatching.topMatches && 
        results.algorithms.partnershipMatching.topMatches.length > 0) {
      try {
        const topPartner = results.algorithms.partnershipMatching.topMatches[0];
        results.algorithms.partnerLiftAnalysis = await partnerLiftAnalysisService.analyzePartnershipLift({
          companyA: { id: companyId },
          companyB: topPartner.partner,
          opportunities: opportunityIds
        });
      } catch (error) {
        results.algorithms.partnerLiftAnalysis = { error: error.message };
      }
    }

    // Generate summary insights
    results.summary = generateAnalysisSummary(results.algorithms);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error('Comprehensive analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete comprehensive analysis',
      details: error.message
    });
  }
});

/**
 * POST /api/analysis/compare-companies
 * Compare multiple companies across all analysis dimensions
 */
router.post('/compare-companies', authenticateToken, requireFeature('AI_OPPORTUNITY_SCORING'), async (req, res) => {
  try {
    const { companyIds, opportunityId } = req.body;
    
    if (!Array.isArray(companyIds) || companyIds.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 company IDs are required for comparison' 
      });
    }

    if (companyIds.length > 5) {
      return res.status(400).json({ 
        error: 'Maximum 5 companies supported for comparison' 
      });
    }

    const comparisons = [];
    
    for (const companyId of companyIds) {
      const comparison = {
        companyId,
        analyses: {}
      };

      // Supplier Analysis
      try {
        comparison.analyses.supplier = await supplierAnalysisService.analyzeSupplier(companyId);
      } catch (error) {
        comparison.analyses.supplier = { error: error.message };
      }

      // Opportunity Scoring (if opportunity provided)
      if (opportunityId) {
        try {
          comparison.analyses.opportunityFit = await opportunityScoringService.scoreOpportunityFit(
            companyId, 
            opportunityId
          );
        } catch (error) {
          comparison.analyses.opportunityFit = { error: error.message };
        }
      }

      comparisons.push(comparison);
    }

    // Generate comparison matrix
    const comparisonMatrix = generateComparisonMatrix(comparisons, opportunityId);

    res.json({
      success: true,
      data: {
        companies: companyIds,
        opportunityId,
        comparisons,
        comparisonMatrix,
        recommendations: generateComparisonRecommendations(comparisonMatrix)
      }
    });

  } catch (error) {
    logger.error('Company comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare companies',
      details: error.message
    });
  }
});

/**
 * GET /api/analysis/market-insights/:companyId
 * Generate market insights combining multiple algorithms
 */
router.get('/market-insights/:companyId', authenticateToken, requireFeature('MARKET_INTELLIGENCE'), async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Get supplier analysis for company capabilities
    const supplierAnalysis = await supplierAnalysisService.analyzeSupplier(companyId);
    
    // Get partnership matches for market positioning
    const partnershipMatches = await partnershipMatchingService.findPartnershipMatches(companyId);
    
    // Get event recommendations for market engagement
    const eventRecommendations = await eventRecommendationService.recommendEvents(companyId);

    // Generate market insights
    const marketInsights = {
      companyId,
      marketPosition: analyzeMarketPosition(supplierAnalysis, partnershipMatches),
      competitiveAdvantages: identifyCompetitiveAdvantages(supplierAnalysis),
      marketOpportunities: identifyMarketOpportunities(partnershipMatches, eventRecommendations),
      strategicRecommendations: generateStrategicRecommendations(
        supplierAnalysis, 
        partnershipMatches, 
        eventRecommendations
      )
    };

    res.json({
      success: true,
      data: marketInsights
    });

  } catch (error) {
    logger.error('Market insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate market insights',
      details: error.message
    });
  }
});

// Helper functions for analysis processing

function generateAnalysisSummary(algorithms) {
  const summary = {
    overallHealth: 'Good',
    keyStrengths: [],
    improvementAreas: [],
    topRecommendations: []
  };

  // Analyze supplier analysis results
  if (algorithms.supplierAnalysis && algorithms.supplierAnalysis.confidence > 0.8) {
    summary.keyStrengths.push('Strong supplier credibility profile');
  }

  // Analyze partnership potential
  if (algorithms.partnershipMatching && algorithms.partnershipMatching.totalMatches > 5) {
    summary.keyStrengths.push('High partnership potential in market');
  }

  // Analyze opportunity scores
  if (algorithms.opportunityScoring && algorithms.opportunityScoring.length > 0) {
    const avgScore = algorithms.opportunityScoring
      .filter(s => !s.error)
      .reduce((sum, s) => sum + s.overallScore, 0) / algorithms.opportunityScoring.length;
    
    if (avgScore > 70) {
      summary.keyStrengths.push('Strong opportunity-fit alignment');
    } else {
      summary.improvementAreas.push('Opportunity targeting needs refinement');
    }
  }

  // Generate recommendations
  summary.topRecommendations = [
    'Focus on highest-scoring opportunities first',
    'Explore strategic partnerships to expand capabilities',
    'Attend recommended networking events for market presence',
    'Continuously update company profile and capabilities'
  ];

  return summary;
}

function generateComparisonMatrix(comparisons, opportunityId) {
  const matrix = {
    metrics: {
      credibilityScore: {},
      opportunityFit: {},
      partnershipPotential: {}
    }
  };

  comparisons.forEach(comp => {
    const companyId = comp.companyId;
    
    // Credibility scores
    if (comp.analyses.supplier && comp.analyses.supplier.updatedProfile) {
      matrix.metrics.credibilityScore[companyId] = comp.analyses.supplier.updatedProfile.credibility_score;
    }

    // Opportunity fit scores
    if (comp.analyses.opportunityFit && !comp.analyses.opportunityFit.error) {
      matrix.metrics.opportunityFit[companyId] = comp.analyses.opportunityFit.overallScore;
    }
  });

  return matrix;
}

function generateComparisonRecommendations(matrix) {
  const recommendations = [];

  // Find highest scoring companies
  const credibilityScores = Object.entries(matrix.metrics.credibilityScore);
  const opportunityScores = Object.entries(matrix.metrics.opportunityFit);

  if (credibilityScores.length > 0) {
    const topCredibility = credibilityScores.sort((a, b) => b[1] - a[1])[0];
    recommendations.push(`Company ${topCredibility[0]} has the highest credibility score (${topCredibility[1]})`);
  }

  if (opportunityScores.length > 0) {
    const topOpportunity = opportunityScores.sort((a, b) => b[1] - a[1])[0];
    recommendations.push(`Company ${topOpportunity[0]} is the best fit for this opportunity (${topOpportunity[1]}% match)`);
  }

  return recommendations;
}

function analyzeMarketPosition(supplierAnalysis, partnershipMatches) {
  return {
    credibilityLevel: supplierAnalysis.confidence > 0.85 ? 'High' : 
                     supplierAnalysis.confidence > 0.7 ? 'Medium' : 'Developing',
    partnershipPotential: partnershipMatches.totalMatches > 10 ? 'High' : 
                         partnershipMatches.totalMatches > 5 ? 'Medium' : 'Limited',
    marketReadiness: 'Ready for growth'
  };
}

function identifyCompetitiveAdvantages(supplierAnalysis) {
  const advantages = [];
  
  if (supplierAnalysis.extractedCapabilities.length > 8) {
    advantages.push('Diverse capability portfolio');
  }
  
  if (supplierAnalysis.credibilitySignals.websiteQuality > 0.8) {
    advantages.push('Strong online presence');
  }
  
  if (supplierAnalysis.credibilitySignals.teamExpertise > 0.9) {
    advantages.push('Exceptional team expertise');
  }

  return advantages;
}

function identifyMarketOpportunities(partnershipMatches, eventRecommendations) {
  const opportunities = [];
  
  if (partnershipMatches.partnershipBundles.length > 0) {
    opportunities.push('Strategic partnership expansion available');
  }
  
  if (eventRecommendations.topEvents && eventRecommendations.topEvents.length > 3) {
    opportunities.push('Strong networking and visibility opportunities');
  }

  return opportunities;
}

function generateStrategicRecommendations(supplierAnalysis, partnershipMatches, eventRecommendations) {
  const recommendations = [];
  
  // Partnership recommendations
  if (partnershipMatches.totalMatches > 5) {
    recommendations.push({
      priority: 'High',
      action: 'Pursue strategic partnerships',
      reasoning: 'Strong partnership potential identified in market'
    });
  }

  // Event recommendations
  if (eventRecommendations.topEvents && eventRecommendations.topEvents.length > 0) {
    recommendations.push({
      priority: 'Medium',
      action: 'Increase market presence through events',
      reasoning: 'High-value networking opportunities available'
    });
  }

  // Capability recommendations
  if (supplierAnalysis.recommendations.length > 0) {
    recommendations.push({
      priority: 'Medium',
      action: 'Strengthen online presence and documentation',
      reasoning: 'Analysis identified improvement opportunities'
    });
  }

  return recommendations;
}

/**
 * GET /api/analysis/comprehensive
 * Get comprehensive analysis capabilities (for authentication testing)
 */
router.get('/comprehensive', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Comprehensive analysis endpoint available',
    algorithms: ['supplierAnalysis', 'partnershipMatching', 'opportunityScoring', 'eventRecommendations', 'partnerLiftAnalysis']
  });
});
module.exports = router;
