// Journal Entry Model - Adjustments and other entries
const { mysqlPool: db } = require('../../config/db');

class JournalEntry {
  constructor(data) {
    this.journal_id = data.journal_id;
    this.voucher_no = data.voucher_no;
    this.entry_date = data.entry_date;
    this.debit_ledger = data.debit_ledger;
    this.credit_ledger = data.credit_ledger;
    this.amount = data.amount;
    this.narration = data.narration;
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Generate next voucher number
  static async generateVoucherNumber() {
    try {
      const [result] = await db.execute(
        'SELECT current_number, prefix, financial_year FROM voucher_sequences WHERE entry_type = ?',
        ['JOURNAL']
      );
      
      if (result.length === 0) {
        throw new Error('Voucher sequence not initialized for JOURNAL entries');
      }
      
      const { current_number, prefix, financial_year } = result[0];
      const nextNumber = current_number + 1;
      const voucherNo = `${prefix}${String(nextNumber).padStart(6, '0')}/${financial_year}`;
      
      // Update sequence
      await db.execute(
        'UPDATE voucher_sequences SET current_number = ? WHERE entry_type = ?',
        [nextNumber, 'JOURNAL']
      );
      
      return voucherNo;
    } catch (error) {
      throw new Error(`Failed to generate voucher number: ${error.message}`);
    }
  }

  // Create new journal entry
  static async create(entryData) {
    try {
      // Generate voucher number if not provided
      if (!entryData.voucher_no) {
        entryData.voucher_no = await this.generateVoucherNumber();
      }

      const [result] = await db.execute(
        `INSERT INTO journal_entries 
         (voucher_no, entry_date, debit_ledger, credit_ledger, amount, narration, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          entryData.voucher_no,
          entryData.entry_date,
          entryData.debit_ledger,
          entryData.credit_ledger,
          entryData.amount,
          entryData.narration || '',
          entryData.created_by
        ]
      );

      // Update ledger balances
      await this.updateLedgerBalances(entryData.debit_ledger, entryData.credit_ledger, entryData.amount);

      return new JournalEntry({ 
        journal_id: result.insertId, 
        ...entryData 
      });
    } catch (error) {
      throw new Error(`Failed to create journal entry: ${error.message}`);
    }
  }

  // Update ledger balances
  static async updateLedgerBalances(debitLedger, creditLedger, amount) {
    try {
      // Increase debit ledger balance
      await db.execute(
        'UPDATE ledger_master SET current_balance = current_balance + ? WHERE ledger_name = ?',
        [amount, debitLedger]
      );

      // Decrease credit ledger balance
      await db.execute(
        'UPDATE ledger_master SET current_balance = current_balance - ? WHERE ledger_name = ?',
        [amount, creditLedger]
      );
    } catch (error) {
      throw new Error(`Failed to update ledger balances: ${error.message}`);
    }
  }

  // Get all journal entries
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM journal_entries WHERE 1=1';
      const params = [];

      if (filters.entry_date_from) {
        query += ' AND entry_date >= ?';
        params.push(filters.entry_date_from);
      }

      if (filters.entry_date_to) {
        query += ' AND entry_date <= ?';
        params.push(filters.entry_date_to);
      }

      if (filters.voucher_no) {
        query += ' AND voucher_no LIKE ?';
        params.push(`%${filters.voucher_no}%`);
      }

      query += ' ORDER BY entry_date DESC, journal_id DESC';

      const [rows] = await db.execute(query, params);
      return rows.map(row => new JournalEntry(row));
    } catch (error) {
      throw new Error(`Failed to fetch journal entries: ${error.message}`);
    }
  }

  // Find by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM journal_entries WHERE journal_id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new JournalEntry(rows[0]);
    } catch (error) {
      throw new Error(`Failed to find journal entry: ${error.message}`);
    }
  }

  // Update journal entry
  static async update(id, updateData) {
    try {
      const [result] = await db.execute(
        `UPDATE journal_entries 
         SET entry_date = ?, debit_ledger = ?, credit_ledger = ?, amount = ?, narration = ?
         WHERE journal_id = ?`,
        [
          updateData.entry_date,
          updateData.debit_ledger,
          updateData.credit_ledger,
          updateData.amount,
          updateData.narration || '',
          id
        ]
      );

      if (result.affectedRows === 0) {
        throw new Error('Journal entry not found');
      }

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update journal entry: ${error.message}`);
    }
  }

  // Delete journal entry
  static async delete(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM journal_entries WHERE journal_id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Journal entry not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete journal entry: ${error.message}`);
    }
  }

  // Validate journal entry data
  static validate(data) {
    const errors = {};

    if (!data.entry_date) {
      errors.entry_date = 'Entry date is required';
    }

    if (!data.debit_ledger) {
      errors.debit_ledger = 'Debit ledger is required';
    }

    if (!data.credit_ledger) {
      errors.credit_ledger = 'Credit ledger is required';
    }

    if (data.debit_ledger === data.credit_ledger) {
      errors.credit_ledger = 'Debit and Credit ledgers cannot be the same';
    }

    if (!data.amount || parseFloat(data.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!data.created_by) {
      errors.created_by = 'Created by is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

module.exports = JournalEntry;