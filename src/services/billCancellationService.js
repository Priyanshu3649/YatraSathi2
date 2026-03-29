/**
 * Bill cancellation business rules (pure helpers + async receipt check).
 * Used by billingController and Jest tests.
 */

const { Op } = require('sequelize');

const CANCELLER_ROLES = ['ADM', 'ACC', 'MGT'];

function normalizeStatus(s) {
  return (s == null ? '' : String(s)).trim().toUpperCase();
}

function canUserCancelBill(user) {
  if (!user) return false;
  const ut = (user.us_usertype || user.usertype || '').toLowerCase();
  if (ut === 'admin') return true;
  return CANCELLER_ROLES.includes(user.us_roid);
}

function billIsAlreadyCancelled(bill) {
  return (
    bill.is_cancelled === 1 ||
    normalizeStatus(bill.bl_status) === 'CANCELLED' ||
    normalizeStatus(bill.status) === 'CANCELLED'
  );
}

function billHasBlockingPaymentState(bill) {
  const ps = normalizeStatus(bill.payment_status);
  if (ps === 'FULLY_PAID' || ps === 'PARTIALLY_PAID') return true;
  const st = normalizeStatus(bill.bl_status);
  if (st === 'PAID' || st === 'FINAL') return true;
  const rec = normalizeStatus(bill.status);
  if (rec === 'PAID' || rec === 'FINAL') return true;
  return false;
}

function parseCharges(railwayCharges, agentCharges) {
  const r = Number.parseFloat(railwayCharges);
  const a = Number.parseFloat(agentCharges);
  return {
    railway: Number.isFinite(r) ? r : 0,
    agent: Number.isFinite(a) ? a : 0
  };
}

function validateCancellationPayload(body, bill) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return ['Request body is required'];
  }

  const {
    railwayCharges,
    agentCharges,
    reason,
    cancellationDate,
    approverUserId,
    approverName
  } = body;

  if (!reason || !String(reason).trim()) {
    errors.push('Cancellation reason is required');
  }

  if (!cancellationDate || !String(cancellationDate).trim()) {
    errors.push('Cancellation date is required');
  } else {
    const d = new Date(cancellationDate);
    if (Number.isNaN(d.getTime())) {
      errors.push('Cancellation date must be a valid date');
    }
  }

  if (!approverUserId || !String(approverUserId).trim()) {
    errors.push('Approver user id is required');
  }

  if (!approverName || !String(approverName).trim()) {
    errors.push('Approver name is required');
  }

  const { railway, agent } = parseCharges(railwayCharges, agentCharges);
  if (railway < 0 || agent < 0) {
    errors.push('Cancellation charges cannot be negative');
  }

  if (bill) {
    const totalCharges = railway + agent;
    const billTotal = Number.parseFloat(bill.bl_total_amount) || 0;
    if (totalCharges > billTotal) {
      errors.push(
        `Total cancellation charges (${totalCharges.toFixed(2)}) cannot exceed bill amount (${billTotal.toFixed(2)})`
      );
    }
  }

  return errors;
}

function generateCancellationReference() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `CAN-${y}${m}${d}-${rand}`;
}

/**
 * @param {import('sequelize').ModelCtor<any>} ReceiptModel
 * @param {string|null|undefined} billNo
 */
async function sumActiveReceiptsForBill(ReceiptModel, billNo) {
  if (!billNo) return 0;
  const sum = await ReceiptModel.sum('rc_amount', {
    where: {
      rc_ref_number: billNo,
      rc_status: 'Active'
    }
  });
  const n = Number.parseFloat(sum);
  return Number.isFinite(n) ? n : 0;
}

function assertNoReceiptsBlockingCancel(receiptTotal, billTotal) {
  if (receiptTotal > 0) {
    return [
      'This bill has recorded receipts against its reference. Cancel the allocation or reconcile receipts before cancelling the bill.'
    ];
  }
  return [];
}

module.exports = {
  CANCELLER_ROLES,
  canUserCancelBill,
  billIsAlreadyCancelled,
  billHasBlockingPaymentState,
  parseCharges,
  validateCancellationPayload,
  generateCancellationReference,
  sumActiveReceiptsForBill,
  assertNoReceiptsBlockingCancel
};
