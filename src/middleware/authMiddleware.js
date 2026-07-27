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

    // Validate financial year permission if header is provided.
    // Customers always have access to the current active FY - skip the check entirely for them.
    // Admins and employees still get their permission checked.
    const fy = req.header('X-Financial-Year');
    if (fy && user.us_usertype !== 'customer') {
      const dbContext = require('../utils/dbContext');
      const hasPermission = await dbContext.checkUserFYPermission(user.us_usid, fy);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to access this financial year.' }
        });
      }
    }

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;