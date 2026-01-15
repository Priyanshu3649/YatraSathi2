const { MasterPassengerList } = require('../models');

/**
 * Get all master passengers for a customer (mlXmasterlist version)
 */
const getCustomerMasterPassengersML = async (req, res) => {
  try {
    const customerId = req.user.us_usid;
    
    const passengers = await MasterPassengerList.findAll({
      where: {
        ml_cuid: customerId,
        ml_active: 1
      },
      order: [['ml_created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: passengers
    });
  } catch (error) {
    console.error('Get master passengers (ML) error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch master passengers'
    });
  }
};

/**
 * Create a new master passenger (mlXmasterlist version)
 */
const createMasterPassengerML = async (req, res) => {
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
    const passengerId = `ML${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const passenger = await MasterPassengerList.create({
      ml_mlid: passengerId,
      ml_cuid: customerId,
      ml_firstname: firstName,
      ml_lastname: lastName || null,
      ml_age: parseInt(age),
      ml_gender: gender,
      ml_berthpref: berthPreference || null,
      ml_idtype: idType || null,
      ml_idnumber: idNumber || null,
      ml_aadhaar: aadhaar || null,
      ml_active: 1,
      ml_created_by: customerId,
      ml_modified_by: customerId
    });
    
    res.status(201).json({
      success: true,
      message: 'Master passenger created successfully',
      data: passenger
    });
  } catch (error) {
    console.error('Create master passenger (ML) error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create master passenger'
    });
  }
};

/**
 * Update a master passenger (mlXmasterlist version)
 */
const updateMasterPassengerML = async (req, res) => {
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
    const passenger = await MasterPassengerList.findOne({
      where: {
        ml_mlid: id,
        ml_cuid: customerId
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
    if (firstName !== undefined) updateData.ml_firstname = firstName;
    if (lastName !== undefined) updateData.ml_lastname = lastName;
    if (age !== undefined) updateData.ml_age = parseInt(age);
    if (gender !== undefined) updateData.ml_gender = gender;
    if (berthPreference !== undefined) updateData.ml_berthpref = berthPreference;
    if (idType !== undefined) updateData.ml_idtype = idType;
    if (idNumber !== undefined) updateData.ml_idnumber = idNumber;
    if (aadhaar !== undefined) updateData.ml_aadhaar = aadhaar;
    if (active !== undefined) updateData.ml_active = active ? 1 : 0;
    
    updateData.ml_modified_by = customerId;
    
    await passenger.update(updateData);
    
    res.json({
      success: true,
      message: 'Master passenger updated successfully',
      data: passenger
    });
  } catch (error) {
    console.error('Update master passenger (ML) error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update master passenger'
    });
  }
};

/**
 * Delete (deactivate) a master passenger (mlXmasterlist version)
 */
const deleteMasterPassengerML = async (req, res) => {
  try {
    const customerId = req.user.us_usid;
    const { id } = req.params;
    
    // Find the passenger
    const passenger = await MasterPassengerList.findOne({
      where: {
        ml_mlid: id,
        ml_cuid: customerId
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
      ml_active: 0,
      ml_modified_by: customerId
    });
    
    res.json({
      success: true,
      message: 'Master passenger deactivated successfully'
    });
  } catch (error) {
    console.error('Delete master passenger (ML) error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to deactivate master passenger'
    });
  }
};

/**
 * Get a single master passenger (mlXmasterlist version)
 */
const getMasterPassengerByIdML = async (req, res) => {
  try {
    const customerId = req.user.us_usid;
    const { id } = req.params;
    
    const passenger = await MasterPassengerList.findOne({
      where: {
        ml_mlid: id,
        ml_cuid: customerId,
        ml_active: 1
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
    console.error('Get master passenger (ML) error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch master passenger'
    });
  }
};

module.exports = {
  getCustomerMasterPassengersML,
  createMasterPassengerML,
  updateMasterPassengerML,
  deleteMasterPassengerML,
  getMasterPassengerByIdML
};