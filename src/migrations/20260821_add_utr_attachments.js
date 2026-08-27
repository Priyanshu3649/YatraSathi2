const { sequelizeTVL } = require('../../config/db');
const { DataTypes } = require('sequelize');

async function up() {
  const queryInterface = sequelizeTVL.getQueryInterface();
  const transaction = await sequelizeTVL.transaction();

  try {
    console.log("Starting Migration: Adding UTR and Attachment paths...");

    // 1. Add utr_number to jeXjournal, ctXcontra, pyXpayment, rcXreceipt
    const tables = ['jeXjournal', 'ctXcontra', 'pyXpayment', 'rcXreceipt'];
    
    for (const table of tables) {
      console.log(`Adding utr_number to ${table}...`);
      await queryInterface.addColumn(table, 'utr_number', {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Global unique UTR number'
      }, { transaction });
    }

    // 2. Add attachment paths to jeXjournal and ctXcontra
    const tablesForAttachments = ['jeXjournal', 'ctXcontra'];
    for (const table of tablesForAttachments) {
      console.log(`Adding attachment fields to ${table}...`);
      await queryInterface.addColumn(table, 'attachment_path', {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Path to proof image'
      }, { transaction });

      await queryInterface.addColumn(table, 'attachment_mime', {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'MIME type of proof image'
      }, { transaction });
    }

    await transaction.commit();
    console.log("✅ Migration executed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed! Rolling back changes.");
    await transaction.rollback();
    console.error(error);
    process.exit(1);
  }
}

up();
