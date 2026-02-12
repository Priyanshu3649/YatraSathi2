/**
 * Financial Report Service - JESPR Reporting Engine
 * Handles Journal, Sales, Purchase, Receipt, Payment reports
 */

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { formatDateForSQL } = require('../utils/dateRangeUtils');

/**
 * Generate Journal Report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data with aggregates
 */
const generateJournalReport = async (filters) => {
  const {
    startDate,
    endDate,
    branchId = null,
    status = 'POSTED',
    limit = 1000,
    offset = 0
  } = filters;

  const whereConditions = [
    "ft_transaction_type = 'JOURNAL'",
    "ft_status = :status",
    "ft_transaction_date BETWEEN :startDate AND :endDate"
  ];

  if (branchId) {
    whereConditions.push("ft_branch_id = :branchId");
  }

  const whereClause = whereConditions.join(' AND ');

  // Main query
  const query = `
    SELECT 
      ft_id,
      ft_transaction_no,
      ft_transaction_date,
      ft_financial_year,
      ft_quarter,
      ft_debit_ledger_name,
      ft_credit_ledger_name,
      ft_debit_amount,
      ft_credit_amount,
      ft_narration,
      ft_branch_name,
      ft_created_by,
      ft_created_on
    FROM financial_transactions
    WHERE ${whereClause}
    ORDER BY ft_transaction_date DESC, ft_transaction_no DESC
    LIMIT :limit OFFSET :offset
  `;

  // Aggregate query
  const aggregateQuery = `
    SELECT 
      COUNT(*) as total_count,
      SUM(ft_debit_amount) as total_debit,
      SUM(ft_credit_amount) as total_credit
    FROM financial_transactions
    WHERE ${whereClause}
  `;

  const [data, aggregates] = await Promise.all([
    sequelize.query(query, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId,
        limit,
        offset
      },
      type: QueryTypes.SELECT
    }),
    sequelize.query(aggregateQuery, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId
      },
      type: QueryTypes.SELECT
    })
  ]);

  return {
    data,
    aggregates: aggregates[0],
    metadata: {
      reportType: 'JOURNAL',
      periodStart: startDate,
      periodEnd: endDate,
      recordCount: data.length,
      totalRecords: parseInt(aggregates[0].total_count)
    }
  };
};

/**
 * Generate Sales Report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data with aggregates
 */
const generateSalesReport = async (filters) => {
  const {
    startDate,
    endDate,
    branchId = null,
    customerId = null,
    bookingType = null,
    status = 'POSTED',
    limit = 1000,
    offset = 0
  } = filters;

  const whereConditions = [
    "ft_transaction_type = 'SALES'",
    "ft_status = :status",
    "ft_transaction_date BETWEEN :startDate AND :endDate"
  ];

  if (branchId) whereConditions.push("ft_branch_id = :branchId");
  if (customerId) whereConditions.push("ft_customer_id = :customerId");
  if (bookingType) whereConditions.push("ft_booking_type = :bookingType");

  const whereClause = whereConditions.join(' AND ');

  const query = `
    SELECT 
      ft_id,
      ft_transaction_no,
      ft_transaction_date,
      ft_customer_name,
      ft_booking_type,
      ft_pnr_number,
      ft_travel_date,
      ft_passenger_count,
      ft_gross_amount,
      ft_tax_amount,
      ft_discount_amount,
      ft_net_amount,
      ft_payment_status,
      ft_outstanding_amount,
      ft_branch_name,
      ft_employee_name
    FROM financial_transactions
    WHERE ${whereClause}
    ORDER BY ft_transaction_date DESC
    LIMIT :limit OFFSET :offset
  `;

  const aggregateQuery = `
    SELECT 
      COUNT(*) as total_count,
      SUM(ft_gross_amount) as total_gross,
      SUM(ft_tax_amount) as total_tax,
      SUM(ft_discount_amount) as total_discount,
      SUM(ft_net_amount) as total_net,
      SUM(ft_outstanding_amount) as total_outstanding,
      SUM(ft_passenger_count) as total_passengers
    FROM financial_transactions
    WHERE ${whereClause}
  `;

  const [data, aggregates] = await Promise.all([
    sequelize.query(query, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId,
        customerId,
        bookingType,
        limit,
        offset
      },
      type: QueryTypes.SELECT
    }),
    sequelize.query(aggregateQuery, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId,
        customerId,
        bookingType
      },
      type: QueryTypes.SELECT
    })
  ]);

  return {
    data,
    aggregates: aggregates[0],
    metadata: {
      reportType: 'SALES',
      periodStart: startDate,
      periodEnd: endDate,
      recordCount: data.length,
      totalRecords: parseInt(aggregates[0].total_count)
    }
  };
};

/**
 * Generate Purchase Report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data with aggregates
 */
const generatePurchaseReport = async (filters) => {
  const {
    startDate,
    endDate,
    branchId = null,
    vendorId = null,
    status = 'POSTED',
    limit = 1000,
    offset = 0
  } = filters;

  const whereConditions = [
    "ft_transaction_type = 'PURCHASE'",
    "ft_status = :status",
    "ft_transaction_date BETWEEN :startDate AND :endDate"
  ];

  if (branchId) whereConditions.push("ft_branch_id = :branchId");
  if (vendorId) whereConditions.push("ft_vendor_id = :vendorId");

  const whereClause = whereConditions.join(' AND ');

  const query = `
    SELECT 
      ft_id,
      ft_transaction_no,
      ft_transaction_date,
      ft_vendor_name,
      ft_gross_amount,
      ft_tax_amount,
      ft_net_amount,
      ft_payment_status,
      ft_outstanding_amount,
      ft_branch_name,
      ft_narration
    FROM financial_transactions
    WHERE ${whereClause}
    ORDER BY ft_transaction_date DESC
    LIMIT :limit OFFSET :offset
  `;

  const aggregateQuery = `
    SELECT 
      COUNT(*) as total_count,
      SUM(ft_gross_amount) as total_gross,
      SUM(ft_tax_amount) as total_tax,
      SUM(ft_net_amount) as total_net,
      SUM(ft_outstanding_amount) as total_outstanding
    FROM financial_transactions
    WHERE ${whereClause}
  `;

  const [data, aggregates] = await Promise.all([
    sequelize.query(query, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId,
        vendorId,
        limit,
        offset
      },
      type: QueryTypes.SELECT
    }),
    sequelize.query(aggregateQuery, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId,
        vendorId
      },
      type: QueryTypes.SELECT
    })
  ]);

  return {
    data,
    aggregates: aggregates[0],
    metadata: {
      reportType: 'PURCHASE',
      periodStart: startDate,
      periodEnd: endDate,
      recordCount: data.length,
      totalRecords: parseInt(aggregates[0].total_count)
    }
  };
};

/**
 * Generate Receipt Report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data with aggregates
 */
const generateReceiptReport = async (filters) => {
  const {
    startDate,
    endDate,
    branchId = null,
    customerId = null,
    paymentMode = null,
    status = 'POSTED',
    limit = 1000,
    offset = 0
  } = filters;

  const whereConditions = [
    "ft_transaction_type = 'RECEIPT'",
    "ft_status = :status",
    "ft_transaction_date BETWEEN :startDate AND :endDate"
  ];

  if (branchId) whereConditions.push("ft_branch_id = :branchId");
  if (customerId) whereConditions.push("ft_customer_id = :customerId");
  if (paymentMode) whereConditions.push("ft_payment_mode = :paymentMode");

  const whereClause = whereConditions.join(' AND ');

  const query = `
    SELECT 
      ft_id,
      ft_transaction_no,
      ft_transaction_date,
      ft_customer_name,
      ft_net_amount,
      ft_payment_mode,
      ft_reference_no,
      ft_branch_name,
      ft_employee_name,
      ft_narration
    FROM financial_transactions
    WHERE ${whereClause}
    ORDER BY ft_transaction_date DESC
    LIMIT :limit OFFSET :offset
  `;

  const aggregateQuery = `
    SELECT 
      COUNT(*) as total_count,
      SUM(ft_net_amount) as total_amount,
      ft_payment_mode,
      COUNT(*) as mode_count
    FROM financial_transactions
    WHERE ${whereClause}
    GROUP BY ft_payment_mode
  `;

  const totalQuery = `
    SELECT 
      COUNT(*) as total_count,
      SUM(ft_net_amount) as total_amount
    FROM financial_transactions
    WHERE ${whereClause}
  `;

  const [data, modeAggregates, totals] = await Promise.all([
    sequelize.query(query, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId,
        customerId,
        paymentMode,
        limit,
        offset
      },
      type: QueryTypes.SELECT
    }),
    sequelize.query(aggregateQuery, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId,
        customerId,
        paymentMode
      },
      type: QueryTypes.SELECT
    }),
    sequelize.query(totalQuery, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId,
        customerId,
        paymentMode
      },
      type: QueryTypes.SELECT
    })
  ]);

  return {
    data,
    aggregates: {
      ...totals[0],
      byPaymentMode: modeAggregates
    },
    metadata: {
      reportType: 'RECEIPT',
      periodStart: startDate,
      periodEnd: endDate,
      recordCount: data.length,
      totalRecords: parseInt(totals[0].total_count)
    }
  };
};

