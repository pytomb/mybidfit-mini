const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { DatabaseOperations } = require('../../../src/services/supplierAnalysis/DatabaseOperations');

describe('DatabaseOperations - Supplier Analysis Module', () => {
  let dbOps;
  
  beforeEach(() => {
    // Mock database connection
    const mockDb = {
      query: test.mock.fn(),
      transaction: test.mock.fn(),
      close: test.mock.fn()
    };
    
    dbOps = new DatabaseOperations(mockDb);
  });

  describe('storeAnalysisResults()', () => {
    test('should store comprehensive supplier analysis results', async () => {
      const analysisResults = {
        supplierId: 'supplier_123',
        analysisDate: new Date('2024-01-15'),
        capabilities: {
          core: ['Web Development', 'Cloud Services'],
          emerging: ['AI Integration'],
          strengthScore: 8.5
        },
        credibility: {
          score: 8.2,
          factors: ['strong_portfolio', 'positive_reviews'],
          verificationLevel: 0.85
        },
        marketPosition: {
          competitiveRank: 3,
          marketShare: 'regional_leader',
          differentiators: ['technical_depth', 'enterprise_focus']
        },
        riskAssessment: {
          overall: 'medium',
          financialRisk: 'low',
          operationalRisk: 'medium',
          complianceRisk: 'low'
        }
      };

      const mockDb = dbOps.db;
      mockDb.query.mock.mockImplementation(() => ({ insertId: 456, affectedRows: 1 }));

      const result = await dbOps.storeAnalysisResults(analysisResults);

      // Verify database interaction
      assert.strictEqual(mockDb.query.mock.callCount(), 1);
      const [query, params] = mockDb.query.mock.calls[0].arguments;
      
      assert.ok(query.includes('INSERT INTO supplier_analysis'));
      assert.ok(query.includes('capabilities'));
      assert.ok(query.includes('credibility'));
      assert.ok(query.includes('market_position'));
      assert.ok(query.includes('risk_assessment'));
      
      // Verify parameters include all analysis data
      assert.strictEqual(params[0], 'supplier_123');
      assert.ok(params.includes(JSON.stringify(analysisResults.capabilities)));
      
      // Verify return value
      assert.strictEqual(result.analysisId, 456);
      assert.strictEqual(result.success, true);
    });

    test('should handle transaction rollback on storage failure', async () => {
      const analysisResults = {
        supplierId: 'supplier_fail',
        analysisDate: new Date(),
        capabilities: { core: ['Development'] }
      };

      const mockDb = dbOps.db;
      mockDb.transaction.mock.mockImplementation(callback => {
        throw new Error('Database connection lost');
      });

      try {
        await dbOps.storeAnalysisResults(analysisResults);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Database connection lost');
        // Transaction should be attempted
        assert.strictEqual(mockDb.transaction.mock.callCount(), 1);
      }
    });

    test('should update existing analysis if supplierId already exists', async () => {
      const existingAnalysis = {
        supplierId: 'supplier_existing',
        analysisDate: new Date(),
        capabilities: { core: ['Updated Capabilities'] }
      };

      const mockDb = dbOps.db;
      // First call returns existing record, second call updates
      mockDb.query.mock.mockImplementationOnce(() => ({ 
        length: 1, 
        0: { id: 123, supplier_id: 'supplier_existing' } 
      }));
      mockDb.query.mock.mockImplementationOnce(() => ({ affectedRows: 1 }));

      const result = await dbOps.storeAnalysisResults(existingAnalysis);

      // Should call SELECT then UPDATE
      assert.strictEqual(mockDb.query.mock.callCount(), 2);
      const [selectQuery] = mockDb.query.mock.calls[0].arguments;
      const [updateQuery] = mockDb.query.mock.calls[1].arguments;
      
      assert.ok(selectQuery.includes('SELECT'));
      assert.ok(updateQuery.includes('UPDATE'));
      assert.strictEqual(result.operation, 'update');
      assert.strictEqual(result.analysisId, 123);
    });
  });

  describe('retrieveSupplierHistory()', () => {
    test('should retrieve complete analysis history for a supplier', async () => {
      const supplierId = 'supplier_history';
      
      const mockHistoryData = [
        {
          id: 1,
          analysis_date: '2024-01-01',
          capabilities: '{"core": ["Web Dev"], "strengthScore": 7.5}',
          credibility: '{"score": 7.8}',
          market_position: '{"rank": 5}',
          version: 1
        },
        {
          id: 2,
          analysis_date: '2024-01-15',
          capabilities: '{"core": ["Web Dev", "AI"], "strengthScore": 8.2}',
          credibility: '{"score": 8.1}',
          market_position: '{"rank": 3}',
          version: 2
        }
      ];

      const mockDb = dbOps.db;
      mockDb.query.mock.mockImplementation(() => mockHistoryData);

      const history = await dbOps.retrieveSupplierHistory(supplierId);

      // Verify query
      assert.strictEqual(mockDb.query.mock.callCount(), 1);
      const [query, params] = mockDb.query.mock.calls[0].arguments;
      assert.ok(query.includes('SELECT * FROM supplier_analysis'));
      assert.ok(query.includes('WHERE supplier_id = ?'));
      assert.ok(query.includes('ORDER BY analysis_date DESC'));
      assert.strictEqual(params[0], supplierId);

      // Verify parsed results
      assert.strictEqual(history.length, 2);
      assert.strictEqual(history[0].version, 2); // Most recent first
      assert.strictEqual(history[1].version, 1);
      
      // Verify JSON parsing
      assert.deepStrictEqual(history[0].capabilities.core, ['Web Dev', 'AI']);
      assert.strictEqual(history[0].capabilities.strengthScore, 8.2);
      assert.strictEqual(history[0].credibility.score, 8.1);
    });

    test('should return empty array for supplier with no history', async () => {
      const supplierId = 'supplier_no_history';
      
      const mockDb = dbOps.db;
      mockDb.query.mock.mockImplementation(() => []);

      const history = await dbOps.retrieveSupplierHistory(supplierId);

      assert.strictEqual(history.length, 0);
      assert.strictEqual(Array.isArray(history), true);
    });

    test('should handle database errors gracefully', async () => {
      const supplierId = 'supplier_error';
      
      const mockDb = dbOps.db;
      mockDb.query.mock.mockImplementation(() => {
        throw new Error('Table does not exist');
      });

      try {
        await dbOps.retrieveSupplierHistory(supplierId);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Table does not exist');
      }
    });
  });

  describe('compareAnalysisVersions()', () => {
    test('should identify improvements between analysis versions', () => {
      const previousAnalysis = {
        capabilities: { strengthScore: 7.5, core: ['Web Dev'] },
        credibility: { score: 7.8 },
        marketPosition: { rank: 5 },
        analysisDate: new Date('2024-01-01')
      };

      const currentAnalysis = {
        capabilities: { strengthScore: 8.2, core: ['Web Dev', 'AI'] },
        credibility: { score: 8.1 },
        marketPosition: { rank: 3 },
        analysisDate: new Date('2024-01-15')
      };

      const comparison = dbOps.compareAnalysisVersions(previousAnalysis, currentAnalysis);

      // Verify improvement detection
      assert.strictEqual(comparison.overallTrend, 'improving');
      assert.ok(comparison.improvements.length > 0);
      assert.ok(comparison.improvements.includes('capabilities_strength'));
      assert.ok(comparison.improvements.includes('market_rank'));
      assert.ok(comparison.improvements.includes('capability_expansion'));

      // Verify metrics
      assert.ok(comparison.strengthImprovement > 0);
      assert.ok(comparison.credibilityImprovement > 0);
      assert.strictEqual(comparison.marketRankImprovement, 2); // Rank 5 to 3
      assert.strictEqual(comparison.timeSpan, 14); // Days between analyses
    });

    test('should identify deterioration between versions', () => {
      const previousAnalysis = {
        capabilities: { strengthScore: 8.5 },
        credibility: { score: 8.3 },
        marketPosition: { rank: 2 },
        riskAssessment: { overall: 'low' }
      };

      const currentAnalysis = {
        capabilities: { strengthScore: 7.8 },
        credibility: { score: 7.9 },
        marketPosition: { rank: 4 },
        riskAssessment: { overall: 'medium' }
      };

      const comparison = dbOps.compareAnalysisVersions(previousAnalysis, currentAnalysis);

      // Verify deterioration detection
      assert.strictEqual(comparison.overallTrend, 'declining');
      assert.ok(comparison.concerns.length > 0);
      assert.ok(comparison.concerns.includes('capability_decline'));
      assert.ok(comparison.concerns.includes('credibility_drop'));
      assert.ok(comparison.concerns.includes('market_position_loss'));
      assert.ok(comparison.concerns.includes('risk_increase'));
    });

    test('should handle stable analysis with minor fluctuations', () => {
      const previousAnalysis = {
        capabilities: { strengthScore: 8.0 },
        credibility: { score: 8.0 },
        marketPosition: { rank: 3 }
      };

      const currentAnalysis = {
        capabilities: { strengthScore: 8.1 },
        credibility: { score: 7.9 },
        marketPosition: { rank: 3 }
      };

      const comparison = dbOps.compareAnalysisVersions(previousAnalysis, currentAnalysis);

      // Should recognize stability
      assert.strictEqual(comparison.overallTrend, 'stable');
      assert.ok(comparison.stabilityIndicators.includes('consistent_market_position'));
      assert.ok(Math.abs(comparison.volatility) < 0.2); // Low volatility
    });
  });

  describe('optimizeStoragePerformance()', () => {
    test('should batch multiple analysis results for efficient storage', async () => {
      const batchAnalyses = [
        { supplierId: 'supplier_1', capabilities: { core: ['Dev'] } },
        { supplierId: 'supplier_2', capabilities: { core: ['Design'] } },
        { supplierId: 'supplier_3', capabilities: { core: ['Marketing'] } }
      ];

      const mockDb = dbOps.db;
      mockDb.query.mock.mockImplementation(() => ({ affectedRows: 3 }));

      const result = await dbOps.batchStoreAnalyses(batchAnalyses);

      // Should use batch INSERT
      assert.strictEqual(mockDb.query.mock.callCount(), 1);
      const [query, params] = mockDb.query.mock.calls[0].arguments;
      assert.ok(query.includes('INSERT INTO supplier_analysis'));
      assert.ok(query.includes('VALUES')); // Batch insert pattern
      assert.ok(params.length >= 3); // At least one parameter per record

      assert.strictEqual(result.totalInserted, 3);
      assert.strictEqual(result.batchSuccess, true);
    });

    test('should implement connection pooling for concurrent operations', async () => {
      const concurrentQueries = [
        () => dbOps.retrieveSupplierHistory('supplier_1'),
        () => dbOps.retrieveSupplierHistory('supplier_2'),
        () => dbOps.retrieveSupplierHistory('supplier_3')
      ];

      const mockDb = dbOps.db;
      mockDb.query.mock.mockImplementation(() => []);

      // Execute concurrent queries
      await Promise.all(concurrentQueries.map(query => query()));

      // Should reuse connection efficiently
      assert.strictEqual(mockDb.query.mock.callCount(), 3);
      
      // Verify connection pooling metrics (if implemented)
      const poolStats = dbOps.getConnectionPoolStats();
      if (poolStats) {
        assert.ok(poolStats.activeConnections >= 0);
        assert.ok(poolStats.maxConnections > 0);
      }
    });

    test('should implement query result caching for frequently accessed data', async () => {
      const supplierId = 'frequent_supplier';
      
      const mockDb = dbOps.db;
      mockDb.query.mock.mockImplementation(() => [
        { id: 1, analysis_date: '2024-01-15', capabilities: '{"core": ["Dev"]}' }
      ]);

      // First call should hit database
      const firstResult = await dbOps.retrieveSupplierHistory(supplierId);
      
      // Second call should use cache
      const secondResult = await dbOps.retrieveSupplierHistory(supplierId);

      // Database should only be called once due to caching
      assert.strictEqual(mockDb.query.mock.callCount(), 1);
      
      // Results should be identical
      assert.deepStrictEqual(firstResult, secondResult);
      
      // Cache should be active
      assert.strictEqual(dbOps.isCacheActive(), true);
      assert.ok(dbOps.getCacheStats().hitRate >= 0.5); // At least 50% cache hit rate
    });
  });

  describe('dataIntegrityValidation()', () => {
    test('should validate analysis data before storage', () => {
      const validAnalysis = {
        supplierId: 'supplier_valid',
        analysisDate: new Date(),
        capabilities: { core: ['Development'], strengthScore: 8.5 },
        credibility: { score: 8.2, factors: ['portfolio'] }
      };

      const validation = dbOps.validateAnalysisData(validAnalysis);
      
      assert.strictEqual(validation.isValid, true);
      assert.strictEqual(validation.errors.length, 0);
      assert.ok(validation.qualityScore >= 0.8);
    });

    test('should reject invalid or incomplete analysis data', () => {
      const invalidAnalyses = [
        { supplierId: null }, // Missing supplier ID
        { supplierId: 'valid', capabilities: 'invalid' }, // Invalid capabilities format
        { supplierId: 'valid', credibility: { score: 15 } }, // Invalid score range
        { supplierId: 'valid', analysisDate: 'not-a-date' } // Invalid date
      ];

      invalidAnalyses.forEach(analysis => {
        const validation = dbOps.validateAnalysisData(analysis);
        assert.strictEqual(validation.isValid, false);
        assert.ok(validation.errors.length > 0);
      });
    });

    test('should check for data consistency across related fields', () => {
      const inconsistentAnalysis = {
        supplierId: 'supplier_inconsistent',
        capabilities: { strengthScore: 9.5, core: [] }, // High score but no capabilities
        credibility: { score: 8.5, factors: [] }, // High score but no supporting factors
        marketPosition: { rank: 1, marketShare: 'minimal' } // Top rank but minimal share
      };

      const validation = dbOps.validateAnalysisData(inconsistentAnalysis);
      
      assert.strictEqual(validation.isValid, false);
      assert.ok(validation.errors.some(error => error.includes('consistency')));
      assert.ok(validation.warnings.length > 0);
    });
  });

  describe('archivalAndMaintenance()', () => {
    test('should archive old analysis records beyond retention period', async () => {
      const retentionPeriodDays = 365;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionPeriodDays);

      const mockDb = dbOps.db;
      mockDb.query.mock.mockImplementationOnce(() => ({ affectedRows: 5 })); // Archive operation
      mockDb.query.mock.mockImplementationOnce(() => ({ affectedRows: 5 })); // Delete operation

      const archiveResult = await dbOps.archiveOldAnalyses(retentionPeriodDays);

      // Should call archive then delete
      assert.strictEqual(mockDb.query.mock.callCount(), 2);
      
      const [archiveQuery] = mockDb.query.mock.calls[0].arguments;
      const [deleteQuery] = mockDb.query.mock.calls[1].arguments;
      
      assert.ok(archiveQuery.includes('INSERT INTO supplier_analysis_archive'));
      assert.ok(deleteQuery.includes('DELETE FROM supplier_analysis'));
      
      assert.strictEqual(archiveResult.recordsArchived, 5);
      assert.strictEqual(archiveResult.recordsDeleted, 5);
    });

    test('should optimize database indexes for query performance', async () => {
      const mockDb = dbOps.db;
      mockDb.query.mock.mockImplementation(() => ({ message: 'Index optimized' }));

      const optimizationResult = await dbOps.optimizeIndexes();

      // Should run index optimization queries
      assert.strictEqual(mockDb.query.mock.callCount() >= 1, true);
      
      const queries = mockDb.query.mock.calls.map(call => call.arguments[0]);
      const hasIndexQuery = queries.some(query => 
        query.includes('ANALYZE') || query.includes('INDEX') || query.includes('OPTIMIZE')
      );
      
      assert.strictEqual(hasIndexQuery, true);
      assert.ok(optimizationResult.success);
    });

    test('should clean up orphaned records and maintain referential integrity', async () => {
      const mockDb = dbOps.db;
      mockDb.query.mock.mockImplementationOnce(() => [
        { supplier_id: 'orphaned_1' },
        { supplier_id: 'orphaned_2' }
      ]); // Find orphaned records
      mockDb.query.mock.mockImplementationOnce(() => ({ affectedRows: 2 })); // Clean up

      const cleanupResult = await dbOps.cleanupOrphanedRecords();

      // Should identify and clean orphaned records
      assert.strictEqual(mockDb.query.mock.callCount(), 2);
      assert.strictEqual(cleanupResult.orphanedRecordsFound, 2);
      assert.strictEqual(cleanupResult.recordsCleaned, 2);
      assert.strictEqual(cleanupResult.integrityMaintained, true);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should implement automatic retry for transient database errors', async () => {
      const analysisData = {
        supplierId: 'supplier_retry',
        capabilities: { core: ['Development'] }
      };

      const mockDb = dbOps.db;
      // Fail twice, succeed on third attempt
      mockDb.query.mock.mockImplementationOnce(() => { throw new Error('Connection timeout'); });
      mockDb.query.mock.mockImplementationOnce(() => { throw new Error('Deadlock detected'); });
      mockDb.query.mock.mockImplementationOnce(() => ({ insertId: 789, affectedRows: 1 }));

      const result = await dbOps.storeAnalysisResults(analysisData);

      // Should retry and eventually succeed
      assert.strictEqual(mockDb.query.mock.callCount(), 3);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.analysisId, 789);
      assert.strictEqual(result.retriesRequired, 2);
    });

    test('should log database operations for audit and debugging', async () => {
      const analysisData = {
        supplierId: 'supplier_logging',
        capabilities: { core: ['Development'] }
      };

      const mockDb = dbOps.db;
      mockDb.query.mock.mockImplementation(() => ({ insertId: 999 }));

      await dbOps.storeAnalysisResults(analysisData);

      // Should log the operation
      const auditLog = dbOps.getAuditLog();
      assert.ok(auditLog.length > 0);
      
      const lastLogEntry = auditLog[auditLog.length - 1];
      assert.strictEqual(lastLogEntry.operation, 'store_analysis');
      assert.strictEqual(lastLogEntry.supplierId, 'supplier_logging');
      assert.ok(lastLogEntry.timestamp instanceof Date);
      assert.strictEqual(lastLogEntry.success, true);
    });

    test('should implement circuit breaker for database connection failures', async () => {
      const mockDb = dbOps.db;
      
      // Simulate continuous database failures
      for (let i = 0; i < 5; i++) {
        mockDb.query.mock.mockImplementationOnce(() => { 
          throw new Error('Database unavailable'); 
        });
      }

      // Multiple failed attempts should trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await dbOps.retrieveSupplierHistory('test_supplier');
        } catch (error) {
          // Expected failures
        }
      }

      // Circuit breaker should be open
      assert.strictEqual(dbOps.isCircuitBreakerOpen(), true);
      
      // Next attempt should fail fast without hitting database
      try {
        await dbOps.retrieveSupplierHistory('another_supplier');
        assert.fail('Should have failed fast due to circuit breaker');
      } catch (error) {
        assert.ok(error.message.includes('Circuit breaker is open'));
      }
    });
  });
});