const { Booking, User, Customer, Employee, Station } = require('../models');
const { Sequelize } = require('sequelize');

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
    const booking = await Booking.create({
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
    const bookings = await Booking.findAll({ 
      where: { bk_usid: req.user.us_usid },
      order: [['bk_reqdt', 'DESC']],
      include: [
        {
          model: Station,
          as: 'fromStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        },
        {
          model: Station,
          as: 'toStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        }
      ]
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings (admin only)
const getAllBookings = async (req, res) => {
  try {
    // Only admin can get all bookings
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const bookings = await Booking.findAll({ 
      order: [['bk_reqdt', 'DESC']],
      include: [
        {
          model: Station,
          as: 'fromStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        },
        {
          model: Station,
          as: 'toStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        }
      ]
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Station,
          as: 'fromStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        },
        {
          model: Station,
          as: 'toStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        }
      ]
    });
    
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
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking (agent functionality)
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check permissions
    if (req.user.us_usertype !== 'admin' && 
        req.user.us_usertype !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update booking fields
    const {
      status,
      agentId,
      remarks
    } = req.body;
    
    // Update fields if provided
    if (status) booking.bk_status = status;
    if (agentId) booking.bk_agent = agentId;
    if (remarks) booking.bk_remarks = remarks;
    
    booking.mby = req.user.us_usid;
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check permissions
    // Customer can cancel their own bookings
    // Admin can cancel any booking
    // Employee can cancel bookings they are assigned to
    if (req.user.us_usertype !== 'admin' && 
        booking.bk_usid !== req.user.us_usid &&
        (booking.bk_agent && booking.bk_agent !== req.user.us_usid)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if booking can be cancelled
    if (booking.bk_status === 'CANCELLED') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    
    if (booking.bk_status === 'CONFIRMED') {
      return res.status(400).json({ message: 'Confirmed bookings cannot be cancelled through this system. Please contact customer support.' });
    }
    
    // Update booking status to cancelled
    booking.bk_status = 'CANCELLED';
    booking.mby = req.user.us_usid;
    
    const updatedBooking = await booking.save();
    res.json({ 
      message: 'Booking cancelled successfully',
      booking: updatedBooking 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete booking (only for pending bookings)
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check permissions
    if (req.user.us_usertype !== 'admin' && 
        booking.bk_usid !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Only allow deletion of pending bookings
    if (booking.bk_status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending bookings can be deleted' });
    }
    
    await booking.destroy();
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign booking to employee (admin/manager functionality)
const assignBooking = async (req, res) => {
  try {
    const { bookingId, employeeId } = req.body;
    
    // Verify employee exists and is of employee type
    const employee = await User.findByPk(employeeId);
    if (!employee || employee.us_usertype !== 'employee') {
      return res.status(400).json({ message: 'Invalid employee' });
    }
    
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Assign employee to booking
    booking.bk_agent = employeeId;
    booking.bk_status = 'APPROVED'; // Change status to approved when assigned
    booking.mby = req.user.us_usid;
    
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bookings by status
const getBookingsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    let query = { where: { bk_status: status } };
    
    // For employees, only get bookings assigned to them
    if (req.user.us_usertype === 'employee') {
      query.where.bk_agent = req.user.us_usid;
    } 
    // For customers, only get their own bookings
    else if (req.user.us_usertype === 'customer') {
      query.where.bk_usid = req.user.us_usid;
    }
    
    const bookings = await Booking.findAll({ 
      ...query, 
      order: [['bk_reqdt', 'DESC']],
      include: [
        {
          model: Station,
          as: 'fromStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        },
        {
          model: Station,
          as: 'toStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        }
      ]
    });
    res.json(bookings);
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
    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereConditions,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Station,
          as: 'fromStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        },
        {
          model: Station,
          as: 'toStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['us_fname', 'us_lname', 'us_email'],
          include: [{
            model: Customer,
            attributes: ['cu_custno', 'cu_custtype']
          }]
        },
        {
          model: User,
          as: 'agent',
          attributes: ['us_fname', 'us_lname', 'us_email'],
          include: [{
            model: Employee,
            attributes: ['em_empno', 'em_designation']
          }]
        }
      ]
    });

    res.json({
      bookings,
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