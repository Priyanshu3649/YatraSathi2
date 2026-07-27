const { MasterPassengerTVL, CustomerTVL } = require('../models');
const { Op } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

// Generate unique master passenger ID
const generateMasterPassengerId = async () => {
  const lastPassenger = await MasterPassengerTVL.findOne({
    order: [['mp_mpid', 'DESC']],
    raw: true
  });
  
  if (!lastPassenger) {
    return 'MP00001';
  }
  
  const numPart = parseInt(lastPassenger.mp_mpid.substring(2)) || 0;
  return 'MP' + String(numPart + 1).padStart(5, '0');
};

const masterPassengerController = {
  /**
   * GET /api/master-passengers
   * Get all master passengers for logged-in customer
   */
  getAllMasterPassengers: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const userEmail = req.user.us_email;

      // Fetch all active master passengers for this user's email
      const passengers = await MasterPassengerTVL.findAll({
        where: { 
          mp_email: userEmail,
          mp_active: 1
        },
        order: [['edtm', 'DESC']],
        raw: true
      });

      res.json({
        success: true,
        data: passengers.map(p => ({
          id: p.mp_mpid,
          name: p.mp_name,
          dateOfBirth: p.mp_dob,
          gender: p.mp_gender,
          birthPreference: p.mp_birthpref,
          createdAt: p.edtm,
          updatedAt: p.mdtm
        }))
      });
    } catch (error) {
      console.error('Get master passengers error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/master-passengers/:id
   * Get single master passenger by ID
   */
  getMasterPassengerById: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const userEmail = req.user.us_email;

      const passenger = await MasterPassengerTVL.findOne({
        where: { 
          mp_mpid: id,
          mp_email: userEmail
        },
        raw: true
      });

      if (!passenger) {
        return res.status(404).json({ success: false, error: 'Master passenger not found' });
      }

      res.json({
        success: true,
        data: {
          id: passenger.mp_mpid,
          name: passenger.mp_name,
          dateOfBirth: passenger.mp_dob,
          gender: passenger.mp_gender,
          birthPreference: passenger.mp_birthpref,
          createdAt: passenger.edtm,
          updatedAt: passenger.mdtm
        }
      });
    } catch (error) {
      console.error('Get master passenger error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * POST /api/master-passengers
   * Create new master passenger
   */
  createMasterPassenger: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { name, dateOfBirth, age, gender, berthPreference, ...extraneousFields } = req.body;
      const userEmail = req.user.us_email;
      const userId = req.user.us_usid;

      // Strict validation: Reject unauthorized fields
      if (Object.keys(extraneousFields).length > 0) {
        console.log('400 ERROR: Extraneous fields:', extraneousFields);
        return res.status(400).json({ success: false, error: 'Unauthorized fields in payload' });
      }

      // Validate required fields (Name, Gender, and either DOB or Age)
      if (!name || (!dateOfBirth && !age) || !gender) {
        console.log('400 ERROR: Missing fields. name:', name, 'dob:', dateOfBirth, 'age:', age, 'gender:', gender);
        return res.status(400).json({
          success: false,
          error: 'Name, Gender, and either Date of Birth or Age are required'
        });
      }

      // Calculate DOB from age if not provided
      let dobToSave = dateOfBirth;
      if (!dobToSave && age) {
        const d = new Date();
        d.setFullYear(d.getFullYear() - parseInt(age));
        dobToSave = d.toISOString().split('T')[0];
      }

      // Validate gender
      if (!['M', 'F', 'O'].includes(gender)) {
        return res.status(400).json({
          success: false,
          error: 'Gender must be M, F, or O'
        });
      }

      // Generate ID
      const mpId = await generateMasterPassengerId();

      // Create master passenger
      const passenger = await MasterPassengerTVL.create({
        mp_mpid: mpId,
        mp_usid: userId,
        mp_email: userEmail,
        mp_name: name,
        mp_dob: dobToSave,
        mp_gender: gender,
        mp_birthpref: berthPreference || null,
        mp_active: 1,
        eby: userId,
        mby: userId
      });

      res.status(201).json({
        success: true,
        message: 'Master passenger created successfully',
        data: {
          id: passenger.mp_mpid,
          name: passenger.mp_name,
          dateOfBirth: passenger.mp_dob,
          gender: passenger.mp_gender,
          birthPreference: passenger.mp_birthpref,
          createdAt: passenger.edtm
        }
      });
    } catch (error) {
      console.error('Create master passenger error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * PUT /api/master-passengers/:id
   * Update master passenger
   */
  updateMasterPassenger: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { name, dateOfBirth, age, gender, berthPreference, ...extraneousFields } = req.body;
      const userEmail = req.user.us_email;
      const userId = req.user.us_usid;

      if (Object.keys(extraneousFields).length > 0) {
        return res.status(400).json({ success: false, error: 'Unauthorized fields in payload' });
      }

      // Check if passenger exists and belongs to this user via email
      const passenger = await MasterPassengerTVL.findOne({
        where: { 
          mp_mpid: id,
          mp_email: userEmail
        }
      });

      if (!passenger) {
        return res.status(404).json({ success: false, error: 'Master passenger not found' });
      }

      // Validate gender if provided
      if (gender && !['M', 'F', 'O'].includes(gender)) {
        return res.status(400).json({
          success: false,
          error: 'Gender must be M, F, or O'
        });
      }

      // Update fields
      if (name) passenger.mp_name = name;
      if (dateOfBirth) {
        passenger.mp_dob = dateOfBirth;
      } else if (age) {
        const d = new Date();
        d.setFullYear(d.getFullYear() - parseInt(age));
        passenger.mp_dob = d.toISOString().split('T')[0];
      }
      if (gender) passenger.mp_gender = gender;
      if (berthPreference !== undefined) passenger.mp_birthpref = berthPreference;
      passenger.mby = userId;

      await passenger.save();

      res.json({
        success: true,
        message: 'Master passenger updated successfully',
        data: {
          id: passenger.mp_mpid,
          name: passenger.mp_name,
          dateOfBirth: passenger.mp_dob,
          gender: passenger.mp_gender,
          birthPreference: passenger.mp_birthpref,
          updatedAt: passenger.mdtm
        }
      });
    } catch (error) {
      console.error('Update master passenger error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * DELETE /api/master-passengers/:id
   * Delete (soft delete) master passenger
   */
  deleteMasterPassenger: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const userEmail = req.user.us_email;
      const userId = req.user.us_usid;

      // Check if passenger exists and belongs to this user via email
      const passenger = await MasterPassengerTVL.findOne({
        where: { 
          mp_mpid: id,
          mp_email: userEmail
        }
      });

      if (!passenger) {
        return res.status(404).json({ success: false, error: 'Master passenger not found' });
      }

      // Soft delete
      passenger.mp_active = 0;
      passenger.mby = userId;
      await passenger.save();

      res.json({
        success: true,
        message: 'Master passenger deleted successfully'
      });
    } catch (error) {
      console.error('Delete master passenger error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = masterPassengerController;
