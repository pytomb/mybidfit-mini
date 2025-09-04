const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { PartnerLiftCore } = require('../../src/services/partnerLift/PartnerLiftCore');

describe('PartnerLift Integration Tests', () => {
  let partnerLiftCore;
  
  beforeEach(() => {
    partnerLiftCore = new PartnerLiftCore();
  });

  describe('End-to-End Partner Analysis Workflow', () => {
    test('should complete full partner analysis from company data to strategic recommendations', async () => {
      // Real-world scenario: Frontend specialist + Backend specialist partnership
      const frontendCompany = {
        id: 'frontend_specialist',
        name: 'UX Design Studio',
        capabilities: [
          { name: 'React Development', strength: 9, category: 'frontend' },
          { name: 'UI/UX Design', strength: 9.5, category: 'design' },
          { name: 'TypeScript', strength: 8, category: 'frontend' },
          { name: 'Backend Development', strength: 4, category: 'backend' },
          { name: 'DevOps', strength: 3, category: 'infrastructure' }
        ],
        experience: 6,
        teamSize: 12,
        recentProjects: [
          { type: 'e-commerce', success: true, duration: 4 },
          { type: 'saas-dashboard', success: true, duration: 3 }
        ]
      };

      const backendCompany = {
        id: 'backend_specialist',
        name: 'Cloud Infrastructure Inc',
        capabilities: [
          { name: 'React Development', strength: 5, category: 'frontend' },
          { name: 'UI/UX Design', strength: 4, category: 'design' },
          { name: 'TypeScript', strength: 7, category: 'frontend' },
          { name: 'Backend Development', strength: 9.5, category: 'backend' },
          { name: 'DevOps', strength: 9, category: 'infrastructure' }
        ],
        experience: 8,
        teamSize: 18,
        recentProjects: [
          { type: 'microservices', success: true, duration: 6 },
          { type: 'cloud-migration', success: true, duration: 5 }
        ]
      };

      const opportunityRequirements = [
        { requirement: 'React Development', weight: 0.25, minScore: 8 },
        { requirement: 'UI/UX Design', weight: 0.2, minScore: 7 },
        { requirement: 'Backend Development', weight: 0.3, minScore: 8 },
        { requirement: 'DevOps', weight: 0.25, minScore: 7 }
      ];

      // Execute complete partnership analysis
      const partnershipAnalysis = await partnerLiftCore.analyzePartnership(
        frontendCompany, 
        backendCompany, 
        opportunityRequirements
      );

      // Verify end-to-end workflow completion
      assert.ok(partnershipAnalysis.entityCombination);
      assert.ok(partnershipAnalysis.liftCalculation);
      assert.ok(partnershipAnalysis.contributionAnalysis);
      assert.ok(partnershipAnalysis.strategyRecommendations);

      // Verify integration between modules
      // EntityCombinator output should feed into LiftCalculator
      assert.strictEqual(
        partnershipAnalysis.entityCombination.combinedEntity.id,
        'frontend_specialist+backend_specialist'
      );

      // LiftCalculator should use combined entity for lift metrics
      assert.ok(partnershipAnalysis.liftCalculation.liftAmount > 0); // Should show positive lift
      assert.ok(partnershipAnalysis.liftCalculation.liftPercentage > 15); // Strong complementary lift

      // ContributionAnalyzer should use both scores for Shapley values
      const shapleyResult = partnershipAnalysis.contributionAnalysis.shapleyValues;
      assert.ok(shapleyResult.contributionA > 0);
      assert.ok(shapleyResult.contributionB > 0);
      assert.ok(shapleyResult.synergy > 0); // Complementary partnership should have synergy

      // StrategyGenerator should use all previous analysis for recommendations
      const strategies = partnershipAnalysis.strategyRecommendations;
      assert.ok(strategies.recommendedStructure);
      assert.ok(strategies.riskMitigations.length > 0);
      assert.ok(strategies.successFactors.length > 0);
    });

    test('should handle real-world complex enterprise partnership scenario', async () => {
      // Enterprise consulting firm + Boutique AI specialist
      const consultingFirm = {
        id: 'enterprise_consulting',
        name: 'Global Business Solutions',
        capabilities: [
          { name: 'Business Strategy', strength: 9, category: 'consulting' },
          { name: 'Project Management', strength: 9.5, category: 'management' },
          { name: 'AI Integration', strength: 5, category: 'technology' },
          { name: 'Change Management', strength: 8.5, category: 'consulting' }
        ],
        experience: 15,
        teamSize: 150,
        clientTypes: ['Fortune 500', 'Government'],
        revenue: '$50M'
      };

      const aiSpecialist = {
        id: 'ai_boutique',
        name: 'AI Innovation Lab',
        capabilities: [
          { name: 'Business Strategy', strength: 6, category: 'consulting' },
          { name: 'Project Management', strength: 7, category: 'management' },
          { name: 'AI Integration', strength: 9.5, category: 'technology' },
          { name: 'Machine Learning', strength: 9, category: 'technology' }
        ],
        experience: 4,
        teamSize: 8,
        clientTypes: ['Startups', 'Mid-market'],
        revenue: '$2M'
      };

      const enterpriseOpportunity = [
        { requirement: 'Business Strategy', weight: 0.3, minScore: 8 },
        { requirement: 'AI Integration', weight: 0.4, minScore: 8 },
        { requirement: 'Project Management', weight: 0.2, minScore: 7 },
        { requirement: 'Change Management', weight: 0.1, minScore: 6 }
      ];

      const analysis = await partnerLiftCore.analyzePartnership(
        consultingFirm,
        aiSpecialist,
        enterpriseOpportunity
      );

      // Verify enterprise-scale analysis
      assert.ok(analysis.scalabilityAssessment);
      assert.ok(analysis.riskAssessment.scalabilityRisk);
      
      // Should identify brand + expertise synergy
      assert.ok(analysis.liftCalculation.synergyType === 'complementary');
      assert.ok(analysis.contributionAnalysis.fairnessAnalysis.imbalanceLevel); // Size difference

      // Strategy should address scale differences
      const strategies = analysis.strategyRecommendations;
      assert.ok(strategies.equityRecommendations);
      assert.ok(strategies.riskMitigations.some(risk => 
        risk.includes('scale_mismatch') || risk.includes('cultural_alignment')
      ));
    });
  });

  describe('Module Integration Validation', () => {
    test('should ensure data flow consistency between all modules', async () => {
      const companyA = {
        id: 'test_a',
        name: 'Company A',
        capabilities: [
          { name: 'Skill 1', strength: 8, category: 'tech' },
          { name: 'Skill 2', strength: 6, category: 'business' }
        ]
      };

      const companyB = {
        id: 'test_b', 
        name: 'Company B',
        capabilities: [
          { name: 'Skill 1', strength: 7, category: 'tech' },
          { name: 'Skill 3', strength: 9, category: 'tech' }
        ]
      };

      const requirements = [
        { requirement: 'Skill 1', weight: 0.5, minScore: 7 },
        { requirement: 'Skill 2', weight: 0.3, minScore: 6 },
        { requirement: 'Skill 3', weight: 0.2, minScore: 7 }
      ];

      const analysis = await partnerLiftCore.analyzePartnership(companyA, companyB, requirements);

      // Verify data consistency across modules
      const entityData = analysis.entityCombination;
      const liftData = analysis.liftCalculation;
      const contributionData = analysis.contributionAnalysis;

      // EntityCombinator data should match input companies
      assert.strictEqual(entityData.companyA.id, companyA.id);
      assert.strictEqual(entityData.companyB.id, companyB.id);

      // LiftCalculator should use EntityCombinator's scoring results
      assert.ok(liftData.scoreA);
      assert.ok(liftData.scoreB);
      assert.ok(liftData.combinedScore);

      // ContributionAnalyzer should use same scores as LiftCalculator
      assert.strictEqual(contributionData.inputScores.scoreA.totalScore, liftData.scoreA.totalScore);
      assert.strictEqual(contributionData.inputScores.scoreB.totalScore, liftData.scoreB.totalScore);
      assert.strictEqual(contributionData.inputScores.combinedScore.totalScore, liftData.combinedScore.totalScore);

      // All modules should reference same opportunity requirements
      assert.deepStrictEqual(entityData.opportunityRequirements, requirements);
      assert.deepStrictEqual(liftData.opportunityRequirements, requirements);
    });

    test('should handle error propagation and recovery across modules', async () => {
      // Test with invalid data that should trigger graceful degradation
      const invalidCompanyA = {
        id: null, // Invalid ID should be handled gracefully
        name: 'Invalid Company',
        capabilities: [] // Empty capabilities
      };

      const validCompanyB = {
        id: 'valid_company',
        name: 'Valid Company', 
        capabilities: [
          { name: 'Valid Skill', strength: 8, category: 'tech' }
        ]
      };

      const requirements = [
        { requirement: 'Valid Skill', weight: 1.0, minScore: 7 }
      ];

      try {
        const analysis = await partnerLiftCore.analyzePartnership(
          invalidCompanyA,
          validCompanyB,
          requirements
        );

        // Should handle errors gracefully and provide partial results
        assert.ok(analysis.errors);
        assert.ok(analysis.partialResults);
        assert.strictEqual(analysis.status, 'partial_success');
        
        // Valid modules should still provide results where possible
        if (analysis.partialResults.liftCalculation) {
          assert.ok(analysis.partialResults.liftCalculation.fallbackUsed);
        }

      } catch (error) {
        // Should provide meaningful error information
        assert.ok(error.message.includes('invalid') || error.message.includes('missing'));
        assert.ok(error.moduleStack); // Should indicate which module failed
      }
    });
  });

  describe('Performance Integration Tests', () => {
    test('should complete complex partnership analysis within performance thresholds', async () => {
      // Large-scale partnership with extensive data
      const largeCompanyA = {
        id: 'large_corp_a',
        name: 'Large Corporation A',
        capabilities: Array.from({ length: 50 }, (_, i) => ({
          name: `Capability ${i + 1}`,
          strength: Math.random() * 10,
          category: ['tech', 'business', 'management'][i % 3]
        }))
      };

      const largeCompanyB = {
        id: 'large_corp_b', 
        name: 'Large Corporation B',
        capabilities: Array.from({ length: 45 }, (_, i) => ({
          name: `Capability ${i + 1}`,
          strength: Math.random() * 10,
          category: ['tech', 'business', 'management'][i % 3]
        }))
      };

      const complexRequirements = Array.from({ length: 30 }, (_, i) => ({
        requirement: `Capability ${i + 1}`,
        weight: 1 / 30,
        minScore: 5 + Math.random() * 3
      }));

      const startTime = Date.now();
      
      const analysis = await partnerLiftCore.analyzePartnership(
        largeCompanyA,
        largeCompanyB,
        complexRequirements
      );
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Performance assertions
      assert.ok(processingTime < 5000); // Should complete within 5 seconds
      assert.ok(analysis.performance.totalDuration < processingTime + 100);
      
      // Verify all modules completed despite complexity
      assert.ok(analysis.entityCombination);
      assert.ok(analysis.liftCalculation);
      assert.ok(analysis.contributionAnalysis);
      assert.ok(analysis.strategyRecommendations);

      // Performance metadata should be included
      assert.ok(analysis.performance.modulePerformance.entityCombination);
      assert.ok(analysis.performance.modulePerformance.liftCalculation);
      assert.ok(analysis.performance.modulePerformance.contributionAnalysis);
      assert.ok(analysis.performance.modulePerformance.strategyGenerator);
    });
  });

  describe('Business Logic Integration', () => {
    test('should produce coherent business recommendations across all modules', async () => {
      // Healthcare consulting + Healthcare IT partnership
      const healthcareConsulting = {
        id: 'healthcare_consulting',
        name: 'HealthCare Advisory Group',
        capabilities: [
          { name: 'Healthcare Compliance', strength: 9.5, category: 'compliance' },
          { name: 'Process Improvement', strength: 8.5, category: 'consulting' },
          { name: 'Healthcare IT', strength: 4, category: 'technology' },
          { name: 'Data Analytics', strength: 5, category: 'analytics' }
        ],
        certifications: ['HIPAA', 'Healthcare Quality'],
        clientTypes: ['Hospitals', 'Healthcare Systems']
      };

      const healthcareIT = {
        id: 'healthcare_it',
        name: 'MedTech Solutions',
        capabilities: [
          { name: 'Healthcare Compliance', strength: 7, category: 'compliance' },
          { name: 'Process Improvement', strength: 6, category: 'consulting' },
          { name: 'Healthcare IT', strength: 9.5, category: 'technology' },
          { name: 'Data Analytics', strength: 9, category: 'analytics' }
        ],
        certifications: ['HL7', 'FHIR', 'FDA Compliance'],
        clientTypes: ['Healthcare Providers', 'Medical Devices']
      };

      const healthcareOpportunity = [
        { requirement: 'Healthcare Compliance', weight: 0.3, minScore: 8 },
        { requirement: 'Healthcare IT', weight: 0.4, minScore: 8 },
        { requirement: 'Data Analytics', weight: 0.2, minScore: 7 },
        { requirement: 'Process Improvement', weight: 0.1, minScore: 6 }
      ];

      const analysis = await partnerLiftCore.analyzePartnership(
        healthcareConsulting,
        healthcareIT,
        healthcareOpportunity
      );

      // Business logic coherence checks
      const entityAnalysis = analysis.entityCombination;
      const contributionAnalysis = analysis.contributionAnalysis;
      const strategies = analysis.strategyRecommendations;

      // Should recognize healthcare domain synergy
      assert.ok(entityAnalysis.domainSynergy.includes('healthcare'));
      assert.ok(analysis.liftCalculation.synergyType === 'complementary');

      // Contribution analysis should reflect domain expertise balance
      const shapley = contributionAnalysis.shapleyValues;
      assert.ok(shapley.contributionPercentageA >= 40 && shapley.contributionPercentageA <= 60);
      assert.ok(shapley.contributionPercentageB >= 40 && shapley.contributionPercentageB <= 60);

      // Strategy should be healthcare-specific
      assert.ok(strategies.industryConsiderations.includes('healthcare_regulations'));
      assert.ok(strategies.complianceRequirements.includes('HIPAA'));
      assert.ok(strategies.successFactors.some(factor => 
        factor.includes('compliance') || factor.includes('regulatory')
      ));

      // All recommendations should be mutually reinforcing
      assert.ok(strategies.partnershipStructure.governance.includes('compliance_oversight'));
      assert.ok(strategies.riskMitigations.some(risk => 
        risk.includes('regulatory_risk')
      ));
    });
  });
});