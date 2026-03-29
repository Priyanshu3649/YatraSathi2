const { sequelizeTVL } = require('./config/db');

const addIndexes = async () => {
  try {
    console.log('Adding indexes for optimized filtering and sorting...');
    
    // Bookings
    await sequelizeTVL.query('CREATE INDEX idx_bk_trvldt ON bkXbooking (bk_trvldt)');
    await sequelizeTVL.query('CREATE INDEX idx_bk_status ON bkXbooking (bk_status)');
    await sequelizeTVL.query('CREATE INDEX idx_bk_usid ON bkXbooking (bk_usid)');
    await sequelizeTVL.query('CREATE INDEX idx_bk_agent ON bkXbooking (bk_agent)');
    
    // Billing
    await sequelizeTVL.query('CREATE INDEX idx_bl_billing_date ON blXbilling (bl_billing_date)');
    await sequelizeTVL.query('CREATE INDEX idx_bl_status ON blXbilling (bl_status)');
    await sequelizeTVL.query('CREATE INDEX idx_bl_booking_id ON blXbilling (bl_booking_id)');
    await sequelizeTVL.query('CREATE INDEX idx_bl_total_amount ON blXbilling (bl_total_amount)');
    
    // Payments
    await sequelizeTVL.query('CREATE INDEX idx_py_date ON ptXpayment (pt_paydt)');
    await sequelizeTVL.query('CREATE INDEX idx_py_status ON ptXpayment (pt_status)');
    await sequelizeTVL.query('CREATE INDEX idx_py_acid ON ptXpayment (pt_acid)');
    
    console.log('✅ All indexes added successfully!');
    process.exit(0);
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_KEYNAME') {
      console.log('⚠️ Some indexes already exist.');
      process.exit(0);
    }
    console.error('❌ Error adding indexes:', error);
    process.exit(1);
  }
};

addIndexes();
