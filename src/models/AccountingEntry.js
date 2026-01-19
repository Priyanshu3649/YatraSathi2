// Accounting Entry Models for YatraSathi Payments Module
// Separate models for each accounting transaction type

const { sequelize } = require('../../config/db');

// Utility functions
const getFinancialYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 4 ? `${year}-${String(year + 1).slice(-2)}` : `${year - 1}-${String(year).slice(-2)}`;
};

const getAccountingPeriod = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const generateVoucherNumber = async (voucherType, financialYear) => {
  try {
    // Get or create sequence
    const [sequences] = await sequelize.query(
      'SELECT last_number, prefix FROM voucher_sequences WHERE voucher_type = ? AND financial_year = ?',
      { replacements: [voucherType, financialYear] }
    );
    
    let lastNumber = 0;
    let prefix = voucherType.toUpperCase().substring(0, 3);
    
    if (sequences.length > 0) {
      lastNumber = sequences[0].last_number;
      prefix = sequences[0].prefix;
    } else {
      // Create new sequence
      await sequelize.query(
        'INSERT INTO voucher_sequences (voucher_type, financial_year, last_number, prefix) VALUES (?, ?, ?, ?)',
        { replacements: [voucherType, financialYear, 0, prefix] }
      );
    }
    
    // Increment and update
    const newNumber = lastNumber + 1;
    await sequelize.query(
      'UPDATE voucher_sequences SET last_number = ? WHERE voucher_type = ? AND financial_year = ?',
      { replacements: [newNumber, voucherType, financialYear] }
    );
    
    // Format: PREFIX/YYYY-YY/NNNN
    return `${prefix}/${financialYear}/${String(newNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating voucher number:', error);
    throw error;
  }
};

// CONTRA ENTRY MODEL
class ContraEntry {
  static async create(entryData, userId) {
    const transaction = await sequelize.transaction();
    try {
      const financialYear = getFinancialYear(new Date(entryData.entry_date));
      const accountingPeriod = getAccountingPeriod(new Date(entryData.entry_date));
      const voucherNo = await generateVoucherNumber('contra', financialYear);
      
      // Insert main entry
      const [result] = await sequelize.query(
        `INSERT INTO contra_entries 
         (voucher_no, entry_date, ledger_from, ledger_to, amount, cheque_draft_no, narration, 
          total_debit, total_credit, balance_check, financial_year, accounting_period, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            voucherNo, entryData.entry_date, entryData.ledger_from, entryData.ledger_to,
            entryData.amount, entryData.cheque_draft_no || null, entryData.narration || null,
            entryData.total_debit || 0, entryData.total_credit || 0,
            entryData.total_debit === entryData.total_credit ? 1 : 0,
            financialYear, accountingPeriod, userId
          ],
          transaction
        }
      );
      
      const contraId = result.insertId;
      
      // Insert ledger grid entries if provided
      if (entryData.ledger_entries && entryData.ledger_entries.length > 0) {
        for (let i = 0; i < entryData.ledger_entries.length; i++) {
          const entry = entryData.ledger_entries[i];
          await sequelize.query(
            `INSERT INTO ledger_grid_entries 
             (entry_type, entry_id, voucher_no, line_number, account_name, debit_amount, credit_amount) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: ['contra', contraId, voucherNo, i + 1, entry.account_name, entry.debit_amount || 0, entry.credit_amount || 0],
              transaction
            }
          );
        }
      }
      
      await transaction.commit();
      return { id: contraId, voucher_no: voucherNo };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  static async getAll(filters = {}) {
    let query = `
      SELECT c.*, u.us_fname as created_by_name 
      FROM contra_entries c 
      LEFT JOIN users u ON c.created_by = u.us_usid 
      WHERE 1=1
    `;
    const replacements = [];
    
    if (filters.financial_year) {
      query += ' AND c.financial_year = ?';
      replacements.push(filters.financial_year);
    }
    
    if (filters.date_from) {
      query += ' AND c.entry_date >= ?';
      replacements.push(filters.date_from);
    }
    
    if (filters.date_to) {
      query += ' AND c.entry_date <= ?';
      replacements.push(filters.date_to);
    }
    
    query += ' ORDER BY c.entry_date DESC, c.voucher_no DESC';
    
    const [rows] = await sequelize.query(query, { replacements });
    return rows;
  }
  
  static async getById(id) {
    const [rows] = await sequelize.query(
      'SELECT * FROM contra_entries WHERE contra_id = ?',
      { replacements: [id] }
    );
    
    if (rows.length === 0) return null;
    
    // Get ledger entries
    const [ledgerEntries] = await sequelize.query(
      'SELECT * FROM ledger_grid_entries WHERE entry_type = ? AND entry_id = ? ORDER BY line_number',
      { replacements: ['contra', id] }
    );
    
    return { ...rows[0], ledger_entries: ledgerEntries };
  }
  
  static async update(id, entryData, userId) {
    const transaction = await sequelize.transaction();
    try {
      // Check if locked
      const [existing] = await sequelize.query(
        'SELECT locked FROM contra_entries WHERE contra_id = ?',
        { replacements: [id], transaction }
      );
      
      if (existing.length === 0) {
        throw new Error('Entry not found');
      }
      
      if (existing[0].locked === 1) {
        throw new Error('Cannot modify locked entry');
      }
      
      // Update main entry
      await sequelize.query(
        `UPDATE contra_entries SET 
         entry_date = ?, ledger_from = ?, ledger_to = ?, amount = ?, 
         cheque_draft_no = ?, narration = ?, total_debit = ?, total_credit = ?, 
         balance_check = ?, modified_by = ?, modified_at = NOW() 
         WHERE contra_id = ?`,
        {
          replacements: [
            entryData.entry_date, entryData.ledger_from, entryData.ledger_to,
            entryData.amount, entryData.cheque_draft_no || null, entryData.narration || null,
            entryData.total_debit || 0, entryData.total_credit || 0,
            entryData.total_debit === entryData.total_credit ? 1 : 0,
            userId, id
          ],
          transaction
        }
      );
      
      // Delete existing ledger entries
      await sequelize.query(
        'DELETE FROM ledger_grid_entries WHERE entry_type = ? AND entry_id = ?',
        { replacements: ['contra', id], transaction }
      );
      
      // Insert updated ledger entries
      if (entryData.ledger_entries && entryData.ledger_entries.length > 0) {
        const [voucherResult] = await sequelize.query(
          'SELECT voucher_no FROM contra_entries WHERE contra_id = ?',
          { replacements: [id], transaction }
        );
        const voucherNo = voucherResult[0].voucher_no;
        
        for (let i = 0; i < entryData.ledger_entries.length; i++) {
          const entry = entryData.ledger_entries[i];
          await sequelize.query(
            `INSERT INTO ledger_grid_entries 
             (entry_type, entry_id, voucher_no, line_number, account_name, debit_amount, credit_amount) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: ['contra', id, voucherNo, i + 1, entry.account_name, entry.debit_amount || 0, entry.credit_amount || 0],
              transaction
            }
          );
        }
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  static async delete(id) {
    const transaction = await sequelize.transaction();
    try {
      // Check if locked
      const [existing] = await sequelize.query(
        'SELECT locked FROM contra_entries WHERE contra_id = ?',
        { replacements: [id], transaction }
      );
      
      if (existing.length === 0) {
        throw new Error('Entry not found');
      }
      
      if (existing[0].locked === 1) {
        throw new Error('Cannot delete locked entry');
      }
      
      // Delete ledger entries first
      await sequelize.query(
        'DELETE FROM ledger_grid_entries WHERE entry_type = ? AND entry_id = ?',
        { replacements: ['contra', id], transaction }
      );
      
      // Delete main entry
      await sequelize.query(
        'DELETE FROM contra_entries WHERE contra_id = ?',
        { replacements: [id], transaction }
      );
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

// PAYMENT ENTRY MODEL
class PaymentEntry {
  static async create(entryData, userId) {
    const transaction = await sequelize.transaction();
    try {
      const financialYear = getFinancialYear(new Date(entryData.entry_date));
      const accountingPeriod = getAccountingPeriod(new Date(entryData.entry_date));
      const voucherNo = await generateVoucherNumber('payment', financialYear);
      
      const [result] = await sequelize.query(
        `INSERT INTO payment_entries 
         (voucher_no, entry_date, paid_to, payment_mode, amount, cheque_draft_no, narration, 
          total_debit, total_credit, balance_check, financial_year, accounting_period, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            voucherNo, entryData.entry_date, entryData.paid_to, entryData.payment_mode,
            entryData.amount, entryData.cheque_draft_no || null, entryData.narration || null,
            entryData.total_debit || 0, entryData.total_credit || 0,
            entryData.total_debit === entryData.total_credit ? 1 : 0,
            financialYear, accountingPeriod, userId
          ],
          transaction
        }
      );
      
      const paymentId = result.insertId;
      
      // Insert ledger grid entries
      if (entryData.ledger_entries && entryData.ledger_entries.length > 0) {
        for (let i = 0; i < entryData.ledger_entries.length; i++) {
          const entry = entryData.ledger_entries[i];
          await sequelize.query(
            `INSERT INTO ledger_grid_entries 
             (entry_type, entry_id, voucher_no, line_number, account_name, debit_amount, credit_amount) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: ['payment', paymentId, voucherNo, i + 1, entry.account_name, entry.debit_amount || 0, entry.credit_amount || 0],
              transaction
            }
          );
        }
      }
      
      await transaction.commit();
      return { id: paymentId, voucher_no: voucherNo };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  static async getAll(filters = {}) {
    let query = `
      SELECT p.*, u.us_fname as created_by_name 
      FROM payment_entries p 
      LEFT JOIN users u ON p.created_by = u.us_usid 
      WHERE 1=1
    `;
    const replacements = [];
    
    if (filters.financial_year) {
      query += ' AND p.financial_year = ?';
      replacements.push(filters.financial_year);
    }
    
    query += ' ORDER BY p.entry_date DESC, p.voucher_no DESC';
    
    const [rows] = await sequelize.query(query, { replacements });
    return rows;
  }
  
  static async getById(id) {
    const [rows] = await sequelize.query(
      'SELECT * FROM payment_entries WHERE payment_id = ?',
      { replacements: [id] }
    );
    
    if (rows.length === 0) return null;
    
    const [ledgerEntries] = await sequelize.query(
      'SELECT * FROM ledger_grid_entries WHERE entry_type = ? AND entry_id = ? ORDER BY line_number',
      { replacements: ['payment', id] }
    );
    
    return { ...rows[0], ledger_entries: ledgerEntries };
  }
}

// RECEIPT ENTRY MODEL
class ReceiptEntry {
  static async create(entryData, userId) {
    const transaction = await sequelize.transaction();
    try {
      const financialYear = getFinancialYear(new Date(entryData.entry_date));
      const accountingPeriod = getAccountingPeriod(new Date(entryData.entry_date));
      const voucherNo = await generateVoucherNumber('receipt', financialYear);
      
      const [result] = await sequelize.query(
        `INSERT INTO receipt_entries 
         (voucher_no, entry_date, received_from, receipt_mode, amount, cheque_draft_no, narration, 
          booking_id, bill_number, customer_ledger, total_debit, total_credit, balance_check, 
          financial_year, accounting_period, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            voucherNo, entryData.entry_date, entryData.received_from, entryData.receipt_mode,
            entryData.amount, entryData.cheque_draft_no || null, entryData.narration || null,
            entryData.booking_id || null, entryData.bill_number || null, entryData.customer_ledger || null,
            entryData.total_debit || 0, entryData.total_credit || 0,
            entryData.total_debit === entryData.total_credit ? 1 : 0,
            financialYear, accountingPeriod, userId
          ],
          transaction
        }
      );
      
      const receiptId = result.insertId;
      
      // Insert ledger grid entries
      if (entryData.ledger_entries && entryData.ledger_entries.length > 0) {
        for (let i = 0; i < entryData.ledger_entries.length; i++) {
          const entry = entryData.ledger_entries[i];
          await sequelize.query(
            `INSERT INTO ledger_grid_entries 
             (entry_type, entry_id, voucher_no, line_number, account_name, debit_amount, credit_amount) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: ['receipt', receiptId, voucherNo, i + 1, entry.account_name, entry.debit_amount || 0, entry.credit_amount || 0],
              transaction
            }
          );
        }
      }
      
      await transaction.commit();
      return { id: receiptId, voucher_no: voucherNo };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  static async getAll(filters = {}) {
    let query = `
      SELECT r.*, u.us_fname as created_by_name 
      FROM receipt_entries r 
      LEFT JOIN users u ON r.created_by = u.us_usid 
      WHERE 1=1
    `;
    const replacements = [];
    
    if (filters.financial_year) {
      query += ' AND r.financial_year = ?';
      replacements.push(filters.financial_year);
    }
    
    query += ' ORDER BY r.entry_date DESC, r.voucher_no DESC';
    
    const [rows] = await sequelize.query(query, { replacements });
    return rows;
  }
  
  static async getById(id) {
    const [rows] = await sequelize.query(
      'SELECT * FROM receipt_entries WHERE receipt_id = ?',
      { replacements: [id] }
    );
    
    if (rows.length === 0) return null;
    
    const [ledgerEntries] = await sequelize.query(
      'SELECT * FROM ledger_grid_entries WHERE entry_type = ? AND entry_id = ? ORDER BY line_number',
      { replacements: ['receipt', id] }
    );
    
    return { ...rows[0], ledger_entries: ledgerEntries };
  }
}

