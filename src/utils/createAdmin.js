import User from '../models/User.js';

/**
 * Create default admin user if it doesn't exist
 */
export const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@aphrodite.com';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create new admin user
    const adminUser = new User({
      name: 'Admin User',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'super-admin',
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Default admin user created successfully');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  } catch (error) {
    console.error('❌ Error creating default admin user:', error.message);
  }
};
