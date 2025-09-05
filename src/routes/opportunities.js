const express = require('express');
const { fetchOpportunities } = require('../integrations/sam');
const { logger } = require('../utils/logger');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');
const { opportunitySearchSchema, paginationSchema } = require('../schemas/opportunity.schema');
const { idParamSchema } = require('../middleware/validation');

const router = express.Router();

// All opportunity routes require authentication
router.use(authenticateToken);

// Apply rate limiting to opportunity routes
router.use(apiLimiter);

/**
 * GET /opportunities - Search for government contracting opportunities
 */
router.get('/', validate(opportunitySearchSchema, 'query'), async (req, res) => {
  try {
    const searchParams = req.query;
    const userId = req.user.id;

    logger.info(`User ${userId} searching opportunities with params:`, {
      ...searchParams,
      userId
    });

    const response = await fetchOpportunities(searchParams);
    const opportunities = response.opportunitiesData || [];
    
    logger.info(`Retrieved ${opportunities.length} opportunities for user ${userId} (${response.totalRecords} total available)`);

    res.json({
      success: true,
      count: opportunities.length,
      totalRecords: response.totalRecords || 0,
      opportunities: opportunities,
      searchParams: searchParams,
      pagination: {
        limit: response.limit,
        offset: response.offset,
        links: response.links
      }
    });

  } catch (error) {
    logger.error('Error fetching opportunities:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      searchParams: req.query
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch opportunities',
      message: 'An error occurred while searching for contracting opportunities'
    });
  }
});

/**
 * GET /opportunities/:id - Get specific opportunity details
 */
router.get('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info(`User ${userId} requesting opportunity ${id}`);

    // For now, return a placeholder response since we need to implement
    // specific opportunity fetching from SAM.gov
    res.json({
      success: true,
      message: 'Opportunity detail endpoint - to be implemented',
      opportunityId: id
    });

  } catch (error) {
    logger.error('Error fetching opportunity details:', {
      error: error.message,
      opportunityId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch opportunity details'
    });
  }
});

module.exports = router;