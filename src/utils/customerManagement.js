/**
 * Customer Management Utility
 * Handles automatic customer creation and lookup by name + phone combination
 */

const { sequelizeTVL } = require('../../config/db');
const CustomerTVL = require('../models/CustomerTVL');
const UserTVL = require('../models/UserTVL');

/**
 * Generate unique Customer ID
 * Format: CU + random 13-digit number
 */
const generateCustomerId = () => {
  const randomNum = Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0');
  return `CU${randomNum}`;
};

/**
 * Generate unique Customer Number
 * Format: CUST + timestamp + random 4 digits
 */
const generateCustomerNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CUST${timestamp}${random}`;
};

/**
 * Generate unique User ID for customer
 * Format: US + random 13-digit number
 */
const generateUserId = () => {
  const randomNum = Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0');
  return `US${randomNum}`;
};

/**
 * Generate unique email for customer (since it's required)
 * Format: customer_{timestamp}_{randomnum}@phone.customer
 */
const generateCustomerEmail = (phone) => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `customer_${phone}_${random}@phone.customer`;
};

/**
 * Find customer by name and phone combination
 * Returns existing customer or null if not found
 */
const findCustomerByNameAndPhone = async (name, phone) => {
  try {
    // Clean phone number (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '');

    // Query to find customer by phone (phone is more unique)
    // Then verify name matches (case-insensitive)
    const customer = await CustomerTVL.findOne({
      where: sequelizeTVL.where(
        sequelizeTVL.fn('REPLACE', sequelizeTVL.col('us_phone'), /\D/g, ''),
        '=',
        cleanPhone
      ),
      include: [{
        model: UserTVL,
        as: 'user',
        attributes: ['us_usid', 'us_fname', 'us_lname', 'us_phone', 'us_email']
      }]
    });

    // Verify name matches if customer found
    if (customer && customer.user) {
      const fullName = `${customer.user.us_fname || ''} ${customer.user.us_lname || ''}`.trim().toLowerCase();
      const searchName = (name || '').toLowerCase();
      
      // Match if full name contains search name or vice versa (partial match)
      if (fullName.includes(searchName) || searchName.includes(fullName) || fullName === searchName) {
        return customer;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding customer by name and phone:', error.message);
    return null;
  }
};

/**
 * Create a new customer with phone and name
 * Automatically creates associated User record
 */
const createCustomerWithNameAndPhone = async (name, phone, createdByUserId) => {
  const transaction = await sequelizeTVL.transaction();

  try {
    // Validate input
    if (!name || !phone) {
      throw new Error('Customer name and phone are required');
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      throw new Error('Invalid phone number length (10-15 digits required)');
    }

    // Generate IDs and unique fields
    const userId = generateUserId();
    const customerId = generateCustomerId();
    const customerNumber = generateCustomerNumber();
    const email = generateCustomerEmail(cleanPhone);

    // Extract first and last name
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    console.log(`Creating new customer: ${name} (${phone})`);
    console.log(`  Generated IDs: userId=${userId}, customerId=${customerId}`);

    // 1. Create User record first (required by Customer FK)
    const user = await UserTVL.create({
      us_usid: userId,
      us_email: email,
      us_usname: name,
      us_fname: firstName,
      us_lname: lastName,
      us_phone: cleanPhone,
      us_usertype: 'customer',
      us_roid: 'CUS',
      us_active: 1,
      us_eby: createdByUserId || 'SYSTEM',
      us_edtm: new Date()
    }, { transaction });

    console.log(`✓ User created: ${userId}`);

    // 2. Create Customer record linked to User
    const customer = await CustomerTVL.create({
      cu_cusid: customerId,
      cu_usid: userId,
      cu_custno: customerNumber,
      cu_custtype: 'INDIVIDUAL',
      cu_active: 1,
      entered_by: createdByUserId ? parseInt(createdByUserId.replace(/\D/g, '')) || 1 : 1,
      entered_on: new Date()
    }, { transaction, userId: createdByUserId });

    console.log(`✓ Customer created: ${customerId}`);

    // Commit transaction
    await transaction.commit();

    // Return the created customer with user details
    const createdCustomer = await CustomerTVL.findByPk(customerId, {
      include: [{
        model: UserTVL,
        as: 'user',
        attributes: ['us_usid', 'us_fname', 'us_lname', 'us_phone', 'us_email']
      }]
    });

    console.log(`✓ Customer record successfully created and linked`);
    return createdCustomer;

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating customer:', error.message);
    throw error;
  }
};

/**
 * Get or create customer
 * Checks if customer exists by name+phone combination
 * If not found, creates new customer
 * Returns customer object
 */
const getOrCreateCustomer = async (name, phone, createdByUserId) => {
  try {
    // First, try to find existing customer
    let customer = await findCustomerByNameAndPhone(name, phone);

    if (customer) {
      console.log(`✓ Found existing customer: ${customer.cu_cusid}`);
      return customer;
    }

    // Customer doesn't exist, create new one
    console.log(`Customer not found, creating new customer for: ${name} (${phone})`);
    customer = await createCustomerWithNameAndPhone(name, phone, createdByUserId);

    return customer;

  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error.message);
    throw error;
  }
};

/**
 * Link payment to customer
 * Updates payment record with customer ID
 */
const linkPaymentToCustomer = async (payment, customer) => {
  try {
    if (!payment || !customer) {
      throw new Error('Payment and customer are required');
    }

    // Update payment with customer ID
    payment.py_cusid = customer.cu_cusid;
    await payment.save();

    console.log(`✓ Payment ${payment.py_entry_no} linked to customer ${customer.cu_cusid}`);
    return payment;

  } catch (error) {
    console.error('Error linking payment to customer:', error.message);
    throw error;
  }
};

module.exports = {
  findCustomerByNameAndPhone,
  createCustomerWithNameAndPhone,
  getOrCreateCustomer,
  linkPaymentToCustomer,
  generateCustomerId,
  generateCustomerNumber,
  generateUserId,
  generateCustomerEmail
};
