import express from 'express';
import { body, validationResult, query } from 'express-validator';
import multer from 'multer';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { adminAuth } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
    }
  }
});

// @route   GET /api/products
// @desc    Get all products with pagination and filters
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isMongoId(),
  query('search').optional().trim(),
  query('status').optional().isIn(['active', 'inactive', 'all']),
  query('isOnSale').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.isOnSale) {
      filter.isOnSale = req.query.isOnSale === 'true';
    }

    if (req.query.status && req.query.status !== 'all') {
      filter.isActive = req.query.status === 'active';
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    // Debug: Log output of all product image paths
    console.log('--- PRODUCTS PAGE DATA ---');
    products.forEach(p => console.log(`ID: ${p._id}\tName: ${p.name}\tImages: ${JSON.stringify(p.images)}`));
    console.log('----- END PAGE DATA -----');

    res.json({
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', [
  adminAuth,
  upload.array('images', 10),
  body('name').not().isEmpty().trim(),
  body('description').not().isEmpty().trim(),
  body('shortDescription').optional().trim(),
  body('price').isFloat({ min: 0 }),
  body('originalPrice').optional().isFloat({ min: 0 }),
  body('category').isMongoId(),
  body('stock').optional().isJSON(),
  body('sku').optional().trim(),
  body('colors').optional().isJSON(),
  body('sizes').optional().isJSON(),
  body('tags').optional().isJSON()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }

    // Check if SKU already exists
    if (req.body.sku) {
      const existingProduct = await Product.findOne({ sku: req.body.sku });
      if (existingProduct) {
        return res.status(400).json({ error: 'SKU already exists' });
      }
    }

    const productData = {
      name: req.body.name,
      description: req.body.description,
      shortDescription: req.body.shortDescription,
      price: parseFloat(req.body.price),
      category: req.body.category,
      createdBy: req.user._id
    };

    if (req.body.originalPrice) {
      productData.originalPrice = parseFloat(req.body.originalPrice);
      productData.isOnSale = productData.price < productData.originalPrice;
    }

    if (req.body.stock) {
      try {
        productData.stock = JSON.parse(req.body.stock);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid stock format' });
      }
    }
    if (req.body.sku) productData.sku = req.body.sku;

    // Parse JSON fields
    if (req.body.colors) {
      try {
        productData.colors = JSON.parse(req.body.colors);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid colors format' });
      }
    }

    if (req.body.sizes) {
      try {
        productData.sizes = JSON.parse(req.body.sizes);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid sizes format' });
      }
    }

    if (req.body.tags) {
      try {
        productData.tags = JSON.parse(req.body.tags);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid tags format' });
      }
    }

    // Handle uploaded images (store in MongoDB)
    if (req.files && req.files.length > 0) {
      const productImages = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        productImages.push({
          data: file.buffer,
          contentType: file.mimetype,
          alt: `${req.body.name} - Image ${i+1}`,
          isPrimary: i === 0
        });
      }
      productData.images = productImages;
    }

    const product = new Product(productData);
    await product.save();

    await product.populate([
      { path: 'category', select: 'name slug' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', [
  adminAuth,
  upload.array('images', 10),
  body('name').optional().not().isEmpty().trim(),
  body('description').optional().not().isEmpty().trim(),
  body('shortDescription').optional().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('originalPrice').optional().isFloat({ min: 0 }),
  body('category').optional().isMongoId(),
  body('stock').optional().isJSON(),
  body('sku').optional().trim(),
  body('colors').optional().isJSON(),
  body('sizes').optional().isJSON(),
  body('tags').optional().isJSON(),
  body('isActive').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify category exists if being updated
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
      }
      product.category = req.body.category;
    }

    // Check SKU uniqueness if being updated
    if (req.body.sku && req.body.sku !== product.sku) {
      const existingProduct = await Product.findOne({
        sku: req.body.sku,
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({ error: 'SKU already exists' });
      }
      product.sku = req.body.sku;
    }

    // Update basic fields
    const updateFields = ['name', 'description', 'shortDescription', 'isActive', 'isFeatured'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // Handle stock separately since it needs to be parsed as JSON
    if (req.body.stock) {
      try {
        product.stock = JSON.parse(req.body.stock);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid stock format' });
      }
    }

    if (req.body.price) {
      product.price = parseFloat(req.body.price);
    }

    if (req.body.originalPrice !== undefined) {
      product.originalPrice = req.body.originalPrice ? parseFloat(req.body.originalPrice) : null;
      product.isOnSale = product.originalPrice && product.price < product.originalPrice;
    }

    // Parse JSON fields
    const jsonFields = ['colors', 'sizes', 'tags'];
    jsonFields.forEach(field => {
      if (req.body[field]) {
        try {
          product[field] = JSON.parse(req.body[field]);
        } catch (e) {
          return res.status(400).json({ error: `Invalid ${field} format` });
        }
      }
    });

    // Handle new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileExt = file.originalname.split('.').pop();
        const imageFileName = `product-${Date.now()}-${Math.round(Math.random()*1e9)}.${fileExt}`;
        const imagePath = path.join(__dirname, '../../uploads/products', imageFileName);
        fs.writeFileSync(imagePath, file.buffer);
        newImages.push({
          path: `products/${imageFileName}`,
          alt: `${product.name} - Image ${product.images.length + i + 1}`,
          isPrimary: product.images.length === 0 && i === 0
        });
      }
      product.images = [...product.images, ...newImages];
    }

    await product.save();

    await product.populate([
      { path: 'category', select: 'name slug' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({ product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/products/:id/toggle-status
// @desc    Toggle product active status
// @access  Private
router.put('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      product,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle product status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/products/:id/images/:imageIndex
// @desc    Remove specific image from product
// @access  Private
router.delete('/:id/images/:imageIndex', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (imageIndex < 0 || imageIndex >= product.images.length) {
      return res.status(400).json({ error: 'Invalid image index' });
    }

    product.images.splice(imageIndex, 1);

    // If we removed the primary image, make the first remaining image primary
    if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.json({ product, message: 'Image removed successfully' });
  } catch (error) {
    console.error('Remove image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;