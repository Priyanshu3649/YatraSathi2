const { StationBoyPayment, StationBoy, sequelizeTVL } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const settlementService = require('../services/stationBoySettlementService');

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
  const { id } = req.params; // Station Boy ID
  const { paymentDate, amount, paymentMode, referenceNumber, remarks } = req.body;

  const stationBoy = await StationBoy.findByPk(id);
  if (!stationBoy) {
    return res.status(404).json({ success: false, message: 'Station Boy not found' });
  }

  if (!paymentDate) {
    return res.status(400).json({ success: false, message: 'Payment date is required' });
  }

  if (amount === undefined || amount === null) {
    return res.status(400).json({ success: false, message: 'Payment amount is required' });
  }

  const parsedAmount = settlementService.round2(parseFloat(amount));
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
  }

  if (!paymentMode) {
    return res.status(400).json({ success: false, message: 'Payment mode is required' });
  }

  const userId = convertUserIdToInt(req.user ? req.user.us_usid : 'SYSTEM');
  const transaction = await sequelizeTVL.transaction();

  try {
    const { outstanding } = await settlementService.getOutstanding(parseInt(id, 10), { transaction });

    if (outstanding <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'There is no pending payable for this station boy'
      });
    }

    if (parsedAmount > outstanding + 0.009) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment amount ₹${parsedAmount.toFixed(2)} exceeds the outstanding payable ₹${outstanding.toFixed(2)}`
      });
    }

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
    }, { transaction });

    // FIFO settlement: oldest pending bill first
    const settlement = await settlementService.allocatePaymentToBills({
      paymentId: payment.id,
      stationBoyId: parseInt(id, 10),
      amount: parsedAmount,
      transaction,
      userId,
      allocationDate: paymentDate
    });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: `Payment recorded and settled against ${settlement.allocations.length} bill(s), oldest pending first`,
      data: payment,
      settlement
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating station boy payment:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
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
        as: 'stationBoy',
        attributes: ['id', 'name', 'phone']
      }],
      order: [['payment_date', 'DESC'], ['id', 'DESC']],
      limit,
      offset
    });

    const paymentIds = payments.map((payment) => payment.id);
    let allocationSummary = [];
    if (paymentIds.length > 0) {
      allocationSummary = await sequelizeTVL.query(`
        SELECT
          payment_id,
          COALESCE(SUM(allocated_amount), 0) AS allocated,
          COUNT(*) AS bill_count
        FROM sbXsbpayalloc
        WHERE payment_id IN (:paymentIds)
        GROUP BY payment_id
      `, {
        replacements: { paymentIds },
        type: QueryTypes.SELECT
      });
    }

    const summaryByPayment = new Map(
      allocationSummary.map((row) => [
        Number(row.payment_id),
        { allocated: settlementService.round2(row.allocated), billCount: Number(row.bill_count) || 0 }
      ])
    );

    const data = payments.map((payment) => {
      const plain = payment.toJSON();
      const amount = settlementService.round2(plain.amount);
      const summary = summaryByPayment.get(Number(plain.id)) || { allocated: 0, billCount: 0 };

      return {
        ...plain,
        station_boy: plain.stationBoy || null,
        allocatedAmount: summary.allocated,
        unallocatedAmount: settlementService.round2(Math.max(0, amount - summary.allocated)),
        allocatedBillCount: summary.billCount,
        isSettled: summary.allocated >= amount - 0.009
      };
    });

    res.json(queryHelper.formatPaginatedResponse(count, data, page, limit));
  } catch (error) {
    console.error('Error fetching station boy payments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPayment,
  getAllPayments
};
