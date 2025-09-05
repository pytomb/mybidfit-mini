#!/usr/bin/env node

/**
 * Government Opportunities Schema Validator
 * 
 * Validates the complete government opportunities schema including:
 * - Migrations 005-009 integrity
 * - Government-specific data relationships
 * - SAM.gov integration requirements
 * - Panel of Judges integration
 * 
 * Usage: node .claude/scripts/validate-gov-opportunities-schema.js
 */

const fs = require('fs');
const path = require('path');
const { DataIntegrityValidator } = require('../validators/data-integrity-validator');

class GovernmentOpportunitiesSchemaValidator extends DataIntegrityValidator {
  constructor(options = {}) {
    super(options);
    this.govTables = [
      'gov_opportunities',
      'gov_opportunity_scores', 
      'gov_opportunity_feedback',
      'ideal_project_templates',
      'opportunity_watchlists',
      'watchlist_items'
    ];
  }

  /**
   * Validate government opportunities schema
   */
  async validateGovernmentSchema() {
    console.log('🏛️  Validating Government Opportunities Schema...');
    console.log('===================================================');
    
    // Load all government-related migrations
    const migrationPaths = [
      'src/database/migrations/005_add_government_opportunities.sql',
      'src/database/migrations/006_add_gov_opp_scoring.sql',
      'src/database/migrations/007_add_opportunity_feedback.sql',
      'src/database/migrations/008_add_ideal_project_templates.sql',
      'src/database/migrations/009_add_opportunity_watchlists.sql'
    ];

    let combinedSchema = '';
    const missingMigrations = [];

    for (const migrationPath of migrationPaths) {
      const fullPath = path.resolve(migrationPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        combinedSchema += content + '\n';
        console.log(`✅ Loaded migration: ${path.basename(migrationPath)}`);
      } else {
        missingMigrations.push(migrationPath);
        console.log(`❌ Missing migration: ${migrationPath}`);
      }
    }

    if (missingMigrations.length > 0) {
      console.error(`❌ Missing ${missingMigrations.length} required migrations`);
      process.exit(1);
    }

    // Run base validation
    const baseReport = await this.validateDataIntegrity(combinedSchema);

    // Run government-specific validations
    this.validateGovernmentBusinessRules();
    this.validateSAMIntegrationRequirements();
    this.validatePanelOfJudgesIntegration();
    this.validateGovernmentDataTypes();
    this.validateRequiredIndexes();

    // Generate comprehensive report
    return this.generateGovernmentReport(baseReport);
  }

  /**
   * Validate government-specific business rules
   */
  validateGovernmentBusinessRules() {
    console.log('🔍 Validating government business rules...');

    // Check that all required government tables exist
    for (const tableName of this.govTables) {
      const table = this.tables.get(tableName);
      if (!table) {
        this.addIssue('MISSING_GOVERNMENT_TABLE',
          `Required government opportunities table '${tableName}' not found`,
          { tableName: tableName }
        );
      }
    }

    // Validate gov_opportunities structure
    this.validateGovernmentOpportunitiesTable();

    // Validate scoring integration
    this.validateGovernmentScoringTable();

    // Validate feedback system
    this.validateGovernmentFeedbackTable();

    // Validate templates and watchlists
    this.validateTemplatesAndWatchlists();
  }

