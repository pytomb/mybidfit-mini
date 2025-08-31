const { test, describe, before } = require('node:test');
const assert = require('node:assert');

describe('Algorithm Performance Tests', () => {
  let services;

  before(() => {
    // Load services for performance testing
    const { OpportunityScoringService } = require('../../src/services/opportunityScoring');
    const { SupplierAnalysisService } = require('../../src/services/supplierAnalysis');
    const { PartnershipMatchingService } = require('../../src/services/partnershipMatching');
    const { EventRecommendationService } = require('../../src/services/eventRecommendations');
    const { PartnerLiftService } = require('../../src/services/partnerLiftAnalysis');
    
    services = {
      opportunityScoring: OpportunityScoringService,
      supplierAnalysis: SupplierAnalysisService,
      partnershipMatching: PartnershipMatchingService,
      eventRecommendations: EventRecommendationService,
      partnerLiftAnalysis: PartnerLiftService
    };
  });

  test('Panel of Judges Algorithm (Algorithm 3) performance benchmark', async () => {
    const opportunityScoring = new services.opportunityScoring();
    
    // Create realistic complex data for performance testing
    const complexSupplier = {
      companyName: 'Enterprise Software Solutions Inc',
      website: 'https://enterprise-solutions.com',
      description: 'Full-service enterprise software development company with 15 years of experience delivering mission-critical applications for Fortune 500 companies and government agencies. Specialized in cloud-native architectures, microservices, and scalable enterprise solutions.',
      capabilities: [
        'Full-Stack Development', 'Cloud Architecture', 'Microservices', 'DevOps',
        'Data Analytics', 'Machine Learning', 'Security', 'Mobile Development',
        'Enterprise Integration', 'Legacy Modernization', 'API Development',
        'Database Design', 'UI/UX Design', 'Quality Assurance', 'Project Management'
      ],
      certifications: [
        'AWS Solutions Architect Professional', 'Azure Expert', 'Google Cloud Professional',
        'ISO 27001', 'SOC 2 Type II', 'CMMI Level 5', 'Agile Certified',
        'CISSP', 'PMP', 'Scrum Master', 'Security+', 'TOGAF'
      ],
      pastPerformance: {
        successRate: 0.96,
        onTimeDelivery: 0.93,
        budgetAdherence: 0.91,
        clientSatisfaction: 4.8,
        projectsCompleted: 247,
        averageProjectValue: 850000
      },
      teamSize: 150,
      yearsInBusiness: 15,
      clientTestimonials: Array(50).fill().map((_, i) => ({
        client: `Fortune 500 Company ${i + 1}`,
        rating: 4.7 + Math.random() * 0.3,
        feedback: 'Exceptional delivery and technical expertise'
      }))
    };

    const complexOpportunity = {
      title: 'Enterprise Digital Transformation Initiative',
      description: 'Large-scale digital transformation project requiring modernization of legacy systems, implementation of cloud-native architecture, development of customer-facing applications, and integration with existing enterprise systems. Must handle millions of transactions per day with 99.99% uptime requirements.',
      requirements: [
        'Microservices Architecture', 'Cloud Migration', 'API Gateway',
        'Event-Driven Architecture', 'CQRS Pattern', 'Docker/Kubernetes',
        'CI/CD Pipeline', 'Infrastructure as Code', 'Monitoring & Observability',
        'Security by Design', 'Data Migration', 'Performance Optimization',
        'Load Balancing', 'Auto-scaling', 'Disaster Recovery',
        'Compliance (SOC2, PCI DSS)', 'Mobile Applications', 'Real-time Analytics'
      ],
      budget: 5000000,
      timeline: '24 months',
      complexity: 'high',
      criticalityLevel: 'mission-critical',
      performanceRequirements: {
        maxResponseTime: 200,  // ms
        throughput: 10000,     // requests/sec
        availability: 99.99    // percentage
      },
      complianceRequirements: ['SOC2', 'PCI DSS', 'GDPR', 'HIPAA'],
      stakeholders: ['CTO', 'CISO', 'VP Engineering', 'Business Units', 'Compliance Team']
    };

    // Performance benchmark: Should complete complex scoring within 2 seconds
    const iterations = 5;
    const executionTimes = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const result = await opportunityScoring.scoreOpportunity(complexSupplier, complexOpportunity);
      const executionTime = Date.now() - startTime;
      
      executionTimes.push(executionTime);
      
      // Verify result quality is maintained under performance pressure
      assert.ok(result.overallScore, `Iteration ${i + 1}: Should return overall score`);
      assert.ok(Object.keys(result.judgeScores).length === 5, `Iteration ${i + 1}: Should have 5 judge scores`);
      assert.ok(result.explanation, `Iteration ${i + 1}: Should provide explanation`);
      assert.ok(result.recommendations.length > 0, `Iteration ${i + 1}: Should provide recommendations`);
    }

    const averageTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxTime = Math.max(...executionTimes);

    console.log(`Panel of Judges Performance: avg=${averageTime}ms, max=${maxTime}ms, iterations=${iterations}`);
    
    // Performance assertions
    assert.ok(averageTime < 2000, `Average execution time should be under 2 seconds, was ${averageTime}ms`);
    assert.ok(maxTime < 3000, `Maximum execution time should be under 3 seconds, was ${maxTime}ms`);
    
    // Consistency check: execution times shouldn't vary too much
    const variance = executionTimes.reduce((acc, time) => acc + Math.pow(time - averageTime, 2), 0) / executionTimes.length;
    const standardDeviation = Math.sqrt(variance);
    
    assert.ok(standardDeviation < averageTime * 0.5, 'Execution times should be consistent (low variance)');
  });

  test('Supplier Analysis Algorithm (Algorithm 1) performance benchmark', async () => {
    const supplierAnalysis = new services.supplierAnalysis();
    
    // Large supplier data for performance testing
    const largeSupplierData = {
      companyName: 'Global Technology Consultancy',
      website: 'https://global-tech-consultancy.com',
      description: 'International technology consultancy with offices in 25 countries, serving Fortune 500 clients across multiple industries including healthcare, finance, government, and retail. Specializes in enterprise architecture, digital transformation, cloud migration, and emerging technology adoption.',
      services: Array(100).fill().map((_, i) => `Service Category ${i + 1}`),
      capabilities: Array(200).fill().map((_, i) => `Technical Capability ${i + 1}`),
      certifications: Array(50).fill().map((_, i) => `Industry Certification ${i + 1}`),
      caseStudies: Array(500).fill().map((_, i) => ({
        title: `Case Study ${i + 1}: Complex Enterprise Implementation`,
        client: `Fortune 500 Company ${i % 100 + 1}`,
        industry: ['Healthcare', 'Finance', 'Government', 'Retail', 'Manufacturing'][i % 5],
        projectValue: Math.floor(Math.random() * 10000000) + 100000,
        duration: `${Math.floor(Math.random() * 24) + 6} months`,
        technologies: Array(Math.floor(Math.random() * 10) + 5).fill().map((_, j) => `Technology ${j + 1}`),
        outcome: 'Successful delivery with measurable business impact',
        clientSatisfaction: 4.0 + Math.random(),
        businessImpact: {
          costSavings: Math.floor(Math.random() * 5000000) + 500000,
          efficiencyGain: Math.floor(Math.random() * 50) + 20,
          revenueIncrease: Math.floor(Math.random() * 10000000) + 1000000
        }
      })),
      testimonials: Array(1000).fill().map((_, i) => ({
        client: `Client ${i + 1}`,
        role: ['CTO', 'VP Engineering', 'Technical Director', 'Project Manager'][i % 4],
        rating: 4.0 + Math.random(),
        feedback: `Excellent technical expertise and project delivery. Project ${i + 1} exceeded expectations.`
      })),
      teamMembers: Array(2000).fill().map((_, i) => ({
        name: `Team Member ${i + 1}`,
        role: ['Senior Developer', 'Architect', 'Project Manager', 'QA Engineer'][i % 4],
        experience: Math.floor(Math.random() * 15) + 2,
        certifications: Array(Math.floor(Math.random() * 5) + 1).fill().map((_, j) => `Cert ${j + 1}`)
      }))
    };

    const iterations = 3;
    const executionTimes = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const result = await supplierAnalysis.analyzeSupplier(largeSupplierData);
      const executionTime = Date.now() - startTime;
      
      executionTimes.push(executionTime);
      
      // Verify comprehensive analysis is maintained
      assert.ok(result.capabilities.length > 0, `Iteration ${i + 1}: Should extract capabilities`);
      assert.ok(typeof result.credibilityScore === 'number', `Iteration ${i + 1}: Should calculate credibility`);
      assert.ok(result.insights, `Iteration ${i + 1}: Should provide insights`);
    }

    const averageTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxTime = Math.max(...executionTimes);

    console.log(`Supplier Analysis Performance: avg=${averageTime}ms, max=${maxTime}ms, iterations=${iterations}`);
    
    // Performance assertions for large dataset processing
    assert.ok(averageTime < 2000, `Average execution time should be under 2 seconds, was ${averageTime}ms`);
    assert.ok(maxTime < 3000, `Maximum execution time should be under 3 seconds, was ${maxTime}ms`);
  });

  test('Memory usage and garbage collection performance', async () => {
    const opportunityScoring = new services.opportunityScoring();
    
    // Monitor memory usage during intensive operations
    const initialMemory = process.memoryUsage();
    
    const testData = {
      supplier: {
        companyName: 'Memory Test Company',
        capabilities: Array(1000).fill().map((_, i) => `Capability ${i}`),
        certifications: Array(100).fill().map((_, i) => `Certification ${i}`)
      },
      opportunity: {
        title: 'Memory Intensive Analysis',
        requirements: Array(500).fill().map((_, i) => `Requirement ${i}`)
      }
    };

    // Run multiple iterations to test memory management
    const iterations = 20;
    for (let i = 0; i < iterations; i++) {
      await opportunityScoring.scoreOpportunity(testData.supplier, testData.opportunity);
      
      // Force garbage collection periodically to test cleanup
      if (i % 5 === 0 && global.gc) {
        global.gc();
      }
    }

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

    console.log(`Memory Usage: initial=${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB, final=${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB, increase=${memoryIncreasePercent.toFixed(1)}%`);

    // Memory increase should be reasonable (less than 200% increase)
    assert.ok(memoryIncreasePercent < 200, `Memory increase should be reasonable, was ${memoryIncreasePercent.toFixed(1)}%`);
  });

  test('Concurrent algorithm execution performance', async () => {
    const concurrentRequests = 10;
    const startTime = Date.now();

    // Create multiple algorithm instances running concurrently
    const promises = Array(concurrentRequests).fill().map(async (_, i) => {
      const opportunityScoring = new services.opportunityScoring();
      
      return opportunityScoring.scoreOpportunity(
        {
          companyName: `Concurrent Test Company ${i}`,
          capabilities: ['Software Development', 'Cloud Services']
        },
        {
          title: `Concurrent Test Opportunity ${i}`,
          requirements: ['React', 'Node.js', 'AWS']
        }
      );
    });

    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const averageTimePerRequest = totalTime / concurrentRequests;

    console.log(`Concurrent Performance: ${concurrentRequests} requests in ${totalTime}ms, avg=${averageTimePerRequest}ms per request`);

    // All requests should complete
    assert.strictEqual(results.length, concurrentRequests, 'All concurrent requests should complete');
    
    // Each result should be valid
    for (const result of results) {
      assert.ok(result.overallScore, 'Each concurrent result should have overall score');
    }

    // Concurrent execution should not significantly degrade performance
    assert.ok(averageTimePerRequest < 3000, `Average per-request time should be reasonable under concurrency, was ${averageTimePerRequest}ms`);
  });

  test('Algorithm scalability with varying data sizes', async () => {
    const supplierAnalysis = new services.supplierAnalysis();
    
    // Test with different data sizes to verify linear scaling
    const dataSizes = [
      { size: 'small', capabilities: 5, certifications: 2, caseStudies: 3 },
      { size: 'medium', capabilities: 20, certifications: 8, caseStudies: 15 },
      { size: 'large', capabilities: 50, certifications: 20, caseStudies: 40 },
      { size: 'xlarge', capabilities: 100, certifications: 40, caseStudies: 80 }
    ];

    const scalabilityResults = [];

    for (const dataSize of dataSizes) {
      const testData = {
        companyName: `Scalability Test ${dataSize.size}`,
        capabilities: Array(dataSize.capabilities).fill().map((_, i) => `Capability ${i}`),
        certifications: Array(dataSize.certifications).fill().map((_, i) => `Cert ${i}`),
        caseStudies: Array(dataSize.caseStudies).fill().map((_, i) => ({
          title: `Case Study ${i}`,
          outcome: 'Success'
        }))
      };

      const startTime = Date.now();
      const result = await supplierAnalysis.analyzeSupplier(testData);
      const executionTime = Date.now() - startTime;

      scalabilityResults.push({
        size: dataSize.size,
        dataPoints: dataSize.capabilities + dataSize.certifications + dataSize.caseStudies,
        executionTime: executionTime
      });

      // Verify result quality is maintained across all data sizes
      assert.ok(result.capabilities.length > 0, `${dataSize.size} data should produce capabilities`);
      assert.ok(typeof result.credibilityScore === 'number', `${dataSize.size} data should produce credibility score`);
    }

    console.log('Scalability Results:', scalabilityResults.map(r => 
      `${r.size}: ${r.dataPoints} data points in ${r.executionTime}ms`).join(', '));

    // Verify roughly linear scaling (large datasets shouldn't be exponentially slower)
    const smallTime = scalabilityResults.find(r => r.size === 'small').executionTime;
    const largeTime = scalabilityResults.find(r => r.size === 'xlarge').executionTime;
    const scalingFactor = largeTime / smallTime;

    assert.ok(scalingFactor < 20, `Scaling should be roughly linear, xlarge took ${scalingFactor}x longer than small`);
  });
});