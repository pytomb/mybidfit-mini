const { Database } = require('../src/database/connection');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../src/utils/logger');

async function applyMigrations() {
  try {
    console.log('🔄 Applying database migrations...');
    
    const db = Database.getInstance();
    await db.connect();
    
    // Check if migrations table exists
    const migrationTableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);
    
    if (!migrationTableExists.rows[0].exists) {
      console.log('📝 Creating migrations table...');
      await db.query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP DEFAULT NOW()
        );
      `);
    }

    // Get list of applied migrations
    const appliedMigrations = await db.query('SELECT filename FROM migrations');
    const appliedSet = new Set(appliedMigrations.rows.map(row => row.filename));
    
    // Read migration files
    const migrationsDir = path.join(__dirname, '../src/database/migrations');
    const migrationFiles = await fs.readdir(migrationsDir);
    const sqlFiles = migrationFiles.filter(file => file.endsWith('.sql')).sort();
    
    console.log(`📂 Found ${sqlFiles.length} migration files`);
    
    for (const filename of sqlFiles) {
      if (appliedSet.has(filename)) {
        console.log(`⏭️  Skipping already applied migration: ${filename}`);
        continue;
      }
      
      console.log(`🔧 Applying migration: ${filename}`);
      
      const migrationPath = path.join(migrationsDir, filename);
      const migrationSQL = await fs.readFile(migrationPath, 'utf8');
      
      // Begin transaction
      await db.query('BEGIN');
      
      try {
        // Apply the migration
        await db.query(migrationSQL);
        
        // Record the migration
        await db.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
        
        // Commit transaction
        await db.query('COMMIT');
        
        console.log(`✅ Successfully applied migration: ${filename}`);
        
      } catch (error) {
        // Rollback transaction
        await db.query('ROLLBACK');
        console.error(`❌ Failed to apply migration ${filename}:`, error.message);
        throw error;
      }
    }
    
    console.log('🎉 All migrations applied successfully!');
    
  } catch (error) {
    logger.error('Migration error:', error);
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    const db = Database.getInstance();
    await db.disconnect();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  applyMigrations();
}

module.exports = { applyMigrations };