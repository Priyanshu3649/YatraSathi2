// Contra Entry Model - Cash to Bank / Bank to Cash transfers
const { mysqlPool: db } = require('../../config/db');

class ContraEntry {
  constructor(data) {
    this.contra_id = data.contra_id;
    this.voucher_no = data.voucher_no;
    this.entry_date = data.entry_date;
    this.ledger_from = data.ledger_from;
    this.ledger_to = data.ledger_to;
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
        ['CONTRA']
      );
      
      if (result.length === 0) {
        throw new Error('Voucher sequence not initialized for CONTRA entries');
      }
      
      const { current_number, prefix, financial_year } = result[0];
      const nextNumber = current_number + 1;
      const voucherNo = `${prefix}${String(nextNumber).padStart(6, '0')}/${financial_year}`;
      
      // Update sequence
      await db.execute(
        'UPDATE voucher_sequences SET current_number = ? WHERE entry_type = ?',
        [nextNumber, 'CONTRA']
      );
      
      return voucherNo;
    } catch (error) {
      throw new Error(`Failed to generate voucher number: ${error.message}`);
    }
  }

  // Create new contra entry
  static async create(entryData) {
    try {
      // Generate voucher number if not provided
      if (!entryData.voucher_no) {
        entryData.voucher_no = await this.generateVoucherNumber();
      }

      const [result] = await db.execute(
        `INSERT INTO contra_entries 
         (voucher_no, entry_date, ledger_from, ledger_to, amount, narration, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          entryData.voucher_no,
          entryData.entry_date,
          entryData.ledger_from,
          entryData.ledger_to,
          entryData.amount,
          entryData.narration || '',
          entryData.created_by
        ]
      );

      // Update ledger balances
      await this.updateLedgerBalances(entryData.ledger_from, entryData.ledger_to, entryData.amount);

      return new ContraEntry({ 
        contra_id: result.insertId, 
        ...entryData 
      });
    } catch (error) {
      throw new Error(`Failed to create contra entry: ${error.message}`);
    }
  }

  // Update ledger balances
  static async updateLedgerBalances(ledgerFrom, ledgerTo, amount) {
    try {
      // Decrease balance of 'from' ledger
      await db.execute(
        'UPDATE ledger_master SET current_balance = current_balance - ? WHERE ledger_name = ?',
        [amount, ledgerFrom]
      );

      // Increase balance of 'to' ledger
      await db.execute(
        'UPDATE ledger_master SET current_balance = current_balance + ? WHERE ledger_name = ?',
        [amount, ledgerTo]
      );
    } catch (error) {
      throw new Error(`Failed to update ledger balances: ${error.message}`);
    }
  }

  // Get all contra entries
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM contra_entries WHERE 1=1';
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

      query += ' ORDER BY entry_date DESC, contra_id DESC';

      const [rows] = await db.execute(query, params);
      return rows.map(row => new ContraEntry(row));
    } catch (error) {
      throw new Error(`Failed to fetch contra entries: ${error.message}`);
    }
  }

  // Find by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM contra_entries WHERE contra_id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new ContraEntry(rows[0]);
    } catch (error) {
      throw new Error(`Failed to find contra entry: ${error.message}`);
    }
  }

  // Update contra entry
  static async update(id, updateData) {
    try {
      const [result] = await db.execute(
        `UPDATE contra_entries 
         SET entry_date = ?, ledger_from = ?, ledger_to = ?, amount = ?, narration = ?
         WHERE contra_id = ?`,
        [
          updateData.entry_date,
          updateData.ledger_from,
          updateData.ledger_to,
          updateData.amount,
          updateData.narration || '',
          id
        ]
      );

      if (result.affectedRows === 0) {
        throw new Error('Contra entry not found');
      }

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update contra entry: ${error.message}`);
    }
  }

  // Delete contra entry
  static async delete(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM contra_entries WHERE contra_id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Contra entry not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete contra entry: ${error.message}`);
    }
  }

  // Validate contra entry data
  static validate(data) {
    const errors = {};

    if (!data.entry_date) {
      errors.entry_date = 'Entry date is required';
    }

    if (!data.ledger_from) {
      errors.ledger_from = 'From ledger is required';
    }

    if (!data.ledger_to) {
      errors.ledger_to = 'To ledger is required';
    }

    if (data.ledger_from === data.ledger_to) {
      errors.ledger_to = 'From and To ledgers cannot be the same';
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

module.exports = ContraEntry;