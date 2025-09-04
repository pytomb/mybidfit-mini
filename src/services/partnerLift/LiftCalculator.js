const { logger } = require('../../utils/logger');

/**
 * LiftCalculator - Calculates partnership lift metrics and improvements
 */
class LiftCalculator {
  /**
   * Calculate lift metrics from individual and combined scores
   * @param {Object} scoreA - Company A's individual score
   * @param {Object} scoreB - Company B's individual score
   * @param {Object} combinedScore - Combined entity score
   * @returns {Object} Lift analysis with metrics
   */
  calculateLift(scoreA, scoreB, combinedScore) {
    const baselineScore = Math.max(scoreA.totalScore, scoreB.totalScore);
    const liftAmount = combinedScore.totalScore - baselineScore;
    const liftPercentage = baselineScore > 0 ? (liftAmount / baselineScore) * 100 : 0;

    const analysis = {
      baseline: {
        companyA: scoreA.totalScore,
        companyB: scoreB.totalScore,
        best: baselineScore
      },
      combined: combinedScore.totalScore,
      lift: {
        absolute: liftAmount,
        percentage: liftPercentage,
        category: this.categorizeSynergy(liftPercentage)
      },
      synergy: this.calculateSynergyBreakdown(scoreA, scoreB, combinedScore),
      recommendation: this.generateLiftRecommendation(liftPercentage),
      risks: this.assessCoordinationRisk(liftPercentage)
    };

    logger.info(`Partnership lift calculated: ${liftPercentage.toFixed(1)}% (${analysis.lift.category})`);
    return analysis;
  }

  /**
   * Calculate detailed synergy breakdown by scoring component
   */
  calculateSynergyBreakdown(scoreA, scoreB, combinedScore) {
    const breakdown = {};
    
    // Technical synergies
    if (scoreA.breakdown && scoreB.breakdown && combinedScore.breakdown) {
      const components = ['technical', 'domain', 'value', 'innovation', 'relationship'];
      
      components.forEach(component => {
        const baselineComponent = Math.max(
          scoreA.breakdown[component] || 0,
          scoreB.breakdown[component] || 0
        );
        const combinedComponent = combinedScore.breakdown[component] || 0;
        const componentLift = combinedComponent - baselineComponent;
        
        breakdown[component] = {
          baseline: baselineComponent,
          combined: combinedComponent,
          lift: componentLift,
          liftPercentage: baselineComponent > 0 ? (componentLift / baselineComponent) * 100 : 0
        };
      });
    }

    return breakdown;
  }

  /**
   * Identify which requirements improved from red to green
   */
  identifyRequirementImprovements(scoreA, scoreB, combinedScore, opportunity) {
    const improvements = [];
    
    if (!opportunity.requirements) {
      return improvements;
    }

    opportunity.requirements.forEach(req => {
      const reqName = req.name || req;
      
      // Check if both individual companies failed this requirement
      const aFailed = this.requirementFailed(scoreA, reqName);
      const bFailed = this.requirementFailed(scoreB, reqName);
      
      // Check if combined entity passes
      const combinedPassed = this.requirementPassed(combinedScore, reqName);
      
      if ((aFailed && bFailed) && combinedPassed) {
        improvements.push({
          requirement: reqName,
          impact: 'critical', // Both failed individually, now passes
          reason: 'Combined capabilities address requirement gap',
          value: this.estimateRequirementValue(req)
        });
      } else if ((aFailed || bFailed) && combinedPassed) {
        improvements.push({
          requirement: reqName,
          impact: 'moderate', // One failed, now passes
          reason: 'Partnership strengthens requirement fulfillment',
          value: this.estimateRequirementValue(req)
        });
      }
    });

    return improvements.sort((a, b) => {
      const impactOrder = { 'critical': 3, 'moderate': 2, 'minor': 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  /**
   * Check if a requirement failed for a given score
   */
  requirementFailed(score, requirementName) {
    if (!score.requirements) return false;
    const req = score.requirements.find(r => r.name === requirementName);
    return req && req.status === 'failed';
  }

  /**
   * Check if a requirement passed for a given score
   */
  requirementPassed(score, requirementName) {
    if (!score.requirements) return true;
    const req = score.requirements.find(r => r.name === requirementName);
    return !req || req.status === 'passed';
  }

  /**
   * Estimate the business value of a requirement
   */
  estimateRequirementValue(requirement) {
    // Simple heuristic based on requirement properties
    if (requirement.critical) return 'high';
    if (requirement.weight && requirement.weight > 0.7) return 'high';
    if (requirement.weight && requirement.weight > 0.4) return 'medium';
    return 'low';
  }

  /**
   * Categorize synergy level
   */
  categorizeSynergy(liftPercentage) {
    if (liftPercentage > 25) return 'exceptional';
    if (liftPercentage > 15) return 'strong';
    if (liftPercentage > 5) return 'moderate';
    if (liftPercentage > 0) return 'minimal';
    return 'none';
  }

  /**
   * Assess coordination risks
   */
  assessCoordinationRisk(liftPercentage) {
    if (liftPercentage > 20) {
      return {
        level: 'high',
        factors: ['Complex integration required', 'High coordination overhead', 'Cultural alignment critical'],
        mitigation: 'Establish clear governance structure and communication protocols'
      };
    }
    
    if (liftPercentage > 10) {
      return {
        level: 'medium',
        factors: ['Moderate integration complexity', 'Regular coordination needed'],
        mitigation: 'Define clear roles and regular check-in processes'
      };
    }
    
    return {
      level: 'low',
      factors: ['Simple coordination', 'Clear value proposition'],
      mitigation: 'Standard partnership agreements sufficient'
    };
  }

  /**
   * Generate lift-based recommendation
   */
  generateLiftRecommendation(liftPercentage) {
    if (liftPercentage > 15) {
      return {
        decision: 'strongly_recommend',
        rationale: 'Significant synergies justify partnership complexity',
        priority: 'high'
      };
    }
    
    if (liftPercentage > 5) {
      return {
        decision: 'recommend',
        rationale: 'Moderate synergies provide clear value',
        priority: 'medium'
      };
    }
    
    if (liftPercentage > 0) {
      return {
        decision: 'consider',
        rationale: 'Minimal synergies, evaluate other factors',
        priority: 'low'
      };
    }
    
    return {
      decision: 'not_recommend',
      rationale: 'No measurable synergies detected',
      priority: 'none'
    };
  }
}

module.exports = { LiftCalculator };