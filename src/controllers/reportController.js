const { User, Booking, Payment, CorporateCustomer, Employee, Customer, Station } = require('../models');
const { Sequelize } = require('sequelize');
const { generateTravelPlanPDF } = require('../utils/pdfGenerator');

// Generate employee performance report
const generateEmployeePerformanceReport = async (req, res) => {
  try {
    // Only admin can generate this report
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all employees
    const employees = await User.findAll({ 
      where: { us_usertype: 'employee' },
      include: [{
        model: Employee,
        attributes: ['em_empno', 'em_designation', 'em_dept']
      }]
    });
    
    const performanceData = [];
    
    for (const employee of employees) {
      // Get employee's bookings
      const bookings = await Booking.findAll({ 
        where: { bk_agent: employee.us_usid } 
      });
      
      // Calculate statistics
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.bk_status === 'CONFIRMED').length;
      
      // Calculate revenue
      let totalRevenue = 0;
      for (const booking of bookings) {
        totalRevenue += booking.bk_amount_paid || 0;
      }
      
      performanceData.push({
        employeeId: employee.us_usid,
        name: `${employee.us_fname} ${employee.us_lname}`,
        department: employee.Employee ? employee.Employee.em_dept : '',
        employeeNumber: employee.Employee ? employee.Employee.em_empno : '',
        designation: employee.Employee ? employee.Employee.em_designation : '',
        totalBookings,
        confirmedBookings,
        successRate: totalBookings > 0 ? (confirmedBookings / totalBookings * 100).toFixed(2) : 0,
        totalRevenue
      });
    }
    
    res.json({
      reportType: 'employeePerformance',
      generatedAt: new Date(),
      data: performanceData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate financial summary report
const generateFinancialReport = async (req, res) => {
  try {
    // Only admin can generate this report
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get date range from query parameters
    const { startDate, endDate } = req.query;
    
    // Build date filter conditions
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {
        bk_reqdt: {}
      };
      if (startDate) {
        dateFilter.bk_reqdt[Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        dateFilter.bk_reqdt[Sequelize.Op.lte] = new Date(endDate);
      }
    }
    
    // Get all bookings and payments with date filters
    const bookings = await Booking.findAll({ where: dateFilter });
    const payments = await Payment.findAll({
      where: startDate || endDate ? {
        pt_paydt: startDate || endDate ? {
          ...(startDate && { [Sequelize.Op.gte]: new Date(startDate) }),
          ...(endDate && { [Sequelize.Op.lte]: new Date(endDate) })
        } : undefined
      } : undefined
    });
    
    // Calculate financial statistics
    let totalBookings = 0;
    let totalRevenue = 0;
    let totalPending = 0;
    let totalPayments = payments.length;
    let totalRefunds = 0;
    
    bookings.forEach(booking => {
      totalBookings += booking.bk_total_amount || 0;
      totalRevenue += booking.bk_amount_paid || 0;
      totalPending += booking.bk_amount_pending || 0;
    });
    
    // Get payments by mode
    const paymentsByMode = {};
    const refundsByMode = {};
    
    payments.forEach(payment => {
      // Check if this is a refund (negative amount)
      if (payment.pt_amount < 0) {
        if (!refundsByMode[payment.pt_mode]) {
          refundsByMode[payment.pt_mode] = 0;
        }
        refundsByMode[payment.pt_mode] += Math.abs(parseFloat(payment.pt_amount)) || 0;
        totalRefunds += Math.abs(parseFloat(payment.pt_amount)) || 0;
      } else {
        if (!paymentsByMode[payment.pt_mode]) {
          paymentsByMode[payment.pt_mode] = 0;
        }
        paymentsByMode[payment.pt_mode] += parseFloat(payment.pt_amount) || 0;
      }
    });
    
    // Calculate net revenue (revenue minus refunds)
    const netRevenue = totalRevenue - totalRefunds;
    
    // Get bookings by status
    const bookingsByStatus = {};
    bookings.forEach(booking => {
      if (!bookingsByStatus[booking.bk_status]) {
        bookingsByStatus[booking.bk_status] = 0;
      }
      bookingsByStatus[booking.bk_status]++;
    });
    
    // Get bookings by class
    const bookingsByClass = {};
    bookings.forEach(booking => {
      if (!bookingsByClass[booking.bk_class]) {
        bookingsByClass[booking.bk_class] = 0;
      }
      bookingsByClass[booking.bk_class]++;
    });
    
    // Get top stations by booking count
    const stationBookings = {};
    bookings.forEach(booking => {
      // Count from station
      if (!stationBookings[booking.bk_fromst]) {
        stationBookings[booking.bk_fromst] = 0;
      }
      stationBookings[booking.bk_fromst]++;
      
      // Count to station
      if (!stationBookings[booking.bk_tost]) {
        stationBookings[booking.bk_tost] = 0;
      }
      stationBookings[booking.bk_tost]++;
    });
    
    // Get top 5 stations
    const topStations = Object.entries(stationBookings)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([station, count]) => ({ station, count }));
    
    res.json({
      reportType: 'financialSummary',
      generatedAt: new Date(),
      filters: { startDate, endDate },
      summary: {
        totalBookings,
        totalRevenue,
        totalPending,
        totalPayments,
        totalRefunds,
        netRevenue
      },
      paymentsByMode,
      refundsByMode,
      bookingsByStatus,
      bookingsByClass,
      topStations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate corporate customer report
const generateCorporateCustomerReport = async (req, res) => {
  try {
    // Only admin can generate this report
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all corporate customers
    const corporateCustomers = await User.findAll({
      include: [{
        model: CorporateCustomer,
        required: true
      }]
    });
    
    const customerData = [];
    
    for (const customer of corporateCustomers) {
      // Get customer's bookings
      const bookings = await Booking.findAll({ 
        where: { 
          bk_usid: customer.us_usid
        }
      });
      
      // Calculate statistics
      let totalBookings = 0;
      let totalPaid = 0;
      let totalPending = 0;
      
      bookings.forEach(booking => {
        totalBookings += booking.bk_total_amount || 0;
        totalPaid += booking.bk_amount_paid || 0;
      });
      
      totalPending = totalBookings - totalPaid;
      
      customerData.push({
        customerId: customer.us_usid,
        companyName: customer.CorporateCustomer ? customer.CorporateCustomer.cu_company : '',
        contactPerson: `${customer.us_fname} ${customer.us_lname}`,
        email: customer.us_email,
        phone: customer.us_phone,
        creditLimit: customer.CorporateCustomer ? customer.CorporateCustomer.cu_creditlmt : 0,
        creditUsed: customer.CorporateCustomer ? customer.CorporateCustomer.cu_creditused : 0,
        totalBookings,
        totalPaid,
        totalPending
      });
    }
    
    res.json({
      reportType: 'corporateCustomers',
      generatedAt: new Date(),
      data: customerData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate booking summary report
const generateBookingReport = async (req, res) => {
  try {
    // Check permissions
    if (req.user.us_usertype !== 'admin' && req.user.us_usertype !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get date range and filters from query parameters
    const { startDate, endDate, status, employeeId, customerId } = req.query;
    
    // Build query
    let whereConditions = {};
    
    // Add date range filter
    if (startDate || endDate) {
      whereConditions.bk_reqdt = {};
      if (startDate) {
        whereConditions.bk_reqdt[Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereConditions.bk_reqdt[Sequelize.Op.lte] = new Date(endDate);
      }
    }
    
    // Add status filter
    if (status) {
      whereConditions.bk_status = status;
    }
    
    // Add employee filter
    if (employeeId) {
      whereConditions.bk_agent = employeeId;
    }
    
    // Add customer filter
    if (customerId) {
      whereConditions.bk_usid = customerId;
    }
    
    // For employees, only get their assigned bookings
    if (req.user.us_usertype === 'employee') {
      whereConditions.bk_agent = req.user.us_usid;
    }
    
    // Get bookings with related data
    const bookings = await Booking.findAll({
      where: whereConditions,
      include: [
        {
          model: Station,
          as: 'fromStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        },
        {
          model: Station,
          as: 'toStation',
          attributes: ['st_stcode', 'st_stname', 'st_city']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['us_fname', 'us_lname', 'us_email']
        },
        {
          model: User,
          as: 'agent',
          attributes: ['us_fname', 'us_lname', 'us_email'],
          include: [{
            model: Employee,
            attributes: ['em_empno', 'em_designation']
          }]
        }
      ],
      order: [['bk_reqdt', 'DESC']]
    });
    
    res.json({
      reportType: 'bookings',
      generatedAt: new Date(),
      filters: { startDate, endDate, status, employeeId, customerId },
      totalBookings: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate PDF report for a travel plan
const generateTravelPlanReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get travel plan
    const travelPlan = await Booking.findByPk(id);
    
    if (!travelPlan) {
      return res.status(404).json({ message: 'Travel plan not found' });
    }
    
    // Check if user owns this travel plan
    if (travelPlan.bk_usid !== req.user.us_usid && 
        req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this travel plan' });
    }
    
    // Generate PDF
    const fileName = `travel-plan-${travelPlan.bk_bkid}.pdf`;
    
    // In a real implementation, you would generate the PDF here
    // For now, we'll return a placeholder response
    res.json({
      message: 'PDF report generation initiated',
      fileName,
      downloadUrl: `/api/reports/download/${fileName}`
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
};

// Download generated report
const downloadReport = async (req, res) => {
  try {
    const { fileName } = req.params;
    
    // In a real implementation, you would serve the actual PDF file
    // For now, we'll return a placeholder response
    res.json({
      message: `Report ${fileName} would be downloaded here`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error downloading report' });
  }
};

// Generate customer analytics report
const generateCustomerAnalyticsReport = async (req, res) => {
  try {
    // Only admin can generate this report
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get date range from query parameters
    const { startDate, endDate } = req.query;
    
    // Build date filter conditions for bookings
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {
        bk_reqdt: {}
      };
      if (startDate) {
        dateFilter.bk_reqdt[Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        dateFilter.bk_reqdt[Sequelize.Op.lte] = new Date(endDate);
      }
    }
    
    // Get all customers
    const customers = await User.findAll({ 
      where: { us_usertype: 'customer' }
    });
    
    // Get all bookings with date filters
    const bookings = await Booking.findAll({ where: dateFilter });
    
    // Customer analytics data
    const customerAnalytics = {
      totalCustomers: customers.length,
      activeCustomers: 0,
      inactiveCustomers: 0,
      customerGrowth: [],
      bookingFrequency: {},
      topCustomers: []
    };
    
    // Process customer data
    const customerBookingMap = {}; // Map to store booking counts per customer
    
    bookings.forEach(booking => {
      // Count bookings per customer
      if (!customerBookingMap[booking.bk_usid]) {
        customerBookingMap[booking.bk_usid] = {
          count: 0,
          totalSpent: 0
        };
      }
      customerBookingMap[booking.bk_usid].count++;
      customerBookingMap[booking.bk_usid].totalSpent += booking.bk_amount_paid || 0;
    });
    
    // Determine active/inactive customers
    const activeThreshold = 30; // Days threshold for active customers
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - activeThreshold);
    
    // Count active customers (those with bookings in last 30 days)
    const recentBookings = bookings.filter(booking => 
      new Date(booking.bk_reqdt) >= thirtyDaysAgo
    );
    
    const recentCustomerIds = [...new Set(recentBookings.map(booking => booking.bk_usid))];
    customerAnalytics.activeCustomers = recentCustomerIds.length;
    customerAnalytics.inactiveCustomers = customerAnalytics.totalCustomers - customerAnalytics.activeCustomers;
    
    // Booking frequency analysis
    const frequencyMap = {
      '1': 0,
      '2-5': 0,
      '6-10': 0,
      '10+': 0
    };
    
    Object.values(customerBookingMap).forEach(stats => {
      const count = stats.count;
      if (count === 1) {
        frequencyMap['1']++;
      } else if (count >= 2 && count <= 5) {
        frequencyMap['2-5']++;
      } else if (count >= 6 && count <= 10) {
        frequencyMap['6-10']++;
      } else if (count > 10) {
        frequencyMap['10+']++;
      }
    });
    
    customerAnalytics.bookingFrequency = frequencyMap;
    
    // Top customers by spending
    const topCustomers = Object.entries(customerBookingMap)
      .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(([customerId, stats]) => ({
        customerId,
        bookingCount: stats.count,
        totalSpent: stats.totalSpent
      }));
    
    // Enrich top customers with user data
    for (const topCustomer of topCustomers) {
      const user = await User.findByPk(topCustomer.customerId, {
        attributes: ['us_fname', 'us_lname', 'us_email']
      });
      
      if (user) {
        customerAnalytics.topCustomers.push({
          ...topCustomer,
          name: `${user.us_fname} ${user.us_lname}`,
          email: user.us_email
        });
      }
    }
    
    res.json({
      reportType: 'customerAnalytics',
      generatedAt: new Date(),
      filters: { startDate, endDate },
      analytics: customerAnalytics
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateEmployeePerformanceReport,
  generateFinancialReport,
  generateCorporateCustomerReport,
  generateBookingReport,
  generateTravelPlanReport,
  downloadReport,
  generateCustomerAnalyticsReport
};