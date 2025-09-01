const { Database } = require('../../src/database/connection');
const { logger } = require('../../src/utils/logger');
const bcrypt = require('bcrypt');

/**
 * Test Database Setup and Management
 * Provides utilities for managing test database lifecycle during testing
 */

class TestDatabase {
  constructor() {
    this.db = Database.getInstance();
    this.isSetup = false;
    this.connectionCount = 0;
  }

  /**
   * Setup test database connection and ensure it's ready for testing
   */
  async setup() {
    const startTime = Date.now();
    this.connectionCount++;
    
    if (this.isSetup) return;

    try {
      // Set test environment
      process.env.NODE_ENV = 'test';
      
      // Use test database if configured, otherwise warn
      const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
      if (!process.env.TEST_DATABASE_URL) {
        logger.warn('TEST_DATABASE_URL not set, using main DATABASE_URL for tests');
      }

      await this.db.connect();
      const connectTime = Date.now() - startTime;
      
      logger.info('✅ Test database connected', {
        duration: `${connectTime}ms`,
        connectionCount: this.connectionCount,
        databaseUrl: dbUrl ? 'configured' : 'missing'
      });

      this.isSetup = true;
    } catch (error) {
      const errorTime = Date.now() - startTime;
      logger.error('❌ Test database setup failed:', {
        error: error.message,
        duration: `${errorTime}ms`,
        connectionCount: this.connectionCount
      });
      throw error;
    }
  }

  /**
   * Clean and reset test database to known state
   */
  async reset(client) {
    const startTime = Date.now();
    const db = client || this.db;
    let recordsDeleted = 0;
    
    try {
      logger.info('🧹 Resetting test database...', {
        timestamp: new Date().toISOString(),
        connectionType: client ? 'provided' : 'default'
      });

      // Use DELETE instead of TRUNCATE to handle foreign key constraints properly
      // Delete in reverse dependency order to avoid constraint violations
      const tables = [
        'judge_scores',
        'partnership_recommendations', 
        'scoring_results',
        'event_recommendations',
        'opportunities',
        'companies',
        'users'
      ];

      for (const table of tables) {
        const result = await db.query(`DELETE FROM ${table}`);
        recordsDeleted += result.rowCount || 0;
      }
      
      // Reset sequences to start from 1
      await db.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
      await db.query('ALTER SEQUENCE companies_id_seq RESTART WITH 1');
      await db.query('ALTER SEQUENCE opportunities_id_seq RESTART WITH 1');
      
      const resetTime = Date.now() - startTime;
      
      logger.info('✅ Test database reset complete', {
        duration: `${resetTime}ms`,
        recordsDeleted,
        tablesReset: tables.length,
        sequencesReset: 3
      });
    } catch (error) {
      const errorTime = Date.now() - startTime;
      logger.error('❌ Test database reset failed:', {
        error: error.message,
        duration: `${errorTime}ms`,
        recordsDeletedBeforeError: recordsDeleted
      });
      throw error;
    }
  }

