const { sequelize, sequelizeTVL } = require('../models');

async function migrate() {
  console.log('🚀 Starting Customer Table Consolidation Migration...');

  const databases = [sequelize, sequelizeTVL];
  const columnsToAdd = [
    { name: 'us_fname', type: 'VARCHAR(100) NULL' },
    { name: 'us_lname', type: 'VARCHAR(100) NULL' },
    { name: 'us_email', type: 'VARCHAR(120) NULL' },
    { name: 'us_phone', type: 'VARCHAR(30) NULL' },
    { name: 'us_pwd', type: 'VARCHAR(255) NULL' },
    { name: 'us_addr1', type: 'VARCHAR(255) NULL' },
    { name: 'us_city', type: 'VARCHAR(100) NULL' },
    { name: 'us_state', type: 'VARCHAR(100) NULL' },
    { name: 'us_pin', type: 'VARCHAR(20) NULL' },
    { name: 'us_aadhaar', type: 'VARCHAR(20) NULL' },
    { name: 'us_title', type: 'VARCHAR(50) NULL' }
  ];

  for (const db of databases) {
    const dbName = db.config.database;
    console.log(`\n📦 Checking database: ${dbName}...`);

    try {
      const [existingCols] = await db.query('DESCRIBE cuXcustomer');
      const existingNames = new Set(existingCols.map(c => c.Field));

      for (const col of columnsToAdd) {
        if (!existingNames.has(col.name)) {
          console.log(`➕ Adding column ${col.name} to cuXcustomer in ${dbName}...`);
          await db.query(`ALTER TABLE cuXcustomer ADD COLUMN ${col.name} ${col.type}`);
        } else {
          console.log(`✓ Column ${col.name} already exists in ${dbName}`);
        }
      }

      // Check if usXuser exists in this database
      const [userTableCheck] = await db.query("SHOW TABLES LIKE 'usXuser'");
      if (userTableCheck.length > 0) {
        console.log(`🔄 Migrating data from usXuser to cuXcustomer in ${dbName}...`);
        await db.query(`
          UPDATE cuXcustomer cu
          INNER JOIN usXuser u ON cu.cu_usid = u.us_usid
          SET 
            cu.us_fname = COALESCE(NULLIF(cu.us_fname, ''), u.us_fname),
            cu.us_lname = COALESCE(NULLIF(cu.us_lname, ''), u.us_lname),
            cu.us_email = COALESCE(NULLIF(cu.us_email, ''), u.us_email),
            cu.us_phone = COALESCE(NULLIF(cu.us_phone, ''), u.us_phone),
            cu.us_addr1 = COALESCE(NULLIF(cu.us_addr1, ''), u.us_addr1),
            cu.us_city = COALESCE(NULLIF(cu.us_city, ''), u.us_city),
            cu.us_state = COALESCE(NULLIF(cu.us_state, ''), u.us_state),
            cu.us_pin = COALESCE(NULLIF(cu.us_pin, ''), u.us_pin),
            cu.us_aadhaar = COALESCE(NULLIF(cu.us_aadhaar, ''), u.us_aadhaar),
            cu.us_title = COALESCE(NULLIF(cu.us_title, ''), u.us_title);
        `);
        console.log(`✅ Data migration completed in ${dbName}`);
      }
    } catch (err) {
      console.error(`❌ Error migrating in ${dbName}:`, err.message);
    }
  }

  console.log('\n🎉 Customer table consolidation migration completed successfully!');
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = migrate;
