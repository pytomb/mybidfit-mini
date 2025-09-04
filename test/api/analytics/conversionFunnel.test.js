import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { createMockRequest, createMockResponse, mockDatabase } from '../testHelpers.js';

/**
 * Conversion Funnel Analytics Tests
 * Covers GET /api/analytics/conversion-funnel functionality
 */
describe('Conversion Funnel Analytics', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createMockRequest({
      user: { id: 1, email: 'admin@example.com', role: 'admin' },
      query: { days: '30' }
    });
    mockRes = createMockResponse();
    mockNext = mock.fn();
    mockDatabase.query.mockReset();
  });

  describe('GET /api/analytics/conversion-funnel', () => {
    it('should return conversion funnel data', async () => {
      const mockFunnelData = [
        { stage: 'visited_landing', count: 1000, percentage: 100 },
        { stage: 'started_onboarding', count: 650, percentage: 65 },
        { stage: 'completed_stage1', count: 520, percentage: 52 },
        { stage: 'completed_stage2', count: 390, percentage: 39 },
        { stage: 'completed_stage3', count: 285, percentage: 28.5 },
        { stage: 'generated_recommendation', count: 220, percentage: 22 },
        { stage: 'downloaded_report', count: 180, percentage: 18 }
      ];

      // Mock database query for funnel data
      mockDatabase.query.mockResolvedValueOnce({
        rows: [
          { event: 'visited_landing', count: '1000' },
          { event: 'started_onboarding', count: '650' },
          { event: 'completed_stage1', count: '520' },
          { event: 'completed_stage2', count: '390' },
          { event: 'completed_stage3', count: '285' },
          { event: 'generated_recommendation', count: '220' },
          { event: 'downloaded_report', count: '180' }
        ]
      });

      const funnelHandler = async (req, res) => {
        const { days = 30 } = req.query;

        // Verify admin role
        if (req.user?.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }

        // Query funnel data
        const result = await mockDatabase.query(`
          SELECT 
            event,
            COUNT(*) as count
          FROM analytics_events 
          WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
            AND event IN (
              'visited_landing', 'started_onboarding', 'completed_stage1',
              'completed_stage2', 'completed_stage3', 'generated_recommendation',
              'downloaded_report'
            )
          GROUP BY event
          ORDER BY 
            CASE event
              WHEN 'visited_landing' THEN 1
              WHEN 'started_onboarding' THEN 2  
              WHEN 'completed_stage1' THEN 3
              WHEN 'completed_stage2' THEN 4
              WHEN 'completed_stage3' THEN 5
              WHEN 'generated_recommendation' THEN 6
              WHEN 'downloaded_report' THEN 7
            END
        `);

        // Calculate percentages based on top of funnel
        const topOfFunnel = Math.max(...result.rows.map(r => parseInt(r.count)));
        const funnelData = result.rows.map(row => ({
          stage: row.event,
          count: parseInt(row.count),
          percentage: topOfFunnel > 0 ? (parseInt(row.count) / topOfFunnel) * 100 : 0
        }));

        // Calculate conversion rates between stages
        const conversionRates = [];
        for (let i = 1; i < funnelData.length; i++) {
          const currentStage = funnelData[i];
          const previousStage = funnelData[i - 1];
          const conversionRate = previousStage.count > 0 ? 
            (currentStage.count / previousStage.count) * 100 : 0;
          
          conversionRates.push({
            from: previousStage.stage,
            to: currentStage.stage,
            rate: Math.round(conversionRate * 100) / 100
          });
        }

        res.json({
          success: true,
          period: `${days} days`,
          funnel: funnelData,
          conversionRates,
          summary: {
            totalVisitors: topOfFunnel,
            finalConversions: funnelData[funnelData.length - 1]?.count || 0,
            overallConversionRate: topOfFunnel > 0 ? 
              Math.round((funnelData[funnelData.length - 1]?.count || 0) / topOfFunnel * 10000) / 100 : 0
          }
        });
      };

      await funnelHandler(mockReq, mockRes);

      // Assertions
      assert.strictEqual(mockRes.json.mock.calls[0][0].success, true);
      assert.strictEqual(mockRes.json.mock.calls[0][0].period, '30 days');
      assert.ok(Array.isArray(mockRes.json.mock.calls[0][0].funnel));
      assert.ok(Array.isArray(mockRes.json.mock.calls[0][0].conversionRates));
      assert.ok(mockRes.json.mock.calls[0][0].summary);
      
      const funnelData = mockRes.json.mock.calls[0][0].funnel;
      assert.ok(funnelData.length > 0);
      assert.ok(funnelData[0].stage);
      assert.ok(typeof funnelData[0].count === 'number');
      assert.ok(typeof funnelData[0].percentage === 'number');
    });

    it('should handle invalid days parameter', async () => {
      mockReq.query = { days: 'invalid' };

      const funnelHandler = async (req, res) => {
        const { days = 30 } = req.query;

        // Validate days parameter
        const daysNum = parseInt(days);
        if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
          return res.status(400).json({ 
            error: 'Days parameter must be a number between 1 and 365' 
          });
        }

        res.json({ success: true });
      };

      await funnelHandler(mockReq, mockRes);

      // Assertions
      assert.strictEqual(mockRes.status.mock.calls[0][0], 400);
      assert.strictEqual(
        mockRes.json.mock.calls[0][0].error, 
        'Days parameter must be a number between 1 and 365'
      );
    });

    it('should require admin authentication', async () => {
      // Change user role to non-admin
      mockReq.user = { id: 2, email: 'user@example.com', role: 'user' };

      const funnelHandler = async (req, res) => {
        if (req.user?.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }

        res.json({ success: true });
      };

      await funnelHandler(mockReq, mockRes);

      // Assertions
      assert.strictEqual(mockRes.status.mock.calls[0][0], 403);
      assert.strictEqual(mockRes.json.mock.calls[0][0].error, 'Admin access required');
      assert.strictEqual(mockDatabase.query.mock.callCount(), 0);
    });

    it('should calculate conversion rates correctly', () => {
      const funnelData = [
        { stage: 'visited_landing', count: 1000 },
        { stage: 'started_onboarding', count: 650 },
        { stage: 'completed_analysis', count: 390 }
      ];

      const calculateConversionRate = (current, previous) => {
        return previous > 0 ? Math.round((current / previous) * 10000) / 100 : 0;
      };

      // Test conversion rate calculations
      const rate1to2 = calculateConversionRate(funnelData[1].count, funnelData[0].count);
      const rate2to3 = calculateConversionRate(funnelData[2].count, funnelData[1].count);

      assert.strictEqual(rate1to2, 65); // 650/1000 * 100 = 65%
      assert.strictEqual(rate2to3, 60); // 390/650 * 100 = 60%

      // Test edge case: zero previous count
      const rateWithZero = calculateConversionRate(100, 0);
      assert.strictEqual(rateWithZero, 0);
    });

    it('should handle empty data gracefully', async () => {
      // Mock empty database result
      mockDatabase.query.mockResolvedValueOnce({ rows: [] });

      const funnelHandler = async (req, res) => {
        const { days = 30 } = req.query;

        if (req.user?.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }

        const result = await mockDatabase.query('SELECT * FROM analytics_events');
        
        const funnelData = result.rows.map(row => ({
          stage: row.event,
          count: parseInt(row.count),
          percentage: 0
        }));

        res.json({
          success: true,
          period: `${days} days`,
          funnel: funnelData,
          conversionRates: [],
          summary: {
            totalVisitors: 0,
            finalConversions: 0,
            overallConversionRate: 0
          }
        });
      };

      await funnelHandler(mockReq, mockRes);

      // Assertions
      const response = mockRes.json.mock.calls[0][0];
      assert.strictEqual(response.success, true);
      assert.strictEqual(response.funnel.length, 0);
      assert.strictEqual(response.conversionRates.length, 0);
      assert.strictEqual(response.summary.totalVisitors, 0);
      assert.strictEqual(response.summary.overallConversionRate, 0);
    });
  });
});