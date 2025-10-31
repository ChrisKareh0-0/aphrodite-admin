import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

const app = express();

// Ensure uploads directories exist to prevent multer failures in production
const uploadsDirs = ['uploads', 'uploads/categories', 'uploads/hero', 'uploads/collection', 'uploads/products'];
uploadsDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created upload directory: ${dirPath}`);
    }
  } catch (err) {
    console.error(`Failed to create upload directory ${dirPath}:`, err);
  }
});

// CORS configuration
const allowedOrigins = [
  'https://www.aphroditeeelb.com',
  'https://aphrodite-admin.onrender.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://aphrodite-storefront-gzs8ymb0e-chriskareh0-0s-projects.vercel.app' 
];

// CORS options with proper error handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Clean up origin by removing trailing slashes
    const cleanOrigin = origin.replace(/\/$/, '');
    
    if (allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS configuration
app.use(cors(corsOptions));

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
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads'))); // Add API prefix route for consistency

// Admin panel static files - must come BEFORE the /admin/* route
app.use('/admin', express.static(path.join(__dirname, '../admin-panel/build'), {
  index: false // Don't serve index.html for directory requests
}));
app.use('/static', express.static(path.join(__dirname, '../admin-panel/build/static')));
app.use('/favicon.ico', express.static(path.join(__dirname, '../admin-panel/build/favicon.ico')));

// Database connection with better options for production
const mongoOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds timeout
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
};

// Clean the MongoDB URI - remove any whitespace/newlines that might have been added
const mongoUri = (process.env.MONGODB_URI || 'mongodb://localhost:27017/aphrodite')
  .replace(/\s+/g, '') // Remove all whitespace including newlines
  .trim();

console.log('Attempting to connect to MongoDB...');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length);
console.log('Cleaned URI length:', mongoUri.length);
console.log('NODE_ENV:', process.env.NODE_ENV);

mongoose.connect(mongoUri, mongoOptions)
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    console.log('Database name:', mongoose.connection.name);
    console.log('Database host:', mongoose.connection.host);
    // Create default admin user if it doesn't exist
    const { createDefaultAdmin } = await import('./utils/createAdmin.js');
    await createDefaultAdmin();
  })
  .catch(err => {
    console.error('❌ MongoDB connection FAILED');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', JSON.stringify(err, null, 2));
    // Don't exit - let the app run so we can see the error
  });

// Import routes
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import dashboardRoutes from './routes/dashboard.js';
import apiTestRoutes from './routes/apiTest.js';
import publicRoutes from './routes/public.js';
import settingsRoutes from './routes/settings.js';
import imageRoutes from './routes/images.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/test', apiTestRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/images', imageRoutes);


// Admin panel routes - serve React app for HTML navigation (but not static files)
// The static middleware above will handle /admin/static/*, /admin/favicon.ico, etc.
// This catch-all serves index.html for any non-API, non-static route (for SPA routing)
app.get(/^\/(admin.*|products.*|categories.*|orders.*|dashboard.*|settings.*|customers.*|login.*|)$/,
  (req, res, next) => {
    // If the request is for a static file (has an extension), skip to next middleware
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$/)) {
      return next();
    }
    // If the request is for an API route, skip
    if (req.path.startsWith('/api')) {
      return next();
    }
    // Otherwise, serve the React app
    res.sendFile(path.join(__dirname, '../admin-panel/build/index.html'));
  }
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: 'OK',
    message: 'Aphrodite API is running',
    database: {
      status: dbStates[dbState],
      readyState: dbState,
      name: mongoose.connection.name,
      host: mongoose.connection.host
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
});

// 404 handler for API routes only (don't catch static files)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Error handling middleware
// Global error handler - log full stack and request details (helps in production)
app.use((err, req, res, next) => {
  console.error('Global error handler - error:', err);
  // Include helpful request context in logs when available
  try {
    console.error('Request path:', req.path);
    console.error('Request method:', req.method);
    console.error('Request headers:', req.headers);
    console.error('Request body:', req.body);
  } catch (logErr) {
    console.error('Error logging request context:', logErr);
  }

  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`API: http://localhost:${PORT}/api`);
});