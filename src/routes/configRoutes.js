const express = require('express');
const {
  getConfig,
  updateConfig,
  getConfigValue,
  resetConfig
} = require('../controllers/configController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Admin routes
router.get('/', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, getConfig);

router.put('/', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, updateConfig);

router.delete('/reset', async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
  next();
}, resetConfig);

// Public routes (with restricted access)
router.get('/:key', getConfigValue);

module.exports = router;