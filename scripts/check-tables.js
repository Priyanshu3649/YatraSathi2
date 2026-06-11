const { sequelizeTVL } = require('../config/db');

async function check() {
  try {
    const [tables] = await sequelizeTVL.query("SHOW TABLES");
    console.log("Existing tables:", tables.map(t => Object.values(t)[0]));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

check();
