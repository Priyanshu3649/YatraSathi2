/**
 * Bill Cancellation Integration Test
 *
 * Validates the full pipeline:
 *   Booking → Bill Generated → Bill Cancelled → Railway Charge → Agent Charge →
 *   Booking Status CAN → Audit Logged → Forensic Log Created →
 *   Customer Balance Updated (Ledger) → Journal Entries Posted
 *
 * All DB models are mocked so the test runs without a live database.
 */

/* ── Mock Setup ─────────────────────────────────────────── */

const mockTransaction = {
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
};

const fakeBill = {
  bl_id: 101,
  bl_bill_no: 'BILL-2025-0001',
  bl_booking_id: 201,
  bl_customer_id: 'CUST01',
  bl_usid: 'CUST01',
  bl_total_amount: 5000,
  bl_status: 'CONFIRMED',
  bl_class: '3A',
  bl_customer_phone: '9876543210',
  bl_customer_name: 'Test Customer',
  payment_status: 'UNPAID',
  is_cancelled: 0,
  toJSON() { return { ...this }; },
  update: jest.fn().mockResolvedValue(this),
};

const fakeBooking = {
  bk_id: 201,
  bk_status: 'CONFIRMED',
  update: jest.fn().mockResolvedValue(this),
};

const fakeLastLedger = {
  lg_closing_bal: 10000,
};

const mockBillTVL = { findByPk: jest.fn().mockResolvedValue(fakeBill) };
const mockBookingTVL = { findByPk: jest.fn().mockResolvedValue(fakeBooking) };
const mockJournal = { update: jest.fn().mockResolvedValue([1]), bulkCreate: jest.fn().mockResolvedValue([]) };
const mockPassengerTVL = { count: jest.fn().mockResolvedValue(2) };
const mockLedger = { findOne: jest.fn().mockResolvedValue(fakeLastLedger), create: jest.fn().mockResolvedValue({}) };
const mockReceipt = {};
const mockForensicAuditLog = { create: jest.fn().mockResolvedValue({}) };
const mockUserTVL = { findOne: jest.fn().mockResolvedValue({ us_email: 'test@test.com' }) };
const mockCustomer = {};
const mockCompany = {};

// Mock models/index
jest.mock('../../models', () => ({
  BillTVL: mockBillTVL,
  UserTVL: mockUserTVL,
  CustomerTVL: mockCustomer,
  BookingTVL: mockBookingTVL,
  Journal: mockJournal,
  PassengerTVL: mockPassengerTVL,
  Passenger: mockPassengerTVL,
  ForensicAuditLog: mockForensicAuditLog,
  Company: mockCompany,
  Receipt: mockReceipt,
  Ledger: mockLedger,
}));

// Mock DB sequelize
jest.mock('../../../config/db', () => ({
  sequelizeTVL: {
    transaction: jest.fn().mockImplementation(async (fn) => {
      if (typeof fn === 'function') return fn(mockTransaction);
      return mockTransaction;
    }),
    QueryTypes: { UPDATE: 'UPDATE' },
    query: jest.fn().mockResolvedValue({ affectedRows: 1 }),
  },
  sequelize: {},
}));

// Mock services
jest.mock('../../services/billCancellationService', () => ({
  canUserCancelBill: jest.fn().mockReturnValue(true),
  billIsAlreadyCancelled: jest.fn().mockReturnValue(false),
  billHasBlockingPaymentState: jest.fn().mockReturnValue(false),
  validateCancellationPayload: jest.fn().mockReturnValue([]),
  sumActiveReceiptsForBill: jest.fn().mockResolvedValue(0),
  assertNoReceiptsBlockingCancel: jest.fn().mockReturnValue([]),
  parseCharges: jest.fn().mockReturnValue({ railway: 250, agent: 100 }),
  generateCancellationReference: jest.fn().mockReturnValue('CAN-250101-00001'),
}));

jest.mock('../../services/serviceChargeService', () => ({
  getServiceCharge: jest.fn().mockResolvedValue(100),
}));

jest.mock('../../services/emailService', () => ({
  notifyBillCancelled: jest.fn().mockResolvedValue(),
}));

jest.mock('../../services/realTimeService', () => ({
  emitBillingUpdate: jest.fn(),
}));

jest.mock('../../services/forensicAuditService', () => ({
  logAction: jest.fn(),
  logInsert: jest.fn(),
  logFieldChanges: jest.fn(),
  MODULES: { BILLING: 'BILLING' },
  ACTIONS: { CANCEL: 'CANCEL' },
}));

jest.mock('../../utils/billPdfGenerator', () => ({
  generateBillPDF: jest.fn(),
}));

jest.mock('../../utils/numberToWords', () => jest.fn().mockReturnValue('Five Thousand Only'));

const { sequelizeTVL } = require('../../../config/db');
const Audit = require('../../services/forensicAuditService');
const RealTimeService = require('../../services/realTimeService');
const { notifyBillCancelled } = require('../../services/emailService');

/* ── Helpers ────────────────────────────────────────────── */

