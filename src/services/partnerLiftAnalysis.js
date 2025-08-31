const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');
const { OpportunityScoringService } = require('./opportunityScoring');

class PartnerLiftAnalysisService {
  constructor() {
    this.db = Database.getInstance();
    this.scoringService = new OpportunityScoringService();
  }

  /**
   * Algorithm 5: Partner Lift Analysis
   * Quantifies how partnering changes opportunity success probability
   */
  async analyzePartnerLift(companyAId, companyBId, opportunityId) {
    try {
      logger.info(`Analyzing partner lift for companies ${companyAId} + ${companyBId} on opportunity ${opportunityId}`);

      // Get all entities
      const [companyA, companyB, opportunity] = await Promise.all([
        this.getCompany(companyAId),
        this.getCompany(companyBId),
        this.getOpportunity(opportunityId)
      ]);

      // Score individual companies
      const scoreA = await this.scoringService.scoreOpportunityFit(companyAId, opportunityId);
      const scoreB = await this.scoringService.scoreOpportunityFit(companyBId, opportunityId);

      // Create combined entity
      const combinedEntity = this.createCombinedEntity(companyA, companyB);

      // Score combined entity (counterfactual)
      const combinedScore = await this.scoreC

ombinedEntity(combinedEntity, opportunity);

      // Calculate lift metrics
      const liftAnalysis = this.calculateLift(scoreA, scoreB, combinedScore);

      // Identify which requirements flipped from red to green
      const requirementImprovements = this.identifyRequirementImprovements(
        scoreA,
        scoreB,
        combinedScore,
        opportunity
      );

      // Calculate Shapley values for contribution attribution
      const contributions = this.calculateShapleyValues(scoreA, scoreB, combinedScore);

      // Generate partnership strategy
      const strategy = this.generatePartnershipStrategy(
        companyA,
        companyB,
        liftAnalysis,
        requirementImprovements
      );

      // Store analysis results
      await this.storePartnerLiftAnalysis(
        companyAId,
        companyBId,
        opportunityId,
        liftAnalysis,
        contributions
      );

      logger.info(`Partner lift analysis complete: ${liftAnalysis.liftPercentage}% improvement`);

      return {
        companyA: { id: companyAId, name: companyA.name, individualScore: scoreA.overallScore },
        companyB: { id: companyBId, name: companyB.name, individualScore: scoreB.overallScore },
        opportunity: { id: opportunityId, title: opportunity.title },
        individualScores: {
          companyA: scoreA.overallScore,
          companyB: scoreB.overallScore,
          bestIndividual: Math.max(scoreA.overallScore, scoreB.overallScore)
        },
        combinedScore: combinedScore.overallScore,
        liftAnalysis,
        requirementImprovements,
        contributions,
        strategy,
        recommendation: this.generateRecommendation(liftAnalysis)
      };

    } catch (error) {
      logger.error('Partner lift analysis failed:', error);
      throw error;
    }
  }

  /**
   * Create a combined entity from two companies
   */
  createCombinedEntity(companyA, companyB) {
    return {
      id: `combined_${companyA.id}_${companyB.id}`,
      name: `${companyA.name} + ${companyB.name} Partnership`,
      
      // Union of capabilities (removing duplicates)
      capabilities: [...new Set([
        ...(companyA.capabilities || []),
        ...(companyB.capabilities || [])
      ])],
      
      // Union of certifications
      certifications: [...new Set([
        ...(companyA.certifications || []),
        ...(companyB.certifications || [])
      ])],
      
      // Union of industries
      industries: [...new Set([
        ...(companyA.industries || []),
        ...(companyB.industries || [])
      ])],
      
      // Union of technologies
      technologies: [...new Set([
        ...(companyA.technologies || []),
        ...(companyB.technologies || [])
      ])],
      
      // Combined service regions
      service_regions: [...new Set([
        ...(companyA.service_regions || []),
        ...(companyB.service_regions || [])
      ])],
      
      // Max of experience years
      years_experience: Math.max(
        companyA.years_experience || 0,
        companyB.years_experience || 0
      ),
      
      // Sum of team sizes
      team_size: (companyA.team_size || 0) + (companyB.team_size || 0),
      
      // Sum of projects
      total_projects: (companyA.total_projects || 0) + (companyB.total_projects || 0),
      
      // Average credibility (with small penalty for coordination risk)
      credibility_score: (
        ((companyA.credibility_score || 0) + (companyB.credibility_score || 0)) / 2
      ) * 0.95, // 5% penalty for partnership coordination risk
      
      // Take larger size category
      size_category: this.getLargerSizeCategory(companyA.size_category, companyB.size_category),
      
      // Combined metadata
      partnership_type: 'strategic',
      coordination_complexity: this.assessCoordinationComplexity(companyA, companyB)
    };
  }

