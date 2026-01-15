const { UserTVL: User, CustomerTVL: Customer, Booking, PaymentTVL: Payment, AccountTVL: Account, EmployeeTVL: Employee } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models/baseModel');

/**
 * Get Customer Dashboard Data
 */
const getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user.us_usid;

    // Get customer bookings
    const totalBookings = await Booking.count({
      where: { bk_usid: userId }
    });

    const activeBookings = await Booking.count({
      where: { 
        bk_usid: userId,
        bk_status: { [Op.in]: ['CONFIRMED', 'PENDING'] }
      }
    });

    // This month's bookings
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthBookings = await Booking.count({
      where: { 
        bk_usid: userId,
        edtm: { [Op.gte]: thisMonth }
      }
    });

    // Recent bookings
    const recentBookings = await Booking.findAll({
      where: { bk_usid: userId },
      order: [['edtm', 'DESC']],
      limit: 5
    });

    // Pending payments for this customer
    const pendingPayments = await Payment.count({
      where: { 
        pt_custid: userId,
        pt_status: 'PENDING' 
      }
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
    console.log('Received booking request:', req.body);
    console.log('User ID:', req.user.us_usid);
    
    const userId = req.user.us_usid;
    const {
      from,
      to,
      journeyDate,
      trainClass,
      berthPreference,
      passengers,
      trainPreferences = []
    } = req.body;
    
    console.log('Parsed booking data:', {
      from, to, journeyDate, trainClass, berthPreference, 
      passengerCount: passengers.length,
      trainPreferences
    });

    // Validate input
    if (!from || !to || !journeyDate || !passengers || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required booking details' }
      });
    }

