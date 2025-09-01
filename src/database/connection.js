const { Pool } = require('pg');
const { logger } = require('../utils/logger');

class Database {
  constructor() {
    if (!Database.instance) {
      this.pool = null;
      Database.instance = this;
    }
    return Database.instance;
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect() {
    try {
      // Create connection pool
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'mybidfit',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test the connection
      await this.pool.query('SELECT NOW()');
      logger.info('✅ Database connected successfully');
      
      return this.pool;
    } catch (error) {
      logger.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.pool && !this.pool.ended) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database connection closed');
    }
  }

  async query(text, params) {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = { Database };