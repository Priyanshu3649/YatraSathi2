require('dotenv').config();
const { sequelizeTVL } = require('./config/db');

const seedData = [
  {
    py_entry_no: 'PY000001',
    py_date: '2026-06-10',
    py_entry_type: 'Debit',
    py_customer_name: 'Arjun Mehta',
    py_customer_phone: '9876543220',
    py_amount: 1500.00,
    py_ref_number: 'REF-98124',
    py_bank_account: 'Cash Account',
    py_created_by: 'ADM001'
  },
  {
    py_entry_no: 'PY000002',
    py_date: '2026-06-12',
    py_entry_type: 'Debit',
    py_customer_name: 'Neha Agarwal',
    py_customer_phone: '9876543223',
    py_amount: 4500.00,
    py_ref_number: 'REF-11942',
    py_bank_account: 'Bank Account - SBI',
    py_created_by: 'ADM001'
  },
  {
    py_entry_no: 'PY000003',
    py_date: '2026-06-15',
    py_entry_type: 'Credit',
    py_customer_name: 'Kavya Reddy',
    py_customer_phone: '9876543221',
    py_amount: 1200.00,
    py_ref_number: 'REF-77123',
    py_bank_account: 'Bank Account - HDFC',
    py_created_by: 'ADM001'
  }
];

async function seed() {
  try {
    console.log('Seeding pyXpayment table...');
    
    // Check if data already exists
    const [existing] = await sequelizeTVL.query('SELECT COUNT(*) AS count FROM pyXpayment');
    if (existing[0].count > 0) {
      console.log('Data already exists, skipping seed.');
      process.exit(0);
    }
    
    for (const item of seedData) {
      await sequelizeTVL.query(`
        INSERT INTO pyXpayment 
        (py_entry_no, py_date, py_entry_type, py_customer_name, py_customer_phone, py_amount, py_ref_number, py_bank_account, py_created_by, py_status, edtm, eby, mdtm, mby)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', NOW(), 'SYSTEM', NOW(), 'SYSTEM')
      `, {
        replacements: [
          item.py_entry_no,
          item.py_date,
          item.py_entry_type,
          item.py_customer_name,
          item.py_customer_phone,
          item.py_amount,
          item.py_ref_number,
          item.py_bank_account,
          item.py_created_by
        ]
      });
    }
    console.log('Successfully seeded pyXpayment table!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding pyXpayment:', err);
    process.exit(1);
  }
}

seed();
