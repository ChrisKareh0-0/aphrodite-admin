#!/usr/bin/env node

/**
 * Test MongoDB Connection
 * Run this to verify your MongoDB connection works
 * Usage: node test-mongodb-connection.js
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aphrodite';

console.log('\n🔍 Testing MongoDB Connection...\n');
console.log('URI exists:', !!process.env.MONGODB_URI);
console.log('URI length:', mongoUri.length);
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

const mongoOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
  family: 4
};

console.log('\n⏳ Attempting connection with options:');
console.log(JSON.stringify(mongoOptions, null, 2));
console.log('');

const startTime = Date.now();

mongoose.connect(mongoUri, mongoOptions)
  .then(() => {
    const duration = Date.now() - startTime;
    console.log(`\n✅ SUCCESS! MongoDB connected in ${duration}ms\n`);
    console.log('📊 Connection Details:');
    console.log('  Database:', mongoose.connection.name);
    console.log('  Host:', mongoose.connection.host);
    console.log('  Port:', mongoose.connection.port);
    console.log('  Ready State:', mongoose.connection.readyState);
    console.log('');
    
    // Test a simple query
    console.log('🔍 Testing database query...');
    return mongoose.connection.db.admin().listDatabases();
  })
  .then((result) => {
    console.log('✅ Query successful!');
    console.log('📋 Available databases:', result.databases.map(db => db.name).join(', '));
    console.log('');
    process.exit(0);
  })
  .catch((err) => {
    const duration = Date.now() - startTime;
    console.error(`\n❌ FAILED after ${duration}ms\n`);
    console.error('Error Details:');
    console.error('  Name:', err.name);
    console.error('  Message:', err.message);
    if (err.code) console.error('  Code:', err.code);
    if (err.codeName) console.error('  Code Name:', err.codeName);
    console.error('');
    
    console.log('💡 Common Solutions:');
    console.log('  1. Check MongoDB Atlas Network Access (IP Whitelist)');
    console.log('  2. Verify cluster is active (not paused)');
    console.log('  3. Confirm username/password are correct');
    console.log('  4. Check if free tier connection limit is reached');
    console.log('');
    
    process.exit(1);
  });

// Timeout after 60 seconds
setTimeout(() => {
  console.error('\n⏰ Connection test timed out after 60 seconds\n');
  process.exit(1);
}, 60000);
