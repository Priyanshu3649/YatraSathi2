const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const CorporateCustomer = require('../models/CorporateCustomer');

// Get system statistics (admin only)
const getSystemStats = async (req, res) => {
  try {
    // Only admin can get system statistics
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ userType: 'customer' });
    const totalEmployees = await User.countDocuments({ userType: 'employee' });
    const totalBookings = await Booking.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const totalCorporateCustomers = await CorporateCustomer.countDocuments();
    
    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email userType createdAt');
    
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'name')
      .populate('employeeId', 'name');
    
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
    let query = {};
    
    if (req.user.userType === 'customer') {
      query.customerId = req.user._id;
    } else if (req.user.userType === 'employee') {
      query.employeeId = req.user._id;
    }
    
    // Get counts by status
    const statusCounts = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get bookings by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const bookingsByDate = await Booking.aggregate([
      { 
        $match: { 
          ...query,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get popular routes
    const popularRoutes = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            origin: '$origin',
            destination: '$destination'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
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
    if (req.user.userType !== 'admin' && req.user.department !== 'accounts') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Build query based on user type
    let query = {};
    
    if (req.user.userType === 'employee' && req.user.department === 'accounts') {
      // Accounts team might have specific filters
      // For now, we'll allow access to all financial data
    }
    
    // Get payment statistics
    const paymentStats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$mode',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    // Get revenue by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const revenueByDate = await Payment.aggregate([
      { 
        $match: { 
          ...query,
          paymentDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$paymentDate'
            }
          },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get total financial summary
    const payments = await Payment.find(query);
    let totalRevenue = 0;
    let totalPayments = payments.length;
    
    payments.forEach(payment => {
      totalRevenue += payment.amount;
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
    if (req.user.userType !== 'admin' && 
        !(req.user.userType === 'employee' && req.user.department === 'management')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all employees
    const employees = await User.find({ userType: 'employee' });
    
    const employeeStats = [];
    
    for (const employee of employees) {
      // Get employee's bookings
      const bookings = await Booking.find({ employeeId: employee._id });
      
      // Calculate statistics
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
      
      // Calculate revenue
      let totalRevenue = 0;
      bookings.forEach(booking => {
        totalRevenue += booking.amountPaid || 0;
      });
      
      employeeStats.push({
        employeeId: employee._id,
        name: employee.name,
        department: employee.department,
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
    if (req.user.userType !== 'admin' && 
        !(req.user.userType === 'employee' && req.user.department === 'relationship_manager')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all corporate customers
    const corporateCustomers = await CorporateCustomer.find()
      .populate('userId', 'name email phone');
    
    const corporateStats = [];
    
    for (const customer of corporateCustomers) {
      // Get customer's bookings
      const bookings = await Booking.find({ 
        $or: [
          { customerId: customer.userId._id },
          { corporateId: customer.userId._id }
        ]
      });
      
      // Calculate statistics
      let totalBookings = 0;
      let totalPaid = 0;
      let totalPending = 0;
      
      bookings.forEach(booking => {
        totalBookings += booking.totalAmount || 0;
        totalPaid += booking.amountPaid || 0;
      });
      
      totalPending = totalBookings - totalPaid;
      
      corporateStats.push({
        customerId: customer.userId._id,
        companyName: customer.companyName,
        contactPerson: customer.userId.name,
        email: customer.userId.email,
        phone: customer.userId.phone,
        creditLimit: customer.creditLimit,
        creditUsed: customer.creditUsed,
        creditAvailable: customer.creditLimit - customer.creditUsed,
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