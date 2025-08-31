const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

class PartnershipMatchingService {
  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Algorithm 2: Supplier-to-Supplier Matching
   * Finds complementary suppliers for partnerships and joint ventures
   */
  async findPartnershipMatches(companyId, options = {}) {
    try {
      logger.info(`Finding partnership matches for company ${companyId}`);

      // Get the requesting company's profile
      const companyResult = await this.db.query(
        'SELECT * FROM companies WHERE id = $1',
        [companyId]
      );

      if (companyResult.rows.length === 0) {
        throw new Error('Company not found');
      }

      const sourceCompany = companyResult.rows[0];

      // Get all potential partner companies
      const potentialPartners = await this.db.query(
        'SELECT * FROM companies WHERE id != $1',
        [companyId]
      );

      // Calculate partnership scores for each potential partner
      const partnershipScores = [];

      for (const partner of potentialPartners.rows) {
        const score = await this.calculatePartnershipScore(sourceCompany, partner);
        
        if (score.overall >= (options.minScore || 60)) {
          partnershipScores.push({
            partner,
            score,
            recommendations: this.generatePartnershipRecommendations(sourceCompany, partner, score)
          });
        }
      }

      // Sort by overall score
      partnershipScores.sort((a, b) => b.score.overall - a.score.overall);

      // Store top partnerships in database
      await this.storePartnershipRecommendations(companyId, partnershipScores.slice(0, 5));

      logger.info(`Found ${partnershipScores.length} potential partnerships for ${sourceCompany.name}`);

      return {
        companyId,
        companyName: sourceCompany.name,
        totalMatches: partnershipScores.length,
        topMatches: partnershipScores.slice(0, 10),
        partnershipBundles: this.createPartnershipBundles(sourceCompany, partnershipScores)
      };

    } catch (error) {
      logger.error('Partnership matching failed:', error);
      throw error;
    }
  }

  /**
   * Calculate partnership compatibility score between two companies
   */
  calculatePartnershipScore(company1, company2) {
    // Complementarity Score: Different but adjacent capabilities
    const complementarityScore = this.calculateComplementarity(
      company1.capabilities || [],
      company2.capabilities || []
    );

    // Coverage Score: Combined capabilities coverage
    const coverageScore = this.calculateCoverage(
      company1.capabilities || [],
      company2.capabilities || [],
      company1.industries || [],
      company2.industries || []
    );

    // Geographic Synergy: Service region overlap/extension
    const geographicScore = this.calculateGeographicSynergy(
      company1.service_regions || [],
      company2.service_regions || []
    );

    // Size Compatibility: Similar or complementary sizes
    const sizeScore = this.calculateSizeCompatibility(
      company1.size_category,
      company2.size_category,
      company1.team_size,
      company2.team_size
    );

    // Certification Synergy: Combined certifications value
    const certificationScore = this.calculateCertificationSynergy(
      company1.certifications || [],
      company2.certifications || []
    );

    // Relationship Potential: Shared clients, industries
    const relationshipScore = this.calculateRelationshipPotential(
      company1,
      company2
    );

    // Calculate overall score (weighted average)
    const overall = (
      complementarityScore * 0.25 +
      coverageScore * 0.20 +
      geographicScore * 0.15 +
      sizeScore * 0.15 +
      certificationScore * 0.15 +
      relationshipScore * 0.10
    );

    return {
      overall: Math.round(overall),
      complementarity: Math.round(complementarityScore),
      coverage: Math.round(coverageScore),
      geographic: Math.round(geographicScore),
      size: Math.round(sizeScore),
      certification: Math.round(certificationScore),
      relationship: Math.round(relationshipScore),
      breakdown: {
        sharedCapabilities: this.getSharedCapabilities(company1.capabilities, company2.capabilities),
        uniqueCapabilities: this.getUniqueCapabilities(company1.capabilities, company2.capabilities),
        combinedRegions: this.getCombinedRegions(company1.service_regions, company2.service_regions),
        combinedCertifications: this.getCombinedCertifications(company1.certifications, company2.certifications)
      }
    };
  }

  /**
   * Calculate complementarity - want different but related capabilities
   */
  calculateComplementarity(caps1, caps2) {
    if (!caps1.length || !caps2.length) return 0;

    const shared = caps1.filter(cap => caps2.includes(cap)).length;
    const unique1 = caps1.filter(cap => !caps2.includes(cap)).length;
    const unique2 = caps2.filter(cap => !caps1.includes(cap)).length;
    
    // Ideal is some overlap (20-40%) but mostly complementary
    const overlapRatio = shared / (caps1.length + caps2.length);
    const complementRatio = (unique1 + unique2) / (caps1.length + caps2.length);
    
    let score = 0;
    
    // Some overlap is good (shows compatibility)
    if (overlapRatio >= 0.1 && overlapRatio <= 0.4) {
      score += 40;
    } else if (overlapRatio < 0.1) {
      score += 20; // Too different
    } else {
      score += 10; // Too similar
    }
    
    // High complement ratio is good
    score += complementRatio * 60;
    
    return Math.min(100, score);
  }