// Removed passenger limit validation - customers can add unlimited passengers

    // Validate journey date
    const jDate = new Date(journeyDate);
    if (isNaN(jDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid journey date format' }
      });
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (jDate < tomorrow) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Journey date cannot be in the past or today' }
      });
    }
    
    // Check if stations exist in the station table, create them if they don't
    const { StationTVL: Station } = require('../models');
    
    let fromStation = await Station.findByPk(from);
    let toStation = await Station.findByPk(to);
    
    // Create from station if it doesn't exist
    if (!fromStation) {
      fromStation = await Station.create({
        st_stid: from,
        st_stcode: from, // Use the station ID as the station code
        st_stname: from.toUpperCase(), // Use uppercase as station name
        st_city: from.toUpperCase(), // Use station code as city if not provided
        st_state: 'UNKNOWN', // Default state
        eby: userId,
        mby: userId
      });
    }
    
    // Create to station if it doesn't exist
    if (!toStation) {
      toStation = await Station.create({
        st_stid: to,
        st_stcode: to, // Use the station ID as the station code
        st_stname: to.toUpperCase(), // Use uppercase as station name
        st_city: to.toUpperCase(), // Use station code as city if not provided
        st_state: 'UNKNOWN', // Default state
        eby: userId,
        mby: userId
      });
    }
    
    // Generate unique booking number
    const timestamp = Date.now().toString().slice(-8);
    const bookingNumber = `BKN${timestamp}${Math.floor(Math.random() * 100)}`; // Add random suffix to ensure uniqueness

    const { Passenger } = require('../models');
    const transaction = await sequelize.transaction();
    
    try {
      // Create booking - let bk_bkid be auto-generated
      const booking = await Booking.create({
        bk_bkno: bookingNumber,
        bk_usid: userId,
        bk_fromst: from,
        bk_tost: to,
        bk_trvldt: jDate,
        bk_class: trainClass || 'SL',
        bk_berthpref: berthPreference || 'NO_PREF',
        bk_totalpass: passengers.length,
        bk_status: 'PENDING',
        bk_remarks: trainPreferences.length > 0 ? `Train Preferences: ${trainPreferences.join(', ')}` : null,
        eby: userId,
        mby: userId
      }, { transaction });

      // Create passenger records in the passenger table
      for (const passenger of passengers) {
        await Passenger.create({
          ps_bkid: booking.bk_bkid, // Link to the newly created booking
          ps_fname: passenger.name.split(' ')[0] || '', // First name
          ps_lname: passenger.name.split(' ').slice(1).join(' ') || null, // Last name (if any)
          ps_age: parseInt(passenger.age) || 0,
          ps_gender: passenger.gender || 'M',
          ps_berthpref: passenger.berthPreference || null,
          ps_active: 1, // Active passenger
          eby: userId,
          mby: userId
        }, { transaction });
      }
      
      // Commit the transaction
      await transaction.commit();
      
      let confirmationMessage = 'Booking created successfully. You will be contacted by our agent soon.';
      if (trainPreferences.length > 0) {
        confirmationMessage += ` Train preferences noted: ${trainPreferences.join(', ')}.`;
      }
      
      res.status(201).json({
        success: true,
        data: {
          bookingId: booking.bk_bkid.toString(), // Convert to string to match frontend expectations
          status: booking.bk_status,
          message: confirmationMessage
        }
      });
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Create booking error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      originalError: error.original ? error.original : 'No original error'
    });
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'SERVER_ERROR', 
        message: error.message || 'Failed to create booking',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      } 
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

    const whereClause = { bk_usid: userId };
    if (status) {
      whereClause.bk_status = status;
    }

    // Import models
    const models = require('../models');
    const { Passenger, StationTVL: Station } = models;
    
    const bookings = await Booking.findAndCountAll({
      where: whereClause,
      order: [['edtm', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    // Transform data to match frontend expectations and get actual passenger counts
    const transformedBookings = await Promise.all(bookings.rows.map(async (booking) => {
      // Get passenger count for this booking
      const passengerCount = await Passenger.count({
        where: { 
          ps_bkid: booking.bk_bkid,
          ps_active: 1  // Only count active passengers
        }
      });
      
      // Get station names
      let fromStationName = booking.bk_fromst || 'Unknown';
      let toStationName = booking.bk_tost || 'Unknown';
      
      try {
        const fromStation = await Station.findByPk(booking.bk_fromst);
        if (fromStation) {
          fromStationName = fromStation.st_stname || fromStation.st_stcode || booking.bk_fromst;
        }
        
        const toStation = await Station.findByPk(booking.bk_tost);
        if (toStation) {
          toStationName = toStation.st_stname || toStation.st_stcode || booking.bk_tost;
        }
      } catch (stationError) {
        console.warn('Error fetching station names:', stationError.message);
        // Fall back to station codes if station lookup fails
      }
      
      return {
        ...booking.toJSON(),
        bk_pax: passengerCount,  // Override with actual passenger count from passenger table
        bk_from: fromStationName,  // Add full from station name
        bk_to: toStationName,      // Add full to station name
        bk_fromst: booking.bk_fromst, // Keep original station code
        bk_tost: booking.bk_tost      // Keep original station code
      };
    }));
    
    // Debug log to see what we're sending
    console.log('Sending transformed bookings:', JSON.stringify(transformedBookings[0], null, 2));
    
    res.json({
      success: true,
      data: {
        bookings: transformedBookings,
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

    // Import Passenger model to get passenger count
    const models = require('../models');
    const Passenger = models.Passenger;
    
    const booking = await Booking.findOne({
      where: { 
        bk_bkid: bookingId,
        bk_usid: userId 
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' }
      });
    }
    
    // Get passenger count for this booking
    const passengerCount = await Passenger.count({
      where: { 
        ps_bkid: booking.bk_bkid,
        ps_active: 1  // Only count active passengers
      }
    });
    
    const bookingData = {
      ...booking.toJSON(),
      bk_pax: passengerCount  // Override with actual passenger count from passenger table
    };
    
    res.json({ success: true, data: bookingData });
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
        bk_usid: userId 
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
    if (req.user.us_roid !== 'ADM') {
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
          as: 'user',
          required: true
        }
      ] 
    });
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * Search customers from cuCustomer table
 */
const searchCustomers = async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Search term is required' 
        } 
      });
    }
    
    const trimmedSearchTerm = searchTerm.trim();
    
    // Return empty results for very short search terms instead of error
    if (trimmedSearchTerm.length < 1) {
      return res.json({ success: true, data: [] });
    }
    
    // Sanitize the search term to prevent SQL injection and special character issues
    // Only allow alphanumeric characters, spaces, hyphens, and underscores
    const sanitizedSearchTerm = trimmedSearchTerm.replace(/[^\w\s\-]/gi, '');
    
    // If sanitized term is empty, return empty results
    if (sanitizedSearchTerm.length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    // Search in both customer ID and customer name
    const customers = await Customer.findAll({
      attributes: [
        'cu_usid', 'cu_custno'
      ], 
      include: [ 
        { 
          model: User, 
          attributes: ['us_fname', 'us_lname', 'us_email', 'us_phone'], 
          as: 'user',
          required: true // We need the user data to get the name
        }
      ],
      limit: 20 // Limit results to prevent too many records
    });
    
    // Filter results on the application side to avoid complex SQL
    const filteredCustomers = customers.filter(customer => {
      const searchTermLower = sanitizedSearchTerm.toLowerCase();
      
      // Check customer ID fields
      const customerIdMatch = (customer.cu_usid && customer.cu_usid.toLowerCase().includes(searchTermLower)) ||
                            (customer.cu_custno && customer.cu_custno.toLowerCase().includes(searchTermLower));
      
      // Check user name fields
      const userNameMatch = customer.user && (
        (customer.user.us_fname && customer.user.us_fname.toLowerCase().includes(searchTermLower)) ||
        (customer.user.us_lname && customer.user.us_lname.toLowerCase().includes(searchTermLower))
      );
      
      return customerIdMatch || userNameMatch;
    });
    
    // Format the results to match the expected structure
    const formattedCustomers = filteredCustomers.map(customer => {
      // Combine first and last name from user as customer name
      const customerName = (customer.user ? `${customer.user.us_fname || ''} ${customer.user.us_lname || ''}`.trim() : '');
      
      return {
        id: customer.cu_usid || customer.cu_custno,
        name: customerName,
        cu_custno: customer.cu_custno,
        cu_usid: customer.cu_usid,
        us_fname: customer.user?.us_fname,
        us_lname: customer.user?.us_lname
      };
    });
    
    res.json({ success: true, data: formattedCustomers });
  } catch (error) {
    console.error('Search customers error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'An error occurred while searching customers' } 
    });
  }
};

