const express = require('express');
const { PartnerFitService } = require('../services/partnerFit');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureFlags');
const { Database } = require('../database/connection');

const router = express.Router();

/**
 * GET /api/partner-fit/search
 * Search for partners based on match type and filters
 */
router.get('/search', authenticateToken, requireFeature('PARTNERSHIP_MATCHING'), async (req, res) => {
  try {
    const { 
      matchType = 'complementary', 
      industries = [],
      capabilities = [],
      certifications = [],
      regions = [],
      companySize,
      minScore = 0.6,
      limit = 20
    } = req.query;

    // Parse array parameters if they're strings
    const parsedIndustries = Array.isArray(industries) ? industries : (industries ? industries.split(',') : []);
    const parsedCapabilities = Array.isArray(capabilities) ? capabilities : (capabilities ? capabilities.split(',') : []);
    const parsedCertifications = Array.isArray(certifications) ? certifications : (certifications ? certifications.split(',') : []);
    const parsedRegions = Array.isArray(regions) ? regions : (regions ? regions.split(',') : []);

    const searchFilters = {
      matchType,
      industries: parsedIndustries,
      capabilities: parsedCapabilities,
      certifications: parsedCertifications,
      regions: parsedRegions,
      companySize,
      minScore: parseFloat(minScore),
      limit: parseInt(limit)
    };

    // For now, return mock data that matches our frontend design
    // TODO: Implement actual partner matching service
    const mockResults = await generateMockPartnerResults(searchFilters);

    res.json({
      success: true,
      data: {
        filters: searchFilters,
        totalMatches: mockResults.length,
        partners: mockResults
      }
    });

  } catch (error) {
    console.error('Partner search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search for partners',
      details: error.message
    });
  }
});

/**
 * GET /api/partner-fit/profile/:userId
 * Get partner profile for a user
 */
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = Database.getInstance();
    
    // Check if user has a partner profile
    const query = `
      SELECT pp.*, c.name as company_name, c.description, c.website,
             c.industries, c.capabilities, c.certifications, c.service_regions
      FROM partner_profiles pp
      JOIN companies c ON pp.company_id = c.id
      WHERE pp.user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Partner profile not found'
      });
    }

    const profile = result.rows[0];
    
    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Get partner profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve partner profile',
      details: error.message
    });
  }
});

/**
 * POST /api/partner-fit/profile
 * Create or update partner profile
 */
router.post('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      companyId,
      openToPartnership = true,
      partnershipTypes = ['both'],
      primeSubPreference = 'both',
      currentCapacity = 75,
      availabilityStart,
      availabilityEnd,
      typicalProjectSize,
      preferredIndustries = [],
      preferredRegions = [],
      preferredCompanySizes = [],
      minPartnershipSize,
      maxPartnershipSize,
      contactMethod = 'email',
      contactEmail,
      contactPhone,
      responseTimeHours = 24
    } = req.body;

    const db = Database.getInstance();
    
    // Check if profile already exists
    const existingProfile = await db.query(
      'SELECT id FROM partner_profiles WHERE user_id = $1',
      [userId]
    );

    let query, params;
    
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      query = `
        UPDATE partner_profiles SET
          company_id = $2,
          open_to_partnership = $3,
          partnership_types = $4,
          prime_sub_preference = $5,
          current_capacity = $6,
          availability_start = $7,
          availability_end = $8,
          typical_project_size = $9,
          preferred_industries = $10,
          preferred_regions = $11,
          preferred_company_sizes = $12,
          min_partnership_size = $13,
          max_partnership_size = $14,
          contact_method = $15,
          contact_email = $16,
          contact_phone = $17,
          response_time_hours = $18,
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;
      params = [
        userId, companyId, openToPartnership, partnershipTypes, primeSubPreference,
        currentCapacity, availabilityStart, availabilityEnd, typicalProjectSize,
        preferredIndustries, preferredRegions, preferredCompanySizes,
        minPartnershipSize, maxPartnershipSize, contactMethod, contactEmail,
        contactPhone, responseTimeHours
      ];
    } else {
      // Create new profile
      query = `
        INSERT INTO partner_profiles (
          user_id, company_id, open_to_partnership, partnership_types,
          prime_sub_preference, current_capacity, availability_start,
          availability_end, typical_project_size, preferred_industries,
          preferred_regions, preferred_company_sizes, min_partnership_size,
          max_partnership_size, contact_method, contact_email, contact_phone,
          response_time_hours, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
        ) RETURNING *
      `;
      params = [
        userId, companyId, openToPartnership, partnershipTypes, primeSubPreference,
        currentCapacity, availabilityStart, availabilityEnd, typicalProjectSize,
        preferredIndustries, preferredRegions, preferredCompanySizes,
        minPartnershipSize, maxPartnershipSize, contactMethod, contactEmail,
        contactPhone, responseTimeHours
      ];
    }

    const result = await db.query(query, params);
    const profile = result.rows[0];

    res.json({
      success: true,
      data: profile,
      message: existingProfile.rows.length > 0 ? 'Profile updated successfully' : 'Profile created successfully'
    });

  } catch (error) {
    console.error('Create/update partner profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save partner profile',
      details: error.message
    });
  }
});

