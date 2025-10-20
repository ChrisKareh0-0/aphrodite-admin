import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getDashboardStats,
  getSalesAnalytics,
  getProductAnalytics,
  getCustomerAnalytics
} from '../controllers/dashboardController.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(auth);

// Dashboard overview statistics
router.get('/stats', getDashboardStats);

// Sales analytics with date range
router.get('/sales-analytics', getSalesAnalytics);

// Product analytics
router.get('/product-analytics', getProductAnalytics);

// Customer analytics
router.get('/customer-analytics', getCustomerAnalytics);

export default router;
