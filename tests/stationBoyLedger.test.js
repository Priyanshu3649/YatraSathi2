const mockSequelizeTVL = {
  query: jest.fn()
};

jest.mock('../config/db', () => ({
  sequelizeTVL: mockSequelizeTVL
}));

const mockStationBoy = {
  id: 1,
  name: 'Ramesh',
  phone: '9999999991',
  address: 'Delhi Station',
  status: 'ACTIVE'
};

jest.mock('../src/models', () => ({
  StationBoy: {
    findByPk: jest.fn().mockImplementation((id) => {
      if (id === 1) return Promise.resolve(mockStationBoy);
      return Promise.resolve(null);
    })
  },
  StationBoyPayment: {},
  BillTVL: {}
}));

const stationBoyLedgerService = require('../src/services/stationBoyLedgerService');

describe('Station Boy Ledger Calculations (ERP Grade)', () => {
  let mockIncentivesBefore = 0;
  let mockPaymentsBefore = 0;
  let mockBillsInPeriod = [];
  let mockPaymentsInPeriod = [];

  beforeEach(() => {
    jest.clearAllMocks();
    mockIncentivesBefore = 0;
    mockPaymentsBefore = 0;
    mockBillsInPeriod = [];
    mockPaymentsInPeriod = [];

    mockSequelizeTVL.query.mockImplementation((sql, options) => {
      const query = sql.toLowerCase();
      // incentivesBefore sum
      if (query.includes('blxbilling') && query.includes('< :fromdate')) {
        return Promise.resolve([{ total_incentive: mockIncentivesBefore }]);
      }
      // paymentsBefore sum
      if (query.includes('sbxsbpay') && query.includes('< :fromdate')) {
        return Promise.resolve([{ total_payment: mockPaymentsBefore }]);
      }
      // bills in period
      if (query.includes('blxbilling') && query.includes('>= :fromdate')) {
        return Promise.resolve(mockBillsInPeriod);
      }
      // payments in period
      if (query.includes('sbxsbpay') && query.includes('>= :fromdate')) {
        return Promise.resolve(mockPaymentsInPeriod);
      }
      return Promise.resolve([[]]);
    });
  });

  test('Calculate ledger with no transactions', async () => {
    const result = await stationBoyLedgerService.getStationBoyVintageLedger(1, '2026-06-01', '2026-06-30');

    expect(result.success).toBe(true);
    expect(result.openingBalance).toBe(0);
    expect(result.closingBalance).toBe(0);
    expect(result.totals).toEqual({ incentive: 0, payment: 0 });
    expect(result.entries).toHaveLength(0);
  });

  test('Calculate ledger with opening balance and periodic transactions', async () => {
    mockIncentivesBefore = 1500;
    mockPaymentsBefore = 1000; // opening balance = 500 Dr (Payable)

    mockBillsInPeriod = [
      { id: 101, date: '2026-06-05', invoice_number: 'BILL-101', amount: 300, created_at: '2026-06-05T10:00:00Z' }
    ];

    mockPaymentsInPeriod = [
      { id: 201, date: '2026-06-10', reference_number: 'PAY-201', amount: 400, payment_mode: 'CASH', remarks: 'Part Paid', created_at: '2026-06-10T12:00:00Z' }
    ];

    const result = await stationBoyLedgerService.getStationBoyVintageLedger(1, '2026-06-01', '2026-06-30');

    expect(result.success).toBe(true);
    expect(result.openingBalance).toBe(500);
    expect(result.closingBalance).toBe(400); // 500 + 300 - 400 = 400
    expect(result.totals).toEqual({ incentive: 300, payment: 400 });
    expect(result.entries).toHaveLength(2);

    // Bill entry checks
    expect(result.entries[0]).toEqual(expect.objectContaining({
      date: '2026-06-05',
      particulars: 'Incentive from Bill BILL-101',
      incentive: 300,
      payment: 0,
      balance: 800
    }));

    // Payment entry checks
    expect(result.entries[1]).toEqual(expect.objectContaining({
      date: '2026-06-10',
      particulars: 'Part Paid',
      incentive: 0,
      payment: 400,
      balance: 400
    }));
  });
});
