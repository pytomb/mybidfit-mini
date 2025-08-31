const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { Database } = require('../../src/database/connection');

// Pilot User Flow Testing: Simulating 10 IT services sales people experience
describe('Pilot User Flow - IT Services Sales People', () => {
  let server, baseUrl, db;
  
  // Sample IT services sales person data
  const pilotUsers = [
    {
      email: 'pilot1@itservices.com',
      password: 'SecurePass123!',
      firstName: 'Sarah',
      lastName: 'Johnson',
      companyName: 'TechSolutions Inc',
      phone: '555-0101'
    },
    {
      email: 'pilot2@cloudtech.com', 
      password: 'CloudPass456!',
      firstName: 'Mike',
      lastName: 'Chen',
      companyName: 'CloudTech Services',
      phone: '555-0102'
    },
    {
      email: 'pilot3@cybersecurity.com',
      password: 'CyberSafe789!',
      firstName: 'Amanda',
      lastName: 'Rodriguez',
      companyName: 'CyberShield Solutions',
      phone: '555-0103'
    }
  ];

  // Sample IT services company profile data
  const itServicesCompanyProfile = {
    name: 'TechSolutions Inc',
    size_category: 'small',
    industries: ['technology', 'IT services', 'consulting'],
    capabilities: ['cloud migration', 'cybersecurity', 'managed services', 'network infrastructure'],
    certifications: ['AWS Certified', 'Microsoft Partner', 'CompTIA', 'CISSP'],
    headquarters_city: 'Denver',
    headquarters_state: 'CO',
    service_regions: ['Colorado', 'Wyoming', 'New Mexico', 'Remote'],
    team_size: 15,
    years_experience: 8,
    total_projects: 150,
    technologies: ['AWS', 'Microsoft Azure', 'VMware', 'Cisco', 'Fortinet']
  };

  before(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'pilot-test-secret';
    process.env.PORT = '3006';
    
    // Initialize database
    db = Database.getInstance();
    await db.connect();
    
    // Start test server
    const app = require('../../src/server.js');
    server = app.listen(3006);
    baseUrl = 'http://localhost:3006';
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  after(async () => {
    if (server) {
      server.close();
    }
    if (db) {
      // Cleanup pilot test users
      for (const user of pilotUsers) {
        try {
          await db.query('DELETE FROM users WHERE email = $1', [user.email]);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      await db.disconnect();
    }
  });

  beforeEach(async () => {
    // Ensure clean state for each test
    for (const user of pilotUsers) {
      try {
        await db.query('DELETE FROM users WHERE email = $1', [user.email]);
      } catch (e) {
        // Ignore if user doesn't exist
      }
    }
  });

  // CRITICAL TEST: Complete pilot user onboarding flow
  test('should handle complete pilot user registration and company setup', async () => {
    const testUser = pilotUsers[0]; // Sarah from TechSolutions Inc
    
    // Step 1: User Registration (IT services sales person signs up)
    const registerResponse = await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser);
    
    assert.strictEqual(registerResponse.statusCode, 201, 'Pilot user registration should succeed');
    assert.ok(registerResponse.body.message, 'Registration should return success message');
    assert.ok(registerResponse.body.user && registerResponse.body.user.id, 'Registration should return user with ID');
    assert.ok(registerResponse.body.token, 'Registration should return JWT token');
    
    // Verify user details match IT services professional
    assert.strictEqual(registerResponse.body.user.firstName, testUser.firstName, 'First name should match');
    assert.strictEqual(registerResponse.body.user.lastName, testUser.lastName, 'Last name should match');
    assert.strictEqual(registerResponse.body.user.email, testUser.email, 'Email should match');

    // Step 2: User Login (returning pilot user)
    const loginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    assert.strictEqual(loginResponse.statusCode, 200, 'Pilot user login should succeed');
    assert.ok(loginResponse.body.token, 'Login should return valid JWT token');
    
    const token = loginResponse.body.token;

    // Step 3: Access Profile (verify auth is working)
    const profileResponse = await makeRequest('GET', `${baseUrl}/api/users/profile`, null, {
      'Authorization': `Bearer ${token}`
    });

    assert.strictEqual(profileResponse.statusCode, 200, 'Profile access should work with valid token');
    assert.ok(profileResponse.body.success, 'Profile should return success');

    // Step 4: Create Company Profile (key pilot user action)
    const companyCreateResponse = await makeRequest('POST', `${baseUrl}/api/users/companies`, itServicesCompanyProfile, {
      'Authorization': `Bearer ${token}`
    });

    assert.strictEqual(companyCreateResponse.statusCode, 201, 'Company profile creation should succeed');
    assert.ok(companyCreateResponse.body.success, 'Company creation should return success');
    
    // Step 5: Verify Company Data (IT services specific validation)
    const companiesResponse = await makeRequest('GET', `${baseUrl}/api/users/companies`, null, {
      'Authorization': `Bearer ${token}`
    });

    assert.strictEqual(companiesResponse.statusCode, 200, 'Should be able to retrieve companies');
    assert.ok(companiesResponse.body.success, 'Companies retrieval should succeed');
    assert.ok(Array.isArray(companiesResponse.body.data.companies), 'Should return array of companies');
    assert.ok(companiesResponse.body.data.companies.length >= 1, 'Should have at least one company');
    
    // Find the company we just created (since GET returns ALL companies)
    const company = companiesResponse.body.data.companies.find(c => c.name === itServicesCompanyProfile.name);
    assert.ok(company, 'Should find the created company in the list');
    assert.strictEqual(company.name, itServicesCompanyProfile.name, 'Company name should match');
    assert.strictEqual(company.size_category, itServicesCompanyProfile.size_category, 'Company size should match');
    assert.ok(Array.isArray(company.industries), 'Industries should be an array');
    assert.ok(company.industries.includes('technology'), 'Should include technology industry');
  });

  // Test multiple pilot users can register simultaneously
  test('should handle multiple pilot users registering concurrently', async () => {
    const registrationPromises = pilotUsers.map(user => 
      makeRequest('POST', `${baseUrl}/api/auth/register`, user)
    );

    const registrationResponses = await Promise.all(registrationPromises);

    // All registrations should succeed
    registrationResponses.forEach((response, index) => {
      assert.strictEqual(response.statusCode, 201, `Pilot user ${index + 1} registration should succeed`);
      assert.ok(response.body.user && response.body.user.id, `Pilot user ${index + 1} should get user ID`);
      assert.ok(response.body.token, `Pilot user ${index + 1} should get JWT token`);
    });

    // Verify all users can login
    const loginPromises = pilotUsers.map(user => 
      makeRequest('POST', `${baseUrl}/api/auth/login`, {
        email: user.email,
        password: user.password
      })
    );

    const loginResponses = await Promise.all(loginPromises);

    loginResponses.forEach((response, index) => {
      assert.strictEqual(response.statusCode, 200, `Pilot user ${index + 1} login should succeed`);
      assert.ok(response.body.token, `Pilot user ${index + 1} should get valid token`);
    });
  });

  // Test IT services industry-specific data validation
  test('should properly handle IT services industry data', async () => {
    const testUser = pilotUsers[1]; // Mike from CloudTech Services
    
    // Register and get token
    await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser);
    const loginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    const token = loginResponse.body.token;

    // Create IT services company with specific industry data
    const cloudServicesCompany = {
      name: 'CloudTech Services',
      size_category: 'medium',
      industries: ['cloud computing', 'IT services', 'digital transformation'],
      capabilities: ['AWS migration', 'DevOps', 'containerization', 'monitoring'],
      certifications: ['AWS Partner', 'Kubernetes Certified', 'Docker Certified'],
      headquarters_city: 'Austin',
      headquarters_state: 'TX',
      service_regions: ['Texas', 'Oklahoma', 'Louisiana', 'Remote'],
      team_size: 45,
      years_experience: 12,
      total_projects: 300,
      technologies: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Prometheus']
    };

    const companyResponse = await makeRequest('POST', `${baseUrl}/api/users/companies`, cloudServicesCompany, {
      'Authorization': `Bearer ${token}`
    });

    assert.strictEqual(companyResponse.statusCode, 201, 'Cloud services company should be created');
    
    // Verify all IT services specific data is preserved
    const companiesResponse = await makeRequest('GET', `${baseUrl}/api/users/companies`, null, {
      'Authorization': `Bearer ${token}`
    });
    
    // Find the company we just created
    const company = companiesResponse.body.data.companies.find(c => c.name === cloudServicesCompany.name);
    assert.ok(company, 'Should find the cloud services company in the list');
    assert.strictEqual(company.size_category, 'medium', 'Company size should be preserved');
    assert.ok(Array.isArray(company.industries), 'Industries should be an array');
    assert.ok(company.industries.includes('cloud computing'), 'Cloud computing industry should be preserved');
  });

  // Test error handling for pilot users
  test('should handle pilot user registration errors gracefully', async () => {
    const testUser = pilotUsers[2]; // Amanda from CyberShield Solutions
    
    // Test missing required fields
    const incompleteUser = {
      email: testUser.email,
      password: testUser.password
      // Missing firstName and lastName
    };

    const incompleteResponse = await makeRequest('POST', `${baseUrl}/api/auth/register`, incompleteUser);
    assert.strictEqual(incompleteResponse.statusCode, 400, 'Should reject incomplete registration');
    assert.ok(incompleteResponse.body.error.includes('firstName'), 'Should specify missing firstName');

    // Test duplicate registration
    await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser); // First registration
    const duplicateResponse = await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser); // Duplicate
    
    assert.strictEqual(duplicateResponse.statusCode, 409, 'Should reject duplicate email');
    assert.ok(duplicateResponse.body.error.includes('already exists'), 'Should indicate email already exists');

    // Test login with wrong password
    const wrongPasswordResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: 'WrongPassword123!'
    });

    assert.strictEqual(wrongPasswordResponse.statusCode, 401, 'Should reject wrong password');
    assert.ok(wrongPasswordResponse.body.error.includes('Invalid'), 'Should indicate invalid credentials');
  });

  // Test pilot user session persistence  
  test('should maintain pilot user session across requests', async () => {
    const testUser = pilotUsers[0];
    
    // Register and login
    await makeRequest('POST', `${baseUrl}/api/auth/register`, testUser);
    const loginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const token = loginResponse.body.token;

    // Make multiple authenticated requests
    const requests = [
      makeRequest('GET', `${baseUrl}/api/users/profile`, null, { 'Authorization': `Bearer ${token}` }),
      makeRequest('GET', `${baseUrl}/api/users/companies`, null, { 'Authorization': `Bearer ${token}` }),
      makeRequest('GET', `${baseUrl}/api/opportunities/for-company/1`, null, { 'Authorization': `Bearer ${token}` })
    ];

    const responses = await Promise.all(requests);

    responses.forEach((response, index) => {
      assert.ok(response.statusCode < 400, `Request ${index + 1} should succeed with valid token`);
    });
  });
});

// Helper function for HTTP requests (same as auth-flow.test.js)
function makeRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const responseData = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}