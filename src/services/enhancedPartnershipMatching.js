/**
 * Enhanced Partnership Matching Service with Graph Relationship Intelligence
 * 
 * This service extends the basic partnership matching with multi-hop relationship
 * analysis to find deeper partnership opportunities and network effects.
 */

const { PartnershipMatchingService } = require('./partnershipMatching');
const GraphQueryService = require('./GraphQueryService');
const { logger } = require('../utils/logger');

class EnhancedPartnershipMatchingService extends PartnershipMatchingService {
  constructor() {
    super();
    this.graphService = new GraphQueryService();
  }

  /**
   * Enhanced partnership matching with graph relationship analysis
   * @param {number} companyId - Source company ID
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Enhanced partnership recommendations
   */
  async findEnhancedPartnershipMatches(companyId, options = {}) {
    try {
      logger.info(`Finding enhanced partnership matches for company ${companyId}`);

      // Get basic partnership matches first
      const basicMatches = await this.findPartnershipMatches(companyId, options);

      // Get source company
      const companyResult = await this.db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
      if (companyResult.rows.length === 0) {
        throw new Error('Company not found');
      }
      const sourceCompany = companyResult.rows[0];

      // Get graph relationship context for source company
      const relationshipContext = await this.graphService.findConnectedEntities(
        companyId, 'company', 3, // 3 degrees of separation
        ['worked_with', 'competes_for', 'partners_with', 'similar_to', 'supplies_to']
      );

      // Get network centrality
      const centrality = await this.graphService.calculateEntityCentrality(companyId, 'company');

      // Enhance matches with graph intelligence
      const enhancedMatches = await this.enhancePartnershipMatches(
        basicMatches.topMatches, relationshipContext, sourceCompany
      );

      // Find indirect partnership opportunities (2nd and 3rd degree connections)
      const indirectOpportunities = await this.findIndirectPartnershipOpportunities(
        companyId, relationshipContext
      );

      // Generate network-based partnership strategies
      const networkStrategies = this.generateNetworkPartnershipStrategies(
        sourceCompany, enhancedMatches, relationshipContext, centrality
      );

      logger.info(`Enhanced partnership analysis complete: ${enhancedMatches.length} enhanced matches, ${indirectOpportunities.length} indirect opportunities`);

      return {
        ...basicMatches,
        enhancedMatches,
        indirectOpportunities,
        networkStrategies,
        networkAnalysis: {
          centrality,
          totalNetworkConnections: relationshipContext.length,
          strongConnections: relationshipContext.filter(r => r.total_strength > 0.7).length,
          networkReach: this.calculateNetworkReach(relationshipContext),
          partnershipPotential: this.calculatePartnershipPotential(relationshipContext)
        },
        graphEnhancementInsights: this.generateGraphInsights(basicMatches, enhancedMatches, indirectOpportunities)
      };

    } catch (error) {
      logger.error('Enhanced partnership matching failed:', error);
      throw error;
    }
  }

  /**
   * Enhance basic partnership matches with graph relationship data
   * @private
   */
  async enhancePartnershipMatches(basicMatches, relationships, sourceCompany) {
    const enhancedMatches = [];

    for (const match of basicMatches) {
      // Find existing relationships to this potential partner
      const partnerRelationships = relationships.filter(r => 
        r.connected_entity_id === match.partner.id && r.connected_entity_type === 'company'
      );

      // Find mutual connections (companies connected to both)
      const mutualConnections = await this.findMutualConnections(
        sourceCompany.id, match.partner.id
      );

      // Calculate network-enhanced partnership score
      const networkEnhancement = this.calculateNetworkEnhancement(
        match, partnerRelationships, mutualConnections
      );

      // Generate graph-based recommendations
      const graphRecommendations = this.generateGraphPartnershipRecommendations(
        sourceCompany, match.partner, partnerRelationships, mutualConnections
      );

      enhancedMatches.push({
        ...match,
        basicScore: match.score.overall,
        enhancedScore: Math.min(100, match.score.overall + networkEnhancement.bonus),
        networkEnhancement,
        partnerRelationships,
        mutualConnections: mutualConnections.slice(0, 5), // Top 5 mutual connections
        graphRecommendations,
        trustScore: this.calculateTrustScore(partnerRelationships, mutualConnections),
        networkPath: this.findShortestNetworkPath(sourceCompany.id, match.partner.id, relationships)
      });
    }

    // Re-sort by enhanced score
    enhancedMatches.sort((a, b) => b.enhancedScore - a.enhancedScore);

    return enhancedMatches;
  }

