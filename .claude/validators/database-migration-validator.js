#!/usr/bin/env node

/**
 * Database Migration SQL Validator for MyBidFit Platform
 * Prevents common SQL parsing, execution order, and compatibility issues
 * 
 * This validator would have caught and prevented all database issues we encountered:
 * - Multi-line CREATE TABLE statement parsing
 * - Execution order dependencies (CREATE before INDEX)
 * - PostgreSQL dialect compatibility
 * - Foreign key reference validation
 */

const fs = require('fs');
const path = require('path');

class DatabaseMigrationValidator {
  constructor(options = {}) {
    this.options = {
      strictMode: options.strictMode || false,
      postgresVersion: options.postgresVersion || '13+',
      logLevel: options.logLevel || 'info',
      ...options
    };
    this.issues = [];
    this.warnings = [];
  }

  /**
   * Main validation entry point
   * @param {string} sqlContent - Raw SQL content to validate
   * @param {string} filename - Optional filename for context
   * @returns {Object} Validation results with issues and suggestions
   */
  validateMigrationSQL(sqlContent, filename = 'migration.sql') {
    this.log(`🔍 Validating SQL migration: ${filename}`);
    
    // Reset state
    this.issues = [];
    this.warnings = [];
    
    // Parse SQL statements safely
    const statements = this.parseStatements(sqlContent);
    this.log(`📄 Parsed ${statements.length} SQL statements`);
    
    // Run all validation checks
    this.validateStatementParsing(statements, sqlContent);
    this.validateExecutionOrder(statements);
    this.validatePostgreSQLCompatibility(statements);
    this.validateForeignKeyReferences(statements);
    this.validateIndexDependencies(statements);
    
    // Generate final report
    const report = this.generateValidationReport(filename);
    
    if (this.issues.length === 0) {
      this.log(`✅ Migration validation PASSED: ${filename}`);
    } else {
      this.log(`❌ Migration validation FAILED: ${this.issues.length} critical issues found`);
    }
    
    return report;
  }

  /**
   * Advanced SQL statement parser that handles multi-line statements correctly
   * This fixes the issue we had with CREATE TABLE statements being split incorrectly
   */
  parseStatements(sqlContent) {
    const statements = [];
    const lines = sqlContent.split('\n');
    let currentStatement = '';
    let inMultiLineComment = false;
    let inStringLiteral = false;
    let stringDelimiter = null;
    
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      let processedLine = '';
      
      // Process character by character to handle comments and string literals
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        // Handle multi-line comments /* */
        if (!inStringLiteral && char === '/' && nextChar === '*') {
          inMultiLineComment = true;
          i++; // Skip next character
          continue;
        }
        
        if (inMultiLineComment && char === '*' && nextChar === '/') {
          inMultiLineComment = false;
          i++; // Skip next character
          continue;
        }
        
        if (inMultiLineComment) {
          continue;
        }
        
        // Handle single-line comments --
        if (!inStringLiteral && char === '-' && nextChar === '-') {
          // Rest of line is comment
          break;
        }
        
        // Handle string literals
        if (!inStringLiteral && (char === "'" || char === '"')) {
          inStringLiteral = true;
          stringDelimiter = char;
          processedLine += char;
          continue;
        }
        
        if (inStringLiteral && char === stringDelimiter) {
          // Check for escaped quotes
          if (line[i - 1] !== '\\') {
            inStringLiteral = false;
            stringDelimiter = null;
          }
          processedLine += char;
          continue;
        }
        
        processedLine += char;
      }
      
      // Add processed line to current statement
      if (processedLine.trim()) {
        currentStatement += ' ' + processedLine.trim();
      }
      
