const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/analytics/track
 * Track user events for A/B testing and analytics
 */
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const { event, experienceType, score, error: errorMessage } = req.body;
    const userId = req.user.id;
    
    if (!event) {
      return res.status(400).json({ 
        error: 'Event name is required' 
      });
    }

    const db = Database.getInstance();
    
    // Insert analytics event
    await db.query(`
      INSERT INTO analytics_events (
        user_id, 
        event_name, 
        experience_type, 
        score, 
        error_message,
        created_at,
        session_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      userId,
      event,
      experienceType || 'full',
      score || null,
      errorMessage || null,
      new Date(),
      JSON.stringify(req.body)
    ]);

    logger.info(`Analytics event tracked: ${event}`, {
      userId,
      experienceType,
      event
    });

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    logger.error('Analytics tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      details: error.message
    });
  }
});

/**
 * GET /api/analytics/conversion-funnel
 * Get conversion funnel data for A/B testing comparison
 */
router.get('/conversion-funnel', authenticateToken, async (req, res) => {
  try {
    const { experienceType, startDate, endDate } = req.query;
    
    const db = Database.getInstance();
    
    // Build query filters
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramCount = 0;

    if (experienceType) {
      paramCount++;
      whereClause += ` AND experience_type = $${paramCount}`;
      queryParams.push(experienceType);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND created_at >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND created_at <= $${paramCount}`;
      queryParams.push(endDate);
    }

    // Get funnel metrics
    const funnelQuery = `
      SELECT 
        experience_type,
        COUNT(CASE WHEN event_name = 'page_visit' THEN 1 END) as visits,
        COUNT(CASE WHEN event_name = 'mvp_analysis_started' OR event_name = 'full_analysis_started' THEN 1 END) as analyses_started,
        COUNT(CASE WHEN event_name = 'mvp_analysis_completed' OR event_name = 'full_analysis_completed' THEN 1 END) as analyses_completed,
        COUNT(CASE WHEN event_name = 'upgrade_clicked' THEN 1 END) as upgrade_clicks,
        COUNT(CASE WHEN event_name = 'subscription_purchased' THEN 1 END) as conversions,
        AVG(CASE WHEN score IS NOT NULL THEN score END) as avg_score
      FROM analytics_events 
      ${whereClause}
      GROUP BY experience_type
      ORDER BY experience_type
    `;

    const result = await db.query(funnelQuery, queryParams);
    
    // Calculate conversion rates
    const funnelData = result.rows.map(row => ({
      experienceType: row.experience_type,
      metrics: {
        visits: parseInt(row.visits),
        analysesStarted: parseInt(row.analyses_started),
        analysesCompleted: parseInt(row.analyses_completed),
        upgradeClicks: parseInt(row.upgrade_clicks),
        conversions: parseInt(row.conversions),
        avgScore: row.avg_score ? parseFloat(row.avg_score).toFixed(1) : null
      },
      conversionRates: {
        visitToAnalysis: row.visits > 0 ? ((row.analyses_started / row.visits) * 100).toFixed(2) : '0.00',
        analysisCompletion: row.analyses_started > 0 ? ((row.analyses_completed / row.analyses_started) * 100).toFixed(2) : '0.00',
        upgradeRate: row.analyses_completed > 0 ? ((row.upgrade_clicks / row.analyses_completed) * 100).toFixed(2) : '0.00',
        finalConversion: row.visits > 0 ? ((row.conversions / row.visits) * 100).toFixed(2) : '0.00'
      }
    }));

    res.json({
      success: true,
      data: {
        funnelData,
        dateRange: { startDate, endDate },
        totalExperiences: funnelData.length
      }
    });

  } catch (error) {
    logger.error('Conversion funnel query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversion funnel data',
      details: error.message
    });
  }
});

/**
 * GET /api/analytics/experience-comparison
 * Compare performance between simple and full experiences
 */
router.get('/experience-comparison', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const db = Database.getInstance();
    
    const comparisonQuery = `
      WITH experience_stats AS (
        SELECT 
          experience_type,
          DATE(created_at) as date,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(*) as total_events,
          COUNT(CASE WHEN event_name LIKE '%_completed' THEN 1 END) as completions,
          COUNT(CASE WHEN event_name = 'subscription_purchased' THEN 1 END) as purchases,
          AVG(CASE WHEN score IS NOT NULL THEN score END) as avg_score
        FROM analytics_events 
        WHERE created_at >= $1
        GROUP BY experience_type, DATE(created_at)
      )
      SELECT 
        experience_type,
        COUNT(*) as active_days,
        SUM(unique_users) as total_unique_users,
        SUM(total_events) as total_events,
        SUM(completions) as total_completions,
        SUM(purchases) as total_purchases,
        AVG(avg_score) as overall_avg_score,
        ROUND(AVG(unique_users), 2) as avg_daily_users,
        CASE 
          WHEN SUM(unique_users) > 0 THEN ROUND((SUM(purchases)::float / SUM(unique_users) * 100), 2)
          ELSE 0 
        END as user_conversion_rate
      FROM experience_stats
      GROUP BY experience_type
      ORDER BY experience_type
    `;

    const result = await db.query(comparisonQuery, [startDate]);
    
    res.json({
      success: true,
      data: {
        comparison: result.rows,
        dateRange: { 
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          days: parseInt(days)
        }
      }
    });

  } catch (error) {
    logger.error('Experience comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve experience comparison data',
      details: error.message
    });
  }
});

module.exports = router;