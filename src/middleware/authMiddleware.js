const jwt = require('jsonwebtoken');
const { User, Role, UserTVL } = require('../models');

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
    
    // Check if this is a TVL user by ID prefix
    const isTVLUser = decoded.id.startsWith('ADM') || decoded.id.startsWith('EMP') || 
                      decoded.id.startsWith('ACC') || decoded.id.startsWith('CUS');
    
    let user = null;
    if (isTVLUser) {
      console.log('This is a TVL user, checking TVL database');
      user = await UserTVL.findByPk(decoded.id);
    } else {
      console.log('This is a regular user, checking main database');
      user = await User.findByPk(decoded.id);
    }
    
    console.log('User from database:', user ? user.toJSON() : 'User not found');
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Get user's role information
    // For TVL users, they have us_usertype field instead of us_roid
    if (!isTVLUser && user.us_roid) {
      const role = await Role.findByPk(user.us_roid);
      user.role = role;
    } else if (isTVLUser && user.us_usertype) {
      // For TVL users, set the role based on user type
      user.role = { ro_name: user.us_usertype };
    }

    req.user = user;
    console.log('Auth successful, user type:', user.us_usertype);
    console.log('Full user object:', user.toJSON());
    console.log('Calling next()');
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;