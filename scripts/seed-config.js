/**
 * Seed Data Configuration for MyBidFit
 * 
 * Centralized configuration for all seed data across different environments
 */

const seedConfig = {
  
  /**
   * Environment-specific configurations
   */
  environments: {
    development: {
      clearOnSeed: false,
      includeOpportunities: true,
      userCount: 'standard', // standard = 5 users, minimal = 2 users, extensive = 10+ users
      profileDepth: 'detailed', // minimal, standard, detailed
      logLevel: 'info'
    },
    
    test: {
      clearOnSeed: true,
      includeOpportunities: false, // Tests use mock data
      userCount: 'minimal',
      profileDepth: 'standard',
      logLevel: 'warn'
    },
    
    staging: {
      clearOnSeed: false,
      includeOpportunities: true,
      userCount: 'extensive',
      profileDepth: 'detailed',
      logLevel: 'info'
    },
    
    production: {
      clearOnSeed: false,
      includeOpportunities: false, // Production uses real data
      userCount: 'minimal', // Only essential admin users
      profileDepth: 'minimal',
      logLevel: 'error'
    }
  },

  /**
   * Government contracting specific data templates
   */
  naicsCodes: {
    // Computer Systems Design Services
    '541511': 'Custom Computer Programming Services',
    '541512': 'Computer Systems Design Services', 
    '541513': 'Computer Facilities Management Services',
    '541519': 'Other Computer Related Services',
    
    // Management Consulting
    '541611': 'Administrative Management and General Management Consulting Services',
    '541612': 'Human Resources Consulting Services',
    '541613': 'Marketing Consulting Services',
    '541618': 'Other Management Consulting Services',
    
    // Engineering Services
    '541330': 'Engineering Services',
    '541690': 'Other Scientific and Technical Consulting Services',
    
    // Data Processing
    '518210': 'Data Processing, Hosting, and Related Services'
  },

  /**
   * Set-aside categories for government contracting
   */
  setAsideCategories: [
    'Total_Small_Business',
    'SDVOSB', // Service-Disabled Veteran-Owned Small Business
    'WOSB',   // Women-Owned Small Business
    'HUBZone', // Historically Underutilized Business Zone
    '8(a)',    // SBA 8(a) Business Development
    'VOSB',    // Veteran-Owned Small Business
    'Total_Small_Business'
  ],

  /**
   * Common government certifications
   */
  certifications: [
    // Small Business Certifications
    '8(a)', 'SDVOSB', 'WOSB', 'VOSB', 'SBA HUBZone',
    
    // Security Certifications
    'ISO 27001', 'SOC 2 Type II', 'FedRAMP Ready', 'FedRAMP Authorized',
    
    // Quality Certifications
    'ISO 9001', 'CMMI Level 3', 'CMMI Level 5',
    
    // Industry Specific
    'NIST Cybersecurity Framework', 'Section 508 Compliance',
    'FISMA Compliance', 'HIPAA Compliance'
  ],

  /**
   * Government contracting capabilities
   */
  capabilities: {
    software: [
      'Custom Software Development',
      'Web Application Development',
      'Mobile Application Development',
      'API Development and Integration',
      'Database Design and Management',
      'Software Architecture',
      'DevOps and CI/CD',
      'Quality Assurance and Testing'
    ],
    
    infrastructure: [
      'Cloud Architecture and Migration',
      'System Integration',
      'Network Design and Implementation',
      'Server Management and Maintenance',
      'Infrastructure as Code',
      'Container Orchestration',
      'Load Balancing and Scaling',
      'Disaster Recovery Planning'
    ],
    
    security: [
      'Cybersecurity Assessment',
      'Penetration Testing',
      'Security Architecture Design',
      'Compliance and Risk Management',
      'Identity and Access Management',
      'Security Monitoring and Response',
      'Vulnerability Management',
      'Security Training and Awareness'
    ],
    
    data: [
      'Data Analytics and Visualization',
      'Business Intelligence',
      'Data Warehousing',
      'ETL Development',
      'Machine Learning and AI',
      'Predictive Analytics',
      'Statistical Analysis',
      'Data Governance'
    ],
    
    consulting: [
      'IT Strategy and Planning',
      'Digital Transformation',
      'Project Management',
      'Business Process Improvement',
      'Change Management',
      'Training and Knowledge Transfer',
      'Requirements Analysis',
      'Solution Architecture'
    ]
  },

  /**
   * Realistic government agencies for opportunities
   */
  agencies: [
    'General Services Administration (GSA)',
    'Department of Homeland Security (DHS)',
    'Department of Defense (DoD)',
    'Department of Veterans Affairs (VA)',
    'Department of Health and Human Services (HHS)',
    'Department of Transportation (DOT)',
    'Department of Energy (DOE)',
    'Environmental Protection Agency (EPA)',
    'National Aeronautics and Space Administration (NASA)',
    'Social Security Administration (SSA)',
    'Internal Revenue Service (IRS)',
    'Department of Agriculture (USDA)',
    'Department of Commerce (DOC)',
    'Department of Justice (DOJ)',
    'Department of Education (ED)'
  ],

  /**
   * Geographic service areas
   */
  serviceAreas: {
    dmv: ['Washington DC', 'Virginia', 'Maryland'],
    northeast: ['New York', 'New Jersey', 'Pennsylvania', 'Connecticut', 'Massachusetts'],
    southeast: ['North Carolina', 'South Carolina', 'Georgia', 'Florida', 'Tennessee'],
    midwest: ['Ohio', 'Michigan', 'Illinois', 'Indiana', 'Wisconsin'],
    southwest: ['Texas', 'Arizona', 'New Mexico', 'Nevada'],
    west: ['California', 'Oregon', 'Washington', 'Colorado'],
    national: ['All 50 States', 'Remote Work Available', 'CONUS', 'OCONUS'],
  },

  /**
   * Business types commonly used in government contracting
   */
  businessTypes: [
    'LLC',
    'Corporation', 
    'Sole Proprietorship',
    'Partnership',
    'S Corporation',
    'Professional Corporation'
  ],

  /**
   * Employee count ranges for realistic sizing
   */
  employeeCountRanges: {
    micro: { min: 1, max: 5 },
    small: { min: 6, max: 25 },
    medium: { min: 26, max: 100 },
    large: { min: 101, max: 500 },
    enterprise: { min: 501, max: 2000 }
  },

  /**
   * Annual revenue ranges for different company sizes
   */
  revenueRanges: {
    micro: { min: 50000, max: 500000 },
    small: { min: 500000, max: 2000000 },
    medium: { min: 2000000, max: 10000000 },
    large: { min: 10000000, max: 50000000 },
    enterprise: { min: 50000000, max: 200000000 }
  },

  /**
   * Technology keywords commonly used in government RFPs
   */
  technologyKeywords: [
    // Programming Languages
    'JavaScript', 'Python', 'Java', 'C#', 'Ruby', 'PHP', 'Go', 'Rust',
    
    // Frameworks
    'React', 'Angular', 'Vue.js', 'Node.js', 'Django', 'Rails', 'Spring Boot',
    
    // Cloud Platforms
    'AWS', 'Microsoft Azure', 'Google Cloud Platform', 'Oracle Cloud',
    
    // Databases
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Oracle',
    
    // DevOps
    'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'Terraform', 'Ansible',
    
    // Security
    'OAuth', 'SAML', 'PKI', 'Encryption', 'Firewall', 'VPN', 'SIEM',
    
    // Government Specific
    'FedRAMP', 'FISMA', 'NIST', 'Section 508', 'PIV', 'CAC', 'HSPD-12'
  ]
};

