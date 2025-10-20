import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getApiDocumentation,
  testApiEndpoint,
  getApiHealth
} from '../controllers/apiTestController.js';

const router = express.Router();

// API documentation (public)
router.get('/docs', getApiDocumentation);

// API health check (public)
router.get('/health', getApiHealth);

// Test API endpoint (requires authentication)
router.post('/test', auth, testApiEndpoint);

export default router;