/**
 * Get customer by ID from cuCustomer table
 */
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Customer ID is required' 
        } 
      });
    }
    
    const customer = await Customer.findOne({ 
      attributes: [
        'cu_usid', 'cu_custno', 'cu_custtype', 'cu_creditlimit', 
        'cu_creditdays', 'cu_discount', 'cu_active'
      ], 
      include: [ 
        { 
          model: User, 
          attributes: ['us_fname', 'us_lname', 'us_email', 'us_phone', 'us_aadhaar'], 
          as: 'user',
          required: true
        }
      ],
      where: {
        [Op.or]: [
          { cu_usid: id },
          { cu_custno: id }
        ]
      }
    });
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'Customer not found' } 
      });
    }
    
    // Format the customer data for response
    const formattedCustomer = {
      id: customer.cu_usid,
      customerId: customer.cu_custno,
      customerType: customer.cu_custtype,
      creditLimit: customer.cu_creditlimit,
      creditDays: customer.cu_creditdays,
      discount: customer.cu_discount,
      active: customer.cu_active,
      name: customer.user ? `${customer.user.us_fname || ''} ${customer.user.us_lname || ''}`.trim() : '',
      email: customer.user?.us_email,
      phone: customer.user?.us_phone,
      aadhaar: customer.user?.us_aadhaar
    };
    
    res.json({ success: true, data: formattedCustomer });
  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
  }
};

/**
 * Get Customer Bills
 */
const getCustomerBills = async (req, res) => {
  try {
    const userId = req.user.us_usid;
    
    // Import Bill model
    const { BillTVL: Bill } = require('../models');
    
    // Get bills for this customer
    // Bills are linked to customer via customer_id field
    const bills = await Bill.findAll({
      where: { 
        customer_id: userId  // Bills are linked to customer ID
      },
      order: [['created_on', 'DESC']]
    });
    
    res.json({ 
      success: true, 
      data: { 
        bills: bills
      } 
    });
  } catch (error) {
    console.error('Get customer bills error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch bills' } 
    });
  }
};

/**
 * Get Customer Payments
 */
const getCustomerPayments = async (req, res) => {
  try {
    const userId = req.user.us_usid;
    
    // Import Payment model
    const { PaymentTVL: Payment } = require('../models');
    
    // Get payments for this customer
    // Payments are linked to customer via pt_custid field
    const payments = await Payment.findAll({
      where: { 
        pt_custid: userId  // Payments are linked to customer ID
      },
      order: [['edtm', 'DESC']]
    });
    
    res.json({ 
      success: true, 
      data: { 
        payments: payments
      } 
    });
  } catch (error) {
    console.error('Get customer payments error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch payments' } 
    });
  }
};

const getBookingPassengers = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    // Check if user has permission to view this booking's passengers
    const models = require('../models');
    const Booking = models.Booking;
    
    const booking = await Booking.findByPk(bookingId);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' } 
      });
    }
    
    // Check if this booking belongs to the current user
    if (booking.bk_usid !== req.user.us_usid) {
      return res.status(403).json({ 
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' } 
      });
    }
    
    // Get passenger details for this booking
    const Passenger = models.Passenger;
    
    const passengers = await Passenger.findAll({
      where: { 
        ps_bkid: bookingId,
        ps_active: 1  // Only active passengers
      },
      order: [['ps_psid', 'ASC']]  // Order by passenger ID
    });
    
    // Transform passenger data to match frontend expectations
    const transformedPassengers = passengers.map(passenger => {
      return {
        firstName: passenger.ps_fname,
        lastName: passenger.ps_lname,
        age: passenger.ps_age,
        gender: passenger.ps_gender,
        berthPreference: passenger.ps_berthpref,
        berthAllocated: passenger.ps_berthalloc,
        seatNo: passenger.ps_seatno,
        coach: passenger.ps_coach,
        id: passenger.ps_psid
      };
    });
    
    res.json({ 
      success: true,
      bookingId: parseInt(bookingId),
      passengers: transformedPassengers 
    });
    
  } catch (error) {
    console.error('Error fetching customer booking passengers:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
  }
};

module.exports = {
  getCustomerDashboard,
  createBooking,
  getCustomerBookings,
  getBookingDetails,
  cancelBooking,
  getAllCustomers,
  searchCustomers,
  getCustomerById,
  getCustomerBills,
  getCustomerPayments,
  getBookingPassengers
};