require('dotenv').config();
const { sequelizeTVL } = require('./config/db');

async function runAudit() {
  try {
    const query = `
      SELECT 
        TABLE_NAME AS name, 
        CREATE_TIME AS created_at, 
        UPDATE_TIME AS updated_at, 
        TABLE_ROWS AS row_count, 
        (DATA_LENGTH + INDEX_LENGTH) AS total_bytes
      FROM 
        information_schema.tables 
      WHERE 
        TABLE_SCHEMA = :dbName
      ORDER BY 
        TABLE_NAME;
    `;
    const dbName = process.env.DB_NAME_TVL || 'TVL_001';
    console.log(`Auditing tables in database: ${dbName}...`);
    const results = await sequelizeTVL.query(query, {
      replacements: { dbName },
      type: sequelizeTVL.QueryTypes.SELECT
    });
    
    console.log('--- DATABASE AUDIT RESULTS ---');
    console.log(JSON.stringify(results, null, 2));
    console.log(`Total Tables: ${results.length}`);
  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    process.exit(0);
  }
}

runAudit();
