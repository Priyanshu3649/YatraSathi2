const { sequelizeTVL } = require('../../config/db');
const { QueryTypes } = require('sequelize');
const Audit = require('../services/forensicAuditService');

async function runValidation() {
  console.log('⏰ Running YatraSathi Nightly Financial Ledger Integrity Check...');
  
  try {
    // 1. Get all customers from cuXcustomer table
    const customers = await sequelizeTVL.query(`
      SELECT cu_usid AS customer_id FROM cuXcustomer
      WHERE cu_usid IS NOT NULL AND cu_usid != ''
    `, { type: QueryTypes.SELECT });

    console.log(`Checking integrity for ${customers.length} active customers...`);
    let discrepancyCount = 0;

    for (const customer of customers) {
      const customerId = customer.customer_id;

      // 2. Sum of all non-cancelled bills
      const [billSumRes] = await sequelizeTVL.query(`
        SELECT COALESCE(SUM(b.bl_total_amount), 0) AS total_billed
        FROM blXbilling b
        JOIN bkXbooking bk ON b.bl_booking_id = bk.bk_bkid
        WHERE bk.bk_usid = :customerId
          AND b.bl_status NOT IN ('CANCELLED', 'CAN')
      `, {
        replacements: { customerId },
        type: QueryTypes.SELECT
      });

      // 3. Sum of all valid payments
      const [paymentSumRes] = await sequelizeTVL.query(`
        SELECT COALESCE(SUM(pt_amount), 0) AS total_received
        FROM ptXpayment
        WHERE pt_custid = :customerId
          AND pt_status != 'REVERSED'
      `, {
        replacements: { customerId },
        type: QueryTypes.SELECT
      });

      // 4. Sum of ledger debits minus credits
      const [ledgerRes] = await sequelizeTVL.query(`
        SELECT 
          COALESCE(SUM(debit_amount), 0) AS total_debit,
          COALESCE(SUM(credit_amount), 0) AS total_credit
        FROM customer_ledger
        WHERE customer_id = :customerId
      `, {
        replacements: { customerId },
        type: QueryTypes.SELECT
      });

      const bills = parseFloat(billSumRes.total_billed) || 0;
      const payments = parseFloat(paymentSumRes.total_received) || 0;
      const expectedBalance = bills - payments;

      const ledgerDebits = parseFloat(ledgerRes.total_debit) || 0;
      const ledgerCredits = parseFloat(ledgerRes.total_credit) || 0;
      const ledgerBalance = ledgerDebits - ledgerCredits;

      // 5. Compare with tolerance for floating point difference
      const difference = Math.abs(expectedBalance - ledgerBalance);
      if (difference > 0.01) {
        discrepancyCount++;
        const errorMessage = `DISCREPANCY detected for Customer ${customerId}. Expected (Bills - Payments): ₹${expectedBalance.toFixed(2)} (Bills: ₹${bills.toFixed(2)}, Payments: ₹${payments.toFixed(2)}), Actual Ledger Balance: ₹${ledgerBalance.toFixed(2)} (Debits: ₹${ledgerDebits.toFixed(2)}, Credits: ₹${ledgerCredits.toFixed(2)}). Diff: ₹${difference.toFixed(2)}`;
        console.error(`❌ ${errorMessage}`);

        // Write a forensic audit log entry for this discrepancy
        Audit.logAction({
          module: Audit.MODULES.LEDGER,
          recordId: customerId,
          action: 'LEDGER_DISCREPANCY',
          fieldName: 'ledger_balance',
          oldValue: String(ledgerBalance),
          newValue: String(expectedBalance)
        });
      }
    }

    if (discrepancyCount === 0) {
      console.log('✅ Nightly Integrity Check completed. No discrepancies found.');
    } else {
      console.warn(`⚠️ Nightly Integrity Check completed with ${discrepancyCount} discrepancies logged.`);
    }

  } catch (err) {
    console.error('❌ Nightly validation failed:', err);
  }
}

// Support running directly
if (require.main === module) {
  runValidation()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runValidation };
