const express = require('express');
const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { idParamSchema, intIdParamSchema, paginationSchema } = require('../middleware/validation');
const { heavyLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// All scoring routes require authentication
router.use(authenticateToken);

// Apply rate limiting for resource-intensive scoring operations
router.use(heavyLimiter);

/**
 * ProfileBasedScoringService
 * Adapts the existing OpportunityScoringService to work with company_profiles
 * instead of the old companies table
 */
class ProfileBasedScoringService {
  constructor() {
    this.db = Database.getInstance();
    
    // Define the Panel of Judges (same as original)
    this.judges = {
      technical: new ProfileTechnicalJudge(),
      domain: new ProfileDomainJudge(), 
      value: new ProfileValueJudge(),
      innovation: new ProfileInnovationJudge(),
      relationship: new ProfileRelationshipJudge()
    };
  }

  /**
   * Score opportunities for a user's profile
   */
  async scoreOpportunitiesForProfile(userId) {
    try {
      // Get user's profile
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Get all active opportunities
      const opportunities = await this.getActiveOpportunities();

      // Score each opportunity
      const scoringResults = [];
      for (const opportunity of opportunities) {
        try {
          const scoring = await this.scoreOpportunity(profile, opportunity);
          scoringResults.push({
            opportunityId: opportunity.id,
            title: opportunity.title,
            description: opportunity.description,
            industry: opportunity.industry,
            submissionDeadline: opportunity.submission_deadline,
            location: opportunity.location,
            buyerOrganization: opportunity.buyer_organization,
            ...scoring
          });
        } catch (error) {
          logger.warn(`Failed to score opportunity ${opportunity.id}:`, error);
          // Continue with other opportunities
        }
      }

      // Sort by score descending
      scoringResults.sort((a, b) => b.overallScore - a.overallScore);

      return scoringResults;

    } catch (error) {
      logger.error('Profile opportunity scoring failed:', error);
      throw error;
    }
  }

  /**
   * Get detailed scoring for a specific opportunity
   */
  async getOpportunityScoring(userId, opportunityId) {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      const opportunity = await this.getOpportunity(opportunityId);
      const scoring = await this.scoreOpportunity(profile, opportunity);

      return {
        profile: {
          name: profile.name,
          summary: profile.summary,
          businessType: profile.business_type
        },
        opportunity: {
          id: opportunity.id,
          title: opportunity.title,
          description: opportunity.description,
          industry: opportunity.industry,
          location: opportunity.location,
          buyerOrganization: opportunity.buyer_organization,
          submissionDeadline: opportunity.submission_deadline
        },
        ...scoring
      };

    } catch (error) {
      logger.error('Opportunity detail scoring failed:', error);
      throw error;
    }
  }

  /**
   * Core scoring logic adapted for profiles
   */
  async scoreOpportunity(profile, opportunity) {
    // Stage 1: Check hard constraints
    const constraintCheck = this.checkHardConstraints(profile, opportunity);
    
    if (!constraintCheck.passed) {
      return {
        overallScore: 0,
        verdict: 'REJECTED',
        constraintFailures: constraintCheck.failures,
        judgeScores: {},
        explanation: 'Hard constraints not met.',
        recommendations: ['Address constraint failures before applying'],
        nextSteps: ['❌ This opportunity is not suitable', '🔍 Look for opportunities better aligned with your profile']
      };
    }

    // Stage 2: Panel of Judges evaluation
    const judgeEvaluations = await this.runPanelOfJudges(profile, opportunity);

    // Calculate overall score (0-100 scale as required by MBF-103)
    const overallScore = this.calculateOverallScore(judgeEvaluations);

    // Generate improvement recommendations
    const recommendations = this.generateRecommendations(judgeEvaluations);
    const nextSteps = this.generateNextSteps(overallScore, judgeEvaluations);

    return {
      overallScore,
      verdict: overallScore >= 70 ? 'RECOMMENDED' : overallScore >= 50 ? 'POSSIBLE' : 'NOT_RECOMMENDED',
      constraintCheck,
      judgeScores: judgeEvaluations,
      explanation: this.generateOverallExplanation(judgeEvaluations, overallScore),
      recommendations,
      nextSteps,
      strengths: this.extractStrengths(judgeEvaluations),
      weaknesses: this.extractWeaknesses(judgeEvaluations)
    };
  }

  /**
   * Check hard constraints for profiles
   */
  checkHardConstraints(profile, opportunity) {
    const failures = [];
    let passed = true;

    // Check required certifications
    if (opportunity.required_certifications && opportunity.required_certifications.length > 0) {
      const profileCerts = profile.certifications || [];
      const missingCerts = opportunity.required_certifications.filter(
        cert => cert && !profileCerts.some(pc => pc && typeof pc === 'string' && pc.toLowerCase().includes(cert.toLowerCase()))
      );
      
      if (missingCerts.length > 0) {
        failures.push({
          type: 'certification',
          message: `Missing required certifications: ${missingCerts.join(', ')}`
        });
        passed = false;
      }
    }

    // Check required capabilities
    if (opportunity.required_capabilities && opportunity.required_capabilities.length > 0) {
      const profileCaps = profile.capabilities || [];
      const missingCaps = opportunity.required_capabilities.filter(
        cap => cap && !profileCaps.some(pc => pc && typeof pc === 'string' && pc.toLowerCase().includes(cap.toLowerCase()))
      );
      
      if (missingCaps.length > 0) {
        failures.push({
          type: 'capabilities',
          message: `Missing required capabilities: ${missingCaps.join(', ')}`
        });
        passed = false;
      }
    }

    return { passed, failures };
  }

  /**
   * Run Panel of Judges evaluation
   */
  async runPanelOfJudges(profile, opportunity) {
    const evaluations = {};

    for (const [judgeName, judge] of Object.entries(this.judges)) {
      evaluations[judgeName] = await judge.evaluate(profile, opportunity);
    }

    return evaluations;
  }

  /**
   * Calculate overall score (0-100 scale)
   */
  calculateOverallScore(judgeEvaluations) {
    const weights = {
      technical: 0.30,
      domain: 0.25,
      value: 0.20,
      innovation: 0.15,
      relationship: 0.10
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [judge, evaluation] of Object.entries(judgeEvaluations)) {
      const weight = weights[judge] || 0.2;
      weightedSum += evaluation.score * weight;
      totalWeight += weight;
    }

    return Math.round(weightedSum / totalWeight);
  }

  generateOverallExplanation(judgeEvaluations, overallScore) {
    if (overallScore >= 80) {
      return 'Excellent fit! Your profile strongly aligns with this opportunity across multiple evaluation criteria.';
    } else if (overallScore >= 60) {
      return 'Good potential fit. Some areas may need strengthening, but overall alignment is positive.';
    } else if (overallScore >= 40) {
      return 'Moderate fit. Significant improvements needed in key areas to be competitive.';
    } else {
      return 'Limited fit. This opportunity may not align well with your current profile and capabilities.';
    }
  }

  generateRecommendations(judgeEvaluations) {
    const recommendations = [];

    for (const [judgeName, evaluation] of Object.entries(judgeEvaluations)) {
      if (evaluation.score < 70 && evaluation.recommendations) {
        recommendations.push(...evaluation.recommendations);
      }
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  generateNextSteps(overallScore, judgeEvaluations) {
    const steps = [];

    if (overallScore >= 80) {
      steps.push('✅ Proceed with proposal - excellent fit');
      steps.push('📊 Emphasize your strongest areas in the executive summary');
      steps.push('🤝 Consider reaching out to buyer for questions');
    } else if (overallScore >= 60) {
      steps.push('⚠️ Address weaknesses before submitting');
      steps.push('🎯 Focus on improving lowest-scoring areas');
      steps.push('🤝 Consider partnerships to strengthen weak areas');
    } else {
      steps.push('❌ This opportunity may not be suitable');
      steps.push('🔍 Look for better-aligned opportunities');
      steps.push('📈 Use feedback to strengthen your profile');
    }

    return steps;
  }

  extractStrengths(judgeEvaluations) {
    return Object.entries(judgeEvaluations)
      .filter(([_, evaluation]) => evaluation.score >= 75)
      .map(([judge, evaluation]) => ({
        area: judge.charAt(0).toUpperCase() + judge.slice(1),
        score: evaluation.score,
        reasoning: evaluation.reasoning
      }));
  }

  extractWeaknesses(judgeEvaluations) {
    return Object.entries(judgeEvaluations)
      .filter(([_, evaluation]) => evaluation.score < 60)
      .map(([judge, evaluation]) => ({
        area: judge.charAt(0).toUpperCase() + judge.slice(1),
        score: evaluation.score,
        reasoning: evaluation.reasoning,
        recommendations: evaluation.recommendations
      }));
  }

  // Helper methods
  async getUserProfile(userId) {
    const result = await this.db.query('SELECT * FROM company_profiles WHERE user_id = $1', [userId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getActiveOpportunities() {
    // For now, use mock opportunities until opportunities table is created
    // In production, this would query the database or SAM.gov API
    return this.getMockOpportunities();
  }

  async getOpportunity(opportunityId) {
    const opportunities = this.getMockOpportunities();
    const opportunity = opportunities.find(opp => opp.id.toString() === opportunityId.toString());
    if (!opportunity) throw new Error('Opportunity not found');
    return opportunity;
  }

  /**
   * Mock opportunities for testing and development
   * In production, replace with database queries or SAM.gov API integration
   */
  getMockOpportunities() {
    return [
      {
        id: 1,
        title: 'IT Infrastructure Modernization Services',
        description: 'Comprehensive IT infrastructure modernization for federal agency including cloud migration, security enhancement, and system integration.',
        industry: 'Information Technology',
        buyer_organization: 'Department of Technology Services',
        buyer_type: 'government',
        location: 'Washington, DC',
        submission_deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        estimated_value: 2500000,
        naics_code: '541511',
        set_aside: 'Total_Small_Business',
        required_capabilities: [
          'Cloud Computing',
          'System Integration',
          'Cybersecurity',
          'Software Development'
        ],
        required_certifications: [
          'FedRAMP Ready',
          'ISO 27001'
        ],
        is_active: true
      },
      {
        id: 2,
        title: 'Data Analytics Platform Development',
        description: 'Development of advanced data analytics platform for performance measurement and business intelligence across multiple government agencies.',
        industry: 'Data Analytics',
        buyer_organization: 'Department of Performance Management',
        buyer_type: 'government',
        location: 'Remote/Multiple Locations',
        submission_deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        estimated_value: 1800000,
        naics_code: '541511',
        set_aside: 'SDVOSB',
        required_capabilities: [
          'Data Analytics',
          'Business Intelligence',
          'Software Development',
          'Data Visualization'
        ],
        required_certifications: [
          'Section 508 Compliance',
          'SDVOSB'
        ],
        is_active: true
      },
      {
        id: 3,
        title: 'Cybersecurity Assessment and Penetration Testing',
        description: 'Comprehensive cybersecurity assessment and penetration testing services for critical infrastructure and federal systems.',
        industry: 'Cybersecurity',
        buyer_organization: 'Department of Homeland Security',
        buyer_type: 'government',
        location: 'Various Federal Facilities',
        submission_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        estimated_value: 950000,
        naics_code: '541690',
        set_aside: 'WOSB',
        required_capabilities: [
          'Cybersecurity',
          'Penetration Testing',
          'Risk Assessment',
          'Security Consulting'
        ],
        required_certifications: [
          'CISSP',
          'CEH',
          'Security Clearance Required'
        ],
        is_active: true
      },
      {
        id: 4,
        title: 'Legacy System Modernization and Maintenance',
        description: 'Ongoing software development and maintenance services for legacy system modernization with focus on user experience and performance.',
        industry: 'Software Development',
        buyer_organization: 'General Services Administration',
        buyer_type: 'government',
        location: 'Washington, DC Metro Area',
        submission_deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days from now
        estimated_value: 1200000,
        naics_code: '541511',
        set_aside: 'HUBZone',
        required_capabilities: [
          'Software Development',
          'Legacy System Integration',
          'Web Development',
          'Database Design'
        ],
        required_certifications: [
          'HUBZone Certification'
        ],
        is_active: true
      },
      {
        id: 5,
        title: 'Cloud Infrastructure Design and Implementation',
        description: 'Cloud infrastructure design, implementation, and management services for multi-agency platform with emphasis on security and compliance.',
        industry: 'Cloud Computing',
        buyer_organization: 'Office of Management and Budget',
        buyer_type: 'government',
        location: 'National - Remote Work Possible',
        submission_deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days from now
        estimated_value: 3200000,
        naics_code: '518210',
        set_aside: 'Total_Small_Business',
        required_capabilities: [
          'Cloud Computing',
          'AWS',
          'Azure',
          'DevOps',
          'System Architecture'
        ],
        required_certifications: [
          'AWS Certified',
          'Azure Certified',
          'FedRAMP Authorized'
        ],
        is_active: true
      }
    ];
  }
}

// Profile-adapted judges (simplified versions focusing on profile data)
class ProfileTechnicalJudge {
  async evaluate(profile, opportunity) {
    let score = 50;
    const evidence = [];
    const recommendations = [];

    // Check capability alignment
    const requiredCaps = opportunity.required_capabilities || [];
    const profileCaps = profile.capabilities || [];
    
    const matchedCaps = requiredCaps.filter(cap => 
      cap && profileCaps.some(pc => pc && typeof pc === 'string' && pc.toLowerCase().includes(cap.toLowerCase()))
    );
    const capMatchRatio = requiredCaps.length > 0 ? matchedCaps.length / requiredCaps.length : 1;
    
    score += capMatchRatio * 30;
    evidence.push(`Matches ${matchedCaps.length}/${requiredCaps.length} required capabilities`);

    // Check certifications
    const requiredCerts = opportunity.required_certifications || [];
    const profileCerts = profile.certifications || [];
    
    const certMatchRatio = requiredCerts.length > 0 ? 
      requiredCerts.filter(cert => profileCerts.includes(cert)).length / requiredCerts.length : 1;
    
    score += certMatchRatio * 20;
    evidence.push(`Has ${profileCerts.length} certifications`);

    if (capMatchRatio < 1) {
      recommendations.push('Develop missing capabilities to strengthen technical fit');
    }
    if (certMatchRatio < 1) {
      recommendations.push('Consider obtaining additional relevant certifications');
    }

    return {
      score: Math.min(100, score),
      verdict: score >= 70 ? 'O' : 'X',
      confidence: 0.88,
      reasoning: `Technical evaluation: ${Math.round(capMatchRatio * 100)}% capability match, ${profileCerts.length} certifications`,
      evidence,
      recommendations: recommendations.length > 0 ? recommendations : ['Maintain technical excellence']
    };
  }
}

class ProfileDomainJudge {
  async evaluate(profile, opportunity) {
    let score = 40;
    const evidence = [];
    const recommendations = [];

    // Check NAICS code alignment with opportunity industry
    const profileNaics = profile.naics || [];
    const oppIndustry = opportunity.industry;
    
    // Simple industry matching (can be enhanced)
    let hasIndustryMatch = false;
    if (oppIndustry && profileNaics.length > 0) {
      // This is simplified - in production you'd have a NAICS to industry mapping
      hasIndustryMatch = true; // Assume some match for now
      score += 30;
      evidence.push(`NAICS codes indicate relevant industry experience`);
    } else {
      recommendations.push(`Build experience in ${oppIndustry} industry`);
    }

    // Check past performance relevance
    const pastPerf = profile.pastPerformance || [];
    if (pastPerf.length > 0) {
      score += 20;
      evidence.push(`${pastPerf.length} past performance entries demonstrate experience`);
    } else {
      recommendations.push('Document past performance to strengthen domain credibility');
    }

    // Business type alignment
    if (profile.business_type === 'small_business' && opportunity.buyer_type === 'government') {
      score += 10;
      evidence.push('Small business status advantageous for government contracts');
    }

    return {
      score: Math.min(100, score),
      verdict: score >= 70 ? 'O' : 'X',
      confidence: 0.82,
      reasoning: `Domain expertise based on industry alignment and experience track record`,
      evidence,
      recommendations: recommendations.length > 0 ? recommendations : ['Leverage domain expertise in proposal']
    };
  }
}

class ProfileValueJudge {
  async evaluate(profile, opportunity) {
    let score = 50;
    const evidence = [];
    const recommendations = [];

    // Company size value proposition
    if (profile.business_type === 'small_business') {
      score += 20;
      evidence.push('Small business provides competitive pricing advantage');
    }

    // Employee count efficiency
    if (profile.employee_count && profile.employee_count >= 10 && profile.employee_count <= 100) {
      score += 15;
      evidence.push('Right-sized team for efficient delivery');
    }

    // Annual revenue stability
    if (profile.annual_revenue && profile.annual_revenue > 1000000) {
      score += 15;
      evidence.push('Financial stability demonstrated by revenue history');
    }

    return {
      score: Math.min(100, score),
      verdict: score >= 65 ? 'O' : 'X',
      confidence: 0.78,
      reasoning: 'Value assessment based on business size, team efficiency, and financial stability',
      evidence,
      recommendations: recommendations.length > 0 ? recommendations : ['Emphasize value proposition and ROI']
    };
  }
}

class ProfileInnovationJudge {
  async evaluate(profile, opportunity) {
    let score = 45;
    const evidence = [];
    const recommendations = [];

    // Check for innovative capabilities
    const capabilities = profile.capabilities || [];
    const innovativeTerms = ['AI', 'machine learning', 'blockchain', 'IoT', 'cloud', 'automation'];
    
    const hasInnovative = capabilities.some(cap => 
      cap && typeof cap === 'string' && innovativeTerms.some(term => 
        cap.toLowerCase().includes(term.toLowerCase())
      )
    );

    if (hasInnovative) {
      score += 35;
      evidence.push('Profile includes innovative capabilities and technologies');
    } else {
      recommendations.push('Highlight innovative approaches and unique methodologies');
    }

    // Diverse capabilities indicate innovation
    if (capabilities.length > 3) {
      score += 20;
      evidence.push('Diverse capability portfolio shows innovation potential');
    }

    return {
      score: Math.min(100, score),
      verdict: score >= 60 ? 'O' : 'X',
      confidence: 0.73,
      reasoning: 'Innovation assessment based on technology adoption and diverse capabilities',
      evidence,
      recommendations: recommendations.length > 0 ? recommendations : ['Showcase innovative solutions']
    };
  }
}

class ProfileRelationshipJudge {
  async evaluate(profile, opportunity) {
    let score = 40;
    const evidence = [];
    const recommendations = [];

    // Geographic alignment
    const serviceAreas = profile.serviceAreas || [];
    const oppLocation = opportunity.location || '';
    
    if (serviceAreas.some(area => oppLocation.includes(area)) || serviceAreas.includes('Remote')) {
      score += 30;
      evidence.push('Service areas align with opportunity location');
    } else {
      recommendations.push('Establish presence in opportunity location or emphasize remote capabilities');
    }

    // Business type relationship
    if (opportunity.buyer_type === 'government' && profile.business_type === 'small_business') {
      score += 20;
      evidence.push('Small business status aligns with government contracting preferences');
    }

    return {
      score: Math.min(100, score),
      verdict: score >= 65 ? 'O' : 'X',
      confidence: 0.76,
      reasoning: 'Relationship potential based on geographic and business type alignment',
      evidence,
      recommendations: recommendations.length > 0 ? recommendations : ['Build relationships through engagement']
    };
  }
}

const profileScoringService = new ProfileBasedScoringService();

/**
 * GET /api/scoring/opportunities
 * Get opportunities scored for current user's profile
 */
router.get('/opportunities', async (req, res) => {
  try {
    const userId = req.user.id;
    const scoringResults = await profileScoringService.scoreOpportunitiesForProfile(userId);

    res.json({
      opportunities: scoringResults,
      count: scoringResults.length,
      userId: userId
    });

  } catch (error) {
    logger.error('Error scoring opportunities for profile:', error);
    
    if (error.message === 'User profile not found') {
      return res.status(404).json({
        error: 'Company profile not found. Please create your profile first.',
        createProfileUrl: '/api/profiles'
      });
    }

    res.status(500).json({
      error: 'Failed to score opportunities'
    });
  }
});

/**
 * GET /api/scoring/opportunities/:id
 * Get detailed scoring for a specific opportunity
 */
router.get('/opportunities/:id', validate(intIdParamSchema, 'params'), async (req, res) => {
  try {
    const userId = req.user.id;
    const opportunityId = req.params.id;
    
    const scoring = await profileScoringService.getOpportunityScoring(userId, opportunityId);

    res.json({
      scoring: scoring
    });

  } catch (error) {
    logger.error('Error getting opportunity scoring detail:', error);
    
    if (error.message === 'User profile not found') {
      return res.status(404).json({
        error: 'Company profile not found. Please create your profile first.'
      });
    }
    
    if (error.message === 'Opportunity not found') {
      return res.status(404).json({
        error: 'Opportunity not found'
      });
    }

    res.status(500).json({
      error: 'Failed to get opportunity scoring'
    });
  }
});

module.exports = router;