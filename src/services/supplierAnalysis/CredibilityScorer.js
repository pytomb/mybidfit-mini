const { logger } = require('../../utils/logger');

/**
 * CredibilityScorer - Calculates supplier credibility scores based on multiple factors
 * Separated from main service for focused responsibility and easier testing
 */
class CredibilityScorer {
  /**
   * Calculate comprehensive credibility score for a supplier
   * @param {Object} company - Company database record
   * @param {Object} analysisData - Analyzed data from websites/documents
   * @returns {number} Credibility score (0-10 scale)
   */
  calculateCredibilityScore(company, analysisData = {}) {
    try {
      let score = 0;
      
      // Check if this is a minimal data company (very basic profile)
      const hasMinimalData = this.hasMinimalData(company, analysisData);
      
      // Years of experience (up to 4 points)
      score += this.scoreExperience(company, analysisData);
      
      // Project portfolio (up to 2 points)
      score += this.scoreProjectPortfolio(company, analysisData);
      
      // Certifications (up to 2 points)
      score += this.scoreCertifications(analysisData);
      
      // Team size (up to 1.5 points)
      score += this.scoreTeamSize(company, analysisData);
      
      // Customer testimonials (up to 1 point)
      score += this.scoreTestimonials(analysisData);
      
      // Financial stability bonus
      score += this.scoreFinancialStability(analysisData);
      
      // Domain expertise bonus (up to 2 points)
      score += this.scoreDomainExpertise(analysisData);
      
      // Apply penalties for minimal or questionable suppliers
      score = this.applyQualityPenalties(score, company, analysisData, hasMinimalData);
      
      // Normalize to 0-10 scale
      const finalScore = Math.min(Math.max(score, 0), 10);
      
      logger.debug(`Credibility score calculated: ${finalScore.toFixed(2)} for ${company.name}`);
      return finalScore;
      
    } catch (error) {
      logger.error('Credibility scoring failed:', error);
      return 3.0; // Default safe score
    }
  }

  /**
   * Check if company has minimal data
   */
  hasMinimalData(company, analysisData) {
    const hasWebsiteData = analysisData?.description?.length > 50;
    const hasCaseStudies = (analysisData?.caseStudies?.length || 0) > 0;
    const hasServices = (analysisData?.services?.length || 0) > 2;
    const hasDBExperience = company.years_experience > 0;
    
    return !hasWebsiteData && !hasCaseStudies && !hasServices && !hasDBExperience;
  }

  /**
   * Score years of experience (up to 4 points)
   */
  scoreExperience(company, analysisData) {
    const yearsExperience = analysisData?.yearsInBusiness || company.years_experience || 0;
    
    if (yearsExperience >= 15) {
      return 4; // Excellent experience
    } else if (yearsExperience >= 10) {
      return 3;
    } else if (yearsExperience >= 5) {
      return 2;
    } else if (yearsExperience >= 2) {
      return 1;
    } else {
      return yearsExperience * 0.2; // Very low for < 2 years
    }
  }

  /**
   * Score project portfolio (up to 2 points)
   */
  scoreProjectPortfolio(company, analysisData) {
    const projectCount = analysisData?.caseStudies?.length || company.total_projects || 0;
    
    if (projectCount >= 20) {
      return 2; // Extensive portfolio
    } else if (projectCount >= 10) {
      return 1.5;
    } else if (projectCount >= 5) {
      return 1;
    } else if (projectCount >= 2) {
      return 0.5;
    } else {
      return projectCount * 0.1; // Very low for few projects
    }
  }

  /**
   * Score certifications (up to 2 points)
   */
  scoreCertifications(analysisData) {
    const certCount = analysisData?.certifications?.length || 0;
    
    if (certCount >= 4) {
      return 2; // Multiple industry certifications
    } else if (certCount >= 2) {
      return 1;
    } else if (certCount >= 1) {
      return 0.5;
    }
    
    return 0;
  }

  /**
   * Score team size (up to 1.5 points)
   */
  scoreTeamSize(company, analysisData) {
    const teamSize = analysisData?.teamSize || company.team_size || 0;
    
    if (teamSize >= 100) {
      return 1.5; // Large established team
    } else if (teamSize >= 50) {
      return 1;
    } else if (teamSize >= 20) {
      return 0.7;
    } else if (teamSize >= 10) {
      return 0.5;
    } else {
      return teamSize * 0.01; // Very low for small teams
    }
  }

