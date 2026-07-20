require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const { initSocket } = require('./config/socket');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');
const { generalLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workers');
const batchRoutes = require('./routes/batches');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const activityRoutes = require('./routes/activity');

const app = express();
const server = http.createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = initSocket(server);
app.set('io', io);

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for dev; enable in prod with proper CSP
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/workers',  workerRoutes);
app.use('/api/batches',  batchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports',  reportRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/activity', activityRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

async function bootstrap() {
  await connectDB();
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { app, server, io };
