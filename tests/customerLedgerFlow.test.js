const mockTransaction = {
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
};

const mockCustomerLedger = {
  create: jest.fn().mockResolvedValue({}),
};

const mockPaymentAllocation = {
  create: jest.fn().mockResolvedValue({}),
  findAll: jest.fn().mockResolvedValue([]),
  destroy: jest.fn().mockResolvedValue(1),
};

const mockPaymentTVL = {
  findAll: jest.fn().mockResolvedValue([]),
  findByPk: jest.fn().mockResolvedValue(null),
};

const mockBillTVL = {};

jest.mock('../src/models', () => ({
  CustomerLedger: mockCustomerLedger,
  PaymentAllocation: mockPaymentAllocation,
  ptXpayment: mockPaymentTVL,
  billXbill: mockBillTVL,
  BookingTVL: {},
}));

const mockQueryResults = [];
const mockSequelizeTVL = {
  query: jest.fn().mockImplementation(async () => {
    return mockQueryResults.shift() || [[]];
  }),
};

jest.mock('../config/db', () => ({
  sequelizeTVL: mockSequelizeTVL,
}));

jest.mock('../src/services/forensicAuditService', () => ({
  logAction: jest.fn(),
  MODULES: { LEDGER: 'LEDGER' },
}));

const CustomerLedgerService = require('../src/services/CustomerLedgerService');
const Audit = require('../src/services/forensicAuditService');

describe('CustomerLedgerService Integration Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryResults.length = 0;
  });

  describe('getCustomerFinancialSummary', () => {
    it('should calculate total billed, total received, outstanding and advances', async () => {
      // 1. query results for billedResult
      mockQueryResults.push([{ totalBilled: 15000, lastBillDate: '2026-06-01' }]);
      // 2. query results for receivedResult
      mockQueryResults.push([{ totalReceived: 10000, lastPaymentDate: '2026-06-05' }]);

      const summary = await CustomerLedgerService.getCustomerFinancialSummary('CUST01');

      expect(summary).toEqual({
        customerId: 'CUST01',
        totalBilled: 15000,
        totalReceived: 10000,
        outstandingAmount: 5000,
        advanceAmount: 0,
        lastBillDate: '2026-06-01',
        lastPaymentDate: '2026-06-05',
      });
      expect(mockSequelizeTVL.query).toHaveBeenCalledTimes(2);
    });

    it('should handle net advance scenario correctly', async () => {
      // billedResult
      mockQueryResults.push([{ totalBilled: 5000, lastBillDate: '2026-06-01' }]);
      // receivedResult
      mockQueryResults.push([{ totalReceived: 8000, lastPaymentDate: '2026-06-05' }]);

      const summary = await CustomerLedgerService.getCustomerFinancialSummary('CUST02');

      expect(summary).toEqual({
        customerId: 'CUST02',
        totalBilled: 5000,
        totalReceived: 8000,
        outstandingAmount: 0,
        advanceAmount: 3000,
        lastBillDate: '2026-06-01',
        lastPaymentDate: '2026-06-05',
      });
    });
  });

  describe('allocatePaymentOnCreation', () => {
    it('should allocate payment to outstanding bills in FIFO order', async () => {
      const unpaidBills = [
        { bl_id: 101, bl_total_amount: 5000, already_allocated: 2000 }, // needs 3000
        { bl_id: 102, bl_total_amount: 4000, already_allocated: 0 },    // needs 4000
      ];
      mockQueryResults.push([unpaidBills]); // select query result

      await CustomerLedgerService.allocatePaymentOnCreation(999, 'CUST01', 5000, mockTransaction);

      // Verify payment ledger entry
      expect(mockCustomerLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'CUST01',
          entry_type: 'PAYMENT',
          credit_amount: 5000,
        }),
        expect.any(Object)
      );

      // Verify FIFO allocations
      // Bill 101 should get 3000
      expect(mockPaymentAllocation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_id: 999,
          bill_id: 101,
          allocated_amount: 3000,
        }),
        expect.any(Object)
      );

      // Bill 102 should get remaining 2000
      expect(mockPaymentAllocation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_id: 999,
          bill_id: 102,
          allocated_amount: 2000,
        }),
        expect.any(Object)
      );

      // Verify audit logs called for each allocation
      expect(Audit.logAction).toHaveBeenCalledTimes(2);
    });
  });

  describe('adjustAdvanceOnBillCreation', () => {
    it('should apply existing advances to a new bill', async () => {
      const mockPayments = [
        {
          pt_ptid: 501,
          pt_amount: 5000,
          pt_allocatedamt: 1000,
          pt_unallocamt: 4000,
          update: jest.fn().mockResolvedValue(true),
        },
      ];
      mockPaymentTVL.findAll.mockResolvedValueOnce(mockPayments);

      await CustomerLedgerService.adjustAdvanceOnBillCreation(201, 'CUST01', 3000, mockTransaction);

      // Verify bill ledger entry
      expect(mockCustomerLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'CUST01',
          entry_type: 'BILL',
          debit_amount: 3000,
        }),
        expect.any(Object)
      );

      // Verify advance applied
      expect(mockPaymentAllocation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_id: 501,
          bill_id: 201,
          allocated_amount: 3000,
        }),
        expect.any(Object)
      );

      expect(mockPayments[0].update).toHaveBeenCalledWith(
        expect.objectContaining({
          pt_allocatedamt: 4000,
          pt_unallocamt: 1000,
        }),
        expect.any(Object)
      );
    });
  });

  describe('reversePaymentAllocations', () => {
    it('should rollback allocations and recalculate status of affected bills', async () => {
      const mockAllocations = [
        { payment_id: 999, bill_id: 101, allocated_amount: 3000 },
      ];
      mockPaymentAllocation.findAll.mockResolvedValueOnce(mockAllocations);

      // Query mock responses for bill recalculation loop
      // 1. sum query result
      mockQueryResults.push([{ total_allocated: 0 }]);
      // 2. bill total query result
      mockQueryResults.push([{ bl_total_amount: 5000 }]);

      await CustomerLedgerService.reversePaymentAllocations(999, 5000, 'CUST01', mockTransaction);

      expect(mockCustomerLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'CUST01',
          entry_type: 'PAYMENT_REVERSAL',
          debit_amount: 5000,
        }),
        expect.any(Object)
      );

      expect(mockPaymentAllocation.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { payment_id: 999 },
        })
      );
    });
  });

  describe('cancelBillAllocations', () => {
    it('should release allocations back to payments', async () => {
      const mockAllocations = [
        { payment_id: 501, bill_id: 101, allocated_amount: 2000 },
      ];
      mockPaymentAllocation.findAll.mockResolvedValueOnce(mockAllocations);

      const mockPayment = {
        pt_ptid: 501,
        pt_allocatedamt: 3000,
        pt_unallocamt: 2000,
        update: jest.fn().mockResolvedValue(true),
      };
      mockPaymentTVL.findByPk.mockResolvedValueOnce(mockPayment);

      await CustomerLedgerService.cancelBillAllocations(101, 5000, 'CUST01', mockTransaction);

      expect(mockCustomerLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'CUST01',
          entry_type: 'BILL_CANCELLED',
          credit_amount: 5000,
        }),
        expect.any(Object)
      );

      expect(mockPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          pt_allocatedamt: 1000,
          pt_unallocamt: 4000,
        }),
        expect.any(Object)
      );

      expect(mockPaymentAllocation.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bill_id: 101 },
        })
      );
    });
  });
});
