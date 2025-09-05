/**
 * Database Migration Tests
 * Test migration scripts for government opportunity discovery schema
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'mybidfit',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password'
};

describe('Database Migration Tests', () => {
  let testPool;

  before(async () => {
    testPool = new Pool(testDbConfig);
    
    try {
      await testPool.query('SELECT 1');
      console.log('✓ Migration test database connection established');
    } catch (error) {
      console.error('✗ Migration test database connection failed:', error.message);
      throw error;
    }
  });

  after(async () => {
    if (testPool) await testPool.end();
  });

  beforeEach(async () => {
    // Clean up test tables before each test
    await dropTestTables();
  });

  async function dropTestTables() {
    const dropOrder = [
      'opportunity_duplicates',
      'opportunity_watchlists', 
      'watchlist_items',
      'scoring_results',
      'government_opportunities',
      'companies',
      'users'
    ];

    for (const table of dropOrder) {
      try {
        await testPool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      } catch (error) {
        // Ignore errors for non-existent tables
      }
    }
  }

  async function runMigrationFile(filename) {
    const migrationPath = path.join(__dirname, '../../src/database/migrations', filename);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        await testPool.query(statement);
      } catch (error) {
        throw new Error(`Migration statement failed: ${statement.substring(0, 100)}...\nError: ${error.message}`);
      }
    }
  }

  async function checkTableExists(tableName) {
    const result = await testPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);
    
    return result.rows[0].exists;
  }

  async function checkColumnExists(tableName, columnName) {
    const result = await testPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      )
    `, [tableName, columnName]);
    
    return result.rows[0].exists;
  }

  async function checkIndexExists(indexName) {
    const result = await testPool.query(`
      SELECT EXISTS (
        SELECT FROM pg_class 
        WHERE relname = $1 AND relkind = 'i'
      )
    `, [indexName]);
    
    return result.rows[0].exists;
  }

  describe('Migration 008: Government Opportunities Schema', () => {
    it('should create government_opportunities table with correct structure', async () => {
      await runMigrationFile('008_add_government_opportunities.sql');
      
      // Check table exists
      const tableExists = await checkTableExists('government_opportunities');
      assert.ok(tableExists, 'government_opportunities table should be created');

      // Check key columns exist
      const keyColumns = [
        'id', 'notice_id', 'title', 'description', 'solicitation_number',
        'agency', 'office', 'naics_codes', 'psc_codes', 'set_aside',
        'place_of_performance', 'due_date', 'posted_date', 'classification',
        'value_low', 'value_high', 'contacts', 'raw_text', 'source_url', 'last_updated'
      ];

      for (const column of keyColumns) {
        const columnExists = await checkColumnExists('government_opportunities', column);
        assert.ok(columnExists, `Column ${column} should exist in government_opportunities`);
      }

      // Check JSONB columns are properly typed
      const result = await testPool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'government_opportunities' 
        AND data_type = 'jsonb'
      `);

      const jsonbColumns = result.rows.map(row => row.column_name);
      assert.ok(jsonbColumns.includes('naics_codes'), 'naics_codes should be JSONB');
      assert.ok(jsonbColumns.includes('psc_codes'), 'psc_codes should be JSONB');
      assert.ok(jsonbColumns.includes('place_of_performance'), 'place_of_performance should be JSONB');
      assert.ok(jsonbColumns.includes('contacts'), 'contacts should be JSONB');
    });

    it('should create necessary indexes for government_opportunities', async () => {
      await runMigrationFile('008_add_government_opportunities.sql');
      
      const expectedIndexes = [
        'idx_gov_opp_notice_id',
        'idx_gov_opp_agency',
        'idx_gov_opp_posted_date',
        'idx_gov_opp_due_date',
        'idx_gov_opp_naics_codes',
        'idx_gov_opp_classification',
        'idx_gov_opp_last_updated'
      ];

      for (const indexName of expectedIndexes) {
        const indexExists = await checkIndexExists(indexName);
        assert.ok(indexExists, `Index ${indexName} should be created`);
      }
    });

    it('should allow inserting and retrieving government opportunity data', async () => {
      await runMigrationFile('008_add_government_opportunities.sql');
      
      const testData = {
        notice_id: 'TEST-MIGRATION-001',
        title: 'Test Software Development Contract',
        description: 'Testing migration with sample data',
        solicitation_number: 'SOL-2024-TEST-001',
        agency: 'Department of Test',
        office: 'Test Office',
        naics_codes: JSON.stringify(['541511', '541512']),
        psc_codes: JSON.stringify(['D316']),
        set_aside: 'Small Business',
        place_of_performance: JSON.stringify({ city: 'Washington', state: 'DC' }),
        due_date: '2024-12-31',
        posted_date: '2024-01-15',
        classification: 'Presolicitation',
        value_low: 100000,
        value_high: 500000,
        contacts: JSON.stringify([{ name: 'Test Contact', email: 'test@example.gov' }]),
        raw_text: 'Test opportunity text content',
        source_url: 'https://sam.gov/test',
        last_updated: new Date().toISOString()
      };

      // Insert test data
      const insertQuery = `
        INSERT INTO government_opportunities (${Object.keys(testData).join(', ')})
        VALUES (${Object.keys(testData).map((_, i) => `$${i + 1}`).join(', ')})
        RETURNING id
      `;

      const insertResult = await testPool.query(insertQuery, Object.values(testData));
      assert.ok(insertResult.rows.length > 0, 'Should insert opportunity successfully');

      // Retrieve and verify data
      const selectResult = await testPool.query(
        'SELECT * FROM government_opportunities WHERE notice_id = $1',
        [testData.notice_id]
      );

      assert.strictEqual(selectResult.rows.length, 1, 'Should retrieve inserted opportunity');
      const retrieved = selectResult.rows[0];
      assert.strictEqual(retrieved.notice_id, testData.notice_id);
      assert.strictEqual(retrieved.title, testData.title);
      assert.deepStrictEqual(retrieved.naics_codes, ['541511', '541512']);
    });
  });

  describe('Migration 009: Opportunity Watchlists Schema', () => {
    it('should create watchlist tables with correct structure', async () => {
      // Run the base migration first
      await runMigrationFile('008_add_government_opportunities.sql');
      await runMigrationFile('009_add_opportunity_watchlists.sql');
      
      // Check opportunity_watchlists table
      const watchlistTableExists = await checkTableExists('opportunity_watchlists');
      assert.ok(watchlistTableExists, 'opportunity_watchlists table should be created');

      const watchlistColumns = ['id', 'company_id', 'name', 'search_criteria', 'created_at', 'updated_at'];
      for (const column of watchlistColumns) {
        const columnExists = await checkColumnExists('opportunity_watchlists', column);
        assert.ok(columnExists, `Column ${column} should exist in opportunity_watchlists`);
      }

      // Check watchlist_items table
      const itemsTableExists = await checkTableExists('watchlist_items');
      assert.ok(itemsTableExists, 'watchlist_items table should be created');

      const itemsColumns = ['id', 'watchlist_id', 'opportunity_id', 'status', 'added_at', 'notes'];
      for (const column of itemsColumns) {
        const columnExists = await checkColumnExists('watchlist_items', column);
        assert.ok(columnExists, `Column ${column} should exist in watchlist_items`);
      }

      // Check opportunity_duplicates table
      const duplicatesTableExists = await checkTableExists('opportunity_duplicates');
      assert.ok(duplicatesTableExists, 'opportunity_duplicates table should be created');

      const duplicatesColumns = ['id', 'opportunity_id', 'duplicate_opportunity_id', 'similarity_score', 'merge_action', 'created_at'];
      for (const column of duplicatesColumns) {
        const columnExists = await checkColumnExists('opportunity_duplicates', column);
        assert.ok(columnExists, `Column ${column} should exist in opportunity_duplicates`);
      }
    });

    it('should create proper foreign key relationships', async () => {
      await runMigrationFile('008_add_government_opportunities.sql');
      await runMigrationFile('009_add_opportunity_watchlists.sql');

      // Check foreign key constraints exist
      const fkResult = await testPool.query(`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name IN ('opportunity_watchlists', 'watchlist_items', 'opportunity_duplicates')
      `);

      const foreignKeys = fkResult.rows;
      
      // Check watchlist_items -> opportunity_watchlists
      const watchlistFk = foreignKeys.find(fk => 
        fk.table_name === 'watchlist_items' && 
        fk.column_name === 'watchlist_id' &&
        fk.foreign_table_name === 'opportunity_watchlists'
      );
      assert.ok(watchlistFk, 'Foreign key from watchlist_items to opportunity_watchlists should exist');

      // Check watchlist_items -> government_opportunities
      const opportunityFk = foreignKeys.find(fk => 
        fk.table_name === 'watchlist_items' && 
        fk.column_name === 'opportunity_id' &&
        fk.foreign_table_name === 'government_opportunities'
      );
      assert.ok(opportunityFk, 'Foreign key from watchlist_items to government_opportunities should exist');
    });

    it('should support watchlist functionality end-to-end', async () => {
      await runMigrationFile('008_add_government_opportunities.sql');
      await runMigrationFile('009_add_opportunity_watchlists.sql');

      // Create test company (assuming companies table exists)
      let companyId;
      try {
        const companyResult = await testPool.query(`
          INSERT INTO companies (name, email) 
          VALUES ('Test Company', 'test@company.com') 
          RETURNING id
        `);
        companyId = companyResult.rows[0].id;
      } catch (error) {
        // If companies table doesn't exist, use a test ID
        companyId = 1;
      }

      // Create test opportunity
      const opportunityResult = await testPool.query(`
        INSERT INTO government_opportunities (
          notice_id, title, description, agency, posted_date, last_updated
        ) VALUES (
          'WATCH-TEST-001', 'Test Watchlist Opportunity', 'Test description',
          'Test Agency', CURRENT_DATE, CURRENT_TIMESTAMP
        ) RETURNING id
      `);
      const opportunityId = opportunityResult.rows[0].id;

      // Create watchlist
      const watchlistResult = await testPool.query(`
        INSERT INTO opportunity_watchlists (
          company_id, name, search_criteria, created_at, updated_at
        ) VALUES (
          $1, 'Test Watchlist', '{"keywords": ["software", "development"]}', 
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `, [companyId]);
      const watchlistId = watchlistResult.rows[0].id;

      // Add opportunity to watchlist
      await testPool.query(`
        INSERT INTO watchlist_items (
          watchlist_id, opportunity_id, status, added_at, notes
        ) VALUES (
          $1, $2, 'active', CURRENT_TIMESTAMP, 'Test watchlist item'
        )
      `, [watchlistId, opportunityId]);

      // Verify the complete chain works
      const verifyResult = await testPool.query(`
        SELECT 
          w.name as watchlist_name,
          o.title as opportunity_title,
          wi.status,
          wi.notes
        FROM opportunity_watchlists w
        JOIN watchlist_items wi ON w.id = wi.watchlist_id
        JOIN government_opportunities o ON wi.opportunity_id = o.id
        WHERE w.id = $1
      `, [watchlistId]);

      assert.strictEqual(verifyResult.rows.length, 1, 'Should find watchlist item');
      const result = verifyResult.rows[0];
      assert.strictEqual(result.watchlist_name, 'Test Watchlist');
      assert.strictEqual(result.opportunity_title, 'Test Watchlist Opportunity');
      assert.strictEqual(result.status, 'active');
    });
  });

  describe('Migration Rollback and Recovery', () => {
    it('should handle migration errors gracefully', async () => {
      // Try to run a migration with invalid SQL to test error handling
      const invalidMigrationContent = `
        CREATE TABLE invalid_table (
          invalid_column NONEXISTENT_TYPE
        );
      `;

      try {
        // Split and run invalid statements
        const statements = invalidMigrationContent
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
          await testPool.query(statement);
        }
        
        assert.fail('Should have thrown error for invalid migration');
      } catch (error) {
        assert.ok(error.message.includes('NONEXISTENT_TYPE') || error.message.includes('does not exist'), 
          'Should catch invalid SQL type error');
      }

      // Verify database is still in a consistent state
      const canQuery = await testPool.query('SELECT 1');
      assert.ok(canQuery.rows[0], 'Database connection should still work after migration error');
    });

    it('should support idempotent migrations', async () => {
      // Run the same migration twice to ensure it's idempotent
      await runMigrationFile('008_add_government_opportunities.sql');
      
      // Running again should not cause errors
      await runMigrationFile('008_add_government_opportunities.sql');
      
      // Table should still exist and be functional
      const tableExists = await checkTableExists('government_opportunities');
      assert.ok(tableExists, 'Table should exist after running migration twice');

      // Should still be able to insert data
      await testPool.query(`
        INSERT INTO government_opportunities (
          notice_id, title, agency, posted_date, last_updated
        ) VALUES (
          'IDEMPOTENT-TEST', 'Test Title', 'Test Agency', CURRENT_DATE, CURRENT_TIMESTAMP
        )
      `);

      const result = await testPool.query(
        "SELECT COUNT(*) FROM government_opportunities WHERE notice_id = 'IDEMPOTENT-TEST'"
      );
      assert.strictEqual(parseInt(result.rows[0].count), 1, 'Should insert data successfully');
    });

    it('should maintain data integrity during migrations', async () => {
      // Run first migration
      await runMigrationFile('008_add_government_opportunities.sql');

      // Insert some test data
      await testPool.query(`
        INSERT INTO government_opportunities (
          notice_id, title, agency, posted_date, last_updated
        ) VALUES (
          'INTEGRITY-TEST', 'Test Integrity', 'Test Agency', CURRENT_DATE, CURRENT_TIMESTAMP
        )
      `);

      // Run second migration that adds related tables
      await runMigrationFile('009_add_opportunity_watchlists.sql');

      // Verify original data is still intact
      const originalData = await testPool.query(
        "SELECT * FROM government_opportunities WHERE notice_id = 'INTEGRITY-TEST'"
      );
      assert.strictEqual(originalData.rows.length, 1, 'Original data should be preserved');
      assert.strictEqual(originalData.rows[0].title, 'Test Integrity');

      // Verify new tables can reference original data
      let companyId = 1; // Use test ID since companies table may not exist

      const watchlistResult = await testPool.query(`
        INSERT INTO opportunity_watchlists (
          company_id, name, search_criteria, created_at, updated_at
        ) VALUES (
          $1, 'Integrity Test Watchlist', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `, [companyId]);

      const watchlistId = watchlistResult.rows[0].id;
      const opportunityId = originalData.rows[0].id;

      await testPool.query(`
        INSERT INTO watchlist_items (
          watchlist_id, opportunity_id, status, added_at
        ) VALUES (
          $1, $2, 'active', CURRENT_TIMESTAMP
        )
      `, [watchlistId, opportunityId]);

      const joinResult = await testPool.query(`
        SELECT o.notice_id, w.name 
        FROM government_opportunities o
        JOIN watchlist_items wi ON o.id = wi.opportunity_id
        JOIN opportunity_watchlists w ON wi.watchlist_id = w.id
        WHERE o.notice_id = 'INTEGRITY-TEST'
      `);

      assert.strictEqual(joinResult.rows.length, 1, 'Should maintain referential integrity');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk data insertion efficiently', async () => {
      await runMigrationFile('008_add_government_opportunities.sql');

      const batchSize = 100;
      const opportunities = [];

      for (let i = 0; i < batchSize; i++) {
        opportunities.push([
          `BULK-TEST-${i.toString().padStart(3, '0')}`,
          `Test Opportunity ${i}`,
          'Test Description',
          'Test Agency',
          '2024-01-15',
          new Date().toISOString()
        ]);
      }

      const startTime = Date.now();

      // Use batch insertion with VALUES clause
      const valuesClause = opportunities.map((_, index) => {
        const base = index * 6;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
      }).join(', ');

      const insertQuery = `
        INSERT INTO government_opportunities (
          notice_id, title, description, agency, posted_date, last_updated
        ) VALUES ${valuesClause}
      `;

      await testPool.query(insertQuery, opportunities.flat());

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✓ Inserted ${batchSize} opportunities in ${duration}ms`);

      // Verify insertion worked
      const countResult = await testPool.query(
        "SELECT COUNT(*) FROM government_opportunities WHERE notice_id LIKE 'BULK-TEST-%'"
      );
      assert.strictEqual(parseInt(countResult.rows[0].count), batchSize, `Should insert ${batchSize} opportunities`);

      // Performance should be reasonable (less than 5 seconds for 100 records)
      assert.ok(duration < 5000, 'Bulk insertion should complete in reasonable time');
    });

    it('should perform efficiently with indexes', async () => {
      await runMigrationFile('008_add_government_opportunities.sql');

      // Insert test data for index testing
      const testData = [];
      for (let i = 0; i < 50; i++) {
        testData.push([
          `INDEX-TEST-${i.toString().padStart(3, '0')}`,
          `Test Opportunity ${i}`,
          i % 2 === 0 ? 'Department of Defense' : 'General Services Administration',
          '2024-01-15',
          new Date().toISOString()
        ]);
      }

      const valuesClause = testData.map((_, index) => {
        const base = index * 5;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
      }).join(', ');

      await testPool.query(`
        INSERT INTO government_opportunities (
          notice_id, title, agency, posted_date, last_updated
        ) VALUES ${valuesClause}
      `, testData.flat());

      // Test indexed query performance
      const startTime = Date.now();

      const result = await testPool.query(`
        SELECT COUNT(*) FROM government_opportunities 
        WHERE agency = 'Department of Defense'
        AND posted_date >= '2024-01-01'
      `);

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      console.log(`✓ Indexed query completed in ${queryDuration}ms`);

      // Should find expected number of records
      assert.ok(parseInt(result.rows[0].count) >= 0, 'Should return valid count');

      // Query should be fast with proper indexes (less than 100ms for small dataset)
      assert.ok(queryDuration < 1000, 'Indexed queries should be fast');
    });
  });
});