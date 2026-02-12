const models = require('../models');
const { Booking, Payment, Pnr, Customer, Employee, Account, PaymentAlloc, Sequelize } = models;
const { Op } = require('sequelize');

// Generate customer-specific reports
const generateCustomerSpecificReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const Bill = models.BillTVL;
    console.log('Bill model:', Bill);
    console.log('Bill.findAll type:', typeof Bill.findAll);
    
    const { customerId, startDate, endDate } = req.query;
    
    let whereClause = {};
    if (customerId) {
      whereClause.bk_customerid = customerId;
    }
    
    if (startDate || endDate) {
      whereClause.bk_reqdt = {};
      if (startDate) {
        whereClause.bk_reqdt[Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.bk_reqdt[Sequelize.Op.lte] = new Date(endDate);
      }
    }
    
    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          attributes: ['cu_usid', 'cu_custno', 'cu_custtype']
        },
        {
          model: models.User,
          as: 'customer',
          attributes: ['us_fname', 'us_lname', 'us_phone', 'us_email'],
          required: false
        }
      ]
    });
    
    const customerReport = bookings.map(booking => ({
      customerId: booking.customer?.cu_usid || booking.bk_usid,
      customerName: `${booking.customer?.us_fname || ''} ${booking.customer?.us_lname || ''}`.trim() || booking.bk_customername,
      email: booking.customer?.us_email || '',
      phone: booking.customer?.us_phone || '',
      bookingId: booking.bk_bkid,
      bookingDate: booking.bk_reqdt,
      travelDate: booking.bk_trvldt,
      fromStation: booking.bk_fromst,
      toStation: booking.bk_tost,
      class: booking.bk_class,
      status: booking.bk_status,
      amount: booking.bk_total_amount,
      totalBookings: bookings.length,
      totalAmount: bookings.reduce((sum, b) => sum + (parseFloat(b.bk_total_amount) || 0), 0)
    }));
    
    res.json(customerReport);
  } catch (error) {
    console.error('Customer report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate employee performance reports
const generateEmployeePerformanceReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const employees = await Employee.findAll({
      include: [{
        model: models.User,
        attributes: ['us_fname', 'us_lname'],
        required: false
      }]
    });
    
    const performanceData = employees.map(emp => ({
      employeeId: emp.em_usid,
      name: `${emp.user?.us_fname || ''} ${emp.user?.us_lname || ''}`.trim() || `Employee ${emp.em_usid}`,
      department: emp.em_dept,
      designation: emp.em_desig,
      totalBookings: Math.floor(Math.random() * 100),
      confirmedBookings: Math.floor(Math.random() * 80),
      successRate: Math.floor(Math.random() * 100),
      totalRevenue: (Math.random() * 500000).toFixed(2)
    }));
    
    res.json(performanceData);
  } catch (error) {
    console.error('Employee performance report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate financial reports
const generateFinancialReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const accounts = await Account.findAll();
    
    const financialData = accounts.map(acc => ({
      accountId: acc.ac_acid,
      accountName: acc.ac_name,
      creditAmount: parseFloat(acc.ac_credit || 0).toFixed(2),
      debitAmount: parseFloat(acc.ac_debit || 0).toFixed(2),
      balance: (parseFloat(acc.ac_credit || 0) - parseFloat(acc.ac_debit || 0)).toFixed(2),
      transactionDate: new Date().toISOString().split('T')[0],
      reference: `REF-${acc.ac_acid}`,
      description: `Account ${acc.ac_name}`
    }));
    
    res.json(financialData);
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate corporate customer reports
const generateCorporateCustomerReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const customers = await Customer.findAll({
      where: { cu_type: 'corporate' }
    });
    
    const corporateData = customers.map(cust => ({
      customerId: cust.cu_usid,
      customerName: cust.cu_name,
      email: cust.cu_email,
      phone: cust.cu_phone,
      totalBookings: Math.floor(Math.random() * 50),
      totalSpent: (Math.random() * 1000000).toFixed(2),
      lastBooking: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
    
    res.json(corporateData);
  } catch (error) {
    console.error('Corporate customer report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate booking reports
const generateBookingReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin' && req.user.us_usertype !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { startDate, endDate, status } = req.query;
    
    let whereClause = {};
    if (status) {
      whereClause.bk_status = status;
    }
    if (startDate || endDate) {
      whereClause.bk_reqdt = {};
      if (startDate) {
        whereClause.bk_reqdt[Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.bk_reqdt[Sequelize.Op.lte] = new Date(endDate);
      }
    }
    
    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          attributes: ['cu_name', 'cu_phone']
        },
        {
          model: Employee,
          attributes: ['em_usid'],
          include: [{
            model: User,
            attributes: ['us_fname', 'us_lname']
          }]
        }
      ]
    });
    
    const bookingData = bookings.map(booking => ({
      bookingId: booking.bk_bkid,
      customerName: booking.customer?.cu_name || booking.bk_customername,
      fromStation: booking.bk_fromst,
      toStation: booking.bk_tost,
      travelDate: booking.bk_trvldt,
      class: booking.bk_class,
      status: booking.bk_status,
      amount: parseFloat(booking.bk_total_amount || 0).toFixed(2),
      agent: `${booking.employee?.user?.us_fname || ''} ${booking.employee?.user?.us_lname || ''}`.trim()
    }));
    
    res.json(bookingData);
  } catch (error) {
    console.error('Booking report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate travel plan reports
const generateTravelPlanReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock travel plan data
    const travelPlan = {
      id: id,
      customerName: 'John Doe',
      destinations: ['Delhi', 'Mumbai', 'Bangalore'],
      startDate: '2024-01-15',
      endDate: '2024-01-25',
      budget: '50000',
      status: 'Active'
    };
    
    res.json(travelPlan);
  } catch (error) {
    console.error('Travel plan report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download reports
const downloadReport = async (req, res) => {
  try {
    const { fileName } = req.params;
    // Mock file download
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(`Report content for ${fileName}`);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate customer analytics
const generateCustomerAnalytics = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Mock analytics data
    const analytics = {
      totalCustomers: 1250,
      activeCustomers: 890,
      newCustomers: 45,
      avgBookingValue: 2500,
      customerRetention: 78.5
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate time period reports
const generateTimePeriodReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const reportType = req.path.split('/').pop();
    
    // Mock time period data
    const timeData = [{
      period: reportType.charAt(0).toUpperCase() + reportType.slice(1),
      totalBookings: Math.floor(Math.random() * 1000),
      totalRevenue: (Math.random() * 5000000).toFixed(2),
      avgBookingValue: (Math.random() * 5000).toFixed(2),
      confirmedBookings: Math.floor(Math.random() * 800),
      pendingBookings: Math.floor(Math.random() * 150),
      cancelledBookings: Math.floor(Math.random() * 50)
    }];
    
    res.json(timeData);
  } catch (error) {
    console.error('Time period report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate financial statement reports
const generateFinancialStatementReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const reportType = req.path.split('/').pop();
    
    // Mock financial data
    const financialData = [{
      accountId: `ACC-${Math.floor(Math.random() * 1000)}`,
      accountName: `${reportType} Account`,
      creditAmount: reportType === 'credit' || reportType === 'combined' ? (Math.random() * 100000).toFixed(2) : '0.00',
      debitAmount: reportType === 'debit' || reportType === 'combined' ? (Math.random() * 50000).toFixed(2) : '0.00',
      balance: ((Math.random() * 100000) - (Math.random() * 50000)).toFixed(2),
      transactionDate: new Date().toISOString().split('T')[0],
      reference: `FIN-${reportType.toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} transaction`
    }];
    
    res.json(financialData);
  } catch (error) {
    console.error('Financial statement report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate booking summary reports
const generateBookingSummaryReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Mock booking summary data
    const summaryData = [{
      bookingId: `BK-${Math.floor(Math.random() * 10000)}`,
      customerName: 'Sample Customer',
      fromStation: 'DEL',
      toStation: 'MUM',
      travelDate: new Date().toISOString().split('T')[0],
      class: 'AC',
      status: 'CONFIRMED',
      amount: (Math.random() * 5000).toFixed(2),
      agent: 'AGENT001'
    }];
    
    res.json(summaryData);
  } catch (error) {
    console.error('Booking summary report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate billing reports
const generateBillingReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const Bill = models.BillTVL;
    
    const bills = await Bill.findAll({
      limit: 50
    });
    
    const billingData = bills.map(bill => ({
      billId: bill.bi_biid,
      customerName: bill.bi_customer_name,
      bookingId: bill.bi_booking_id,
      billDate: bill.bi_bill_date,
      dueDate: bill.bi_due_date,
      grossAmount: parseFloat(bill.bi_gross_amount || 0).toFixed(2),
      taxAmount: parseFloat(bill.bi_tax_amount || 0).toFixed(2),
      netAmount: parseFloat(bill.bi_net_amount || 0).toFixed(2),
      status: bill.bi_status
    }));
    
    res.json(billingData);
  } catch (error) {
    console.error('Billing report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate payment reports
const generatePaymentReport = async (req, res) => {
  try {
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const payments = await Payment.findAll({
      limit: 50,
      include: [{
        model: Account,
        attributes: ['ac_name']
      }]
    });
    
    const paymentData = payments.map(payment => ({
      paymentId: payment.pt_ptid,
      customerName: payment.account?.ac_name || 'Unknown Customer',
      bookingId: payment.pt_bkid,
      paymentDate: payment.pt_date,
      paymentMode: payment.pt_mode,
      amount: parseFloat(payment.pt_amount || 0).toFixed(2),
      status: payment.pt_status,
      reference: payment.pt_ref
    }));
    
    res.json(paymentData);
  } catch (error) {
    console.error('Payment report error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateCustomerSpecificReport,
  generateEmployeePerformanceReport,
  generateFinancialReport,
  generateCorporateCustomerReport,
  generateBookingReport,
  generateTravelPlanReport,
  downloadReport,
  generateCustomerAnalytics,
  generateTimePeriodReport,
  generateFinancialStatementReport,
  generateBookingSummaryReport,
  generateBillingReport,
  generatePaymentReport
};
