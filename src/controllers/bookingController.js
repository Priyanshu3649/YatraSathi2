const { BookingTVL, UserTVL, CustomerTVL: Customer, EmployeeTVL: Employee, StationTVL: Station } = require('../models');
const { Passenger } = require('../models'); // Import the Passenger model
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
      remarks,
      passengerList,
      // MANDATORY: Phone-based customer model
      phoneNumber,
      customerName,
      internalCustomerId // May be null for new customers
    } = req.body;
    
    // MANDATORY: Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'VALIDATION_ERROR', message: 'Phone number is required' } 
      });
    }
    
    // Clean phone number (remove non-digits)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Validate phone number length (10-15 digits)
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'VALIDATION_ERROR', message: 'Phone number must be 10-15 digits' } 
      });
    }
    
    // MANDATORY: Validate customer name
    if (!customerName || customerName.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'VALIDATION_ERROR', message: 'Customer name is required' } 
      });
    }
    
    // Generate booking number
    const bookingNumber = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const transaction = await sequelize.transaction();
    
    try {
      let customerId = internalCustomerId;
      
      // MANDATORY: Atomic customer creation if customer doesn't exist
      if (!customerId) {
        // Check if customer exists by phone number
        const existingCustomer = await Customer.findOne({
          include: [{
            model: UserTVL,
            as: 'user',
            where: {
              us_phone: {
                [Sequelize.Op.or]: [
                  cleanPhone,
                  phoneNumber,
                  `+91${cleanPhone}`,
                  `91${cleanPhone}`
                ]
              }
            },
            required: true
          }]
        }, { transaction });
        
        if (existingCustomer) {
          // Customer exists, use their ID
          customerId = existingCustomer.cu_usid;
        } else {
          // MANDATORY: Create new customer atomically
          const nameParts = customerName.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Create user record first
          const newUser = await UserTVL.create({
            us_fname: firstName,
            us_lname: lastName,
            us_phone: cleanPhone,
            us_email: `${cleanPhone}@phone.booking`, // Temporary email
            us_usertype: 'customer',
            us_roid: 'CUS',
            us_active: 1,
            us_password: 'PHONE_BOOKING', // Temporary password
            eby: req.user.us_usid,
            mby: req.user.us_usid
          }, { transaction });
          
          // Create customer record
          const customerNumber = `CUST${Date.now()}${Math.floor(Math.random() * 1000)}`;
          const newCustomer = await Customer.create({
            cu_usid: newUser.us_usid,
            cu_custno: customerNumber,
            cu_custtype: 'WALK_IN',
            cu_active: 1,
            eby: req.user.us_usid,
            mby: req.user.us_usid
          }, { transaction });
          
          customerId = newCustomer.cu_usid;
        }
      }
      
      // Create new booking with resolved customer ID
      const booking = await BookingTVL.create({
        bk_bkno: bookingNumber,
        bk_usid: customerId, // Use resolved customer ID
        bk_customername: customerName.trim(), // Store customer name for quick access
        bk_phonenumber: cleanPhone, // Store phone number for quick access
        bk_fromst: fromStation,
        bk_tost: toStation,
        bk_trvldt: travelDate,
        bk_class: travelClass,
        bk_berthpref: berthPreference,
        bk_totalpass: totalPassengers || 1,
        bk_remarks: remarks,
        bk_status: 'DRAFT',
        eby: req.user.us_usid,
        mby: req.user.us_usid
      }, { transaction });
      
      // If passenger list is provided, create passenger records using new Passenger model
      if (passengerList && Array.isArray(passengerList) && passengerList.length > 0) {
        // Filter out empty passengers
        const validPassengers = passengerList.filter(passenger => 
          passenger.name && passenger.name.trim() !== ''
        );
        
        if (validPassengers.length > 0) {
          // Use the new Passenger model's createMultiple method
          const { Passenger: CustomPassenger } = require('../models'); // Import the custom Passenger model
          await CustomPassenger.createMultiple(
            booking.bk_bkid, 
            validPassengers, 
            req.user.us_name || req.user.us_usid
          );
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        data: {
          ...booking.toJSON(),
          message: 'Booking created successfully with phone-based customer identification'
        }
      });
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating booking with phone-based customer:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
  }
};