/**
 * Get configuration for specific environment
 */
function getEnvironmentConfig(env = process.env.NODE_ENV || 'development') {
  return seedConfig.environments[env] || seedConfig.environments.development;
}

/**
 * Get random selection from an array
 */
function getRandomSelection(array, count = 3) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate realistic company data
 */
function generateCompanyData(size = 'small', industry = 'software') {
  const sizeConfig = seedConfig.employeeCountRanges[size] || seedConfig.employeeCountRanges.small;
  const revenueConfig = seedConfig.revenueRanges[size] || seedConfig.revenueRanges.small;
  
  return {
    employeeCount: Math.floor(Math.random() * (sizeConfig.max - sizeConfig.min + 1)) + sizeConfig.min,
    annualRevenue: Math.floor(Math.random() * (revenueConfig.max - revenueConfig.min + 1)) + revenueConfig.min,
    businessType: getRandomSelection(seedConfig.businessTypes, 1)[0],
    certifications: getRandomSelection(seedConfig.certifications, Math.floor(Math.random() * 4) + 2),
    capabilities: getRandomSelection(seedConfig.capabilities[industry] || seedConfig.capabilities.software, Math.floor(Math.random() * 5) + 3),
    naics: getRandomSelection(Object.keys(seedConfig.naicsCodes), Math.floor(Math.random() * 3) + 1),
    keywords: getRandomSelection(seedConfig.technologyKeywords, Math.floor(Math.random() * 8) + 4)
  };
}

module.exports = {
  seedConfig,
  getEnvironmentConfig,
  getRandomSelection,
  generateCompanyData
};