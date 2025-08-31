#!/usr/bin/env node

const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const db = Database.getInstance();
  
  try {
    logger.info('🚀 Starting database migrations...');
    
    // Connect to database
    await db.connect();
    logger.info('✅ Database connection established');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../src/database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Parse statements more carefully to handle multi-line CREATE TABLE statements
    const allStatements = [];
    const lines = schema.split('\n');
    let currentStatement = '';
    let inStatement = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }
      
      // Handle SQL comments within statements
      if (trimmedLine.includes('--')) {
        // Split the line to separate SQL from comments
        const parts = trimmedLine.split('--');
        const sqlPart = parts[0].trim();
        if (sqlPart) {
          currentStatement += ' ' + sqlPart;
        }
      } else {
        // Add line to current statement
        currentStatement += ' ' + trimmedLine;
      }
      
      // Check if statement is complete (ends with semicolon)
      if (trimmedLine.endsWith(';')) {
        const statement = currentStatement.trim();
        if (statement.length > 0) {
          allStatements.push(statement);
        }
        currentStatement = '';
      }
    }
    
    // Separate statements by type for proper execution order
    const dropStatements = allStatements.filter(stmt => stmt.toUpperCase().startsWith('DROP TABLE'));
    const createTableStatements = allStatements.filter(stmt => stmt.toUpperCase().startsWith('CREATE TABLE'));
    const createIndexStatements = allStatements.filter(stmt => stmt.toUpperCase().startsWith('CREATE INDEX'));
    const insertStatements = allStatements.filter(stmt => stmt.toUpperCase().startsWith('INSERT INTO'));
    const commentStatements = allStatements.filter(stmt => stmt.toUpperCase().startsWith('COMMENT ON'));
    
    // Execute in proper order: DROP -> CREATE TABLES -> CREATE INDEXES -> INSERT -> COMMENTS
    const statements = [
      ...dropStatements,
      ...createTableStatements, 
      ...createIndexStatements,
      ...insertStatements,
      ...commentStatements
    ];
    
    logger.info(`📄 Found ${statements.length} SQL statements to execute`);
    logger.info(`📊 Statement breakdown: ${dropStatements.length} drops, ${createTableStatements.length} tables, ${createIndexStatements.length} indexes, ${insertStatements.length} inserts`);
    
    // Execute migrations in transaction
    await db.transaction(async (client) => {
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        try {
          // Skip comments and empty statements
          if (statement.startsWith('--') || statement.trim() === '') {
            continue;
          }
          
          logger.info(`⏳ Executing migration ${i + 1}/${statements.length}: ${statement.substring(0, 50).replace(/\n/g, ' ')}...`);
          await client.query(statement);
          
        } catch (error) {
          logger.error(`❌ Migration ${i + 1} failed:`, statement.substring(0, 100) + '...');
          logger.error(`🔍 Full statement:`, statement);
          throw error;
        }
      }
    });
    
    logger.info('✅ All migrations completed successfully');
    
    // Verify tables were created
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tableNames = result.rows.map(row => row.table_name);
    logger.info(`📊 Created tables: ${tableNames.join(', ')}`);
    
  } catch (error) {
    logger.error('💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.disconnect();
    logger.info('🔌 Database connection closed');
  }
}

// Run migrations
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };