const { connectDB } = require('../../config/db');
const { ptXpayment: PaymentTVL, UserTVL, CustomerTVL } = require('../models');

async function createPaymentSeedData() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');

    // Check if there are any existing payments to avoid duplicates
    const existingPayments = await PaymentTVL.count();
    if (existingPayments > 0) {
      console.log(`Found ${existingPayments} existing payments. Skipping seed data creation.`);
      return;
    }

    // Find some existing users/customers to link payments to
    const customers = await CustomerTVL.findAll({ limit: 5 });
    if (customers.length === 0) {
      console.log('No customers found. Please run the demo data seed first.');
      return;
    }

    // Create sample payment records
    const paymentRecords = [
      {
        pt_custid: customers[0].us_usid, // Link to first customer
        pt_amount: 5000.00,
        pt_mode: 'CASH',
        pt_refno: 'CASH-001',
        pt_paydt: new Date(),
        pt_status: 'RECEIVED',
        pt_remarks: 'Initial cash payment',
        eby: customers[0].us_usid,
        mby: customers[0].us_usid
      },
      {
        pt_custid: customers[0].us_usid, // Link to first customer
        pt_amount: 3500.00,
        pt_mode: 'UPI',
        pt_refno: 'UPI-20240111001',
        pt_paydt: new Date(),
        pt_status: 'RECEIVED',
        pt_remarks: 'Online UPI payment',
        eby: customers[0].us_usid,
        mby: customers[0].us_usid
      },
      {
        pt_custid: customers[1].us_usid, // Link to second customer
        pt_amount: 8200.00,
        pt_mode: 'CARD',
        pt_refno: 'CARD-002',
        pt_paydt: new Date('2024-01-10'),
        pt_status: 'RECEIVED',
        pt_remarks: 'Credit card payment',
        eby: customers[1].us_usid,
        mby: customers[1].us_usid
      },
      {
        pt_custid: customers[2].us_usid, // Link to third customer
        pt_amount: 2400.00,
        pt_mode: 'CHEQUE',
        pt_refno: 'CHQ-001',
        pt_paydt: new Date('2024-01-09'),
        pt_status: 'RECEIVED',
        pt_remarks: 'Cheque payment',
        eby: customers[2].us_usid,
        mby: customers[2].us_usid
      },
      {
        pt_custid: customers[1].us_usid, // Link to second customer
        pt_amount: 6750.00,
        pt_mode: 'NEFT',
        pt_refno: 'NEFT-001',
        pt_paydt: new Date('2024-01-08'),
        pt_status: 'RECEIVED',
        pt_remarks: 'NEFT transfer',
        eby: customers[1].us_usid,
        mby: customers[1].us_usid
      }
    ];

    console.log(`Creating ${paymentRecords.length} payment records...`);
    for (const payment of paymentRecords) {
      await PaymentTVL.create(payment);
      console.log(`Created payment for customer: ${payment.pt_custid}, amount: ${payment.pt_amount}`);
    }

    console.log('✅ Payment seed data created successfully!');
    console.log(`Total payments created: ${paymentRecords.length}`);

  } catch (error) {
    console.error('❌ Error creating payment seed data:', error);
    throw error;
  }
}

// Run the seeding function if called directly
if (require.main === module) {
  createPaymentSeedData()
    .then(() => {
      console.log('Payment seed data creation completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create payment seed data:', error);
      process.exit(1);
    });
}

module.exports = { createPaymentSeedData };