  /**
   * Validate gov_opportunities table structure
   */
  validateGovernmentOpportunitiesTable() {
    const table = this.tables.get('gov_opportunities');
    if (!table) return;

    const requiredColumns = [
      { name: 'id', type: 'uuid', required: true },
      { name: 'source_ids', type: 'jsonb', required: true },
      { name: 'title', type: 'varchar', required: true },
      { name: 'description', type: 'text', required: false },
      { name: 'agency', type: 'varchar', required: true },
      { name: 'office', type: 'varchar', required: false },
      { name: 'naics_codes', type: 'jsonb', required: false },
      { name: 'psc_codes', type: 'jsonb', required: false },
      { name: 'set_aside', type: 'varchar', required: false },
      { name: 'contacts', type: 'jsonb', required: false },
      { name: 'due_date', type: 'timestamp', required: false },
      { name: 'posted_date', type: 'timestamp', required: false },
      { name: 'value_low', type: 'decimal', required: false },
      { name: 'value_high', type: 'decimal', required: false },
      { name: 'value_estimated', type: 'decimal', required: false },
      { name: 'solicitation_number', type: 'varchar', required: false },
      { name: 'opportunity_type', type: 'varchar', required: false },
      { name: 'raw_text', type: 'text', required: false },
      { name: 'created_at', type: 'timestamp', required: true },
      { name: 'updated_at', type: 'timestamp', required: true }
    ];

    for (const requiredCol of requiredColumns) {
      const column = table.columns.find(col => col.name === requiredCol.name);
      if (!column) {
        this.addIssue('MISSING_REQUIRED_COLUMN',
          `gov_opportunities table missing required column '${requiredCol.name}'`,
          { table: 'gov_opportunities', column: requiredCol.name, expectedType: requiredCol.type }
        );
      } else {
        // Check data type compatibility
        if (!this.isTypeCompatible(column.type, requiredCol.type)) {
          this.addWarning('COLUMN_TYPE_MISMATCH',
            `gov_opportunities.${requiredCol.name} has type '${column.type}', expected type compatible with '${requiredCol.type}'`
          );
        }

        // Check NOT NULL constraints for required columns
        if (requiredCol.required && !column.constraints.includes('NOT NULL')) {
          this.addWarning('MISSING_NOT_NULL_CONSTRAINT',
            `gov_opportunities.${requiredCol.name} should have NOT NULL constraint`
          );
        }
      }
    }

    // Check for proper indexing
    this.validateGovernmentOpportunitiesIndexes();
  }

  /**
   * Validate government opportunities indexes
   */
  validateGovernmentOpportunitiesIndexes() {
    const recommendedIndexes = [
      { table: 'gov_opportunities', column: 'agency', reason: 'Agency filtering performance' },
      { table: 'gov_opportunities', column: 'due_date', reason: 'Deadline-based queries' },
      { table: 'gov_opportunities', column: 'solicitation_number', reason: 'Unique identification lookups' },
      { table: 'gov_opportunities', column: 'naics_codes', reason: 'NAICS code filtering', type: 'GIN' },
      { table: 'gov_opportunities', column: 'psc_codes', reason: 'PSC code filtering', type: 'GIN' },
      { table: 'gov_opportunities', column: 'set_aside', reason: 'Set-aside filtering' },
      { table: 'gov_opportunities', columns: ['title', 'description'], reason: 'Full-text search', type: 'GIN' }
    ];

    this.addRecommendation('GOVERNMENT_OPPORTUNITIES_INDEXES', 'PERFORMANCE',
      'Recommended indexes for optimal government opportunities performance',
      { indexes: recommendedIndexes }
    );
  }

  /**
   * Validate government scoring table
   */
  validateGovernmentScoringTable() {
    const table = this.tables.get('gov_opportunity_scores');
    if (!table) return;

    // Check foreign key to gov_opportunities
    const opportunityFK = table.foreignKeys.find(fk => fk.toTable === 'gov_opportunities');
    if (!opportunityFK) {
      this.addIssue('MISSING_OPPORTUNITY_FOREIGN_KEY',
        'gov_opportunity_scores table must have foreign key to gov_opportunities table',
        { table: 'gov_opportunity_scores', expectedFK: 'opportunity_id -> gov_opportunities(id)' }
      );
    }

    // Check score columns exist
    const scoreColumns = [
      'overall_score', 'fit_score', 'complexity_score', 
      'competitiveness_score', 'timeline_score'
    ];

    for (const scoreCol of scoreColumns) {
      const column = table.columns.find(col => col.name === scoreCol);
      if (!column) {
        this.addWarning('MISSING_SCORE_COLUMN',
          `gov_opportunity_scores missing score column '${scoreCol}'`
        );
      } else if (!this.isNumericType(column.type)) {
        this.addWarning('SCORE_COLUMN_TYPE',
          `Score column '${scoreCol}' should be numeric type, found '${column.type}'`
        );
      }
    }
  }

