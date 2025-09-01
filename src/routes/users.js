const express = require('express');
const { Database } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { getInstance: getFeatureFlagService } = require('../services/featureFlags');

const router = express.Router();

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const db = Database.getInstance();
    const result = await db.query(`
      SELECT 
        id, 
        email, 
        created_at,
        analysis_count,
        is_paid,
        subscription_tier,
        last_analysis_at
      FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        ...user,
        analysisCount: user.analysis_count || 0,
        isPaid: user.is_paid || false,
        subscriptionTier: user.subscription_tier,
        lastAnalysisAt: user.last_analysis_at,
        // Remove the snake_case versions for frontend consistency
        analysis_count: undefined,
        is_paid: undefined,
        subscription_tier: undefined,
        last_analysis_at: undefined
      }
    });

  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile',
      details: error.message
    });
  }
});

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const db = Database.getInstance();

    if (email) {
      // Check if email is already taken by another user
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email is already taken'
        });
      }

      const result = await db.query(
        'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email, created_at',
        [email, req.user.id]
      );

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Profile updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      details: error.message
    });
  }
});

/**
 * GET /api/users/companies
 * Get companies associated with the current user
 */
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    const db = Database.getInstance();
    
    // For now, return all companies - in production, this would be filtered by user ownership
    const result = await db.query(
      'SELECT id, name, size_category, industries, headquarters_city, headquarters_state, credibility_score FROM companies ORDER BY name'
    );

    res.json({
      success: true,
      data: {
        companies: result.rows,
        total: result.rows.length
      }
    });

  } catch (error) {
    console.error('Companies retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve companies',
      details: error.message
    });
  }
});

/**
 * POST /api/users/companies
 * Create a new company profile
 */
router.post('/companies', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      size_category,
      industries = [],
      capabilities = [],
      certifications = [],
      headquarters_city,
      headquarters_state,
      service_regions = [],
      team_size,
      years_experience,
      total_projects,
      technologies = []
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Company name is required'
      });
    }

    const db = Database.getInstance();
    
    const result = await db.query(`
      INSERT INTO companies 
      (name, size_category, industries, capabilities, certifications, 
       headquarters_city, headquarters_state, service_regions, team_size, 
       years_experience, total_projects, technologies, credibility_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      name,
      size_category || 'small',
      industries,
      capabilities,
      certifications,
      headquarters_city,
      headquarters_state,
      service_regions,
      team_size || 5,
      years_experience || 1,
      total_projects || 0,
      technologies,
      75 // Default credibility score
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Company profile created successfully'
    });

  } catch (error) {
    console.error('Company creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create company profile',
      details: error.message
    });
  }
});

/**
 * PUT /api/users/companies/:companyId
 * Update a company profile
 */
router.put('/companies/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const updateFields = req.body;

    // Remove undefined fields
    const cleanedFields = Object.entries(updateFields)
      .filter(([key, value]) => value !== undefined)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    if (Object.keys(cleanedFields).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    const db = Database.getInstance();
    
    // Build dynamic update query
    const setClause = Object.keys(cleanedFields)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [companyId, ...Object.values(cleanedFields)];
    
    const result = await db.query(`
      UPDATE companies 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Company profile updated successfully'
    });

  } catch (error) {
    logger.error('Company update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update company profile',
      details: error.message
    });
  }
});

/**
 * DELETE /api/users/companies/:companyId
 * Delete a company profile
 */
router.delete('/companies/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const db = Database.getInstance();

    const result = await db.query(
      'DELETE FROM companies WHERE id = $1 RETURNING id, name',
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Company profile deleted successfully'
    });

  } catch (error) {
    logger.error('Company deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete company profile',
      details: error.message
    });
  }
});

/**
 * GET /api/users/feature-flags
 * Get current user's feature flags
 */
router.get('/feature-flags', authenticateToken, async (req, res) => {
  try {
    const featureFlagService = getFeatureFlagService();
    const flags = await featureFlagService.getFlagsForUser(req.user.id);
    
    // Also get feature definitions for frontend
    const definitions = featureFlagService.getFeatureDefinitions();
    
    res.json({
      success: true,
      data: {
        flags,
        definitions,
        userId: req.user.id,
        enabledCount: Object.values(flags).filter(Boolean).length
      }
    });

  } catch (error) {
    logger.error('Feature flags retrieval error:', error);
    res.status(500).json({
      success: false,
      