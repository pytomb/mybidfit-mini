const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');

async function createWaitlistTable() {
  const db = Database.getInstance();
  
  try {
    // Connect to database
    await db.connect();
    
    // Create waitlist table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;
    
    await db.query(createTableQuery);
    logger.info('✅ Waitlist table created successfully');
    
    // Create index on email for faster lookups
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
    `;
    
    await db.query(createIndexQuery);
    logger.info('✅ Waitlist email index created successfully');
    
    // Create updated_at trigger function if it doesn't exist
    const createTriggerFunctionQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    
    await db.query(createTriggerFunctionQuery);
    logger.info('✅ Updated timestamp trigger function created');
    
    // Create trigger for auto-updating updated_at
    const createTriggerQuery = `
      DROP TRIGGER IF EXISTS update_waitlist_updated_at ON waitlist;
      CREATE TRIGGER update_waitlist_updated_at 
        BEFORE UPDATE ON waitlist 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `;
    
    await db.query(createTriggerQuery);
    logger.info('✅ Updated timestamp trigger created');
    
    logger.info('🎉 Waitlist table setup completed successfully');
    
  } catch (error) {
    logger.error('❌ Failed to create waitlist table:', error);
    throw error;
  } finally {
    await db.disconnect();
  }
}

// Run the migration if called directly
if (require.main === module) {
  createWaitlistTable()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createWaitlistTable };