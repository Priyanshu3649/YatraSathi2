require('dotenv').config();
const { mysqlPool } = require('./config/db');
const fs = require('fs');

async function runBackup() {
  let connection;
  try {
    connection = await mysqlPool.getConnection();
    const dbName = process.env.DB_NAME_TVL || 'TVL_001';
    
    // 1. Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log(`Found ${tableNames.length} tables in database ${dbName}.`);
    
    const candidateTables = [
      "acAccount", "caCustomerAdvance", "cuCustomer", "emEmployee", 
      "lgLogin", "pyXpayment", "stStation", "trTrain", "usUser", "yeYearEndClosing"
    ];
    
    let fullBackupSql = `-- YatraSathi Database Backup\n-- Database: ${dbName}\n-- Date: ${new Date().toISOString()}\n\n`;
    let candidatesBackupSql = `-- YatraSathi Candidates for Deletion Backup\n-- Database: ${dbName}\n-- Date: ${new Date().toISOString()}\n\n`;
    
    for (const table of tableNames) {
      console.log(`Backing up table: ${table}...`);
      
      // Get DDL
      const [[ddlRow]] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
      const ddl = ddlRow['Create Table'];
      
      const tableSql = `DROP TABLE IF EXISTS \`${table}\`;\n${ddl};\n\n`;
      fullBackupSql += tableSql;
      
      const isCandidate = candidateTables.includes(table);
      if (isCandidate) {
        candidatesBackupSql += tableSql;
      }
      
      // Get Rows
      const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
      if (rows.length > 0) {
        let insertStatements = '';
        for (const row of rows) {
          const columns = Object.keys(row).map(c => `\`${c}\``).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (val instanceof Date) return connection.escape(val);
            if (typeof val === 'object') return connection.escape(JSON.stringify(val));
            return connection.escape(val);
          }).join(', ');
          
          insertStatements += `INSERT INTO \`${table}\` (${columns}) VALUES (${values});\n`;
        }
        
        fullBackupSql += insertStatements + '\n';
        if (isCandidate) {
          candidatesBackupSql += insertStatements + '\n';
        }
      }
    }
    
    // Save backups
    fs.writeFileSync('yatrasathi_full_backup.sql', fullBackupSql, 'utf8');
    fs.writeFileSync('candidate_deleted_tables_backup.sql', candidatesBackupSql, 'utf8');
    console.log('✅ Full database backup saved to: yatrasathi_full_backup.sql');
    console.log('✅ Candidates for deletion backup saved to: candidate_deleted_tables_backup.sql');
    
  } catch (err) {
    console.error('Backup Error:', err);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

runBackup();
