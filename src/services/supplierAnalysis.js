const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

class SupplierAnalysisService {
  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Algorithm 1: Supplier Analysis Engine
   * Analyzes supplier website, case studies, and documents to extract structured data
   * This is a mock implementation - in production would integrate with OpenRouter API
   */
  async analyzeSupplier(companyId, analysisData = {}) {
    try {
      logger.info(`Starting supplier analysis for company ${companyId}`);

      // Get company data
      const companyResult = await this.db.query(
        'SELECT * FROM companies WHERE id = $1',
        [companyId]
      );

      if (companyResult.rows.length === 0) {
        throw new Error('Company not found');
      }

      const company = companyResult.rows[0];

      // Mock AI analysis - in production, this would call OpenRouter API
      const mockAnalysis = await this.mockAIAnalysis(company, analysisData);

      // Update company with enhanced data
      const updatedCompany = await this.updateCompanyProfile(companyId, mockAnalysis);

      logger.info(`Supplier analysis completed for ${company.name}`);
      
      return {
        companyId,
        analysis: mockAnalysis,
        updatedProfile: updatedCompany,
        confidence: mockAnalysis.confidence,
        // Flatten for easier testing
        capabilities: mockAnalysis.capabilities,
        credibilityScore: mockAnalysis.credibilityScore,
        domainExpertise: mockAnalysis.domainExpertise,
        technicalCapabilities: mockAnalysis.technicalCapabilities,
        certifications: mockAnalysis.certifications,
        extractedCapabilities: mockAnalysis.capabilities,
        credibilitySignals: mockAnalysis.credibilitySignals,
        insights: mockAnalysis.insights
      };

    } catch (error) {
      logger.error('Supplier analysis failed:', error);
      throw error;
    }
  }

  /**
   * Mock AI analysis that simulates what OpenRouter would return
   */
  async mockAIAnalysis(company, analysisData) {
    // Simulate analysis processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockAnalysis = {
      confidence: 0.85 + (Math.random() * 0.15), // 85-100% confidence
      
      // Enhanced capabilities extracted from mock "website analysis" and description
      capabilities: [
        ...company.capabilities,
        ...(analysisData.website ? this.extractCapabilitiesFromWebsite(analysisData.website) : []),
        ...(analysisData.description ? this.extractCapabilitiesFromDescription(analysisData.description) : []),
        ...(analysisData.services ? this.extractCapabilitiesFromServices(analysisData.services) : []),
        ...(analysisData.certifications ? this.extractCapabilitiesFromCertifications(analysisData.certifications) : [])
      ],

      // Industries with confidence scores
      industries: company.industries.map(industry => ({
        name: industry,
        confidence: 0.8 + (Math.random() * 0.2),
        evidence: [`Multiple projects in ${industry} sector`, `Team expertise in ${industry}`]
      })),

      // Technology stack analysis
      technologies: {
        confirmed: company.technologies,
        inferred: analysisData.technologies || ['Docker', 'Kubernetes', 'Terraform'],
        confidence: 0.78
      },

      // Credibility scoring signals
      credibilitySignals: {
        websiteQuality: 0.85,
        caseStudyDepth: 0.78,
        teamExpertise: 0.92,
        clientTestimonials: 0.71,
        projectComplexity: 0.88,
        recentWork: 0.83
      },

      // Financial indicators (mock)
      financialHealth: {
        revenueGrowth: 'positive',
        teamGrowth: 'stable',
        projectVolume: 'increasing',
        confidence: 0.67
      },

      // Geographic reach analysis
      serviceRegions: {
        primary: company.service_regions,
        inferred: ['Remote', 'North America'],
        globalCapability: company.service_regions.length > 3
      },

      // Extracted evidence with citations
      evidence: {
        capabilities: [
          { text: 'Led 3 major cloud migrations', source: 'case_study_1', confidence: 0.95 },
          { text: 'AWS certified team of 12 engineers', source: 'team_page', confidence: 0.88 },
          { text: 'SOC2 compliance achieved 2023', source: 'certifications', confidence: 1.0 }
        ],
        experience: [
          { text: `${company.years_experience} years in business`, source: 'about_page', confidence: 1.0 },
          { text: `${company.total_projects} completed projects`, source: 'portfolio', confidence: 0.92 }
        ],
        specializations: [
          { text: 'Healthcare HIPAA compliance expertise', source: 'healthcare_case_study', confidence: 0.87 },
          { text: 'Real-time data processing at scale', source: 'technical_blog', confidence: 0.81 }
        ]
      },

      // Improvement recommendations
      recommendations: [
        'Add more detailed case studies with quantified results',
        'Include client testimonials with specific ROI metrics',
        'Expand technical blog content to demonstrate thought leadership',
        'Add team certifications and expertise details'
      ],

      // Analysis metadata
      analysisVersion: '1.0.0',
      dataSourcesAnalyzed: ['website', 'case_studies', 'team_profiles'],
      processingTime: '2.3s',

      // Additional properties expected by tests
      credibilityScore: this.calculateCredibilityScore(company, analysisData),
      domainExpertise: {
        primary: company.industries[0] || this.inferDomainFromData(analysisData),
        secondary: company.industries[1] || null,
        specializations: this.extractSpecializations(company, analysisData)
      },
      technicalCapabilities: company.capabilities.filter(cap => 
        cap.toLowerCase().includes('development') || 
        cap.toLowerCase().includes('engineering') ||
        cap.toLowerCase().includes('software')
      ),
      certifications: [
        ...(company.certifications || []),
        ...(analysisData.certifications || [])
      ],

      // Insights property expected by tests
      insights: {
        strengths: this.generateStrengths(company, analysisData),
        experience: `${company.years_experience} years of experience with ${company.total_projects} completed projects`,
        weaknesses: this.generateWeaknesses(company, analysisData),
        opportunities: ['Expand into new markets', 'Develop additional service offerings'],
        recommendations: [
          'Add more detailed case studies with quantified results',
          'Include client testimonials with specific ROI metrics'
        ],
        dataCompleteness: this.assessDataCompleteness(company, analysisData)
      }
    };

