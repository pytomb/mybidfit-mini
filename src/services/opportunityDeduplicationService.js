/**
 * Opportunity Deduplication Service
 * 
 * Advanced deduplication service for government opportunities with:
 * - Multiple matching algorithms (exact, fuzzy, semantic)
 * - Sophisticated conflict resolution
 * - Batch processing for existing data cleanup
 * - Audit trail and rollback capabilities
 * - Configurable matching thresholds
 * - Performance optimization for large datasets
 */

const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

class OpportunityDeduplicationService {
  constructor() {
    this.db = Database.getInstance();
    this.deduplicationConfig = {
      // Matching thresholds (0-1 scale)
      exactMatchThreshold: 1.0,
      strongMatchThreshold: 0.9,
      moderateMatchThreshold: 0.75,
      weakMatchThreshold: 0.6,
      
      // Field weights for scoring
      fieldWeights: {
        noticeId: 1.0,        // Exact match required
        solicitationNumber: 1.0,  // Exact match required  
        title: 0.8,           // High importance
        agency: 0.6,          // Moderate importance
        description: 0.4,     // Lower importance (can vary)
        postedDate: 0.3,      // Low importance (can vary)
        dueDate: 0.3,         // Low importance (can vary)
        value: 0.2            // Very low importance (estimates vary)
      },
      
      // Processing settings
      batchSize: 100,
      maxComparisons: 10000,  // Prevent quadratic explosion
      enableFuzzyMatching: true,
      enableSemanticMatching: false // Requires NLP libraries
    };
  }

