import express from 'express';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const router = express.Router();

// @route   GET /api/images/products/:productId/:imageId
// @desc    Get product image directly from database
// @access  Public

import path from 'path';
import fs from 'fs';

// Serve product images from disk using the path field
router.get('/products/:productId/:imageId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Try to find by subdocument _id (if present)
    let image = product.images.id?.(req.params.imageId);
    // If not found, try by index or by matching path
    if (!image) {
      image = product.images.find(img => img._id?.toString() === req.params.imageId || img.path === req.params.imageId);
    }
    // If still not found, try as array index
    if (!image && !isNaN(Number(req.params.imageId))) {
      image = product.images[Number(req.params.imageId)];
    }
    if (!image) {
      // Fallback to placeholder
      const placeholderPath = path.join(__dirname, '../../uploads/placeholder.svg');
      if (fs.existsSync(placeholderPath)) {
        res.type('image/svg+xml');
        return res.sendFile(placeholderPath);
      }
      return res.status(404).json({ error: 'Image not found' });
    }

    // Serve the image from disk
    const imagePath = path.isAbsolute(image.path)
      ? image.path
      : path.join(__dirname, '../../uploads/products', image.path);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image file not found on disk' });
    }
    // Set content type based on file extension
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    res.type(mimeTypes[ext] || 'application/octet-stream');
    return res.sendFile(imagePath);
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;