/**
 * Generate Payment Report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data with aggregates
 */
const generatePaymentReport = async (filters) => {
  const {
    startDate,
    endDate,
    branchId = null,
    vendorId = null,
    paymentMode = null,
    status = 'POSTED',
    limit = 1000,
    offset = 0
  } = filters;

  const whereConditions = [
    "ft_transaction_type = 'PAYMENT'",
    "ft_status = :status",
    "ft_transaction_date BETWEEN :startDate AND :endDate"
  ];

  if (branchId) whereConditions.push("ft_branch_id = :branchId");
  if (vendorId) whereConditions.push("ft_vendor_id = :vendorId");
  if (paymentMode) whereConditions.push("ft_payment_mode = :paymentMode");

  const whereClause = whereConditions.join(' AND ');

  const query = `
    SELECT 
      ft_id,
      ft_transaction_no,
      ft_transaction_date,
      ft_vendor_name,
      ft_net_amount,
      ft_payment_mode,
      ft_reference_no,
      ft_branch_name,
      ft_employee_name,
      ft_narration
    FROM financial_transactions
    WHERE ${whereClause}
    ORDER BY ft_transaction_date DESC
    LIMIT :limit OFFSET :offset
  `;

  const aggregateQuery = `
    SELECT 
      COUNT(*) as total_count,
      SUM(ft_net_amount) as total_amount,
      ft_payment_mode,
      COUNT(*) as mode_count
    FROM financial_transactions
    WHERE ${whereClause}
    GROUP BY ft_payment_mode
  `;

  const totalQuery = `
    SELECT 
      COUNT(*) as total_count,
      SUM(ft_net_amount) as total_amount
    FROM financial_transactions
    WHERE ${whereClause}
  `;

  const [data, modeAggregates, totals] = await Promise.all([
    sequelize.query(query, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId,
        vendorId,
        paymentMode,
        limit,
        offset
      },
      type: QueryTypes.SELECT
    }),
    sequelize.query(aggregateQuery, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId,
        vendorId,
        paymentMode
      },
      type: QueryTypes.SELECT
    }),
    sequelize.query(totalQuery, {
      replacements: {
        status,
        startDate: formatDateForSQL(startDate),
        endDate: formatDateForSQL(endDate),
        branchId,
        vendorId,
        paymentMode
      },
      type: QueryTypes.SELECT
    })
  ]);

  return {
    data,
    aggregates: {
      ...totals[0],
      byPaymentMode: modeAggregates
    },
    metadata: {
      reportType: 'PAYMENT',
      periodStart: startDate,
      periodEnd: endDate,
      recordCount: data.length,
      totalRecords: parseInt(totals[0].total_count)
    }
  };
};

/**
 * Generate Outstanding Receivables Report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data with aggregates
 */
