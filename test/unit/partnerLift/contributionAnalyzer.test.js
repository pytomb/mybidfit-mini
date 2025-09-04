const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { ContributionAnalyzer } = require('../../../src/services/partnerLift/ContributionAnalyzer');

describe('ContributionAnalyzer - Partner Lift Module', () => {
  let analyzer;
  
  beforeEach(() => {
    analyzer = new ContributionAnalyzer();
  });

  describe('calculateShapleyValues()', () => {
    test('should calculate fair contribution using Shapley value formula', () => {
      const scoreA = { totalScore: 60 };
      const scoreB = { totalScore: 70 };
      const combinedScore = { totalScore: 150 };

      const shapleyResult = analyzer.calculateShapleyValues(scoreA, scoreB, combinedScore);

      // Shapley formula: φ_i(v) = v({i}) + 0.5 * [v({1,2}) - v({1}) - v({2})]
      // For A: 60 + 0.5 * (150 - 60 - 70) = 60 + 0.5 * 20 = 70
      // For B: 70 + 0.5 * (150 - 60 - 70) = 70 + 0.5 * 20 = 80
      
      assert.strictEqual(shapleyResult.contributionA, 70);
      assert.strictEqual(shapleyResult.contributionB, 80);
      assert.strictEqual(shapleyResult.synergy, 20); // 150 - 60 - 70
      assert.strictEqual(shapleyResult.totalContribution, 150); // Should equal combined score
      
      // Verify percentages
      assert.strictEqual(shapleyResult.contributionPercentageA, 46.67); // 70/150 * 100
      assert.strictEqual(shapleyResult.contributionPercentageB, 53.33); // 80/150 * 100
    });

    test('should handle cases with no synergy (additive partnership)', () => {
      const scoreA = { totalScore: 50 };
      const scoreB = { totalScore: 40 };
      const combinedScore = { totalScore: 90 }; // Exactly sum of individual scores

      const shapleyResult = analyzer.calculateShapleyValues(scoreA, scoreB, combinedScore);

      assert.strictEqual(shapleyResult.synergy, 0); // 90 - 50 - 40 = 0
      assert.strictEqual(shapleyResult.contributionA, 50); // No synergy to distribute
      assert.strictEqual(shapleyResult.contributionB, 40);
      assert.strictEqual(shapleyResult.synergyDistributionA, 0);
      assert.strictEqual(shapleyResult.synergyDistributionB, 0);
    });

    test('should handle negative synergy (partnership interference)', () => {
      const scoreA = { totalScore: 80 };
      const scoreB = { totalScore: 75 };
      const combinedScore = { totalScore: 140 }; // Less than sum (155)

      const shapleyResult = analyzer.calculateShapleyValues(scoreA, scoreB, combinedScore);

      assert.strictEqual(shapleyResult.synergy, -15); // 140 - 80 - 75 = -15
      assert.strictEqual(shapleyResult.contributionA, 72.5); // 80 + (-15)/2
      assert.strictEqual(shapleyResult.contributionB, 67.5); // 75 + (-15)/2
      assert.strictEqual(shapleyResult.synergyDistributionA, -7.5);
      assert.strictEqual(shapleyResult.synergyDistributionB, -7.5);
      assert.strictEqual(shapleyResult.hasNegativeSynergy, true);
    });

    test('should maintain proportional contribution when one company dominates', () => {
      const dominantCompany = { totalScore: 90 };
      const smallerCompany = { totalScore: 20 };
      const combinedScore = { totalScore: 130 };

      const shapleyResult = analyzer.calculateShapleyValues(dominantCompany, smallerCompany, combinedScore);

      // Synergy: 130 - 90 - 20 = 20
      // Dominant: 90 + 10 = 100, Smaller: 20 + 10 = 30
      assert.strictEqual(shapleyResult.contributionA, 100);
      assert.strictEqual(shapleyResult.contributionB, 30);
      
      // Dominant company should get higher percentage but not all synergy
      assert.strictEqual(shapleyResult.contributionPercentageA, 76.92); // 100/130 * 100
      assert.strictEqual(shapleyResult.contributionPercentageB, 23.08); // 30/130 * 100
      assert.strictEqual(shapleyResult.synergyDistributionA, 10); // Equal synergy split
      assert.strictEqual(shapleyResult.synergyDistributionB, 10);
    });
  });

  describe('analyzeContributionFairness()', () => {
    test('should identify fair contribution splits', () => {
      const contribution = {
        contributionA: 75,
        contributionB: 75,
        contributionPercentageA: 50,
        contributionPercentageB: 50,
        synergy: 20
      };
      
      const companyA = { totalScore: 65 };
      const companyB = { totalScore: 65 };

      const fairnessAnalysis = analyzer.analyzeContributionFairness(contribution, companyA, companyB);

      assert.strictEqual(fairnessAnalysis.fairnessScore, 100); // Perfect fairness
      assert.strictEqual(fairnessAnalysis.imbalanceLevel, 'none');
      assert.strictEqual(fairnessAnalysis.recommendedSplit, '50/50');
      assert.strictEqual(fairnessAnalysis.synergySharing, 'equal');
    });

    test('should identify moderate contribution imbalances', () => {
      const contribution = {
        contributionA: 90,
        contributionB: 60,
        contributionPercentageA: 60,
        contributionPercentageB: 40,
        synergy: 15
      };
      
      const companyA = { totalScore: 82.5 }; // Slightly higher base
      const companyB = { totalScore: 67.5 };

      const fairnessAnalysis = analyzer.analyzeContributionFairness(contribution, companyA, companyB);

      assert.strictEqual(fairnessAnalysis.imbalanceLevel, 'moderate');
      assert.ok(fairnessAnalysis.fairnessScore >= 70 && fairnessAnalysis.fairnessScore <= 85);
      assert.ok(fairnessAnalysis.recommendations.includes('Consider adjusting revenue sharing'));
    });

    test('should flag significant contribution imbalances', () => {
      const contribution = {
        contributionA: 120,
        contributionB: 30,
        contributionPercentageA: 80,
        contributionPercentageB: 20,
        synergy: 10
      };
      
      const companyA = { totalScore: 115 };
      const companyB = { totalScore: 25 };

      const fairnessAnalysis = analyzer.analyzeContributionFairness(contribution, companyA, companyB);

      assert.strictEqual(fairnessAnalysis.imbalanceLevel, 'significant');
      assert.ok(fairnessAnalysis.fairnessScore < 60);
      assert.ok(fairnessAnalysis.concerns.includes('Major contribution imbalance detected'));
      assert.ok(fairnessAnalysis.recommendations.includes('Consider role-based partnership structure'));
    });
  });

  describe('calculateDetailedContributions()', () => {
    test('should break down contributions by capability areas', () => {
      const scoreA = {
        totalScore: 70,
        requirementScores: {
          'Frontend Development': 9,
          'Backend Development': 6,
          'DevOps': 7
        }
      };

      const scoreB = {
        totalScore: 80,
        requirementScores: {
          'Frontend Development': 7,
          'Backend Development': 9,
          'DevOps': 8
        }
      };

      const combinedScore = {
        totalScore: 170,
        requirementScores: {
          'Frontend Development': 9.5,
          'Backend Development': 9.2,
          'DevOps': 8.5
        }
      };

      const detailedContributions = analyzer.calculateDetailedContributions(scoreA, scoreB, combinedScore);

      // Should identify Company A's strength in Frontend
      const frontendContrib = detailedContributions.byRequirement['Frontend Development'];
      assert.ok(frontendContrib.primaryContributor === 'A');
      assert.strictEqual(frontendContrib.contributionA, 9);
      assert.ok(frontendContrib.improvementFromPartnership > 0);

      // Should identify Company B's strength in Backend
      const backendContrib = detailedContributions.byRequirement['Backend Development'];
      assert.ok(backendContrib.primaryContributor === 'B');
      assert.strictEqual(backendContrib.contributionB, 9);
    });

    test('should calculate synergy contributions by requirement area', () => {
      const scoreA = { totalScore: 60, requirementScores: { 'Security': 8, 'Performance': 6 } };
      const scoreB = { totalScore: 70, requirementScores: { 'Security': 7, 'Performance': 9 } };
      const combinedScore = { totalScore: 145, requirementScores: { 'Security': 9, 'Performance': 9.5 } };

      const detailedContributions = analyzer.calculateDetailedContributions(scoreA, scoreB, combinedScore);

      // Total synergy: 145 - 60 - 70 = 15
      assert.strictEqual(detailedContributions.totalSynergy, 15);
      
      // Should distribute synergy across requirement areas
      const securitySynergy = detailedContributions.synergyByRequirement['Security'];
      const performanceSynergy = detailedContributions.synergyByRequirement['Performance'];
      
      assert.ok(securitySynergy > 0);
      assert.ok(performanceSynergy > 0);
      assert.strictEqual(securitySynergy + performanceSynergy, 15);
    });
  });

  describe('Revenue and Profit Sharing Calculations', () => {
    test('should suggest revenue sharing based on contributions', () => {
      const contribution = {
        contributionA: 80,
        contributionB: 70,
        contributionPercentageA: 53.33,
        contributionPercentageB: 46.67,
        synergy: 20
      };

      const revenueSharing = analyzer.calculateRevenueSharing(contribution, 1000000); // $1M project

      assert.strictEqual(revenueSharing.totalRevenue, 1000000);
      assert.strictEqual(revenueSharing.revenueA, 533300); // 53.33% of $1M
      assert.strictEqual(revenueSharing.revenueB, 466700); // 46.67% of $1M
      
      // Should include synergy bonus distribution
      assert.strictEqual(revenueSharing.synergyBonusA, 100000); // 50% of synergy value
      assert.strictEqual(revenueSharing.synergyBonusB, 100000);
      assert.strictEqual(revenueSharing.basedOn, 'shapley_contribution');
    });

    test('should handle alternative sharing models', () => {
      const contribution = {
        contributionA: 90,
        contributionB: 60,
        contributionPercentageA: 60,
        contributionPercentageB: 40
      };

      const equalSharing = analyzer.calculateRevenueSharing(contribution, 1000000, { model: 'equal' });
      assert.strictEqual(equalSharing.revenueA, 500000); // 50/50 split
      assert.strictEqual(equalSharing.revenueB, 500000);

      const effortBased = analyzer.calculateRevenueSharing(contribution, 1000000, { 
        model: 'effort_based', 
        effortA: 60, 
        effortB: 40 
      });
      assert.strictEqual(effortBased.revenueA, 600000); // 60/40 split
      assert.strictEqual(effortBased.revenueB, 400000);
    });
  });

  describe('Game Theory and Nash Equilibrium', () => {
    test('should identify stable partnership configurations', () => {
      const gameTheoryAnalysis = analyzer.analyzeGameTheoryStability({
        contributionA: 75,
        contributionB: 75,
        synergy: 20,
        outsideOptionA: 60, // What A could get alone
        outsideOptionB: 65  // What B could get alone
      });

      // Both companies benefit from partnership vs going alone
      assert.strictEqual(gameTheoryAnalysis.stabilityIndex, 100);
      assert.strictEqual(gameTheoryAnalysis.nashEquilibrium, true);
      assert.ok(gameTheoryAnalysis.incentiveA > 0); // 75 - 60 = 15
      assert.ok(gameTheoryAnalysis.incentiveB > 0); // 75 - 65 = 10
      assert.strictEqual(gameTheoryAnalysis.recommendAction, 'proceed_with_partnership');
    });

    test('should identify unstable partnership scenarios', () => {
      const unstableScenario = analyzer.analyzeGameTheoryStability({
        contributionA: 55, // Lower than outside option
        contributionB: 85,
        synergy: 10,
        outsideOptionA: 70,
        outsideOptionB: 75
      });

      assert.ok(unstableScenario.stabilityIndex < 50);
      assert.strictEqual(unstableScenario.nashEquilibrium, false);
      assert.ok(unstableScenario.incentiveA < 0); // Company A better off alone
      assert.ok(unstableScenario.riskFactors.includes('Company A has better outside option'));
      assert.strictEqual(unstableScenario.recommendAction, 'restructure_or_abandon');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle zero or negative total scores', () => {
      const scoreA = { totalScore: 0 };
      const scoreB = { totalScore: 50 };
      const combinedScore = { totalScore: 60 };

      const shapleyResult = analyzer.calculateShapleyValues(scoreA, scoreB, combinedScore);

      assert.strictEqual(shapleyResult.contributionA, 5); // 0 + 10/2
      assert.strictEqual(shapleyResult.contributionB, 55); // 50 + 10/2
      assert.strictEqual(shapleyResult.synergy, 10);
      assert.ok(shapleyResult.isValid);
    });

    test('should validate input parameters', () => {
      assert.throws(() => {
        analyzer.calculateShapleyValues(null, null, null);
      }, /Invalid score parameters for Shapley calculation/);
    });

    test('should handle floating point precision in calculations', () => {
      const scoreA = { totalScore: 33.33 };
      const scoreB = { totalScore: 66.67 };
      const combinedScore = { totalScore: 100.01 };

      const shapleyResult = analyzer.calculateShapleyValues(scoreA, scoreB, combinedScore);
      
      // Should round to reasonable precision
      assert.ok(Math.abs(shapleyResult.contributionA + shapleyResult.contributionB - 100.01) < 0.01);
      assert.ok(shapleyResult.synergy > 0);
    });
  });

  describe('Real-World Partnership Scenarios', () => {
    test('should analyze typical tech startup partnership', () => {
      // Frontend startup (strong design, weak backend) + Backend startup (strong infrastructure, weak UI)
      const frontendStartup = { totalScore: 65 };
      const backendStartup = { totalScore: 70 };
      const combinedFullStack = { totalScore: 155 }; // Strong synergy

      const shapleyResult = analyzer.calculateShapleyValues(frontendStartup, backendStartup, combinedFullStack);

      assert.strictEqual(shapleyResult.synergy, 20); // 155 - 65 - 70
      assert.strictEqual(shapleyResult.contributionA, 75); // 65 + 10
      assert.strictEqual(shapleyResult.contributionB, 80); // 70 + 10
      
      // Fair distribution despite different base strengths
      const fairnessAnalysis = analyzer.analyzeContributionFairness(shapleyResult, frontendStartup, backendStartup);
      assert.ok(fairnessAnalysis.fairnessScore > 80); // Should be considered fair
    });

    test('should analyze enterprise consulting partnership', () => {
      // Large consulting firm + Specialized boutique
      const largeFirm = { totalScore: 85 };
      const boutique = { totalScore: 40 };
      const combinedEnterprise = { totalScore: 140 }; // Brand + expertise synergy

      const shapleyResult = analyzer.calculateShapleyValues(largeFirm, boutique, combinedEnterprise);
      
      assert.strictEqual(shapleyResult.synergy, 15); // 140 - 85 - 40
      assert.strictEqual(shapleyResult.contributionA, 92.5); // 85 + 7.5
      assert.strictEqual(shapleyResult.contributionB, 47.5); // 40 + 7.5
      
      // Should reflect reality of unequal partnership
      assert.strictEqual(shapleyResult.contributionPercentageA, 66.07);
      assert.strictEqual(shapleyResult.contributionPercentageB, 33.93);
    });
  });
});