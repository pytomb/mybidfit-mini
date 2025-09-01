const { test } = require('node:test');
const assert = require('node:assert');

const { RelationshipIntelligenceService } = require('../../src/services/relationshipIntelligence');

// Top-level suite for Relationship Intelligence Service
test('Relationship Intelligence Service', async (t) => {
  let relationshipService;
  
  // Create a mock pool object that the service can use
  const mockPool = {
    query: async (query, params) => {
      // Return mock data based on the query - check people first since people queries also contain organization references
      if (query.includes('atlanta_people')) {
        return { rows: [{ id: 1, first_name: 'John', last_name: 'Doe' }] };
      }
      if (query.includes('atlanta_organizations')) {
        return { rows: [{ id: 1, name: 'Test Corporation' }] };
      }
      // Return empty for any other query
      return { rows: [] };
    }
  };

  t.beforeEach(() => {
    // Inject the mock pool into the service constructor
    relationshipService = new RelationshipIntelligenceService(mockPool);
  });

  await t.test('should retrieve organizations', async () => {
    const organizations = await relationshipService.getOrganizations({});
    assert.ok(Array.isArray(organizations));
    assert.strictEqual(organizations.length, 1);
    assert.strictEqual(organizations[0].name, 'Test Corporation');
  });

  await t.test('should retrieve people', async () => {
    const people = await relationshipService.getPeople({});
    assert.ok(Array.isArray(people));
    assert.strictEqual(people.length, 1);
    assert.strictEqual(people[0].first_name, 'John');
  });

  await t.test('should handle empty results', async () => {
    // Store original query method
    const originalQuery = mockPool.query;
    
    // Override the query method for this specific test
    mockPool.query = async () => ({ rows: [] });
    const organizations = await relationshipService.getOrganizations({});
    assert.ok(Array.isArray(organizations));
    assert.strictEqual(organizations.length, 0);
    
    // Restore original query method
    mockPool.query = originalQuery;
  });

  await t.test('should handle database errors', async () => {
    // Store original query method
    const originalQuery = mockPool.query;
    
    // Override the query method for this specific test
    mockPool.query = async () => Promise.reject(new Error('DB Error'));
    await assert.rejects(relationshipService.getOrganizations({}), { message: 'DB Error' });
    
    // Restore original query method
    mockPool.query = originalQuery;
  });
});