  /**
   * Validate government feedback table
   */
  validateGovernmentFeedbackTable() {
    const table = this.tables.get('gov_opportunity_feedback');
    if (!table) return;

    // Check foreign key relationships
    const requiredFKs = [
      { column: 'opportunity_id', toTable: 'gov_opportunities' },
      { column: 'user_id', toTable: 'users' },
      { column: 'company_id', toTable: 'companies' }
    ];

    for (const requiredFK of requiredFKs) {
      const fk = table.foreignKeys.find(fk => 
        fk.fromColumn === requiredFK.column && fk.toTable === requiredFK.toTable
      );
      if (!fk) {
        this.addWarning('MISSING_FEEDBACK_FOREIGN_KEY',
          `gov_opportunity_feedback should have foreign key ${requiredFK.column} -> ${requiredFK.toTable}(id)`,
          { table: 'gov_opportunity_feedback', column: requiredFK.column, toTable: requiredFK.toTable }
        );
      }
    }

    // Check feedback_type constraint
    const feedbackTypeColumn = table.columns.find(col => col.name === 'feedback_type');
    if (feedbackTypeColumn) {
      // This would be better checked at runtime, but we can recommend it
      this.addRecommendation('FEEDBACK_TYPE_CONSTRAINT', 'DATA_INTEGRITY',
        'Ensure feedback_type column has CHECK constraint for valid values',
        { 
          table: 'gov_opportunity_feedback',
          column: 'feedback_type',
          validValues: ['opportunity_relevance', 'scoring_accuracy', 'content_quality', 'timeline_accuracy', 'submission_success']
        }
      );
    }
  }

  /**
   * Validate templates and watchlists
   */
  validateTemplatesAndWatchlists() {
    // Validate ideal_project_templates
    const templatesTable = this.tables.get('ideal_project_templates');
    if (templatesTable) {
      const companyFK = templatesTable.foreignKeys.find(fk => fk.toTable === 'companies');
      if (!companyFK) {
        this.addWarning('MISSING_TEMPLATE_COMPANY_FK',
          'ideal_project_templates should reference companies table'
        );
      }
    }

    // Validate opportunity_watchlists
    const watchlistsTable = this.tables.get('opportunity_watchlists');
    if (watchlistsTable) {
      const companyFK = watchlistsTable.foreignKeys.find(fk => fk.toTable === 'companies');
      if (!companyFK) {
        this.addWarning('MISSING_WATCHLIST_COMPANY_FK',
          'opportunity_watchlists should reference companies table'
        );
      }
    }

    // Validate watchlist items relationship
    const watchlistItemsTable = this.tables.get('watchlist_items');
    if (watchlistItemsTable) {
      const watchlistFK = watchlistItemsTable.foreignKeys.find(fk => fk.toTable === 'opportunity_watchlists');
      const opportunityFK = watchlistItemsTable.foreignKeys.find(fk => fk.toTable === 'gov_opportunities');
      
      if (!watchlistFK) {
        this.addIssue('MISSING_WATCHLIST_ITEM_FK',
          'opportunity_watchlist_items must reference opportunity_watchlists'
        );
      }
      if (!opportunityFK) {
        this.addIssue('MISSING_WATCHLIST_OPPORTUNITY_FK',
          'opportunity_watchlist_items must reference gov_opportunities'
        );
      }
    }
  }

