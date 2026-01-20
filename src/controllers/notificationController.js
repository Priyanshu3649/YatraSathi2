// Simple in-memory notifications (in production, this would be stored in a database)
let notifications = [];

// Create a notification
const createNotification = (userId, title, message, type = 'info') => {
  const notification = {
    id: Date.now(),
    userId,
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date()
  };
  
  notifications.push(notification);
  
  // Keep only the last 1000 notifications to prevent memory issues
  if (notifications.length > 1000) {
    notifications = notifications.slice(-1000);
  }
  
  return notification;
};

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get unread notifications for user
    const userNotifications = notifications
      .filter(notification => 
        notification.userId.toString() === userId.toString() && 
        !notification.isRead
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      totalNotifications: userNotifications.length,
      notifications: userNotifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    const notification = notifications.find(n => 
      n.id === parseInt(notificationId) && 
      n.userId.toString() === userId.toString()
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.isRead = true;
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    notifications.forEach(notification => {
      if (notification.userId.toString() === userId.toString()) {
        notification.isRead = true;
      }
    });
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get notification history
const getNotificationHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all notifications for user
    const userNotifications = notifications
      .filter(notification => 
        notification.userId.toString() === userId.toString()
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      totalNotifications: userNotifications.length,
      notifications: userNotifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    const notificationIndex = notifications.findIndex(n => 
      n.id === parseInt(notificationId) && 
      n.userId.toString() === userId.toString()
    );
    
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notifications.splice(notificationIndex, 1);
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send booking confirmation notification
const sendBookingConfirmation = (userId, bookingId) => {
  return createNotification(
    userId,
    'Booking Confirmation',
    `Your booking request #${bookingId} has been confirmed. An agent will contact you shortly.`,
    'success'
  );
};

// Send booking assignment notification
const sendBookingAssignment = (userId, bookingId, employeeName) => {
  return createNotification(
    userId,
    'Booking Assigned',
    `Your booking request #${bookingId} has been assigned to ${employeeName}.`,
    'info'
  );
};

// Send payment received notification
const sendPaymentReceived = (userId, amount, bookingId) => {
  return createNotification(
    userId,
    'Payment Received',
    `Payment of ${amount} for booking #${bookingId} has been received.`,
    'success'
  );
};

// Send PNR confirmation notification
const sendPNRConfirmation = (userId, pnrNumber, bookingId) => {
  return createNotification(
    userId,
    'PNR Confirmed',
    `PNR ${pnrNumber} for booking #${bookingId} has been confirmed.`,
    'success'
  );
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationHistory,
  deleteNotification,
  sendBookingConfirmation,
  sendBookingAssignment,
  sendPaymentReceived,
  sendPNRConfirmation
};