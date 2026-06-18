require('dotenv').config();
const { sequelizeTVL } = require('./config/db');

const sql = `
CREATE TABLE IF NOT EXISTS \`pyXpayment\` (
  \`py_pymtid\` bigint NOT NULL AUTO_INCREMENT COMMENT 'Payment ID',
  \`py_entry_no\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Auto-generated entry number',
  \`py_date\` date NOT NULL COMMENT 'Payment date',
  \`py_entry_type\` enum('Debit','Credit') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entry type',
  \`py_customer_name\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Customer name',
  \`py_customer_phone\` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Customer phone',
  \`py_amount\` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Payment amount',
  \`py_ref_number\` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Reference number',
  \`py_bank_account\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bank account name',
  \`py_balance\` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Current balance',
  \`py_total_credit\` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Total credit amount',
  \`py_total_debit\` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Total debit amount',
  \`py_created_by\` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID who created the payment',
  \`py_status\` enum('Active','Inactive','Deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active' COMMENT 'Payment status',
  \`edtm\` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  \`eby\` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  \`mdtm\` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  \`mby\` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  \`entered_by\` int DEFAULT NULL COMMENT 'Entered By User ID',
  \`entered_on\` datetime DEFAULT NULL COMMENT 'Entered On',
  \`modified_by\` int DEFAULT NULL COMMENT 'Modified By User ID',
  \`modified_on\` datetime DEFAULT NULL COMMENT 'Modified On',
  \`closed_by\` int DEFAULT NULL COMMENT 'Closed By User ID',
  \`closed_on\` datetime DEFAULT NULL COMMENT 'Closed On',
  \`status\` enum('OPEN','CLOSED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'OPEN' COMMENT 'Record Status',
  \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`py_pymtid\`),
  UNIQUE KEY \`py_entry_no\` (\`py_entry_no\`),
  KEY \`idx_py_entry_no\` (\`py_entry_no\`),
  KEY \`idx_py_date\` (\`py_date\`),
  KEY \`idx_py_customer_phone\` (\`py_customer_phone\`),
  KEY \`idx_py_created_by\` (\`py_created_by\`),
  KEY \`idx_py_status\` (\`py_status\`),
  CONSTRAINT \`pyxpayment_ibfk_1\` FOREIGN KEY (\`py_created_by\`) REFERENCES \`usXuser\` (\`us_usid\`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function recreateTable() {
  try {
    console.log('Recreating table pyXpayment...');
    await sequelizeTVL.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelizeTVL.query(sql);
    await sequelizeTVL.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Successfully recreated pyXpayment table!');
    process.exit(0);
  } catch (err) {
    console.error('Error recreating table pyXpayment:', err);
    process.exit(1);
  }
}

recreateTable();
