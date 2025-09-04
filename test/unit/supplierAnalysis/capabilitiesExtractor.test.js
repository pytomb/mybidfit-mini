const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { CapabilitiesExtractor } = require('../../../src/services/supplierAnalysis/CapabilitiesExtractor');

describe('CapabilitiesExtractor - Supplier Analysis Module', () => {
  let extractor;
  
  beforeEach(() => {
    extractor = new CapabilitiesExtractor();
  });

  describe('extractEnhancedCapabilities()', () => {
    test('should extract and enhance capabilities from multiple sources', () => {
      const company = {
        name: 'TechSolutions Inc',
        capabilities: ['React', 'Node.js', 'PostgreSQL']
      };

      const analysisData = {
        website: {
          aboutPage: 'We specialize in full-stack development using React, Vue.js, Python, and cloud technologies like AWS and Azure.',
          servicesPage: 'Our services include mobile app development with React Native, API development, and DevOps automation.',
          techStack: ['JavaScript', 'TypeScript', 'Docker', 'Kubernetes']
        },
        caseStudies: [
          {
            title: 'E-commerce Platform',
            technologies: ['Next.js', 'Stripe API', 'MongoDB', 'Redis'],
            description: 'Built scalable e-commerce solution with microservices architecture'
          },
          {
            title: 'Healthcare Management System',
            technologies: ['Angular', 'Spring Boot', 'MySQL', 'FHIR'],
            description: 'HIPAA-compliant healthcare platform with real-time data processing'
          }
        ],
        certifications: ['AWS Solutions Architect', 'Google Cloud Professional', 'Certified Scrum Master']
      };

      const enhanced = extractor.extractEnhancedCapabilities(company, analysisData);

      // Should include original capabilities
      assert.ok(enhanced.capabilities.includes('React'));
      assert.ok(enhanced.capabilities.includes('Node.js'));
      assert.ok(enhanced.capabilities.includes('PostgreSQL'));

      // Should extract from website
      assert.ok(enhanced.capabilities.includes('Vue.js'));
      assert.ok(enhanced.capabilities.includes('Python'));
      assert.ok(enhanced.capabilities.includes('AWS'));
      assert.ok(enhanced.capabilities.includes('React Native'));

      // Should extract from case studies
      assert.ok(enhanced.capabilities.includes('Next.js'));
      assert.ok(enhanced.capabilities.includes('MongoDB'));
      assert.ok(enhanced.capabilities.includes('Angular'));
      assert.ok(enhanced.capabilities.includes('Spring Boot'));

      // Should infer from certifications
      assert.ok(enhanced.capabilities.includes('Cloud Architecture'));
      assert.ok(enhanced.capabilities.includes('Agile Development'));

      // Should categorize capabilities
      assert.ok(enhanced.categorized.frontend.includes('React'));
      assert.ok(enhanced.categorized.backend.includes('Node.js'));
      assert.ok(enhanced.categorized.database.includes('PostgreSQL'));
      assert.ok(enhanced.categorized.cloud.includes('AWS'));
    });

    test('should handle companies with minimal capability data', () => {
      const basicCompany = {
        name: 'SimpleWeb LLC',
        capabilities: ['HTML', 'CSS']
      };

      const basicAnalysisData = {
        website: {
          aboutPage: 'We build simple websites for small businesses'
        }
      };

      const enhanced = extractor.extractEnhancedCapabilities(basicCompany, basicAnalysisData);

      assert.ok(enhanced.capabilities.includes('HTML'));
      assert.ok(enhanced.capabilities.includes('CSS'));
      
      // Should infer basic web development capabilities
      assert.ok(enhanced.inferred.includes('Frontend Development'));
      assert.ok(enhanced.capabilityDepth === 'basic');
      assert.ok(enhanced.recommendations.includes('Consider expanding technical capabilities'));
    });

    test('should detect and remove duplicate capabilities', () => {
      const company = {
        capabilities: ['JavaScript', 'React', 'Node.js']
      };

      const analysisData = {
        website: {
          techStack: ['JavaScript', 'React.js', 'NodeJS', 'Express'] // Variations of same technologies
        },
        caseStudies: [
          {
            technologies: ['JS', 'ReactJS', 'Node', 'ExpressJS'] // More variations
          }
        ]
      };

      const enhanced = extractor.extractEnhancedCapabilities(company, analysisData);

      // Should normalize and deduplicate
      const jsCount = enhanced.capabilities.filter(cap => 
        cap.toLowerCase().includes('javascript') || cap === 'JS'
      ).length;
      const reactCount = enhanced.capabilities.filter(cap => 
        cap.toLowerCase().includes('react')
      ).length;

      assert.strictEqual(jsCount, 1); // Should consolidate to single JavaScript entry
      assert.strictEqual(reactCount, 1); // Should consolidate to single React entry
    });
  });

  describe('extractCapabilitiesFromWebsite()', () => {
    test('should extract technical capabilities from website content', () => {
      const websiteData = {
        aboutPage: `We are a full-stack development company with expertise in:
          - Frontend: React, Vue.js, Angular, TypeScript
          - Backend: Node.js, Python, Java, Spring Boot
          - Databases: PostgreSQL, MongoDB, Redis
          - Cloud: AWS, Google Cloud, Azure
          - DevOps: Docker, Kubernetes, Jenkins, GitLab CI`,
        servicesPage: 'Specialized in microservices architecture, API development, and mobile applications using React Native and Flutter',
        techStack: ['GraphQL', 'Elasticsearch', 'RabbitMQ']
      };

      const capabilities = extractor.extractCapabilitiesFromWebsite(websiteData);

      // Should extract structured lists
      assert.ok(capabilities.includes('React'));
      assert.ok(capabilities.includes('Vue.js'));
      assert.ok(capabilities.includes('Python'));
      assert.ok(capabilities.includes('PostgreSQL'));
      assert.ok(capabilities.includes('Docker'));

      // Should extract from prose descriptions
      assert.ok(capabilities.includes('Microservices'));
      assert.ok(capabilities.includes('API Development'));
      assert.ok(capabilities.includes('React Native'));

      // Should extract from technical specifications
      assert.ok(capabilities.includes('GraphQL'));
      assert.ok(capabilities.includes('Elasticsearch'));
    });

    test('should handle poorly formatted website content', () => {
      const messyWebsiteData = {
        aboutPage: 'we do web development with react node js and stuff... also some python and databases',
        servicesPage: 'WE BUILD WEBSITES!!! Contact us for React, Vue, Angular and more!'
      };

      const capabilities = extractor.extractCapabilitiesFromWebsite(messyWebsiteData);

      // Should still extract despite poor formatting
      assert.ok(capabilities.includes('React'));
      assert.ok(capabilities.includes('Node.js'));
      assert.ok(capabilities.includes('Python'));
      assert.ok(capabilities.includes('Vue'));
      
      // Should flag quality concerns
      assert.ok(capabilities.qualityFlags.includes('poor_formatting'));
    });

    test('should identify domain specializations', () => {
      const specializedWebsite = {
        aboutPage: `Healthcare technology specialists with HIPAA compliance expertise.
          We build EMR systems, patient portals, and telemedicine platforms.
          Certified in HL7 FHIR standards and healthcare interoperability.`,
        servicesPage: 'HIPAA-compliant cloud solutions, medical device integration, clinical decision support systems'
      };

      const capabilities = extractor.extractCapabilitiesFromWebsite(specializedWebsite);

      assert.ok(capabilities.includes('Healthcare Technology'));
      assert.ok(capabilities.includes('HIPAA Compliance'));
      assert.ok(capabilities.includes('HL7 FHIR'));
      assert.ok(capabilities.includes('EMR Systems'));
      assert.ok(capabilities.includes('Telemedicine'));
      
      // Should identify domain specialization
      assert.strictEqual(capabilities.domainSpecialization, 'healthcare');
      assert.ok(capabilities.regulatoryCompliance.includes('HIPAA'));
    });
  });

  describe('extractCapabilitiesFromCaseStudies()', () => {
    test('should extract capabilities from detailed case studies', () => {
      const caseStudies = [
        {
          title: 'Enterprise E-commerce Platform',
          technologies: ['Next.js', 'Stripe', 'PostgreSQL', 'Redis', 'AWS'],
          description: `Built a scalable e-commerce platform handling 10,000+ concurrent users.
            Implemented microservices architecture with Docker containers and Kubernetes orchestration.
            Used Redis for session management and PostgreSQL for transaction data.`,
          challenges: 'Real-time inventory management, payment processing, fraud detection',
          outcome: '99.9% uptime, 2.5s average page load time, PCI DSS compliance achieved'
        },
        {
          title: 'Healthcare Data Analytics Platform',
          technologies: ['Python', 'TensorFlow', 'Apache Spark', 'MongoDB', 'D3.js'],
          description: `Machine learning platform for medical image analysis and patient outcome prediction.
            Processed 50TB+ of medical imaging data using distributed computing.
            Built interactive dashboards for clinical decision support.`,
          compliance: ['HIPAA', 'FDA 510(k)', 'HL7 FHIR'],
          outcome: '87% diagnostic accuracy improvement, FDA clearance obtained'
        }
      ];

      const capabilities = extractor.extractCapabilitiesFromCaseStudies(caseStudies);

      // Should extract explicit technologies
      assert.ok(capabilities.includes('Next.js'));
      assert.ok(capabilities.includes('TensorFlow'));
      assert.ok(capabilities.includes('Apache Spark'));

      // Should infer complex capabilities from descriptions
      assert.ok(capabilities.includes('Microservices Architecture'));
      assert.ok(capabilities.includes('Container Orchestration'));
      assert.ok(capabilities.includes('Machine Learning'));
      assert.ok(capabilities.includes('Data Analytics'));
      assert.ok(capabilities.includes('Real-time Systems'));

      // Should extract domain-specific capabilities
      assert.ok(capabilities.includes('Payment Processing'));
      assert.ok(capabilities.includes('Medical Imaging'));
      assert.ok(capabilities.includes('Clinical Decision Support'));

      // Should identify compliance capabilities
      assert.ok(capabilities.includes('PCI DSS Compliance'));
      assert.ok(capabilities.includes('FDA Validation'));
      assert.ok(capabilities.includes('HIPAA Compliance'));
    });

    test('should assess project complexity and scale', () => {
      const complexCaseStudies = [
        {
          title: 'Global Trading Platform',
          scale: '100,000+ concurrent users, $10B+ daily volume',
          technologies: ['Java', 'Apache Kafka', 'Cassandra', 'Kubernetes'],
          description: 'Low-latency trading system with microsecond response times'
        }
      ];

      const simpleCaseStudies = [
        {
          title: 'Small Business Website',
          scale: '100 daily visitors',
          technologies: ['WordPress', 'PHP', 'MySQL'],
          description: 'Basic company website with contact form'
        }
      ];

      const complexCapabilities = extractor.extractCapabilitiesFromCaseStudies(complexCaseStudies);
      const simpleCapabilities = extractor.extractCapabilitiesFromCaseStudies(simpleCaseStudies);

      assert.strictEqual(complexCapabilities.complexityLevel, 'enterprise');
      assert.ok(complexCapabilities.includes('High-Performance Computing'));
      assert.ok(complexCapabilities.includes('Low-Latency Systems'));

      assert.strictEqual(simpleCapabilities.complexityLevel, 'basic');
      assert.ok(simpleCapabilities.includes('Content Management'));
    });
  });

  describe('inferCapabilitiesFromCertifications()', () => {
    test('should infer technical capabilities from professional certifications', () => {
      const certifications = [
        'AWS Solutions Architect Professional',
        'Google Cloud Professional Developer',
        'Microsoft Azure DevOps Engineer',
        'Certified Kubernetes Administrator',
        'MongoDB Certified Developer',
        'Scrum Master Certified',
        'PMP - Project Management Professional',
        'CISSP - Information Security'
      ];

      const inferred = extractor.inferCapabilitiesFromCertifications(certifications);

      // Should infer cloud capabilities
      assert.ok(inferred.includes('Cloud Architecture'));
      assert.ok(inferred.includes('Multi-Cloud Strategy'));
      assert.ok(inferred.includes('AWS'));
      assert.ok(inferred.includes('Google Cloud'));
      assert.ok(inferred.includes('Azure'));

      // Should infer specific technology expertise
      assert.ok(inferred.includes('Container Orchestration'));
      assert.ok(inferred.includes('MongoDB'));

      // Should infer process capabilities
      assert.ok(inferred.includes('Agile Development'));
      assert.ok(inferred.includes('Project Management'));
      assert.ok(inferred.includes('Security Engineering'));

      // Should assess certification quality
      assert.strictEqual(inferred.certificationLevel, 'professional');
      assert.ok(inferred.credibilityBoost > 1.2);
    });

    test('should handle basic or questionable certifications', () => {
      const basicCertifications = [
        'HTML Certificate - CodeAcademy',
        'JavaScript Basics - FreeCodeCamp',
        'WordPress Certified User'
      ];

      const inferred = extractor.inferCapabilitiesFromCertifications(basicCertifications);

      assert.strictEqual(inferred.certificationLevel, 'basic');
      assert.ok(inferred.credibilityBoost < 1.1);
      assert.ok(inferred.includes('Web Development'));
      assert.ok(inferred.recommendations.includes('Consider pursuing industry-standard certifications'));
    });
  });

  describe('categorizeCapabilities()', () => {
    test('should categorize capabilities into logical groups', () => {
      const capabilities = [
        'React', 'Vue.js', 'Angular', 'HTML', 'CSS', 'TypeScript',
        'Node.js', 'Python', 'Java', 'Spring Boot', 'Express',
        'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
        'AWS', 'Google Cloud', 'Docker', 'Kubernetes',
        'Machine Learning', 'Data Science', 'API Development',
        'HIPAA Compliance', 'PCI DSS', 'SOC 2'
      ];

      const categorized = extractor.categorizeCapabilities(capabilities);

      // Frontend technologies
      assert.ok(categorized.frontend.includes('React'));
      assert.ok(categorized.frontend.includes('Vue.js'));
      assert.ok(categorized.frontend.includes('TypeScript'));

      // Backend technologies  
      assert.ok(categorized.backend.includes('Node.js'));
      assert.ok(categorized.backend.includes('Python'));
      assert.ok(categorized.backend.includes('Spring Boot'));

      // Databases
      assert.ok(categorized.database.includes('PostgreSQL'));
      assert.ok(categorized.database.includes('MongoDB'));

      // Cloud & DevOps
      assert.ok(categorized.cloud.includes('AWS'));
      assert.ok(categorized.devops.includes('Docker'));
      assert.ok(categorized.devops.includes('Kubernetes'));

      // Specialized domains
      assert.ok(categorized.ai_ml.includes('Machine Learning'));
      assert.ok(categorized.compliance.includes('HIPAA Compliance'));

      // Should calculate category strengths
      assert.ok(categorized.strengths.frontend > 0);
      assert.ok(categorized.strengths.backend > 0);
      assert.ok(categorized.strengths.cloud > 0);
    });

    test('should identify capability gaps and recommendations', () => {
      const frontendHeavyCapabilities = [
        'React', 'Vue.js', 'Angular', 'JavaScript', 'CSS', 'HTML'
      ];

      const categorized = extractor.categorizeCapabilities(frontendHeavyCapabilities);

      assert.ok(categorized.strengths.frontend > categorized.strengths.backend);
      assert.ok(categorized.gaps.includes('backend'));
      assert.ok(categorized.gaps.includes('database'));
      assert.ok(categorized.recommendations.includes('Consider developing backend capabilities'));
    });
  });

  describe('assessCapabilityDepth()', () => {
    test('should assess depth of expertise in different technology areas', () => {
      const deepCapabilities = [
        'React', 'Redux', 'React Router', 'React Testing Library', 'Next.js',
        'Node.js', 'Express', 'Nest.js', 'TypeScript', 'GraphQL',
        'PostgreSQL', 'Prisma', 'Database Optimization', 'Query Performance',
        'AWS', 'AWS Lambda', 'CloudFormation', 'EC2', 'RDS', 'S3'
      ];

      const assessment = extractor.assessCapabilityDepth(deepCapabilities);

      // Should identify deep expertise areas
      assert.ok(assessment.expertiseAreas.includes('React Ecosystem'));
      assert.ok(assessment.expertiseAreas.includes('Node.js Ecosystem'));
      assert.ok(assessment.expertiseAreas.includes('AWS Services'));

      // Should calculate depth scores
      assert.ok(assessment.depthScores.frontend > 0.7);
      assert.ok(assessment.depthScores.backend > 0.7);
      assert.ok(assessment.depthScores.cloud > 0.7);

      assert.strictEqual(assessment.overallDepth, 'expert');
    });

    test('should identify shallow capability coverage', () => {
      const shallowCapabilities = [
        'HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL', 'WordPress'
      ];

      const assessment = extractor.assessCapabilityDepth(shallowCapabilities);

      assert.strictEqual(assessment.overallDepth, 'basic');
      assert.ok(assessment.depthScores.frontend < 0.5);
      assert.ok(assessment.concerns.includes('Limited depth in individual technology areas'));
      assert.ok(assessment.recommendations.includes('Focus on deepening expertise'));
    });
  });

  describe('Integration with AI Analysis', () => {
    test('should incorporate AI-enhanced capability extraction', () => {
      const company = { capabilities: ['React', 'Node.js'] };
      
      const analysisData = {
        aiInsights: {
          capabilityExtraction: {
            extractedTechnologies: ['GraphQL', 'TypeScript', 'Docker'],
            inferredSkills: ['API Design', 'Database Modeling', 'System Architecture'],
            confidenceScores: {
              'GraphQL': 0.9,
              'API Design': 0.8,
              'System Architecture': 0.7
            }
          },
          domainExpertise: {
            primary: 'Web Development',
            secondary: ['API Development', 'Full Stack Development'],
            specializationScore: 0.85
          }
        }
      };

      const enhanced = extractor.extractEnhancedCapabilities(company, analysisData);

      assert.ok(enhanced.aiEnhanced === true);
      assert.ok(enhanced.capabilities.includes('GraphQL'));
      assert.ok(enhanced.capabilities.includes('API Design'));
      assert.ok(enhanced.capabilities.includes('System Architecture'));
      
      // Should weight by confidence scores
      assert.ok(enhanced.aiConfidence.GraphQL === 0.9);
      assert.ok(enhanced.domainExpertise.primary === 'Web Development');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed or missing analysis data', () => {
      const company = { capabilities: ['JavaScript'] };
      const malformedData = {
        website: null,
        caseStudies: 'invalid format',
        certifications: undefined
      };

      const enhanced = extractor.extractEnhancedCapabilities(company, malformedData);

      assert.ok(enhanced.capabilities.includes('JavaScript'));
      assert.ok(enhanced.warnings.includes('Some data sources were invalid or missing'));
      assert.ok(enhanced.dataQuality < 0.5);
    });

    test('should validate input parameters', () => {
      assert.throws(() => {
        extractor.extractEnhancedCapabilities(null, {});
      }, /Invalid company parameter/);
    });

    test('should handle extremely large capability lists', () => {
      const company = {
        capabilities: Array.from({ length: 500 }, (_, i) => `skill_${i}`)
      };

      const enhanced = extractor.extractEnhancedCapabilities(company, {});

      // Should handle large lists but flag for review
      assert.ok(enhanced.capabilities.length > 400);
      assert.ok(enhanced.warnings.includes('Unusually large capability list - manual review recommended'));
    });
  });

  describe('Real-World Capability Extraction Scenarios', () => {
    test('should extract capabilities from typical software consulting company', () => {
      const consultingCompany = {
        name: 'Enterprise Solutions LLC',
        capabilities: ['Java', 'Spring', 'Oracle']
      };

      const consultingData = {
        website: {
          aboutPage: 'Enterprise software consulting with 15 years experience in financial services and healthcare',
          servicesPage: 'Custom software development, system integration, cloud migration, digital transformation'
        },
        caseStudies: [
          {
            title: 'Banking Core System Modernization',
            technologies: ['Java EE', 'Spring Boot', 'Microservices', 'Kubernetes', 'Oracle DB'],
            description: 'Migrated legacy mainframe system to modern cloud-native architecture'
          }
        ],
        certifications: ['Java EE Architect', 'AWS Solutions Architect', 'PMP']
      };

      const enhanced = extractor.extractEnhancedCapabilities(consultingCompany, consultingData);

      assert.ok(enhanced.capabilities.includes('Enterprise Software'));
      assert.ok(enhanced.capabilities.includes('System Integration'));
      assert.ok(enhanced.capabilities.includes('Cloud Migration'));
      assert.ok(enhanced.capabilities.includes('Digital Transformation'));
      assert.ok(enhanced.capabilities.includes('Microservices'));
      assert.ok(enhanced.domainExpertise.includes('Financial Services'));
      assert.ok(enhanced.domainExpertise.includes('Healthcare'));
    });

    test('should extract capabilities from startup focusing on mobile apps', () => {
      const mobileStartup = {
        name: 'MobileFirst Innovations',
        capabilities: ['React Native', 'iOS', 'Android']
      };

      const mobileData = {
        website: {
          aboutPage: 'Mobile app development specialists creating native iOS and Android applications',
          portfolio: [
            { name: 'Fitness Tracker App', platforms: ['iOS', 'Android'], users: '50K+' },
            { name: 'Food Delivery Platform', technologies: ['React Native', 'Firebase', 'Stripe'] }
          ]
        }
      };

      const enhanced = extractor.extractEnhancedCapabilities(mobileStartup, mobileData);

      assert.ok(enhanced.capabilities.includes('Mobile App Development'));
      assert.ok(enhanced.capabilities.includes('Firebase'));
      assert.ok(enhanced.capabilities.includes('Payment Integration'));
      assert.strictEqual(enhanced.specialization, 'mobile_development');
      assert.ok(enhanced.categorized.mobile.length > 0);
    });
  });
});