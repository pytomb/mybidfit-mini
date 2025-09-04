const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { LiftCalculator } = require('../../../src/services/partnerLift/LiftCalculator');

describe('LiftCalculator - Partner Lift Module', () => {
  let calculator;
  
  beforeEach(() => {
    calculator = new LiftCalculator();
  });

  describe('calculateLift()', () => {
    test('should calculate positive lift when partnership improves scores', () => {
      const scoreA = { totalScore: 75 };
      const scoreB = { totalScore: 80 };
      const combinedScore = { totalScore: 95 };

      const liftResult = calculator.calculateLift(scoreA, scoreB, combinedScore);

      // Combined score (95) vs best individual (80) = 15 point lift
      assert.strictEqual(liftResult.liftAmount, 15);
      assert.strictEqual(liftResult.liftPercentage, 18.75); // 15/80 * 100
      assert.strictEqual(liftResult.baselineScore, 80);
      assert.strictEqual(liftResult.combinedScore, 95);
      assert.strictEqual(liftResult.isPositiveLift, true);
    });

    test('should calculate negative lift when partnership decreases performance', () => {
      const scoreA = { totalScore: 85 };
      const scoreB = { totalScore: 75 };
      const combinedScore = { totalScore: 80 };

      const liftResult = calculator.calculateLift(scoreA, scoreB, combinedScore);

      // Combined score (80) vs best individual (85) = -5 point lift
      assert.strictEqual(liftResult.liftAmount, -5);
      assert.strictEqual(liftResult.liftPercentage, -5.88); // -5/85 * 100, rounded
      assert.strictEqual(liftResult.baselineScore, 85);
      assert.strictEqual(liftResult.isPositiveLift, false);
    });

    test('should handle zero baseline score edge case', () => {
      const scoreA = { totalScore: 0 };
      const scoreB = { totalScore: 0 };
      const combinedScore = { totalScore: 50 };

      const liftResult = calculator.calculateLift(scoreA, scoreB, combinedScore);

      assert.strictEqual(liftResult.liftAmount, 50);
      assert.strictEqual(liftResult.liftPercentage, 0); // Avoid division by zero
      assert.strictEqual(liftResult.baselineScore, 0);
      assert.strictEqual(liftResult.isPositiveLift, true);
    });

    test('should use higher individual score as baseline', () => {
      const scoreA = { totalScore: 60 };
      const scoreB = { totalScore: 90 };
      const combinedScore = { totalScore: 95 };

      const liftResult = calculator.calculateLift(scoreA, scoreB, combinedScore);

      // Should use scoreB (90) as baseline, not scoreA (60)
      assert.strictEqual(liftResult.baselineScore, 90);
      assert.strictEqual(liftResult.liftAmount, 5);
    });
  });

  describe('identifyRequirementImprovements()', () => {
    test('should identify specific requirement improvements from partnership', () => {
      const opportunityRequirements = [
        { requirement: 'React Development', weight: 0.3, minScore: 7 },
        { requirement: 'Cloud Infrastructure', weight: 0.2, minScore: 8 },
        { requirement: 'Database Design', weight: 0.25, minScore: 6 },
        { requirement: 'Security Compliance', weight: 0.25, minScore: 9 }
      ];

      const scoreA = {
        requirementScores: {
          'React Development': 8,
          'Cloud Infrastructure': 6,
          'Database Design': 7,
          'Security Compliance': 5
        }
      };

      const scoreB = {
        requirementScores: {
          'React Development': 6,
          'Cloud Infrastructure': 9,
          'Database Design': 8,
          'Security Compliance': 10
        }
      };

      const combinedScore = {
        requirementScores: {
          'React Development': 9,
          'Cloud Infrastructure': 9.5,
          'Database Design': 8.5,
          'Security Compliance': 10
        }
      };

      const improvements = calculator.identifyRequirementImprovements(
        opportunityRequirements,
        scoreA,
        scoreB,
        combinedScore
      );

      // Should identify improvements in all categories
      assert.strictEqual(improvements.length, 4);

      // Check React Development improvement
      const reactImprovement = improvements.find(imp => imp.requirement === 'React Development');
      assert.strictEqual(reactImprovement.bestIndividual, 8); // Company A
      assert.strictEqual(reactImprovement.combinedScore, 9);
      assert.strictEqual(reactImprovement.improvement, 1);
      assert.strictEqual(reactImprovement.improvementPercentage, 12.5);

      // Check Cloud Infrastructure improvement (largest improvement)
      const cloudImprovement = improvements.find(imp => imp.requirement === 'Cloud Infrastructure');
      assert.strictEqual(cloudImprovement.bestIndividual, 9); // Company B
      assert.strictEqual(cloudImprovement.combinedScore, 9.5);
      assert.strictEqual(cloudImprovement.improvement, 0.5);
    });

    test('should handle requirements where partnership provides no improvement', () => {
      const opportunityRequirements = [
        { requirement: 'Project Management', weight: 0.5, minScore: 7 }
      ];

      const scoreA = {
        requirementScores: { 'Project Management': 9 }
      };

      const scoreB = {
        requirementScores: { 'Project Management': 7 }
      };

      const combinedScore = {
        requirementScores: { 'Project Management': 8 }
      };

      const improvements = calculator.identifyRequirementImprovements(
        opportunityRequirements,
        scoreA,
        scoreB,
        combinedScore
      );

      const pmImprovement = improvements.find(imp => imp.requirement === 'Project Management');
      
      // Combined score (8) is worse than best individual (9) = negative improvement
      assert.strictEqual(pmImprovement.improvement, -1);
      assert.strictEqual(pmImprovement.improvementPercentage, -11.11);
      assert.strictEqual(pmImprovement.isImprovement, false);
    });

    test('should calculate weighted impact on overall opportunity score', () => {
      const opportunityRequirements = [
        { requirement: 'Frontend Development', weight: 0.4, minScore: 7 },
        { requirement: 'Backend Development', weight: 0.6, minScore: 8 }
      ];

      const scoreA = { requirementScores: { 'Frontend Development': 9, 'Backend Development': 6 } };
      const scoreB = { requirementScores: { 'Frontend Development': 7, 'Backend Development': 9 } };
      const combinedScore = { requirementScores: { 'Frontend Development': 9.5, 'Backend Development': 9.2 } };

      const improvements = calculator.identifyRequirementImprovements(
        opportunityRequirements,
        scoreA,
        scoreB,
        combinedScore
      );

      // Backend improvement should have higher weighted impact (0.6 vs 0.4)
      const backendImprovement = improvements.find(imp => imp.requirement === 'Backend Development');
      const frontendImprovement = improvements.find(imp => imp.requirement === 'Frontend Development');

      assert.ok(backendImprovement.weightedImpact > frontendImprovement.weightedImpact);
      
      // Total weighted impact should be positive
      const totalWeightedImpact = improvements.reduce((sum, imp) => sum + imp.weightedImpact, 0);
      assert.ok(totalWeightedImpact > 0);
    });
  });

  describe('categorizeSynergy()', () => {
    test('should categorize complementary synergy when companies fill gaps', () => {
      const improvements = [
        { requirement: 'Frontend', improvement: 2, bestIndividualProvider: 'A' },
        { requirement: 'Backend', improvement: 3, bestIndividualProvider: 'B' },
        { requirement: 'DevOps', improvement: 1.5, bestIndividualProvider: 'A' }
      ];

      const synergy = calculator.categorizeSynergy(improvements);

      assert.strictEqual(synergy.type, 'complementary');
      assert.ok(synergy.description.includes('fill gaps'));
      assert.strictEqual(synergy.strength, 'strong'); // High average improvement
      
      // Should identify key synergy areas
      assert.ok(synergy.keyAreas.includes('Backend'));
      assert.ok(synergy.keyAreas.includes('Frontend'));
    });

    test('should categorize additive synergy when both companies are strong', () => {
      const improvements = [
        { requirement: 'Software Development', improvement: 0.8, bestIndividualProvider: 'A' },
        { requirement: 'Quality Assurance', improvement: 0.6, bestIndividualProvider: 'B' },
        { requirement: 'Documentation', improvement: 0.4, bestIndividualProvider: 'A' }
      ];

      const synergy = calculator.categorizeSynergy(improvements);

      assert.strictEqual(synergy.type, 'additive');
      assert.strictEqual(synergy.strength, 'moderate'); // Moderate improvements
      assert.ok(synergy.description.includes('incremental'));
    });

    test('should categorize minimal synergy for low improvements', () => {
      const improvements = [
        { requirement: 'Basic Coding', improvement: 0.1, bestIndividualProvider: 'A' },
        { requirement: 'Communication', improvement: 0.2, bestIndividualProvider: 'B' }
      ];

      const synergy = calculator.categorizeSynergy(improvements);

      assert.strictEqual(synergy.type, 'minimal');
      assert.strictEqual(synergy.strength, 'weak');
      assert.ok(synergy.description.includes('limited'));
      assert.ok(synergy.keyAreas.length === 0); // No significant areas
    });

    test('should handle negative synergy (partnership degrades performance)', () => {
      const improvements = [
        { requirement: 'Team Coordination', improvement: -1.5, bestIndividualProvider: 'A' },
        { requirement: 'Project Management', improvement: -0.8, bestIndividualProvider: 'B' }
      ];

      const synergy = calculator.categorizeSynergy(improvements);

      assert.strictEqual(synergy.type, 'negative');
      assert.ok(synergy.description.includes('coordination challenges'));
      assert.ok(synergy.concerns.length > 0);
      assert.ok(synergy.concerns.includes('Team Coordination'));
    });
  });

  describe('Partnership Lift Scenarios', () => {
    test('should calculate lift for ideal complementary partnership', () => {
      // Frontend specialist + Backend specialist = Full-stack capability
      const frontendCompany = { totalScore: 70 };
      const backendCompany = { totalScore: 75 };
      const fullStackCombined = { totalScore: 95 };

      const liftResult = calculator.calculateLift(frontendCompany, backendCompany, fullStackCombined);

      assert.strictEqual(liftResult.liftAmount, 20); // 95 - 75
      assert.strictEqual(liftResult.liftPercentage, 26.67); // 20/75 * 100
      assert.strictEqual(liftResult.isPositiveLift, true);
      assert.strictEqual(liftResult.liftCategory, 'significant'); // > 20%
    });

    test('should identify coordination overhead in complex partnerships', () => {
      // Two large companies with overlapping capabilities
      const largeCompanyA = { totalScore: 90 };
      const largeCompanyB = { totalScore: 88 };
      const combinedOverhead = { totalScore: 85 }; // Coordination reduces effectiveness

      const liftResult = calculator.calculateLift(largeCompanyA, largeCompanyB, combinedOverhead);

      assert.strictEqual(liftResult.liftAmount, -5); // 85 - 90
      assert.strictEqual(liftResult.isPositiveLift, false);
      assert.strictEqual(liftResult.liftCategory, 'negative');
      assert.ok(liftResult.concerns.includes('coordination_overhead'));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing score properties gracefully', () => {
      const incompleteScoreA = { someOtherProperty: 'value' };
      const incompleteScoreB = null;
      const combinedScore = { totalScore: 50 };

      const liftResult = calculator.calculateLift(incompleteScoreA, incompleteScoreB, combinedScore);

      assert.strictEqual(liftResult.baselineScore, 0);
      assert.strictEqual(liftResult.liftAmount, 50);
      assert.strictEqual(liftResult.isValid, true);
    });

    test('should validate input parameters', () => {
      assert.throws(() => {
        calculator.calculateLift(null, null, null);
      }, /Invalid score parameters/);
    });

    test('should handle very small score differences with precision', () => {
      const scoreA = { totalScore: 75.001 };
      const scoreB = { totalScore: 75.002 };
      const combinedScore = { totalScore: 75.003 };

      const liftResult = calculator.calculateLift(scoreA, scoreB, combinedScore);

      assert.strictEqual(liftResult.liftAmount, 0.001); // Should maintain precision
      assert.ok(liftResult.liftPercentage < 0.01); // Very small percentage
    });
  });
});