  /**
   * Find indirect partnership opportunities through network connections
   * @private
   */
  async findIndirectPartnershipOpportunities(companyId, relationships) {
    const indirectOpportunities = [];

    // Look for 2nd and 3rd degree company connections
    const secondDegreeCompanies = relationships.filter(r => 
      r.connected_entity_type === 'company' && r.separation_degree === 2
    );

    for (const connection of secondDegreeCompanies) {
      // Get the intermediary company details
      const intermediaryPath = connection.relationship_path;
      
      // Find the direct connection to this 2nd degree company
      const directToIntermediary = relationships.find(r => 
        r.connected_entity_type === 'company' && 
        r.separation_degree === 1 &&
        connection.relationship_path && 
        connection.relationship_path.toString().includes(r.connected_entity_id.toString())
      );

      if (directToIntermediary && connection.total_strength > 0.5) {
        // Get potential partner company details
        const partnerResult = await this.db.query('SELECT * FROM companies WHERE id = $1', [connection.connected_entity_id]);
        
        if (partnerResult.rows.length > 0) {
          const potentialPartner = partnerResult.rows[0];
          
          // Calculate basic partnership score
          const sourceCompany = await this.db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
          const basicScore = await this.calculatePartnershipScore(sourceCompany.rows[0], potentialPartner);

          indirectOpportunities.push({
            partner: potentialPartner,
            connectionType: 'indirect',
            separationDegree: connection.separation_degree,
            connectionStrength: connection.total_strength,
            intermediaryId: directToIntermediary.connected_entity_id,
            partnershipScore: basicScore,
            introduction_potential: connection.total_strength * directToIntermediary.total_strength,
            recommendation: {
              type: 'network_introduction',
              description: `Introduction possible through mutual connection with ${directToIntermediary.connected_entity_id}`,
              trustLevel: connection.total_strength > 0.7 ? 'high' : 'medium'
            }
          });
        }
      }
    }

    // Sort by introduction potential
    indirectOpportunities.sort((a, b) => b.introduction_potential - a.introduction_potential);

    return indirectOpportunities.slice(0, 10); // Top 10 indirect opportunities
  }

  /**
   * Calculate network enhancement bonus for partnerships
   * @private
   */
  calculateNetworkEnhancement(match, partnerRelationships, mutualConnections) {
    let bonus = 0;
    const enhancements = [];

    // Direct relationship bonus
    if (partnerRelationships.length > 0) {
      const strongestRelationship = Math.max(...partnerRelationships.map(r => r.total_strength));
      bonus += strongestRelationship * 10;
      enhancements.push(`Direct relationship strength: ${Math.round(strongestRelationship * 100)}%`);
    }

    // Mutual connections bonus
    if (mutualConnections.length > 0) {
      bonus += Math.min(15, mutualConnections.length * 3);
      enhancements.push(`${mutualConnections.length} mutual connections provide trust and validation`);
    }

    // Network path bonus (shorter path = higher bonus)
    const networkPathLength = this.estimateNetworkPathLength(match.partner.id, partnerRelationships);
    if (networkPathLength <= 2) {
      bonus += 10 - (networkPathLength * 3);
      enhancements.push(`Short network path (${networkPathLength} degrees) enables easy introduction`);
    }

    return {
      bonus: Math.round(bonus),
      enhancements
    };
  }

  /**
   * Find mutual connections between two companies
   * @private
   */
  async findMutualConnections(companyId1, companyId2) {
    // Find companies connected to both companies
    const mutualQuery = `
      WITH company1_connections AS (
        SELECT DISTINCT target_id, target_type, relationship_type, strength
        FROM entity_relationships 
        WHERE source_id = $1 AND source_type = 'company'
        UNION
        SELECT DISTINCT source_id, source_type, relationship_type, strength
        FROM entity_relationships 
        WHERE target_id = $1 AND target_type = 'company'
      ),
      company2_connections AS (
        SELECT DISTINCT target_id, target_type, relationship_type, strength
        FROM entity_relationships 
        WHERE source_id = $2 AND source_type = 'company'
        UNION
        SELECT DISTINCT source_id, source_type, relationship_type, strength
        FROM entity_relationships 
        WHERE target_id = $2 AND target_type = 'company'
      )
      SELECT 
        c1.target_id as mutual_entity_id,
        c1.target_type as mutual_entity_type,
        c1.strength as strength_to_company1,
        c2.strength as strength_to_company2,
        (c1.strength + c2.strength) / 2 as average_strength,
        es.entity_name
      FROM company1_connections c1
      JOIN company2_connections c2 ON c1.target_id = c2.target_id AND c1.target_type = c2.target_type
      LEFT JOIN entity_summary es ON c1.target_id = es.entity_id AND c1.target_type = es.entity_type
      WHERE c1.target_id NOT IN ($1, $2)
      ORDER BY average_strength DESC
      LIMIT 10
    `;

    const result = await this.db.query(mutualQuery, [companyId1, companyId2]);
    return result.rows;
  }

