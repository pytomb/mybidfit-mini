const { logger } = require('../../utils/logger');

/**
 * CapabilitiesExtractor - Extracts and enhances supplier capabilities from various data sources
 * Handles website analysis, description parsing, and service categorization
 */
class CapabilitiesExtractor {
  /**
   * Extract enhanced capabilities from all available sources
   * @param {Object} company - Company database record
   * @param {Object} analysisData - Analysis data from various sources
   * @returns {Array} Enhanced capabilities array
   */
  extractEnhancedCapabilities(company, analysisData = {}) {
    try {
      const capabilities = new Set(company.capabilities || []);
      
      // Extract from different data sources
      if (analysisData.website) {
        this.extractCapabilitiesFromWebsite(analysisData.website).forEach(cap => capabilities.add(cap));
      }
      
      if (analysisData.description) {
        this.extractCapabilitiesFromDescription(analysisData.description).forEach(cap => capabilities.add(cap));
      }
      
      if (analysisData.services) {
        this.extractCapabilitiesFromServices(analysisData.services).forEach(cap => capabilities.add(cap));
      }
      
      if (analysisData.certifications) {
        this.extractCapabilitiesFromCertifications(analysisData.certifications).forEach(cap => capabilities.add(cap));
      }
      
      // Convert back to array and clean up
      const enhancedCapabilities = Array.from(capabilities)
        .filter(cap => cap && cap.length > 2) // Remove very short/empty capabilities
        .slice(0, 20); // Limit to prevent overwhelming data
      
      logger.debug(`Enhanced capabilities extracted: ${enhancedCapabilities.length} total for ${company.name}`);
      return enhancedCapabilities;
      
    } catch (error) {
      logger.error('Capabilities extraction failed:', error);
      return company.capabilities || [];
    }
  }

  /**
   * Extract capabilities from website content
   */
  extractCapabilitiesFromWebsite(websiteContent) {
    const capabilities = [];
    const content = websiteContent.toLowerCase();
    
    // Technical capabilities
    const techCapabilities = {
      'react': 'React development',
      'angular': 'Angular development', 
      'vue': 'Vue.js development',
      'node.js': 'Node.js development',
      'nodejs': 'Node.js development',
      'python': 'Python development',
      'java': 'Java development',
      'javascript': 'JavaScript development',
      'typescript': 'TypeScript development',
      'php': 'PHP development',
      'ruby': 'Ruby development',
      'go': 'Go development',
      'rust': 'Rust development'
    };
    
    // Infrastructure capabilities
    const infraCapabilities = {
      'aws': 'AWS cloud services',
      'azure': 'Microsoft Azure',
      'google cloud': 'Google Cloud Platform',
      'kubernetes': 'Kubernetes orchestration',
      'docker': 'Docker containerization',
      'devops': 'DevOps practices',
      'ci/cd': 'CI/CD pipelines',
      'terraform': 'Infrastructure as Code',
      'ansible': 'Configuration management'
    };
    
    // Database capabilities
    const dbCapabilities = {
      'postgresql': 'PostgreSQL database',
      'mysql': 'MySQL database',
      'mongodb': 'MongoDB database',
      'redis': 'Redis caching',
      'elasticsearch': 'Elasticsearch',
      'database': 'database management',
      'sql': 'SQL database management'
    };
    
    // Service capabilities
    const serviceCapabilities = {
      'api': 'API development',
      'microservices': 'microservices architecture',
      'full-stack': 'full-stack development',
      'frontend': 'frontend development',
      'backend': 'backend development',
      'mobile': 'mobile development',
      'web development': 'web development',
      'e-commerce': 'e-commerce development',
      'cms': 'content management systems'
    };
    
    // Check all capability categories
    [techCapabilities, infraCapabilities, dbCapabilities, serviceCapabilities].forEach(capMap => {
      Object.entries(capMap).forEach(([keyword, capability]) => {
        if (content.includes(keyword) && !capabilities.includes(capability)) {
          capabilities.push(capability);
        }
      });
    });
    
    return capabilities;
  }

  /**
   * Extract capabilities from description text
   */
  extractCapabilitiesFromDescription(description) {
    const capabilities = [];
    const desc = description.toLowerCase();
    
    // Technology stack detection
    const techPatterns = {
      'react': 'React development',
      'node.js': 'Node.js development',
      'nodejs': 'Node.js development',
      'cloud': 'cloud migration',
      'full-stack': 'full-stack development', 
      'mobile': 'mobile development',
      'api': 'API development',
      'database': 'database management',
      'devops': 'DevOps',
      'machine learning': 'machine learning',
      'ai': 'artificial intelligence',
      'blockchain': 'blockchain development',
      'iot': 'IoT development',
      'cybersecurity': 'cybersecurity',
      'data analytics': 'data analytics',
      'business intelligence': 'business intelligence'
    };
    
    // Industry-specific capabilities
    const industryPatterns = {
      'healthcare': 'healthcare solutions',
      'fintech': 'financial technology',
      'e-commerce': 'e-commerce platforms',
      'logistics': 'logistics solutions',
      'manufacturing': 'manufacturing systems',
      'education': 'educational technology',
      'real estate': 'real estate solutions'
    };
    
    // Check for patterns
    [techPatterns, industryPatterns].forEach(patterns => {
      Object.entries(patterns).forEach(([keyword, capability]) => {
        if (desc.includes(keyword) && !capabilities.includes(capability)) {
          capabilities.push(capability);
        }
      });
    });
    
    return capabilities;
  }

