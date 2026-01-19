// Receipt Entry Model - Money coming in
const db = require('../../config/db');

class ReceiptEntry {
  constructor(data) {
    this.receipt_id = data.receipt_id;
    this.voucher_no = data.voucher_no;
    this.entry_date = data.entry_date;
    this.received_from = data.received_from;
    this.receipt_mode = data.receipt_mode;
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
        ['RECEIPT']
      );
      
      if (result.length === 0) {
        throw new Error('Voucher sequence not initialized for RECEIPT entries');
      }
      
      const { current_number, prefix, financial_year } = result[0];
      const nextNumber = current_number + 1;
      const voucherNo = `${prefix}${String(nextNumber).padStart(6, '0')}/${financial_year}`;
      
      // Update sequence
      await db.execute(
        'UPDATE voucher_sequences SET current_number = ? WHERE entry_type = ?',
        [nextNumber, 'RECEIPT']
      );
      
      return voucherNo;
    } catch (error) {
      throw new Error(`Failed to generate voucher number: ${error.message}`);
    }
  }

  // Create new receipt entry
  static async create(entryData) {
    try {
      // Generate voucher number if not provided
      if (!entryData.voucher_no) {
        entryData.voucher_no = await this.generateVoucherNumber();
      }

      const [result] = await db.execute(
        `INSERT INTO receipt_entries 
         (voucher_no, entry_date, received_from, receipt_mode, amount, narration, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          entryData.voucher_no,
          entryData.entry_date,
          entryData.received_from,
          entryData.receipt_mode,
          entryData.amount,
          entryData.narration || '',
          entryData.created_by
        ]
      );

      // Update ledger balance (increase cash/bank)
      await this.updateLedgerBalance(entryData.receipt_mode, entryData.amount, 'increase');

      return new ReceiptEntry({ 
        receipt_id: result.insertId, 
        ...entryData 
      });
    } catch (error) {
      throw new Error(`Failed to create receipt entry: ${error.message}`);
    }
  }

  // Update ledger balance
  static async updateLedgerBalance(receiptMode, amount, operation) {
    try {
      const ledgerName = receiptMode === 'Cash' ? 'Cash' : 'Bank';
      const operator = operation === 'increase' ? '+' : '-';
      
      await db.execute(
        `UPDATE ledger_master SET current_balance = current_balance ${operator} ? WHERE ledger_name = ?`,
        [amount, ledgerName]
      );
    } catch (error) {
      throw new Error(`Failed to update ledger balance: ${error.message}`);
    }
  }

  // Get all receipt entries
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM receipt_entries WHERE 1=1';
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

      if (filters.receipt_mode) {
        query += ' AND receipt_mode = ?';
        params.push(filters.receipt_mode);
      }

      query += ' ORDER BY entry_date DESC, receipt_id DESC';

      const [rows] = await db.execute(query, params);
      return rows.map(row => new ReceiptEntry(row));
    } catch (error) {
      throw new Error(`Failed to fetch receipt entries: ${error.message}`);
    }
  }

  // Find by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM receipt_entries WHERE receipt_id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new ReceiptEntry(rows[0]);
    } catch (error) {
      throw new Error(`Failed to find receipt entry: ${error.message}`);
    }
  }

  // Update receipt entry
  static async update(id, updateData) {
    try {
      const [result] = await db.execute(
        `UPDATE receipt_entries 
         SET entry_date = ?, received_from = ?, receipt_mode = ?, amount = ?, narration = ?
         WHERE receipt_id = ?`,
        [
          updateData.entry_date,
          updateData.received_from,
          updateData.receipt_mode,
          updateData.amount,
          updateData.narration || '',
          id
        ]
      );

      if (result.affectedRows === 0) {
        throw new Error('Receipt entry not found');
      }

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update receipt entry: ${error.message}`);
    }
  }

  // Delete receipt entry
  static async delete(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM receipt_entries WHERE receipt_id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Receipt entry not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete receipt entry: ${error.message}`);
    }
  }

  // Validate receipt entry data
  static validate(data) {
    const errors = {};

    if (!data.entry_date) {
      errors.entry_date = 'Entry date is required';
    }

    if (!data.received_from) {
      errors.received_from = 'Received from is required';
    }

    if (!data.receipt_mode) {
      errors.receipt_mode = 'Receipt mode is required';
    }

    if (!['Cash', 'Bank', 'Cheque', 'Draft'].includes(data.receipt_mode)) {
      errors.receipt_mode = 'Invalid receipt mode';
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

module.exports = ReceiptEntry;