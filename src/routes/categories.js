import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/categories/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
    }
  }
});

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('createdBy', 'name email')
      .sort({ sortOrder: 1, name: 1 });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    console.error('Stack:', error.stack);
    try {
      const mongoose = await import('mongoose');
      console.error('Mongoose connection readyState:', mongoose.connection.readyState);
    } catch (e) {
      console.error('Could not import mongoose for diagnostics:', e);
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Private
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private
router.post('/', [
  adminAuth,
  upload.single('image'),
  body('name').not().isEmpty().trim().escape(),
  body('description').optional().trim().escape(),
  body('sortOrder').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, sortOrder = 0 } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const categoryData = {
      name,
      description,
      sortOrder: parseInt(sortOrder),
      createdBy: req.user._id
    };

    if (req.file) {
      categoryData.image = `/uploads/categories/${req.file.filename}`;
    }

    const category = new Category(categoryData);
    await category.save();

    await category.populate('createdBy', 'name email');

    res.status(201).json({ category });
  } catch (error) {
    console.error('Create category error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private
router.put('/:id', [
  adminAuth,
  upload.single('image'),
  body('name').optional().not().isEmpty().trim().escape(),
  body('description').optional().trim().escape(),
  body('sortOrder').optional().isNumeric(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { name, description, sortOrder, isActive } = req.body;

    // Check if new name conflicts with existing category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(400).json({ error: 'Category name already exists' });
      }
      category.name = name;
    }

    if (description !== undefined) category.description = description;
    if (sortOrder !== undefined) category.sortOrder = parseInt(sortOrder);
    if (isActive !== undefined) category.isActive = isActive;

    if (req.file) {
      category.image = `/uploads/categories/${req.file.filename}`;
    }

    await category.save();
    await category.populate('createdBy', 'name email');

    res.json({ category });
  } catch (error) {
    console.error('Update category error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: req.params.id });

    if (productCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category. It has ${productCount} product(s) associated with it.`
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/categories/:id/toggle-status
// @desc    Toggle category active status
// @access  Private
router.put('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      category,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle category status error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;