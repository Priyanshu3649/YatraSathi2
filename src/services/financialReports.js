const { sequelize } = require('../models/baseModel');
const ReportQueryEngine = require('./reportQueryEngine');

/**
 * Financial Reports Generator
 * 
 * Provides specialized financial reporting capabilities:
 * - Credit/Debit statements
 * - GST summary reports
 * - Revenue analysis
 * - Profit/Loss calculations
 * - Financial reconciliations
 */
class FinancialReports {
  constructor() {
    this.queryEngine = new ReportQueryEngine();
    this.financialReportTypes = {
      CREDIT_DEBIT: 'credit-debit',
      GST_SUMMARY: 'gst-summary',
      REVENUE_ANALYSIS: 'revenue-analysis',
      PROFIT_LOSS: 'profit-loss',
      BALANCE_SHEET: 'balance-sheet',
      CASH_FLOW: 'cash-flow'
    };
  }

  /**
   * Generate credit/debit statement for a specific period
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @returns {Object} Credit/debit statement
   */
  async generateCreditDebitStatement(startDate, endDate, filters = {}) {
    try {
      const dateFilters = {
        ...filters,
        dateFrom: startDate,
        dateTo: endDate
      };

      // Get ledger entries for the period
      const ledgerQueryConfig = {
        reportType: 'ledger',
        columns: [
          'lg_lgid', 'lg_usid', 'lg_entry_type', 'lg_entry_ref', 
          'lg_amount', 'lg_opening_bal', 'lg_closing_bal', 'edtm'
        ],
        filters: dateFilters,
        orderBy: ['edtm ASC'],
        limit: 10000
      };

      const ledgerResults = await this.queryEngine.executeQuery(ledgerQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Process and categorize entries
      const processedEntries = this.processLedgerEntries(ledgerResults.data);
      
      // Calculate totals
      const totals = this.calculateCreditDebitTotals(processedEntries);

      return {
        reportType: this.financialReportTypes.CREDIT_DEBIT,
        period: {
          startDate: startDate,
          endDate: endDate
        },
        entries: processedEntries,
        totals: totals,
        metadata: {
          ...ledgerResults.metadata,
          periodStart: startDate,
          periodEnd: endDate,
          entryCount: processedEntries.length
        }
      };
    } catch (error) {
      console.error('Credit/Debit statement generation error:', error);
      throw new Error(`Failed to generate credit/debit statement: ${error.message}`);
    }
  }

  /**
   * Generate GST summary report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @returns {Object} GST summary report
   */
  async generateGSTSummary(startDate, endDate, filters = {}) {
    try {
      const dateFilters = {
        ...filters,
        dateFrom: startDate,
        dateTo: endDate
      };

      // Get billing records for GST calculation
      const billingQueryConfig = {
        reportType: 'billing',
        columns: [
          'bi_biid', 'bi_customer_id', 'bi_bill_date', 'bi_gross_amount', 
          'bi_tax_amount', 'bi_net_amount', 'bi_status', 'bi_gst_rate'
        ],
        filters: dateFilters,
        groupBy: [],
        aggregates: {
          grossAmount: 'SUM',
          taxAmount: 'SUM',
          netAmount: 'SUM',
          count: 'COUNT'
        },
        limit: 10000
      };

      const billingResults = await this.queryEngine.executeQuery(billingQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Get payment records for GST input tax
      const paymentQueryConfig = {
        reportType: 'payment',
        columns: [
          'pt_ptid', 'pt_bkid', 'pt_amount', 'pt_mode', 'pt_date', 
          'pt_gst_input', 'pt_status'
        ],
        filters: dateFilters,
        groupBy: [],
        aggregates: {
          amount: 'SUM',
          gstInput: 'SUM',
          count: 'COUNT'
        },
        limit: 10000
      };

      const paymentResults = await this.queryEngine.executeQuery(paymentQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Calculate GST summary
      const gstSummary = this.calculateGSTSummary(
        billingResults.aggregates, 
        paymentResults.aggregates
      );

      return {
        reportType: this.financialReportTypes.GST_SUMMARY,
        period: {
          startDate: startDate,
          endDate: endDate
        },
        gstOutputTax: gstSummary.outputTax,
        gstInputTax: gstSummary.inputTax,
        gstPayable: gstSummary.payable,
        breakdown: gstSummary.breakdown,
        metadata: {
          ...billingResults.metadata,
          periodStart: startDate,
          periodEnd: endDate,
          billingRecords: billingResults.aggregates.count || 0,
          paymentRecords: paymentResults.aggregates.count || 0
        }
      };
    } catch (error) {
      console.error('GST summary generation error:', error);
      throw new Error(`Failed to generate GST summary: ${error.message}`);
    }
  }

  /**
   * Generate revenue analysis report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @returns {Object} Revenue analysis report
   */
  async generateRevenueAnalysis(startDate, endDate, filters = {}) {
    try {
      const dateFilters = {
        ...filters,
        dateFrom: startDate,
        dateTo: endDate
      };

      // Get booking revenue
      const bookingQueryConfig = {
        reportType: 'booking',
        columns: [
          'bk_bkid', 'bk_bkno', 'bk_total_amount', 'bk_trvldt', 
          'bk_class', 'bk_status', 'bk_agent'
        ],
        filters: dateFilters,
        groupBy: ['bk_class', 'bk_agent'],
        aggregates: {
          totalAmount: 'SUM',
          count: 'COUNT'
        },
        limit: 10000
      };

      const bookingResults = await this.queryEngine.executeQuery(bookingQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Get billing revenue
      const billingQueryConfig = {
        reportType: 'billing',
        columns: [
          'bi_biid', 'bi_customer_id', 'bi_bill_date', 'bi_net_amount',
          'bi_class', 'bi_status'
        ],
        filters: dateFilters,
        groupBy: ['bi_class'],
        aggregates: {
          netAmount: 'SUM',
          count: 'COUNT'
        },
        limit: 10000
      };

      const billingResults = await this.queryEngine.executeQuery(billingQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Get payment revenue
      const paymentQueryConfig = {
        reportType: 'payment',
        columns: [
          'pt_ptid', 'pt_bkid', 'pt_amount', 'pt_mode', 'pt_date',
          'pt_status'
        ],
        filters: dateFilters,
        groupBy: ['pt_mode'],
        aggregates: {
          amount: 'SUM',
          count: 'COUNT'
        },
        limit: 10000
      };

      const paymentResults = await this.queryEngine.executeQuery(paymentQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Calculate revenue analysis
      const revenueAnalysis = this.calculateRevenueAnalysis(
        bookingResults.aggregates,
        billingResults.aggregates,
        paymentResults.aggregates,
        bookingResults.data,
        billingResults.data
      );

      return {
        reportType: this.financialReportTypes.REVENUE_ANALYSIS,
        period: {
          startDate: startDate,
          endDate: endDate
        },
        revenueSources: revenueAnalysis.sources,
        revenueTrends: revenueAnalysis.trends,
        topPerformers: revenueAnalysis.topPerformers,
        analysis: revenueAnalysis.analysis,
        metadata: {
          ...bookingResults.metadata,
          periodStart: startDate,
          periodEnd: endDate,
          bookingRevenue: bookingResults.aggregates.totalAmount || 0,
          billingRevenue: billingResults.aggregates.netAmount || 0,
          paymentRevenue: paymentResults.aggregates.amount || 0
        }
      };
    } catch (error) {
      console.error('Revenue analysis generation error:', error);
      throw new Error(`Failed to generate revenue analysis: ${error.message}`);
    }
  }

  /**
   * Generate profit/loss statement
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @returns {Object} Profit/loss statement
   */
  async generateProfitLossStatement(startDate, endDate, filters = {}) {
    try {
      const dateFilters = {
        ...filters,
        dateFrom: startDate,
        dateTo: endDate
      };

      // Get revenue (sales)
      const revenueQueryConfig = {
        reportType: 'billing',
        columns: ['bi_net_amount', 'bi_bill_date'],
        filters: dateFilters,
        aggregates: {
          totalRevenue: 'SUM'
        },
        limit: 10000
      };

      const revenueResults = await this.queryEngine.executeQuery(revenueQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Get expenses (payments, commissions, etc.)
      const expenseQueryConfig = {
        reportType: 'payment',
        columns: ['pt_amount', 'pt_date'],
        filters: dateFilters,
        aggregates: {
          totalExpenses: 'SUM'
        },
        limit: 10000
      };

      const expenseResults = await this.queryEngine.executeQuery(expenseQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Get operational costs (employee salaries, etc.)
      const employeeQueryConfig = {
        reportType: 'employee',
        columns: ['em_salary', 'em_status'],
        filters: { ...dateFilters, em_status: 'ACTIVE' },
        aggregates: {
          totalSalaries: 'SUM'
        },
        limit: 10000
      };

      const employeeResults = await this.queryEngine.executeQuery(employeeQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Calculate profit/loss
      const profitLoss = this.calculateProfitLoss(
        revenueResults.aggregates.totalRevenue || 0,
        expenseResults.aggregates.totalExpenses || 0,
        employeeResults.aggregates.totalSalaries || 0
      );

      return {
        reportType: this.financialReportTypes.PROFIT_LOSS,
        period: {
          startDate: startDate,
          endDate: endDate
        },
        revenue: {
          totalSales: revenueResults.aggregates.totalRevenue || 0
        },
        expenses: {
          totalExpenses: expenseResults.aggregates.totalExpenses || 0,
          totalSalaries: employeeResults.aggregates.totalSalaries || 0,
          totalOperationalCosts: (expenseResults.aggregates.totalExpenses || 0) + 
                                (employeeResults.aggregates.totalSalaries || 0)
        },
        profitLoss: profitLoss,
        metadata: {
          periodStart: startDate,
          periodEnd: endDate,
          grossProfit: profitLoss.grossProfit,
          netProfit: profitLoss.netProfit,
          profitMargin: profitLoss.profitMargin
        }
      };
    } catch (error) {
      console.error('Profit/loss statement generation error:', error);
      throw new Error(`Failed to generate profit/loss statement: ${error.message}`);
    }
  }

  /**
   * Generate cash flow statement
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @returns {Object} Cash flow statement
   */
  async generateCashFlowStatement(startDate, endDate, filters = {}) {
    try {
      const dateFilters = {
        ...filters,
        dateFrom: startDate,
        dateTo: endDate
      };

      // Get cash inflows (collections from customers)
      const paymentQueryConfig = {
        reportType: 'payment',
        columns: ['pt_amount', 'pt_date', 'pt_mode'],
        filters: dateFilters,
        groupBy: ['pt_mode'],
        aggregates: {
          totalCollections: 'SUM'
        },
        limit: 10000
      };

      const paymentResults = await this.queryEngine.executeQuery(paymentQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Get cash outflows (payments to vendors, expenses)
      const expenseQueryConfig = {
        reportType: 'payment',
        columns: ['pt_amount', 'pt_date', 'pt_mode'],
        filters: dateFilters,
        aggregates: {
          totalOutflows: 'SUM'
        },
        limit: 10000
      };

      const expenseResults = await this.queryEngine.executeQuery(expenseQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Get salary outflows
      const salaryQueryConfig = {
        reportType: 'employee',
        columns: ['em_salary', 'em_usid'],
        filters: { ...dateFilters, em_status: 'ACTIVE' },
        aggregates: {
          totalSalaries: 'SUM'
        },
        limit: 10000
      };

      const salaryResults = await this.queryEngine.executeQuery(salaryQueryConfig, { 
        us_usid: 'system', 
        us_usertype: 'admin',
        us_roid: 'ADM'
      });

      // Calculate cash flow
      const cashFlow = this.calculateCashFlow(
        paymentResults.aggregates.totalCollections || 0,
        (expenseResults.aggregates.totalOutflows || 0) + (salaryResults.aggregates.totalSalaries || 0)
      );

      return {
        reportType: this.financialReportTypes.CASH_FLOW,
        period: {
          startDate: startDate,
          endDate: endDate
        },
        cashInflows: {
          collections: paymentResults.aggregates.totalCollections || 0,
          breakdown: paymentResults.data.reduce((acc, entry) => {
            const mode = entry.pt_mode || 'OTHER';
            acc[mode] = (acc[mode] || 0) + (entry.pt_amount || 0);
            return acc;
          }, {})
        },
        cashOutflows: {
          totalOutflows: (expenseResults.aggregates.totalOutflows || 0) + (salaryResults.aggregates.totalSalaries || 0),
          expenses: expenseResults.aggregates.totalOutflows || 0,
          salaries: salaryResults.aggregates.totalSalaries || 0
        },
        netCashFlow: cashFlow,
        metadata: {
          periodStart: startDate,
          periodEnd: endDate,
          openingBalance: cashFlow.openingBalance,
          closingBalance: cashFlow.closingBalance,
          netChange: cashFlow.netChange
        }
      };
    } catch (error) {
      console.error('Cash flow statement generation error:', error);
      throw new Error(`Failed to generate cash flow statement: ${error.message}`);
    }
  }

  /**
   * Process ledger entries for credit/debit statement
   */
  processLedgerEntries(entries) {
    return entries.map(entry => ({
      id: entry.lg_lgid,
      userId: entry.lg_usid,
      entryType: entry.lg_entry_type,
      reference: entry.lg_entry_ref,
      amount: parseFloat(entry.lg_amount) || 0,
      openingBalance: parseFloat(entry.lg_opening_bal) || 0,
      closingBalance: parseFloat(entry.lg_closing_bal) || 0,
      date: entry.edtm,
      isDebit: entry.lg_entry_type === 'DEBIT',
      isCredit: entry.lg_entry_type === 'CREDIT'
    }));
  }

  /**
   * Calculate credit/debit totals
   */
  calculateCreditDebitTotals(entries) {
    let totalDebits = 0;
    let totalCredits = 0;
    let netPosition = 0;

    entries.forEach(entry => {
      if (entry.isDebit) {
        totalDebits += entry.amount;
      } else if (entry.isCredit) {
        totalCredits += entry.amount;
      }
    });

    netPosition = totalDebits - totalCredits;

    return {
      totalDebits,
      totalCredits,
      netPosition,
      isDebit: netPosition > 0,
      isCredit: netPosition < 0,
      balance: Math.abs(netPosition)
    };
  }

  /**
   * Calculate GST summary
   */
  calculateGSTSummary(billingAggregates, paymentAggregates) {
    const outputTax = parseFloat(billingAggregates.taxAmount) || 0;
    const inputTax = parseFloat(paymentAggregates.gstInput) || 0;
    const payable = outputTax - inputTax;

    return {
      outputTax,
      inputTax,
      payable,
      breakdown: {
        taxableValue: parseFloat(billingAggregates.grossAmount) || 0,
        taxCollected: outputTax,
        taxPaidOnInputs: inputTax,
        netLiability: payable
      }
    };
  }

  /**
   * Calculate revenue analysis
   */
  calculateRevenueAnalysis(bookingAggregates, billingAggregates, paymentAggregates, bookingData, billingData) {
    const bookingRevenue = parseFloat(bookingAggregates.totalAmount) || 0;
    const billingRevenue = parseFloat(billingAggregates.netAmount) || 0;
    const paymentRevenue = parseFloat(paymentAggregates.amount) || 0;

    // Calculate revenue by class
    const revenueByClass = {};
    if (bookingData && Array.isArray(bookingData)) {
      bookingData.forEach(booking => {
        const classType = booking.bk_class || 'UNSPECIFIED';
        revenueByClass[classType] = (revenueByClass[classType] || 0) + (booking.bk_total_amount || 0);
      });
    }

    // Calculate revenue by agent (top performers)
    const revenueByAgent = {};
    if (bookingData && Array.isArray(bookingData)) {
      bookingData.forEach(booking => {
        const agent = booking.bk_agent || 'UNASSIGNED';
        revenueByAgent[agent] = (revenueByAgent[agent] || 0) + (booking.bk_total_amount || 0);
      });
    }

    // Sort agents by revenue (top performers)
    const sortedAgents = Object.entries(revenueByAgent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 performers

    return {
      sources: {
        booking: bookingRevenue,
        billing: billingRevenue,
        payment: paymentRevenue,
        total: bookingRevenue + billingRevenue + paymentRevenue
      },
      trends: {
        bookingGrowth: this.calculateGrowth(bookingAggregates.previousTotal, bookingRevenue),
        billingGrowth: this.calculateGrowth(billingAggregates.previousTotal, billingRevenue)
      },
      topPerformers: sortedAgents.map(([agent, revenue]) => ({ agent, revenue })),
      analysis: {
        primaryRevenueSource: bookingRevenue > billingRevenue ? 'Booking' : 'Billing',
        revenueDiversity: Object.keys(revenueByClass).length,
        averageDealSize: bookingAggregates.count ? bookingRevenue / (bookingAggregates.count || 1) : 0
      }
    };
  }

  /**
   * Calculate profit/loss
   */
  calculateProfitLoss(totalRevenue, totalExpenses, totalSalaries) {
    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit - totalSalaries;
    const profitMargin = totalRevenue ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalSalaries,
      grossProfit,
      netProfit,
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      isProfitable: netProfit > 0
    };
  }

  /**
   * Calculate cash flow
   */
  calculateCashFlow(inflows, outflows) {
    const netChange = inflows - outflows;
    const openingBalance = 0; // Could be fetched from previous period
    const closingBalance = openingBalance + netChange;

    return {
      openingBalance,
      closingBalance,
      netChange,
      inflows,
      outflows,
      cashPosition: closingBalance
    };
  }

  /**
   * Calculate growth percentage
   */
  calculateGrowth(previousValue, currentValue) {
    if (!previousValue) return currentValue ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  /**
   * Generate financial KPI dashboard
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @returns {Object} Financial KPI dashboard
   */
  async generateFinancialDashboard(startDate, endDate, filters = {}) {
    try {
      // Get all financial reports
      const [
        revenueAnalysis,
        profitLoss,
        cashFlow
      ] = await Promise.all([
        this.generateRevenueAnalysis(startDate, endDate, filters),
        this.generateProfitLossStatement(startDate, endDate, filters),
        this.generateCashFlowStatement(startDate, endDate, filters)
      ]);

      // Combine into dashboard
      const dashboard = {
        kpis: {
          totalRevenue: revenueAnalysis.metadata.bookingRevenue + revenueAnalysis.metadata.billingRevenue,
          netProfit: profitLoss.profitLoss.netProfit,
          profitMargin: profitLoss.profitLoss.profitMargin,
          cashPosition: cashFlow.netCashFlow.cashPosition,
          cashFlow: cashFlow.netCashFlow.netChange
        },
        trends: revenueAnalysis.revenueTrends,
        topPerformers: revenueAnalysis.topPerformers,
        financialHealth: this.assessFinancialHealth(profitLoss, cashFlow)
      };

      return {
        reportType: 'financial-dashboard',
        period: {
          startDate,
          endDate
        },
        dashboard,
        metadata: {
          periodStart: startDate,
          periodEnd: endDate
        }
      };
    } catch (error) {
      console.error('Financial dashboard generation error:', error);
      throw new Error(`Failed to generate financial dashboard: ${error.message}`);
    }
  }

  /**
   * Assess financial health based on key metrics
   */
  assessFinancialHealth(profitLoss, cashFlow) {
    const metrics = {
      profitability: profitLoss.profitLoss.isProfitable ? 'Healthy' : 'Concerning',
      profitMargin: profitLoss.profitLoss.profitMargin > 15 ? 'Strong' : 
                   profitLoss.profitLoss.profitMargin > 5 ? 'Average' : 'Weak',
      cashFlow: cashFlow.netCashFlow.netChange > 0 ? 'Positive' : 'Negative',
      liquidity: cashFlow.netCashFlow.cashPosition > 0 ? 'Adequate' : 'Low'
    };

    // Overall assessment
    const positiveIndicators = Object.values(metrics).filter(v => 
      v === 'Healthy' || v === 'Strong' || v === 'Positive' || v === 'Adequate'
    ).length;

    const totalIndicators = Object.keys(metrics).length;
    const healthScore = (positiveIndicators / totalIndicators) * 100;

    return {
      metrics,
      healthScore: parseFloat(healthScore.toFixed(2)),
      overallAssessment: healthScore > 75 ? 'Strong' : 
                        healthScore > 50 ? 'Stable' : 
                        healthScore > 25 ? 'Caution' : 'Critical'
    };
  }
}

module.exports = FinancialReports;