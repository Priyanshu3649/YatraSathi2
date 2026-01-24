const { BillTVL, UserTVL, CustomerTVL: Customer, BookingTVL } = require('../models');
const { Sequelize } = require('sequelize');
const { sequelizeTVL } = require('../models/baseModel');

// Create a new bill
const createBill = async (req, res) => {
  try {
    const {
      bookingId,
      customerId,
      customerName,
      trainNumber,
      reservationClass,
      ticketType,
      pnrNumbers,
      netFare,
      serviceCharges,
      platformFees,
      agentFees,
      extraCharges,
      discounts,
      billDate,
      status,
      remarks
    } = req.body;

    // Validate bookingId
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required for billing.' });
    }

    // Check booking status and existence
    const booking = await BookingTVL.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Billing is generated only from confirmed Bookings
    if (!booking.bk_status || booking.bk_status.toUpperCase() !== 'CONFIRMED') {
      return res.status(400).json({ message: 'Billing can only be generated for confirmed bookings.' });
    }

    // Check if bill already exists for this booking
    const existingBill = await BillTVL.findOne({ where: { booking_id: bookingId } });
    if (existingBill) {
      return res.status(400).json({ message: 'A bill already exists for this booking.' });
    }

    // Generate bill number
    const billNumber = `BILL${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Calculate total amount
    let totalAmount = parseFloat(netFare) || 0;
    totalAmount += parseFloat(serviceCharges) || 0;
    totalAmount += parseFloat(platformFees) || 0;
    totalAmount += parseFloat(agentFees) || 0;

    // Add extra charges
    if (extraCharges && Array.isArray(extraCharges)) {
      extraCharges.forEach(charge => {
        if (charge.amount) {
          totalAmount += parseFloat(charge.amount) || 0;
        }
      });
    }

    // Apply discounts
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

    // Create new bill
    const bill = await BillTVL.create({
      bill_no: billNumber,
      booking_id: bookingId,
      customer_id: customerId,
      customer_name: customerName,
      train_number: trainNumber,
      reservation_class: reservationClass,
      ticket_type: ticketType,
      pnr_numbers: JSON.stringify(pnrNumbers || []),
      net_fare: netFare || 0,
      service_charges: serviceCharges || 0,
      platform_fees: platformFees || 0,
      agent_fees: agentFees || 0,
      extra_charges: JSON.stringify(extraCharges || []),
      discounts: JSON.stringify(discounts || []),
      total_amount: totalAmount,
      bill_date: billDate,
      status: status || 'DRAFT',
      remarks: remarks || null,
      created_by: req.user.us_usid,
      modified_by: req.user.us_usid
    });

    res.status(201).json(bill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all bills for a customer
const getCustomerBills = async (req, res) => {
  try {
    const bills = await BillTVL.findAll({ 
      where: { customer_id: req.user.us_usid },
      order: [['created_on', 'DESC']]
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
      order: [['created_on', 'DESC']]
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
        bill.customer_id !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Transform data to match frontend expectations
    const billData = bill.toJSON();
    const transformedBill = {
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
    if (req.user.us_usertype !== 'admin' && bill.customer_id !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if bill is already finalized/paid - cannot update
    if (bill.status === 'FINAL' || bill.status === 'PAID') {
      return res.status(400).json({ message: 'Cannot update a finalized or paid bill' });
    }
    
    // Calculate total amount if needed
    let totalAmount = req.body.netFare ? parseFloat(req.body.netFare) : parseFloat(bill.net_fare) || 0;
    totalAmount += req.body.serviceCharges ? parseFloat(req.body.serviceCharges) : parseFloat(bill.service_charges) || 0;
    totalAmount += req.body.platformFees ? parseFloat(req.body.platformFees) : parseFloat(bill.platform_fees) || 0;
    totalAmount += req.body.agentFees ? parseFloat(req.body.agentFees) : parseFloat(bill.agent_fees) || 0;

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
      total_amount: totalAmount,
      modified_by: req.user.us_usid,
      modified_on: new Date()
    });
    
    // Transform data to match frontend expectations
    const billData = bill.toJSON();
    const transformedBill = {
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
    if (bill.status === 'FINAL' || bill.status === 'PAID') {
      return res.status(400).json({ message: 'Bill is already finalized or paid' });
    }
    
    await bill.update({ 
      status: 'FINAL',
      modified_by: req.user.us_usid,
      modified_on: new Date()
    });
    
    // Transform data to match frontend expectations
    const billData = bill.toJSON();
    const transformedBill = {
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
    if (bill.status === 'FINAL' || bill.status === 'PAID') {
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
      whereConditions.status = status;
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
      whereConditions.customer_id = req.user.us_usid;
    }

    // Build query
    const offset = (page - 1) * limit;
    const { count, rows: bills } = await BillTVL.findAndCountAll({
      where: whereConditions,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
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
      where: { customer_id: customerId },
      order: [['bill_date', 'ASC']]
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
        date: bill.bill_date,
        billId: bill.bill_no,
        description: `Bill #${bill.bill_no} - ${bill.reservation_class || ''} - ${bill.train_number || ''}`,
        debit: parseFloat(bill.total_amount),
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
        customer_id: customerId,
        status: { [Sequelize.Op.in]: ['FINAL', 'PAID'] } // Only finalized/paid bills
      }
    });

    let totalBilled = 0;
    bills.forEach(bill => {
      totalBilled += parseFloat(bill.total_amount) || 0;
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