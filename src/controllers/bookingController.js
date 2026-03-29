const { BookingTVL, UserTVL, CustomerTVL: Customer, EmployeeTVL: Employee, StationTVL: Station, PassengerTVL: Passenger, Journal } = require('../models');
const { Sequelize, Op } = require('sequelize');
const { sequelizeTVL: sequelize } = require('../../config/db'); // Use sequelizeTVL for TVL database
const queryHelper = require('../utils/queryHelper');

// Helper function to convert string user ID to integer for database compatibility
function convertUserIdToInt(userId) {
  if (typeof userId === 'number') {
    return userId;
  }
  
  if (typeof userId === 'string') {
    // Try to extract numeric part from alphanumeric ID (e.g., 'ADM001' -> 1)
    const numericPart = userId.match(/\d+/);
    if (numericPart) {
      return parseInt(numericPart[0]);
    }
    
    // If no numeric part found, use character codes as fallback
    return userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000000; // Limit to reasonable size
  }
  
  // Default fallback
  return 1;
}

// Create a new booking request
const createBooking = async (req, res) => {
  console.time("BOOKING_SAVE_TOTAL");
  try {
    console.time("BOOKING_VALIDATE_INPUT");
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
      internalCustomerId, // May be null for new customers
      status // Accept status from request
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
    
    console.timeEnd("BOOKING_VALIDATE_INPUT");
    
    // Generate booking number in format: BK-YYMMDD-NNNN (max 15 chars)
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const bookingNumber = `BK-${year}${month}${day}-${random}`;
    
    const transaction = await sequelize.transaction();
    
    try {
      // Disable foreign key checks for this specific transaction's connection
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      
      let customerId = internalCustomerId;
      
      // MANDATORY: Atomic customer creation if customer doesn't exist
      if (!customerId) {
        console.log(`Searching for existing customer with phone: ${cleanPhone}`);
        
        // 1. First, check if a User record exists for this phone number
        const existingUser = await UserTVL.findOne({
          where: { us_phone: cleanPhone },
          transaction
        });
        
        if (existingUser) {
          console.log(`✅ Found existing user: ${existingUser.us_usid}`);
          
          // 2. Check if this user also has a Customer record
          const existingCustomer = await Customer.findOne({
            where: { cu_usid: existingUser.us_usid },
            transaction
          });
          
          if (existingCustomer) {
            console.log(`✅ Found existing customer for user: ${existingCustomer.cu_cusid}`);
            customerId = existingCustomer.cu_usid;
          } else {
            // 3. User exists but no Customer record - create Customer record only
            console.log(`📝 User exists but no customer record. Creating customer record for user: ${existingUser.us_usid}`);
            const customerNumber = `CUST${Date.now()}${Math.floor(Math.random() * 1000)}`;
            const customerPrimaryId = `CU${Math.floor(Math.random() * 1000000)}`;
            
            const newCustomer = await Customer.create({
              cu_cusid: customerPrimaryId,
              cu_usid: existingUser.us_usid,
              cu_custno: customerNumber,
              cu_custtype: 'WALK_IN',
              cu_active: 1,
              eby: req.user.us_usid,
              mby: req.user.us_usid
            }, { 
              transaction,
              userId: convertUserIdToInt(req.user.us_usid)
            });
            
            customerId = newCustomer.cu_usid;
          }
        } else {
          // 4. Neither User nor Customer exists - create both
          console.log('📝 Creating new user and customer records...');
          const firstName = customerName.split(' ')[0] || 'Customer';
          const lastName = customerName.split(' ').slice(1).join(' ') || '';
          
          // Create user record first
          const userPrimaryId = `US${Math.floor(Math.random() * 1000000)}`;
          console.log('Creating new user record:', userPrimaryId);
          const newUser = await UserTVL.create({
            us_usid: userPrimaryId,
            us_fname: firstName,
            us_lname: lastName,
            us_phone: cleanPhone,
            us_email: `${cleanPhone}@phone.booking`, // Temporary email
            us_usertype: 'customer',
            us_roid: 'CUS',
            us_active: 1,
            us_password: 'PHONE_BOOKING', // Temporary password
            us_eby: req.user.us_usid,
            us_mby: req.user.us_usid
          }, { transaction });
          
          // Create customer record
          const customerNumber = `CUST${Date.now()}${Math.floor(Math.random() * 1000)}`;
          const customerPrimaryId = `CU${Math.floor(Math.random() * 1000000)}`;
          console.log('Creating new customer record:', customerPrimaryId);
          
          const newCustomer = await Customer.create({
            cu_cusid: customerPrimaryId,
            cu_usid: newUser.us_usid,
            cu_custno: customerNumber,
            cu_custtype: 'WALK_IN',
            cu_active: 1,
            eby: req.user.us_usid,
            mby: req.user.us_usid
          }, { 
            transaction,
            userId: convertUserIdToInt(req.user.us_usid)
          });
          
          customerId = newCustomer.cu_usid;
        }
      }
      
      console.log('Using customer ID:', customerId);
      
      // Validate status for creation (should not be INACTIVE)
      if (status === 'INACTIVE') {
        return res.status(400).json({ 
          success: false, 
          error: { code: 'VALIDATION_ERROR', message: 'Cannot create booking with INACTIVE status' } 
        });
      }
          
      // Create new booking with resolved customer ID
      console.time("BOOKING_CREATE_RECORD");
      const booking = await BookingTVL.create({
        bk_bkno: bookingNumber,
        bk_usid: customerId, // Use resolved customer ID
        bk_customername: customerName.trim(), // Store customer name for quick access
        bk_phonenumber: cleanPhone, // Store phone number for quick access
        bk_fromst: fromStation,
        bk_tost: toStation,
        bk_trvldt: travelDate,
        bk_class: travelClass,
        bk_quota: req.body.bk_quota || 'GENERAL', // ✓ Add quota field with default
        bk_berthpref: berthPreference,
        bk_totalpass: totalPassengers || 1,
        bk_remarks: remarks,
        bk_status: status || 'DRAFT', // ✓ Use validated status from request body
        eby: req.user.us_usid,
        mby: req.user.us_usid
      }, { 
        transaction,
        userId: convertUserIdToInt(req.user.us_usid)  // Convert to integer for BookingTVL audit hooks
      });
      console.timeEnd("BOOKING_CREATE_RECORD");
      
      // If passenger list is provided, create passenger records using optimized PassengerTVL model
      if (passengerList && Array.isArray(passengerList) && passengerList.length > 0) {
        console.time("BOOKING_CREATE_PASSENGERS");
        // Filter out empty passengers
        const validPassengers = passengerList.filter(passenger => 
          passenger.name && passenger.name.trim() !== ''
        );
        
        if (validPassengers.length > 0) {
          // Use optimized bulkCreate method with PassengerTVL model for better performance
          const passengerDataBatch = validPassengers.map(passenger => ({
            ps_bkid: booking.bk_bkid,
            ps_fname: passenger.name.split(' ')[0] || '',
            ps_lname: passenger.name.split(' ').slice(1).join(' ') || null,
            ps_age: parseInt(passenger.age) || 0,
            ps_gender: passenger.gender || 'M',
            ps_berthpref: passenger.berthPreference || passenger.berth || null,
            ps_idtype: passenger.idProofType || null,
            ps_idno: passenger.idProofNumber || null,
            ps_active: 1,
            eby: req.user.us_usid,
            mby: req.user.us_usid
          }));
          
          // Use the Sequelize model for bulk creation
          await Passenger.bulkCreate(passengerDataBatch, { 
            transaction,
            userId: req.user.us_usid  // Pass userId for audit hooks
          });
        }
        console.timeEnd("BOOKING_CREATE_PASSENGERS");
      }
      
      // Commit the transaction
      console.time("BOOKING_COMMIT_TRANSACTION");
      await transaction.commit();
      console.timeEnd("BOOKING_COMMIT_TRANSACTION");
      
      // Re-enable foreign key checks
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.time("BOOKING_RESPONSE_PREP");
      res.status(201).json({
        success: true,
        data: {
          ...booking.toJSON(),
          message: 'Booking created successfully with phone-based customer identification'
        }
      });
      console.timeEnd("BOOKING_RESPONSE_PREP");
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      // Re-enable foreign key checks even on error
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      throw error;
    }
  } catch (error) {
    console.error('Error creating booking with phone-based customer:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Log more details for debugging
    if (error.sql) {
      console.error('SQL Error:', error.sql);
    }
    if (error.parent) {
      console.error('Parent Error:', error.parent);
    }
    
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'SERVER_ERROR', 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } 
    });
  }
  console.timeEnd("BOOKING_SAVE_TOTAL");
};