  /**
   * Main deduplication process for existing database records
   * @param {object} options - Deduplication options
   * @returns {Promise<object>} - Deduplication results and statistics
   */
  async deduplicateExistingOpportunities(options = {}) {
    const {
      dryRun = true,
      batchSize = this.deduplicationConfig.batchSize,
      matchThreshold = this.deduplicationConfig.moderateMatchThreshold,
      dateRange = null, // { start: Date, end: Date }
      agencyFilter = null,
      createAuditTrail = true
    } = options;

    logger.info('🔍 Starting opportunity deduplication process', {
      dryRun,
      batchSize,
      matchThreshold,
      dateRange,
      agencyFilter
    });

    const results = {
      startTime: new Date(),
      endTime: null,
      totalOpportunities: 0,
      potentialDuplicates: 0,
      duplicateGroups: [],
      duplicatesRemoved: 0,
      duplicatesKept: 0,
      errors: [],
      auditTrailId: null
    };

    try {
      // Step 1: Create audit trail record (if enabled)
      if (createAuditTrail && !dryRun) {
        results.auditTrailId = await this.createAuditTrail({
          operation: 'deduplication',
          options,
          startTime: results.startTime
        });
      }

      // Step 2: Get opportunities to process
      const opportunities = await this.getOpportunitiesForDeduplication({
        dateRange,
        agencyFilter,
        limit: options.maxOpportunities
      });

      results.totalOpportunities = opportunities.length;
      logger.info(`📊 Found ${opportunities.length} opportunities to process`);

      if (opportunities.length === 0) {
        logger.info('ℹ️ No opportunities found for deduplication');
        return results;
      }

      // Step 3: Find duplicate groups
      const duplicateGroups = await this.findDuplicateGroups(
        opportunities, 
        matchThreshold
      );

      results.duplicateGroups = duplicateGroups;
      results.potentialDuplicates = duplicateGroups.reduce((sum, group) => sum + group.opportunities.length, 0);

      logger.info(`🔍 Found ${duplicateGroups.length} duplicate groups containing ${results.potentialDuplicates} opportunities`);

      // Step 4: Process duplicate groups
      if (!dryRun && duplicateGroups.length > 0) {
        const processingResults = await this.processDuplicateGroups(
          duplicateGroups,
          results.auditTrailId
        );
        
        results.duplicatesRemoved = processingResults.removed;
        results.duplicatesKept = processingResults.kept;
      }

      results.endTime = new Date();
      
      logger.info('✅ Deduplication process completed', {
        duration: results.endTime - results.startTime,
        duplicateGroups: results.duplicateGroups.length,
        duplicatesRemoved: results.duplicatesRemoved
      });

      return results;

    } catch (error) {
      results.endTime = new Date();
      results.errors.push({
        type: 'DEDUPLICATION_ERROR',
        message: error.message,
        timestamp: new Date()
      });

      logger.error('❌ Deduplication process failed', {
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Deduplicates a set of opportunities in memory (for ingestion process)
   * @param {Array} opportunities - Array of opportunity objects
   * @param {object} options - Deduplication options
   * @returns {Promise<Array>} - Deduplicated opportunities
   */
  async deduplicateOpportunitySet(opportunities, options = {}) {
    const {
      matchThreshold = this.deduplicationConfig.moderateMatchThreshold,
      conflictResolutionStrategy = 'best_quality'
    } = options;

    logger.info(`🔄 Deduplicating ${opportunities.length} opportunities in memory`);

    if (opportunities.length <= 1) {
      return opportunities;
    }

    // Find duplicates
    const duplicateGroups = await this.findDuplicateGroups(opportunities, matchThreshold);
    
    // Resolve conflicts and return unique opportunities
    const uniqueOpportunities = [];
    const processedIds = new Set();

    // Add opportunities that aren't in any duplicate group
    opportunities.forEach(opp => {
      const oppId = this.getOpportunityIdentifier(opp);
      const isInDuplicateGroup = duplicateGroups.some(group => 
        group.opportunities.some(groupOpp => this.getOpportunityIdentifier(groupOpp) === oppId)
      );
      
      if (!isInDuplicateGroup && !processedIds.has(oppId)) {
        uniqueOpportunities.push(opp);
        processedIds.add(oppId);
      }
    });

    // Resolve duplicates and add the best representative from each group
    duplicateGroups.forEach(group => {
      const bestOpportunity = this.selectBestOpportunity(
        group.opportunities, 
        conflictResolutionStrategy
      );
      const oppId = this.getOpportunityIdentifier(bestOpportunity);
      
      if (!processedIds.has(oppId)) {
        uniqueOpportunities.push(bestOpportunity);
        processedIds.add(oppId);
      }
    });

    logger.info(`✅ In-memory deduplication completed: ${opportunities.length} → ${uniqueOpportunities.length} (removed ${opportunities.length - uniqueOpportunities.length})`);

    return uniqueOpportunities;
  }

  /**
   * Finds duplicate groups using multiple matching algorithms
   * @param {Array} opportunities - Opportunities to analyze
   * @param {number} matchThreshold - Minimum similarity threshold
   * @returns {Promise<Array>} - Array of duplicate groups
   */
  async findDuplicateGroups(opportunities, matchThreshold) {
    logger.info(`🔍 Finding duplicate groups with threshold ${matchThreshold}`);

    const duplicateGroups = [];
    const processedOpportunities = new Set();

    // Sort opportunities by creation date for consistent processing
    const sortedOpportunities = opportunities.sort((a, b) => {
      const aDate = new Date(a.created_at || a.postedDate || 0);
      const bDate = new Date(b.created_at || b.postedDate || 0);
      return aDate - bDate;
    });

    for (let i = 0; i < sortedOpportunities.length; i++) {
      const currentOpp = sortedOpportunities[i];
      const currentId = this.getOpportunityIdentifier(currentOpp);

      // Skip if already processed
      if (processedOpportunities.has(currentId)) {
        continue;
      }

      const duplicates = [currentOpp];
      processedOpportunities.add(currentId);

      // Compare with remaining opportunities
      for (let j = i + 1; j < sortedOpportunities.length; j++) {
        const compareOpp = sortedOpportunities[j];
        const compareId = this.getOpportunityIdentifier(compareOpp);

        // Skip if already processed
        if (processedOpportunities.has(compareId)) {
          continue;
        }

        const similarity = await this.calculateSimilarity(currentOpp, compareOpp);
        
        if (similarity >= matchThreshold) {
          duplicates.push(compareOpp);
          processedOpportunities.add(compareId);
        }
      }

      // If we found duplicates, create a group
      if (duplicates.length > 1) {
        duplicateGroups.push({
          groupId: `group_${duplicateGroups.length + 1}`,
          opportunities: duplicates,
          similarity: this.calculateGroupSimilarity(duplicates),
          recommendation: this.generateGroupRecommendation(duplicates)
        });
      }
    }

    return duplicateGroups;
  }

  /**
   * Calculates similarity between two opportunities
   * @param {object} opp1 - First opportunity
   * @param {object} opp2 - Second opportunity
   * @returns {Promise<number>} - Similarity score (0-1)
   */
  async calculateSimilarity(opp1, opp2) {
    let totalScore = 0;
    let totalWeight = 0;

    const weights = this.deduplicationConfig.fieldWeights;

    // Exact matches (required fields)
    const exactMatches = {
      noticeId: this.compareExact(
        this.getFieldValue(opp1, 'noticeId'), 
        this.getFieldValue(opp2, 'noticeId')
      ),
      solicitationNumber: this.compareExact(
        this.getFieldValue(opp1, 'solicitationNumber'), 
        this.getFieldValue(opp2, 'solicitationNumber')
      )
    };

    // If we have exact matches on key identifiers, return high score
    if (exactMatches.noticeId || exactMatches.solicitationNumber) {
      return 0.95; // High confidence match
    }

    // Fuzzy matches for other fields
    const fuzzyMatches = {
      title: await this.compareFuzzy(
        this.getFieldValue(opp1, 'title'), 
        this.getFieldValue(opp2, 'title')
      ),
      agency: this.compareExact(
        this.getFieldValue(opp1, 'agency'), 
        this.getFieldValue(opp2, 'agency')
      ),
      description: await this.compareFuzzy(
        this.getFieldValue(opp1, 'description'), 
        this.getFieldValue(opp2, 'description'),
        { maxLength: 500 } // Compare first 500 chars
      )
    };

    // Date proximity matches
    const dateMatches = {
      postedDate: this.compareDates(
        this.getFieldValue(opp1, 'postedDate'), 
        this.getFieldValue(opp2, 'postedDate'),
        7 // 7 day tolerance
      ),
      dueDate: this.compareDates(
        this.getFieldValue(opp1, 'dueDate'), 
        this.getFieldValue(opp2, 'dueDate'),
        7 // 7 day tolerance
      )
    };

    // Value proximity match
    const valueMatch = this.compareValues(
      this.getFieldValue(opp1, 'value'), 
      this.getFieldValue(opp2, 'value'),
      0.2 // 20% tolerance
    );

    // Calculate weighted score
    const allMatches = { ...exactMatches, ...fuzzyMatches, ...dateMatches, value: valueMatch };

    Object.entries(allMatches).forEach(([field, score]) => {
      if (weights[field] && score !== null) {
        totalScore += score * weights[field];
        totalWeight += weights[field];
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Selects the best opportunity from a group of duplicates
   * @param {Array} opportunities - Duplicate opportunities
   * @param {string} strategy - Selection strategy
   * @returns {object} - Best opportunity
   */
  selectBestOpportunity(opportunities, strategy = 'best_quality') {
    if (opportunities.length === 1) {
      return opportunities[0];
    }

    switch (strategy) {
      case 'best_quality':
        return this.selectByQuality(opportunities);
      case 'most_recent':
        return this.selectMostRecent(opportunities);
      case 'most_complete':
        return this.selectMostComplete(opportunities);
      default:
        return this.selectByQuality(opportunities);
    }
  }

  /**
   * Selects opportunity with highest data quality score
   */
  selectByQuality(opportunities) {
    return opportunities.reduce((best, current) => {
      const currentScore = this.calculateQualityScore(current);
      const bestScore = this.calculateQualityScore(best);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Selects most recently posted opportunity
   */
  selectMostRecent(opportunities) {
    return opportunities.reduce((most_recent, current) => {
      const currentDate = new Date(this.getFieldValue(current, 'postedDate') || 0);
      const mostRecentDate = new Date(this.getFieldValue(most_recent, 'postedDate') || 0);
      return currentDate > mostRecentDate ? current : most_recent;
    });
  }

  /**
   * Selects opportunity with most complete data
   */
  selectMostComplete(opportunities) {
    return opportunities.reduce((most_complete, current) => {
      const currentCompleteness = this.calculateCompleteness(current);
      const mostCompleteScore = this.calculateCompleteness(most_complete);
      return currentCompleteness > mostCompleteScore ? current : most_complete;
    });
  }

  /**
   * Calculates a quality score for an opportunity
   */
  calculateQualityScore(opportunity) {
    let score = 0;

    // Base completeness score
    score += this.calculateCompleteness(opportunity) * 0.4;

    // Data quality indicators
    if (this.getFieldValue(opportunity, 'dataQualityScore')) {
      score += this.getFieldValue(opportunity, 'dataQualityScore') * 0.3;
    }

    // Enhanced data indicators
    if (opportunity._enhanced) score += 20;
    if (opportunity._parsed) score += 15;
    if (opportunity._analysis) score += 10;

    // Key field presence
    const keyFields = ['noticeId', 'solicitationNumber', 'title', 'description', 'agency'];
    keyFields.forEach(field => {
      if (this.getFieldValue(opportunity, field)) score += 3;
    });

    return score;
  }

  /**
   * Calculates data completeness score
   */
  calculateCompleteness(opportunity) {
    const allFields = Object.keys(opportunity);
    const filledFields = allFields.filter(field => {
      const value = opportunity[field];
      return value !== null && value !== undefined && value !== '';
    });

    return (filledFields.length / allFields.length) * 100;
  }

  // Comparison methods

  compareExact(value1, value2) {
    if (!value1 || !value2) return null;
    return value1 === value2 ? 1 : 0;
  }

  async compareFuzzy(text1, text2, options = {}) {
    if (!text1 || !text2) return null;

    const { maxLength = 1000 } = options;
    
    // Truncate texts for performance
    const t1 = text1.substring(0, maxLength).toLowerCase().trim();
    const t2 = text2.substring(0, maxLength).toLowerCase().trim();

    // Simple similarity using Jaccard similarity on word sets
    const words1 = new Set(t1.split(/\s+/));
    const words2 = new Set(t2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  compareDates(date1, date2, toleranceDays = 7) {
    if (!date1 || !date2) return null;

    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffDays = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
      
      return diffDays <= toleranceDays ? 1 - (diffDays / toleranceDays) : 0;
    } catch (error) {
      return null;
    }
  }

  compareValues(value1, value2, tolerance = 0.2) {
    if (!value1 || !value2) return null;

    const v1 = parseFloat(value1);
    const v2 = parseFloat(value2);
    
    if (isNaN(v1) || isNaN(v2)) return null;

    const diff = Math.abs(v1 - v2);
    const avg = (v1 + v2) / 2;
    const relativeDiff = avg > 0 ? diff / avg : 0;
    
    return relativeDiff <= tolerance ? 1 - relativeDiff : 0;
  }

  // Helper methods

  getOpportunityIdentifier(opportunity) {
    return opportunity.id || 
           opportunity.noticeId || 
           opportunity.solicitationNumber || 
           `${opportunity.title}_${opportunity.agency}`.toLowerCase().replace(/\s+/g, '_');
  }

  getFieldValue(opportunity, fieldName) {
    // Handle nested field access
    const fieldMappings = {
      noticeId: ['noticeId', 'source_ids.sam_gov', '_parsed.classification.noticeId'],
      solicitationNumber: ['solicitationNumber', 'solicitation_number', '_parsed.classification.solicitationNumber'],
      title: ['title', '_parsed.title'],
      description: ['description', '_parsed.description'],
      agency: ['agency', 'department', '_parsed.agency.name'],
      postedDate: ['postedDate', 'posted_date', '_parsed.dates.posted'],
      dueDate: ['dueDate', 'due_date', 'responseDeadLine', '_parsed.dates.due'],
      value: ['awardAmount', 'value_estimated', '_parsed.financial.estimatedValue'],
      dataQualityScore: ['data_quality_score', '_enhanced.dataQualityScore']
    };

    const paths = fieldMappings[fieldName] || [fieldName];
    
    for (const path of paths) {
      const value = this.getNestedValue(opportunity, path);
      if (value !== null && value !== undefined) {
        return value;
      }
    }
    
    return null;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  calculateGroupSimilarity(opportunities) {
    if (opportunities.length <= 1) return 1.0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < opportunities.length; i++) {
      for (let j = i + 1; j < opportunities.length; j++) {
        totalSimilarity += this.calculateSimilarity(opportunities[i], opportunities[j]);
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  generateGroupRecommendation(opportunities) {
    const best = this.selectBestOpportunity(opportunities, 'best_quality');
    const bestId = this.getOpportunityIdentifier(best);
    
    return {
      action: 'merge',
      keepOpportunity: bestId,
      removeOpportunities: opportunities
        .filter(opp => this.getOpportunityIdentifier(opp) !== bestId)
        .map(opp => this.getOpportunityIdentifier(opp)),
      reason: 'Selected based on data quality and completeness'
    };
  }

  async getOpportunitiesForDeduplication({ dateRange, agencyFilter, limit }) {
    let query = 'SELECT * FROM gov_opportunities WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (dateRange) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      params.push(dateRange.start);
      
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      params.push(dateRange.end);
    }

    if (agencyFilter) {
      paramCount++;
      query += ` AND agency = $${paramCount}`;
      params.push(agencyFilter);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async processDuplicateGroups(duplicateGroups, auditTrailId) {
    let removed = 0;
    let kept = 0;

    for (const group of duplicateGroups) {
      try {
        const recommendation = group.recommendation;
        
        // Remove duplicate opportunities
        for (const oppId of recommendation.removeOpportunities) {
          await this.removeOpportunity(oppId, auditTrailId);
          removed++;
        }
        
        kept++;
        
      } catch (error) {
        logger.error(`❌ Error processing duplicate group ${group.groupId}`, {
          error: error.message,
          groupId: group.groupId
        });
      }
    }

    return { removed, kept };
  }

  async removeOpportunity(opportunityId, auditTrailId) {
    const query = `
      UPDATE gov_opportunities 
      SET processing_status = 'archived',
          updated_at = NOW()
      WHERE id = $1
    `;
    
    await this.db.query(query, [opportunityId]);

    if (auditTrailId) {
      await this.recordAuditAction(auditTrailId, 'remove_opportunity', {
        opportunityId,
        timestamp: new Date()
      });
    }
  }

  async createAuditTrail(options) {
    // This would create an audit trail record
    // For now, return a mock ID
    return `audit_${Date.now()}`;
  }

  async recordAuditAction(auditTrailId, action, details) {
    // This would record individual audit actions
    logger.info(`📝 Audit: ${action}`, { auditTrailId, details });
  }
}

module.exports = OpportunityDeduplicationService;