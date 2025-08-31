#!/usr/bin/env node

/**
 * Test Data Creation Script
 * Optimized for testing scenarios - creates minimal, predictable test data
 * Based on existing seed scripts but focused on test reliability
 */

const { testDb } = require('../test/setup/test-database');
const { logger } = require('../src/utils/logger');

async function createTestData() {
  try {
    logger.info('🧪 Creating test data for MyBidFit testing...');

    // Setup test database connection
    await testDb.setup();

    // Create comprehensive test data
    await testDb.createFullTestData();

    // Verify test data creation
    const verification = await verifyTestData();
    
    logger.info('✅ Test data creation completed successfully!');
    console.log('\n🎯 MyBidFit Test Data Summary:');
    console.log('===============================');
    console.log(`✅ Test Users: ${verification.users}`);
    console.log(`✅ Test Companies: ${verification.companies}`);
    console.log(`✅ Test Opportunities: ${verification.opportunities}`);
    console.log('\n🔬 Test Authentication:');
    console.log('  📧 test-auth@example.com (password: testpass123)');
    console.log('  👑 test-admin@example.com (password: testpass123)');
    console.log('  🚫 test-inactive@example.com (inactive user for testing)');
    console.log('\n🚀 Test environment ready! Run test suite with: npm test');

  } catch (error) {
    logger.error('💥 Test data creation failed:', error);
    throw error;
  } finally {
    await testDb.cleanup();
  }
}

/**
 * Verify test data was created correctly
 */
async function verifyTestData() {
  try {
    const db = testDb.db;
    
    const [usersResult, companiesResult, opportunitiesResult] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM companies'),
      db.query('SELECT COUNT(*) FROM opportunities')
    ]);

    const verification = {
      users: parseInt(usersResult.rows[0].count),
      companies: parseInt(companiesResult.rows[0].count),
      opportunities: parseInt(opportunitiesResult.rows[0].count)
    };

    // Validate critical test users exist
    const testAuthUser = await testDb.getTestUser('test-auth@example.com');
    const testAdminUser = await testDb.getTestUser('test-admin@example.com');
    const testInactiveUser = await testDb.getTestUser('test-inactive@example.com');

    if (!testAuthUser || !testAdminUser || !testInactiveUser) {
      throw new Error('Critical test users not created properly');
    }

    // Validate user properties that caused previous session issues
    if (!testAuthUser.id || testAuthUser.id === undefined) {
      throw new Error('Test user ID not set properly - this would cause auth middleware issues');
    }

    if (testInactiveUser.is_active !== false) {
      throw new Error('Inactive test user not configured properly');
    }

    logger.info('🔍 Test data verification passed - all critical data present');
    return verification;

  } catch (error) {
    logger.error('❌ Test data verification failed:', error);
    throw error;
  }
}

/**
 * Quick test data reset (for development workflow)
 */
async function resetTestData() {
  try {
    logger.info('🔄 Resetting test data...');
    await testDb.setup();
    await testDb.reset();
    logger.info('✅ Test data reset complete');
  } catch (error) {
    logger.error('❌ Test data reset failed:', error);
    throw error;
  } finally {
    await testDb.cleanup();
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2] || 'create';
  
  switch (command) {
    case 'create':
      createTestData()
        .then(() => process.exit(0))
        .catch((error) => {
          logger.error('Test data creation script failed:', error);
          process.exit(1);
        });
      break;
      
    case 'reset':
      resetTestData()
        .then(() => process.exit(0))
        .catch((error) => {
          logger.error('Test data reset script failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log('Usage:');
      console.log('  npm run test:data          # Create test data');
      console.log('  npm run test:data reset    # Reset test data');
      process.exit(1);
  }
}

module.exports = { createTestData, resetTestData };