  /**
   * Calculate trust score based on relationships and mutual connections
   * @private
   */
  calculateTrustScore(partnerRelationships, mutualConnections) {
    let trustScore = 50; // Base trust score

    // Direct relationship trust
    if (partnerRelationships.length > 0) {
      const avgRelationshipStrength = partnerRelationships.reduce((sum, r) => sum + r.total_strength, 0) / partnerRelationships.length;
      trustScore += avgRelationshipStrength * 30;
    }

    // Mutual connections trust
    if (mutualConnections.length > 0) {
      const avgMutualStrength = mutualConnections.reduce((sum, mc) => sum + mc.average_strength, 0) / mutualConnections.length;
      trustScore += avgMutualStrength * 20;
      trustScore += Math.min(15, mutualConnections.length * 2); // More mutual connections = higher trust
    }

    return Math.min(100, Math.round(trustScore));
  }

  /**
   * Generate network-based partnership strategies
   * @private
   */
  generateNetworkPartnershipStrategies(sourceCompany, enhancedMatches, relationships, centrality) {
    const strategies = [];

    // Hub Strategy - if company has high centrality
    if (centrality && centrality.centrality_score > 15) {
      strategies.push({
        type: 'network_hub',
        title: 'Leverage Network Hub Position',
        description: 'Your strong network position enables you to orchestrate multi-partner collaborations.',
        approach: 'Act as the lead coordinator in partnership consortiums',
        recommendedPartners: enhancedMatches.slice(0, 3).map(m => m.partner.name),
        expectedBenefit: 'Premium pricing as consortium leader'
      });
    }

    // Bridge Strategy - if company connects different clusters
    const bridgeOpportunities = this.identifyBridgeOpportunities(relationships);
    if (bridgeOpportunities.length > 0) {
      strategies.push({
        type: 'network_bridge',
        title: 'Network Bridge Opportunities',
        description: 'You can bridge different industry clusters or regions.',
        approach: 'Facilitate partnerships between disconnected network segments',
        bridgeOpportunities: bridgeOpportunities.slice(0, 3),
        expectedBenefit: 'Unique positioning and market access'
      });
    }

    // Cluster Strategy - if company is in dense network cluster
    const clusterDensity = this.calculateClusterDensity(relationships);
    if (clusterDensity > 0.7) {
      strategies.push({
        type: 'cluster_collaboration',
        title: 'Industry Cluster Collaboration',
        description: 'Form strategic alliances within your dense industry cluster.',
        approach: 'Create formalized industry consortium or alliance',
        clusterPartners: enhancedMatches.filter(m => m.networkEnhancement.bonus > 10).slice(0, 4),
        expectedBenefit: 'Collective bargaining power and shared resources'
      });
    }

    return strategies;
  }

