#!/usr/bin/env node

const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');
const fs = require('fs');
const path = require('path');

async function runCoreMigrations() {
  const db = Database.getInstance();
  
  try {
    logger.info('🚀 Starting core database migrations...');
    
    // Connect to database
    await db.connect();
    logger.info('✅ Database connection established');
    
    // Read and modify schema to remove problematic DROP statements
    const schemaPath = path.join(__dirname, '../src/database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove DROP statements and split into statements
    const cleanedSchema = schema
      .replace(/DROP TABLE.*CASCADE;/g, '') // Remove DROP statements
      .replace(/-- Drop existing tables.*\n/g, '') // Remove drop comments
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    logger.info(`📄 Found ${cleanedSchema.length} SQL statements to execute`);
    
    // Execute migrations in transaction
    await db.transaction(async (client) => {
      for (let i = 0; i < cleanedSchema.length; i++) {
        const statement = cleanedSchema[i];
        
        try {
          // Skip comments and empty statements
          if (statement.startsWith('--') || statement.trim() === '') {
            continue;
          }
          
          logger.info(`⏳ Executing migration ${i + 1}/${cleanedSchema.length}`);
          await client.query(statement);
          
        } catch (error) {
          // Log error but continue for CREATE INDEX statements that might already exist
          if (error.message.includes('already exists')) {
            logger.info(`⚠️  Skipping existing object: ${statement.substring(0, 50)}...`);
            continue;
          }
          
          logger.error(`❌ Migration ${i + 1} failed:`, statement.substring(0, 100) + '...');
          throw error;
        }
      }
    });
    
    logger.info('✅ All core migrations completed successfully');
    
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
    logger.error('💥 Core migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.disconnect();
    logger.info('🔌 Database connection closed');
  }
}

// Run migrations
if (require.main === module) {
  runCoreMigrations();
}

module.exports = { runCoreMigrations };