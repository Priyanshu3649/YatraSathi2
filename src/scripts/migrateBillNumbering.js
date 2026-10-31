/**
 * Additive, idempotent migration for sequential bill numbering + R/C documents.
 *
 *   node src/scripts/migrateBillNumbering.js
 *
 * Nothing is dropped and no historical bill number is rewritten.
 */
require('dotenv').config({ quiet: true });
const { sequelizeTVL } = require('../../config/db');
const { QueryTypes } = require('sequelize');

const TABLE = 'blXbilling';

async function columnExists(column, table = TABLE) {
  const rows = await sequelizeTVL.query(`
    SELECT 1 AS found FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column
    LIMIT 1
  `, { replacements: { table, column }, type: QueryTypes.SELECT });
  return rows.length > 0;
}

async function indexExists(index) {
  const rows = await sequelizeTVL.query(`
    SELECT 1 AS found FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :index
    LIMIT 1
  `, { replacements: { table: TABLE, index }, type: QueryTypes.SELECT });
  return rows.length > 0;
}

async function addColumn(name, definition, table = TABLE) {
  if (await columnExists(name, table)) {
    console.log(`   - ${table}.${name} already present, skipped`);
    return;
  }
  await sequelizeTVL.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${definition}`);
  console.log(`   + ${table}.${name} added`);
}

async function createSequenceTable() {
  await sequelizeTVL.query(`
    CREATE TABLE IF NOT EXISTS bill_number_sequences (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      financial_year VARCHAR(10) NOT NULL,
      last_issued_number BIGINT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_bill_seq_financial_year (financial_year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('   - bill_number_sequences ready');
}

async function backfillBillingType() {
  const [result] = await sequelizeTVL.query(`
    UPDATE blXbilling
    SET bl_billing_type = 'C',
        bl_original_bill_id = bl_parent_bill_id
    WHERE bl_bill_type = 'CANCELLED_SPLIT'
      AND (bl_billing_type IS NULL OR bl_billing_type = 'R')
      AND bl_parent_bill_id IS NOT NULL
  `, { type: QueryTypes.UPDATE });
  console.log(`   - cancellation documents tagged as type C`);
}

async function dropIndex(index) {
  if (!(await indexExists(index))) {
    console.log(`   - index ${index} not present, nothing to drop`);
    return;
  }
  await sequelizeTVL.query(`ALTER TABLE \`${TABLE}\` DROP INDEX \`${index}\``);
  console.log(`   - dropped index ${index}`);
}

async function addIndex(index, columns) {
  if (await indexExists(index)) {
    console.log(`   - index ${index} already present, skipped`);
    return;
  }
  await sequelizeTVL.query(`CREATE INDEX \`${index}\` ON \`${TABLE}\` (${columns})`);
  console.log(`   + index ${index} on (${columns})`);
}

async function addUniqueIndex(index, columns, guardSql) {  if (await indexExists(index)) {
    console.log(`   - index ${index} already present, skipped`);
    return;
  }

  const conflicts = await sequelizeTVL.query(guardSql, { type: QueryTypes.SELECT });
  if (conflicts.length > 0) {
    console.warn(`   ! skipped UNIQUE ${index}: ${conflicts.length} duplicate group(s) already exist`);
    conflicts.slice(0, 10).forEach((row) => console.warn(`      ${JSON.stringify(row)}`));
    console.warn('     Resolve these rows, then re-run this migration to enforce uniqueness at the database level.');
    return;
  }

  await sequelizeTVL.query(`CREATE UNIQUE INDEX \`${index}\` ON \`${TABLE}\` (${columns})`);
  console.log(`   + UNIQUE ${index} on (${columns})`);
}

// Payments, allocations and ledger discrepancies are audited under their own
// action names; the column was created without them, so every one of those audit
// rows failed with "Data truncated for column 'action_type'" and was dropped.
async function extendAuditActionEnum(values) {
  const [col] = await sequelizeTVL.query(`
    SELECT COLUMN_TYPE AS type FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_forensic_log' AND COLUMN_NAME = 'action_type'
    LIMIT 1
  `, { type: QueryTypes.SELECT });
  if (!col) {
    console.warn('   ! audit_forensic_log.action_type not found, skipped');
    return;
  }
  const current = col.type.match(/'([^']*)'/g).map((quoted) => quoted.slice(1, -1));
  const missing = values.filter((value) => !current.includes(value));
  if (missing.length === 0) {
    console.log('   - audit actions already present, skipped');
    return;
  }
  const next = [...current, ...missing];
  await sequelizeTVL.query(
    `ALTER TABLE audit_forensic_log MODIFY COLUMN action_type ENUM(${next.map((v) => `'${v}'`).join(',')}) NOT NULL`
  );
  console.log(`   + audit actions added: ${missing.join(', ')}`);
}

// audit_forensic_log.changed_by has a FK into usxuser, and background writers
// (nightly validation, advance auto-adjust) stamp 'SYSTEM' when there is no
// request user. Those audit rows were dropped with a child-row FK error, which
// silently removed the ledger trail for exactly the automated postings.
// 'SYSTEM' is already the technical actor used by us_eby/us_mby, so it gets an
// inactive user row instead of a constraint change. us_active = 0 keeps it out
// of login (the auth lookup filters on it) and it never gets a login row.
async function ensureSystemAuditActor() {
  const rows = await sequelizeTVL.query(
    `SELECT 1 AS found FROM usXuser WHERE us_usid = 'SYSTEM' LIMIT 1`,
    { type: QueryTypes.SELECT }
  );
  if (rows.length > 0) {
    console.log('   - SYSTEM audit actor already present, skipped');
    return;
  }
  await sequelizeTVL.query(
    `INSERT INTO usXuser
       (us_usid, us_email, us_usname, us_fname, us_lname, us_usertype,
        us_admin, us_security, us_appadmin, us_active, us_limit, us_rmrks, us_cdtm, us_edtm, us_cby, us_eby)
     VALUES
       ('SYSTEM', 'system.audit@internal.invalid', 'SYSTEM', 'System', 'Automation', 'system',
        0, 0, 0, 0, 0.00,
        'Technical actor for automated postings (nightly validation, advance auto-adjust). Cannot log in.',
        NOW(), NOW(), 'MIGRATION', 'MIGRATION')`
  );
  console.log('   + SYSTEM audit actor created (inactive, no login)');
}

async function main() {
  console.log('Bill numbering migration');
  console.log('1. Sequence table');
  await createSequenceTable();

  console.log('2. Billing columns');
  await addColumn("bl_billing_type", "ENUM('R','C') NOT NULL DEFAULT 'R' COMMENT 'R = Regular bill, C = Cancellation document'");
  await addColumn("bl_original_bill_id", "BIGINT NULL COMMENT 'Bill reversed by a type C document'");
  await addColumn("cancellation_reason", "TEXT NULL COMMENT 'Cancellation reason'");

  console.log('3. Backfill R/C from legacy bl_bill_type');
  await backfillBillingType();

  console.log('4. Integrity constraints');

  // Historical rows used non-sequential numbers and two demo bills already share
  // BILL-<timestamp>. History is never renumbered, so uniqueness is enforced
  // through a generated column that only sees FY-format numbers (they always
  // contain the '/' separator); legacy values map to NULL and stay untouched.
  await addColumn(
    'bl_entry_no_sequential',
    `VARCHAR(30) GENERATED ALWAYS AS (CASE WHEN bl_entry_no LIKE '%/%' THEN bl_entry_no ELSE NULL END) STORED
     COMMENT 'FY-format bill number, NULL for legacy numbers'
  `
  );
  await addUniqueIndex(
    'uk_bl_entry_no_sequential',
    '`bl_entry_no_sequential`',
    `SELECT bl_entry_no_sequential AS value, COUNT(*) AS occurrences, GROUP_CONCAT(bl_id) AS bill_ids
     FROM blXbilling WHERE bl_entry_no_sequential IS NOT NULL
     GROUP BY bl_entry_no_sequential HAVING COUNT(*) > 1`
  );

  // One bill can legitimately carry several cancellation documents (one per
  // cancellation event), so the link to the original is indexed, not unique.
  await dropIndex('uk_bl_original_bill_id');
  await addIndex('idx_bl_original_bill_id', '`bl_original_bill_id`');
  await addIndex('idx_bl_billing_type', '`bl_billing_type`');

  console.log('5. Passenger bill link');
  // Billing already stamps the issued number onto each passenger; the column was
  // never created, so every bill write logged "Unknown column 'bl_bill_no'".
  await addColumn(
    'bl_bill_no',
    'VARCHAR(30) NULL COMMENT \'Bill number the ticket was billed under\'',
    'psXpassenger'
  );

  console.log('6. Forensic audit actions');
  await extendAuditActionEnum(['PAYMENT_CREATED', 'ALLOCATION_CREATED', 'LEDGER_DISCREPANCY']);

  console.log('7. Forensic audit actor');
  await ensureSystemAuditActor();

  console.log('Done.');
  await sequelizeTVL.close();
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
