/**
 * GraphQueryService - Multi-hop relationship discovery using PostgreSQL graph extensions
 * 
 * This service provides enhanced relationship querying capabilities for the MyBidFit platform,
 * leveraging the entity_relationships table and ltree extensions for graph-like operations.
 */

const { Pool } = require('pg');

class GraphQueryService {
  constructor(pool = null) {
    this.pool = pool || new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'mybidfit',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    });
  }

  /**
   * Find entities within N degrees of separation from a source entity
   * @param {number} entityId - The source entity ID
   * @param {string} entityType - The source entity type ('company', 'opportunity', 'user', 'agency')
   * @param {number} maxDepth - Maximum degrees of separation (default: 2)
   * @param {string[]} relationshipTypes - Filter by specific relationship types (optional)
   * @returns {Promise<Array>} Connected entities with relationship paths and strengths
   */
  async findConnectedEntities(entityId, entityType, maxDepth = 2, relationshipTypes = null) {
    try {
      const query = `
        SELECT * FROM find_connected_entities($1, $2, $3, $4)
        ORDER BY total_strength DESC, separation_degree ASC
      `;
      
      const result = await this.pool.query(query, [
        entityId,
        entityType,
        maxDepth,
        relationshipTypes
      ]);
      
      return result.rows;
    } catch (error) {
      console.error('Error finding connected entities:', error);
      throw error;
    }
  }

  /**
   * Calculate entity centrality score for influence analysis
   * @param {number} entityId - Entity ID
   * @param {string} entityType - Entity type
   * @returns {Promise<Object>} Centrality metrics
   */
  async calculateEntityCentrality(entityId, entityType) {
    try {
      const query = `
        SELECT * FROM calculate_entity_centrality($1, $2)
      `;
      
      const result = await this.pool.query(query, [entityId, entityType]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error calculating entity centrality:', error);
      throw error;
    }
  }

  /**
   * Find potential partnerships for a company based on complementary capabilities
   * @param {number} companyId - Company ID to find partners for
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @returns {Promise<Array>} Potential partner companies with compatibility scores
   */
  async findPotentialPartners(companyId, maxResults = 10) {
    try {
      // First get company capabilities and industries
      const companyQuery = `
        SELECT id, name, capabilities, industries, service_regions, size_category
        FROM companies 
        WHERE id = $1
      `;
      
      const companyResult = await this.pool.query(companyQuery, [companyId]);
      if (companyResult.rows.length === 0) {
        throw new Error(`Company with ID ${companyId} not found`);
      }
      
      const company = companyResult.rows[0];
      
      // Find companies with complementary capabilities
      const partnersQuery = `
        WITH company_metrics AS (
          SELECT 
            c.id,
            c.name,
            c.capabilities,
            c.industries,
            c.service_regions,
            c.size_category,
            c.credibility_score,
            -- Calculate complementarity score based on different but overlapping capabilities
            CASE 
              WHEN array_length(c.capabilities & $2, 1) > 0 
                AND array_length(c.capabilities - $2, 1) > 0
              THEN 0.8 + (array_length(c.capabilities & $2, 1)::float / 
                         GREATEST(array_length(c.capabilities, 1), 1)) * 0.2
              WHEN array_length(c.capabilities - $2, 1) > 0
              THEN 0.6
              ELSE 0.1
            END as complementarity_score,
            -- Geographic synergy bonus
            CASE 
              WHEN c.service_regions && $3 THEN 0.2
              ELSE 0.0 
            END as geographic_bonus,
            -- Industry alignment bonus
            CASE 
              WHEN c.industries && $4 THEN 0.1
              ELSE 0.0
            END as industry_bonus
          FROM companies c
          WHERE c.id != $1
            AND c.is_active = true
        ),
        partnership_scores AS (
          SELECT 
            *,
            (complementarity_score + geographic_bonus + industry_bonus) as overall_score
          FROM company_metrics
          WHERE complementarity_score > 0.3
        )
        SELECT 
          ps.*,
          -- Check if there are existing relationships
          COALESCE(er.strength, 0) as existing_relationship_strength,
          er.relationship_type as existing_relationship_type
        FROM partnership_scores ps
        LEFT JOIN entity_relationships er ON (
          (er.source_id = $1 AND er.source_type = 'company' 
           AND er.target_id = ps.id AND er.target_type = 'company')
          OR
          (er.target_id = $1 AND er.target_type = 'company' 
           AND er.source_id = ps.id AND er.source_type = 'company')
        )
        ORDER BY ps.overall_score DESC
        LIMIT $5
      `;
      
      const result = await this.pool.query(partnersQuery, [
        companyId,
        company.capabilities,
        company.service_regions,
        company.industries,
        maxResults
      ]);
      
      return result.rows;
    } catch (error) {
      console.error('Error finding potential partners:', error);
      throw error;
    }
  }

  /**
   * Analyze opportunity fit for a company using graph relationships
   * @param {number} companyId - Company ID
   * @param {number} opportunityId - Opportunity ID
   * @returns {Promise<Object>} Enhanced fit analysis with relationship context
   */
  async analyzeOpportunityFit(companyId, opportunityId) {
    try {
      // Get basic fit analysis
      const basicFitQuery = `
        SELECT 
          c.name as company_name,
          c.capabilities,
          c.certifications,
          c.years_experience,
          c.team_size,
          c.credibility_score,
          o.title as opportunity_title,
          o.required_capabilities,
          o.preferred_capabilities,
          o.required_certifications,
          o.required_experience_years,
          o.buyer_organization,
          o.buyer_type
        FROM companies c
        CROSS JOIN opportunities o
        WHERE c.id = $1 AND o.id = $2
      `;
      
      const basicResult = await this.pool.query(basicFitQuery, [companyId, opportunityId]);
      if (basicResult.rows.length === 0) {
        throw new Error('Company or opportunity not found');
      }
      
      const fit = basicResult.rows[0];
      
      // Get relationship context
      const relationshipContext = await this.findConnectedEntities(companyId, 'company', 3);
      
      // Find relevant relationships for this opportunity
      const relevantRelationships = relationshipContext.filter(rel => 
        rel.connected_entity_type === 'company' || 
        rel.connected_entity_type === 'agency' ||
        (rel.connected_entity_type === 'opportunity' && 
         rel.relationship_path && rel.relationship_path.includes('bid_on'))
      );
      
      // Calculate enhanced fit score
      let enhancedScore = 0.5; // Base score
      
      // Capability match scoring
      const requiredMatch = fit.capabilities.filter(cap => 
        fit.required_capabilities.includes(cap)
      ).length;
      const preferredMatch = fit.capabilities.filter(cap => 
        fit.preferred_capabilities.includes(cap)
      ).length;
      
      enhancedScore += (requiredMatch / Math.max(fit.required_capabilities.length, 1)) * 0.3;
      enhancedScore += (preferredMatch / Math.max(fit.preferred_capabilities.length, 1)) * 0.1;
      
      // Experience and credibility factors
      if (fit.years_experience >= fit.required_experience_years) {
        enhancedScore += 0.1;
      }
      
      enhancedScore += (fit.credibility_score / 100) * 0.1;
      
      // Relationship bonus - companies with relevant partnerships or experience
      const relationshipBonus = relevantRelationships
        .filter(rel => rel.total_strength > 0.6)
        .reduce((bonus, rel) => bonus + (rel.total_strength * 0.05), 0);
      
      enhancedScore = Math.min(enhancedScore + relationshipBonus, 1.0);
      
      return {
        company_id: companyId,
        opportunity_id: opportunityId,
        company_name: fit.company_name,
        opportunity_title: fit.opportunity_title,
        enhanced_fit_score: Math.round(enhancedScore * 100) / 100,
        capability_matches: {
          required: requiredMatch,
          preferred: preferredMatch,
          total_required: fit.required_capabilities.length,
          total_preferred: fit.preferred_capabilities.length
        },
        relationship_context: relevantRelationships.slice(0, 5), // Top 5 relevant relationships
        recommendations: this.generateFitRecommendations(fit, relevantRelationships, enhancedScore)
      };
    } catch (error) {
      console.error('Error analyzing opportunity fit:', error);
      throw error;
    }
  }

  /**
   * Create or update a relationship between entities
   * @param {number} sourceId - Source entity ID
   * @param {string} sourceType - Source entity type
   * @param {number} targetId - Target entity ID
   * @param {string} targetType - Target entity type
   * @param {string} relationshipType - Type of relationship
   * @param {number} strength - Relationship strength (0.0 to 1.0)
   * @param {number} confidence - Confidence in relationship (0.0 to 1.0)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Created/updated relationship
   */
  async createRelationship(sourceId, sourceType, targetId, targetType, relationshipType, strength = 0.5, confidence = 0.8, metadata = {}) {
    try {
      const query = `
        INSERT INTO entity_relationships (
          source_id, source_type, target_id, target_type,
          relationship_type, strength, confidence, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (source_id, source_type, target_id, target_type, relationship_type)
        DO UPDATE SET 
          strength = EXCLUDED.strength,
          confidence = EXCLUDED.confidence,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        sourceId, sourceType, targetId, targetType,
        relationshipType, strength, confidence, JSON.stringify(metadata)
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating relationship:', error);
      throw error;
    }
  }

  /**
   * Generate fit recommendations based on analysis
   * @private
   */
  generateFitRecommendations(fit, relationships, score) {
    const recommendations = [];
    
    if (score < 0.6) {
      recommendations.push({
        type: 'capability_gap',
        message: 'Consider partnering with companies that have complementary capabilities',
        priority: 'high'
      });
    }
    
    if (fit.years_experience < fit.required_experience_years) {
      recommendations.push({
        type: 'experience',
        message: `Opportunity requires ${fit.required_experience_years} years experience, company has ${fit.years_experience}`,
        priority: 'medium'
      });
    }
    
    // Look for partnership opportunities in relationships
    const partnerOpportunities = relationships.filter(rel => 
      rel.connected_entity_type === 'company' && rel.total_strength > 0.7
    );
    
    if (partnerOpportunities.length > 0) {
      recommendations.push({
        type: 'partnership',
        message: 'Strong partnership opportunities available to enhance bid',
        priority: 'low',
        partners: partnerOpportunities.slice(0, 3)
      });
    }
    
    return recommendations;
  }

  /**
   * Get entity summary information
   * @param {number} entityId - Entity ID
   * @param {string} entityType - Entity type
   * @returns {Promise<Object>} Entity summary
   */
  async getEntitySummary(entityId, entityType) {
    try {
      const query = `
        SELECT * FROM entity_summary 
        WHERE entity_id = $1 AND entity_type = $2
      `;
      
      const result = await this.pool.query(query, [entityId, entityType]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting entity summary:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = GraphQueryService;