  /**
   * Validate SAM.gov integration requirements
   */
  validateSAMIntegrationRequirements() {
    console.log('🔍 Validating SAM.gov integration requirements...');

    // Check that source_ids JSONB can handle multiple SAM.gov identifiers
    const govOppTable = this.tables.get('gov_opportunities');
    if (govOppTable) {
      const sourceIdsColumn = govOppTable.columns.find(col => col.name === 'source_ids');
      if (!sourceIdsColumn) {
        this.addIssue('MISSING_SOURCE_IDS',
          'gov_opportunities must have source_ids column for SAM.gov integration'
        );
      } else if (!sourceIdsColumn.type.toLowerCase().includes('jsonb')) {
        this.addWarning('SOURCE_IDS_TYPE',
          'source_ids should be JSONB type for flexible SAM.gov identifier storage'
        );
      }
    }

    // Validate raw_text column for SAM.gov response storage
    if (govOppTable) {
      const rawTextColumn = govOppTable.columns.find(col => col.name === 'raw_text');
      if (!rawTextColumn) {
        this.addWarning('MISSING_RAW_TEXT',
          'gov_opportunities should have raw_text column for SAM.gov response storage'
        );
      } else if (!rawTextColumn.type.toLowerCase().includes('text')) {
        this.addWarning('RAW_TEXT_TYPE',
          'raw_text should be TEXT type for SAM.gov response storage'
        );
      }
    }

    // Check for deduplication-friendly columns
    const deduplicationColumns = [
      'solicitation_number', 'title', 'agency', 'due_date'
    ];

    for (const colName of deduplicationColumns) {
      if (govOppTable) {
        const column = govOppTable.columns.find(col => col.name === colName);
        if (!column) {
          this.addWarning('MISSING_DEDUPLICATION_COLUMN',
            `Missing column '${colName}' needed for opportunity deduplication`
          );
        }
      }
    }
  }

  /**
   * Validate Panel of Judges integration
   */
  validatePanelOfJudgesIntegration() {
    console.log('🔍 Validating Panel of Judges integration...');

    const scoresTable = this.tables.get('gov_opportunity_scores');
    if (!scoresTable) return;

    // Check for judge-specific score columns
    const judgeColumns = [
      'fit_score', 'complexity_score', 'competitiveness_score', 
      'timeline_score', 'strategic_score'
    ];

    for (const judgeCol of judgeColumns) {
      const column = scoresTable.columns.find(col => col.name === judgeCol);
      if (!column) {
        this.addWarning('MISSING_JUDGE_SCORE',
          `Missing judge score column '${judgeCol}' in gov_opportunity_scores`
        );
      }
    }

    // Check for judge explanations
    const explanationsColumn = scoresTable.columns.find(col => col.name === 'judge_explanations');
    if (!explanationsColumn) {
      this.addWarning('MISSING_JUDGE_EXPLANATIONS',
        'gov_opportunity_scores should have judge_explanations JSONB column'
      );
    } else if (!explanationsColumn.type.toLowerCase().includes('jsonb')) {
      this.addWarning('JUDGE_EXPLANATIONS_TYPE',
        'judge_explanations should be JSONB type for storing judge reasoning'
      );
    }

    // Recommend composite index for scoring queries
    this.addRecommendation('JUDGE_SCORING_INDEXES', 'PERFORMANCE',
      'Add composite indexes for judge scoring queries',
      { 
        indexes: [
          { table: 'gov_opportunity_scores', columns: ['opportunity_id', 'overall_score'], reason: 'Score-based opportunity ranking' },
          { table: 'gov_opportunity_scores', columns: ['created_at', 'overall_score'], reason: 'Recent high-scoring opportunities' }
        ]
      }
    );
  }

  /**
   * Validate government-specific data types
   */
  validateGovernmentDataTypes() {
    console.log('🔍 Validating government-specific data types...');

    const govTable = this.tables.get('gov_opportunities');
    if (!govTable) return;

    // Check monetary columns use appropriate precision
    const monetaryColumns = ['value_low', 'value_high', 'value_estimated'];
    for (const colName of monetaryColumns) {
      const column = govTable.columns.find(col => col.name === colName);
      if (column && !this.isNumericType(column.type)) {
        this.addWarning('MONETARY_COLUMN_TYPE',
          `Monetary column '${colName}' should use NUMERIC type for precision, found '${column.type}'`
        );
      }
    }

    // Check timestamp columns
    const timestampColumns = [
      'due_date', 'posted_date', 'pop_start', 'pop_end',
      'created_at', 'updated_at'
    ];

    for (const colName of timestampColumns) {
      const column = govTable.columns.find(col => col.name === colName);
      if (column && !this.isTimestampType(column.type)) {
        this.addWarning('TIMESTAMP_COLUMN_TYPE',
          `Timestamp column '${colName}' should use TIMESTAMPTZ type for timezone handling, found '${column.type}'`
        );
      }
    }

    // Check JSONB columns for government data
    const jsonbColumns = ['naics_codes', 'psc_codes', 'place_of_performance', 'evaluation_criteria', 'parsed_tags', 'attachments', 'contacts'];
    for (const colName of jsonbColumns) {
      const column = govTable.columns.find(col => col.name === colName);
      if (column && !column.type.toLowerCase().includes('jsonb')) {
        this.addWarning('JSONB_COLUMN_TYPE',
          `Government data column '${colName}' should use JSONB type for structured data, found '${column.type}'`
        );
      }
    }
  }

