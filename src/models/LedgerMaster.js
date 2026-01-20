// Ledger Master Model - For managing chart of accounts
const { mysqlPool: db } = require('../../config/db');

class LedgerMaster {
  constructor(data) {
    this.ledger_id = data.ledger_id;
    this.ledger_name = data.ledger_name;
    this.ledger_type = data.ledger_type;
    this.opening_balance = data.opening_balance;
    this.current_balance = data.current_balance;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
  }

  // Get all active ledgers
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM ledger_master WHERE is_active = 1';
      const params = [];

      if (filters.ledger_type) {
        query += ' AND ledger_type = ?';
        params.push(filters.ledger_type);
      }

      if (filters.search) {
        query += ' AND ledger_name LIKE ?';
        params.push(`%${filters.search}%`);
      }

      query += ' ORDER BY ledger_name ASC';

      const [rows] = await db.execute(query, params);
      return rows.map(row => new LedgerMaster(row));
    } catch (error) {
      throw new Error(`Failed to fetch ledgers: ${error.message}`);
    }
  }

  // Get ledgers for dropdown (name only)
  static async getLedgerList() {
    try {
      const [rows] = await db.execute(
        'SELECT ledger_name FROM ledger_master WHERE is_active = 1 ORDER BY ledger_name ASC'
      );
      return rows.map(row => row.ledger_name);
    } catch (error) {
      throw new Error(`Failed to fetch ledger list: ${error.message}`);
    }
  }

  // Get cash and bank ledgers only
  static async getCashBankLedgers() {
    try {
      const [rows] = await db.execute(
        'SELECT ledger_name FROM ledger_master WHERE ledger_type IN (?, ?) AND is_active = 1 ORDER BY ledger_name ASC',
        ['Cash', 'Bank']
      );
      return rows.map(row => row.ledger_name);
    } catch (error) {
      throw new Error(`Failed to fetch cash/bank ledgers: ${error.message}`);
    }
  }

  // Find by name
  static async findByName(name) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM ledger_master WHERE ledger_name = ? AND is_active = 1',
        [name]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new LedgerMaster(rows[0]);
    } catch (error) {
      throw new Error(`Failed to find ledger: ${error.message}`);
    }
  }

  // Create new ledger
  static async create(ledgerData) {
    try {
      const [result] = await db.execute(
        `INSERT INTO ledger_master 
         (ledger_name, ledger_type, opening_balance, current_balance) 
         VALUES (?, ?, ?, ?)`,
        [
          ledgerData.ledger_name,
          ledgerData.ledger_type,
          ledgerData.opening_balance || 0.00,
          ledgerData.current_balance || ledgerData.opening_balance || 0.00
        ]
      );

      return new LedgerMaster({ 
        ledger_id: result.insertId, 
        ...ledgerData,
        is_active: true
      });
    } catch (error) {
      throw new Error(`Failed to create ledger: ${error.message}`);
    }
  }

  // Update ledger balance
  static async updateBalance(ledgerName, amount, operation = 'add') {
    try {
      const operator = operation === 'add' ? '+' : '-';
      
      const [result] = await db.execute(
        `UPDATE ledger_master SET current_balance = current_balance ${operator} ? WHERE ledger_name = ?`,
        [amount, ledgerName]
      );

      if (result.affectedRows === 0) {
        throw new Error('Ledger not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to update ledger balance: ${error.message}`);
    }
  }

  // Get ledger balance
  static async getBalance(ledgerName) {
    try {
      const [rows] = await db.execute(
        'SELECT current_balance FROM ledger_master WHERE ledger_name = ? AND is_active = 1',
        [ledgerName]
      );
      
      if (rows.length === 0) {
        throw new Error('Ledger not found');
      }
      
      return parseFloat(rows[0].current_balance);
    } catch (error) {
      throw new Error(`Failed to get ledger balance: ${error.message}`);
    }
  }

  // Validate ledger data
  static validate(data) {
    const errors = {};

    if (!data.ledger_name || data.ledger_name.trim() === '') {
      errors.ledger_name = 'Ledger name is required';
    }

    if (!data.ledger_type) {
      errors.ledger_type = 'Ledger type is required';
    }

    const validTypes = ['Cash', 'Bank', 'Expense', 'Income', 'Asset', 'Liability', 'Capital'];
    if (data.ledger_type && !validTypes.includes(data.ledger_type)) {
      errors.ledger_type = 'Invalid ledger type';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

module.exports = LedgerMaster;