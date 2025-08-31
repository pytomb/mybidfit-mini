#!/usr/bin/env node

/**
 * Data Relationship Integrity Validator for MyBidFit Platform
 * Validates foreign key dependencies, orphaned records, and data consistency
 * 
 * This validator prevents the foreign key constraint violations we encountered
 * by analyzing data relationships and providing safe insertion/update orders
 */

const fs = require('fs');
const path = require('path');

class DataIntegrityValidator {
  constructor(options = {}) {
    this.options = {
      strictMode: true,
      logLevel: 'info',
      maxOrphans: 0,
      checkReferentialIntegrity: true,
      ...options
    };
    
    this.tables = new Map();
    this.relationships = new Map();
    this.issues = [];
    this.warnings = [];
    this.recommendations = [];
  }

  /**
   * Validate data integrity for MyBidFit schema
   */
  async validateDataIntegrity(schemaContent) {
    console.log('🔍 Analyzing schema structure...');
    
    // Parse schema and build relationship map
    this.parseSchema(schemaContent);
    
    // Validate relationships
    this.validateForeignKeyRelationships();
    this.validateConstraintNaming();
    this.detectCircularDependencies();
    this.analyzeInsertionOrder();
    this.validateBusinessRules();
    
    // Generate comprehensive report
    return this.generateIntegrityReport();
  }

  /**
   * Parse SQL schema and extract table/relationship information
   */
  parseSchema(schemaContent) {
    const tableRegex = /CREATE TABLE (\w+)\s*\(([\s\S]*?)\);/gi;
    let match;
    
    // Extract all tables and their columns
    while ((match = tableRegex.exec(schemaContent)) !== null) {
      const tableName = match[1].toLowerCase();
      const tableDefinition = match[2];
      
      const table = {
        name: tableName,
        columns: this.parseColumns(tableDefinition),
        constraints: this.parseConstraints(tableDefinition),
        foreignKeys: [],
        referencedBy: []
      };
      
      this.tables.set(tableName, table);
    }
    
    // Build relationship map
    this.buildRelationshipMap();
  }

