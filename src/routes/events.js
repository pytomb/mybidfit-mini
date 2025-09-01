const express = require('express');
const { EventRecommendationService } = require('../services/eventRecommendations');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureFlags');

const router = express.Router();
const eventRecommendationService = new EventRecommendationService();

/**
 * POST /api/events/recommend
 * Get event recommendations for a company
 */
router.post('/recommend', authenticateToken, requireFeature('EVENT_RECOMMENDATIONS'), async (req, res) => {
  try {
    const { companyId, options = {} } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const recommendations = await eventRecommendationService.recommendEvents(companyId, options);
    
    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Event recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate event recommendations',
      details: error.message
    });
  }
});

/**
 * GET /api/events/:companyId/recommendations
 * Get stored event recommendations for a company
 */
router.get('/:companyId/recommendations', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { limit = 10, eventType, minScore } = req.query;
    
    // This would need a new method to query event_recommendations table
    res.json({
      success: true,
      data: {
        companyId,
        filters: { limit, eventType, minScore },
        recommendations: [],
        message: 'Stored event recommendations endpoint - to be implemented with database query'
      }
    });

  } catch (error) {
    console.error('Event recommendations retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve event recommendations',
      details: error.message
    });
  }
});

/**
 * POST /api/events/portfolio-optimization
 * Optimize event portfolio within budget constraints
 */
router.post('/portfolio-optimization', authenticateToken, async (req, res) => {
  try {
    const { companyId, budget = 5000, timeframe = 'monthly', constraints = {} } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Get event recommendations first
    const recommendations = await eventRecommendationService.recommendEvents(companyId, { budget });
    
    // Extract optimized portfolio
    const portfolio = recommendations.monthlyPortfolio;
    
    res.json({
      success: true,
      data: {
        companyId,
        optimization: {
          budget,
          timeframe,
          constraints,
          portfolio,
          utilizationRate: portfolio.utilizationRate,
          expectedROI: {
            leads: portfolio.expectedLeads,
            revenue: portfolio.expectedRevenue,
            costPerLead: Math.round(portfolio.totalCost / portfolio.expectedLeads)
          },
          diversification: portfolio.diversification
        }
      }
    });

  } catch (error) {
    logger.error('Portfolio optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize event portfolio',
      details: error.message
    });
  }
});

/**
 * POST /api/events/roi-analysis
 * Detailed ROI analysis for specific events or portfolios
 */
router.post('/roi-analysis', authenticateToken, async (req, res) => {
  try {
    const { companyId, events } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array is required' });
    }

    // Get company data for ROI calculation context
    const company = await eventRecommendationService.getCompany(companyId);
    
    const roiAnalysis = events.map(event => {
      const roi = eventRecommendationService.calculateEventROI(event, company);
      return {
        eventName: event.name,
        eventType: event.type,
        cost: event.cost,
        roi: roi,
        recommendation: roi.roiPercentage > 200 ? 'Highly Recommended' :
                      roi.roiPercentage > 100 ? 'Recommended' :
                      roi.roiPercentage > 0 ? 'Marginal' : 'Not Recommended'
      };
    });
    
    res.json({
      success: true,
      data: {
        companyId,
        totalEvents: events.length,
        averageROI: Math.round(roiAnalysis.reduce((sum, a) => sum + a.roi.roiPercentage, 0) / roiAnalysis.length),
        analysis: roiAnalysis
      }
    });

  } catch (error) {
    console.error('ROI analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform ROI analysis',
      details: error.message
    });
  }
});

/**
 * POST /api/events/investment-strategy
 * Generate investment strategy recommendations
 */
router.post('/investment-strategy', authenticateToken, async (req, res) => {
  try {
    const { companyId, budget, goals = [] } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Get event recommendations to base strategy on
    const recommendations = await eventRecommendationService.recommendEvents(companyId, { budget });
    
    res.json({
      success: true,
      data: {
        companyId,
        strategy: recommendations.investmentStrategy,
        projectedOutcomes: recommendations.expectedOutcomes,
        budgetAllocation: {
          recommended: recommendations.investmentStrategy.recommendedMonthlyBudget,
          proposed: budget,
          efficiency: budget ? Math.round((recommendations.monthlyPortfolio.expectedRevenue / budget) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('Investment strategy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate investment strategy',
      details: error.message
    });
  }
});

module.exports = router;essage
    });
  }
});

module.exports = router;