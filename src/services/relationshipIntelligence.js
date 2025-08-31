const pool = require('../database/connection');

/**
 * Relationship Intelligence Service
 * Handles professional network analysis, connection discovery, and relationship mapping
 * for the Atlanta Metro proof of concept
 */
class RelationshipIntelligenceService {
  
  /**
   * Get Atlanta metro organizations with filtering and search
   */
  async getOrganizations(filters = {}) {
    const { search, type, county, industry, influenceScore, limit = 50, offset = 0 } = filters;
    
    let query = `
      SELECT 
        id, name, type, description, website, address_city, address_county,
        industry_sectors, key_business_areas, strategic_priorities,
        influence_score, collaboration_score, event_activity_level,
        employee_count_range, annual_revenue_range,
        created_at, updated_at
      FROM atlanta_organizations 
      WHERE is_active = true
    `;
    
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }

    if (county) {
      paramCount++;
      query += ` AND address_county = $${paramCount}`;
      params.push(county);
    }

    if (industry) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(industry_sectors)`;
      params.push(industry);
    }

    if (influenceScore) {
      paramCount++;
      query += ` AND influence_score >= $${paramCount}`;
      params.push(influenceScore);
    }

    query += ` ORDER BY influence_score DESC, name ASC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get Atlanta metro professionals with filtering and search
   */
  async getPeople(filters = {}) {
    const { search, organizationId, seniority, department, expertise, influenceScore, limit = 50, offset = 0 } = filters;
    
    let query = `
      SELECT 
        p.id, p.first_name, p.last_name, p.title,
        p.seniority_level, p.department, p.years_experience,
        p.areas_of_expertise, p.professional_interests, p.speaking_topics,
        p.network_influence_score, p.connection_count, p.activity_level,
        o.name as organization_name, o.type as organization_type,
        p.created_at, p.updated_at
      FROM atlanta_people p
      LEFT JOIN atlanta_organizations o ON p.organization_id = o.id
      WHERE p.is_active = true AND p.privacy_consent = true
    `;
    
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount} OR p.title ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (organizationId) {
      paramCount++;
      query += ` AND p.organization_id = $${paramCount}`;
      params.push(organizationId);
    }

    if (seniority) {
      paramCount++;
      query += ` AND p.seniority_level = $${paramCount}`;
      params.push(seniority);
    }

    if (department) {
      paramCount++;
      query += ` AND p.department = $${paramCount}`;
      params.push(department);
    }

