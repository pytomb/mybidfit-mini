#!/usr/bin/env node

const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');
const fs = require('fs');
const path = require('path');

async function runPartnerFitMigrations() {
  const db = Database.getInstance();
  
  try {
    logger.info('🚀 Starting Partner Fit database migrations...');
    
    // Connect to database
    await db.connect();
    logger.info('✅ Database connection established');
    
    // Read Partner Fit migration file
    const migrationPath = path.join(__dirname, '../src/database/migrations/002_partner_fit_feature.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Split migration into individual statements
    const statements = migration
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    logger.info(`📄 Found ${statements.length} SQL statements to execute`);
    
    // Execute migrations in transaction
    await db.transaction(async (client) => {
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        try {
          // Skip comments and empty statements
          if (statement.startsWith('--') || statement.trim() === '') {
            continue;
          }
          
          logger.info(`⏳ Executing Partner Fit migration ${i + 1}/${statements.length}`);
          await client.query(statement);
          
        } catch (error) {
          // Log error but continue for CREATE INDEX statements that might already exist
          if (error.message.includes('already exists')) {
            logger.info(`⚠️  Skipping existing object: ${statement.substring(0, 50)}...`);
            continue;
          }
          
          logger.error(`❌ Partner Fit migration ${i + 1} failed:`, statement.substring(0, 100) + '...');
          throw error;
        }
      }
    });
    
    logger.info('✅ All Partner Fit migrations completed successfully');
    
    // Verify Partner Fit tables were created
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'partner%'
      ORDER BY table_name
    `);
    
    const partnerTables = result.rows.map(row => row.table_name);
    logger.info(`🤝 Created Partner Fit tables: ${partnerTables.join(', ')}`);
    
    // Check total table count
    const allTables = await db.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    logger.info(`📊 Total database tables: ${allTables.rows[0].count}`);
    
  } catch (error) {
    logger.error('💥 Partner Fit migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.disconnect();
    logger.info('🔌 Database connection closed');
  }
}

// Run migrations
if (require.main === module) {
  runPartnerFitMigrations();
}

module.exports = { runPartnerFitMigrations };