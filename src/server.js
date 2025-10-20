import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

const app = express();

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3002', // Admin panel in development
  'http://localhost:3001', // Backend itself
];

// In production, only allow specified origins
if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
  // Remove localhost origins in production
  const prodOrigins = allowedOrigins.filter(origin => !origin.includes('localhost'));
  app.use(cors({
    origin: prodOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
} else {
  // Development: allow all origins for easier testing
  app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
}

// Security middleware - Relaxed for development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Admin panel static files
app.use('/admin', express.static(path.join(__dirname, '../admin-panel/build')));
app.use('/static', express.static(path.join(__dirname, '../admin-panel/build/static')));
app.use('/favicon.ico', express.static(path.join(__dirname, '../admin-panel/build/favicon.ico')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aphrodite')
  .then(async () => {
    console.log('MongoDB connected successfully');
    // Create default admin user if it doesn't exist
    const { createDefaultAdmin } = await import('./utils/createAdmin.js');
    await createDefaultAdmin();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import dashboardRoutes from './routes/dashboard.js';
import apiTestRoutes from './routes/apiTest.js';
import publicRoutes from './routes/public.js';
import settingsRoutes from './routes/settings.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/test', apiTestRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/settings', settingsRoutes);

// Admin panel route
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-panel/build/index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Aphrodite API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
  next(err); // Pass error to default Express error handler
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`API: http://localhost:${PORT}/api`);
});