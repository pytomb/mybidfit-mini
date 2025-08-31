const { Database } = require('../database/connection');

class PartnerFitService {
  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Search for partner matches based on criteria
   */
  async searchPartners(userId, searchFilters) {
    try {
      // For MVP, return mock data that matches our frontend structure
      // TODO: Implement real database queries and scoring algorithm
      
      const mockPartners = [
        {
          id: 1,
          name: 'TechVision Solutions',
          description: 'Enterprise software development and cloud architecture specialists',
          matchScore: 0.82,
          matchType: searchFilters.matchType,
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
            'Similar project size and client base align well'
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
          matchType: searchFilters.matchType,
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
        },
        {
          id: 4,
          name: 'SecureCloud Systems',
          description: 'Cybersecurity and cloud infrastructure specialists',
          matchScore: 0.85,
          matchType: 'complementary',
          capabilities: ['Cybersecurity', 'Cloud Security', 'Penetration Testing', 'Compliance Auditing'],
          certifications: ['ISO 27001', 'SOC 2', 'CISSP', 'CISA'],
          regions: ['North America', 'Europe'],
          companySize: 'Medium (75-150)',
          currentCapacity: 70,
          website: 'https://securecloud-systems.com',
          contactEmail: 'partnerships@securecloud-systems.com',
          reasons: [
            'Security expertise fills critical compliance gaps',
            'Strong track record with enterprise security requirements',
            'Complementary services enhance your overall offering'
          ],
          personas: {
            cfo: { score: 80, summary: 'Proven ROI on security investments, competitive rates' },
            ciso: { score: 95, summary: 'Industry-leading security certifications and expertise' },
            operator: { score: 77, summary: 'Reliable delivery, strong project management' },
            skeptic: { score: 72, summary: 'Established reputation, clear service boundaries' }
          }
        }
      ];

      // Filter based on search criteria
      let filteredPartners = mockPartners.filter(partner => {
        // Match type filter
        if (searchFilters.matchType !== 'all' && partner.matchType !== searchFilters.matchType) {
          return false;
        }
        
        // Minimum score filter
        if (partner.matchScore < searchFilters.minScore) {
          return false;
        }

        // Industry filter (if specified)
        if (searchFilters.industries && searchFilters.industries.length > 0) {
          // For now, just return all since we don't have industry data in mock
          // TODO: Implement proper industry matching
        }

        // Capability filter (if specified)
        if (searchFilters.capabilities && searchFilters.capabilities.length > 0) {
          const hasCapabilityMatch = searchFilters.capabilities.some(capability =>
            partner.capabilities.some(partnerCap => 
              partnerCap.toLowerCase().includes(capability.toLowerCase())
            )
          );
          if (!hasCapabilityMatch) {
            return false;
          }
        }

        // Certification filter (if specified)
        if (searchFilters.certifications && searchFilters.certifications.length > 0) {
          const hasCertificationMatch = searchFilters.certifications.some(cert =>
            partner.certifications.some(partnerCert => 
              partnerCert.toLowerCase().includes(cert.toLowerCase())
            )
          );
          if (!hasCertificationMatch) {
            return false;
          }
        }

        return true;
      });

      // Sort by match score
      filteredPartners.sort((a, b) => b.matchScore - a.matchScore);

      return filteredPartners.slice(0, searchFilters.limit || 20);

    } catch (error) {
      console.error('Partner search error:', error);
      throw error;
    }
  }

  /**
   * Calculate multi-persona scores for a partnership
   */
  calculatePartnerScore(seekerProfile, partnerProfile, opportunity = null) {
    // This implements the multi-persona evaluation inspired by the Partner Finder PRD
    
    const scores = {
      cfo: this.calculateCFOScore(seekerProfile, partnerProfile, opportunity),
      ciso: this.calculateCISOScore(seekerProfile, partnerProfile, opportunity),
      operator: this.calculateOperatorScore(seekerProfile, partnerProfile, opportunity),
      skeptic: this.calculateSkepticScore(seekerProfile, partnerProfile, opportunity)
    };

    // Calculate overall match score (weighted average)
    const overallScore = (
      scores.cfo * 0.25 +
      scores.ciso * 0.25 +
      scores.operator * 0.30 +
      scores.skeptic * 0.20
    ) / 100;

    return {
      overallScore,
      personas: scores
    };
  }

