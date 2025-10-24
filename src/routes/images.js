import express from 'express';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const router = express.Router();

// @route   GET /api/images/products/:productId/:imageId
// @desc    Get product image directly from database
// @access  Public
router.get('/products/:productId/:imageId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const image = product.images.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.set('Content-Type', image.contentType);
    return res.send(image.data);
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;