// Get all bookings for a customer
const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await BookingTVL.findAll({ 
      where: { bk_usid: req.user.us_usid },
      order: [['bk_reqdt', 'DESC']]
    });
    
    // Transform data to match frontend expectations and get actual passenger counts
    const transformedBookings = await Promise.all(bookings.map(async (booking) => {
      // Get passenger count for this booking using new Passenger model
      const passengerCountResult = await Passenger.getCountByBookingId(booking.bk_bkid);
      const passengerCount = passengerCountResult.success ? passengerCountResult.count : 0;
      
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
        bk_from: fromStationName,        // Add full from station name
        bk_to: toStationName,            // Add full to station name
        bk_fromst: booking.bk_fromst,    // Keep original station code
        bk_tost: booking.bk_tost,        // Keep original station code
        bk_travelldate: booking.bk_trvldt,
        bk_travelclass: booking.bk_class,
        bk_pax: passengerCount  // Override with actual passenger count from passenger table
      };
    }));
    
    res.json({ success: true, data: { bookings: transformedBookings } });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
  }
};

// Get all bookings (admin and authorized employees)
const getAllBookings = async (req, res) => {
  try {
    // Check if user is admin or employee
    const allowedRoles = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'];
    const isAuthorizedEmployee = allowedRoles.includes(req.user.us_roid);
    
    // Import models for passenger and station lookups
    const models = require('../models');
    const { PassengerTVL: Passenger, StationTVL: Station } = models;
    
    let bookings;
    
    if (isAuthorizedEmployee) {
      // For admin and all employees, return all bookings
      bookings = await BookingTVL.findAll({
        order: [['edtm', 'DESC']] // Use edtm for consistency
      });
    } else {
      // For other users (shouldn't reach here if using employee endpoint), return their bookings
      bookings = await BookingTVL.findAll({
        where: { bk_usid: req.user.us_usid },
        order: [['edtm', 'DESC']]
      });
    }
    
    // Transform data to match frontend expectations and get actual passenger counts
    const transformedBookings = await Promise.all(bookings.map(async (booking) => {
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
        bk_from: fromStationName,        // Add full from station name
        bk_to: toStationName,            // Add full to station name
        bk_fromst: booking.bk_fromst,    // Keep original station code
        bk_tost: booking.bk_tost,        // Keep original station code
        bk_travelldate: booking.bk_trvldt,
        bk_travelclass: booking.bk_class,
        bk_pax: passengerCount  // Override with actual passenger count from passenger table
      };
    }));
    
    res.json({ success: true, data: { bookings: transformedBookings } });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
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
    if (req.user.us_roid !== 'ADM' && 
        booking.bk_usid !== req.user.us_usid &&
        (booking.bk_agent && booking.bk_agent !== req.user.us_usid)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Import Passenger model to get passenger count
    const models = require('../models');
    const Passenger = models.PassengerTVL;
    
    // Get passenger count for this booking
    const passengerCount = await Passenger.count({
      where: { 
        ps_bkid: booking.bk_bkid,
        ps_active: 1  // Only count active passengers
      }
    });
    
    // Transform data to match frontend expectations
    const transformedBooking = {
      ...booking.toJSON(),
      bk_fromstation: booking.bk_fromst,
      bk_tostation: booking.bk_tost,
      bk_travelldate: booking.bk_trvldt,
      bk_travelclass: booking.bk_class,
      bk_pax: passengerCount  // Override with actual passenger count from passenger table
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
    if (req.user.us_roid !== 'ADM' && booking.bk_usid !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      const { passengerList, ...bookingData } = req.body;
      
      // Update booking details
      await booking.update(bookingData, { transaction });
      
      // If passenger list is provided, update passenger records
      if (passengerList && Array.isArray(passengerList)) {
        const models = require('../models');
        const Passenger = models.PassengerTVL;
        
        // First, mark all existing passengers as inactive for this booking
        await Passenger.update(
          { ps_active: 0, mby: req.user.us_usid },
          { where: { ps_bkid: booking.bk_bkid }, transaction }
        );
        
        // Create or reactivate passenger records for this booking
        for (const passenger of passengerList) {
          if (passenger.name && passenger.name.trim() !== '') { // Only create if name is provided
            // Check if passenger already exists (for updates)
            const existingPassenger = await Passenger.findOne({
              where: {
                ps_bkid: booking.bk_bkid,
                ps_fname: passenger.name.split(' ')[0] || '',
                ps_lname: passenger.name.split(' ').slice(1).join(' ') || null,
                ps_age: parseInt(passenger.age) || 0
              },
              transaction
            });
            
            if (existingPassenger) {
              // Update existing passenger
              await existingPassenger.update({
                ps_fname: passenger.name.split(' ')[0] || '',
                ps_lname: passenger.name.split(' ').slice(1).join(' ') || null,
                ps_age: parseInt(passenger.age) || 0,
                ps_gender: passenger.gender || 'M',
                ps_berthpref: passenger.berthPreference || null,
                ps_idtype: passenger.idProofType || null,
                ps_idno: passenger.idProofNumber || null,
                ps_active: 1, // Reactivate
                mby: req.user.us_usid
              }, { transaction });
            } else {
              // Create new passenger record
              await Passenger.create({
                ps_bkid: booking.bk_bkid, // Link to the booking
                ps_fname: passenger.name.split(' ')[0] || '', // First name
                ps_lname: passenger.name.split(' ').slice(1).join(' ') || null, // Last name (if any)
                ps_age: parseInt(passenger.age) || 0,
                ps_gender: passenger.gender || 'M',
                ps_berthpref: passenger.berthPreference || null,
                ps_idtype: passenger.idProofType || null,
                ps_idno: passenger.idProofNumber || null,
                ps_active: 1, // Active passenger
                eby: req.user.us_usid,
                mby: req.user.us_usid
              }, { transaction });
            }
          }
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      res.json(booking);
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating booking with passengers:', error);
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
    if (req.user.us_roid !== 'ADM' && booking.bk_usid !== req.user.us_usid) {
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
    if (req.user.us_roid !== 'ADM') {
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

// Get passengers for a specific booking
const getBookingPassengers = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    // Check if user has permission to view this booking's passengers
    const booking = await (require('../models')).Booking.findByPk(bookingId);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' } 
      });
    }
    
    // Check if user has permission to view this booking
    if (req.user.us_roid !== 'ADM' && 
        booking.bk_usid !== req.user.us_usid &&
        (booking.bk_agent && booking.bk_agent !== req.user.us_usid)) {
      return res.status(403).json({ 
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' } 
      });
    }
    
    // Import Passenger model from main models
    const { PassengerTVL: Passenger } = require('../models');
    
    // Get passengers for this booking
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
        idProofType: passenger.ps_idtype,
        idProofNumber: passenger.ps_idno,
        id: passenger.ps_psid
      };
    });
    
    res.json({ 
      success: true,
      bookingId: parseInt(bookingId),
      passengers: transformedPassengers 
    });
    
  } catch (error) {
    console.error('Error fetching booking passengers:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
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
    if (['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT'].includes(req.user.us_roid)) {
      // Regular employees can only see their assigned bookings
      whereConditions.bk_agent = req.user.us_usid;
    } else if (req.user.us_roid === 'CUS') {
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

// Get bookings assigned to the current employee
const getAssignedBookings = async (req, res) => {
  try {
    // Import models
    const models = require('../models');
    const { PassengerTVL: Passenger, StationTVL: Station } = models;
    
    // Get bookings assigned to this employee
    const bookings = await BookingTVL.findAll({
      where: { bk_agent: req.user.us_usid },
      order: [['edtm', 'DESC']]
    });
    
    // Transform data to match frontend expectations and get actual passenger counts
    const transformedBookings = await Promise.all(bookings.map(async (booking) => {
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
        bk_from: fromStationName,        // Add full from station name
        bk_to: toStationName,            // Add full to station name
        bk_fromst: booking.bk_fromst,    // Keep original station code
        bk_tost: booking.bk_tost,        // Keep original station code
        bk_travelldate: booking.bk_trvldt,
        bk_travelclass: booking.bk_class,
        bk_pax: passengerCount  // Override with actual passenger count from passenger table
      };
    }));
    
    res.json({ success: true, data: { bookings: transformedBookings } });
  } catch (error) {
    console.error('Get assigned bookings error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
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
  searchBookings,
  getBookingPassengers,
  getAssignedBookings
};