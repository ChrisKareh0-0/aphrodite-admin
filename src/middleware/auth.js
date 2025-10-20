import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user && (req.user.role === 'admin' || req.user.role === 'super-admin')) {
        next();
      } else {
        res.status(403).json({ error: 'Access denied. Admin rights required.' });
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Authorization failed' });
  }
};

const superAdminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user && req.user.role === 'super-admin') {
        next();
      } else {
        res.status(403).json({ error: 'Access denied. Super admin rights required.' });
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Authorization failed' });
  }
};

export { auth, adminAuth };