// Get all bookings for a customer
const getCustomerBookings = async (req, res) => {
  try {
    const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
    const order = queryHelper.getSortingOptions(req.query, 'bk_reqdt', 'DESC');
    
    const { count, rows: bookings } = await BookingTVL.findAndCountAll({ 
      where: { 
        bk_usid: req.user.us_usid,
        bk_status: { [Op.ne]: 'INACTIVE' } // Exclude inactive bookings
      },
      order,
      limit,
      offset
    });
    
    // Batch fetch passenger counts for all bookings
    const bookingIds = bookings.map(booking => booking.bk_bkid);
    const passengerCounts = {};
    
    // Get passenger counts in batch
    const passengerCountResults = await Passenger.findAll({
      attributes: ['ps_bkid', [Sequelize.fn('COUNT', Sequelize.col('ps_psid')), 'count']],
      where: {
        ps_bkid: { [Sequelize.Op.in]: bookingIds },
        ps_active: 1
      },
      group: ['ps_bkid']
    });
    
    passengerCountResults.forEach(result => {
      passengerCounts[result.ps_bkid] = result.dataValues.count;
    });
    
    // Batch fetch station information
    const stationCodes = [...new Set([
      ...bookings.map(b => b.bk_fromst),
      ...bookings.map(b => b.bk_tost)
    ])];
    
    const stations = await Station.findAll({
      where: {
        st_stcode: { [Sequelize.Op.in]: stationCodes }
      }
    });
    
    const stationMap = {};
    stations.forEach(station => {
      stationMap[station.st_stcode] = station.st_stname || station.st_stcode;
    });
    
    // Transform data to match frontend expectations with batched data
    const transformedBookings = bookings.map(booking => {
      const passengerCount = passengerCounts[booking.bk_bkid] || 0;
      
      const fromStationName = stationMap[booking.bk_fromst] || booking.bk_fromst || 'Unknown';
      const toStationName = stationMap[booking.bk_tost] || booking.bk_tost || 'Unknown';
      
      return {
        ...booking.toJSON(),
        bk_from: fromStationName,        // Add full from station name
        bk_to: toStationName,            // Add full to station name
        bk_fromst: booking.bk_fromst,    // Keep original station code
        bk_tost: booking.bk_tost,        // Keep original station code
        bk_travelldate: booking.bk_trvldt,
        bk_travelclass: booking.bk_class,
        bk_quota: booking.bk_quota,      // ✓ Add quota information
        bk_pax: passengerCount  // Override with actual passenger count from passenger table
      };
    });
    
    res.json(queryHelper.formatPaginatedResponse(count, transformedBookings, page, limit));
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
    const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
    const order = queryHelper.getSortingOptions(req.query, 'edtm', 'DESC');
    
    // Define filter map for Bookings
    const filterMap = {
      dateColumn: 'bk_trvldt',
      statusColumn: 'bk_status',
      searchColumns: ['bk_bkno', 'bk_customername', 'bk_phonenumber', 'bk_pnr'],
      customFilters: {
        fromStation: 'bk_fromst',
        toStation: 'bk_tost',
        travelClass: 'bk_class'
      }
    };
    
    const where = queryHelper.buildWhereClause(req.query, filterMap);

    // Check if user is admin or employee
    const allowedRoles = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'];
    const checkAdmin = (req.user.us_usertype || req.user.usertype || '').toLowerCase() === 'admin';
    const checkRoidAdmin = (req.user.us_roid || '').toLowerCase() === 'admin' || req.user.us_roid === 'ADM';
    const isAuthorizedEmployee = allowedRoles.includes(req.user.us_roid) || checkAdmin || checkRoidAdmin;
    
    if (!isAuthorizedEmployee) {
      // For non-employee users, return their own bookings
      where.bk_usid = req.user.us_usid;
    }
    
    // Exclude inactive bookings
    where.bk_status = { [Op.ne]: 'INACTIVE' };

    const { count, rows: bookings } = await BookingTVL.findAndCountAll({
      where,
      order,
      limit,
      offset
    });
    
    // Batch fetch passenger counts for all bookings
    const bookingIds = bookings.map(booking => booking.bk_bkid);
    const passengerCounts = {};
    
    // Get passenger counts in batch
    const passengerCountResults = await Passenger.findAll({
      attributes: ['ps_bkid', [Sequelize.fn('COUNT', Sequelize.col('ps_psid')), 'count']],
      where: {
        ps_bkid: { [Sequelize.Op.in]: bookingIds },
        ps_active: 1
      },
      group: ['ps_bkid']
    });
    
    passengerCountResults.forEach(result => {
      passengerCounts[result.ps_bkid] = result.dataValues.count;
    });
    
    // Batch fetch station information
    const stationCodes = [...new Set([
      ...bookings.map(b => b.bk_fromst),
      ...bookings.map(b => b.bk_tost)
    ])];
    
    const stations = await Station.findAll({
      where: {
        st_stcode: { [Sequelize.Op.in]: stationCodes }
      }
    });
    
    const stationMap = {};
    stations.forEach(station => {
      stationMap[station.st_stcode] = station.st_stname || station.st_stcode;
    });
    
    // Transform data to match frontend expectations with batched data
    const transformedBookings = bookings.map(booking => {
      const passengerCount = passengerCounts[booking.bk_bkid] || 0;
      
      const fromStationName = stationMap[booking.bk_fromst] || booking.bk_fromst || 'Unknown';
      const toStationName = stationMap[booking.bk_tost] || booking.bk_tost || 'Unknown';
      
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
    });
    
    res.json(queryHelper.formatPaginatedResponse(count, transformedBookings, page, limit));
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
    const booking = await BookingTVL.findOne({
      where: {
        bk_bkid: req.params.id,
        bk_status: { [Sequelize.Op.ne]: 'INACTIVE' } // Exclude inactive bookings
      }
    });
    
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
      bk_quota: booking.bk_quota,        // ✓ Add quota information
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
    const booking = await BookingTVL.findOne({
      where: {
        bk_bkid: req.params.id,
        bk_status: { [Sequelize.Op.ne]: 'INACTIVE' } // Exclude inactive bookings
      }
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or is inactive' });
    }
    
    // Check if user has permission to update this booking
    if (req.user.us_roid !== 'ADM' && booking.bk_usid !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      // Disable foreign key checks for this specific transaction's connection
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      
      const { passengerList, 
              bk_fromst, bk_tost, bk_trvldt, bk_class, bk_quota, 
              bk_berthpref, bk_totalpass, bk_remarks, bk_status,
              bk_phonenumber, bk_customername, bk_pnr,
              mby, ...otherFields } = req.body;
      
      // Prepare update data with only valid BookingTVL fields
      const updateData = {};
      
      // Map incoming fields to BookingTVL model fields
      if (bk_fromst !== undefined) updateData.bk_fromst = bk_fromst;
      if (bk_tost !== undefined) updateData.bk_tost = bk_tost;
      if (bk_trvldt !== undefined) updateData.bk_trvldt = bk_trvldt;
      if (bk_class !== undefined) updateData.bk_class = bk_class;
      if (bk_quota !== undefined) updateData.bk_quota = bk_quota;
      if (bk_berthpref !== undefined) updateData.bk_berthpref = bk_berthpref;
      if (bk_totalpass !== undefined) updateData.bk_totalpass = bk_totalpass;
      if (bk_remarks !== undefined) updateData.bk_remarks = bk_remarks;
      if (bk_status !== undefined) updateData.bk_status = bk_status;
      if (bk_phonenumber !== undefined) updateData.bk_phonenumber = bk_phonenumber;
      if (bk_customername !== undefined) updateData.bk_customername = bk_customername;
      if (bk_pnr !== undefined) updateData.bk_pnr = bk_pnr;
      
      // Always update modified by field
      updateData.mby = mby || req.user.us_usid;
      
      console.log('Updating booking with data:', updateData);
      
      // Update booking details with validated fields only
      await booking.update(updateData, { 
        transaction,
        userId: convertUserIdToInt(req.user.us_usid)  // Convert to integer for BookingTVL audit hooks
      });
      
      // If passenger list is provided, update passenger records - OPTIMIZED BATCH PROCESSING
      if (passengerList && Array.isArray(passengerList)) {
        // First, mark all existing passengers as inactive for this booking
        await Passenger.update(
          { ps_active: 0, mby: req.user.us_usid },
          { 
            where: { ps_bkid: booking.bk_bkid }, 
            transaction,
            userId: req.user.us_usid  // Pass userId for audit hooks
          }
        );
        
        // Batch process passengers for better performance
        const validPassengers = passengerList.filter(p => p.name && p.name.trim() !== '');
        
        if (validPassengers.length > 0) {
          // Prepare batch data
          const passengerDataBatch = validPassengers.map(passenger => ({
            ps_bkid: booking.bk_bkid,
            ps_fname: passenger.name.split(' ')[0] || '',
            ps_lname: passenger.name.split(' ').slice(1).join(' ') || null,
            ps_age: parseInt(passenger.age) || 0,
            ps_gender: passenger.gender || 'M',
            ps_berthpref: passenger.berthPreference || null,
            ps_idtype: passenger.idProofType || null,
            ps_idno: passenger.idProofNumber || null,
            ps_active: 1,
            eby: req.user.us_usid,
            mby: req.user.us_usid
          }));
          
          // Batch insert for better performance
          await Passenger.bulkCreate(passengerDataBatch, { 
            transaction,
            userId: req.user.us_usid  // Pass userId for audit hooks
          });
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      // Re-enable foreign key checks
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      res.json({
        success: true,
        data: {
          ...booking.toJSON(),
          message: 'Booking updated successfully'
        }
      });
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      // Re-enable foreign key checks even on error
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
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
    const booking = await BookingTVL.findOne({
      where: {
        bk_bkid: req.params.id,
        bk_status: { [Sequelize.Op.ne]: 'INACTIVE' } // Exclude inactive bookings
      }
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or is inactive' });
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
    }, {
      userId: req.user.us_usid  // Pass userId for audit hooks
    });
    
    res.json({
      success: true,
      data: {
        ...booking.toJSON(),
        message: 'Booking cancelled successfully'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft delete booking - Mark as inactive instead of hard deletion
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
    
    // Use transaction to ensure all operations succeed or fail together
    const transaction = await sequelize.transaction();
    
    try {
      // Mark the booking as inactive instead of deleting it
      await booking.update({ 
        bk_status: 'INACTIVE',
        mby: req.user.us_usid,
        mdtm: new Date()
      }, { 
        transaction,
        userId: req.user.us_usid  // Pass userId for audit hooks
      });
      
      // Log the soft deletion for audit purposes
      console.log(`[BOOKING SOFT DELETE AUDIT] Booking ${booking.bk_bkid} marked as INACTIVE by user ${req.user.us_usid}.`);
      
      // Commit the transaction
      await transaction.commit();
      
      res.json({ 
        success: true, 
        data: { 
          message: 'Booking marked as inactive successfully',
          bookingId: booking.bk_bkid
        } 
      });
    } catch (transactionError) {
      // Rollback the transaction on error
      await transaction.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error('Soft delete booking error:', error);
    
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
    }, {
      userId: req.user.us_usid  // Pass userId for audit hooks
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
    
    // Check if booking is inactive before approving
    if (booking.bk_status === 'INACTIVE') {
      return res.status(400).json({ message: 'Cannot approve an inactive booking' });
    }
    
    // Update booking status to PENDING
    await booking.update({ 
      bk_status: 'PENDING',
      mby: req.user.us_usid 
    }, {
      userId: req.user.us_usid  // Pass userId for audit hooks
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
    
    // Check if booking is inactive before confirming
    if (booking.bk_status === 'INACTIVE') {
      return res.status(400).json({ message: 'Cannot confirm an inactive booking' });
    }
    
    // Check if billing already exists for this booking to maintain consistency
    const { BillingMaster } = require('../models');
    const existingBilling = await BillingMaster.findOne({
      where: { bl_booking_id: bookingId }
    });

    if (existingBilling) {
      return res.status(400).json({ 
        success: false, 
        message: 'Billing already exists for this booking' 
      });
    }
    
    // Update booking status to CONFIRMED
    await booking.update({ 
      bk_status: 'CONFIRMED',
      mby: req.user.us_usid 
    }, {
      userId: req.user.us_usid  // Pass userId for audit hooks
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
    
    // Create bill automatically using the unified BillingMaster system (BillingMaster and Op already imported above)
    const { Customer } = require('../models');
    
    // Generate unique bill number in format: BL-YYMMDD-NNNN (max 15 chars)
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // Generate unique entry number (format: YYYYMMDD-XXX)
    const dateStr = now.getFullYear() + 
                   String(now.getMonth() + 1).padStart(2, '0') + 
                   String(now.getDate()).padStart(2, '0');
    
    // Find next sequence number for today
    const { Op } = require('sequelize');
    const existingBills = await BillingMaster.findAll({
      where: {
        bl_entry_no: {
          [Op.like]: `${dateStr}%`
        }
      }
    });
    
    const nextSeq = existingBills.length + 1;
    const entryNo = `${dateStr}-${String(nextSeq).padStart(3, '0')}`;
    
    // Generate bill number
    const billNumber = `BL-${year}${month}${day}-${String(nextSeq).padStart(4, '0')}`;
    
    // Fetch customer name
    const customer = await Customer.findOne({ where: { cu_usid: booking.bk_usid } });
    const customerName = customer ? customer.cu_name : '';
    
    // Calculate totals
    const totalAmountCalculated = (bookingAmount || 0) + 
                                 (serviceCharges || 0) + 
                                 (platformFees || 0) + 
                                 (agentFees || 0) +
                                 (extraCharges?.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0) || 0) -
                                 (discounts?.reduce((sum, discount) => sum + parseFloat(discount.amount || 0), 0) || 0);
    
    const bill = await BillingMaster.create({
      bl_entry_no: entryNo,
      bl_bill_no: billNumber,
      bl_booking_id: booking.bk_bkid,
      bl_booking_no: booking.bk_bkno,
      bl_billing_date: new Date(),
      bl_journey_date: travelDate,
      bl_customer_name: customerName,
      bl_customer_phone: booking.bk_phonenumber,
      bl_station_boy: '', // Will be filled later
      bl_from_station: booking.bk_fromst,
      bl_to_station: booking.bk_tost,
      bl_train_no: trainNumber,
      bl_class: travelClass,
      bl_pnr: pnrNumber,
      bl_seats_reserved: '', // Will be filled later
      bl_railway_fare: bookingAmount || 0,
      bl_service_charge: serviceCharges || 0,
      bl_platform_fee: platformFees || 0,
      bl_sb_incentive: agentFees || 0,
      bl_misc_charges: extraCharges?.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0) || 0,
      bl_gst: 0, // Will be calculated later
      bl_delivery_charge: 0, // Will be added later
      bl_cancellation_charge: 0, // Will be added later
      bl_surcharge: 0, // Will be added later
      bl_discount: discounts?.reduce((sum, discount) => sum + parseFloat(discount.amount || 0), 0) || 0,
      bl_total_amount: totalAmountCalculated,
      bl_created_by: req.user.us_usid,
      bl_status: 'CONFIRMED',
      status: 'OPEN',
      // Standard audit fields
      entered_by: req.user.us_usid,
      entered_on: new Date()
    }, {
      userId: req.user.us_usid // Pass userId for hooks
    });
    
    // Update booking status to CONFIRMED and mark as billed
    await booking.update({
      bk_status: 'CONFIRMED',
      bk_billed: 1,
      mby: req.user.us_usid,
      mdtm: new Date()
    }, {
      userId: req.user.us_usid  // Pass userId for audit hooks
    });
    
    // Update passenger records with the billing number
    const { Passenger } = require('../models'); // Import the Passenger model
    try {
      // Update all active passengers for this booking with the billing number
      const [updateResult] = await sequelizeTVL.query(
        `UPDATE psXpassenger 
         SET bl_bill_no = :billNumber, 
             mdtm = NOW(), 
             mby = :modifiedBy 
         WHERE ps_bkid = :bookingId AND ps_active = 1`,
        {
          replacements: {
            billNumber: billNumber,
            modifiedBy: req.user.us_usid,
            bookingId: booking.bk_bkid
          },
          type: sequelizeTVL.QueryTypes.UPDATE
        }
      );
      
      console.log(`📊 Updated ${updateResult.affectedRows} passengers with billing number ${billNumber}`);
    } catch (passengerError) {
      console.error('⚠️ Error updating passenger records with billing number:', passengerError);
      // Don't throw error here as the bill has already been created successfully
      // The passengers can be updated later if needed
    }
    
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
    
    let whereConditions = { 
      [Sequelize.Op.and]: [
        { bk_status: status },
        { bk_status: { [Sequelize.Op.ne]: 'INACTIVE' } } // Exclude inactive bookings
      ]
    };
    
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
    const bookingId = req.params.bookingId || req.params.id;
    
    // Check if user has permission to view this booking's passengers
    const booking = await BookingTVL.findOne({
      where: {
        bk_bkid: bookingId,
        bk_status: { [Sequelize.Op.ne]: 'INACTIVE' } // Exclude inactive bookings
      },
      attributes: ['bk_bkid', 'bk_usid', 'bk_agent']  // Only needed fields
    });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' } 
      });
    }
    
    // Check if user has permission to view this booking
    const isAdmin = req.user.us_roid === 'ADM';
    const isOwner = booking.bk_usid === req.user.us_usid;
    const isAgent = booking.bk_agent === req.user.us_usid;
    
    if (!isAdmin && !isOwner && !isAgent) {
      return res.status(403).json({ 
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' } 
      });
    }
    
    // Use optimized PassengerTVL model for direct DB query
    const models = require('../models');
    const { PassengerTVL: Passenger } = models;
    
    // Get passengers for this booking using optimized query
    const passengers = await Passenger.findAll({
      where: { 
        ps_bkid: bookingId,
        ps_active: 1  // Only active passengers
      },
      order: [['ps_psid', 'ASC']]  // Order by passenger ID
    });
    
    // Transform passenger data to ensure consistent field names
    const transformedPassengers = passengers.map(passenger => {
      return {
        ps_psid: passenger.ps_psid,
        ps_fname: passenger.ps_fname,
        ps_lname: passenger.ps_lname,
        firstName: passenger.ps_fname,
        lastName: passenger.ps_lname,
        name: `${passenger.ps_fname} ${passenger.ps_lname || ''}`.trim(),
        age: passenger.ps_age,
        gender: passenger.ps_gender,
        berthPreference: passenger.ps_berthpref,
        berthAllocated: passenger.ps_berthalloc,
        seatNo: passenger.ps_seatno,
        coach: passenger.ps_coach,
        ps_idtype: passenger.ps_idtype,
        ps_idno: passenger.ps_idno,
        idProofType: passenger.ps_idtype,
        idProofNumber: passenger.ps_idno,
        id: passenger.ps_psid
      };
    });
    
    console.log(`Found ${passengers.length} passengers for booking ${bookingId}`);
    console.log('Raw passenger data:', passengers.map(p => ({
      ps_psid: p.ps_psid,
      ps_fname: p.ps_fname,
      ps_lname: p.ps_lname,
      ps_age: p.ps_age,
      ps_gender: p.ps_gender
    })));
    console.log('Transformed passenger data:', transformedPassengers);
    
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
    let whereConditions = {
      bk_status: { [Sequelize.Op.ne]: 'INACTIVE' } // Exclude inactive bookings by default
    };

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
      where: { 
        bk_agent: req.user.us_usid,
        bk_status: { [Sequelize.Op.ne]: 'INACTIVE' } // Exclude inactive bookings
      },
      order: [['edtm', 'DESC']]
    });
    
    // Batch fetch passenger counts for all bookings
    const bookingIds = bookings.map(booking => booking.bk_bkid);
    const passengerCounts = {};
    
    // Get passenger counts in batch
    const passengerCountResults = await Passenger.findAll({
      attributes: ['ps_bkid', [Sequelize.fn('COUNT', Sequelize.col('ps_psid')), 'count']],
      where: {
        ps_bkid: { [Sequelize.Op.in]: bookingIds },
        ps_active: 1
      },
      group: ['ps_bkid']
    });
    
    passengerCountResults.forEach(result => {
      passengerCounts[result.ps_bkid] = result.dataValues.count;
    });
    
    // Batch fetch station information
    const stationCodes = [...new Set([
      ...bookings.map(b => b.bk_fromst),
      ...bookings.map(b => b.bk_tost)
    ])];
    
    const stations = await Station.findAll({
      where: {
        st_stcode: { [Sequelize.Op.in]: stationCodes }
      }
    });
    
    const stationMap = {};
    stations.forEach(station => {
      stationMap[station.st_stcode] = station.st_stname || station.st_stcode;
    });
    
    // Transform data to match frontend expectations with batched data
    const transformedBookings = bookings.map(booking => {
      const passengerCount = passengerCounts[booking.bk_bkid] || 0;
      
      const fromStationName = stationMap[booking.bk_fromst] || booking.bk_fromst || 'Unknown';
      const toStationName = stationMap[booking.bk_tost] || booking.bk_tost || 'Unknown';
      
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
    });
    
    res.json({ success: true, data: { bookings: transformedBookings } });
  } catch (error) {
    console.error('Get assigned bookings error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['DRAFT', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'INACTIVE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'INVALID_STATUS', message: 'Invalid status value' } 
      });
    }
    
    // Find booking
    const booking = await BookingTVL.findOne({
      where: {
        bk_bkid: bookingId,
        bk_status: { [Sequelize.Op.ne]: 'INACTIVE' } // Don't allow updates to inactive bookings
      }
    });
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'Booking not found or is inactive' } 
      });
    }
    
    // Permission check
    if (req.user.us_roid !== 'ADM' && booking.bk_usid !== req.user.us_usid) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'Access denied' } 
      });
    }
    
    // Update status
    await booking.update({ 
      bk_status: status,
      mby: req.user.us_usid,
      mdtm: new Date()
    }, {
      userId: req.user.us_usid  // Pass userId for audit hooks
    });
    
    res.json({ 
      success: true, 
      data: booking,
      message: `Booking status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
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
  updateBookingStatus, // ✓ Add new function
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