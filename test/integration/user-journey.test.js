const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { createTestSuite } = require('../helpers/supertest-helper');

/**
 * Complete User Journey Integration Test
 * 
 * This test demonstrates the full user flow:
 * 1. User Registration (Signup)
 * 2. User Login
 * 3. Company Profile Creation
 * 4. Opportunity Search
 * 5. Specific Opportunity Retrieval
 * 
 * This validates the complete API workflow that a real user would experience.
 */

createTestSuite('Complete User Journey Flow', (helper) => {
  let newUser;
  let authToken;
  let companyProfile;
  let userEmail;

  before(async () => {
    // Generate unique user for this test run
    const timestamp = Date.now();
    userEmail = `journey-test-${timestamp}@example.com`;
    newUser = {
      email: userEmail,
      password: 'JourneyTest123!',
      firstName: 'Journey',
      lastName: 'Tester',
      companyName: `Test Company ${timestamp}`
    };
  });

  test('Step 1: User Registration (Signup)', async () => {
    console.log('🚀 Testing user registration...');
    
    const response = await helper.testSuccessfulRequest('POST', '/api/auth/register', newUser, {
      expectedStatus: 201
    });

    // Validate registration response structure
    assert.strictEqual(response.body.success, true, 'Registration should succeed');
    assert.ok(response.body.token, 'Should receive authentication token');
    assert.ok(response.body.user, 'Should receive user data');
    assert.strictEqual(response.body.user.email, newUser.email, 'Email should match');
    assert.strictEqual(response.body.user.firstName, newUser.firstName, 'First name should match');
    assert.strictEqual(response.body.user.lastName, newUser.lastName, 'Last name should match');
    assert.strictEqual(response.body.user.companyName, newUser.companyName, 'Company name should match');

    // Store token for subsequent requests
    authToken = response.body.token;
    console.log('✅ User registration successful');
  });

  test('Step 2: User Login', async () => {
    console.log('🔐 Testing user login...');

    const loginResponse = await helper.testSuccessfulRequest('POST', '/api/auth/login', {
      email: newUser.email,
      password: newUser.password
    });

    // Validate login response
    assert.strictEqual(loginResponse.body.success, true, 'Login should succeed');
    assert.ok(loginResponse.body.token, 'Should receive authentication token');
    assert.ok(loginResponse.body.user, 'Should receive user data');
    assert.strictEqual(loginResponse.body.user.email, newUser.email, 'Email should match');

    // Verify token works by making authenticated request
    const authenticatedReq = await helper.unauthenticatedRequest();
    const profileResponse = await authenticatedReq
      .get('/api/profiles/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    // Should either return profile (200) or no profile found (404)
    assert.ok([200, 404].includes(profileResponse.status), 'Token should be valid');
    
    console.log('✅ User login successful');
  });

  test('Step 3: Company Profile Creation', async () => {
    console.log('🏢 Testing company profile creation...');

    const profileData = {
      name: `${newUser.companyName} Profile`,
      summary: 'A test company created during integration testing for government contracting opportunities',
      description: 'Full-service technology company specializing in software development and digital solutions for government clients',
      naics: ['541511', '541512'], // Computer Systems Design Services
      uei: 'TEST123456789012', // Test UEI format
      businessType: 'LLC',
      employeeCount: 25,
      annualRevenue: 2500000,
      certifications: ['8(a)', 'SDVOSB', 'WOSB'],
      capabilities: [
        'Software Development',
        'Web Development', 
        'Database Design',
        'Cloud Computing',
        'Cybersecurity'
      ],
      pastPerformance: [
        {
          project: 'Government Portal Development',
          client: 'Department of Test',
          duration: '12 months',
          value: 500000,
          description: 'Developed citizen services portal with enhanced security'
        },
        {
          project: 'Data Analytics Platform',
          client: 'Test Agency',
          duration: '8 months', 
          value: 350000,
          description: 'Built real-time data analytics platform for operational insights'
        }
      ],
      website: 'https://testcompany.com',
      linkedIn: 'https://linkedin.com/company/testcompany',
      address: {
        street: '123 Tech Street',
        city: 'Arlington',
        state: 'VA',
        zipCode: '22201'
      },
      serviceAreas: ['Virginia', 'Maryland', 'Washington DC', 'Remote'],
      keywords: ['software', 'development', 'government', 'security', 'cloud']
    };

    const authenticatedReq = await helper.unauthenticatedRequest();
    const response = await authenticatedReq
      .post('/api/profiles')
      .set('Authorization', `Bearer ${authToken}`)
      .send(profileData)
      .expect(201);

    // Validate profile creation response
    assert.strictEqual(response.body.message, 'Company profile created successfully');
    assert.ok(response.body.profile, 'Should return created profile');
    assert.strictEqual(response.body.profile.name, profileData.name);
    assert.strictEqual(response.body.profile.businessType, profileData.businessType);
    assert.strictEqual(response.body.profile.employeeCount, profileData.employeeCount);
    assert.ok(Array.isArray(response.body.profile.naics), 'NAICS should be array');
    assert.ok(Array.isArray(response.body.profile.capabilities), 'Capabilities should be array');

    companyProfile = response.body.profile;
    console.log('✅ Company profile created successfully');
  });

  test('Step 4: Verify Profile Retrieval', async () => {
    console.log('📋 Testing profile retrieval...');

    const authenticatedReq = await helper.unauthenticatedRequest();
    const response = await authenticatedReq
      .get('/api/profiles/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Validate retrieved profile matches created profile
    assert.ok(response.body.profile, 'Should return user profile');
    assert.strictEqual(response.body.profile.id, companyProfile.id);
    assert.strictEqual(response.body.profile.name, companyProfile.name);
    assert.strictEqual(response.body.profile.businessType, companyProfile.businessType);
    
    console.log('✅ Profile retrieval successful');
  });

  test('Step 5: Opportunity Search', async () => {
    console.log('🔍 Testing opportunity search...');

    const searchParams = {
      naicsCode: '541511', // Matches our profile
      setAside: 'Total_Small_Business',
      minAmount: 10000,
      maxAmount: 1000000,
      state: 'VA', // Matches our service area
      limit: 20
    };

    const authenticatedReq = await helper.unauthenticatedRequest();
    const response = await authenticatedReq
      .get('/api/opportunities')
      .query(searchParams)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Validate opportunity search response
    assert.strictEqual(response.body.success, true, 'Search should succeed');
    assert.ok(typeof response.body.count === 'number', 'Should return count');
    assert.ok(Array.isArray(response.body.opportunities), 'Should return opportunities array');
    assert.ok(response.body.searchParams, 'Should return search parameters used');
    assert.strictEqual(response.body.searchParams.naicsCode, searchParams.naicsCode);
    assert.strictEqual(response.body.searchParams.setAside, searchParams.setAside);

    console.log(`✅ Opportunity search successful - Found ${response.body.count} opportunities`);
  });

  test('Step 6: Specific Opportunity Retrieval', async () => {
    console.log('📄 Testing specific opportunity retrieval...');

    const opportunityId = 'test-opportunity-123';

    const authenticatedReq = await helper.unauthenticatedRequest();
    const response = await authenticatedReq
      .get(`/api/opportunities/${opportunityId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Validate opportunity detail response
    assert.strictEqual(response.body.success, true, 'Retrieval should succeed');
    assert.strictEqual(response.body.opportunityId, opportunityId, 'Should return correct opportunity ID');

    console.log('✅ Specific opportunity retrieval successful');
  });

  test('Step 7: Profile Update Flow', async () => {
    console.log('📝 Testing profile update...');

    const updateData = {
      summary: 'Updated summary - Company has expanded capabilities in AI and machine learning',
      capabilities: [
        'Software Development',
        'Web Development',
        'Database Design', 
        'Cloud Computing',
        'Cybersecurity',
        'Artificial Intelligence', // New capability
        'Machine Learning' // New capability
      ],
      employeeCount: 35, // Increased employee count
      keywords: ['software', 'development', 'government', 'security', 'cloud', 'ai', 'ml']
    };

    const authenticatedReq = await helper.unauthenticatedRequest();
    const response = await authenticatedReq
      .put(`/api/profiles/${companyProfile.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);

    // Validate update response
    assert.strictEqual(response.body.message, 'Company profile updated successfully');
    assert.ok(response.body.profile, 'Should return updated profile');
    assert.strictEqual(response.body.profile.summary, updateData.summary);
    assert.strictEqual(response.body.profile.employeeCount, updateData.employeeCount);
    assert.ok(response.body.profile.capabilities.includes('Artificial Intelligence'));
    assert.ok(response.body.profile.capabilities.includes('Machine Learning'));

    console.log('✅ Profile update successful');
  });

  test('Step 8: Advanced Opportunity Search with Profile Context', async () => {
    console.log('🎯 Testing advanced opportunity search matching profile...');

    // Search using profile-specific parameters
    const advancedSearchParams = {
      naicsCode: '541511', // Matches our primary NAICS
      setAside: 'Total_Small_Business',
      minAmount: 50000, // Higher minimum based on our past performance
      maxAmount: 2000000, // Within our capability range
      state: 'VA', // Our primary service area
      keywords: 'software,development', // Matches our capabilities
      limit: 10
    };

    const authenticatedReq = await helper.unauthenticatedRequest();
    const response = await authenticatedReq
      .get('/api/opportunities')
      .query(advancedSearchParams)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Validate advanced search response
    assert.strictEqual(response.body.success, true, 'Advanced search should succeed');
    assert.ok(response.body.searchParams, 'Should return search parameters');
    assert.strictEqual(response.body.searchParams.naicsCode, advancedSearchParams.naicsCode);
    assert.strictEqual(response.body.searchParams.minAmount, advancedSearchParams.minAmount);

    console.log(`✅ Advanced opportunity search successful - Found ${response.body.count} targeted opportunities`);
  });

  test('Step 9: Error Handling Validation', async () => {
    console.log('⚠️ Testing error handling in user journey...');

    const authenticatedReq = await helper.unauthenticatedRequest();

    // Test invalid opportunity search parameters
    const invalidSearchResponse = await authenticatedReq
      .get('/api/opportunities')
      .query({
        naicsCode: 'invalid-format', // Invalid NAICS format
        minAmount: 'not-a-number', // Invalid amount format
        setAside: 'InvalidSetAside' // Invalid set-aside type
      })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    assert.strictEqual(invalidSearchResponse.body.success, false);
    assert.ok(Array.isArray(invalidSearchResponse.body.errors));

    // Test accessing non-existent profile
    const nonExistentResponse = await authenticatedReq
      .get('/api/profiles/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    assert.strictEqual(nonExistentResponse.body.error, 'Company profile not found');

    console.log('✅ Error handling validation successful');
  });

  test('Step 10: Complete Journey Validation', async () => {
    console.log('🎉 Validating complete user journey...');

    // Final validation that all components are working together
    const authenticatedReq = await helper.unauthenticatedRequest();

    // Verify user still exists and is authenticated
    const finalProfileCheck = await authenticatedReq
      .get('/api/profiles/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    assert.ok(finalProfileCheck.body.profile);
    assert.ok(finalProfileCheck.body.profile.capabilities.includes('Artificial Intelligence'));

    // Verify search still works with updated profile
    const finalSearchCheck = await authenticatedReq
      .get('/api/opportunities')
      .query({ limit: 5 })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    assert.strictEqual(finalSearchCheck.body.success, true);

    console.log('✅ Complete user journey validation successful!');
    console.log('🎯 Summary: User successfully registered, logged in, created profile, searched opportunities, and updated profile');
  });

  after(async () => {
    // Cleanup: Remove test user and profile
    if (authToken) {
      try {
        const authenticatedReq = await helper.unauthenticatedRequest();
        
        // Try to delete the profile (if endpoint exists)
        await authenticatedReq
          .delete(`/api/profiles/${companyProfile?.id}`)
          .set('Authorization', `Bearer ${authToken}`);
          
        console.log('🧹 Test profile cleaned up');
      } catch (error) {
        // Cleanup errors are not critical for test success
        console.log('⚠️ Profile cleanup skipped (not critical)');
      }
    }
  });
});