/**
 * POST /api/partner-fit/invitation
 * Send partnership invitation
 */
router.post('/invitation', authenticateToken, requireFeature('PARTNERSHIP_MATCHING'), async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const {
      toProfileId,
      matchId,
      message,
      opportunityDescription,
      invitationType = 'standard'
    } = req.body;

    if (!toProfileId || !message) {
      return res.status(400).json({
        success: false,
        error: 'toProfileId and message are required'
      });
    }

    const db = Database.getInstance();
    
    // Get sender's profile
    const fromProfile = await db.query(
      'SELECT id FROM partner_profiles WHERE user_id = $1',
      [fromUserId]
    );

    if (fromProfile.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'You must have a partner profile to send invitations'
      });
    }

    const fromProfileId = fromProfile.rows[0].id;

    // Create invitation
    const query = `
      INSERT INTO partner_invitations (
        from_profile_id, to_profile_id, match_id, invitation_type,
        message, opportunity_description, status, sent_at, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW() + INTERVAL '7 days'
      ) RETURNING *
    `;

    const result = await db.query(query, [
      fromProfileId, toProfileId, matchId, invitationType,
      message, opportunityDescription
    ]);

    const invitation = result.rows[0];

    // TODO: Send email notification to recipient

    res.json({
      success: true,
      data: invitation,
      message: 'Partnership invitation sent successfully'
    });

  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send partnership invitation',
      details: error.message
    });
  }
});

/**
 * GET /api/partner-fit/invitations
 * Get partnership invitations (sent and received)
 */
router.get('/invitations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'all' } = req.query; // 'sent', 'received', 'all'

    const db = Database.getInstance();
    
    // Get user's profile ID
    const profileResult = await db.query(
      'SELECT id FROM partner_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          sent: [],
          received: []
        }
      });
    }

    const profileId = profileResult.rows[0].id;
    let sentInvitations = [];
    let receivedInvitations = [];

    if (type === 'sent' || type === 'all') {
      const sentQuery = `
        SELECT pi.*, 
               u.first_name || ' ' || u.last_name as recipient_name,
               c.name as recipient_company
        FROM partner_invitations pi
        JOIN partner_profiles pp ON pi.to_profile_id = pp.id
        JOIN users u ON pp.user_id = u.id
        JOIN companies c ON pp.company_id = c.id
        WHERE pi.from_profile_id = $1
        ORDER BY pi.sent_at DESC
      `;
      const sentResult = await db.query(sentQuery, [profileId]);
      sentInvitations = sentResult.rows;
    }

    if (type === 'received' || type === 'all') {
      const receivedQuery = `
        SELECT pi.*,
               u.first_name || ' ' || u.last_name as sender_name,
               c.name as sender_company
        FROM partner_invitations pi
        JOIN partner_profiles pp ON pi.from_profile_id = pp.id
        JOIN users u ON pp.user_id = u.id
        JOIN companies c ON pp.company_id = c.id
        WHERE pi.to_profile_id = $1
        ORDER BY pi.sent_at DESC
      `;
      const receivedResult = await db.query(receivedQuery, [profileId]);
      receivedInvitations = receivedResult.rows;
    }

    res.json({
      success: true,
      data: {
        sent: sentInvitations,
        received: receivedInvitations
      }
    });

  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve invitations',
      details: error.message
    });
  }
});

