const express = require('express');
const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { 
  companyProfileSchema, 
  updateCompanyProfileSchema, 
  profileSearchSchema 
} = require('../schemas/profile.schema');
const { idParamSchema, paginationSchema } = require('../middleware/validation');

const router = express.Router();

// All profile routes require authentication
router.use(authenticateToken);

/**
 * POST /profiles - Create new company profile
 */
router.post('/', validate(companyProfileSchema), async (req, res) => {
  try {
    const profileData = req.body;
    const userId = req.user.id;

    const db = Database.getInstance();

    // Check if user already has a profile
    const existingProfile = await db.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(409).json({
        error: 'User already has a company profile. Use PUT to update.'
      });
    }

    // Insert new profile
    const result = await db.query(`
      INSERT INTO company_profiles (
        user_id, name, dba, summary, description, naics, uei, cage_code,
        employee_count, annual_revenue, business_type, certifications,
        past_performance, capabilities, website, linkedin, address,
        service_areas, keywords, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
      ) RETURNING *
    `, [
      userId,
      profileData.name,
      profileData.dba || null,
      profileData.summary,
      profileData.description || null,
      JSON.stringify(profileData.naics),
      profileData.uei || null,
      profileData.cageCode || null,
      profileData.employeeCount || null,
      profileData.annualRevenue || null,
      profileData.businessType || null,
      JSON.stringify(profileData.certifications || []),
      JSON.stringify(profileData.pastPerformance || []),
      JSON.stringify(profileData.capabilities || []),
      profileData.website || null,
      profileData.linkedIn || null,
      JSON.stringify(profileData.address || {}),
      JSON.stringify(profileData.serviceAreas || []),
      JSON.stringify(profileData.keywords || [])
    ]);

    const profile = result.rows[0];
    
    // JSONB fields are already parsed by PostgreSQL driver
    // Just map snake_case to camelCase for response
    profile.pastPerformance = profile.past_performance;
    profile.serviceAreas = profile.service_areas;
    
    // Clean up snake_case fields
    delete profile.past_performance;
    delete profile.service_areas;

    logger.info(`Company profile created for user ${userId}`, {
      profileId: profile.id,
      companyName: profile.name
    });

    res.status(201).json({
      message: 'Company profile created successfully',
      profile: profile
    });

  } catch (error) {
    logger.error('Error creating company profile:', error);
    res.status(500).json({
      error: 'Failed to create company profile'
    });
  }
});

/**
 * GET /profiles/:id - Get company profile by ID
 */
router.get('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  try {
    const { id } = req.params;
    const db = Database.getInstance();

    const result = await db.query(`
      SELECT cp.*, u.email, u.first_name, u.last_name, u.company_name as user_company_name
      FROM company_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Company profile not found'
      });
    }

    const profile = result.rows[0];
    
    // JSONB fields are already parsed - just map snake_case to camelCase
    profile.pastPerformance = profile.past_performance;
    profile.serviceAreas = profile.service_areas;
    delete profile.past_performance;
    delete profile.service_areas;

    res.json({
      profile: profile
    });

  } catch (error) {
    logger.error('Error fetching company profile:', error);
    res.status(500).json({
      error: 'Failed to fetch company profile'
    });
  }
});

/**
 * GET /profiles - List/search company profiles with pagination
 */
router.get('/', validate(profileSearchSchema, 'query'), async (req, res) => {
  try {
    const { 
      naics, 
      certifications, 
      minEmployees, 
      maxEmployees, 
      minRevenue, 
      maxRevenue, 
      businessType, 
      keywords, 
      serviceAreas,
      limit, 
      offset 
    } = req.query;

    const db = Database.getInstance();
    let query = `
      SELECT cp.*, u.email, u.first_name, u.last_name
      FROM company_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Build dynamic WHERE clause based on search criteria
    if (naics && naics.length > 0) {
      paramCount++;
      query += ` AND cp.naics::jsonb ?| $${paramCount}`;
      params.push(naics);
    }

    if (minEmployees !== undefined) {
      paramCount++;
      query += ` AND cp.employee_count >= $${paramCount}`;
      params.push(minEmployees);
    }

    if (maxEmployees !== undefined) {
      paramCount++;
      query += ` AND cp.employee_count <= $${paramCount}`;
      params.push(maxEmployees);
    }

    if (minRevenue !== undefined) {
      paramCount++;
      query += ` AND cp.annual_revenue >= $${paramCount}`;
      params.push(minRevenue);
    }

    if (maxRevenue !== undefined) {
      paramCount++;
      query += ` AND cp.annual_revenue <= $${paramCount}`;
      params.push(maxRevenue);
    }

    if (businessType) {
      paramCount++;
      query += ` AND cp.business_type = $${paramCount}`;
      params.push(businessType);
    }

    if (keywords && keywords.length > 0) {
      paramCount++;
      query += ` AND cp.keywords::jsonb ?| $${paramCount}`;
      params.push(keywords);
    }

    if (serviceAreas && serviceAreas.length > 0) {
      paramCount++;
      query += ` AND cp.service_areas::jsonb ?| $${paramCount}`;
      params.push(serviceAreas);
    }

    // Add ordering and pagination
    query += ` ORDER BY cp.created_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await db.query(query, params);
    
    // JSONB fields are already parsed - just map snake_case to camelCase
    const profiles = result.rows.map(profile => {
      profile.pastPerformance = profile.past_performance;
      profile.serviceAreas = profile.service_areas;
      delete profile.past_performance;
      delete profile.service_areas;
      return profile;
    });

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM company_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE 1=1
    `;
    
    // Rebuild WHERE clause for count (without LIMIT/OFFSET)
    const countParams = params.slice(0, -2); // Remove limit and offset
    if (naics && naics.length > 0) {
      countQuery += ` AND cp.naics::jsonb ?| $1`;
    }
    // ... (repeat same conditions as above for count query)

    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      profiles: profiles,
      pagination: {
        total: totalCount,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    logger.error('Error searching company profiles:', error);
    res.status(500).json({
      error: 'Failed to search company profiles'
    });
  }
});

