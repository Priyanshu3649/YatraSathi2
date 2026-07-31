const { StationBoyPayment, StationBoy } = require('../models');

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

const createPayment = async (req, res) => {
  try {
    const { id } = req.params; // Station Boy ID
    const { paymentDate, amount, paymentMode, referenceNumber, remarks } = req.body;

    // Validate station boy exists
    const stationBoy = await StationBoy.findByPk(id);
    if (!stationBoy) {
      return res.status(404).json({ success: false, message: 'Station Boy not found' });
    }

    // Validation rules
    if (!paymentDate) {
      return res.status(400).json({ success: false, message: 'Payment date is required' });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Payment amount is required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    if (!paymentMode) {
      return res.status(400).json({ success: false, message: 'Payment mode is required' });
    }

    const userId = convertUserIdToInt(req.user ? req.user.us_usid : 'SYSTEM');

    const payment = await StationBoyPayment.create({
      station_boy_id: parseInt(id, 10),
      payment_date: paymentDate,
      amount: parsedAmount,
      payment_mode: paymentMode,
      reference_number: referenceNumber || null,
      remarks: remarks || null,
      status: 'ACTIVE',
      created_by: userId,
      created_at: new Date(),
      updated_by: userId,
      updated_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error creating station boy payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPayment
};

module.exports.getAllPayments = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const queryHelper = require('../utils/queryHelper');
    
    const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
    
    const filterMap = {
      dateColumn: 'payment_date',
      amountColumn: 'amount',
      statusColumn: 'status'
    };
    
    const whereClause = queryHelper.buildWhereClause(req.query, filterMap);
    
    if (!req.query.status) {
      whereClause.status = 'ACTIVE';
    }
    
    const reconciliationStatus = req.query.reconciliationStatus || 'ACTIVE';
    if (reconciliationStatus === 'ACTIVE') {
      whereClause.is_reconciled = { [Op.not]: 1 };
    } else if (reconciliationStatus === 'RECONCILED') {
      whereClause.is_reconciled = 1;
    }
    
    const { count, rows: payments } = await StationBoyPayment.findAndCountAll({
      where: whereClause,
      include: [{
        model: StationBoy,
        as: 'station_boy',
        attributes: ['id', 'name', 'phone']
      }],
      order: [['payment_date', 'DESC'], ['id', 'DESC']],
      limit,
      offset
    });
    
    res.json(queryHelper.formatPaginatedResponse(count, payments, page, limit));
  } catch (error) {
    console.error('Error fetching station boy payments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
