import express from 'express';
import mongoose from 'mongoose';
import { query, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const router = express.Router();

// @route   GET /api/public/categories
// @desc    Get active categories for frontend
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug description image sortOrder')
      .sort({ sortOrder: 1, name: 1 });

    res.json({ categories });
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/public/products
// @desc    Get active products for frontend with pagination and filters
// @access  Public
router.get('/products', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional(),
  query('search').optional().trim(),
  query('featured').optional().isBoolean(),
  query('sale').optional().isBoolean(),
  query('sort').optional().isIn(['newest', 'price-low', 'price-high', 'rating', 'popular'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isActive: true };

    if (req.query.category) {
      // Find category by slug or ID
      const isValidObjectId = mongoose.Types.ObjectId.isValid(req.query.category);
      const categoryQuery = isValidObjectId
        ? {
            $or: [
              { slug: req.query.category },
              { _id: req.query.category }
            ],
            isActive: true
          }
        : {
            slug: req.query.category,
            isActive: true
          };

      const category = await Category.findOne(categoryQuery);
      if (category) {
        filter.category = category._id;
      }
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    if (req.query.featured === 'true') {
      filter.isFeatured = true;
    }

    if (req.query.sale === 'true') {
      filter.isOnSale = true;
    }

    // Build sort
    let sort = { createdAt: -1 }; // default: newest first

    switch (req.query.sort) {
      case 'price-low':
        sort = { price: 1 };
        break;
      case 'price-high':
        sort = { price: -1 };
        break;
      case 'rating':
        sort = { 'rating.average': -1 };
        break;
      case 'popular':
        sort = { 'rating.count': -1 };
        break;
    }

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .select('name slug shortDescription price originalPrice images colors sizes stock rating isOnSale isFeatured createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    // Format products for frontend
    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      image: product.images?.length ? `/api/images/products/${product._id}/${product.images.find(img => img.isPrimary)?._id || product.images[0]._id}` : null,
      images: product.images?.map(img => `/api/images/products/${product._id}/${img._id}`) || [],
      colors: product.colors || [],
      sizes: product.sizes || [],
      stock: product.stock,
      rating: product.rating,
      isOnSale: product.isOnSale,
      isFeatured: product.isFeatured
    }));

    if (!formattedProducts || formattedProducts.length === 0) {
      return res.json({ products: '', message: 'No products found' });
    }
    res.json({
      products: formattedProducts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get public products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/public/products/:slug
// @desc    Get single product by slug for frontend
// @access  Public
router.get('/products/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true
    }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Format product for frontend
    const formattedProduct = {
      id: product._id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      images: product.images,
      colors: product.colors,
      sizes: product.sizes,
      stock: product.stock,
      rating: product.rating,
      tags: product.tags,
      isOnSale: product.isOnSale,
      isFeatured: product.isFeatured,
      seo: product.seo
    };

    res.json({ product: formattedProduct });
  } catch (error) {
    console.error('Get public product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/public/products/featured
// @desc    Get featured products for homepage
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({
      isActive: true,
      isFeatured: true
    })
      .populate('category', 'name slug')
      .select('name slug shortDescription price originalPrice images colors sizes stock rating isOnSale')
      .sort({ createdAt: -1 })
      .limit(limit);

    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      image: product.images?.length ? `/api/images/products/${product._id}/${product.images.find(img => img.isPrimary)?._id || product.images[0]._id}` : null,
      colors: product.colors || [],
      sizes: product.sizes || [],
      stock: product.stock,
      rating: product.rating,
      isOnSale: product.isOnSale
    }));

    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/public/stats
// @desc    Get basic stats for homepage
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const [productsCount, categoriesCount] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true })
    ]);

    res.json({
      stats: {
        products: productsCount,
        categories: categoriesCount
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;