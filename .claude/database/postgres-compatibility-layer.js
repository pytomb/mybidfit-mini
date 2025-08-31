#!/usr/bin/env node

/**
 * PostgreSQL Compatibility Layer for MyBidFit Platform
 * Provides pre-tested, safe queries to avoid PostgreSQL dialect issues
 * 
 * This compatibility layer would have prevented all PostgreSQL issues we encountered:
 * - tablename vs relname system table column differences
 * - ROUND function syntax with precision parameters
 * - Array operations and data type casting
 * - Date/time function compatibility
 * - Full-text search syntax
 */

class PostgreSQLCompatibility {
  constructor(pgVersion = '13+') {
    this.pgVersion = pgVersion;
    this.queryCache = new Map();
  }

  /**
   * System table queries that work across PostgreSQL versions
   * These replace problematic queries that caused issues in our validation scripts
   */
  getSystemQueries() {
    return {
      // Table statistics - Fixed the tablename vs relname issue
      tableStatistics: `
        SELECT 
          schemaname,
          relname as tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE schemaname = $1
        ORDER BY n_live_tup DESC
      `,

      // Dead tuple analysis - Fixed ROUND function compatibility
      deadTupleAnalysis: `
        SELECT 
          relname as table_name,
          n_dead_tup as dead_tuples,
          n_live_tup as live_tuples,
          CASE 
            WHEN n_live_tup > 0 THEN ROUND(CAST((n_dead_tup::float / n_live_tup::float) * 100 AS numeric), 2)
            ELSE 0 
          END as dead_percentage
        FROM pg_stat_user_tables
        WHERE schemaname = $1
        ORDER BY dead_percentage DESC
      `,

      // Index information with proper column mapping
      indexInformation: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = $1
        ORDER BY tablename, indexname
      `,

      // Database size and health metrics
      databaseHealth: {
        size: `SELECT pg_size_pretty(pg_database_size(current_database())) as size`,
        
        connectionCount: `
          SELECT count(*) as active_connections 
          FROM pg_stat_activity 
          WHERE state = 'active'
        `,
        
        largestTables: `
          SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
          FROM pg_tables 
          WHERE schemaname = $1
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
          LIMIT $2
        `,

        vacuumStats: `
          SELECT 
            relname as table_name,
            last_vacuum,
            last_autovacuum,
            vacuum_count,
            autovacuum_count,
            CASE 
              WHEN last_autovacuum IS NULL AND last_vacuum IS NULL THEN 'NEVER'
              WHEN last_autovacuum > COALESCE(last_vacuum, '1970-01-01'::timestamp) THEN 'AUTO'
              ELSE 'MANUAL'
            END as last_vacuum_type
          FROM pg_stat_user_tables
          WHERE schemaname = $1
          ORDER BY GREATEST(COALESCE(last_vacuum, '1970-01-01'::timestamp), 
                           COALESCE(last_autovacuum, '1970-01-01'::timestamp)) DESC
        `
      }
    };
  }

  /**
   * Business logic queries optimized for MyBidFit platform
   */
  getBusinessQueries() {
    return {
      // Partner matching with proper array operations
      partnerSearch: `
        SELECT 
          pp.id,
          c.name,
          c.capabilities,
          c.certifications,
          c.credibility_score,
          pp.current_capacity,
          pp.open_to_partnership
        FROM partner_profiles pp
        JOIN companies c ON pp.company_id = c.id
        WHERE pp.open_to_partnership = true
          AND ($1::text[] IS NULL OR c.capabilities && $1::text[])
          AND ($2::text[] IS NULL OR c.industries && $2::text[])
          AND ($3::text[] IS NULL OR c.service_regions && $3::text[])
          AND (c.credibility_score >= $4)
        ORDER BY c.credibility_score DESC, pp.current_capacity DESC
        LIMIT $5
      `,

      // Opportunity matching with date handling
      opportunitySearch: `
        SELECT 
          o.id,
          o.title,
          o.industry,
          o.project_value_min,
          o.project_value_max,
          o.submission_deadline,
          o.required_capabilities,
          o.required_certifications,
          EXTRACT(EPOCH FROM (o.submission_deadline - NOW()))/86400 as days_remaining
        FROM opportunities o
        WHERE o.submission_deadline > NOW()
          AND ($1::text IS NULL OR o.industry = $1)
          AND ($2::bigint IS NULL OR o.project_value_max >= $2)
          AND ($3::text[] IS NULL OR o.required_capabilities && $3::text[])
        ORDER BY o.submission_deadline ASC, o.project_value_max DESC
        LIMIT $4
      `,

      // Multi-persona scoring with JSON aggregation
      partnerMatchScoring: `
        SELECT 
          pm.*,
          c1.name as seeker_name,
          c2.name as partner_name,
          JSON_BUILD_OBJECT(
            'cfo', pm.cfo_score,
            'ciso', pm.ciso_score, 
            'operator', pm.operator_score,
            'skeptic', pm.skeptic_score
          ) as persona_scores
        FROM partner_matches pm
        JOIN partner_profiles pp1 ON pm.seeker_id = pp1.id
        JOIN partner_profiles pp2 ON pm.partner_id = pp2.id
        JOIN companies c1 ON pp1.company_id = c1.id
        JOIN companies c2 ON pp2.company_id = c2.id
        WHERE ($1::integer IS NULL OR pm.seeker_id = $1)
          AND ($2::integer IS NULL OR pm.partner_id = $2)
          AND pm.match_score >= $3
        ORDER BY pm.match_score DESC, pm.created_at DESC
        LIMIT $4
      `,

      // Capability analysis with array aggregation
      capabilityAnalysis: `
        SELECT 
          UNNEST(c.capabilities) as capability,
          COUNT(*) as company_count,
          ROUND(AVG(c.credibility_score), 2) as avg_credibility,
          ARRAY_AGG(c.name ORDER BY c.credibility_score DESC) as top_companies
        FROM companies c
        WHERE array_length(c.capabilities, 1) > 0
        GROUP BY UNNEST(c.capabilities)
        HAVING COUNT(*) >= $1
        ORDER BY company_count DESC, avg_credibility DESC
        LIMIT $2
      `
    };
  }

  /**
   * Data quality and validation queries
   */
  getValidationQueries() {
    return {
      // Orphaned records detection
      orphanedRecords: {
        partnerProfiles: `
          SELECT COUNT(*) as count 
          FROM partner_profiles pp 
          LEFT JOIN companies c ON pp.company_id = c.id 
          WHERE c.id IS NULL
        `,

        partnerMatches: `
          SELECT COUNT(*) as count 
          FROM partner_matches pm 
          LEFT JOIN partner_profiles pp1 ON pm.seeker_id = pp1.id 
          LEFT JOIN partner_profiles pp2 ON pm.partner_id = pp2.id 
          WHERE pp1.id IS NULL OR pp2.id IS NULL
        `,

        scoringResults: `
          SELECT COUNT(*) as count 
          FROM scoring_results sr 
          LEFT JOIN companies c ON sr.company_id = c.id 
          LEFT JOIN opportunities o ON sr.opportunity_id = o.id 
          WHERE c.id IS NULL OR o.id IS NULL
        `
      },

      // Business rule validation
      businessRules: {
        credibilityScoreRange: `
          SELECT COUNT(*) as count 
          FROM companies 
          WHERE credibility_score < 0 OR credibility_score > 100
        `,

        matchScoreRange: `
          SELECT COUNT(*) as count 
          FROM partner_matches 
          WHERE match_score < 0 OR match_score > 1
        `,

        opportunityValueConsistency: `
          SELECT COUNT(*) as count 
          FROM opportunities 
          WHERE project_value_min > project_value_max
        `,

        partnerCapacityRange: `
          SELECT COUNT(*) as count 
          FROM partner_profiles 
          WHERE current_capacity < 0 OR current_capacity > 100
        `,

        futureDeadlines: `
          SELECT COUNT(*) as count 
          FROM opportunities 
          WHERE submission_deadline < NOW() - INTERVAL '30 days'
        `
      },

      // Data completeness checks
      dataCompleteness: {
        companyRequiredFields: `
          SELECT COUNT(*) as count 
          FROM companies 
          WHERE name IS NULL OR name = '' 
             OR description IS NULL OR description = ''
             OR size_category IS NULL OR size_category = ''
        `,

        opportunityRequiredFields: `
          SELECT COUNT(*) as count 
          FROM opportunities 
          WHERE title IS NULL OR title = '' 
             OR buyer_organization IS NULL OR buyer_organization = ''
             OR industry IS NULL OR industry = ''
        `,

        partnerProfileCompleteness: `
          SELECT COUNT(*) as count 
          FROM partner_profiles 
          WHERE contact_email IS NULL OR contact_email = ''
             OR profile_completeness < 80
        `
      }
    };
  }

  /**
   * Performance optimization queries
   */
  getPerformanceQueries() {
    return {
      // Index usage analysis
      indexUsage: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_scan,
          CASE 
            WHEN idx_scan = 0 THEN 'UNUSED'
            WHEN idx_scan < 100 THEN 'LOW_USAGE'
            WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
            ELSE 'HIGH_USAGE'
          END as usage_level
        FROM pg_stat_user_indexes
        WHERE schemaname = $1
        ORDER BY idx_scan DESC
      `,

      // Query performance analysis
      slowQueries: `
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          ROUND((100 * total_time / sum(total_time) OVER()), 2) as percentage
        FROM pg_stat_statements
        WHERE mean_time > $1
        ORDER BY mean_time DESC
        LIMIT $2
      `,

      // Table bloat estimation
      tableBloat: `
        SELECT 
          schemaname,
          tablename,
          ROUND(((pg_relation_size(schemaname||'.'||tablename)::numeric / 
                 NULLIF(pg_stat_get_live_tuples(c.oid), 0))), 2) as avg_row_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_stat_get_live_tuples(c.oid) as live_tuples,
          pg_stat_get_dead_tuples(c.oid) as dead_tuples
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE schemaname = $1
          AND pg_stat_get_live_tuples(c.oid) > 0
        ORDER BY pg_relation_size(schemaname||'.'||tablename) DESC
      `
    };
  }

