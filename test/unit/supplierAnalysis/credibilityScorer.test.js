const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { CredibilityScorer } = require('../../../src/services/supplierAnalysis/CredibilityScorer');

describe('CredibilityScorer - Supplier Analysis Module', () => {
  let scorer;
  
  beforeEach(() => {
    scorer = new CredibilityScorer();
  });

  describe('calculateCredibilityScore()', () => {
    test('should calculate comprehensive credibility score (0-10 scale)', () => {
      const company = {
        name: 'TechSolutions Inc',
        yearEstablished: 2015,
        teamSize: 25,
        certifications: ['ISO 9001', 'AWS Solutions Architect'],
        projectsCompleted: 150
      };

      const analysisData = {
        website: {
          aboutPage: 'Founded in 2015, we specialize in enterprise software development with over 150 successful projects.',
          teamPage: '25 experienced developers and project managers',
          portfolio: [
            { name: 'E-commerce Platform', client: 'RetailCorp', year: 2023 },
            { name: 'Banking System', client: 'FinanceBank', year: 2022 }
          ]
        },
        caseStudies: [
          {
            title: 'Enterprise CRM Implementation',
            duration: '8 months',
            teamSize: 12,
            outcome: 'Delivered on time and under budget, 30% efficiency improvement'
          }
        ],
        clientTestimonials: [
          { rating: 5, comment: 'Excellent work quality and communication' },
          { rating: 4, comment: 'Professional team, minor delays but great outcome' }
        ]
      };

      const credibilityScore = scorer.calculateCredibilityScore(company, analysisData);

      assert.ok(credibilityScore >= 0 && credibilityScore <= 10);
      assert.ok(credibilityScore > 6); // Should be above average for established company
      
      // Should include detailed breakdown
      assert.ok(credibilityScore.breakdown);
      assert.ok(credibilityScore.breakdown.experienceScore >= 0);
      assert.ok(credibilityScore.breakdown.portfolioScore >= 0);
      assert.ok(credibilityScore.breakdown.certificationScore >= 0);
      assert.ok(credibilityScore.breakdown.teamScore >= 0);
      assert.ok(credibilityScore.breakdown.testimonialScore >= 0);
    });

    test('should handle new company with limited track record', () => {
      const newCompany = {
        name: 'StartupDev',
        yearEstablished: 2023, // New company
        teamSize: 5,
        certifications: [],
        projectsCompleted: 8
      };

      const limitedAnalysisData = {
        website: {
          aboutPage: 'New startup focused on modern web development',
          teamPage: '5 passionate developers'
        },
        caseStudies: [
          {
            title: 'Small Business Website',
            duration: '2 months', 
            outcome: 'Client satisfaction achieved'
          }
        ]
      };

      const credibilityScore = scorer.calculateCredibilityScore(newCompany, limitedAnalysisData);

      assert.ok(credibilityScore >= 0 && credibilityScore <= 10);
      assert.ok(credibilityScore < 6); // Should be below average due to limited track record
      assert.ok(credibilityScore.riskFactors.includes('Limited operating history'));
      assert.ok(credibilityScore.riskFactors.includes('Small project portfolio'));
    });

    test('should penalize companies with red flags', () => {
      const riskyCompany = {
        name: 'QuestionableDev',
        yearEstablished: 2020,
        teamSize: 3,
        projectsCompleted: 2 // Very low for 4 years
      };

      const problematicData = {
        website: {
          aboutPage: 'We do all kinds of development', // Vague
          portfolio: [] // No portfolio
        },
        clientTestimonials: [
          { rating: 2, comment: 'Poor communication and missed deadlines' },
          { rating: 3, comment: 'Okay work but nothing special' }
        ]
      };

      const credibilityScore = scorer.calculateCredibilityScore(riskyCompany, problematicData);

      assert.ok(credibilityScore < 4); // Should be low due to red flags
      assert.ok(credibilityScore.redFlags.length > 0);
      assert.ok(credibilityScore.redFlags.includes('Very low project volume for company age'));
      assert.ok(credibilityScore.redFlags.includes('Below-average client testimonials'));
    });
  });

  describe('scoreExperience()', () => {
    test('should score experience based on years in business and project volume', () => {
      const establishedCompany = {
        yearEstablished: 2010, // 14 years experience
        projectsCompleted: 300
      };

      const analysisData = {
        website: {
          aboutPage: 'Established in 2010 with over 300 completed projects across various industries'
        }
      };

      const experienceScore = scorer.scoreExperience(establishedCompany, analysisData);

      assert.ok(experienceScore >= 2.0); // High experience score
      assert.ok(experienceScore <= 3.0); // Max possible for experience component
      
      // Should identify experience level
      assert.ok(experienceScore.level === 'senior' || experienceScore.level === 'expert');
      assert.ok(experienceScore.yearsInBusiness >= 14);
    });

    test('should handle startup companies appropriately', () => {
      const startup = {
        yearEstablished: 2023, // 1 year
        projectsCompleted: 12
      };

      const experienceScore = scorer.scoreExperience(startup, {});

      assert.ok(experienceScore < 1.5); // Lower score for limited experience
      assert.strictEqual(experienceScore.level, 'junior');
      assert.ok(experienceScore.yearsInBusiness <= 2);
    });

    test('should detect inconsistencies in experience claims', () => {
      const inconsistentCompany = {
        yearEstablished: 2022, // 2 years old
        projectsCompleted: 500 // Unrealistic for 2 years
      };

      const analysisData = {
        website: {
          aboutPage: 'Founded in 2022, we have 20+ years of experience' // Contradictory
        }
      };

      const experienceScore = scorer.scoreExperience(inconsistentCompany, analysisData);

      assert.ok(experienceScore.warnings.includes('Inconsistent experience claims detected'));
      assert.ok(experienceScore.value < 2.0); // Penalized for inconsistency
    });
  });

  describe('scoreProjectPortfolio()', () => {
    test('should evaluate portfolio diversity and quality', () => {
      const company = { projectsCompleted: 75 };
      
      const analysisData = {
        website: {
          portfolio: [
            { name: 'E-commerce Platform', industry: 'Retail', technologies: ['React', 'Node.js'] },
            { name: 'Healthcare Management', industry: 'Healthcare', technologies: ['Vue.js', 'Python'] },
            { name: 'Financial Dashboard', industry: 'Finance', technologies: ['Angular', 'Java'] }
          ]
        },
        caseStudies: [
          {
            title: 'Enterprise CRM',
            industry: 'Enterprise',
            complexity: 'high',
            outcome: 'Delivered on time, 40% efficiency improvement',
            clientSize: 'large'
          },
          {
            title: 'Mobile Banking App',
            industry: 'Finance',
            complexity: 'high',
            outcome: '99.9% uptime achieved, 50,000+ active users'
          }
        ]
      };

      const portfolioScore = scorer.scoreProjectPortfolio(company, analysisData);

      assert.ok(portfolioScore >= 1.5); // Good portfolio should score well
      assert.ok(portfolioScore <= 3.0); // Max possible
      
      // Should identify portfolio strengths
      assert.ok(portfolioScore.diversity > 0.7); // High industry diversity
      assert.ok(portfolioScore.complexityLevel >= 'medium');
      assert.ok(portfolioScore.industries.length >= 3);
    });

    test('should penalize limited or low-quality portfolios', () => {
      const company = { projectsCompleted: 3 };
      
      const analysisData = {
        website: {
          portfolio: [
            { name: 'Simple Website', industry: 'Small Business', complexity: 'basic' }
          ]
        },
        caseStudies: [] // No detailed case studies
      };

      const portfolioScore = scorer.scoreProjectPortfolio(company, analysisData);

      assert.ok(portfolioScore < 1.5); // Should score below average
      assert.ok(portfolioScore.diversity < 0.5); // Low diversity
      assert.strictEqual(portfolioScore.complexityLevel, 'basic');
      assert.ok(portfolioScore.concerns.includes('Limited portfolio diversity'));
    });
  });

  describe('scoreCertifications()', () => {
    test('should properly value industry-relevant certifications', () => {
      const analysisData = {
        certifications: [
          'AWS Solutions Architect Professional',
          'Google Cloud Professional Developer',
          'ISO 27001 Lead Implementer',
          'Certified Scrum Master',
          'Microsoft Azure DevOps Engineer'
        ],
        website: {
          aboutPage: 'Our team holds multiple cloud and security certifications'
        }
      };

      const certificationScore = scorer.scoreCertifications(analysisData);

      assert.ok(certificationScore >= 1.5); // Strong certifications
      assert.ok(certificationScore <= 2.0); // Max for this component
      
      // Should categorize certifications
      assert.ok(certificationScore.categories.cloud > 0);
      assert.ok(certificationScore.categories.security > 0);
      assert.ok(certificationScore.categories.process > 0);
      assert.strictEqual(certificationScore.level, 'expert');
    });

    test('should handle companies with basic or no certifications', () => {
      const analysisData = {
        certifications: ['Basic IT Certification'],
        website: {
          aboutPage: 'We focus on learning and staying current'
        }
      };

      const certificationScore = scorer.scoreCertifications(analysisData);

      assert.ok(certificationScore < 1.0);
      assert.strictEqual(certificationScore.level, 'basic');
      assert.ok(certificationScore.recommendations.includes('Consider obtaining industry-standard certifications'));
    });

    test('should verify certification authenticity when possible', () => {
      const analysisData = {
        certifications: [
          'AWS Solutions Architect (Verified)',
          'Self-proclaimed Docker Expert', // Not a real certification
          'Certified Kubernetes Administrator'
        ]
      };

      const certificationScore = scorer.scoreCertifications(analysisData);

      assert.ok(certificationScore.verified.length < certificationScore.claimed.length);
      assert.ok(certificationScore.warnings.includes('Some certifications could not be verified'));
    });
  });

  describe('scoreTeamQuality()', () => {
    test('should evaluate team composition and experience', () => {
      const company = { teamSize: 20 };
      
      const analysisData = {
        website: {
          teamPage: `Our 20-person team includes:
            - 12 senior software engineers with 5+ years experience
            - 3 technical leads with 8+ years experience  
            - 2 project managers with PMP certification
            - 1 UI/UX designer with design degree
            - 2 QA engineers with automation expertise`
        },
        teamProfiles: [
          { role: 'Technical Lead', experience: 10, education: 'MS Computer Science' },
          { role: 'Senior Developer', experience: 7, education: 'BS Software Engineering' },
          { role: 'Project Manager', experience: 8, certifications: ['PMP', 'CSM'] }
        ]
      };

      const teamScore = scorer.scoreTeamQuality(company, analysisData);

      assert.ok(teamScore >= 1.5); // Strong team composition
      assert.ok(teamScore <= 2.0); // Max for this component
      
      // Should analyze team structure
      assert.ok(teamScore.seniorityRatio > 0.6); // Good senior/junior ratio
      assert.ok(teamScore.specializations.includes('technical_leadership'));
      assert.ok(teamScore.specializations.includes('project_management'));
    });

    test('should identify team weaknesses and risks', () => {
      const company = { teamSize: 3 };
      
      const analysisData = {
        website: {
          teamPage: '3 developers who are passionate about coding'
        },
        teamProfiles: [
          { role: 'Developer', experience: 1 },
          { role: 'Developer', experience: 2 },
          { role: 'Founder/Developer', experience: 3 }
        ]
      };

      const teamScore = scorer.scoreTeamQuality(company, analysisData);

      assert.ok(teamScore < 1.0); // Below average due to small size and limited experience
      assert.ok(teamScore.risks.includes('Very small team size may limit capacity'));
      assert.ok(teamScore.risks.includes('Limited senior leadership'));
      assert.ok(teamScore.seniorityRatio < 0.4);
    });
  });

  describe('Edge Cases and Validation', () => {
    test('should handle missing company data gracefully', () => {
      const incompleteCompany = { name: 'MissingData Corp' };
      const emptyAnalysisData = {};

      const credibilityScore = scorer.calculateCredibilityScore(incompleteCompany, emptyAnalysisData);

      assert.ok(credibilityScore >= 0 && credibilityScore <= 10);
      assert.ok(credibilityScore < 3); // Should be low due to missing data
      assert.ok(credibilityScore.dataCompleteness < 0.5);
      assert.ok(credibilityScore.warnings.includes('Insufficient data for complete assessment'));
    });

    test('should validate input parameters', () => {
      assert.throws(() => {
        scorer.calculateCredibilityScore(null, null);
      }, /Invalid parameters for credibility scoring/);
    });

    test('should handle extreme values appropriately', () => {
      const extremeCompany = {
        yearEstablished: 1990, // 34 years
        teamSize: 10000, // Massive team
        projectsCompleted: 50000 // Unrealistic number
      };

      const credibilityScore = scorer.calculateCredibilityScore(extremeCompany, {});

      // Should cap scores appropriately and flag inconsistencies
      assert.ok(credibilityScore <= 10);
      assert.ok(credibilityScore.warnings.includes('Extreme values detected - manual verification recommended'));
    });
  });

  describe('Integration with ML and AI Analysis', () => {
    test('should incorporate AI-generated insights about company credibility', () => {
      const company = { name: 'AI Analyzed Corp' };
      
      const analysisData = {
        aiInsights: {
          sentimentAnalysis: {
            overall: 0.7, // Positive sentiment
            clientReviews: 0.8,
            onlinePresence: 0.6
          },
          riskFactors: [
            { factor: 'Limited financial transparency', severity: 'medium' },
            { factor: 'Recent team turnover', severity: 'low' }
          ],
          strengthIndicators: [
            'Consistent project delivery',
            'Strong technical expertise',
            'Good client retention'
          ]
        }
      };

      const credibilityScore = scorer.calculateCredibilityScore(company, analysisData);

      assert.ok(credibilityScore.aiEnhanced === true);
      assert.ok(credibilityScore.sentimentScore > 0.5);
      assert.ok(credibilityScore.aiInsights.strengthIndicators.length > 0);
      assert.ok(credibilityScore.aiInsights.riskFactors.length > 0);
    });

    test('should weight AI insights appropriately with traditional metrics', () => {
      const company = { yearEstablished: 2015, teamSize: 15, projectsCompleted: 100 };
      
      const traditionalData = {
        certifications: ['AWS Certified', 'ISO 9001'],
        caseStudies: [{ title: 'Success Story', outcome: 'Positive results' }]
      };

      const aiEnhancedData = {
        ...traditionalData,
        aiInsights: {
          sentimentAnalysis: { overall: 0.9 },
          credibilityFactors: { 
            onlineReputation: 0.85,
            projectSuccessRate: 0.92
          }
        }
      };

      const traditionalScore = scorer.calculateCredibilityScore(company, traditionalData);
      const aiEnhancedScore = scorer.calculateCredibilityScore(company, aiEnhancedData);

      // AI enhancement should improve score but not dominate
      assert.ok(aiEnhancedScore.totalScore > traditionalScore.totalScore);
      assert.ok(aiEnhancedScore.totalScore - traditionalScore.totalScore < 2); // Reasonable improvement
    });
  });

  describe('Industry-Specific Credibility Factors', () => {
    test('should apply healthcare industry credibility standards', () => {
      const healthcareCompany = {
        name: 'MedTech Solutions',
        yearEstablished: 2018,
        industry: 'healthcare'
      };

      const analysisData = {
        certifications: ['HIPAA Compliance', 'FDA Software Validation', 'HL7 FHIR'],
        portfolio: [
          { name: 'EMR System', compliance: ['HIPAA', 'HITECH'] },
          { name: 'Patient Portal', security: 'SOC 2 Type II' }
        ]
      };

      const credibilityScore = scorer.calculateCredibilityScore(healthcareCompany, analysisData);

      assert.ok(credibilityScore.industrySpecific.healthcareCompliance > 0.8);
      assert.ok(credibilityScore.regulatoryScore > 1.5); // High regulatory compliance
      assert.ok(credibilityScore.breakdown.complianceScore >= 0);
    });

    test('should apply financial services credibility standards', () => {
      const fintechCompany = {
        name: 'Financial Software Inc',
        industry: 'finance'
      };

      const analysisData = {
        certifications: ['PCI DSS', 'SOX Compliance', 'ISO 27001'],
        portfolio: [
          { name: 'Payment Processing System', security: 'PCI Level 1' },
          { name: 'Trading Platform', regulations: ['SEC', 'FINRA'] }
        ]
      };

      const credibilityScore = scorer.calculateCredibilityScore(fintechCompany, analysisData);

      assert.ok(credibilityScore.industrySpecific.financialCompliance > 0.8);
      assert.ok(credibilityScore.securityScore > 1.5);
      assert.ok(credibilityScore.auditReadiness >= 'high');
    });
  });
});