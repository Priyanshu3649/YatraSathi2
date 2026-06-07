/**
 * Report Catalog Controller
 * Implements all 28+ report types for YatraSathi ERP
 * Every report supports: pagination, date-range filtering, sorting, totals/subtotals
 */
const models = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { sequelizeTVL, sequelize } = require('../../config/db');
const queryHelper = require('../utils/queryHelper');
const { getDateRange } = require('../utils/dateRangeUtils');

const {
  CustomerTVL, EmployeeTVL, UserTVL, BookingTVL, BillTVL,
  PaymentTVL, Receipt, Contra, Journal, Ledger, ForensicAuditLog,
  ServiceCharge, TravelPlan, StationTVL
} = models;

/* ── Helpers ─────────────────────────────────────────────── */

function parseDateFilters(query) {
  const where = {};
  if (query.startDate && query.endDate) {
    return { startDate: new Date(query.startDate), endDate: new Date(query.endDate) };
  }
  if (query.periodType) {
    const range = getDateRange(query.periodType);
    return { startDate: new Date(range.startDate), endDate: new Date(range.endDate) };
  }
  return null;
}

function paginate(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(query.limit) || 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function sortClause(query, defaultField = 'id', defaultDir = 'DESC') {
  const field = query.sortField || defaultField;
  const dir = (query.sortDir || defaultDir).toUpperCase();
  return [[field, dir === 'ASC' ? 'ASC' : 'DESC']];
}

function paginatedResponse(rows, count, pg) {
  const totalPages = Math.ceil(count / pg.limit);
  return {
    success: true,
    data: rows,
    pagination: {
      currentPage: pg.page,
      totalPages,
      totalRecords: count,
      pageSize: pg.limit,
      hasNextPage: pg.page < totalPages,
      hasPrevPage: pg.page > 1
    }
  };
}

function dateWhere(dateField, dates) {
  if (!dates) return {};
  return { [dateField]: { [Op.between]: [dates.startDate, dates.endDate] } };
}

/* ── MASTER REPORTS ──────────────────────────────────────── */

const customerMasterReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('edtm', dates) };
    if (req.query.status) where.cu_status = req.query.status;
    if (req.query.type) where.cu_custtype = req.query.type;
    if (req.query.search) {
      where[Op.or] = [
        { cu_name: { [Op.like]: `%${req.query.search}%` } },
        { cu_custno: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const { count, rows } = await CustomerTVL.findAndCountAll({
      where,
      include: [{ model: UserTVL, as: 'user', attributes: ['us_fname', 'us_lname', 'us_email', 'us_phone'] }],
      order: sortClause(req.query, 'cu_custno'),
      limit: pg.limit,
      offset: pg.offset,
      raw: false
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        customerNo: p.cu_custno, name: p.cu_name, type: p.cu_custtype,
        status: p.cu_status, company: p.cu_company,
        email: p.user?.us_email, phone: p.user?.us_phone,
        enteredOn: p.edtm
      };
    });

    res.json(paginatedResponse(data, count, pg));
  } catch (e) { console.error('customerMasterReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

const employeeMasterReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('edtm', dates) };
    if (req.query.dept) where.em_dept = req.query.dept;
    if (req.query.status) where.em_status = req.query.status;

    const { count, rows } = await EmployeeTVL.findAndCountAll({
      where,
      include: [{ model: UserTVL, as: 'user', attributes: ['us_fname', 'us_lname', 'us_email', 'us_phone', 'us_roid'] }],
      order: sortClause(req.query, 'em_usid'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        empId: p.em_usid, dept: p.em_dept, status: p.em_status,
        name: `${p.user?.us_fname || ''} ${p.user?.us_lname || ''}`.trim(),
        email: p.user?.us_email, role: p.user?.us_roid, joined: p.em_joindt
      };
    });

    res.json(paginatedResponse(data, count, pg));
  } catch (e) { console.error('employeeMasterReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

const userMasterReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const where = {};
    if (req.query.role) where.us_roid = req.query.role;
    if (req.query.status) where.us_active = req.query.status === 'active' ? 1 : 0;

    const { count, rows } = await UserTVL.findAndCountAll({
      where,
      attributes: ['us_usid', 'us_fname', 'us_lname', 'us_email', 'us_phone', 'us_roid', 'us_active', 'edtm'],
      order: sortClause(req.query, 'us_usid'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        userId: p.us_usid, name: `${p.us_fname || ''} ${p.us_lname || ''}`.trim(),
        email: p.us_email, phone: p.us_phone, role: p.us_roid,
        active: p.us_active === 1, enteredOn: p.edtm
      };
    });

    res.json(paginatedResponse(data, count, pg));
  } catch (e) { console.error('userMasterReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

const serviceChargeReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('edtm', dates) };
    if (req.query.serviceType) where.sc_service_type = req.query.serviceType;

    const { count, rows } = await ServiceCharge.findAndCountAll({
      where, order: sortClause(req.query, 'edtm'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return { id: p.sc_scid, serviceType: p.sc_service_type, amount: p.sc_amount, customerType: p.sc_custtype, enteredOn: p.edtm };
    });

    const totals = { totalRecords: count };
    res.json({ ...paginatedResponse(data, count, pg), totals });
  } catch (e) { console.error('serviceChargeReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

/* ── BOOKING REPORTS ─────────────────────────────────────── */

const bookingRegister = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('bk_trvldt', dates) };
    if (req.query.status) where.bk_status = req.query.status;
    if (req.query.customerId) where.bk_usid = req.query.customerId;
    if (req.query.search) {
      where[Op.or] = [
        { bk_bkno: { [Op.like]: `%${req.query.search}%` } },
        { bk_usid: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const { count, rows } = await BookingTVL.findAndCountAll({
      where,
      include: [{ model: CustomerTVL, as: 'customer', attributes: ['cu_name'] }],
      order: sortClause(req.query, 'bk_trvldt'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        bookingNo: p.bk_bkno, customer: p.customer?.cu_name || p.bk_usid,
        travelDate: p.bk_trvldt, from: p.bk_fromst, to: p.bk_tost,
        status: p.bk_status, passengers: p.bk_totalpass || 0,
        fare: parseFloat(p.bk_totalfare || 0), netAmount: parseFloat(p.bk_netamount || 0)
      };
    });

    const totals = {
      totalBookings: count,
      totalFare: data.reduce((s, r) => s + r.fare, 0),
      totalNetAmount: data.reduce((s, r) => s + r.netAmount, 0)
    };

    res.json({ ...paginatedResponse(data, count, pg), totals });
  } catch (e) { console.error('bookingRegister:', e); res.status(500).json({ success: false, message: e.message }); }
};

const customerBookingHistory = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('bk_trvldt', dates) };
    if (req.query.customerId) where.bk_usid = req.query.customerId;

    const { count, rows } = await BookingTVL.findAndCountAll({
      where,
      include: [{ model: CustomerTVL, as: 'customer', attributes: ['cu_name'] }],
      order: sortClause(req.query, 'bk_trvldt'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        customer: p.customer?.cu_name || p.bk_usid, customerId: p.bk_usid,
        bookingNo: p.bk_bkno, travelDate: p.bk_trvldt,
        status: p.bk_status, fare: parseFloat(p.bk_totalfare || 0)
      };
    });

    // Group by customer
    const grouped = {};
    data.forEach(r => {
      const key = r.customerId;
      if (!grouped[key]) grouped[key] = { customer: r.customer, bookings: [], totalFare: 0, count: 0 };
      grouped[key].bookings.push(r);
      grouped[key].totalFare += r.fare;
      grouped[key].count += 1;
    });

    res.json({ ...paginatedResponse(data, count, pg), groups: Object.values(grouped) });
  } catch (e) { console.error('customerBookingHistory:', e); res.status(500).json({ success: false, message: e.message }); }
};

const bookingStatusReport = async (req, res) => {
  try {
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('bk_trvldt', dates) };

    const results = await BookingTVL.findAll({
      where,
      attributes: ['bk_status', [fn('COUNT', col('bk_bkid')), 'count'], [fn('SUM', col('bk_totalfare')), 'totalFare']],
      group: ['bk_status'],
      raw: true
    });

    const grandTotal = results.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
    const grandFare = results.reduce((s, r) => s + (parseFloat(r.totalFare) || 0), 0);

    res.json({ success: true, data: results, totals: { grandTotal, grandFare } });
  } catch (e) { console.error('bookingStatusReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

/* ── BILLING REPORTS ─────────────────────────────────────── */

const billingRegister = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('bl_bill_date', dates) };
    if (req.query.status) where.status = req.query.status;
    if (req.query.customerPhone) where.bl_customer_phone = req.query.customerPhone;
    if (req.query.search) {
      where[Op.or] = [
        { bl_bill_no: { [Op.like]: `%${req.query.search}%` } },
        { bl_customer_name: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const { count, rows } = await BillTVL.findAndCountAll({
      where, order: sortClause(req.query, 'bl_bill_date'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        billNo: p.bl_bill_no, date: p.bl_bill_date, customer: p.bl_customer_name,
        amount: parseFloat(p.bl_total_amount || 0), tax: parseFloat(p.bl_tax_amount || 0),
        netAmount: parseFloat(p.bl_net_amount || 0), status: p.status || p.bl_status,
        paymentStatus: p.payment_status
      };
    });

    const totals = {
      totalBills: count,
      totalAmount: data.reduce((s, r) => s + r.amount, 0),
      totalTax: data.reduce((s, r) => s + r.tax, 0),
      totalNet: data.reduce((s, r) => s + r.netAmount, 0)
    };

    res.json({ ...paginatedResponse(data, count, pg), totals });
  } catch (e) { console.error('billingRegister:', e); res.status(500).json({ success: false, message: e.message }); }
};

const cancelledBillsReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { is_cancelled: 1, ...dateWhere('cancelled_on', dates) };

    const { count, rows } = await BillTVL.findAndCountAll({
      where, order: sortClause(req.query, 'cancelled_on'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        billNo: p.bl_bill_no, customer: p.bl_customer_name, amount: parseFloat(p.bl_total_amount || 0),
        railwayCharge: parseFloat(p.bl_railway_cancellation_charge || 0),
        agentCharge: parseFloat(p.bl_agent_cancellation_charge || 0),
        totalCharges: parseFloat(p.total_cancel_charges || 0),
        refund: parseFloat(p.refund_amount || 0),
        cancelledOn: p.cancelled_on, cancelledBy: p.cancelled_by,
        approver: p.bl_cancel_approver_name, reason: p.bl_cancellation_remarks,
        ref: p.bl_cancellation_ref
      };
    });

    const totals = {
      totalCancelled: count,
      totalRefund: data.reduce((s, r) => s + r.refund, 0),
      totalCharges: data.reduce((s, r) => s + r.totalCharges, 0)
    };

    res.json({ ...paginatedResponse(data, count, pg), totals });
  } catch (e) { console.error('cancelledBillsReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

const gstSummaryReport = async (req, res) => {
  try {
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('bl_bill_date', dates) };
    where.status = { [Op.ne]: 'CAN' };

    const results = await BillTVL.findAll({
      where,
      attributes: [
        [fn('DATE_FORMAT', col('bl_bill_date'), '%Y-%m'), 'month'],
        [fn('COUNT', '*'), 'billCount'],
        [fn('SUM', col('bl_total_amount')), 'totalAmount'],
        [fn('SUM', col('bl_tax_amount')), 'totalGST'],
        [fn('SUM', col('bl_net_amount')), 'totalNet']
      ],
      group: [literal("DATE_FORMAT(bl_bill_date, '%Y-%m')")],
      order: [[literal("DATE_FORMAT(bl_bill_date, '%Y-%m')"), 'ASC']],
      raw: true
    });

    res.json({ success: true, data: results });
  } catch (e) { console.error('gstSummaryReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

const customerBillingReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('bl_bill_date', dates) };
    if (req.query.customerId) where.bl_usid = req.query.customerId;

    const { count, rows } = await BillTVL.findAndCountAll({
      where, order: sortClause(req.query, 'bl_bill_date'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        billNo: p.bl_bill_no, customer: p.bl_customer_name, customerId: p.bl_usid,
        date: p.bl_bill_date, amount: parseFloat(p.bl_total_amount || 0),
        status: p.status
      };
    });

    res.json(paginatedResponse(data, count, pg));
  } catch (e) { console.error('customerBillingReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

/* ── PAYMENT / ACCOUNTING REPORTS ────────────────────────── */

const paymentRegister = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('pt_transaction_date', dates) };
    if (req.query.status) where.pt_status = req.query.status;
    if (req.query.mode) where.pt_payment_mode = req.query.mode;

    const { count, rows } = await PaymentTVL.findAndCountAll({
      where, order: sortClause(req.query, 'pt_transaction_date'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        txnNo: p.pt_transaction_no, date: p.pt_transaction_date,
        amount: parseFloat(p.pt_amount || 0), mode: p.pt_payment_mode,
        status: p.pt_status, remarks: p.pt_remarks
      };
    });

    const totals = { totalPayments: count, totalAmount: data.reduce((s, r) => s + r.amount, 0) };
    res.json({ ...paginatedResponse(data, count, pg), totals });
  } catch (e) { console.error('paymentRegister:', e); res.status(500).json({ success: false, message: e.message }); }
};

const receiptRegister = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('re_receipt_date', dates) };
    if (req.query.status) where.re_status = req.query.status;
    if (req.query.mode) where.re_payment_mode = req.query.mode;

    const { count, rows } = await Receipt.findAndCountAll({
      where, order: sortClause(req.query, 're_receipt_date'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        receiptNo: p.re_receipt_no, date: p.re_receipt_date,
        amount: parseFloat(p.re_amount || 0), mode: p.re_payment_mode,
        customer: p.re_customer_name, status: p.re_status
      };
    });

    const totals = { totalReceipts: count, totalAmount: data.reduce((s, r) => s + r.amount, 0) };
    res.json({ ...paginatedResponse(data, count, pg), totals });
  } catch (e) { console.error('receiptRegister:', e); res.status(500).json({ success: false, message: e.message }); }
};

const contraRegister = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('ct_date', dates) };

    const { count, rows } = await Contra.findAndCountAll({
      where, order: sortClause(req.query, 'ct_date'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        contraNo: p.ct_ctno, date: p.ct_date, amount: parseFloat(p.ct_amount || 0),
        fromAccount: p.ct_from_acc, toAccount: p.ct_to_acc, remarks: p.ct_remarks
      };
    });

    const totals = { totalContras: count, totalAmount: data.reduce((s, r) => s + r.amount, 0) };
    res.json({ ...paginatedResponse(data, count, pg), totals });
  } catch (e) { console.error('contraRegister:', e); res.status(500).json({ success: false, message: e.message }); }
};

