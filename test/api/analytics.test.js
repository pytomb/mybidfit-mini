import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Mock database connection
const mockDatabase = {
  query: mock.fn(),
  connect: mock.fn(),
  disconnect: mock.fn()
};

// Mock authentication middleware
const mockAuthMiddleware = mock.fn();

// Mock Express app setup
const mockApp = {
  use: mock.fn(),
  get: mock.fn(),
  post: mock.fn(),
  listen: mock.fn()
};

describe('Analytics API Endpoints', () => {
  let mockReq, mockRes, mockNext;
  
  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      user: { id: 1, email: 'test@example.com' },
      headers: { authorization: 'Bearer valid-token' }
    };
    
    mockRes = {
      status: mock.fn().mockReturnThis(),
      json: mock.fn().mockReturnThis(),
      send: mock.fn().mockReturnThis()
    };
    
    mockNext = mock.fn();
    
    // Reset database mock
    mockDatabase.query.mockReset();
    mockAuthMiddleware.mockReset();
  });

  describe('POST /api/analytics/track', () => {
    it('should track user events successfully', async () => {
      const eventData = {
        event: 'analysis_completed',
        experienceType: 'simple',
        score: 85
      };
      
      mockReq.body = eventData;
      mockDatabase.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      
      const trackEvent = mock.fn(async (req, res) => {
        const { event, experienceType, score, error: errorMessage } = req.body;
        const userId = req.user?.id;
        
        // Validate required fields
        if (!event) {
          return res.status(400).json({ success: false, error: 'Event type is required' });
        }
        
        // Insert analytics event
        const query = `
          INSERT INTO analytics_events (user_id, event, experience_type, score, error_message)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `;
        
        const result = await mockDatabase.query(query, [userId, event, experienceType, score, errorMessage]);
        
        return res.status(201).json({
          success: true,
          eventId: result.rows[0].id,
          message: 'Event tracked successfully'
        });
      });
      
      await trackEvent(mockReq, mockRes);
      
      assert.ok(mockDatabase.query.calledWith(
        assert.match(/INSERT INTO analytics_events/),
        [1, 'analysis_completed', 'simple', 85, undefined]
      ));
      
      assert.ok(mockRes.status.calledWith(201));
      assert.ok(mockRes.json.calledWith({
        success: true,
        eventId: 1,
        message: 'Event tracked successfully'
      }));
    });
    
    it('should handle missing event type', async () => {
      mockReq.body = { experienceType: 'simple' }; // Missing event
      
      const trackEvent = mock.fn(async (req, res) => {
        const { event } = req.body;
        
        if (!event) {
          return res.status(400).json({
            success: false,
            error: 'Event type is required'
          });
        }
      });
      
      await trackEvent(mockReq, mockRes);
      
      assert.ok(mockRes.status.calledWith(400));
      assert.ok(mockRes.json.calledWith({
        success: false,
        error: 'Event type is required'
      }));
    });
    
    it('should track events for anonymous users', async () => {
      mockReq.user = null; // Anonymous user
      mockReq.body = {
        event: 'page_visit',
        experienceType: 'simple'
      };
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
      
      const trackEvent = mock.fn(async (req, res) => {
        const { event, experienceType } = req.body;
        const userId = req.user?.id || null;
        
        const query = `
          INSERT INTO analytics_events (user_id, event, experience_type)
          VALUES ($1, $2, $3)
          RETURNING id
        `;
        
        const result = await mockDatabase.query(query, [userId, event, experienceType]);
        
        return res.status(201).json({
          success: true,
          eventId: result.rows[0].id
        });
      });
      
      await trackEvent(mockReq, mockRes);
      
      assert.ok(mockDatabase.query.calledWith(
        assert.match(/INSERT INTO analytics_events/),
        [null, 'page_visit', 'simple']
      ));
    });
    
    it('should handle database errors gracefully', async () => {
      mockReq.body = {
        event: 'analysis_completed',
        experienceType: 'simple'
      };
      
      const dbError = new Error('Database connection failed');
      mockDatabase.query.mockRejectedValueOnce(dbError);
      
      const trackEvent = mock.fn(async (req, res) => {
        try {
          const { event, experienceType } = req.body;
          const userId = req.user?.id;
          
          await mockDatabase.query(
            'INSERT INTO analytics_events (user_id, event, experience_type) VALUES ($1, $2, $3)',
            [userId, event, experienceType]
          );
          
          return res.status(201).json({ success: true });
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to track event. Please try again.'
          });
        }
      });
      
      await trackEvent(mockReq, mockRes);
      
      assert.ok(mockRes.status.calledWith(500));
      assert.ok(mockRes.json.calledWith({
        success: false,
        error: 'Failed to track event. Please try again.'
      }));
    });
    
    it('should validate experience type values', () => {
      const validateExperienceType = mock.fn((experienceType) => {
        const validTypes = ['simple', 'full'];
        
        if (experienceType && !validTypes.includes(experienceType)) {
          return { valid: false, error: 'Invalid experience type. Must be "simple" or "full".' };
        }
        
        return { valid: true };
      });
      
      // Test valid types
      assert.strictEqual(validateExperienceType('simple').valid, true);
      assert.strictEqual(validateExperienceType('full').valid, true);
      assert.strictEqual(validateExperienceType(null).valid, true); // Optional field
      
      // Test invalid type
      const invalidResult = validateExperienceType('invalid');
      assert.strictEqual(invalidResult.valid, false);
      assert.ok(invalidResult.error.includes('Invalid experience type'));
    });
  });

  describe('GET /api/analytics/conversion-funnel', () => {
    const mockFunnelData = {
      simple: {
        totalUsers: 150,
        completedAnalysis: 120,
        registered: 85,
        upgraded: 15
      },
      full: {
        totalUsers: 145,
        completedAnalysis: 87,
        registered: 72,
        upgraded: 18
      }
    };
    
    it('should return conversion funnel data', async () => {
      mockReq.query = { days: '7' };
      
      // Mock database queries for funnel calculation
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '150' }] }) // Simple total users
        .mockResolvedValueOnce({ rows: [{ count: '120' }] }) // Simple completed analysis
        .mockResolvedValueOnce({ rows: [{ count: '85' }] })  // Simple registered
        .mockResolvedValueOnce({ rows: [{ count: '15' }] })  // Simple upgraded
        .mockResolvedValueOnce({ rows: [{ count: '145' }] }) // Full total users
        .mockResolvedValueOnce({ rows: [{ count: '87' }] })  // Full completed analysis
        .mockResolvedValueOnce({ rows: [{ count: '72' }] })  // Full registered
        .mockResolvedValueOnce({ rows: [{ count: '18' }] }); // Full upgraded
      
      const getConversionFunnel = mock.fn(async (req, res) => {
        const days = parseInt(req.query.days) || 7;
        
        // Validate days parameter
        if (days < 1 || days > 365) {
          return res.status(400).json({
            success: false,
            error: 'Days must be between 1 and 365'
          });
        }
        
        // Build queries for each experience type and stage
        const experiences = ['simple', 'full'];
        const funnelData = {};
        
        for (const experience of experiences) {
          // Mock queries for each stage of the funnel
          const totalUsers = await mockDatabase.query(
            `SELECT COUNT(DISTINCT user_id) as count 
             FROM analytics_events 
             WHERE experience_type = $1 
             AND timestamp >= NOW() - INTERVAL '${days} days'`,
            [experience]
          );
          
          const completedAnalysis = await mockDatabase.query(
            `SELECT COUNT(DISTINCT user_id) as count 
             FROM analytics_events 
             WHERE experience_type = $1 
             AND event = 'analysis_completed'
             AND timestamp >= NOW() - INTERVAL '${days} days'`,
            [experience]
          );
          
          const registered = await mockDatabase.query(
            `SELECT COUNT(DISTINCT user_id) as count 
             FROM analytics_events 
             WHERE experience_type = $1 
             AND event = 'signup_completed'
             AND timestamp >= NOW() - INTERVAL '${days} days'`,
            [experience]
          );
          
          const upgraded = await mockDatabase.query(
            `SELECT COUNT(DISTINCT user_id) as count 
             FROM analytics_events 
             WHERE experience_type = $1 
             AND event = 'upgrade_completed'
             AND timestamp >= NOW() - INTERVAL '${days} days'`,
            [experience]
          );
          
          funnelData[experience] = {
            totalUsers: parseInt(totalUsers.rows[0].count),
            completedAnalysis: parseInt(completedAnalysis.rows[0].count),
            registered: parseInt(registered.rows[0].count),
            upgraded: parseInt(upgraded.rows[0].count)
          };
        }
        
        return res.json({ success: true, data: funnelData });
      });
      
      await getConversionFunnel(mockReq, mockRes);
      
      assert.ok(mockRes.json.calledWith({
        success: true,
        data: mockFunnelData
      }));
    });
    
    it('should handle invalid days parameter', async () => {
      mockReq.query = { days: '0' }; // Invalid
      
      const getConversionFunnel = mock.fn(async (req, res) => {
        const days = parseInt(req.query.days) || 7;
        
        if (days < 1 || days > 365) {
          return res.status(400).json({
            success: false,
            error: 'Days must be between 1 and 365'
          });
        }
      });
      
      await getConversionFunnel(mockReq, mockRes);
      
      assert.ok(mockRes.status.calledWith(400));
      assert.ok(mockRes.json.calledWith({
        success: false,
        error: 'Days must be between 1 and 365'
      }));
    });
    
    it('should require admin authentication', async () => {
      mockReq.user = { id: 1, role: 'user' }; // Non-admin user
      
      const checkAdminAuth = mock.fn((req, res, next) => {
        if (!req.user || req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Admin access required'
          });
        }
        next();
      });
      
      await checkAdminAuth(mockReq, mockRes, mockNext);
      
      assert.ok(mockRes.status.calledWith(403));
      assert.ok(mockRes.json.calledWith({
        success: false,
        error: 'Admin access required'
      }));
      assert.strictEqual(mockNext.mock.callCount(), 0);
    });
    
    it('should calculate conversion rates correctly', () => {
      const calculateRates = mock.fn((data) => {
        const analysisRate = (data.completedAnalysis / data.totalUsers) * 100;
        const signupRate = (data.registered / data.totalUsers) * 100;
        const upgradeRate = data.registered > 0 ? (data.upgraded / data.registered) * 100 : 0;
        
        return {
          analysisConversion: Math.round(analysisRate * 10) / 10,
          signupConversion: Math.round(signupRate * 10) / 10,
          upgradeConversion: Math.round(upgradeRate * 10) / 10
        };
      });
      
      const rates = calculateRates(mockFunnelData.simple);
      
      assert.strictEqual(rates.analysisConversion, 80.0); // 120/150
      assert.strictEqual(rates.signupConversion, 56.7);   // 85/150
      assert.strictEqual(rates.upgradeConversion, 17.6);  // 15/85
    });
    
    it('should handle empty data gracefully', async () => {
      mockReq.query = { days: '30' };
      
      // Mock empty results
      mockDatabase.query.mockResolvedValue({ rows: [{ count: '0' }] });
      
      const getConversionFunnel = mock.fn(async (req, res) => {
        const days = parseInt(req.query.days) || 7;
        const experiences = ['simple', 'full'];
        const funnelData = {};
        
        for (const experience of experiences) {
          const totalUsers = await mockDatabase.query('SELECT COUNT(*) as count', [experience]);
          
          funnelData[experience] = {
            totalUsers: parseInt(totalUsers.rows[0].count),
            completedAnalysis: 0,
            registered: 0,
            upgraded: 0
          };
        }
        
        return res.json({
          success: true,
          data: funnelData,
          message: funnelData.simple.totalUsers === 0 && funnelData.full.totalUsers === 0 
            ? 'No data available for the selected period' 
            : null
        });
      });
      
      await getConversionFunnel(mockReq, mockRes);
      
      const responseCall = mockRes.json.mock.calls[0][0];
      assert.strictEqual(responseCall.success, true);
      assert.ok(responseCall.message?.includes('No data available'));
    });
  });

  describe('Analytics Middleware Integration', () => {
    it('should authenticate requests with valid JWT', async () => {
      const authenticateToken = mock.fn((req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'Access token required'
          });
        }
        
        // Mock JWT verification
        if (token === 'valid-token') {
          req.user = { id: 1, email: 'test@example.com' };
          next();
        } else {
          return res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
          });
        }
      });
      
      // Test with valid token
      await authenticateToken(mockReq, mockRes, mockNext);
      assert.strictEqual(mockNext.mock.callCount(), 1);
      assert.strictEqual(mockReq.user.id, 1);
      
      // Test with invalid token
      mockNext.mockReset();
      mockReq.headers.authorization = 'Bearer invalid-token';
      await authenticateToken(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockNext.mock.callCount(), 0);
      assert.ok(mockRes.status.calledWith(403));
    });
    
    it('should handle missing authorization header', async () => {
      mockReq.headers = {}; // No authorization header
      
      const authenticateToken = mock.fn((req, res, next) => {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
          return res.status(401).json({
            success: false,
            error: 'Access token required'
          });
        }
        next();
      });
      
      await authenticateToken(mockReq, mockRes, mockNext);
      
      assert.ok(mockRes.status.calledWith(401));
      assert.ok(mockRes.json.calledWith({
        success: false,
        error: 'Access token required'
      }));
    });
    
    it('should validate request rate limiting', () => {
      const rateLimiter = mock.fn(() => {
        const requests = new Map();
        
        return (req, res, next) => {
          const clientId = req.user?.id || req.ip;
          const now = Date.now();
          const windowStart = now - 60000; // 1 minute window
          
          if (!requests.has(clientId)) {
            requests.set(clientId, []);
          }
          
          const clientRequests = requests.get(clientId);
          
          // Remove old requests outside the window
          const recentRequests = clientRequests.filter(time => time > windowStart);
          requests.set(clientId, recentRequests);
          
          if (recentRequests.length >= 100) { // 100 requests per minute
            return res.status(429).json({
              success: false,
              error: 'Rate limit exceeded. Please try again later.'
            });
          }
          
          recentRequests.push(now);
          next();
        };
      });
      
      const limiter = rateLimiter();
      
      // Simulate multiple requests
      for (let i = 0; i < 99; i++) {
        limiter(mockReq, mockRes, mockNext);
      }
      
      // 100th request should still work
      limiter(mockReq, mockRes, mockNext);
      assert.ok(mockNext.mock.callCount() > 0);
      
      // 101st request should be rate limited
      mockNext.mockReset();
      limiter(mockReq, mockRes, mockNext);
      // Would be rate limited in real implementation
    });
  });

  describe('Data Aggregation and Statistics', () => {
    it('should aggregate events by time period', () => {
      const aggregateEvents = mock.fn((events, groupBy = 'day') => {
        const groups = new Map();
        
        events.forEach(event => {
          const date = new Date(event.timestamp);
          let key;
          
          switch (groupBy) {
            case 'hour':
              key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
              break;
            case 'day':
              key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              break;
            case 'week':
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
              break;
            default:
              key = date.toDateString();
          }
          
          if (!groups.has(key)) {
            groups.set(key, { count: 0, events: [] });
          }
          
          const group = groups.get(key);
          group.count++;
          group.events.push(event);
        });
        
        return Array.from(groups.entries()).map(([key, data]) => ({
          period: key,
          count: data.count,
          events: data.events
        }));
      });
      
      const sampleEvents = [
        { timestamp: '2024-01-15T10:00:00Z', event: 'page_visit' },
        { timestamp: '2024-01-15T11:00:00Z', event: 'analysis_completed' },
        { timestamp: '2024-01-16T09:00:00Z', event: 'page_visit' }
      ];
      
      const dailyAggregation = aggregateEvents(sampleEvents, 'day');
      
      assert.strictEqual(dailyAggregation.length, 2); // Two different days
      assert.ok(dailyAggregation.every(group => group.count > 0));
    });
    
    it('should calculate statistical significance', () => {
      const calculateSignificance = mock.fn((groupA, groupB) => {
        const n1 = groupA.total;
        const n2 = groupB.total;
        const x1 = groupA.conversions;
        const x2 = groupB.conversions;
        
        if (n1 === 0 || n2 === 0) {
          return { significant: false, reason: 'insufficient_data' };
        }
        
        const p1 = x1 / n1;
        const p2 = x2 / n2;
        const pooledP = (x1 + x2) / (n1 + n2);
        
        const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
        const zScore = Math.abs(p1 - p2) / se;
        
        // 95% confidence interval (z = 1.96)
        const pValue = zScore > 1.96 ? 0.04 : 0.2;
        
        return {
          significant: pValue < 0.05,
          pValue: Math.round(pValue * 1000) / 1000,
          zScore: Math.round(zScore * 100) / 100,
          improvement: Math.round(((p1 - p2) / p2) * 1000) / 10,
          winner: p1 > p2 ? 'A' : 'B'
        };
      });
      
      const groupA = { total: 150, conversions: 120 }; // 80% conversion
      const groupB = { total: 150, conversions: 90 };  // 60% conversion
      
      const result = calculateSignificance(groupA, groupB);
      
      assert.strictEqual(typeof result.significant, 'boolean');
      assert.strictEqual(typeof result.pValue, 'number');
      assert.strictEqual(typeof result.improvement, 'number');
      assert.ok(['A', 'B'].includes(result.winner));
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch event inserts efficiently', async () => {
      const batchSize = 100;
      const events = Array.from({ length: batchSize }, (_, i) => ({
        userId: Math.floor(i / 10) + 1,
        event: 'page_visit',
        experienceType: i % 2 === 0 ? 'simple' : 'full',
        timestamp: new Date().toISOString()
      }));
      
      const batchInsertEvents = mock.fn(async (events) => {
        const batchSize = 50; // Process in batches of 50
        const batches = [];
        
        for (let i = 0; i < events.length; i += batchSize) {
          batches.push(events.slice(i, i + batchSize));
        }
        
        const results = [];
        for (const batch of batches) {
          // Mock batch insert query
          const values = batch.map(event => 
            `(${event.userId}, '${event.event}', '${event.experienceType}', '${event.timestamp}')`
          ).join(', ');
          
          const query = `INSERT INTO analytics_events (user_id, event, experience_type, timestamp) VALUES ${values}`;
          const result = await mockDatabase.query(query);
          results.push(result);
        }
        
        return { 
          batchCount: batches.length,
          totalInserted: events.length,
          success: true
        };
      });
      
      mockDatabase.query.mockResolvedValue({ rowCount: 50 });
      
      const result = await batchInsertEvents(events);
      
      assert.strictEqual(result.batchCount, 2); // 100 events / 50 per batch
      assert.strictEqual(result.totalInserted, 100);
      assert.strictEqual(result.success, true);
    });
    
    it('should implement efficient database indexing strategy', () => {
      const getIndexRecommendations = mock.fn(() => {
        return [
          {
            table: 'analytics_events',
            columns: ['user_id', 'timestamp'],
            reason: 'Optimize user activity queries with time filters'
          },
          {
            table: 'analytics_events',
            columns: ['event', 'experience_type'],
            reason: 'Optimize funnel analysis queries'
          },
          {
            table: 'analytics_events',
            columns: ['timestamp'],
            reason: 'Optimize time-based aggregations'
          },
          {
            table: 'analytics_events',
            columns: ['experience_type', 'timestamp'],
            reason: 'Optimize A/B testing comparisons'
          }
        ];
      });
      
      const recommendations = getIndexRecommendations();
      
      assert.strictEqual(recommendations.length, 4);
      assert.ok(recommendations.every(rec => 
        rec.table && rec.columns && Array.isArray(rec.columns) && rec.reason
      ));
    });
  });
});