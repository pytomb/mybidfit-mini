const { test, describe } = require('node:test');
const assert = require('node:assert');

// Import the Partner Fit service
const { PartnerFitService } = require('../../src/services/partnerFit');

describe('Partner Fit Service - Multi-Persona Evaluation System', () => {
  let partnerFitService;

  test('should initialize Partner Fit service with multi-persona evaluation capabilities', () => {
    partnerFitService = new PartnerFitService();
    
    assert.ok(partnerFitService, 'Service should initialize successfully');
    assert.ok(typeof partnerFitService.searchPartners === 'function', 'Should have searchPartners method');
    assert.ok(typeof partnerFitService.calculatePartnerScore === 'function', 'Should have calculatePartnerScore method');
    assert.ok(typeof partnerFitService.calculateCFOScore === 'function', 'Should have CFO scoring method');
    assert.ok(typeof partnerFitService.calculateCISOScore === 'function', 'Should have CISO scoring method');
    assert.ok(typeof partnerFitService.calculateOperatorScore === 'function', 'Should have Operator scoring method');
    assert.ok(typeof partnerFitService.calculateSkepticScore === 'function', 'Should have Skeptic scoring method');
  });

  test('should search for complementary partners with proper filtering', async () => {
    partnerFitService = new PartnerFitService();
    
    const searchFilters = {
      matchType: 'complementary',
      capabilities: ['Cloud Architecture', 'Security'],
      certifications: ['SOC 2'],
      minScore: 0.7,
      limit: 10
    };

    const results = await partnerFitService.searchPartners(1, searchFilters);
    
    assert.ok(Array.isArray(results), 'Should return array of partners');
    assert.ok(results.length > 0, 'Should find complementary partners');
    
    // Verify each partner has required structure
    for (const partner of results) {
      assert.ok(partner.id, 'Partner should have ID');
      assert.ok(partner.name, 'Partner should have name');
      assert.ok(partner.matchScore >= searchFilters.minScore, 'Partner should meet minimum score requirement');
      assert.ok(partner.matchType === searchFilters.matchType, 'Partner should match the requested type');
      assert.ok(Array.isArray(partner.capabilities), 'Partner should have capabilities array');
      assert.ok(Array.isArray(partner.certifications), 'Partner should have certifications array');
      assert.ok(Array.isArray(partner.reasons), 'Partner should have match reasons');
      assert.ok(partner.personas, 'Partner should have multi-persona scores');
      
      // Verify multi-persona structure
      assert.ok(partner.personas.cfo, 'Should have CFO persona score');
      assert.ok(partner.personas.ciso, 'Should have CISO persona score');
      assert.ok(partner.personas.operator, 'Should have Operator persona score');
      assert.ok(partner.personas.skeptic, 'Should have Skeptic persona score');
      
      // Verify persona score structure
      for (const personaKey of ['cfo', 'ciso', 'operator', 'skeptic']) {
        const persona = partner.personas[personaKey];
        assert.ok(typeof persona.score === 'number', `${personaKey} should have numeric score`);
        assert.ok(persona.score >= 0 && persona.score <= 100, `${personaKey} score should be 0-100`);
        assert.ok(persona.summary, `${personaKey} should have summary`);
      }
    }
  });

  test('should search for similar partners with capacity scaling focus', async () => {
    partnerFitService = new PartnerFitService();
    
    const searchFilters = {
      matchType: 'similar',
      capabilities: ['Full Stack Development'],
      minScore: 0.6,
      limit: 5
    };

    const results = await partnerFitService.searchPartners(1, searchFilters);
    
    assert.ok(Array.isArray(results), 'Should return array of similar partners');
    
    // Find similar partners in results
    const similarPartners = results.filter(p => p.matchType === 'similar');
    assert.ok(similarPartners.length > 0, 'Should find similar partners');
    
    // Similar partners should have different scoring patterns than complementary
    for (const partner of similarPartners) {
      assert.ok(partner.matchType === 'similar', 'Partner type should be similar');
      assert.ok(partner.reasons.some(reason => 
        reason.includes('capacity') || reason.includes('scaling') || reason.includes('similar')
      ), 'Similar partners should have capacity/scaling reasons');
    }
  });

  test('should calculate multi-persona partnership scores correctly', () => {
    partnerFitService = new PartnerFitService();
    
    const seekerProfile = {
      companySize: 'Medium (50-200)',
      capabilities: ['Web Development', 'API Development'],
      certifications: ['ISO 9001'],
      regions: ['North America']
    };

    const partnerProfile = {
      companySize: 'Medium (75-150)',
      capabilities: ['Cloud Architecture', 'DevOps', 'Security'],
      certifications: ['ISO 27001', 'SOC 2', 'AWS Certified'],
      regions: ['North America', 'Europe'],
      currentCapacity: 70
    };

    const opportunity = {
      industry: 'healthcare',
      requirements: ['HIPAA Compliance', 'Cloud Security']
    };

    const result = partnerFitService.calculatePartnerScore(seekerProfile, partnerProfile, opportunity);
    
    // Verify overall structure
    assert.ok(result, 'Should return partnership score result');
    assert.ok(typeof result.overallScore === 'number', 'Should have numeric overall score');
    assert.ok(result.overallScore >= 0 && result.overallScore <= 1, 'Overall score should be 0-1');
    assert.ok(result.personas, 'Should include individual persona scores');

    // Verify all personas are evaluated
    const expectedPersonas = ['cfo', 'ciso', 'operator', 'skeptic'];
    for (const persona of expectedPersonas) {
      assert.ok(result.personas[persona], `Should include ${persona} score`);
      assert.ok(typeof result.personas[persona] === 'number', `${persona} score should be numeric`);
      assert.ok(result.personas[persona] >= 0 && result.personas[persona] <= 100, `${persona} score should be 0-100`);
    }

    // Verify weighted calculation
    const calculatedOverall = (
      result.personas.cfo * 0.25 +
      result.personas.ciso * 0.25 +
      result.personas.operator * 0.30 +
      result.personas.skeptic * 0.20
    ) / 100;
    
    assert.ok(Math.abs(result.overallScore - calculatedOverall) < 0.01, 'Overall score should match weighted calculation');
  });

  test('should properly evaluate CFO persona scoring factors', () => {
    partnerFitService = new PartnerFitService();
    
    // High-scoring scenario
    const goodSeekerProfile = { companySize: 'Medium (50-200)' };
    const goodPartnerProfile = {
      companySize: 'Medium (75-150)',
      certifications: ['SOC 2', 'ISO 9001'],
      currentCapacity: 70
    };

    const goodScore = partnerFitService.calculateCFOScore(goodSeekerProfile, goodPartnerProfile);
    
    // Low-scoring scenario  
    const badPartnerProfile = {
      companySize: 'Large (200+)',
      certifications: [],
      currentCapacity: 25
    };

    const badScore = partnerFitService.calculateCFOScore(goodSeekerProfile, badPartnerProfile);
    
    assert.ok(typeof goodScore === 'number', 'CFO score should be numeric');
    assert.ok(goodScore >= 0 && goodScore <= 100, 'CFO score should be 0-100');
    assert.ok(typeof badScore === 'number', 'Bad CFO score should be numeric');
    assert.ok(badScore >= 0 && badScore <= 100, 'Bad CFO score should be 0-100');
    assert.ok(goodScore > badScore, 'Good financial compatibility should score higher than bad');
  });

  test('should properly evaluate CISO persona scoring for security compliance', () => {
    partnerFitService = new PartnerFitService();
    
    const seekerProfile = {};
    
    // High security partner
    const securityPartnerProfile = {
      certifications: ['ISO 27001', 'SOC 2', 'HIPAA Certified', 'CISSP', 'CISA']
    };

    // Low security partner
    const lowSecurityPartnerProfile = {
      certifications: ['Basic Certification']
    };

    // Healthcare opportunity (requires HIPAA)
    const healthcareOpportunity = { industry: 'healthcare' };

    const highSecurityScore = partnerFitService.calculateCISOScore(seekerProfile, securityPartnerProfile, healthcareOpportunity);
    const lowSecurityScore = partnerFitService.calculateCISOScore(seekerProfile, lowSecurityPartnerProfile, healthcareOpportunity);
    
    assert.ok(typeof highSecurityScore === 'number', 'High security score should be numeric');
    assert.ok(highSecurityScore >= 0 && highSecurityScore <= 100, 'High security score should be 0-100');
    assert.ok(typeof lowSecurityScore === 'number', 'Low security score should be numeric');
    assert.ok(lowSecurityScore >= 0 && lowSecurityScore <= 100, 'Low security score should be 0-100');
    assert.ok(highSecurityScore > lowSecurityScore, 'Higher security certifications should score better');
    
    // Healthcare opportunity should give extra points for HIPAA certification
    assert.ok(highSecurityScore >= 85, 'HIPAA certified partner should score very high for healthcare opportunity');
  });

  test('should properly evaluate Operator persona scoring for delivery capability', () => {
    partnerFitService = new PartnerFitService();
    
    const seekerProfile = { regions: ['North America'] };
    
    // High operational capability
    const goodOperationalPartner = {
      currentCapacity: 80,
      regions: ['North America', 'Europe'],
      certifications: ['CMMI Level 3', 'ISO 9001']
    };

    // Poor operational capability
    const poorOperationalPartner = {
      currentCapacity: 20,
      regions: ['Asia'],
      certifications: []
    };

    const goodOpScore = partnerFitService.calculateOperatorScore(seekerProfile, goodOperationalPartner);
    const poorOpScore = partnerFitService.calculateOperatorScore(seekerProfile, poorOperationalPartner);
    
    assert.ok(typeof goodOpScore === 'number', 'Good operational score should be numeric');
    assert.ok(goodOpScore >= 0 && goodOpScore <= 100, 'Good operational score should be 0-100');
    assert.ok(typeof poorOpScore === 'number', 'Poor operational score should be numeric');
    assert.ok(poorOpScore >= 0 && poorOpScore <= 100, 'Poor operational score should be 0-100');
    assert.ok(goodOpScore > poorOpScore, 'Better operational capability should score higher');
    
    // High capacity and shared regions should score well
    assert.ok(goodOpScore >= 80, 'High capacity partner with shared regions should score well');
  });

  test('should properly evaluate Skeptic persona for partnership risks', () => {
    partnerFitService = new PartnerFitService();
    
    const seekerProfile = {
      capabilities: ['Web Development', 'API Development'],
      companySize: 'Medium (50-200)'
    };
    
    // Low risk partner (different capabilities, similar size, high capacity)
    const lowRiskPartner = {
      capabilities: ['Cloud Architecture', 'DevOps'],
      companySize: 'Medium (75-150)',
      currentCapacity: 75
    };

    // High risk partner (overlapping capabilities, size mismatch, low capacity)
    const highRiskPartner = {
      capabilities: ['Web Development', 'API Development', 'Frontend Development'],
      companySize: 'Large (200+)',
      currentCapacity: 30
    };

    const lowRiskScore = partnerFitService.calculateSkepticScore(seekerProfile, lowRiskPartner);
    const highRiskScore = partnerFitService.calculateSkepticScore(seekerProfile, highRiskPartner);
    
    assert.ok(typeof lowRiskScore === 'number', 'Low risk score should be numeric');
    assert.ok(lowRiskScore >= 0 && lowRiskScore <= 100, 'Low risk score should be 0-100');
    assert.ok(typeof highRiskScore === 'number', 'High risk score should be numeric');
    assert.ok(highRiskScore >= 0 && highRiskScore <= 100, 'High risk score should be 0-100');
    assert.ok(lowRiskScore > highRiskScore, 'Lower risk partnership should score higher');
    
    // High overlap should reduce skeptic score
    assert.ok(highRiskScore <= 70, 'High capability overlap should concern the skeptic');
    assert.ok(lowRiskScore >= 70, 'Complementary partnership should satisfy the skeptic');
  });

  test('should generate explainable match reasons based on partnership type', () => {
    partnerFitService = new PartnerFitService();
    
    const seekerProfile = {
      capabilities: ['Frontend Development'],
      companySize: 'Small (10-50)'
    };

    const partnerProfile = {
      capabilities: ['Backend Development', 'Database Design'],
      companySize: 'Small (10-50)',
      currentCapacity: 80
    };

    const scores = {
      cfo: 85,
      ciso: 75,
      operator: 90,
      skeptic: 80
    };

    // Test complementary match reasons
    const complementaryReasons = partnerFitService.generateMatchReasons(
      seekerProfile, partnerProfile, 'complementary', scores
    );
    
    assert.ok(Array.isArray(complementaryReasons), 'Should return array of reasons');
    assert.ok(complementaryReasons.length > 0, 'Should provide at least one reason');
    assert.ok(complementaryReasons.length <= 3, 'Should limit to top 3 reasons');
    
    // Should mention complementary aspects
    const hasComplementaryReason = complementaryReasons.some(reason => 
      reason.includes('fill') || reason.includes('complement') || reason.includes('gap') || reason.includes('enhance')
    );
    assert.ok(hasComplementaryReason, 'Complementary reasons should mention filling gaps or enhancing offerings');

    // Test similar match reasons
    const similarReasons = partnerFitService.generateMatchReasons(
      seekerProfile, partnerProfile, 'similar', scores
    );
    
    assert.ok(Array.isArray(similarReasons), 'Similar reasons should be array');
    assert.ok(similarReasons.length > 0, 'Should provide similar partnership reasons');
    
    // Reasons should be different for different match types
    assert.ok(JSON.stringify(complementaryReasons) !== JSON.stringify(similarReasons), 
      'Complementary and similar partnerships should have different reasons');
  });

  test('should handle company size similarity detection correctly', () => {
    partnerFitService = new PartnerFitService();
    
    // Test similar sizes
    assert.ok(partnerFitService.isSimilarCompanySize('Small (10-50)', 'Small (1-10)'), 
      'Small size variants should be considered similar');
    assert.ok(partnerFitService.isSimilarCompanySize('Medium (50-200)', 'Medium (75-150)'), 
      'Medium size variants should be considered similar');
    assert.ok(partnerFitService.isSimilarCompanySize('Large (200+)', 'Enterprise'), 
      'Large size variants should be considered similar');
    
    // Test different sizes
    assert.ok(!partnerFitService.isSimilarCompanySize('Small (10-50)', 'Large (200+)'), 
      'Small and large should not be considered similar');
    assert.ok(!partnerFitService.isSimilarCompanySize('Medium (50-200)', 'Small (1-10)'), 
      'Medium and small should not be considered similar');
    
    // Test null/undefined handling
    assert.ok(!partnerFitService.isSimilarCompanySize(null, 'Small'), 
      'Should handle null input');
    assert.ok(!partnerFitService.isSimilarCompanySize('Medium', undefined), 
      'Should handle undefined input');
  });

  test('should filter partners by search criteria correctly', async () => {
    partnerFitService = new PartnerFitService();
    
    // Test capability filtering
    const capabilityFilter = {
      matchType: 'all',
      capabilities: ['Cloud Architecture'],
      minScore: 0.5,
      limit: 20
    };

    const capabilityResults = await partnerFitService.searchPartners(1, capabilityFilter);
    
    for (const partner of capabilityResults) {
      const hasCapability = partner.capabilities.some(cap => 
        cap.toLowerCase().includes('cloud architecture')
      );
      assert.ok(hasCapability, 'Filtered partners should have requested capabilities');
    }

    // Test certification filtering
    const certificationFilter = {
      matchType: 'all', 
      certifications: ['SOC 2'],
      minScore: 0.5,
      limit: 20
    };

    const certResults = await partnerFitService.searchPartners(1, certificationFilter);
    
    for (const partner of certResults) {
      const hasCertification = partner.certifications.some(cert => 
        cert.toLowerCase().includes('soc 2')
      );
      assert.ok(hasCertification, 'Filtered partners should have requested certifications');
    }

    // Test minimum score filtering
    const scoreFilter = {
      matchType: 'all',
      minScore: 0.8,
      limit: 20
    };

    const scoreResults = await partnerFitService.searchPartners(1, scoreFilter);
    
    for (const partner of scoreResults) {
      assert.ok(partner.matchScore >= 0.8, 'All partners should meet minimum score requirement');
    }
  });

  test('should sort partners by match score in descending order', async () => {
    partnerFitService = new PartnerFitService();
    
    const searchFilters = {
      matchType: 'all',
      minScore: 0.5,
      limit: 10
    };

    const results = await partnerFitService.searchPartners(1, searchFilters);
    
    assert.ok(results.length >= 2, 'Should have multiple partners to test sorting');
    
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i-1].matchScore >= results[i].matchScore, 
        'Partners should be sorted by match score in descending order');
    }
  });

  test('should handle edge cases and empty inputs gracefully', async () => {
    partnerFitService = new PartnerFitService();
    
    // Test empty search filters
    const emptyResults = await partnerFitService.searchPartners(1, {});
    assert.ok(Array.isArray(emptyResults), 'Should handle empty filters');
    
    // Test with very high minimum score (should return fewer results)
    const highScoreResults = await partnerFitService.searchPartners(1, { minScore: 0.95 });
    assert.ok(Array.isArray(highScoreResults), 'Should handle high minimum score');
    
    // Test calculation with minimal data
    const minimalScore = partnerFitService.calculatePartnerScore({}, {});
    assert.ok(typeof minimalScore.overallScore === 'number', 'Should handle minimal input data');
    assert.ok(minimalScore.overallScore >= 0, 'Should return valid score for minimal data');
  });

  test('should provide consistent scoring for identical inputs', () => {
    partnerFitService = new PartnerFitService();
    
    const seekerProfile = {
      companySize: 'Medium (50-200)',
      capabilities: ['Web Development'],
      certifications: ['ISO 9001']
    };

    const partnerProfile = {
      companySize: 'Medium (75-150)', 
      capabilities: ['Cloud Services'],
      certifications: ['SOC 2'],
      currentCapacity: 65
    };

    // Calculate score multiple times
    const score1 = partnerFitService.calculatePartnerScore(seekerProfile, partnerProfile);
    const score2 = partnerFitService.calculatePartnerScore(seekerProfile, partnerProfile);
    
    assert.strictEqual(score1.overallScore, score2.overallScore, 'Should provide consistent overall scores');
    
    for (const persona of ['cfo', 'ciso', 'operator', 'skeptic']) {
      assert.strictEqual(score1.personas[persona], score2.personas[persona], 
        `Should provide consistent ${persona} scores`);
    }
  });
});