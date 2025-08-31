#!/usr/bin/env node

const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');

async function checkSchema() {
  const db = Database.getInstance();
  
  try {
    await db.connect();
    logger.info('✅ Database connected successfully');
    
    // Check existing tables
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    logger.info(`📊 Existing tables: ${tables.join(', ') || 'None'}`);
    
    // Check if partner_profiles table exists
    const partnerProfilesExists = tables.includes('partner_profiles');
    logger.info(`🤝 Partner profiles table exists: ${partnerProfilesExists}`);
    
    // Check if core tables exist
    const coreTables = ['users', 'companies', 'opportunities'];
    coreTables.forEach(table => {
      const exists = tables.includes(table);
      logger.info(`📋 ${table} table exists: ${exists}`);
    });
    
    // If users table exists, check sample data
    if (tables.includes('users')) {
      const userCount = await db.query('SELECT COUNT(*) as count FROM users');
      logger.info(`👥 User count: ${userCount.rows[0].count}`);
    }
    
    // If companies table exists, check sample data  
    if (tables.includes('companies')) {
      const companyCount = await db.query('SELECT COUNT(*) as count FROM companies');
      logger.info(`🏢 Company count: ${companyCount.rows[0].count}`);
    }
    
  } catch (error) {
    logger.error('💥 Schema check failed:', error.message);
  } finally {
    await db.disconnect();
    logger.info('🔌 Database connection closed');
  }
}

checkSchema();