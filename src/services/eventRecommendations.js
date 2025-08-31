const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

class EventRecommendationService {
  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Algorithm 4: Event/Networking Recommendations
   * Suggests strategic events, conferences, and networking opportunities
   */
  async recommendEvents(companyId, options = {}) {
    try {
      logger.info(`Generating event recommendations for company ${companyId}`);

      // Get company profile
      const company = await this.getCompany(companyId);

      // Get target opportunities and buyers
      const targetBuyers = await this.identifyTargetBuyers(company);

      // Generate mock events based on company profile
      const potentialEvents = this.generatePotentialEvents(company, targetBuyers);

      // Score and rank events
      const scoredEvents = potentialEvents.map(event => ({
        ...event,
        scores: this.scoreEvent(event, company, targetBuyers),
        roi: this.calculateEventROI(event, company)
      }));

      // Sort by overall score
      scoredEvents.sort((a, b) => b.scores.overall - a.scores.overall);

      // Create monthly event portfolio
      const monthlyPortfolio = this.createMonthlyPortfolio(scoredEvents, options.budget || 5000);

      // Store recommendations
      await this.storeEventRecommendations(companyId, scoredEvents.slice(0, 10));

      logger.info(`Generated ${scoredEvents.length} event recommendations for ${company.name}`);

      return {
        companyId,
        companyName: company.name,
        totalRecommendations: scoredEvents.length,
        topEvents: scoredEvents.slice(0, 5),
        monthlyPortfolio,
        investmentStrategy: this.generateInvestmentStrategy(company, scoredEvents),
        expectedOutcomes: this.projectOutcomes(monthlyPortfolio)
      };

    } catch (error) {
      logger.error('Event recommendation failed:', error);
      throw error;
    }
  }

  /**
   * Identify target buyers based on company capabilities
   */
  async identifyTargetBuyers(company) {
    // Get opportunities that match company capabilities
    const result = await this.db.query(`
      SELECT DISTINCT buyer_organization, buyer_type, industry
      FROM opportunities
      WHERE industry = ANY($1::text[])
      OR required_capabilities && $2::text[]
      LIMIT 20
    `, [company.industries || [], company.capabilities || []]);

    return result.rows;
  }

  /**
   * Generate potential events (mock data - would use real event APIs in production)
   */
  generatePotentialEvents(company, targetBuyers) {
    const events = [];
    const currentDate = new Date();

    // Industry-specific conferences
    (company.industries || []).forEach(industry => {
      events.push({
        name: `${industry.charAt(0).toUpperCase() + industry.slice(1)} Innovation Summit 2025`,
        type: 'conference',
        date: new Date(currentDate.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000),
        location: this.selectEventLocation(company),
        cost: 1500 + Math.random() * 3500,
        expectedAttendees: 500 + Math.floor(Math.random() * 2000),
        targetAudience: ['executives', 'procurement', 'technical'],
        keyBuyers: targetBuyers.filter(b => b.industry === industry).slice(0, 5),
        topics: ['digital transformation', 'AI adoption', 'procurement innovation'],
        sponsorshipAvailable: true,
        speakingOpportunities: Math.random() > 0.5
      });

      // Smaller networking events
      events.push({
        name: `${industry} Leaders Networking Dinner`,
        type: 'networking',
        date: new Date(currentDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        location: company.headquarters_city || 'Virtual',
        cost: 200 + Math.random() * 300,
        expectedAttendees: 20 + Math.floor(Math.random() * 30),
        targetAudience: ['executives', 'decision-makers'],
        keyBuyers: targetBuyers.filter(b => b.industry === industry).slice(0, 2),
        topics: ['partnership opportunities', 'industry trends'],
        sponsorshipAvailable: false,
        speakingOpportunities: false
      });
    });

    // Government contracting events
    if (targetBuyers.some(b => b.buyer_type === 'government')) {
      events.push({
        name: 'Federal Contracting Summit',
        type: 'trade-show',
        date: new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000),
        location: 'Washington, DC',
        cost: 3500,
        expectedAttendees: 3000,
        targetAudience: ['government', 'contractors', 'procurement'],
        keyBuyers: targetBuyers.filter(b => b.buyer_type === 'government'),
        topics: ['federal procurement', 'small business opportunities', 'compliance'],
        sponsorshipAvailable: true,
        speakingOpportunities: true
      });

      events.push({
        name: 'Small Business Federal Contracting Workshop',
        type: 'workshop',
        date: new Date(currentDate.getTime() + 45 * 24 * 60 * 60 * 1000),
        location: 'Virtual',
        cost: 150,
        expectedAttendees: 100,
        targetAudience: ['small business', 'procurement officers'],
        keyBuyers: [],
        topics: ['RFP response', 'capability statements', 'SAM registration'],
        sponsorshipAvailable: false,
        speakingOpportunities: false
      });
    }

    // Technology and innovation events
    if ((company.capabilities || []).some(cap => cap.includes('AI') || cap.includes('ML'))) {
      events.push({
        name: 'AI & Automation Expo',
        type: 'trade-show',
        date: new Date(currentDate.getTime() + 75 * 24 * 60 * 60 * 1000),
        location: 'San Francisco, CA',
        cost: 2500,
        expectedAttendees: 5000,
        targetAudience: ['technical', 'executives', 'investors'],
        keyBuyers: targetBuyers.slice(0, 10),
        topics: ['AI implementation', 'automation ROI', 'digital transformation'],
        sponsorshipAvailable: true,
        speakingOpportunities: true
      });
    }

    // Local business events
    events.push({
      name: `${company.headquarters_city || 'Regional'} Business Association Monthly Mixer`,
      type: 'networking',
      date: new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      location: company.headquarters_city || 'Local',
      cost: 50,
      expectedAttendees: 50,
      targetAudience: ['local business', 'entrepreneurs'],
      keyBuyers: [],
      topics: ['local partnerships', 'business growth'],
      sponsorshipAvailable: false,
      speakingOpportunities: false
    });

    return events;
  }

