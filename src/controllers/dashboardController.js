const { UserTVL, EmployeeTVL, BookingTVL, PaymentTVL, Customer, CorporateCustomer, Account, User, Employee, BillTVL, ForensicAuditLog } = require('../models');
const { Op } = require('sequelize');

/**
 * Admin Dashboard - Show overall system metrics
 */
const getAdminDashboard = async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.us_roid !== 'ADM') {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'Access denied. Admin role required.' } 
      });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Helper to format currency
    const formatCurrency = (val) => {
      const num = parseFloat(val || 0);
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // ── Section 1: Booking & Payment Statistics ──────────────────────────
    let totalBookings = 0, totalRevenueRecord = 0, totalPendingRecord = 0;
    let bookingsToday = 0, bookingsYesterday = 0;
    let revenueTodayRecord = 0, revenueYesterdayRecord = 0;
    try {
      [
        totalBookings,
        totalRevenueRecord,
        totalPendingRecord,
        bookingsToday,
        bookingsYesterday,
        revenueTodayRecord,
        revenueYesterdayRecord
      ] = await Promise.all([
        BookingTVL.count(),
        PaymentTVL.sum('pt_amount', { where: { pt_status: 'RECEIVED' } }),
        PaymentTVL.sum('pt_amount', { where: { pt_status: 'PENDING' } }),
        BookingTVL.count({ where: { edtm: { [Op.gte]: twentyFourHoursAgo } } }),
        BookingTVL.count({ where: { edtm: { [Op.lt]: twentyFourHoursAgo, [Op.gte]: fortyEightHoursAgo } } }),
        PaymentTVL.sum('pt_amount', { where: { pt_status: 'RECEIVED', edtm: { [Op.gte]: twentyFourHoursAgo } } }),
        PaymentTVL.sum('pt_amount', { where: { pt_status: 'RECEIVED', edtm: { [Op.lt]: twentyFourHoursAgo, [Op.gte]: fortyEightHoursAgo } } })
      ]);
    } catch (err) {
      console.error('Dashboard: Booking/Payment stats failed:', err.message);
    }

    // ── Section 2: Financial Metrics Breakdown (from BillTVL) ────────────
    let financialSummary = { netFare: 0, serviceCharges: 0, platformFees: 0, discounts: 0, taxes: 0, totalBilled: 0 };
    try {
      financialSummary = await BillTVL.findOne({
        attributes: [
          [BillTVL.sequelize.fn('SUM', BillTVL.sequelize.col('bl_railway_fare')), 'netFare'],
          [BillTVL.sequelize.fn('SUM', BillTVL.sequelize.col('bl_service_charge')), 'serviceCharges'],
          [BillTVL.sequelize.fn('SUM', BillTVL.sequelize.col('bl_platform_fee')), 'platformFees'],
          [BillTVL.sequelize.fn('SUM', BillTVL.sequelize.col('bl_discount')), 'discounts'],
          [BillTVL.sequelize.fn('SUM', BillTVL.sequelize.col('bl_gst')), 'taxes'],
          [BillTVL.sequelize.fn('SUM', BillTVL.sequelize.col('bl_total_amount')), 'totalBilled']
        ],
        where: { bl_status: { [Op.not]: 'CAN' } },
        raw: true
      }) || financialSummary;
    } catch (err) {
      console.error('Dashboard: Financial summary failed:', err.message);
    }

    let totalReceived = 0;
    try {
      totalReceived = await PaymentTVL.sum('pt_amount', {
        where: { pt_status: { [Op.not]: 'REVERSED' } }
      }) || 0;
    } catch (err) {
      console.error('Dashboard: Total received failed:', err.message);
    }

    let balanceRes = { outstanding: 0, advances: 0 };
    try {
      [balanceRes] = await BillTVL.sequelize.query(`
        SELECT 
          SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) AS outstanding,
          SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END) AS advances
        FROM (
          SELECT 
            c.cu_usid,
            (COALESCE(b.total_billed, 0) - COALESCE(p.total_received, 0)) AS balance
          FROM cuXcustomer c
          LEFT JOIN (
            SELECT bk.bk_usid, SUM(bl.bl_total_amount) AS total_billed
            FROM blXbilling bl
            JOIN bkXbooking bk ON bl.bl_booking_id = bk.bk_bkid
            WHERE bl.bl_status NOT IN ('CANCELLED', 'CAN')
            GROUP BY bk.bk_usid
          ) b ON c.cu_usid = b.bk_usid
          LEFT JOIN (
            SELECT pt_custid, SUM(pt_amount) AS total_received
            FROM ptXpayment
            WHERE pt_status != 'REVERSED'
            GROUP BY pt_custid
          ) p ON c.cu_usid = p.pt_custid
        ) AS customer_balances
      `, { type: BillTVL.sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.error('Dashboard: Balance calculation failed:', err.message);
    }

    // ── Section 3: Risk & Outstanding ────────────────────────────────────
    let pendingBills = [{ count: 0, amount: 0 }];
    let partialPayments = [{ count: 0, amount: 0 }];
    let refundsPending = 0;
    try {
      [
        pendingBills,
        partialPayments,
        refundsPending
      ] = await Promise.all([
        BillTVL.findAll({
          attributes: [
            [BillTVL.sequelize.fn('COUNT', BillTVL.sequelize.col('bl_id')), 'count'],
            [BillTVL.sequelize.fn('SUM', BillTVL.sequelize.col('bl_total_amount')), 'amount']
          ],
          where: { payment_status: 'UNPAID', bl_status: { [Op.not]: 'CAN' } },
          raw: true
        }),
        BillTVL.findAll({
          attributes: [
            [BillTVL.sequelize.fn('COUNT', BillTVL.sequelize.col('bl_id')), 'count'],
            [BillTVL.sequelize.fn('SUM', BillTVL.sequelize.col('bl_total_amount')), 'amount']
          ],
          where: { payment_status: 'PARTIALLY_PAID', bl_status: { [Op.not]: 'CAN' } },
          raw: true
        }),
        BillTVL.count({ where: { payment_status: 'REFUND_DUE' } })
      ]);
    } catch (err) {
      console.error('Dashboard: Risk metrics failed:', err.message);
    }

    // ── Section 4: Operational Status ────────────────────────────────────
    let ticketsToday = 0, ticketsMonth = 0, cancelledToday = 0, cancelledMonth = 0;
    try {
      [
        ticketsToday,
        ticketsMonth,
        cancelledToday,
        cancelledMonth
      ] = await Promise.all([
        BookingTVL.count({ where: { bk_status: 'CONFIRMED', edtm: { [Op.gte]: startOfToday } } }),
        BookingTVL.count({ where: { bk_status: 'CONFIRMED', edtm: { [Op.gte]: startOfMonth } } }),
        BookingTVL.count({ where: { bk_status: 'CANCELLED', edtm: { [Op.gte]: startOfToday } } }),
        BookingTVL.count({ where: { bk_status: 'CANCELLED', edtm: { [Op.gte]: startOfMonth } } })
      ]);
    } catch (err) {
      console.error('Dashboard: Operational stats failed:', err.message);
    }

    // ── Section 5: Recent Activity Log (from ForensicAuditLog) ───────────
    let recentActivity = [];
    try {
      const logs = await ForensicAuditLog.findAll({
        limit: 10,
        order: [['change_timestamp', 'DESC']],
        include: [{
          model: UserTVL,
          as: 'user',
          attributes: ['us_fname', 'us_roid']
        }]
      });

      recentActivity = logs.map(log => ({
        timestamp: new Date(log.change_timestamp).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        module: log.module_name,
        action: log.action_type,
        reference: `${log.module_name}-${log.record_id}`,
        user: log.user?.us_fname || 'SYS'
      }));
    } catch (err) {
      console.error('Dashboard: Audit log failed:', err.message);
    }

    // Format for Frontend
    const dashboardData = {
      overview: {
        totalBookings,
        totalRevenue: parseFloat(totalRevenueRecord || 0),
        totalPending: parseFloat(totalPendingRecord || 0),
        refundsInProcess: refundsPending || 0,
        
        receivableSummary: {
          totalBilled: parseFloat(financialSummary.totalBilled || 0),
          totalReceived: parseFloat(totalReceived || 0),
          outstandingReceivables: parseFloat(balanceRes.outstanding || balanceRes[0]?.outstanding || 0),
          customerAdvances: parseFloat(balanceRes.advances || balanceRes[0]?.advances || 0)
        },

        // Detailed Financials
        netFareCollected: formatCurrency(financialSummary.netFare),
        serviceCharges: formatCurrency(financialSummary.serviceCharges),
        platformFees: formatCurrency(financialSummary.platformFees),
        discountsGiven: formatCurrency(financialSummary.discounts),
        taxesCollected: formatCurrency(financialSummary.taxes),
        totalBilled: formatCurrency(financialSummary.totalBilled),
        agentFees: "₹0.00",

        // Risk Metrics
        pendingBillsCount: parseInt(pendingBills[0]?.count || 0),
        pendingBillsAmount: formatCurrency(pendingBills[0]?.amount),
        partialPaymentsCount: parseInt(partialPayments[0]?.count || 0),
        partialPaymentsAmount: formatCurrency(partialPayments[0]?.amount),
        refundPendingCount: refundsPending || 0,
        refundPendingAmount: "₹0.00",

        // Operational
        trainsBookedToday: ticketsToday,
        trainsBookedThisMonth: ticketsMonth,
        ticketsIssuedToday: ticketsToday,
        ticketsIssuedThisMonth: ticketsMonth,
        ticketsCancelledToday: cancelledToday,
        ticketsCancelledThisMonth: cancelledMonth,
        waitlistedPnrsToday: 0,
        waitlistedPnrsThisMonth: 0,
        chartsPreparedToday: 0,
        chartsPreparedThisMonth: 0,

        trends: {
          bookings: { 
            percent: bookingsYesterday > 0 ? (((bookingsToday - bookingsYesterday) / bookingsYesterday) * 100).toFixed(1) : (bookingsToday > 0 ? "100.0" : "0.0")
          },
          revenue: { 
            percent: parseFloat(revenueYesterdayRecord || 0) > 0 ? (((parseFloat(revenueTodayRecord || 0) - parseFloat(revenueYesterdayRecord || 0)) / parseFloat(revenueYesterdayRecord || 0)) * 100).toFixed(1) : (parseFloat(revenueTodayRecord || 0) > 0 ? "100.0" : "0.0")
          }
        }
      },
      recentActivity,
      lastUpdated: new Date().toISOString()
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard' } 
    });
  }
};