    if (expertise) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(p.areas_of_expertise)`;
      params.push(expertise);
    }

    if (influenceScore) {
      paramCount++;
      query += ` AND p.network_influence_score >= $${paramCount}`;
      params.push(influenceScore);
    }

    query += ` ORDER BY p.network_influence_score DESC, p.last_name ASC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Find connection paths between two people
   * Uses recursive CTE to find paths up to maxDegrees separation
   */
  async findConnectionPaths(fromPersonId, toPersonId, maxDegrees = 3) {
    const query = `
      WITH RECURSIVE connection_paths AS (
        -- Base case: direct connections
        SELECT 
          person_a_id as from_id,
          person_b_id as to_id,
          1 as degree,
          ARRAY[person_a_id, person_b_id] as path,
          relationship_strength,
          business_relevance_score,
          ARRAY[relationship_type] as relationship_types
        FROM atlanta_relationships 
        WHERE person_a_id = $1 AND is_active = true
        
        UNION ALL
        
        SELECT 
          person_b_id as from_id,
          person_a_id as to_id,
          1 as degree,
          ARRAY[person_b_id, person_a_id] as path,
          relationship_strength,
          business_relevance_score,
          ARRAY[relationship_type] as relationship_types
        FROM atlanta_relationships 
        WHERE person_b_id = $1 AND is_active = true
        
        UNION ALL
        
        -- Recursive case: extend paths
        SELECT 
          cp.from_id,
          r.person_b_id as to_id,
          cp.degree + 1,
          cp.path || r.person_b_id,
          CASE 
            WHEN cp.relationship_strength = 'strong' AND r.relationship_strength = 'strong' THEN 'strong'
            WHEN cp.relationship_strength = 'weak' OR r.relationship_strength = 'weak' THEN 'weak'
            ELSE 'medium'
          END as relationship_strength,
          LEAST(cp.business_relevance_score, r.business_relevance_score) as business_relevance_score,
          cp.relationship_types || r.relationship_type
        FROM connection_paths cp
        JOIN atlanta_relationships r ON cp.to_id = r.person_a_id
        WHERE cp.degree < $3 
          AND r.person_b_id != ALL(cp.path) 
          AND r.is_active = true
        
        UNION ALL
        
        SELECT 
          cp.from_id,
          r.person_a_id as to_id,
          cp.degree + 1,
          cp.path || r.person_a_id,
          CASE 
            WHEN cp.relationship_strength = 'strong' AND r.relationship_strength = 'strong' THEN 'strong'
            WHEN cp.relationship_strength = 'weak' OR r.relationship_strength = 'weak' THEN 'weak'
            ELSE 'medium'
          END as relationship_strength,
          LEAST(cp.business_relevance_score, r.business_relevance_score) as business_relevance_score,
          cp.relationship_types || r.relationship_type
        FROM connection_paths cp
        JOIN atlanta_relationships r ON cp.to_id = r.person_b_id
        WHERE cp.degree < $3 
          AND r.person_a_id != ALL(cp.path) 
          AND r.is_active = true
      )
      SELECT DISTINCT
        cp.degree,
        cp.path,
        cp.relationship_strength as overall_strength,
        cp.business_relevance_score,
        cp.relationship_types,
        json_agg(
          json_build_object(
            'id', p.id,
            'name', p.first_name || ' ' || p.last_name,
            'title', p.title,
            'organization', o.name
          )
        ) as people_in_path
      FROM connection_paths cp
      JOIN atlanta_people p ON p.id = ANY(cp.path)
      LEFT JOIN atlanta_organizations o ON p.organization_id = o.id
      WHERE cp.to_id = $2
      GROUP BY cp.degree, cp.path, cp.relationship_strength, cp.business_relevance_score, cp.relationship_types
      ORDER BY cp.degree ASC, cp.business_relevance_score DESC
      LIMIT 10;
    `;

    const result = await pool.query(query, [fromPersonId, toPersonId, maxDegrees]);
    
    return result.rows.map(row => ({
      degree: row.degree,
      path: row.path,
      overallStrength: row.overall_strength,
      businessRelevance: row.business_relevance_score,
      relationshipTypes: row.relationship_types,
      peopleInPath: row.people_in_path
    }));
  }

