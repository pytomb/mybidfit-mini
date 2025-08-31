const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

class OpportunityScoringService {
  constructor() {
    this.db = Database.getInstance();
    
    // Define the Panel of Judges
    this.judges = {
      technical: new TechnicalJudge(),
      domain: new DomainJudge(),
      value: new ValueJudge(),
      innovation: new InnovationJudge(),
      relationship: new RelationshipJudge()
    };
  }

  /**
   * Algorithm 3: Fit-to-Opportunity Scoring with Panel of Judges
   * Each judge evaluates the supplier-opportunity fit from their perspective
   */
  async scoreOpportunityFit(companyId, opportunityId) {
    try {
      logger.info(`Scoring opportunity ${opportunityId} for company ${companyId}`);

      // Get company and opportunity data
      const [company, opportunity] = await Promise.all([
        this.getCompany(companyId),
        this.getOpportunity(opportunityId)
      ]);

      // Stage 1: Check hard constraints
      const constraintCheck = this.checkHardConstraints(company, opportunity);
      
      if (!constraintCheck.passed) {
        return {
          companyId,
          opportunityId,
          overallScore: 0,
          verdict: 'REJECTED',
          constraintFailures: constraintCheck.failures,
          judgeScores: {},
          recommendations: ['Address constraint failures before reapplying']
        };
      }

      // Stage 2: Panel of Judges evaluation
      const judgeEvaluations = await this.runPanelOfJudges(company, opportunity);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(judgeEvaluations);

      // Generate improvement recommendations
      const recommendations = this.generateRecommendations(judgeEvaluations, company, opportunity);

      // Store scoring results
      await this.storeScoringResults(companyId, opportunityId, overallScore, judgeEvaluations);

      logger.info(`Scoring complete: ${company.name} scored ${overallScore}% for ${opportunity.title}`);

      return {
        companyId,
        opportunityId,
        companyName: company.name,
        opportunityTitle: opportunity.title,
        overallScore,
        verdict: overallScore >= 70 ? 'RECOMMENDED' : overallScore >= 50 ? 'POSSIBLE' : 'NOT_RECOMMENDED',
        constraintCheck,
        judgeScores: judgeEvaluations,
        recommendations,
        nextSteps: this.generateNextSteps(overallScore, judgeEvaluations)
      };

    } catch (error) {
      logger.error('Opportunity scoring failed:', error);
      throw error;
    }
  }

  /**
   * Check hard constraints (must-have requirements)
   */
  checkHardConstraints(company, opportunity) {
    const failures = [];
    let passed = true;

    // Check required certifications
    if (opportunity.required_certifications && opportunity.required_certifications.length > 0) {
      const missingCerts = opportunity.required_certifications.filter(
        cert => !(company.certifications || []).includes(cert)
      );
      
      if (missingCerts.length > 0) {
        failures.push({
          type: 'certification',
          message: `Missing required certifications: ${missingCerts.join(', ')}`
        });
        passed = false;
      }
    }

    // Check required experience
    if (opportunity.required_experience_years && 
        (company.years_experience || 0) < opportunity.required_experience_years) {
      failures.push({
        type: 'experience',
        message: `Insufficient experience: ${company.years_experience || 0} years (required: ${opportunity.required_experience_years})`
      });
      passed = false;
    }

    // Check required capabilities
    if (opportunity.required_capabilities && opportunity.required_capabilities.length > 0) {
      const missingCaps = opportunity.required_capabilities.filter(
        cap => !(company.capabilities || []).includes(cap)
      );
      
      if (missingCaps.length > 0) {
        failures.push({
          type: 'capabilities',
          message: `Missing required capabilities: ${missingCaps.join(', ')}`
        });
        passed = false;
      }
    }

    // Check size requirements (if any)
    if (opportunity.buyer_type === 'government' && company.size_category === 'small') {
      // Small businesses often get preference in government contracts
      // This is actually a positive, not a constraint
    }

    return { passed, failures };
  }

