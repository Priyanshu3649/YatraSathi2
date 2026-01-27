const { BillTVL, UserTVL, CustomerTVL: Customer, BookingTVL } = require('../models');
const { Sequelize } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

// Create a new bill
const createBill = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is required' });
    }
    
    const {
      bookingId,
      customerName,
      phoneNumber,
      stationBoy,
      fromStation,
      toStation,
      journeyDate,
      trainNumber,
      reservationClass,
      ticketType,
      pnrNumbers,
      seatsAlloted,
      railwayFare,
      stationBoyIncentive,
      serviceCharges,
      platformFees,
      miscCharges,
      deliveryCharges,
      cancellationCharges,
      gst,
      surcharge,
      discount,
      gstType,
      totalAmount,
      billDate,
      status,
      remarks
    } = req.body;

    // Log incoming request data for debugging
    console.log('📥 Billing creation request data:', {
      bookingId,
      customerName,
      phoneNumber,
      journeyDate,
      billDate: req.body.billDate
    });
    
    // Validate bookingId
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required for billing.' });
    }
    
    // Validate required fields
    if (!customerName || !phoneNumber) {
      return res.status(400).json({ message: 'Customer name and phone number are required.' });
    }
    
    // Validate journey date is provided
    if (!journeyDate) {
      return res.status(400).json({ message: 'Journey date is required.' });
    }
    
    // Validate sequelizeTVL is available
    if (!sequelizeTVL) {
      console.error('sequelizeTVL is undefined');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // Check booking status and existence
    const booking = await BookingTVL.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Billing can be generated for draft bookings only
    if (!booking.bk_status || booking.bk_status.toUpperCase() !== 'DRAFT') {
      return res.status(400).json({ message: 'Billing can only be generated for draft bookings.' });
    }

    // Check if bill already exists for this booking
    const existingBill = await BillTVL.findOne({ where: { bl_booking_id: bookingId } });
    if (existingBill) {
      return res.status(400).json({ message: 'A bill already exists for this booking.' });
    }

    // Generate bill number
    const billNumber = `BILL${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Calculate total amount based on provided financial fields
    let calculatedTotal = parseFloat(railwayFare) || 0;
    calculatedTotal += parseFloat(stationBoyIncentive) || 0;
    calculatedTotal += parseFloat(serviceCharges) || 0;
    calculatedTotal += parseFloat(platformFees) || 0;
    calculatedTotal += parseFloat(gst) || 0;
    calculatedTotal += parseFloat(miscCharges) || 0;
    calculatedTotal += parseFloat(deliveryCharges) || 0;
    calculatedTotal += parseFloat(cancellationCharges) || 0;
    calculatedTotal += parseFloat(surcharge) || 0;
    
    // Apply discount
    calculatedTotal -= parseFloat(discount) || 0;
    
    // Ensure calculated total is not negative
    calculatedTotal = Math.max(0, calculatedTotal);
    
    // Use provided totalAmount if available, otherwise use calculated
    const finalTotalAmount = totalAmount !== undefined ? parseFloat(totalAmount) : calculatedTotal;

    // Use transaction to ensure atomicity of bill creation and booking status update
    const transaction = await sequelizeTVL.transaction();
    
    try {
      // Create new bill
      const bill = await BillTVL.create({
        bl_entry_no: billNumber,
        bl_bill_no: billNumber,
        bl_booking_id: bookingId,
        bl_billing_date: new Date(), // Add required billing date
        bl_customer_name: customerName,
        bl_customer_phone: phoneNumber || '',
        bl_station_boy: stationBoy || '',
        bl_from_station: fromStation || '',
        bl_to_station: toStation || '',
        bl_journey_date: journeyDate || booking.bk_trvldt,
        bl_train_no: trainNumber,
        bl_class: reservationClass,
        bl_pnr: pnrNumbers || '',
        bl_seats_reserved: seatsAlloted || '',
        bl_railway_fare: railwayFare || 0,
        bl_sb_incentive: stationBoyIncentive || 0,
        bl_service_charge: serviceCharges || 0,
        bl_platform_fee: platformFees || 0,
        bl_misc_charges: miscCharges || 0,
        bl_delivery_charge: deliveryCharges || 0,
        bl_cancellation_charge: cancellationCharges || 0,
        bl_gst: gst || 0,
        bl_surcharge: surcharge || 0,
        bl_discount: discount || 0,
        bl_gst_type: gstType || 'EXCLUSIVE',
        bl_total_amount: finalTotalAmount,
        bl_created_by: req.user.us_usid
      }, { transaction });
      
      // Update booking status from 'DRAFT' to 'CONFIRMED'
      await BookingTVL.update({
        bk_status: 'CONFIRMED',
        mby: req.user.us_usid,
        mdtm: new Date()
      }, {
        where: { bk_bkid: bookingId },
        transaction
      });
      
      // Commit transaction
      await transaction.commit();
      
      res.status(201).json(bill);
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all bills for a customer
const getCustomerBills = async (req, res) => {
  try {
    const bills = await BillTVL.findAll({ 
      where: { bl_created_by: req.user.us_usid },
      order: [['bl_created_at', 'DESC']]
    });
    
    // Transform data to match frontend expectations
    const transformedBills = bills.map(bill => {
      const billData = bill.toJSON();
      return {
        ...billData,
        id: billData.bill_id,
        billId: billData.bill_no,
        customerId: billData.customer_id,
        customerName: billData.customer_name,
        trainNumber: billData.train_number,
        reservationClass: billData.reservation_class,
        ticketType: billData.ticket_type,
        pnrNumbers: JSON.parse(billData.pnr_numbers || '[]'),
        netFare: billData.net_fare,
        serviceCharges: billData.service_charges,
        platformFees: billData.platform_fees,
        agentFees: billData.agent_fees,
        extraCharges: JSON.parse(billData.extra_charges || '[]'),
        discounts: JSON.parse(billData.discounts || '[]'),
        totalAmount: billData.total_amount,
        billDate: billData.bill_date,
        createdOn: billData.created_on,
        createdBy: billData.created_by,
        modifiedOn: billData.modified_on,
        modifiedBy: billData.modified_by
      };
    });
    
    res.json(transformedBills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bills (admin and authorized employees)
const getAllBills = async (req, res) => {
  try {
    // Check permissions - handle both old user types and new role IDs
    const isEmployee = req.user.us_usertype === 'employee' || ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(req.user.us_roid);
    
    if (req.user.us_usertype !== 'admin' && req.user.us_roid !== 'ADM') {
      // For employee role IDs
      if (['AGT', 'ACC', 'MGT', 'ADM'].includes(req.user.us_roid)) {
        // Allow access for Agent, Accounts, Management, and Admin roles
        // No additional check needed
      } else if (isEmployee) {
        // For other employees, check if they have accounts department access
        const { emXemployee: Employee } = require('../models');
        const employee = await Employee.findOne({
          where: { em_usid: req.user.us_usid }
        });
        if (!employee || !['ACCOUNTS', 'FINANCE', 'MANAGEMENT'].includes(employee.em_dept)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Admin, Accounts, or Management access required.'
          });
        }
      } else {
        // For customers and unauthorized users
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin, Accounts, or Management access required.'
        });
      }
    }
    
    const bills = await BillTVL.findAll({
      order: [['bl_created_at', 'DESC']]
    });
    
    // Transform data to match frontend expectations
    const transformedBills = bills.map(bill => {
      const billData = bill.toJSON();
      return {
        ...billData,
        id: billData.bl_id,
        billId: billData.bl_bill_no,
        bookingId: billData.bl_booking_id,
        subBillNo: billData.bl_sub_bill_no,
        customerName: billData.bl_customer_name,
        phoneNumber: billData.bl_customer_phone,
        stationBoy: billData.bl_station_boy,
        fromStation: billData.bl_from_station,
        toStation: billData.bl_to_station,
        journeyDate: billData.bl_journey_date,
        trainNumber: billData.bl_train_no,
        reservationClass: billData.bl_class,
        ticketType: 'NORMAL', // Default ticket type since it's not in the model
        pnrNumbers: billData.bl_pnr,
        seatsAlloted: billData.bl_seats_reserved,
        passengerList: [], // Default empty passenger list since it's not in the model
        railwayFare: billData.bl_railway_fare,
        stationBoyIncentive: billData.bl_sb_incentive,
        serviceCharges: billData.bl_service_charge,
        platformFees: billData.bl_platform_fee,
        miscCharges: billData.bl_misc_charges,
        deliveryCharges: billData.bl_delivery_charge,
        cancellationCharges: billData.bl_cancellation_charge,
        gst: billData.bl_gst,
        surcharge: billData.bl_surcharge,
        gstType: billData.bl_gst_type,
        totalAmount: billData.bl_total_amount,
        billDate: billData.bl_billing_date,
        createdOn: billData.bl_created_at,
        createdBy: billData.bl_created_by,
        remarks: '', // Default empty remarks
        status: 'DRAFT' // Default status
      };
    });
    
    res.json({ success: true, data: { bills: transformedBills } });
  } catch (error) {
    console.error('Get all bills error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
  }
};

// Get bill by ID
const getBillById = async (req, res) => {
  try {
    const bill = await BillTVL.findByPk(req.params.id);
    
    // Check if bill exists
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Check if user has permission to view this bill
    if (req.user.us_usertype !== 'admin' && 
        bill.bl_created_by !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Transform data to match frontend expectations
    const billData = bill.toJSON();
    const transformedBill = {
      ...billData,
      id: billData.bl_id,
      billId: billData.bl_bill_no,
      bookingId: billData.bl_booking_id,
      subBillNo: billData.bl_sub_bill_no,
      customerName: billData.bl_customer_name,
      phoneNumber: billData.bl_customer_phone,
      stationBoy: billData.bl_station_boy,
      fromStation: billData.bl_from_station,
      toStation: billData.bl_to_station,
      journeyDate: billData.bl_journey_date,
      trainNumber: billData.bl_train_no,
      reservationClass: billData.bl_class,
      ticketType: 'NORMAL', // Default ticket type since it's not in the model
      pnrNumbers: billData.bl_pnr,
      seatsAlloted: billData.bl_seats_reserved,
      passengerList: [], // Default empty passenger list since it's not in the model
      railwayFare: billData.bl_railway_fare,
      stationBoyIncentive: billData.bl_sb_incentive,
      serviceCharges: billData.bl_service_charge,
      platformFees: billData.bl_platform_fee,
      miscCharges: billData.bl_misc_charges,
      deliveryCharges: billData.bl_delivery_charge,
      cancellationCharges: billData.bl_cancellation_charge,
      gst: billData.bl_gst,
      surcharge: billData.bl_surcharge,
      gstType: billData.bl_gst_type,
      totalAmount: billData.bl_total_amount,
      billDate: billData.bl_billing_date,
      createdOn: billData.bl_created_at,
      createdBy: billData.bl_created_by,
      remarks: '', // Default empty remarks
      status: 'DRAFT' // Default status
    };
    
    res.json(transformedBill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update bill
const updateBill = async (req, res) => {
  try {
    const bill = await BillTVL.findByPk(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Check if user has permission to update this bill
    if (req.user.us_usertype !== 'admin' && bill.bl_created_by !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if bill is already finalized/paid - cannot update
    if (bill.bl_status === 'FINAL' || bill.bl_status === 'PAID') {
      return res.status(400).json({ message: 'Cannot update a finalized or paid bill' });
    }
    
    // Calculate total amount if needed
    let totalAmount = req.body.railwayFare ? parseFloat(req.body.railwayFare) : parseFloat(bill.bl_railway_fare) || 0;
    totalAmount += req.body.serviceCharges ? parseFloat(req.body.serviceCharges) : parseFloat(bill.bl_service_charge) || 0;
    totalAmount += req.body.platformFees ? parseFloat(req.body.platformFees) : parseFloat(bill.bl_platform_fee) || 0;
    totalAmount += req.body.agentFees ? parseFloat(req.body.agentFees) : parseFloat(bill.bl_agent_fees) || 0;

    // Add extra charges
    const extraCharges = req.body.extraCharges || JSON.parse(bill.extra_charges || '[]');
    if (extraCharges && Array.isArray(extraCharges)) {
      extraCharges.forEach(charge => {
        if (charge.amount) {
          totalAmount += parseFloat(charge.amount) || 0;
        }
      });
    }

    // Apply discounts
    const discounts = req.body.discounts || JSON.parse(bill.discounts || '[]');
    if (discounts && Array.isArray(discounts)) {
      discounts.forEach(discount => {
        if (discount.amount) {
          if (discount.type === 'PERCENTAGE') {
            const discountAmount = (totalAmount * parseFloat(discount.amount)) / 100;
            totalAmount -= discountAmount;
          } else {
            totalAmount -= parseFloat(discount.amount) || 0;
          }
        }
      });
    }

    // Ensure total amount is not negative
    totalAmount = Math.max(0, totalAmount);

    // Update the bill
    await bill.update({
      ...req.body,
      bl_total_amount: totalAmount,
      bl_modified_by: req.user.us_usid,
      bl_modified_at: new Date()
    });
    
    // Transform data to match frontend expectations
    const billData = bill.toJSON();
    const transformedBill = {
      ...billData,
      id: billData.bl_id,
      billId: billData.bl_bill_no,
      bookingId: billData.bl_booking_id,
      subBillNo: billData.bl_sub_bill_no,
      customerName: billData.bl_customer_name,
      phoneNumber: billData.bl_customer_phone,
      stationBoy: billData.bl_station_boy,
      fromStation: billData.bl_from_station,
      toStation: billData.bl_to_station,
      journeyDate: billData.bl_journey_date,
      trainNumber: billData.bl_train_no,
      reservationClass: billData.bl_class,
      ticketType: 'NORMAL', // Default ticket type since it's not in the model
      pnrNumbers: billData.bl_pnr,
      seatsAlloted: billData.bl_seats_reserved,
      passengerList: [], // Default empty passenger list since it's not in the model
      railwayFare: billData.bl_railway_fare,
      stationBoyIncentive: billData.bl_sb_incentive,
      serviceCharges: billData.bl_service_charge,
      platformFees: billData.bl_platform_fee,
      miscCharges: billData.bl_misc_charges,
      deliveryCharges: billData.bl_delivery_charge,
      cancellationCharges: billData.bl_cancellation_charge,
      gst: billData.bl_gst,
      surcharge: billData.bl_surcharge,
      gstType: billData.bl_gst_type,
      totalAmount: billData.bl_total_amount,
      billDate: billData.bl_billing_date,
      createdOn: billData.bl_created_at,
      createdBy: billData.bl_created_by,
      remarks: '', // Default empty remarks
      status: 'DRAFT' // Default status
    };
    
    res.json(transformedBill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Finalize bill
const finalizeBill = async (req, res) => {
  try {
    const bill = await BillTVL.findByPk(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Check if user has permission to finalize this bill
    if (req.user.us_usertype !== 'admin' && req.user.us_usertype !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if bill is already finalized/paid
    if (bill.bl_status === 'FINAL' || bill.bl_status === 'PAID') {
      return res.status(400).json({ message: 'Bill is already finalized or paid' });
    }
    
    await bill.update({ 
      bl_status: 'FINAL',
      bl_modified_by: req.user.us_usid,
      bl_modified_at: new Date()
    });
    
    // Transform data to match frontend expectations
    const billData = bill.toJSON();
    const transformedBill = {
      ...billData,
      id: billData.bl_id,
      billId: billData.bl_bill_no,
      bookingId: billData.bl_booking_id,
      subBillNo: billData.bl_sub_bill_no,
      customerName: billData.bl_customer_name,
      phoneNumber: billData.bl_customer_phone,
      stationBoy: billData.bl_station_boy,
      fromStation: billData.bl_from_station,
      toStation: billData.bl_to_station,
      journeyDate: billData.bl_journey_date,
      trainNumber: billData.bl_train_no,
      reservationClass: billData.bl_class,
      ticketType: 'NORMAL', // Default ticket type since it's not in the model
      pnrNumbers: billData.bl_pnr,
      seatsAlloted: billData.bl_seats_reserved,
      passengerList: [], // Default empty passenger list since it's not in the model
      railwayFare: billData.bl_railway_fare,
      stationBoyIncentive: billData.bl_sb_incentive,
      serviceCharges: billData.bl_service_charge,
      platformFees: billData.bl_platform_fee,
      miscCharges: billData.bl_misc_charges,
      deliveryCharges: billData.bl_delivery_charge,
      cancellationCharges: billData.bl_cancellation_charge,
      gst: billData.bl_gst,
      surcharge: billData.bl_surcharge,
      gstType: billData.bl_gst_type,
      totalAmount: billData.bl_total_amount,
      billDate: billData.bl_billing_date,
      createdOn: billData.bl_created_at,
      createdBy: billData.bl_created_by,
      remarks: '', // Default empty remarks
      status: 'DRAFT' // Default status
    };
    
    res.json(transformedBill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete bill
const deleteBill = async (req, res) => {
  try {
    const bill = await BillTVL.findByPk(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Only admin can delete bills
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    // Cannot delete finalized or paid bills
    if (bill.bl_status === 'FINAL' || bill.bl_status === 'PAID') {
      return res.status(400).json({ message: 'Cannot delete a finalized or paid bill' });
    }
    
    await bill.destroy();
    
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: 'Cannot delete bill. Related records exist in other tables.' 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Search and filter bills
const searchBills = async (req, res) => {
  try {
    const {
      status,
      fromDate,
      toDate,
      customerId,
      customerName,
      minAmount,
      maxAmount,
      sortBy = 'created_on',
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    // Build query conditions
    let whereConditions = {};

    // Status filter
    if (status) {
      whereConditions.bl_status = status;
    }

    // Date range filter
    if (fromDate || toDate) {
      whereConditions.bill_date = {};
      if (fromDate) {
        whereConditions.bill_date[Sequelize.Op.gte] = new Date(fromDate);
      }
      if (toDate) {
        whereConditions.bill_date[Sequelize.Op.lte] = new Date(toDate);
      }
    }

    // Customer filter
    if (customerId) {
      whereConditions.customer_id = customerId;
    }

    if (customerName) {
      whereConditions.customer_name = {
        [Sequelize.Op.like]: `%${customerName}%`
      };
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      whereConditions.total_amount = {};
      if (minAmount) {
        whereConditions.total_amount[Sequelize.Op.gte] = parseFloat(minAmount);
      }
      if (maxAmount) {
        whereConditions.total_amount[Sequelize.Op.lte] = parseFloat(maxAmount);
      }
    }

    // Apply user-specific filters
    if (req.user.us_usertype === 'customer') {
      // Customers can only see their own bills
      whereConditions.bl_created_by = req.user.us_usid;
    }

    // Build query
    const offset = (page - 1) * limit;
    const { count, rows: bills } = await BillTVL.findAndCountAll({
      where: whereConditions,
      order: [[sortBy === 'created_on' ? 'bl_created_at' : sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Transform data to match frontend expectations
    const transformedBills = bills.map(bill => {
      const billData = bill.toJSON();
      return {
        ...billData,
        id: billData.bl_id,
        billId: billData.bl_bill_no,
        bookingId: billData.bl_booking_id,
        subBillNo: billData.bl_sub_bill_no,
        customerName: billData.bl_customer_name,
        phoneNumber: billData.bl_customer_phone,
        stationBoy: billData.bl_station_boy,
        fromStation: billData.bl_from_station,
        toStation: billData.bl_to_station,
        journeyDate: billData.bl_journey_date,
        trainNumber: billData.bl_train_no,
        reservationClass: billData.bl_class,
        ticketType: 'NORMAL', // Default ticket type since it's not in the model
        pnrNumbers: billData.bl_pnr,
        seatsAlloted: billData.bl_seats_reserved,
        passengerList: [], // Default empty passenger list since it's not in the model
        railwayFare: billData.bl_railway_fare,
        stationBoyIncentive: billData.bl_sb_incentive,
        serviceCharges: billData.bl_service_charge,
        platformFees: billData.bl_platform_fee,
        miscCharges: billData.bl_misc_charges,
        deliveryCharges: billData.bl_delivery_charge,
        cancellationCharges: billData.bl_cancellation_charge,
        gst: billData.bl_gst,
        surcharge: billData.bl_surcharge,
        gstType: billData.bl_gst_type,
        totalAmount: billData.bl_total_amount,
        billDate: billData.bl_billing_date,
        createdOn: billData.bl_created_at,
        createdBy: billData.bl_created_by,
        remarks: '', // Default empty remarks
        status: 'DRAFT' // Default status
      };
    });

    res.json({
      bills: transformedBills,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalBills: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get customer ledger
const getCustomerLedger = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Check if user has permission to access this customer's ledger
    if (req.user.us_usertype !== 'admin' && 
        req.user.us_usertype !== 'employee' && 
        req.user.us_usid !== customerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all bills for the customer
    const bills = await BillTVL.findAll({
      where: { bl_created_by: customerId },
      order: [['bl_billing_date', 'ASC']]
    });

    // Get all payments for the customer
    const { PaymentTVL } = require('../models');
    const payments = await PaymentTVL.findAll({
      where: { pt_usid: customerId },
      order: [['pt_pymtdt', 'ASC']]
    });

    // Combine bills and payments into ledger entries
    const ledgerEntries = [];

    // Add bills as debit entries
    bills.forEach(bill => {
      ledgerEntries.push({
        date: bill.bl_billing_date,
        billId: bill.bl_bill_no,
        description: `Bill #${bill.bl_bill_no} - ${bill.bl_class || ''} - ${bill.bl_train_no || ''}`,
        debit: parseFloat(bill.bl_total_amount),
        credit: 0,
        balance: 0 // Will calculate later
      });
    });

    // Add payments as credit entries
    payments.forEach(payment => {
      ledgerEntries.push({
        date: payment.pt_pymtdt,
        billId: payment.pt_bkid ? `BK${payment.pt_bkid}` : null,
        description: `Payment #${payment.pt_ptid} - ${payment.pt_mode || ''}`,
        debit: 0,
        credit: parseFloat(payment.pt_amount),
        balance: 0 // Will calculate later
      });
    });

    // Sort by date
    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    ledgerEntries.forEach(entry => {
      runningBalance += (entry.debit || 0) - (entry.credit || 0);
      entry.balance = runningBalance;
    });

    res.json({
      ledger: ledgerEntries,
      customer: customerId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get customer balance
const getCustomerBalance = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Check if user has permission to access this customer's balance
    if (req.user.us_usertype !== 'admin' && 
        req.user.us_usertype !== 'employee' && 
        req.user.us_usid !== customerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get total billed amount for the customer
    const bills = await BillTVL.findAll({
      where: { 
        bl_created_by: customerId,
        bl_status: { [Sequelize.Op.in]: ['FINAL', 'PAID'] } // Only finalized/paid bills
      }
    });

    let totalBilled = 0;
    bills.forEach(bill => {
      totalBilled += parseFloat(bill.bl_total_amount) || 0;
    });

    // Get total received payments for the customer
    const { PaymentTVL } = require('../models');
    const payments = await PaymentTVL.findAll({
      where: { pt_usid: customerId }
    });

    let totalReceived = 0;
    payments.forEach(payment => {
      totalReceived += parseFloat(payment.pt_amount) || 0;
    });

    // Calculate net due or advance
    let netDue = 0;
    let netAdvance = 0;

    if (totalBilled > totalReceived) {
      netDue = totalBilled - totalReceived;
    } else {
      netAdvance = totalReceived - totalBilled;
    }

    res.json({
      totalBilled,
      totalReceived,
      netDue,
      netAdvance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBill,
  getCustomerBills,
  getAllBills,
  getBillById,
  updateBill,
  finalizeBill,
  deleteBill,
  searchBills,
  getCustomerLedger,
  getCustomerBalance
};