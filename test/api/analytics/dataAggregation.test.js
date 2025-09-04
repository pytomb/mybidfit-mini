import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

/**
 * Data Aggregation and Statistics Tests
 * Covers analytics data processing, aggregation, and statistical calculations
 */
describe('Data Aggregation and Statistics', () => {

  describe('Event Aggregation by Time Period', () => {
    it('should aggregate events by time period', () => {
      // Mock event data with timestamps
      const mockEvents = [
        { event: 'page_view', timestamp: new Date('2024-01-01T10:00:00Z') },
        { event: 'analysis_started', timestamp: new Date('2024-01-01T10:30:00Z') },
        { event: 'page_view', timestamp: new Date('2024-01-01T11:00:00Z') },
        { event: 'analysis_completed', timestamp: new Date('2024-01-01T11:15:00Z') },
        { event: 'page_view', timestamp: new Date('2024-01-01T12:00:00Z') },
        { event: 'analysis_started', timestamp: new Date('2024-01-01T12:30:00Z') }
      ];

      const aggregateEventsByHour = (events) => {
        const aggregated = {};

        events.forEach(event => {
          const hour = event.timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
          
          if (!aggregated[hour]) {
            aggregated[hour] = {
              hour,
              totalEvents: 0,
              eventCounts: {}
            };
          }

          aggregated[hour].totalEvents += 1;
          aggregated[hour].eventCounts[event.event] = 
            (aggregated[hour].eventCounts[event.event] || 0) + 1;
        });

        return Object.values(aggregated).sort((a, b) => a.hour.localeCompare(b.hour));
      };

      const result = aggregateEventsByHour(mockEvents);

      // Assertions
      assert.strictEqual(result.length, 3); // 3 different hours
      
      // Hour 10:00
      assert.strictEqual(result[0].hour, '2024-01-01T10');
      assert.strictEqual(result[0].totalEvents, 2);
      assert.strictEqual(result[0].eventCounts.page_view, 1);
      assert.strictEqual(result[0].eventCounts.analysis_started, 1);

      // Hour 11:00  
      assert.strictEqual(result[1].hour, '2024-01-01T11');
      assert.strictEqual(result[1].totalEvents, 2);
      assert.strictEqual(result[1].eventCounts.page_view, 1);
      assert.strictEqual(result[1].eventCounts.analysis_completed, 1);

      // Hour 12:00
      assert.strictEqual(result[2].hour, '2024-01-01T12');
      assert.strictEqual(result[2].totalEvents, 2);
      assert.strictEqual(result[2].eventCounts.page_view, 1);
      assert.strictEqual(result[2].eventCounts.analysis_started, 1);
    });

    it('should aggregate events by day', () => {
      const mockEvents = [
        { event: 'page_view', timestamp: new Date('2024-01-01T10:00:00Z') },
        { event: 'page_view', timestamp: new Date('2024-01-01T14:00:00Z') },
        { event: 'page_view', timestamp: new Date('2024-01-02T10:00:00Z') },
        { event: 'analysis_completed', timestamp: new Date('2024-01-02T15:00:00Z') },
        { event: 'page_view', timestamp: new Date('2024-01-03T09:00:00Z') }
      ];

      const aggregateEventsByDay = (events) => {
        const aggregated = {};

        events.forEach(event => {
          const day = event.timestamp.toISOString().substring(0, 10); // YYYY-MM-DD
          
          if (!aggregated[day]) {
            aggregated[day] = {
              day,
              totalEvents: 0,
              uniqueEventTypes: new Set()
            };
          }

          aggregated[day].totalEvents += 1;
          aggregated[day].uniqueEventTypes.add(event.event);
        });

        // Convert sets to arrays for easier testing
        return Object.values(aggregated).map(dayData => ({
          ...dayData,
          uniqueEventTypes: Array.from(dayData.uniqueEventTypes)
        })).sort((a, b) => a.day.localeCompare(b.day));
      };

      const result = aggregateEventsByDay(mockEvents);

      // Assertions
      assert.strictEqual(result.length, 3);
      
      // Day 1
      assert.strictEqual(result[0].day, '2024-01-01');
      assert.strictEqual(result[0].totalEvents, 2);
      assert.deepStrictEqual(result[0].uniqueEventTypes, ['page_view']);

      // Day 2  
      assert.strictEqual(result[1].day, '2024-01-02');
      assert.strictEqual(result[1].totalEvents, 2);
      assert.ok(result[1].uniqueEventTypes.includes('page_view'));
      assert.ok(result[1].uniqueEventTypes.includes('analysis_completed'));

      // Day 3
      assert.strictEqual(result[2].day, '2024-01-03');
      assert.strictEqual(result[2].totalEvents, 1);
      assert.deepStrictEqual(result[2].uniqueEventTypes, ['page_view']);
    });
  });

  describe('Statistical Calculations', () => {
    it('should calculate statistical significance', () => {
      // Mock A/B test data
      const controlGroup = {
        visitors: 1000,
        conversions: 120 // 12% conversion rate
      };

      const testGroup = {
        visitors: 1000, 
        conversions: 150 // 15% conversion rate
      };

      const calculateStatisticalSignificance = (control, test) => {
        const p1 = control.conversions / control.visitors;
        const p2 = test.conversions / test.visitors;
        const pooledP = (control.conversions + test.conversions) / (control.visitors + test.visitors);
        
        const se = Math.sqrt(pooledP * (1 - pooledP) * (1/control.visitors + 1/test.visitors));
        const zScore = (p2 - p1) / se;
        
        // Simple p-value approximation for two-tailed test
        const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
        
        return {
          controlConversionRate: Math.round(p1 * 10000) / 100,
          testConversionRate: Math.round(p2 * 10000) / 100, 
          liftPercentage: Math.round((p2 - p1) / p1 * 10000) / 100,
          zScore: Math.round(zScore * 1000) / 1000,
          pValue: Math.round(pValue * 10000) / 10000,
          isSignificant: pValue < 0.05,
          confidenceLevel: Math.round((1 - pValue) * 10000) / 100
        };
      };

      // Simple normal CDF approximation
      const normalCDF = (x) => {
        return 0.5 * (1 + erf(x / Math.sqrt(2)));
      };

      // Error function approximation
      const erf = (x) => {
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
      };

      const result = calculateStatisticalSignificance(controlGroup, testGroup);

      // Assertions
      assert.strictEqual(result.controlConversionRate, 12); // 12%
      assert.strictEqual(result.testConversionRate, 15); // 15%
      assert.strictEqual(result.liftPercentage, 25); // 25% lift
      assert.ok(result.zScore > 0); // Test group should have positive z-score
      assert.ok(result.pValue >= 0 && result.pValue <= 1);
      assert.strictEqual(typeof result.isSignificant, 'boolean');
      assert.ok(result.confidenceLevel > 0 && result.confidenceLevel <= 100);
    });

    it('should calculate moving averages for trend analysis', () => {
      const dailyEventCounts = [
        { date: '2024-01-01', count: 100 },
        { date: '2024-01-02', count: 120 },
        { date: '2024-01-03', count: 110 },
        { date: '2024-01-04', count: 140 },
        { date: '2024-01-05', count: 130 },
        { date: '2024-01-06', count: 160 },
        { date: '2024-01-07', count: 150 }
      ];

      const calculateMovingAverage = (data, windowSize) => {
        return data.map((item, index) => {
          if (index < windowSize - 1) {
            return { ...item, movingAverage: null };
          }

          const windowData = data.slice(index - windowSize + 1, index + 1);
          const average = windowData.reduce((sum, d) => sum + d.count, 0) / windowSize;
          
          return {
            ...item,
            movingAverage: Math.round(average * 100) / 100
          };
        });
      };

      const result = calculateMovingAverage(dailyEventCounts, 3);

      // Assertions
      assert.strictEqual(result[0].movingAverage, null); // Not enough data
      assert.strictEqual(result[1].movingAverage, null); // Not enough data
      assert.strictEqual(result[2].movingAverage, 110); // (100 + 120 + 110) / 3
      assert.strictEqual(result[3].movingAverage, 123.33); // (120 + 110 + 140) / 3
      assert.strictEqual(result[4].movingAverage, 126.67); // (110 + 140 + 130) / 3
      assert.strictEqual(result[5].movingAverage, 143.33); // (140 + 130 + 160) / 3
      assert.strictEqual(result[6].movingAverage, 146.67); // (130 + 160 + 150) / 3
    });
  });

  describe('Performance Metrics Calculation', () => {
    it('should calculate user engagement metrics', () => {
      const userSessions = [
        {
          userId: 1,
          sessionStart: new Date('2024-01-01T10:00:00Z'),
          sessionEnd: new Date('2024-01-01T10:15:00Z'),
          pageViews: 5,
          events: ['page_view', 'analysis_started', 'analysis_completed']
        },
        {
          userId: 2,
          sessionStart: new Date('2024-01-01T11:00:00Z'),
          sessionEnd: new Date('2024-01-01T11:45:00Z'),
          pageViews: 12,
          events: ['page_view', 'page_view', 'analysis_started', 'page_view']
        },
        {
          userId: 3,
          sessionStart: new Date('2024-01-01T12:00:00Z'),
          sessionEnd: new Date('2024-01-01T12:08:00Z'),
          pageViews: 2,
          events: ['page_view', 'page_view']
        }
      ];

      const calculateEngagementMetrics = (sessions) => {
        const totalSessions = sessions.length;
        const totalDuration = sessions.reduce((sum, session) => {
          return sum + (session.sessionEnd.getTime() - session.sessionStart.getTime());
        }, 0);
        const totalPageViews = sessions.reduce((sum, session) => sum + session.pageViews, 0);
        const totalEvents = sessions.reduce((sum, session) => sum + session.events.length, 0);

        return {
          avgSessionDuration: Math.round(totalDuration / totalSessions / 1000), // seconds
          avgPageViewsPerSession: Math.round(totalPageViews / totalSessions * 100) / 100,
          avgEventsPerSession: Math.round(totalEvents / totalSessions * 100) / 100,
          bounceRate: Math.round(
            (sessions.filter(s => s.pageViews <= 1).length / totalSessions) * 10000
          ) / 100
        };
      };

      const result = calculateEngagementMetrics(userSessions);

      // Assertions
      assert.strictEqual(result.avgSessionDuration, 916); // Average duration in seconds
      assert.strictEqual(result.avgPageViewsPerSession, 6.33); // (5 + 12 + 2) / 3
      assert.strictEqual(result.avgEventsPerSession, 3.33); // (3 + 4 + 2) / 3
      assert.strictEqual(result.bounceRate, 0); // No sessions with <= 1 page view
    });
  });
});