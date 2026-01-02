const { BookingTVL, UserTVL, CustomerTVL: Customer, EmployeeTVL: Employee, StationTVL: Station } = require('../models');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../models/baseModel');

// Create a new booking request
const createBooking = async (req, res) => {
  try {
    const {
      fromStation,
      toStation,
      travelDate,
      travelClass,
      berthPreference,
      totalPassengers,
      remarks
    } = req.body;
    
    // Generate booking number
    const bookingNumber = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Create new booking
    const booking = await BookingTVL.create({
      bk_bkno: bookingNumber,
      bk_usid: req.user.us_usid,
      bk_fromst: fromStation,
      bk_tost: toStation,
      bk_trvldt: travelDate,
      bk_class: travelClass,
      bk_berthpref: berthPreference,
      bk_totalpass: totalPassengers || 1,
      bk_remarks: remarks,
      bk_status: 'PENDING',
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings for a customer
const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await BookingTVL.findAll({ 
      where: { bk_usid: req.user.us_usid },
      order: [['bk_reqdt', 'DESC']]
    });
    
    // Transform data to match frontend expectations
    const transformedBookings = bookings.map(booking => ({
      ...booking.toJSON(),
      bk_fromstation: booking.bk_fromst,
      bk_tostation: booking.bk_tost,
      bk_travelldate: booking.bk_trvldt,
      bk_travelclass: booking.bk_class
    }));
    
    res.json(transformedBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings (admin only)
const getAllBookings = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const bookings = await BookingTVL.findAll({
      order: [['edtm', 'DESC']] // Use edtm for consistency
    });
    
    // Transform data to match frontend expectations
    const transformedBookings = bookings.map(booking => ({
      ...booking.toJSON(),
      bk_fromstation: booking.bk_fromst,
      bk_tostation: booking.bk_tost,
      bk_travelldate: booking.bk_trvldt,
      bk_travelclass: booking.bk_class
    }));
    
    res.json(transformedBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await BookingTVL.findByPk(req.params.id);
    
    // Check if booking exists
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user has permission to view this booking
    if (req.user.us_usertype !== 'admin' && 
        booking.bk_usid !== req.user.us_usid &&
        (booking.bk_agent && booking.bk_agent !== req.user.us_usid)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Transform data to match frontend expectations
    const transformedBooking = {
      ...booking.toJSON(),
      bk_fromstation: booking.bk_fromst,
      bk_tostation: booking.bk_tost,
      bk_travelldate: booking.bk_trvldt,
      bk_travelclass: booking.bk_class
    };
    
    res.json(transformedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking
const updateBooking = async (req, res) => {
  try {
    const booking = await BookingTVL.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user has permission to update this booking
    if (req.user.us_usertype !== 'admin' && booking.bk_usid !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await booking.update(req.body);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await BookingTVL.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user has permission to cancel this booking
    if (req.user.us_usertype !== 'admin' && booking.bk_usid !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if booking is already cancelled
    if (booking.bk_status === 'CANCELLED') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    
    await booking.update({ 
      bk_status: 'CANCELLED',
      mby: req.user.us_usid 
    });
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete booking
const deleteBooking = async (req, res) => {
  try {
    const booking = await BookingTVL.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Only admin can delete bookings
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    // First, delete related records in the account table that reference this booking
    const Account = require('../models/AccountTVL');
    await Account.destroy({ where: { ac_bkid: booking.bk_bkid } });
    
    // Then delete the booking
    await booking.destroy();
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: 'Cannot delete booking. Related records exist in other tables.' 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Assign booking to employee
const assignBooking = async (req, res) => {
  try {
    const { bookingId, employeeId } = req.body;
    
    const booking = await BookingTVL.findByPk(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Only admin can assign bookings
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    await booking.update({ 
      bk_agent: employeeId,
      mby: req.user.us_usid 
    });
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bookings by status
const getBookingsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    let whereConditions = { bk_status: status };
    
    // Apply user-specific filters
    if (req.user.us_usertype === 'employee') {
      // Employees can only see their assigned bookings
      whereConditions.bk_agent = req.user.us_usid;
    } else if (req.user.us_usertype === 'customer') {
      // Customers can only see their own bookings
      whereConditions.bk_usid = req.user.us_usid;
    }
    
    const bookings = await BookingTVL.findAll({
      where: whereConditions,
      order: [['bk_reqdt', 'DESC']]
    });
    
    // Transform data to match frontend expectations
    const transformedBookings = bookings.map(booking => ({
      ...booking.toJSON(),
      bk_fromstation: booking.bk_fromst,
      bk_tostation: booking.bk_tost,
      bk_travelldate: booking.bk_trvldt,
      bk_travelclass: booking.bk_class
    }));
    
    res.json(transformedBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search and filter bookings
const searchBookings = async (req, res) => {
  try {
    const {
      status,
      fromDate,
      toDate,
      customerId,
      employeeId,
      fromStation,
      toStation,
      minPassengers,
      maxPassengers,
      sortBy = 'bk_reqdt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    // Build query conditions
    let whereConditions = {};

    // Status filter
    if (status) {
      whereConditions.bk_status = status;
    }

    // Date range filter
    if (fromDate || toDate) {
      whereConditions.bk_trvldt = {};
      if (fromDate) {
        whereConditions.bk_trvldt[Sequelize.Op.gte] = new Date(fromDate);
      }
      if (toDate) {
        whereConditions.bk_trvldt[Sequelize.Op.lte] = new Date(toDate);
      }
    }

    // Customer filter
    if (customerId) {
      whereConditions.bk_usid = customerId;
    }

    // Employee filter
    if (employeeId) {
      whereConditions.bk_agent = employeeId;
    }

    // Station filters
    if (fromStation) {
      whereConditions.bk_fromst = fromStation;
    }

    if (toStation) {
      whereConditions.bk_tost = toStation;
    }

    // Passenger count filter
    if (minPassengers || maxPassengers) {
      whereConditions.bk_totalpass = {};
      if (minPassengers) {
        whereConditions.bk_totalpass[Sequelize.Op.gte] = parseInt(minPassengers);
      }
      if (maxPassengers) {
        whereConditions.bk_totalpass[Sequelize.Op.lte] = parseInt(maxPassengers);
      }
    }

    // Apply user-specific filters
    if (req.user.us_usertype === 'employee') {
      // Employees can only see their assigned bookings
      whereConditions.bk_agent = req.user.us_usid;
    } else if (req.user.us_usertype === 'customer') {
      // Customers can only see their own bookings
      whereConditions.bk_usid = req.user.us_usid;
    }

    // Build query
    const offset = (page - 1) * limit;
    const { count, rows: bookings } = await BookingTVL.findAndCountAll({
      where: whereConditions,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Transform data to match frontend expectations
    const transformedBookings = bookings.map(booking => ({
      ...booking.toJSON(),
      bk_fromstation: booking.bk_fromst,
      bk_tostation: booking.bk_tost,
      bk_travelldate: booking.bk_trvldt,
      bk_travelclass: booking.bk_class
    }));

    res.json({
      bookings: transformedBookings,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalBookings: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getCustomerBookings,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  deleteBooking,
  assignBooking,
  getBookingsByStatus,
  searchBookings
};