/**
 * Employee Dashboard - Show employee-specific metrics
 */
const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.us_usid;

    // Get employee bookings
    const bookings = await BookingTVL.findAll({
      where: { bk_agent: userId },
      order: [['edtm', 'DESC']],
      limit: 5
    });

    const totalBookings = await BookingTVL.count({
      where: { bk_agent: userId }
    });

    const dashboardData = {
      stats: {
        totalBookings,
        recentBookings: bookings.length
      },
      recentBookings: bookings
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Employee dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard' } 
    });
  }
};

/**
 * Customer Dashboard - Show customer-specific metrics
 */
const getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user.us_usid;

    // Get customer bookings
    const bookings = await BookingTVL.findAll({
      where: { bk_usid: userId },
      order: [['edtm', 'DESC']],
      limit: 5
    });

    const totalBookings = await BookingTVL.count({
      where: { bk_usid: userId }
    });

    const dashboardData = {
      stats: {
        totalBookings,
        recentBookings: bookings.length
      },
      recentBookings: bookings
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Customer dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard' } 
    });
  }
};

/**
 * Agent Dashboard - Show assigned bookings and performance metrics
 */
const getAgentDashboard = async (req, res) => {
  try {
    const userId = req.user.us_usid;

    // Get assigned bookings
    const bookings = await BookingTVL.findAll({
      where: { bk_agent: userId },
      order: [['edtm', 'DESC']],
      limit: 10
    });

    // Performance metrics
    const totalBookings = await BookingTVL.count({
      where: { bk_agent: userId }
    });

    const confirmedBookings = await BookingTVL.count({
      where: { 
        bk_agent: userId,
        bk_status: 'CONFIRMED'
      }
    });

    const pendingBookings = await BookingTVL.count({
      where: { 
        bk_agent: userId,
        bk_status: 'PENDING'
      }
    });

    // This month's bookings
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyBookings = await BookingTVL.count({
      where: { 
        bk_agent: userId,
        edtm: { [Op.gte]: thisMonth }
      }
    });

    const dashboardData = {
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        monthlyBookings,
        conversionRate: totalBookings > 0 ? ((confirmedBookings / totalBookings) * 100).toFixed(1) : 0
      },
      recentBookings: bookings,
      navigation: [
        { name: 'Dashboard', path: '/employee/agent', icon: 'dashboard' },
        { name: 'My Bookings', path: '/employee/agent/bookings', icon: 'bookings' },
        { name: 'New Booking', path: '/employee/agent/new-booking', icon: 'add' },
        { name: 'Customer Search', path: '/employee/agent/customers', icon: 'search' }
      ]
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Agent dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard' } 
    });
  }
};

