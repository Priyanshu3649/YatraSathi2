const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize, sequelizeTVL } = require('../../config/db');
const Customer = require('../models/Customer');
const CustomerTVL = require('../models/CustomerTVL');
const User = require('../models/User');
const UserTVL = require('../models/UserTVL');
const CustomerFinancialService = require('../services/CustomerFinancialService');
const LedgerService = require('../services/LedgerService');
const BillTVL = require('../models/BillTVL');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

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
        firstName,
        lastName,
        email,
        phone,
        password,
        address,
        city,
        state,
        pincode,
        customerType,
        companyName,
        gstNumber,
        creditLimit
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !phone || !password) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'First name, last name, email, phone, and password are required'
        });
      }

      // Check if email or phone already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { us_email: email },
            { us_phone: phone }
          ]
        },
        transaction
      });

      if (existingUser) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: 'User with this email or phone already exists'
        });
      }

      // Generate unique user ID
      const userCount = await User.count({ transaction });
      const userId = `CUS${String(userCount + 1).padStart(5, '0')}`;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user record
      const newUser = await User.create({
        us_usid: userId,
        us_fname: firstName,
        us_lname: lastName,
        us_email: email,
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
        us_pin: pincode
      }, { transaction });

      // Create customer record
      await Customer.create({
        cu_usid: userId,
        cu_custtype: customerType || 'INDIVIDUAL',
        cu_company: companyName,
        cu_gst: gstNumber,
        cu_creditlimit: creditLimit || 0,
        cu_creditused: 0,
        cu_status: 'ACTIVE',
        edtm: new Date(),
        eby: req.user.us_usid,
        mdtm: new Date(),
        mby: req.user.us_usid
      }, { transaction });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        customer: {
          userId,
          firstName,
          lastName,
          email,
          phone
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error: error.message
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
      if (!q) {
        return res.json({ success: true, customers: [] });
      }

      const customers = await Customer.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['us_usid', 'us_fname', 'us_lname', 'us_email', 'us_mobile']
          }
        ],
        where: {
          [Op.or]: [
            { cu_company: { [Op.like]: `%${q}%` } },
            { '$user.us_fname$': { [Op.like]: `%${q}%` } },
            { '$user.us_lname$': { [Op.like]: `%${q}%` } },
            { '$user.us_mobile$': { [Op.like]: `%${q}%` } }
          ]
        },
        limit: 20
      });

      res.json({ success: true, customers });
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
        where: { cu_usid: id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['us_usid', 'us_fname', 'us_lname', 'us_email', 'us_mobile']
          }
        ]
      });

      if (!customer) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }

      res.json({ success: true, customer });
    } catch (error) {
      console.error('Get customer failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Find customer by phone
   * GET /api/employees/customers/phone/:phone
   */
  findCustomerByPhone: async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      const customer = await Customer.findOne({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['us_usid', 'us_fname', 'us_lname', 'us_email', 'us_mobile'],
            where: { us_mobile: phoneNumber }
          }
        ]
      });

      if (!customer) {
        return res.json({ success: true, customer: null });
      }

      res.json({ success: true, customer });
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
              attributes: ['us_usid', 'us_fname', 'us_lname', 'us_email', 'us_mobile']
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
   * Get customer ledger
   * GET /api/customers/:id/ledger
   */
  getCustomerLedger: async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await LedgerService.getCustomerLedger(id, page, limit);
      res.json(result);
    } catch (error) {
      console.error('Customer ledger API failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = customerController;