  /**
   * Validate required indexes for performance
   */
  validateRequiredIndexes() {
    console.log('🔍 Validating required indexes...');

    const criticalIndexes = [
      {
        table: 'gov_opportunities',
        type: 'btree',
        columns: ['agency'],
        reason: 'Agency-based filtering is common in government opportunity searches'
      },
      {
        table: 'gov_opportunities', 
        type: 'btree',
        columns: ['due_date'],
        reason: 'Timeline-based queries for upcoming deadlines'
      },
      {
        table: 'gov_opportunities',
        type: 'btree', 
        columns: ['solicitation_number'],
        reason: 'Unique opportunity identification and deduplication'
      },
      {
        table: 'gov_opportunities',
        type: 'gin',
        columns: ['naics_codes'],
        reason: 'JSONB array queries for NAICS code matching'
      },
      {
        table: 'gov_opportunities',
        type: 'gin',
        columns: ['psc_codes'], 
        reason: 'JSONB array queries for PSC code matching'
      },
      {
        table: 'gov_opportunity_scores',
        type: 'btree',
        columns: ['opportunity_id', 'overall_score'],
        reason: 'Composite index for score-based opportunity ranking'
      }
    ];

    this.addRecommendation('CRITICAL_GOVERNMENT_INDEXES', 'PERFORMANCE',
      'Critical indexes for government opportunities performance',
      { indexes: criticalIndexes }
    );
  }

  /**
   * Helper: Check if type is numeric
   */
  isNumericType(type) {
    const numericTypes = ['numeric', 'decimal', 'real', 'double', 'float', 'money'];
    return numericTypes.some(numType => type.toLowerCase().includes(numType));
  }

  /**
   * Helper: Check if type is timestamp
   */
  isTimestampType(type) {
    const timestampTypes = ['timestamp', 'timestamptz'];
    return timestampTypes.some(tsType => type.toLowerCase().includes(tsType));
  }

  /**
   * Helper: Check type compatibility
   */
  isTypeCompatible(actualType, expectedType) {
    const actual = actualType.toLowerCase();
    const expected = expectedType.toLowerCase();

    // Direct match
    if (actual.includes(expected)) return true;

    // UUID compatibility
    if (expected === 'uuid' && actual.includes('uuid')) return true;

    // JSONB compatibility
    if (expected === 'jsonb' && actual.includes('jsonb')) return true;

    // Numeric compatibility
    if (expected === 'numeric' && this.isNumericType(actual)) return true;

    // Timestamp compatibility
    if (expected === 'timestamptz' && this.isTimestampType(actual)) return true;

    // Text/VARCHAR compatibility
    if ((expected === 'varchar' || expected === 'text') && 
        (actual.includes('varchar') || actual.includes('text') || actual.includes('char'))) {
      return true;
    }

    return false;
  }

  /**
   * Generate government-specific report
   */
  generateGovernmentReport(baseReport) {
    const governmentSummary = {
      ...baseReport.summary,
      governmentTablesAnalyzed: this.govTables.filter(table => this.tables.has(table)).length,
      missingGovernmentTables: this.govTables.filter(table => !this.tables.has(table)),
      samIntegrationReady: this.assessSAMIntegrationReadiness(),
      panelOfJudgesIntegrationReady: this.assessPanelOfJudgesIntegrationReadiness()
    };

    return {
      ...baseReport,
      summary: governmentSummary,
      governmentSpecificChecks: {
        samIntegration: this.assessSAMIntegrationReadiness(),
        panelOfJudges: this.assessPanelOfJudgesIntegrationReadiness(),
        businessRules: this.assessBusinessRulesCompliance(),
        performance: this.assessPerformanceReadiness()
      }
    };
  }