  /**
   * Extract capabilities from services array
   */
  extractCapabilitiesFromServices(services) {
    const capabilities = [];
    
    if (!Array.isArray(services)) return capabilities;
    
    services.forEach(service => {
      const serviceName = service.toLowerCase();
      
      // Map service names to standardized capabilities
      const serviceMap = {
        'web development': 'web development',
        'mobile app development': 'mobile development',
        'cloud consulting': 'cloud consulting',
        'devops': 'DevOps consulting',
        'data science': 'data science',
        'ui/ux design': 'UI/UX design',
        'quality assurance': 'quality assurance testing',
        'project management': 'project management',
        'business analysis': 'business analysis',
        'system integration': 'system integration',
        'api development': 'API development',
        'database design': 'database design',
        'cybersecurity': 'cybersecurity consulting',
        'digital transformation': 'digital transformation'
      };
      
      // Direct mapping
      if (serviceMap[serviceName]) {
        capabilities.push(serviceMap[serviceName]);
      } else {
        // Add as-is if it looks like a valid capability
        if (service.length > 3 && service.length < 50) {
          capabilities.push(service);
        }
      }
    });
    
    return capabilities;
  }

  /**
   * Extract capabilities from certifications
   */
  extractCapabilitiesFromCertifications(certifications) {
    const capabilities = [];
    
    if (!Array.isArray(certifications)) return capabilities;
    
    certifications.forEach(cert => {
      const certName = cert.toLowerCase();
      
      // Map certifications to implied capabilities
      const certCapabilities = {
        'aws certified': 'AWS expertise',
        'microsoft certified': 'Microsoft technologies',
        'google cloud certified': 'Google Cloud expertise',
        'cissp': 'advanced cybersecurity',
        'pmp': 'project management expertise',
        'scrum master': 'agile project management',
        'cissp': 'information security',
        'ceh': 'ethical hacking',
        'comptia': 'IT infrastructure',
        'oracle certified': 'Oracle database expertise',
        'salesforce certified': 'Salesforce platform',
        'sap': 'SAP enterprise systems',
        'hipaa': 'healthcare compliance',
        'sox': 'financial compliance',
        'iso 27001': 'information security management',
        'iso 9001': 'quality management'
      };
      
      // Check for certification patterns
      Object.entries(certCapabilities).forEach(([pattern, capability]) => {
        if (certName.includes(pattern) && !capabilities.includes(capability)) {
          capabilities.push(capability);
        }
      });
    });
    
    return capabilities;
  }

  /**
   * Extract specializations from combined data
   */
  extractSpecializations(company, analysisData) {
    const specializations = [...(company.capabilities || [])];
    
    // Add top services as specializations
    if (analysisData?.services) {
      specializations.push(...analysisData.services.slice(0, 2));
    }
    
    // Add domain expertise as specialization
    const domain = this.inferDomainFromData(analysisData);
    if (domain && domain !== 'Technology') {
      specializations.push(`${domain} expertise`);
    }
    
    return [...new Set(specializations)].slice(0, 5); // Limit and deduplicate
  }

  /**
   * Infer primary domain from analysis data
   */
  inferDomainFromData(analysisData) {
    if (!analysisData) return 'Technology';
    
    const description = (analysisData.description || '').toLowerCase();
    const services = (analysisData.services || []).join(' ').toLowerCase();
    const combined = description + ' ' + services;
    
    // Domain detection patterns
    const domainPatterns = {
      'Healthcare': ['healthcare', 'medical', 'hospital', 'clinical', 'pharma', 'telemedicine'],
      'Finance': ['finance', 'banking', 'fintech', 'investment', 'trading', 'payment', 'cryptocurrency'],
      'Education': ['education', 'learning', 'university', 'school', 'training', 'e-learning'],
      'Retail': ['retail', 'ecommerce', 'e-commerce', 'shopping', 'marketplace', 'fashion'],
      'Manufacturing': ['manufacturing', 'industrial', 'factory', 'production', 'supply chain'],
      'Real Estate': ['real estate', 'property', 'construction', 'architecture'],
      'Logistics': ['logistics', 'shipping', 'transportation', 'warehouse', 'delivery'],
      'Energy': ['energy', 'utilities', 'power', 'renewable', 'oil', 'gas']
    };
    
    // Find best matching domain
    let bestMatch = 'Technology';
    let maxMatches = 0;
    
    Object.entries(domainPatterns).forEach(([domain, patterns]) => {
      const matches = patterns.filter(pattern => combined.includes(pattern)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = domain;
      }
    });
    
    return bestMatch;
  }

  /**
   * Get capability analysis summary
   */
  getCapabilityAnalysis(company, analysisData) {
    const originalCapabilities = company.capabilities || [];
    const enhancedCapabilities = this.extractEnhancedCapabilities(company, analysisData);
    const domain = this.inferDomainFromData(analysisData);
    const specializations = this.extractSpecializations(company, analysisData);
    
    return {
      original: originalCapabilities,
      enhanced: enhancedCapabilities,
      added: enhancedCapabilities.filter(cap => !originalCapabilities.includes(cap)),
      domain: domain,
      specializations: specializations,
      totalCount: enhancedCapabilities.length,
      enhancementRatio: originalCapabilities.length > 0 ? 
        (enhancedCapabilities.length / originalCapabilities.length) : 
        enhancedCapabilities.length
    };
  }
}

module.exports = { CapabilitiesExtractor };