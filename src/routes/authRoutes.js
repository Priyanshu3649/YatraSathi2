const express = require('express');
const { registerUser, loginUser, getUserProfile, requestPasswordReset, resetPassword, verifyEmail, logoutUser, getUserSessions, logoutAllDevices } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

console.log('Auth routes module loaded');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Test route
router.get('/test', (req, res) => {
  console.log('Test route called');
  console.log('Request headers:', req.headers);
  res.json({ message: 'Test route working' });
});

// Protected routes
router.get('/profile', authMiddleware, getUserProfile);
router.post('/logout', authMiddleware, logoutUser);
router.get('/sessions', authMiddleware, getUserSessions);
router.post('/logout-all', authMiddleware, logoutAllDevices);

console.log('Auth routes registered');

module.exports = router;