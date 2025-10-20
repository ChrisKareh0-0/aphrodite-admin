const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aphrodite');
    console.log('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@aphrodite.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'super-admin'
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create categories
    const categories = [
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion clothing collection',
        isActive: true,
        sortOrder: 1,
        createdBy: adminUser._id
      },
      {
        name: 'Shoes',
        slug: 'shoes',
        description: 'Footwear collection',
        isActive: true,
        sortOrder: 2,
        createdBy: adminUser._id
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Fashion accessories',
        isActive: true,
        sortOrder: 3,
        createdBy: adminUser._id
      }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log('Created categories');

    // Create sample products
    const products = [
      {
        name: 'Aphrodite Summer Dress',
        slug: 'aphrodite-summer-dress',
        description: 'Elegant summer dress perfect for any occasion. Made from high-quality fabric with excellent craftsmanship.',
        shortDescription: 'Elegant summer dress',
        price: 89.99,
        originalPrice: 109.99,
        category: createdCategories[0]._id,
        stock: 25,
        sku: 'APH-DRESS-001',
        colors: [
          { name: 'Red', code: '#FF0000', available: true },
          { name: 'Blue', code: '#0000FF', available: true },
          { name: 'Black', code: '#000000', available: true }
        ],
        sizes: [
          { name: 'S', available: true },
          { name: 'M', available: true },
          { name: 'L', available: true },
          { name: 'XL', available: true }
        ],
        tags: ['summer', 'elegant', 'dress', 'fashion'],
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        createdBy: adminUser._id
      },
      {
        name: 'Classic Sneakers',
        slug: 'classic-sneakers',
        description: 'Comfortable and stylish sneakers for everyday wear. Premium materials and modern design.',
        shortDescription: 'Comfortable classic sneakers',
        price: 79.99,
        category: createdCategories[1]._id,
        stock: 40,
        sku: 'APH-SHOES-001',
        colors: [
          { name: 'White', code: '#FFFFFF', available: true },
          { name: 'Black', code: '#000000', available: true }
        ],
        sizes: [
          { name: '37', available: true },
          { name: '38', available: true },
          { name: '39', available: true },
          { name: '40', available: true },
          { name: '41', available: true },
          { name: '42', available: true }
        ],
        tags: ['sneakers', 'comfortable', 'casual'],
        isActive: true,
        isFeatured: true,
        createdBy: adminUser._id
      },
      {
        name: 'Designer Handbag',
        slug: 'designer-handbag',
        description: 'Luxury designer handbag crafted from premium leather. Perfect accessory for any outfit.',
        shortDescription: 'Luxury designer handbag',
        price: 199.99,
        category: createdCategories[2]._id,
        stock: 15,
        sku: 'APH-BAG-001',
        colors: [
          { name: 'Brown', code: '#8B4513', available: true },
          { name: 'Black', code: '#000000', available: true }
        ],
        tags: ['handbag', 'luxury', 'leather', 'designer'],
        isActive: true,
        isFeatured: false,
        createdBy: adminUser._id
      }
    ];

    await Product.insertMany(products);
    console.log('Created sample products');

    console.log('\n=== SEED COMPLETE ===');
    console.log(`Admin credentials:`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log(`\nServer: http://localhost:3001`);
    console.log(`Admin Panel: http://localhost:3001/admin`);

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

seedDatabase();