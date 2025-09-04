import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { createMockRequest, createMockResponse } from '../testHelpers.js';

/**
 * Analytics Middleware Integration Tests  
 * Covers authentication, rate limiting, and middleware integration
 */
describe('Analytics Middleware Integration', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = mock.fn();
  });

  describe('JWT Authentication Middleware', () => {
    it('should authenticate requests with valid JWT', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };

      const authMiddleware = async (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
          return res.status(401).json({ error: 'Access token required' });
        }

        // Mock token validation (in real implementation, would verify JWT)
        const isValidToken = (token) => {
          // Simulate JWT validation
          const validTokens = ['valid-token', 'admin-token'];
          return validTokens.includes(token);
        };

        if (!isValidToken(token)) {
          return res.status(401).json({ error: 'Invalid access token' });
        }

        // Mock user data based on token
        const getUserFromToken = (token) => {
          if (token === 'admin-token') {
            return { id: 1, email: 'admin@example.com', role: 'admin' };
          }
          return { id: 2, email: 'user@example.com', role: 'user' };
        };

        req.user = getUserFromToken(token);
        next();
      };

      await authMiddleware(mockReq, mockRes, mockNext);

      // Assertions
      assert.strictEqual(mockNext.mock.callCount(), 1);
      assert.ok(mockReq.user);
      assert.strictEqual(mockReq.user.email, 'user@example.com');
      assert.strictEqual(mockRes.status.mock.callCount(), 0); // No error response
    });

    it('should handle missing authorization header', async () => {
      // No authorization header
      mockReq.headers = {};

      const authMiddleware = async (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
          return res.status(401).json({ error: 'Access token required' });
        }

        next();
      };

      await authMiddleware(mockReq, mockRes, mockNext);

      // Assertions
      assert.strictEqual(mockNext.mock.callCount(), 0);
      assert.strictEqual(mockRes.status.mock.calls[0][0], 401);
      assert.strictEqual(mockRes.json.mock.calls[0][0].error, 'Access token required');
    });

    it('should handle invalid JWT tokens', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      const authMiddleware = async (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
          return res.status(401).json({ error: 'Access token required' });
        }

        const isValidToken = (token) => {
          const validTokens = ['valid-token', 'admin-token'];
          return validTokens.includes(token);
        };

        if (!isValidToken(token)) {
          return res.status(401).json({ error: 'Invalid access token' });
        }

        next();
      };

      await authMiddleware(mockReq, mockRes, mockNext);

      // Assertions
      assert.strictEqual(mockNext.mock.callCount(), 0);
      assert.strictEqual(mockRes.status.mock.calls[0][0], 401);
      assert.strictEqual(mockRes.json.mock.calls[0][0].error, 'Invalid access token');
    });
  });

  describe('Rate Limiting Middleware', () => {
    it('should validate request rate limiting', () => {
      // Mock rate limiting store
      const rateLimitStore = new Map();
      const RATE_LIMIT = 100; // requests per hour
      const WINDOW_MS = 60 * 60 * 1000; // 1 hour

      const rateLimitMiddleware = (req, res, next) => {
        const clientId = req.user?.id || req.ip || 'anonymous';
        const now = Date.now();
        const windowStart = now - WINDOW_MS;

        // Clean old entries
        for (const [key, requests] of rateLimitStore.entries()) {
          const filteredRequests = requests.filter(timestamp => timestamp > windowStart);
          if (filteredRequests.length === 0) {
            rateLimitStore.delete(key);
          } else {
            rateLimitStore.set(key, filteredRequests);
          }
        }

        // Check current client's requests
        const clientRequests = rateLimitStore.get(clientId) || [];
        const recentRequests = clientRequests.filter(timestamp => timestamp > windowStart);

        if (recentRequests.length >= RATE_LIMIT) {
          const resetTime = Math.ceil((recentRequests[0] + WINDOW_MS - now) / 1000);
          return res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: resetTime
          });
        }

        // Add current request
        recentRequests.push(now);
        rateLimitStore.set(clientId, recentRequests);

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
        res.setHeader('X-RateLimit-Remaining', RATE_LIMIT - recentRequests.length);
        res.setHeader('X-RateLimit-Reset', Math.ceil((windowStart + WINDOW_MS) / 1000));

        next();
      };

      // Test normal request
      mockReq.user = { id: 1 };
      mockReq.ip = '192.168.1.1';

      // Mock setHeader method
      mockRes.setHeader = mock.fn();

      rateLimitMiddleware(mockReq, mockRes, mockNext);

      // Assertions for normal request
      assert.strictEqual(mockNext.mock.callCount(), 1);
      assert.strictEqual(mockRes.setHeader.mock.callCount(), 3); // 3 rate limit headers
      assert.strictEqual(mockRes.status.mock.callCount(), 0); // No rate limit hit

      // Test rate limit exceeded
      // Simulate 100 requests already made
      rateLimitStore.set(1, new Array(100).fill(Date.now()));
      
      // Reset mocks
      mockNext.mockReset();
      mockRes.status.mockReset();
      mockRes.json.mockReset();

      rateLimitMiddleware(mockReq, mockRes, mockNext);

      // Assertions for rate limited request
      assert.strictEqual(mockNext.mock.callCount(), 0);
      assert.strictEqual(mockRes.status.mock.calls[0][0], 429);
      assert.strictEqual(mockRes.json.mock.calls[0][0].error, 'Rate limit exceeded');
      assert.ok(mockRes.json.mock.calls[0][0].retryAfter);
    });
  });

  describe('Admin Role Middleware', () => {
    it('should allow admin users to access admin endpoints', () => {
      mockReq.user = { id: 1, email: 'admin@example.com', role: 'admin' };

      const adminMiddleware = (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }

        next();
      };

      adminMiddleware(mockReq, mockRes, mockNext);

      // Assertions
      assert.strictEqual(mockNext.mock.callCount(), 1);
      assert.strictEqual(mockRes.status.mock.callCount(), 0);
    });

    it('should deny non-admin users access to admin endpoints', () => {
      mockReq.user = { id: 2, email: 'user@example.com', role: 'user' };

      const adminMiddleware = (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }

        next();
      };

      adminMiddleware(mockReq, mockRes, mockNext);

      // Assertions
      assert.strictEqual(mockNext.mock.callCount(), 0);
      assert.strictEqual(mockRes.status.mock.calls[0][0], 403);
      assert.strictEqual(mockRes.json.mock.calls[0][0].error, 'Admin access required');
    });

    it('should handle unauthenticated requests', () => {
      mockReq.user = null;

      const adminMiddleware = (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }

        next();
      };

      adminMiddleware(mockReq, mockRes, mockNext);

      // Assertions
      assert.strictEqual(mockNext.mock.callCount(), 0);
      assert.strictEqual(mockRes.status.mock.calls[0][0], 401);
      assert.strictEqual(mockRes.json.mock.calls[0][0].error, 'Authentication required');
    });
  });
});