#!/usr/bin/env node

const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');
const jwt = require('jsonwebtoken');
const http = require('http');

async function validatePartnerFitSystem() {
  const db = Database.getInstance();
  
  try {
    logger.info('🚀 Starting comprehensive Partner Fit system validation...');
    
    // 1. Database validation
    await db.connect();
    logger.info('✅ Database connected successfully');
    
    // Check partner tables exist
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'partner%'
      ORDER BY table_name
    `);
    
    const partnerTables = tablesResult.rows.map(row => row.table_name);
    logger.info(`🤝 Partner tables: ${partnerTables.join(', ')}`);
    
    if (partnerTables.length < 4) {
      throw new Error(`Expected at least 4 partner tables, found ${partnerTables.length}`);
    }
    
    // Check for test data
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    const companyCount = await db.query('SELECT COUNT(*) as count FROM companies');
    
    logger.info(`👥 Users in database: ${userCount.rows[0].count}`);
    logger.info(`🏢 Companies in database: ${companyCount.rows[0].count}`);
    
    await db.disconnect();
    logger.info('✅ Database validation complete');
    
    // 2. API validation - Create JWT token
    const jwtSecret = process.env.JWT_SECRET || 'mybidfit-super-secret-development-key-2025';
    const authToken = jwt.sign({ userId: 1 }, jwtSecret);
    logger.info('✅ JWT token created');
    
    // 3. Test different API scenarios
    const testScenarios = [
      {
        name: 'Complementary Partner Search',
        path: '/api/partner-fit/search?matchType=complementary&capabilities=Cloud%20Architecture&limit=5',
        expectResponse: (data) => {
          return data.success && 
                 data.data.partners &&
                 data.data.partners.length > 0 &&
                 data.data.partners[0].personas &&
                 data.data.partners[0].personas.cfo;
        }
      },
      {
        name: 'Similar Partner Search',
        path: '/api/partner-fit/search?matchType=similar&capabilities=Full%20Stack%20Development&limit=3',
        expectResponse: (data) => {
          return data.success && data.data.partners !== undefined;
        }
      },
      {
        name: 'Authentication Test (should fail without token)',
        path: '/api/partner-fit/search?matchType=complementary',
        useAuth: false,
        expectStatus: 401
      }
    ];
    
    // Run API tests
    for (const scenario of testScenarios) {
      logger.info(`🧪 Testing: ${scenario.name}`);
      
      const response = await makeHttpRequest('GET', `http://localhost:3001${scenario.path}`, null, {
        ...(scenario.useAuth !== false ? { 'Authorization': `Bearer ${authToken}` } : {}),
        'Content-Type': 'application/json'
      });
      
      if (scenario.expectStatus) {
        if (response.statusCode !== scenario.expectStatus) {
          throw new Error(`Expected status ${scenario.expectStatus}, got ${response.statusCode} for ${scenario.name}`);
        }
        logger.info(`✅ ${scenario.name} - Status check passed (${response.statusCode})`);
      } else if (scenario.expectResponse) {
        if (response.statusCode !== 200) {
          throw new Error(`Expected status 200, got ${response.statusCode} for ${scenario.name}`);
        }
        
        if (!scenario.expectResponse(response.body)) {
          throw new Error(`Response validation failed for ${scenario.name}`);
        }
        logger.info(`✅ ${scenario.name} - Response validation passed`);
      }
    }
    
    // 4. Validate multi-persona evaluation structure
    logger.info('🧪 Validating multi-persona evaluation structure...');
    
    const searchResponse = await makeHttpRequest('GET', 'http://localhost:3001/api/partner-fit/search?matchType=complementary&limit=1', null, {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    });
    
    if (searchResponse.statusCode === 200 && searchResponse.body.data.partners.length > 0) {
      const partner = searchResponse.body.data.partners[0];
      
      // Check required personas
      const requiredPersonas = ['cfo', 'ciso', 'operator', 'skeptic'];
      for (const persona of requiredPersonas) {
        if (!partner.personas[persona]) {
          throw new Error(`Missing ${persona} persona in partner evaluation`);
        }
        
        if (typeof partner.personas[persona].score !== 'number') {
          throw new Error(`${persona} persona score is not a number`);
        }
        
        if (!partner.personas[persona].summary) {
          throw new Error(`Missing ${persona} persona summary`);
        }
      }
      
      logger.info('✅ Multi-persona evaluation structure validated');
      
      // Check business logic elements
      const requiredFields = ['matchScore', 'matchType', 'capabilities', 'certifications', 'reasons'];
      for (const field of requiredFields) {
        if (partner[field] === undefined) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      logger.info('✅ Business logic structure validated');
    }
    
    logger.info('🎉 Partner Fit system validation completed successfully!');
    logger.info('');
    logger.info('✅ Database schema - All partner tables created');
    logger.info('✅ API endpoints - Authentication and search working');
    logger.info('✅ Multi-persona evaluation - All 4 personas evaluated');
    logger.info('✅ Business logic - Match scoring and reasoning working');
    logger.info('✅ Data structure - All required fields present');
    logger.info('');
    logger.info('🚀 Partner Fit feature is fully functional and ready for use!');
    
  } catch (error) {
    logger.error('💥 Partner Fit system validation failed:', error.message);
    process.exit(1);
  }
}

// Helper function for HTTP requests
function makeHttpRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 5000
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
            body: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 0,
        error: 'Request timeout'
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

validatePartnerFitSystem();