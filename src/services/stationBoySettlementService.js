const { sequelizeTVL: sequelize, StationBoyPaymentAllocation } = require('../models');
const { QueryTypes } = require('sequelize');

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

/**
 * Bills that create a payable for a station boy.
 * A bill is payable for the net railway fare plus the station boy incentive.
 * Cancelled / deleted / zero-value bills are excluded.
 */
const PAYABLE_BILLS_SQL = `
  SELECT
    b.bl_id AS billId,
    b.bl_bill_no AS billNo,
    b.bl_sub_bill_no AS subBillNo,
    b.bl_billing_date AS billDate,
    b.bl_created_at AS createdAt,
    COALESCE(b.bl_railway_fare, 0) AS railwayFare,
    COALESCE(b.station_boy_incentive_amount, b.bl_sb_incentive, 0) AS incentive,
    COALESCE(a.allocated, 0) AS allocated
  FROM blXbilling b
  LEFT JOIN (
    SELECT bill_id, SUM(allocated_amount) AS allocated
    FROM sbXsbpayalloc
    GROUP BY bill_id
  ) a ON a.bill_id = b.bl_id
  WHERE b.station_boy_id = :stationBoyId
    AND COALESCE(b.is_cancelled, 0) = 0
    AND COALESCE(b.is_deleted, 0) = 0
    AND (b.status IS NULL OR b.status NOT IN ('CANCELLED', 'CAN'))
    AND (b.bl_status IS NULL OR b.bl_status NOT IN ('CANCELLED', 'CAN'))
    AND (COALESCE(b.bl_railway_fare, 0) + COALESCE(b.station_boy_incentive_amount, b.bl_sb_incentive, 0)) > 0
  ORDER BY COALESCE(b.bl_billing_date, b.bl_created_at) ASC, b.bl_id ASC
`;

async function getPayableBills(stationBoyId, { transaction } = {}) {
  const rows = await sequelize.query(PAYABLE_BILLS_SQL, {
    replacements: { stationBoyId },
    type: QueryTypes.SELECT,
    transaction
  });

  return rows.map((row) => {
    const railwayFare = round2(row.railwayFare);
    const incentive = round2(row.incentive);
    const payable = round2(railwayFare + incentive);
    const allocated = round2(row.allocated);
    const pending = round2(Math.max(0, payable - allocated));

    let settlementStatus = 'PENDING';
    if (allocated > 0 && pending <= 0) settlementStatus = 'SETTLED';
    else if (allocated > 0) settlementStatus = 'PARTIALLY_SETTLED';

    return {
      billId: row.billId,
      billNo: row.billNo,
      subBillNo: row.subBillNo || null,
      billDate: row.billDate,
      createdAt: row.createdAt,
      railwayFare,
      incentive,
      payable,
      allocated,
      pending,
      settlementStatus
    };
  });
}

async function getOutstanding(stationBoyId, { transaction } = {}) {
  const bills = await getPayableBills(stationBoyId, { transaction });
  return {
    bills,
    outstanding: round2(bills.reduce((sum, bill) => sum + bill.pending, 0))
  };
}

/**
 * FIFO settlement: allocate a payment to the oldest pending bill first.
 * The caller owns the transaction.
 */
async function allocatePaymentToBills({ paymentId, stationBoyId, amount, transaction, userId, allocationDate }) {
  const { bills, outstanding } = await getOutstanding(stationBoyId, { transaction });
  let remaining = round2(amount);

  if (remaining > outstanding + 0.009) {
    const error = new Error(
      `Payment amount ₹${remaining.toFixed(2)} exceeds the outstanding payable ₹${outstanding.toFixed(2)}`
    );
    error.statusCode = 400;
    throw error;
  }

  const rows = [];
  const allocations = [];

  for (const bill of bills) {
    if (remaining <= 0) break;
    if (bill.pending <= 0) continue;

    const allocatedAmount = round2(Math.min(remaining, bill.pending));
    if (allocatedAmount <= 0) continue;

    rows.push({
      payment_id: paymentId,
      bill_id: bill.billId,
      allocated_amount: allocatedAmount,
      allocation_date: allocationDate || new Date(),
      is_reconciled: 0,
      created_by: userId || null,
      created_at: new Date()
    });

    allocations.push({
      billId: bill.billId,
      billNo: bill.billNo,
      allocatedAmount
    });

    remaining = round2(remaining - allocatedAmount);
  }

  if (rows.length > 0) {
    await StationBoyPaymentAllocation.bulkCreate(rows, { transaction });
  }

  return {
    allocations,
    allocatedAmount: round2(amount - remaining),
    unallocatedAmount: remaining
  };
}

/**
 * Legacy safety net: allocate any existing payments that have no allocation rows,
 * processing payments oldest-first so settlement order stays FIFO.
 */
async function backfillStationBoyAllocations(stationBoyId, transaction, userId) {
  const payments = await sequelize.query(`
    SELECT id, amount, payment_date
    FROM sbXsbpay
    WHERE station_boy_id = :stationBoyId
      AND status = 'ACTIVE'
    ORDER BY payment_date ASC, id ASC
  `, {
    replacements: { stationBoyId },
    type: QueryTypes.SELECT,
    transaction
  });

  if (!payments.length) return;

  const existing = await sequelize.query(`
    SELECT payment_id, COALESCE(SUM(allocated_amount), 0) AS allocated
    FROM sbXsbpayalloc
    GROUP BY payment_id
  `, {
    type: QueryTypes.SELECT,
    transaction
  });

  const allocatedByPayment = new Map(
    existing.map((row) => [Number(row.payment_id), round2(row.allocated)])
  );

  const { bills } = await getOutstanding(stationBoyId, { transaction });

  for (const payment of payments) {
    let remaining = round2(round2(payment.amount) - (allocatedByPayment.get(Number(payment.id)) || 0));
    if (remaining <= 0) continue;

    for (const bill of bills) {
      if (remaining <= 0) break;
      if (bill.pending <= 0) continue;

      const allocatedAmount = round2(Math.min(remaining, bill.pending));
      if (allocatedAmount <= 0) continue;

      await StationBoyPaymentAllocation.create({
        payment_id: payment.id,
        bill_id: bill.billId,
        allocated_amount: allocatedAmount,
        allocation_date: payment.payment_date || new Date(),
        is_reconciled: 0,
        created_by: userId || null,
        created_at: new Date()
      }, { transaction });

      bill.pending = round2(bill.pending - allocatedAmount);
      remaining = round2(remaining - allocatedAmount);
    }
  }
}

async function getPaymentSettlement(paymentId, transaction) {
  const [row] = await sequelize.query(`
    SELECT
      COALESCE(SUM(allocated_amount), 0) AS allocated,
      COUNT(*) AS billCount
    FROM sbXsbpayalloc
    WHERE payment_id = :paymentId
  `, {
    replacements: { paymentId },
    type: QueryTypes.SELECT,
    transaction
  });

  return {
    allocated: round2(row?.allocated),
    billCount: Number(row?.billCount) || 0
  };
}

module.exports = {
  round2,
  getPayableBills,
  getOutstanding,
  allocatePaymentToBills,
  backfillStationBoyAllocations,
  getPaymentSettlement
};
