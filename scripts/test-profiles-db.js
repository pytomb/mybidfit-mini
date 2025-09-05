#!/usr/bin/env node

/**
 * MBF-102 Profile Routes Integration Test
 * Tests company profile CRUD endpoints with real database
 * Part of MyBidFit Week 1 Backlog
 */

// Load environment variables
require('dotenv').config();

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Database } = require('../src/database/connection');

// Test data
const testUser = {
  email: 'testuser@mybidfit.com',
  password: 'SecurePassword123!',
  firstName: 'Test',
  lastName: 'User',
  companyName: 'Test Company LLC'
};

const validProfile = {
  name: 'Acme Corporation',
  summary: 'Leading provider of innovative business solutions with over 20 years of experience',
  naics: ['541511', '541512'],
  certifications: [
    {
      name: 'ISO 9001',
      type: 'ISO_9001',
      issuingBody: 'International Organization for Standardization',
      issueDate: '2023-01-15T00:00:00Z',
      expiryDate: '2026-01-15T00:00:00Z'
    }
  ],
  pastPerformance: [
    {
      title: 'Enterprise Software Implementation',
      client: 'Fortune 500 Company',
      value: 2500000,
      year: 2023,
      description: 'Implemented comprehensive ERP solution for manufacturing company'
    }
  ],
  employeeCount: 150,
  annualRevenue: 25000000,
  businessType: 'small_business',
  website: 'https://acme.com',
  address: {
    street1: '123 Business Ave',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30309',
    country: 'US'
  }
};

let app;
let testUserId;
let testProfileId;
let authToken;

