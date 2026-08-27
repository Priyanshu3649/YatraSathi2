const { FinancialTransactionRef } = require('../models');

/**
 * Checks if a UTR number is globally unique.
 * Throws an error if the UTR already exists.
 * @param {string} utrNumber - The UTR number to check
 * @param {string} excludeTransactionType - The type to exclude from the check (e.g., 'PAYMENT', 'RECEIPT') if updating.
 * @param {number} excludeTransactionId - The ID to exclude from the check if updating.
 * @returns {boolean} true if unique
 */
async function validateUtrUniqueness(utrNumber, excludeTransactionType = null, excludeTransactionId = null, transaction = null) {
  if (!utrNumber) return true; // Empty UTRs don't need uniqueness check

  const whereClause = { utr_number: utrNumber };

  const existingRef = await FinancialTransactionRef.findOne({ where: whereClause, transaction });

  if (existingRef) {
    // If we're updating the same record, it's fine
    if (
      excludeTransactionType && 
      excludeTransactionId && 
      existingRef.transaction_type === excludeTransactionType && 
      existingRef.transaction_id.toString() === excludeTransactionId.toString()
    ) {
      return true;
    }
    
    throw new Error(`UTR Number '${utrNumber}' is already used by a ${existingRef.transaction_type.toLowerCase()} record.`);
  }

  return true;
}

/**
 * Saves a UTR reference in the central FinancialTransactionRefs table.
 * @param {string} utrNumber - The UTR number
 * @param {string} transactionType - The type ('PAYMENT', 'RECEIPT', 'JOURNAL', 'CONTRA')
 * @param {number} transactionId - The ID of the transaction record
 */
async function saveUtrReference(utrNumber, transactionType, transactionId, transaction = null) {
  if (!utrNumber) return;

  // Check if a reference already exists for this transaction
  const existingRef = await FinancialTransactionRef.findOne({
    where: {
      transaction_type: transactionType,
      transaction_id: transactionId
    },
    transaction
  });

  if (existingRef) {
    if (existingRef.utr_number !== utrNumber) {
      await existingRef.update({ utr_number: utrNumber }, { transaction });
    }
  } else {
    await FinancialTransactionRef.create({
      utr_number: utrNumber,
      transaction_type: transactionType,
      transaction_id: transactionId
    }, { transaction });
  }
}

module.exports = {
  validateUtrUniqueness,
  saveUtrReference
};
