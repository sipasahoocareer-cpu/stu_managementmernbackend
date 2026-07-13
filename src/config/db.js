const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return;
    }

    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Admin@1234',
      role: 'admin',
    });

    console.log(`✅ Seeded default admin user: ${adminUser.email}`);
  } catch (error) {
    console.error(`⚠️ Seed admin user failed: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await seedAdminUser();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
