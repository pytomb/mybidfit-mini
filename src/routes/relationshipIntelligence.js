const express = require('express');
const { RelationshipIntelligenceService } = require('../services/relationshipIntelligence');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureFlags');

const router = express.Router();
const relationshipService = new RelationshipIntelligenceService();

/**
 * GET /api/relationship-intelligence/organizations
 * Get Atlanta metro organizations with filtering and search
 */
router.get('/organizations', authenticateToken, requireFeature('relationship_intelligence_atlanta'), async (req, res) => {
  try {
    const { 
      search, 
      type, 
      county, 
      industry, 
      influenceScore, 
      limit = 50, 
      offset = 0 
    } = req.query;

    const organizations = await relationshipService.getOrganizations({
      search,
      type,
      county,
      industry,
      influenceScore: influenceScore ? parseFloat(influenceScore) : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: organizations,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: organizations.total || organizations.length
      }
    });

  } catch (error) {
    console.error('Organizations retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve organizations',
      details: error.message
    });
  }
});

/**
 * GET /api/relationship-intelligence/people
 * Get Atlanta metro professionals with filtering and search
 */
router.get('/people', authenticateToken, requireFeature('relationship_intelligence_atlanta'), async (req, res) => {
  try {
    const {
      search,
      organizationId,
      seniority,
      department,
      expertise,
      influenceScore,
      limit = 50,
      offset = 0
    } = req.query;

    const people = await relationshipService.getPeople({
      search,
      organizationId: organizationId ? parseInt(organizationId) : undefined,
      seniority,
      department,
      expertise,
      influenceScore: influenceScore ? parseFloat(influenceScore) : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: people,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: people.total || people.length
      }
    });

  } catch (error) {
    console.error('People retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve people',
      details: error.message
    });
  }
});

/**
 * POST /api/relationship-intelligence/connection-path
 * Find connection paths between people or to target person
 */
router.post('/connection-path', authenticateToken, requireFeature('relationship_intelligence_atlanta'), async (req, res) => {
  try {
    const { fromPersonId, toPersonId, maxDegrees = 3 } = req.body;

    if (!fromPersonId || !toPersonId) {
      return res.status(400).json({ 
        error: 'Both fromPersonId and toPersonId are required' 
      });
    }

    const connectionPaths = await relationshipService.findConnectionPaths(
      fromPersonId, 
      toPersonId, 
      maxDegrees
    );

    res.json({
      success: true,
      data: {
        fromPersonId,
        toPersonId,
        maxDegrees,
        paths: connectionPaths,
        shortestPath: connectionPaths.length > 0 ? connectionPaths[0] : null,
        connectionStrength: connectionPaths.length > 0 ? connectionPaths[0].overallStrength : 'none'
      }
    });

  } catch (error) {
    console.error('Connection path error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find connection paths',
      details: error.message
    });
  }
});

/**
 * GET /api/relationship-intelligence/events
 * Get upcoming Atlanta networking events with filtering
 */
router.get('/events', authenticateToken, requireFeature('relationship_intelligence_atlanta'), async (req, res) => {
  try {
    const {
      eventType,
      industryFocus,
      startDate,
      endDate,
      networkingPotential,
      maxPrice,
      limit = 20,
      offset = 0
    } = req.query;

    const events = await relationshipService.getEvents({
      eventType,
      industryFocus,
      startDate,
      endDate,
      networkingPotential,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: events,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: events.total || events.length
      }
    });

  } catch (error) {
    console.error('Events retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve events',
      details: error.message
    });
  }
});

/**
 * POST /api/relationship-intelligence/event-recommendations
 * Get personalized event recommendations based on goals and network
 */
router.post('/event-recommendations', authenticateToken, requireFeature('relationship_intelligence_atlanta'), async (req, res) => {
  try {
    const { 
      personId, 
      goals = [], 
      targetIndustries = [], 
      networkingObjectives = [],
      maxEvents = 5,
      timeframe = 'next_3_months'
    } = req.body;

    if (!personId) {
      return res.status(400).json({ error: 'Person ID is required' });
    }

    const recommendations = await relationshipService.recommendEvents(personId, {
      goals,
      targetIndustries,
      networkingObjectives,
      maxEvents,
      timeframe
    });

    res.json({
      success: true,
      data: {
        personId,
        criteria: {
          goals,
          targetIndustries,
          networkingObjectives,
          maxEvents,
          timeframe
        },
        recommendations
      }
    });

  } catch (error) {
    console.error('Event recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate event recommendations',
      details: error.message
    });
  }
});

/**
 * GET /api/relationship-intelligence/opportunities
 * Get Atlanta business opportunities with relationship intelligence
 */
router.get('/opportunities', authenticateToken, requireFeature('relationship_intelligence_atlanta'), async (req, res) => {
  try {
    const {
      opportunityType,
      minValue,
      maxValue,
      industry,
      status = 'open',
      hasConnections,
      limit = 20,
      offset = 0
    } = req.query;

    const opportunities = await relationshipService.getOpportunities({
      opportunityType,
      minValue: minValue ? parseFloat(minValue) : undefined,
      maxValue: maxValue ? parseFloat(maxValue) : undefined,
      industry,
      status,
      hasConnections: hasConnections === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: opportunities,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: opportunities.total || opportunities.length
      }
    });

  } catch (error) {
    console.error('Opportunities retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve opportunities',
      details: error.message
    });
  }
});

/**
 * POST /api/relationship-intelligence/opportunity-analysis
 * Analyze opportunity fit with relationship advantages
 */
router.post('/opportunity-analysis', authenticateToken, requireFeature('relationship_intelligence_atlanta'), async (req, res) => {
  try {
    const { opportunityId, yourPersonId, yourCapabilities = [] } = req.body;

    if (!opportunityId) {
      return res.status(400).json({ error: 'Opportunity ID is required' });
    }

    const analysis = await relationshipService.analyzeOpportunity(
      opportunityId, 
      yourPersonId, 
      yourCapabilities
    );

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Opportunity analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze opportunity',
      details: error.message
    });
  }
});

/**
 * GET /api/relationship-intelligence/insights
 * Get AI-generated relationship intelligence insights
 */
router.get('/insights', authenticateToken, requireFeature('relationship_intelligence_atlanta'), async (req, res) => {
  try {
    const {
      targetType,
      targetId,
      insightType,
      minRelevance = 7.0,
      limit = 10,
      offset = 0
    } = req.query;

    const insights = await relationshipService.getInsights({
      targetType,
      targetId: targetId ? parseInt(targetId) : undefined,
      insightType,
      minRelevance: parseFloat(minRelevance),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: insights,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: insights.total || insights.length
      }
    });

  } catch (error) {
    console.error('Insights retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve insights',
      details: error.message
    });
  }
});

/**
 * POST /api/relationship-intelligence/network-analysis
 * Analyze your position and influence in the Atlanta network
 */
router.post('/network-analysis', authenticateToken, requireFeature('relationship_intelligence_atlanta'), async (req, res) => {
  try {
    const { personId, analysisType = 'comprehensive' } = req.body;

    if (!personId) {
      return res.status(400).json({ error: 'Person ID is required' });
    }

    const networkAnalysis = await relationshipService.analyzeNetwork(personId, analysisType);

    res.json({
      success: true,
      data: networkAnalysis
    });

  } catch (error) {
    console.error('Network analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform network analysis',
      details: error.message
    });
  }
});

/**
 * POST /api/relationship-intelligence/introduction-request
 * Request introduction through connection path
 */
router.post('/introduction-request', authenticateToken, requireFeature('relationship_intelligence_atlanta'), async (req, res) => {
  try {
    const { 
      fromPersonId, 
      toPersonId, 
      introducerPersonId, 
      message, 
      context,
      urgency = 'normal'
    } = req.body;

    if (!fromPersonId || !toPersonId || !introducerPersonId || !message) {
      return res.status(400).json({ 
        error: 'fromPersonId, toPersonId, introducerPersonId, and message are required' 
      });
    }

    const introductionRequest = await relationshipService.requestIntroduction({
      fromPersonId,
      toPersonId,
      introducerPersonId,
      message,
      context,
      urgency
    });

    res.json({
      success: true,
      data: introductionRequest
    });

  } catch (error) {
    console.error('Introduction request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process introduction request',
      details: error.message
    });
  }
});

/**
 * GET /api/relationship-intelligence/dashboard
 * Get relationship intelligence dashboard data
 */
router.get('/dashboard', authenticateToken, requireFeature('relationship_intelligence_atlanta'), async (req, res) => {
  try {
    const { personId } = req.query;

    if (!personId) {
      return res.status(400).json({ error: 'Person ID is required' });
    }

    const dashboardData = await relationshipService.getDashboardData(parseInt(personId));

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data',
      details: error.message
    });
  }
});

module.exports = router;