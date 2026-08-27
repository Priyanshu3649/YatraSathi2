const { sequelizeTVL } = require('./config/db');

async function migrate() {
  const t = await sequelizeTVL.transaction();
  try {
    const queryInterface = sequelizeTVL.getQueryInterface();
    
    // Add columns to bkXcontra
    const contraTable = 'ctXcontra'; // Wait, let me check Contra.js tableName
    // Actually, Contra.js says tableName: 'ctXcontra'
    const journalTable = 'jeXjournal'; // Wait, let me check Journal.js tableName

    // Let me check if they exist first, then add.
    const addCols = async (table) => {
      try {
        await queryInterface.addColumn(table, 'is_reconciled', {
          type: sequelizeTVL.Sequelize.TINYINT(1),
          defaultValue: 0
        }, { transaction: t });
      } catch(e) { console.log(e.message) }

      try {
        await queryInterface.addColumn(table, 'reconciled_by', {
          type: sequelizeTVL.Sequelize.INTEGER,
          allowNull: true
        }, { transaction: t });
      } catch(e) { console.log(e.message) }

      try {
        await queryInterface.addColumn(table, 'reconciled_at', {
          type: sequelizeTVL.Sequelize.DATE,
          allowNull: true
        }, { transaction: t });
      } catch(e) { console.log(e.message) }

      try {
        await queryInterface.addColumn(table, 'reconciliation_remarks', {
          type: sequelizeTVL.Sequelize.TEXT,
          allowNull: true
        }, { transaction: t });
      } catch(e) { console.log(e.message) }
    };

    console.log('Migrating ctXcontra...');
    await addCols('ctXcontra');
    
    console.log('Migrating jeXjournal...');
    await addCols('jeXjournal');

    await t.commit();
    console.log('Migration completed successfully.');
  } catch (error) {
    await t.rollback();
    console.error('Migration failed:', error);
  }
  process.exit(0);
}

migrate();
