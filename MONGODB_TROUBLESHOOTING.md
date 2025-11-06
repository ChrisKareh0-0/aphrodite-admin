# MongoDB Connection Timeout Fix for Render

## Problem
`MongoNetworkTimeoutError: connection timed out`

## Root Causes & Solutions

### 1. ✅ IP Whitelist (Most Common Issue)

**MongoDB Atlas restricts connections by IP address. Render uses dynamic IPs.**

**Solution:**
1. Go to [MongoDB Atlas Console](https://cloud.mongodb.com)
2. Click on your cluster → **Network Access**
3. Click **"Add IP Address"**
4. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
5. Click **"Confirm"**

⚠️ **Security Note:** For production, get Render's static IP addresses and whitelist only those.

---

### 2. ✅ Connection String Parameters

Your current connection string should include:
```
?retryWrites=true&w=majority&appName=Cluster0&maxPoolSize=10&serverSelectionTimeoutMS=30000
```

**Update on Render:**
1. Go to Render Dashboard → Your Service → **Environment**
2. Update `MONGODB_URI` to:
```
mongodb+srv://chriskareh_db_user:TxnyADoZrTnR8JJx@cluster0.jpqcoq4.mongodb.net/aphrodite?retryWrites=true&w=majority&appName=Cluster0&maxPoolSize=10&serverSelectionTimeoutMS=30000&socketTimeoutMS=45000
```

---

### 3. ✅ MongoDB Atlas Cluster Status

**Check if your cluster is paused or sleeping:**

1. Go to MongoDB Atlas
2. Check cluster status (should be green/active)
3. Free tier clusters may pause after inactivity
4. Click **"Resume"** if paused

---

### 4. ✅ Connection Pool Settings

Already fixed in the code with:
- `maxPoolSize: 10` - More connections available
- `minPoolSize: 2` - Always keep some connections alive
- `retryWrites: true` - Automatically retry failed writes
- `heartbeatFrequencyMS: 10000` - Check connection health

---

### 5. ✅ Render Region vs MongoDB Region

**Performance issue if regions don't match:**

- Check your MongoDB Atlas cluster region (e.g., `us-east-1`)
- Check your Render service region
- They should be close geographically

**To change Render region:**
- Redeploy service in a region closer to your MongoDB cluster

---

### 6. ✅ MongoDB Atlas Free Tier Limits

**M0 (Free) clusters have limitations:**
- Max 100 connections
- Limited bandwidth
- May throttle connections

**Solution:**
- Upgrade to M2 or higher for production
- Or optimize connection usage (already done in code)

---

## Quick Fix Checklist

1. [ ] Add `0.0.0.0/0` to MongoDB Atlas Network Access
2. [ ] Verify MongoDB cluster is active (not paused)
3. [ ] Update MONGODB_URI with timeout parameters
4. [ ] Check MongoDB Atlas metrics for connection count
5. [ ] Deploy updated backend code to Render
6. [ ] Monitor Render logs for successful connection

---

## Testing Locally

Test your MongoDB connection:

```bash
cd /Users/chris/dev/NextGem/aphrodite-separated/aphrodite-backend
node -e "const mongoose = require('mongoose'); mongoose.connect('YOUR_MONGODB_URI').then(() => console.log('Connected!')).catch(err => console.error(err));"
```

---

## Monitoring

After deploying, check Render logs for:
- ✅ `MongoDB connected successfully`
- ❌ `MongoDB connection FAILED`
- ⏳ `Retrying in...` (automatic retry)

---

## Production Best Practices

1. **Use MongoDB Connection Pooling** ✅ (Done)
2. **Enable Auto-Reconnect** ✅ (Done)
3. **Set Proper Timeouts** ✅ (Done)
4. **Monitor Connection Health** ✅ (Done)
5. **Whitelist Specific IPs** ⚠️ (Use 0.0.0.0/0 temporarily)
6. **Upgrade from Free Tier** 💰 (For production)

---

## Emergency Fix

If issues persist, use MongoDB's connection string directly without modifications:

```javascript
// In server.js, temporarily add debug logging:
console.log('Full MongoDB URI:', mongoUri);
```

Check for:
- Hidden characters
- Incorrect password
- Wrong database name
- Missing parameters