  /**
   * Assess SAM.gov integration readiness
   */
  assessSAMIntegrationReadiness() {
    const govTable = this.tables.get('gov_opportunities');
    if (!govTable) return { ready: false, reason: 'gov_opportunities table not found' };

    const requiredColumns = ['source_ids', 'solicitation_number', 'raw_text'];
    const missingColumns = requiredColumns.filter(col => 
      !govTable.columns.find(c => c.name === col)
    );

    return {
      ready: missingColumns.length === 0,
      missingColumns: missingColumns,
      reason: missingColumns.length > 0 ? `Missing columns: ${missingColumns.join(', ')}` : 'All required columns present'
    };
  }

  /**
   * Assess Panel of Judges integration readiness
   */
  assessPanelOfJudgesIntegrationReadiness() {
    const scoresTable = this.tables.get('gov_opportunity_scores');
    if (!scoresTable) return { ready: false, reason: 'gov_opportunity_scores table not found' };

    const judgeColumns = ['fit_score', 'complexity_score', 'competitiveness_score', 'timeline_score'];
    const missingColumns = judgeColumns.filter(col => 
      !scoresTable.columns.find(c => c.name === col)
    );

    const hasOpportunityFK = scoresTable.foreignKeys.some(fk => fk.toTable === 'gov_opportunities');

    return {
      ready: missingColumns.length === 0 && hasOpportunityFK,
      missingColumns: missingColumns,
      hasOpportunityFK: hasOpportunityFK,
      reason: !hasOpportunityFK ? 'Missing foreign key to gov_opportunities' : 
              missingColumns.length > 0 ? `Missing judge columns: ${missingColumns.join(', ')}` : 
              'Panel of Judges integration ready'
    };
  }

  /**
   * Assess business rules compliance
   */
  assessBusinessRulesCompliance() {
    const missingTables = this.govTables.filter(table => !this.tables.has(table));
    const criticalIssues = this.issues.filter(issue => 
      issue.code.includes('GOVERNMENT') || issue.code.includes('MISSING_OPPORTUNITY')
    );

    return {
      compliant: missingTables.length === 0 && criticalIssues.length === 0,
      missingTables: missingTables,
      criticalIssues: criticalIssues.length,
      score: Math.max(0, 100 - (missingTables.length * 15) - (criticalIssues.length * 10))
    };
  }

