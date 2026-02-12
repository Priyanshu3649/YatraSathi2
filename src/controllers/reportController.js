const models = require('../models');
const { Booking, Payment, Pnr, Customer, Employee, Account, PaymentAlloc, Sequelize } = models;
const { Op } = require('sequelize');
const financialReportService = require('../services/financialReportService');
const { getDateRange, getFinancialYear, getQuarter } = require('../utils/dateRangeUtils');

// ============================================================================
// JESPR REPORTING ENGINE - NEW ENDPOINTS
// ============================================================================

/**
 * Run a report based on configuration
 * POST /api/reports/run
 */
const runReport = async (req, res) => {
  try {
    const {
      reportType,
      periodType = 'MONTHLY',
      startDate,
      endDate,
      filters = {},
      limit = 1000,
      offset = 0
    } = req.body;

    // Validate required fields
    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required'
      });
    }

    // Get date range
    let dateRange;
    if (periodType === 'CUSTOM') {
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required for custom period'
        });
      }
      dateRange = { startDate: new Date(startDate), endDate: new Date(endDate) };
    } else {
      dateRange = getDateRange(periodType, new Date(), { startDate, endDate });
    }

    // Merge filters with date range
    const reportFilters = {
      ...filters,
      ...dateRange,
      limit,
      offset
    };

    // Generate report based on type
    let result;
    switch (reportType) {
      case 'JOURNAL':
        result = await financialReportService.generateJournalReport(reportFilters);
        break;
      case 'SALES':
        result = await financialReportService.generateSalesReport(reportFilters);
        break;
      case 'PURCHASE':
        result = await financialReportService.generatePurchaseReport(reportFilters);
        break;
      case 'RECEIPT':
        result = await financialReportService.generateReceiptReport(reportFilters);
        break;
      case 'PAYMENT':
        result = await financialReportService.generatePaymentReport(reportFilters);
        break;
      case 'OUTSTANDING_RECEIVABLES':
        result = await financialReportService.generateOutstandingReceivablesReport(reportFilters);
        break;
      case 'OUTSTANDING_PAYABLES':
        result = await financialReportService.generateOutstandingPayablesReport(reportFilters);
        break;
      case 'AGING_ANALYSIS':
        result = await financialReportService.generateAgingAnalysisReport(reportFilters);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Invalid report type: ${reportType}`
        });
    }

    // Log report generation
    console.log(`Report generated: ${reportType}`, {
      user: req.user.us_usid,
      recordCount: result.data.length,
      period: `${dateRange.startDate} to ${dateRange.endDate}`
    });

    res.json({
      success: true,
      data: result.data,
      aggregates: result.aggregates,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate report'
    });
  }
};

/**
 * Get report schema (available report types and their fields)
 * GET /api/reports/schema
 */
const getReportSchema = async (req, res) => {
  try {
    const schema = {
      reportTypes: [
        {
          type: 'JOURNAL',
          name: 'Journal Entries',
          description: 'All journal entries with debit and credit details',
          filters: ['branchId', 'status'],
          fields: ['transaction_no', 'transaction_date', 'debit_ledger', 'credit_ledger', 'amount', 'narration']
        },
        {
          type: 'SALES',
          name: 'Sales Report',
          description: 'Sales transactions with customer and booking details',
          filters: ['branchId', 'customerId', 'bookingType', 'status'],
          fields: ['transaction_no', 'customer_name', 'booking_type', 'pnr', 'gross_amount', 'tax', 'net_amount', 'outstanding']
        },
        {
          type: 'PURCHASE',
          name: 'Purchase Report',
          description: 'Purchase transactions with vendor details',
          filters: ['branchId', 'vendorId', 'status'],
          fields: ['transaction_no', 'vendor_name', 'gross_amount', 'tax', 'net_amount', 'outstanding']
        },
        {
          type: 'RECEIPT',
          name: 'Receipt Report',
          description: 'Customer receipts with payment mode breakdown',
          filters: ['branchId', 'customerId', 'paymentMode', 'status'],
          fields: ['transaction_no', 'customer_name', 'amount', 'payment_mode', 'reference_no']
        },
        {
          type: 'PAYMENT',
          name: 'Payment Report',
          description: 'Vendor payments with payment mode breakdown',
          filters: ['branchId', 'vendorId', 'paymentMode', 'status'],
          fields: ['transaction_no', 'vendor_name', 'amount', 'payment_mode', 'reference_no']
        },
        {
          type: 'OUTSTANDING_RECEIVABLES',
          name: 'Outstanding Receivables',
          description: 'Customer outstanding balances',
          filters: ['branchId', 'customerId'],
          fields: ['customer_name', 'total_sales', 'total_receipts', 'outstanding_amount']
        },
        {
          type: 'OUTSTANDING_PAYABLES',
          name: 'Outstanding Payables',
          description: 'Vendor outstanding balances',
          filters: ['branchId', 'vendorId'],
          fields: ['vendor_name', 'total_purchases', 'total_payments', 'outstanding_amount']
        },
        {
          type: 'AGING_ANALYSIS',
          name: 'Aging Analysis',
          description: 'Age-wise breakdown of receivables/payables',
          filters: ['partyType', 'asOfDate'],
          fields: ['party_name', 'bucket_0_30', 'bucket_31_60', 'bucket_61_90', 'bucket_90_plus', 'total']
        }
      ],
      periodTypes: ['DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'],
      paymentModes: ['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'UPI', 'CARD', 'WALLET', 'OTHER'],
      bookingTypes: ['FLIGHT', 'TRAIN', 'HOTEL', 'BUS', 'CAB', 'PACKAGE', 'OTHER'],
      statuses: ['DRAFT', 'POSTED', 'CANCELLED', 'REVERSED']
    };

    res.json({
      success: true,
      data: schema
    });
  } catch (error) {
    console.error('Schema fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch report schema'
    });
  }
};

/**
 * Save report template
 * POST /api/reports/templates
 */
const saveReportTemplate = async (req, res) => {
  try {
    const { name, description, config, isPublic = false } = req.body;

    if (!name || !config) {
      return res.status(400).json({
        success: false,
        message: 'Template name and configuration are required'
      });
    }

    // TODO: Save to report_templates table
    // For now, return success
    res.json({
      success: true,
      message: 'Template saved successfully',
      data: {
        id: Date.now(),
        name,
        description,
        config,
        isPublic,
        createdBy: req.user.us_usid,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Template save error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save template'
    });
  }
};

/**
 * Get user's saved templates
 * GET /api/reports/templates
 */
const getReportTemplates = async (req, res) => {
  try {
    // TODO: Fetch from report_templates table
    // For now, return empty array
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch templates'
    });
  }
};

/**
 * Delete report template
 * DELETE /api/reports/templates/:id
 */
const deleteReportTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Delete from report_templates table
    // For now, return success
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Template delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete template'
    });
  }
};

// ============================================================================
// LEGACY REPORT ENDPOINTS (Keep for backward compatibility)
// ============================================================================

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
  // JESPR Reporting Engine
  runReport,
  getReportSchema,
  saveReportTemplate,
  getReportTemplates,
  deleteReportTemplate,
  
  // Legacy endpoints
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