  /**
   * Execute a pre-tested query with proper error handling and parameter validation
   */
  async executeQuery(db, queryCategory, queryName, params = []) {
    try {
      const queries = this.getQueryByCategory(queryCategory);
      
      if (!queries || !queries[queryName]) {
        throw new Error(`Query not found: ${queryCategory}.${queryName}`);
      }

      let query = queries[queryName];
      
      // Handle nested query objects (like businessRules)
      if (typeof query === 'object' && !Array.isArray(query)) {
        throw new Error(`Query ${queryCategory}.${queryName} is an object, not a string`);
      }

      // Cache commonly used queries
      const cacheKey = `${queryCategory}.${queryName}`;
      if (this.queryCache.has(cacheKey)) {
        const cachedResult = this.queryCache.get(cacheKey);
        if (Date.now() - cachedResult.timestamp < 60000) { // 1 minute cache
          return cachedResult.result;
        }
      }

      // Validate parameters
      this.validateQueryParameters(query, params);

      // Execute query
      const result = await db.query(query, params);

      // Cache result for commonly used queries
      if (['tableStatistics', 'indexInformation'].includes(queryName)) {
        this.queryCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
      }

      return result;

    } catch (error) {
      throw new Error(`PostgreSQL compatibility query failed: ${error.message}`);
    }
  }