function buildReq(overrides = {}) {
  return {
    params: { id: 101 },
    body: {
      railwayCharges: 250,
      agentCharges: 100,
      reason: 'Customer request',
      cancellationDate: '2025-06-15',
      approverUserId: 'ADM001',
      approverName: 'Admin User',
    },
    user: { us_usid: 'ADM001', us_fname: 'Admin', us_lname: 'User', us_usertype: 'admin' },
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('jest-test'),
    ...overrides,
  };
}

function buildRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

/* ── Lazy require controller AFTER mocks ────────────────── */
let billingController;
beforeAll(() => {
  billingController = require('../billingController');
});

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set bill update mock (it references `this` which is lost after clearAllMocks)
  fakeBill.update.mockResolvedValue(fakeBill);
});

/* ── Tests ──────────────────────────────────────────────── */

describe('cancelBill – full pipeline', () => {
  test('returns 200 with cancellation details on success', async () => {
    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          cancellationRef: 'CAN-250101-00001',
          refundAmount: 4650,   // 5000 - 250 - 100
          totalCharges: 350,
        }),
      })
    );
  });

  test('updates bill status to CAN with all cancellation fields', async () => {
    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    expect(fakeBill.update).toHaveBeenCalledWith(
      expect.objectContaining({
        bl_status: 'CAN',
        is_cancelled: 1,
        bl_railway_cancellation_charge: 250,
        bl_agent_cancellation_charge: 100,
        total_cancel_charges: 350,
        refund_amount: 4650,
        payment_status: 'REFUND_DUE',
      }),
      expect.objectContaining({ transaction: expect.any(Object) })
    );
  });

  test('updates booking status to CAN', async () => {
    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    expect(mockBookingTVL.findByPk).toHaveBeenCalledWith(201, expect.any(Object));
    expect(fakeBooking.update).toHaveBeenCalledWith(
      expect.objectContaining({ bk_status: 'CAN' }),
      expect.objectContaining({ transaction: expect.any(Object) })
    );
  });

  test('creates a CREDIT Ledger entry for customer refund', async () => {
    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    expect(mockLedger.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { lg_usid: 'CUST01' },
        order: [['lg_lgid', 'DESC']],
      })
    );

    expect(mockLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        lg_usid: 'CUST01',
        lg_entry_type: 'CREDIT',
        lg_entry_ref: 'CAN-250101-00001',
        lg_amount: 4650,
        lg_opening_bal: 10000,
        lg_closing_bal: 14650,
      }),
      expect.objectContaining({ transaction: expect.any(Object) })
    );
  });

  test('posts journal entries for cancellation', async () => {
    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    expect(mockJournal.update).toHaveBeenCalled(); // deactivate old entries
    expect(mockJournal.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ je_entry_type: 'Debit', je_amount: 4650 }),
        expect.objectContaining({ je_entry_type: 'Credit', je_amount: 350 }),
      ]),
      expect.any(Object)
    );
  });

  test('logs forensic audit via ForensicAuditService (not ForensicAuditLog.create)', async () => {
    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    // Old pattern should NOT be called
    expect(mockForensicAuditLog.create).not.toHaveBeenCalled();

    // New pattern should be called for each field
    expect(Audit.logAction).toHaveBeenCalledTimes(
      expect.getState().currentTestName ? 9 : 9  // 9 field-level audit calls
    );
    expect(Audit.logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'BILLING',
        action: 'CANCEL',
        fieldName: 'bl_status',
        newValue: 'CAN',
      })
    );
    expect(Audit.logAction).toHaveBeenCalledWith(
      expect.objectContaining({ fieldName: 'refund_amount', newValue: '4650' })
    );
    expect(Audit.logAction).toHaveBeenCalledWith(
      expect.objectContaining({ fieldName: 'cancellation_ref', newValue: 'CAN-250101-00001' })
    );
  });

  test('emits real-time billing update', async () => {
    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    expect(RealTimeService.emitBillingUpdate).toHaveBeenCalled();
  });

  test('sends cancellation email notification', async () => {
    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    expect(notifyBillCancelled).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'test@test.com',
        customerName: 'Test Customer',
        billNo: 'BILL-2025-0001',
        cancellationRef: 'CAN-250101-00001',
      })
    );
  });

  test('returns 403 when user lacks RBAC permission', async () => {
    const billCancellation = require('../../services/billCancellationService');
    billCancellation.canUserCancelBill.mockReturnValueOnce(false);

    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(fakeBill.update).not.toHaveBeenCalled();
    expect(mockLedger.create).not.toHaveBeenCalled();
  });

  test('returns 404 when bill not found', async () => {
    mockBillTVL.findByPk.mockResolvedValueOnce(null);

    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(fakeBill.update).not.toHaveBeenCalled();
  });

  test('returns 400 when bill is already cancelled', async () => {
    const billCancellation = require('../../services/billCancellationService');
    billCancellation.billIsAlreadyCancelled.mockReturnValueOnce(true);

    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(fakeBill.update).not.toHaveBeenCalled();
  });

  test('commits transaction on success', async () => {
    const req = buildReq();
    const res = buildRes();

    await billingController.cancelBill(req, res);

    expect(mockTransaction.commit).toHaveBeenCalled();
  });
});
