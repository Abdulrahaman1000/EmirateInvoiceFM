// ============================================
// FILE: server.js (Main Entry Point)
// Place this in the root directory
// ============================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Swagger
const swaggerUI = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

// Import routes
const authRoutes = require('./src/routes/auth');
const stationRoutes = require('./src/routes/station');
const clientRoutes = require('./src/routes/client');
const rateRoutes = require('./src/routes/rate');
const invoiceRoutes = require('./src/routes/Invoice');
const paymentRoutes = require('./src/routes/payment');
const dashboardRoutes = require('./src/routes/dashboard');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');

// Initialize app
const app = express();

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
// CORS configuration - Allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',  // Vite's default port
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Compress responses
app.use(compression());

// Logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads (logo, etc.)
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// ============================================
// SWAGGER DOCUMENTATION
// ============================================
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Radio Station Invoicing API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API version
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Radio Station Invoicing System API v1.0',
    station: 'Emirate FM 98.5 FM',
    docs: '/api-docs',
    endpoints: {
      auth: '/api/login, /api/logout',
      station: '/api/station',
      clients: '/api/clients',
      rates: '/api/rates',
      invoices: '/api/invoices',
      payments: '/api/payments',
      dashboard: '/api/dashboard'
    }
  });
});

// Mount routes
app.use('/api', authRoutes);              // /api/login, /api/logout
app.use('/api', stationRoutes);           // /api/station
app.use('/api', clientRoutes);            // /api/clients
app.use('/api', rateRoutes);              // /api/rates
app.use('/api', invoiceRoutes);           // /api/invoices
app.use('/api', paymentRoutes);           // /api/payments
app.use('/api', dashboardRoutes);         // /api/dashboard

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🎙️  Radio Station Invoicing System - Emirate FM 98.5 FM`);
  console.log('='.repeat(60));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
  console.log('='.repeat(60));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});