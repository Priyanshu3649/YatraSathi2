const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const auth = async (req, res, next) => {
  try {
    console.log('=== Auth Middleware Execution ===');
    console.log('Request headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token from header:', token);
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    console.log('Decoded token:', decoded);
    
    console.log('Looking for user with ID:', decoded.id);
    const user = await User.findByPk(decoded.id);
    console.log('User from database:', user ? user.toJSON() : 'User not found');
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Get user's role information
    if (user.us_roid) {
      const role = await Role.findByPk(user.us_roid);
      user.role = role;
    }

    req.user = user;
    console.log('Auth successful, calling next()');
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;