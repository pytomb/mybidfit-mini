const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { AIAnalysisEngine } = require('../../../src/services/supplierAnalysis/AIAnalysisEngine');

describe('AIAnalysisEngine - Supplier Analysis Module', () => {
  let engine;
  
  beforeEach(() => {
    engine = new AIAnalysisEngine();
  });

  describe('coordinateAnalysis()', () => {
    test('should coordinate comprehensive supplier analysis workflow', async () => {
      const supplierData = {
        id: 'supplier_123',
        name: 'TechCorp Solutions',
        website: 'https://techcorp.com',
        description: 'Enterprise software development company',
        employees: 150,
        location: 'Toronto, ON',
        services: ['Web Development', 'Cloud Migration', 'AI Integration']
      };

      const analysisResult = await engine.coordinateAnalysis(supplierData);

      // Verify comprehensive analysis structure
      assert.ok(analysisResult.capabilities);
      assert.ok(analysisResult.credibility);
      assert.ok(analysisResult.marketPosition);
      assert.ok(analysisResult.riskAssessment);
      assert.ok(analysisResult.recommendations);
      
      // Verify analysis completeness
      assert.strictEqual(analysisResult.supplierId, 'supplier_123');
      assert.strictEqual(analysisResult.analysisDate instanceof Date, true);
      assert.ok(analysisResult.completionScore >= 0 && analysisResult.completionScore <= 100);
    });

    test('should handle suppliers with minimal data gracefully', async () => {
      const minimalSupplier = {
        id: 'supplier_minimal',
        name: 'Basic Supplier'
      };

      const analysisResult = await engine.coordinateAnalysis(minimalSupplier);

      // Should still provide structure with defaults
      assert.ok(analysisResult.capabilities);
      assert.ok(analysisResult.credibility);
      assert.strictEqual(analysisResult.dataQuality, 'limited');
      assert.ok(analysisResult.recommendations.includes('insufficient_data'));
    });

    test('should prioritize analysis components based on available data', async () => {
      const supplierWithWebsite = {
        id: 'supplier_web',
        name: 'Web Supplier',
        website: 'https://example.com',
        caseStudies: ['case1.pdf', 'case2.pdf']
      };

      const analysisResult = await engine.coordinateAnalysis(supplierWithWebsite);

      // Should prioritize website and case study analysis
      assert.ok(analysisResult.analysisSteps.includes('website_analysis'));
      assert.ok(analysisResult.analysisSteps.includes('case_study_analysis'));
      assert.strictEqual(analysisResult.primaryDataSources.length >= 2, true);
    });
  });

  describe('enhanceWithAI()', () => {
    test('should enhance basic analysis with AI insights', async () => {
      const basicAnalysis = {
        capabilities: ['Software Development', 'Testing'],
        experience: '5 years',
        technologies: ['React', 'Node.js']
      };

      const enhancedAnalysis = await engine.enhanceWithAI(basicAnalysis);

      // AI enhancement should add insights
      assert.ok(enhancedAnalysis.aiInsights);
      assert.ok(enhancedAnalysis.strengthAssessment);
      assert.ok(enhancedAnalysis.marketFit);
      assert.ok(enhancedAnalysis.competitivePosition);
      
      // Should maintain original data
      assert.deepStrictEqual(enhancedAnalysis.originalCapabilities, basicAnalysis.capabilities);
    });

    test('should identify capability gaps and improvement opportunities', async () => {
      const analysisWithGaps = {
        capabilities: ['Frontend Development'],
        targetMarket: 'Full-stack development',
        clientFeedback: ['Great frontend work', 'Need backend support']
      };

      const enhanced = await engine.enhanceWithAI(analysisWithGaps);

      // Should identify gaps
      assert.ok(enhanced.capabilityGaps.length > 0);
      assert.ok(enhanced.capabilityGaps.includes('backend_development'));
      assert.ok(enhanced.improvementRecommendations);
      assert.ok(enhanced.partnershipOpportunities);
    });

    test('should generate confidence scores for AI insights', async () => {
      const analysis = {
        capabilities: ['Data Science', 'Machine Learning'],
        certifications: ['AWS Solutions Architect', 'Google Cloud ML'],
        experience: '8 years'
      };

      const enhanced = await engine.enhanceWithAI(analysis);

      // All AI insights should have confidence scores
      assert.ok(enhanced.aiInsights.confidence >= 0 && enhanced.aiInsights.confidence <= 1);
      assert.ok(enhanced.strengthAssessment.confidence >= 0);
      assert.ok(enhanced.marketFit.confidence >= 0);
      
      // High-quality data should yield high confidence
      assert.ok(enhanced.aiInsights.confidence > 0.7); // Strong data should be highly confident
    });
  });

  describe('generateInsights()', () => {
    test('should generate strategic business insights from analysis data', () => {
      const analysisData = {
        capabilities: {
          core: ['Web Development', 'Cloud Architecture'],
          emerging: ['AI Integration', 'Blockchain'],
          strength: 8.5
        },
        credibility: {
          score: 8.2,
          factors: ['strong_portfolio', 'positive_reviews', 'established_client_base']
        },
        marketPosition: {
          competitiveRank: 3,
          marketShare: 'regional_leader',
          differentiators: ['enterprise_focus', 'technical_depth']
        }
      };

      const insights = engine.generateInsights(analysisData);

      // Strategic insights structure
      assert.ok(insights.competitiveAdvantages);
      assert.ok(insights.marketOpportunities);
      assert.ok(insights.riskFactors);
      assert.ok(insights.partnershipPotential);
      assert.ok(insights.scalabilityAssessment);

      // Verify insight quality
      assert.ok(insights.competitiveAdvantages.length > 0);
      assert.ok(insights.insightConfidence >= 0.5);
      assert.strictEqual(typeof insights.strategicScore, 'number');
    });

    test('should identify partnership synergy opportunities', () => {
      const partnershipAnalysis = {
        capabilities: {
          core: ['Frontend Development', 'UX Design'],
          gaps: ['Backend Development', 'DevOps']
        },
        marketPosition: {
          strengths: ['design_excellence', 'client_relationships'],
          weaknesses: ['technical_infrastructure', 'scalability']
        }
      };

      const insights = engine.generateInsights(partnershipAnalysis);

      // Partnership-specific insights
      assert.ok(insights.partnershipPotential.complementaryCapabilities);
      assert.ok(insights.partnershipPotential.synergyScore >= 0);
      assert.ok(insights.partnershipPotential.recommendedPartnerTypes);
      
      // Should suggest backend-focused partners
      assert.ok(insights.partnershipPotential.recommendedPartnerTypes.some(type => 
        type.includes('backend') || type.includes('infrastructure')
      ));
    });

    test('should assess scalability and growth potential', () => {
      const growthAnalysis = {
        team: {
          size: 25,
          growthRate: 40, // 40% year-over-year
          expertise: 'high'
        },
        financial: {
          revenue: '$2.5M',
          growthTrend: 'accelerating',
          profitability: 'positive'
        },
        capabilities: {
          automation: 0.6,
          processMaturity: 'developing'
        }
      };

      const insights = engine.generateInsights(growthAnalysis);

      // Growth and scalability insights
      assert.ok(insights.scalabilityAssessment.currentCapacity);
      assert.ok(insights.scalabilityAssessment.growthPotential >= 0);
      assert.ok(insights.scalabilityAssessment.bottlenecks);
      assert.ok(insights.scalabilityAssessment.recommendations);
      
      // Should identify process maturity as a factor
      assert.ok(insights.scalabilityAssessment.bottlenecks.includes('process_maturity'));
    });
  });

  describe('calculateAnalysisQuality()', () => {
    test('should calculate comprehensive analysis quality score', () => {
      const highQualityAnalysis = {
        dataCompleteness: 0.9,
        sourceReliability: 0.85,
        analysisDepth: 0.8,
        verificationLevel: 0.75,
        confidenceMetrics: {
          capabilities: 0.88,
          credibility: 0.82,
          marketPosition: 0.79
        }
      };

      const qualityScore = engine.calculateAnalysisQuality(highQualityAnalysis);

      // Quality score should be high for complete analysis
      assert.ok(qualityScore.overall >= 0.8);
      assert.ok(qualityScore.breakdown.dataQuality >= 0.85);
      assert.ok(qualityScore.breakdown.analysisRigor >= 0.75);
      assert.strictEqual(qualityScore.grade, 'A');
    });

    test('should penalize low-quality or incomplete analysis', () => {
      const lowQualityAnalysis = {
        dataCompleteness: 0.3,
        sourceReliability: 0.4,
        analysisDepth: 0.2,
        verificationLevel: 0.1,
        confidenceMetrics: {
          capabilities: 0.3,
          credibility: 0.2,
          marketPosition: 0.1
        }
      };

      const qualityScore = engine.calculateAnalysisQuality(lowQualityAnalysis);

      // Quality score should reflect poor analysis
      assert.ok(qualityScore.overall <= 0.4);
      assert.strictEqual(qualityScore.grade, 'D' || qualityScore.grade === 'F');
      assert.ok(qualityScore.improvementAreas.length > 0);
      assert.ok(qualityScore.improvementAreas.includes('data_collection'));
    });

    test('should identify specific quality improvement opportunities', () => {
      const moderateQualityAnalysis = {
        dataCompleteness: 0.7,
        sourceReliability: 0.6,
        analysisDepth: 0.5,
        verificationLevel: 0.4,
        confidenceMetrics: {
          capabilities: 0.65,
          credibility: 0.5,
          marketPosition: 0.4
        }
      };

      const qualityScore = engine.calculateAnalysisQuality(moderateQualityAnalysis);

      // Should identify specific improvement areas
      assert.ok(qualityScore.improvementAreas.includes('verification'));
      assert.ok(qualityScore.improvementAreas.includes('analysis_depth'));
      assert.ok(qualityScore.recommendations.length > 0);
      assert.strictEqual(qualityScore.grade, 'B' || qualityScore.grade === 'C');
    });
  });

  describe('optimizeAnalysisWorkflow()', () => {
    test('should optimize analysis workflow based on data availability', () => {
      const dataAvailability = {
        website: true,
        caseStudies: false,
        certifications: true,
        clientReferences: true,
        financialData: false,
        socialPresence: true
      };

      const optimizedWorkflow = engine.optimizeAnalysisWorkflow(dataAvailability);

      // Should prioritize available data sources
      assert.ok(optimizedWorkflow.prioritySteps.includes('website_analysis'));
      assert.ok(optimizedWorkflow.prioritySteps.includes('certification_verification'));
      assert.ok(optimizedWorkflow.prioritySteps.includes('reference_validation'));
      
      // Should not prioritize unavailable data
      assert.ok(!optimizedWorkflow.prioritySteps.includes('case_study_analysis'));
      assert.ok(!optimizedWorkflow.prioritySteps.includes('financial_analysis'));

      // Should suggest data collection strategies
      assert.ok(optimizedWorkflow.dataCollectionSuggestions.length > 0);
    });

    test('should estimate analysis time and effort requirements', () => {
      const complexAnalysis = {
        dataVolume: 'high',
        verificationRequired: true,
        aiEnhancementLevel: 'comprehensive',
        customRequirements: ['industry_specific', 'compliance_focused']
      };

      const workflow = engine.optimizeAnalysisWorkflow(complexAnalysis);

      // Should provide time and effort estimates
      assert.ok(workflow.estimatedDuration);
      assert.ok(workflow.effortLevel);
      assert.ok(workflow.resourceRequirements);
      assert.ok(workflow.bottleneckRisks);
      
      // Complex analysis should require more resources
      assert.ok(workflow.estimatedDuration > 60); // minutes
      assert.strictEqual(workflow.effortLevel, 'high' || workflow.effortLevel === 'very_high');
    });

    test('should suggest parallel processing opportunities', () => {
      const parallelizableAnalysis = {
        website: true,
        caseStudies: true,
        certifications: true,
        references: true,
        socialPresence: true
      };

      const workflow = engine.optimizeAnalysisWorkflow(parallelizableAnalysis);

      // Should identify parallel processing opportunities
      assert.ok(workflow.parallelSteps);
      assert.ok(workflow.parallelSteps.length >= 2);
      assert.ok(workflow.sequentialDependencies);
      assert.ok(workflow.optimizationPotential > 0);
      
      // Should suggest efficiency improvements
      assert.ok(workflow.efficiencyGains);
      assert.ok(workflow.recommendedApproach === 'parallel' || workflow.recommendedApproach === 'hybrid');
    });
  });

  describe('Integration and Error Handling', () => {
    test('should handle analysis engine failures gracefully', async () => {
      const faultySupplier = {
        id: 'supplier_fault',
        name: null, // Will cause processing issues
        website: 'invalid-url'
      };

      const analysisResult = await engine.coordinateAnalysis(faultySupplier);

      // Should still provide partial analysis
      assert.ok(analysisResult);
      assert.ok(analysisResult.errors);
      assert.ok(analysisResult.partialResults);
      assert.strictEqual(analysisResult.status, 'partial_success');
      assert.ok(analysisResult.recommendations.includes('data_validation_needed'));
    });

    test('should validate input data before analysis', () => {
      const invalidInputs = [
        null,
        undefined,
        {},
        { name: '' },
        { id: null }
      ];

      invalidInputs.forEach(input => {
        const validation = engine.validateAnalysisInput(input);
        assert.strictEqual(validation.isValid, false);
        assert.ok(validation.errors.length > 0);
      });

      // Valid input should pass
      const validInput = {
        id: 'valid_supplier',
        name: 'Valid Supplier Co.'
      };
      
      const validation = engine.validateAnalysisInput(validInput);
      assert.strictEqual(validation.isValid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    test('should track analysis performance metrics', async () => {
      const supplier = {
        id: 'performance_test',
        name: 'Performance Test Supplier',
        website: 'https://example.com'
      };

      const startTime = Date.now();
      const analysisResult = await engine.coordinateAnalysis(supplier);
      const endTime = Date.now();

      // Should include performance metrics
      assert.ok(analysisResult.performance);
      assert.ok(analysisResult.performance.totalDuration);
      assert.ok(analysisResult.performance.stepDurations);
      assert.ok(analysisResult.performance.memoryUsage);
      assert.ok(analysisResult.performance.efficiency >= 0);

      // Performance should be reasonable
      assert.ok(analysisResult.performance.totalDuration < (endTime - startTime + 1000)); // Allow for overhead
    });
  });

  describe('Real-World Analysis Scenarios', () => {
    test('should analyze enterprise software development supplier', async () => {
      const enterpriseSupplier = {
        id: 'enterprise_dev',
        name: 'Enterprise Solutions Corp',
        website: 'https://enterprise-solutions.com',
        employees: 500,
        services: ['Custom Software', 'Cloud Migration', 'Enterprise Architecture'],
        certifications: ['ISO 27001', 'SOC 2', 'AWS Advanced Partner'],
        clientTypes: ['Fortune 500', 'Government', 'Healthcare'],
        experience: '15 years'
      };

      const analysis = await engine.coordinateAnalysis(enterpriseSupplier);

      // Should recognize enterprise capabilities
      assert.ok(analysis.capabilities.enterpriseReadiness >= 8);
      assert.ok(analysis.credibility.score >= 7.5);
      assert.ok(analysis.marketPosition.segment.includes('enterprise'));
      assert.ok(analysis.riskAssessment.complianceRisk === 'low');
    });

    test('should analyze startup technology supplier with growth potential', async () => {
      const startupSupplier = {
        id: 'startup_tech',
        name: 'InnovateTech Startup',
        employees: 15,
        services: ['AI Development', 'Blockchain Solutions'],
        founded: '2021',
        funding: 'Series A',
        technologies: ['TensorFlow', 'Solidity', 'React', 'Node.js']
      };

      const analysis = await engine.coordinateAnalysis(startupSupplier);

      // Should identify startup characteristics
      assert.ok(analysis.riskAssessment.scalabilityRisk === 'medium' || analysis.riskAssessment.scalabilityRisk === 'high');
      assert.ok(analysis.capabilities.innovationScore >= 7);
      assert.ok(analysis.marketPosition.growthPotential >= 6);
      assert.ok(analysis.partnershipPotential.synergyOpportunities.includes('technology_innovation'));
    });

    test('should analyze traditional service provider with established reputation', async () => {
      const traditionalSupplier = {
        id: 'traditional_services',
        name: 'Established Services Ltd',
        employees: 200,
        founded: '1995',
        services: ['Business Consulting', 'Process Optimization', 'Training'],
        clientRetention: '85%',
        yearlyRevenue: '$25M',
        certifications: ['ISO 9001', 'PMI Partner']
      };

      const analysis = await engine.coordinateAnalysis(traditionalSupplier);

      // Should recognize established business strengths
      assert.ok(analysis.credibility.score >= 8);
      assert.ok(analysis.riskAssessment.businessContinuityRisk === 'low');
      assert.ok(analysis.capabilities.processMaturity >= 8);
      assert.ok(analysis.marketPosition.stability >= 7);
    });
  });
});