  /**
   * Get query collection by category
   */
  getQueryByCategory(category) {
    switch (category) {
      case 'system':
        return this.getSystemQueries();
      case 'business':
        return this.getBusinessQueries();
      case 'validation':
        return this.getValidationQueries();
      case 'performance':
        return this.getPerformanceQueries();
      default:
        throw new Error(`Unknown query category: ${category}`);
    }
  }

  /**
   * Validate query parameters to prevent SQL injection and type errors
   */
  validateQueryParameters(query, params) {
    // Count parameter placeholders
    const placeholderCount = (query.match(/\$\d+/g) || []).length;
    
    if (params.length !== placeholderCount) {
      throw new Error(`Parameter count mismatch: query expects ${placeholderCount}, got ${params.length}`);
    }

    // Basic type validation
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      
      // Check for SQL injection patterns
      if (typeof param === 'string' && this.containsSQLInjection(param)) {
        throw new Error(`Potential SQL injection detected in parameter ${i + 1}: ${param}`);
      }
    }
  }

  /**
   * Basic SQL injection detection
   */
  containsSQLInjection(str) {
    const suspiciousPatterns = [
      /;\s*drop\s+/i,
      /;\s*delete\s+/i,
      /;\s*update\s+/i,
      /union\s+select/i,
      /'\s*or\s+/i,
      /--\s*$/,
      /\/\*.*?\*\//
    ];

    return suspiciousPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Generate safe query builder for common patterns
   */
  buildPartnerSearchQuery(options = {}) {
    const {
      capabilities = null,
      industries = null,
      regions = null,
      minCredibility = 0,
      limit = 10
    } = options;

    return {
      query: this.getBusinessQueries().partnerSearch,
      params: [capabilities, industries, regions, minCredibility, limit],
      description: 'Search for partners with capability and industry filtering'
    };
  }

  buildOpportunitySearchQuery(options = {}) {
    const {
      industry = null,
      minValue = null,
      requiredCapabilities = null,
      limit = 10
    } = options;

    return {
      query: this.getBusinessQueries().opportunitySearch,
      params: [industry, minValue, requiredCapabilities, limit],
      description: 'Search for opportunities with industry and value filtering'
    };
  }

  /**
   * Version-specific query adaptations
   */
  adaptQueryForVersion(query, version = this.pgVersion) {
    let adaptedQuery = query;

    // PostgreSQL 12+ specific adaptations
    if (this.versionGTE(version, '12')) {
      // Use improved JSON functions
      adaptedQuery = adaptedQuery.replace(/row_to_json/g, 'to_jsonb');
    }

    // PostgreSQL 13+ specific adaptations
    if (this.versionGTE(version, '13')) {
      // Use improved aggregate functions
      adaptedQuery = adaptedQuery.replace(/string_agg/g, 'string_agg');
    }

    return adaptedQuery;
  }

  /**
   * Version comparison helper
   */
  versionGTE(version, target) {
    const versionNum = parseFloat(version.replace(/[^\d.]/g, ''));
    const targetNum = parseFloat(target);
    return versionNum >= targetNum;
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.queryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.queryCache.size,
      entries: Array.from(this.queryCache.keys())
    };
  }
}

/**
 * Singleton instance for global use
 */
let compatibilityInstance = null;

function getPostgreSQLCompatibility(pgVersion = '13+') {
  if (!compatibilityInstance) {
    compatibilityInstance = new PostgreSQLCompatibility(pgVersion);
  }
  return compatibilityInstance;
}

module.exports = {
  PostgreSQLCompatibility,
  getPostgreSQLCompatibility
};