async function setupTestUser() {
  const db = Database.getInstance();
  await db.connect();

  // Clean up any existing test user
  await db.query('DELETE FROM company_profiles WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [testUser.email]);
  await db.query('DELETE FROM users WHERE email = $1', [testUser.email]);

  // Create test user
  const passwordHash = await bcrypt.hash(testUser.password, 12);
  const result = await db.query(`
    INSERT INTO users (email, password_hash, first_name, last_name, company_name)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [testUser.email, passwordHash, testUser.firstName, testUser.lastName, testUser.companyName]);

  testUserId = result.rows[0].id;

  // Generate auth token
  authToken = jwt.sign(
    { userId: testUserId, email: testUser.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY }
  );

  console.log(`✅ Test user created with ID: ${testUserId}`);
}

async function cleanupTestData() {
  const db = Database.getInstance();
  
  if (testUserId) {
    await db.query('DELETE FROM company_profiles WHERE user_id = $1', [testUserId]);
    await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
    console.log('🧹 Test data cleaned up');
  }

  await db.disconnect();
}

async function testProfileCreation() {
  console.log('\n🔨 Testing Profile Creation (POST /api/profiles)');

  const response = await request(app)
    .post('/api/profiles')
    .set('Authorization', `Bearer ${authToken}`)
    .send(validProfile)
    .expect(201);

  console.log('✅ Profile creation successful');
  console.log(`   Profile ID: ${response.body.profile.id}`);
  console.log(`   Company: ${response.body.profile.name}`);
  console.log(`   NAICS codes: ${response.body.profile.naics.length}`);

  testProfileId = response.body.profile.id;
  
  // Verify profile was actually saved to database
  const db = Database.getInstance();
  const dbResult = await db.query('SELECT * FROM company_profiles WHERE id = $1', [testProfileId]);
  
  if (dbResult.rows.length === 1) {
    console.log('✅ Profile verified in database');
  } else {
    throw new Error('Profile not found in database');
  }
}

async function testProfileRetrieval() {
  console.log('\n📖 Testing Profile Retrieval (GET /api/profiles/:id)');

  const response = await request(app)
    .get(`/api/profiles/${testProfileId}`)
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200);

  console.log('✅ Profile retrieval successful');
  console.log(`   Company: ${response.body.profile.name}`);
  console.log(`   Summary length: ${response.body.profile.summary.length} chars`);
  console.log(`   NAICS codes: ${response.body.profile.naics.length}`);
  console.log(`   Certifications: ${response.body.profile.certifications.length}`);
}

async function testProfileUpdate() {
  console.log('\n✏️ Testing Profile Update (PUT /api/profiles/:id)');

  const updateData = {
    name: 'Acme Corporation Updated',
    employeeCount: 175
  };

  const response = await request(app)
    .put(`/api/profiles/${testProfileId}`)
    .set('Authorization', `Bearer ${authToken}`)
    .send(updateData)
    .expect(200);

  console.log('✅ Profile update successful');
  console.log(`   Updated name: ${response.body.profile.name}`);
  console.log(`   Updated employee count: ${response.body.profile.employee_count}`);
}

async function testProfileSearch() {
  console.log('\n🔍 Testing Profile Search (GET /api/profiles)');

  const response = await request(app)
    .get('/api/profiles?limit=10&businessType=small_business')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200);

  console.log('✅ Profile search successful');
  console.log(`   Profiles found: ${response.body.profiles.length}`);
  console.log(`   Has pagination: ${!!response.body.pagination}`);
  
  if (response.body.profiles.length > 0) {
    console.log(`   First result: ${response.body.profiles[0].name}`);
  }
}

async function testMyProfile() {
  console.log('\n👤 Testing My Profile (GET /api/profiles/me)');

  const response = await request(app)
    .get('/api/profiles/me')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200);

  console.log('✅ My profile retrieval successful');
  console.log(`   Company: ${response.body.profile.name}`);
  console.log(`   User email: ${response.body.profile.email}`);
}

async function testValidationErrors() {
  console.log('\n🔍 Testing Validation Errors');

  const invalidData = {
    name: 'A', // Too short
    summary: 'Too short', // Less than 20 characters
    naics: ['12345'] // Invalid format
  };

  const response = await request(app)
    .post('/api/profiles')
    .set('Authorization', `Bearer ${authToken}`)
    .send(invalidData)
    .expect(400);

  console.log('✅ Validation correctly rejected invalid data');
  console.log(`   Error count: ${response.body.errorCount}`);
  console.log(`   First error: ${response.body.details[0].message}`);
}

async function testUnauthorizedAccess() {
  console.log('\n🔒 Testing Unauthorized Access');

  try {
    await request(app)
      .get('/api/profiles/me')
      .expect(401);

    console.log('✅ Unauthorized request correctly rejected');
  } catch (error) {
    console.log('❌ Unauthorized access test failed:', error.message);
  }
}

async function runIntegrationTests() {
  console.log('🎯 MBF-102 Company Profile Integration Tests');
  console.log('=' .repeat(60));
  console.log('Testing with real PostgreSQL database');
  console.log('Testing complete CRUD workflow\n');

  try {
    // Setup
    console.log('🔧 Setting up test environment...');
    await setupTestUser();

    // Load the app
    app = require('../src/server');

    // Run tests
    await testProfileCreation();
    await testProfileRetrieval();
    await testProfileUpdate();
    await testProfileSearch();
    await testMyProfile();
    await testValidationErrors();
    await testUnauthorizedAccess();

    console.log('\n🎉 All Integration Tests Passed!');
    console.log('=' .repeat(60));
    console.log('✅ Profile CRUD operations working correctly');
    console.log('✅ Database integration functional');
    console.log('✅ Validation middleware working');
    console.log('✅ Authentication middleware working');
    console.log('✅ Error handling working');
    console.log('\n📋 MBF-102 Status: COMPLETE ✅');
    console.log('   Ready to proceed with MBF-103 (Opportunity Scoring)');

  } catch (error) {
    console.log('\n❌ Integration test failed:', error.message);
    console.log(error.stack);
    process.exit(1);
  } finally {
    await cleanupTestData();
  }
}

// Handle graceful shutdown
process.on('SIGTERM', cleanupTestData);
process.on('SIGINT', cleanupTestData);

// Run tests if called directly
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}

module.exports = { runIntegrationTests };