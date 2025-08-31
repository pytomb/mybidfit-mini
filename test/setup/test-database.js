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
  }

  /**
   * Setup test database connection and ensure it's ready for testing
   */
  async setup() {
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
      logger.info('✅ Test database connected');

      this.isSetup = true;
    } catch (error) {
      logger.error('❌ Test database setup failed:', error);
      throw error;
    }
  }

  /**
   * Clean and reset test database to known state
   */
  async reset() {
    try {
      logger.info('🧹 Resetting test database...');

      // Clear all data in reverse dependency order
      await this.db.query('TRUNCATE TABLE judge_scores, partnership_recommendations, scoring_results, event_recommendations, opportunities, companies, users RESTART IDENTITY CASCADE');
      
      logger.info('✅ Test database reset complete');
    } catch (error) {
      logger.error('❌ Test database reset failed:', error);
      throw error;
    }
  }

  /**
   * Create test users with known properties for authentication testing
   * CRITICAL: These users test the exact property mapping that caused previous session issues
   */
  async createTestUsers() {
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
        await this.db.query(`
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
  async createTestCompanies() {
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
        await this.db.query(`
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
  async createTestOpportunities() {
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
        await this.db.query(`
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
   */
  async createFullTestData() {
    await this.reset();
    await this.createTestUsers();
    await this.createTestCompanies(); 
    await this.createTestOpportunities();
    logger.info('🎯 Full test data creation complete');
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
      if (this.isSetup) {
        await this.db.disconnect();
        this.isSetup = false;
        logger.info('🔌 Test database disconnected');
      }
    } catch (error) {
      logger.error('❌ Test database cleanup failed:', error);
      throw error;
    }
  }
}

// Export singleton instance for consistent test database management
const testDb = new TestDatabase();

module.exports = {
  TestDatabase,
  testDb
};