const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { testDb } = require('../setup/test-database');

const { SupplierAnalysisService } = require('../../src/services/supplierAnalysis');

describe('Supplier Analysis Algorithm (Algorithm 1)', () => {
  let supplierAnalysis;
  let testCompanyId;

  before(async () => {
    // Setup test database and create test data
    await testDb.setup();
    await testDb.createFullTestData();
    
    // Get test company ID
    const result = await testDb.db.query('SELECT id FROM companies LIMIT 1');
    testCompanyId = result.rows[0].id;
  });

  after(async () => {
    // Cleanup test database
    await testDb.cleanup();
  });

  test('should extract capabilities from supplier profile data', async () => {
    supplierAnalysis = new SupplierAnalysisService();
    
    const mockSupplierData = {
      website: 'https://techsolutions.com',
      description: 'Full-stack development company specializing in React, Node.js, and cloud deployment',
      services: ['Web Development', 'Mobile Apps', 'Cloud Migration', 'DevOps'],
      caseStudies: [
        {
          title: 'E-commerce Platform Development',
          technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
          outcome: 'Delivered on time, 99.9% uptime, 50% performance improvement'
        }
      ],
      certifications: ['AWS Solutions Architect', 'ISO 27001', 'SOC 2 Type II']
    };

    const result = await supplierAnalysis.analyzeSupplier(testCompanyId, mockSupplierData);

    // Test capability extraction
    assert.ok(result.capabilities, 'Should extract capabilities');
    assert.ok(Array.isArray(result.capabilities), 'Capabilities should be an array');
    assert.ok(result.capabilities.length > 0, 'Should extract at least one capability');
    
    // Should extract technical capabilities
    const hasReact = result.capabilities.some(cap => cap.toLowerCase().includes('react'));
    const hasNodeJs = result.capabilities.some(cap => cap.toLowerCase().includes('node'));
    assert.ok(hasReact || hasNodeJs, 'Should extract technical capabilities from description');

    // Test credibility scoring
    assert.ok(typeof result.credibilityScore === 'number', 'Credibility score should be numeric');
    assert.ok(result.credibilityScore >= 0 && result.credibilityScore <= 10, 'Credibility score should be 0-10');

    // Test certification identification
    assert.ok(result.certifications, 'Should identify certifications');
    assert.ok(Array.isArray(result.certifications), 'Certifications should be an array');
    assert.ok(result.certifications.includes('AWS Solutions Architect'), 'Should preserve specific certifications');

    // Test analysis insights
    assert.ok(result.insights, 'Should provide analysis insights');
    assert.ok(result.insights.strengths, 'Should identify strengths');
    assert.ok(result.insights.experience, 'Should assess experience level');
  });

  test('should calculate credibility score based on multiple factors', async () => {
    supplierAnalysis = new SupplierAnalysisService();

    const highCredibilitySupplier = {
      website: 'https://established-company.com',
      yearsInBusiness: 15,
      certifications: ['ISO 9001', 'ISO 27001', 'SOC 2', 'CMMI Level 5'],
      caseStudies: Array(20).fill().map((_, i) => ({
        title: `Project ${i + 1}`,
        outcome: 'Successful delivery, client satisfaction 4.8/5'
      })),
      testimonials: Array(50).fill().map(() => ({
        rating: 4.9,
        client: 'Fortune 500 Company'
      })),
      teamSize: 200,
      financialStability: 'Strong'
    };

    const lowCredibilitySupplier = {
      website: 'https://new-startup.com',
      yearsInBusiness: 1,
      certifications: [],
      caseStudies: [
        {
          title: 'First Project',
          outcome: 'Delivered with some delays'
        }
      ],
      teamSize: 3
    };

    const highResult = await supplierAnalysis.analyzeSupplier(testCompanyId, highCredibilitySupplier);
    const lowResult = await supplierAnalysis.analyzeSupplier(testCompanyId, lowCredibilitySupplier);

    // High credibility supplier should score significantly higher
    assert.ok(highResult.credibilityScore > lowResult.credibilityScore + 2, 
      'Established supplier should score significantly higher than new startup');
    
    assert.ok(highResult.credibilityScore >= 7, 'High credibility supplier should score 7+ out of 10');
    assert.ok(lowResult.credibilityScore <= 5, 'Low credibility supplier should score 5 or less');

    // High credibility should reflect in insights
    assert.ok(highResult.insights.strengths.length > lowResult.insights.strengths.length,
      'High credibility supplier should have more identified strengths');
  });

  test('should analyze industry specialization and domain expertise', async () => {
    supplierAnalysis = new SupplierAnalysisService();

    const healthcareSpecialist = {
      description: 'Healthcare IT solutions, HIPAA compliance, EHR integration',
      services: ['Healthcare Software', 'HIPAA Compliance', 'Medical Device Integration'],
      certifications: ['HIPAA', 'HL7 FHIR', 'FDA 510(k)'],
      caseStudies: [
        {
          title: 'Hospital Management System',
          industry: 'Healthcare',
          technologies: ['HL7', 'FHIR', 'HIPAA-compliant cloud']
        }
      ]
    };

    const result = await supplierAnalysis.analyzeSupplier(testCompanyId, healthcareSpecialist);

    // Should identify healthcare specialization
    assert.ok(result.domainExpertise, 'Should identify domain expertise');
    assert.ok(result.domainExpertise.primary, 'Should identify primary domain');
    
    const healthcareExpertise = result.domainExpertise.primary.toLowerCase().includes('healthcare') ||
      result.capabilities.some(cap => cap.toLowerCase().includes('healthcare'));
    assert.ok(healthcareExpertise, 'Should recognize healthcare domain expertise');

    // Should identify regulatory compliance capabilities
    const hasComplianceExpertise = result.capabilities.some(cap => 
      cap.toLowerCase().includes('hipaa') || cap.toLowerCase().includes('compliance'));
    assert.ok(hasComplianceExpertise, 'Should identify regulatory compliance capabilities');

    // Domain expertise should boost credibility score
    assert.ok(result.credibilityScore >= 6, 'Domain specialization should contribute to credibility');
  });

  test('should handle missing or incomplete supplier data gracefully', async () => {
    supplierAnalysis = new SupplierAnalysisService();

    const minimalData = {
      companyName: 'Minimal Info Company'
    };

    const result = await supplierAnalysis.analyzeSupplier(testCompanyId, minimalData);

    // Should handle gracefully without errors
    assert.ok(result, 'Should return results even for minimal data');
    assert.ok(result.capabilities, 'Should return capabilities array even if empty');
    assert.ok(Array.isArray(result.capabilities), 'Capabilities should be an array');
    assert.ok(typeof result.credibilityScore === 'number', 'Should return numeric credibility score');
    
    // Minimal data should result in lower scores
    assert.ok(result.credibilityScore <= 4, 'Minimal data should result in lower credibility score');
    
    // Should still provide structured insights
    assert.ok(result.insights, 'Should provide insights structure');
    assert.ok(result.insights.dataCompleteness, 'Should note data completeness issues');
  });

  test('should extract and categorize technical capabilities correctly', async () => {
    supplierAnalysis = new SupplierAnalysisService();

    const techFocusedSupplier = {
      description: 'Modern web development using React, Vue.js, Node.js, Python Django, and AWS cloud services',
      services: ['Frontend Development', 'Backend APIs', 'Cloud Infrastructure', 'DevOps'],
      caseStudies: [
        {
          title: 'Microservices Architecture',
          technologies: ['Docker', 'Kubernetes', 'Redis', 'PostgreSQL', 'GraphQL']
        }
      ]
    };

    const result = await supplierAnalysis.analyzeSupplier(testCompanyId, techFocusedSupplier);

    // Should categorize capabilities
    assert.ok(result.technicalCapabilities, 'Should extract technical capabilities');
    
    const expectedCategories = ['frontend', 'backend', 'database', 'cloud', 'devops'];
    const foundCategories = Object.keys(result.technicalCapabilities || {});
    
    const hasMultipleCategories = foundCategories.length >= 3;
    assert.ok(hasMultipleCategories, 'Should identify multiple technical categories');

    // Should extract specific technologies
    const allCapabilities = result.capabilities.join(' ').toLowerCase();
    const hasFrontendTech = allCapabilities.includes('react') || allCapabilities.includes('vue');
    const hasBackendTech = allCapabilities.includes('node') || allCapabilities.includes('python');
    const hasCloudTech = allCapabilities.includes('aws') || allCapabilities.includes('docker');
    
    assert.ok(hasFrontendTech, 'Should extract frontend technologies');
    assert.ok(hasBackendTech, 'Should extract backend technologies');
    assert.ok(hasCloudTech, 'Should extract cloud technologies');
  });

  test('should complete analysis within performance requirements', async () => {
    supplierAnalysis = new SupplierAnalysisService();

    const largeSupplierData = {
      description: 'Large enterprise software development company with extensive experience across multiple industries and technologies. We specialize in enterprise-grade solutions, custom software development, system integration, and digital transformation initiatives.',
      services: Array(50).fill().map((_, i) => `Service ${i + 1}`),
      caseStudies: Array(100).fill().map((_, i) => ({
        title: `Case Study ${i + 1}`,
        description: 'Detailed case study with extensive technical details and outcomes',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
        outcome: 'Successful project delivery with high client satisfaction'
      })),
      certifications: Array(20).fill().map((_, i) => `Certification ${i + 1}`),
      testimonials: Array(200).fill().map((_, i) => ({
        client: `Client ${i + 1}`,
        feedback: 'Excellent work, highly recommended',
        rating: 4.8
      }))
    };

    const startTime = Date.now();
    const result = await supplierAnalysis.analyzeSupplier(testCompanyId, largeSupplierData);
    const executionTime = Date.now() - startTime;

    // Performance requirement: should complete within 2 seconds
    assert.ok(executionTime < 2000, `Analysis should complete within 2 seconds, took ${executionTime}ms`);
    
    // Should still return comprehensive results for large data
    assert.ok(result.capabilities.length > 0, 'Should extract capabilities from large dataset');
    assert.ok(result.credibilityScore > 0, 'Should calculate credibility score for large dataset');
    assert.ok(result.insights, 'Should provide insights for large dataset');
  });
});