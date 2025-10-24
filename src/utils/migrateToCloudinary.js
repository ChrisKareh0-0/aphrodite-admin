import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { uploadImage } from './cloudinary.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const migrateImages = async () => {
  try {
    const products = await Product.find({ 'images.data': { $exists: true } });
    console.log(`Found ${products.length} products with binary images to migrate`);

    for (const product of products) {
      console.log(`Migrating images for product: ${product.name}`);
      
      const updatedImages = [];
      for (const [index, image] of product.images.entries()) {
        if (image.data) {
          try {
            const base64Image = `data:${image.contentType};base64,${image.data.toString('base64')}`;
            const uploadResult = await uploadImage(base64Image);
            
            updatedImages.push({
              url: uploadResult.url,
              public_id: uploadResult.public_id,
              alt: image.alt || `${product.name} - Image ${index + 1}`,
              isPrimary: image.isPrimary || false
            });
            
            console.log(`✓ Successfully uploaded image ${index + 1}`);
          } catch (error) {
            console.error(`Error uploading image ${index + 1}:`, error);
          }
        } else if (image.url) {
          // If it's already a URL-based image, keep it
          updatedImages.push(image);
        }
      }

      product.images = updatedImages;
      await product.save();
      console.log(`✓ Successfully updated product: ${product.name}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateImages();