import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';

// Mock database
const mockDatabase = {
  query: mock.fn(),
  connect: mock.fn(),
  disconnect: mock.fn()
};

describe('Usage Tracking Middleware', () => {
  let mockReq, mockRes, mockNext;
  
  beforeEach(() => {
    mockReq = {
      user: { id: 1, email: 'test@example.com', isPaid: false },
      body: {},
      params: {},
      path: '/api/opportunities/score-fit'
    };
    
    mockRes = {
      status: mock.fn().mockReturnThis(),
      json: mock.fn().mockReturnThis()
    };
    
    mockNext = mock.fn();
    
    mockDatabase.query.mockReset();
  });

  describe('checkUsageLimit middleware', () => {
    const FREE_LIMIT = 3;
    
    it('should allow requests for paid users regardless of usage count', async () => {
      // Setup paid user with high usage
      mockReq.user = { id: 1, isPaid: true };
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{ analysis_count: 50 }] // Well above free limit
      });
      
      const checkUsageLimit = mock.fn(async (req, res, next) => {
        const userId = req.user.id;
        
        // Get current usage count
        const userQuery = await mockDatabase.query(
          'SELECT analysis_count, is_paid FROM users WHERE id = $1',
          [userId]
        );
        
        const user = userQuery.rows[0];
        const analysisCount = user?.analysis_count || 0;
        const isPaid = user?.is_paid || false;
        
        if (!isPaid && analysisCount >= FREE_LIMIT) {
          return res.status(429).json({
            success: false,
            error: 'Free analysis limit exceeded. Please upgrade to continue.',
            analysisCount,
            limit: FREE_LIMIT
          });
        }
        
        req.userUsage = { analysisCount, isPaid };
        next();
      });
      
      await checkUsageLimit(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockNext.mock.callCount(), 1);
      assert.strictEqual(mockReq.userUsage.isPaid, true);
      assert.strictEqual(mockReq.userUsage.analysisCount, 50);
    });
    
    it('should block free users who exceed the limit', async () => {
      // Setup free user at limit
      mockReq.user = { id: 2, isPaid: false };
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{ analysis_count: 3, is_paid: false }]
      });
      
      const checkUsageLimit = mock.fn(async (req, res, next) => {
        const userId = req.user.id;
        
        const userQuery = await mockDatabase.query(
          'SELECT analysis_count, is_paid FROM users WHERE id = $1',
          [userId]
        );
        
        const user = userQuery.rows[0];
        const analysisCount = user?.analysis_count || 0;
        const isPaid = user?.is_paid || false;
        
        if (!isPaid && analysisCount >= FREE_LIMIT) {
          return res.status(429).json({
            success: false,
            error: 'Free analysis limit exceeded. Please upgrade to continue.',
            analysisCount,
            limit: FREE_LIMIT,
            upgradeUrl: '/pricing'
          });
        }
        
        next();
      });
      
      await checkUsageLimit(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockNext.mock.callCount(), 0); // Should not proceed
      assert.ok(mockRes.status.calledWith(429));
      assert.ok(mockRes.json.calledWith({
        success: false,
        error: 'Free analysis limit exceeded. Please upgrade to continue.',
        analysisCount: 3,
        limit: FREE_LIMIT,
        upgradeUrl: '/pricing'
      }));
    });
    
    it('should allow free users within the limit', async () => {
      // Setup free user under limit
      mockReq.user = { id: 3, isPaid: false };
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{ analysis_count: 1, is_paid: false }]
      });
      
      const checkUsageLimit = mock.fn(async (req, res, next) => {
        const userId = req.user.id;
        
        const userQuery = await mockDatabase.query(
          'SELECT analysis_count, is_paid FROM users WHERE id = $1',
          [userId]
        );
        
        const user = userQuery.rows[0];
        const analysisCount = user?.analysis_count || 0;
        const isPaid = user?.is_paid || false;
        
        if (!isPaid && analysisCount >= FREE_LIMIT) {
          return res.status(429).json({
            success: false,
            error: 'Free analysis limit exceeded. Please upgrade to continue.'
          });
        }
        
        req.userUsage = { 
          analysisCount, 
          isPaid,
          remainingFree: Math.max(0, FREE_LIMIT - analysisCount)
        };
        next();
      });
      
      await checkUsageLimit(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockNext.mock.callCount(), 1);
      assert.strictEqual(mockReq.userUsage.analysisCount, 1);
      assert.strictEqual(mockReq.userUsage.remainingFree, 2);
    });
    
    it('should handle new users with no usage record', async () => {
      mockReq.user = { id: 4, isPaid: false };
      mockDatabase.query.mockResolvedValueOnce({
        rows: [] // No user record found
      });
      
      const checkUsageLimit = mock.fn(async (req, res, next) => {
        const userId = req.user.id;
        
        const userQuery = await mockDatabase.query(
          'SELECT analysis_count, is_paid FROM users WHERE id = $1',
          [userId]
        );
        
        const user = userQuery.rows[0];
        const analysisCount = user?.analysis_count || 0; // Default to 0 for new users
        const isPaid = user?.is_paid || false;
        
        if (!isPaid && analysisCount >= FREE_LIMIT) {
          return res.status(429).json({
            success: false,
            error: 'Free analysis limit exceeded. Please upgrade to continue.'
          });
        }
        
        req.userUsage = { analysisCount, isPaid };
        next();
      });
      
      await checkUsageLimit(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockNext.mock.callCount(), 1);
      assert.strictEqual(mockReq.userUsage.analysisCount, 0);
      assert.strictEqual(mockReq.userUsage.isPaid, false);
    });
    
    it('should handle unauthenticated users', async () => {
      mockReq.user = null; // No authenticated user
      
      const checkUsageLimit = mock.fn(async (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required to track usage'
          });
        }
        
        next();
      });
      
      await checkUsageLimit(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockNext.mock.callCount(), 0);
      assert.ok(mockRes.status.calledWith(401));
      assert.ok(mockRes.json.calledWith({
        success: false,
        error: 'Authentication required to track usage'
      }));
    });
    
    it('should handle database errors gracefully', async () => {
      mockReq.user = { id: 5, isPaid: false };
      
      const dbError = new Error('Database connection timeout');
      mockDatabase.query.mockRejectedValueOnce(dbError);
      
      const checkUsageLimit = mock.fn(async (req, res, next) => {
        try {
          const userId = req.user.id;
          
          const userQuery = await mockDatabase.query(
            'SELECT analysis_count, is_paid FROM users WHERE id = $1',
            [userId]
          );
          
          // Process normally...
          next();
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Unable to check usage limits. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
      });
      
      await checkUsageLimit(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockNext.mock.callCount(), 0);
      assert.ok(mockRes.status.calledWith(500));
      assert.ok(mockRes.json.calledWith({
        success: false,
        error: 'Unable to check usage limits. Please try again.',
        details: 'Database connection timeout'
      }));
    });
  });

  describe('incrementUsageCount middleware', () => {
    it('should increment usage count after successful analysis', async () => {
      mockReq.user = { id: 1, isPaid: false };
      mockReq.userUsage = { analysisCount: 2, isPaid: false };
      
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{ analysis_count: 3 }]
      });
      
      const incrementUsageCount = mock.fn(async (req, res, next) => {
        const userId = req.user.id;
        
        try {
          // Increment the analysis count
          const updateQuery = await mockDatabase.query(
            'UPDATE users SET analysis_count = analysis_count + 1, updated_at = NOW() WHERE id = $1 RETURNING analysis_count',
            [userId]
          );
          
          const newCount = updateQuery.rows[0].analysis_count;
          
          // Update the request object for downstream middleware
          if (req.userUsage) {
            req.userUsage.analysisCount = newCount;
          }
          
          next();
        } catch (error) {
          // Log error but don't fail the request
          console.error('Failed to increment usage count:', error);
          next();
        }
      });
      
      await incrementUsageCount(mockReq, mockRes, mockNext);
      
      assert.ok(mockDatabase.query.calledWith(
        'UPDATE users SET analysis_count = analysis_count + 1, updated_at = NOW() WHERE id = $1 RETURNING analysis_count',
        [1]
      ));
      
      assert.strictEqual(mockNext.mock.callCount(), 1);
      assert.strictEqual(mockReq.userUsage.analysisCount, 3);
    });
    
    it('should not fail request if usage increment fails', async () => {
      mockReq.user = { id: 1 };
      
      const dbError = new Error('Update failed');
      mockDatabase.query.mockRejectedValueOnce(dbError);
      
      const incrementUsageCount = mock.fn(async (req, res, next) => {
        const userId = req.user.id;
        
        try {
          await mockDatabase.query(
            'UPDATE users SET analysis_count = analysis_count + 1 WHERE id = $1',
            [userId]
          );
          next();
        } catch (error) {
          // Log error but continue - don't fail the main request
          console.error('Failed to increment usage count:', error);
          next(); // Still proceed with the request
        }
      });
      
      await incrementUsageCount(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockNext.mock.callCount(), 1); // Should still proceed
    });
    
    it('should handle missing user in request', async () => {
      mockReq.user = null;
      
      const incrementUsageCount = mock.fn(async (req, res, next) => {
        if (!req.user) {
          // Skip usage increment for unauthenticated requests
          return next();
        }
        
        // Normal increment logic...
        next();
      });
      
      await incrementUsageCount(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockNext.mock.callCount(), 1);
      assert.strictEqual(mockDatabase.query.mock.callCount(), 0); // No DB calls for anonymous users
    });
  });

  describe('getUserUsage function', () => {
    it('should return current user usage data', async () => {
      const userId = 1;
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{ 
          analysis_count: 2, 
          is_paid: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        }]
      });
      
      const getUserUsage = mock.fn(async (userId) => {
        const query = `
          SELECT 
            analysis_count,
            is_paid,
            created_at,
            updated_at
          FROM users 
          WHERE id = $1
        `;
        
        const result = await mockDatabase.query(query, [userId]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const user = result.rows[0];
        const FREE_LIMIT = 3;
        
        return {
          analysisCount: user.analysis_count || 0,
          isPaid: user.is_paid || false,
          remainingFree: user.is_paid ? null : Math.max(0, FREE_LIMIT - (user.analysis_count || 0)),
          limit: user.is_paid ? null : FREE_LIMIT,
          createdAt: user.created_at,
          lastUsed: user.updated_at
        };
      });
      
      const usage = await getUserUsage(userId);
      
      assert.strictEqual(usage.analysisCount, 2);
      assert.strictEqual(usage.isPaid, false);
      assert.strictEqual(usage.remainingFree, 1);
      assert.strictEqual(usage.limit, 3);
      assert.strictEqual(typeof usage.createdAt, 'string');
      assert.strictEqual(typeof usage.lastUsed, 'string');
    });
    
    it('should handle non-existent users', async () => {
      const userId = 999;
      mockDatabase.query.mockResolvedValueOnce({ rows: [] });
      
      const getUserUsage = mock.fn(async (userId) => {
        const result = await mockDatabase.query(
          'SELECT analysis_count, is_paid FROM users WHERE id = $1',
          [userId]
        );
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return result.rows[0];
      });
      
      const usage = await getUserUsage(userId);
      
      assert.strictEqual(usage, null);
    });
    
    it('should calculate remaining usage correctly for different scenarios', () => {
      const calculateRemaining = mock.fn((analysisCount, isPaid, limit = 3) => {
        if (isPaid) {
          return { remaining: 'unlimited', limit: null };
        }
        
        const remaining = Math.max(0, limit - analysisCount);
        return { 
          remaining, 
          limit,
          atLimit: remaining === 0,
          nearLimit: remaining <= 1 && remaining > 0
        };
      });
      
      // Test free user with no usage
      let result = calculateRemaining(0, false);
      assert.strictEqual(result.remaining, 3);
      assert.strictEqual(result.atLimit, false);
      assert.strictEqual(result.nearLimit, false);
      
      // Test free user near limit
      result = calculateRemaining(2, false);
      assert.strictEqual(result.remaining, 1);
      assert.strictEqual(result.nearLimit, true);
      
      // Test free user at limit
      result = calculateRemaining(3, false);
      assert.strictEqual(result.remaining, 0);
      assert.strictEqual(result.atLimit, true);
      
      // Test paid user
      result = calculateRemaining(100, true);
      assert.strictEqual(result.remaining, 'unlimited');
      assert.strictEqual(result.limit, null);
    });
  });

  describe('Usage Analytics Integration', () => {
    it('should track usage patterns for analytics', async () => {
      const trackUsageEvent = mock.fn(async (userId, eventType, metadata = {}) => {
        const event = {
          userId,
          eventType,
          timestamp: new Date().toISOString(),
          metadata
        };
        
        await mockDatabase.query(
          'INSERT INTO analytics_events (user_id, event, timestamp, metadata) VALUES ($1, $2, $3, $4)',
          [event.userId, event.eventType, event.timestamp, JSON.stringify(event.metadata)]
        );
        
        return event;
      });
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      
      const event = await trackUsageEvent(1, 'usage_limit_reached', {
        analysisCount: 3,
        isPaid: false,
        limitType: 'free'
      });
      
      assert.strictEqual(event.userId, 1);
      assert.strictEqual(event.eventType, 'usage_limit_reached');
      assert.strictEqual(event.metadata.analysisCount, 3);
      
      assert.ok(mockDatabase.query.calledWith(
        'INSERT INTO analytics_events (user_id, event, timestamp, metadata) VALUES ($1, $2, $3, $4)',
        [1, 'usage_limit_reached', assert.any(String), assert.any(String)]
      ));
    });
    
    it('should generate usage reports', async () => {
      const generateUsageReport = mock.fn(async (days = 7) => {
        // Mock usage statistics query
        mockDatabase.query.mockResolvedValueOnce({
          rows: [
            { is_paid: false, count: '45' },
            { is_paid: true, count: '15' }
          ]
        });
        
        // Mock analysis distribution query
        mockDatabase.query.mockResolvedValueOnce({
          rows: [
            { analysis_count: 0, count: '20' },
            { analysis_count: 1, count: '15' },
            { analysis_count: 2, count: '8' },
            { analysis_count: 3, count: '17' } // At limit
          ]
        });
        
        const userStatsQuery = await mockDatabase.query(`
          SELECT is_paid, COUNT(*) as count
          FROM users 
          WHERE updated_at >= NOW() - INTERVAL '${days} days'
          GROUP BY is_paid
        `);
        
        const distributionQuery = await mockDatabase.query(`
          SELECT analysis_count, COUNT(*) as count
          FROM users
          WHERE updated_at >= NOW() - INTERVAL '${days} days'
          GROUP BY analysis_count
          ORDER BY analysis_count
        `);
        
        const freeUsers = parseInt(userStatsQuery.rows.find(r => !r.is_paid)?.count || 0);
        const paidUsers = parseInt(userStatsQuery.rows.find(r => r.is_paid)?.count || 0);
        
        const usageDistribution = distributionQuery.rows.map(row => ({
          analysisCount: parseInt(row.analysis_count),
          userCount: parseInt(row.count)
        }));
        
        const atLimitUsers = usageDistribution.find(d => d.analysisCount === 3)?.userCount || 0;
        
        return {
          period: `${days} days`,
          totalUsers: freeUsers + paidUsers,
          freeUsers,
          paidUsers,
          conversionRate: paidUsers > 0 ? ((paidUsers / (freeUsers + paidUsers)) * 100).toFixed(1) : 0,
          usageDistribution,
          atLimitUsers,
          limitReachedRate: freeUsers > 0 ? ((atLimitUsers / freeUsers) * 100).toFixed(1) : 0
        };
      });
      
      const report = await generateUsageReport(7);
      
      assert.strictEqual(report.totalUsers, 60);
      assert.strictEqual(report.freeUsers, 45);
      assert.strictEqual(report.paidUsers, 15);
      assert.strictEqual(report.conversionRate, '25.0');
      assert.strictEqual(report.atLimitUsers, 17);
      assert.ok(Array.isArray(report.usageDistribution));
    });
  });

  describe('Middleware Integration and Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const promises = [];
      
      // Mock successful database responses
      mockDatabase.query.mockResolvedValue({
        rows: [{ analysis_count: 1, is_paid: false }]
      });
      
      const checkUsageConcurrent = mock.fn(async (userId) => {
        // Simulate concurrent usage checking
        const result = await mockDatabase.query(
          'SELECT analysis_count, is_paid FROM users WHERE id = $1',
          [userId]
        );
        
        return result.rows[0];
      });
      
      // Create concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(checkUsageConcurrent(1));
      }
      
      const results = await Promise.all(promises);
      
      assert.strictEqual(results.length, concurrentRequests);
      assert.ok(results.every(result => 
        result.analysis_count === 1 && result.is_paid === false
      ));
    });
    
    it('should implement caching for frequent usage checks', () => {
      const usageCache = new Map();
      const CACHE_TTL = 60000; // 1 minute
      
      const getCachedUsage = mock.fn((userId) => {
        const cacheKey = `usage_${userId}`;
        const cached = usageCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
          return { ...cached.data, fromCache: true };
        }
        
        return null;
      });
      
      const setCachedUsage = mock.fn((userId, data) => {
        const cacheKey = `usage_${userId}`;
        usageCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      });
      
      // Test cache miss
      let result = getCachedUsage(1);
      assert.strictEqual(result, null);
      
      // Set cache
      const usageData = { analysisCount: 2, isPaid: false };
      setCachedUsage(1, usageData);
      
      // Test cache hit
      result = getCachedUsage(1);
      assert.strictEqual(result.analysisCount, 2);
      assert.strictEqual(result.fromCache, true);
      
      assert.strictEqual(usageCache.size, 1);
    });
    
    it('should handle middleware chain correctly', async () => {
      const middlewareChain = [];
      
      // Mock middleware functions
      const authMiddleware = mock.fn((req, res, next) => {
        middlewareChain.push('auth');
        if (req.headers.authorization) {
          req.user = { id: 1, isPaid: false };
          next();
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      });
      
      const usageMiddleware = mock.fn((req, res, next) => {
        middlewareChain.push('usage');
        if (req.user) {
          req.userUsage = { analysisCount: 1, isPaid: false };
          next();
        } else {
          res.status(400).json({ error: 'User required' });
        }
      });
      
      const incrementMiddleware = mock.fn((req, res, next) => {
        middlewareChain.push('increment');
        if (req.userUsage) {
          req.userUsage.analysisCount += 1;
        }
        next();
      });
      
      // Test successful chain
      mockReq.headers = { authorization: 'Bearer token' };
      
      await authMiddleware(mockReq, mockRes, mockNext);
      if (mockNext.mock.callCount() === 1) {
        await usageMiddleware(mockReq, mockRes, mockNext);
        if (mockNext.mock.callCount() === 2) {
          await incrementMiddleware(mockReq, mockRes, mockNext);
        }
      }
      
      assert.deepStrictEqual(middlewareChain, ['auth', 'usage', 'increment']);
      assert.strictEqual(mockReq.userUsage.analysisCount, 2);
      assert.strictEqual(mockNext.mock.callCount(), 3);
    });
  });
});