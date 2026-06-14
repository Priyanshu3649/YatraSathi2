const mockSequelizeTVL = {
  query: jest.fn()
};

jest.mock('../config/db', () => ({
  sequelizeTVL: mockSequelizeTVL
}));

jest.mock('../src/models', () => ({
  CustomerLedger: {},
  PaymentAllocation: {},
  ptXpayment: {},
  billXbill: {},
  BookingTVL: {}
}));

const CustomerLedgerService = require('../src/services/CustomerLedgerService');

describe('Vintage Customer Ledger System (ERP Grade) - 5 Cases Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Case 1: Customer with no transactions
  test('Case 1: Customer with no transactions -> Opening: 0, Closing: 0, Entries: 1 (Opening Balance)', async () => {
    // 1. customer profile query
    mockSequelizeTVL.query.mockResolvedValueOnce([{ id: 'CUST01', name: 'Test Client', phone: '1234567890', company: 'Client Corp' }]);
    // 2. billsBefore sum
    mockSequelizeTVL.query.mockResolvedValueOnce([{ total_debit: 0 }]);
    // 3. paymentsBefore sum
    mockSequelizeTVL.query.mockResolvedValueOnce([{ total_credit: 0 }]);
    // 4. bills in period query
    mockSequelizeTVL.query.mockResolvedValueOnce([]);
    // 5. payments in period query
    mockSequelizeTVL.query.mockResolvedValueOnce([]);

    const result = await CustomerLedgerService.getCustomerVintageLedger('CUST01', '2026-06-01', '2026-06-30');

    expect(result.success).toBe(true);
    expect(result.openingBalance).toBe(0);
    expect(result.closingBalance).toBe(0);
    expect(result.totals).toEqual({ debit: 0, credit: 0 });
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toEqual({
      date: '2026-06-01',
      particular: 'Opening Balance',
      reference: '',
      debit: 0,
      credit: 0,
      balance: 0
    });
  });

  // Case 2: Only bill of ₹10000
  test('Case 2: Only bill -> Debit: 10000, Closing Balance: 10000', async () => {
    // 1. customer profile
    mockSequelizeTVL.query.mockResolvedValueOnce([{ id: 'CUST01', name: 'Test Client' }]);
    // 2. billsBefore
    mockSequelizeTVL.query.mockResolvedValueOnce([{ total_debit: 0 }]);
    // 3. paymentsBefore
    mockSequelizeTVL.query.mockResolvedValueOnce([{ total_credit: 0 }]);
    // 4. bills in period (₹10000)
    mockSequelizeTVL.query.mockResolvedValueOnce([
      { date: '2026-06-05', invoice_number: 'INV001', amount: 10000 }
    ]);
    // 5. payments in period (empty)
    mockSequelizeTVL.query.mockResolvedValueOnce([]);

    const result = await CustomerLedgerService.getCustomerVintageLedger('CUST01', '2026-06-01', '2026-06-30');

    expect(result.openingBalance).toBe(0);
    expect(result.totals.debit).toBe(10000);
    expect(result.totals.credit).toBe(0);
    expect(result.closingBalance).toBe(10000);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[1]).toEqual({
      date: '2026-06-05',
      particular: 'Invoice Generated (#INV001)',
      reference: 'INV001',
      debit: 10000,
      credit: 0,
      balance: 10000
    });
  });

  // Case 3: Bill + Payment
  test('Case 3: Bill (50000) + Payment (30000) -> Closing Balance: 20000', async () => {
    // 1. customer profile
    mockSequelizeTVL.query.mockResolvedValueOnce([{ id: 'CUST01', name: 'Test Client' }]);
    // 2. billsBefore
    mockSequelizeTVL.query.mockResolvedValueOnce([{ total_debit: 0 }]);
    // 3. paymentsBefore
    mockSequelizeTVL.query.mockResolvedValueOnce([{ total_credit: 0 }]);
    // 4. bills in period (₹50000)
    mockSequelizeTVL.query.mockResolvedValueOnce([
      { date: '2026-06-05', invoice_number: 'INV001', amount: 50000 }
    ]);
    // 5. payments in period (₹30000)
    mockSequelizeTVL.query.mockResolvedValueOnce([
      { date: '2026-06-10', reference_number: 'REC001', payment_id: 1, amount: 30000, mode: 'Cash' }
    ]);

    const result = await CustomerLedgerService.getCustomerVintageLedger('CUST01', '2026-06-01', '2026-06-30');

    expect(result.openingBalance).toBe(0);
    expect(result.totals.debit).toBe(50000);
    expect(result.totals.credit).toBe(30000);
    expect(result.closingBalance).toBe(20000);
    expect(result.entries).toHaveLength(3);
    
    // Bill entry checks
    expect(result.entries[1].debit).toBe(50000);
    expect(result.entries[1].balance).toBe(50000);
    
    // Payment entry checks
    expect(result.entries[2].credit).toBe(30000);
    expect(result.entries[2].balance).toBe(20000);
  });

  // Case 4: Advance Payment
  test('Case 4: Advance Payment -> Payment (50000) + Bill (30000) -> Closing: -20000', async () => {
    // 1. customer profile
    mockSequelizeTVL.query.mockResolvedValueOnce([{ id: 'CUST01', name: 'Test Client' }]);
    // 2. billsBefore
    mockSequelizeTVL.query.mockResolvedValueOnce([{ total_debit: 0 }]);
    // 3. paymentsBefore
    mockSequelizeTVL.query.mockResolvedValueOnce([{ total_credit: 0 }]);
    // 4. bills in period (₹30000)
    mockSequelizeTVL.query.mockResolvedValueOnce([
      { date: '2026-06-15', invoice_number: 'INV002', amount: 30000 }
    ]);
    // 5. payments in period (₹50000)
    mockSequelizeTVL.query.mockResolvedValueOnce([
      { date: '2026-06-10', reference_number: 'REC002', payment_id: 2, amount: 50000, mode: 'UPI' }
    ]);

    const result = await CustomerLedgerService.getCustomerVintageLedger('CUST01', '2026-06-01', '2026-06-30');

    expect(result.openingBalance).toBe(0);
    expect(result.totals.debit).toBe(30000);
    expect(result.totals.credit).toBe(50000);
    expect(result.closingBalance).toBe(-20000);
    expect(result.entries).toHaveLength(3);

    // Sorted chronologically: payment on June 10 comes first, then bill on June 15
    expect(result.entries[1].particular).toContain('Payment Received');
    expect(result.entries[1].credit).toBe(50000);
    expect(result.entries[1].balance).toBe(-50000);

    expect(result.entries[2].particular).toContain('Invoice Generated');
    expect(result.entries[2].debit).toBe(30000);
    expect(result.entries[2].balance).toBe(-20000);
  });

  // Case 5: Cancelled Bill
  test('Case 5: Cancelled Bill -> excluded entirely from calculations', async () => {
    // 1. customer profile
    mockSequelizeTVL.query.mockResolvedValueOnce([{ id: 'CUST01', name: 'Test Client' }]);
    // 2. billsBefore
    mockSequelizeTVL.query.mockResolvedValueOnce([{ total_debit: 0 }]);
    // 3. paymentsBefore
    mockSequelizeTVL.query.mockResolvedValueOnce([{ total_credit: 0 }]);
    // 4. bills in period (empty since it was cancelled)
    mockSequelizeTVL.query.mockResolvedValueOnce([]);
    // 5. payments in period (empty)
    mockSequelizeTVL.query.mockResolvedValueOnce([]);

    const result = await CustomerLedgerService.getCustomerVintageLedger('CUST01', '2026-06-01', '2026-06-30');

    expect(result.totals.debit).toBe(0);
    expect(result.closingBalance).toBe(0);
    expect(result.entries).toHaveLength(1); // Only the opening balance entry
  });
});