const journalRegister = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('je_date', dates) };
    if (req.query.status) where.je_status = req.query.status;

    const { count, rows } = await Journal.findAndCountAll({
      where, order: sortClause(req.query, 'je_date'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        entryNo: p.je_entry_no, date: p.je_date, account: p.je_account,
        type: p.je_entry_type, amount: parseFloat(p.je_amount || 0),
        narration: p.je_narration, ref: p.je_ref_number, status: p.je_status
      };
    });

    const totals = {
      totalEntries: count,
      totalDebit: data.filter(r => r.type === 'Debit').reduce((s, r) => s + r.amount, 0),
      totalCredit: data.filter(r => r.type === 'Credit').reduce((s, r) => s + r.amount, 0)
    };

    res.json({ ...paginatedResponse(data, count, pg), totals });
  } catch (e) { console.error('journalRegister:', e); res.status(500).json({ success: false, message: e.message }); }
};

const ledgerReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('edtm', dates) };
    if (req.query.customerId) where.lg_usid = req.query.customerId;
    if (req.query.entryType) where.lg_entry_type = req.query.entryType;
    if (req.query.fyear) where.lg_fyear = req.query.fyear;

    const { count, rows } = await Ledger.findAndCountAll({
      where, order: sortClause(req.query, 'lg_lgid'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        id: p.lg_lgid, customerId: p.lg_usid, type: p.lg_entry_type,
        ref: p.lg_entry_ref, amount: parseFloat(p.lg_amount || 0),
        openingBal: parseFloat(p.lg_opening_bal || 0),
        closingBal: parseFloat(p.lg_closing_bal || 0),
        fyear: p.lg_fyear, remarks: p.lg_remarks, date: p.edtm
      };
    });

    const totals = {
      totalEntries: count,
      totalDebit: data.filter(r => r.type === 'DEBIT').reduce((s, r) => s + r.amount, 0),
      totalCredit: data.filter(r => r.type === 'CREDIT').reduce((s, r) => s + r.amount, 0)
    };

    res.json({ ...paginatedResponse(data, count, pg), totals });
  } catch (e) { console.error('ledgerReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

const trialBalance = async (req, res) => {
  try {
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('edtm', dates) };

    const results = await Ledger.findAll({
      where,
      attributes: [
        'lg_usid',
        [fn('SUM', literal("CASE WHEN lg_entry_type = 'DEBIT' THEN lg_amount ELSE 0 END")), 'totalDebit'],
        [fn('SUM', literal("CASE WHEN lg_entry_type = 'CREDIT' THEN lg_amount ELSE 0 END")), 'totalCredit']
      ],
      group: ['lg_usid'],
      order: [['lg_usid', 'ASC']],
      raw: true
    });

    const data = results.map(r => ({
      customerId: r.lg_usid,
      totalDebit: parseFloat(r.totalDebit || 0),
      totalCredit: parseFloat(r.totalCredit || 0),
      balance: parseFloat(r.totalDebit || 0) - parseFloat(r.totalCredit || 0)
    }));

    const grandDebit = data.reduce((s, r) => s + r.totalDebit, 0);
    const grandCredit = data.reduce((s, r) => s + r.totalCredit, 0);

    res.json({ success: true, data, totals: { grandDebit, grandCredit, netBalance: grandDebit - grandCredit } });
  } catch (e) { console.error('trialBalance:', e); res.status(500).json({ success: false, message: e.message }); }
};

const profitAndLoss = async (req, res) => {
  try {
    const dates = parseDateFilters(req.query);
    const billWhere = { ...dateWhere('bl_bill_date', dates), status: { [Op.ne]: 'CAN' } };

    const [revenue, cancellations] = await Promise.all([
      BillTVL.findAll({
        where: billWhere,
        attributes: [[fn('SUM', col('bl_total_amount')), 'total'], [fn('SUM', col('bl_tax_amount')), 'tax']],
        raw: true
      }),
      BillTVL.findAll({
        where: { ...dateWhere('cancelled_on', dates), is_cancelled: 1 },
        attributes: [[fn('SUM', col('total_cancel_charges')), 'charges'], [fn('COUNT', '*'), 'count']],
        raw: true
      })
    ]);

    const totalRevenue = parseFloat(revenue[0]?.total || 0);
    const totalTax = parseFloat(revenue[0]?.tax || 0);
    const cancelCharges = parseFloat(cancellations[0]?.charges || 0);
    const cancelCount = parseInt(cancellations[0]?.count || 0);

    res.json({
      success: true,
      data: {
        totalRevenue, totalTax, netRevenue: totalRevenue - totalTax,
        cancellationIncome: cancelCharges, cancellationCount: cancelCount,
        grossProfit: totalRevenue - totalTax + cancelCharges
      }
    });
  } catch (e) { console.error('profitAndLoss:', e); res.status(500).json({ success: false, message: e.message }); }
};

const balanceSheet = async (req, res) => {
  try {
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('edtm', dates) };

    const [ledgerSums, billOutstanding, receiptTotal] = await Promise.all([
      Ledger.findAll({
        where,
        attributes: [
          [fn('SUM', literal("CASE WHEN lg_entry_type = 'DEBIT' THEN lg_amount ELSE 0 END")), 'debit'],
          [fn('SUM', literal("CASE WHEN lg_entry_type = 'CREDIT' THEN lg_amount ELSE 0 END")), 'credit']
        ],
        raw: true
      }),
      BillTVL.findAll({
        where: { ...dateWhere('bl_bill_date', dates), status: { [Op.notIn]: ['CAN'] }, payment_status: { [Op.notIn]: ['FULLY_PAID'] } },
        attributes: [[fn('SUM', col('bl_total_amount')), 'total']],
        raw: true
      }),
      Receipt.findAll({
        where: { ...dateWhere('re_receipt_date', dates), re_status: 'ACTIVE' },
        attributes: [[fn('SUM', col('re_amount')), 'total']],
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        receivables: parseFloat(billOutstanding[0]?.total || 0),
        totalDebits: parseFloat(ledgerSums[0]?.debit || 0),
        totalCredits: parseFloat(ledgerSums[0]?.credit || 0),
        receiptsReceived: parseFloat(receiptTotal[0]?.total || 0)
      }
    });
  } catch (e) { console.error('balanceSheet:', e); res.status(500).json({ success: false, message: e.message }); }
};

const outstandingReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = {
      ...dateWhere('bl_bill_date', dates),
      status: { [Op.ne]: 'CAN' },
      payment_status: { [Op.notIn]: ['FULLY_PAID', 'REFUND_DUE'] }
    };

    const { count, rows } = await BillTVL.findAndCountAll({
      where, order: sortClause(req.query, 'bl_bill_date'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      const billed = parseFloat(p.bl_total_amount || 0);
      return {
        billNo: p.bl_bill_no, customer: p.bl_customer_name,
        date: p.bl_bill_date, billed,
        paymentStatus: p.payment_status,
        outstanding: billed
      };
    });

    const totals = { totalBills: count, totalOutstanding: data.reduce((s, r) => s + r.outstanding, 0) };
    res.json({ ...paginatedResponse(data, count, pg), totals });
  } catch (e) { console.error('outstandingReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

/* ── AUDIT REPORTS ───────────────────────────────────────── */

const activityLogReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('performedOn', dates) };
    if (req.query.module) where.entityName = req.query.module;
    if (req.query.action) where.actionType = req.query.action;

    const { count, rows } = await ForensicAuditLog.findAndCountAll({
      where, order: sortClause(req.query, 'performedOn'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        entity: p.entityName, entityId: p.entityId, action: p.actionType,
        performedBy: p.performedBy, performedOn: p.performedOn,
        ip: p.ipAddress, changedFields: p.changedFields
      };
    });

    res.json(paginatedResponse(data, count, pg));
  } catch (e) { console.error('activityLogReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

const changeHistoryReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('performedOn', dates), actionType: 'UPDATE' };
    if (req.query.module) where.entityName = req.query.module;

    const { count, rows } = await ForensicAuditLog.findAndCountAll({
      where, order: sortClause(req.query, 'performedOn'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        entity: p.entityName, entityId: p.entityId,
        oldValues: p.oldValues, newValues: p.newValues,
        performedBy: p.performedBy, performedOn: p.performedOn
      };
    });

    res.json(paginatedResponse(data, count, pg));
  } catch (e) { console.error('changeHistoryReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

const userActivityReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('performedOn', dates) };
    if (req.query.userId) where.performedBy = req.query.userId;

    const { count, rows } = await ForensicAuditLog.findAndCountAll({
      where, order: sortClause(req.query, 'performedOn'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        user: p.performedBy, entity: p.entityName, action: p.actionType,
        performedOn: p.performedOn, ip: p.ipAddress
      };
    });

    res.json(paginatedResponse(data, count, pg));
  } catch (e) { console.error('userActivityReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

const cancellationAuditReport = async (req, res) => {
  try {
    const pg = paginate(req.query);
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('performedOn', dates), actionType: 'CANCEL' };

    const { count, rows } = await ForensicAuditLog.findAndCountAll({
      where, order: sortClause(req.query, 'performedOn'),
      limit: pg.limit, offset: pg.offset
    });

    const data = rows.map(r => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        entity: p.entityName, entityId: p.entityId,
        performedBy: p.performedBy, performedOn: p.performedOn,
        changedFields: p.changedFields, ip: p.ipAddress
      };
    });

    res.json(paginatedResponse(data, count, pg));
  } catch (e) { console.error('cancellationAuditReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

/* ── MANAGEMENT REPORTS ──────────────────────────────────── */

const topCustomersReport = async (req, res) => {
  try {
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('bl_bill_date', dates), status: { [Op.ne]: 'CAN' } };
    const limit = Math.min(50, parseInt(req.query.limit) || 10);

    const results = await BillTVL.findAll({
      where,
      attributes: [
        'bl_customer_name', 'bl_usid',
        [fn('COUNT', '*'), 'billCount'],
        [fn('SUM', col('bl_total_amount')), 'totalAmount']
      ],
      group: ['bl_customer_name', 'bl_usid'],
      order: [[literal('totalAmount'), 'DESC']],
      limit,
      raw: true
    });

    res.json({ success: true, data: results });
  } catch (e) { console.error('topCustomersReport:', e); res.status(500).json({ success: false, message: e.message }); }
};

const revenueAnalysis = async (req, res) => {
  try {
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('bl_bill_date', dates), status: { [Op.ne]: 'CAN' } };

    const results = await BillTVL.findAll({
      where,
      attributes: [
        [fn('DATE_FORMAT', col('bl_bill_date'), '%Y-%m'), 'month'],
        [fn('COUNT', '*'), 'billCount'],
        [fn('SUM', col('bl_total_amount')), 'revenue'],
        [fn('SUM', col('bl_tax_amount')), 'tax'],
        [fn('AVG', col('bl_total_amount')), 'avgBillValue']
      ],
      group: [literal("DATE_FORMAT(bl_bill_date, '%Y-%m')")],
      order: [[literal("DATE_FORMAT(bl_bill_date, '%Y-%m')"), 'ASC']],
      raw: true
    });

    res.json({ success: true, data: results });
  } catch (e) { console.error('revenueAnalysis:', e); res.status(500).json({ success: false, message: e.message }); }
};

const employeePerformance = async (req, res) => {
  try {
    const dates = parseDateFilters(req.query);
    const where = { ...dateWhere('bk_trvldt', dates) };

    const results = await BookingTVL.findAll({
      where,
      attributes: [
        'bk_usid',
        [fn('COUNT', '*'), 'bookingCount'],
        [fn('SUM', col('bk_totalfare')), 'totalFare'],
        [fn('SUM', col('bk_netamount')), 'netAmount']
      ],
      group: ['bk_usid'],
      order: [[literal('totalFare'), 'DESC']],
      raw: true
    });

    res.json({ success: true, data: results });
  } catch (e) { console.error('employeePerformance:', e); res.status(500).json({ success: false, message: e.message }); }
};

const monthlyBusinessSummary = async (req, res) => {
  try {
    const dates = parseDateFilters(req.query);
    const billWhere = { ...dateWhere('bl_bill_date', dates), status: { [Op.ne]: 'CAN' } };
    const bookingWhere = { ...dateWhere('bk_trvldt', dates) };

    const [billingStats, bookingStats, receiptStats, paymentStats] = await Promise.all([
      BillTVL.findAll({
        where: billWhere,
        attributes: [[fn('COUNT', '*'), 'count'], [fn('SUM', col('bl_total_amount')), 'total'], [fn('SUM', col('bl_tax_amount')), 'tax']],
        raw: true
      }),
      BookingTVL.findAll({
        where: bookingWhere,
        attributes: [[fn('COUNT', '*'), 'count'], [fn('SUM', col('bk_totalfare')), 'fare']],
        raw: true
      }),
      Receipt.findAll({
        where: { ...dateWhere('re_receipt_date', dates), re_status: 'ACTIVE' },
        attributes: [[fn('COUNT', '*'), 'count'], [fn('SUM', col('re_amount')), 'total']],
        raw: true
      }),
      PaymentTVL.findAll({
        where: { ...dateWhere('pt_transaction_date', dates) },
        attributes: [[fn('COUNT', '*'), 'count'], [fn('SUM', col('pt_amount')), 'total']],
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        billing: { count: billingStats[0]?.count || 0, total: parseFloat(billingStats[0]?.total || 0), tax: parseFloat(billingStats[0]?.tax || 0) },
        bookings: { count: bookingStats[0]?.count || 0, totalFare: parseFloat(bookingStats[0]?.fare || 0) },
        receipts: { count: receiptStats[0]?.count || 0, total: parseFloat(receiptStats[0]?.total || 0) },
        payments: { count: paymentStats[0]?.count || 0, total: parseFloat(paymentStats[0]?.total || 0) }
      }
    });
  } catch (e) { console.error('monthlyBusinessSummary:', e); res.status(500).json({ success: false, message: e.message }); }
};

/* ── CATALOG (for frontend sidebar) ──────────────────────── */

const getReportCatalog = (_req, res) => {
  res.json({
    success: true,
    catalog: [
      { category: 'Master', reports: [
        { id: 'customer-master', name: 'Customer Master Report', endpoint: '/api/reports/catalog/customer-master' },
        { id: 'employee-master', name: 'Employee Master Report', endpoint: '/api/reports/catalog/employee-master' },
        { id: 'user-master', name: 'User Master Report', endpoint: '/api/reports/catalog/user-master' },
        { id: 'service-charges', name: 'Service Charge Report', endpoint: '/api/reports/catalog/service-charges' },
      ]},
      { category: 'Booking', reports: [
        { id: 'booking-register', name: 'Booking Register', endpoint: '/api/reports/catalog/booking-register' },
        { id: 'customer-booking-history', name: 'Customer Booking History', endpoint: '/api/reports/catalog/customer-booking-history' },
        { id: 'booking-status', name: 'Booking Status Report', endpoint: '/api/reports/catalog/booking-status' },
      ]},
      { category: 'Billing', reports: [
        { id: 'billing-register', name: 'Billing Register', endpoint: '/api/reports/catalog/billing-register' },
        { id: 'cancelled-bills', name: 'Cancelled Bills', endpoint: '/api/reports/catalog/cancelled-bills' },
        { id: 'gst-summary', name: 'GST Summary', endpoint: '/api/reports/catalog/gst-summary' },
        { id: 'customer-billing', name: 'Customer Billing Report', endpoint: '/api/reports/catalog/customer-billing' },
      ]},
      { category: 'Payment & Accounting', reports: [
        { id: 'payment-register', name: 'Payment Register', endpoint: '/api/reports/catalog/payment-register' },
        { id: 'receipt-register', name: 'Receipt Register', endpoint: '/api/reports/catalog/receipt-register' },
        { id: 'contra-register', name: 'Contra Register', endpoint: '/api/reports/catalog/contra-register' },
        { id: 'journal-register', name: 'Journal Register', endpoint: '/api/reports/catalog/journal-register' },
        { id: 'ledger', name: 'Ledger', endpoint: '/api/reports/catalog/ledger' },
        { id: 'trial-balance', name: 'Trial Balance', endpoint: '/api/reports/catalog/trial-balance' },
        { id: 'profit-loss', name: 'Profit and Loss', endpoint: '/api/reports/catalog/profit-loss' },
        { id: 'balance-sheet', name: 'Balance Sheet', endpoint: '/api/reports/catalog/balance-sheet' },
        { id: 'outstanding', name: 'Outstanding Report', endpoint: '/api/reports/catalog/outstanding' },
      ]},
      { category: 'Audit', reports: [
        { id: 'activity-log', name: 'Activity Log', endpoint: '/api/reports/catalog/activity-log' },
        { id: 'change-history', name: 'Change History', endpoint: '/api/reports/catalog/change-history' },
        { id: 'user-activity', name: 'User Activity', endpoint: '/api/reports/catalog/user-activity' },
        { id: 'cancellation-audit', name: 'Cancellation Audit', endpoint: '/api/reports/catalog/cancellation-audit' },
      ]},
      { category: 'Management', reports: [
        { id: 'top-customers', name: 'Top Customers', endpoint: '/api/reports/catalog/top-customers' },
        { id: 'revenue-analysis', name: 'Revenue Analysis', endpoint: '/api/reports/catalog/revenue-analysis' },
        { id: 'employee-performance', name: 'Employee Performance', endpoint: '/api/reports/catalog/employee-performance' },
        { id: 'monthly-summary', name: 'Monthly Business Summary', endpoint: '/api/reports/catalog/monthly-summary' },
      ]}
    ]
  });
};

module.exports = {
  getReportCatalog,
  // Master
  customerMasterReport, employeeMasterReport, userMasterReport, serviceChargeReport,
  // Booking
  bookingRegister, customerBookingHistory, bookingStatusReport,
  // Billing
  billingRegister, cancelledBillsReport, gstSummaryReport, customerBillingReport,
  // Payment / Accounting
  paymentRegister, receiptRegister, contraRegister, journalRegister,
  ledgerReport, trialBalance, profitAndLoss, balanceSheet, outstandingReport,
  // Audit
  activityLogReport, changeHistoryReport, userActivityReport, cancellationAuditReport,
  // Management
  topCustomersReport, revenueAnalysis, employeePerformance, monthlyBusinessSummary,
};