  /**
   * Run Panel of Judges evaluation
   */
  async runPanelOfJudges(company, opportunity) {
    const evaluations = {};

    // Each judge evaluates independently
    for (const [judgeName, judge] of Object.entries(this.judges)) {
      evaluations[judgeName] = await judge.evaluate(company, opportunity);
    }

    return evaluations;
  }

  /**
   * Calculate overall score from judge evaluations
   */
  calculateOverallScore(judgeEvaluations) {
    // Weight each judge's score
    const weights = {
      technical: 0.30,
      domain: 0.25,
      value: 0.20,
      innovation: 0.15,
      relationship: 0.10
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [judge, evaluation] of Object.entries(judgeEvaluations)) {
      const weight = weights[judge] || 0.2;
      weightedSum += evaluation.score * weight;
      totalWeight += weight;
    }

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations(judgeEvaluations, company, opportunity) {
    const recommendations = [];

    // Collect recommendations from each judge
    for (const [judgeName, evaluation] of Object.entries(judgeEvaluations)) {
      if (evaluation.score < 70 && evaluation.recommendations) {
        recommendations.push(...evaluation.recommendations);
      }
    }

    // Add overall strategic recommendations
    if (recommendations.length === 0) {
      recommendations.push('Strong fit! Consider emphasizing your unique value propositions in the proposal.');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Generate next steps based on scoring
   */
  generateNextSteps(overallScore, judgeEvaluations) {
    const steps = [];

    if (overallScore >= 80) {
      steps.push('✅ Proceed with full proposal - you have excellent fit');
      steps.push('📊 Emphasize strengths identified by judges in executive summary');
      steps.push('🤝 Consider reaching out to buyer for pre-submission questions');
    } else if (overallScore >= 60) {
      steps.push('⚠️ Address weaknesses before submitting');
      
      // Find lowest scoring judge
      const lowestJudge = Object.entries(judgeEvaluations)
        .sort((a, b) => a[1].score - b[1].score)[0];
      
      steps.push(`🎯 Focus on improving ${lowestJudge[0]} aspects: ${lowestJudge[1].recommendations[0]}`);
      steps.push('🤝 Consider partnership to strengthen weak areas');
    } else {
      steps.push('❌ This opportunity may not be a good fit');
      steps.push('🔍 Look for opportunities better aligned with your capabilities');
      steps.push('📈 Use judge feedback to guide capability development');
    }

    return steps;
  }

  /**
   * Store scoring results in database
   */
  async storeScoringResults(companyId, opportunityId, overallScore, judgeEvaluations) {
    try {
      // Store main scoring result
      const scoringResult = await this.db.query(`
        INSERT INTO scoring_results 
        (company_id, opportunity_id, overall_score, confidence_level, 
         meets_hard_constraints, supporting_evidence, analyzed_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (company_id, opportunity_id) 
        DO UPDATE SET 
          overall_score = $3,
          confidence_level = $4,
          analyzed_at = NOW()
        RETURNING id
      `, [
        companyId,
        opportunityId,
        overallScore,
        0.85, // Mock confidence
        true,
        JSON.stringify({ judgeEvaluations })
      ]);

      const scoringResultId = scoringResult.rows[0].id;

      // Store individual judge scores
      for (const [judgeName, evaluation] of Object.entries(judgeEvaluations)) {
        await this.db.query(`
          INSERT INTO judge_scores 
          (scoring_result_id, judge_type, score, verdict, confidence, 
           reasoning, evidence_citations, recommendations)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          scoringResultId,
          judgeName,
          Math.round(evaluation.score / 20), // Convert to 1-5 scale
          evaluation.verdict,
          evaluation.confidence,
          evaluation.reasoning,
          evaluation.evidence,
          evaluation.recommendations
        ]);
      }

    } catch (error) {
      logger.error('Failed to store scoring results:', error);
    }
  }

  // Helper methods
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

/**
 * Technical Judge - Focus on certifications, technical capabilities, compliance
 */
class TechnicalJudge {
  async evaluate(company, opportunity) {
    let score = 50; // Base score
    const evidence = [];
    const recommendations = [];

    // Check technical capabilities alignment
    const requiredCaps = opportunity.required_capabilities || [];
    const companyCaps = company.capabilities || [];
    
    const matchedCaps = requiredCaps.filter(cap => companyCaps.includes(cap));
    const capMatchRatio = requiredCaps.length > 0 ? matchedCaps.length / requiredCaps.length : 1;
    
    score += capMatchRatio * 30;
    
    if (capMatchRatio < 1) {
      recommendations.push(`Develop capabilities in: ${requiredCaps.filter(c => !companyCaps.includes(c)).join(', ')}`);
    }
    
    evidence.push(`Matches ${matchedCaps.length}/${requiredCaps.length} required technical capabilities`);

    // Check certifications
    const requiredCerts = opportunity.required_certifications || [];
    const companyCerts = company.certifications || [];
    
    const certMatchRatio = requiredCerts.length > 0 ? 
      requiredCerts.filter(cert => companyCerts.includes(cert)).length / requiredCerts.length : 1;
    
    score += certMatchRatio * 20;
    
    if (certMatchRatio < 1) {
      recommendations.push(`Obtain certifications: ${requiredCerts.filter(c => !companyCerts.includes(c)).join(', ')}`);
    }
    
    evidence.push(`Has ${companyCerts.length} relevant certifications`);

    // Verdict
    const verdict = score >= 70 ? 'O' : 'X';

    return {
      score: Math.min(100, score),
      verdict,
      confidence: 0.88,
      reasoning: `Technical evaluation based on capabilities match (${Math.round(capMatchRatio * 100)}%) and certifications (${Math.round(certMatchRatio * 100)}%)`,
      evidence,
      recommendations: recommendations.length > 0 ? recommendations : ['Maintain technical excellence']
    };
  }
}

/**
 * Domain Judge - Focus on industry experience and domain expertise
 */
class DomainJudge {
  async evaluate(company, opportunity) {
    let score = 40; // Base score
    const evidence = [];
    const recommendations = [];

    // Check industry alignment
    const oppIndustry = opportunity.industry;
    const companyIndustries = company.industries || [];
    
    if (companyIndustries.includes(oppIndustry)) {
      score += 40;
      evidence.push(`Direct experience in ${oppIndustry} industry`);
    } else {
      score += 10;
      recommendations.push(`Build case studies in ${oppIndustry} industry`);
      evidence.push('No direct industry experience');
    }

    // Years of experience bonus
    if (company.years_experience >= opportunity.required_experience_years) {
      score += 20;
      evidence.push(`${company.years_experience} years of experience exceeds requirement`);
    }

    // Project volume indicator
    if (company.total_projects > 20) {
      score += 10;
      evidence.push(`Proven track record with ${company.total_projects} completed projects`);
    }

    const verdict = score >= 70 ? 'O' : 'X';

    return {
      score: Math.min(100, score),
      verdict,
      confidence: 0.82,
      reasoning: `Domain expertise evaluation focused on ${oppIndustry} industry experience and track record`,
      evidence,
      recommendations: recommendations.length > 0 ? recommendations : ['Leverage domain expertise in proposal']
    };
  }
}

/**
 * Value Judge - Focus on cost efficiency, ROI, delivery track record
 */
class ValueJudge {
  async evaluate(company, opportunity) {
    let score = 50; // Base score
    const evidence = [];
    const recommendations = [];

    // Size category alignment (smaller companies often provide better value)
    if (company.size_category === 'small' || company.size_category === 'medium') {
      score += 20;
      evidence.push('Competitive pricing advantage from lean operations');
    }

    // Team size efficiency
    if (company.team_size >= 10 && company.team_size <= 50) {
      score += 15;
      evidence.push('Right-sized team for efficient delivery');
    }

    // Success rate (mock calculation)
    const successRate = company.credibility_score || 75;
    if (successRate > 80) {
      score += 20;
      evidence.push(`High success rate: ${successRate}% credibility score`);
    } else {
      score += 10;
      recommendations.push('Highlight successful project outcomes and ROI metrics');
    }

    // Project value alignment
    const projectValueRange = opportunity.project_value_max - opportunity.project_value_min;
    if (projectValueRange > 0) {
      score += 15;
      evidence.push('Experience with similar project budgets');
    }

    const verdict = score >= 65 ? 'O' : 'X';

    return {
      score: Math.min(100, score),
      verdict,
      confidence: 0.78,
      reasoning: 'Value assessment based on cost efficiency, team size, and delivery track record',
      evidence,
      recommendations: recommendations.length > 0 ? recommendations : ['Emphasize value proposition and ROI']
    };
  }
}

/**
 * Innovation Judge - Focus on unique approaches, thought leadership, differentiation
 */
class InnovationJudge {
  async evaluate(company, opportunity) {
    let score = 45; // Base score
    const evidence = [];
    const recommendations = [];

    // Technology stack modernity
    const modernTech = ['AI/ML', 'blockchain', 'IoT', 'cloud', 'microservices'];
    const companyTech = company.technologies || [];
    const innovativeTech = companyTech.filter(t => modernTech.some(m => t.toLowerCase().includes(m.toLowerCase())));
    
    if (innovativeTech.length > 0) {
      score += 25;
      evidence.push(`Uses innovative technologies: ${innovativeTech.join(', ')}`);
    } else {
      recommendations.push('Highlight innovative approaches and unique methodologies');
    }

    // Unique capabilities
    const uniqueCaps = company.capabilities || [];
    if (uniqueCaps.length > 5) {
      score += 20;
      evidence.push('Diverse capability portfolio shows innovation potential');
    }

    // Recent founding (newer companies often more innovative)
    const companyAge = new Date().getFullYear() - (company.founded_year || 2015);
    if (companyAge <= 5) {
      score += 15;
      evidence.push('Modern company with fresh perspectives');
    }

    const verdict = score >= 60 ? 'O' : 'X';

    return {
      score: Math.min(100, score),
      verdict,
      confidence: 0.73,
      reasoning: 'Innovation assessment based on technology adoption and unique approaches',
      evidence,
      recommendations: recommendations.length > 0 ? recommendations : ['Showcase innovative solutions and thought leadership']
    };
  }
}

/**
 * Relationship Judge - Focus on geography, cultural fit, partnership potential
 */
class RelationshipJudge {
  async evaluate(company, opportunity) {
    let score = 50; // Base score
    const evidence = [];
    const recommendations = [];

    // Geographic alignment
    const oppLocation = opportunity.location || '';
    const companyRegions = company.service_regions || [];
    
    if (companyRegions.some(r => oppLocation.includes(r) || r === 'Remote')) {
      score += 30;
      evidence.push('Geographic coverage aligns with opportunity location');
    } else {
      score += 10;
      recommendations.push('Establish local presence or remote delivery capabilities');
    }

    // Buyer type alignment
    if (opportunity.buyer_type === 'government' && company.certifications?.includes('FedRAMP')) {
      score += 20;
      evidence.push('Government contracting experience');
    } else if (opportunity.buyer_type === 'private') {
      score += 15;
      evidence.push('Private sector engagement experience');
    }

    // Company size harmony
    if (company.size_category === opportunity.buyer_type) {
      score += 10;
      evidence.push('Good cultural fit based on organization size');
    }

    const verdict = score >= 65 ? 'O' : 'X';

    return {
      score: Math.min(100, score),
      verdict,
      confidence: 0.76,
      reasoning: 'Relationship potential based on geographic alignment and cultural fit',
      evidence,
      recommendations: recommendations.length > 0 ? recommendations : ['Build relationships through pre-submission engagement']
    };
  }
}

module.exports = { OpportunityScoringService };