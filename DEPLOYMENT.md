# Aphrodite Backend - Deployment Guide

This is the backend API and admin panel for the Aphrodite e-commerce platform.

## 🚀 Quick Deploy

### Deploy to Railway (Recommended)

1. **Create Railway Account**: https://railway.app
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select this repository**
4. **Add Environment Variables** (see below)
5. **Deploy!**

Railway will automatically:
- Detect Node.js
- Install dependencies
- Run `node src/server.js`

### Deploy to Render

1. **Create Render Account**: https://render.com
2. **Click "New" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure**:
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
5. **Add Environment Variables** (see below)
6. **Create Web Service**

## 🔐 Required Environment Variables

Add these in your hosting platform dashboard:

```env
# MongoDB Connection (use MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aphrodite?retryWrites=true&w=majority

# Server Config
NODE_ENV=production
PORT=3001

# JWT Secret (generate a random 64-character string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Admin Credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword123!

# Frontend URL (your Vercel deployment URL)
FRONTEND_URL=https://yourdomain.com
```

### Generate JWT Secret

```bash
# Run this command to generate a secure JWT secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📦 Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Account**: https://www.mongodb.com/cloud/atlas
2. **Create a Free Cluster**
3. **Create Database User**:
   - Go to "Database Access"
   - Add new user with password
   - Save credentials
4. **Whitelist IP**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
5. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `aphrodite`

## 🏗️ Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your local MongoDB URI

# Run development server
npm run dev

# Or production mode
npm start
```

## 📁 Project Structure

```
aphrodite-backend/
├── src/
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, validation
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   └── server.js       # Entry point
├── admin-panel/        # React admin dashboard
├── uploads/            # Uploaded images
├── package.json
└── .env.example
```

## 🔗 API Endpoints

- **Base URL**: `https://your-backend-url.com/api`
- **Admin Panel**: `https://your-backend-url.com/admin`
- **Health Check**: `https://your-backend-url.com/api/health`

### Public Endpoints
- `GET /api/public/products` - Get all products
- `GET /api/public/products/:slug` - Get product details
- `GET /api/public/categories` - Get all categories
- `POST /api/orders/create` - Create order

### Admin Endpoints (require authentication)
- `POST /api/auth/login` - Admin login
- `GET /api/products` - Manage products
- `GET /api/categories` - Manage categories
- `GET /api/orders` - View orders
- `GET /api/dashboard/stats` - Dashboard statistics

## 🛡️ Security Checklist

- [ ] Change default admin credentials
- [ ] Use strong JWT_SECRET (64+ characters)
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas (not local MongoDB)
- [ ] Set proper FRONTEND_URL for CORS
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Keep dependencies updated

## 📊 Monitoring

### Health Check
```bash
curl https://your-backend-url.com/api/health
```

Should return:
```json
{
  "status": "OK",
  "message": "Aphrodite API is running"
}
```

### Check Logs
- **Railway**: Dashboard → Deployments → View Logs
- **Render**: Dashboard → Logs tab

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check MONGODB_URI is correct
- Verify database user credentials
- Ensure IP whitelist includes 0.0.0.0/0
- Check MongoDB Atlas cluster is running

### CORS Errors
- Verify FRONTEND_URL matches your Vercel URL exactly
- Include https:// in the URL
- Check no trailing slash

### 500 Server Errors
- Check environment variables are set
- View logs in hosting platform
- Verify MongoDB connection
- Check JWT_SECRET is set

## 💰 Cost Estimate

### Free Tier (Development)
- Railway: $5 free credit/month
- Render: Free tier available
- MongoDB Atlas: 512MB free forever
- **Total: $0-5/month**

### Production
- Railway: ~$10/month
- MongoDB Atlas: $9/month (M2 tier)
- **Total: ~$19/month**

## 🔄 Continuous Deployment

Both Railway and Render support automatic deployments:
- Push to `main` branch → Auto deploy
- Pull requests → Preview deployments
- Rollback to previous versions anytime

## 📝 Post-Deployment Steps

1. **Test Health Endpoint**:
   ```bash
   curl https://your-backend-url.com/api/health
   ```

2. **Login to Admin Panel**:
   - Visit `https://your-backend-url.com/admin`
   - Login with ADMIN_EMAIL and ADMIN_PASSWORD

3. **Create Products and Categories**

4. **Update Frontend** with backend URL

5. **Test Order Creation** from storefront

## 🆘 Support

- **Issues**: Create an issue in this repository
- **Documentation**: See README.md
- **MongoDB Docs**: https://docs.mongodb.com/
- **Railway Docs**: https://docs.railway.app/
- **Render Docs**: https://render.com/docs