  /**
   * Calculate combined coverage potential
   */
  calculateCoverage(caps1, caps2, ind1, ind2) {
    const combinedCaps = new Set([...caps1, ...caps2]);
    const combinedIndustries = new Set([...ind1, ...ind2]);
    
    // More combined capabilities and industries = better coverage
    const capScore = Math.min(100, combinedCaps.size * 5);
    const indScore = Math.min(100, combinedIndustries.size * 12);
    
    return (capScore + indScore) / 2;
  }

  /**
   * Calculate geographic synergy
   */
  calculateGeographicSynergy(regions1, regions2) {
    if (!regions1.length || !regions2.length) return 50;

    const shared = regions1.filter(r => regions2.includes(r)).length;
    const combined = new Set([...regions1, ...regions2]).size;
    
    // Some overlap is good, but extension is also valuable
    const overlapScore = (shared / Math.min(regions1.length, regions2.length)) * 40;
    const extensionScore = (combined / (regions1.length + regions2.length)) * 60;
    
    return Math.min(100, overlapScore + extensionScore);
  }

  /**
   * Calculate size compatibility
   */
  calculateSizeCompatibility(size1, size2, team1, team2) {
    const sizeMap = { 'small': 1, 'medium': 2, 'large': 3, 'enterprise': 4 };
    const sizeDiff = Math.abs((sizeMap[size1] || 2) - (sizeMap[size2] || 2));
    
    // Similar sizes or one-step difference is ideal
    let score = 100 - (sizeDiff * 25);
    
    // Consider team size ratio
    if (team1 && team2) {
      const ratio = Math.min(team1, team2) / Math.max(team1, team2);
      score = (score + ratio * 100) / 2;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate certification synergy
   */
  calculateCertificationSynergy(certs1, certs2) {
    if (!certs1.length && !certs2.length) return 50;
    
    const combined = new Set([...certs1, ...certs2]);
    const shared = certs1.filter(c => certs2.includes(c)).length;
    
    // More combined certifications = better
    // Some shared certifications show alignment
    const combinedScore = Math.min(100, combined.size * 10);
    const sharedScore = shared > 0 ? 20 : 0;
    
    return Math.min(100, combinedScore + sharedScore);
  }

  /**
   * Calculate relationship potential
   */
  calculateRelationshipPotential(company1, company2) {
    let score = 50; // Base score
    
    // Shared industries increase potential
    const sharedIndustries = (company1.industries || []).filter(
      i => (company2.industries || []).includes(i)
    ).length;
    score += sharedIndustries * 10;
    
    // Credibility scores alignment
    if (company1.credibility_score && company2.credibility_score) {
      const credDiff = Math.abs(company1.credibility_score - company2.credibility_score);
      score += Math.max(0, 30 - credDiff);
    }
    
    return Math.min(100, score);
  }

  /**
   * Helper methods for capability analysis
   */
  getSharedCapabilities(caps1 = [], caps2 = []) {
    return caps1.filter(cap => caps2.includes(cap));
  }

  getUniqueCapabilities(caps1 = [], caps2 = []) {
    return {
      company1: caps1.filter(cap => !caps2.includes(cap)),
      company2: caps2.filter(cap => !caps1.includes(cap))
    };
  }

  getCombinedRegions(regions1 = [], regions2 = []) {
    return [...new Set([...regions1, ...regions2])];
  }

  getCombinedCertifications(certs1 = [], certs2 = []) {
    return [...new Set([...certs1, ...certs2])];
  }

  /**
   * Generate partnership recommendations
   */
  generatePartnershipRecommendations(company1, company2, score) {
    const recommendations = [];

    // Based on score breakdown, generate specific recommendations
    if (score.complementarity > 80) {
      recommendations.push({
        type: 'strategic',
        title: 'Strong Complementary Partnership',
        description: `${company1.name} and ${company2.name} have highly complementary capabilities that could create comprehensive solutions.`,
        action: 'Explore joint venture opportunities for end-to-end service offerings'
      });
    }

    if (score.geographic > 70) {
      recommendations.push({
        type: 'geographic',
        title: 'Geographic Expansion Opportunity',
        description: 'Partnership enables expanded geographic reach and market penetration.',
        action: 'Consider regional partnership agreements for market expansion'
      });
    }

    if (score.certification > 80) {
      recommendations.push({
        type: 'compliance',
        title: 'Enhanced Compliance Portfolio',
        description: 'Combined certifications open doors to restricted/regulated markets.',
        action: 'Target government and enterprise contracts requiring multiple certifications'
      });
    }

    // Add specific opportunity recommendations
    if (score.breakdown.sharedCapabilities.length > 2) {
      recommendations.push({
        type: 'collaboration',
        title: 'Immediate Collaboration Areas',
        description: `Shared expertise in ${score.breakdown.sharedCapabilities.slice(0, 3).join(', ')} enables quick wins.`,
        action: 'Start with pilot project in overlapping capability areas'
      });
    }

    return recommendations;
  }

  /**
   * Create partnership bundles for specific opportunity types
   */
  createPartnershipBundles(sourceCompany, partnershipScores) {
    const bundles = [];

    // Bundle 1: Maximum Coverage Bundle
    const coverageBundle = this.createCoverageBundle(sourceCompany, partnershipScores);
    if (coverageBundle) bundles.push(coverageBundle);

    // Bundle 2: Geographic Expansion Bundle
    const geoBundle = this.createGeographicBundle(sourceCompany, partnershipScores);
    if (geoBundle) bundles.push(geoBundle);

    // Bundle 3: Certification Power Bundle
    const certBundle = this.createCertificationBundle(sourceCompany, partnershipScores);
    if (certBundle) bundles.push(certBundle);

    return bundles;
  }

  createCoverageBundle(sourceCompany, scores) {
    // Select 2-3 partners that maximize capability coverage
    const selected = [];
    const coveredCaps = new Set(sourceCompany.capabilities || []);
    
    for (const item of scores) {
      const newCaps = (item.partner.capabilities || []).filter(c => !coveredCaps.has(c));
      if (newCaps.length > 0 && selected.length < 3) {
        selected.push(item);
        newCaps.forEach(c => coveredCaps.add(c));
      }
    }

    if (selected.length === 0) return null;

    return {
      type: 'maximum_coverage',
      title: 'Maximum Capability Coverage',
      description: 'This partnership bundle provides the broadest capability coverage for comprehensive solutions',
      partners: selected.map(s => ({
        id: s.partner.id,
        name: s.partner.name,
        contribution: s.score.breakdown.uniqueCapabilities.company2
      })),
      totalCapabilities: coveredCaps.size,
      estimatedValueIncrease: '35-45%'
    };
  }

  createGeographicBundle(sourceCompany, scores) {
    // Select partners that expand geographic reach
    const selected = scores
      .filter(s => s.score.geographic > 70)
      .slice(0, 2);

    if (selected.length === 0) return null;

    const combinedRegions = new Set(sourceCompany.service_regions || []);
    selected.forEach(s => {
      (s.partner.service_regions || []).forEach(r => combinedRegions.add(r));
    });

    return {
      type: 'geographic_expansion',
      title: 'Geographic Market Expansion',
      description: 'Expand your market reach through strategic regional partnerships',
      partners: selected.map(s => ({
        id: s.partner.id,
        name: s.partner.name,
        newRegions: s.partner.service_regions.filter(
          r => !sourceCompany.service_regions.includes(r)
        )
      })),
      totalRegions: combinedRegions.size,
      estimatedValueIncrease: '25-35%'
    };
  }

  createCertificationBundle(sourceCompany, scores) {
    // Select partners with valuable certifications
    const selected = scores
      .filter(s => s.score.certification > 70)
      .slice(0, 2);

    if (selected.length === 0) return null;

    const combinedCerts = new Set(sourceCompany.certifications || []);
    selected.forEach(s => {
      (s.partner.certifications || []).forEach(c => combinedCerts.add(c));
    });

    return {
      type: 'certification_power',
      title: 'Compliance & Certification Bundle',
      description: 'Access restricted markets with combined certification portfolio',
      partners: selected.map(s => ({
        id: s.partner.id,
        name: s.partner.name,
        keyCertifications: s.partner.certifications
      })),
      totalCertifications: combinedCerts.size,
      unlockedMarkets: ['Government', 'Healthcare', 'Finance'],
      estimatedValueIncrease: '40-60%'
    };
  }

  /**
   * Store partnership recommendations in database
   */
  async storePartnershipRecommendations(companyId, partnerships) {
    try {
      for (const partnership of partnerships) {
        await this.db.query(`
          INSERT INTO partnership_recommendations 
          (company_a_id, company_b_id, complementarity_score, coverage_score, 
           relationship_score, overall_partnership_score, partnership_type,
           shared_capabilities, complementary_capabilities, geographic_synergy)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (company_a_id, company_b_id) 
          DO UPDATE SET 
            complementarity_score = $3,
            coverage_score = $4,
            relationship_score = $5,
            overall_partnership_score = $6,
            updated_at = NOW()
        `, [
          companyId,
          partnership.partner.id,
          partnership.score.complementarity,
          partnership.score.coverage,
          partnership.score.relationship,
          partnership.score.overall,
          'strategic',
          partnership.score.breakdown.sharedCapabilities,
          [...partnership.score.breakdown.uniqueCapabilities.company1, 
           ...partnership.score.breakdown.uniqueCapabilities.company2],
          partnership.score.geographic > 70
        ]);
      }
    } catch (error) {
      logger.error('Failed to store partnership recommendations:', error);
    }
  }
}

module.exports = { PartnershipMatchingService };