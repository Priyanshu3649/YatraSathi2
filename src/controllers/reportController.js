const { bkBooking: Booking, ptPayment: Payment, pnXpnr: Pnr, cuCustomer: Customer, emEmployee: Employee, acAccount: Account, paPaymentAlloc: PaymentAlloc, Sequelize } = require('../models');
const { Op } = require('sequelize');

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
      totalBookings += 1;
      totalRevenue += parseFloat(booking.bk_total_amount || 0);
      totalPending += parseFloat(booking.bk_amount_pending || 0);
      if (booking.bk_status === 'CANCELLED') {
        totalRefunds += parseFloat(booking.bk_total_amount || 0);
      }
    });
    
    // Calculate detailed payment breakdown
    let totalTicketPrice = 0;
    let totalPlatformFee = 0;
    let totalAgentFee = 0;
    let totalTax = 0;
    let totalOtherCharges = 0;
    
    payments.forEach(payment => {
      totalTicketPrice += parseFloat(payment.pt_ticket_price || 0);
      totalPlatformFee += parseFloat(payment.pt_platform_fee || 0);
      totalAgentFee += parseFloat(payment.pt_agent_fee || 0);
      totalTax += parseFloat(payment.pt_tax || 0);
      totalOtherCharges += parseFloat(payment.pt_other_charges || 0);
    });
    
    // Calculate payments by mode
    const paymentsByMode = {};
    payments.forEach(payment => {
      const mode = payment.pt_mode;
      if (!paymentsByMode[mode]) {
        paymentsByMode[mode] = 0;
      }
      paymentsByMode[mode] += parseFloat(payment.pt_amount || 0);
    });
    
    // Get PNR status statistics
    const pnrDateFilter = {};
    if (startDate || endDate) {
      pnrDateFilter.pn_bookdt = {};
      if (startDate) {
        pnrDateFilter.pn_bookdt[Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        pnrDateFilter.pn_bookdt[Sequelize.Op.lte] = new Date(endDate);
      }
    }
    
    const pnrs = await Pnr.findAll({
      where: pnrDateFilter
    });
    
    const pnrStatusStats = {
      CNF: 0,
      WL: 0,
      RAC: 0,
      CNCL: 0
    };
    
    pnrs.forEach(pnr => {
      const status = pnr.pn_status || 'CNF';
      if (pnrStatusStats[status] !== undefined) {
        pnrStatusStats[status] += 1;
      }
    });
    
    res.json({
      overview: {
        totalBookings,
        totalRevenue,
        totalPending,
        totalPayments,
        totalRefunds
      },
      financial: {
        netRevenue: totalRevenue - totalRefunds,
        totalTicketPrice,
        totalPlatformFee,
        totalAgentFee,
        totalTax,
        totalOtherCharges,
        paymentsByMode,
        pnrStatusStats
      },
      paymentStats: {
        totalPayments,
        paymentsByMode
      }
    });
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate booking report
const generateBookingReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { startDate, endDate, status, employeeId } = req.query;
    
    let whereClause = {};
    
    if (startDate || endDate) {
      whereClause.bk_reqdt = {};
      if (startDate) {
        whereClause.bk_reqdt[Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.bk_reqdt[Sequelize.Op.lte] = new Date(endDate);
      }
    }
    
    if (status) {
      whereClause.bk_status = status;
    }
    
    if (employeeId) {
      whereClause.bk_agent = employeeId;
    }
    
    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          attributes: ['cu_name', 'cu_phone', 'cu_email']
        },
        {
          model: Employee,
          attributes: ['em_name'],
          as: 'agent'
        }
      ]
    });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate employee performance report
const generateEmployeePerformanceReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { startDate, endDate, department } = req.query;
    
    let bookingWhereClause = {};
    
    if (startDate || endDate) {
      bookingWhereClause.bk_reqdt = {};
      if (startDate) {
        bookingWhereClause.bk_reqdt[Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        bookingWhereClause.bk_reqdt[Sequelize.Op.lte] = new Date(endDate);
      }
    }
    
    const employees = await Employee.findAll({
      include: [
        {
          model: Booking,
          as: 'agentBookings',
          where: bookingWhereClause,
          attributes: ['bk_bkid', 'bk_total_amount', 'bk_status', 'bk_reqdt']
        }
      ]
    });
    
    const employeePerformance = employees.map(emp => {
      const bookings = emp.agentBookings || [];
      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.bk_total_amount || 0), 0);
      const completedBookings = bookings.filter(b => b.bk_status === 'COMPLETED').length;
      const successRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
      
      return {
        employeeId: emp.em_usid,
        name: emp.em_name,
        department: emp.em_dept,
        totalBookings,
        totalRevenue,
        completedBookings,
        successRate: parseFloat(successRate.toFixed(2))
      };
    });
    
    res.json(employeePerformance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate customer analytics report
const generateCustomerAnalytics = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { startDate, endDate } = req.query;
    
    let bookingWhereClause = {};
    
    if (startDate || endDate) {
      bookingWhereClause.bk_reqdt = {};
      if (startDate) {
        bookingWhereClause.bk_reqdt[Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        bookingWhereClause.bk_reqdt[Sequelize.Op.lte] = new Date(endDate);
      }
    }
    
    const customers = await Customer.findAll({
      include: [
        {
          model: Booking,
          as: 'customerBookings',
          where: bookingWhereClause,
          attributes: ['bk_bkid', 'bk_total_amount', 'bk_status', 'bk_reqdt']
        }
      ]
    });
    
    const customerAnalytics = customers.map(cust => {
      const bookings = cust.customerBookings || [];
      const totalBookings = bookings.length;
      const totalSpent = bookings.reduce((sum, booking) => sum + (booking.bk_total_amount || 0), 0);
      const completedBookings = bookings.filter(b => b.bk_status === 'COMPLETED').length;
      
      return {
        customerId: cust.cu_usid,
        name: cust.cu_name,
        email: cust.cu_email,
        phone: cust.cu_phone,
        totalBookings,
        totalSpent,
        completedBookings
      };
    });
    
    // Sort by total spent (top spenders)
    customerAnalytics.sort((a, b) => b.totalSpent - a.totalSpent);
    
    res.json(customerAnalytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate corporate customer report
const generateCorporateCustomerReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { startDate, endDate } = req.query;
    
    let bookingWhereClause = {};
    
    if (startDate || endDate) {
      bookingWhereClause.bk_reqdt = {};
      if (startDate) {
        bookingWhereClause.bk_reqdt[Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        bookingWhereClause.bk_reqdt[Sequelize.Op.lte] = new Date(endDate);
      }
    }
    
    const corporateCustomers = await Customer.findAll({
      where: {
        cu_type: 'corporate' // Assuming there's a type field to identify corporate customers
      },
      include: [
        {
          model: Booking,
          as: 'customerBookings',
          where: bookingWhereClause,
          attributes: ['bk_bkid', 'bk_total_amount', 'bk_status', 'bk_reqdt']
        }
      ]
    });
    
    const corporateReport = corporateCustomers.map(corp => {
      const bookings = corp.customerBookings || [];
      const totalBookings = bookings.length;
      const totalSpent = bookings.reduce((sum, booking) => sum + (booking.bk_total_amount || 0), 0);
      const totalPending = corp.cu_credit_limit - corp.cu_credit_used;
      
      return {
        customerId: corp.cu_usid,
        name: corp.cu_name,
        companyName: corp.cu_company_name || corp.cu_name,
        creditLimit: corp.cu_credit_limit,
        creditUsed: corp.cu_credit_used,
        totalBookings,
        totalSpent,
        totalPending
      };
    });
    
    res.json(corporateReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate travel plan report
const generateTravelPlanReport = async (req, res) => {
  try {
    const travelPlanId = req.params.id;
    
    // For now, just return a placeholder response
    // In a real implementation, you would fetch the travel plan by ID and generate a report
    res.json({
      message: 'Travel plan report generated',
      travelPlanId: travelPlanId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download report file
const downloadReport = async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const path = require('path');
    
    // Define reports directory
    const reportsDir = path.join(__dirname, '..', 'reports');
    const filePath = path.join(reportsDir, fileName);
    
    // Check if file exists and send it
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ message: 'Report file not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateFinancialReport,
  generateBookingReport,
  generateEmployeePerformanceReport,
  generateCustomerAnalytics,
  generateCorporateCustomerReport,
  generateTravelPlanReport,
  downloadReport
};