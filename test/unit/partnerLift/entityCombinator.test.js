const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { EntityCombinator } = require('../../../src/services/partnerLift/EntityCombinator');

describe('EntityCombinator - Partner Lift Module', () => {
  let combinator;
  
  beforeEach(() => {
    combinator = new EntityCombinator();
  });

  describe('createCombinedEntity()', () => {
    test('should combine two companies into a unified partnership entity', () => {
      const companyA = {
        id: 'comp_1',
        name: 'TechSolutions Inc',
        type: 'technology',
        capabilities: ['React', 'Node.js', 'AWS'],
        size: 'medium',
        experience: 8
      };
      
      const companyB = {
        id: 'comp_2',
        name: 'DataAnalytics Co',
        type: 'analytics',
        capabilities: ['Python', 'Machine Learning', 'BigQuery'],
        size: 'small',
        experience: 5
      };

      const combined = combinator.createCombinedEntity(companyA, companyB);

      // Test basic combined entity structure
      assert.strictEqual(combined.id, 'comp_1+comp_2');
      assert.strictEqual(combined.name, 'TechSolutions Inc + DataAnalytics Co');
      assert.strictEqual(combined.type, 'partnership');
      
      // Test combined capabilities
      assert.ok(Array.isArray(combined.capabilities));
      assert.ok(combined.capabilities.includes('React'));
      assert.ok(combined.capabilities.includes('Python'));
      assert.ok(combined.capabilities.includes('Machine Learning'));
      
      // Should have capabilities from both companies
      assert.ok(combined.capabilities.length >= 6);
    });

    test('should handle companies with overlapping capabilities', () => {
      const companyA = {
        id: 'comp_1',
        name: 'WebDev Corp',
        capabilities: ['React', 'Node.js', 'PostgreSQL', 'AWS']
      };
      
      const companyB = {
        id: 'comp_2', 
        name: 'FullStack Solutions',
        capabilities: ['React', 'Vue.js', 'PostgreSQL', 'Docker']
      };

      const combined = combinator.createCombinedEntity(companyA, companyB);

      // Should not duplicate overlapping capabilities
      const reactCount = combined.capabilities.filter(cap => cap === 'React').length;
      const postgresCount = combined.capabilities.filter(cap => cap === 'PostgreSQL').length;
      
      assert.strictEqual(reactCount, 1, 'Should not duplicate React capability');
      assert.strictEqual(postgresCount, 1, 'Should not duplicate PostgreSQL capability');
      
      // Should include unique capabilities from both
      assert.ok(combined.capabilities.includes('Vue.js'));
      assert.ok(combined.capabilities.includes('Docker'));
      assert.ok(combined.capabilities.includes('AWS'));
    });

    test('should handle companies with missing or empty capabilities', () => {
      const companyA = {
        id: 'comp_1',
        name: 'Startup Co',
        capabilities: []
      };
      
      const companyB = {
        id: 'comp_2',
        name: 'Enterprise Corp'
        // Missing capabilities property
      };

      const combined = combinator.createCombinedEntity(companyA, companyB);

      assert.ok(Array.isArray(combined.capabilities));
      assert.strictEqual(combined.capabilities.length, 0);
      assert.strictEqual(combined.id, 'comp_1+comp_2');
    });
  });

  describe('mergeCombinedCapabilities()', () => {
    test('should merge capability arrays without duplicates', () => {
      const capabilitiesA = ['Java', 'Spring', 'MySQL', 'Kubernetes'];
      const capabilitiesB = ['Python', 'Django', 'PostgreSQL', 'Kubernetes', 'Java'];

      const merged = combinator.mergeCombinedCapabilities(capabilitiesA, capabilitiesB);

      // Should contain all unique capabilities
      assert.ok(merged.includes('Java'));
      assert.ok(merged.includes('Python'));
      assert.ok(merged.includes('Spring'));
      assert.ok(merged.includes('Django'));
      assert.ok(merged.includes('MySQL'));
      assert.ok(merged.includes('PostgreSQL'));
      assert.ok(merged.includes('Kubernetes'));

      // Should not have duplicates
      const javaCount = merged.filter(cap => cap === 'Java').length;
      const kubernetesCount = merged.filter(cap => cap === 'Kubernetes').length;
      
      assert.strictEqual(javaCount, 1);
      assert.strictEqual(kubernetesCount, 1);
      
      // Total should be 7 unique capabilities
      assert.strictEqual(merged.length, 7);
    });

    test('should handle empty capability arrays', () => {
      const capabilitiesA = [];
      const capabilitiesB = ['React', 'TypeScript'];

      const merged = combinator.mergeCombinedCapabilities(capabilitiesA, capabilitiesB);

      assert.deepStrictEqual(merged, ['React', 'TypeScript']);
    });

    test('should handle both empty arrays', () => {
      const merged = combinator.mergeCombinedCapabilities([], []);
      
      assert.ok(Array.isArray(merged));
      assert.strictEqual(merged.length, 0);
    });

    test('should handle null/undefined capability arrays', () => {
      const merged = combinator.mergeCombinedCapabilities(null, undefined);
      
      assert.ok(Array.isArray(merged));
      assert.strictEqual(merged.length, 0);
    });
  });

  describe('upgradeStrength()', () => {
    test('should upgrade capability strength when companies have complementary expertise', () => {
      const companyA = {
        capabilities: ['React', 'Node.js'],
        experience: 7,
        projectCount: 25
      };
      
      const companyB = {
        capabilities: ['React', 'GraphQL'], 
        experience: 5,
        projectCount: 15
      };

      const upgradedCapabilities = combinator.upgradeStrength(
        companyA.capabilities,
        companyB.capabilities,
        companyA,
        companyB
      );

      // Should identify React as upgraded capability (both companies have it)
      assert.ok(upgradedCapabilities.some(cap => 
        cap.name === 'React' && cap.strength > 1
      ));

      // Should calculate combined strength based on experience and project count
      const reactCapability = upgradedCapabilities.find(cap => cap.name === 'React');
      assert.ok(reactCapability.strength > 1.0);
      assert.ok(reactCapability.strength <= 2.0); // Should not exceed theoretical maximum
      assert.strictEqual(reactCapability.reason, 'combined_expertise');
    });

    test('should not upgrade capabilities that only one company has', () => {
      const companyA = {
        capabilities: ['React', 'Node.js'],
        experience: 7
      };
      
      const companyB = {
        capabilities: ['Python', 'Django'],
        experience: 5
      };

      const upgradedCapabilities = combinator.upgradeStrength(
        companyA.capabilities,
        companyB.capabilities,
        companyA,
        companyB
      );

      // No overlapping capabilities, so no upgrades
      const upgradedCount = upgradedCapabilities.filter(cap => cap.strength > 1).length;
      assert.strictEqual(upgradedCount, 0);
      
      // Should still return all capabilities with base strength
      assert.strictEqual(upgradedCapabilities.length, 4);
      upgradedCapabilities.forEach(cap => {
        if (!['React', 'Node.js', 'Python', 'Django'].includes(cap.name)) {
          assert.fail(`Unexpected capability: ${cap.name}`);
        }
      });
    });

    test('should calculate strength multiplier based on combined experience', () => {
      const companyA = {
        capabilities: ['AWS'],
        experience: 10,
        projectCount: 50
      };
      
      const companyB = {
        capabilities: ['AWS'], 
        experience: 8,
        projectCount: 30
      };

      const upgradedCapabilities = combinator.upgradeStrength(
        companyA.capabilities,
        companyB.capabilities,
        companyA,
        companyB
      );

      const awsCapability = upgradedCapabilities.find(cap => cap.name === 'AWS');
      
      // High combined experience should result in significant strength boost
      assert.ok(awsCapability.strength > 1.5);
      assert.ok(awsCapability.combinedExperience >= 18);
      assert.ok(awsCapability.combinedProjects >= 80);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle companies with null/undefined properties', () => {
      const companyA = { id: 'comp_1', name: 'Test Co' };
      const companyB = null;

      const combined = combinator.createCombinedEntity(companyA, companyB);
      
      assert.strictEqual(combined.id, 'comp_1+undefined');
      assert.ok(combined.name.includes('Test Co'));
      assert.ok(Array.isArray(combined.capabilities));
    });

    test('should handle very large capability arrays efficiently', () => {
      const largeCaps = Array.from({ length: 100 }, (_, i) => `skill_${i}`);
      
      const companyA = {
        id: 'comp_1',
        name: 'Large Corp',
        capabilities: largeCaps.slice(0, 60)
      };
      
      const companyB = {
        id: 'comp_2', 
        name: 'Another Corp',
        capabilities: largeCaps.slice(40, 100) // 20 overlapping
      };

      const startTime = Date.now();
      const combined = combinator.createCombinedEntity(companyA, companyB);
      const endTime = Date.now();
      
      // Should complete within reasonable time (< 100ms)
      assert.ok(endTime - startTime < 100, 'Should handle large arrays efficiently');
      
      // Should have 100 unique capabilities (0-59 from A, 60-99 from B, 40-59 overlap)
      assert.strictEqual(combined.capabilities.length, 100);
    });
  });

  describe('Integration with Partnership Analysis', () => {
    test('should preserve partnership-relevant metadata', () => {
      const companyA = {
        id: 'comp_1',
        name: 'Frontend Specialists',
        capabilities: ['React', 'Vue.js'],
        region: 'North America',
        timezone: 'EST',
        certifications: ['ISO 9001']
      };
      
      const companyB = {
        id: 'comp_2',
        name: 'Backend Experts', 
        capabilities: ['Node.js', 'PostgreSQL'],
        region: 'Europe',
        timezone: 'CET',
        certifications: ['SOC 2']
      };

      const combined = combinator.createCombinedEntity(companyA, companyB);

      // Should preserve important partnership metadata
      assert.ok(combined.regions);
      assert.ok(combined.timezones);
      assert.ok(combined.certifications);
      
      // Should indicate geographic distribution
      assert.ok(combined.regions.includes('North America'));
      assert.ok(combined.regions.includes('Europe'));
      assert.strictEqual(combined.geographicSpread, true);
    });
  });
});