const generateOutstandingReceivablesReport = async (filters) => {
  const {
    branchId = null,
    customerId = null,
    limit = 1000,
    offset = 0
  } = filters;

  const whereConditions = [];
  if (branchId) whereConditions.push("ft_branch_id = :branchId");
  if (customerId) whereConditions.push("ft_customer_id = :customerId");

  const whereClause = whereConditions.length > 0 
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  const query = `
    SELECT * FROM v_outstanding_receivables
    ${whereClause}
    ORDER BY outstanding_amount DESC
    LIMIT :limit OFFSET :offset
  `;

  const aggregateQuery = `
    SELECT 
      COUNT(*) as total_count,
      SUM(outstanding_amount) as total_outstanding
    FROM v_outstanding_receivables
    ${whereClause}
  `;

  const [data, aggregates] = await Promise.all([
    sequelize.query(query, {
      replacements: { branchId, customerId, limit, offset },
      type: QueryTypes.SELECT
    }),
    sequelize.query(aggregateQuery, {
      replacements: { branchId, customerId },
      type: QueryTypes.SELECT
    })
  ]);

  return {
    data,
    aggregates: aggregates[0],
    metadata: {
      reportType: 'OUTSTANDING_RECEIVABLES',
      recordCount: data.length,
      totalRecords: parseInt(aggregates[0].total_count)
    }
  };
};

/**
 * Generate Outstanding Payables Report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data with aggregates
 */
const generateOutstandingPayablesReport = async (filters) => {
  const {
    branchId = null,
    vendorId = null,
    limit = 1000,
    offset = 0
  } = filters;

  const whereConditions = [];
  if (branchId) whereConditions.push("ft_branch_id = :branchId");
  if (vendorId) whereConditions.push("ft_vendor_id = :vendorId");

  const whereClause = whereConditions.length > 0 
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  const query = `
    SELECT * FROM v_outstanding_payables
    ${whereClause}
    ORDER BY outstanding_amount DESC
    LIMIT :limit OFFSET :offset
  `;

  const aggregateQuery = `
    SELECT 
      COUNT(*) as total_count,
      SUM(outstanding_amount) as total_outstanding
    FROM v_outstanding_payables
    ${whereClause}
  `;

  const [data, aggregates] = await Promise.all([
    sequelize.query(query, {
      replacements: { branchId, vendorId, limit, offset },
      type: QueryTypes.SELECT
    }),
    sequelize.query(aggregateQuery, {
      replacements: { branchId, vendorId },
      type: QueryTypes.SELECT
    })
  ]);

  return {
    data,
    aggregates: aggregates[0],
    metadata: {
      reportType: 'OUTSTANDING_PAYABLES',
      recordCount: data.length,
      totalRecords: parseInt(aggregates[0].total_count)
    }
  };
};

/**
 * Generate Aging Analysis Report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data with aggregates
 */
const generateAgingAnalysisReport = async (filters) => {
  const {
    asOfDate = new Date(),
    partyType = 'CUSTOMER' // 'CUSTOMER' or 'VENDOR'
  } = filters;

  const query = `CALL sp_calculate_aging(:asOfDate, :partyType)`;

  const data = await sequelize.query(query, {
    replacements: {
      asOfDate: formatDateForSQL(asOfDate),
      partyType
    },
    type: QueryTypes.SELECT
  });

  // Calculate totals
  const aggregates = {
    total_0_30: data.reduce((sum, row) => sum + parseFloat(row.bucket_0_30 || 0), 0),
    total_31_60: data.reduce((sum, row) => sum + parseFloat(row.bucket_31_60 || 0), 0),
    total_61_90: data.reduce((sum, row) => sum + parseFloat(row.bucket_61_90 || 0), 0),
    total_90_plus: data.reduce((sum, row) => sum + parseFloat(row.bucket_90_plus || 0), 0),
    grand_total: data.reduce((sum, row) => sum + parseFloat(row.total_outstanding || 0), 0)
  };

  return {
    data,
    aggregates,
    metadata: {
      reportType: 'AGING_ANALYSIS',
      partyType,
      asOfDate,
      recordCount: data.length
    }
  };
};

module.exports = {
  generateJournalReport,
  generateSalesReport,
  generatePurchaseReport,
  generateReceiptReport,
  generatePaymentReport,
  generateOutstandingReceivablesReport,
  generateOutstandingPayablesReport,
  generateAgingAnalysisReport
};
