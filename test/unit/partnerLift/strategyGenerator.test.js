const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { StrategyGenerator } = require('../../../src/services/partnerLift/StrategyGenerator');

describe('StrategyGenerator - Partner Lift Module', () => {
  let generator;
  
  beforeEach(() => {
    generator = new StrategyGenerator();
  });

  describe('generatePartnershipStrategy()', () => {
    test('should generate comprehensive partnership strategy for complementary companies', () => {
      const companyA = {
        id: 'comp_1',
        name: 'Frontend Experts',
        capabilities: ['React', 'Vue.js', 'UI/UX Design'],
        size: 'medium',
        experience: 6,
        strengths: ['User Interface', 'Design Systems']
      };
      
      const companyB = {
        id: 'comp_2', 
        name: 'Backend Solutions',
        capabilities: ['Node.js', 'PostgreSQL', 'AWS', 'Microservices'],
        size: 'small',
        experience: 8,
        strengths: ['Scalable Architecture', 'Database Design']
      };

      const liftAnalysis = {
        liftAmount: 25,
        liftPercentage: 31.25,
        isPositiveLift: true,
        synergyType: 'complementary'
      };

      const contributions = {
        contributionA: 70,
        contributionB: 80,
        contributionPercentageA: 46.67,
        contributionPercentageB: 53.33,
        fairnessScore: 85
      };

      const strategy = generator.generatePartnershipStrategy(
        companyA, companyB, liftAnalysis, [], contributions
      );

      // Verify strategic structure
      assert.strictEqual(strategy.recommendedStructure, 'joint_venture');
      assert.ok(strategy.keySuccessFactors.includes('Clear role division'));
      assert.ok(strategy.keySuccessFactors.includes('Complementary expertise leverage'));
      
      // Verify governance model
      assert.strictEqual(strategy.governance.model, 'collaborative');
      assert.ok(strategy.governance.decisionMaking.includes('consensus_on_technical'));
      assert.ok(strategy.governance.roles.companyA.includes('Frontend leadership'));
      assert.ok(strategy.governance.roles.companyB.includes('Backend architecture'));
      
      // Verify revenue sharing aligns with contributions
      assert.strictEqual(strategy.financial.revenueSharing.companyA, 46.67);
      assert.strictEqual(strategy.financial.revenueSharing.companyB, 53.33);
      assert.strictEqual(strategy.financial.basis, 'contribution_based');
    });

    test('should recommend strategic alliance for similar-sized companies', () => {
      const companyA = {
        name: 'TechCorp A',
        size: 'large',
        experience: 10,
        capabilities: ['Full Stack', 'Cloud', 'AI/ML']
      };
      
      const companyB = {
        name: 'TechCorp B', 
        size: 'large',
        experience: 12,
        capabilities: ['Enterprise Software', 'Security', 'Integration']
      };

      const liftAnalysis = {
        liftAmount: 15,
        liftPercentage: 18,
        isPositiveLift: true,
        synergyType: 'additive'
      };

      const contributions = {
        contributionPercentageA: 48,
        contributionPercentageB: 52,
        fairnessScore: 92
      };

      const strategy = generator.generatePartnershipStrategy(
        companyA, companyB, liftAnalysis, [], contributions
      );

      assert.strictEqual(strategy.recommendedStructure, 'strategic_alliance');
      assert.strictEqual(strategy.governance.model, 'committee_based');
      assert.ok(strategy.keySuccessFactors.includes('Clear IP agreements'));
      assert.ok(strategy.riskMitigations.includes('Competitive overlap management'));
    });

    test('should recommend subcontractor model for unequal partnerships', () => {
      const largeCompany = {
        name: 'Enterprise Corp',
        size: 'large', 
        experience: 15,
        marketPresence: 'global'
      };
      
      const smallCompany = {
        name: 'Niche Specialists',
        size: 'small',
        experience: 5,
        marketPresence: 'regional'
      };

      const liftAnalysis = {
        liftAmount: 10,
        liftPercentage: 12,
        isPositiveLift: true
      };

      const contributions = {
        contributionPercentageA: 75, // Large company dominates
        contributionPercentageB: 25,
        fairnessScore: 65 // Some imbalance
      };

      const strategy = generator.generatePartnershipStrategy(
        largeCompany, smallCompany, liftAnalysis, [], contributions
      );

      assert.strictEqual(strategy.recommendedStructure, 'prime_subcontractor');
      assert.strictEqual(strategy.governance.model, 'hierarchical');
      assert.strictEqual(strategy.governance.primeContractor, 'companyA');
      assert.ok(strategy.financial.revenueSharing.companyA > 70);
      assert.ok(strategy.riskMitigations.includes('Subcontractor capacity management'));
    });
  });

  describe('determineOptimalStructure()', () => {
    test('should recommend joint venture for high-synergy partnerships', () => {
      const liftAnalysis = {
        liftPercentage: 35,
        synergyType: 'complementary',
        isPositiveLift: true
      };

      const structure = generator.determineOptimalStructure(liftAnalysis);

      assert.strictEqual(structure, 'joint_venture');
      assert.ok(liftAnalysis.liftPercentage > 30); // High synergy threshold
    });

    test('should recommend strategic alliance for moderate synergy', () => {
      const liftAnalysis = {
        liftPercentage: 20,
        synergyType: 'additive',
        isPositiveLift: true
      };

      const structure = generator.determineOptimalStructure(liftAnalysis);

      assert.strictEqual(structure, 'strategic_alliance');
    });

    test('should recommend project-based collaboration for low synergy', () => {
      const liftAnalysis = {
        liftPercentage: 8,
        synergyType: 'minimal',
        isPositiveLift: true
      };

      const structure = generator.determineOptimalStructure(liftAnalysis);

      assert.strictEqual(structure, 'project_collaboration');
    });

    test('should recommend avoiding partnership for negative synergy', () => {
      const liftAnalysis = {
        liftPercentage: -15,
        synergyType: 'negative',
        isPositiveLift: false
      };

      const structure = generator.determineOptimalStructure(liftAnalysis);

      assert.strictEqual(structure, 'not_recommended');
    });
  });

  describe('identifySuccessFactors()', () => {
    test('should identify success factors for technology partnerships', () => {
      const liftAnalysis = {
        synergyType: 'complementary',
        keyAreas: ['Frontend Development', 'Backend Infrastructure']
      };

      const requirementImprovements = [
        { requirement: 'Technical Integration', improvement: 2.5 },
        { requirement: 'Code Quality', improvement: 1.8 },
        { requirement: 'Performance Optimization', improvement: 1.2 }
      ];

      const successFactors = generator.identifySuccessFactors(liftAnalysis, requirementImprovements);

      assert.ok(successFactors.includes('Clear technical integration protocols'));
      assert.ok(successFactors.includes('Standardized development practices'));
      assert.ok(successFactors.includes('Regular code review processes'));
      assert.ok(successFactors.includes('Performance monitoring framework'));
    });

    test('should identify success factors for client-facing partnerships', () => {
      const liftAnalysis = {
        synergyType: 'complementary',
        keyAreas: ['Client Management', 'Delivery Excellence']
      };

      const requirementImprovements = [
        { requirement: 'Client Communication', improvement: 3.0 },
        { requirement: 'Project Management', improvement: 2.2 }
      ];

      const successFactors = generator.identifySuccessFactors(liftAnalysis, requirementImprovements);

      assert.ok(successFactors.includes('Unified client communication strategy'));
      assert.ok(successFactors.includes('Joint project management approach'));
      assert.ok(successFactors.includes('Consistent service quality standards'));
    });

    test('should prioritize success factors by improvement magnitude', () => {
      const requirementImprovements = [
        { requirement: 'Critical Capability', improvement: 4.0 },
        { requirement: 'Minor Enhancement', improvement: 0.5 },
        { requirement: 'Moderate Improvement', improvement: 2.0 }
      ];

      const successFactors = generator.identifySuccessFactors({}, requirementImprovements);

      // Critical improvements should generate more success factors
      const criticalFactors = successFactors.filter(factor => 
        factor.toLowerCase().includes('critical') || factor.includes('Critical Capability')
      );
      assert.ok(criticalFactors.length > 0);
    });
  });

  describe('developRiskMitigations()', () => {
    test('should identify integration risks for technology partnerships', () => {
      const companyA = {
        technologies: ['React', 'Node.js'],
        developmentProcess: 'Agile',
        teamSize: 15
      };
      
      const companyB = {
        technologies: ['Vue.js', 'Python'],
        developmentProcess: 'Waterfall',
        teamSize: 8
      };

      const liftAnalysis = {
        concerns: ['technology_mismatch', 'process_incompatibility']
      };

      const riskMitigations = generator.developRiskMitigations(liftAnalysis, companyA, companyB);

      assert.ok(riskMitigations.includes('Technology stack harmonization plan'));
      assert.ok(riskMitigations.includes('Development process alignment strategy'));
      assert.ok(riskMitigations.includes('Cross-team communication protocols'));
    });

    test('should address scale mismatch risks', () => {
      const largeCompany = { teamSize: 200, revenue: 50000000 };
      const smallCompany = { teamSize: 12, revenue: 2000000 };

      const liftAnalysis = {
        concerns: ['scale_mismatch', 'coordination_complexity']
      };

      const riskMitigations = generator.developRiskMitigations(liftAnalysis, largeCompany, smallCompany);

      assert.ok(riskMitigations.includes('Capacity planning and scaling strategy'));
      assert.ok(riskMitigations.includes('Communication hierarchy definition'));
      assert.ok(riskMitigations.includes('Resource allocation framework'));
    });

    test('should address competitive overlap concerns', () => {
      const competitorA = { marketSegments: ['Enterprise', 'SMB'], services: ['Consulting', 'Development'] };
      const competitorB = { marketSegments: ['SMB', 'Startups'], services: ['Development', 'Support'] };

      const liftAnalysis = {
        concerns: ['competitive_overlap', 'client_conflict']
      };

      const riskMitigations = generator.developRiskMitigations(liftAnalysis, competitorA, competitorB);

      assert.ok(riskMitigations.includes('Market segment specialization agreement'));
      assert.ok(riskMitigations.includes('Client conflict resolution protocol'));
      assert.ok(riskMitigations.includes('Intellectual property protection measures'));
    });
  });

  describe('createImplementationRoadmap()', () => {
    test('should create phased implementation timeline', () => {
      const strategy = {
        recommendedStructure: 'joint_venture',
        keySuccessFactors: ['Technical integration', 'Team alignment'],
        riskMitigations: ['Process harmonization', 'Communication protocols']
      };

      const roadmap = generator.createImplementationRoadmap(strategy);

      // Should have multiple phases
      assert.ok(roadmap.phases.length >= 4);
      
      // Phase 1: Foundation
      const foundationPhase = roadmap.phases[0];
      assert.strictEqual(foundationPhase.name, 'Foundation & Legal');
      assert.ok(foundationPhase.duration.weeks <= 4);
      assert.ok(foundationPhase.milestones.includes('Partnership agreement signed'));
      
      // Phase 2: Integration
      const integrationPhase = roadmap.phases[1]; 
      assert.strictEqual(integrationPhase.name, 'Team Integration');
      assert.ok(integrationPhase.milestones.includes('Cross-team communication established'));
      
      // Should have realistic timeline
      const totalWeeks = roadmap.phases.reduce((sum, phase) => sum + phase.duration.weeks, 0);
      assert.ok(totalWeeks >= 12 && totalWeeks <= 52); // 3-12 month implementation
    });

    test('should adjust timeline based on partnership complexity', () => {
      const simpleStrategy = {
        recommendedStructure: 'project_collaboration',
        riskMitigations: ['Basic coordination']
      };

      const complexStrategy = {
        recommendedStructure: 'joint_venture',
        riskMitigations: ['Technology integration', 'Process alignment', 'Legal structure', 'Team integration']
      };

      const simpleRoadmap = generator.createImplementationRoadmap(simpleStrategy);
      const complexRoadmap = generator.createImplementationRoadmap(complexStrategy);

      const simpleTotalWeeks = simpleRoadmap.phases.reduce((sum, phase) => sum + phase.duration.weeks, 0);
      const complexTotalWeeks = complexRoadmap.phases.reduce((sum, phase) => sum + phase.duration.weeks, 0);

      assert.ok(complexTotalWeeks > simpleTotalWeeks);
      assert.ok(complexRoadmap.phases.length >= simpleRoadmap.phases.length);
    });
  });

  describe('Financial Strategy Generation', () => {
    test('should create detailed financial framework', () => {
      const contributions = {
        contributionPercentageA: 60,
        contributionPercentageB: 40,
        synergy: 25,
        fairnessScore: 80
      };

      const financial = generator.createFinancialFramework(contributions, 1000000); // $1M project

      assert.strictEqual(financial.revenueSharing.companyA, 60);
      assert.strictEqual(financial.revenueSharing.companyB, 40);
      assert.strictEqual(financial.totalProjectValue, 1000000);
      
      // Should include cost sharing model
      assert.ok(financial.costSharing);
      assert.ok(financial.costSharing.development);
      assert.ok(financial.costSharing.operational);
      
      // Should include profit sharing
      assert.ok(financial.profitSharing.model === 'contribution_based');
      assert.ok(financial.incentiveStructure.synergyBonus > 0);
    });

    test('should adjust financial model for different partnership types', () => {
      const equalContributions = {
        contributionPercentageA: 50,
        contributionPercentageB: 50,
        fairnessScore: 95
      };

      const unequalContributions = {
        contributionPercentageA: 80,
        contributionPercentageB: 20,
        fairnessScore: 60
      };

      const equalFinancial = generator.createFinancialFramework(equalContributions);
      const unequalFinancial = generator.createFinancialFramework(unequalContributions);

      assert.strictEqual(equalFinancial.revenueSharing.companyA, 50);
      assert.strictEqual(unequalFinancial.revenueSharing.companyA, 80);
      
      // Unequal partnerships should have different risk/reward structures
      assert.ok(unequalFinancial.riskSharing.model === 'proportional');
      assert.ok(equalFinancial.riskSharing.model === 'equal');
    });
  });

  describe('Edge Cases and Validation', () => {
    test('should handle missing company information gracefully', () => {
      const incompleteCompanyA = { name: 'Company A' }; // Missing most properties
      const incompleteCompanyB = null;

      const liftAnalysis = { liftPercentage: 20, isPositiveLift: true };
      const contributions = { contributionPercentageA: 50, contributionPercentageB: 50 };

      const strategy = generator.generatePartnershipStrategy(
        incompleteCompanyA, incompleteCompanyB, liftAnalysis, [], contributions
      );

      assert.ok(strategy.recommendedStructure); // Should still provide recommendation
      assert.ok(strategy.keySuccessFactors.length > 0);
      assert.ok(strategy.warnings.includes('Incomplete company information'));
    });

    test('should validate input parameters', () => {
      assert.throws(() => {
        generator.generatePartnershipStrategy(null, null, null, null, null);
      }, /Invalid parameters for strategy generation/);
    });

    test('should handle extreme contribution imbalances', () => {
      const extremeContributions = {
        contributionPercentageA: 95,
        contributionPercentageB: 5,
        fairnessScore: 20 // Very unfair
      };

      const liftAnalysis = { liftPercentage: 10, isPositiveLift: true };

      const strategy = generator.generatePartnershipStrategy(
        { name: 'Dominant' }, { name: 'Minor' }, liftAnalysis, [], extremeContributions
      );

      assert.strictEqual(strategy.recommendedStructure, 'prime_subcontractor');
      assert.ok(strategy.concerns.includes('Significant contribution imbalance'));
      assert.ok(strategy.riskMitigations.includes('Partner dependency risk management'));
    });
  });

  describe('Real-World Partnership Scenarios', () => {
    test('should generate strategy for tech startup merger scenario', () => {
      const aiStartup = {
        name: 'AI Innovations',
        capabilities: ['Machine Learning', 'Data Science', 'Python'],
        size: 'small',
        experience: 3,
        fundingStage: 'Series A'
      };
      
      const webStartup = {
        name: 'Web Solutions',
        capabilities: ['React', 'Node.js', 'UI/UX'],
        size: 'small', 
        experience: 4,
        fundingStage: 'Seed'
      };

      const highSynergyAnalysis = {
        liftPercentage: 45, // Very high synergy
        synergyType: 'complementary',
        keyAreas: ['AI-Powered Web Applications']
      };

      const balancedContributions = {
        contributionPercentageA: 52,
        contributionPercentageB: 48,
        fairnessScore: 88
      };

      const strategy = generator.generatePartnershipStrategy(
        aiStartup, webStartup, highSynergyAnalysis, [], balancedContributions
      );

      assert.strictEqual(strategy.recommendedStructure, 'joint_venture');
      assert.ok(strategy.keySuccessFactors.includes('AI-web technology integration'));
      assert.ok(strategy.governance.model === 'collaborative');
      assert.ok(strategy.timeline.totalWeeks > 20); // Complex integration
    });

    test('should generate strategy for enterprise consulting partnership', () => {
      const bigFour = {
        name: 'Global Consulting',
        size: 'enterprise',
        capabilities: ['Strategy', 'Change Management', 'Enterprise Architecture'],
        experience: 25,
        globalPresence: true
      };
      
      const techBoutique = {
        name: 'DevOps Specialists',
        size: 'small',
        capabilities: ['Kubernetes', 'CI/CD', 'Cloud Native'],
        experience: 6,
        specialization: 'deep_technical'
      };

      const moderateSynergyAnalysis = {
        liftPercentage: 22,
        synergyType: 'complementary'
      };

      const unequalContributions = {
        contributionPercentageA: 70,
        contributionPercentageB: 30,
        fairnessScore: 72
      };

      const strategy = generator.generatePartnershipStrategy(
        bigFour, techBoutique, moderateSynergyAnalysis, [], unequalContributions
      );

      assert.strictEqual(strategy.recommendedStructure, 'prime_subcontractor');
      assert.strictEqual(strategy.governance.primeContractor, 'companyA');
      assert.ok(strategy.financial.revenueSharing.companyA === 70);
      assert.ok(strategy.riskMitigations.includes('Brand reputation protection'));
    });
  });
});