/**
 * PUT /profiles/:id - Update company profile
 */
router.put('/:id', 
  validate(idParamSchema, 'params'),
  validate(updateCompanyProfileSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user.id;

      const db = Database.getInstance();

      // Check if profile exists and belongs to user
      const existingProfile = await db.query(
        'SELECT user_id FROM company_profiles WHERE id = $1',
        [id]
      );

      if (existingProfile.rows.length === 0) {
        return res.status(404).json({
          error: 'Company profile not found'
        });
      }

      if (existingProfile.rows[0].user_id !== userId) {
        return res.status(403).json({
          error: 'You can only update your own company profile'
        });
      }

      // Build dynamic UPDATE query
      const updateFields = [];
      const params = [];
      let paramCount = 0;

      Object.entries(updates).forEach(([key, value]) => {
        paramCount++;
        
        // Handle special field name mappings
        const dbFieldMap = {
          cageCode: 'cage_code',
          employeeCount: 'employee_count',
          annualRevenue: 'annual_revenue',
          businessType: 'business_type',
          pastPerformance: 'past_performance',
          serviceAreas: 'service_areas',
          linkedIn: 'linkedin'
        };
        
        const dbField = dbFieldMap[key] || key;
        
        // JSON fields need to be stringified
        const jsonFields = ['naics', 'certifications', 'past_performance', 'capabilities', 'address', 'service_areas', 'keywords'];
        if (jsonFields.includes(dbField)) {
          updateFields.push(`${dbField} = $${paramCount}`);
          params.push(JSON.stringify(value));
        } else {
          updateFields.push(`${dbField} = $${paramCount}`);
          params.push(value);
        }
      });

      // Add updated_at timestamp
      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      params.push(new Date());

      // Add WHERE condition
      paramCount++;
      params.push(id);

      const updateQuery = `
        UPDATE company_profiles 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(updateQuery, params);
      const profile = result.rows[0];

      // JSONB fields are already parsed - just map snake_case to camelCase
      profile.pastPerformance = profile.past_performance;
      profile.serviceAreas = profile.service_areas;
      delete profile.past_performance;
      delete profile.service_areas;

      logger.info(`Company profile updated for user ${userId}`, {
        profileId: profile.id,
        updatedFields: Object.keys(updates)
      });

      res.json({
        message: 'Company profile updated successfully',
        profile: profile
      });

    } catch (error) {
      logger.error('Error updating company profile:', error);
      res.status(500).json({
        error: 'Failed to update company profile'
      });
    }
  }
);

/**
 * DELETE /profiles/:id - Delete company profile
 */
router.delete('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const db = Database.getInstance();

    // Check if profile exists and belongs to user
    const existingProfile = await db.query(
      'SELECT user_id FROM company_profiles WHERE id = $1',
      [id]
    );

    if (existingProfile.rows.length === 0) {
      return res.status(404).json({
        error: 'Company profile not found'
      });
    }

    if (existingProfile.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'You can only delete your own company profile'
      });
    }

    // Delete profile
    await db.query('DELETE FROM company_profiles WHERE id = $1', [id]);

    logger.info(`Company profile deleted for user ${userId}`, {
      profileId: id
    });

    res.json({
      message: 'Company profile deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting company profile:', error);
    res.status(500).json({
      error: 'Failed to delete company profile'
    });
  }
});

/**
 * GET /profiles/me - Get current user's company profile
 */
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;
    const db = Database.getInstance();

    const result = await db.query(`
      SELECT cp.*, u.email, u.first_name, u.last_name, u.company_name as user_company_name
      FROM company_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No company profile found for current user'
      });
    }

    const profile = result.rows[0];
    
    // JSONB fields are already parsed - just map snake_case to camelCase
    profile.pastPerformance = profile.past_performance;
    profile.serviceAreas = profile.service_areas;
    delete profile.past_performance;
    delete profile.service_areas;

    res.json({
      profile: profile
    });

  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile'
    });
  }
});

module.exports = router;