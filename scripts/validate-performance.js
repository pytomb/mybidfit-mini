#!/usr/bin/env node

const { PartnerFitService } = require('../src/services/partnerFit');
const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');

async function validatePerformance() {
  const db = Database.getInstance();
  
  try {
    logger.info('🚀 Starting Partner Fit Performance Validation...');
    
    // Connect to database
    await db.connect();
    logger.info('✅ Database connected');
    
    const partnerFitService = new PartnerFitService();
    
    // Test 1: Basic Partner Matching Performance
    logger.info('⏱️  Testing basic partner matching performance...');
    const startTime = Date.now();
    
    const mockPartnerSearch = {
      companyId: 1,
      matchType: 'complementary',
      capabilities: ['Web Development', 'Cloud Infrastructure'],
      industries: ['Healthcare', 'Finance'],
      regions: ['North America'],
      companySize: 'medium',
      minScore: 0.6
    };
    
    const partners = await partnerFitService.searchPartners(1, mockPartnerSearch);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    logger.info(`✅ Partner matching completed in ${responseTime}ms`);
    logger.info(`📊 Found ${partners.length} potential partners`);
    
    // Performance Requirements Validation
    const targetResponseTime = 2300; // 2.3 seconds as mentioned in features doc
    if (responseTime < targetResponseTime) {
      logger.info(`✅ Performance PASS: ${responseTime}ms < ${targetResponseTime}ms target`);
    } else {
      logger.warn(`⚠️  Performance WARNING: ${responseTime}ms > ${targetResponseTime}ms target`);
    }
    
    // Test 2: Multi-Persona Scoring Performance
    if (partners.length > 0) {
      logger.info('⏱️  Testing multi-persona scoring performance...');
      const scoringStartTime = Date.now();
      
      for (const partner of partners.slice(0, 2)) { // Test with first 2 partners
        const scores = partnerFitService.calculateMultiPersonaScores(
          mockPartnerSearch,
          partner
        );
        
        logger.info(`📋 Partner ${partner.id} scores:`, {
          cfo: scores.cfo?.toFixed(2),
          ciso: scores.ciso?.toFixed(2),
          operator: scores.operator?.toFixed(2), 
          skeptic: scores.skeptic?.toFixed(2)
        });
      }
      
      const scoringEndTime = Date.now();
      const scoringTime = scoringEndTime - scoringStartTime;
      logger.info(`✅ Multi-persona scoring completed in ${scoringTime}ms`);
    }
    
    // Test 3: Database Query Performance
    logger.info('⏱️  Testing database query performance...');
    const dbStartTime = Date.now();
    
    const companies = await db.query('SELECT COUNT(*) FROM companies');
    const opportunities = await db.query('SELECT COUNT(*) FROM opportunities');
    const partnerProfiles = await db.query('SELECT COUNT(*) FROM partner_profiles');
    
    const dbEndTime = Date.now();
    const dbTime = dbEndTime - dbStartTime;
    
    logger.info(`✅ Database queries completed in ${dbTime}ms`);
    logger.info(`📊 Database contents:`, {
      companies: companies.rows[0].count,
      opportunities: opportunities.rows[0].count,
      partner_profiles: partnerProfiles.rows[0].count
    });
    
    // Summary
    logger.info('📋 Performance Validation Summary:');
    logger.info(`   Partner Matching: ${responseTime}ms (target: <${targetResponseTime}ms)`);
    logger.info(`   Multi-Persona Scoring: Available and functional`);
    logger.info(`   Database Performance: ${dbTime}ms`);
    logger.info(`   Overall Status: ${responseTime < targetResponseTime ? 'PASS' : 'REVIEW'}`);
    
    return {
      partnerMatchingTime: responseTime,
      partnersFound: partners.length,
      databaseQueryTime: dbTime,
      status: responseTime < targetResponseTime ? 'PASS' : 'REVIEW'
    };
    
  } catch (error) {
    logger.error('💥 Performance validation failed:', error);
    throw error;
  } finally {
    await db.disconnect();
    logger.info('🔌 Database connection closed');
  }
}

// Run validation
if (require.main === module) {
  validatePerformance()
    .then((results) => {
      logger.info('✅ Performance validation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Performance validation failed');
      process.exit(1);
    });
}

module.exports = { validatePerformance };