  /**
   * Create test users with known properties for authentication testing
   * CRITICAL: These users test the exact property mapping that caused previous session issues
   */
  async createTestUsers(client) {
    const db = client || this.db;
    try {
      const hashedPassword = await bcrypt.hash('testpass123', 12);

      const testUsers = [
        {
          email: 'test-auth@example.com',
          password_hash: hashedPassword,
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          company_name: 'Test Company',
          is_active: true
        },
        {
          email: 'test-admin@example.com', 
          password_hash: hashedPassword,
          role: 'admin',
          first_name: 'Admin',
          last_name: 'Test',
          company_name: 'MyBidFit',
          is_active: true
        },
        {
          email: 'test-inactive@example.com',
          password_hash: hashedPassword,
          role: 'user', 
          first_name: 'Inactive',
          last_name: 'User',
          company_name: 'Disabled Company',
          is_active: false // For testing inactive user handling
        }
      ];

      for (const user of testUsers) {
        await db.query(`
          INSERT INTO users (email, password_hash, role, first_name, last_name, company_name, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [user.email, user.password_hash, user.role, user.first_name, user.last_name, user.company_name, user.is_active]);
      }

      logger.info(`✅ Created ${testUsers.length} test users`);
      return testUsers;
    } catch (error) {
      logger.error('❌ Test user creation failed:', error);
      throw error;
    }
  }

  /**
   * Create minimal test companies for integration testing
   */
  async createTestCompanies(client) {
    const db = client || this.db;
    try {
      const testCompanies = [
        {
          name: 'Test Tech Solutions',
          description: 'Test company for integration testing',
          website: 'https://test-tech.example.com',
          size_category: 'small',
          founded_year: 2020,
          headquarters_city: 'Test City',
          headquarters_state: 'TS',
          headquarters_country: 'USA',
          service_regions: ['Test Region'],
          industries: ['software', 'testing'],
          capabilities: ['unit testing', 'integration testing'],
          technologies: ['Node.js', 'PostgreSQL'],
          certifications: ['Test Certified'],
          credibility_score: 85.0,
          total_projects: 10,
          years_experience: 3,
          team_size: 5,
          annual_revenue_category: '<1M'
        }
      ];

      for (const company of testCompanies) {
        await db.query(`
          INSERT INTO companies (
            name, description, website, size_category, founded_year,
            headquarters_city, headquarters_state, headquarters_country,
            service_regions, industries, capabilities, technologies, certifications,
            credibility_score, total_projects, years_experience, team_size, annual_revenue_category
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `, [
          company.name, company.description, company.website, company.size_category, company.founded_year,
          company.headquarters_city, company.headquarters_state, company.headquarters_country,
          company.service_regions, company.industries, company.capabilities, company.technologies, company.certifications,
          company.credibility_score, company.total_projects, company.years_experience, company.team_size, company.annual_revenue_category
        ]);
      }

      logger.info(`✅ Created ${testCompanies.length} test companies`);
    } catch (error) {
      logger.error('❌ Test company creation failed:', error);
      throw error;
    }
  }

  /**
   * Create test opportunities for matching tests
   */
  async createTestOpportunities(client) {
    const db = client || this.db;
    try {
      const testOpportunities = [
        {
          title: 'Test Software Development Project',
          description: 'Test opportunity for integration testing',
          buyer_organization: 'Test Government Agency',
          buyer_type: 'government',
          industry: 'software',
          project_value_min: 100000,
          project_value_max: 200000,
          duration_months: 6,
          location: 'Test Location',
          required_capabilities: ['unit testing', 'software development'],
          preferred_capabilities: ['integration testing'],
          required_certifications: [],
          required_experience_years: 2,
          evaluation_criteria: {
            'technical_approach': 50,
            'experience': 30,
            'cost': 20
          },
          submission_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          project_start_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          source: 'test',
          difficulty_level: 'medium',
          competition_level: 'low'
        }
      ];

      for (const opportunity of testOpportunities) {
        await db.query(`
          INSERT INTO opportunities (
            title, description, buyer_organization, buyer_type, industry,
            project_value_min, project_value_max, duration_months, location,
            required_capabilities, preferred_capabilities, required_certifications, required_experience_years,
            evaluation_criteria, submission_deadline, project_start_date, source, difficulty_level, competition_level
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `, [
          opportunity.title, opportunity.description, opportunity.buyer_organization, opportunity.buyer_type, opportunity.industry,
          opportunity.project_value_min, opportunity.project_value_max, opportunity.duration_months, opportunity.location,
          opportunity.required_capabilities, opportunity.preferred_capabilities, opportunity.required_certifications, opportunity.required_experience_years,
          JSON.stringify(opportunity.evaluation_criteria), opportunity.submission_deadline, opportunity.project_start_date,
          opportunity.source, opportunity.difficulty_level, opportunity.competition_level
        ]);
      }

      logger.info(`✅ Created ${testOpportunities.length} test opportunities`);
    } catch (error) {
      logger.error('❌ Test opportunity creation failed:', error);
      throw error;
    }
  }

  /**
   * Full test data setup - creates all necessary test data
   * This method is now concurrency-safe using a global advisory lock.
   */
  async createFullTestData() {
    const client = await this.db.pool.connect();
    try {
      // Acquire a unique lock for the duration of the setup.
      // The number (12345) is arbitrary and just needs to be consistent.
      await client.query('SELECT pg_advisory_lock(12345)');
      logger.info('🔑 Acquired global test setup lock.');

      // After acquiring the lock, check if setup has already been done by another process.
      const { rows } = await client.query("SELECT 1 FROM users WHERE email = 'test-auth@example.com'");
      
      if (rows.length === 0) {
        logger.info('🚀 No test data found. Running global setup for the first time...');
        // Pass the locked client to all setup methods to ensure they run in the same transaction.
        await this.reset(client);
        await this.createTestUsers(client);
        await this.createTestCompanies(client);
        await this.createTestOpportunities(client);
        logger.info('🎯 Full test data creation complete');
      } else {
        logger.info('☑️ Test data already exists. Skipping global setup.');
      }
    } catch (error) {
      logger.error('❌ Global test setup failed:', error);
      throw error;
    } finally {
      // ALWAYS release the lock and the client.
      await client.query('SELECT pg_advisory_unlock(12345)');
      client.release();
      logger.info('🔑 Released global test setup lock.');
    }
  }

  /**
   * Get a test user by email for authentication testing
   */
  async getTestUser(email) {
    try {
      const result = await this.db.query(
        'SELECT id, email, first_name, last_name, company_name, role, is_active FROM users WHERE email = $1',
        [email]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('❌ Failed to get test user:', error);
      throw error;
    }
  }

  /**
   * Cleanup and disconnect from test database
   */
  async cleanup() {
    try {
      this.connectionCount--;
      
      // Only disconnect when all tests are done
      if (this.isSetup && this.connectionCount <= 0) {
        await this.db.disconnect();
        this.isSetup = false;
        this.connectionCount = 0;
        logger.info('🔌 Test database disconnected');
      }
    } catch (error) {
      logger.error('❌ Test database cleanup failed:', error);
      // Don't throw error during cleanup to prevent masking test failures
      logger.error('Database cleanup error:', error);
    }
  }
}

// Export singleton instance for consistent test database management
const testDb = new TestDatabase();

module.exports = {
  TestDatabase,
  testDb
};