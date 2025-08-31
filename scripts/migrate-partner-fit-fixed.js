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
    
    // More careful parsing - split on semicolons that end lines
    const statements = migration
      .replace(/--.*$/gm, '') // Remove comments
      .split(/;\s*\n/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      .map(stmt => stmt.endsWith(';') ? stmt : stmt + ';'); // Ensure semicolons
    
    logger.info(`📄 Found ${statements.length} SQL statements to execute`);
    
    // Execute migrations in transaction
    await db.transaction(async (client) => {
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        try {
          // Skip empty statements
          if (!statement || statement.trim() === ';') {
            continue;
          }
          
          logger.info(`⏳ Executing Partner Fit migration ${i + 1}/${statements.length}`);
          logger.info(`📝 Statement: ${statement.substring(0, 80)}...`);
          
          await client.query(statement);
          
        } catch (error) {
          // Log error but continue for CREATE INDEX statements that might already exist
          if (error.message.includes('already exists')) {
            logger.info(`⚠️  Skipping existing object: ${statement.substring(0, 50)}...`);
            continue;
          }
          
          logger.error(`❌ Partner Fit migration ${i + 1} failed:`, statement.substring(0, 100) + '...');
          logger.error('Error details:', error.message);
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
    
    // Test partner_profiles table
    if (partnerTables.includes('partner_profiles')) {
      const columnResult = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'partner_profiles'
        ORDER BY ordinal_position
        LIMIT 5
      `);
      
      const columns = columnResult.rows.map(row => `${row.column_name}(${row.data_type})`);
      logger.info(`📋 partner_profiles columns: ${columns.join(', ')}...`);
    }
    
  } catch (error) {
    logger.error('💥 Partner Fit migration failed:', error.message);
    logger.error('Stack:', error.stack);
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