  /**
   * Score the combined entity
   */
  async scoreCombinedEntity(combinedEntity, opportunity) {
    // Create a mock scoring similar to individual company scoring
    const constraintCheck = this.checkCombinedConstraints(combinedEntity, opportunity);
    
    if (!constraintCheck.passed) {
      return {
        overallScore: 0,
        verdict: 'REJECTED',
        constraintFailures: constraintCheck.failures
      };
    }

    // Run panel of judges on combined entity
    const judgeScores = await this.evaluateCombinedEntity(combinedEntity, opportunity);
    
    // Calculate overall score
    const overallScore = this.calculateCombinedScore(judgeScores);

    return {
      overallScore,
      verdict: overallScore >= 70 ? 'RECOMMENDED' : overallScore >= 50 ? 'POSSIBLE' : 'NOT_RECOMMENDED',
      judgeScores,
      constraintCheck
    };
  }

  /**
   * Check constraints for combined entity
   */
  checkCombinedConstraints(combined, opportunity) {
    const failures = [];
    let passed = true;

    // Check required certifications
    if (opportunity.required_certifications?.length > 0) {
      const missingCerts = opportunity.required_certifications.filter(
        cert => !combined.certifications.includes(cert)
      );
      
      if (missingCerts.length > 0) {
        failures.push({
          type: 'certification',
          message: `Still missing certifications: ${missingCerts.join(', ')}`
        });
        passed = false;
      }
    }

    // Check required experience
    if (opportunity.required_experience_years && 
        combined.years_experience < opportunity.required_experience_years) {
      failures.push({
        type: 'experience',
        message: `Combined experience still insufficient: ${combined.years_experience} years`
      });
      passed = false;
    }

    // Check required capabilities
    if (opportunity.required_capabilities?.length > 0) {
      const missingCaps = opportunity.required_capabilities.filter(
        cap => !combined.capabilities.includes(cap)
      );
      
      if (missingCaps.length > 0) {
        failures.push({
          type: 'capabilities',
          message: `Still missing capabilities: ${missingCaps.join(', ')}`
        });
        passed = false;
      }
    }

    return { passed, failures };
  }

  /**
   * Evaluate combined entity with panel of judges
   */
  async evaluateCombinedEntity(combined, opportunity) {
    // Simplified judge evaluation for combined entity
    const scores = {
      technical: this.evaluateTechnicalCombined(combined, opportunity),
      domain: this.evaluateDomainCombined(combined, opportunity),
      value: this.evaluateValueCombined(combined, opportunity),
      innovation: this.evaluateInnovationCombined(combined, opportunity),
      relationship: this.evaluateRelationshipCombined(combined, opportunity)
    };

    return scores;
  }

  evaluateTechnicalCombined(combined, opportunity) {
    let score = 60; // Higher base for partnership
    
    const requiredCaps = opportunity.required_capabilities || [];
    const matchedCaps = requiredCaps.filter(cap => combined.capabilities.includes(cap));
    const capMatchRatio = requiredCaps.length > 0 ? matchedCaps.length / requiredCaps.length : 1;
    
    score += capMatchRatio * 30;
    
    // Bonus for comprehensive capability coverage
    if (combined.capabilities.length > 10) {
      score += 10;
    }

    return Math.min(100, score);
  }