  /**
   * Generate graph-based partnership recommendations
   * @private
   */
  generateGraphPartnershipRecommendations(sourceCompany, partner, relationships, mutualConnections) {
    const recommendations = [];

    // Introduction strategy
    if (mutualConnections.length > 0) {
      const bestIntroduction = mutualConnections[0];
      recommendations.push({
        type: 'network_introduction',
        priority: 'high',
        title: 'Warm Introduction Available',
        description: `${bestIntroduction.entity_name} has strong connections to both companies and could facilitate an introduction.`,
        action: `Request introduction through ${bestIntroduction.entity_name}`,
        expectedOutcome: 'Higher response rate and initial trust'
      });
    }

    // Trust validation strategy
    if (relationships.length > 0) {
      const strongestConnection = relationships.reduce((max, r) => 
        r.total_strength > max.total_strength ? r : max
      );
      recommendations.push({
        type: 'trust_validation',
        priority: 'medium',
        title: 'Leverage Existing Relationship',
        description: `Your existing ${strongestConnection.relationship_type} relationship provides credibility foundation.`,
        action: 'Reference shared history and successful collaborations',
        expectedOutcome: 'Reduced partnership negotiation time'
      });
    }

    // Network expansion strategy
    if (mutualConnections.length > 2) {
      recommendations.push({
        type: 'network_expansion',
        priority: 'medium',
        title: 'Network Synergy Opportunity',
        description: `Partnership would connect two well-connected network clusters, creating broader reach for both companies.`,
        action: 'Highlight network expansion benefits in partnership proposal',
        expectedOutcome: 'Enhanced value proposition for both parties'
      });
    }

    return recommendations;
  }

  /**
   * Helper methods for network analysis
   * @private
   */
  findShortestNetworkPath(sourceId, targetId, relationships) {
    // Simplified shortest path - find most direct connection
    const directConnection = relationships.find(r => 
      r.connected_entity_id === targetId && r.connected_entity_type === 'company'
    );

    if (directConnection) {
      return {
        length: directConnection.separation_degree,
        strength: directConnection.total_strength,
        path: directConnection.relationship_path
      };
    }

    return { length: Infinity, strength: 0, path: null };
  }

  calculateNetworkReach(relationships) {
    const uniqueEntities = new Set();
    relationships.forEach(r => uniqueEntities.add(`${r.connected_entity_type}-${r.connected_entity_id}`));
    return uniqueEntities.size;
  }

  calculatePartnershipPotential(relationships) {
    const companyConnections = relationships.filter(r => r.connected_entity_type === 'company');
    const strongConnections = companyConnections.filter(r => r.total_strength > 0.6);
    return companyConnections.length > 0 ? (strongConnections.length / companyConnections.length) * 100 : 0;
  }

  identifyBridgeOpportunities(relationships) {
    // Simplified bridge identification - look for diverse connection types
    const connectionTypes = [...new Set(relationships.map(r => r.relationship_type))];
    const entityTypes = [...new Set(relationships.map(r => r.connected_entity_type))];
    
    return connectionTypes.length > 3 && entityTypes.length > 2 ? 
      relationships.filter(r => r.total_strength > 0.7).slice(0, 3) : [];
  }

  calculateClusterDensity(relationships) {
    // Simplified density calculation
    const companyConnections = relationships.filter(r => r.connected_entity_type === 'company');
    const strongConnections = companyConnections.filter(r => r.total_strength > 0.7);
    return companyConnections.length > 0 ? strongConnections.length / companyConnections.length : 0;
  }

  estimateNetworkPathLength(partnerId, relationships) {
    const directConnection = relationships.find(r => r.connected_entity_id === partnerId);
    return directConnection ? directConnection.separation_degree : 3;
  }

  generateGraphInsights(basicMatches, enhancedMatches, indirectOpportunities) {
    const insights = [];

    // Network enhancement insights
    const improvementCount = enhancedMatches.filter(m => m.enhancedScore > m.basicScore).length;
    if (improvementCount > 0) {
      insights.push({
        type: 'enhancement_success',
        title: 'Network Analysis Improved Matches',
        description: `Graph relationship analysis improved ${improvementCount} partnership scores by an average of ${
          Math.round(enhancedMatches.reduce((sum, m) => sum + (m.enhancedScore - m.basicScore), 0) / improvementCount)
        } points.`,
        impact: 'positive'
      });
    }

    // Indirect opportunity insights
    if (indirectOpportunities.length > 0) {
      insights.push({
        type: 'network_expansion',
        title: 'Hidden Partnership Opportunities',
        description: `Found ${indirectOpportunities.length} potential partners through network connections that weren't discovered by basic matching.`,
        impact: 'opportunity'
      });
    }

    // Trust insights
    const highTrustMatches = enhancedMatches.filter(m => m.trustScore > 75).length;
    if (highTrustMatches > 0) {
      insights.push({
        type: 'trust_advantage',
        title: 'High-Trust Partnerships Available',
        description: `${highTrustMatches} partnerships have high trust scores due to existing relationships and mutual connections.`,
        impact: 'positive'
      });
    }

    return insights;
  }
}

module.exports = { EnhancedPartnershipMatchingService };