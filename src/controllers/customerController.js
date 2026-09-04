const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize, sequelizeTVL } = require('../../config/db');
const Customer = require('../models/CustomerTVL');
const CustomerTVL = require('../models/CustomerTVL');
const User = require('../models/UserTVL');
const UserTVL = require('../models/UserTVL');
const CustomerFinancialService = require('../services/CustomerFinancialService');
const LedgerService = require('../services/LedgerService');
const BillTVL = require('../models/BillTVL');
const Payment = require('../models/PaymentTVL');
const Booking = require('../models/Booking');
const ServiceCharge = require('../models/ServiceCharge');

// Helper function to convert string user ID to integer for database compatibility
function convertUserIdToInt(userId) {
  if (!userId) return null;
  if (typeof userId === 'number') return userId;
  if (typeof userId === 'string') {
    const numericPart = userId.match(/\d+/);
    if (numericPart) return parseInt(numericPart[0]);
    return userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000000;
  }
  return null;
}

const customerController = {
  // Create a new customer (admin only)
  createCustomer: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify admin role
      if (!req.user || (req.user.us_usertype !== 'admin' && req.user.us_roid !== 'ADM')) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: 'Admin privileges required' });
      }

      const {
        name,
        phone,
        email: inputEmail,
        creditLimit: inputCreditLimit,
        accountGroup,
        location,
        opBalance,
        workingAddress,
        permanentAddress,
        pincode,
        pin,
        status
      } = req.body;
      
      // Legacy field mappings for compatibility
      const customerType = accountGroup || 'INDIVIDUAL';
      const city = location || '';
      const creditLimit = inputCreditLimit !== undefined && inputCreditLimit !== '' ? parseFloat(inputCreditLimit) : (parseFloat(opBalance) || 0);
      const address = workingAddress || '';
      const state = permanentAddress || '';
      const companyName = name; // fallback
      const gstNumber = '';
      const finalPin = pincode || pin || '';
      
      // Auto-generate dummy email only if none provided
      const email = (inputEmail && inputEmail.trim() !== '') ? inputEmail.trim() : `dummy-${Date.now()}@system.local`;

      if (!name || !name.trim()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Customer Name is mandatory'
        });
      }

      // Split unified name into first and last name
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const { forceCreate } = req.body;

      // Check if email or phone already exists (if provided)
      const orConditions = [];
      if (email && email.trim() !== '' && !email.startsWith('dummy-')) orConditions.push({ us_email: email });
      if (phone && phone.trim() !== '') orConditions.push({ us_phone: phone });

      if (orConditions.length > 0) {
        const existingUser = await User.findOne({
          where: { [Op.or]: orConditions },
          transaction
        });

        if (existingUser) {
          // Check if this existing user is already linked in cuXcustomer
          const existingCustomer = await Customer.findOne({
            where: { cu_usid: existingUser.us_usid },
            transaction
          });

          if (existingCustomer) {
            await transaction.rollback();
            return res.status(409).json({
              success: false,
              message: 'Customer with this email or phone already exists'
            });
          } else {
            // User exists in usXuser but missing in cuXcustomer: Heal and create the link!
            const custCount = await Customer.count({ transaction });
            const cusId = `CU${Date.now().toString().slice(-6)}${String(custCount + 1).padStart(3, '0')}`.slice(0, 15);
            const custNo = `${Math.floor(10000 + Math.random() * 90000)}`;

            await Customer.create({
              cu_cusid: cusId,
              cu_custno: custNo,
              cu_usid: existingUser.us_usid,
              cu_name: name.trim(),
              cu_custtype: customerType || 'INDIVIDUAL',
              us_fname: firstName || existingUser.us_fname,
              us_lname: lastName || existingUser.us_lname,
              us_email: (email && email.trim() !== '') ? email : existingUser.us_email,
              us_phone: (phone && phone.trim() !== '') ? phone : existingUser.us_phone,
              us_addr1: address || existingUser.us_addr1,
              us_city: city || existingUser.us_city,
              us_state: state || existingUser.us_state,
              us_pin: finalPin || existingUser.us_pin,
              cu_creditlimit: creditLimit || 0,
              cu_creditused: 0,
              cu_active: 1,
              status: 'OPEN',
              entered_by: req.user?.us_usid ? parseInt(req.user.us_usid.replace(/\D/g, '')) || 1 : 1,
              modified_by: req.user?.us_usid ? parseInt(req.user.us_usid.replace(/\D/g, '')) || 1 : 1
            }, { transaction });

            await existingUser.update({
              us_fname: firstName || existingUser.us_fname,
              us_lname: lastName || existingUser.us_lname,
              us_email: (email && email.trim() !== '') ? email : existingUser.us_email,
              us_phone: (phone && phone.trim() !== '') ? phone : existingUser.us_phone,
              us_addr1: address || existingUser.us_addr1,
              us_city: city || existingUser.us_city,
              us_state: state || existingUser.us_state,
              us_pin: finalPin || existingUser.us_pin,
              us_limit: creditLimit || existingUser.us_limit
            }, { transaction });

            await transaction.commit();
            return res.status(201).json({
              success: true,
              message: 'Customer profile linked and created successfully',
              customer: {
                userId: existingUser.us_usid,
                firstName: existingUser.us_fname,
                lastName: existingUser.us_lname,
                email: existingUser.us_email,
                phone: existingUser.us_phone
              }
            });
          }
        }
      }

      // Check for duplicate name in cuXcustomer
      const existingCustomerName = await Customer.findOne({
        where: { cu_name: name.trim() },
        transaction
      });

      if (existingCustomerName) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: `A customer named "${name.trim()}" already exists. Customer names must be unique.`
        });
      }

      // Generate unique user ID
      const userCount = await User.count({ transaction });
      const userId = `CUS${String(userCount + 1).padStart(5, '0')}`;
      
      // Auto-generate a dummy email if none provided
      const finalEmail = (email && email.trim() !== '') ? email : `dummy-${userId}@system.local`;
      
      // Auto-generate a password since we removed it from the form
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Create user record
      const newUser = await User.create({
        us_usid: userId,
        us_fname: firstName,
        us_lname: lastName,
        us_email: finalEmail,
        us_phone: phone,
        us_pwd: hashedPassword,
        us_usertype: 'customer',
        us_coid: 'TRV',
        us_roid: 'CUS',
        us_active: true,
        us_eby: req.user.us_usid,
        us_cdtm: new Date(),
        us_mby: req.user.us_usid,
        us_mdtm: new Date(),
        us_addr1: address,
        us_city: city,
        us_state: state,
        us_pin: finalPin
      }, { transaction });

      // Create customer record
      const custCount = await Customer.count({ transaction });
      const cusId = `CU${Date.now().toString().slice(-6)}${String(custCount + 1).padStart(3, '0')}`.slice(0, 15);
      const custNo = `${Math.floor(10000 + Math.random() * 90000)}`;

      await Customer.create({
        cu_cusid: cusId,
        cu_custno: custNo,
        cu_usid: userId,
        cu_name: name.trim(),
        cu_custtype: customerType || 'INDIVIDUAL',
        us_fname: firstName,
        us_lname: lastName,
        us_email: finalEmail,
        us_phone: phone,
        us_pwd: hashedPassword,
        us_addr1: address,
        us_city: city,
        us_state: state,
        us_pin: finalPin,
        cu_gstno: gstNumber,
        cu_creditlimit: creditLimit || 0,
        cu_creditdays: 30,
        cu_discount: 0,
        cu_active: 1,
        status: 'OPEN',
        entered_by: req.user?.us_usid ? parseInt(req.user.us_usid.replace(/\D/g, '')) || 1 : 1,
        modified_by: req.user?.us_usid ? parseInt(req.user.us_usid.replace(/\D/g, '')) || 1 : 1
      }, { transaction });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        customer: {
          userId,
          firstName,
          lastName,
          email: finalEmail,
          phone
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Create customer failed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error: ' + error.message
      });
    }
  },

  /**
   * Search customers
   * GET /api/employees/customers/search
   */
  searchCustomers: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || !q.trim()) {
        return res.json({ success: true, customers: [] });
      }

      const searchTerm = q.trim();
      const tokens = searchTerm.split(/\s+/);

      const whereConditions = [
        { cu_custno: { [Op.like]: `%${searchTerm}%` } },
        { cu_usid: { [Op.like]: `%${searchTerm}%` } },
        { cu_name: { [Op.like]: `%${searchTerm}%` } },
        { us_fname: { [Op.like]: `%${searchTerm}%` } },
        { us_lname: { [Op.like]: `%${searchTerm}%` } },
        { us_phone: { [Op.like]: `%${searchTerm}%` } },
        { us_email: { [Op.like]: `%${searchTerm}%` } }
      ];

      if (tokens.length >= 2) {
        whereConditions.push({
          [Op.and]: [
            { us_fname: { [Op.like]: `%${tokens[0]}%` } },
            { us_lname: { [Op.like]: `%${tokens.slice(1).join(' ')}%` } }
          ]
        });
      }

      const customers = await Customer.findAll({
        where: {
          [Op.or]: whereConditions
        },
        limit: 25
      });

      const formatted = customers.map(c => {
        const data = c.toJSON();
        const fullName = data.cu_name || `${data.us_fname || ''} ${data.us_lname || ''}`.trim() || data.cu_custno;
        return {
          ...data,
          name: fullName,
          customerName: fullName,
          phone: data.us_phone || '',
          email: data.us_email || '',
          user: {
            us_usid: data.cu_usid,
            us_fname: data.us_fname || '',
            us_lname: data.us_lname || '',
            us_email: data.us_email || '',
            us_phone: data.us_phone || ''
          }
        };
      });

      res.json({ success: true, customers: formatted, data: formatted });
    } catch (error) {
      console.error('Search customers failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get customer by ID
   * GET /api/employees/customers/:id
   */
  getCustomerById: async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await Customer.findOne({
        where: {
          [Op.or]: [{ cu_usid: id }, { cu_cusid: id }]
        }
      });

      if (!customer) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }

      const data = customer.toJSON();
      const fullName = data.cu_name || `${data.us_fname || ''} ${data.us_lname || ''}`.trim() || data.cu_custno;
      const formatted = {
        ...data,
        name: fullName,
        customerName: fullName,
        phone: data.us_phone || '',
        email: data.us_email || '',
        user: {
          us_usid: data.cu_usid,
          us_fname: data.us_fname || '',
          us_lname: data.us_lname || '',
          us_email: data.us_email || '',
          us_phone: data.us_phone || ''
        }
      };
      res.json({
        success: true,
        customer: formatted,
        data: formatted
      });
    } catch (error) {
      console.error('Get customer failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Find customer by phone
   * GET /api/employees/customers/phone/:phoneNumber
   */
  findCustomerByPhone: async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      if (!phoneNumber) {
        return res.json({ success: true, customer: null, data: null });
      }

      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const customer = await Customer.findOne({
        where: {
          [Op.or]: [
            { us_phone: phoneNumber },
            { us_phone: cleanPhone },
            { us_phone: { [Op.like]: `%${cleanPhone.slice(-10)}%` } }
          ]
        }
      });

      if (!customer) {
        return res.json({ success: true, customer: null, data: null });
      }

      const data = customer.toJSON();
      const fullName = data.cu_name || `${data.us_fname || ''} ${data.us_lname || ''}`.trim() || data.cu_custno;
      const formatted = {
        ...data,
        name: fullName,
        customerName: fullName,
        phone: data.us_phone || '',
        email: data.us_email || '',
        user: {
          us_usid: data.cu_usid,
          us_fname: data.us_fname || '',
          us_lname: data.us_lname || '',
          us_email: data.us_email || '',
          us_phone: data.us_phone || ''
        }
      };

      res.json({
        success: true,
        customer: formatted,
        data: formatted
      });
    } catch (error) {
      console.error('Find customer by phone failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
  /**
   * Get customer details (aggregate)
   * GET /api/customers/:id/details
   */
  getCustomerDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const errors = [];

      // 1. Fetch Customer
      let customer = null;
      try {
        customer = await Customer.findOne({
          where: { cu_usid: id },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['us_usid', 'us_fname', 'us_lname', 'us_email', 'us_phone']
            }
          ]
        });
        if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
        }
      } catch (error) {
        console.error('Failed to fetch customer:', error);
        errors.push('Failed to fetch customer profile');
      }

      // 2. Financial Summary
      let financialSummary = {};
      try {
        financialSummary = await CustomerFinancialService.getFinancialSummary(id);
      } catch (error) {
        console.error('Failed to fetch financial summary:', error);
        errors.push('Failed to calculate financial summary');
      }

      // 3. Booking Stats
      let bookingStats = {};
      try {
        const totalBookings = await Booking.count({ where: { bk_usid: id } });
        const confirmedBookings = await Booking.count({
          where: { bk_usid: id, bk_status: { [Op.like]: 'Confirmed' } }
        });
        const pendingBookings = await Booking.count({
          where: { bk_usid: id, bk_status: { [Op.like]: 'Pending' } }
        });
        const cancelledBookings = await Booking.count({
          where: { bk_usid: id, bk_status: { [Op.like]: 'Cancelled' } }
        });
        
        bookingStats = { total: totalBookings, confirmed: confirmedBookings, pending: pendingBookings, cancelled: cancelledBookings };
      } catch (error) {
        console.error('Failed to fetch booking stats:', error);
        errors.push('Failed to calculate booking statistics');
      }

      // 4. Billing Stats
      let billingStats = {};
      try {
        const totalBills = await BillTVL.count({ where: { bl_customer_id: id } });
        const cancelledBills = await BillTVL.count({ where: { bl_customer_id: id, is_cancelled: 1 } });
        const activeBills = totalBills - cancelledBills;
        
        billingStats = { total: totalBills, paid: 0, partiallyPaid: 0, unpaid: activeBills, cancelled: cancelledBills };
      } catch (error) {
        console.error('Failed to fetch billing stats:', error);
        errors.push('Failed to calculate billing statistics');
      }

      // 5. Payment Stats
      let paymentStats = {};
      try {
        const totalReceived = (await Payment.findOne({
          attributes: [
            [
              sequelize.fn(
                'COALESCE',
                sequelize.fn('SUM', sequelize.col('py_amount')),
                0
              ),
              'total'
            ]
          ],
          where: { py_customer_id: id }
        }))?.dataValues?.total || 0;
        
        paymentStats = { totalReceived: parseFloat(totalReceived), cash: 0, upi: 0, bank: 0, cheque: 0 };
      } catch (error) {
        console.error('Failed to fetch payment stats:', error);
        errors.push('Failed to calculate payment statistics');
      }

      // 6. Recent Bookings
      let recentBookings = [];
      try {
        recentBookings = await Booking.findAll({
          where: { bk_usid: id },
          order: [['bk_id', 'DESC']],
          limit: 5
        });
      } catch (error) {
        console.error('Failed to fetch recent bookings:', error);
      }

      // 7. Recent Bills
      let recentBills = [];
      try {
        recentBills = await BillTVL.findAll({
          where: { bl_customer_id: id },
          order: [['bl_id', 'DESC']],
          limit: 5
        });
      } catch (error) {
        console.error('Failed to fetch recent bills:', error);
      }

      // 8. Recent Payments
      let recentPayments = [];
      try {
        recentPayments = await Payment.findAll({
          where: { py_customer_id: id },
          order: [['py_id', 'DESC']],
          limit: 5
        });
      } catch (error) {
        console.error('Failed to fetch recent payments:', error);
      }

      // 9. Ledger Preview
      let ledgerPreview = [];
      try {
        const ledgerResult = await LedgerService.getCustomerLedger(id, 1, 10);
        ledgerPreview = ledgerResult.data;
      } catch (error) {
        console.error('Failed to fetch ledger preview:', error);
      }

      res.json({
        customer,
        financialSummary,
        bookingStats,
        billingStats,
        paymentStats,
        recentBookings,
        recentBills,
        recentPayments,
        ledgerPreview,
        errors
      });
    } catch (error) {
      console.error('Customer details API failed:', error);
      res.status(500).json({ error: 'Internal server error', errors: [error.message] });
    }
  },

  /**
   * Get customer ledger (Vintage Ledger format)
   * GET /api/customers/:id/ledger
   */
  getCustomerLedger: async (req, res) => {
    try {
      const { id } = req.params;
      const { fromDate, toDate } = req.query;
      const CustomerLedgerService = require('../services/CustomerLedgerService');
      const result = await CustomerLedgerService.getCustomerVintageLedger(id, fromDate, toDate);
      res.json(result);
    } catch (error) {
      console.error('Customer ledger API failed:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  },

  /**
   * Generate customer ledger PDF
   * GET /api/customers/:id/ledger/pdf
   */
  getCustomerLedgerPdf: async (req, res) => {
    try {
      const { id } = req.params;
      const { fromDate, toDate } = req.query;
      const CustomerLedgerService = require('../services/CustomerLedgerService');
      const ledgerData = await CustomerLedgerService.getCustomerVintageLedger(id, fromDate, toDate);

      if (!ledgerData.success) {
        return res.status(400).json({ error: 'Failed to generate ledger data' });
      }

      const { generateLedgerPDF } = require('../utils/ledgerPdfGenerator');
      const pdfBuffer = await generateLedgerPDF({
        customer: ledgerData.customer,
        entries: ledgerData.entries || [],
        openingBalance: ledgerData.openingBalance || 0,
        closingBalance: ledgerData.closingBalance || 0,
        totals: ledgerData.totals || { debit: 0, credit: 0 },
        summary: ledgerData.summary || {},
        period: { from: fromDate, to: toDate }
      });

      const filename = `ledger_${id}_${fromDate || 'all'}_${toDate || 'all'}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Customer ledger PDF generation failed:', error);
      res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
  }
};

module.exports = customerController;