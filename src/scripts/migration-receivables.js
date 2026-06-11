const { sequelizeTVL } = require('../../config/db');

async function migrate() {
  console.log('🚀 Starting Financial Ledger & Payment Tracking Migration...');
  
  try {
    // 1. Create payment_allocations table
    console.log('Creating payment_allocations table...');
    await sequelizeTVL.query(`
      CREATE TABLE IF NOT EXISTS payment_allocations (
        allocation_id INT AUTO_INCREMENT PRIMARY KEY,
        payment_id BIGINT NOT NULL,
        bill_id INT NOT NULL,
        allocated_amount DECIMAL(12, 2) NOT NULL,
        allocation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(15) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pa_payment_id (payment_id),
        INDEX idx_pa_bill_id (bill_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ payment_allocations table created/verified.');

    // 2. Create customer_ledger table
    console.log('Creating customer_ledger table...');
    await sequelizeTVL.query(`
      CREATE TABLE IF NOT EXISTS customer_ledger (
        ledger_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        customer_id VARCHAR(15) NOT NULL,
        entry_type ENUM('BILL', 'PAYMENT', 'PAYMENT_REVERSAL', 'BILL_CANCELLED', 'ADJUSTMENT') NOT NULL,
        reference_type VARCHAR(20) NOT NULL,
        reference_id BIGINT NOT NULL,
        debit_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        credit_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        entry_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        remarks TEXT NULL,
        created_by VARCHAR(15) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cl_customer_id (customer_id),
        INDEX idx_cl_entry_type (entry_type),
        INDEX idx_cl_reference (reference_type, reference_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ customer_ledger table created/verified.');

    // 3. Clear new tables in case of re-run to avoid duplication
    await sequelizeTVL.query('TRUNCATE TABLE payment_allocations');
    await sequelizeTVL.query('TRUNCATE TABLE customer_ledger');
    console.log('🧹 Cleaned existing migration entries.');

    // 4. Backfill customer_ledger from historical bills
    console.log('Backfilling bills into ledger...');
    const [bills] = await sequelizeTVL.query(`
      SELECT 
        b.bl_id,
        b.bl_bill_no,
        b.bl_total_amount,
        b.bl_billing_date,
        b.bl_created_at,
        b.bl_created_by,
        b.bl_status,
        b.is_cancelled,
        bk.bk_usid AS customer_id
      FROM blXbilling b
      JOIN bkXbooking bk ON b.bl_booking_id = bk.bk_bkid
    `);
    
    console.log(`Found ${bills.length} bills to process.`);
    for (const bill of bills) {
      const entryDate = bill.bl_billing_date || bill.bl_created_at || new Date();
      const createdBy = bill.bl_created_by ? String(bill.bl_created_by) : 'SYSTEM';

      // Insert BILL entry
      await sequelizeTVL.query(`
        INSERT INTO customer_ledger 
          (customer_id, entry_type, reference_type, reference_id, debit_amount, credit_amount, entry_date, remarks, created_by, created_at)
        VALUES 
          (:customerId, 'BILL', 'BILL', :billId, :amount, 0.00, :entryDate, :remarks, :createdBy, NOW())
      `, {
        replacements: {
          customerId: bill.customer_id,
          billId: bill.bl_id,
          amount: parseFloat(bill.bl_total_amount) || 0,
          entryDate,
          remarks: `Legacy bill entry: ${bill.bl_bill_no || bill.bl_id}`,
          createdBy
        }
      });

      // Insert BILL_CANCELLED entry if cancelled
      if (bill.bl_status === 'CANCELLED' || bill.bl_status === 'CAN' || bill.is_cancelled === 1) {
        await sequelizeTVL.query(`
          INSERT INTO customer_ledger 
            (customer_id, entry_type, reference_type, reference_id, debit_amount, credit_amount, entry_date, remarks, created_by, created_at)
          VALUES 
            (:customerId, 'BILL_CANCELLED', 'BILL', :billId, 0.00, :amount, :entryDate, :remarks, :createdBy, NOW())
        `, {
          replacements: {
            customerId: bill.customer_id,
            billId: bill.bl_id,
            amount: parseFloat(bill.bl_total_amount) || 0,
            entryDate,
            remarks: `Legacy bill cancellation: ${bill.bl_bill_no || bill.bl_id}`,
            createdBy
          }
        });
      }
    }
    console.log('✅ Bills backfilled successfully.');

    // 5. Backfill customer_ledger from historical payments
    console.log('Backfilling payments into ledger...');
    const [payments] = await sequelizeTVL.query(`
      SELECT 
        pt_ptid,
        pt_custid,
        pt_amount,
        pt_paydt,
        pt_status,
        eby,
        edtm
      FROM ptXpayment
    `);

    console.log(`Found ${payments.length} payments to process.`);
    for (const payment of payments) {
      const entryDate = payment.pt_paydt || payment.edtm || new Date();
      const createdBy = payment.eby ? String(payment.eby) : 'SYSTEM';

      // Insert PAYMENT entry
      await sequelizeTVL.query(`
        INSERT INTO customer_ledger 
          (customer_id, entry_type, reference_type, reference_id, debit_amount, credit_amount, entry_date, remarks, created_by, created_at)
        VALUES 
          (:customerId, 'PAYMENT', 'PAYMENT', :paymentId, 0.00, :amount, :entryDate, :remarks, :createdBy, NOW())
      `, {
        replacements: {
          customerId: payment.pt_custid,
          paymentId: payment.pt_ptid,
          amount: parseFloat(payment.pt_amount) || 0,
          entryDate,
          remarks: `Legacy payment receipt: ${payment.pt_ptid}`,
          createdBy
        }
      });

      // Insert PAYMENT_REVERSAL entry if reversed
      if (payment.pt_status === 'REVERSED') {
        await sequelizeTVL.query(`
          INSERT INTO customer_ledger 
            (customer_id, entry_type, reference_type, reference_id, debit_amount, credit_amount, entry_date, remarks, created_by, created_at)
          VALUES 
            (:customerId, 'PAYMENT_REVERSAL', 'PAYMENT', :paymentId, :amount, 0.00, :entryDate, :remarks, :createdBy, NOW())
        `, {
          replacements: {
            customerId: payment.pt_custid,
            paymentId: payment.pt_ptid,
            amount: parseFloat(payment.pt_amount) || 0,
            entryDate,
            remarks: `Legacy payment reversal: ${payment.pt_ptid}`,
            createdBy
          }
        });
      }
    }
    console.log('✅ Payments backfilled successfully.');

    // 6. Backfill payment_allocations from existing paXpayalloc
    console.log('Backfilling allocations from paXpayalloc table...');
    const [existingAllocations] = await sequelizeTVL.query(`
      SELECT 
        pa.pa_ptid AS payment_id,
        b.bl_id AS bill_id,
        pa.pa_allocamt AS allocated_amount,
        pa.pa_allocdt AS allocation_date,
        pa.eby AS created_by,
        pa.edtm AS created_at,
        pa.pa_rmrks AS remarks
      FROM paXpayalloc pa
      JOIN pnXpnr p ON pa.pa_pnid = p.pn_pnid
      JOIN blXbilling b ON p.pn_bkid = b.bl_booking_id
      WHERE pa.pa_status != 'DELETED'
    `);

    console.log(`Found ${existingAllocations.length} direct PNR allocations to map to bills.`);
    for (const alloc of existingAllocations) {
      await sequelizeTVL.query(`
        INSERT INTO payment_allocations 
          (payment_id, bill_id, allocated_amount, allocation_date, created_by, created_at)
        VALUES 
          (:paymentId, :billId, :amount, :allocDate, :createdBy, :createdAt)
      `, {
        replacements: {
          paymentId: alloc.payment_id,
          billId: alloc.bill_id,
          amount: parseFloat(alloc.allocated_amount) || 0,
          allocDate: alloc.allocation_date || new Date(),
          createdBy: alloc.created_by || 'SYSTEM',
          createdAt: alloc.created_at || new Date()
        }
      });
    }
    console.log('✅ Direct allocations backfilled successfully.');

    // 7. Perform FIFO fallback allocation for unallocated balances
    console.log('Running FIFO allocation fallback for unallocated payments and bills...');
    const [customers] = await sequelizeTVL.query('SELECT DISTINCT cu_usid FROM cuXcustomer');
    
    for (const customer of customers) {
      const customerId = customer.cu_usid;
      
      // Get all active bills of customer
      const [customerBills] = await sequelizeTVL.query(`
        SELECT bl_id, bl_total_amount, bl_billing_date, bl_created_at
        FROM blXbilling b
        JOIN bkXbooking bk ON b.bl_booking_id = bk.bk_bkid
        WHERE bk.bk_usid = :customerId
          AND b.bl_status NOT IN ('CANCELLED', 'CAN')
        ORDER BY b.bl_billing_date ASC, b.bl_id ASC
      `, { replacements: { customerId } });

      // Get all active payments of customer
      const [customerPayments] = await sequelizeTVL.query(`
        SELECT pt_ptid, pt_amount, pt_paydt, edtm
        FROM ptXpayment
        WHERE pt_custid = :customerId
          AND pt_status != 'REVERSED'
        ORDER BY pt_paydt ASC, pt_ptid ASC
      `, { replacements: { customerId } });

      if (customerBills.length === 0 || customerPayments.length === 0) continue;

      // Track allocations
      const billAllocations = {}; // bill_id -> sum_allocated
      
      // Pre-populate existing direct allocations
      const [directAllocs] = await sequelizeTVL.query(`
        SELECT bill_id, SUM(allocated_amount) AS total_allocated
        FROM payment_allocations
        WHERE bill_id IN (:billIds)
        GROUP BY bill_id
      `, { 
        replacements: { 
          billIds: customerBills.map(b => b.bl_id).concat([0]) 
        } 
      });

      for (const da of directAllocs) {
        billAllocations[da.bill_id] = parseFloat(da.total_allocated) || 0;
      }

      // Track payment unallocated balances
      const paymentBalances = {}; // pt_ptid -> remaining_amount
      const [paymentAllocs] = await sequelizeTVL.query(`
        SELECT payment_id, SUM(allocated_amount) AS total_allocated
        FROM payment_allocations
        WHERE payment_id IN (:paymentIds)
        GROUP BY payment_id
      `, { 
        replacements: { 
          paymentIds: customerPayments.map(p => p.pt_ptid).concat([0]) 
        } 
      });

      const paymentAllocMap = {};
      for (const pa of paymentAllocs) {
        paymentAllocMap[pa.payment_id] = parseFloat(pa.total_allocated) || 0;
      }

      for (const p of customerPayments) {
        const allocated = paymentAllocMap[p.pt_ptid] || 0;
        paymentBalances[p.pt_ptid] = Math.max(0, parseFloat(p.pt_amount) - allocated);
      }

      // FIFO allocation logic
      for (const pay of customerPayments) {
        let payRem = paymentBalances[pay.pt_ptid];
        if (payRem <= 0) continue;

        for (const bill of customerBills) {
          const billTotal = parseFloat(bill.bl_total_amount) || 0;
          const alreadyAllocated = billAllocations[bill.bl_id] || 0;
          const billPending = Math.max(0, billTotal - alreadyAllocated);

          if (billPending <= 0) continue;

          const allocAmount = Math.min(payRem, billPending);
          if (allocAmount > 0) {
            // Write allocation
            await sequelizeTVL.query(`
              INSERT INTO payment_allocations 
                (payment_id, bill_id, allocated_amount, allocation_date, created_by, created_at)
              VALUES 
                (:paymentId, :billId, :amount, :allocDate, 'SYSTEM', NOW())
            `, {
              replacements: {
                paymentId: pay.pt_ptid,
                billId: bill.bl_id,
                amount: allocAmount,
                allocDate: pay.pt_paydt || new Date()
              }
            });

            // Write ledger adjustment log
            await sequelizeTVL.query(`
              INSERT INTO customer_ledger 
                (customer_id, entry_type, reference_type, reference_id, debit_amount, credit_amount, entry_date, remarks, created_by, created_at)
              VALUES 
                (:customerId, 'ADJUSTMENT', 'BILL', :billId, 0.00, 0.00, :entryDate, :remarks, 'SYSTEM', NOW())
            `, {
              replacements: {
                customerId,
                billId: bill.bl_id,
                entryDate: new Date(),
                remarks: `LEGACY_MIGRATION: Allocated ₹${allocAmount} from Payment ${pay.pt_ptid} to Bill ${bill.bl_id}`
              }
            });

            billAllocations[bill.bl_id] = alreadyAllocated + allocAmount;
            payRem -= allocAmount;
            paymentBalances[pay.pt_ptid] = payRem;

            if (payRem <= 0) break;
          }
        }
      }

      // Update calculations back onto original bills and payments
      for (const bill of customerBills) {
        const totalAlloc = billAllocations[bill.bl_id] || 0;
        const billAmt = parseFloat(bill.bl_total_amount) || 0;
        let pStatus = 'UNPAID';
        if (totalAlloc >= billAmt) {
          pStatus = 'FULLY_PAID';
        } else if (totalAlloc > 0) {
          pStatus = 'PARTIALLY_PAID';
        }

        await sequelizeTVL.query(`
          UPDATE blXbilling 
          SET payment_status = :pStatus 
          WHERE bl_id = :billId
        `, { replacements: { pStatus, billId: bill.bl_id } });
      }

      for (const pay of customerPayments) {
        const totalAlloc = parseFloat(pay.pt_amount) - paymentBalances[pay.pt_ptid];
        const unalloc = paymentBalances[pay.pt_ptid];
        await sequelizeTVL.query(`
          UPDATE ptXpayment 
          SET pt_allocatedamt = :totalAlloc, pt_unallocamt = :unalloc
          WHERE pt_ptid = :payId
        `, { replacements: { totalAlloc, unalloc, payId: pay.pt_ptid } });
      }
    }

    console.log('✅ FIFO Allocation backfill completed.');
    console.log('🎉 Receivables ledger migration successfully finished!');
    
  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrate };
