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
        credibilitySignals: mockAnalysis.credibilitySignals
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
        ...(analysisData.description ? this.extractCapabilitiesFromDescription(analysisData.description) : [])
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
      credibilityScore: Math.min(10, Math.max(1, 5 + (company.years_experience * 0.5) + (company.total_projects * 0.02) + (analysisData.caseStudies?.length || 0) + (analysisData.certifications?.length * 0.5 || 0))),
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
      certifications: company.certifications || []
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