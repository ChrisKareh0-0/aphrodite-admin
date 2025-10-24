import mongoose from 'mongoose';
import Product from '../models/Product.js';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aphrodite';

async function fetchImageAsBuffer(imagePath) {
  // First try to read from local uploads directory
  const localPath = path.join(__dirname, '../../', imagePath);
  try {
    return await fs.promises.readFile(localPath);
  } catch (error) {
    console.log(`File not found locally at ${localPath}, trying remote URL...`);
    // If local file doesn't exist, try fetching from URL
    try {
      const response = await fetch(`http://localhost:3001${imagePath}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.buffer();
    } catch (error) {
      console.error(`Failed to fetch image from ${imagePath}:`, error);
      return null;
    }
  }
}

async function migrateImages() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // First, let's fix the schema to match what's in the database
    const schema = mongoose.model('Product').schema;
    schema.path('images').discriminator('url', new mongoose.Schema({
      url: String,
      alt: String,
      isPrimary: Boolean
    }));

    const products = await Product.find();
    console.log(`Found ${products.length} products to process`);

    for (const product of products) {
      console.log(`\nProcessing product: ${product.name}`);
      
      const newImages = [];
      
      if (!product.images) {
        console.log('No images found for this product');
        continue;
      }

      for (const image of product.images) {
        if (!image.url) {
          console.log('No URL found for this image, skipping');
          continue;
        }

        console.log(`Processing image: ${image.url}`);
        
        try {
          const imageBuffer = await fetchImageAsBuffer(image.url);
          
          if (imageBuffer) {
            newImages.push({
              data: imageBuffer,
              contentType: path.extname(image.url).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg',
              alt: image.alt,
              isPrimary: image.isPrimary
            });
            console.log('✅ Successfully processed image');
          } else {
            console.log('❌ Failed to process image');
          }
        } catch (error) {
          console.error(`Error processing image ${image.url}:`, error);
        }
      }

      if (newImages.length > 0) {
        product.images = newImages;
        await product.save();
        console.log(`✅ Saved ${newImages.length} images for product ${product.name}`);
      } else {
        console.log(`⚠️ No images were processed for product ${product.name}`);
      }
    }

    console.log('\nMigration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the migration
migrateImages().then(() => {
  console.log('Migration script finished');
  process.exit(0);
}).catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});