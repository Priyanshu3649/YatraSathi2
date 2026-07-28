const { sequelizeTVL } = require('./config/db');

async function fix() {
  try {
    await sequelizeTVL.query("ALTER TABLE rcXreceipt ADD COLUMN attachment_path VARCHAR(500) NULL COMMENT 'Path to receipt proof image'");
    await sequelizeTVL.query("ALTER TABLE rcXreceipt ADD COLUMN attachment_mime VARCHAR(50) NULL COMMENT 'MIME type of receipt proof image'");
    console.log("Added to rcXreceipt");
  } catch (e) {
    console.log("rcXreceipt error:", e.message);
  }

  try {
    await sequelizeTVL.query("ALTER TABLE pyXpayment ADD COLUMN attachment_path VARCHAR(500) NULL COMMENT 'Path to payment proof image'");
    await sequelizeTVL.query("ALTER TABLE pyXpayment ADD COLUMN attachment_mime VARCHAR(50) NULL COMMENT 'MIME type of payment proof image'");
    console.log("Added to pyXpayment");
  } catch (e) {
    console.log("pyXpayment error:", e.message);
  }
  process.exit(0);
}
fix();
