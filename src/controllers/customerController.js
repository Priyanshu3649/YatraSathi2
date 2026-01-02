const { UserTVL: User, CustomerTVL: Customer, BookingTVL: Booking, PaymentTVL: Payment, AccountTVL: Account, EmployeeTVL: Employee } = require('../models');
const { Op } = require('sequelize');

/**
 * Get Customer Dashboard Data
 */
const getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user.us_usid;

    // Get customer bookings
    const totalBookings = await Booking.count({
      where: { bk_cuid: userId }
    });

    const activeBookings = await Booking.count({
      where: { 
        bk_cuid: userId,
        bk_status: { [Op.in]: ['CONFIRMED', 'PENDING'] }
      }
    });

    // This month's bookings
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthBookings = await Booking.count({
      where: { 
        bk_cuid: userId,
        edtm: { [Op.gte]: thisMonth }
      }
    });

    // Recent bookings
    const recentBookings = await Booking.findAll({
      where: { bk_cuid: userId },
      order: [['edtm', 'DESC']],
      limit: 5
    });

    // Pending payments (mock data for now)
    const pendingPayments = await Payment.count({
      where: { pt_status: 'PENDING' }
    });

    // Mock pending invoices (replace with actual invoice logic)
    const pendingInvoices = [
      {
        id: 'INV001',
        amount: 5000,
        date: new Date(),
        status: 'PENDING'
      }
    ];

    const dashboardData = {
      stats: {
        totalBookings,
        activeBookings,
        pendingPayments,
        thisMonthBookings
      },
      recentBookings,
      pendingInvoices
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Customer dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard' } 
    });
  }
};

/**
 * Create New Booking
 */
const createBooking = async (req, res) => {
  try {
    const userId = req.user.us_usid;
    const {
      from,
      to,
      journeyDate,
      trainClass,
      berthPreference,
      passengers
    } = req.body;

    // Validate input
    if (!from || !to || !journeyDate || !passengers || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required booking details' }
      });
    }

    if (passengers.length > 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Maximum 6 passengers allowed per booking' }
      });
    }

    // Check if journey date is in the future
    const jDate = new Date(journeyDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (jDate < today) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Journey date cannot be in the past' }
      });
    }

    // Generate booking ID
    const timestamp = Date.now().toString().slice(-8);
    const bookingId = `BK${timestamp}`;

    // Create booking
    const booking = await Booking.create({
      bk_bkid: bookingId,
      bk_cuid: userId,
      bk_from: from,
      bk_to: to,
      bk_jdate: jDate,
      bk_class: trainClass || 'SL',
      bk_berth: berthPreference || 'NO_PREF',
      bk_pax: passengers.length,
      bk_status: 'PENDING',
      bk_amount: 0, // Will be calculated later
      eby: userId,
      mby: userId
    });

    // Create passenger records (implement Passenger model if needed)
    // For now, store passenger data in booking notes or separate table

    res.status(201).json({
      success: true,
      data: {
        bookingId: booking.bk_bkid,
        status: booking.bk_status,
        message: 'Booking created successfully. You will be contacted by our agent soon.'
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to create booking' } 
    });
  }
};

/**
 * Get Customer Bookings
 */
const getCustomerBookings = async (req, res) => {
  try {
    const userId = req.user.us_usid;
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = { bk_cuid: userId };
    if (status) {
      whereClause.bk_status = status;
    }

    const bookings = await Booking.findAndCountAll({
      where: whereClause,
      order: [['edtm', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        bookings: bookings.rows,
        pagination: {
          total: bookings.count,
          page: parseInt(page),
          pages: Math.ceil(bookings.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch bookings' } 
    });
  }
};

/**
 * Get Booking Details
 */
const getBookingDetails = async (req, res) => {
  try {
    const userId = req.user.us_usid;
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
      where: { 
        bk_bkid: bookingId,
        bk_cuid: userId 
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' }
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch booking details' } 
    });
  }
};

/**
 * Cancel Booking
 */
const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.us_usid;
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
      where: { 
        bk_bkid: bookingId,
        bk_cuid: userId 
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' }
      });
    }

    if (booking.bk_status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CANCELLED', message: 'Booking is already cancelled' }
      });
    }

    // Update booking status
    await booking.update({
      bk_status: 'CANCELLED',
      mby: userId
    });

    res.json({
      success: true,
      data: { message: 'Booking cancelled successfully' }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to cancel booking' } 
    });
  }
};

/**
 * Get all customers from cuXcustomer table
 */
const getAllCustomers = async (req, res) => {
  try {
    // Only admin can get all customers
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const customers = await Customer.findAll({ 
      attributes: [
        'cu_cusid', 'cu_usid', 'cu_custno', 'cu_custtype', 'cu_creditlimit', 
        'cu_creditdays', 'cu_discount', 'cu_active', 'cu_panno', 'cu_gstno'
      ], 
      include: [ 
        { 
          model: User, 
          attributes: ['us_fname', 'us_lname', 'us_email', 'us_phone', 'us_aadhaar'], 
          as: 'user' 
        }
      ] 
    });
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

module.exports = {
  getCustomerDashboard,
  createBooking,
  getCustomerBookings,
  getBookingDetails,
  cancelBooking,
  getAllCustomers
};