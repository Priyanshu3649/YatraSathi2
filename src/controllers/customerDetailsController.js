const {
  CustomerTVL: Customer, UserTVL: User, BookingTVL: Booking,
  BillTVL: Bill, PaymentTVL: Payment, PassengerTVL: Passenger,
  StationTVL: Station, CustomerLedger, PaymentAllocation, Receipt
} = require('../models');
const { Op, QueryTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');
const CustomerLedgerService = require('../services/CustomerLedgerService');
const queryHelper = require('../utils/queryHelper');

const getMatchingCustomerIds = async (customerId) => {
  const [customerRes] = await sequelizeTVL.query(`
    SELECT 
      c.cu_usid AS id,
      CONCAT(u.us_fname, ' ', COALESCE(u.us_lname, '')) AS name,
      u.us_phone AS phone
    FROM cuXcustomer c
    JOIN usXuser u ON c.cu_usid = u.us_usid
    WHERE c.cu_usid = :customerId OR c.cu_custno = :customerId OR c.cu_cusid = :customerId
    LIMIT 1
  `, {
    replacements: { customerId },
    type: QueryTypes.SELECT
  });

  if (!customerRes) {
    return [customerId];
  }

  const matchingCustomers = await sequelizeTVL.query(`
    SELECT c.cu_usid AS id
    FROM cuXcustomer c
    JOIN usXuser u ON c.cu_usid = u.us_usid
    WHERE (CONCAT(u.us_fname, ' ', COALESCE(u.us_lname, '')) = :name AND u.us_phone = :phone)
       OR c.cu_usid = :customerId
  `, {
    replacements: { name: customerRes.name, phone: customerRes.phone, customerId: customerRes.id },
    type: QueryTypes.SELECT
  });

  return matchingCustomers.map(c => c.id);
};

const getNumericId = (id) => {
  if (typeof id === 'number') return id;
  if (!id) return null;
  const numStr = String(id).replace(/\D/g, '');
  return numStr ? parseInt(numStr, 10) : null;
};

const getMatchingIdsAndNumerics = async (customerId) => {
  const customerIds = await getMatchingCustomerIds(customerId);
  const numerics = customerIds.map(id => getNumericId(id)).filter(v => v !== null);
  return {
    customerIds,
    customerIdsOrNumerics: [...customerIds, ...numerics]
  };
};


/**
 * GET /api/security/customers/:id/details
 * Comprehensive customer summary for admin view
 */
const getCustomerDetails = async (req, res) => {
  try {
    const customerId = req.params.id;

    // ── 1. Customer Profile ──────────────────────────────────────────────
    let customer = null;
    try {
      const cust = await Customer.findOne({
        attributes: [
          'cu_cusid', 'cu_usid', 'cu_custno', 'cu_custtype', 'cu_creditlimit',
          'cu_creditdays', 'cu_discount', 'cu_active', 'cu_panno', 'cu_gstno',
          'cu_compid'
        ],
        include: [{
          model: User, as: 'user',
          attributes: ['us_fname', 'us_lname', 'us_email', 'us_phone', 'us_aadhaar',
            'us_addr1', 'us_city', 'us_state', 'us_pin', 'us_roid', 'us_active', 'us_edtm']
        }],
        where: { [Op.or]: [{ cu_cusid: customerId }, { cu_usid: customerId }, { cu_custno: customerId }] }
      });
      if (cust) {
        customer = {
          id: cust.cu_usid,
          customerId: cust.cu_custno,
          name: cust.user ? `${cust.user.us_fname || ''} ${cust.user.us_lname || ''}`.trim() : '',
          email: cust.user?.us_email || '',
          phone: cust.user?.us_phone || '',
          customerType: cust.cu_custtype || 'Individual',
          company: cust.cu_compid || '',
          gstNumber: cust.cu_gstno || '',
          panNumber: cust.cu_panno || '',
          creditLimit: parseFloat(cust.cu_creditlimit) || 0,
          creditDays: cust.cu_creditdays || 0,
          discount: cust.cu_discount || 0,
          active: cust.cu_active,
          address: cust.user?.us_addr1 || '',
          city: cust.user?.us_city || '',
          state: cust.user?.us_state || '',
          country: 'India',
          pin: cust.user?.us_pin || '',
          aadhaar: cust.user?.us_aadhaar || '',
          createdAt: cust.user?.us_edtm || null
        };
      }
    } catch (err) {
      console.error('CustomerDetails: profile failed:', err.message);
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const { customerIds, customerIdsOrNumerics } = await getMatchingIdsAndNumerics(customer.id);

    // ── 2. Booking Statistics ────────────────────────────────────────────
    let bookingStats = { total: 0, confirmed: 0, pending: 0, cancelled: 0, completed: 0 };
    try {
      const statusCounts = await sequelizeTVL.query(`
        SELECT bk_status, COUNT(*) AS cnt
        FROM bkXbooking
        WHERE bk_usid IN (:customerIds)
        GROUP BY bk_status
      `, { replacements: { customerIds }, type: QueryTypes.SELECT });

      for (const row of (statusCounts || [])) {
        bookingStats.total += parseInt(row.cnt) || 0;
        const s = row.bk_status;
        if (s === 'CONFIRMED' || s === 'CNF') bookingStats.confirmed += parseInt(row.cnt) || 0;
        else if (s === 'PENDING' || s === 'PND' || s === 'DRF') bookingStats.pending += parseInt(row.cnt) || 0;
        else if (s === 'CANCELLED' || s === 'CAN') bookingStats.cancelled += parseInt(row.cnt) || 0;
        else if (s === 'COMPLETED' || s === 'CMP') bookingStats.completed += parseInt(row.cnt) || 0;
      }
    } catch (err) {
      console.error('CustomerDetails: booking stats failed:', err.message);
    }

    // ── 3. Billing Statistics ────────────────────────────────────────────
    let billingStats = { total: 0, totalAmount: 0, paid: 0, partiallyPaid: 0, unpaid: 0, cancelled: 0 };
    try {
      const billData = await sequelizeTVL.query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(bl.bl_total_amount), 0) AS totalAmount,
          SUM(CASE WHEN bl.payment_status = 'FULLY_PAID' THEN 1 ELSE 0 END) AS paid,
          SUM(CASE WHEN bl.payment_status = 'PARTIALLY_PAID' THEN 1 ELSE 0 END) AS partiallyPaid,
          SUM(CASE WHEN bl.payment_status = 'UNPAID' OR bl.payment_status IS NULL THEN 1 ELSE 0 END) AS unpaid,
          SUM(CASE WHEN bl.bl_status IN ('CANCELLED', 'CAN') THEN 1 ELSE 0 END) AS cancelled
        FROM blXbilling bl
        JOIN bkXbooking bk ON bl.bl_booking_id = bk.bk_bkid
        WHERE bk.bk_usid IN (:customerIds)
      `, { replacements: { customerIds }, type: QueryTypes.SELECT });

      if (billData && billData.length > 0) {
        const d = billData[0];
        billingStats = {
          total: parseInt(d.total) || 0,
          totalAmount: parseFloat(d.totalAmount) || 0,
          paid: parseInt(d.paid) || 0,
          partiallyPaid: parseInt(d.partiallyPaid) || 0,
          unpaid: parseInt(d.unpaid) || 0,
          cancelled: parseInt(d.cancelled) || 0
        };
      }
    } catch (err) {
      console.error('CustomerDetails: billing stats failed:', err.message);
    }

    // ── 4. Payment Statistics ────────────────────────────────────────────
    let paymentStats = {
      totalReceived: 0, count: 0, averagePayment: 0, largestPayment: 0,
      lastPaymentDate: null, byMethod: [], statusSummary: { fullyAllocated: 0, partiallyAllocated: 0, unallocatedAdvance: 0, reversed: 0 }
    };
    try {
      const payAgg = await sequelizeTVL.query(`
        SELECT
          COALESCE(SUM(pt.pt_amount), 0) AS totalReceived,
          COUNT(*) AS cnt,
          COALESCE(AVG(pt.pt_amount), 0) AS averagePayment,
          COALESCE(MAX(pt.pt_amount), 0) AS largestPayment,
          MAX(pt.pt_paydt) AS lastPaymentDate
        FROM ptXpayment pt
        LEFT JOIN bkXbooking bk ON pt.pt_bkid = bk.bk_bkid
        WHERE (pt.pt_custid IN (:customerIdsOrNumerics) OR bk.bk_usid IN (:customerIds))
          AND pt.pt_status != 'REVERSED'
      `, { replacements: { customerIds, customerIdsOrNumerics }, type: QueryTypes.SELECT });

      if (payAgg && payAgg.length > 0) {
        paymentStats.totalReceived = parseFloat(payAgg[0].totalReceived) || 0;
        paymentStats.count = parseInt(payAgg[0].cnt) || 0;
        paymentStats.averagePayment = parseFloat(payAgg[0].averagePayment) || 0;
        paymentStats.largestPayment = parseFloat(payAgg[0].largestPayment) || 0;
        paymentStats.lastPaymentDate = payAgg[0].lastPaymentDate;
      }

      // Payment method breakdown
      const byMethod = await sequelizeTVL.query(`
        SELECT COALESCE(pt.pt_mode, 'Unknown') AS method, COUNT(*) AS cnt, COALESCE(SUM(pt.pt_amount), 0) AS amount
        FROM ptXpayment pt
        LEFT JOIN bkXbooking bk ON pt.pt_bkid = bk.bk_bkid
        WHERE (pt.pt_custid IN (:customerIdsOrNumerics) OR bk.bk_usid IN (:customerIds))
          AND pt.pt_status != 'REVERSED'
        GROUP BY pt.pt_mode
      `, { replacements: { customerIds, customerIdsOrNumerics }, type: QueryTypes.SELECT });
      paymentStats.byMethod = byMethod || [];

      // Payment status summary
      const statusSummary = await sequelizeTVL.query(`
        SELECT
          SUM(CASE WHEN pt.pt_allocatedamt >= pt.pt_amount AND pt.pt_amount > 0 THEN 1 ELSE 0 END) AS fullyAllocated,
          SUM(CASE WHEN pt.pt_allocatedamt > 0 AND pt.pt_allocatedamt < pt.pt_amount THEN 1 ELSE 0 END) AS partiallyAllocated,
          SUM(CASE WHEN COALESCE(pt.pt_unallocamt, 0) > 0 AND COALESCE(pt.pt_allocatedamt, 0) = 0 THEN 1 ELSE 0 END) AS unallocatedAdvance,
          SUM(CASE WHEN pt.pt_status = 'REVERSED' THEN 1 ELSE 0 END) AS reversed
        FROM ptXpayment pt
        LEFT JOIN bkXbooking bk ON pt.pt_bkid = bk.bk_bkid
        WHERE pt.pt_custid IN (:customerIdsOrNumerics) OR bk.bk_usid IN (:customerIds)
      `, { replacements: { customerIds, customerIdsOrNumerics }, type: QueryTypes.SELECT });
      if (statusSummary && statusSummary.length > 0) {
        paymentStats.statusSummary = {
          fullyAllocated: parseInt(statusSummary[0].fullyAllocated) || 0,
          partiallyAllocated: parseInt(statusSummary[0].partiallyAllocated) || 0,
          unallocatedAdvance: parseInt(statusSummary[0].unallocatedAdvance) || 0,
          reversed: parseInt(statusSummary[0].reversed) || 0
        };
      }
    } catch (err) {
      console.error('CustomerDetails: payment stats failed:', err.message);
    }

    // ── 5. Financial Summary ─────────────────────────────────────────────
    let financialSummary = { totalBilled: 0, totalReceived: 0, outstandingAmount: 0, advanceAmount: 0, lastBillDate: null, lastPaymentDate: null };
    try {
      financialSummary = await CustomerLedgerService.getCustomerFinancialSummary(customerId);
    } catch (err) {
      console.error('CustomerDetails: financial summary failed:', err.message);
    }

    // ── 6. Recent Bookings ───────────────────────────────────────────────
    let recentBookings = [];
    try {
      const bookings = await Booking.findAll({
        where: { bk_usid: customerId },
        order: [['edtm', 'DESC']],
        limit: 10,
        raw: true
      });
      for (const bk of bookings) {
        const passengerCount = await Passenger.count({ where: { ps_bkid: bk.bk_bkid, ps_active: 1 } });
        // Check if this booking has an associated bill
        const billCount = await Bill.count({ where: { bl_booking_id: bk.bk_bkid } });
        let fromName = bk.bk_fromst || '', toName = bk.bk_tost || '';
        try {
          const [fromSt] = await sequelizeTVL.query(
            `SELECT st_stname FROM stXstation WHERE st_stid = :id LIMIT 1`,
            { replacements: { id: bk.bk_fromst }, type: QueryTypes.SELECT }
          );
          const [toSt] = await sequelizeTVL.query(
            `SELECT st_stname FROM stXstation WHERE st_stid = :id LIMIT 1`,
            { replacements: { id: bk.bk_tost }, type: QueryTypes.SELECT }
          );
          if (fromSt) fromName = fromSt.st_stname || fromName;
          if (toSt) toName = toSt.st_stname || toName;
        } catch (_) { /* keep codes */ }
        recentBookings.push({
          id: bk.bk_bkid,
          bookingNo: bk.bk_bkno,
          date: bk.bk_trvldt || bk.edtm,
          from: fromName,
          to: toName,
          passengers: passengerCount,
          status: bk.bk_status,
          hasBilling: billCount > 0
        });
      }
    } catch (err) {
      console.error('CustomerDetails: recent bookings failed:', err.message);
    }

    // ── 7. Recent Bills ──────────────────────────────────────────────────
    let recentBills = [];
    try {
      const bills = await sequelizeTVL.query(`
        SELECT bl.bl_id, bl.bl_bill_no, bl.bl_total_amount, bl.bl_billing_date, bl.bl_status, bl.payment_status,
          COALESCE(SUM(pa.allocated_amount), 0) AS allocated,
          bl.bl_booking_id
        FROM blXbilling bl
        JOIN bkXbooking bk ON bl.bl_booking_id = bk.bk_bkid
        LEFT JOIN payment_allocations pa ON bl.bl_id = pa.bill_id
        WHERE bk.bk_usid IN (:customerIds)
        GROUP BY bl.bl_id, bl.bl_bill_no, bl.bl_total_amount, bl.bl_billing_date, bl.bl_status, bl.payment_status, bl.bl_booking_id
        ORDER BY bl.bl_billing_date DESC, bl.bl_id DESC
        LIMIT 10
      `, { replacements: { customerIds }, type: QueryTypes.SELECT });
      recentBills = (bills || []).map(b => ({
        id: b.bl_id,
        billNo: b.bl_bill_no,
        amount: parseFloat(b.bl_total_amount) || 0,
        date: b.bl_billing_date,
        status: b.bl_status,
        paymentStatus: b.payment_status || (parseFloat(b.allocated) >= parseFloat(b.bl_total_amount) ? 'FULLY_PAID' : parseFloat(b.allocated) > 0 ? 'PARTIALLY_PAID' : 'UNPAID'),
        allocated: parseFloat(b.allocated) || 0,
        balance: Math.max(0, parseFloat(b.bl_total_amount) - (parseFloat(b.allocated) || 0)),
        bookingId: b.bl_booking_id
      }));
    } catch (err) {
      console.error('CustomerDetails: recent bills failed:', err.message);
    }

    // ── 8. Recent Payments ───────────────────────────────────────────────
    let recentPayments = [];
    try {
      const payments = await sequelizeTVL.query(`
        SELECT pt.pt_ptid, pt.pt_amount, pt.pt_paydt, pt.pt_mode, pt.pt_status, pt.pt_allocatedamt, pt.pt_unallocamt, pt.eby, pt.edtm
        FROM ptXpayment pt
        LEFT JOIN bkXbooking bk ON pt.pt_bkid = bk.bk_bkid
        WHERE pt.pt_custid IN (:customerIdsOrNumerics) OR bk.bk_usid IN (:customerIds)
        ORDER BY pt.pt_paydt DESC, pt.pt_ptid DESC
        LIMIT 10
      `, { replacements: { customerIds, customerIdsOrNumerics }, type: QueryTypes.SELECT });
      recentPayments = (payments || []).map(p => ({
        id: p.pt_ptid,
        amount: parseFloat(p.pt_amount) || 0,
        date: p.pt_paydt,
        mode: p.pt_mode || 'Unknown',
        status: p.pt_status,
        allocated: parseFloat(p.pt_allocatedamt) || 0,
        unallocated: parseFloat(p.pt_unallocamt) || 0,
        createdBy: p.eby
      }));
    } catch (err) {
      console.error('CustomerDetails: recent payments failed:', err.message);
    }

    // ── 9. Recent Receipts ──────────────────────────────────────────────
    let recentReceipts = [];
    try {
      const customerPhone = customer.phone || '';
      const receiptWhere = { rc_status: 'Active' };
      if (customerPhone) {
        receiptWhere[Op.or] = [
          { rc_customer_phone: customerPhone },
          { rc_customer_name: customer.name || '' }
        ];
      } else {
        receiptWhere.rc_customer_name = customer.name || '';
      }
      const receipts = await Receipt.findAll({
        where: receiptWhere,
        order: [['rc_date', 'DESC'], ['rc_rcid', 'DESC']],
        limit: 10,
        raw: true
      });
      recentReceipts = receipts.map(r => ({
        id: r.rc_rcid,
        entryNo: r.rc_entry_no,
        date: r.rc_date,
        customerName: r.rc_customer_name,
        amount: parseFloat(r.rc_amount) || 0,
        paymentMode: r.rc_payment_mode || 'Cash',
        refNumber: r.rc_ref_number || '',
        narration: r.rc_narration || '',
        status: r.rc_status
      }));
    } catch (err) {
      console.error('CustomerDetails: recent receipts failed:', err.message);
    }

    res.json({
      success: true,
      data: {
        customer,
        bookingStats,
        billingStats,
        paymentStats,
        financialSummary,
        recentBookings,
        recentBills,
        recentPayments,
        recentReceipts
      }
    });
  } catch (error) {
    console.error('CustomerDetails: fatal error:', error);
    res.status(500).json({ success: false, message: 'Failed to load customer details', error: error.message });
  }
};

/**
 * GET /api/security/customers/:id/bookings
 * Paginated booking history
 */
const getCustomerBookings = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
    const { fromDate, toDate, status } = req.query;

    const customerIds = await getMatchingCustomerIds(customerId);
    const where = { bk_usid: { [Op.in]: customerIds } };
    if (status) where.bk_status = status;
    if (fromDate || toDate) {
      where.edtm = {};
      if (fromDate) where.edtm[Op.gte] = new Date(fromDate);
      if (toDate) where.edtm[Op.lte] = new Date(toDate);
    }

    const { count, rows } = await Booking.findAndCountAll({
      where,
      order: [['edtm', 'DESC']],
      limit,
      offset
    });

    const bookings = [];
    for (const bk of rows) {
      const passengerCount = await Passenger.count({ where: { ps_bkid: bk.bk_bkid, ps_active: 1 } });
      const billCount = await Bill.count({ where: { bl_booking_id: bk.bk_bkid } });
      let fromName = bk.bk_fromst || '', toName = bk.bk_tost || '';
      try {
        const [fromSt] = await sequelizeTVL.query(
          `SELECT st_stname FROM stXstation WHERE st_stid = :id LIMIT 1`,
          { replacements: { id: bk.bk_fromst }, type: QueryTypes.SELECT }
        );
        const [toSt] = await sequelizeTVL.query(
          `SELECT st_stname FROM stXstation WHERE st_stid = :id LIMIT 1`,
          { replacements: { id: bk.bk_tost }, type: QueryTypes.SELECT }
        );
        if (fromSt) fromName = fromSt.st_stname || fromName;
        if (toSt) toName = toSt.st_stname || toName;
      } catch (_) { /* keep codes */ }
      bookings.push({
        id: bk.bk_bkid,
        bookingNo: bk.bk_bkno,
        date: bk.bk_trvldt || bk.edtm,
        from: fromName,
        to: toName,
        passengers: passengerCount,
        status: bk.bk_status,
        hasBilling: billCount > 0,
        createdAt: bk.edtm
      });
    }

    res.json({
      success: true,
      data: bookings,
      pagination: { total: count, page, pages: Math.ceil(count / limit), limit }
    });
  } catch (error) {
    console.error('CustomerBookings: error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/security/customers/:id/bills
 * Paginated bill history
 */
const getCustomerBills = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
    const customerIds = await getMatchingCustomerIds(customerId);

    const bills = await sequelizeTVL.query(`
      SELECT bl.bl_id, bl.bl_bill_no, bl.bl_total_amount, bl.bl_billing_date, bl.bl_status, bl.payment_status,
        COALESCE(SUM(pa.allocated_amount), 0) AS allocated,
        bl.bl_booking_id
      FROM blXbilling bl
      JOIN bkXbooking bk ON bl.bl_booking_id = bk.bk_bkid
      LEFT JOIN payment_allocations pa ON bl.bl_id = pa.bill_id
      WHERE bk.bk_usid IN (:customerIds)
      GROUP BY bl.bl_id, bl.bl_bill_no, bl.bl_total_amount, bl.bl_billing_date, bl.bl_status, bl.payment_status, bl.bl_booking_id
      ORDER BY bl.bl_billing_date DESC, bl.bl_id DESC
      LIMIT :limit OFFSET :offset
    `, { replacements: { customerIds, limit, offset }, type: QueryTypes.SELECT });

    const countRes = await sequelizeTVL.query(`
      SELECT COUNT(*) AS total
      FROM blXbilling bl
      JOIN bkXbooking bk ON bl.bl_booking_id = bk.bk_bkid
      WHERE bk.bk_usid IN (:customerIds)
    `, { replacements: { customerIds }, type: QueryTypes.SELECT });

    const total = parseInt(countRes?.[0]?.total) || 0;
    const data = (bills || []).map(b => ({
      id: b.bl_id,
      billNo: b.bl_bill_no,
      amount: parseFloat(b.bl_total_amount) || 0,
      date: b.bl_billing_date,
      status: b.bl_status,
      paymentStatus: b.payment_status || (parseFloat(b.allocated) >= parseFloat(b.bl_total_amount) ? 'FULLY_PAID' : parseFloat(b.allocated) > 0 ? 'PARTIALLY_PAID' : 'UNPAID'),
      allocated: parseFloat(b.allocated) || 0,
      balance: Math.max(0, parseFloat(b.bl_total_amount) - (parseFloat(b.allocated) || 0)),
      bookingId: b.bl_booking_id
    }));

    res.json({
      success: true,
      data,
      pagination: { total, page, pages: Math.ceil(total / limit), limit }
    });
  } catch (error) {
    console.error('CustomerBills: error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/security/customers/:id/payments
 * Paginated payment history
 */
const getCustomerPayments = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
    const { customerIds, customerIdsOrNumerics } = await getMatchingIdsAndNumerics(customerId);

    const countRes = await sequelizeTVL.query(`
      SELECT COUNT(*) AS total 
      FROM ptXpayment pt
      LEFT JOIN bkXbooking bk ON pt.pt_bkid = bk.bk_bkid
      WHERE pt.pt_custid IN (:customerIdsOrNumerics) OR bk.bk_usid IN (:customerIds)
    `, { replacements: { customerIds, customerIdsOrNumerics }, type: QueryTypes.SELECT });
    const total = parseInt(countRes?.[0]?.total) || 0;

    const payments = await sequelizeTVL.query(`
      SELECT pt.pt_ptid, pt.pt_amount, pt.pt_paydt, pt.pt_mode, pt.pt_status, pt.pt_allocatedamt, pt.pt_unallocamt, pt.eby, pt.edtm
      FROM ptXpayment pt
      LEFT JOIN bkXbooking bk ON pt.pt_bkid = bk.bk_bkid
      WHERE pt.pt_custid IN (:customerIdsOrNumerics) OR bk.bk_usid IN (:customerIds)
      ORDER BY pt.pt_paydt DESC, pt.pt_ptid DESC
      LIMIT :limit OFFSET :offset
    `, { replacements: { customerIds, customerIdsOrNumerics, limit, offset }, type: QueryTypes.SELECT });

    const data = (payments || []).map(p => ({
      id: p.pt_ptid,
      amount: parseFloat(p.pt_amount) || 0,
      date: p.pt_paydt,
      mode: p.pt_mode || 'Unknown',
      status: p.pt_status,
      allocated: parseFloat(p.pt_allocatedamt) || 0,
      unallocated: parseFloat(p.pt_unallocamt) || 0,
      createdBy: p.eby,
      createdAt: p.edtm
    }));

    res.json({
      success: true,
      data,
      pagination: { total, page, pages: Math.ceil(total / limit), limit }
    });
  } catch (error) {
    console.error('CustomerPayments: error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/security/customers/:id/ledger
 * Chronological ledger entries (Vintage Ledger format)
 */
const getCustomerLedger = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { fromDate, toDate } = req.query;
    const result = await CustomerLedgerService.getCustomerVintageLedger(customerId, fromDate, toDate);
    res.json(result);
  } catch (error) {
    console.error('CustomerLedger: error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/security/customers/:id/receipts
 * Paginated receipt history (matched by customer phone/name)
 */
const getCustomerReceipts = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);

    // Look up customer to get phone/name for matching
    const cust = await Customer.findOne({
      attributes: ['cu_cusid', 'cu_usid'],
      include: [{ model: User, as: 'user', attributes: ['us_fname', 'us_lname', 'us_phone'] }],
      where: { [Op.or]: [{ cu_cusid: customerId }, { cu_usid: customerId }, { cu_custno: customerId }] }
    });

    if (!cust) {
      return res.json({ success: true, data: [], pagination: { total: 0, page: 1, pages: 0, limit } });
    }

    const customerPhone = cust.user?.us_phone || '';
    const customerName = cust.user ? `${cust.user.us_fname || ''} ${cust.user.us_lname || ''}`.trim() : '';

    const where = { rc_status: 'Active' };
    if (customerPhone && customerName) {
      where.rc_customer_name = customerName;
      where.rc_customer_phone = customerPhone;
    } else {
      return res.json({ success: true, data: [], pagination: { total: 0, page: 1, pages: 0, limit } });
    }

    const { count, rows } = await Receipt.findAndCountAll({
      where,
      order: [['rc_date', 'DESC'], ['rc_rcid', 'DESC']],
      limit,
      offset
    });

    const data = rows.map(r => {
      const plain = r.get ? r.get({ plain: true }) : r;
      return {
        id: plain.rc_rcid,
        entryNo: plain.rc_entry_no,
        date: plain.rc_date,
        customerName: plain.rc_customer_name,
        phone: plain.rc_customer_phone,
        amount: parseFloat(plain.rc_amount) || 0,
        paymentMode: plain.rc_payment_mode || 'Cash',
        refNumber: plain.rc_ref_number || '',
        bankAccount: plain.rc_bank_account || '',
        narration: plain.rc_narration || '',
        status: plain.rc_status,
        createdBy: plain.rc_created_by,
        createdAt: plain.edtm || plain.createdAt
      };
    });

    res.json({
      success: true,
      data,
      pagination: { total: count, page, pages: Math.ceil(count / limit), limit }
    });
  } catch (error) {
    console.error('CustomerReceipts: error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomerDetails,
  getCustomerBookings,
  getCustomerBills,
  getCustomerPayments,
  getCustomerLedger,
  getCustomerReceipts
};
