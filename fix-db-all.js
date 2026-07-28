const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAll() {
  const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: process.env.DB_PASSWORD });
  const [rows] = await conn.query('SHOW DATABASES LIKE \'TVL_%\'');
  const databases = rows.map(r => Object.values(r)[0]);
  
  databases.push('YATRASATHI_MASTER');

  for (const db of databases) {
    console.log(`Fixing database: ${db}`);
    await conn.query(`USE ${db}`);
    
    const queries = [
      "ALTER TABLE rcXreceipt ADD COLUMN attachment_path VARCHAR(500) NULL COMMENT 'Path to receipt proof image'",
      "ALTER TABLE rcXreceipt ADD COLUMN attachment_mime VARCHAR(50) NULL COMMENT 'MIME type of receipt proof image'",
      "ALTER TABLE pyXpayment ADD COLUMN attachment_path VARCHAR(500) NULL COMMENT 'Path to payment proof image'",
      "ALTER TABLE pyXpayment ADD COLUMN attachment_mime VARCHAR(50) NULL COMMENT 'MIME type of payment proof image'"
    ];

    for (const q of queries) {
      try {
        await conn.query(q);
        console.log(`  Success: ${q.split('ADD COLUMN')[1].trim()}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          // Already exists, ignore
        } else {
          console.log(`  Error: ${e.message}`);
        }
      }
    }
  }
  process.exit(0);
}
fixAll();
