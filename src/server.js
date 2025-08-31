const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { logger } = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { Database } = require('./database/connection');

// Import route handlers
const authRoutes = require('./routes/auth');
const supplierRoutes = require('./routes/suppliers');
const opportunityRoutes = require('./routes/opportunities');
const analysisRoutes = require('./routes/analysis');
const partnershipRoutes = require('./routes/partnerships');
const partnerFitRoutes = require('./routes/partnerFit');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const relationshipIntelligenceRoutes = require('./routes/relationshipIntelligence');

// Load environment variables
dotenv.config();

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/partnerships', partnershipRoutes);
app.use('/api/partner-fit', partnerFitRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/relationship-intelligence', relationshipIntelligenceRoutes);

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