/**
 * Accounts Dashboard - Show pending payments and aging report
 */
const getAccountsDashboard = async (req, res) => {
  try {
    // Pending payments
    const pendingPayments = await PaymentTVL.findAll({
      where: { pt_status: 'PENDING' },
      order: [['edtm', 'DESC']],
      limit: 10
    });

    // Payment statistics
    const totalPayments = await PaymentTVL.sum('pt_amount');
    const pendingAmount = await PaymentTVL.sum('pt_amount', {
      where: { pt_status: 'PENDING' }
    });
    const processedAmount = await PaymentTVL.sum('pt_amount', {
      where: { pt_status: 'PROCESSED' }
    });

    // This month's collections
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyCollections = await PaymentTVL.sum('pt_amount', {
      where: { 
        pt_status: 'PROCESSED',
        edtm: { [Op.gte]: thisMonth }
      }
    });

    const dashboardData = {
      stats: {
        totalPayments: totalPayments || 0,
        pendingAmount: pendingAmount || 0,
        processedAmount: processedAmount || 0,
        monthlyCollections: monthlyCollections || 0,
        pendingCount: await PaymentTVL.count({ where: { pt_status: 'PENDING' } })
      },
      pendingPayments,
      navigation: [
        { name: 'Dashboard', path: '/employee/accounts', icon: 'dashboard' },
        { name: 'Payments', path: '/employee/accounts/payments', icon: 'payment' },
        { name: 'Aging Report', path: '/employee/accounts/aging', icon: 'report' },
        { name: 'Reconciliation', path: '/employee/accounts/reconciliation', icon: 'balance' }
      ]
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Accounts dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard' } 
    });
  }
};

