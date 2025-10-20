# Database Setup for Aphrodite Backend

Your backend is running successfully on port 3001! You just need to set up MongoDB. Here are your options:

## Option 1: Docker (Recommended - Fastest)

1. **Start Docker Desktop** on your Mac
2. **Run this command:**
   ```bash
   docker run -d --name aphrodite-mongodb -p 27017:27017 mongo:7.0
   ```
3. **Your database will be ready!**

## Option 2: MongoDB Atlas (Cloud - Production Ready)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign up for free
3. Create a new cluster (free tier)
4. Get your connection string
5. Update your `.env` file with the Atlas connection string

## Option 3: Local MongoDB Installation

If you prefer local installation:
```bash
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

## Quick Test

Once you have MongoDB running, test your backend:

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Seed the database:**
   ```bash
   node src/utils/seed.js
   ```

3. **Visit admin panel:**
   - URL: http://localhost:3001/admin
   - Login: admin@aphrodite.com / admin123

## API Endpoints Available

- **Health Check**: http://localhost:3001/api/health
- **Admin Panel**: http://localhost:3001/admin
- **Public Products**: http://localhost:3001/api/public/products
- **Public Categories**: http://localhost:3001/api/public/categories

Your backend server is working perfectly - just connect the database and you're all set!