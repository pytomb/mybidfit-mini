const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { AIAnalysisEngine } = require('../../src/services/supplierAnalysis/AIAnalysisEngine');
const { CredibilityScorer } = require('../../src/services/supplierAnalysis/CredibilityScorer');
const { CapabilitiesExtractor } = require('../../src/services/supplierAnalysis/CapabilitiesExtractor');
const { DatabaseOperations } = require('../../src/services/supplierAnalysis/DatabaseOperations');

describe('SupplierAnalysis Integration Tests', () => {
  let analysisEngine, credibilityScorer, capabilitiesExtractor, databaseOps;
  let mockDatabase;

  beforeEach(() => {
    // Mock database for integration testing
    mockDatabase = {
      query: test.mock.fn(),
      transaction: test.mock.fn(),
      close: test.mock.fn()
    };

    analysisEngine = new AIAnalysisEngine();
    credibilityScorer = new CredibilityScorer();
    capabilitiesExtractor = new CapabilitiesExtractor();
    databaseOps = new DatabaseOperations(mockDatabase);
  });

  describe('End-to-End Supplier Analysis Workflow', () => {
    test('should complete comprehensive supplier analysis from raw data to stored insights', async () => {
      // Real-world scenario: Mid-size software development company
      const supplierData = {
        id: 'techcorp_solutions',
        name: 'TechCorp Solutions Ltd',
        website: 'https://techcorp-solutions.com',
        description: 'Full-stack development company specializing in e-commerce and SaaS platforms',
        employees: 85,
        founded: '2015',
        location: 'Toronto, ON, Canada',
        services: ['Web Development', 'Mobile Apps', 'Cloud Migration', 'DevOps'],
        technologies: ['React', 'Node.js', 'AWS', 'Docker', 'PostgreSQL'],
        certifications: ['AWS Solutions Architect', 'ISO 27001', 'Agile Certified'],
        caseStudies: [
          {
            title: 'E-commerce Platform Modernization',
            client: 'RetailCorp',
            description: 'Migrated legacy system to modern cloud architecture',
            technologies: ['React', 'Node.js', 'AWS', 'Microservices'],
            results: '300% performance improvement, 50% cost reduction',
            duration: '8 months',
            teamSize: 12
          },
          {
            title: 'SaaS Platform Development',
            client: 'StartupInc',
            description: 'Built multi-tenant SaaS platform from ground up',
            technologies: ['Vue.js', 'Python', 'GCP', 'Kubernetes'],
            results: 'Platform scaled to 10,000+ users, 99.9% uptime',
            duration: '12 months',
            teamSize: 15
          }
        ],
        clientReferences: [
          { company: 'RetailCorp', rating: 4.8, feedback: 'Exceptional technical expertise and project management' },
          { company: 'StartupInc', rating: 4.9, feedback: 'Delivered on time and exceeded expectations' },
          { company: 'HealthTech', rating: 4.7, feedback: 'Strong understanding of compliance requirements' }
        ]
      };

      // Phase 1: Extract capabilities from all available data sources
      const capabilitiesData = await capabilitiesExtractor.extractCapabilities(supplierData);
      
      // Phase 2: Calculate credibility score based on capabilities and references
      const credibilityData = await credibilityScorer.calculateCredibilityScore(supplierData, capabilitiesData);
      
      // Phase 3: Use AI engine to coordinate comprehensive analysis
      const comprehensiveAnalysis = await analysisEngine.coordinateAnalysis({
        ...supplierData,
        extractedCapabilities: capabilitiesData,
        credibilityAssessment: credibilityData
      });
      
      // Phase 4: Store results in database
      mockDatabase.query.mock.mockImplementation(() => ({ insertId: 12345, affectedRows: 1 }));
      const storageResult = await databaseOps.storeAnalysisResults(comprehensiveAnalysis);

      // Verify end-to-end integration
      assert.ok(capabilitiesData.technicalCapabilities.length > 0);
      assert.ok(credibilityData.score >= 7); // Should be high for quality supplier
      assert.ok(comprehensiveAnalysis.aiInsights);
      assert.ok(comprehensiveAnalysis.marketPosition);
      assert.strictEqual(storageResult.success, true);

      // Verify data flow consistency
      assert.ok(comprehensiveAnalysis.capabilities.includes('React'));
      assert.ok(comprehensiveAnalysis.capabilities.includes('Node.js'));
      assert.strictEqual(comprehensiveAnalysis.credibility.score, credibilityData.score);
      
      // Verify AI enhancement integration
      assert.ok(comprehensiveAnalysis.aiInsights.strengthAssessment);
      assert.ok(comprehensiveAnalysis.aiInsights.competitivePosition);
      assert.ok(comprehensiveAnalysis.partnershipPotential);
    });

    test('should handle supplier with limited data through graceful degradation', async () => {
      // Minimal supplier data scenario
      const limitedSupplier = {
        id: 'startup_dev',
        name: 'Startup Dev Co',
        description: 'Small development team',
        employees: 5,
        services: ['Web Development']
      };

      // Execute analysis with limited data
      const capabilities = await capabilitiesExtractor.extractCapabilities(limitedSupplier);
      const credibility = await credibilityScorer.calculateCredibilityScore(limitedSupplier, capabilities);
      const analysis = await analysisEngine.coordinateAnalysis({
        ...limitedSupplier,
        extractedCapabilities: capabilities,
        credibilityAssessment: credibility
      });

      // Should still provide structured analysis with appropriate confidence levels
      assert.ok(capabilities);
      assert.ok(credibility.score < 6); // Lower score due to limited data
      assert.ok(analysis.dataQuality === 'limited');
      assert.ok(analysis.recommendations.includes('insufficient_data'));
      assert.ok(analysis.aiInsights.confidence < 0.5); // Low confidence due to limited data
    });
  });

  describe('Cross-Module Data Integration', () => {
    test('should ensure consistent data transformation across all modules', async () => {
      const supplierData = {
        id: 'integration_test',
        name: 'Integration Test Company',
        technologies: ['Python', 'Django', 'PostgreSQL', 'React'],
        certifications: ['AWS Certified', 'Scrum Master'],
        caseStudies: [
          {
            title: 'Web Application',
            technologies: ['Python', 'Django', 'React'],
            results: 'Successful deployment'
          }
        ],
        clientReferences: [
          { rating: 4.5, feedback: 'Great work on Python development' }
        ]
      };

      // Execute through all modules
      const capabilities = await capabilitiesExtractor.extractCapabilities(supplierData);
      const credibility = await credibilityScorer.calculateCredibilityScore(supplierData, capabilities);
      const analysis = await analysisEngine.coordinateAnalysis({
        ...supplierData,
        extractedCapabilities: capabilities,
        credibilityAssessment: credibility
      });

      // Verify data consistency across modules
      // Technologies should be preserved through pipeline
      assert.ok(capabilities.technicalCapabilities.some(cap => cap.name === 'Python'));
      assert.ok(capabilities.technicalCapabilities.some(cap => cap.name === 'Django'));
      
      // Certifications should impact credibility scoring
      assert.ok(credibility.breakdown.certificationScore > 0);
      assert.ok(credibility.factors.includes('certifications'));

      // Case studies should be reflected in capabilities extraction
      assert.ok(capabilities.projectExperience.length > 0);
      assert.ok(capabilities.projectExperience[0].technologies.includes('Python'));

      // AI analysis should incorporate all previous module outputs
      assert.ok(analysis.capabilities.core.some(cap => cap.includes('Python')));
      assert.strictEqual(analysis.credibility.score, credibility.score);
      assert.ok(analysis.dataCompleteness > 0.5); // Moderate data completeness
    });

    test('should maintain referential integrity across database operations', async () => {
      const supplier1 = { id: 'supplier_1', name: 'Supplier One', capabilities: ['Development'] };
      const supplier2 = { id: 'supplier_2', name: 'Supplier Two', capabilities: ['Design'] };
      
      // Mock successful database operations
      mockDatabase.query.mock.mockImplementation((query, params) => {
        if (query.includes('INSERT')) {
          return { insertId: Math.floor(Math.random() * 1000), affectedRows: 1 };
        }
        if (query.includes('SELECT')) {
          return [
            { id: 1, supplier_id: 'supplier_1', analysis_date: '2024-01-01' },
            { id: 2, supplier_id: 'supplier_2', analysis_date: '2024-01-02' }
          ];
        }
        return { affectedRows: 1 };
      });

      // Store multiple analyses
      const analysis1 = await analysisEngine.coordinateAnalysis(supplier1);
      const analysis2 = await analysisEngine.coordinateAnalysis(supplier2);
      
      const storage1 = await databaseOps.storeAnalysisResults(analysis1);
      const storage2 = await databaseOps.storeAnalysisResults(analysis2);

      // Verify referential integrity
      assert.strictEqual(storage1.success, true);
      assert.strictEqual(storage2.success, true);
      assert.notStrictEqual(storage1.analysisId, storage2.analysisId);

      // Verify retrieval maintains relationships
      const history1 = await databaseOps.retrieveSupplierHistory('supplier_1');
      const history2 = await databaseOps.retrieveSupplierHistory('supplier_2');

      assert.ok(history1.some(record => record.supplier_id === 'supplier_1'));
      assert.ok(history2.some(record => record.supplier_id === 'supplier_2'));
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    test('should handle module failures gracefully with partial results', async () => {
      const problematicSupplier = {
        id: 'problematic_supplier',
        name: 'Problematic Co',
        website: 'invalid-url-format',
        technologies: null, // Will cause extraction issues
        certifications: undefined
      };

      // Capabilities extraction should handle null/undefined gracefully
      const capabilities = await capabilitiesExtractor.extractCapabilities(problematicSupplier);
      assert.ok(capabilities);
      assert.ok(capabilities.extractionErrors.length > 0);
      assert.ok(capabilities.fallbackUsed);

      // Credibility scoring should work with partial capabilities data
      const credibility = await credibilityScorer.calculateCredibilityScore(problematicSupplier, capabilities);
      assert.ok(credibility.score >= 0);
      assert.ok(credibility.warnings.includes('incomplete_data'));

      // AI analysis should aggregate errors and provide recommendations
      const analysis = await analysisEngine.coordinateAnalysis({
        ...problematicSupplier,
        extractedCapabilities: capabilities,
        credibilityAssessment: credibility
      });

      assert.strictEqual(analysis.status, 'partial_success');
      assert.ok(analysis.errors.length > 0);
      assert.ok(analysis.recommendations.includes('data_validation_needed'));
      assert.ok(analysis.partialResults);
    });

    test('should implement retry logic and circuit breakers for database operations', async () => {
      const supplierData = {
        id: 'retry_test',
        name: 'Retry Test Supplier',
        capabilities: ['Testing']
      };

      // Simulate database failures followed by success
      let callCount = 0;
      mockDatabase.query.mock.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Connection timeout');
        }
        return { insertId: 999, affectedRows: 1 };
      });

      const analysis = await analysisEngine.coordinateAnalysis(supplierData);
      const storageResult = await databaseOps.storeAnalysisResults(analysis);

      // Should eventually succeed with retry logic
      assert.strictEqual(storageResult.success, true);
      assert.strictEqual(storageResult.analysisId, 999);
      assert.ok(storageResult.retriesRequired >= 2);
      assert.strictEqual(callCount, 3); // Should have retried twice
    });
  });

  describe('Performance and Scalability Integration', () => {
    test('should maintain performance with complex supplier analysis', async () => {
      // Large supplier with extensive data
      const complexSupplier = {
        id: 'complex_enterprise',
        name: 'Complex Enterprise Solutions',
        technologies: Array.from({ length: 50 }, (_, i) => `Technology_${i + 1}`),
        certifications: Array.from({ length: 20 }, (_, i) => `Certification_${i + 1}`),
        caseStudies: Array.from({ length: 15 }, (_, i) => ({
          title: `Project ${i + 1}`,
          technologies: [`Tech_${i + 1}`, `Tech_${i + 2}`],
          results: `Result ${i + 1}`,
          duration: `${i + 6} months`
        })),
        clientReferences: Array.from({ length: 25 }, (_, i) => ({
          company: `Client_${i + 1}`,
          rating: 4 + Math.random(),
          feedback: `Feedback ${i + 1}`
        }))
      };

      const startTime = Date.now();

      // Execute full analysis pipeline
      const capabilities = await capabilitiesExtractor.extractCapabilities(complexSupplier);
      const credibility = await credibilityScorer.calculateCredibilityScore(complexSupplier, capabilities);
      const analysis = await analysisEngine.coordinateAnalysis({
        ...complexSupplier,
        extractedCapabilities: capabilities,
        credibilityAssessment: credibility
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance assertions
      assert.ok(totalTime < 10000); // Should complete within 10 seconds
      assert.ok(capabilities.technicalCapabilities.length > 0);
      assert.ok(credibility.score > 0);
      assert.ok(analysis.completionScore > 0);

      // Verify all data was processed
      assert.strictEqual(capabilities.projectExperience.length, 15);
      assert.ok(credibility.breakdown.referenceScore > 0);
      assert.ok(analysis.dataCompleteness > 0.8); // High completeness for comprehensive data
    });

    test('should handle concurrent analysis requests efficiently', async () => {
      const suppliers = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent_supplier_${i + 1}`,
        name: `Concurrent Supplier ${i + 1}`,
        technologies: ['React', 'Node.js'],
        services: ['Web Development']
      }));

      // Mock database to handle concurrent requests
      mockDatabase.query.mock.mockImplementation(() => ({ 
        insertId: Math.floor(Math.random() * 1000), 
        affectedRows: 1 
      }));

      const startTime = Date.now();

      // Execute concurrent analyses
      const analyses = await Promise.all(
        suppliers.map(async supplier => {
          const capabilities = await capabilitiesExtractor.extractCapabilities(supplier);
          const credibility = await credibilityScorer.calculateCredibilityScore(supplier, capabilities);
          const analysis = await analysisEngine.coordinateAnalysis({
            ...supplier,
            extractedCapabilities: capabilities,
            credibilityAssessment: credibility
          });
          return await databaseOps.storeAnalysisResults(analysis);
        })
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify concurrent execution completed successfully
      assert.strictEqual(analyses.length, 5);
      analyses.forEach(result => {
        assert.strictEqual(result.success, true);
        assert.ok(result.analysisId > 0);
      });

      // Should be faster than sequential execution (rough estimation)
      assert.ok(totalTime < 15000); // Should complete within 15 seconds for concurrent processing
    });
  });

  describe('Business Intelligence Integration', () => {
    test('should produce actionable business insights across all analysis modules', async () => {
      // Healthcare IT supplier scenario
      const healthcareSupplier = {
        id: 'healthcare_it_specialist',
        name: 'MedTech IT Solutions',
        description: 'Healthcare IT specialist with HIPAA compliance expertise',
        employees: 45,
        services: ['EHR Integration', 'Healthcare Analytics', 'Compliance Consulting'],
        technologies: ['HL7', 'FHIR', 'Epic', 'Cerner', 'PostgreSQL', 'Python'],
        certifications: ['HIPAA Compliance', 'HL7 Certified', 'Epic Certified'],
        industryExperience: ['Healthcare', 'Medical Devices'],
        caseStudies: [
          {
            title: 'Hospital EHR Migration',
            client: 'Regional Medical Center',
            description: 'Migrated from legacy system to Epic',
            results: '99.9% uptime, zero HIPAA violations',
            compliance: ['HIPAA', 'HITECH']
          }
        ]
      };

      // Execute comprehensive analysis
      const capabilities = await capabilitiesExtractor.extractCapabilities(healthcareSupplier);
      const credibility = await credibilityScorer.calculateCredibilityScore(healthcareSupplier, capabilities);
      const analysis = await analysisEngine.coordinateAnalysis({
        ...healthcareSupplier,
        extractedCapabilities: capabilities,
        credibilityAssessment: credibility
      });

      // Verify business intelligence generation
      // Should identify healthcare domain specialization
      assert.ok(capabilities.domainExpertise.includes('Healthcare'));
      assert.ok(capabilities.complianceCapabilities.includes('HIPAA'));

      // Credibility should be high due to specialized certifications
      assert.ok(credibility.score >= 8);
      assert.ok(credibility.factors.includes('domain_expertise'));
      assert.ok(credibility.factors.includes('compliance_certifications'));

      // AI insights should recognize healthcare market positioning
      assert.ok(analysis.marketPosition.specialization === 'healthcare_it');
      assert.ok(analysis.competitiveAdvantages.includes('hipaa_compliance'));
      assert.ok(analysis.partnershipPotential.targetIndustries.includes('healthcare'));

      // Should provide specific business recommendations
      assert.ok(analysis.businessRecommendations.marketOpportunities.some(opp => 
        opp.includes('healthcare') || opp.includes('medical')
      ));
      assert.ok(analysis.businessRecommendations.differentiationStrategies.some(strategy =>
        strategy.includes('compliance') || strategy.includes('regulatory')
      ));
    });
  });
});