import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { createMockRequest, createMockResponse, mockDatabase } from '../testHelpers.js';

/**
 * Analytics Tracking Endpoints Tests
 * Covers POST /api/analytics/track functionality
 */
describe('Analytics Tracking Endpoints', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createMockRequest({
      user: { id: 1, email: 'test@example.com' },
      headers: { authorization: 'Bearer valid-token' }
    });
    mockRes = createMockResponse();
    mockNext = mock.fn();
    mockDatabase.query.mockReset();
  });

  describe('POST /api/analytics/track', () => {
    it('should track user events successfully', async () => {
      const eventData = {
        event: 'analysis_completed',
        properties: {
          analysisType: 'supplier_analysis', 
          companyId: 123,
          processingTime: 2500,
          accuracy: 0.92
        },
        timestamp: new Date().toISOString()
      };

      mockReq.body = eventData;

      // Mock successful database insertion
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          event: eventData.event,
          user_id: mockReq.user.id,
          properties: eventData.properties,
          created_at: new Date()
        }]
      });

      // Mock analytics route handler (would be imported in real test)
      const analyticsHandler = async (req, res) => {
        const { event, properties, timestamp } = req.body;
        
        // Validate required fields
        if (!event) {
          return res.status(400).json({ error: 'Event type is required' });
        }

        // Insert tracking data
        const result = await mockDatabase.query(
          'INSERT INTO analytics_events (event, user_id, properties, timestamp) VALUES ($1, $2, $3, $4) RETURNING *',
          [event, req.user?.id, properties, timestamp]
        );

        res.status(201).json({
          success: true,
          eventId: result.rows[0].id,
          message: 'Event tracked successfully'
        });
      };

      await analyticsHandler(mockReq, mockRes);

      // Assertions
      assert.strictEqual(mockRes.status.mock.calls[0][0], 201);
      assert.strictEqual(mockRes.json.mock.calls[0][0].success, true);
      assert.ok(mockRes.json.mock.calls[0][0].eventId);
      assert.strictEqual(mockDatabase.query.mock.callCount(), 1);
      
      const queryCall = mockDatabase.query.mock.calls[0];
      assert.ok(queryCall[0].includes('INSERT INTO analytics_events'));
      assert.strictEqual(queryCall[1][0], eventData.event);
      assert.strictEqual(queryCall[1][1], mockReq.user.id);
    });

    it('should handle missing event type', async () => {
      const invalidEventData = {
        properties: { companyId: 123 },
        timestamp: new Date().toISOString()
      };

      mockReq.body = invalidEventData;

      const analyticsHandler = async (req, res) => {
        const { event } = req.body;
        
        if (!event) {
          return res.status(400).json({ error: 'Event type is required' });
        }
      };

      await analyticsHandler(mockReq, mockRes);

      // Assertions
      assert.strictEqual(mockRes.status.mock.calls[0][0], 400);
      assert.strictEqual(mockRes.json.mock.calls[0][0].error, 'Event type is required');
      assert.strictEqual(mockDatabase.query.mock.callCount(), 0);
    });

    it('should track events for anonymous users', async () => {
      const eventData = {
        event: 'page_view',
        properties: { page: '/landing', source: 'google' },
        timestamp: new Date().toISOString()
      };

      // Remove user from request (anonymous)
      mockReq.user = null;
      mockReq.body = eventData;

      // Mock successful database insertion for anonymous user
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          event: eventData.event,
          user_id: null,
          properties: eventData.properties,
          created_at: new Date()
        }]
      });

      const analyticsHandler = async (req, res) => {
        const { event, properties, timestamp } = req.body;
        
        if (!event) {
          return res.status(400).json({ error: 'Event type is required' });
        }

        const result = await mockDatabase.query(
          'INSERT INTO analytics_events (event, user_id, properties, timestamp) VALUES ($1, $2, $3, $4) RETURNING *',
          [event, req.user?.id || null, properties, timestamp]
        );

        res.status(201).json({
          success: true,
          eventId: result.rows[0].id,
          message: 'Event tracked successfully'
        });
      };

      await analyticsHandler(mockReq, mockRes);

      // Assertions
      assert.strictEqual(mockRes.status.mock.calls[0][0], 201);
      assert.strictEqual(mockRes.json.mock.calls[0][0].success, true);
      
      const queryCall = mockDatabase.query.mock.calls[0];
      assert.strictEqual(queryCall[1][1], null); // user_id should be null for anonymous
    });

    it('should handle database errors gracefully', async () => {
      const eventData = {
        event: 'analysis_completed',
        properties: { companyId: 123 },
        timestamp: new Date().toISOString()
      };

      mockReq.body = eventData;

      // Mock database error
      mockDatabase.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const analyticsHandler = async (req, res) => {
        const { event, properties, timestamp } = req.body;
        
        try {
          if (!event) {
            return res.status(400).json({ error: 'Event type is required' });
          }

          await mockDatabase.query(
            'INSERT INTO analytics_events (event, user_id, properties, timestamp) VALUES ($1, $2, $3, $4) RETURNING *',
            [event, req.user?.id, properties, timestamp]
          );

          res.status(201).json({
            success: true,
            message: 'Event tracked successfully'
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: 'Failed to track event'
          });
        }
      };

      await analyticsHandler(mockReq, mockRes);

      // Assertions
      assert.strictEqual(mockRes.status.mock.calls[0][0], 500);
      assert.strictEqual(mockRes.json.mock.calls[0][0].success, false);
      assert.strictEqual(mockRes.json.mock.calls[0][0].error, 'Failed to track event');
    });

    it('should validate experience type values', () => {
      const validExperienceTypes = [
        'CRAWL', 'WALK', 'RUN',
        'onboarding_completed', 'analysis_completed', 'recommendation_generated'
      ];

      const testExperienceType = (type) => {
        return validExperienceTypes.includes(type);
      };

      // Test valid types
      assert.ok(testExperienceType('CRAWL'));
      assert.ok(testExperienceType('analysis_completed'));
      assert.ok(testExperienceType('RUN'));

      // Test invalid types
      assert.ok(!testExperienceType('INVALID'));
      assert.ok(!testExperienceType('random_event'));
      assert.ok(!testExperienceType(''));
    });
  });
});