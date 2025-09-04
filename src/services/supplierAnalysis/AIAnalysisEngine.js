const { CapabilitiesExtractor } = require('./CapabilitiesExtractor');
const { CredibilityScorer } = require('./CredibilityScorer');
const { logger } = require('../../utils/logger');

/**
 * AIAnalysisEngine - Simulates AI analysis capabilities for supplier data processing
 * In production, this would integrate with OpenRouter API or similar AI services
 */
class AIAnalysisEngine {
  constructor() {
    this.capabilitiesExtractor = new CapabilitiesExtractor();
    this.credibilityScorer = new CredibilityScorer();
  }

  /**
   * Perform comprehensive AI analysis on supplier data
   * @param {Object} company - Company database record
   * @param {Object} analysisData - Raw analysis data from various sources
   * @returns {Object} Complete AI analysis results
   */
  async performAnalysis(company, analysisData = {}) {
    try {
      // Simulate analysis processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      logger.info(`Performing AI analysis for ${company.name}`);

      // Extract and enhance capabilities
      const capabilityAnalysis = this.capabilitiesExtractor.getCapabilityAnalysis(company, analysisData);
      
      // Calculate credibility metrics
      const credibilityScore = this.credibilityScorer.calculateCredibilityScore(company, analysisData);
      const credibilityBreakdown = this.credibilityScorer.getScoreBreakdown(company, analysisData);
      
      // Generate comprehensive analysis results
      const analysis = {
        // Confidence metrics
        confidence: this.calculateOverallConfidence(analysisData, credibilityScore),
        analysisVersion: '1.2.0',
        analyzedAt: new Date().toISOString(),
        
        // Enhanced capabilities
        capabilities: capabilityAnalysis.enhanced,
        extractedCapabilities: capabilityAnalysis.enhanced,
        
        // Industry and domain analysis
        industries: this.analyzeIndustries(company, analysisData),
        domainExpertise: capabilityAnalysis.domain,
        specializations: capabilityAnalysis.specializations,
        
        // Technology analysis
        technologies: this.analyzeTechnologies(company, analysisData),
        technicalCapabilities: this.extractTechnicalCapabilities(analysisData),
        
        // Credibility assessment
        credibilityScore: credibilityScore,
        credibilityBreakdown: credibilityBreakdown,
        credibilitySignals: this.generateCredibilitySignals(company, analysisData, credibilityScore),
        
        // Certification analysis
        certifications: this.analyzeCertifications(analysisData),
        
        // Data source analysis
        dataSourcesAnalyzed: this.identifyDataSources(analysisData),
        dataQuality: this.assessDataQuality(company, analysisData),
        
        // Strategic insights
        insights: this.generateStrategicInsights(company, analysisData, credibilityScore),
        recommendations: this.generateRecommendations(company, analysisData, credibilityScore),
        
        // Market positioning
        marketPosition: this.assessMarketPosition(company, analysisData),
        competitiveAdvantages: this.identifyCompetitiveAdvantages(company, analysisData)
      };

      logger.debug(`AI analysis completed for ${company.name} - confidence: ${analysis.confidence.toFixed(2)}`);
      return analysis;

    } catch (error) {
      logger.error('AI analysis failed:', error);
      throw error;
    }
  }