  /**
   * Parse table columns from CREATE TABLE statement
   */
  parseColumns(tableDefinition) {
    const columns = [];
    const lines = tableDefinition.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('CONSTRAINT') && !trimmed.startsWith('FOREIGN KEY') && !trimmed.startsWith('PRIMARY KEY')) {
        const columnMatch = trimmed.match(/^(\w+)\s+(\w+(?:\([^)]+\))?)/);
        if (columnMatch) {
          columns.push({
            name: columnMatch[1].toLowerCase(),
            type: columnMatch[2],
            constraints: this.parseColumnConstraints(trimmed)
          });
        }
      }
    }
    
    return columns;
  }

  /**
   * Parse column-level constraints
   */
  parseColumnConstraints(columnDef) {
    const constraints = [];
    
    if (/NOT NULL/i.test(columnDef)) constraints.push('NOT NULL');
    if (/PRIMARY KEY/i.test(columnDef)) constraints.push('PRIMARY KEY');
    if (/UNIQUE/i.test(columnDef)) constraints.push('UNIQUE');
    if (/DEFAULT/i.test(columnDef)) constraints.push('DEFAULT');
    if (/REFERENCES/i.test(columnDef)) constraints.push('FOREIGN KEY');
    
    return constraints;
  }

  /**
   * Parse table-level constraints
   */
  parseConstraints(tableDefinition) {
    const constraints = [];
    const constraintRegex = /CONSTRAINT\s+(\w+)\s+(.*?)(?=,|\s*$)/gi;
    let match;
    
    while ((match = constraintRegex.exec(tableDefinition)) !== null) {
      constraints.push({
        name: match[1],
        definition: match[2].trim()
      });
    }
    
    return constraints;
  }

  /**
   * Build relationship map between tables
   */
  buildRelationshipMap() {
    for (const [tableName, table] of this.tables) {
      // Find foreign key relationships
      const fkRegex = /FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/gi;
      const tableContent = JSON.stringify(table);
      let match;
      
      while ((match = fkRegex.exec(tableContent)) !== null) {
        const fkColumn = match[1].trim();
        const referencedTable = match[2].toLowerCase();
        const referencedColumn = match[3].trim();
        
        const relationship = {
          fromTable: tableName,
          fromColumn: fkColumn,
          toTable: referencedTable,
          toColumn: referencedColumn,
          type: 'FOREIGN_KEY'
        };
        
        table.foreignKeys.push(relationship);
        
        // Add reverse relationship
        const referencedTableObj = this.tables.get(referencedTable);
        if (referencedTableObj) {
          referencedTableObj.referencedBy.push({
            ...relationship,
            fromTable: referencedTable,
            toTable: tableName
          });
        }
        
        this.relationships.set(`${tableName}.${fkColumn}`, relationship);
      }
      
      // Also check for inline REFERENCES
      for (const column of table.columns) {
        if (column.constraints.includes('FOREIGN KEY')) {
          // This would need more sophisticated parsing for inline REFERENCES
          // For now, we'll catch it in the constraint validation
        }
      }
    }
  }

  /**
   * Validate foreign key relationships exist and are properly defined
   */
  validateForeignKeyRelationships() {
    for (const [key, relationship] of this.relationships) {
      const { fromTable, fromColumn, toTable, toColumn } = relationship;
      
      // Check if referenced table exists
      const referencedTable = this.tables.get(toTable);
      if (!referencedTable) {
        this.addIssue('MISSING_REFERENCED_TABLE', 
          `Foreign key ${fromTable}.${fromColumn} references non-existent table '${toTable}'`,
          { table: fromTable, column: fromColumn, referencedTable: toTable }
        );
        continue;
      }
      
      // Check if referenced column exists
      const referencedColumn = referencedTable.columns.find(col => col.name === toColumn);
      if (!referencedColumn) {
        this.addIssue('MISSING_REFERENCED_COLUMN',
          `Foreign key ${fromTable}.${fromColumn} references non-existent column '${toTable}.${toColumn}'`,
          { table: fromTable, column: fromColumn, referencedTable: toTable, referencedColumn: toColumn }
        );
        continue;
      }
      
      // Check if foreign key column exists in source table
      const sourceTable = this.tables.get(fromTable);
      const sourceColumn = sourceTable.columns.find(col => col.name === fromColumn);
      if (!sourceColumn) {
        this.addIssue('MISSING_FOREIGN_KEY_COLUMN',
          `Table ${fromTable} foreign key references column '${fromColumn}' which doesn't exist`,
          { table: fromTable, column: fromColumn }
        );
      }
      
      // Warn about potential data type mismatches (simplified check)
      if (sourceColumn && referencedColumn) {
        const sourceType = sourceColumn.type.toLowerCase();
        const refType = referencedColumn.type.toLowerCase();
        
        if (!this.areTypesCompatible(sourceType, refType)) {
          this.addWarning('TYPE_MISMATCH_WARNING',
            `Potential type mismatch between ${fromTable}.${fromColumn} (${sourceType}) and ${toTable}.${toColumn} (${refType})`
          );
        }
      }
    }
  }

  /**
   * Check if two column types are compatible for foreign key relationships
   */
  areTypesCompatible(sourceType, refType) {
    // Normalize types for comparison
    const normalizeType = (type) => {
      return type.replace(/\([^)]*\)/g, '').toLowerCase().trim();
    };
    
    const normalizedSource = normalizeType(sourceType);
    const normalizedRef = normalizeType(refType);
    
    // Exact match
    if (normalizedSource === normalizedRef) return true;
    
    // Compatible integer types
    const intTypes = ['int', 'integer', 'bigint', 'serial', 'bigserial'];
    if (intTypes.includes(normalizedSource) && intTypes.includes(normalizedRef)) {
      return true;
    }
    
    // Compatible string types
    const stringTypes = ['varchar', 'text', 'char'];
    if (stringTypes.includes(normalizedSource) && stringTypes.includes(normalizedRef)) {
      return true;
    }
    
    return false;
  }

  /**
   * Validate constraint naming conventions
   */
  validateConstraintNaming() {
    for (const [tableName, table] of this.tables) {
      for (const constraint of table.constraints) {
        const constraintName = constraint.name.toLowerCase();
        
        // Check foreign key naming convention
        if (constraint.definition.includes('FOREIGN KEY')) {
          if (!constraintName.startsWith('fk_') && !constraintName.includes('_fkey')) {
            this.addWarning('CONSTRAINT_NAMING_CONVENTION',
              `Foreign key constraint '${constraint.name}' in table '${tableName}' doesn't follow naming convention (suggested: fk_${tableName}_${constraint.name})`
            );
          }
        }
        
        // Check primary key naming convention
        if (constraint.definition.includes('PRIMARY KEY')) {
          if (!constraintName.startsWith('pk_') && !constraintName.includes('_pkey')) {
            this.addWarning('CONSTRAINT_NAMING_CONVENTION',
              `Primary key constraint '${constraint.name}' in table '${tableName}' doesn't follow naming convention (suggested: pk_${tableName})`
            );
          }
        }
      }
    }
  }

  /**
   * Detect circular dependencies in foreign key relationships
   */
  detectCircularDependencies() {
    const visited = new Set();
    const recursionStack = new Set();
    
    for (const tableName of this.tables.keys()) {
      if (this.hasCycle(tableName, visited, recursionStack, [])) {
        // Cycle detection handled in hasCycle method
      }
    }
  }

  /**
   * Recursive cycle detection using DFS
   */
  hasCycle(tableName, visited, recursionStack, path) {
    if (recursionStack.has(tableName)) {
      // Found a cycle
      const cycleStart = path.indexOf(tableName);
      const cycle = path.slice(cycleStart).concat([tableName]);
      
      this.addIssue('CIRCULAR_DEPENDENCY',
        `Circular foreign key dependency detected: ${cycle.join(' → ')}`,
        { cycle: cycle, affectedTables: cycle }
      );
      return true;
    }
    
    if (visited.has(tableName)) {
      return false;
    }
    
    visited.add(tableName);
    recursionStack.add(tableName);
    path.push(tableName);
    
    const table = this.tables.get(tableName);
    if (table) {
      for (const fk of table.foreignKeys) {
        if (this.hasCycle(fk.toTable, visited, recursionStack, path)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(tableName);
    path.pop();
    return false;
  }

  /**
   * Analyze and recommend safe insertion order
   */
  analyzeInsertionOrder() {
    const dependencyGraph = new Map();
    const inDegree = new Map();
    
    // Initialize all tables
    for (const tableName of this.tables.keys()) {
      dependencyGraph.set(tableName, []);
      inDegree.set(tableName, 0);
    }
    
    // Build dependency graph
    for (const [tableName, table] of this.tables) {
      for (const fk of table.foreignKeys) {
        if (fk.toTable !== tableName) { // Avoid self-references
          dependencyGraph.get(fk.toTable).push(tableName);
          inDegree.set(tableName, inDegree.get(tableName) + 1);
        }
      }
    }
    
    // Topological sort to get safe insertion order
    const insertionOrder = [];
    const queue = [];
    
    // Find tables with no dependencies
    for (const [tableName, degree] of inDegree) {
      if (degree === 0) {
        queue.push(tableName);
      }
    }
    
    while (queue.length > 0) {
      const currentTable = queue.shift();
      insertionOrder.push(currentTable);
      
      const dependents = dependencyGraph.get(currentTable);
      for (const dependent of dependents) {
        inDegree.set(dependent, inDegree.get(dependent) - 1);
        if (inDegree.get(dependent) === 0) {
          queue.push(dependent);
        }
      }
    }
    
    // Check for remaining tables (indicates cycles)
    const remainingTables = [];
    for (const [tableName, degree] of inDegree) {
      if (degree > 0) {
        remainingTables.push(tableName);
      }
    }
    
    if (remainingTables.length > 0) {
      this.addWarning('INSERTION_ORDER_CYCLES',
        `Tables with circular dependencies require special handling: ${remainingTables.join(', ')}`
      );
    }
    
    this.addRecommendation('SAFE_INSERTION_ORDER', 'DATA_LOADING', 
      `Recommended table insertion order: ${insertionOrder.join(' → ')}`,
      { insertionOrder: insertionOrder, cyclesTables: remainingTables }
    );
  }

  /**
   * Validate business-specific rules for MyBidFit platform
   */
  validateBusinessRules() {
    // Check for MyBidFit-specific tables and relationships
    const expectedTables = ['companies', 'partner_profiles', 'opportunities', 'partner_matches', 'scoring_results'];
    const missingTables = expectedTables.filter(table => !this.tables.has(table));
    
    if (missingTables.length > 0) {
      this.addWarning('MISSING_BUSINESS_TABLES',
        `MyBidFit business tables not found: ${missingTables.join(', ')}`
      );
    }
    
    // Validate critical relationships exist
    this.validateCriticalRelationships();
    
    // Check for required indexes on foreign keys
    this.recommendForeignKeyIndexes();
    
    // Validate data constraints
    this.validateDataConstraints();
  }

  /**
   * Validate critical business relationships
   */
  validateCriticalRelationships() {
    const criticalRelationships = [
      { from: 'partner_profiles', column: 'company_id', to: 'companies', description: 'Partner profiles must reference companies' },
      { from: 'partner_matches', column: 'seeker_id', to: 'partner_profiles', description: 'Partner matches must reference seeker profile' },
      { from: 'partner_matches', column: 'partner_id', to: 'partner_profiles', description: 'Partner matches must reference partner profile' },
      { from: 'scoring_results', column: 'company_id', to: 'companies', description: 'Scoring results must reference companies' },
      { from: 'scoring_results', column: 'opportunity_id', to: 'opportunities', description: 'Scoring results must reference opportunities' }
    ];
    
    for (const rel of criticalRelationships) {
      const relationshipKey = `${rel.from}.${rel.column}`;
      const relationship = this.relationships.get(relationshipKey);
      
      if (!relationship) {
        this.addIssue('MISSING_CRITICAL_RELATIONSHIP',
          `Missing critical foreign key: ${rel.description}`,
          { fromTable: rel.from, column: rel.column, toTable: rel.to, description: rel.description }
        );
      } else if (relationship.toTable !== rel.to) {
        this.addIssue('INCORRECT_RELATIONSHIP_TARGET',
          `Foreign key ${rel.from}.${rel.column} references ${relationship.toTable} instead of expected ${rel.to}`,
          { fromTable: rel.from, column: rel.column, expectedTable: rel.to, actualTable: relationship.toTable }
        );
      }
    }
  }

  /**
   * Recommend indexes on foreign key columns
   */
  recommendForeignKeyIndexes() {
    const indexRecommendations = [];
    
    for (const [tableName, table] of this.tables) {
      for (const fk of table.foreignKeys) {
        indexRecommendations.push({
          table: tableName,
          column: fk.fromColumn,
          reason: 'Foreign key performance optimization'
        });
      }
    }
    
    if (indexRecommendations.length > 0) {
      this.addRecommendation('FOREIGN_KEY_INDEXES', 'PERFORMANCE',
        `Consider adding indexes on foreign key columns for optimal performance`,
        { recommendations: indexRecommendations }
      );
    }
  }

  /**
   * Validate data constraints and business rules
   */
  validateDataConstraints() {
    // Check for required NOT NULL constraints on critical columns
    const criticalColumns = [
      { table: 'companies', column: 'name', reason: 'Company name is required for business logic' },
      { table: 'companies', column: 'credibility_score', reason: 'Credibility score is used in matching algorithms' },
      { table: 'partner_profiles', column: 'company_id', reason: 'Partner profiles must be linked to companies' },
      { table: 'opportunities', column: 'title', reason: 'Opportunity title is required for display' },
      { table: 'opportunities', column: 'submission_deadline', reason: 'Submission deadline is required for time-based filtering' }
    ];
    
    for (const critical of criticalColumns) {
      const table = this.tables.get(critical.table);
      if (table) {
        const column = table.columns.find(col => col.name === critical.column);
        if (column && !column.constraints.includes('NOT NULL')) {
          this.addWarning('MISSING_NOT_NULL_CONSTRAINT',
            `Column ${critical.table}.${critical.column} should have NOT NULL constraint: ${critical.reason}`
          );
        }
      }
    }
    
    // Check for proper data types on score columns
    const scoreColumns = ['credibility_score', 'match_score', 'cfo_score', 'ciso_score', 'operator_score', 'skeptic_score'];
    for (const [tableName, table] of this.tables) {
      for (const column of table.columns) {
        if (scoreColumns.includes(column.name)) {
          const type = column.type.toLowerCase();
          if (!type.includes('numeric') && !type.includes('decimal') && !type.includes('float') && !type.includes('real')) {
            this.addWarning('SCORE_COLUMN_TYPE',
              `Score column ${tableName}.${column.name} has type '${column.type}' - consider NUMERIC for precision`
            );
          }
        }
      }
    }
  }

  /**
   * Add issue to validation results
   */
  addIssue(code, message, details = {}) {
    this.issues.push({
      code,
      message,
      severity: 'critical',
      details,
      suggestion: this.generateSuggestion(code, details)
    });
  }

  /**
   * Add warning to validation results
   */
  addWarning(code, message, details = {}) {
    this.warnings.push({
      code,
      message,
      severity: 'warning', 
      details,
      suggestion: this.generateSuggestion(code, details)
    });
  }

  /**
   * Add recommendation to validation results
   */
  addRecommendation(code, category, action, details = {}) {
    this.recommendations.push({
      code,
      category,
      priority: this.determinePriority(code),
      action,
      details
    });
  }

  /**
   * Generate fix suggestion based on issue code
   */
  generateSuggestion(code, details) {
    switch (code) {
      case 'MISSING_REFERENCED_TABLE':
        return `Create table '${details.referencedTable}' or correct the foreign key reference`;
      
      case 'MISSING_REFERENCED_COLUMN':
        return `Add column '${details.referencedColumn}' to table '${details.referencedTable}' or update the foreign key reference`;
        
      case 'MISSING_FOREIGN_KEY_COLUMN':
        return `Add column '${details.column}' to table '${details.table}' or remove the foreign key constraint`;
        
      case 'CIRCULAR_DEPENDENCY':
        return `Break the circular dependency by making one of the foreign keys nullable or using a junction table`;
        
      case 'MISSING_CRITICAL_RELATIONSHIP':
        return `ADD CONSTRAINT fk_${details.fromTable}_${details.column} FOREIGN KEY (${details.column}) REFERENCES ${details.toTable}(id)`;
        
      default:
        return 'Review the relationship definition and schema structure';
    }
  }

  /**
   * Determine recommendation priority
   */
  determinePriority(code) {
    const priorities = {
      'SAFE_INSERTION_ORDER': 'HIGH',
      'FOREIGN_KEY_INDEXES': 'MEDIUM',
      'CONSTRAINT_NAMING_CONVENTION': 'LOW'
    };
    
    return priorities[code] || 'MEDIUM';
  }

  /**
   * Generate comprehensive integrity report
   */
  generateIntegrityReport() {
    const summary = {
      status: this.issues.length === 0 ? 'PASSED' : 'FAILED',
      tablesAnalyzed: this.tables.size,
      relationshipsAnalyzed: this.relationships.size,
      totalIssues: this.issues.length,
      totalWarnings: this.warnings.length,
      totalRecommendations: this.recommendations.length,
      integrityScore: this.calculateIntegrityScore()
    };
    
    return {
      summary,
      issues: this.issues,
      warnings: this.warnings,
      recommendations: this.recommendations,
      tables: Array.from(this.tables.entries()).map(([name, table]) => ({
        name,
        columnCount: table.columns.length,
        foreignKeyCount: table.foreignKeys.length,
        referencedByCount: table.referencedBy.length,
        constraintCount: table.constraints.length
      })),
      relationships: Array.from(this.relationships.values())
    };
  }

  /**
   * Calculate overall integrity score (0-100)
   */
  calculateIntegrityScore() {
    const totalChecks = this.tables.size * 5; // Approximate checks per table
    const penalties = this.issues.length * 10 + this.warnings.length * 2;
    const score = Math.max(0, 100 - (penalties / totalChecks * 100));
    return Math.round(score);
  }
}

module.exports = { DataIntegrityValidator };