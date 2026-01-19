// Payment Entry Model - Money going out
const db = require('../../config/db');

class PaymentEntry {
  constructor(data) {
    this.payment_id = data.payment_id;
    this.voucher_no = data.voucher_no;
    this.entry_date = data.entry_date;
    this.paid_to = data.paid_to;
    this.payment_mode = data.payment_mode;
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
        ['PAYMENT']
      );
      
      if (result.length === 0) {
        throw new Error('Voucher sequence not initialized for PAYMENT entries');
      }
      
      const { current_number, prefix, financial_year } = result[0];
      const nextNumber = current_number + 1;
      const voucherNo = `${prefix}${String(nextNumber).padStart(6, '0')}/${financial_year}`;
      
      // Update sequence
      await db.execute(
        'UPDATE voucher_sequences SET current_number = ? WHERE entry_type = ?',
        [nextNumber, 'PAYMENT']
      );
      
      return voucherNo;
    } catch (error) {
      throw new Error(`Failed to generate voucher number: ${error.message}`);
    }
  }

  // Create new payment entry
  static async create(entryData) {
    try {
      // Generate voucher number if not provided
      if (!entryData.voucher_no) {
        entryData.voucher_no = await this.generateVoucherNumber();
      }

      const [result] = await db.execute(
        `INSERT INTO payment_entries 
         (voucher_no, entry_date, paid_to, payment_mode, amount, narration, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          entryData.voucher_no,
          entryData.entry_date,
          entryData.paid_to,
          entryData.payment_mode,
          entryData.amount,
          entryData.narration || '',
          entryData.created_by
        ]
      );

      // Update ledger balance (decrease cash/bank)
      await this.updateLedgerBalance(entryData.payment_mode, entryData.amount, 'decrease');

      return new PaymentEntry({ 
        payment_id: result.insertId, 
        ...entryData 
      });
    } catch (error) {
      throw new Error(`Failed to create payment entry: ${error.message}`);
    }
  }

  // Update ledger balance
  static async updateLedgerBalance(paymentMode, amount, operation) {
    try {
      const ledgerName = paymentMode === 'Cash' ? 'Cash' : 'Bank';
      const operator = operation === 'increase' ? '+' : '-';
      
      await db.execute(
        `UPDATE ledger_master SET current_balance = current_balance ${operator} ? WHERE ledger_name = ?`,
        [amount, ledgerName]
      );
    } catch (error) {
      throw new Error(`Failed to update ledger balance: ${error.message}`);
    }
  }

  // Get all payment entries
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM payment_entries WHERE 1=1';
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

      if (filters.payment_mode) {
        query += ' AND payment_mode = ?';
        params.push(filters.payment_mode);
      }

      query += ' ORDER BY entry_date DESC, payment_id DESC';

      const [rows] = await db.execute(query, params);
      return rows.map(row => new PaymentEntry(row));
    } catch (error) {
      throw new Error(`Failed to fetch payment entries: ${error.message}`);
    }
  }

  // Find by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM payment_entries WHERE payment_id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new PaymentEntry(rows[0]);
    } catch (error) {
      throw new Error(`Failed to find payment entry: ${error.message}`);
    }
  }

  // Update payment entry
  static async update(id, updateData) {
    try {
      const [result] = await db.execute(
        `UPDATE payment_entries 
         SET entry_date = ?, paid_to = ?, payment_mode = ?, amount = ?, narration = ?
         WHERE payment_id = ?`,
        [
          updateData.entry_date,
          updateData.paid_to,
          updateData.payment_mode,
          updateData.amount,
          updateData.narration || '',
          id
        ]
      );

      if (result.affectedRows === 0) {
        throw new Error('Payment entry not found');
      }

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update payment entry: ${error.message}`);
    }
  }

  // Delete payment entry
  static async delete(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM payment_entries WHERE payment_id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Payment entry not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete payment entry: ${error.message}`);
    }
  }

  // Validate payment entry data
  static validate(data) {
    const errors = {};

    if (!data.entry_date) {
      errors.entry_date = 'Entry date is required';
    }

    if (!data.paid_to) {
      errors.paid_to = 'Paid to is required';
    }

    if (!data.payment_mode) {
      errors.payment_mode = 'Payment mode is required';
    }

    if (!['Cash', 'Bank', 'Cheque', 'Draft'].includes(data.payment_mode)) {
      errors.payment_mode = 'Invalid payment mode';
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

module.exports = PaymentEntry;