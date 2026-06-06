const jwt = require('jsonwebtoken');
const { User, Role, UserTVL, RoleTVL } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    // First check in regular User table, then in UserTVL
    let user = await User.findByPk(decoded.id);
    let isTVLUser = false;
    
    if (!user) {
      // Check in UserTVL if not found in regular User
      user = await UserTVL.findByPk(decoded.id);
      isTVLUser = true;
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid. User not found.' });
    }

    // Get user's role information
    if (!isTVLUser && user.us_roid) {
      const role = await Role.findByPk(user.us_roid);
      user.role = role;
    } else if (isTVLUser && user.us_roid) {
      const role = await RoleTVL.findByPk(user.us_roid);
      user.role = role;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;