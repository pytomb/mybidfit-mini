const express = require('express');
const { OpportunityScoringService } = require('../services/opportunityScoring');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureFlags');
const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');
const { checkUsageLimit, addUsageInfo, updateAnalysisCount } = require('../middleware/usageTracking');

const router = express.Router();
const opportunityScoringService = new OpportunityScoringService();

/**
 * POST /api/opportunities
 * Create a new opportunity (for MVP RFP input)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      industry,
      estimatedValue,
      submissionDeadline,
      buyerOrganization,
      location
    } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ 
        error: 'Title and description are required' 
      });
    }

    const db = Database.getInstance();
    
    const result = await db.query(`
      INSERT INTO opportunities (
        title,
        description,
        buyer_organization,
        buyer_type,
        industry,
        project_value_min,
        project_value_max,
        submission_deadline,
        location,
        required_capabilities,
        source,
        difficulty_level,
        is_active,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *
    `, [
      title,
      description,
      buyerOrganization || 'RFP Analysis',
      'private',
      industry || 'General',
      estimatedValue || 10000,
      estimatedValue || 50000,
      submissionDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      location || 'Remote',
      requirements ? [requirements] : [],
      'mvp_input',
      'medium',
      true
    ]);

    logger.info('Opportunity created for MVP analysis', {
      opportunityId: result.rows[0].id,
      userId: req.user.id,
      title
    });

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Opportunity creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create opportunity',
      details: error.message
    });
  }
});

/**
 * GET /api/opportunities/for-company/:companyId
 * Get opportunities for a specific company with their match scores
 */
router.get('/for-company/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { limit = 10, minScore = 0 } = req.query;
    
    const db = Database.getInstance();
    
    // Get opportunities with their scores for this company
    const result = await db.query(`
      SELECT 
        o.*,
        sr.overall_score as match_score,
        sr.confidence_level,
        CASE 
          WHEN sr.overall_score >= 90 THEN 'Exceptional Fit'
          WHEN sr.overall_score >= 75 THEN 'Strong Alignment'
          ELSE 'Growth Potential'
        END as match_description
      FROM opportunities o
      LEFT JOIN scoring_results sr ON o.id = sr.opportunity_id AND sr.company_id = $1
      WHERE o.is_active = true
        AND (sr.overall_score IS NULL OR sr.overall_score >= $2)
      ORDER BY sr.overall_score DESC NULLS LAST, o.submission_deadline ASC
      LIMIT $3
    `, [companyId, minScore, limit]);

    res.json({
      success: true,
      data: {
        companyId: parseInt(companyId),
        opportunities: result.rows,
        total: result.rows.length
      }
    });

  } catch (error) {
    logger.error('Company opportunities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve opportunities for company',
      details: error.message
    });
  }
});

/**
 * POST /api/opportunities/score-fit
 * Score how well a supplier fits an opportunity using Panel of Judges
 */
router.post('/score-fit', authenticateToken, checkUsageLimit, addUsageInfo, updateAnalysisCount, requireFeature('AI_OPPORTUNITY_SCORING'), async (req, res) => {
  try {
    const { companyId, opportunityId } = req.body;
    
    if (!companyId || !opportunityId) {
      return res.status(400).json({ 
        error: 'Both company ID and opportunity ID are required' 
      });
    }

    const scoring = await opportunityScoringService.scoreOpportunityFit(companyId, opportunityId);
    
    res.json({
      success: true,
      data: scoring
    });

  } catch (error) {
    logger.error('Opportunity scoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to score opportunity fit',
      details: error.message
    });
  }
});

/**
 * GET /api/opportunities/:opportunityId/company-scores
 * Get all company scores for a specific opportunity
 */
router.get('/:opportunityId/company-scores', authenticateToken, async (req, res) => {
  try {
    const { opportunityId } = req.params;
    const { limit = 10, minScore = 0 } = req.query;
    
    // This would need to be implemented in the service
    // For now, return a mock response
    res.json({
      success: true,
      data: {
        opportunityId,
        totalScored: 0,
        topMatches: [],
        message: 'Company scoring endpoint - to be implemented'
      }
    });

  } catch (error) {
    logger.error('Company scores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve company scores',
      details: error.message
    });
  }
});

/**
 * POST /api/opportunities/batch-score
 * Score multiple company-opportunity combinations
 */
router.post('/batch-score', authenticateToken, requireFeature('BATCH_ANALYSIS'), async (req, res) => {
  try {
    const { scoringRequests } = req.body;
    
    if (!Array.isArray(scoringRequests) || scoringRequests.length === 0) {
      return res.status(400).json({ 
        error: 'Array of scoring requests is required' 
      });
    }

    if (scoringRequests.length > 20) {
      return res.status(400).json({ 
        error: 'Maximum 20 scoring requests can be processed in batch' 
      });
    }

    // Validate each request has required fields
    for (const request of scoringRequests) {
      if (!request.companyId || !request.opportunityId) {
        return res.status(400).json({ 
          error: 'Each scoring request must have companyId and opportunityId' 
        });
      }
    }

    const results = [];
    for (const request of scoringRequests) {
      try {
        const scoring = await opportunityScoringService.scoreOpportunityFit(
          request.companyId, 
          request.opportunityId
        );
        results.push({
          companyId: request.companyId,
          opportunityId: request.opportunityId,
          status: 'success',
          scoring
        });
      } catch (error) {
        results.push({
          companyId: request.companyId,
          opportunityId: request.opportunityId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        totalProcessed: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        results
      }
    });

  } catch (error) {
    logger.error('Batch scoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform batch scoring',
      details: error.message
    });
  }
});

/**
 * GET /api/opportunities/judge-breakdown/:scoringResultId
 * Get detailed judge breakdown for a specific scoring result
 */
router.get('/judge-breakdown/:scoringResultId', authenticateToken, requireFeature('JUDGE_BREAKDOWN'), async (req, res) => {
  try {
    const { scoringResultId } = req.params;
    
    // This would need to be implemented to query judge_scores table
    res.json({
      success: true,
      data: {
        scoringResultId,
        message: 'Judge breakdown endpoint - to be implemented with database query'
      }
    });

  } catch (error) {
    logger.error('Judge breakdown error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve judge breakdown',
      details: error.message
    });
  }
});