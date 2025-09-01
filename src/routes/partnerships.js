const express = require('express');
const { PartnershipMatchingService } = require('../services/partnershipMatching');
const { PartnerLiftAnalysisService } = require('../services/partnerLiftAnalysis');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature, addFeatureFlagsToRequest } = require('../middleware/featureFlags');

const router = express.Router();
const partnershipMatchingService = new PartnershipMatchingService();
const partnerLiftAnalysisService = new PartnerLiftAnalysisService();

/**
 * POST /api/partnerships/find-matches
 * Find potential partnership matches for a company
 */
router.post('/find-matches', authenticateToken, requireFeature('PARTNERSHIP_MATCHING'), async (req, res) => {
  try {
    const { companyId, options = {} } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const matches = await partnershipMatchingService.findPartnershipMatches(companyId, options);
    
    res.json({
      success: true,
      data: matches
    });

  } catch (error) {
    console.error('Partnership matching error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find partnership matches',
      details: error.message
    });
  }
});

/**
 * POST /api/partnerships/analyze-lift
 * Analyze the value lift from a potential partnership
 */
router.post('/analyze-lift', authenticateToken, requireFeature('PARTNERSHIP_MATCHING'), async (req, res) => {
  try {
    const { partnershipData } = req.body;
    
    if (!partnershipData || !partnershipData.companyA || !partnershipData.companyB) {
      return res.status(400).json({ 
        error: 'Partnership data with companyA and companyB is required' 
      });
    }

    const liftAnalysis = await partnerLiftAnalysisService.analyzePartnershipLift(partnershipData);
    
    res.json({
      success: true,
      data: liftAnalysis
    });

  } catch (error) {
    logger.error('Partnership lift analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze partnership lift',
      details: error.message
    });
  }
});

/**
 * POST /api/partnerships/multi-partner-analysis
 * Analyze complex multi-partner scenarios
 */
router.post('/multi-partner-analysis', authenticateToken, async (req, res) => {
  try {
    const { companies, opportunities } = req.body;
    
    if (!Array.isArray(companies) || companies.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 companies are required for multi-partner analysis' 
      });
    }

    if (companies.length > 5) {
      return res.status(400).json({ 
        error: 'Maximum 5 companies supported for multi-partner analysis' 
      });
    }

    const multiPartnerAnalysis = await partnerLiftAnalysisService.analyzeMultiPartnerScenario(
      companies, 
      opportunities
    );
    
    res.json({
      success: true,
      data: multiPartnerAnalysis
    });

  } catch (error) {
    console.error('Multi-partner analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze multi-partner scenario',
      details: error.message
    });
  }
});

/**
 * GET /api/partnerships/:companyId/recommendations
 * Get stored partnership recommendations for a company
 */
router.get('/:companyId/recommendations', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { limit = 10, minScore = 60 } = req.query;
    
    // This would need a new method in the service to query partnership_recommendations table
    res.json({
      success: true,
      data: {
        companyId,
        recommendations: [],
        message: 'Partnership recommendations endpoint - to be implemented with database query'
      }
    });

  } catch (error) {
    logger.error('Partnership recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve partnership recommendations',
      details: error.message
    });
  }
});

/**
 * POST /api/partnerships/shapley-analysis
 * Detailed Shapley value analysis for partnership contributions
 */
router.post('/shapley-analysis', authenticateToken, async (req, res) => {
  try {
    const { partnership, opportunities } = req.body;
    
    if (!partnership || !opportunities) {
      return res.status(400).json({ 
        error: 'Partnership data and opportunities are required' 
      });
    }

    const shapleyAnalysis = await partnerLiftAnalysisService.calculateShapleyContributions(
      partnership, 
      opportunities
    );
    
    res.json({
      success: true,
      data: shapleyAnalysis
    });

  } catch (error) {
    logger.error('Shapley analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform Shapley analysis',
      details: error.message
    });
  }
});

/**
 * POST /api/partnerships/partnership-bundles
 * Create optimized partnership bundles based on different strategies
 */
router.post('/partnership-bundles', authenticateToken, async (req, res) => {
  try {
    const { companyId, strategy = 'all' } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // First get partnership matches
    const matches = await partnershipMatchingService.findPartnershipMatches(companyId);
    
    // Create different bundle strategies
    const bundles = partnershipMatchingService.createPartnershipBundles(
      { id: companyId }, 
      matches.topMatches
    );
    
    res.json({
      success: true,
      data: {
        companyId,
        strategy,
        bundles,
        totalPartners: matches.totalMatches
      }
    });

  } catch (error) {
    console.error('Partnership bundles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create partnership bundles',
      details: error.message
    });
  }
});

module.exports = router;