    return mockAnalysis;
  }

  /**
   * Extract capabilities from mock website content
   */
  extractCapabilitiesFromWebsite(websiteData) {
    // Mock capability extraction
    const possibleCapabilities = [
      'API development', 'mobile development', 'data analytics', 
      'machine learning', 'blockchain', 'IoT development',
      'UI/UX design', 'project management', 'quality assurance'
    ];

    // Randomly select 2-4 additional capabilities
    const additionalCount = 2 + Math.floor(Math.random() * 3);
    const shuffled = possibleCapabilities.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, additionalCount);
  }

  /**
   * Extract capabilities from description text
   */
  extractCapabilitiesFromDescription(description) {
    const capabilities = [];
    const lowerDesc = description.toLowerCase();
    
    // Extract technologies mentioned
    if (lowerDesc.includes('react')) capabilities.push('React development');
    if (lowerDesc.includes('node.js') || lowerDesc.includes('nodejs')) capabilities.push('Node.js development');
    if (lowerDesc.includes('cloud') || lowerDesc.includes('aws') || lowerDesc.includes('azure')) capabilities.push('Cloud deployment');
    if (lowerDesc.includes('mobile')) capabilities.push('Mobile development');
    if (lowerDesc.includes('full-stack')) capabilities.push('Full-stack development');
    if (lowerDesc.includes('devops')) capabilities.push('DevOps');
    
    // Healthcare capabilities
    if (lowerDesc.includes('healthcare') || lowerDesc.includes('medical')) capabilities.push('Healthcare software');
    if (lowerDesc.includes('hipaa')) capabilities.push('HIPAA compliance');
    if (lowerDesc.includes('ehr')) capabilities.push('EHR integration');
    
    return capabilities;
  }

  /**
   * Extract capabilities from services array
   */
  extractCapabilitiesFromServices(services) {
    const capabilities = [];
    const servicesText = services.join(' ').toLowerCase();
    
    if (servicesText.includes('healthcare')) capabilities.push('Healthcare software');
    if (servicesText.includes('hipaa')) capabilities.push('HIPAA compliance');
    if (servicesText.includes('medical')) capabilities.push('Medical device integration');
    if (servicesText.includes('cloud')) capabilities.push('Cloud services');
    if (servicesText.includes('compliance')) capabilities.push('Regulatory compliance');
    
    return capabilities;
  }

  /**
   * Extract capabilities from certifications array
   */
  extractCapabilitiesFromCertifications(certifications) {
    const capabilities = [];
    const certsText = certifications.join(' ').toLowerCase();
    
    if (certsText.includes('hipaa')) capabilities.push('HIPAA compliance');
    if (certsText.includes('aws')) capabilities.push('AWS cloud services');
    if (certsText.includes('iso')) capabilities.push('ISO compliance');
    if (certsText.includes('sox')) capabilities.push('SOX compliance');
    
    return capabilities;
  }

  /**
   * Infer domain expertise from analysis data
   */
  inferDomainFromData(analysisData) {
    if (!analysisData) return 'Technology';
    
    const description = (analysisData.description || '').toLowerCase();
    const services = (analysisData.services || []).join(' ').toLowerCase();
    const combined = description + ' ' + services;
    
    if (combined.includes('healthcare') || combined.includes('medical') || combined.includes('hipaa') || combined.includes('ehr')) return 'Healthcare';
    if (combined.includes('finance') || combined.includes('banking')) return 'Finance';
    if (combined.includes('education') || combined.includes('learning')) return 'Education';
    if (combined.includes('retail') || combined.includes('ecommerce')) return 'Retail';
    
    return 'Technology';
  }

  /**
   * Extract specializations from company and analysis data
   */
  extractSpecializations(company, analysisData) {
    const specializations = [...company.capabilities];
    
    // Add specializations based on case studies
    if (analysisData.caseStudies) {
      analysisData.caseStudies.forEach(study => {
        if (study.technologies) {
          specializations.push(...study.technologies.map(tech => `${tech} development`));
        }
      });
    }
    
    return [...new Set(specializations)]; // Remove duplicates
  }

  /**
   * Calculate credibility score based on multiple factors
   */
  calculateCredibilityScore(company, analysisData) {
    let score = 1; // Start at base 1
    
    // Check for minimal data - truly sparse company data (only a name)
    const hasMinimalData = (!analysisData || Object.keys(analysisData).length <= 1);
    
    
    // Years of experience (up to 4 points) - prioritize analysisData over DB
    const yearsExperience = analysisData?.yearsInBusiness || company.years_experience || 0;
    if (yearsExperience >= 15) {
      score += 4; // Excellent experience
    } else if (yearsExperience >= 10) {
      score += 3;
    } else if (yearsExperience >= 5) {
      score += 2;
    } else if (yearsExperience >= 2) {
      score += 1;
    } else {
      score += yearsExperience * 0.2; // Very low for < 2 years
    }
    
    // Project count (up to 2 points) - prioritize analysisData over DB
    const projectCount = analysisData?.caseStudies?.length || company.total_projects || 0;
    if (projectCount >= 20) {
      score += 2; // Extensive portfolio
    } else if (projectCount >= 10) {
      score += 1.5;
    } else if (projectCount >= 5) {
      score += 1;
    } else if (projectCount >= 2) {
      score += 0.5;
    } else {
      score += projectCount * 0.1; // Very low for few projects
    }
    
    // Certifications (up to 2 points)
    const certCount = analysisData?.certifications?.length || 0;
    if (certCount >= 4) {
      score += 2; // Multiple industry certifications
    } else if (certCount >= 2) {
      score += 1;
    } else if (certCount >= 1) {
      score += 0.5;
    }
    
    // Team size (up to 1.5 points) - prioritize analysisData over DB
    const teamSize = analysisData?.teamSize || company.team_size || 0;
    if (teamSize >= 100) {
      score += 1.5; // Large established team
    } else if (teamSize >= 50) {
      score += 1;
    } else if (teamSize >= 20) {
      score += 0.7;
    } else if (teamSize >= 10) {
      score += 0.5;
    } else {
      score += teamSize * 0.01; // Very low for small teams
    }
    
    // Testimonials (up to 1 point)
    const testimonialCount = analysisData?.testimonials?.length || 0;
    if (testimonialCount >= 50) {
      score += 1; // Extensive customer feedback
    } else if (testimonialCount >= 20) {
      score += 0.7;
    } else if (testimonialCount >= 10) {
      score += 0.5;
    } else {
      score += testimonialCount * 0.02;
    }
    
    // Financial stability bonus
    if (analysisData?.financialStability === 'Strong') {
      score += 0.5;
    }
    
    // Domain expertise bonus (up to 2 points)
    const domainExpertise = this.inferDomainFromData(analysisData);
    if (domainExpertise && domainExpertise !== 'Technology') {
      // Specialized domain expertise gets bonus
      score += 1.5;
      
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
    }
    
    
    // Penalties for low credibility - only apply if really low quality
    if (hasMinimalData) {
      score = Math.min(score, 3.5); // Cap very low for minimal companies
    }
    
    // Low experience penalty - for weak suppliers
    if (yearsExperience <= 1 && projectCount <= 2 && teamSize <= 5) {
      score = Math.min(score, 5); // Cap low credibility suppliers at 5
    }
    
    // Cap at 10, floor at 1
    return Math.min(10, Math.max(1, Math.round(score)));
  }

  /**
   * Generate strengths based on company data
   */
  generateStrengths(company, analysisData) {
    const strengths = [];
    
    if (company.years_experience >= 5) {
      strengths.push('Extensive industry experience');
    }
    
    if (company.total_projects >= 10) {
      strengths.push('Proven track record with multiple successful projects');
    }
    
    if (company.certifications && company.certifications.length > 0) {
      strengths.push('Industry-recognized certifications');
    }
    
    if (analysisData.caseStudies && analysisData.caseStudies.length > 3) {
      strengths.push('Strong portfolio of case studies');
    }
    
    if (company.team_size >= 10) {
      strengths.push('Scalable team capacity');
    }
    
    // Default strength if none found
    if (strengths.length === 0) {
      strengths.push('Emerging technology expertise');
    }
    
    return strengths;
  }

  /**
   * Generate weaknesses based on company data
   */
  generateWeaknesses(company, analysisData) {
    const weaknesses = [];
    
    if (company.years_experience < 3) {
      weaknesses.push('Limited industry experience');
    }
    
    if (company.total_projects < 5) {
      weaknesses.push('Small project portfolio');
    }
    
    if (!company.certifications || company.certifications.length === 0) {
      weaknesses.push('No formal certifications identified');
    }
    
    return weaknesses;
  }

  /**
   * Assess data completeness for insights
   */
  assessDataCompleteness(company, analysisData) {
    const completenessIssues = [];
    
    if (!analysisData.description || analysisData.description.length < 50) {
      completenessIssues.push('Company description is minimal or missing');
    }
    
    if (!analysisData.caseStudies || analysisData.caseStudies.length === 0) {
      completenessIssues.push('No case studies provided to demonstrate capabilities');
    }
    
    if (!analysisData.certifications || analysisData.certifications.length === 0) {
      completenessIssues.push('No certifications or credentials listed');
    }
    
    if (!analysisData.testimonials || analysisData.testimonials.length === 0) {
      completenessIssues.push('No client testimonials available');
    }
    
    if (completenessIssues.length === 0) {
      return 'Complete data profile available for comprehensive analysis';
    }
    
    return `Data completeness issues: ${completenessIssues.join(', ')}`;
  }

  /**
   * Update company profile with analysis results
   */
  async updateCompanyProfile(companyId, analysis) {
    try {
      // Update company with enhanced data
      const result = await this.db.query(`
        UPDATE companies 
        SET 
          capabilities = $2,
          credibility_score = $3,
          last_analysis = NOW(),
          analysis_confidence = $4,
          data_sources = $5
        WHERE id = $1
        RETURNING *
      `, [
        companyId,
        analysis.capabilities,
        analysis.credibilitySignals.websiteQuality * 100,
        analysis.confidence,
        JSON.stringify({
          analyzedAt: new Date().toISOString(),
          sources: analysis.dataSourcesAnalyzed,
          version: analysis.analysisVersion
        })
      ]);

      return result.rows[0];

    } catch (error) {
      logger.error('Failed to update company profile:', error);
      throw error;
    }
  }

  /**
   * Get analysis history for a company
   */
  async getAnalysisHistory(companyId) {
    try {
      const result = await this.db.query(`
        SELECT 
          last_analysis,
          analysis_confidence,
          data_sources,
          credibility_score
        FROM companies 
        WHERE id = $1
      `, [companyId]);

      return result.rows[0] || null;

    } catch (error) {
      logger.error('Failed to get analysis history:', error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple suppliers
   */
  async batchAnalyzeSuppliers(companyIds) {
    const results = [];
    
    for (const companyId of companyIds) {
      try {
        const analysis = await this.analyzeSupplier(companyId);
        results.push({
          companyId,
          status: 'success',
          analysis
        });
      } catch (error) {
        results.push({
          companyId,
          status: 'error',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Extract capabilities from description text
   */
  extractCapabilitiesFromDescription(description) {
    const capabilities = [];
    
    // Look for specific technologies and skills in description
    if (description.toLowerCase().includes('react')) capabilities.push('React development');
    if (description.toLowerCase().includes('node.js') || description.toLowerCase().includes('nodejs')) capabilities.push('Node.js development');
    if (description.toLowerCase().includes('cloud')) capabilities.push('cloud migration');
    if (description.toLowerCase().includes('full-stack')) capabilities.push('full-stack development');
    if (description.toLowerCase().includes('mobile')) capabilities.push('mobile development');
    if (description.toLowerCase().includes('api')) capabilities.push('API development');
    if (description.toLowerCase().includes('database')) capabilities.push('database management');
    if (description.toLowerCase().includes('devops')) capabilities.push('DevOps');
    
    return capabilities;
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
   * Extract specializations from company and analysis data
   */
  extractSpecializations(company, analysisData) {
    const specializations = [...(company.capabilities || [])];
    
    if (analysisData?.services) {
      specializations.push(...analysisData.services.slice(0, 2));
    }
    
    return specializations.slice(0, 3); // Limit to first 3
  }
}

module.exports = { SupplierAnalysisService };