  /**
   * Calculate overall analysis confidence
   */
  calculateOverallConfidence(analysisData, credibilityScore) {
    let confidence = 0.7; // Base confidence
    
    // Boost confidence based on data richness
    if (analysisData.description && analysisData.description.length > 100) confidence += 0.1;
    if (analysisData.services && analysisData.services.length > 3) confidence += 0.1;
    if (analysisData.certifications && analysisData.certifications.length > 0) confidence += 0.05;
    if (analysisData.testimonials && analysisData.testimonials.length > 5) confidence += 0.05;
    
    // Factor in credibility score
    const credibilityFactor = credibilityScore / 10;
    confidence = confidence * (0.7 + 0.3 * credibilityFactor);
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Analyze industries with confidence scores
   */
  analyzeIndustries(company, analysisData) {
    const industries = company.industries || [];
    
    return industries.map(industry => ({
      name: industry,
      confidence: 0.8 + (Math.random() * 0.2), // 80-100% confidence
      evidence: [
        `Multiple projects in ${industry} sector`,
        `Team expertise in ${industry}`,
        `Industry-specific certifications`
      ].slice(0, Math.floor(Math.random() * 3) + 1)
    }));
  }

  /**
   * Analyze technology stack
   */
  analyzeTechnologies(company, analysisData) {
    return {
      confirmed: company.technologies || [],
      inferred: this.inferTechnologies(analysisData),
      confidence: 0.75 + (Math.random() * 0.2)
    };
  }

  /**
   * Infer technologies from analysis data
   */
  inferTechnologies(analysisData) {
    const technologies = new Set();
    
    const description = (analysisData.description || '').toLowerCase();
    const services = (analysisData.services || []).join(' ').toLowerCase();
    const combined = description + ' ' + services;
    
    // Technology detection patterns
    const techMap = {
      'react': 'React',
      'angular': 'Angular',
      'vue': 'Vue.js',
      'node': 'Node.js',
      'python': 'Python',
      'java': 'Java',
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'aws': 'AWS',
      'azure': 'Azure',
      'google cloud': 'Google Cloud',
      'mongodb': 'MongoDB',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'redis': 'Redis'
    };
    
    Object.entries(techMap).forEach(([pattern, tech]) => {
      if (combined.includes(pattern)) {
        technologies.add(tech);
      }
    });
    
    // Add some default modern technologies if none detected
    if (technologies.size === 0) {
      ['Docker', 'Kubernetes', 'Terraform'].forEach(tech => technologies.add(tech));
    }
    
    return Array.from(technologies);
  }

  /**
   * Extract technical capabilities specifically
   */
  extractTechnicalCapabilities(analysisData) {
    const techCapabilities = [];
    
    if (analysisData.description || analysisData.services) {
      // This would be more sophisticated in production
      techCapabilities.push(
        'Cloud Architecture',
        'DevOps Practices', 
        'Microservices',
        'API Development',
        'Database Design'
      );
    }
    
    return techCapabilities;
  }

  /**
   * Generate credibility signals
   */
  generateCredibilitySignals(company, analysisData, credibilityScore) {
    const signals = {};
    
    // Website quality assessment
    signals.websiteQuality = analysisData.description ? 
      Math.min(0.9, 0.6 + (analysisData.description.length / 1000) * 0.3) : 
      0.5;
    
    // Case study depth
    signals.caseStudyDepth = analysisData.caseStudies ? 
      Math.min(0.9, 0.5 + (analysisData.caseStudies.length / 10) * 0.4) : 
      0.4;
    
    // Team expertise (based on credibility score)
    signals.teamExpertise = Math.min(0.95, 0.7 + (credibilityScore / 10) * 0.25);
    
    // Client testimonials
    signals.clientTestimonials = analysisData.testimonials ? 
      Math.min(0.85, 0.4 + (analysisData.testimonials.length / 20) * 0.45) : 
      0.3;
    
    // Project complexity (inferred from services/description)
    signals.projectComplexity = analysisData.services ? 
      Math.min(0.9, 0.6 + (analysisData.services.length / 10) * 0.3) : 
      0.6;
    
    // Recent work (assume recent if data is available)
    signals.recentWork = analysisData.description || analysisData.services ? 0.8 : 0.5;
    
    return signals;
  }

  /**
   * Analyze certifications
   */
  analyzeCertifications(analysisData) {
    if (!analysisData.certifications) return [];
    
    return analysisData.certifications.map(cert => ({
      name: cert,
      type: this.categorizeCertification(cert),
      value: this.assessCertificationValue(cert),
      verified: false // Would require verification in production
    }));
  }

  /**
   * Categorize certification type
   */
  categorizeCertification(certification) {
    const cert = certification.toLowerCase();
    
    if (cert.includes('aws') || cert.includes('azure') || cert.includes('google cloud')) {
      return 'cloud';
    } else if (cert.includes('security') || cert.includes('cissp') || cert.includes('ceh')) {
      return 'security';
    } else if (cert.includes('project') || cert.includes('pmp') || cert.includes('scrum')) {
      return 'management';
    } else if (cert.includes('iso') || cert.includes('sox') || cert.includes('hipaa')) {
      return 'compliance';
    }
    
    return 'technical';
  }

  /**
   * Assess certification business value
   */
  assessCertificationValue(certification) {
    const highValue = ['AWS Solutions Architect', 'CISSP', 'PMP', 'ISO 27001', 'SOX', 'HIPAA'];
    const mediumValue = ['Azure Fundamentals', 'Scrum Master', 'CompTIA Security+'];
    
    const cert = certification;
    
    if (highValue.some(hv => cert.includes(hv))) return 'high';
    if (mediumValue.some(mv => cert.includes(mv))) return 'medium';
    
    return 'standard';
  }

  /**
   * Identify analyzed data sources
   */
  identifyDataSources(analysisData) {
    const sources = [];
    
    if (analysisData.description) sources.push('website');
    if (analysisData.services) sources.push('services_page');
    if (analysisData.caseStudies) sources.push('case_studies');
    if (analysisData.testimonials) sources.push('testimonials');
    if (analysisData.certifications) sources.push('certifications');
    
    return sources;
  }

  /**
   * Assess overall data quality
   */
  assessDataQuality(company, analysisData) {
    let qualityScore = 0.5; // Base quality
    
    // Database completeness
    if (company.name && company.capabilities && company.industries) qualityScore += 0.2;
    
    // Analysis data richness
    if (analysisData.description && analysisData.description.length > 200) qualityScore += 0.1;
    if (analysisData.services && analysisData.services.length > 3) qualityScore += 0.1;
    if (analysisData.caseStudies && analysisData.caseStudies.length > 2) qualityScore += 0.05;
    if (analysisData.testimonials && analysisData.testimonials.length > 5) qualityScore += 0.05;
    
    return {
      score: Math.min(qualityScore, 1.0),
      completeness: this.assessDataCompleteness(company, analysisData),
      reliability: this.assessDataReliability(analysisData)
    };
  }

  /**
   * Assess data completeness
   */
  assessDataCompleteness(company, analysisData) {
    const requiredFields = ['name', 'capabilities', 'industries'];
    const optionalFields = ['description', 'services', 'certifications', 'testimonials'];
    
    const requiredComplete = requiredFields.every(field => 
      company[field] && (Array.isArray(company[field]) ? company[field].length > 0 : true)
    );
    
    const optionalComplete = optionalFields.filter(field => 
      analysisData[field] && (Array.isArray(analysisData[field]) ? analysisData[field].length > 0 : analysisData[field].length > 50)
    ).length;
    
    return requiredComplete ? 
      Math.min(1.0, 0.6 + (optionalComplete / optionalFields.length) * 0.4) : 
      0.3;
  }

  /**
   * Assess data reliability
   */
  assessDataReliability(analysisData) {
    // In production, would check for consistency, source credibility, etc.
    return analysisData.description || analysisData.services ? 0.8 : 0.6;
  }

  /**
   * Generate strategic insights
   */
  generateStrategicInsights(company, analysisData, credibilityScore) {
    const insights = [];
    
    if (credibilityScore > 7) {
      insights.push('High credibility supplier with strong market presence');
      insights.push('Well-positioned for complex enterprise engagements');
    } else if (credibilityScore > 5) {
      insights.push('Solid mid-market supplier with growth potential');
      insights.push('Good fit for standard business requirements');
    } else {
      insights.push('Emerging supplier requiring careful evaluation');
      insights.push('May be suitable for low-risk engagements');
    }
    
    // Domain-specific insights
    const domain = this.capabilitiesExtractor.inferDomainFromData(analysisData);
    if (domain !== 'Technology') {
      insights.push(`Specialized ${domain} domain expertise adds strategic value`);
    }
    
    return insights;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(company, analysisData, credibilityScore) {
    const recommendations = [];
    
    if (credibilityScore < 5) {
      recommendations.push('Request additional references and case studies');
      recommendations.push('Consider pilot project before major engagement');
    }
    
    if (!analysisData.certifications || analysisData.certifications.length === 0) {
      recommendations.push('Evaluate relevant industry certifications');
    }
    
    if (!analysisData.testimonials || analysisData.testimonials.length < 5) {
      recommendations.push('Request client references and testimonials');
    }
    
    return recommendations;
  }

  /**
   * Assess market position
   */
  assessMarketPosition(company, analysisData) {
    const teamSize = analysisData.teamSize || company.team_size || 10;
    const experience = company.years_experience || 5;
    
    let position = 'emerging';
    
    if (teamSize > 100 && experience > 10) {
      position = 'established_leader';
    } else if (teamSize > 50 && experience > 7) {
      position = 'growing_player';
    } else if (teamSize > 20 && experience > 5) {
      position = 'mid_market';
    }
    
    return {
      category: position,
      factors: {
        teamSize: teamSize,
        experience: experience,
        specialization: this.capabilitiesExtractor.inferDomainFromData(analysisData)
      }
    };
  }

  /**
   * Identify competitive advantages
   */
  identifyCompetitiveAdvantages(company, analysisData) {
    const advantages = [];
    
    // Specialization advantage
    const domain = this.capabilitiesExtractor.inferDomainFromData(analysisData);
    if (domain !== 'Technology') {
      advantages.push(`Deep ${domain} industry specialization`);
    }
    
    // Scale advantages
    const teamSize = analysisData.teamSize || company.team_size || 10;
    if (teamSize > 50) {
      advantages.push('Large-scale project execution capability');
    }
    
    // Experience advantages
    const experience = company.years_experience || 5;
    if (experience > 10) {
      advantages.push('Extensive industry experience and expertise');
    }
    
    // Certification advantages
    if (analysisData.certifications && analysisData.certifications.length > 3) {
      advantages.push('Strong certification portfolio demonstrating expertise');
    }
    
    return advantages;
  }
}

module.exports = { AIAnalysisEngine };