  calculateCFOScore(seeker, partner, opportunity) {
    // CFO cares about financial compatibility, pricing models, and ROI
    let score = 70; // Base score

    // Financial stability indicators
    if (partner.certifications && (partner.certifications.includes('SOC 2') || partner.certifications.includes('ISO 9001'))) {
      score += 10;
    }

    // Size compatibility (similar sizes often have compatible pricing)
    if (this.isSimilarCompanySize(seeker.companySize, partner.companySize)) {
      score += 5;
    }

    // Capacity availability (affects pricing)
    if (partner.currentCapacity > 60) {
      score += 10;
    } else if (partner.currentCapacity < 30) {
      score -= 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  calculateCISOScore(seeker, partner, opportunity) {
    // CISO cares about security certifications, compliance, and risk
    let score = 60; // Base score

    // Security certifications
    const securityCerts = ['ISO 27001', 'SOC 2', 'HIPAA Certified', 'CISSP', 'CISA'];
    const partnerSecurityCerts = partner.certifications ? partner.certifications.filter(cert => 
      securityCerts.some(secCert => cert.includes(secCert))
    ).length : 0;

    score += partnerSecurityCerts * 15; // Up to 75 points for 5 certs

    // Industry-specific compliance
    if (opportunity && opportunity.industry === 'healthcare' && partner.certifications && partner.certifications.includes('HIPAA Certified')) {
      score += 15;
    }

    if (opportunity && opportunity.industry === 'finance' && partner.certifications && partner.certifications.includes('SOC 2')) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  calculateOperatorScore(seeker, partner, opportunity) {
    // Operator cares about delivery capability, capacity, and operational compatibility
    let score = 65; // Base score

    // Capacity availability
    if (partner.currentCapacity > 70) {
      score += 15;
    } else if (partner.currentCapacity > 50) {
      score += 10;
    } else if (partner.currentCapacity < 30) {
      score -= 15;
    }

    // Geographic compatibility
    if (seeker.regions && partner.regions) {
      const sharedRegions = seeker.regions.filter(region => 
        partner.regions.includes(region)
      ).length;
      score += sharedRegions * 5; // Up to 15 points for 3 shared regions
    }

    // Process maturity indicators
    if (partner.certifications && (partner.certifications.includes('CMMI Level 3') || partner.certifications.includes('ISO 9001'))) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  calculateSkepticScore(seeker, partner, opportunity) {
    // Skeptic looks for potential conflicts, risks, and red flags
    let score = 80; // Start optimistic, deduct for issues

    // Capability overlap (potential competition)
    if (seeker.capabilities && partner.capabilities) {
      const overlapCount = seeker.capabilities.filter(cap =>
        partner.capabilities.some(partnerCap => 
          partnerCap.toLowerCase().includes(cap.toLowerCase())
        )
      ).length;

      if (overlapCount > 3) {
        score -= 15; // High overlap = more competition risk
      } else if (overlapCount > 1) {
        score -= 5;
      }
    }

    // Size mismatch risks
    if (seeker.companySize && partner.companySize) {
      if ((seeker.companySize.includes('Small') && partner.companySize.includes('Large')) ||
          (seeker.companySize.includes('Large') && partner.companySize.includes('Small'))) {
        score -= 10; // Size mismatch can cause cultural/process issues
      }
    }

    // Low capacity = delivery risk
    if (partner.currentCapacity < 40) {
      score -= 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  isSimilarCompanySize(size1, size2) {
    if (!size1 || !size2) return false;
    
    const sizeCategories = {
      'Small': ['Small', '1-10', '10-50'],
      'Medium': ['Medium', '50-200', '75-150'],
      'Large': ['Large', '200+', 'Enterprise']
    };

    for (const category of Object.keys(sizeCategories)) {
      const sizes = sizeCategories[category];
      if (sizes.some(s => size1.includes(s)) && sizes.some(s => size2.includes(s))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate explainable reasons for why partners match
   */
  generateMatchReasons(seekerProfile, partnerProfile, matchType, scores) {
    const reasons = [];

    if (matchType === 'complementary') {
      if (scores.ciso > 80) {
        reasons.push('Strong security and compliance capabilities fill critical gaps');
      }
      if (scores.operator > 75) {
        reasons.push('Geographic coverage and capacity complement your current reach');
      }
      if (partnerProfile.capabilities) {
        reasons.push(`Specialized expertise in ${partnerProfile.capabilities.slice(0, 2).join(' and ')} enhances your service offering`);
      }
    } else if (matchType === 'similar') {
      if (scores.operator > 75) {
        reasons.push('Similar operational capabilities enable effective capacity scaling');
      }
      if (scores.cfo > 70) {
        reasons.push('Compatible business model and pricing structure');
      }
      if (this.isSimilarCompanySize(seekerProfile.companySize, partnerProfile.companySize)) {
        reasons.push('Similar company size suggests cultural and process alignment');
      }
    }

    // Add general reasons
    if (scores.cfo > 80) {
      reasons.push('Strong financial stability and competitive engagement models');
    }
    if (partnerProfile.currentCapacity > 70) {
      reasons.push('High available capacity for immediate partnership opportunities');
    }

    return reasons.slice(0, 3); // Return top 3 reasons
  }
}

module.exports = { PartnerFitService };