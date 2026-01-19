// Accounting Controller for YatraSathi Payments Module
// Handles all four accounting transaction types

const { 
  ContraEntry, 
  PaymentEntry, 
  ReceiptEntry, 
  JournalEntry, 
  ChartOfAccounts 
} = require('../models/AccountingEntry');

// CONTRA ENTRY CONTROLLERS
const createContraEntry = async (req, res) => {
  try {
    const userId = req.user?.us_usid || req.user?.id;
    const result = await ContraEntry.create(req.body, userId);
    
    res.status(201).json({
      success: true,
      message: 'Contra entry created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating contra entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create contra entry'
    });
  }
};

const getContraEntries = async (req, res) => {
  try {
    const filters = {
      financial_year: req.query.financial_year,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    
    const entries = await ContraEntry.getAll(filters);
    
    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error('Error fetching contra entries:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contra entries'
    });
  }
};

const getContraEntryById = async (req, res) => {
  try {
    const entry = await ContraEntry.getById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Contra entry not found'
      });
    }
    
    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error fetching contra entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contra entry'
    });
  }
};

const updateContraEntry = async (req, res) => {
  try {
    const userId = req.user?.us_usid || req.user?.id;
    await ContraEntry.update(req.params.id, req.body, userId);
    
    res.json({
      success: true,
      message: 'Contra entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating contra entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update contra entry'
    });
  }
};

const deleteContraEntry = async (req, res) => {
  try {
    await ContraEntry.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Contra entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contra entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete contra entry'
    });
  }
};

// PAYMENT ENTRY CONTROLLERS
const createPaymentEntry = async (req, res) => {
  try {
    const userId = req.user?.us_usid || req.user?.id;
    const result = await PaymentEntry.create(req.body, userId);
    
    res.status(201).json({
      success: true,
      message: 'Payment entry created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating payment entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment entry'
    });
  }
};

const getPaymentEntries = async (req, res) => {
  try {
    const filters = {
      financial_year: req.query.financial_year,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    
    const entries = await PaymentEntry.getAll(filters);
    
    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error('Error fetching payment entries:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment entries'
    });
  }
};

const getPaymentEntryById = async (req, res) => {
  try {
    const entry = await PaymentEntry.getById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Payment entry not found'
      });
    }
    
    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error fetching payment entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment entry'
    });
  }
};

// RECEIPT ENTRY CONTROLLERS
const createReceiptEntry = async (req, res) => {
  try {
    const userId = req.user?.us_usid || req.user?.id;
    const result = await ReceiptEntry.create(req.body, userId);
    
    res.status(201).json({
      success: true,
      message: 'Receipt entry created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating receipt entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create receipt entry'
    });
  }
};

const getReceiptEntries = async (req, res) => {
  try {
    const filters = {
      financial_year: req.query.financial_year,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    
    const entries = await ReceiptEntry.getAll(filters);
    
    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error('Error fetching receipt entries:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch receipt entries'
    });
  }
};

const getReceiptEntryById = async (req, res) => {
  try {
    const entry = await ReceiptEntry.getById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Receipt entry not found'
      });
    }
    
    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error fetching receipt entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch receipt entry'
    });
  }
};

// JOURNAL ENTRY CONTROLLERS
const createJournalEntry = async (req, res) => {
  try {
    const userId = req.user?.us_usid || req.user?.id;
    const result = await JournalEntry.create(req.body, userId);
    
    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create journal entry'
    });
  }
};

const getJournalEntries = async (req, res) => {
  try {
    const filters = {
      financial_year: req.query.financial_year,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    
    const entries = await JournalEntry.getAll(filters);
    
    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch journal entries'
    });
  }
};

const getJournalEntryById = async (req, res) => {
  try {
    const entry = await JournalEntry.getById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }
    
    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch journal entry'
    });
  }
};

// CHART OF ACCOUNTS CONTROLLERS
const getChartOfAccounts = async (req, res) => {
  try {
    const accounts = await ChartOfAccounts.getAll();
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch chart of accounts'
    });
  }
};

const searchAccounts = async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const accounts = await ChartOfAccounts.search(searchTerm);
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Error searching accounts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search accounts'
    });
  }
};

module.exports = {
  // Contra Entry
  createContraEntry,
  getContraEntries,
  getContraEntryById,
  updateContraEntry,
  deleteContraEntry,
  
  // Payment Entry
  createPaymentEntry,
  getPaymentEntries,
  getPaymentEntryById,
  
  // Receipt Entry
  createReceiptEntry,
  getReceiptEntries,
  getReceiptEntryById,
  
  // Journal Entry
  createJournalEntry,
  getJournalEntries,
  getJournalEntryById,
  
  // Chart of Accounts
  getChartOfAccounts,
  searchAccounts
};