  evaluateDomainCombined(combined, opportunity) {
    let score = 50;
    
    if (combined.industries.includes(opportunity.industry)) {
      score += 40;
    }
    
    // Bonus for multi-industry coverage
    if (combined.industries.length > 3) {
      score += 10;
    }

    return Math.min(100, score);
  }

  evaluateValueCombined(combined, opportunity) {
    let score = 45;
    
    // Partnerships can sometimes reduce value due to coordination costs
    score -= combined.coordination_complexity * 5;
    
    // But provide value through risk reduction
    score += 20; // Risk mitigation bonus
    
    // Scale advantage
    if (combined.team_size > 50) {
      score += 20;
    }
    
    // Track record
    if (combined.total_projects > 50) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  evaluateInnovationCombined(combined, opportunity) {
    let score = 55;
    
    // More technologies = more innovation potential
    if (combined.technologies.length > 8) {
      score += 25;
    }
    
    // Diverse capabilities foster innovation
    if (combined.capabilities.length > 12) {
      score += 20;
    }

    return Math.min(100, score);
  }

  evaluateRelationshipCombined(combined, opportunity) {
    let score = 60;
    
    // Better geographic coverage
    if (combined.service_regions.length > 4) {
      score += 20;
    }
    
    // Size advantage for relationships
    if (combined.size_category === 'large' || combined.size_category === 'enterprise') {
      score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate combined score from judge evaluations
   */
  calculateCombinedScore(judgeScores) {
    const weights = {
      technical: 0.30,
      domain: 0.25,
      value: 0.20,
      innovation: 0.15,
      relationship: 0.10
    };

    let weightedSum = 0;
    for (const [judge, score] of Object.entries(judgeScores)) {
      weightedSum += score * (weights[judge] || 0.2);
    }

    return Math.round(weightedSum);
  }

  /**
   * Calculate lift metrics
   */
  calculateLift(scoreA, scoreB, combinedScore) {
    const bestIndividual = Math.max(scoreA.overallScore, scoreB.overallScore);
    const absoluteLift = combinedScore.overallScore - bestIndividual;
    const percentageLift = bestIndividual > 0 ? 
      ((combinedScore.overallScore - bestIndividual) / bestIndividual) * 100 : 0;

    return {
      absoluteLift: Math.round(absoluteLift),
      liftPercentage: Math.round(percentageLift),
      fromScore: bestIndividual,
      toScore: combinedScore.overallScore,
      synergyLevel: this.categorizesynergy(percentageLift),
      coordinationRisk: this.assessCoordinationRisk(percentageLift)
    };
  }

  /**
   * Identify which requirements improved with partnership
   */
  identifyRequirementImprovements(scoreA, scoreB, combinedScore, opportunity) {
    const improvements = [];

    // Check capability improvements
    const reqCaps = opportunity.required_capabilities || [];
    const capsA = scoreA.constraintCheck?.failures?.find(f => f.type === 'capabilities');
    const capsB = scoreB.constraintCheck?.failures?.find(f => f.type === 'capabilities');
    const capsCombined = combinedScore.constraintCheck?.failures?.find(f => f.type === 'capabilities');

    if ((capsA || capsB) && !capsCombined) {
      improvements.push({
        type: 'capabilities',
        status: 'RESOLVED',
        description: 'Partnership provides all required capabilities',
        impact: 'high'
      });
    }

    // Check certification improvements
    const certsA = scoreA.constraintCheck?.failures?.find(f => f.type === 'certification');
    const certsB = scoreB.constraintCheck?.failures?.find(f => f.type === 'certification');
    const certsCombined = combinedScore.constraintCheck?.failures?.find(f => f.type === 'certification');

    if ((certsA || certsB) && !certsCombined) {
      improvements.push({
        type: 'certifications',
        status: 'RESOLVED',
        description: 'Combined certifications meet all requirements',
        impact: 'high'
      });
    }

    // Check judge score improvements
    if (combinedScore.judgeScores) {
      Object.entries(combinedScore.judgeScores).forEach(([judge, score]) => {
        const scoreAJudge = scoreA.judgeScores?.[judge]?.score || 0;
        const scoreBJudge = scoreB.judgeScores?.[judge]?.score || 0;
        const bestIndividualJudge = Math.max(scoreAJudge, scoreBJudge);
        
        if (score > bestIndividualJudge + 20) {
          improvements.push({
            type: 'judge_score',
            judge,
            status: 'IMPROVED',
            description: `${judge} judge score improved by ${Math.round(score - bestIndividualJudge)}%`,
            impact: 'medium'
          });
        }
      });
    }

    return improvements;
  }

  /**
   * Calculate Shapley values for contribution attribution
   */
  calculateShapleyValues(scoreA, scoreB, combinedScore) {
    // Simplified Shapley value calculation
    const totalLift = combinedScore.overallScore - Math.max(scoreA.overallScore, scoreB.overallScore);
    
    // Marginal contributions
    const marginalA = combinedScore.overallScore - scoreB.overallScore;
    const marginalB = combinedScore.overallScore - scoreA.overallScore;
    
    // Shapley values (average of marginal contributions)
    const shapleyA = (marginalA + (totalLift - marginalB)) / 2;
    const shapleyB = (marginalB + (totalLift - marginalA)) / 2;
    
    // Normalize to percentages
    const totalShapley = Math.abs(shapleyA) + Math.abs(shapleyB);
    
    return {
      companyA: {
        absoluteContribution: Math.round(shapleyA),
        percentageContribution: totalShapley > 0 ? Math.round((Math.abs(shapleyA) / totalShapley) * 100) : 50,
        keyContributions: this.identifyKeyContributions(scoreA, combinedScore, 'A')
      },
      companyB: {
        absoluteContribution: Math.round(shapleyB),
        percentageContribution: totalShapley > 0 ? Math.round((Math.abs(shapleyB) / totalShapley) * 100) : 50,
        keyContributions: this.identifyKeyContributions(scoreB, combinedScore, 'B')
      },
      synergyBonus: Math.max(0, totalLift - marginalA - marginalB)
    };
  }

  /**
   * Identify key contributions from each partner
   */
  identifyKeyContributions(individualScore, combinedScore, company) {
    const contributions = [];
    
    // This is a simplified version - in reality would do deeper analysis
    if (company === 'A') {
      contributions.push('Technical expertise and certifications');
      contributions.push('Established client relationships');
    } else {
      contributions.push('Domain knowledge and industry experience');
      contributions.push('Geographic coverage and local presence');
    }
    
    return contributions;
  }

  /**
   * Generate partnership strategy
   */
  generatePartnershipStrategy(companyA, companyB, liftAnalysis, improvements) {
    const strategy = {
      recommendedStructure: '',
      keySuccessFactors: [],
      riskMitigations: [],
      implementationSteps: []
    };

    // Recommend structure based on lift
    if (liftAnalysis.liftPercentage > 30) {
      strategy.recommendedStructure = 'Strategic Joint Venture';
      strategy.keySuccessFactors.push('Clear role definition and responsibility matrix');
      strategy.keySuccessFactors.push('Integrated project management approach');
    } else if (liftAnalysis.liftPercentage > 15) {
      strategy.recommendedStructure = 'Prime-Subcontractor Relationship';
      strategy.keySuccessFactors.push('Well-defined work breakdown structure');
      strategy.keySuccessFactors.push('Clear communication protocols');
    } else {
      strategy.recommendedStructure = 'Referral Partnership';
      strategy.keySuccessFactors.push('Clear referral fee structure');
      strategy.keySuccessFactors.push('Defined handoff processes');
    }

    // Risk mitigations
    if (liftAnalysis.coordinationRisk > 0.3) {
      strategy.riskMitigations.push('Establish joint PMO for coordination');
      strategy.riskMitigations.push('Weekly sync meetings and shared dashboards');
    }
    
    strategy.riskMitigations.push('Clear IP and revenue sharing agreements');
    strategy.riskMitigations.push('Defined escalation procedures');

    // Implementation steps
    strategy.implementationSteps = [
      'Sign mutual NDA and begin detailed capability assessment',
      'Define partnership structure and terms',
      'Create integrated capability statement',
      'Develop joint proposal strategy',
      'Establish communication and project management protocols'
    ];

    return strategy;
  }

  /**
   * Generate final recommendation
   */
  generateRecommendation(liftAnalysis) {
    if (liftAnalysis.liftPercentage > 30) {
      return {
        decision: 'STRONGLY_RECOMMENDED',
        rationale: `Partnership provides ${liftAnalysis.liftPercentage}% improvement in win probability`,
        action: 'Proceed immediately with partnership formation'
      };
    } else if (liftAnalysis.liftPercentage > 15) {
      return {
        decision: 'RECOMMENDED',
        rationale: `Moderate improvement of ${liftAnalysis.liftPercentage}% justifies partnership overhead`,
        action: 'Explore partnership with clear role definitions'
      };
    } else if (liftAnalysis.liftPercentage > 0) {
      return {
        decision: 'OPTIONAL',
        rationale: `Minimal improvement of ${liftAnalysis.liftPercentage}% may not justify coordination costs`,
        action: 'Consider simpler collaboration models'
      };
    } else {
      return {
        decision: 'NOT_RECOMMENDED',
        rationale: 'No significant improvement from partnership',
        action: 'Pursue opportunity independently or seek different partners'
      };
    }
  }

  /**
   * Helper methods
   */
  getLargerSizeCategory(size1, size2) {
    const sizeMap = { 'small': 1, 'medium': 2, 'large': 3, 'enterprise': 4 };
    const num1 = sizeMap[size1] || 2;
    const num2 = sizeMap[size2] || 2;
    const larger = Math.max(num1, num2);
    
    return Object.keys(sizeMap).find(key => sizeMap[key] === larger) || 'medium';
  }

  assessCoordinationComplexity(companyA, companyB) {
    let complexity = 0;
    
    // Different sizes increase complexity
    if (companyA.size_category !== companyB.size_category) {
      complexity += 2;
    }
    
    // Different locations increase complexity
    if (companyA.headquarters_state !== companyB.headquarters_state) {
      complexity += 1;
    }
    
    // Many overlapping capabilities increase complexity
    const sharedCaps = (companyA.capabilities || []).filter(
      cap => (companyB.capabilities || []).includes(cap)
    );
    if (sharedCaps.length > 3) {
      complexity += 1;
    }
    
    return Math.min(5, complexity);
  }

  categorizesynergy(liftPercentage) {
    if (liftPercentage > 40) return 'exceptional';
    if (liftPercentage > 25) return 'strong';
    if (liftPercentage > 15) return 'moderate';
    if (liftPercentage > 5) return 'minimal';
    return 'negligible';
  }

  assessCoordinationRisk(liftPercentage) {
    // Higher lifts often come with higher coordination risks
    if (liftPercentage > 50) return 0.4;
    if (liftPercentage > 30) return 0.3;
    if (liftPercentage > 15) return 0.2;
    return 0.1;
  }

  /**
   * Store analysis results
   */
  async storePartnerLiftAnalysis(companyAId, companyBId, opportunityId, liftAnalysis, contributions) {
    try {
      // This would store the analysis results in a dedicated table
      // For now, we'll update the partnership_recommendations table
      await this.db.query(`
        UPDATE partnership_recommendations 
        SET 
          estimated_value_increase = $3,
          recommended_for_opportunities = array_append(recommended_for_opportunities, $4),
          updated_at = NOW()
        WHERE company_a_id = $1 AND company_b_id = $2
      `, [
        companyAId,
        companyBId,
        liftAnalysis.liftPercentage,
        opportunityId
      ]);
    } catch (error) {
      logger.error('Failed to store partner lift analysis:', error);
    }
  }

  async getCompany(companyId) {
    const result = await this.db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (result.rows.length === 0) throw new Error('Company not found');
    return result.rows[0];
  }

  async getOpportunity(opportunityId) {
    const result = await this.db.query('SELECT * FROM opportunities WHERE id = $1', [opportunityId]);
    if (result.rows.length === 0) throw new Error('Opportunity not found');
    return result.rows[0];
  }
}

module.exports = { PartnerLiftAnalysisService };