const express = require('express');
const { Database } = require('../../src/database/connection');
const { logger } = require('../../src/utils/logger');

/**
 * TestServer - Real Express server for integration testing
 * Provides isolated server instance with real database connections
 */
class TestServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.originalDbUrl = null;
    this.testDbName = null;
  }

  /**
   * Start test server with real routes and database
   * @param {number} port - Port to listen on (0 = random available port)
   * @returns {Promise<number>} The actual port the server is listening on
   */
  async start(port = 0) {
    try {
      // Set up test environment variables
      this.setupTestEnvironment();
      
      // Set up test database
      await this.setupTestDatabase();
      
      // Configure Express middleware
      this.app.use(express.json());
      this.app.use(express.urlencoded({ extended: true }));
      
      // Add request logging for debugging
      this.app.use((req, res, next) => {
        console.log(`TEST SERVER: ${req.method} ${req.path}`);
        next();
      });

      // Mount real API routes
      this.app.use('/api/analytics', require('../../src/routes/analytics'));
      this.app.use('/api/auth', require('../../src/routes/auth'));
      this.app.use('/api/users', require('../../src/routes/users'));
      this.app.use('/api/suppliers', require('../../src/routes/suppliers'));
      this.app.use('/api/analysis', require('../../src/routes/analysis'));
      this.app.use('/api/opportunities', require('../../src/routes/opportunities'));
      this.app.use('/api/partnerFit', require('../../src/routes/partnerFit'));
      this.app.use('/api/partnerships', require('../../src/routes/partnerships'));

      // Error handling middleware
      this.app.use((err, req, res, next) => {
        console.error('TEST SERVER ERROR:', err);
        res.status(500).json({ 
          error: 'Internal server error',
          message: err.message,
          stack: process.env.NODE_ENV === 'test' ? err.stack : undefined
        });
      });

      // 404 handler
      this.app.use((req, res) => {
        res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
      });

      // Start server
      return new Promise((resolve, reject) => {
        this.server = this.app.listen(port, (err) => {
          if (err) {
            reject(err);
          } else {
            const actualPort = this.server.address().port;
            console.log(`🧪 Test server started on port ${actualPort}`);
            resolve(actualPort);
          }
        });
      });

    } catch (error) {
      console.error('Failed to start test server:', error);
      throw error;
    }
  }

  /**
   * Stop test server and cleanup resources
   */
  async stop() {
    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(() => {
            console.log('🧪 Test server stopped');
            resolve();
          });
        });
        this.server = null;
      }

      await this.cleanupTestDatabase();
    } catch (error) {
      console.error('Error stopping test server:', error);
    }
  }

  /**
   * Set up test environment variables
   */
  setupTestEnvironment() {
    // Set up JWT secret for testing
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests';
    }
    
    // Set other test environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
    
    console.log('🧪 Test environment variables configured');
  }

  /**
   * Set up isolated test database
   */
  async setupTestDatabase() {
    try {
      // Create unique test database name
      this.testDbName = `mybidfit_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store original DATABASE_URL
      this.originalDbUrl = process.env.DATABASE_URL;
      
      // For now, use same database but with test data isolation
      // In production, you'd create a separate test database
      console.log(`🧪 Setting up test database: ${this.testDbName}`);
      
      // Ensure test data exists
      await this.ensureTestData();

    } catch (error) {
      console.error('Failed to setup test database:', error);
      throw error;
    }
  }

  /**
   * Ensure test data exists for integration tests
   */
  async ensureTestData() {
    try {
      const db = Database.getInstance();
      await db.connect(); // Ensure database is connected
      
      // Check if test users exist
      const testUsers = await db.query(`
        SELECT id, email FROM users 
        WHERE email IN ('test-auth@example.com', 'test-admin@example.com')
      `);

      if (testUsers.rows.length === 0) {
        console.log('🧪 Test users not found, running test data creation...');
        
        // Run the test data creation script
        const { exec } = require('child_process');
        await new Promise((resolve, reject) => {
          exec('npm run test:data', (error, stdout, stderr) => {
            if (error) {
              console.error('Test data creation failed:', error);
              reject(error);
            } else {
              console.log('✅ Test data created successfully');
              resolve();
            }
          });
        });
      } else {
        console.log(`✅ Test data already exists (${testUsers.rows.length} test users found)`);
      }

    } catch (error) {
      console.error('Failed to ensure test data:', error);
      throw error;
    }
  }

  /**
   * Clean up test database resources
   */
  async cleanupTestDatabase() {
    try {
      // Restore original DATABASE_URL
      if (this.originalDbUrl) {
        process.env.DATABASE_URL = this.originalDbUrl;
      }

      // In a real implementation, you would drop the test database here
      // For now, we're using the same database with test data isolation
      console.log('🧪 Test database cleanup completed');

    } catch (error) {
      console.error('Failed to cleanup test database:', error);
    }
  }

  /**
   * Get the base URL for making requests to this test server
   */
  getBaseUrl() {
    if (!this.server) {
      throw new Error('Test server is not running');
    }
    const port = this.server.address().port;
    return `http://localhost:${port}`;
  }

  /**
   * Get Express app instance for advanced testing scenarios
   */
  getApp() {
    return this.app;
  }
}

module.exports = { TestServer };