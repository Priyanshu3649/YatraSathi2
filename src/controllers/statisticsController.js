const { UserTVL: User, BookingTVL: Booking, PaymentTVL: Payment, CorporateCustomer, EmployeeTVL: Employee } = require('../models');
const { Sequelize } = require('sequelize');

// Get system statistics (admin only)
const getSystemStats = async (req, res) => {
  try {
    // Only admin can get system statistics
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get counts
    const totalUsers = await User.count();
    const totalCustomers = await User.count({ where: { us_usertype: 'customer' } });
    const totalEmployees = await User.count({ where: { us_usertype: 'employee' } });
    const totalBookings = await Booking.count();
    const totalPayments = await Payment.count();
    const totalCorporateCustomers = await CorporateCustomer.count();
    
    // Get recent activity
    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['us_fname', 'us_email', 'us_usertype', 'createdAt']
    });
    
    const recentBookings = await Booking.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    res.json({
      overview: {
        totalUsers,
        totalCustomers,
        totalEmployees,
        totalBookings,
        totalPayments,
        totalCorporateCustomers
      },
      recentActivity: {
        users: recentUsers,
        bookings: recentBookings
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get booking statistics
const getBookingStats = async (req, res) => {
  try {
    // Build query based on user type
    let whereClause = {};
    
    if (req.user.us_usertype === 'customer') {
      whereClause.bk_cuid = req.user.us_usid; // Assuming customer ID is stored in bk_cuid
    } else if (req.user.us_usertype === 'employee') {
      whereClause.bk_euid = req.user.us_usid; // Assuming employee ID is stored in bk_euid
    }
    
    // Get counts by status
    const statusCounts = await Booking.findAll({
      attributes: ['bk_status', [Sequelize.fn('COUNT', Sequelize.col('bk_status')), 'count']],
      group: ['bk_status'],
      where: whereClause
    });
    
    // Get bookings by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const bookingsByDate = await Booking.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('bk_edtm')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('bk_bkid')), 'count']
      ],
      where: {
        ...whereClause,
        bk_edtm: { [Sequelize.Op.gte]: thirtyDaysAgo }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('bk_edtm'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('bk_edtm')), 'ASC']]
    });
    
    // Get popular routes
    const popularRoutes = await Booking.findAll({
      attributes: [
        'bk_origin',
        'bk_destination',
        [Sequelize.fn('COUNT', Sequelize.col('bk_bkid')), 'count']
      ],
      where: whereClause,
      group: ['bk_origin', 'bk_destination'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('bk_bkid')), 'DESC']],
      limit: 10
    });
    
    res.json({
      statusCounts,
      bookingsByDate,
      popularRoutes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get financial statistics
const getFinancialStats = async (req, res) => {
  try {
    // Check permissions
    if (req.user.us_usertype !== 'admin' && req.user.department !== 'accounts') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Build query based on user type
    let whereClause = {};
    
    if (req.user.us_usertype === 'employee' && req.user.department === 'accounts') {
      // Accounts team might have specific filters
      // For now, we'll allow access to all financial data
    }
    
    // Get payment statistics
    const paymentStats = await Payment.findAll({
      attributes: [
        'pm_mode',
        [Sequelize.fn('COUNT', Sequelize.col('pm_pmid')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('pm_amount')), 'totalAmount']
      ],
      group: ['pm_mode'],
      where: whereClause
    });
    
    // Get revenue by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const revenueByDate = await Payment.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('pm_pddt')), 'date'],
        [Sequelize.fn('SUM', Sequelize.col('pm_amount')), 'totalAmount']
      ],
      where: {
        ...whereClause,
        pm_pddt: { [Sequelize.Op.gte]: thirtyDaysAgo }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('pm_pddt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('pm_pddt')), 'ASC']]
    });
    
    // Get total financial summary
    const payments = await Payment.findAll({ where: whereClause });
    let totalRevenue = 0;
    let totalPayments = payments.length;
    
    payments.forEach(payment => {
      totalRevenue += parseFloat(payment.pm_amount || 0);
    });
    
    res.json({
      overview: {
        totalRevenue,
        totalPayments
      },
      paymentStats,
      revenueByDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee performance statistics
const getEmployeeStats = async (req, res) => {
  try {
    // Only admin and managers can get employee statistics
    if (req.user.us_usertype !== 'admin' && 
        !(req.user.us_usertype === 'employee' && req.user.department === 'management')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all employees
    const employees = await User.findAll({ 
      where: { us_usertype: 'employee' },
      include: [Employee] // Include employee details
    });
    
    const employeeStats = [];
    
    for (const employeeUser of employees) {
      // Get employee's bookings
      const bookings = await Booking.findAll({ 
        where: { bk_euid: employeeUser.us_usid } // Assuming bk_euid is the employee ID field
      });
      
      // Calculate statistics
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.bk_status === 'CONFIRMED').length;
      
      // Calculate revenue
      let totalRevenue = 0;
      bookings.forEach(booking => {
        totalRevenue += parseFloat(booking.bk_amount || 0);
      });
      
      employeeStats.push({
        employeeId: employeeUser.us_usid,
        name: employeeUser.us_fname,
        department: employeeUser.employee?.em_dept || 'N/A',
        totalBookings,
        confirmedBookings,
        successRate: totalBookings > 0 ? (confirmedBookings / totalBookings * 100).toFixed(2) : 0,
        totalRevenue
      });
    }
    
    // Sort by total revenue
    employeeStats.sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    res.json(employeeStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get corporate customer statistics
const getCorporateStats = async (req, res) => {
  try {
    // Only admin and relationship managers can get corporate statistics
    if (req.user.us_usertype !== 'admin' && 
        !(req.user.us_usertype === 'employee' && req.user.department === 'relationship_manager')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all corporate customers
    const corporateCustomers = await CorporateCustomer.findAll();
    
    const corporateStats = [];
    
    for (const customer of corporateCustomers) {
      // Get customer's bookings
      const bookings = await Booking.findAll({ 
        where: {
          [Sequelize.Op.or]: [
            { bk_cuid: customer.cc_usid }, // Assuming bk_cuid is the customer ID field
            { bk_corpid: customer.cc_usid } // Assuming bk_corpid is the corporate ID field
          ]
        }
      });
      
      // Calculate statistics
      let totalBookings = 0;
      let totalPaid = 0;
      let totalPending = 0;
      
      bookings.forEach(booking => {
        totalBookings += parseFloat(booking.bk_amount || 0);
        totalPaid += parseFloat(booking.bk_amount || 0); // Assuming the full amount is paid for corporate bookings
      });
      
      totalPending = totalBookings - totalPaid;
      
      corporateStats.push({
        customerId: customer.cc_usid,
        companyName: customer.cc_cmpname,
        contactPerson: customer.cc_contper,
        email: customer.cc_email,
        phone: customer.cc_phone,
        creditLimit: customer.cc_creditlim,
        creditUsed: customer.cc_creditused,
        creditAvailable: customer.cc_creditlim - customer.cc_creditused,
        totalBookings,
        totalPaid,
        totalPending
      });
    }
    
    // Sort by total bookings
    corporateStats.sort((a, b) => b.totalBookings - a.totalBookings);
    
    res.json(corporateStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSystemStats,
  getBookingStats,
  getFinancialStats,
  getEmployeeStats,
  getCorporateStats
};