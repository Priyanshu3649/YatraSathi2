const { User, CorporateCustomer, Booking, Payment, Sequelize } = require('../models');

// Get all customers (admin only)
const getAllCustomers = async (req, res) => {
  try {
    // Only admin can get all customers
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const customers = await User.findAll({ 
      where: { us_usertype: 'customer' },
      order: [['edtm', 'DESC']]
    });
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get customer by ID (admin only)
const getCustomerById = async (req, res) => {
  try {
    // Only admin can get customer details
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const customer = await User.findByPk(req.params.id);
    
    if (!customer || customer.us_usertype !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create customer (admin only)
const createCustomer = async (req, res) => {
  try {
    // Only admin can create customers
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const {
      name,
      email,
      phone,
      password,
      customerType,
      companyName,
      gstNumber,
      panNumber,
      creditLimit,
      aadhaarNumber
    } = req.body;
    
    // Check if customer already exists
    const existingCustomer = await User.findOne({ 
      where: {
        [Sequelize.Op.or]: [
          { us_email: email },
          { us_phone: phone },
          { us_aadhaar: aadhaarNumber }
        ]
      }
    });
    
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this email, phone, or aadhaar already exists' });
    }
    
    // Create new customer
    const customer = await User.create({
      us_fname: name,
      us_email: email,
      us_phone: phone,
      us_passwd: password,
      us_aadhaar: aadhaarNumber,
      us_usertype: 'customer',
      us_customer_type: customerType,
      us_company_name: customerType === 'corporate' ? companyName : null,
      us_active: 1,
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    
    // If corporate customer, create corporate customer record
    if (customerType === 'corporate') {
      await CorporateCustomer.create({
        cc_cuid: customer.us_usid,
        cc_company_name: companyName,
        cc_gst_number: gstNumber,
        cc_pan_number: panNumber,
        cc_credit_limit: creditLimit || 0,
        eby: req.user.us_usid,
        mby: req.user.us_usid
      });
    }
    
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update customer (admin only)
const updateCustomer = async (req, res) => {
  try {
    // Only admin can update customers
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const customer = await User.findByPk(req.params.id);
    
    if (!customer || customer.us_usertype !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const {
      name,
      email,
      phone,
      customerType,
      companyName,
      aadhaarNumber,
      isActive
    } = req.body;
    
    // Update fields if provided
    if (name) customer.us_fname = name;
    if (email) customer.us_email = email;
    if (phone) customer.us_phone = phone;
    if (customerType) customer.us_customer_type = customerType;
    if (companyName) customer.us_company_name = companyName;
    if (aadhaarNumber) customer.us_aadhaar = aadhaarNumber;
    if (isActive !== undefined) customer.us_active = isActive ? 1 : 0;
    
    customer.mby = req.user.us_usid;
    const updatedCustomer = await customer.save();
    
    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete customer (admin only)
const deleteCustomer = async (req, res) => {
  try {
    // Only admin can delete customers
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const customer = await User.findByPk(req.params.id);
    
    if (!customer || customer.us_usertype !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Delete associated corporate customer record if exists
    await CorporateCustomer.destroy({ where: { cc_cuid: customer.us_usid } });
    
    await customer.destroy();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get customer's bookings
const getCustomerBookings = async (req, res) => {
  try {
    // Check if user is customer or admin
    if (req.user.us_usertype !== 'customer' && req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // If customer, they can only see their own bookings
    // If admin, they can see all bookings or a specific customer's bookings
    const customerId = req.user.us_usertype === 'customer' 
      ? req.user.us_usid 
      : req.params.customerId || req.user.us_usid;
    
    const bookings = await Booking.findAll({ 
      where: { bk_cuid: customerId },
      order: [['edtm', 'DESC']]
    });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get customer's payments
const getCustomerPayments = async (req, res) => {
  try {
    // Check if user is customer or admin
    if (req.user.us_usertype !== 'customer' && req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // If customer, they can only see their own payments
    // If admin, they can see all payments or a specific customer's payments
    const customerId = req.user.us_usertype === 'customer' 
      ? req.user.us_usid 
      : req.params.customerId || req.user.us_usid;
    
    const payments = await Payment.findAll({ 
      where: { py_cuid: customerId },
      order: [['edtm', 'DESC']]
    });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get corporate customer details
const getCorporateCustomerDetails = async (req, res) => {
  try {
    // Check if user is customer or admin
    if (req.user.us_usertype !== 'customer' && req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // If customer, they can only see their own corporate details
    // If admin, they can see all corporate details or a specific customer's details
    const customerId = req.user.us_usertype === 'customer' 
      ? req.user.us_usid 
      : req.params.customerId || req.user.us_usid;
    
    const corporateDetails = await CorporateCustomer.findOne({ 
      where: { cc_cuid: customerId }
    });
    
    if (!corporateDetails) {
      return res.status(404).json({ message: 'Corporate customer details not found' });
    }
    
    res.json(corporateDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerBookings,
  getCustomerPayments,
  getCorporateCustomerDetails
};