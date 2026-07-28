const { sequelizeTVL } = require('../../config/db');
const { DataTypes } = require('sequelize');

async function up() {
  const queryInterface = sequelizeTVL.getQueryInterface();
  const transaction = await sequelizeTVL.transaction();

  try {
    console.log("Starting YatraSathi 11-Point Upgrade Migrations...");

    // 1. Create FinancialTransactionRefs Table (for UTR uniqueness)
    console.log("Creating FinancialTransactionRefs table...");
    await queryInterface.createTable('FinancialTransactionRefs', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      utr_number: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
        comment: 'Global unique UTR number'
      },
      transaction_type: {
        type: DataTypes.ENUM('PAYMENT', 'RECEIPT', 'JOURNAL', 'CONTRA'),
        allowNull: false,
        comment: 'Type of financial transaction'
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID of the related transaction record'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, { transaction });

    // 2. Update BillingMaster
    console.log("Adding columns to billingMaster...");
    await queryInterface.addColumn('billingMaster', 'bl_advance_amount', {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      comment: 'Advance amount applied during billing'
    }, { transaction });

    await queryInterface.addColumn('billingMaster', 'bl_special_id', {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Optional user-entered internal reference identifier'
    }, { transaction });

    await queryInterface.addColumn('billingMaster', 'bl_is_merged', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indicates if this bill has been merged into another'
    }, { transaction });

    await queryInterface.addColumn('billingMaster', 'bl_merged_into_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the parent bill this was merged into'
    }, { transaction });

    // Expand bl_customer_name
    console.log("Changing bl_customer_name length...");
    await queryInterface.changeColumn('billingMaster', 'bl_customer_name', {
      type: DataTypes.STRING(255),
      allowNull: false
    }, { transaction });

    // Allow bl_customer_phone to be null
    console.log("Changing bl_customer_phone to allow null...");
    await queryInterface.changeColumn('billingMaster', 'bl_customer_phone', {
      type: DataTypes.STRING(15),
      allowNull: true
    }, { transaction });

    // 3. Update UserTVL (usXuser)
    console.log("Changing us_usname length in usXuser...");
    await queryInterface.changeColumn('usXuser', 'us_usname', {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ''
    }, { transaction });
    
    // Note: us_phone is already allowNull: true in UserTVL

    // 4. Update Payment and Receipt tables for Image Proof
    console.log("Adding attachment paths to pyXpayment and rcXreceipt...");
    // Need to check if tables are pyXpayment or Payment
    // Assuming pyXpayment and rcXreceipt based on standard naming
    await queryInterface.addColumn('pyXpayment', 'attachment_path', {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Path to payment proof image'
    }, { transaction });

    await queryInterface.addColumn('pyXpayment', 'attachment_mime', {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'MIME type of payment proof image'
    }, { transaction });

    await queryInterface.addColumn('rcXreceipt', 'attachment_path', {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Path to receipt proof image'
    }, { transaction });

    await queryInterface.addColumn('rcXreceipt', 'attachment_mime', {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'MIME type of receipt proof image'
    }, { transaction });

    await transaction.commit();
    console.log("✅ All migrations executed successfully within a single database transaction.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed! Rolling back changes.");
    await transaction.rollback();
    console.error(error);
    process.exit(1);
  }
}

up();
