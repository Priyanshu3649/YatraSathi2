const { CustomerMasterPassenger } = require('../models');

/**
 * Get all master passengers for a customer
 */
const getCustomerMasterPassengers = async (req, res) => {
  try {
    const customerId = req.user.us_usid;
    
    const passengers = await CustomerMasterPassenger.findAll({
      where: {
        cmp_cuid: customerId,
        cmp_active: 1
      },
      order: [['cmp_created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: passengers
    });
  } catch (error) {
    console.error('Get master passengers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch master passengers'
    });
  }
};

/**
 * Create a new master passenger
 */
const createMasterPassenger = async (req, res) => {
  try {
    const customerId = req.user.us_usid;
    const {
      firstName,
      lastName,
      age,
      gender,
      berthPreference,
      idType,
      idNumber,
      aadhaar
    } = req.body;
    
    // Validate required fields
    if (!firstName || !age || !gender) {
      return res.status(400).json({
        success: false,
        message: 'First name, age, and gender are required'
      });
    }
    
    // Generate passenger ID
    const passengerId = `CMP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const passenger = await CustomerMasterPassenger.create({
      cmp_cmpid: passengerId,
      cmp_cuid: customerId,
      cmp_firstname: firstName,
      cmp_lastname: lastName || null,
      cmp_age: parseInt(age),
      cmp_gender: gender,
      cmp_berthpref: berthPreference || null,
      cmp_idtype: idType || null,
      cmp_idnumber: idNumber || null,
      cmp_aadhaar: aadhaar || null,
      cmp_active: 1,
      cmp_created_by: customerId,
      cmp_modified_by: customerId
    });
    
    res.status(201).json({
      success: true,
      message: 'Master passenger created successfully',
      data: passenger
    });
  } catch (error) {
    console.error('Create master passenger error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create master passenger'
    });
  }
};

/**
 * Update a master passenger
 */
const updateMasterPassenger = async (req, res) => {
  try {
    const customerId = req.user.us_usid;
    const { id } = req.params;
    const {
      firstName,
      lastName,
      age,
      gender,
      berthPreference,
      idType,
      idNumber,
      aadhaar,
      active
    } = req.body;
    
    // Find the passenger
    const passenger = await CustomerMasterPassenger.findOne({
      where: {
        cmp_cmpid: id,
        cmp_cuid: customerId
      }
    });
    
    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: 'Master passenger not found'
      });
    }
    
    // Update passenger data
    const updateData = {};
    if (firstName !== undefined) updateData.cmp_firstname = firstName;
    if (lastName !== undefined) updateData.cmp_lastname = lastName;
    if (age !== undefined) updateData.cmp_age = parseInt(age);
    if (gender !== undefined) updateData.cmp_gender = gender;
    if (berthPreference !== undefined) updateData.cmp_berthpref = berthPreference;
    if (idType !== undefined) updateData.cmp_idtype = idType;
    if (idNumber !== undefined) updateData.cmp_idnumber = idNumber;
    if (aadhaar !== undefined) updateData.cmp_aadhaar = aadhaar;
    if (active !== undefined) updateData.cmp_active = active ? 1 : 0;
    
    updateData.cmp_modified_by = customerId;
    
    await passenger.update(updateData);
    
    res.json({
      success: true,
      message: 'Master passenger updated successfully',
      data: passenger
    });
  } catch (error) {
    console.error('Update master passenger error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update master passenger'
    });
  }
};

/**
 * Delete (deactivate) a master passenger
 */
const deleteMasterPassenger = async (req, res) => {
  try {
    const customerId = req.user.us_usid;
    const { id } = req.params;
    
    // Find the passenger
    const passenger = await CustomerMasterPassenger.findOne({
      where: {
        cmp_cmpid: id,
        cmp_cuid: customerId
      }
    });
    
    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: 'Master passenger not found'
      });
    }
    
    // Soft delete by setting active to 0
    await passenger.update({
      cmp_active: 0,
      cmp_modified_by: customerId
    });
    
    res.json({
      success: true,
      message: 'Master passenger deactivated successfully'
    });
  } catch (error) {
    console.error('Delete master passenger error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to deactivate master passenger'
    });
  }
};

/**
 * Get a single master passenger
 */
const getMasterPassengerById = async (req, res) => {
  try {
    const customerId = req.user.us_usid;
    const { id } = req.params;
    
    const passenger = await CustomerMasterPassenger.findOne({
      where: {
        cmp_cmpid: id,
        cmp_cuid: customerId,
        cmp_active: 1
      }
    });
    
    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: 'Master passenger not found'
      });
    }
    
    res.json({
      success: true,
      data: passenger
    });
  } catch (error) {
    console.error('Get master passenger error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch master passenger'
    });
  }
};

module.exports = {
  getCustomerMasterPassengers,
  createMasterPassenger,
  updateMasterPassenger,
  deleteMasterPassenger,
  getMasterPassengerById
};