// Mock data generation function (temporary)
async function generateMockPartnerResults(filters) {
  // This simulates the multi-persona partner evaluation
  const mockPartners = [
    {
      id: 1,
      name: 'TechVision Solutions',
      description: 'Enterprise software development and cloud architecture specialists',
      matchScore: 0.82,
      matchType: filters.matchType,
      capabilities: ['Cloud Architecture', 'API Development', 'DevOps', 'React/Node.js'],
      certifications: ['ISO 27001', 'SOC 2', 'AWS Certified'],
      regions: ['North America', 'Europe'],
      companySize: 'Medium (50-200)',
      currentCapacity: 65,
      website: 'https://techvisionsolutions.com',
      contactEmail: 'partnerships@techvisionsolutions.com',
      reasons: [
        'Fills your UX/UI design gap with strong frontend expertise',
        'Geographic coverage complements your West Coast presence',
        'Similar project size and client base'
      ],
      personas: {
        cfo: { score: 75, summary: 'Strong financial stability, compatible pricing models' },
        ciso: { score: 88, summary: 'Excellent security certifications and compliance' },
        operator: { score: 79, summary: 'Available capacity, proven delivery track record' },
        skeptic: { score: 65, summary: 'Some overlap in services, clear partnership terms needed' }
      }
    },
    {
      id: 2,
      name: 'DataPro Analytics',
      description: 'Data analytics and business intelligence specialists for healthcare',
      matchScore: 0.78,
      matchType: filters.matchType,
      capabilities: ['Data Analytics', 'Machine Learning', 'Business Intelligence', 'HIPAA Compliance'],
      certifications: ['GDPR Compliant', 'HIPAA Certified', 'SOC 2'],
      regions: ['North America'],
      companySize: 'Small (10-50)',
      currentCapacity: 80,
      website: 'https://datapro-analytics.com',
      contactEmail: 'hello@datapro-analytics.com',
      reasons: [
        'Adds critical data analytics capabilities to your offerings',
        'Healthcare industry expertise matches your target market',
        'Agile team structure aligns with your project approach'
      ],
      personas: {
        cfo: { score: 70, summary: 'Competitive rates, flexible engagement models' },
        ciso: { score: 92, summary: 'HIPAA certified, strong data governance practices' },
        operator: { score: 73, summary: 'Nimble team, quick turnaround times' },
        skeptic: { score: 68, summary: 'Smaller size may limit large project capacity' }
      }
    },
    {
      id: 3,
      name: 'GlobalDev Partners',
      description: 'Full-stack development and digital transformation consultancy',
      matchScore: 0.71,
      matchType: 'similar',
      capabilities: ['Full Stack Development', 'Mobile Apps', 'Cloud Migration', 'Enterprise Integration'],
      certifications: ['ISO 9001', 'CMMI Level 3', 'Microsoft Partner'],
      regions: ['Global'],
      companySize: 'Large (200+)',
      currentCapacity: 45,
      website: 'https://globaldev-partners.com',
      contactEmail: 'partnerships@globaldev-partners.com',
      reasons: [
        'Similar technical capabilities for capacity scaling',
        'Established processes for large enterprise projects',
        'Global delivery model provides 24/7 coverage'
      ],
      personas: {
        cfo: { score: 72, summary: 'Economies of scale, predictable costs' },
        ciso: { score: 76, summary: 'Mature security processes, regular audits' },
        operator: { score: 81, summary: 'Large capacity, proven scalability' },
        skeptic: { score: 60, summary: 'Potential client conflicts, needs clear boundaries' }
      }
    }
  ];

  // Filter based on search criteria
  let filteredPartners = mockPartners.filter(partner => {
    // Match type filter
    if (filters.matchType !== 'all' && partner.matchType !== filters.matchType) {
      return false;
    }
    
    // Minimum score filter
    if (partner.matchScore < filters.minScore) {
      return false;
    }
    
    return true;
  });

  return filteredPartners.slice(0, filters.limit);
}

module.exports = router;