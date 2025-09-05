/**
 * Government Opportunity Ingestion Service
 * 
 * Handles the complete lifecycle of government opportunity data:
 * - Fetching from SAM.gov API
 * - Data validation and normalization
 * - Deduplication and conflict resolution
 * - Database storage and updates
 * - Error handling and retry logic
 * - Progress tracking and reporting
 */

const { Database } = require('../database/connection');
const samService = require('../integrations/sam');
const { logger } = require('../utils/logger');

class GovernmentOpportunityIngestionService {
  constructor() {
    this.db = Database.getInstance();
    this.ingestionStats = {
      startTime: null,
      endTime: null,
      totalFetched: 0,
      totalProcessed: 0,
      totalStored: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      errors: []
    };
  }

  /**
   * Main ingestion process - coordinates the complete workflow
   * @param {object} options - Ingestion configuration options
   * @param {string} options.mode - Ingestion mode: 'incremental', 'full', 'targeted'
   * @param {object} options.searchCriteria - SAM.gov search criteria
   * @param {boolean} options.enableDeduplication - Enable deduplication process
   * @param {boolean} options.fetchDetails - Fetch detailed information for each opportunity
   * @param {number} options.batchSize - Number of opportunities to process in each batch
   * @returns {Promise<object>} - Ingestion results and statistics
   */
  async ingestOpportunities(options = {}) {
    const {
      mode = 'incremental',
      searchCriteria = {},
      enableDeduplication = true,
      fetchDetails = true,
      batchSize = 25,
      maxOpportunities = 500
    } = options;

    this.resetStats();
    this.ingestionStats.startTime = new Date();

    logger.info('🚀 Starting government opportunity ingestion', {
      mode,
      searchCriteria,
      enableDeduplication,
      fetchDetails,
      batchSize,
      maxOpportunities
    });

    try {
      // Step 1: Validate prerequisites
      await this.validatePrerequisites();

      // Step 2: Determine search parameters based on mode
      const finalSearchCriteria = await this.determineSearchCriteria(mode, searchCriteria);

      // Step 3: Fetch opportunities from SAM.gov
      const opportunities = await this.fetchOpportunities(finalSearchCriteria, maxOpportunities);
      this.ingestionStats.totalFetched = opportunities.length;

      if (opportunities.length === 0) {
        logger.info('🔍 No opportunities found matching search criteria');
        return this.generateIngestionReport();
      }

      // Step 4: Process opportunities in batches
      const processedOpportunities = await this.processOpportunitiesBatches(
        opportunities, 
        batchSize, 
        fetchDetails
      );

      // Step 5: Deduplication (if enabled)
      const finalOpportunities = enableDeduplication 
        ? await this.deduplicateOpportunities(processedOpportunities)
        : processedOpportunities;

      // Step 6: Store in database
      const storageResults = await this.storeOpportunities(finalOpportunities);
      
      // Step 7: Update statistics
      this.updateStats(storageResults);

      // Step 8: Generate and return report
      this.ingestionStats.endTime = new Date();
      const report = this.generateIngestionReport();

      logger.info('✅ Government opportunity ingestion completed', {
        duration: this.ingestionStats.endTime - this.ingestionStats.startTime,
        summary: report.summary
      });

      return report;

    } catch (error) {
      this.ingestionStats.endTime = new Date();
      this.ingestionStats.totalErrors++;
      this.ingestionStats.errors.push({
        type: 'INGESTION_FAILURE',
        message: error.message,
        timestamp: new Date()
      });

      logger.error('❌ Government opportunity ingestion failed', {
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Validates that all prerequisites are met before starting ingestion
   */
  async validatePrerequisites() {
    logger.info('🔍 Validating ingestion prerequisites');

    // Check SAM.gov API configuration
    if (!samService.isConfigured()) {
      throw new Error('SAM.gov API key not configured. Please set SAM_GOV_API_KEY environment variable.');
    }

    // Check database connection
    try {
      await this.db.connect();
      logger.info('✅ Database connection validated');
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    // Verify required tables exist
    const requiredTables = ['gov_opportunities'];
    for (const table of requiredTables) {
      const tableExists = await this.checkTableExists(table);
      if (!tableExists) {
        throw new Error(`Required table '${table}' does not exist. Please run database migrations.`);
      }
    }

    logger.info('✅ All prerequisites validated');
  }

  /**
   * Determines final search criteria based on ingestion mode
   */
  async determineSearchCriteria(mode, baseSearchCriteria) {
    const criteria = { ...baseSearchCriteria };

    switch (mode) {
      case 'incremental':
        // Get the latest opportunity date from database
        const lastIngestionDate = await this.getLastIngestionDate();
        if (lastIngestionDate) {
          criteria.postedFrom = this.formatDateForSAM(lastIngestionDate);
          logger.info(`📅 Incremental mode: fetching opportunities since ${criteria.postedFrom}`);
        } else {
          // First time ingestion - get last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          criteria.postedFrom = this.formatDateForSAM(sevenDaysAgo);
          logger.info(`📅 First ingestion: fetching opportunities from last 7 days (${criteria.postedFrom})`);
        }
        break;

      case 'full':
        // Get opportunities from the last 30 days (SAM.gov default)
        logger.info('📅 Full mode: fetching all available opportunities (last 30 days)');
        break;

      case 'targeted':
        logger.info('🎯 Targeted mode: using provided search criteria', criteria);
        break;

      default:
        throw new Error(`Invalid ingestion mode: ${mode}. Must be 'incremental', 'full', or 'targeted'`);
    }

    return criteria;
  }

  /**
   * Fetches opportunities from SAM.gov with pagination and rate limiting
   */
  async fetchOpportunities(searchCriteria, maxOpportunities) {
    logger.info('🔍 Fetching opportunities from SAM.gov', { 
      searchCriteria, 
      maxOpportunities 
    });

    try {
      // Use the enhanced SAM.gov integration with pagination
      const result = await samService.fetchOpportunitiesWithPagination(
        searchCriteria,
        Math.ceil(maxOpportunities / 100), // Max pages
        maxOpportunities
      );

      const opportunities = result._embedded?.opportunities || [];
      
      logger.info(`✅ Successfully fetched ${opportunities.length} opportunities from SAM.gov`);
      
      return opportunities;

    } catch (error) {
      logger.error('❌ Failed to fetch opportunities from SAM.gov', {
        error: error.message,
        searchCriteria
      });
      throw error;
    }
  }

  /**
   * Processes opportunities in batches with detailed enhancement
   */
  async processOpportunitiesBatches(opportunities, batchSize, fetchDetails) {
    logger.info(`🔄 Processing ${opportunities.length} opportunities in batches of ${batchSize}`);
    
    const processedOpportunities = [];
    const errors = [];

    for (let i = 0; i < opportunities.length; i += batchSize) {
      const batch = opportunities.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(opportunities.length / batchSize);

      logger.info(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} opportunities)`);

      try {
        let batchResults;
        
        if (fetchDetails) {
          // Fetch detailed information for each opportunity
          const noticeIds = batch.map(opp => opp.noticeId).filter(id => id);
          
          if (noticeIds.length > 0) {
            const detailResults = await samService.fetchOpportunityDetailsBatch(noticeIds, {
              batchSize: 3, // Conservative batch size for detail fetching
              delayBetweenBatches: 1500 // Be respectful to the API
            });
            
            batchResults = detailResults.successful;
            
            // Track errors
            if (detailResults.failed.length > 0) {
              errors.push(...detailResults.failed);
            }
          } else {
            // No valid notice IDs, use basic data
            batchResults = batch.map(opp => samService.enhanceOpportunityDetails(opp));
          }
        } else {
          // Process with basic enhancement only
          batchResults = await Promise.all(
            batch.map(opp => samService.enhanceOpportunityDetails(opp))
          );
        }

        processedOpportunities.push(...batchResults);
        this.ingestionStats.totalProcessed += batchResults.length;

        // Add delay between batches to be respectful to the API
        if (i + batchSize < opportunities.length) {
          await this.delay(2000); // 2 second delay between batches
        }

      } catch (error) {
        logger.error(`❌ Error processing batch ${batchNumber}`, {
          error: error.message,
          batchSize: batch.length
        });

        errors.push({
          batchNumber,
          error: error.message,
          affectedOpportunities: batch.length
        });

        this.ingestionStats.totalErrors++;
      }
    }

    // Log batch processing results
    if (errors.length > 0) {
      logger.warn(`⚠️ Batch processing completed with ${errors.length} errors`, { errors });
      this.ingestionStats.errors.push(...errors);
    }

    logger.info(`✅ Batch processing completed: ${processedOpportunities.length} opportunities processed`);
    
    return processedOpportunities;
  }

  /**
   * Deduplicates opportunities based on various criteria
   */
  async deduplicateOpportunities(opportunities) {
    logger.info(`🔍 Starting deduplication for ${opportunities.length} opportunities`);

    const deduplicationResults = {
      total: opportunities.length,
      unique: 0,
      duplicates: 0,
      conflicts: 0
    };

    // Group opportunities by potential duplicate criteria
    const opportunityGroups = new Map();
    
    opportunities.forEach(opp => {
      // Create a composite key for deduplication
      const dedupeKeys = [
        opp.noticeId,
        opp.solicitationNumber,
        `${opp.title}_${opp.department}_${opp.postedDate}`.toLowerCase().replace(/\s+/g, '_')
      ].filter(key => key);

      dedupeKeys.forEach(key => {
        if (!opportunityGroups.has(key)) {
          opportunityGroups.set(key, []);
        }
        opportunityGroups.get(key).push(opp);
      });
    });

    // Process groups to identify and resolve duplicates
    const uniqueOpportunities = [];
    const seenOpportunities = new Set();

    for (const [key, group] of opportunityGroups) {
      if (group.length === 1) {
        // Single opportunity - no duplicates
        const opp = group[0];
        const oppId = opp.noticeId || `${opp.title}_${opp.department}`;
        
        if (!seenOpportunities.has(oppId)) {
          uniqueOpportunities.push(opp);
          seenOpportunities.add(oppId);
          deduplicationResults.unique++;
        }
      } else {
        // Multiple opportunities - potential duplicates
        const bestOpportunity = this.selectBestDuplicate(group);
        const oppId = bestOpportunity.noticeId || `${bestOpportunity.title}_${bestOpportunity.department}`;
        
        if (!seenOpportunities.has(oppId)) {
          uniqueOpportunities.push(bestOpportunity);
          seenOpportunities.add(oppId);
          deduplicationResults.unique++;
          deduplicationResults.duplicates += group.length - 1;
        }
      }
    }

    logger.info(`✅ Deduplication completed`, deduplicationResults);
    
    return uniqueOpportunities;
  }

  /**
   * Selects the best opportunity from a group of duplicates
   */
  selectBestDuplicate(duplicates) {
    if (duplicates.length === 1) return duplicates[0];

    // Scoring system for selecting the best duplicate
    return duplicates.reduce((best, current) => {
      const currentScore = this.calculateOpportunityQualityScore(current);
      const bestScore = this.calculateOpportunityQualityScore(best);
      
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Calculates a quality score for opportunity data completeness
   */
  calculateOpportunityQualityScore(opportunity) {
    let score = 0;

    // Enhanced metadata scores higher
    if (opportunity._enhanced) score += 10;
    if (opportunity._parsed) score += 10;
    if (opportunity._analysis) score += 5;

    // Required field completeness
    const requiredFields = ['title', 'description', 'postedDate', 'department'];
    requiredFields.forEach(field => {
      if (opportunity[field]) score += 5;
    });

    // Valuable field completeness
    const valuableFields = ['noticeId', 'solicitationNumber', 'responseDeadLine', 'awardAmount'];
    valuableFields.forEach(field => {
      if (opportunity[field]) score += 3;
    });

    // Data quality indicators
    if (opportunity._enhanced?.dataQualityScore) {
      score += Math.floor(opportunity._enhanced.dataQualityScore / 10);
    }

    return score;
  }

  /**
   * Stores opportunities in the database with conflict resolution
   */
  async storeOpportunities(opportunities) {
    logger.info(`💾 Storing ${opportunities.length} opportunities in database`);

    const results = {
      stored: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Process opportunities in smaller batches for database operations
    const dbBatchSize = 10;
    
    for (let i = 0; i < opportunities.length; i += dbBatchSize) {
      const batch = opportunities.slice(i, i + dbBatchSize);
      
      try {
        await this.db.transaction(async (client) => {
          for (const opportunity of batch) {
            try {
              const result = await this.storeOpportunity(client, opportunity);
              results[result.action]++;
            } catch (error) {
              results.errors.push({
                opportunity: opportunity.noticeId || opportunity.title,
                error: error.message
              });
              logger.error(`❌ Error storing opportunity`, {
                opportunityId: opportunity.noticeId,
                error: error.message
              });
            }
          }
        });
        
        // Log progress
        const processed = Math.min(i + dbBatchSize, opportunities.length);
        logger.info(`💾 Database batch progress: ${processed}/${opportunities.length} opportunities processed`);
        
      } catch (error) {
        logger.error(`❌ Database batch error for opportunities ${i}-${i + batch.length}`, {
          error: error.message
        });
        
        results.errors.push({
          batch: `${i}-${i + batch.length}`,
          error: error.message
        });
      }
    }

    logger.info(`✅ Database storage completed`, results);
    return results;
  }

  /**
   * Stores or updates a single opportunity in the database
   */
  async storeOpportunity(client, opportunity) {
    // Extract and normalize data for database storage
    const opportunityData = this.normalizeOpportunityForDatabase(opportunity);
    
    // Check if opportunity already exists (by source_ids)
    const existingQuery = `
      SELECT id, updated_at, source_ids 
      FROM gov_opportunities 
      WHERE source_ids->>'sam_gov' = $1
    `;
    
    const existingResult = await client.query(existingQuery, [opportunityData.source_ids.sam_gov]);
    
    if (existingResult.rows.length === 0) {
      // Insert new opportunity
      await this.insertOpportunity(client, opportunityData);
      return { action: 'stored' };
    } else {
      // Check if update is needed
      const existing = existingResult.rows[0];
      if (this.shouldUpdateOpportunity(existing, opportunityData)) {
        await this.updateOpportunity(client, existing.id, opportunityData);
        return { action: 'updated' };
      } else {
        return { action: 'skipped' };
      }
    }
  }

  /**
   * Normalizes opportunity data for database storage
   */
  normalizeOpportunityForDatabase(opportunity) {
    const parsed = opportunity._parsed || {};
    const enhanced = opportunity._enhanced || {};
    
    return {
      source_ids: {
        sam_gov: opportunity.noticeId || null
      },
      title: this.truncateString(opportunity.title || parsed.title, 500),
      description: opportunity.description || parsed.description,
      agency: this.truncateString(opportunity.department || parsed.agency?.name, 255),
      office: this.truncateString(opportunity.office || parsed.agency?.office, 255),
      naics_codes: JSON.stringify(parsed.naicsCodes || []),
      psc_codes: JSON.stringify(parsed.pscCodes || []),
      set_aside: this.truncateString(parsed.setAside, 100),
      place_of_performance: JSON.stringify(parsed.location || {}),
      vehicle: this.truncateString(opportunity.typeOfContract, 255),
      pop_start: this.parseDate(parsed.dates?.popStart),
      pop_end: this.parseDate(parsed.dates?.popEnd),
      due_date: this.parseDate(parsed.dates?.due || opportunity.responseDeadLine),
      posted_date: this.parseDate(parsed.dates?.posted || opportunity.postedDate),
      value_low: parsed.financial?.minimumValue,
      value_high: parsed.financial?.maximumValue,
      value_estimated: parsed.financial?.estimatedValue,
      incumbent: this.extractIncumbent(opportunity),
      solicitation_number: this.truncateString(
        opportunity.solicitationNumber || parsed.classification?.solicitationNumber, 100
      ),
      opportunity_type: this.truncateString(
        opportunity.type || parsed.classification?.type, 50
      ),
      requirements_summary: this.extractRequirementsSummary(opportunity),
      evaluation_criteria: JSON.stringify([]),
      parsed_tags: JSON.stringify(this.extractTags(opportunity)),
      raw_text: this.truncateString(opportunity.description, 10000),
      attachments: JSON.stringify(parsed.attachments || []),
      contacts: JSON.stringify(parsed.contacts || []),
      data_quality_score: enhanced.dataQualityScore ? enhanced.dataQualityScore / 100 : null,
      last_updated_source: this.parseDate(opportunity.lastModified || new Date()),
      processing_status: 'active'
    };
  }

  /**
   * Inserts a new opportunity into the database
   */
  async insertOpportunity(client, opportunityData) {
    const fields = Object.keys(opportunityData);
    const values = Object.values(opportunityData);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO gov_opportunities (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING id
    `;
    
    await client.query(query, values);
  }

  /**
   * Updates an existing opportunity in the database
   */
  async updateOpportunity(client, opportunityId, opportunityData) {
    const fields = Object.keys(opportunityData);
    const values = Object.values(opportunityData);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE gov_opportunities 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
    `;
    
    await client.query(query, [opportunityId, ...values]);
  }

  /**
   * Determines if an opportunity should be updated
   */
  shouldUpdateOpportunity(existing, newData) {
    // Always update if the source data is newer
    if (newData.last_updated_source && existing.updated_at) {
      const newDate = new Date(newData.last_updated_source);
      const existingDate = new Date(existing.updated_at);
      return newDate > existingDate;
    }
    
    // Update if it's been more than 24 hours since last update
    const daysSinceUpdate = (Date.now() - new Date(existing.updated_at)) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 1;
  }

  // Helper methods

  resetStats() {
    this.ingestionStats = {
      startTime: null,
      endTime: null,
      totalFetched: 0,
      totalProcessed: 0,
      totalStored: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      errors: []
    };
  }

  updateStats(storageResults) {
    this.ingestionStats.totalStored = storageResults.stored;
    this.ingestionStats.totalUpdated = storageResults.updated;
    this.ingestionStats.totalSkipped = storageResults.skipped;
    if (storageResults.errors.length > 0) {
      this.ingestionStats.errors.push(...storageResults.errors);
    }
  }

  generateIngestionReport() {
    const duration = this.ingestionStats.endTime - this.ingestionStats.startTime;
    
    return {
      summary: {
        duration: Math.round(duration / 1000), // seconds
        totalFetched: this.ingestionStats.totalFetched,
        totalProcessed: this.ingestionStats.totalProcessed,
        totalStored: this.ingestionStats.totalStored,
        totalUpdated: this.ingestionStats.totalUpdated,
        totalSkipped: this.ingestionStats.totalSkipped,
        totalErrors: this.ingestionStats.totalErrors,
        successRate: this.ingestionStats.totalFetched > 0 
          ? Math.round(((this.ingestionStats.totalStored + this.ingestionStats.totalUpdated) / this.ingestionStats.totalFetched) * 100)
          : 0
      },
      timing: {
        startTime: this.ingestionStats.startTime,
        endTime: this.ingestionStats.endTime,
        duration: duration
      },
      errors: this.ingestionStats.errors
    };
  }

  async checkTableExists(tableName) {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `;
    const result = await this.db.query(query, [tableName]);
    return result.rows[0].exists;
  }

  async getLastIngestionDate() {
    const query = `
      SELECT MAX(created_at) as last_created 
      FROM gov_opportunities
    `;
    const result = await this.db.query(query);
    return result.rows[0].last_created;
  }

  formatDateForSAM(date) {
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  }

  parseDate(dateString) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch (error) {
      return null;
    }
  }

  truncateString(str, maxLength) {
    if (!str || typeof str !== 'string') return null;
    return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
  }

  extractIncumbent(opportunity) {
    const description = (opportunity.description || '').toLowerCase();
    const incumbentPatterns = [
      /incumbent[:\s]*([^,.;]+)/i,
      /current contractor[:\s]*([^,.;]+)/i,
      /existing vendor[:\s]*([^,.;]+)/i
    ];

    for (const pattern of incumbentPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return this.truncateString(match[1].trim(), 255);
      }
    }

    return null;
  }

  extractRequirementsSummary(opportunity) {
    const description = opportunity.description || '';
    
    // Extract first few sentences as summary
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join('. ');
    
    return this.truncateString(summary, 1000);
  }

  extractTags(opportunity) {
    const tags = [];
    const description = (opportunity.description || '').toLowerCase();
    const title = (opportunity.title || '').toLowerCase();
    const text = `${title} ${description}`;

    // Technology tags
    const techTerms = [
      'cloud', 'ai', 'machine learning', 'blockchain', 'cybersecurity', 
      'data analytics', 'mobile', 'web', 'database', 'integration'
    ];
    
    techTerms.forEach(term => {
      if (text.includes(term)) {
        tags.push(term.replace(' ', '_'));
      }
    });

    // Service type tags
    const serviceTerms = [
      'consulting', 'development', 'maintenance', 'support', 'training',
      'implementation', 'migration', 'modernization'
    ];
    
    serviceTerms.forEach(term => {
      if (text.includes(term)) {
        tags.push(term);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GovernmentOpportunityIngestionService;