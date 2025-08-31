const { Database } = require('../../src/database/connection');
const { logger } = require('../../src/utils/logger');

/**
 * Shared Test Server Management
 * Provides centralized server lifecycle management for testing
 */

class TestServer {
  constructor() {
    this.server = null;
    this.db = null;
    this.isSetup = false;
    this.port = null;
  }

  /**
   * Setup test server with proper database connection
   */
  async setup() {
    if (this.isSetup) {
      logger.info('Test server already running, reusing existing instance');
      return this.port;
    }

    try {
      // Set test environment
      process.env.NODE_ENV = 'test';
      
      // Find available port for test server (start from higher range to avoid conflicts)
      const testPort = await this.findAvailablePort(3100 + Math.floor(Math.random() * 100));
      process.env.PORT = testPort.toString();
      process.env.JWT_SECRET = 'test-integration-secret';
      
      // Initialize database connection
      this.db = Database.getInstance();
      await this.db.connect();
      logger.info('✅ Test database connected');

      // Import and setup app after environment is configured
      const app = require('../../src/server');
      
      // Start server
      this.server = app.listen(testPort, () => {
        logger.info(`🚀 Test server running on port ${testPort}`);
      });
      
      this.port = testPort;
      this.isSetup = true;
      
      return testPort;
    } catch (error) {
      logger.error('❌ Test server setup failed:', error);
      throw error;
    }
  }

  /**
   * Get the server instance for supertest
   */
  getApp() {
    if (!this.isSetup) {
      throw new Error('Test server not setup. Call setup() first.');
    }
    return require('../../src/server');
  }

  /**
   * Get the server port
   */
  getPort() {
    return this.port;
  }

  /**
   * Get base URL for API calls
   */
  getBaseUrl() {
    return `http://localhost:${this.port}`;
  }

  /**
   * Clean shutdown of test server
   */
  async cleanup() {
    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(() => {
            logger.info('🔌 Test server closed');
            resolve();
          });
        });
        this.server = null;
      }

      if (this.db) {
        await this.db.disconnect();
        logger.info('🔌 Test database disconnected');
        this.db = null;
      }

      this.isSetup = false;
      this.port = null;
    } catch (error) {
      logger.error('❌ Test server cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Helper function to find available port
   */
  async findAvailablePort(startPort) {
    const net = require('net');
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(startPort, () => {
        const port = server.address().port;
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        resolve(this.findAvailablePort(startPort + 1));
      });
    });
  }
}

// Export singleton instance for consistent test server management
const testServer = new TestServer();

module.exports = {
  TestServer,
  testServer
};