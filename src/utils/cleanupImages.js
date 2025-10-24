import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aphrodite';

async function cleanupImages() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find();
    console.log(`Found ${products.length} products to process`);

    for (const product of products) {
      console.log(`\nProcessing product: ${product.name}`);
      
      // Store the original image count
      const originalImageCount = product.images?.length || 0;
      
      // Clear all images
      product.images = [];
      await product.save();
      
      console.log(`✅ Removed ${originalImageCount} images from product ${product.name}`);
    }

    console.log('\nCleanup complete!');
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the cleanup
cleanupImages().then(() => {
  console.log('Cleanup script finished');
  process.exit(0);
}).catch(error => {
  console.error('Cleanup script failed:', error);
  process.exit(1);
});