/**
 * HR Dashboard - Show employee roster by department
 */
const getHRDashboard = async (req, res) => {
  try {
    // Employee statistics by department
    const employeesByDept = await EmployeeTVL.findAll({
      attributes: [
        'em_dept',
        [EmployeeTVL.sequelize.fn('COUNT', EmployeeTVL.sequelize.col('em_usid')), 'count']
      ],
      where: { em_status: 'ACTIVE' },
      group: ['em_dept'],
      raw: true
    });

    // Recent joiners (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJoiners = await EmployeeTVL.findAll({
      where: { 
        em_joindt: { [Op.gte]: thirtyDaysAgo },
        em_status: 'ACTIVE'
      },
      include: [{
        model: UserTVL,
        as: 'User',
        attributes: ['us_fname', 'us_lname', 'us_email']
      }],
      order: [['em_joindt', 'DESC']],
      limit: 5
    });

    // Total employees
    const totalEmployees = await EmployeeTVL.count({
      where: { em_status: 'ACTIVE' }
    });

    const dashboardData = {
      stats: {
        totalEmployees,
        departmentBreakdown: employeesByDept,
        recentJoinersCount: recentJoiners.length
      },
      recentJoiners,
      navigation: [
        { name: 'Dashboard', path: '/employee/hr', icon: 'dashboard' },
        { name: 'Employee Roster', path: '/employee/hr/roster', icon: 'people' },
        { name: 'Attendance', path: '/employee/hr/attendance', icon: 'calendar' },
        { name: 'Reports', path: '/employee/hr/reports', icon: 'report' }
      ]
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('HR dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard' } 
    });
  }
};

/**
 * Call Center Dashboard - Show open tickets and booking inquiries
 */
const getCallCenterDashboard = async (req, res) => {
  try {
    // Recent bookings for support
    const recentBookings = await BookingTVL.findAll({
      where: { 
        bk_status: { [Op.in]: ['PENDING', 'CONFIRMED'] }
      },
      order: [['edtm', 'DESC']],
      limit: 10
    });

    // Support statistics
    const totalInquiries = await BookingTVL.count({
      where: { bk_status: 'PENDING' }
    });

    const resolvedToday = await BookingTVL.count({
      where: { 
        bk_status: 'CONFIRMED',
        mdtm: { [Op.gte]: new Date().setHours(0, 0, 0, 0) }
      }
    });

    const dashboardData = {
      stats: {
        openTickets: totalInquiries,
        resolvedToday,
        avgResponseTime: '15 mins', // Mock data
        customerSatisfaction: '4.2/5' // Mock data
      },
      recentInquiries: recentBookings,
      navigation: [
        { name: 'Dashboard', path: '/employee/callcenter', icon: 'dashboard' },
        { name: 'Open Tickets', path: '/employee/callcenter/tickets', icon: 'support' },
        { name: 'Customer Lookup', path: '/employee/callcenter/lookup', icon: 'search' },
        { name: 'Knowledge Base', path: '/employee/callcenter/kb', icon: 'book' }
      ]
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Call center dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard' } 
    });
  }
};