// JOURNAL ENTRY MODEL
class JournalEntry {
  static async create(entryData, userId) {
    const transaction = await sequelize.transaction();
    try {
      const financialYear = getFinancialYear(new Date(entryData.entry_date));
      const accountingPeriod = getAccountingPeriod(new Date(entryData.entry_date));
      const voucherNo = await generateVoucherNumber('journal', financialYear);
      
      const [result] = await sequelize.query(
        `INSERT INTO journal_entries 
         (voucher_no, entry_date, debit_ledger, credit_ledger, amount, narration, 
          total_debit, total_credit, balance_check, financial_year, accounting_period, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            voucherNo, entryData.entry_date, entryData.debit_ledger, entryData.credit_ledger,
            entryData.amount, entryData.narration || null,
            entryData.total_debit || 0, entryData.total_credit || 0,
            entryData.total_debit === entryData.total_credit ? 1 : 0,
            financialYear, accountingPeriod, userId
          ],
          transaction
        }
      );
      
      const journalId = result.insertId;
      
      // Insert ledger grid entries
      if (entryData.ledger_entries && entryData.ledger_entries.length > 0) {
        for (let i = 0; i < entryData.ledger_entries.length; i++) {
          const entry = entryData.ledger_entries[i];
          await sequelize.query(
            `INSERT INTO ledger_grid_entries 
             (entry_type, entry_id, voucher_no, line_number, account_name, debit_amount, credit_amount) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: ['journal', journalId, voucherNo, i + 1, entry.account_name, entry.debit_amount || 0, entry.credit_amount || 0],
              transaction
            }
          );
        }
      }
      
      await transaction.commit();
      return { id: journalId, voucher_no: voucherNo };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  static async getAll(filters = {}) {
    let query = `
      SELECT j.*, u.us_fname as created_by_name 
      FROM journal_entries j 
      LEFT JOIN users u ON j.created_by = u.us_usid 
      WHERE 1=1
    `;
    const replacements = [];
    
    if (filters.financial_year) {
      query += ' AND j.financial_year = ?';
      replacements.push(filters.financial_year);
    }
    
    query += ' ORDER BY j.entry_date DESC, j.voucher_no DESC';
    
    const [rows] = await sequelize.query(query, { replacements });
    return rows;
  }
  
  static async getById(id) {
    const [rows] = await sequelize.query(
      'SELECT * FROM journal_entries WHERE journal_id = ?',
      { replacements: [id] }
    );
    
    if (rows.length === 0) return null;
    
    const [ledgerEntries] = await sequelize.query(
      'SELECT * FROM ledger_grid_entries WHERE entry_type = ? AND entry_id = ? ORDER BY line_number',
      { replacements: ['journal', id] }
    );
    
    return { ...rows[0], ledger_entries: ledgerEntries };
  }
}

// CHART OF ACCOUNTS MODEL
class ChartOfAccounts {
  static async getAll() {
    const [rows] = await sequelize.query(
      'SELECT * FROM chart_of_accounts WHERE is_active = 1 ORDER BY account_code'
    );
    return rows;
  }
  
  static async search(searchTerm) {
    const [rows] = await sequelize.query(
      'SELECT * FROM chart_of_accounts WHERE is_active = 1 AND (account_name LIKE ? OR account_code LIKE ?) ORDER BY account_name LIMIT 20',
      { replacements: [`%${searchTerm}%`, `%${searchTerm}%`] }
    );
    return rows;
  }
}

module.exports = {
  ContraEntry,
  PaymentEntry,
  ReceiptEntry,
  JournalEntry,
  ChartOfAccounts,
  getFinancialYear,
  getAccountingPeriod
};