  /**
   * Score event based on various factors
   */
  scoreEvent(event, company, targetBuyers) {
    const scores = {
      relevance: 0,
      networking: 0,
      cost_efficiency: 0,
      timing: 0,
      overall: 0
    };

    // Relevance score - how well does it match company needs?
    if (event.keyBuyers && event.keyBuyers.length > 0) {
      scores.relevance += 40;
    }
    if (event.topics.some(topic => 
      company.capabilities?.some(cap => topic.toLowerCase().includes(cap.toLowerCase()))
    )) {
      scores.relevance += 30;
    }
    if (event.speakingOpportunities) {
      scores.relevance += 20;
    }
    scores.relevance = Math.min(100, scores.relevance + 10);

    // Networking score - quality of connections possible
    if (event.expectedAttendees < 100) {
      scores.networking = 80; // Smaller events often better for networking
    } else if (event.expectedAttendees < 500) {
      scores.networking = 70;
    } else {
      scores.networking = 50;
    }
    
    if (event.type === 'networking') {
      scores.networking = Math.min(100, scores.networking + 20);
    }

    // Cost efficiency score
    const costPerConnection = event.cost / Math.min(event.expectedAttendees, 20);
    if (costPerConnection < 50) {
      scores.cost_efficiency = 90;
    } else if (costPerConnection < 150) {
      scores.cost_efficiency = 70;
    } else if (costPerConnection < 300) {
      scores.cost_efficiency = 50;
    } else {
      scores.cost_efficiency = 30;
    }

    // Timing score - sooner is often better
    const daysUntilEvent = Math.floor((event.date - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilEvent < 30) {
      scores.timing = 90;
    } else if (daysUntilEvent < 60) {
      scores.timing = 70;
    } else if (daysUntilEvent < 90) {
      scores.timing = 50;
    } else {
      scores.timing = 30;
    }

    // Calculate overall score
    scores.overall = Math.round(
      scores.relevance * 0.35 +
      scores.networking * 0.25 +
      scores.cost_efficiency * 0.25 +
      scores.timing * 0.15
    );

    return scores;
  }

  /**
   * Calculate expected ROI for an event
   */
  calculateEventROI(event, company) {
    // Mock ROI calculation
    const potentialLeads = Math.min(
      Math.floor(event.expectedAttendees * 0.05),
      10
    );
    
    const conversionRate = event.type === 'networking' ? 0.15 : 0.08;
    const expectedDeals = potentialLeads * conversionRate;
    
    // Assume average deal value based on company size
    const avgDealValue = company.size_category === 'large' ? 250000 : 
                        company.size_category === 'medium' ? 100000 : 50000;
    
    const expectedRevenue = expectedDeals * avgDealValue * 0.3; // 30% probability
    const roi = ((expectedRevenue - event.cost) / event.cost) * 100;

    return {
      potentialLeads,
      expectedDeals: Math.round(expectedDeals * 10) / 10,
      expectedRevenue: Math.round(expectedRevenue),
      roiPercentage: Math.round(roi),
      breakEvenLeads: Math.ceil(event.cost / (avgDealValue * 0.3 * conversionRate))
    };
  }

  /**
   * Create optimized monthly event portfolio
   */
  createMonthlyPortfolio(events, budget) {
    const portfolio = {
      events: [],
      totalCost: 0,
      expectedLeads: 0,
      expectedRevenue: 0,
      diversification: {
        conferences: 0,
        networking: 0,
        workshops: 0,
        tradeShows: 0
      }
    };

    // Greedy algorithm to maximize value within budget
    for (const event of events) {
      if (portfolio.totalCost + event.cost <= budget) {
        portfolio.events.push({
          name: event.name,
          type: event.type,
          date: event.date,
          cost: event.cost,
          score: event.scores.overall,
          expectedROI: event.roi.roiPercentage
        });
        
        portfolio.totalCost += event.cost;
        portfolio.expectedLeads += event.roi.potentialLeads;
        portfolio.expectedRevenue += event.roi.expectedRevenue;
        
        // Track diversification
        const typeKey = event.type.replace('-', '').replace('trade-show', 'tradeShows') + 's';
        if (portfolio.diversification[typeKey] !== undefined) {
          portfolio.diversification[typeKey]++;
        }
        
        // Limit to 5 events per month
        if (portfolio.events.length >= 5) break;
      }
    }

    portfolio.utilizationRate = Math.round((portfolio.totalCost / budget) * 100);

    return portfolio;
  }

  /**
   * Generate investment strategy recommendations
   */
  generateInvestmentStrategy(company, events) {
    const avgScore = events.slice(0, 10).reduce((sum, e) => sum + e.scores.overall, 0) / 10;
    
    const strategy = {
      recommendedMonthlyBudget: 0,
      focusAreas: [],
      keyMetrics: [],
      warnings: []
    };

    // Budget recommendation based on company size
    if (company.size_category === 'enterprise') {
      strategy.recommendedMonthlyBudget = 15000;
    } else if (company.size_category === 'large') {
      strategy.recommendedMonthlyBudget = 8000;
    } else if (company.size_category === 'medium') {
      strategy.recommendedMonthlyBudget = 4000;
    } else {
      strategy.recommendedMonthlyBudget = 1500;
    }

    // Focus areas
    if (events.some(e => e.type === 'conference' && e.scores.relevance > 80)) {
      strategy.focusAreas.push('Industry conferences for thought leadership');
    }
    if (events.some(e => e.type === 'networking' && e.scores.networking > 80)) {
      strategy.focusAreas.push('Executive networking for relationship building');
    }
    if (events.some(e => e.keyBuyers?.length > 3)) {
      strategy.focusAreas.push('Buyer-focused events for direct engagement');
    }

    // Key metrics to track
    strategy.keyMetrics = [
      'Cost per qualified lead',
      'Meeting-to-opportunity conversion rate',
      'Brand visibility increase',
      'Partnership opportunities identified'
    ];

    // Warnings
    if (avgScore < 60) {
      strategy.warnings.push('Limited high-value events available - consider virtual alternatives');
    }
    if (!events.some(e => e.cost < 500)) {
      strategy.warnings.push('All events are high-cost - seek local networking opportunities');
    }

    return strategy;
  }

  /**
   * Project expected outcomes from portfolio
   */
  projectOutcomes(portfolio) {
    return {
      monthlyLeads: portfolio.expectedLeads,
      quarterlyOpportunities: Math.round(portfolio.expectedLeads * 0.3),
      annualRevenuePotential: portfolio.expectedRevenue * 12,
      relationshipsBuilt: portfolio.events.length * 5,
      brandImpressions: portfolio.events.reduce((sum, e) => sum + (e.expectedAttendees || 100), 0)
    };
  }

  /**
   * Store event recommendations in database
   */
  async storeEventRecommendations(companyId, events) {
    try {
      for (const event of events) {
        await this.db.query(`
          INSERT INTO event_recommendations 
          (company_id, event_name, event_type, event_date, location, cost_estimate,
           relevance_score, roi_estimate, networking_potential)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          companyId,
          event.name,
          event.type,
          event.date,
          event.location,
          event.cost,
          event.scores.relevance,
          event.roi.roiPercentage,
          event.scores.networking
        ]);
      }
    } catch (error) {
      logger.error('Failed to store event recommendations:', error);
    }
  }

  /**
   * Helper methods
   */
  selectEventLocation(company) {
    const locations = [
      'San Francisco, CA',
      'New York, NY',
      'Washington, DC',
      'Chicago, IL',
      'Austin, TX',
      'Boston, MA',
      'Virtual'
    ];
    
    // Prefer company's city if available
    if (company.headquarters_city) {
      return `${company.headquarters_city}, ${company.headquarters_state}`;
    }
    
    return locations[Math.floor(Math.random() * locations.length)];
  }

  async getCompany(companyId) {
    const result = await this.db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (result.rows.length === 0) throw new Error('Company not found');
    return result.rows[0];
  }
}

module.exports = { EventRecommendationService };