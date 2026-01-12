const { connectDB } = require('../../config/db');
const { ptXpayment: PaymentTVL, CustomerTVL, UserTVL } = require('../models');

async function populatePaymentDemoData() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');

    // Check if there are existing payments to avoid duplicates
    const existingPayments = await PaymentTVL.count();
    console.log(`Found ${existingPayments} existing payments.`);

    // Get some existing customers/users to link payments to
    const customers = await CustomerTVL.findAll({ limit: 10 });
    if (customers.length === 0) {
      console.log('No customers found. Please run the demo data seed first.');
      return;
    }

    // Create sample payment records with realistic data
    const paymentRecords = [
      {
        pt_custid: 1, // Use direct numeric ID to avoid issues
        pt_totalamt: 4500.00,
        pt_amount: 4500.00,
        pt_mode: 'CASH',
        pt_refno: 'CASH-002',
        pt_paydt: new Date('2026-01-01'),
        pt_status: 'RECEIVED',
        pt_remarks: 'Cash payment for booking',
        pt_acid: 19,
        pt_allocatedamt: 0.00,
        pt_finyear: '2026-27',
        pt_period: '2026-01',
        pt_locked: 0,
        edtm: new Date(),
        eby: 'ADM001',
        mdtm: new Date(),
        mby: 'ADM001'
      },
      {
        pt_custid: 2, // Use direct numeric ID to avoid issues
        pt_totalamt: 3200.00,
        pt_amount: 3200.00,
        pt_mode: 'UPI',
        pt_refno: 'UPI-20260112001',
        pt_paydt: new Date('2026-01-05'),
        pt_status: 'RECEIVED',
        pt_remarks: 'UPI payment for travel',
        pt_acid: 20,
        pt_allocatedamt: 0.00,
        pt_finyear: '2026-27',
        pt_period: '2026-01',
        pt_locked: 0,
        edtm: new Date(),
        eby: 'ADM001',
        mdtm: new Date(),
        mby: 'ADM001'
      },
      {
        pt_custid: 3, // Use direct numeric ID to avoid issues
        pt_totalamt: 7800.00,
        pt_amount: 7800.00,
        pt_mode: 'CARD',
        pt_refno: 'CARD-003',
        pt_paydt: new Date('2026-01-08'),
        pt_status: 'RECEIVED',
        pt_remarks: 'Credit card payment for premium booking',
        pt_acid: 21,
        pt_allocatedamt: 0.00,
        pt_finyear: '2026-27',
        pt_period: '2026-01',
        pt_locked: 0,
        edtm: new Date(),
        eby: 'ADM001',
        mdtm: new Date(),
        mby: 'ADM001'
      },
      {
        pt_custid: 1, // Use direct numeric ID to avoid issues
        pt_totalamt: 2100.00,
        pt_amount: 2100.00,
        pt_mode: 'CHEQUE',
        pt_refno: 'CHQ-002',
        pt_paydt: new Date('2026-01-10'),
        pt_status: 'RECEIVED',
        pt_remarks: 'Cheque payment for booking',
        pt_acid: 22,
        pt_allocatedamt: 0.00,
        pt_finyear: '2026-27',
        pt_period: '2026-01',
        pt_locked: 0,
        edtm: new Date(),
        eby: 'ADM001',
        mdtm: new Date(),
        mby: 'ADM001'
      },
      {
        pt_custid: 4, // Use direct numeric ID to avoid issues
        pt_totalamt: 9500.00,
        pt_amount: 9500.00,
        pt_mode: 'NEFT',
        pt_refno: 'NEFT-002',
        pt_paydt: new Date('2026-01-11'),
        pt_status: 'RECEIVED',
        pt_remarks: 'NEFT transfer for corporate booking',
        pt_acid: 23,
        pt_allocatedamt: 0.00,
        pt_finyear: '2026-27',
        pt_period: '2026-01',
        pt_locked: 0,
        edtm: new Date(),
        eby: 'ADM001',
        mdtm: new Date(),
        mby: 'ADM001'
      },
      {
        pt_custid: 2, // Use direct numeric ID to avoid issues
        pt_totalamt: 1500.00,
        pt_amount: 1500.00,
        pt_mode: 'ONLINE',
        pt_refno: 'ONLINE-001',
        pt_paydt: new Date('2026-01-12'),
        pt_status: 'PENDING',
        pt_remarks: 'Online payment pending confirmation',
        pt_acid: 24,
        pt_allocatedamt: 0.00,
        pt_finyear: '2026-27',
        pt_period: '2026-01',
        pt_locked: 0,
        edtm: new Date(),
        eby: 'ADM001',
        mdtm: new Date(),
        mby: 'ADM001'
      }
    ];

    console.log(`Adding ${paymentRecords.length} demo payment records...`);
    for (const payment of paymentRecords) {
      // Try to create the payment record
      try {
        const createdPayment = await PaymentTVL.create(payment);
        console.log(`✅ Created payment for customer ID: ${payment.pt_custid}, amount: ${payment.pt_amount}, ID: ${createdPayment.pt_ptid}`);
      } catch (error) {
        console.log(`⚠️  Could not create payment for customer ID: ${payment.pt_custid}, error:`, error.message);
      }
    }

    console.log('\n✅ Payment demo data population completed successfully!');
    
    // Show total count after adding new records
    const finalCount = await PaymentTVL.count();
    console.log(`📊 Total payments in database after population: ${finalCount}`);

  } catch (error) {
    console.error('❌ Error populating payment demo data:', error);
    throw error;
  }
}

// Run the seeding function if called directly
if (require.main === module) {
  populatePaymentDemoData()
    .then(() => {
      console.log('Payment demo data population completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to populate payment demo data:', error);
      process.exit(1);
    });
}

module.exports = { populatePaymentDemoData };