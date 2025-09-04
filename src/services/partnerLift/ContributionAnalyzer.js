const { logger } = require('../../utils/logger');

/**
 * ContributionAnalyzer - Calculates individual company contributions using
 * Shapley values and identifies key contribution factors
 */
class ContributionAnalyzer {
  /**
   * Calculate Shapley values for fair contribution attribution
   * @param {Object} scoreA - Company A's individual score
   * @param {Object} scoreB - Company B's individual score
   * @param {Object} combinedScore - Combined entity score
   * @returns {Object} Contribution analysis with Shapley values
   */
  calculateShapleyValues(scoreA, scoreB, combinedScore) {
    // Input validation
    if (!scoreA || !scoreB || !combinedScore) {
      throw new Error('Invalid score parameters for Shapley calculation: Missing required parameters');
    }
    
    if (scoreA.totalScore === undefined || scoreB.totalScore === undefined || combinedScore.totalScore === undefined) {
      throw new Error('Invalid score parameters for Shapley calculation: Missing totalScore property');
    }
    
    // Shapley value formula for 2-player coalition
    // φ_i(v) = v({i}) + 0.5 * [v({1,2}) - v({1}) - v({2})]
    
    const totalValue = combinedScore.totalScore;
    const valueA = scoreA.totalScore;
    const valueB = scoreB.totalScore;
    const synergy = totalValue - valueA - valueB;

    // Calculate Shapley values
    const contributionA = valueA + (synergy / 2);
    const contributionB = valueB + (synergy / 2);
    
    const contributions = {
      // Primary interface (expected by tests)
      contributionA: contributionA,
      contributionB: contributionB,
      synergy: synergy,
      totalContribution: totalValue,
      contributionPercentageA: totalValue > 0 ? parseFloat(((contributionA / totalValue) * 100).toFixed(2)) : 50,
      contributionPercentageB: totalValue > 0 ? parseFloat(((contributionB / totalValue) * 100).toFixed(2)) : 50,
      synergyDistributionA: synergy / 2,
      synergyDistributionB: synergy / 2,
      hasNegativeSynergy: synergy < 0,
      
      // Legacy structure (for backwards compatibility if needed)
      companyA: {
        individual: valueA,
        shapleyValue: contributionA,
        percentage: totalValue > 0 ? parseFloat(((contributionA / totalValue) * 100).toFixed(2)) : 50
      },
      companyB: {
        individual: valueB,
        shapleyValue: contributionB,
        percentage: totalValue > 0 ? parseFloat(((contributionB / totalValue) * 100).toFixed(2)) : 50
      },
      fairness: this.assessContributionFairness(valueA, valueB, synergy)
    };

    logger.debug(`Shapley values calculated - A: ${contributions.contributionPercentageA}%, B: ${contributions.contributionPercentageB}%`);
    return contributions;
  }

  /**
   * Identify key contributions from each company
   */
  identifyKeyContributions(individualScore, combinedScore, company) {
    const contributions = [];

    // Capability contributions
    if (company.capabilities) {
      company.capabilities.forEach(capability => {
        const impact = this.assessCapabilityImpact(capability, individualScore, combinedScore);
        if (impact.level !== 'none') {
          contributions.push({
            type: 'capability',
            name: capability.name || capability,
            impact: impact.level,
            description: impact.description,
            value: impact.value
          });
        }
      });
    }

    // Certification contributions
    if (company.certifications) {
      company.certifications.forEach(cert => {
        const impact = this.assessCertificationImpact(cert, individualScore, combinedScore);
        if (impact.level !== 'none') {
          contributions.push({
            type: 'certification',
            name: cert,
            impact: impact.level,
            description: impact.description,
            value: impact.value
          });
        }
      });
    }

    // Experience contributions
    if (company.years_in_business > 5) {
      contributions.push({
        type: 'experience',
        name: 'Industry Experience',
        impact: this.categorizeExperience(company.years_in_business),
        description: `${company.years_in_business} years of industry experience`,
        value: Math.min(company.years_in_business / 20, 1) * 10 // Max 10 points
      });
    }

    // Size/scale contributions
    if (company.size_category) {
      const sizeImpact = this.assessSizeImpact(company.size_category);
      if (sizeImpact.level !== 'none') {
        contributions.push({
          type: 'scale',
          name: 'Company Scale',
          impact: sizeImpact.level,
          description: sizeImpact.description,
          value: sizeImpact.value
        });
      }
    }

    return contributions.sort((a, b) => b.value - a.value);
  }

  /**
   * Assess the impact of a specific capability
   */
  assessCapabilityImpact(capability, individualScore, combinedScore) {
    // This is a simplified assessment - in practice, you'd analyze how this
    // capability affects the scoring breakdown
    const capabilityName = capability.name || capability;
    const strength = capability.strength || 'medium';
    
    const strengthValues = {
      'low': 2,
      'medium': 4,
      'high': 7,
      'expert': 10
    };

    const value = strengthValues[strength] || 4;

    return {
      level: strength === 'expert' ? 'high' : strength === 'high' ? 'medium' : 'low',
      description: `${strength.charAt(0).toUpperCase() + strength.slice(1)} expertise in ${capabilityName}`,
      value: value
    };
  }

  /**
   * Assess the impact of a certification
   */
  assessCertificationImpact(certification, individualScore, combinedScore) {
    // High-value certifications
    const highValueCerts = ['SOC 2', 'ISO 27001', 'PCI DSS', 'HIPAA', 'FedRAMP'];
    const mediumValueCerts = ['ISO 9001', 'CMMI', 'AWS Certified', 'Microsoft Partner'];

    if (highValueCerts.some(cert => certification.includes(cert))) {
      return {
        level: 'high',
        description: `Critical compliance certification: ${certification}`,
        value: 8
      };
    }

    if (mediumValueCerts.some(cert => certification.includes(cert))) {
      return {
        level: 'medium',
        description: `Valuable industry certification: ${certification}`,
        value: 5
      };
    }

    return {
      level: 'low',
      description: `Professional certification: ${certification}`,
      value: 2
    };
  }

  /**
   * Categorize experience level
   */
  categorizeExperience(years) {
    if (years > 15) return 'high';
    if (years > 8) return 'medium';
    if (years > 3) return 'low';
    return 'minimal';
  }

  /**
   * Assess company size impact
   */
  assessSizeImpact(sizeCategory) {
    const sizeImpacts = {
      'startup': { level: 'low', description: 'Agility and innovation focus', value: 3 },
      'small': { level: 'low', description: 'Specialized expertise', value: 4 },
      'medium': { level: 'medium', description: 'Balanced capabilities and scale', value: 6 },
      'large': { level: 'high', description: 'Extensive resources and reach', value: 8 },
      'enterprise': { level: 'high', description: 'Market leadership and scale', value: 10 }
    };

    return sizeImpacts[sizeCategory] || { level: 'none', description: '', value: 0 };
  }

  /**
   * Assess fairness of contribution distribution
   */
  assessContributionFairness(valueA, valueB, synergy) {
    const total = valueA + valueB + synergy;
    if (total === 0) return 'balanced';

    const contributionRatio = valueA / valueB;
    
    if (contributionRatio > 3 || contributionRatio < 0.33) {
      return 'unbalanced';
    } else if (contributionRatio > 2 || contributionRatio < 0.5) {
      return 'skewed';
    } else {
      return 'balanced';
    }
  }

  /**
   * Analyze contribution fairness (expected by tests)
   * @param {Object} contribution - Contribution analysis result
   * @param {Object} companyA - Company A data
   * @param {Object} companyB - Company B data
   * @returns {Object} Fairness analysis
   */
  analyzeContributionFairness(contribution, companyA, companyB) {
    // Calculate fairness based on percentage difference
    const percentageDiff = Math.abs(contribution.contributionPercentageA - contribution.contributionPercentageB);
    
    let fairnessScore = 100 - percentageDiff * 2; // Scale so 50/50 = 100, 40/60 = 80, etc.
    fairnessScore = Math.max(0, Math.min(100, fairnessScore));
    
    let imbalanceLevel = 'none';
    if (percentageDiff > 25) imbalanceLevel = 'high';
    else if (percentageDiff > 15) imbalanceLevel = 'moderate';
    else if (percentageDiff > 5) imbalanceLevel = 'low';
    
    const recommendedSplit = `${Math.round(contribution.contributionPercentageA)}/${Math.round(contribution.contributionPercentageB)}`;
    
    return {
      fairnessScore: Math.round(fairnessScore),
      imbalanceLevel,
      recommendedSplit,
      synergySharing: contribution.synergyDistributionA === contribution.synergyDistributionB ? 'equal' : 'weighted',
      contributionBalance: percentageDiff < 10 ? 'good' : percentageDiff < 20 ? 'acceptable' : 'poor'
    };
  }

  /**
   * Calculate detailed contributions by capability areas
   * @param {Object} scoreA - Company A scores
   * @param {Object} scoreB - Company B scores
   * @param {Object} combinedScore - Combined entity scores
   * @returns {Object} Detailed contribution analysis
   */
  calculateDetailedContributions(scoreA, scoreB, combinedScore) {
    const contributions = {};
    
    if (scoreA.requirementScores && scoreB.requirementScores && combinedScore.requirementScores) {
      // Analyze each capability area
      const capabilities = Object.keys(scoreA.requirementScores);
      
      capabilities.forEach(capability => {
        const scoreAValue = scoreA.requirementScores[capability] || 0;
        const scoreBValue = scoreB.requirementScores[capability] || 0;
        const combinedValue = combinedScore.requirementScores[capability] || 0;
        
        const synergy = combinedValue - scoreAValue - scoreBValue;
        const contributionA = scoreAValue + (synergy / 2);
        const contributionB = scoreBValue + (synergy / 2);
        
        contributions[capability] = {
          companyA: {
            individualScore: scoreAValue,
            contribution: contributionA,
            percentage: combinedValue > 0 ? (contributionA / combinedValue) * 100 : 50
          },
          companyB: {
            individualScore: scoreBValue,
            contribution: contributionB,
            percentage: combinedValue > 0 ? (contributionB / combinedValue) * 100 : 50
          },
          synergy: synergy,
          totalScore: combinedValue,
          strengths: this.identifyCapabilityStrengths(scoreAValue, scoreBValue, synergy)
        };
      });
    }
    
    return {
      byCapability: contributions,
      overallAnalysis: {
        mostSynergistic: this.findMostSynergiticCapability(contributions),
        leastSynergistic: this.findLeastSynergiticCapability(contributions),
        companyAStrengths: this.identifyCompanyStrengths(contributions, 'A'),
        companyBStrengths: this.identifyCompanyStrengths(contributions, 'B')
      }
    };
  }

  /**
   * Helper method to identify capability strengths
   */
  identifyCapabilityStrengths(scoreA, scoreB, synergy) {
    if (synergy > 2) return 'highly_complementary';
    if (synergy > 0) return 'complementary';
    if (synergy === 0) return 'additive';
    return 'interfering';
  }

  /**
   * Find the most synergistic capability
   */
  findMostSynergiticCapability(contributions) {
    let maxSynergy = -Infinity;
    let mostSynergistic = null;
    
    Object.entries(contributions).forEach(([capability, data]) => {
      if (data.synergy > maxSynergy) {
        maxSynergy = data.synergy;
        mostSynergistic = capability;
      }
    });
    
    return { capability: mostSynergistic, synergy: maxSynergy };
  }

  /**
   * Find the least synergistic capability
   */
  findLeastSynergiticCapability(contributions) {
    let minSynergy = Infinity;
    let leastSynergistic = null;
    
    Object.entries(contributions).forEach(([capability, data]) => {
      if (data.synergy < minSynergy) {
        minSynergy = data.synergy;
        leastSynergistic = capability;
      }
    });
    
    return { capability: leastSynergistic, synergy: minSynergy };
  }

  /**
   * Identify company strengths
   */
  identifyCompanyStrengths(contributions, company) {
    const strengths = [];
    
    Object.entries(contributions).forEach(([capability, data]) => {
      const companyData = company === 'A' ? data.companyA : data.companyB;
      if (companyData.percentage > 60) {
        strengths.push({
          capability,
          dominance: companyData.percentage,
          level: companyData.percentage > 80 ? 'strong' : 'moderate'
        });
      }
    });
    
    return strengths;
  }
}

module.exports = { ContributionAnalyzer };