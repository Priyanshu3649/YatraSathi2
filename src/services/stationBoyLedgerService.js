const { StationBoy, StationBoyPayment, BillTVL } = require('../models');
const { sequelizeTVL: sequelize } = require('../../config/db');
const { QueryTypes } = require('sequelize');

class StationBoyLedgerService {
  /**
   * Calculate Station Boy Ledger
   */
  async getStationBoyVintageLedger(stationBoyId, fromDate, toDate) {
    // 1. Fetch Station Boy details
    const stationBoy = await StationBoy.findByPk(stationBoyId);
    if (!stationBoy) {
      throw new Error(`Station Boy not found with ID ${stationBoyId}`);
    }

    // 2. Calculate default dates: Current Financial Year (April 1st to March 31st)
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed: April is 3
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;

    const defaultFromDate = `${startYear}-04-01`;
    const defaultToDate = `${startYear + 1}-03-31`;

    const finalFromDate = fromDate || defaultFromDate;
    const finalToDate = toDate || defaultToDate;

    // Helper to format date ONLY to YYYY-MM-DD
    const formatDateStr = (d) => {
      const dateObj = new Date(d);
      if (isNaN(dateObj)) return '';
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formattedFromDate = formatDateStr(finalFromDate);
    const formattedToDate = formatDateStr(finalToDate);

    // 3. Calculate Opening Balance: Sum(Incentives) - Sum(Payments) before finalFromDate
    const [incentivesBefore] = await sequelize.query(`
      SELECT COALESCE(SUM(station_boy_incentive_amount), 0) AS total_incentive
      FROM blXbilling
      WHERE station_boy_id = :stationBoyId
        AND status NOT IN ('CANCELLED', 'CAN')
        AND bl_billing_date < :fromDate
    `, {
      replacements: { stationBoyId, fromDate: formattedFromDate },
      type: QueryTypes.SELECT
    });

    const [paymentsBefore] = await sequelize.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_payment
      FROM sbXsbpay
      WHERE station_boy_id = :stationBoyId
        AND status = 'ACTIVE'
        AND payment_date < :fromDate
    `, {
      replacements: { stationBoyId, fromDate: formattedFromDate },
      type: QueryTypes.SELECT
    });

    const totalIncentiveBefore = parseFloat(incentivesBefore?.total_incentive || 0);
    const totalPaymentBefore = parseFloat(paymentsBefore?.total_payment || 0);
    const openingBalance = totalIncentiveBefore - totalPaymentBefore;

    // 4. Fetch Bill Incentives in the range
    const bills = await sequelize.query(`
      SELECT 
        bl_id AS id,
        bl_billing_date AS date,
        bl_bill_no AS invoice_number,
        station_boy_incentive_amount AS amount,
        bl_created_at AS created_at
      FROM blXbilling
      WHERE station_boy_id = :stationBoyId
        AND bl_billing_date >= :fromDate
        AND bl_billing_date <= :toDate
        AND status NOT IN ('CANCELLED', 'CAN')
        AND station_boy_incentive_amount > 0
    `, {
      replacements: { stationBoyId, fromDate: formattedFromDate, toDate: formattedToDate },
      type: QueryTypes.SELECT
    });

    // 5. Fetch Payments in the range
    const payments = await sequelize.query(`
      SELECT 
        id,
        payment_date AS date,
        reference_number,
        amount,
        payment_mode,
        remarks,
        created_at
      FROM sbXsbpay
      WHERE station_boy_id = :stationBoyId
        AND payment_date >= :fromDate
        AND payment_date <= :toDate
        AND status = 'ACTIVE'
    `, {
      replacements: { stationBoyId, fromDate: formattedFromDate, toDate: formattedToDate },
      type: QueryTypes.SELECT
    });

    // 6. Map and merge entries
    const billEntries = (bills || []).map(b => ({
      id: b.id,
      date: formatDateStr(b.date),
      transactionType: 'BILL_INCENTIVE',
      particulars: `Incentive from Bill ${b.invoice_number}`,
      reference: b.invoice_number || '',
      incentive: parseFloat(b.amount) || 0,
      payment: 0,
      created_at: b.created_at
    }));

    const paymentEntries = (payments || []).map(p => ({
      id: p.id,
      date: formatDateStr(p.date),
      transactionType: 'PAYMENT',
      particulars: p.remarks || 'Payment Made',
      reference: p.reference_number || `SBPAY-${p.id}`,
      incentive: 0,
      payment: parseFloat(p.amount) || 0,
      created_at: p.created_at
    }));

    const mergedEntries = [...billEntries, ...paymentEntries];

    // Sort entries: date ASC, created_at ASC, id ASC
    mergedEntries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;

      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;

      return a.id - b.id;
    });

    // 7. Calculate running balances and totals
    let runningBalance = openingBalance;
    let totalIncentive = 0;
    let totalPayment = 0;

    const entries = mergedEntries.map(entry => {
      runningBalance = runningBalance + entry.incentive - entry.payment;
      totalIncentive += entry.incentive;
      totalPayment += entry.payment;

      return {
        ...entry,
        balance: runningBalance
      };
    });

    return {
      success: true,
      stationBoy: {
        id: stationBoy.id,
        name: stationBoy.name,
        phone: stationBoy.phone || ''
      },
      period: {
        fromDate: formattedFromDate,
        toDate: formattedToDate
      },
      openingBalance,
      entries,
      totals: {
        incentive: totalIncentive,
        payment: totalPayment
      },
      closingBalance: runningBalance
    };
  }
}

module.exports = new StationBoyLedgerService();