  /**
   * Get upcoming Atlanta events with filtering
   */
  async getEvents(filters = {}) {
    const { eventType, industryFocus, startDate, endDate, networkingPotential, maxPrice, limit = 20, offset = 0 } = filters;
    
    let query = `
      SELECT 
        id, name, event_type, description, start_date, end_date,
        venue_name, venue_address, expected_attendance_range,
        target_audience, ticket_price_range, industry_focus,
        networking_potential, business_value_rating,
        registration_url, event_website, social_media_hashtags,
        created_at
      FROM atlanta_events 
      WHERE is_active = true AND start_date > NOW()
    `;
    
    const params = [];
    let paramCount = 0;

    if (eventType) {
      paramCount++;
      query += ` AND event_type = $${paramCount}`;
      params.push(eventType);
    }

    if (industryFocus) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(industry_focus)`;
      params.push(industryFocus);
    }

    if (startDate) {
      paramCount++;
      query += ` AND start_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND start_date <= $${paramCount}`;
      params.push(endDate);
    }

    if (networkingPotential) {
      paramCount++;
      query += ` AND networking_potential = $${paramCount}`;
      params.push(networkingPotential);
    }

    // Note: This is a simplified price filter - would need more complex logic for ranges
    if (maxPrice) {
      query += ` AND ticket_price_range != '500+'`;
      if (maxPrice < 500) query += ` AND ticket_price_range != '201-500'`;
      if (maxPrice < 200) query += ` AND ticket_price_range != '101-500' AND ticket_price_range != '51-200'`;
      if (maxPrice < 50) query += ` AND (ticket_price_range = 'free' OR ticket_price_range = '1-50')`;
    }

    query += ` ORDER BY start_date ASC, business_value_rating DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Recommend events for a person based on their goals and network
   */
  async recommendEvents(personId, options = {}) {
    const { goals = [], targetIndustries = [], networkingObjectives = [], maxEvents = 5, timeframe = 'next_3_months' } = options;
    
    // Mock implementation - in production would use more sophisticated matching
    const events = await this.getEvents({ 
      industryFocus: targetIndustries[0], 
      limit: maxEvents * 2 
    });
    
    // Score events based on person's profile and objectives
    const scoredEvents = events.map(event => {
      let score = event.business_value_rating || 5.0;
      
      // Boost score for industry alignment
      if (targetIndustries.some(industry => event.industry_focus?.includes(industry))) {
        score += 2.0;
      }
      
      // Boost score for networking potential
      if (event.networking_potential === 'exceptional') score += 2.0;
      else if (event.networking_potential === 'high') score += 1.0;
      
      return {
        ...event,
        recommendationScore: Math.min(score, 10.0),
        matchingCriteria: {
          industryAlignment: targetIndustries.some(industry => event.industry_focus?.includes(industry)),
          networkingPotential: event.networking_potential,
          businessValue: event.business_value_rating
        }
      };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);

    return scoredEvents.slice(0, maxEvents);
  }

  /**
   * Get Atlanta business opportunities with filtering
   */
  async getOpportunities(filters = {}) {
    const { opportunityType, minValue, maxValue, industry, status = 'open', hasConnections, limit = 20, offset = 0 } = filters;
    
    let query = `
      SELECT 
        o.id, o.title, o.description, o.opportunity_type,
        o.estimated_value_min, o.estimated_value_max, o.timeline_months,
        o.required_capabilities, o.preferred_qualifications,
        o.competitive_landscape, o.success_factors, o.relationship_advantages,
        o.submission_deadline, o.decision_timeline, o.current_status,
        org.name as source_organization_name,
        p.first_name || ' ' || p.last_name as primary_contact_name,
        p.title as primary_contact_title,
        o.created_at, o.updated_at
      FROM atlanta_opportunities o
      LEFT JOIN atlanta_organizations org ON o.source_organization_id = org.id
      LEFT JOIN atlanta_people p ON o.primary_contact_person_id = p.id
      WHERE o.is_active = true
    `;
    
    const params = [];
    let paramCount = 0;

    if (opportunityType) {
      paramCount++;
      query += ` AND o.opportunity_type = $${paramCount}`;
      params.push(opportunityType);
    }

    if (minValue) {
      paramCount++;
      query += ` AND (o.estimated_value_min >= $${paramCount} OR o.estimated_value_max >= $${paramCount})`;
      params.push(minValue);
    }

    if (maxValue) {
      paramCount++;
      query += ` AND o.estimated_value_min <= $${paramCount}`;
      params.push(maxValue);
    }

    if (status) {
      paramCount++;
      query += ` AND o.current_status = $${paramCount}`;
      params.push(status);
    }

    if (hasConnections) {
      query += ` AND o.primary_contact_person_id IS NOT NULL`;
    }

    query += ` ORDER BY o.estimated_value_max DESC, o.submission_deadline ASC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Analyze opportunity fit with relationship advantages
   */
  async analyzeOpportunity(opportunityId, yourPersonId, yourCapabilities = []) {
    // Get opportunity details
    const opportunityQuery = `
      SELECT 
        o.*,
        org.name as source_organization_name,
        p.first_name || ' ' || p.last_name as primary_contact_name,
        p.id as primary_contact_id
      FROM atlanta_opportunities o
      LEFT JOIN atlanta_organizations org ON o.source_organization_id = org.id
      LEFT JOIN atlanta_people p ON o.primary_contact_person_id = p.id
      WHERE o.id = $1
    `;
    
    const opportunityResult = await pool.query(opportunityQuery, [opportunityId]);
    if (opportunityResult.rows.length === 0) {
      throw new Error('Opportunity not found');
    }
    
    const opportunity = opportunityResult.rows[0];
    
    // Find connection paths to decision makers if yourPersonId provided
    let connectionAdvantages = null;
    if (yourPersonId && opportunity.primary_contact_id) {
      const paths = await this.findConnectionPaths(yourPersonId, opportunity.primary_contact_id, 3);
      connectionAdvantages = {
        directConnection: paths.some(p => p.degree === 1),
        shortestPath: paths.length > 0 ? paths[0] : null,
        pathCount: paths.length,
        strongConnections: paths.filter(p => p.overallStrength === 'strong').length
      };
    }
    
    // Capability matching analysis
    const requiredCaps = opportunity.required_capabilities || [];
    const preferredCaps = opportunity.preferred_qualifications || [];
    
    const capabilityMatch = {
      requiredMatch: requiredCaps.filter(cap => yourCapabilities.includes(cap)),
      preferredMatch: preferredCaps.filter(cap => yourCapabilities.includes(cap)),
      missingRequired: requiredCaps.filter(cap => !yourCapabilities.includes(cap)),
      strengthScore: 0
    };
    
    // Calculate capability strength score
    const requiredMatchPercent = requiredCaps.length > 0 ? (capabilityMatch.requiredMatch.length / requiredCaps.length) * 100 : 100;
    const preferredMatchPercent = preferredCaps.length > 0 ? (capabilityMatch.preferredMatch.length / preferredCaps.length) * 100 : 100;
    capabilityMatch.strengthScore = (requiredMatchPercent * 0.7) + (preferredMatchPercent * 0.3);
    
    return {
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        type: opportunity.opportunity_type,
        valueRange: {
          min: opportunity.estimated_value_min,
          max: opportunity.estimated_value_max
        },
        timeline: opportunity.timeline_months,
        deadline: opportunity.submission_deadline,
        sourceOrganization: opportunity.source_organization_name,
        primaryContact: opportunity.primary_contact_name
      },
      capabilityAnalysis: capabilityMatch,
      relationshipAdvantages: connectionAdvantages,
      competitiveIntelligence: {
        landscape: opportunity.competitive_landscape,
        successFactors: opportunity.success_factors,
        relationshipAdvantages: opportunity.relationship_advantages
      },
      overallFitScore: (capabilityMatch.strengthScore * 0.6) + 
                      (connectionAdvantages?.shortestPath ? (40 - (connectionAdvantages.shortestPath.degree * 10)) : 0) * 0.4,
      recommendations: this.generateOpportunityRecommendations(capabilityMatch, connectionAdvantages, opportunity)
    };
  }

  /**
   * Generate recommendations for opportunity pursuit
   */
  generateOpportunityRecommendations(capabilityMatch, connectionAdvantages, opportunity) {
    const recommendations = [];
    
    if (capabilityMatch.missingRequired.length > 0) {
      recommendations.push({
        type: 'capability_gap',
        priority: 'high',
        action: `Address missing required capabilities: ${capabilityMatch.missingRequired.join(', ')}`,
        timeframe: 'immediate'
      });
    }
    
    if (connectionAdvantages?.shortestPath) {
      if (connectionAdvantages.shortestPath.degree === 1) {
        recommendations.push({
          type: 'relationship',
          priority: 'high',
          action: 'Leverage direct relationship for warm introduction and insights',
          timeframe: 'immediate'
        });
      } else if (connectionAdvantages.shortestPath.degree <= 2) {
        recommendations.push({
          type: 'relationship',
          priority: 'medium',
          action: `Request introduction through ${connectionAdvantages.shortestPath.degree - 1} connection(s)`,
          timeframe: 'within_week'
        });
      }
    } else {
      recommendations.push({
        type: 'relationship',
        priority: 'medium',
        action: 'Build relationships with decision makers through networking events',
        timeframe: 'ongoing'
      });
    }
    
    if (capabilityMatch.strengthScore > 80) {
      recommendations.push({
        type: 'positioning',
        priority: 'high',
        action: 'Highlight strong capability alignment in proposal',
        timeframe: 'proposal_stage'
      });
    }
    
    return recommendations;
  }

  /**
   * Get AI-generated relationship intelligence insights
   */
  async getInsights(filters = {}) {
    const { targetType, targetId, insightType, minRelevance = 7.0, limit = 10, offset = 0 } = filters;
    
    let query = `
      SELECT 
        id, target_type, target_id, insight_type, insight_title,
        insight_description, relevance_score, confidence_level,
        actionability_score, supporting_evidence, recommended_actions,
        generated_by, generated_at, expires_at
      FROM atlanta_relationship_insights 
      WHERE is_active = true AND relevance_score >= $1
    `;
    
    const params = [minRelevance];
    let paramCount = 1;

    if (targetType) {
      paramCount++;
      query += ` AND target_type = $${paramCount}`;
      params.push(targetType);
    }

    if (targetId) {
      paramCount++;
      query += ` AND target_id = $${paramCount}`;
      params.push(targetId);
    }

    if (insightType) {
      paramCount++;
      query += ` AND insight_type = $${paramCount}`;
      params.push(insightType);
    }

    query += ` AND (expires_at IS NULL OR expires_at > NOW())`;
    query += ` ORDER BY relevance_score DESC, generated_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Analyze network position and influence
   */
  async analyzeNetwork(personId, analysisType = 'comprehensive') {
    // Get person's basic network metrics
    const personQuery = `
      SELECT 
        p.*,
        o.name as organization_name, o.type as organization_type,
        o.influence_score as org_influence_score
      FROM atlanta_people p
      LEFT JOIN atlanta_organizations o ON p.organization_id = o.id
      WHERE p.id = $1
    `;
    
    const personResult = await pool.query(personQuery, [personId]);
    if (personResult.rows.length === 0) {
      throw new Error('Person not found');
    }
    
    const person = personResult.rows[0];
    
    // Get direct connections analysis
    const connectionsQuery = `
      SELECT 
        COUNT(*) as total_connections,
        COUNT(CASE WHEN relationship_strength = 'strong' THEN 1 END) as strong_connections,
        COUNT(CASE WHEN relationship_strength = 'medium' THEN 1 END) as medium_connections,
        COUNT(CASE WHEN relationship_strength = 'weak' THEN 1 END) as weak_connections,
        AVG(business_relevance_score) as avg_business_relevance,
        array_agg(DISTINCT relationship_type) as relationship_types
      FROM atlanta_relationships
      WHERE (person_a_id = $1 OR person_b_id = $1) AND is_active = true
    `;
    
    const connectionsResult = await pool.query(connectionsQuery, [personId]);
    const connectionStats = connectionsResult.rows[0];
    
    // Get industry network position
    const industryNetworkQuery = `
      SELECT 
        COUNT(DISTINCT p2.id) as industry_connections,
        AVG(p2.network_influence_score) as avg_industry_influence
      FROM atlanta_relationships r
      JOIN atlanta_people p2 ON (
        CASE WHEN r.person_a_id = $1 THEN r.person_b_id ELSE r.person_a_id END = p2.id
      )
      JOIN atlanta_organizations o2 ON p2.organization_id = o2.id
      JOIN atlanta_organizations o1 ON $2 = o1.id
      WHERE (r.person_a_id = $1 OR r.person_b_id = $1) 
        AND r.is_active = true
        AND o2.industry_sectors && o1.industry_sectors
    `;
    
    const industryNetworkResult = await pool.query(industryNetworkQuery, [personId, person.organization_id]);
    const industryNetwork = industryNetworkResult.rows[0];
    
    return {
      person: {
        id: person.id,
        name: `${person.first_name} ${person.last_name}`,
        title: person.title,
        organization: person.organization_name,
        seniority: person.seniority_level,
        currentInfluenceScore: person.network_influence_score
      },
      networkMetrics: {
        totalConnections: parseInt(connectionStats.total_connections) || 0,
        connectionStrengthDistribution: {
          strong: parseInt(connectionStats.strong_connections) || 0,
          medium: parseInt(connectionStats.medium_connections) || 0,
          weak: parseInt(connectionStats.weak_connections) || 0
        },
        averageBusinessRelevance: parseFloat(connectionStats.avg_business_relevance) || 0,
        relationshipTypes: connectionStats.relationship_types || []
      },
      industryPosition: {
        industryConnections: parseInt(industryNetwork.industry_connections) || 0,
        averageIndustryInfluence: parseFloat(industryNetwork.avg_industry_influence) || 0,
        industryNetworkPenetration: person.organization_id ? 
          ((parseInt(industryNetwork.industry_connections) || 0) / (parseInt(connectionStats.total_connections) || 1)) * 100 : 0
      },
      influenceAnalysis: {
        currentScore: person.network_influence_score,
        organizationBoost: person.org_influence_score || 0,
        networkQualityScore: this.calculateNetworkQualityScore(connectionStats),
        growthPotential: this.calculateGrowthPotential(person, connectionStats, industryNetwork)
      },
      recommendations: this.generateNetworkRecommendations(person, connectionStats, industryNetwork)
    };
  }

  /**
   * Calculate network quality score based on connections
   */
  calculateNetworkQualityScore(connectionStats) {
    const total = parseInt(connectionStats.total_connections) || 1;
    const strong = parseInt(connectionStats.strong_connections) || 0;
    const medium = parseInt(connectionStats.medium_connections) || 0;
    const avgRelevance = parseFloat(connectionStats.avg_business_relevance) || 0;
    
    // Weight strong connections more heavily
    const weightedScore = ((strong * 3) + (medium * 2) + (total - strong - medium)) / total;
    const relevanceBonus = avgRelevance / 10;
    
    return Math.min((weightedScore * 3) + relevanceBonus, 10);
  }

  /**
   * Calculate growth potential for networking
   */
  calculateGrowthPotential(person, connectionStats, industryNetwork) {
    const factors = [];
    let score = 5.0; // Base score
    
    // Seniority factor
    if (person.seniority_level === 'c-level') {
      score += 2.0;
      factors.push('C-level position provides high networking potential');
    } else if (person.seniority_level === 'senior') {
      score += 1.0;
      factors.push('Senior position offers good networking opportunities');
    }
    
    // Industry network penetration
    const penetration = parseInt(industryNetwork.industry_connections) / (parseInt(connectionStats.total_connections) || 1);
    if (penetration < 0.3) {
      score += 1.5;
      factors.push('Low industry network penetration - high growth opportunity');
    }
    
    // Connection quality
    const qualityScore = this.calculateNetworkQualityScore(connectionStats);
    if (qualityScore < 6) {
      score += 1.0;
      factors.push('Network quality can be improved through strategic connections');
    }
    
    return {
      score: Math.min(score, 10),
      factors
    };
  }

  /**
   * Generate networking recommendations
   */
  generateNetworkRecommendations(person, connectionStats, industryNetwork) {
    const recommendations = [];
    
    const totalConnections = parseInt(connectionStats.total_connections) || 0;
    const strongConnections = parseInt(connectionStats.strong_connections) || 0;
    const industryConnections = parseInt(industryNetwork.industry_connections) || 0;
    
    if (totalConnections < 50) {
      recommendations.push({
        type: 'network_expansion',
        priority: 'high',
        action: 'Focus on expanding total network size through industry events',
        target: 'Aim for 75+ professional connections within 6 months'
      });
    }
    
    if (strongConnections / totalConnections < 0.3) {
      recommendations.push({
        type: 'relationship_deepening',
        priority: 'medium',
        action: 'Strengthen existing relationships through regular engagement',
        target: 'Convert 5+ medium connections to strong connections quarterly'
      });
    }
    
    if (industryConnections < totalConnections * 0.4) {
      recommendations.push({
        type: 'industry_focus',
        priority: 'high',
        action: 'Increase industry-specific networking and event attendance',
        target: 'Build 10+ new industry connections this quarter'
      });
    }
    
    if (person.seniority_level === 'c-level' && totalConnections < 100) {
      recommendations.push({
        type: 'executive_networking',
        priority: 'high',
        action: 'Engage in executive-level forums and C-suite networking events',
        target: 'Build relationships with 20+ other C-level executives'
      });
    }
    
    return recommendations;
  }

  /**
   * Request introduction through connection path
   */
  async requestIntroduction({ fromPersonId, toPersonId, introducerPersonId, message, context, urgency = 'normal' }) {
    // In a production system, this would create a record and send notifications
    // For the PoC, we'll just return a mock response
    
    return {
      requestId: `intro_${Date.now()}`,
      status: 'pending',
      fromPersonId,
      toPersonId,
      introducerPersonId,
      message,
      context,
      urgency,
      createdAt: new Date().toISOString(),
      estimatedResponse: urgency === 'high' ? '24 hours' : urgency === 'normal' ? '3-5 days' : '1 week',
      nextSteps: [
        'Introduction request sent to introducer',
        'Introducer will review and forward if appropriate',
        'You will be notified of response'
      ]
    };
  }

  /**
   * Get dashboard data for relationship intelligence
   */
  async getDashboardData(personId) {
    // Get person's network stats
    const networkAnalysis = await this.analyzeNetwork(personId);
    
    // Get recent insights
    const recentInsights = await this.getInsights({ 
      targetType: 'person', 
      targetId: personId, 
      limit: 5 
    });
    
    // Get upcoming recommended events
    const upcomingEvents = await this.recommendEvents(personId, { maxEvents: 3 });
    
    // Get relevant opportunities
    const opportunities = await this.getOpportunities({ limit: 5 });
    
    return {
      networkSummary: {
        totalConnections: networkAnalysis.networkMetrics.totalConnections,
        influenceScore: networkAnalysis.person.currentInfluenceScore,
        networkQuality: networkAnalysis.influenceAnalysis.networkQualityScore,
        industryConnections: networkAnalysis.industryPosition.industryConnections
      },
      recentInsights: recentInsights.slice(0, 3),
      upcomingEvents: upcomingEvents,
      relevantOpportunities: opportunities.slice(0, 3),
      actionableRecommendations: networkAnalysis.recommendations.slice(0, 3),
      weeklyActivity: {
        newConnections: Math.floor(Math.random() * 5), // Mock data
        eventsAttended: Math.floor(Math.random() * 3),
        opportunitiesViewed: Math.floor(Math.random() * 8),
        introductionsRequested: Math.floor(Math.random() * 2)
      }
    };
  }
}

module.exports = { RelationshipIntelligenceService };