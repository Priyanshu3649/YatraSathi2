const { BillTVL, UserTVL, CustomerTVL: Customer, BookingTVL, Journal, PassengerTVL: Passenger, ForensicAuditLog, Company, Receipt, PassengerTVL, Ledger, StationBoy } = require('../models');
const serviceChargeService = require('../services/serviceChargeService');
const { Sequelize, Op } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');
const billCancellation = require('../services/billCancellationService');
const { notifyBillCancelled } = require('../services/emailService');
const queryHelper = require('../utils/queryHelper');
const RealTimeService = require('../services/realTimeService');
const { generateBillPDF } = require('../utils/billPdfGenerator');
const crypto = require('crypto');
const numberToWords = require('../utils/numberToWords');
const Audit = require('../services/forensicAuditService');
const CustomerLedgerService = require('../services/CustomerLedgerService');



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
  // Since we updated DB columns to VARCHAR(30), we no longer need to strip alphanumeric IDs.
  // We preserve the full string (e.g., ADM001).
  return userId ? String(userId) : null;
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
        module_name: 'BILL',
        record_id: String(bill.bl_id)
      },
      order: [['change_timestamp', 'DESC']]
    })
  ]);

  // Fetch customer details for GST logic
  let customerDetails = { state: '', gstNo: '', address: '' };
  if (booking?.bk_cusid || bill.bl_customer_id) {
    const customerRecord = await Customer.findByPk(booking?.bk_cusid || bill.bl_customer_id, {
      include: [{ model: UserTVL, as: 'user' }]
    });
    if (customerRecord) {
      customerDetails = {
        state: customerRecord.user?.us_state || '',
        gstNo: customerRecord.cu_gstno || 'Unregistered',
        address: [customerRecord.user?.us_addr1, customerRecord.user?.us_city, customerRecord.user?.us_state].filter(Boolean).join(', ')
      };
    }
  }

  const totalAmount = parseAmount(bill.bl_total_amount);
  const baseAmount = parseAmount(bill.bl_railway_fare);
  const taxAmount = parseAmount(bill.bl_gst);
  const cancellationCharges = parseAmount(bill.total_cancel_charges);
  const refundAmount = parseAmount(bill.refund_amount);
  
  // Calculate paid amount from receipts
  const receiptTotal = receiptEntries.reduce((sum, receipt) => sum + parseAmount(receipt.rc_amount), 0);
  
  // Financial logic for display
  const isCancelled = Boolean(bill.is_cancelled || bill.bl_status === 'CAN' || bill.status === 'CAN');
  const paidAmount = isCancelled ? Math.max(0, totalAmount - refundAmount) : receiptTotal;
  const balanceAmount = isCancelled ? refundAmount : Math.max(0, totalAmount - paidAmount);

  // GST Logic
  const companyState = company.state || 'Delhi'; 
  const isIntraState = !customerDetails.state || customerDetails.state.toLowerCase() === companyState.toLowerCase();
  
  const gst = {
    isIntraState,
    cgst: isIntraState ? taxAmount / 2 : 0,
    sgst: isIntraState ? taxAmount / 2 : 0,
    igst: isIntraState ? 0 : taxAmount,
    rate: 18 // Default GST rate
  };

  // UPI Logic
  const upiId = 'anmoltravels@upi'; // Default UPI ID
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(company.name)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent('Bill ' + (bill.bl_bill_no || bill.bl_id))}`;

  // Signature (HMAC-SHA256)
  const secret = process.env.SIGNATURE_SECRET || 'yatrasathi-secret-key';
  const invoiceData = `${bill.bl_bill_no || bill.bl_id}|${totalAmount}|${bill.bl_billing_date}`;
  const signature = crypto.createHmac('sha256', secret).update(invoiceData).digest('hex');

  // Resolve audit users
  const createdAudit = auditLogs.find(entry => entry.action_type === 'INSERT' || entry.action_type === 'CREATE');
  const updatedAudit = auditLogs.find(entry => entry.action_type === 'UPDATE');
  const closedAudit = auditLogs.find(entry => ['CLOSE', 'CANCEL', 'DELETE'].includes(entry.action_type));

  const [enteredBy, modifiedBy, closedBy] = await Promise.all([
    resolveAuditUserLabel(bill.entered_by || bill.bl_created_by || createdAudit?.changed_by),
    resolveAuditUserLabel(bill.modified_by || bill.mby || updatedAudit?.changed_by),
    resolveAuditUserLabel(bill.closed_by || bill.cancelled_by || closedAudit?.changed_by)
  ]);

  return {
    company: {
      name: 'Anmol Travels',
      address: 'Address unavailable',
      phone: 'N/A',
      gst: 'N/A',
      ...company,
      state: companyState,
      stateCode: '07' // Delhi default
    },
    bill: {
      billId: bill.bl_id,
      billNumber: bill.bl_bill_no || `BILL-${bill.bl_id}`,
      date: bill.bl_bill_date || bill.bl_billing_date,
      status: bill.bl_status || bill.status || 'ACTIVE',
      placeOfSupply: customerDetails.state || companyState,
      reverseCharge: 'No'
    },
    customer: {
      name: bill.bl_customer_name || booking?.bk_customername || 'Unknown Customer',
      phone: bill.bl_customer_phone || booking?.bk_phonenumber || 'N/A',
      address: customerDetails.address || 'N/A',
      gstNo: customerDetails.gstNo || 'Unregistered',
      state: customerDetails.state || companyState
    },
    booking: {
      bookingId: bill.bl_booking_id,
      bookingNumber: booking?.bk_bkno || bill.bl_booking_no || null,
      fromStation: bill.bl_from_station || booking?.bk_fromst || '',
      toStation: bill.bl_to_station || booking?.bk_tost || '',
      travelDetails: [bill.bl_from_station || booking?.bk_fromst, bill.bl_to_station || booking?.bk_tost].filter(Boolean).join(' -> '),
      journeyDate: bill.bl_journey_date || booking?.bk_trvldt || null,
      trainNumber: bill.bl_train_no || booking?.bk_trainno || booking?.bk_train_no || null,
      reservationClass: bill.bl_class || booking?.bk_class || null,
      pnr: bill.bl_pnr || booking?.bk_pnr || null,
      seatsReserved: bill.bl_seats_reserved || bill.bl_seatsAlloted || null,
      stationBoy: bill.bl_station_boy || bill.stationBoy || booking?.bk_station_boy || ''
    },
    advance: {
      advanceAmount: parseAmount(bill.bl_advance_amount || booking?.bk_advance || receiptTotal || 0),
      paymentMode: bill.bl_payment_mode || '',
      paymentReference: bill.bl_payment_reference || ''
    },
    passengers: passengers || [],
    financials: {
      baseAmount: parseAmount(bill.bl_railway_fare),
      railwayFare: parseAmount(bill.bl_railway_fare),
      serviceCharges: parseAmount(bill.bl_service_charge),
      sbIncentive: parseAmount(bill.bl_sb_incentive),
      platformFees: parseAmount(bill.bl_platform_fee),
      miscCharges: parseAmount(bill.bl_misc_charges),
      deliveryCharges: parseAmount(bill.bl_delivery_charge),
      gstAmount: parseAmount(bill.bl_gst),
      surcharge: parseAmount(bill.bl_surcharge),
      discount: parseAmount(bill.bl_discount),
      tax: taxAmount || 0,
      total: totalAmount || 0,
      paid: paidAmount || 0,
      balance: balanceAmount || 0,
      amountInWords: numberToWords(totalAmount) || 'Zero Rupees Only'
    },
    gst: gst || {
      isIntraState: true,
      cgst: 0,
      sgst: 0,
      igst: 0,
      rate: 18
    },
    upi: {
      upiId: upiId || 'anmoltravels@upi',
      upiString: upiString || '',
      amount: totalAmount || 0,
      name: company.name || 'Anmol Travels'
    },
    signature: {
      hash: signature || '',
      signedBy: company.name || 'Anmol Travels',
      signedOn: new Date().toISOString()
    },
    irn: {
      irn: bill.irn || null,
      ackNo: bill.ack_no || null,
      ackDate: bill.ack_date || null
    },
    cancellation: {
      isCancelled: isCancelled || false,
      charges: cancellationCharges || 0,
      refundAmount: refundAmount || 0
    },
    audit: {
      enteredBy: enteredBy || 'System',
      enteredOn: bill.entered_on || bill.bl_created_at || createdAudit?.change_timestamp || null,
      modifiedBy: modifiedBy || null,
      modifiedOn: bill.modified_on || bill.bl_modified_at || updatedAudit?.change_timestamp || null,
      closedBy: closedBy || null,
      closedOn: bill.closed_on || bill.cancelled_on || closedAudit?.change_timestamp || null
    },
    jespr: {
      sales: {
        entryNo: bill.bl_entry_no || bill.bl_bill_no,
        date: bill.bl_bill_date || bill.bl_billing_date,
        account: 'Sales',
        amount: totalAmount || 0,
        narration: `Sales against bill ${bill.bl_bill_no || bill.bl_id}`
      },
      receipts: (receiptEntries || []).map(receipt => ({
        receiptNo: receipt.rc_entry_no,
        date: receipt.rc_date,
        amount: parseAmount(receipt.rc_amount),
        mode: receipt.rc_payment_mode,
        reference: receipt.rc_ref_number || '',
        narration: receipt.rc_narration || ''
      })),
      journal: (journalEntries || []).map(entry => ({
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

// Helper to validate and resolve Station Boy from input ID or Name snapshot
async function resolveAndValidateStationBoy(stationBoyId, stationBoyName, isNewBill = false, currentStationBoyId = null) {
  if (stationBoyId === null || stationBoyId === undefined || stationBoyId === '') {
    if (!stationBoyName || !stationBoyName.trim()) {
      return { id: null, nameSnapshot: null };
    }
  }

  let stationBoy = null;
  if (stationBoyId) {
    stationBoy = await StationBoy.findByPk(stationBoyId);
  } else if (stationBoyName && stationBoyName.trim()) {
    stationBoy = await StationBoy.findOne({ 
      where: { name: stationBoyName.trim() } 
    });
  }

  if (!stationBoy) {
    throw new Error('Invalid station boy. Please select a station boy from the Station Boy List.');
  }

  if (stationBoy.status !== 'ACTIVE') {
    const isSameAsCurrent = currentStationBoyId && parseInt(currentStationBoyId, 10) === parseInt(stationBoy.id, 10);
    if (isNewBill || !isSameAsCurrent) {
      throw new Error('Invalid station boy. Please select a station boy from the Station Boy List.');
    }
  }

  return {
    id: stationBoy.id,
    nameSnapshot: stationBoy.name
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
      stationBoyId,
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
      billNumber,
      status,
      remarks,
      specialId,
      advanceAmount,
      paymentMode,
      paymentReference,
      enteredBy
    } = req.body;

    // Log incoming request data for debugging
    console.log('📥 Billing creation request data:', {
      bookingId,
      customerName,
      phoneNumber,
      specialId,
      advanceAmount,
      journeyDate,
      billDate: req.body.billDate
    });
    
    // Validate bookingId (MANDATORY)
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required for billing.' });
    }
    
    // Validate required fields (Phone number is now optional)
    if (!customerName) {
      return res.status(400).json({ message: 'Customer name is required.' });
    }
    
    if (!phoneNumber) {
      console.warn('⚠️ Phone number omitted for customer:', customerName);
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

      // Resolve and validate Station Boy
      const resolvedStationBoy = await resolveAndValidateStationBoy(stationBoyId, stationBoy, true);

      // AUTHORITATIVE RULE: Billing can only be generated for DRAFT/PENDING bookings
      // CONFIRMED bookings already have bills
      if (booking.bk_status && booking.bk_status.toUpperCase() === 'CNF') {
        throw new Error('Billing already exists for this booking');
      }
      
      if (booking.bk_status && booking.bk_status.toUpperCase() === 'CAN') {
        throw new Error('Cannot generate bill for cancelled booking');
      }

      // 2b. Find passengers for service charge calculation and assignment
      const passengersResult = await PassengerTVL.findAll({ 
        where: { ps_bkid: bookingId, ps_active: 1 }, 
        transaction 
      });
      const passengerCount = passengersResult.length || 1;
      const activePassengerIds = passengersResult.map(p => p.ps_psid);

      // 2c. Resolve Service Charge automatically
      const resolvedServiceCharge = await serviceChargeService.getServiceCharge({
        customerId: booking.bk_cusid || booking.bk_usid,
        serviceType: 'RESERVATION',
        travelClass: reservationClass || booking.bk_class || '3A',
        passengerCount: passengerCount
      });

      // Use resolved charge if not provided or as a baseline
      const finalServiceCharge = parseFloat(serviceCharges) || resolvedServiceCharge;

      // 3. Generate unique bill number if not provided
      const finalBillNumber = billNumber || `BILL-${Date.now()}`;
      
      let calculatedTotal = parseFloat(railwayFare) || 0;
      calculatedTotal += parseFloat(stationBoyIncentive) || 0;
      calculatedTotal += parseFloat(finalServiceCharge) || 0;
      calculatedTotal += parseFloat(platformFees) || 0;
      
      // Override GST if type is C
      let finalGst = parseFloat(gst) || 0;
      if (gstType === 'C') {
        finalGst = 0;
      }
      calculatedTotal += finalGst;
      
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
        bl_entry_no: finalBillNumber,
        bl_bill_no: finalBillNumber,
        bl_booking_id: bookingId,
        bl_billing_date: billDate ? new Date(billDate) : new Date(), // Required billing date
        bl_customer_name: customerName,
        bl_customer_phone: phoneNumber, // Required phone field
        bl_journey_date: journeyDate && journeyDate.trim() ? new Date(journeyDate) : booking.bk_trvldt,
        bl_total_amount: finalTotalAmount,
        bl_created_by: convertUserIdToInt(req.user.us_usid),
        bl_sub_bill_no: (req.body.subBillNo && req.body.subBillNo !== '-A') ? req.body.subBillNo : `${finalBillNumber}-A`
      });
      
      const bill = await BillTVL.create({
        bl_entry_no: finalBillNumber,
        bl_bill_no: finalBillNumber,
        bl_booking_id: bookingId,
        bl_billing_date: billDate ? new Date(billDate) : new Date(), // Required billing date
        bl_customer_name: customerName,
        bl_customer_phone: phoneNumber, // Required phone field
        bl_station_boy: resolvedStationBoy.nameSnapshot || '',
        bl_from_station: fromStation || '',
        station_boy_id: resolvedStationBoy.id,
        station_boy_name_snapshot: resolvedStationBoy.nameSnapshot,
        station_boy_incentive_amount: stationBoyIncentive || 0,
        bl_to_station: toStation || '',
        bl_journey_date: journeyDate && journeyDate.trim() ? new Date(journeyDate) : booking.bk_trvldt,
        bl_train_no: trainNumber,
        bl_class: reservationClass,
        bl_pnr: pnrNumbers || '',
        bl_sub_bill_no: (req.body.subBillNo && req.body.subBillNo !== '-A') ? req.body.subBillNo : `${finalBillNumber}-A`,
        bl_seats_reserved: seatsAlloted || '',
        bl_railway_fare: railwayFare || 0,
        bl_sb_incentive: stationBoyIncentive || 0,
        bl_service_charge: finalServiceCharge || 0,
        bl_platform_fee: platformFees || 0,
        bl_misc_charges: miscCharges || 0,
        bl_delivery_charge: deliveryCharges || 0,
        bl_gst: finalGst,
        bl_surcharge: surcharge || 0,
        bl_discount: discount || 0,
        bl_gst_type: gstType || 'EXCLUSIVE',
        bl_passenger_ids: activePassengerIds,
        bl_total_amount: finalTotalAmount,
        bl_advance_amount: parseFloat(advanceAmount) || 0,
        bl_payment_mode: paymentMode || null,
        bl_payment_reference: paymentReference || null,
        bl_special_id: specialId || null,
        bl_created_by: enteredBy ? convertUserIdToInt(enteredBy) : convertUserIdToInt(req.user.us_usid),
        // Standard audit fields
        entered_by: enteredBy ? convertUserIdToInt(enteredBy) : convertUserIdToInt(req.user.us_usid),
        entered_on: new Date(),
        status: 'CNF',
        bl_status: 'CNF'
      }, { 
        transaction,
        userId: enteredBy ? convertUserIdToInt(enteredBy) : convertUserIdToInt(req.user.us_usid) // Pass userId for hooks
      });
      
      // 5. Update Booking Status to CONFIRMED and mark as billed
      await booking.update({
        bk_status: 'CNF',
        bk_billed: 1,
        bk_pnr: pnrNumbers || booking.bk_pnr,
        bk_train: trainNumber || booking.bk_train,
        bk_class: reservationClass || booking.bk_class,
        mby: req.user.us_usid,
        mdtm: new Date()
      }, { transaction });
      
      // 6. Update passenger records with the billing number
      const { Passenger, ptXpayment: PaymentTVL } = require('../models'); // Import models
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
              billNumber: finalBillNumber,
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
      }
      
      // 6b. Process explicit Advance Payment received during billing
      if (advanceAmount && parseFloat(advanceAmount) > 0) {
         try {
           const advAmt = parseFloat(advanceAmount);
           console.log(`💰 Processing explicit advance payment of ₹${advAmt} during bill creation.`);
           const entryNo = 'ADV-' + Date.now().toString().slice(-6);
           
           const getNumericId = (id) => {
             if (typeof id === 'number') return id;
             if (!id) return 1;
             const numStr = String(id).replace(/\D/g, '');
             return numStr ? parseInt(numStr, 10) : 1;
           };

           const now = new Date();
           const finYear = `${now.getFullYear()}-${now.getFullYear()+1}`;
           const period = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}`;
           
           // Generate Receipt Number
           const [maxReceipt] = await sequelizeTVL.query('SELECT MAX(CAST(SUBSTRING(rc_entry_no, 3) AS UNSIGNED)) as max_no FROM rcXreceipt', { transaction });
           const nextReceiptNo = 'RC' + ((maxReceipt[0].max_no || 0) + 1).toString().padStart(6, '0');

           const validModes = ['Cash', 'Bank', 'Cheque', 'Online', 'UPI', 'NEFT', 'RTGS', 'IMPS', 'Bank Transfer', 'Credit Card', 'Debit Card'];
           const safePaymentMode = validModes.includes(paymentMode) ? paymentMode : 'Cash';

           const newReceipt = await Receipt.create({
             rc_entry_no: nextReceiptNo,
             rc_date: now,
             rc_customer_name: booking.bk_customer_name || 'Customer',
             rc_customer_phone: booking.bk_contact || '',
             rc_amount: advAmt,
             rc_payment_mode: safePaymentMode,
             rc_ref_number: paymentReference || '',
             rc_bank_account: req.body.paymentAccount || 'Bank',
             rc_narration: `Advance payment from ${booking.bk_customer_name || 'Customer'}`,
             rc_created_by: String(req.user?.us_usid || 1),
             rc_status: 'Active',
             eby: req.user?.us_usid || 1,
             edtm: now
           }, { transaction });
           
           // Insert into Customer Ledger directly as Advance Receipt
           await CustomerLedgerService.writeLedgerEntry({
             customerId: booking.bk_usid,
             entryType: 'PAYMENT',
             referenceType: 'ADVANCE',
             referenceId: newReceipt.rc_rcid || 0,
             creditAmount: advAmt,
             remarks: `Advance received at billing time for ${finalBillNumber}`,
             createdBy: req.user?.us_usid || 1
           }, transaction);
           
         } catch (advErr) {
           console.error('⚠️ Error creating advance payment record:', advErr);
           throw new Error('Failed to record advance payment: ' + advErr.message);
         }
      }

      // YatraSathi Customer Ledger: write BILL entry and auto-adjust advances
      try {
        const customerId = booking.bk_usid;
        await CustomerLedgerService.adjustAdvanceOnBillCreation(
          bill.bl_id,
          customerId,
          finalTotalAmount,
          transaction,
          req.user.us_usid
        );
      } catch (ledgerErr) {
        console.error('New receivables ledger entry on create failed:', ledgerErr);
      }
      
      // 7. Commit transaction (ALL operations succeed together)
      await transaction.commit();

      // 7.5 Create official Receipt for Advance Payment if applicable
      if (advanceAmount && parseFloat(advanceAmount) > 0) {
        try {
          const advAmt = parseFloat(advanceAmount);
          const rcEntryNo = 'RC' + Date.now().toString().slice(-9);
          const paymentAccountName = req.body.paymentAccount || 'Bank';

          await Receipt.create({
            rc_entry_no: rcEntryNo,
            rc_date: billDate ? new Date(billDate) : new Date(),
            rc_customer_name: customerName,
            rc_customer_phone: phoneNumber || '',
            rc_amount: advAmt,
            rc_payment_mode: paymentMode || 'Cash',
            rc_ref_number: paymentReference || '',
            rc_bank_account: paymentAccountName,
            rc_narration: `Advance payment from ${customerName}`,
            rc_created_by: String(req.user.us_usid),
            rc_status: 'Active',
            entered_by: String(req.user.us_usid)
          });
          console.log(`✅ Official Receipt ${rcEntryNo} generated for Advance Payment`);
        } catch (receiptErr) {
          console.error('⚠️ Failed to generate Receipt for Advance Payment (non-fatal):', receiptErr);
        }
      }

      
      console.log(`✅ Bill ${finalBillNumber} created successfully for booking ${bookingId}`);
      console.log(`✅ Booking ${bookingId} status updated to CONFIRMED`);
      
      // ── Forensic Audit: Log INSERT (async, non-blocking) ──────────────────
      Audit.logAction({
        module:   Audit.MODULES.BILLING,
        recordId: bill.bl_id,
        action:   Audit.ACTIONS.INSERT,
        req,
        fieldName: 'bill_number',
        oldValue:  null,
        newValue:  finalBillNumber,
      });
      // Log key financial fields
      const billSnapshot = bill.toJSON();
      const financialFields = ['bl_railway_fare','bl_service_charge','bl_sb_incentive',
        'bl_platform_fee','bl_misc_charges','bl_delivery_charge','bl_gst',
        'bl_surcharge','bl_discount','bl_total_amount','bl_status','bl_customer_name'];
      setImmediate(() => {
        financialFields.forEach(f => {
          if (billSnapshot[f] != null) {
            Audit.logAction({
              module: Audit.MODULES.BILLING, recordId: bill.bl_id,
              action: Audit.ACTIONS.INSERT, req,
              fieldName: f, oldValue: null, newValue: String(billSnapshot[f]),
            });
          }
        });
      });
      // ─────────────────────────────────────────────────────────────────────
      
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
      if (error.message && error.message.includes('Invalid station boy')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
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
    const userId = req.user.us_usid;

    // Use raw SQL to avoid depending on Sequelize associations being set up
    const bills = await sequelizeTVL.query(
      `SELECT bl.*
       FROM blXbilling bl
       INNER JOIN bkXbooking bk ON bl.bl_booking_id = bk.bk_bkid
       WHERE bk.bk_usid = :userId
         AND bl.bl_is_merged = 0 
         AND bl.bl_is_split = 0
       ORDER BY bl.bl_created_at DESC`,
      {
        replacements: { userId },
        type: sequelizeTVL.QueryTypes.SELECT
      }
    );

    const transformedBills = (bills || []).map(billData => ({
      ...billData,
      id: billData.bl_id,
      billId: billData.bl_bill_no,
      bookingId: billData.bl_booking_id,
      customerName: billData.bl_customer_name,
      trainNumber: billData.bl_train_no,
      reservationClass: billData.bl_class,
      pnrNumbers: billData.bl_pnr,
      netFare: billData.bl_railway_fare,
      serviceCharges: billData.bl_service_charge,
      platformFees: billData.bl_platform_fee,
      totalAmount: billData.bl_total_amount,
      advanceAmount: billData.bl_advance_amount,
      paymentMode: billData.bl_payment_mode,
      paymentReference: billData.bl_payment_reference,
      billDate: billData.bl_billing_date || billData.bl_bill_date,
      createdOn: billData.bl_created_at,
    }));

    res.json({
      success: true,
      data: {
        bills: transformedBills,
        count: transformedBills.length
      }
    });
  } catch (error) {
    console.error('getCustomerBills error:', error.message);
    // Return empty array on error so the UI shows "no bills" instead of crashing
    res.json({
      success: true,
      data: { bills: [], count: 0 }
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
    
    // Reconciliation filter
    const reconciliationStatus = req.query.reconciliationStatus || 'ACTIVE';
    if (reconciliationStatus === 'ACTIVE') {
      where.is_reconciled = { [Op.not]: 1 };
    } else if (reconciliationStatus === 'RECONCILED') {
      where.is_reconciled = 1;
    }
    
    // Hide merged and split bills from the list by default
    where.bl_is_merged = false;
    where.bl_is_split = false;

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
    
    const include = [{
      model: BookingTVL,
      as: 'booking',
      attributes: ['bk_usid'],
      required: false // Use LEFT JOIN to show bills even if booking association fails
    }];

    const { count, rows: bills } = await BillTVL.findAndCountAll({
      where,
      include,
      order,
      limit,
      offset
    });

    // Calculate aggregates for the total row (across all filtered records)
    // We pass attributes: [] to includes to avoid 'only_full_group_by' error in MySQL
    let aggregates = { totalAmount: 0, totalFare: 0, totalGST: 0, count: count || 0 };
    
    try {
      const aggregateResults = await queryHelper.getAggregation(
        BillTVL, 
        where, 
        [], 
        ['bl_total_amount', 'bl_railway_fare', 'bl_gst', 'bl_service_charge'],
        include.map(inc => ({ ...inc, attributes: [] }))
      );

      if (aggregateResults && aggregateResults.length > 0) {
        aggregates = {
          totalAmount: parseFloat(aggregateResults[0]?.total_bl_total_amount || 0),
          totalFare: parseFloat(aggregateResults[0]?.total_bl_railway_fare || 0),
          totalGST: parseFloat(aggregateResults[0]?.total_bl_gst || 0),
          totalServiceCharges: parseFloat(aggregateResults[0]?.total_bl_service_charge || 0),
          totalSBIncentive: 0,
          count: parseInt(aggregateResults[0]?.count || count || 0)
        };
      }
    } catch (aggError) {
      console.error('⚠️ Aggregation Error in getAllBills:', aggError.message);
      // Main query succeeded, so we provide fallback aggregates instead of failing the whole request
    }
    
    // Batch fetch passenger counts/details for these bills
    const bookingIds = bills.map(b => b.bl_booking_id).filter(Boolean);
    const billPassengersMap = {};
    
    if (bookingIds.length > 0) {
      const passengerResults = await Passenger.findAll({
        where: {
          ps_bkid: bookingIds,
          ps_active: 1
        }
      });

      if (passengerResults && passengerResults.length > 0) {
        passengerResults.forEach(p => {
          const bkid = p.ps_bkid;
          if (!billPassengersMap[bkid]) {
            billPassengersMap[bkid] = [];
          }
          billPassengersMap[bkid].push({
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
    }
    
    const transformedBills = bills.map(bill => {
      const billData = bill.toJSON();
      const passengerList = billPassengersMap[billData.bl_booking_id] || [];
      
      return {
        ...billData,
        id: billData.bl_id,
        billId: billData.bl_bill_no,
        bookingId: billData.bl_booking_id,
        customerName: billData.bl_customer_name,
        phoneNumber: billData.bl_customer_phone,
        railwayFare: billData.bl_railway_fare,
        serviceCharges: billData.bl_service_charge,
        stationBoyIncentive: billData.bl_sb_incentive,
        platformFees: billData.bl_platform_fee,
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
    
    const response = queryHelper.formatPaginatedResponse(count, transformedBills, page, limit);
    res.json({
      ...response,
      aggregates
    });
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
      advanceAmount: billData.bl_advance_amount,
      paymentMode: billData.bl_payment_mode,
      paymentReference: billData.bl_payment_reference,
      billDate: billData.bl_billing_date,
      createdOn: billData.bl_created_at,
      createdBy: billData.bl_created_by,
      remarks: billData.bl_remarks || '', 
      status: billData.bl_status || billData.status || 'CNF'
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
    console.error('Error generating printable bill:', error);
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
    
    // Resolve and validate Station Boy if changing
    const { stationBoyId, stationBoy, stationBoyIncentive } = req.body;
    let resolvedStationBoy;
    try {
      resolvedStationBoy = await resolveAndValidateStationBoy(
        stationBoyId !== undefined ? stationBoyId : null,
        stationBoy !== undefined ? stationBoy : null,
        false,
        bill.station_boy_id
      );
    } catch (sbError) {
      return res.status(400).json({
        success: false,
        message: sbError.message
      });
    }

    // Calculate total amount if needed
    let totalAmount = req.body.totalAmount !== undefined ? parseFloat(req.body.totalAmount) : 
                     (req.body.bl_total_amount !== undefined ? parseFloat(req.body.bl_total_amount) : null);
    
    if (totalAmount === null) {
      totalAmount = req.body.railwayFare ? parseFloat(req.body.railwayFare) : parseFloat(bill.bl_railway_fare) || 0;
      totalAmount += req.body.serviceCharges ? parseFloat(req.body.serviceCharges) : parseFloat(bill.bl_service_charge) || 0;
      totalAmount += req.body.platformFees ? parseFloat(req.body.platformFees) : parseFloat(bill.bl_platform_fee) || 0;
      
      const sbIncentive = stationBoyIncentive !== undefined ? parseFloat(stationBoyIncentive) : parseFloat(bill.bl_sb_incentive) || 0;
      totalAmount += sbIncentive;
      
      let gstVal = req.body.gst !== undefined ? parseFloat(req.body.gst) : parseFloat(bill.bl_gst) || 0;
      const gstTypeVal = req.body.gstType !== undefined ? req.body.gstType : bill.bl_gst_type;
      if (gstTypeVal === 'C') {
        gstVal = 0;
      }
      totalAmount += gstVal;

      const misc = req.body.miscCharges !== undefined ? parseFloat(req.body.miscCharges) : parseFloat(bill.bl_misc_charges) || 0;
      totalAmount += misc;

      const delivery = req.body.deliveryCharges !== undefined ? parseFloat(req.body.deliveryCharges) : parseFloat(bill.bl_delivery_charge) || 0;
      totalAmount += delivery;

      const surchargeVal = req.body.surcharge !== undefined ? parseFloat(req.body.surcharge) : parseFloat(bill.bl_surcharge) || 0;
      totalAmount += surchargeVal;

      const discountVal = req.body.discount !== undefined ? parseFloat(req.body.discount) : parseFloat(bill.bl_discount) || 0;
      totalAmount -= discountVal;
    }

    // Ensure total amount is not negative
    totalAmount = Math.max(0, totalAmount);

    // Snapshot BEFORE update for forensic diff
    const billBeforeUpdate = bill.toJSON();

    // Update the bill
    const incentiveAmount = stationBoyIncentive !== undefined ? parseFloat(stationBoyIncentive) : parseFloat(bill.station_boy_incentive_amount) || 0;

    await bill.update({
      ...req.body,
      station_boy_id: resolvedStationBoy.id,
      station_boy_name_snapshot: resolvedStationBoy.nameSnapshot,
      station_boy_incentive_amount: incentiveAmount,
      bl_station_boy: resolvedStationBoy.nameSnapshot || '',
      bl_sb_incentive: incentiveAmount,
      bl_gst: gstVal, // Update GST with forced 0 for C type
      bl_total_amount: totalAmount,
      bl_advance_amount: req.body.advanceAmount !== undefined ? parseFloat(req.body.advanceAmount) : parseFloat(bill.bl_advance_amount) || 0,
      bl_payment_mode: req.body.paymentMode !== undefined ? req.body.paymentMode : bill.bl_payment_mode,
      bl_payment_reference: req.body.paymentReference !== undefined ? req.body.paymentReference : bill.bl_payment_reference,
      bl_sub_bill_no: req.body.subBillNo || req.body.bl_sub_bill_no || bill.bl_sub_bill_no,
      bl_modified_by: convertUserIdToInt(req.user.us_usid),
      bl_modified_at: new Date(),
      // Standard audit fields — always server-side, never from frontend
      modified_by: req.user.us_usid,
      modified_on: new Date()
    }, {
      userId: convertUserIdToInt(req.user.us_usid) // Pass userId for hooks
    });

    // ── Forensic Audit: Log per-field changes (async, non-blocking) ──────────
    Audit.logFieldChanges(billBeforeUpdate, bill.toJSON(), {
      module:   Audit.MODULES.BILLING,
      recordId: bill.bl_id,
      req,
    });
    // ─────────────────────────────────────────────────────────────────────────

    
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
      advanceAmount: billData.bl_advance_amount,
      paymentMode: billData.bl_payment_mode,
      paymentReference: billData.bl_payment_reference,
      billDate: billData.bl_billing_date,
      createdOn: billData.bl_created_at,
      createdBy: billData.bl_created_by,
      remarks: '', // Default empty remarks
      status: 'DRF' // Default status
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
      advanceAmount: billData.bl_advance_amount,
      paymentMode: billData.bl_payment_mode,
      paymentReference: billData.bl_payment_reference,
      billDate: billData.bl_billing_date,
      createdOn: billData.bl_created_at,
      createdBy: billData.bl_created_by,
      remarks: '', // Default empty remarks
      status: 'DRF' // Default status
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
      
      if (booking && (booking.bk_status === 'CNF' || booking.bk_status === 'PND')) {
        const oldStatus = booking.bk_status;
        
        // Update booking status to DRAFT and reset billed flag
        await booking.update({
          bk_status: 'DRF',
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

    // Resolve Cancellation Service Charge based on tiered rules
    const passengerCount = await PassengerTVL.count({ 
      where: { ps_bkid: bill.bl_booking_id, ps_active: 1 } 
    }) || 1;
    
    const autoCancelCharge = await serviceChargeService.getServiceCharge({
      customerId: bill.bl_customer_id || bill.bl_usid,
      serviceType: 'CANCELLATION',
      travelClass: bill.bl_class || '3A',
      passengerCount: passengerCount
    });

    const { railway, agent } = billCancellation.parseCharges(
      railwayCharges, 
      agentCharges || autoCancelCharge
    );
    const totalCancelCharges = railway + agent;
    const billTotal = parseFloat(bill.bl_total_amount) || 0;
    const refundAmount = Math.max(0, billTotal - totalCancelCharges);
    const cancellationRef = billCancellation.generateCancellationReference();
    const cancelDate = new Date(cancellationDate);

    const oldValues = bill.toJSON();

    await bill.update(
      {
        bl_status: 'CAN',
        status: 'CAN',
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
        mdtm: new Date(),
        // Standard audit fields — server-side only
        closed_by: req.user.us_usid,
        closed_on: new Date(),
        modified_by: req.user.us_usid,
        modified_on: new Date()
      },
      { transaction }
    );

    // YatraSathi Customer Ledger: cancel allocations and write BILL_CANCELLED entry
    try {
      const customerId = bill.bl_usid || bill.bl_customer_id;
      let finalCustomerId = customerId;
      if (!finalCustomerId && bill.bl_booking_id) {
        const booking = await BookingTVL.findByPk(bill.bl_booking_id, { transaction });
        if (booking) finalCustomerId = booking.bk_usid;
      }
      
      await CustomerLedgerService.cancelBillAllocations(
        bill.bl_id,
        billTotal,
        finalCustomerId || 'CUS001',
        transaction,
        req.user.us_usid
      );
    } catch (ledgerErr) {
      console.error('New receivables ledger entry on cancel failed:', ledgerErr);
    }



    const bookingId = bill.bl_booking_id;
    if (bookingId) {
      const booking = await BookingTVL.findByPk(bookingId, { transaction });
      if (booking) {
        await booking.update(
          {
            bk_status: 'CAN',
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

    // ── Customer Ledger: CREDIT entry for refund ──
    try {
      const customerUsid = bill.bl_usid || bill.bl_customer_id;
      if (customerUsid && refundAmount > 0) {
        const lastLedger = await Ledger.findOne({
          where: { lg_usid: customerUsid },
          order: [['lg_lgid', 'DESC']],
          transaction
        });
        const openingBal = lastLedger ? parseFloat(lastLedger.lg_closing_bal) || 0 : 0;
        const closingBal = openingBal + refundAmount;
        const fyMonth = cancelDate.getMonth() + 1;
        const fyYear = cancelDate.getFullYear();
        const fyear = fyMonth >= 4 ? `${fyYear}-${String(fyYear + 1).slice(-2)}` : `${fyYear - 1}-${String(fyYear).slice(-2)}`;

        await Ledger.create(
          {
            lg_usid: customerUsid,
            lg_entry_type: 'CREDIT',
            lg_entry_ref: cancellationRef,
            lg_amount: refundAmount,
            lg_opening_bal: openingBal,
            lg_closing_bal: closingBal,
            lg_fyear: fyear,
            lg_remarks: `Refund for cancelled bill ${bill.bl_bill_no}. Ref: ${cancellationRef}`,
            eby: req.user.us_usid,
            edtm: new Date(),
            mby: req.user.us_usid,
            mdtm: new Date()
          },
          { transaction, userId: req.user.us_usid }
        );
      }
    } catch (ledgerErr) {
      console.error('Ledger entry on cancel failed (non-fatal):', ledgerErr);
    }

    // Forensic audit logging moved to post-commit ForensicAuditService calls below

    await transaction.commit();

    // ── Forensic Audit: Log CANCEL with per-field detail (async, non-blocking) ──
    Audit.logAction({ module: Audit.MODULES.BILLING, recordId: bill.bl_id, action: Audit.ACTIONS.CANCEL, req, fieldName: 'bl_status', oldValue: oldValues.bl_status, newValue: 'CAN' });
    Audit.logAction({ module: Audit.MODULES.BILLING, recordId: bill.bl_id, action: Audit.ACTIONS.CANCEL, req, fieldName: 'total_cancel_charges', oldValue: '0', newValue: String(totalCancelCharges) });
    Audit.logAction({ module: Audit.MODULES.BILLING, recordId: bill.bl_id, action: Audit.ACTIONS.CANCEL, req, fieldName: 'railway_cancellation_charge', oldValue: '0', newValue: String(railway) });
    Audit.logAction({ module: Audit.MODULES.BILLING, recordId: bill.bl_id, action: Audit.ACTIONS.CANCEL, req, fieldName: 'agent_cancellation_charge', oldValue: '0', newValue: String(agent) });
    Audit.logAction({ module: Audit.MODULES.BILLING, recordId: bill.bl_id, action: Audit.ACTIONS.CANCEL, req, fieldName: 'refund_amount', oldValue: null, newValue: String(refundAmount) });
    Audit.logAction({ module: Audit.MODULES.BILLING, recordId: bill.bl_id, action: Audit.ACTIONS.CANCEL, req, fieldName: 'cancellation_reason', oldValue: null, newValue: String(reason || '') });
    Audit.logAction({ module: Audit.MODULES.BILLING, recordId: bill.bl_id, action: Audit.ACTIONS.CANCEL, req, fieldName: 'cancellation_ref', oldValue: null, newValue: cancellationRef });
    Audit.logAction({ module: Audit.MODULES.BILLING, recordId: bill.bl_id, action: Audit.ACTIONS.CANCEL, req, fieldName: 'cancellation_approver', oldValue: null, newValue: String(approverUserId).trim() });
    Audit.logAction({ module: Audit.MODULES.BILLING, recordId: bill.bl_id, action: Audit.ACTIONS.CANCEL, req, fieldName: 'payment_status', oldValue: oldValues.payment_status || 'UNPAID', newValue: 'REFUND_DUE' });
    // ───────────────────────────────────────────────────────────────────


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
    const andClauses = [{ [Op.or]: [{ is_cancelled: 1 }, { bl_status: 'CAN' }] }];

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
    let whereConditions = {
      bl_is_merged: false,
      bl_is_split: false
    };

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
        advanceAmount: billData.bl_advance_amount,
        paymentMode: billData.bl_payment_mode,
        paymentReference: billData.bl_payment_reference,
        billDate: billData.bl_billing_date,
        createdOn: billData.bl_created_at,
        createdBy: billData.bl_created_by,
        remarks: '', // Default empty remarks
        status: 'DRF' // Default status
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

// Get customer ledger (vintage format with opening balance, running balance, summary)
const getCustomerLedger = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { fromDate, toDate } = req.query;

    // Check if user has permission to access this customer's ledger
    if (req.user.us_usertype !== 'admin' && 
        req.user.us_usertype !== 'employee' && 
        req.user.us_usid !== customerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await CustomerLedgerService.getCustomerVintageLedger(customerId, fromDate, toDate);
    res.json(result);
  } catch (error) {
    console.error('getCustomerLedger error:', error);
    res.status(500).json({ success: false, message: error.message });
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

// -----------------------------
// ADVANCED BILLING OPERATIONS
// -----------------------------

const splitBill = async (req, res) => {
  const transaction = await sequelizeTVL.transaction();
  try {
    const { id } = req.params;
    const { splitCount } = req.body;
    
    if (!splitCount || splitCount < 2) {
      throw new Error('Split count must be at least 2');
    }

    const parentBill = await BillTVL.findByPk(id, { transaction });
    if (!parentBill) throw new Error('Bill not found');
    if (parentBill.bl_status === 'CANCELLED' || parentBill.bl_status === 'CAN') throw new Error('Cannot split cancelled bill');
    if (parentBill.bl_is_split) throw new Error('Bill is already split');
    
    const parentTotal = parseFloat(parentBill.bl_total_amount);
    
    // Accurate rounding logic to prevent floating point mismatch
    // Round down to nearest integer (or cents if doing * 100)
    // Actually we should just calculate exact decimals
    const baseChildAmount = Math.floor(parentTotal / splitCount);
    const remainder = parentTotal - (baseChildAmount * splitCount);

    const childBills = [];
    for (let i = 0; i < splitCount; i++) {
      const childAmount = i === 0 ? baseChildAmount + remainder : baseChildAmount;
      
      const billData = parentBill.toJSON();
      delete billData.bl_id; // Remove primary key
      
      // Use alphabetical suffix: A, B, C...
      const suffix = String.fromCharCode(65 + i);
      billData.bl_entry_no = `${parentBill.bl_entry_no}${suffix}`;
      billData.bl_bill_no = `${parentBill.bl_bill_no}${suffix}`;
      billData.bl_total_amount = childAmount;
      billData.bl_parent_bill_id = parentBill.bl_id;
      billData.bl_is_split = false; // The children themselves are not split
      
      // Zero out structural charges so the total adds up cleanly without confusion
      billData.bl_railway_fare = 0;
      billData.bl_sb_incentive = 0;
      billData.bl_service_charge = 0;
      billData.bl_platform_fee = 0;
      billData.bl_misc_charges = 0;
      billData.bl_delivery_charge = 0;
      billData.bl_gst = 0;
      billData.bl_surcharge = 0;
      billData.bl_discount = 0;
      billData.bl_advance_amount = 0; // Don't duplicate advances

      const childBill = await BillTVL.create(billData, { transaction });
      childBills.push(childBill);
    }
    
    parentBill.bl_is_split = true;
    await parentBill.save({ transaction });
    
    // Log Forensic Audit
    Audit.logAction({
      module: Audit.MODULES.BILLING,
      recordId: parentBill.bl_id,
      action: Audit.ACTIONS.UPDATE,
      req,
      fieldName: 'bl_is_split',
      oldValue: false,
      newValue: true,
      reason: `Split into ${splitCount} bills`
    });

    await transaction.commit();
    res.json({ success: true, message: 'Bill split successfully', childBills });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

const mergeBill = async (req, res) => {
  const transaction = await sequelizeTVL.transaction();
  try {
    const { billIds } = req.body;
    if (!billIds || billIds.length < 2) {
      throw new Error('Must provide at least 2 bill IDs to merge');
    }

    const bills = await BillTVL.findAll({
      where: { bl_id: billIds },
      transaction
    });

    if (bills.length !== billIds.length) {
      throw new Error('One or more bills not found');
    }
    
    const customerNames = [...new Set(bills.map(b => b.bl_customer_name))];
    if (customerNames.length > 1) {
      throw new Error('Cannot merge bills belonging to different customers');
    }

    let combinedTotal = 0;
    bills.forEach(b => {
      if (b.bl_status === 'CANCELLED' || b.bl_status === 'CAN') throw new Error(`Bill ${b.bl_id} is cancelled`);
      if (b.bl_is_merged) throw new Error(`Bill ${b.bl_id} is already merged`);
      combinedTotal += parseFloat(b.bl_total_amount);
    });

    // Create the master merged bill (inheriting core properties from the first bill)
    const baseBill = bills[0];
    const mergedBillData = baseBill.toJSON();
    delete mergedBillData.bl_id;
    
    mergedBillData.bl_entry_no = `MERGED-${Date.now().toString().slice(-6)}`;
    mergedBillData.bl_bill_no = mergedBillData.bl_entry_no;
    mergedBillData.bl_total_amount = combinedTotal;
    mergedBillData.bl_is_merged = false;
    mergedBillData.bl_is_split = false;
    mergedBillData.bl_parent_bill_id = null;
    mergedBillData.bl_advance_amount = 0;

    const mergedBill = await BillTVL.create(mergedBillData, { transaction });

    // Mark children as merged
    for (const b of bills) {
      b.bl_is_merged = true;
      b.bl_merged_into_id = mergedBill.bl_id;
      await b.save({ transaction });
      
      Audit.logAction({
        module: Audit.MODULES.BILLING,
        recordId: b.bl_id,
        action: Audit.ACTIONS.UPDATE,
        req,
        fieldName: 'bl_is_merged',
        oldValue: false,
        newValue: true,
        reason: `Merged into ${mergedBill.bl_entry_no}`
      });
    }

    await transaction.commit();
    res.json({ success: true, message: 'Bills merged successfully', mergedBill });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};



// --- V2 IMPLEMENTATIONS ---
const fetchBookingForBilling = async (req, res) => {
  const { BookingTVL, PassengerTVL } = require('../models');
  const { configure, checkPNRStatus } = require('railkit');
  
  if (process.env.RAILKIT_API_KEY) {
    try { configure(process.env.RAILKIT_API_KEY); } catch (e) {}
  }
  
  try {
    const { id } = req.params;
    const isPnr = isNaN(id) || id.length === 10;
    
    let booking;
    if (isPnr) {
      booking = await BookingTVL.findOne({ where: { bk_pnr: id } });
    } else {
      booking = await BookingTVL.findByPk(id);
    }
    
    // If not found in local DB, but it is a PNR, try fetching from RailKit
    if (!booking && isPnr && id.length === 10) {
      console.log(`PNR ${id} not found locally, fetching from RailKit...`);
      try {
        const result = await checkPNRStatus(id);
        if (result && result.success && result.data) {
          const d = result.data;
          
          let parsedDate = null;
          if (d.journey && d.journey.dateOfJourney) {
            const temp = new Date(d.journey.dateOfJourney);
            if (!isNaN(temp.getTime())) parsedDate = temp;
          }
          
          // Extract primary passenger details
          const p1 = d.passengers && d.passengers[0] ? d.passengers[0] : null;
          const p1Status = p1?.current?.status || p1?.booking?.status || d.pnrStatus || (d.chart?.status?.includes('Prepared') ? 'CNF' : 'CNF');
          const coachStr = p1?.current?.coach || p1?.booking?.coach || '';
          const berthStr = p1?.current?.berthNo ? String(p1.current.berthNo) : (p1?.booking?.berthNo ? String(p1.booking.berthNo) : '');
          const berthCodeStr = p1?.current?.berthCode || p1?.booking?.berthCode || '';
          const p1Details = p1?.current?.details || p1?.booking?.details || '';
          
          const fromStn = d.journey?.boardingPoint?.code || d.journey?.source?.code || d.boardingStation?.code || d.fromStation?.code || '';
          const toStn = d.journey?.destination?.code || d.reservationUpTo?.code || d.toStation?.code || '';
          const trainNo = d.train?.number || d.trainInfo?.trainNo || d.trainInfo?.trainNumber || '';
          const travelClass = d.journey?.class || d.trainInfo?.class || d.trainInfo?.travelClass || '3A';
          const ticketFare = d.booking?.fare || d.booking?.ticketFare || d.ticketFare || d.fare || d.totalFare || 0;
          
          return res.status(200).json({
            success: true,
            data: {
              bl_booking_id: null,
              bl_pnr: id,
              bl_customer_name: '',
              bl_customer_phone: '',
              bl_from_station: fromStn,
              bl_to_station: toStn,
              bl_train_no: trainNo,
              bl_class: travelClass,
              bl_journey_date: parsedDate,
              bl_journeyTime: d.boardingStation?.departureTime || d.journey?.departureTime || d.trainInfo?.departureTime || '',
              bl_pnrStatus: p1Status,
              bl_coach: coachStr,
              bl_berthNo: berthStr,
              bl_berthCode: berthCodeStr,
              bl_details: p1Details,
              bl_railway_fare: ticketFare,
              bl_seatsAlloted: d.passengers ? String(d.passengers.length) : '1',
              passengers: (d.passengers || []).map((p, i) => ({
                id: `new_${i}`,
                name: p.name || p.serialNumber || `Passenger ${i+1}`,
                coach: p.current?.coach || p.booking?.coach || coachStr,
                berth: p.current?.berthNo ? String(p.current.berthNo) : (p.booking?.berthNo ? String(p.booking.berthNo) : berthStr)
              }))
            }
          });
        }
      } catch (err) {
        console.error('RailKit API fetch failed:', err);
      }
      return res.status(404).json({ success: false, message: 'Booking or PNR not found locally or via live API' });
    } else if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking or PNR not found' });
    }
    
    const passengers = await PassengerTVL.findAll({
      where: { ps_bkid: booking.bk_bkid, ps_active: 1 }
    });

    let liveFare = booking.bk_railwayfare || booking.bk_fare || 0;
    let trainNo = booking.bk_trainno || booking.bk_train_no || '';
    let pnrStatus = 'CNF';
    let coachStr = passengers[0]?.ps_coach || '';
    let berthStr = passengers[0]?.ps_berthalloc || passengers[0]?.ps_berthpref || '';

    // If booking has PNR and some fields are empty, try live RailKit enrich
    if (booking.bk_pnr && booking.bk_pnr.length === 10 && (!liveFare || !trainNo)) {
      try {
        const liveResult = await checkPNRStatus(booking.bk_pnr);
        if (liveResult && liveResult.success && liveResult.data) {
          const ld = liveResult.data;
          if (!trainNo) trainNo = ld.trainInfo?.trainNo || ld.trainInfo?.trainNumber || '';
          if (!liveFare) liveFare = ld.ticketFare || ld.fare || ld.totalFare || ld.bookingFare || 0;
          if (ld.pnrStatus) pnrStatus = ld.pnrStatus;
          const p1 = ld.passengers?.[0];
          if (p1) {
            const p1Details = p1.current?.details || p1.booking?.details || '';
            if (p1Details.includes(',')) {
              const parts = p1Details.split(',').map(s => s.trim());
              if (parts[0] && !coachStr) coachStr = parts[0];
              if (parts[1] && !berthStr) berthStr = parts[1];
            }
          }
        }
      } catch (e) {
        // Continue with local booking data
      }
    }
    
    const data = {
      bl_booking_id: booking.bk_bkid,
      bl_pnr: booking.bk_pnr,
      bl_customer_name: booking.bk_customername || (passengers[0] ? `${passengers[0].ps_fname} ${passengers[0].ps_lname}`.trim() : ''),
      bl_customer_phone: booking.bk_phonenumber || '',
      bl_from_station: booking.bk_fromst || '',
      bl_to_station: booking.bk_tost || '',
      bl_train_no: trainNo,
      bl_class: booking.bk_class || '',
      bl_journey_date: booking.bk_trvldt || booking.bk_reqdt,
      bl_railway_fare: liveFare,
      bl_pnrStatus: pnrStatus,
      bl_coach: coachStr,
      bl_berthNo: berthStr,
      bl_seatsAlloted: String(passengers.length || 1),
      passengers: passengers.map(p => ({
        id: p.ps_psid,
        name: `${p.ps_fname} ${p.ps_lname}`.trim(),
        coach: p.ps_coach,
        berth: p.ps_berthalloc || p.ps_berthpref
      }))
    };
    
    try {
      const { Receipt } = require('../models');
      const { Op } = require('sequelize');
      const advanceReceipt = await Receipt.findOne({
        where: {
          rc_narration: {
            [Op.like]: `%Advance payment for Booking ${booking.bk_bkno}%`
          }
        }
      });
      if (advanceReceipt) {
        data.advanceAmount = advanceReceipt.rc_amount;
        data.paymentMode = advanceReceipt.rc_payment_mode;
        data.paymentReference = advanceReceipt.rc_ref_number;
      }
    } catch (err) {
      console.error('Error fetching advance receipt:', err);
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const splitBillV2 = async (req, res) => {
  const { sequelizeTVL, BillTVL, PassengerTVL, ForensicAuditLog, Ledger } = require('../models');

  let transaction;
  try {
    transaction = await sequelizeTVL.transaction();
    const { id } = req.params;
    let splits = req.body.splits;
    
    console.log('splitBillV2 req.body:', JSON.stringify(req.body));

    // Ensure splits is always an array
    if (!splits) throw new Error('Must provide splits in request body');
    if (!Array.isArray(splits)) splits = Object.values(splits);
    if (splits.length < 2) throw new Error('Must provide at least 2 split groups');

    const parentBill = await BillTVL.findByPk(id, { transaction });
    if (!parentBill) throw new Error('Bill not found');
    if (parentBill.status === 'CANCELLED' || parentBill.status === 'CAN') throw new Error('Cannot split cancelled bill');
    if (parentBill.bl_is_split) throw new Error('Bill is already split');
    if (parentBill.is_deleted) throw new Error('Cannot split deleted bill');
    
    const parentTotal = parseFloat(parentBill.bl_total_amount);
    const splitTotal = splits.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    
    if (Math.abs(parentTotal - splitTotal) > 0.01) {
      throw new Error(`Split amounts (${splitTotal}) must equal the original bill amount (${parentTotal})`);
    }

    const childBills = [];
    const parentBaseNo = parentBill.bl_bill_no || parentBill.bl_entry_no;
    const parentTotalForRatio = parseFloat(parentBill.bl_total_amount) || 1;
    
    // Fetch all passengers linked to this bill for auto-distribution
    let allPassengers = [];
    try {
      const [rows] = await sequelizeTVL.query(
        `SELECT ps_psid FROM psXpassenger WHERE bl_bill_no = :billNo`,
        { replacements: { billNo: parentBill.bl_entry_no || parentBill.bl_bill_no }, transaction }
      );
      allPassengers = rows.map(r => r.ps_psid);
    } catch (e) { /* passengers may not exist */ }

    const paxPerSplit = allPassengers.length > 0 ? Math.floor(allPassengers.length / splits.length) : 0;
    let remainingPax = [...allPassengers];

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      const splitAmount = parseFloat(split.amount);
      const ratio = parentTotalForRatio > 0 ? splitAmount / parentTotalForRatio : 1 / splits.length;
      
      const billData = parentBill.toJSON();
      delete billData.bl_id;
      delete billData.status; // Remove status to avoid ENUM conflict
      delete billData.createdAt;
      delete billData.updatedAt;
      
      const suffix = String.fromCharCode(65 + i); // A, B, C...
      billData.bl_entry_no = `${parentBill.bl_entry_no}-${suffix}`;
      billData.bl_sub_bill_no = `${parentBaseNo}-${suffix}`;
      billData.bl_bill_no = parentBill.bl_bill_no;
      billData.bl_total_amount = splitAmount;
      billData.bl_parent_bill_id = parentBill.bl_id;
      billData.bl_is_split = false;
      
      // Distribute financial fields proportionally
      const financialFields = [
        'bl_railway_fare', 'bl_sb_incentive', 'bl_service_charge',
        'bl_platform_fee', 'bl_misc_charges', 'bl_delivery_charge',
        'bl_gst', 'bl_surcharge', 'bl_discount', 'bl_advance_amount',
        'bl_cancellation_charges'
      ];
      financialFields.forEach(field => {
        const val = parseFloat(parentBill[field] || 0);
        billData[field] = Math.round(val * ratio * 100) / 100;
      });

      const childBill = await BillTVL.create(billData, { transaction });
      childBills.push(childBill);

      // Determine which passengers go to this split
      const assignedPaxIds = split.passengerIds && split.passengerIds.length > 0
        ? split.passengerIds
        : (i === splits.length - 1
            ? remainingPax.splice(0)
            : remainingPax.splice(0, paxPerSplit));

      if (assignedPaxIds && assignedPaxIds.length > 0) {
        await sequelizeTVL.query(
          `UPDATE psXpassenger SET bl_bill_no = :subBillNo WHERE ps_psid IN (:passengerIds)`,
          {
            replacements: { subBillNo: childBill.bl_entry_no, passengerIds: assignedPaxIds },
            transaction
          }
        );
      }
    }
    
    // Use raw SQL to bypass Sequelize ENUM validation on 'status' field
    await sequelizeTVL.query(
      `UPDATE blXbilling SET bl_is_split = 1, bl_status = 'CANCELLED', is_deleted = 1 WHERE bl_id = :id`,
      { replacements: { id: parentBill.bl_id }, transaction }
    );
    
    if (Audit && Audit.logAction) {
      Audit.logAction({
        module: Audit.MODULES?.BILLING || 'BILLING',
        recordId: parentBill.bl_id,
        action: Audit.ACTIONS?.UPDATE || 'UPDATE',
        req,
        fieldName: 'bl_is_split',
        oldValue: false,
        newValue: true,
        reason: `Split into ${splits.length} bills`
      });
    }

    await transaction.commit();
    res.json({ success: true, message: 'Bill split successfully', childBills });
  } catch (error) {
    console.error('splitBillV2 Error:', error);
    if (transaction) await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

const mergeBillV2 = async (req, res) => {
  const { sequelizeTVL, BillTVL } = require('../models');

  const transaction = await sequelizeTVL.transaction();
  try {
    const { billIds } = req.body;
    if (!billIds || billIds.length < 2) {
      throw new Error('Must provide at least 2 bill IDs to merge');
    }

    const bills = await BillTVL.findAll({
      where: { bl_id: billIds },
      transaction
    });

    if (bills.length !== billIds.length) {
      throw new Error('One or more bills not found');
    }
    
    const customerNames = [...new Set(bills.map(b => b.bl_customer_name))];
    if (customerNames.length > 1) {
      throw new Error('Cannot merge bills belonging to different customers');
    }

    const superBillId = Date.now();

    for (const b of bills) {
      if (b.status === 'CANCELLED' || b.status === 'CAN') throw new Error(`Bill ${b.bl_id} is cancelled`);
      if (b.is_deleted) throw new Error(`Bill ${b.bl_id} is deleted`);
      
      b.super_bill_id = superBillId;
      await b.save({ transaction });
      
      if (Audit && Audit.logAction) {
        Audit.logAction({
          module: Audit.MODULES?.BILLING || 'BILLING',
          recordId: b.bl_id,
          action: Audit.ACTIONS?.UPDATE || 'UPDATE',
          req,
          fieldName: 'super_bill_id',
          oldValue: null,
          newValue: superBillId,
          reason: `Merged for printing under Super Bill ${superBillId}`
        });
      }
    }

    await transaction.commit();
    res.json({ success: true, message: 'Bills merged for printing', superBillId });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteBillV2 = async (req, res) => {
  const { sequelizeTVL, BillTVL } = require('../models');

  const transaction = await sequelizeTVL.transaction();
  try {
    const { id } = req.params;
    const bill = await BillTVL.findByPk(id, { transaction });
    
    if (!bill) throw new Error('Bill not found');
    if (bill.status === 'CANCELLED' || bill.status === 'CAN') {
      throw new Error('Cannot delete a cancelled bill');
    }
    if (bill.is_deleted) {
      throw new Error('Bill is already deleted');
    }

    bill.bl_status = 'CANCELLED';
    bill.is_deleted = 1;
    await bill.save({ transaction });

    if (Audit && Audit.logAction) {
      Audit.logAction({
        module: Audit.MODULES?.BILLING || 'BILLING',
        recordId: bill.bl_id,
        action: Audit.ACTIONS?.DELETE || 'DELETE',
        req,
        reason: 'Soft deleted by user'
      });
    }

    await transaction.commit();
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

const cancelBillV2 = async (req, res) => {
  const { sequelizeTVL, BillTVL, PassengerTVL, Receipt, Ledger, BookingTVL } = require('../models');
  const CustomerLedgerService = require('../services/CustomerLedgerService');

  const transaction = await sequelizeTVL.transaction();
  
  try {
    const { id } = req.params;
    const { railwayCharges, agentCharges, cancelledPassengers, reason } = req.body;
    
    if (!cancelledPassengers || cancelledPassengers.length === 0) {
      throw new Error('At least one passenger must be selected for cancellation');
    }
    if (railwayCharges === undefined || agentCharges === undefined) {
      throw new Error('Railway and Agent cancellation charges are required');
    }
    
    const bill = await BillTVL.findByPk(id, { transaction });
    if (!bill) throw new Error('Bill not found');
    const billStatus = bill.bl_status || bill.status;
    if (billStatus === 'CANCELLED' || billStatus === 'CAN' || bill.is_cancelled === 1) {
      throw new Error('Bill is already cancelled');
    }
    
    const passengersResult = await PassengerTVL.findAll({
      where: { ps_bkid: bill.bl_booking_id },
      transaction
    });
    const totalPassengers = passengersResult.length || 1;
    const isPartial = cancelledPassengers.length < totalPassengers;

    const railChg = parseFloat(railwayCharges) || 0;
    const agentChg = parseFloat(agentCharges) || 0;
    const totalCancel = railChg + agentChg;
    const originalTotal = parseFloat(bill.bl_total_amount) || 0;
    
    const baseRefund = totalPassengers > 0 ? (originalTotal / totalPassengers) * (cancelledPassengers.length || 0) : 0;
    
    if (totalCancel > baseRefund) {
      throw new Error('Cancellation charges cannot exceed the refundable amount for the selected passengers');
    }
    
    const refundAmount = Math.max(0, baseRefund - totalCancel);

    const cancelData = {
      isPartial,
      railwayCharges: railChg,
      agentCharges: agentChg,
      totalCancelCharges: totalCancel,
      refundAmount,
      cancelledPassengers, 
      reason
    };

    // 1. Update existing bill (reduce proportional baseRefund)
    const activePassengers = Array.isArray(bill.bl_passenger_ids) 
      ? bill.bl_passenger_ids 
      : passengersResult.map(p => p.ps_psid);
    
    const remainingPassengers = activePassengers.filter(id => !cancelledPassengers.includes(id));
    
    const splitCount = Array.isArray(bill.split_audit_log) ? bill.split_audit_log.length : 0;
    const subBillSuffix = '-' + String.fromCharCode(65 + splitCount); // -A, -B, -C...
    const baseBillNo = bill.bl_bill_no.replace(/-[A-Z]$/, ''); // Ensure we don't double suffix
    const subBillNo = baseBillNo + subBillSuffix;

    const auditLogEntry = {
      timestamp: new Date(),
      action: 'SPLIT_CANCELLATION',
      cancelledPassengers,
      subBillNo,
      reducedAmount: baseRefund,
      cancellationCharges: totalCancel
    };
    
    const newAuditLog = Array.isArray(bill.split_audit_log) ? [...bill.split_audit_log, auditLogEntry] : [auditLogEntry];
    bill.split_audit_log = newAuditLog;

    bill.cancellation_data = Array.isArray(bill.cancellation_data) ? [...bill.cancellation_data, cancelData] : [cancelData];
    bill.bl_railway_cancellation_charge = (parseFloat(bill.bl_railway_cancellation_charge) || 0) + railChg;
    bill.bl_agent_cancellation_charge = (parseFloat(bill.bl_agent_cancellation_charge) || 0) + agentChg;
    bill.total_cancel_charges = (parseFloat(bill.total_cancel_charges) || 0) + totalCancel;
    bill.refund_amount = (parseFloat(bill.refund_amount) || 0) + refundAmount;
    
    bill.bl_passenger_ids = remainingPassengers;
    bill.bl_total_amount = originalTotal - baseRefund; // Reduce original bill by cancelled portion

    if (!isPartial || remainingPassengers.length === 0) {
      bill.status = 'CANCELLED';
      bill.bl_status = 'CANCELLED';
      bill.is_cancelled = 1;
      bill.is_deleted = 1; 
      bill.bl_total_amount = 0; // If all cancel, primary bill drops to 0
    }

    await bill.save({ transaction });

    // 2. Generate a separate cancellation charge bill (Bill-B)
    const cancelledBill = await BillTVL.create({
      bl_entry_no: baseBillNo,
      bl_bill_no: baseBillNo,
      bl_sub_bill_no: subBillNo,
      bl_booking_id: bill.bl_booking_id,
      bl_billing_date: new Date(),
      bl_journey_date: bill.bl_journey_date,
      bl_customer_name: bill.bl_customer_name,
      bl_customer_phone: bill.bl_customer_phone,
      bl_station_boy: bill.bl_station_boy,
      station_boy_id: bill.station_boy_id,
      bl_from_station: bill.bl_from_station,
      bl_to_station: bill.bl_to_station,
      bl_train_no: bill.bl_train_no,
      bl_class: bill.bl_class,
      bl_pnr: bill.bl_pnr,
      bl_railway_fare: 0, 
      bl_total_amount: totalCancel, // Exclusively contains cancellation charges
      bl_bill_type: 'CANCELLED_SPLIT',
      bl_parent_bill_id: bill.bl_id,
      bl_passenger_ids: cancelledPassengers,
      status: 'CANCELLED',
      bl_status: 'CANCELLED',
      is_cancelled: 1,
      bl_created_by: req.user?.us_usid || 1
    }, { transaction });

    // 3. Deactivate cancelled passengers
    if (cancelledPassengers.length > 0) {
      await sequelizeTVL.query(
        `UPDATE psXpassenger SET ps_active = 0 WHERE ps_psid IN (:passengerIds)`,
        {
          replacements: { passengerIds: cancelledPassengers },
          transaction
        }
      );
    }
    
    // 4. Update Ledger
    try {
      const customerUsid = bill.bl_usid || bill.bl_customer_id || bill.bl_booking_id; // Need to ensure customerId is correct, usually we lookup booking
      const booking = await BookingTVL.findByPk(bill.bl_booking_id, { transaction });
      const customerId = booking ? booking.bk_usid : customerUsid;
      
      if (customerId) {
        // A. Credit the customer for the original ticket cost (baseRefund)
        await CustomerLedgerService.writeLedgerEntry({
          customerId: customerId,
          entryType: 'ADJUSTMENT',
          referenceType: 'BILL_PARTIAL_CANCEL',
          referenceId: bill.bl_id,
          creditAmount: baseRefund,
          debitAmount: 0,
          remarks: `Partial refund adjustment for cancelled tickets on Bill ${bill.bl_bill_no}`,
          createdBy: req.user?.us_usid || 1
        }, transaction);

        // B. Debit the customer for the new cancellation charges bill
        if (totalCancel > 0) {
          await CustomerLedgerService.writeLedgerEntry({
            customerId: customerId,
            entryType: 'BILL',
            referenceType: 'CANCEL_CHARGES_BILL',
            referenceId: cancelledBill.bl_id,
            creditAmount: 0,
            debitAmount: totalCancel,
            remarks: `Cancellation charges for sub-bill ${subBillNo}`,
            createdBy: req.user?.us_usid || 1
          }, transaction);
        }
      }
    } catch (ledgerErr) {
      console.error('Ledger error on cancel split:', ledgerErr);
    }

    if (typeof Audit !== 'undefined' && Audit.logAction) {
      Audit.logAction({
        module: Audit.MODULES?.BILLING || 'BILLING',
        recordId: bill.bl_id,
        action: Audit.ACTIONS?.UPDATE || 'UPDATE',
        req,
        reason: 'Bill cancelled'
      });
    }

    await transaction.commit();
    res.json({ success: true, message: 'Bill cancelled successfully', refundAmount });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('CRITICAL: Error cancelling bill:', error);
    
    // If it's a known validation error, return 400 instead of 500
    const knownErrors = [
      'At least one passenger must be selected',
      'Railway and Agent cancellation charges are required',
      'Bill not found',
      'Bill is already cancelled',
      'Cancellation charges cannot exceed'
    ];
    
    const isKnownError = knownErrors.some(msg => error.message.includes(msg));
    const statusCode = isKnownError ? 400 : 500;
    
    res.status(statusCode).json({ success: false, error: error.message, stack: error.stack });
  }
};

const { generateMergedBillsPDF } = require('../utils/mergedBillPdfGenerator');

/**
 * POST /api/billing/merge-pdf
 * Body: { billIds: [1, 2, 3] }
 * Generates a combined PDF for selected bills WITHOUT modifying any DB records.
 */
const mergeBillsPDF = async (req, res) => {
  try {
    const { billIds } = req.body;

    if (!billIds || !Array.isArray(billIds) || billIds.length < 1) {
      return res.status(400).json({ success: false, error: 'Provide at least 1 bill ID in billIds array' });
    }
    if (billIds.length > 50) {
      return res.status(400).json({ success: false, error: 'Cannot merge more than 50 bills at once' });
    }

    // Fetch all bills (no DB modification — read-only)
    const bills = await BillTVL.findAll({ where: { bl_id: billIds } });

    if (bills.length === 0) {
      return res.status(404).json({ success: false, error: 'No bills found for the provided IDs' });
    }

    // Sort bills in the order requested
    const billMap = new Map(bills.map(b => [b.bl_id, b]));
    const orderedBills = billIds
      .map(id => billMap.get(id) || billMap.get(parseInt(id)))
      .filter(Boolean);

    // Build payload for each bill (parallel fetch)
    const payloads = await Promise.all(
      orderedBills.map(async (bill) => {
        const booking = bill.bl_booking_id ? await BookingTVL.findByPk(bill.bl_booking_id) : null;
        return getBillPrintPayload(bill, booking, req.user);
      })
    );

    // Generate the merged PDF (pure generation, no DB writes)
    const pdfBuffer = await generateMergedBillsPDF(payloads);

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = 'Merged_Bills_' + timestamp + '_' + billIds.length + 'bills.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Merge-Bill-Count', billIds.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('mergeBillsPDF error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate merged PDF' });
  }
};

module.exports = {
  fetchBookingForBilling,
  createBill,
  splitBill: splitBillV2,
  mergeBill: mergeBillV2,
  getCustomerBills,
  getAllBills,
  getBillById,
  getPrintableBill,
  downloadBillPDF,
  updateBill,
  finalizeBill,
  deleteBill: deleteBillV2,
  cancelBill: cancelBillV2,
  searchBills,
  getCustomerLedger,
  getCustomerBalance,
  getBillingStats,
  getCancellationHistory,
  mergeBillsPDF
};
