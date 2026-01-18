const { BookingTVL } = require('../models');

/**
 * Middleware to check if a customer can edit a booking based on status
 * Customers can only edit bookings with DRAFT status
 * Admins and employees can edit bookings regardless of status
 */
const canEditBooking = async (req, res, next) => {
  try {
    // Handle both 'id' and 'bookingId' parameter names
    const bookingId = req.params.id || req.params.bookingId;
    const userId = req.user.us_usid;
    const userRole = req.user.us_roid;

    // If user is admin or employee, allow editing
    const isAdminOrEmployee = ['ADM', 'AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT'].includes(userRole);
    if (isAdminOrEmployee) {
      return next();
    }

    // For customers, check if they own the booking and if it's in DRAFT status
    if (userRole === 'CUS') {
      const booking = await BookingTVL.findByPk(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Booking not found' }
        });
      }

      // Check if customer owns this booking
      if (booking.bk_usid !== userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied. You can only edit your own bookings.' }
        });
      }

      // Check if booking is in DRAFT status
      if (booking.bk_status !== 'DRAFT') {
        return res.status(403).json({
          success: false,
          error: { 
            code: 'EDIT_NOT_ALLOWED', 
            message: 'You can only edit bookings that are in DRAFT status. Once the booking status changes, editing is locked.' 
          }
        });
      }

      return next();
    }

    // For any other user type, deny access
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied. Invalid user role.' }
    });

  } catch (error) {
    console.error('Booking authorization error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Authorization check failed' }
    });
  }
};

/**
 * Middleware to check if a customer can view a booking
 * Customers can only view their own bookings
 * Admins and employees can view all bookings
 */
const canViewBooking = async (req, res, next) => {
  try {
    // Handle both 'id' and 'bookingId' parameter names
    const bookingId = req.params.id || req.params.bookingId;
    const userId = req.user.us_usid;
    const userRole = req.user.us_roid;

    // If user is admin or employee, allow viewing
    const isAdminOrEmployee = ['ADM', 'AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT'].includes(userRole);
    if (isAdminOrEmployee) {
      return next();
    }

    // For customers, check if they own the booking
    if (userRole === 'CUS') {
      const booking = await BookingTVL.findByPk(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Booking not found' }
        });
      }

      // Check if customer owns this booking
      if (booking.bk_usid !== userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied. You can only view your own bookings.' }
        });
      }

      return next();
    }

    // For any other user type, deny access
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied. Invalid user role.' }
    });

  } catch (error) {
    console.error('Booking view authorization error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Authorization check failed' }
    });
  }
};

/**
 * Middleware to check if a customer can cancel a booking
 * Customers can cancel bookings in DRAFT or PENDING status
 * Admins and employees can cancel bookings regardless of status
 */
const canCancelBooking = async (req, res, next) => {
  try {
    // Handle both 'id' and 'bookingId' parameter names
    const bookingId = req.params.id || req.params.bookingId;
    const userId = req.user.us_usid;
    const userRole = req.user.us_roid;

    // If user is admin or employee, allow cancellation
    const isAdminOrEmployee = ['ADM', 'AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT'].includes(userRole);
    if (isAdminOrEmployee) {
      return next();
    }

    // For customers, check if they own the booking and if it's cancellable
    if (userRole === 'CUS') {
      const booking = await BookingTVL.findByPk(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Booking not found' }
        });
      }

      // Check if customer owns this booking
      if (booking.bk_usid !== userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied. You can only cancel your own bookings.' }
        });
      }

      // Check if booking is in a cancellable status
      const cancellableStatuses = ['DRAFT', 'PENDING'];
      if (!cancellableStatuses.includes(booking.bk_status)) {
        return res.status(403).json({
          success: false,
          error: { 
            code: 'CANCEL_NOT_ALLOWED', 
            message: 'You can only cancel bookings that are in DRAFT or PENDING status.' 
          }
        });
      }

      return next();
    }

    // For any other user type, deny access
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied. Invalid user role.' }
    });

  } catch (error) {
    console.error('Booking cancellation authorization error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Authorization check failed' }
    });
  }
};

module.exports = {
  canEditBooking,
  canViewBooking,
  canCancelBooking
};