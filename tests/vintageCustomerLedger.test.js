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
  let mockBillsBefore = 0;
  let mockPaymentsBefore = 0;
  let mockBillsInPeriod = [];
  let mockPaymentsInPeriod = [];
  let mockBilledResult = { totalBilled: 0, lastBillDate: null };
  let mockReceivedResult = { totalReceived: 0, lastPaymentDate: null };
  let mockCustomerMeta = { cu_creditlimit: 100000, cu_creditdays: 30, cu_custtype: 'B2B' };
  let mockCustomerProfile = { id: 'CUST01', customerNo: 'CUST01', name: 'Test Client', phone: '1234567890', company: 'Client Corp' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBillsBefore = 0;
    mockPaymentsBefore = 0;
    mockBillsInPeriod = [];
    mockPaymentsInPeriod = [];
    mockBilledResult = { totalBilled: 0, lastBillDate: null };
    mockReceivedResult = { totalReceived: 0, lastPaymentDate: null };
    mockCustomerMeta = { cu_creditlimit: 100000, cu_creditdays: 30, cu_custtype: 'B2B' };
    mockCustomerProfile = { id: 'CUST01', customerNo: 'CUST01', name: 'Test Client', phone: '1234567890', company: 'Client Corp' };

    mockSequelizeTVL.query.mockImplementation((sql, options) => {
      const query = sql.toLowerCase();
      // getMatchingCustomerIds / getCustomerVintageLedger profile lookup
      if (query.includes('cuxcustomer') && query.includes('usxuser') && query.includes('limit 1')) {
        return Promise.resolve([mockCustomerProfile]);
      }
      if (query.includes('cuxcustomer') && query.includes('usxuser') && !query.includes('limit 1')) {
        return Promise.resolve([{ id: mockCustomerProfile.id }]);
      }
      // billsBefore sum
      if (query.includes('blxbilling') && query.includes('< :fromdate')) {
        return Promise.resolve([{ total_debit: mockBillsBefore }]);
      }
      // paymentsBefore sum
      if (query.includes('ptxpayment') && query.includes('< :fromdate')) {
        return Promise.resolve([{ total_credit: mockPaymentsBefore }]);
      }
      // bills in period
      if (query.includes('blxbilling') && query.includes('>= :fromdate')) {
        return Promise.resolve(mockBillsInPeriod);
      }
      // payments in period
      if (query.includes('ptxpayment') && query.includes('>= :fromdate')) {
        return Promise.resolve(mockPaymentsInPeriod);
      }
      // billedResult in financial summary
      if (query.includes('sum(b.bl_total_amount)')) {
        return Promise.resolve([mockBilledResult]);
      }
      // receivedResult in financial summary
      if (query.includes('sum(pt.pt_amount)')) {
        return Promise.resolve([mockReceivedResult]);
      }
      // customerMeta query
      if (query.includes('cu_creditlimit')) {
        return Promise.resolve([mockCustomerMeta]);
      }
      return Promise.resolve([[]]);
    });
  });

  // Case 1: Customer with no transactions
  test('Case 1: Customer with no transactions -> Opening: 0, Closing: 0, Entries: 1 (Opening Balance)', async () => {
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
    mockBillsInPeriod = [
      { date: '2026-06-05', invoice_number: 'INV001', amount: 10000 }
    ];
    mockBilledResult = { totalBilled: 10000, lastBillDate: '2026-06-05' };

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
    mockBillsInPeriod = [
      { date: '2026-06-05', invoice_number: 'INV001', amount: 50000 }
    ];
    mockPaymentsInPeriod = [
      { date: '2026-06-10', reference_number: 'REC001', payment_id: 1, amount: 30000, mode: 'Cash' }
    ];
    mockBilledResult = { totalBilled: 50000, lastBillDate: '2026-06-05' };
    mockReceivedResult = { totalReceived: 30000, lastPaymentDate: '2026-06-10' };

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
    mockBillsInPeriod = [
      { date: '2026-06-15', invoice_number: 'INV002', amount: 30000 }
    ];
    mockPaymentsInPeriod = [
      { date: '2026-06-10', reference_number: 'REC002', payment_id: 2, amount: 50000, mode: 'UPI' }
    ];
    mockBilledResult = { totalBilled: 30000, lastBillDate: '2026-06-15' };
    mockReceivedResult = { totalReceived: 50000, lastPaymentDate: '2026-06-10' };

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
    const result = await CustomerLedgerService.getCustomerVintageLedger('CUST01', '2026-06-01', '2026-06-30');

    expect(result.totals.debit).toBe(0);
    expect(result.closingBalance).toBe(0);
    expect(result.entries).toHaveLength(1); // Only the opening balance entry
  });
});