      // Check if statement is complete (ends with semicolon outside of string literals)
      if (!inStringLiteral && processedLine.trim().endsWith(';')) {
        const statement = currentStatement.trim();
        if (statement.length > 0) {
          statements.push({
            sql: statement,
            startLine: lineNum - statement.split(' ').length + 1,
            endLine: lineNum + 1,
            type: this.classifyStatement(statement)
          });
        }
        currentStatement = '';
      }
    }
    
    // Handle incomplete statement (missing semicolon)
    if (currentStatement.trim()) {
      this.addWarning('INCOMPLETE_STATEMENT', `Statement may be missing semicolon: ${currentStatement.substring(0, 100)}...`);
    }
    
    return statements;
  }

  /**
   * Classify SQL statement type for execution ordering
   */
  classifyStatement(sql) {
    const upperSQL = sql.toUpperCase().trim();
    
    if (upperSQL.startsWith('DROP')) return 'DROP';
    if (upperSQL.startsWith('CREATE TABLE')) return 'CREATE_TABLE';
    if (upperSQL.startsWith('CREATE INDEX')) return 'CREATE_INDEX';
    if (upperSQL.startsWith('CREATE UNIQUE INDEX')) return 'CREATE_INDEX';
    if (upperSQL.startsWith('INSERT')) return 'INSERT';
    if (upperSQL.startsWith('UPDATE')) return 'UPDATE';
    if (upperSQL.startsWith('ALTER TABLE')) return 'ALTER_TABLE';
    if (upperSQL.startsWith('COMMENT ON')) return 'COMMENT';
    
    return 'OTHER';
  }

  /**
   * Validate that statements were parsed correctly
   * This would have caught our multi-line CREATE TABLE parsing issue
   */
  validateStatementParsing(statements, originalSQL) {
    // Check for suspiciously short CREATE TABLE statements
    const createTableStatements = statements.filter(s => s.type === 'CREATE_TABLE');
    
    for (const stmt of createTableStatements) {
      if (stmt.sql.length < 100) { // CREATE TABLE should be substantial
        this.addIssue('SUSPICIOUS_CREATE_TABLE', 
          `CREATE TABLE statement seems too short (${stmt.sql.length} chars). May indicate parsing error.`,
          stmt.startLine
        );
      }
      
      // Check for missing closing parenthesis
      const openParens = (stmt.sql.match(/\(/g) || []).length;
      const closeParens = (stmt.sql.match(/\)/g) || []).length;
      
      if (openParens !== closeParens) {
        this.addIssue('UNBALANCED_PARENTHESES',
          `CREATE TABLE has unbalanced parentheses: ${openParens} open, ${closeParens} close`,
          stmt.startLine
        );
      }
    }
    
    // Validate total statement count seems reasonable
    const totalStatements = statements.length;
    const totalLines = originalSQL.split('\n').length;
    
    if (totalStatements > totalLines * 0.8) {
      this.addWarning('EXCESSIVE_STATEMENTS',
        `High statement-to-line ratio (${totalStatements}/${totalLines}). May indicate parsing issues.`
      );
    }
  }

  /**
   * Validate proper execution order to prevent dependency failures
   * This would have caught our CREATE INDEX before CREATE TABLE issue
   */
  validateExecutionOrder(statements) {
    const executionOrder = ['DROP', 'CREATE_TABLE', 'ALTER_TABLE', 'CREATE_INDEX', 'INSERT', 'UPDATE', 'COMMENT'];
    let currentOrderIndex = -1;
    
    for (const stmt of statements) {
      const typeOrderIndex = executionOrder.indexOf(stmt.type);
      
      if (typeOrderIndex !== -1) {
        if (typeOrderIndex < currentOrderIndex) {
          this.addIssue('EXECUTION_ORDER_VIOLATION',
            `Statement type ${stmt.type} appears after ${executionOrder[currentOrderIndex]}. This may cause dependency failures.`,
            stmt.startLine,
            {
              suggestion: `Move ${stmt.type} statements before ${executionOrder[currentOrderIndex]} statements`,
              correctOrder: executionOrder
            }
          );
        }
        currentOrderIndex = Math.max(currentOrderIndex, typeOrderIndex);
      }
    }
    
    // Generate suggested execution order
    const reorderedStatements = this.suggestExecutionOrder(statements);
    if (reorderedStatements.reorderingNeeded) {
      this.addWarning('EXECUTION_ORDER_OPTIMIZATION',
        `Consider reordering statements for optimal execution. ${reorderedStatements.changes} changes suggested.`
      );
    }
  }

  /**
   * Validate PostgreSQL-specific syntax compatibility
   * This would have caught our ROUND function syntax issue
   */
  validatePostgreSQLCompatibility(statements) {
    for (const stmt of statements) {
      const sql = stmt.sql.toUpperCase();
      
      // Check for MySQL-specific syntax that won't work in PostgreSQL
      if (sql.includes('AUTO_INCREMENT')) {
        this.addIssue('MYSQL_SYNTAX',
          'AUTO_INCREMENT is MySQL syntax. Use SERIAL or GENERATED AS IDENTITY in PostgreSQL.',
          stmt.startLine,
          { suggestion: 'Replace AUTO_INCREMENT with SERIAL' }
        );
      }
      
      // Check for SQL Server specific syntax
      if (sql.includes('[') || sql.includes(']')) {
        this.addWarning('SQUARE_BRACKETS',
          'Square brackets are SQL Server syntax. PostgreSQL uses double quotes for identifiers.',
          stmt.startLine
        );
      }
      
      // Check for common function compatibility issues
      if (sql.includes('ROUND(') && sql.includes(',') && !sql.includes('::NUMERIC')) {
        this.addWarning('ROUND_FUNCTION_COMPATIBILITY',
          'ROUND function with precision may need explicit CAST to numeric in PostgreSQL.',
          stmt.startLine,
          { suggestion: 'Use ROUND(CAST(value AS numeric), precision)' }
        );
      }
      
      // Check for proper array syntax
      if (sql.includes('ARRAY[') || sql.includes('&&')) {
        this.log(`✅ PostgreSQL array syntax detected in statement at line ${stmt.startLine}`);
      }
      
      // Validate common PostgreSQL system table usage
      if (sql.includes('PG_STAT_USER_TABLES') && sql.includes('TABLENAME')) {
        this.addIssue('POSTGRES_SYSTEM_TABLE',
          'pg_stat_user_tables uses "relname" not "tablename" for table names.',
          stmt.startLine,
          { suggestion: 'Use "relname AS tablename" for compatibility' }
        );
      }
    }
  }

  /**
   * Validate foreign key references to prevent constraint violations
   * This would have caught our partner_matches foreign key issues
   */
  validateForeignKeyReferences(statements) {
    const createTableStatements = statements.filter(s => s.type === 'CREATE_TABLE');
    const tablesToCreate = new Set();
    const foreignKeyReferences = new Map();
    
    // Extract table names and foreign key references
    for (const stmt of createTableStatements) {
      const tableName = this.extractTableName(stmt.sql);
      if (tableName) {
        tablesToCreate.add(tableName.toLowerCase());
        
        const foreignKeys = this.extractForeignKeys(stmt.sql);
        if (foreignKeys.length > 0) {
          foreignKeyReferences.set(tableName.toLowerCase(), foreignKeys);
        }
      }
    }
    
    // Validate foreign key references
    for (const [tableName, foreignKeys] of foreignKeyReferences.entries()) {
      for (const fk of foreignKeys) {
        const referencedTable = fk.referencedTable.toLowerCase();
        
        if (!tablesToCreate.has(referencedTable)) {
          this.addIssue('MISSING_REFERENCED_TABLE',
            `Table "${tableName}" references "${referencedTable}" which is not created in this migration.`,
            fk.line,
            {
              suggestion: `Ensure "${referencedTable}" is created before "${tableName}" or exists in database`,
              foreignKey: fk
            }
          );
        }
      }
    }
    
    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(foreignKeyReferences);
    if (circularDeps.length > 0) {
      this.addWarning('CIRCULAR_DEPENDENCIES',
        `Circular foreign key dependencies detected: ${circularDeps.join(' -> ')}`
      );
    }
  }

  /**
   * Validate index dependencies on tables and columns
   */
  validateIndexDependencies(statements) {
    const createTableStatements = statements.filter(s => s.type === 'CREATE_TABLE');
    const createIndexStatements = statements.filter(s => s.type === 'CREATE_INDEX');
    
    const tablesAndColumns = new Map();
    
    // Extract table and column information
    for (const stmt of createTableStatements) {
      const tableName = this.extractTableName(stmt.sql);
      const columns = this.extractColumnNames(stmt.sql);
      
      if (tableName) {
        tablesAndColumns.set(tableName.toLowerCase(), columns.map(c => c.toLowerCase()));
      }
    }
    
    // Validate index references
    for (const stmt of createIndexStatements) {
      const indexInfo = this.extractIndexInfo(stmt.sql);
      
      if (indexInfo) {
        const tableName = indexInfo.tableName.toLowerCase();
        
        // Check if table exists
        if (!tablesAndColumns.has(tableName)) {
          this.addIssue('INDEX_ON_MISSING_TABLE',
            `Index "${indexInfo.indexName}" references table "${tableName}" which is not created.`,
            stmt.startLine
          );
          continue;
        }
        
        // Check if columns exist
        const tableColumns = tablesAndColumns.get(tableName);
        for (const column of indexInfo.columns) {
          if (!tableColumns.includes(column.toLowerCase())) {
            this.addIssue('INDEX_ON_MISSING_COLUMN',
              `Index "${indexInfo.indexName}" references column "${column}" which doesn't exist in table "${tableName}".`,
              stmt.startLine
            );
          }
        }
      }
    }
  }

  /**
   * Helper methods for SQL parsing
   */
  extractTableName(createTableSQL) {
    const match = createTableSQL.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"]?[\w_]+[`"]?)/i);
    return match ? match[1].replace(/[`"]/g, '') : null;
  }

  extractColumnNames(createTableSQL) {
    const columns = [];
    const columnPattern = /^\s*([`"]?[\w_]+[`"]?)\s+[\w()]+/gm;
    const tableBodyMatch = createTableSQL.match(/\(([\s\S]*)\)/);
    
    if (tableBodyMatch) {
      const tableBody = tableBodyMatch[1];
      const lines = tableBody.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('--') && !trimmed.toUpperCase().startsWith('PRIMARY') && 
            !trimmed.toUpperCase().startsWith('FOREIGN') && !trimmed.toUpperCase().startsWith('UNIQUE') &&
            !trimmed.toUpperCase().startsWith('INDEX') && !trimmed.toUpperCase().startsWith('KEY')) {
          
          const match = trimmed.match(/^([`"]?[\w_]+[`"]?)/);
          if (match) {
            columns.push(match[1].replace(/[`"]/g, ''));
          }
        }
      }
    }
    
    return columns;
  }

  extractForeignKeys(createTableSQL) {
    const foreignKeys = [];
    const fkPattern = /FOREIGN\s+KEY\s*\([`"]?([\w_]+)[`"]?\)\s+REFERENCES\s+([`"]?[\w_]+[`"]?)/gi;
    let match;
    
    while ((match = fkPattern.exec(createTableSQL)) !== null) {
      foreignKeys.push({
        column: match[1],
        referencedTable: match[2].replace(/[`"]/g, ''),
        line: createTableSQL.substring(0, match.index).split('\n').length
      });
    }
    
    return foreignKeys;
  }

  extractIndexInfo(createIndexSQL) {
    const match = createIndexSQL.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"]?[\w_]+[`"]?)\s+ON\s+([`"]?[\w_]+[`"]?)\s*\(([^)]+)\)/i);
    
    if (match) {
      const columns = match[3].split(',').map(col => col.trim().replace(/[`"]/g, '').split(' ')[0]);
      
      return {
        indexName: match[1].replace(/[`"]/g, ''),
        tableName: match[2].replace(/[`"]/g, ''),
        columns: columns
      };
    }
    
    return null;
  }

  detectCircularDependencies(foreignKeyReferences) {
    // Simple circular dependency detection (could be enhanced)
    const dependencies = new Map();
    
    for (const [table, foreignKeys] of foreignKeyReferences.entries()) {
      dependencies.set(table, foreignKeys.map(fk => fk.referencedTable.toLowerCase()));
    }
    
    // Check for immediate circular references (A -> B, B -> A)
    const circular = [];
    for (const [table, refs] of dependencies.entries()) {
      for (const ref of refs) {
        const refDeps = dependencies.get(ref) || [];
        if (refDeps.includes(table)) {
          circular.push(`${table} <-> ${ref}`);
        }
      }
    }
    
    return [...new Set(circular)];
  }

  /**
   * Suggest optimal execution order for statements
   */
  suggestExecutionOrder(statements) {
    const ordered = [...statements];
    const orderPriority = {
      'DROP': 0,
      'CREATE_TABLE': 1,
      'ALTER_TABLE': 2,
      'CREATE_INDEX': 3,
      'INSERT': 4,
      'UPDATE': 5,
      'COMMENT': 6,
      'OTHER': 7
    };
    
    let reorderingNeeded = false;
    let changes = 0;
    
    ordered.sort((a, b) => {
      const aPriority = orderPriority[a.type] || 999;
      const bPriority = orderPriority[b.type] || 999;
      
      if (aPriority !== bPriority) {
        const originalIndexA = statements.indexOf(a);
        const originalIndexB = statements.indexOf(b);
        
        if ((aPriority < bPriority && originalIndexA > originalIndexB) ||
            (aPriority > bPriority && originalIndexA < originalIndexB)) {
          reorderingNeeded = true;
          changes++;
        }
      }
      
      return aPriority - bPriority;
    });
    
    return { reorderedStatements: ordered, reorderingNeeded, changes };
  }

  /**
   * Issue tracking
   */
  addIssue(code, message, line = null, details = {}) {
    this.issues.push({
      type: 'ERROR',
      code,
      message,
      line,
      details,
      timestamp: new Date()
    });
  }

  addWarning(code, message, line = null, details = {}) {
    this.warnings.push({
      type: 'WARNING', 
      code,
      message,
      line,
      details,
      timestamp: new Date()
    });
  }

  log(message) {
    if (this.options.logLevel !== 'silent') {
      console.log(message);
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport(filename) {
    const report = {
      filename,
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.issues.length,
        totalWarnings: this.warnings.length,
        status: this.issues.length === 0 ? 'PASSED' : 'FAILED',
        riskLevel: this.calculateRiskLevel()
      },
      issues: this.issues,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  calculateRiskLevel() {
    const criticalIssues = this.issues.filter(i => 
      ['EXECUTION_ORDER_VIOLATION', 'MISSING_REFERENCED_TABLE', 'MYSQL_SYNTAX', 'POSTGRES_SYSTEM_TABLE'].includes(i.code)
    ).length;
    
    if (criticalIssues > 0) return 'HIGH';
    if (this.issues.length > 0) return 'MEDIUM';
    if (this.warnings.length > 2) return 'LOW';
    return 'MINIMAL';
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Execution order recommendations
    if (this.issues.some(i => i.code === 'EXECUTION_ORDER_VIOLATION')) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Execution Order',
        action: 'Reorder statements: DROP → CREATE TABLE → ALTER TABLE → CREATE INDEX → INSERT → UPDATE → COMMENT'
      });
    }
    
    // PostgreSQL compatibility recommendations
    if (this.issues.some(i => i.code.includes('MYSQL') || i.code.includes('POSTGRES'))) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Database Compatibility',
        action: 'Review and fix database-specific syntax for PostgreSQL compatibility'
      });
    }
    
    // Foreign key recommendations
    if (this.issues.some(i => i.code === 'MISSING_REFERENCED_TABLE')) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Data Integrity',
        action: 'Ensure all referenced tables are created before tables with foreign key constraints'
      });
    }
    
    return recommendations;
  }
}

module.exports = { DatabaseMigrationValidator };