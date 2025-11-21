const express = require('express');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationHistory,
  deleteNotification
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Notification routes
router.get('/', getUserNotifications);
router.get('/history', getNotificationHistory);
router.put('/:notificationId/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:notificationId', deleteNotification);

module.exports = router;