/**
 * Marketing Dashboard - Show corporate clients and analytics
 */
const getMarketingDashboard = async (req, res) => {
  try {
    // Corporate customers
    const corporateClients = await CorporateCustomer.findAll({
      order: [['edtm', 'DESC']],
      limit: 10
    });

    // Marketing metrics
    const totalCorporateClients = await CorporateCustomer.count();
    const activeCorporateClients = await CorporateCustomer.count({
      where: { cc_active: 1 }
    });

    // This month's new clients
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newClientsThisMonth = await CorporateCustomer.count({
      where: { edtm: { [Op.gte]: thisMonth } }
    });

    const dashboardData = {
      stats: {
        totalCorporateClients,
        activeCorporateClients,
        newClientsThisMonth,
        conversionRate: '12.5%', // Mock data
        avgDealSize: '₹2.5L' // Mock data
      },
      recentClients: corporateClients,
      navigation: [
        { name: 'Dashboard', path: '/employee/marketing', icon: 'dashboard' },
        { name: 'Corporate Clients', path: '/employee/marketing/clients', icon: 'business' },
        { name: 'Campaigns', path: '/employee/marketing/campaigns', icon: 'megaphone' },
        { name: 'Analytics', path: '/employee/marketing/analytics', icon: 'chart' }
      ]
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Marketing dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard' } 
    });
  }
};

/**
 * Management Dashboard - Show all metrics, financial summary, leaderboards
 */
const getManagementDashboard = async (req, res) => {
  try {
    // Overall statistics
    const totalBookings = await BookingTVL.count();
    const totalRevenue = await PaymentTVL.sum('pt_amount', {
      where: { pt_status: 'PROCESSED' }
    });
    const totalEmployees = await EmployeeTVL.count({
      where: { em_status: 'ACTIVE' }
    });
    const totalCustomers = await Customer.count();

    // This month's performance
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyBookings = await BookingTVL.count({
      where: { edtm: { [Op.gte]: thisMonth } }
    });

    const monthlyRevenue = await PaymentTVL.sum('pt_amount', {
      where: { 
        pt_status: 'PROCESSED',
        edtm: { [Op.gte]: thisMonth }
      }
    });

    // Top performing agents
    const topAgents = await BookingTVL.findAll({
      attributes: [
        'bk_agent',
        [BookingTVL.sequelize.fn('COUNT', BookingTVL.sequelize.col('bk_bkid')), 'bookingCount']
      ],
      where: { 
        bk_status: 'CONFIRMED',
        edtm: { [Op.gte]: thisMonth }
      },
      group: ['bk_agent'],
      order: [[BookingTVL.sequelize.fn('COUNT', BookingTVL.sequelize.col('bk_bkid')), 'DESC']],
      limit: 5,
      include: [{
        model: UserTVL,
        as: 'agent',
        attributes: ['us_fname', 'us_lname']
      }]
    });

    const dashboardData = {
      stats: {
        totalBookings,
        totalRevenue: totalRevenue || 0,
        totalEmployees,
        totalCustomers,
        monthlyBookings,
        monthlyRevenue: monthlyRevenue || 0,
        growthRate: '15.2%' // Mock data
      },
      topAgents,
      navigation: [
        { name: 'Dashboard', path: '/employee/management', icon: 'dashboard' },
        { name: 'Financial Reports', path: '/employee/management/financial', icon: 'money' },
        { name: 'Performance', path: '/employee/management/performance', icon: 'trending' },
        { name: 'Analytics', path: '/employee/management/analytics', icon: 'chart' },
        { name: 'Admin Panel', path: '/admin', icon: 'settings' }
      ]
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Management dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard' } 
    });
  }
};

module.exports = {
  getAdminDashboard,
  getEmployeeDashboard,
  getCustomerDashboard,
  getAgentDashboard,
  getAccountsDashboard,
  getHRDashboard,
  getCallCenterDashboard,
  getMarketingDashboard,
  getManagementDashboard
};