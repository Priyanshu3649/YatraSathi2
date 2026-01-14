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
    
    res.json({ success: true, data: { bookings: transformedBookings } });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
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
      return res.status(404).json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'Booking not found' } 
      });
    }
    
    // Only admin can delete bookings
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'Access denied. Admin only.' } 
      });
    }
    
    // First, delete related records in the account table that reference this booking
    const Account = require('../models/AccountTVL');
    await Account.destroy({ where: { ac_bkid: booking.bk_bkid } });
    
    // Then delete the booking
    await booking.destroy();
    
    res.json({ 
      success: true, 
      data: { message: 'Booking deleted successfully' } 
    });
  } catch (error) {
    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        success: false,
        error: { 
          code: 'FOREIGN_KEY_CONSTRAINT', 
          message: 'Cannot delete booking. Related records exist in other tables.' 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
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

// Approve booking by employee
const approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await BookingTVL.findByPk(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Only admin or assigned employee can approve booking
    if (req.user.us_usertype !== 'admin' && booking.bk_agent !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied. Admin or assigned agent only.' });
    }
    
    // Update booking status to PENDING
    await booking.update({ 
      bk_status: 'PENDING',
      mby: req.user.us_usid 
    });
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Confirm booking with PNR
const confirmBooking = async (req, res) => {
  try {
    const { bookingId, pnrNumber, trainNumber, travelDate, travelClass, bookingAmount, serviceCharges, platformFees, agentFees, extraCharges, discounts, totalAmount } = req.body;
    
    const booking = await BookingTVL.findByPk(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Only admin or assigned employee can confirm booking
    if (req.user.us_usertype !== 'admin' && booking.bk_agent !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied. Admin or assigned agent only.' });
    }
    
    // Update booking status to CONFIRMED
    await booking.update({ 
      bk_status: 'CONFIRMED',
      mby: req.user.us_usid 
    });
    
    // Create PNR record
    const { Pnr } = require('../models');
    const pnr = await Pnr.create({
      pn_bkid: booking.bk_bkid,
      pn_pnr: pnrNumber,
      pn_trid: trainNumber,
      pn_trvldt: travelDate,
      pn_class: travelClass,
      pn_passengers: booking.bk_totalpass,
      pn_status: 'CNF',
      pn_bookdt: new Date(),
      pn_bkgamt: bookingAmount || 0,
      pn_svcamt: serviceCharges || 0,
      pn_totamt: totalAmount || 0,
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    
    // Create account record for the booking
    const { Account } = require('../models');
    const account = await Account.create({
      ac_bkid: booking.bk_bkid,
      ac_usid: booking.bk_usid,
      ac_totamt: totalAmount || 0,
      ac_status: 'PENDING',
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    
    // Create bill automatically
    const { BillTVL, Customer } = require('../models');
    const billNumber = `BILL${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Fetch customer name
    const customer = await Customer.findOne({ where: { cu_usid: booking.bk_usid } });
    const customerName = customer ? customer.cu_name : '';
    
    const bill = await BillTVL.create({
      bill_no: billNumber,
      customer_id: booking.bk_usid,
      customer_name: customerName,
      train_number: trainNumber,
      reservation_class: travelClass,
      ticket_type: 'TATKAL', // Default to TATKAL
      pnr_numbers: JSON.stringify([pnrNumber]),
      net_fare: bookingAmount || 0,
      service_charges: serviceCharges || 0,
      platform_fees: platformFees || 0,
      agent_fees: agentFees || 0,
      extra_charges: JSON.stringify(extraCharges || []),
      discounts: JSON.stringify(discounts || []),
      total_amount: totalAmount || 0,
      bill_date: new Date(),
      status: 'FINAL', // Change status to FINAL since it's generated after confirmation
      remarks: `Bill for booking ${booking.bk_bkno} and PNR ${pnrNumber}`,
      created_by: req.user.us_usid,
      modified_by: req.user.us_usid
    });
    
    // Return booking with PNR and bill details
    const updatedBooking = await BookingTVL.findByPk(bookingId);
    res.json({...updatedBooking.toJSON(), pnr: pnr, account: account, bill: bill});
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
  approveBooking,
  confirmBooking,
  getBookingsByStatus,
  searchBookings
};