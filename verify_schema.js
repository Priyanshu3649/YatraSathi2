
const { sequelizeTVL } = require('./config/db');

async function checkSchema() {
  try {
    await sequelizeTVL.authenticate();
    console.log('Connected to TVL database.');

    const tables = ['usXuser', 'fnXfunction', 'emXemployee'];
    
    for (const table of tables) {
      console.log(`\nChecking table: ${table}`);
      const [results] = await sequelizeTVL.query(`DESCRIBE ${table}`);
      console.log(results.map(r => `${r.Field} (${r.Type})`).join(', '));
    }

  } catch (error) {
    console.error('Schema check failed:', error);
  } finally {
    await sequelizeTVL.close();
  }
}

checkSchema();
