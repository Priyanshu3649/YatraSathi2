const { 
  CustomerTVL, 
  EmployeeTVL, 
  BookingTVL, 
  BillTVL, 
  PaymentTVL, 
  Receipt, 
  Journal,
  UserTVL,
  RoleTVL,
  sequelize
} = require('../models');
const { Op } = require('sequelize');

/**
 * JESPR Generic Reporting Engine Service
 */
const ReportEngineService = {
  /**
   * Module Registry - Defines supported modules and their primary models/fields
   */
  registry: {
    customers: {
      model: CustomerTVL,
      include: [{ model: UserTVL, as: 'user' }],
      primaryDateField: 'entered_on',
      allowedFilters: ['cu_status', 'cu_custtype'],
      defaultColumns: ['cu_custno', 'cu_name', 'cu_status', 'cu_custtype'],
      mapping: (item) => ({
        id: item.cu_custno,
        name: item.user?.us_fname ? `${item.user.us_fname} ${item.user.us_lname || ''}` : item.cu_name,
        email: item.user?.us_email,
        phone: item.user?.us_phone,
        type: item.cu_custtype,
        status: item.cu_status,
        company: item.cu_company
      })
    },
    employees: {
      model: EmployeeTVL,
      include: [{ model: UserTVL, as: 'user', include: [{ model: RoleTVL, as: 'fnXfunction' }] }],
      primaryDateField: 'edtm',
      allowedFilters: ['em_dept', 'em_status'],
      defaultColumns: ['em_usid', 'em_dept', 'em_status'],
      mapping: (item) => ({
        id: item.em_usid,
        name: `${item.user?.us_fname || ''} ${item.user?.us_lname || ''}`.trim(),
        email: item.user?.us_email,
        dept: item.em_dept,
        role: item.user?.fnXfunction?.fn_fnshort || item.user?.us_roid,
        status: item.em_status,
        joined: item.em_joindt
      })
    },
    bookings: {
      model: BookingTVL,
      include: [{ model: CustomerTVL, as: 'customer', attributes: ['cu_name'] }],
      primaryDateField: 'bk_trvldt',
      allowedFilters: ['bk_status', 'bk_usid', 'bk_fromst', 'bk_tost'],
      defaultColumns: ['bk_bkno', 'bk_status', 'bk_trvldt', 'bk_totalpass'],
      mapping: (item) => ({
        booking_no: item.bk_bkno,
        customer: item.customer?.cu_name || item.bk_usid,
        travel_date: item.bk_trvldt,
        status: item.bk_status,
        passengers: item.bk_totalpass || 0,
        fare: parseFloat(item.bk_totalfare || 0),
        net_amount: parseFloat(item.bk_netamount || 0)
      })
    },
    billing: {
      model: BillTVL,
      include: [{ model: BookingTVL, as: 'booking' }],
      primaryDateField: 'bl_bill_date',
      allowedFilters: ['status', 'bl_status', 'bl_customer_phone'],
      defaultColumns: ['bl_bill_no', 'bl_bill_date', 'bl_total_amount', 'status'],
      mapping: (item) => ({
        bill_no: item.bl_bill_no,
        date: item.bl_bill_date,
        customer: item.bl_customer_name,
        amount: parseFloat(item.bl_total_amount || 0),
        tax: parseFloat(item.bl_tax_amount || 0),
        net_amount: parseFloat(item.bl_net_amount || 0),
        status: item.status
      })
    },
    payments: {
      model: PaymentTVL,
      primaryDateField: 'pt_transaction_date',
      allowedFilters: ['pt_status', 'pt_payment_mode'],
      defaultColumns: ['pt_transaction_no', 'pt_transaction_date', 'pt_amount', 'pt_status'],
      mapping: (item) => ({
        transaction_no: item.pt_transaction_no,
        date: item.pt_transaction_date,
        amount: parseFloat(item.pt_amount || 0),
        mode: item.pt_payment_mode,
        status: item.pt_status,
        remarks: item.pt_remarks
      })
    },
    receipts: {
      model: Receipt,
      primaryDateField: 're_receipt_date',
      allowedFilters: ['re_status', 're_payment_mode'],
      defaultColumns: ['re_receipt_no', 're_receipt_date', 're_amount', 're_status'],
      mapping: (item) => ({
        receipt_no: item.re_receipt_no,
        date: item.re_receipt_date,
        amount: parseFloat(item.re_amount || 0),
        mode: item.re_payment_mode,
        customer: item.re_customer_name,
        status: item.re_status
      })
    },
    journals: {
      model: Journal,
      primaryDateField: 'jo_journal_date',
      allowedFilters: ['jo_status'],
      defaultColumns: ['jo_journal_no', 'jo_journal_date', 'jo_amount', 'jo_status'],
      mapping: (item) => ({
        journal_no: item.jo_journal_no,
        date: item.jo_journal_date,
        amount: parseFloat(item.jo_amount || 0),
        debit_ledger: item.jo_debit_ledger_name,
        credit_ledger: item.jo_credit_ledger_name,
        status: item.jo_status
      })
    }
  },

  /**
   * Recursive Grouping Engine
   */
  groupData: (data, keys, metrics) => {
    if (!keys || !keys.length) {
      return {
        rows: data,
        summary: ReportEngineService.calculateMetrics(data, metrics)
      };
    }

    const key = keys[0];
    const grouped = {};

    data.forEach(item => {
      const value = item[key] !== undefined && item[key] !== null ? item[key] : "Unknown";
      if (!grouped[value]) grouped[value] = [];
      grouped[value].push(item);
    });

    const result = [];
    for (let k in grouped) {
      const nestedResult = ReportEngineService.groupData(grouped[k], keys.slice(1), metrics);
      result.push({
        groupKey: key,
        groupValue: k,
        level: keys.length,
        ...nestedResult
      });
    }

    return {
      groups: result,
      summary: ReportEngineService.calculateMetrics(data, metrics)
    };
  },

  /**
   * Aggregation Engine
   */
  calculateMetrics: (data, metrics) => {
    const summary = { count: data.length };
    
    if (!metrics || !metrics.length) return summary;

    metrics.forEach(metric => {
      // metric can be "SUM:amount" or "AVG:fare"
      const [type, field] = metric.split(':');
      if (!field) return;

      if (type === 'SUM') {
        summary[`total_${field}`] = data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
      } else if (type === 'AVG') {
        const sum = data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
        summary[`avg_${field}`] = data.length > 0 ? (sum / data.length) : 0;
      }
    });

    return summary;
  },

  /**
   * Main Generator
   */
  generateReport: async (options) => {
    const { module, filters, groupBy, metrics, pagination, sort } = options;
    
    const moduleConfig = ReportEngineService.registry[module.toLowerCase()];
    if (!moduleConfig) {
      throw new Error(`Module '${module}' is not supported by the JESPR Engine.`);
    }

    // 1. Build Query
    const where = {};
    if (filters) {
      // Standardize Date Filter (startDate/endDate from frontend)
      if (filters.startDate && filters.endDate) {
        const dateField = moduleConfig.primaryDateField || 'createdAt';
        where[dateField] = { [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)] };
      }
      
      // Strict Filter Addition: Only allow fields that exist in allowedFilters for this module
      Object.entries(filters).forEach(([k, v]) => {
        if (moduleConfig.allowedFilters.includes(k) && v !== undefined && v !== 'All' && v !== '') {
          where[k] = v;
        }
      });
    }

    // 2. Fetch Data (with Pagination if not grouped)
    const primaryDate = moduleConfig.primaryDateField || 'id';
    const queryOptions = {
      where,
      include: moduleConfig.include || [],
      // If sort is 'createdAt:DESC' (default) and model doesn't have it, fallback to primaryDate
      order: (sort && !sort.includes('createdAt')) 
        ? [sort.split(':')] 
        : [[primaryDate, 'DESC']]
    };

    // If grouping, we fetch all (to calculate global aggregates), but use limit for display
    // For now, let's fetch matching set
    const rawData = await moduleConfig.model.findAll(queryOptions);
    
    // 3. Map Data to flat objects based on registry mapping
    const flatData = rawData.map(item => moduleConfig.mapping(item.get ? item.get({ plain: true }) : item));

    // 4. Apply Multi-level Grouping
    const reportData = ReportEngineService.groupData(flatData, groupBy || [], metrics || []);

    return {
      module,
      columns: flatData.length > 0 ? Object.keys(flatData[0]) : [],
      recordCount: flatData.length,
      ...reportData
    };
  }
};

module.exports = ReportEngineService;
