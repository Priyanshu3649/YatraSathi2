const express = require('express');
const { 
  getUserProfile, 
  updateUserProfile, 
  updateEmployeeProfile,
  uploadProfileImage 
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get user profile
router.get('/', getUserProfile);

// Update user profile
router.put('/', updateUserProfile);

// Update employee profile
router.put('/employee', updateEmployeeProfile);

// Upload profile image
router.post('/upload-image', upload.single('image'), uploadProfileImage);

module.exports = router;