const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { Database } = require('../src/database/connection');

describe('Database Connection', () => {
  let db;

  before(async () => {
    db = Database.getInstance();
  });

  after(async () => {
    if (db) {
      await db.disconnect();
    }
  });

  test('should create singleton database instance', () => {
    const db1 = Database.getInstance();
    const db2 = Database.getInstance();
    assert.strictEqual(db1, db2, 'Database should be singleton');
  });

  test('should connect to database', async () => {
    await assert.doesNotReject(
      async () => await db.connect(),
      'Database connection should not throw'
    );
  });

  test('should execute simple query', async () => {
    await db.connect();
    const result = await db.query('SELECT 1 as test');
    assert.strictEqual(result.rows[0].test, 1, 'Query should return expected result');
  });

  test('should handle query errors gracefully', async () => {
    await db.connect();
    await assert.rejects(
      async () => await db.query('INVALID SQL'),
      /syntax error/,
      'Invalid queries should throw syntax error'
    );
  });
});