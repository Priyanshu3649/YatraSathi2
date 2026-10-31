/**
 * Customer bill settlement.
 *
 * A payment is settled against the bills that carry the same PNR. When a payment
 * has no PNR (or the PNR matches no open bill) the oldest pending bill is settled
 * first, then the next one, until the money runs out.
 *
 * A bill's settleable value is its issued total offset by the cancellation
 * documents raised against it, so a refund reduces what is owed without the
 * original bill ever being rewritten.
 */
const { sequelizeTVL, PaymentAllocation } = require('../models');
const { QueryTypes } = require('sequelize');

const round2 = (value) => Math.round((parseFloat(value) || 0) * 100) / 100;

const escapeLike = (value) => String(value).replace(/[%_\\]/g, '\\$&');

function normalisePnrList(pnr) {
  if (!pnr) return [];
  const raw = Array.isArray(pnr) ? pnr : String(pnr);
  return [...new Set(
    raw
      .split(/[,\s/]+/)
      .map((value) => value.trim())
      .filter((value) => value.length >= 6)
  )];
}

/**
 * Open bills for a customer: PNR matches first, then oldest billing date first.
 */
async function getSettleableBills({ customerIds, pnrList = [], transaction }) {
  const pnrConditions = [];
  const replacements = { customerIds };

  // A bill stores several PNRs comma separated, so match per PNR and let the
  // most specific reference settle first.
  pnrList.forEach((value, index) => {
    const key = `pnr${index}`;
    replacements[key] = value;
    pnrConditions.push(`FIND_IN_SET(:${key}, REPLACE(COALESCE(b.bl_pnr, ''), ' ', '')) > 0`);
    pnrConditions.push(`COALESCE(b.bl_pnr, '') LIKE :${key}_like`);
    replacements[`${key}_like`] = `%${escapeLike(value)}%`;
  });

  const matchExpr = pnrConditions.length > 0 ? `(${pnrConditions.join(' OR ')})` : '0';

  const sql = `
    SELECT
      b.bl_id,
      b.bl_entry_no,
      b.bl_bill_no,
      b.bl_pnr,
      b.bl_booking_id,
      b.bl_billing_date,
      b.bl_total_amount,
      COALESCE(cv.reversal_total, 0) AS reversal_total,
      COALESCE(pa.allocated_total, 0) AS already_allocated,
      CASE WHEN ${matchExpr} THEN 0 ELSE 1 END AS pnr_matched
    FROM blXbilling b
    JOIN bkXbooking bk ON b.bl_booking_id = bk.bk_bkid
    LEFT JOIN (
      SELECT bl_original_bill_id AS rid, SUM(bl_total_amount) AS reversal_total
      FROM blXbilling
      WHERE bl_billing_type = 'C' AND bl_original_bill_id IS NOT NULL
      GROUP BY bl_original_bill_id
    ) cv ON cv.rid = b.bl_id
    LEFT JOIN (
      SELECT bill_id, SUM(allocated_amount) AS allocated_total
      FROM payment_allocations
      GROUP BY bill_id
    ) pa ON pa.bill_id = b.bl_id
    WHERE bk.bk_usid IN (:customerIds)
      AND b.bl_billing_type = 'R'
      AND COALESCE(b.is_cancelled, 0) <> 1
      AND COALESCE(b.is_deleted, 0) <> 1
      AND b.bl_status NOT IN ('CANCELLED', 'CAN')
      AND (b.payment_status IS NULL OR b.payment_status IN ('UNPAID', 'PARTIALLY_PAID'))
    GROUP BY b.bl_id, b.bl_total_amount, cv.reversal_total, pa.allocated_total, b.bl_pnr
    ORDER BY pnr_matched ASC, COALESCE(b.bl_billing_date, b.bl_created_at) ASC, b.bl_id ASC
  `;

  const rows = await sequelizeTVL.query(sql, {
    replacements,
    type: QueryTypes.SELECT,
    transaction
  });

  return rows.map((row) => {
    const netAmount = round2(parseFloat(row.bl_total_amount) + parseFloat(row.reversal_total));
    const allocated = round2(row.already_allocated);
    return {
      ...row,
      net_amount: netAmount,
      pending_amount: round2(Math.max(0, netAmount - allocated))
    };
  }).filter((row) => row.pending_amount > 0);
}

async function refreshBillPaymentStatus(billId, transaction) {
  const [row] = await sequelizeTVL.query(`
    SELECT
      b.bl_total_amount + COALESCE(cv.reversal_total, 0) AS net_amount,
      COALESCE(pa.allocated_total, 0) AS allocated_total
    FROM blXbilling b
    LEFT JOIN (
      SELECT bl_original_bill_id AS rid, SUM(bl_total_amount) AS reversal_total
      FROM blXbilling
      WHERE bl_billing_type = 'C' AND bl_original_bill_id IS NOT NULL
      GROUP BY bl_original_bill_id
    ) cv ON cv.rid = b.bl_id
    LEFT JOIN (
      SELECT bill_id, SUM(allocated_amount) AS allocated_total
      FROM payment_allocations
      GROUP BY bill_id
    ) pa ON pa.bill_id = b.bl_id
    WHERE b.bl_id = :billId
  `, { replacements: { billId }, type: QueryTypes.SELECT, transaction });

  if (!row) return null;

  const netAmount = round2(row.net_amount);
  const allocated = round2(row.allocated_total);

  let status = 'UNPAID';
  if (allocated >= netAmount && netAmount > 0) {
    status = 'FULLY_PAID';
  } else if (allocated > 0) {
    status = 'PARTIALLY_PAID';
  }

  await sequelizeTVL.query('UPDATE blXbilling SET payment_status = :status WHERE bl_id = :billId', {
    replacements: { status, billId },
    type: QueryTypes.UPDATE,
    transaction
  });

  return status;
}

/**
 * Settle a payment: PNR-matched bills first, then the oldest pending bills.
 * Returns the per-bill allocations actually written.
 */
async function allocatePaymentToBills({
  paymentId,
  customerIds,
  amount,
  pnr,
  transaction,
  userId = 'SYSTEM',
  onAllocate = null
}) {
  const pnrList = normalisePnrList(pnr);
  const bills = await getSettleableBills({ customerIds, pnrList, transaction });

  let remaining = round2(amount);
  const allocations = [];

  for (const bill of bills) {
    if (remaining <= 0) break;

    const allocAmount = round2(Math.min(remaining, bill.pending_amount));
    if (allocAmount <= 0) continue;

    await PaymentAllocation.create({
      payment_id: paymentId,
      bill_id: bill.bl_id,
      allocated_amount: allocAmount,
      allocation_date: new Date(),
      created_by: userId,
      created_at: new Date()
    }, { transaction });

    await refreshBillPaymentStatus(bill.bl_id, transaction);

    if (typeof onAllocate === 'function') {
      await onAllocate({ bill, allocAmount, settledByPnr: bill.pnr_matched === 1 });
    }

    allocations.push({
      billId: bill.bl_id,
      billNumber: bill.bl_entry_no,
      pnr: bill.bl_pnr,
      allocatedAmount: allocAmount,
      settledByPnr: bill.pnr_matched === 1
    });

    remaining = round2(remaining - allocAmount);
  }

  const totalAllocated = round2(round2(amount) - remaining);

  await sequelizeTVL.query(`
    UPDATE ptXpayment
    SET pt_allocatedamt = :totalAllocated, pt_unallocamt = :remaining
    WHERE pt_ptid = :paymentId
  `, {
    replacements: { totalAllocated, remaining, paymentId },
    type: QueryTypes.UPDATE,
    transaction
  });

  return { allocations, allocated: totalAllocated, unallocated: remaining };
}

module.exports = {
  round2,
  normalisePnrList,
  getSettleableBills,
  allocatePaymentToBills,
  refreshBillPaymentStatus
};