  /**
   * Assess performance readiness
   */
  assessPerformanceReadiness() {
    const indexRecommendations = this.recommendations.filter(rec => 
      rec.code.includes('INDEX') || rec.code.includes('PERFORMANCE')
    );

    return {
      ready: indexRecommendations.length <= 2, // Allow some optimization recommendations
      recommendationCount: indexRecommendations.length,
      score: Math.max(0, 100 - (indexRecommendations.length * 5))
    };
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🏛️  Government Opportunities Schema Validator');
  console.log('=============================================');
  console.log('');

  try {
    const validator = new GovernmentOpportunitiesSchemaValidator({
      strictMode: true,
      logLevel: 'info'
    });

    const report = await validator.validateGovernmentSchema();

    // Display results
    displayGovernmentValidationResults(report);

    // Exit with appropriate code
    process.exit(report.summary.status === 'PASSED' ? 0 : 1);

  } catch (error) {
    console.error('💥 Government schema validation failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Display government validation results
 */
function displayGovernmentValidationResults(report) {
  console.log('');
  console.log('📋 Government Opportunities Schema Report');
  console.log('=========================================');
  console.log(`Status: ${getStatusIcon(report.summary.status)} ${report.summary.status}`);
  console.log(`Government Tables: ${report.summary.governmentTablesAnalyzed}/${6}`);
  console.log(`Total Tables Analyzed: ${report.summary.tablesAnalyzed}`);
  console.log(`Relationships: ${report.summary.relationshipsAnalyzed}`);
  console.log(`Issues: ${report.summary.totalIssues} critical, ${report.summary.totalWarnings} warnings`);
  console.log(`Integrity Score: ${getScoreIcon(report.summary.integrityScore)} ${report.summary.integrityScore}/100`);
  console.log('');

  // Government-specific status
  console.log('🏛️  Government Integration Status:');
  console.log('==================================');
  console.log(`SAM.gov Integration: ${report.governmentSpecificChecks.samIntegration.ready ? '✅' : '❌'} ${report.governmentSpecificChecks.samIntegration.reason}`);
  console.log(`Panel of Judges: ${report.governmentSpecificChecks.panelOfJudges.ready ? '✅' : '❌'} ${report.governmentSpecificChecks.panelOfJudges.reason}`);
  console.log(`Business Rules: ${report.governmentSpecificChecks.businessRules.compliant ? '✅' : '❌'} Score: ${report.governmentSpecificChecks.businessRules.score}/100`);
  console.log(`Performance Ready: ${report.governmentSpecificChecks.performance.ready ? '✅' : '❌'} Score: ${report.governmentSpecificChecks.performance.score}/100`);

  if (report.summary.missingGovernmentTables.length > 0) {
    console.log(`❌ Missing Tables: ${report.summary.missingGovernmentTables.join(', ')}`);
  }
  console.log('');

  // Display issues and warnings
  if (report.issues.length > 0) {
    console.log('🚨 Critical Issues:');
    console.log('==================');
    for (const issue of report.issues) {
      console.log(`❌ ${issue.code}: ${issue.message}`);
      if (issue.suggestion) {
        console.log(`   💡 Fix: ${issue.suggestion}`);
      }
      console.log('');
    }
  }

  if (report.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    console.log('============');
    for (const warning of report.warnings.slice(0, 10)) {
      console.log(`⚠️  ${warning.code}: ${warning.message}`);
      if (warning.suggestion) {
        console.log(`   💡 Suggestion: ${warning.suggestion}`);
      }
      console.log('');
    }
    if (report.warnings.length > 10) {
      console.log(`   ... and ${report.warnings.length - 10} more warnings`);
    }
  }

  // Display key recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 Key Recommendations:');
    console.log('=======================');
    const criticalRecs = report.recommendations.filter(rec => 
      rec.code.includes('GOVERNMENT') || rec.code.includes('CRITICAL')
    );
    
    for (const rec of criticalRecs.slice(0, 5)) {
      console.log(`${getPriorityIcon(rec.priority)} ${rec.category}: ${rec.action}`);
      console.log('');
    }
  }

  // Final assessment
  console.log('');
  if (report.summary.status === 'PASSED') {
    console.log('✅ Government Opportunities Schema validation completed successfully!');
    console.log('   Your government opportunities system is ready for development.');
  } else {
    console.log('❌ Government schema validation found critical issues!');
    console.log('   Please address the critical issues above before proceeding.');
  }

  console.log('');
  console.log('🎯 Next Steps:');
  console.log('==============');
  console.log('1. Run database migrations: npm run migrate');
  console.log('2. Validate services: node .claude/scripts/validate-gov-services.js');
  console.log('3. Test SAM.gov integration: node .claude/scripts/test-sam-integration.js');
  console.log('4. Start development server: npm start');
}

function getStatusIcon(status) {
  return status === 'PASSED' ? '✅' : '❌';
}

function getScoreIcon(score) {
  if (score >= 95) return '🟢';
  if (score >= 85) return '🟡';
  if (score >= 70) return '🟠';
  return '🔴';
}

function getPriorityIcon(priority) {
  const icons = {
    'LOW': '🔵',
    'MEDIUM': '🟡', 
    'HIGH': '🟠',
    'CRITICAL': '🔴'
  };
  return icons[priority] || '❓';
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { GovernmentOpportunitiesSchemaValidator, main };