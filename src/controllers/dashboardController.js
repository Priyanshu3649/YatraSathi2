const { UserTVL, EmployeeTVL, BookingTVL, PaymentTVL, Customer, CorporateCustomer, Account, User, Employee } = require('../models');
const { Op } = require('sequelize');

/**
 * Admin Dashboard - Show overall system metrics
 */
const getAdminDashboard = async (req, res) => {
  try {
    // Overall statistics
    const totalBookings = await BookingTVL.count();
    const totalEmployees = await EmployeeTVL.count();
    const totalCustomers = await Customer.count();
    const totalUsers = await UserTVL.count();
    
    // Revenue and payment statistics
    const totalRevenue = await PaymentTVL.sum('pt_amount', {
      where: { pt_status: 'PROCESSED' }
    });
    
    // Pending amount calculation
    const pendingPayments = await PaymentTVL.sum('pt_amount', {
      where: { pt_status: 'PENDING' }
    });
    
    // Booking status statistics
    const pendingBookings = await BookingTVL.count({
      where: { bk_status: 'PENDING' }
    });
    
    const confirmedBookings = await BookingTVL.count({
      where: { bk_status: 'CONFIRMED' }
    });
    
    const cancelledBookings = await BookingTVL.count({
      where: { bk_status: 'CANCELLED' }
    });
    
    // Employee performance (top 5 performing employees)
    const employeeBookings = await BookingTVL.findAll({
      attributes: [
        'bk_agent',
        [BookingTVL.sequelize.fn('COUNT', BookingTVL.sequelize.col('bk_bkid')), 'totalBookings'],
        [BookingTVL.sequelize.fn('SUM', BookingTVL.sequelize.literal("CASE WHEN bk_status = 'CONFIRMED' THEN 1 ELSE 0 END")), 'confirmedBookings']
      ],
      where: { bk_agent: { [Op.not]: null } },
      group: ['bk_agent'],
      order: [[BookingTVL.sequelize.fn('COUNT', BookingTVL.sequelize.col('bk_bkid')), 'DESC']],
      limit: 5
    });
    
    // Get user details for each agent separately
    const employeePerformance = [];
    for (const booking of employeeBookings) {
      if (booking.bk_agent) {
        const user = await UserTVL.findByPk(booking.bk_agent, {
          attributes: ['us_fname', 'us_lname']
        });
        
        employeePerformance.push({
          ...booking.toJSON(),
          agent: user
        });
      }
    }
    
    // Format employee performance data
    const formattedEmployeePerformance = employeePerformance.map(emp => ({
      name: `${emp.agent?.us_fname || 'N/A'} ${emp.agent?.us_lname || ''}`,
      department: 'N/A', // Would need to join with Employee table to get actual department
      totalBookings: parseInt(emp.totalBookings),
      confirmedBookings: parseInt(emp.confirmedBookings || 0),
      revenueGenerated: 0 // Would need to calculate from related payments
    }));
    
    // Format the response to match frontend expectations
    const dashboardData = {
      overview: {
        totalUsers,
        totalBookings,
        totalRevenue: totalRevenue || 0,
        totalPending: pendingPayments || 0
      },
      bookingStats: {
        pending: pendingBookings,
        confirmed: confirmedBookings,
        cancelled: cancelledBookings
      },
      employeePerformance: formattedEmployeePerformance
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
      where: { bk_euid: userId },
      order: [['edtm', 'DESC']],
      limit: 5
    });

    const totalBookings = await BookingTVL.count({
      where: { bk_euid: userId }
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
      where: { bk_cuid: userId },
      order: [['edtm', 'DESC']],
      limit: 5
    });

    const totalBookings = await BookingTVL.count({
      where: { bk_cuid: userId }
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
      where: { bk_euid: userId },
      order: [['edtm', 'DESC']],
      limit: 10
    });

    // Performance metrics
    const totalBookings = await BookingTVL.count({
      where: { bk_euid: userId }
    });

    const confirmedBookings = await BookingTVL.count({
      where: { 
        bk_euid: userId,
        bk_status: 'CONFIRMED'
      }
    });

    const pendingBookings = await BookingTVL.count({
      where: { 
        bk_euid: userId,
        bk_status: 'PENDING'
      }
    });

    // This month's bookings
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyBookings = await BookingTVL.count({
      where: { 
        bk_euid: userId,
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
        'bk_euid',
        [BookingTVL.sequelize.fn('COUNT', BookingTVL.sequelize.col('bk_bkid')), 'bookingCount']
      ],
      where: { 
        bk_status: 'CONFIRMED',
        edtm: { [Op.gte]: thisMonth }
      },
      group: ['bk_euid'],
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