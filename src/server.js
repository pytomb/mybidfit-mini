const express = require('express');
const cors = require('cors');
const path = require('path');
const { logger } = require('./utils/logger');
const { errorHandler, notFoundHandler, correlationIdMiddleware } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { Database } = require('./database/connection');

// Load and validate environment variables
require('dotenv-safe').config({
  example: './.env.example',
  allowEmptyValues: true // Allow optional variables to be empty
});

// Import route handlers
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const supplierRoutes = require('./routes/suppliers');
const opportunityRoutes = require('./routes/opportunities');
const analysisRoutes = require('./routes/analysis');
const partnershipRoutes = require('./routes/partnerships');
const partnerFitRoutes = require('./routes/partnerFit');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const relationshipIntelligenceRoutes = require('./routes/relationshipIntelligence');
const analyticsRoutes = require('./routes/analytics');
const scoringRoutes = require('./routes/scoring');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Correlation ID tracking for error handling
app.use(correlationIdMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Enhanced health check endpoint (Kubernetes style)
app.get('/healthz', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'healthy',
      memory: 'healthy',
      dependencies: 'healthy'
    }
  };

  let overallHealth = true;

  try {
    // Check database connection
    const db = Database.getInstance();
    if (db && db.pool) {
      try {
        await db.query('SELECT 1');
        healthCheck.checks.database = 'healthy';
      } catch (dbError) {
        healthCheck.checks.database = 'unhealthy';
        healthCheck.checks.databaseError = dbError.message;
        overallHealth = false;
      }
    } else {
      healthCheck.checks.database = 'not_initialized';
      overallHealth = false;
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memoryMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), 
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    // Flag if heap usage is over 500MB
    if (memoryMB.heapUsed > 500) {
      healthCheck.checks.memory = 'warning';
    }
    
    healthCheck.checks.memoryUsage = memoryMB;

    // Overall health status
    healthCheck.status = overallHealth ? 'healthy' : 'unhealthy';
    
    // Return appropriate HTTP status
    const statusCode = overallHealth ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/partnerships', partnershipRoutes);
app.use('/api/partner-fit', partnerFitRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/relationship-intelligence', relationshipIntelligenceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/scoring', scoringRoutes);

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'public')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });
} else {
  // Development API root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'MyBidFit API Server',
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/health',
      frontend: 'http://localhost:3000'
    });
  });
}

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    const db = Database.getInstance();
    await db.connect();
    logger.info('Database connection established');

    // Start the server
    app.listen(PORT, () => {
      logger.info(`🚀 MyBidFit API Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔒 CORS origins: ${allowedOrigins.join(', ')}`);
      logger.info(`📝 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  const db = Database.getInstance();
  await db.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  const db = Database.getInstance();
  await db.disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;