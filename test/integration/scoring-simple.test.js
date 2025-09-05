const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/server');

describe('Simple Scoring System Test', () => {
  it('should reject unauthenticated requests to scoring endpoints', async () => {
    const response = await request(app)
      .get('/api/scoring/opportunities')
      .expect(401);
    
    assert.ok(response.body.error, 'Should return error message');
    console.log('✅ Authentication required - test passed');
  });

  it('should serve the scoring routes without crashing', async () => {
    // Just verify the routes are registered and don't crash the app
    try {
      await request(app)
        .get('/api/scoring/opportunities')
        .expect(401); // Expect auth failure, not server crash
      
      console.log('✅ Scoring routes are properly registered');
    } catch (error) {
      if (error.status === 401) {
        console.log('✅ Routes work - authentication required as expected');
      } else {
        throw error;
      }
    }
  });
});