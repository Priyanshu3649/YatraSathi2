const { StationBoy } = require('../models');
const { sequelizeTVL: sequelize } = require('../../config/db');
const { QueryTypes } = require('sequelize');

// Helper to convert user ID string to integer
function convertUserIdToInt(userId) {
  if (typeof userId === 'number') return userId;
  if (typeof userId === 'string') {
    const numericPart = userId.match(/\d+/);
    if (numericPart) return parseInt(numericPart[0]);
    return userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000000;
  }
  return 1;
}

const getAllStationBoys = async (req, res) => {
  try {
    // Fetch all station boys with aggregated payables and payments using safe subqueries
    const stationBoys = await sequelize.query(`
      SELECT 
        sb.id,
        sb.name,
        sb.phone,
        sb.address,
        sb.status,
        (
          SELECT COALESCE(SUM(b.bl_railway_fare), 0) 
          FROM blXbilling b 
          WHERE b.station_boy_id = sb.id 
            AND COALESCE(b.is_cancelled, 0) = 0
            AND COALESCE(b.is_deleted, 0) = 0
            AND (b.status IS NULL OR b.status NOT IN ('CANCELLED', 'CAN'))
            AND (b.bl_status IS NULL OR b.bl_status NOT IN ('CANCELLED', 'CAN'))
        ) AS totalRailwayFare,
        (
          SELECT COALESCE(SUM(COALESCE(b.station_boy_incentive_amount, b.bl_sb_incentive, 0)), 0) 
          FROM blXbilling b 
          WHERE b.station_boy_id = sb.id 
            AND COALESCE(b.is_cancelled, 0) = 0
            AND COALESCE(b.is_deleted, 0) = 0
            AND (b.status IS NULL OR b.status NOT IN ('CANCELLED', 'CAN'))
            AND (b.bl_status IS NULL OR b.bl_status NOT IN ('CANCELLED', 'CAN'))
        ) AS totalIncentive,
        (
          SELECT COALESCE(SUM(p.amount), 0) 
          FROM sbXsbpay p 
          WHERE p.station_boy_id = sb.id 
            AND p.status = 'ACTIVE'
        ) AS totalPaid
      FROM sbXstationBoy sb
      ORDER BY sb.name ASC
    `, { type: QueryTypes.SELECT });

    // Format response to include total payable and pending amount
    const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

    const formattedData = stationBoys.map(sb => {
      const totalRailwayFare = round2(sb.totalRailwayFare);
      const totalIncentive = round2(sb.totalIncentive);
      const totalPaid = round2(sb.totalPaid);
      const totalPayable = round2(totalRailwayFare + totalIncentive);
      const pendingPayable = round2(Math.max(0, totalPayable - totalPaid));

      return {
        id: sb.id,
        name: sb.name,
        phone: sb.phone || '',
        address: sb.address || '',
        status: sb.status,
        totalRailwayFare,
        totalIncentive,
        totalPayable,
        totalPaid,
        pendingPayable
      };
    });

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching station boys:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStationBoyById = async (req, res) => {
  try {
    const { id } = req.params;
    const stationBoy = await StationBoy.findByPk(id);

    if (!stationBoy) {
      return res.status(404).json({ success: false, message: 'Station Boy not found' });
    }

    res.json({
      success: true,
      data: stationBoy
    });
  } catch (error) {
    console.error('Error fetching station boy:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createStationBoy = async (req, res) => {
  try {
    const { name, phone, address, status } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    // Check if phone is already in use by another station boy
    if (phone) {
      const existing = await StationBoy.findOne({ where: { phone } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Phone number already in use by another station boy' });
      }
    }

    const userId = convertUserIdToInt(req.user ? req.user.us_usid : 'SYSTEM');

    const newStationBoy = await StationBoy.create({
      name,
      phone: phone || null,
      address: address || null,
      status: status || 'ACTIVE',
      created_by: userId,
      created_at: new Date(),
      updated_by: userId,
      updated_at: new Date()
    });

    res.status(201).json({
      success: true,
      data: newStationBoy
    });
  } catch (error) {
    console.error('Error creating station boy:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStationBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, status } = req.body;

    const stationBoy = await StationBoy.findByPk(id);
    if (!stationBoy) {
      return res.status(404).json({ success: false, message: 'Station Boy not found' });
    }

    if (name !== undefined && !name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    // Check unique phone
    if (phone && phone !== stationBoy.phone) {
      const existing = await StationBoy.findOne({ where: { phone } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Phone number already in use by another station boy' });
      }
    }

    const userId = convertUserIdToInt(req.user ? req.user.us_usid : 'SYSTEM');

    await stationBoy.update({
      name: name !== undefined ? name : stationBoy.name,
      phone: phone !== undefined ? (phone || null) : stationBoy.phone,
      address: address !== undefined ? (address || null) : stationBoy.address,
      status: status !== undefined ? status : stationBoy.status,
      updated_by: userId,
      updated_at: new Date()
    });

    res.json({
      success: true,
      data: stationBoy
    });
  } catch (error) {
    console.error('Error updating station boy:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStationBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const stationBoy = await StationBoy.findByPk(id);
    if (!stationBoy) {
      return res.status(404).json({ success: false, message: 'Station Boy not found' });
    }

    // Soft delete rule: update status to INACTIVE
    const userId = convertUserIdToInt(req.user ? req.user.us_usid : 'SYSTEM');
    await stationBoy.update({
      status: 'INACTIVE',
      updated_by: userId,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Station Boy status set to INACTIVE (Soft Deleted) successfully'
    });
  } catch (error) {
    console.error('Error soft-deleting station boy:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getActiveStationBoys = async (req, res) => {
  try {
    const stationBoys = await StationBoy.findAll({
      where: { status: 'ACTIVE' },
      order: [['name', 'ASC']]
    });

    const formattedData = stationBoys.map(sb => ({
      id: sb.id,
      name: sb.name,
      phone: sb.phone || ''
    }));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching active station boys:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllStationBoys,
  getStationBoyById,
  createStationBoy,
  updateStationBoy,
  deleteStationBoy,
  getActiveStationBoys
};
