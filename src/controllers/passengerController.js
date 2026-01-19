// Passenger Controller - Handles passenger-related API endpoints
// Implements psXpassenger table operations as per YatraSathi specification

const Passenger = require('../models/Passenger');

// Create a new passenger
const createPassenger = async (req, res) => {
  try {
    const passengerData = {
      ps_bkid: req.body.bookingId || req.body.ps_bkid,
      ps_fname: req.body.firstName || req.body.ps_fname || req.body.name,
      ps_lname: req.body.lastName || req.body.ps_lname,
      ps_age: parseInt(req.body.age || req.body.ps_age),
      ps_gender: req.body.gender || req.body.ps_gender,
      ps_berthpref: req.body.berthPreference || req.body.ps_berthpref,
      ps_berthalloc: req.body.berthAllocated || req.body.ps_berthalloc,
      ps_seatno: req.body.seatNumber || req.body.ps_seatno,
      ps_coach: req.body.coach || req.body.ps_coach,
      eby: req.user?.us_name || req.body.createdBy || 'system',
      mby: req.user?.us_name || req.body.createdBy || 'system'
    };

    // Validation
    if (!passengerData.ps_bkid) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    if (!passengerData.ps_fname) {
      return res.status(400).json({
        success: false,
        message: 'First name is required'
      });
    }

    if (!passengerData.ps_age || passengerData.ps_age < 1 || passengerData.ps_age > 120) {
      return res.status(400).json({
        success: false,
        message: 'Valid age (1-120) is required'
      });
    }

    if (!passengerData.ps_gender || !['M', 'F', 'O'].includes(passengerData.ps_gender)) {
      return res.status(400).json({
        success: false,
        message: 'Valid gender (M/F/O) is required'
      });
    }

    const result = await Passenger.create(passengerData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createPassenger:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create passenger'
    });
  }
};

// Get passengers by booking ID
const getPassengersByBookingId = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    const result = await Passenger.getByBookingId(bookingId);
    res.json(result);
  } catch (error) {
    console.error('Error in getPassengersByBookingId:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch passengers'
    });
  }
};

// Get passenger by ID
const getPassengerById = async (req, res) => {
  try {
    const passengerId = req.params.id;
    
    if (!passengerId) {
      return res.status(400).json({
        success: false,
        message: 'Passenger ID is required'
      });
    }

    const result = await Passenger.getById(passengerId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error in getPassengerById:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch passenger'
    });
  }
};

// Update passenger
const updatePassenger = async (req, res) => {
  try {
    const passengerId = req.params.id;
    
    if (!passengerId) {
      return res.status(400).json({
        success: false,
        message: 'Passenger ID is required'
      });
    }

    const updateData = {
      ps_fname: req.body.firstName || req.body.ps_fname || req.body.name,
      ps_lname: req.body.lastName || req.body.ps_lname,
      ps_age: parseInt(req.body.age || req.body.ps_age),
      ps_gender: req.body.gender || req.body.ps_gender,
      ps_berthpref: req.body.berthPreference || req.body.ps_berthpref,
      ps_berthalloc: req.body.berthAllocated || req.body.ps_berthalloc,
      ps_seatno: req.body.seatNumber || req.body.ps_seatno,
      ps_coach: req.body.coach || req.body.ps_coach,
      mby: req.user?.us_name || req.body.modifiedBy || 'system'
    };

    // Validation
    if (!updateData.ps_fname) {
      return res.status(400).json({
        success: false,
        message: 'First name is required'
      });
    }

    if (!updateData.ps_age || updateData.ps_age < 1 || updateData.ps_age > 120) {
      return res.status(400).json({
        success: false,
        message: 'Valid age (1-120) is required'
      });
    }

    if (!updateData.ps_gender || !['M', 'F', 'O'].includes(updateData.ps_gender)) {
      return res.status(400).json({
        success: false,
        message: 'Valid gender (M/F/O) is required'
      });
    }

    const result = await Passenger.update(passengerId, updateData);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error in updatePassenger:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update passenger'
    });
  }
};

// Delete passenger (soft delete)
const deletePassenger = async (req, res) => {
  try {
    const passengerId = req.params.id;
    
    if (!passengerId) {
      return res.status(400).json({
        success: false,
        message: 'Passenger ID is required'
      });
    }

    const result = await Passenger.delete(passengerId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error in deletePassenger:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete passenger'
    });
  }
};

// Create multiple passengers for a booking (batch operation)
const createMultiplePassengers = async (req, res) => {
  try {
    const bookingId = req.body.bookingId || req.params.bookingId;
    const passengersList = req.body.passengers || req.body.passengerList || [];
    const createdBy = req.user?.us_name || req.body.createdBy || 'system';

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    if (!Array.isArray(passengersList) || passengersList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Passengers list is required and must be an array'
      });
    }

    // Validate each passenger
    for (let i = 0; i < passengersList.length; i++) {
      const passenger = passengersList[i];
      
      if (!passenger.name && !passenger.ps_fname) {
        return res.status(400).json({
          success: false,
          message: `Passenger ${i + 1}: Name is required`
        });
      }

      const age = parseInt(passenger.age || passenger.ps_age);
      if (!age || age < 1 || age > 120) {
        return res.status(400).json({
          success: false,
          message: `Passenger ${i + 1}: Valid age (1-120) is required`
        });
      }

      const gender = passenger.gender || passenger.ps_gender;
      if (!gender || !['M', 'F', 'O'].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: `Passenger ${i + 1}: Valid gender (M/F/O) is required`
        });
      }
    }

    const result = await Passenger.createMultiple(bookingId, passengersList, createdBy);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createMultiplePassengers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create passengers'
    });
  }
};

// Get passenger count for a booking
const getPassengerCount = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    const result = await Passenger.getCountByBookingId(bookingId);
    res.json(result);
  } catch (error) {
    console.error('Error in getPassengerCount:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get passenger count'
    });
  }
};

// Search passengers by name (for customer master list feature)
const searchPassengers = async (req, res) => {
  try {
    const searchTerm = req.query.search || req.query.name;
    const customerId = req.query.customerId || req.user?.us_usid;
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters'
      });
    }

    const result = await Passenger.searchByName(searchTerm.trim(), customerId);
    res.json(result);
  } catch (error) {
    console.error('Error in searchPassengers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search passengers'
    });
  }
};

// Get passenger statistics (admin only)
const getPassengerStatistics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.us_roid !== 'ADM' && req.user?.us_usertype !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const result = await Passenger.getStatistics();
    res.json(result);
  } catch (error) {
    console.error('Error in getPassengerStatistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get passenger statistics'
    });
  }
};

module.exports = {
  createPassenger,
  getPassengersByBookingId,
  getPassengerById,
  updatePassenger,
  deletePassenger,
  createMultiplePassengers,
  getPassengerCount,
  searchPassengers,
  getPassengerStatistics
};