import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Settings from '../models/Settings.js';
import { adminAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for hero image uploads
const heroStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/hero/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for collection section image uploads
const collectionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/collection/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'collection-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
  }
};

const heroUpload = multer({
  storage: heroStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

const collectionUpload = multer({
  storage: collectionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// @route   GET /api/settings/hero
// @desc    Get hero section settings
// @access  Public (for storefront) / Private (for admin)
router.get('/hero', async (req, res) => {
  try {
    let heroSettings = await Settings.findOne({ key: 'hero' });

    if (!heroSettings) {
      // Return default values if not set
      return res.json({
        imageUrl: null,
        title: 'SUMMER COLLECTION',
        heading: 'FALL - WINTER\nCollection 2025',
        description: 'A specialist label creating luxury essentials. Ethically crafted with an unwavering commitment to exceptional quality.',
        buttonText: 'New Collection',
        buttonLink: '#new-collection'
      });
    }

    // If imageUrl is relative, prepend the base URL
    const imageUrl = heroSettings.value?.imageUrl;
    if (imageUrl && !imageUrl.startsWith('http')) {
      heroSettings.value.imageUrl = imageUrl;
    }

    res.json(heroSettings.value || {});
  } catch (error) {
    console.error('Get hero settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/settings/hero
// @desc    Update hero section settings
// @access  Private (Admin only)
router.post('/hero', [
  adminAuth,
  heroUpload.single('hero')
], async (req, res) => {
  try {
    let heroSettings = await Settings.findOne({ key: 'hero' });

    // Prepare the update data
    let updateData = {};

    // If a new image was uploaded
    if (req.file) {
      updateData.imageUrl = `/uploads/hero/${req.file.filename}`;
    }

    // Handle text updates from body
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.heading !== undefined) updateData.heading = req.body.heading;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.buttonText !== undefined) updateData.buttonText = req.body.buttonText;
    if (req.body.buttonLink !== undefined) updateData.buttonLink = req.body.buttonLink;

    // If deleting image
    if (req.body.imageUrl === null || req.body.imageUrl === 'null') {
      updateData.imageUrl = null;
    }

    if (!heroSettings) {
      // Create new settings
      heroSettings = new Settings({
        key: 'hero',
        value: updateData,
        updatedBy: req.user._id
      });
    } else {
      // Update existing settings (merge with existing data)
      heroSettings.value = {
        ...heroSettings.value,
        ...updateData
      };
      heroSettings.updatedBy = req.user._id;
    }

    await heroSettings.save();

    res.json({
      message: 'Hero settings updated successfully',
      ...heroSettings.value
    });
  } catch (error) {
    console.error('Update hero settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/settings/hero/text
// @desc    Update hero text content only (no image)
// @access  Private (Admin only)
router.put('/hero/text', adminAuth, async (req, res) => {
  try {
    const { title, heading, description, buttonText, buttonLink } = req.body;

    let heroSettings = await Settings.findOne({ key: 'hero' });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (heading !== undefined) updateData.heading = heading;
    if (description !== undefined) updateData.description = description;
    if (buttonText !== undefined) updateData.buttonText = buttonText;
    if (buttonLink !== undefined) updateData.buttonLink = buttonLink;

    if (!heroSettings) {
      heroSettings = new Settings({
        key: 'hero',
        value: updateData,
        updatedBy: req.user._id
      });
    } else {
      heroSettings.value = {
        ...heroSettings.value,
        ...updateData
      };
      heroSettings.updatedBy = req.user._id;
    }

    await heroSettings.save();

    res.json({
      message: 'Hero text updated successfully',
      ...heroSettings.value
    });
  } catch (error) {
    console.error('Update hero text error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/settings/collection
// @desc    Get collection section settings
// @access  Public (for storefront) / Private (for admin)
router.get('/collection', async (req, res) => {
  try {
    let collectionSettings = await Settings.findOne({ key: 'collection' });

    if (!collectionSettings) {
      // Return default values if not set
      return res.json({
        imageUrl: null,
        title: 'Our Collections',
        subtitle: 'Explore our curated selection of premium products'
      });
    }

    res.json(collectionSettings.value || {});
  } catch (error) {
    console.error('Get collection settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/settings/collection
// @desc    Update collection section settings
// @access  Private (Admin only)
router.post('/collection', [
  adminAuth,
  collectionUpload.single('collection')
], async (req, res) => {
  try {
    let collectionSettings = await Settings.findOne({ key: 'collection' });

    // Prepare the update data
    let updateData = {};

    // If a new image was uploaded
    if (req.file) {
      updateData.imageUrl = `/uploads/collection/${req.file.filename}`;
    }

    // Handle text updates from body
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.subtitle !== undefined) updateData.subtitle = req.body.subtitle;

    // If deleting image
    if (req.body.imageUrl === null || req.body.imageUrl === 'null') {
      updateData.imageUrl = null;
    }

    if (!collectionSettings) {
      // Create new settings
      collectionSettings = new Settings({
        key: 'collection',
        value: updateData,
        updatedBy: req.user._id
      });
    } else {
      // Update existing settings (merge with existing data)
      collectionSettings.value = {
        ...collectionSettings.value,
        ...updateData
      };
      collectionSettings.updatedBy = req.user._id;
    }

    await collectionSettings.save();

    res.json({
      message: 'Collection settings updated successfully',
      ...collectionSettings.value
    });
  } catch (error) {
    console.error('Update collection settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/settings/collection/text
// @desc    Update collection text content only (no image)
// @access  Private (Admin only)
router.put('/collection/text', adminAuth, async (req, res) => {
  try {
    const { title, subtitle } = req.body;

    let collectionSettings = await Settings.findOne({ key: 'collection' });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;

    if (!collectionSettings) {
      collectionSettings = new Settings({
        key: 'collection',
        value: updateData,
        updatedBy: req.user._id
      });
    } else {
      collectionSettings.value = {
        ...collectionSettings.value,
        ...updateData
      };
      collectionSettings.updatedBy = req.user._id;
    }

    await collectionSettings.save();

    res.json({
      message: 'Collection text updated successfully',
      ...collectionSettings.value
    });
  } catch (error) {
    console.error('Update collection text error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
