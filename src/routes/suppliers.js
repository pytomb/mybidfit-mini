const express = require('express');
const { SupplierAnalysisService } = require('../services/supplierAnalysis');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const supplierAnalysisService = new SupplierAnalysisService();

/**
 * POST /api/suppliers/analyze
 * Analyze a supplier's capabilities and credibility
 */
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { companyId, analysisData } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const analysis = await supplierAnalysisService.analyzeSupplier(companyId, analysisData);
    
    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Supplier analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze supplier',
      details: error.message
    });
  }
});

/**
 * GET /api/suppliers/:companyId/analysis-history
 * Get analysis history for a supplier
 */
router.get('/:companyId/analysis-history', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const history = await supplierAnalysisService.getAnalysisHistory(companyId);
    
    if (!history) {
      return res.status(404).json({
        success: false,
        error: 'No analysis history found for this supplier'
      });
    }

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    logger.error('Analysis history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analysis history',
      details: error.message
    });
  }
});

/**
 * POST /api/suppliers/batch-analyze
 * Analyze multiple suppliers in batch
 */
router.post('/batch-analyze', authenticateToken, async (req, res) => {
  try {
    const { companyIds } = req.body;
    
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ 
        error: 'Array of company IDs is required' 
      });
    }

    if (companyIds.length > 10) {
      return res.status(400).json({ 
        error: 'Maximum 10 suppliers can be analyzed in batch' 
      });
    }

    const results = await supplierAnalysisService.batchAnalyzeSuppliers(companyIds);
    
    res.json({
      success: true,
      data: {
        totalProcessed: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        results
      }
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform batch analysis',
      details: error.message
    });
  }
});

module.exports = router;