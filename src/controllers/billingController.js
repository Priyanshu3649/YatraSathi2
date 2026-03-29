// Import required models
const { BillTVL, UserTVL, CustomerTVL: Customer, BookingTVL, Journal, PassengerTVL: Passenger, ForensicAuditLog, Company, Receipt } = require('../models');
const { Sequelize, Op } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');
const billCancellation = require('../services/billCancellationService');
const { notifyBillCancelled } = require('../services/emailService');
const queryHelper = require('../utils/queryHelper');
const RealTimeService = require('../services/realTimeService');
const { generateBillPDF } = require('../utils/billPdfGenerator');

// Helper function to generate journal entry number
function generateJournalEntryNo(prefix) {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${year}${month}${day}${random}`;
}

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

function parseAmount(value) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
}

function buildUserDisplayName(user) {
  if (!user) {
    return null;
  }

  const fullName = [user.us_fname, user.us_lname].filter(Boolean).join(' ').trim();
  return fullName || user.us_usname || user.us_usid || null;
}

async function resolveAuditUserLabel(userRef) {
  if (userRef === null || userRef === undefined || userRef === '') {
    return null;
  }

  const normalizedRef = String(userRef);
  let user = await UserTVL.findByPk(normalizedRef);

  if (!user && /^\d+$/.test(normalizedRef)) {
    user = await UserTVL.findOne({
      where: {
        us_usid: { [Op.like]: `%${normalizedRef}` }
      },
      order: [['us_usid', 'ASC']]
    });
  }

  return buildUserDisplayName(user) || normalizedRef;
}

function isPrivilegedBillingUser(user) {
  if (!user) {
    return false;
  }

  return ['admin', 'employee'].includes(user.us_usertype) ||
    ['ADM', 'MGT', 'ACC', 'AGT', 'HR', 'CC', 'MKT'].includes(user.us_roid) ||
    user.us_admin === 1 ||
    user.us_appadmin === 1;
}

async function getBillingCompany(user) {
  const companyWhere = user?.us_coid ? { co_coid: user.us_coid } : { co_active: 1 };
  const company = await Company.findOne({
    where: companyWhere,
    order: [['co_coid', 'ASC']]
  });

  if (!company) {
    return {
      name: 'Anmol Travels',
      address: 'Address unavailable',
      phone: 'N/A',
      gst: 'N/A'
    };
  }

  const address = [
    company.co_addr1,
    company.co_addr2,
    company.co_city,
    company.co_state,
    company.co_pin
  ].filter(Boolean).join(', ');

  return {
    name: company.co_codesc || company.co_coshort || 'Anmol Travels',
    address: address || 'Address unavailable',
    phone: company.co_phone || 'N/A',
    gst: company.co_gst || 'N/A'
  };
}

async function resolveBillForPrint(billIdParam) {
  if (billIdParam === undefined || billIdParam === null) {
    return null;
  }

  const raw = String(billIdParam).trim();
  if (!raw) {
    return null;
  }

  let bill = await BillTVL.findByPk(raw);
  if (!bill && /^\d+$/.test(raw)) {
    bill = await BillTVL.findByPk(parseInt(raw, 10));
  }
  if (!bill) {
    bill = await BillTVL.findOne({ where: { bl_bill_no: raw } });
  }
  if (!bill) {
    bill = await BillTVL.findOne({ where: { bl_entry_no: raw } });
  }

  return bill;
}

async function getBillPassengers(bill) {
  const passengerWhere = { ps_active: 1 };

  if (bill.bl_booking_id) {
    passengerWhere.ps_bkid = bill.bl_booking_id;
  }

  const passengers = await Passenger.findAll({
    where: passengerWhere,
    order: [['ps_psid', 'ASC']]
  });

  return passengers
    .filter((passenger) => !bill.bl_bill_no || passenger.bl_bill_no === bill.bl_bill_no || passenger.ps_bkid === bill.bl_booking_id)
    .map((passenger) => ({
      id: passenger.ps_psid,
      name: [passenger.ps_fname, passenger.ps_lname].filter(Boolean).join(' ').trim() || 'Unnamed Passenger',
      age: passenger.ps_age ?? 'N/A',
      gender: passenger.ps_gender || 'N/A',
      coach: passenger.ps_coach || '-',
      seatNo: passenger.ps_seatno || '-',
      berth: passenger.ps_berthalloc || passenger.ps_berthpref || '-',
      idType: passenger.ps_idtype || '',
      idNumber: passenger.ps_idno || ''
    }));
}


async function getBillPrintPayload(bill, booking, user) {
  const [company, passengers, receiptEntries, journalEntries, auditLogs] = await Promise.all([
    getBillingCompany(user),
    getBillPassengers(bill),
    Receipt.findAll({
      where: {
        [Op.or]: [
          { rc_ref_number: bill.bl_bill_no },
          { 
            [Op.and]: [
              { rc_customer_phone: bill.bl_customer_phone || '' },
              { rc_customer_name: bill.bl_customer_name || '' }
            ]
          }
        ]
      },
      order: [['rc_date', 'ASC'], ['rc_rcid', 'ASC']]
    }),
    Journal.findAll({
      where: {
        [Op.or]: [
          { je_ref_number: bill.bl_bill_no },
          { je_narration: { [Op.like]: `%${bill.bl_bill_no}%` } }
        ]
      },
      order: [['je_date', 'ASC'], ['je_jeid', 'ASC']]
    }),
    ForensicAuditLog.findAll({
      where: {
        entityName: 'BILL',
        entityId: bill.bl_id
      },
      order: [['performedOn', 'DESC']]
    })
  ]);

  const totalAmount = parseAmount(bill.bl_total_amount);
  const baseAmount = parseAmount(bill.bl_railway_fare);
  const taxAmount = parseAmount(bill.bl_gst);
  const cancellationCharges = parseAmount(bill.total_cancel_charges);
  const refundAmount = parseAmount(bill.refund_amount);
  
  // Calculate paid amount from receipts
  const receiptTotal = receiptEntries.reduce((sum, receipt) => sum + parseAmount(receipt.rc_amount), 0);
  
  // Financial logic for display
  const isCancelled = Boolean(bill.is_cancelled || bill.bl_status === 'CANCELLED' || bill.status === 'CANCELLED');
  const paidAmount = isCancelled ? Math.max(0, totalAmount - refundAmount) : receiptTotal;
  const balanceAmount = isCancelled ? refundAmount : Math.max(0, totalAmount - paidAmount);

  // Resolve audit users
  const createdAudit = auditLogs.find(entry => entry.actionType === 'CREATE');
  const updatedAudit = auditLogs.find(entry => entry.actionType === 'UPDATE');
  const closedAudit = auditLogs.find(entry => ['CLOSE', 'CANCEL'].includes(entry.actionType));

  const [enteredBy, modifiedBy, closedBy] = await Promise.all([
    resolveAuditUserLabel(bill.entered_by || bill.bl_created_by || createdAudit?.performedBy),
    resolveAuditUserLabel(bill.modified_by || bill.mby || updatedAudit?.performedBy),
    resolveAuditUserLabel(bill.closed_by || bill.cancelled_by || closedAudit?.performedBy)
  ]);

  return {
    company,
    bill: {
      billId: bill.bl_id,
      billNumber: bill.bl_bill_no || `BILL-${bill.bl_id}`,
      date: bill.bl_bill_date || bill.bl_billing_date,
      status: bill.bl_status || bill.status || 'ACTIVE'
    },
    customer: {
      name: bill.bl_customer_name || booking?.bk_customername || 'Unknown Customer',
      phone: bill.bl_customer_phone || booking?.bk_phonenumber || 'N/A'
    },
    booking: {
      bookingId: bill.bl_booking_id,
      bookingNumber: booking?.bk_bkno || bill.bl_booking_no || null,
      travelDetails: [bill.bl_from_station || booking?.bk_fromst, bill.bl_to_station || booking?.bk_tost].filter(Boolean).join(' -> '),
      journeyDate: bill.bl_journey_date || booking?.bk_trvldt || null,
      trainNumber: bill.bl_train_no || null,
      reservationClass: bill.bl_class || booking?.bk_class || null,
      pnr: bill.bl_pnr || booking?.bk_pnr || null,
      seatsReserved: bill.bl_seats_reserved || null
    },
    passengers,
    financials: {
      baseAmount,
      tax: taxAmount,
      total: totalAmount,
      paid: paidAmount,
      balance: balanceAmount
    },
    cancellation: {
      isCancelled,
      charges: cancellationCharges,
      refundAmount
    },
    audit: {
      enteredBy: enteredBy || 'System',
      enteredOn: bill.entered_on || bill.bl_created_at || createdAudit?.performedOn || null,
      modifiedBy: modifiedBy || null,
      modifiedOn: bill.modified_on || bill.bl_modified_at || updatedAudit?.performedOn || null,
      closedBy: closedBy || null,
      closedOn: bill.closed_on || bill.cancelled_on || closedAudit?.performedOn || null
    },
    jespr: {
      sales: {
        entryNo: bill.bl_entry_no || bill.bl_bill_no,
        date: bill.bl_bill_date || bill.bl_billing_date,
        account: 'Sales',
        amount: totalAmount,
        narration: `Sales against bill ${bill.bl_bill_no || bill.bl_id}`
      },
      receipts: receiptEntries.map(receipt => ({
        receiptNo: receipt.rc_entry_no,
        date: receipt.rc_date,
        amount: parseAmount(receipt.rc_amount),
        mode: receipt.rc_payment_mode,
        reference: receipt.rc_ref_number || '',
        narration: receipt.rc_narration || ''
      })),
      journal: journalEntries.map(entry => ({
        entryNo: entry.je_entry_no,
        date: entry.je_date,
        account: entry.je_account,
        type: entry.je_entry_type,
        amount: parseAmount(entry.je_amount),
        voucherType: entry.je_voucher_type,
        reference: entry.je_ref_number || '',
        narration: entry.je_narration || ''
      }))
    }
  };
}
// Create a new bill (TRANSACTIONAL - AUTHORITATIVE BUSINESS FLOW)
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
      billDate: req.body.billDate,
      allFields: req.body
    });
    
    // Validate bookingId (MANDATORY)
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
    
    // Validate bill date is provided
    if (!billDate) {
      return res.status(400).json({ message: 'Bill date is required.' });
    }
    
    // Validate sequelizeTVL is available
    if (!sequelizeTVL) {
      console.error('sequelizeTVL is undefined');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // TRANSACTIONAL LOGIC (CRITICAL - AUTHORITATIVE BUSINESS FLOW)
    const transaction = await sequelizeTVL.transaction();
    
    try {
      // 1. Validate booking exists and status
      const booking = await BookingTVL.findByPk(bookingId, { transaction });
      if (!booking) {
        throw new Error('Booking not found');
      }

      // AUTHORITATIVE RULE: Billing can only be generated for DRAFT/PENDING bookings
      // CONFIRMED bookings already have bills
      if (booking.bk_status && booking.bk_status.toUpperCase() === 'CONFIRMED') {
        throw new Error('Billing already exists for this booking');
      }
      
      if (booking.bk_status && booking.bk_status.toUpperCase() === 'CANCELLED') {
        throw new Error('Cannot generate bill for cancelled booking');
      }

      // 2. Generate unique bill number in format: BL-YYMMDD-NNNN (max 15 chars)
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const billNumber = `BL-${year}${month}${day}-${random}`;
      
      // 3. Calculate total amount
      let calculatedTotal = parseFloat(railwayFare) || 0;
      calculatedTotal += parseFloat(stationBoyIncentive) || 0;
      calculatedTotal += parseFloat(serviceCharges) || 0;
      calculatedTotal += parseFloat(platformFees) || 0;
      calculatedTotal += parseFloat(gst) || 0;
      calculatedTotal += parseFloat(miscCharges) || 0;
      calculatedTotal += parseFloat(deliveryCharges) || 0;
      calculatedTotal += parseFloat(surcharge) || 0;
      
      // Apply discount
      calculatedTotal -= parseFloat(discount) || 0;
      
      // Ensure calculated total is not negative
      calculatedTotal = Math.max(0, calculatedTotal);
      
      // Use provided totalAmount if available, otherwise use calculated
      const finalTotalAmount = totalAmount !== undefined ? parseFloat(totalAmount) : calculatedTotal;

      // 4. Create Bill (with proper field mappings)
      console.log('📝 Creating bill with data:', {
        bl_entry_no: billNumber,
        bl_bill_no: billNumber,
        bl_booking_id: bookingId,
        bl_billing_date: billDate ? new Date(billDate) : new Date(), // Required billing date
        bl_customer_name: customerName,
        bl_customer_phone: phoneNumber, // Required phone field
        bl_journey_date: journeyDate && journeyDate.trim() ? new Date(journeyDate) : booking.bk_trvldt,
        bl_total_amount: finalTotalAmount,
        bl_created_by: convertUserIdToInt(req.user.us_usid)
      });
      
      const bill = await BillTVL.create({
        bl_entry_no: billNumber,
        bl_bill_no: billNumber,
        bl_booking_id: bookingId,
        bl_billing_date: billDate ? new Date(billDate) : new Date(), // Required billing date
        bl_customer_name: customerName,
        bl_customer_phone: phoneNumber, // Required phone field
        bl_station_boy: stationBoy || '',
        bl_from_station: fromStation || '',
        bl_to_station: toStation || '',
        bl_journey_date: journeyDate && journeyDate.trim() ? new Date(journeyDate) : booking.bk_trvldt,
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
        bl_gst: gst || 0,
        bl_surcharge: surcharge || 0,
        bl_discount: discount || 0,
        bl_gst_type: gstType || 'EXCLUSIVE',
        bl_total_amount: finalTotalAmount,
        bl_created_by: convertUserIdToInt(req.user.us_usid),
        // Standard audit fields
        entered_by: convertUserIdToInt(req.user.us_usid),
        entered_on: new Date(),
        status: 'OPEN',
        bl_status: status || 'CONFIRMED'
      }, { 
        transaction,
        userId: convertUserIdToInt(req.user.us_usid) // Pass userId for hooks
      });
      
      // 5. Update Booking Status to CONFIRMED and mark as billed
      await booking.update({
        bk_status: 'CONFIRMED',
        bk_billed: 1,
        mby: req.user.us_usid,
        mdtm: new Date()
      }, { transaction });
      
      // 6. Update passenger records with the billing number
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
              bookingId: bookingId
            },
            type: sequelizeTVL.QueryTypes.UPDATE,
            transaction
          }
        );
        
        console.log(`📊 Updated ${updateResult.affectedRows} passengers with billing number ${billNumber}`);
      } catch (passengerError) {
        console.error('⚠️ Error updating passenger records with billing number:', passengerError);
        // Don't throw error here as the bill has already been created successfully
        // The passengers can be updated later if needed
      }
      
      // 7. Commit transaction (ALL operations succeed together)
      await transaction.commit();
      
      console.log(`✅ Bill ${billNumber} created successfully for booking ${bookingId}`);
      console.log(`✅ Booking ${bookingId} status updated to CONFIRMED`);
      
      // Emit real-time update
      RealTimeService.emitBillingUpdate(bill.toJSON());

      res.status(201).json({
        success: true,
        message: 'Bill created successfully',
        data: {
          bill: bill.toJSON(),
          bookingUpdated: true
        }
      });
      
    } catch (error) {
      // 7. Rollback transaction on ANY error (atomicity)
      await transaction.rollback();
      console.error('❌ Transaction rolled back due to error:', error.message);
      throw error;
    }
    
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get customer bills (CUSTOMER VIEW - OWN RECORDS ONLY)
const getCustomerBills = async (req, res) => {
  try {
    // For customers, only show their own bills
    const bills = await BillTVL.findAll({ 
      include: [{
        model: BookingTVL,
        where: { bk_usid: req.user.us_usid },
        required: true
      }],
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
        customerName: billData.bl_customer_name,
        phoneNumber: billData.bl_phone,
        trainNumber: billData.bl_train_no,
        reservationClass: billData.bl_class,
        ticketType: billData.ticket_type,
        pnrNumbers: billData.bl_pnr,
        netFare: billData.bl_railway_fare,
        serviceCharges: billData.bl_service_charge,
        platformFees: billData.bl_platform_fee,
        agentFees: 0, // Default since not in model
        extraCharges: [], // Default empty array
        discounts: [], // Default empty array
        totalAmount: billData.bl_total_amount,
        billDate: billData.bl_bill_date,
        createdOn: billData.bl_created_at,
        createdBy: billData.bl_created_by,
        modifiedOn: billData.mdtm,
        modifiedBy: billData.mby
      };
    });
    
    res.json({
      success: true,
      data: {
        bills: transformedBills,
        count: transformedBills.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get all bills (ADMIN/EMPLOYEE VIEW - SHOW ALL RECORDS)
const getAllBills = async (req, res) => {
  try {
    const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
    const order = queryHelper.getSortingOptions(req.query, 'bl_created_at', 'DESC');
    
    // Define filter map for Billing
    const filterMap = {
      dateColumn: 'bl_billing_date',
      amountColumn: 'bl_total_amount',
      statusColumn: 'bl_status',
      searchColumns: ['bl_bill_no', 'bl_customer_name', 'bl_customer_phone', 'bl_pnr'],
      customFilters: {
        bookingId: 'bl_booking_id',
        stationBoy: 'bl_station_boy'
      }
    };
    
    const where = queryHelper.buildWhereClause(req.query, filterMap);

    // Check permissions
    const usertype = (req.user.us_usertype || req.user.usertype || '').toLowerCase();
    const isEmployee = usertype === 'employee' || ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(req.user.us_roid);
    const isAdmin = usertype === 'admin' || req.user.us_roid === 'ADM' || req.user.us_roid === 'admin';
    
    if (!isAdmin) {
      if (['AGT', 'ACC', 'MGT'].includes(req.user.us_roid)) {
        // Allowed to see all
      } else if (isEmployee) {
        const { EmployeeTVL: Employee } = require('../models');
        const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
        if (!employee || !['ACCOUNTS', 'FINANCE', 'MANAGEMENT'].includes(employee.em_dept)) {
          return res.status(403).json({ success: false, message: 'Access denied.' });
        }
      } else {
        // Customer view: only their own bills
        // Use bk_usid from joined BookingTVL
        where['$booking.bk_usid$'] = req.user.us_usid;
      }
    }
    
    const { count, rows: bills } = await BillTVL.findAndCountAll({
      where,
      include: [{
        model: BookingTVL,
        as: 'booking',
        attributes: ['bk_usid'],
        required: false // Use LEFT JOIN to show bills even if booking association fails
      }],
      order,
      limit,
      offset
    });
    
    // Batch fetch passenger counts/details for these bills
    const billNumbers = bills.map(b => b.bl_bill_no).filter(Boolean);
    const bookingIds = bills.map(b => b.bl_booking_id).filter(Boolean);
    
    // Simple cache for passengers to avoid repeated DB calls
    const billPassengersMap = {};
    
    if (billNumbers.length > 0 || bookingIds.length > 0) {
      const passengers = await Passenger.findAll({
        where: {
          [Op.or]: [
            { bl_bill_no: { [Op.in]: billNumbers } },
            { ps_bkid: { [Op.in]: bookingIds } }
          ],
          ps_active: 1
        }
      });
      
      passengers.forEach(p => {
        const key = p.bl_bill_no || p.ps_bkid;
        if (!billPassengersMap[key]) billPassengersMap[key] = [];
        billPassengersMap[key].push({
          id: p.ps_psid,
          name: p.ps_fname + (p.ps_lname ? ' ' + p.ps_lname : ''),
          age: p.ps_age,
          gender: p.ps_gender,
          berth: p.ps_berthalloc || p.ps_berthpref,
          seatNo: p.ps_seatno,
          coach: p.ps_coach
        });
      });
    }
    
    const transformedBills = bills.map(bill => {
      const billData = bill.toJSON();
      const passengerList = billPassengersMap[billData.bl_bill_no] || billPassengersMap[billData.bl_booking_id] || [];
      
      return {
        ...billData,
        id: billData.bl_id,
        billId: billData.bl_bill_no,
        bookingId: billData.bl_booking_id,
        customerName: billData.bl_customer_name,
        phoneNumber: billData.bl_customer_phone,
        passengerList
      };
    });
    
    // Handle Export Request
    if (req.query.export === 'csv') {
      const columns = [
        { label: 'Bill No', key: 'bl_bill_no' },
        { label: 'Booking ID', key: 'bl_booking_id' },
        { label: 'Customer', key: 'bl_customer_name' },
        { label: 'Phone', key: 'bl_customer_phone' },
        { label: 'Amount', key: 'bl_total_amount' },
        { label: 'Date', key: 'bl_billing_date' },
        { label: 'Status', key: 'bl_status' }
      ];
      const csv = queryHelper.convertToCSV(transformedBills, columns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=bills.csv');
      return res.send(csv);
    }
    
    res.json(queryHelper.formatPaginatedResponse(count, transformedBills, page, limit));
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
        bill.bl_created_by !== convertUserIdToInt(req.user.us_usid)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Fetch passenger details for this bill
    const { Passenger } = require('../models');
    let passengerList = [];
    
    try {
      // First, try to get passengers by billing number if available
      if (bill.bl_bill_no) {
        const passengerResult = await Passenger.getByBillingNumber(bill.bl_bill_no);
        if (passengerResult.success) {
          passengerList = passengerResult.passengers.map(p => ({
            id: p.ps_psid,
            name: p.ps_fname + (p.ps_lname ? ' ' + p.ps_lname : ''),
            age: p.ps_age,
            gender: p.ps_gender,
            berth: p.ps_berthalloc || p.ps_berthpref,
            seatNo: p.ps_seatno,
            coach: p.ps_coach
          }));
        }
      }
      
      // If no passengers found by billing number, try by booking ID as fallback
      if (passengerList.length === 0 && bill.bl_booking_id) {
        const passengerResult = await Passenger.getByBookingId(bill.bl_booking_id);
        if (passengerResult.success) {
          passengerList = passengerResult.passengers.map(p => ({
            id: p.ps_psid,
            name: p.ps_fname + (p.ps_lname ? ' ' + p.ps_lname : ''),
            age: p.ps_age,
            gender: p.ps_gender,
            berth: p.ps_berthalloc || p.ps_berthpref,
            seatNo: p.ps_seatno,
            coach: p.ps_coach
          }));
        }
      }
    } catch (passengerError) {
      console.error('⚠️ Error fetching passenger details:', passengerError);
      // Continue with empty passenger list if there's an error
      passengerList = [];
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
      passengerList: passengerList, // Populate with actual passenger details
      railwayFare: billData.bl_railway_fare,
      stationBoyIncentive: billData.bl_sb_incentive,
      serviceCharges: billData.bl_service_charge,
      platformFees: billData.bl_platform_fee,
      miscCharges: billData.bl_misc_charges,
      deliveryCharges: billData.bl_delivery_charge,
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

const getPrintableBill = async (req, res) => {
  try {
    const bill = await resolveBillForPrint(req.params.billId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const booking = bill.bl_booking_id ? await BookingTVL.findByPk(bill.bl_booking_id) : null;
    const hasAccess = isPrivilegedBillingUser(req.user) ||
      bill.bl_created_by === convertUserIdToInt(req.user.us_usid) ||
      booking?.bk_usid === req.user.us_usid;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const payload = await getBillPrintPayload(bill, booking, req.user);

    res.json({
      success: true,
      data: payload
    });
  } catch (error) {
    console.error('Get printable bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate printable bill',
      error: error.message
    });
  }
};

// Download bill as PDF (PDFKit server-side generation)
const downloadBillPDF = async (req, res) => {
  try {
    const bill = await resolveBillForPrint(req.params.billId);

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const booking = bill.bl_booking_id ? await BookingTVL.findByPk(bill.bl_booking_id) : null;
    const hasAccess = isPrivilegedBillingUser(req.user) ||
      bill.bl_created_by === convertUserIdToInt(req.user.us_usid) ||
      booking?.bk_usid === req.user.us_usid;

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const payload = await getBillPrintPayload(bill, booking, req.user);
    const pdfBuffer = await generateBillPDF(payload);

    const safeBillNo = (bill.bl_bill_no || `BILL-${bill.bl_id}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeBillNo}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download bill PDF error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF', error: error.message });
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
    if (req.user.us_usertype !== 'admin' && bill.bl_created_by !== convertUserIdToInt(req.user.us_usid)) {
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
      bl_modified_by: convertUserIdToInt(req.user.us_usid),
      bl_modified_at: new Date(),
      // Standard audit fields
      modified_by: convertUserIdToInt(req.user.us_usid),
      modified_on: new Date()
    }, {
      userId: convertUserIdToInt(req.user.us_usid) // Pass userId for hooks
    });
    
    // Transform data to match frontend expectations
    const { Passenger } = require('../models');
    let passengerList = [];
    
    try {
      // First, try to get passengers by billing number if available
      if (bill.bl_bill_no) {
        const passengerResult = await Passenger.getByBillingNumber(bill.bl_bill_no);
        if (passengerResult.success) {
          passengerList = passengerResult.passengers.map(p => ({
            id: p.ps_psid,
            name: p.ps_fname + (p.ps_lname ? ' ' + p.ps_lname : ''),
            age: p.ps_age,
            gender: p.ps_gender,
            berth: p.ps_berthalloc || p.ps_berthpref,
            seatNo: p.ps_seatno,
            coach: p.ps_coach
          }));
        }
      }
      
      // If no passengers found by billing number, try by booking ID as fallback
      if (passengerList.length === 0 && bill.bl_booking_id) {
        const passengerResult = await Passenger.getByBookingId(bill.bl_booking_id);
        if (passengerResult.success) {
          passengerList = passengerResult.passengers.map(p => ({
            id: p.ps_psid,
            name: p.ps_fname + (p.ps_lname ? ' ' + p.ps_lname : ''),
            age: p.ps_age,
            gender: p.ps_gender,
            berth: p.ps_berthalloc || p.ps_berthpref,
            seatNo: p.ps_seatno,
            coach: p.ps_coach
          }));
        }
      }
    } catch (passengerError) {
      console.error('⚠️ Error fetching passenger details:', passengerError);
      // Continue with empty passenger list if there's an error
      passengerList = [];
    }
    
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
      passengerList: passengerList, // Populate with actual passenger details
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
      bl_modified_by: convertUserIdToInt(req.user.us_usid),
      bl_modified_at: new Date()
    });
    
    // Transform data to match frontend expectations
    const { Passenger } = require('../models');
    let passengerList = [];
    
    try {
      // First, try to get passengers by billing number if available
      if (bill.bl_bill_no) {
        const passengerResult = await Passenger.getByBillingNumber(bill.bl_bill_no);
        if (passengerResult.success) {
          passengerList = passengerResult.passengers.map(p => ({
            id: p.ps_psid,
            name: p.ps_fname + (p.ps_lname ? ' ' + p.ps_lname : ''),
            age: p.ps_age,
            gender: p.ps_gender,
            berth: p.ps_berthalloc || p.ps_berthpref,
            seatNo: p.ps_seatno,
            coach: p.ps_coach
          }));
        }
      }
      
      // If no passengers found by billing number, try by booking ID as fallback
      if (passengerList.length === 0 && bill.bl_booking_id) {
        const passengerResult = await Passenger.getByBookingId(bill.bl_booking_id);
        if (passengerResult.success) {
          passengerList = passengerResult.passengers.map(p => ({
            id: p.ps_psid,
            name: p.ps_fname + (p.ps_lname ? ' ' + p.ps_lname : ''),
            age: p.ps_age,
            gender: p.ps_gender,
            berth: p.ps_berthalloc || p.ps_berthpref,
            seatNo: p.ps_seatno,
            coach: p.ps_coach
          }));
        }
      }
    } catch (passengerError) {
      console.error('⚠️ Error fetching passenger details:', passengerError);
      // Continue with empty passenger list if there's an error
      passengerList = [];
    }
    
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
      passengerList: passengerList, // Populate with actual passenger details
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
  const transaction = await sequelizeTVL.transaction();
  
  try {
    const bill = await BillTVL.findByPk(req.params.id, { transaction });
    
    if (!bill) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Only admin can delete bills
    if (req.user.us_usertype !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    // Cannot delete finalized or paid bills
    if (bill.bl_status === 'FINAL' || bill.bl_status === 'PAID') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cannot delete a finalized or paid bill' });
    }
    
    // Get the associated booking ID before deleting the bill
    const bookingId = bill.bl_booking_id;
    
    // Delete the bill
    await bill.destroy({ transaction });
    
    // Update the associated booking status back to DRAFT
    if (bookingId) {
      const booking = await BookingTVL.findByPk(bookingId, { transaction });
      
      if (booking && (booking.bk_status === 'CONFIRMED' || booking.bk_status === 'PENDING')) {
        const oldStatus = booking.bk_status;
        
        // Update booking status to DRAFT and reset billed flag
        await booking.update({
          bk_status: 'DRAFT',
          bk_billed: 0,
          mby: req.user.us_usid,
          mdtm: new Date()
        }, { transaction });
        
        // Log the automatic status change for audit purposes
        console.log(`[BILLING DELETION AUDIT] Bill ${bill.bl_bill_no} (ID: ${bill.bl_id}) deleted by user ${req.user.us_usid}. ` +
                    `Associated booking ${bookingId} status automatically changed from ${oldStatus} to DRAFT. ` +
                    `Booking billed flag reset to 0.`);
      }
    }
    
    // Reset billing number from passenger records
    try {
      const [updateResult] = await sequelizeTVL.query(
        `UPDATE psXpassenger 
         SET bl_bill_no = NULL, 
             mdtm = NOW(), 
             mby = :modifiedBy 
         WHERE bl_bill_no = :billNumber AND ps_active = 1`,
        {
          replacements: {
            billNumber: bill.bl_bill_no,
            modifiedBy: req.user.us_usid
          },
          type: sequelizeTVL.QueryTypes.UPDATE,
          transaction
        }
      );
      
      console.log(`📊 Reset billing number for ${updateResult.affectedRows} passengers associated with bill ${bill.bl_bill_no}`);
    } catch (passengerError) {
      console.error('⚠️ Error resetting passenger billing numbers:', passengerError);
      // Don't throw error here as the bill deletion should still proceed
    }
    
    // Commit the transaction
    await transaction.commit();
    
    res.json({ 
      success: true,
      message: 'Bill deleted successfully. Associated booking status updated to DRAFT.',
      data: {
        deletedBillId: bill.bl_id,
        affectedBookingId: bookingId
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: 'Cannot delete bill. Related records exist in other tables.' 
      });
    }
    
    console.error('Error deleting bill:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Cancel bill (RBAC, validations, TVL transaction, journal + audit, notifications)
const cancelBill = async (req, res) => {
  if (!billCancellation.canUserCancelBill(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to cancel bills. Required roles: Admin, Accounts, or Management.'
    });
  }

  const transaction = await sequelizeTVL.transaction();

  try {
    const bill = await BillTVL.findByPk(req.params.id, { transaction });

    if (!bill) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (billCancellation.billIsAlreadyCancelled(bill)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Bill is already cancelled' });
    }

    if (billCancellation.billHasBlockingPaymentState(bill)) {
      await transaction.rollback();
      return res.status(400).json({
        message:
          'Cannot cancel: bill is paid, partially paid, or finalized. Reverse receipts and update payment status first.'
      });
    }

    const payloadErrors = billCancellation.validateCancellationPayload(req.body, bill);
    if (payloadErrors.length) {
      await transaction.rollback();
      return res.status(400).json({ message: payloadErrors.join(' ') });
    }

    const receiptTotal = await billCancellation.sumActiveReceiptsForBill(Receipt, bill.bl_bill_no);
    const receiptBlock = billCancellation.assertNoReceiptsBlockingCancel(receiptTotal, bill.bl_total_amount);
    if (receiptBlock.length) {
      await transaction.rollback();
      return res.status(400).json({ message: receiptBlock.join(' ') });
    }

    const {
      railwayCharges,
      agentCharges,
      reason,
      cancellationDate,
      approverUserId,
      approverName
    } = req.body;

    const { railway, agent } = billCancellation.parseCharges(railwayCharges, agentCharges);
    const totalCancelCharges = railway + agent;
    const billTotal = parseFloat(bill.bl_total_amount) || 0;
    const refundAmount = Math.max(0, billTotal - totalCancelCharges);
    const cancellationRef = billCancellation.generateCancellationReference();
    const cancelDate = new Date(cancellationDate);

    const oldValues = bill.toJSON();

    await bill.update(
      {
        bl_status: 'CANCELLED',
        status: 'CANCELLED',
        is_cancelled: 1,
        bl_railway_cancellation_charge: railway,
        bl_agent_cancellation_charge: agent,
        total_cancel_charges: totalCancelCharges,
        refund_amount: refundAmount,
        bl_cancellation_remarks: reason,
        bl_cancellation_ref: cancellationRef,
        bl_cancel_approver_usid: String(approverUserId).trim(),
        bl_cancel_approver_name: String(approverName).trim(),
        cancellation_date: cancelDate,
        cancelled_on: new Date(),
        cancelled_by: req.user.us_usid,
        payment_status: 'REFUND_DUE',
        mby: req.user.us_usid,
        mdtm: new Date()
      },
      { transaction }
    );

    const bookingId = bill.bl_booking_id;
    if (bookingId) {
      const booking = await BookingTVL.findByPk(bookingId, { transaction });
      if (booking) {
        await booking.update(
          {
            bk_status: 'CANCELLED',
            mby: req.user.us_usid,
            mdtm: new Date()
          },
          { transaction }
        );
      }
    }

    if (bill.bl_bill_no) {
      try {
        await sequelizeTVL.query(
          `UPDATE psXpassenger 
           SET bl_bill_no = NULL, mdtm = NOW(), mby = :modifiedBy 
           WHERE bl_bill_no = :billNumber AND ps_active = 1`,
          {
            replacements: {
              billNumber: bill.bl_bill_no,
              modifiedBy: req.user.us_usid
            },
            type: sequelizeTVL.QueryTypes.UPDATE,
            transaction
          }
        );
      } catch (passengerError) {
        console.error('Passenger reset on cancel:', passengerError);
      }
    }

    await ForensicAuditLog.create(
      {
        entityName: 'BILL',
        entityId: bill.bl_id,
        actionType: 'CANCEL',
        changedFields: {
          cancellationRef,
          cancellationDate: cancelDate.toISOString(),
          approverUserId: String(approverUserId).trim(),
          approverName: String(approverName).trim(),
          reason: String(reason).trim(),
          railwayCharges: railway,
          agentCharges: agent,
          refundAmount,
          receiptTotalSnapshot: receiptTotal,
          performedByUser: req.user.us_usid
        },
        oldValues,
        newValues: bill.toJSON(),
        performedBy: convertUserIdToInt(req.user.us_usid),
        performedOn: new Date(),
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.get('User-Agent') || null
      },
      { transaction }
    );

    await transaction.commit();

    // Journal model uses TVL pool (see models/baseModel.js)
    try {
      await sequelizeTVL.transaction(async (jt) => {
        if (bill.bl_bill_no) {
          await Journal.update(
            { je_status: 'Inactive' },
            {
              where: {
                je_ref_number: bill.bl_bill_no,
                je_status: 'Active'
              },
              transaction: jt
            }
          );
        }

        const journalEntries = [
          {
            je_entry_no: generateJournalEntryNo('CN'),
            je_date: new Date(),
            je_account: 'CUSTOMER_ACCOUNT',
            je_entry_type: 'Debit',
            je_amount: refundAmount,
            je_narration: `Refund — ${cancellationRef} Bill ${bill.bl_bill_no}. ${reason}`.slice(0, 200),
            je_ref_number: cancellationRef,
            je_voucher_type: 'Journal',
            je_created_by: req.user.us_usid,
            je_status: 'Active',
            eby: req.user.us_usid,
            edtm: new Date()
          },
          {
            je_entry_no: generateJournalEntryNo('CN'),
            je_date: new Date(),
            je_account: 'CANCELLATION_INCOME',
            je_entry_type: 'Credit',
            je_amount: totalCancelCharges,
            je_narration: `Cancellation charges — ${cancellationRef} Bill ${bill.bl_bill_no}`.slice(0, 200),
            je_ref_number: cancellationRef,
            je_voucher_type: 'Journal',
            je_created_by: req.user.us_usid,
            je_status: 'Active',
            eby: req.user.us_usid,
            edtm: new Date()
          }
        ];

        await Journal.bulkCreate(journalEntries, { transaction: jt });
      });
    } catch (je) {
      console.error('Journal posting after bill cancel failed:', je);
    }

    RealTimeService.emitBillingUpdate(bill.toJSON());

    let customerEmail = null;
    try {
      if (bill.bl_customer_phone) {
        const custUser = await UserTVL.findOne({
          where: { us_phone: bill.bl_customer_phone }
        });
        customerEmail = custUser?.us_email || null;
      }
    } catch (lookupErr) {
      console.warn('Customer email lookup skipped:', lookupErr.message);
    }

    notifyBillCancelled({
      customerEmail,
      customerName: bill.bl_customer_name,
      billNo: bill.bl_bill_no,
      cancellationRef,
      reason,
      performedBy: `${req.user.us_usid} (${req.user.us_fname || ''} ${req.user.us_lname || ''})`.trim()
    }).catch((e) => console.error('cancel notify:', e.message));

    res.json({
      success: true,
      message: 'Bill cancelled successfully.',
      data: {
        cancelledBillId: bill.bl_id,
        cancellationRef,
        refundAmount,
        totalCharges: totalCancelCharges
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error cancelling bill:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getCancellationHistory = async (req, res) => {
  try {
    if (!isPrivilegedBillingUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
    const andClauses = [{ [Op.or]: [{ is_cancelled: 1 }, { bl_status: 'CANCELLED' }] }];

    if (req.query.fromDate) {
      andClauses.push({ cancelled_on: { [Op.gte]: new Date(req.query.fromDate) } });
    }
    if (req.query.toDate) {
      const end = new Date(req.query.toDate);
      end.setHours(23, 59, 59, 999);
      andClauses.push({ cancelled_on: { [Op.lte]: end } });
    }
    if (req.query.customerName && String(req.query.customerName).trim()) {
      andClauses.push({
        bl_customer_name: { [Op.like]: `%${String(req.query.customerName).trim()}%` }
      });
    }
    if (req.query.reason && String(req.query.reason).trim()) {
      andClauses.push({
        bl_cancellation_remarks: { [Op.like]: `%${String(req.query.reason).trim()}%` }
      });
    }

    const { count, rows } = await BillTVL.findAndCountAll({
      where: { [Op.and]: andClauses },
      order: [['cancelled_on', 'DESC'], ['bl_id', 'DESC']],
      limit,
      offset
    });

    const data = rows.map((b) => {
      const j = b.toJSON();
      return {
        bl_id: j.bl_id,
        bl_bill_no: j.bl_bill_no,
        bl_cancellation_ref: j.bl_cancellation_ref,
        bl_customer_name: j.bl_customer_name,
        bl_customer_phone: j.bl_customer_phone,
        bl_total_amount: j.bl_total_amount,
        total_cancel_charges: j.total_cancel_charges,
        refund_amount: j.refund_amount,
        bl_cancellation_remarks: j.bl_cancellation_remarks,
        cancelled_on: j.cancelled_on,
        cancelled_by: j.cancelled_by,
        bl_cancel_approver_usid: j.bl_cancel_approver_usid,
        bl_cancel_approver_name: j.bl_cancel_approver_name,
        cancellation_date: j.cancellation_date,
        bl_booking_id: j.bl_booking_id
      };
    });

    res.json(queryHelper.formatPaginatedResponse(count, data, page, limit));
  } catch (error) {
    console.error('getCancellationHistory:', error);
    res.status(500).json({ success: false, message: error.message });
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
      whereConditions.bl_created_by = convertUserIdToInt(req.user.us_usid);
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
      where: { bl_created_by: convertUserIdToInt(customerId) },
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
        bl_created_by: convertUserIdToInt(customerId),
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

// Get billing statistics
const getBillingStats = async (req, res) => {
  try {
    const filterMap = {
      dateColumn: 'bl_billing_date',
      statusColumn: 'bl_status'
    };
    const where = queryHelper.buildWhereClause(req.query, filterMap);
    
    const stats = await queryHelper.getAggregation(
      BillTVL, 
      where, 
      ['bl_status'], 
      ['bl_total_amount']
    );
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get billing stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createBill,
  getCustomerBills,
  getAllBills,
  getBillById,
  getPrintableBill,
  downloadBillPDF,
  updateBill,
  finalizeBill,
  deleteBill,
  cancelBill,
  searchBills,
  getCustomerLedger,
  getCustomerBalance,
  getBillingStats,
  getCancellationHistory
};
