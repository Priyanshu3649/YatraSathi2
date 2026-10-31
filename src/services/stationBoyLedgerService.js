const { StationBoy } = require('../models');
const { sequelizeTVL: sequelize } = require('../../config/db');
const { QueryTypes } = require('sequelize');
const settlementService = require('./stationBoySettlementService');

const round2 = settlementService.round2;

class StationBoyLedgerService {
  /**
   * Station Boy Ledger
   * Payable = net railway fare + station boy incentive (both paid to the station boy)
   * Payments settle the oldest pending bill first (FIFO).
   */
  async getStationBoyVintageLedger(stationBoyId, fromDate, toDate) {
    const stationBoy = await StationBoy.findByPk(stationBoyId);
    if (!stationBoy) {
      throw new Error(`Station Boy not found with ID ${stationBoyId}`);
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed: April is 3
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;

    const finalFromDate = fromDate || `${startYear}-04-01`;
    const finalToDate = toDate || `${startYear + 1}-03-31`;

    const formattedFromDate = this.formatDateStr(finalFromDate);
    const formattedToDate = this.formatDateStr(finalToDate);

    const allBills = await settlementService.getPayableBills(stationBoyId);

    const openingPayable = round2(
      allBills
        .filter((bill) => this.formatDateStr(bill.billDate) < formattedFromDate)
        .reduce((sum, bill) => sum + bill.payable, 0)
    );

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

    const openingPayments = round2(paymentsBefore?.total_payment);
    const openingBalance = round2(openingPayable - openingPayments);

    const periodBills = allBills.filter((bill) => {
      const billDate = this.formatDateStr(bill.billDate);
      return billDate >= formattedFromDate && billDate <= formattedToDate;
    });

    const payments = await sequelize.query(`
      SELECT
        id,
        payment_date AS date,
        reference_number,
        amount,
        payment_mode,
        remarks,
        is_reconciled,
        reconciled_at,
        created_at,
        (SELECT COALESCE(SUM(allocated_amount), 0) FROM sbXsbpayalloc WHERE payment_id = sbXsbpay.id) AS allocated
      FROM sbXsbpay
      WHERE station_boy_id = :stationBoyId
        AND payment_date >= :fromDate
        AND payment_date <= :toDate
        AND status = 'ACTIVE'
      ORDER BY payment_date ASC, id ASC
    `, {
      replacements: { stationBoyId, fromDate: formattedFromDate, toDate: formattedToDate },
      type: QueryTypes.SELECT
    });

    const paymentIds = payments.map((payment) => payment.id);
    let paymentAllocations = [];
    if (paymentIds.length > 0) {
      paymentAllocations = await sequelize.query(`
        SELECT
          a.payment_id,
          a.bill_id,
          a.allocated_amount,
          a.is_reconciled,
          b.bl_bill_no,
          b.bl_sub_bill_no,
          b.bl_billing_date
        FROM sbXsbpayalloc a
        JOIN blXbilling b ON b.bl_id = a.bill_id
        WHERE a.payment_id IN (:paymentIds)
        ORDER BY b.bl_billing_date ASC, a.bill_id ASC
      `, {
        replacements: { paymentIds },
        type: QueryTypes.SELECT
      });
    }

    const allocationsByPayment = new Map();
    for (const allocation of paymentAllocations) {
      const paymentId = Number(allocation.payment_id);
      if (!allocationsByPayment.has(paymentId)) {
        allocationsByPayment.set(paymentId, []);
      }
      allocationsByPayment.get(paymentId).push({
        billId: allocation.bill_id,
        billNo: allocation.bl_bill_no,
        subBillNo: allocation.bl_sub_bill_no || null,
        billDate: this.formatDateStr(allocation.bl_billing_date),
        amount: round2(allocation.allocated_amount),
        isReconciled: Boolean(allocation.is_reconciled)
      });
    }

    const billEntries = periodBills.map((bill) => ({
      id: bill.billId,
      date: this.formatDateStr(bill.billDate),
      transactionType: 'BILL_PAYABLE',
      particulars: `Net railway fare + incentive - Bill ${bill.billNo}${bill.subBillNo ? ` (${bill.subBillNo})` : ''}`,
      reference: bill.billNo + (bill.subBillNo ? ` / ${bill.subBillNo}` : ''),
      railwayFare: bill.railwayFare,
      incentive: bill.incentive,
      payable: bill.payable,
      payment: 0,
      settledAmount: bill.allocated,
      pendingAmount: bill.pending,
      settlementStatus: bill.settlementStatus,
      created_at: bill.createdAt
    }));

    const paymentEntries = payments.map((payment) => {
      const amount = round2(payment.amount);
      const allocated = round2(payment.allocated);
      const allocations = allocationsByPayment.get(Number(payment.id)) || [];
      const isFullySettled = allocated >= amount - 0.009;

      return {
        id: payment.id,
        date: this.formatDateStr(payment.date),
        transactionType: 'PAYMENT',
        particulars: payment.remarks || 'Payment made to station boy',
        reference: payment.reference_number || `SBPAY-${payment.id}`,
        railwayFare: 0,
        incentive: 0,
        payable: 0,
        payment: amount,
        settledAmount: allocated,
        pendingAmount: round2(Math.max(0, amount - allocated)),
        settlementStatus: isFullySettled ? 'SETTLED' : 'UNSETTLED',
        isReconciled: Boolean(payment.is_reconciled),
        reconciledAt: payment.reconciled_at,
        allocations,
        created_at: payment.created_at
      };
    });

    const mergedEntries = [...billEntries, ...paymentEntries];

    mergedEntries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;

      // Bills before payments on the same day so a payment settles that day's bill first.
      if (a.transactionType !== b.transactionType) {
        return a.transactionType === 'BILL_PAYABLE' ? -1 : 1;
      }

      return a.id - b.id;
    });

    let runningBalance = openingBalance;
    let totalRailwayFare = 0;
    let totalIncentive = 0;
    let totalPayable = 0;
    let totalPayment = 0;

    const entries = mergedEntries.map((entry) => {
      runningBalance = round2(runningBalance + entry.payable - entry.payment);
      totalRailwayFare = round2(totalRailwayFare + entry.railwayFare);
      totalIncentive = round2(totalIncentive + entry.incentive);
      totalPayable = round2(totalPayable + entry.payable);
      totalPayment = round2(totalPayment + entry.payment);

      return {
        ...entry,
        balance: runningBalance
      };
    });

    const outstanding = round2(allBills.reduce((sum, bill) => sum + bill.pending, 0));

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
        railwayFare: totalRailwayFare,
        incentive: totalIncentive,
        payable: totalPayable,
        payment: totalPayment
      },
      outstanding,
      closingBalance: runningBalance
    };
  }

  formatDateStr(d) {
    if (!d) return '';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
      return d.slice(0, 10);
    }
    const dateObj = new Date(d);
    if (Number.isNaN(dateObj.getTime())) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

module.exports = new StationBoyLedgerService();