  /**
   * Score customer testimonials (up to 1 point)
   */
  scoreTestimonials(analysisData) {
    const testimonialCount = analysisData?.testimonials?.length || 0;
    
    if (testimonialCount >= 50) {
      return 1; // Extensive customer feedback
    } else if (testimonialCount >= 20) {
      return 0.7;
    } else if (testimonialCount >= 10) {
      return 0.5;
    } else {
      return testimonialCount * 0.02;
    }
  }

  /**
   * Score financial stability bonus
   */
  scoreFinancialStability(analysisData) {
    if (analysisData?.financialStability === 'Strong') {
      return 0.5;
    }
    return 0;
  }

  /**
   * Score domain expertise bonus (up to 2 points)
   */
  scoreDomainExpertise(analysisData) {
    const domainExpertise = this.inferDomainFromData(analysisData);
    
    if (!domainExpertise || domainExpertise === 'Technology') {
      return 0;
    }
    
    let score = 1.5; // Base specialized domain expertise bonus
    
    // Additional bonus for deep specialization (multiple indicators)
    const description = (analysisData?.description || '').toLowerCase();
    const services = (analysisData?.services || []).join(' ').toLowerCase();
    const certifications = (analysisData?.certifications || []).join(' ').toLowerCase();
    
    let specializationIndicators = 0;
    if (description.includes(domainExpertise.toLowerCase())) specializationIndicators++;
    if (services.includes(domainExpertise.toLowerCase())) specializationIndicators++;
    if (certifications.includes(domainExpertise.toLowerCase()) || 
        (domainExpertise === 'Healthcare' && certifications.includes('hipaa'))) specializationIndicators++;
    
    if (specializationIndicators >= 3) {
      score += 0.5; // Deep specialization bonus
    }
    
    return score;
  }

  /**
   * Apply quality penalties for weak suppliers
   */
  applyQualityPenalties(score, company, analysisData, hasMinimalData) {
    const yearsExperience = analysisData?.yearsInBusiness || company.years_experience || 0;
    const projectCount = analysisData?.caseStudies?.length || company.total_projects || 0;
    const teamSize = analysisData?.teamSize || company.team_size || 0;
    
    // Penalties for low credibility - only apply if really low quality
    if (hasMinimalData) {
      score = Math.min(score, 3.5); // Cap very low for minimal companies
    }
    
    // Low experience penalty - for weak suppliers
    if (yearsExperience <= 1 && projectCount <= 2 && teamSize <= 5) {
      score = Math.min(score, 5); // Cap low credibility suppliers at 5
    }
    
    return score;
  }

  /**
   * Infer primary domain from analysis data
   */
  inferDomainFromData(analysisData) {
    if (!analysisData) return 'Technology';
    
    const description = (analysisData.description || '').toLowerCase();
    const services = (analysisData.services || []).join(' ').toLowerCase();
    const combined = description + ' ' + services;
    
    if (combined.includes('healthcare') || combined.includes('medical')) return 'Healthcare';
    if (combined.includes('finance') || combined.includes('banking')) return 'Finance';
    if (combined.includes('education') || combined.includes('learning')) return 'Education';
    if (combined.includes('retail') || combined.includes('ecommerce')) return 'Retail';
    
    return 'Technology';
  }

  /**
   * Get detailed scoring breakdown for transparency
   */
  getScoreBreakdown(company, analysisData = {}) {
    const breakdown = {
      experience: this.scoreExperience(company, analysisData),
      projects: this.scoreProjectPortfolio(company, analysisData),
      certifications: this.scoreCertifications(analysisData),
      teamSize: this.scoreTeamSize(company, analysisData),
      testimonials: this.scoreTestimonials(analysisData),
      financialStability: this.scoreFinancialStability(analysisData),
      domainExpertise: this.scoreDomainExpertise(analysisData)
    };
    
    breakdown.total = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
    breakdown.hasMinimalData = this.hasMinimalData(company, analysisData);
    
    return breakdown;
  }
}

module.exports = { CredibilityScorer };