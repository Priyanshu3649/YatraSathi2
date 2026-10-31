const { sequelizeTVL, Config } = require('../models');
const { Op, QueryTypes } = require('sequelize');

const DEFAULTS = {
  prefix: process.env.BILL_NUMBER_PREFIX || 'AT',
  padding: Number(process.env.BILL_NUMBER_PADDING) || 6
};

let configCache = null;
let configCachedAt = 0;
const CONFIG_TTL_MS = 60000;

/**
 * Indian financial year label (1 April - 31 March), e.g. 2026-27.
 */
function getFinancialYearLabel(dateLike) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike || Date.now());
  if (Number.isNaN(date.getTime())) {
    return getFinancialYearLabel(new Date());
  }

  const year = date.getFullYear();
  const isSecondHalf = date.getMonth() >= 3; // April onwards
  const startYear = isSecondHalf ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

async function getNumberingConfig() {
  if (configCache && Date.now() - configCachedAt < CONFIG_TTL_MS) {
    return configCache;
  }

  let prefix = DEFAULTS.prefix;
  let padding = DEFAULTS.padding;

  try {
    const rows = await Config.findAll({
      where: { cf_cfid: { [Op.in]: ['BILL_NUMBER_PREFIX', 'BILL_NUMBER_PADDING'] } }
    });
    for (const row of rows) {
      if (row.cf_cfid === 'BILL_NUMBER_PREFIX' && row.cf_cfval) prefix = row.cf_cfval;
      if (row.cf_cfid === 'BILL_NUMBER_PADDING') {
        const parsed = parseInt(row.cf_cfval, 10);
        if (parsed >= 1 && parsed <= 12) padding = parsed;
      }
    }
  } catch (error) {
    console.warn('Bill numbering config unavailable, using defaults:', error.message);
  }

  configCache = { prefix, padding };
  configCachedAt = Date.now();
  return configCache;
}

function formatBillNumber(prefix, financialYear, sequence, padding) {
  return `${prefix}/${financialYear}/${String(sequence).padStart(padding, '0')}`;
}

/**
 * Atomically issue the next bill number for a financial year.
 *
 * The sequence row is locked (SELECT ... FOR UPDATE) inside the caller's
 * transaction, so two concurrent issuances can never read the same value.
 * If the surrounding transaction rolls back, the number is released and reused;
 * a number that is only ever committed is never reused.
 *
 * @param {object} options
 * @param {Date|string} [options.billDate] bill/billing date that decides the FY
 * @param {string} [options.financialYear] explicit FY label override
 * @param {object} [options.transaction] caller-owned Sequelize transaction
 * @returns {Promise<{billNumber: string, financialYear: string, sequence: number}>}
 */
async function issueBillNumber({ billDate, financialYear, transaction } = {}) {
  const fy = financialYear || getFinancialYearLabel(billDate || new Date());
  const { prefix, padding } = await getNumberingConfig();

  const run = async (tx) => {
    // Ensure the FY row exists. INSERT IGNORE is deliberately avoided: its
    // duplicate-key shared lock plus the FOR UPDATE exclusive lock below is the
    // classic S→X upgrade deadlock when two bills are created at the same time.
    // ON DUPLICATE KEY UPDATE takes the exclusive lock straight away, so
    // concurrent issuances queue instead of deadlocking.
    await tx.sequelize.query(
      `INSERT INTO bill_number_sequences (financial_year, last_issued_number, created_at, updated_at)
       VALUES (:fy, 0, NOW(), NOW())
       ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      { replacements: { fy }, transaction: tx }
    );

    const rows = await tx.sequelize.query(
      `SELECT last_issued_number
       FROM bill_number_sequences
       WHERE financial_year = :fy
       FOR UPDATE`,
      { replacements: { fy }, type: QueryTypes.SELECT, transaction: tx }
    );

    const sequence = Number(rows[0]?.last_issued_number || 0) + 1;

    await tx.sequelize.query(
      `UPDATE bill_number_sequences
       SET last_issued_number = :sequence, updated_at = NOW()
       WHERE financial_year = :fy`,
      { replacements: { fy, sequence }, transaction: tx }
    );

    return {
      billNumber: formatBillNumber(prefix, fy, sequence, padding),
      financialYear: fy,
      sequence
    };
  };

  if (transaction) {
    return run(transaction);
  }

  const own = await sequelizeTVL.transaction();
  try {
    const issued = await run(own);
    await own.commit();
    return issued;
  } catch (error) {
    await own.rollback();
    throw error;
  }
}

/**
 * Next unused letter suffix (A, B, C...) for sub-bills derived from a parent.
 */
function nextSubBillSuffix(existingCount) {
  return String.fromCharCode(65 + Math.max(0, existingCount));
}

/**
 * Strips an existing trailing -A/-B letter so repeated operations do not stack
 * suffixes (BILL-1-A-A).
 */
function stripSubBillSuffix(value) {
  if (!value) return value;
  return String(value).replace(/-[A-Z]$/, '');
}

/**
 * Collision-safe sub-bill number for a split/cancellation child.
 * Derives the next free letter from the numbers already taken by siblings,
 * instead of trusting an in-memory counter that can drift after deletions.
 */
function nextSubBillNumber(parentBillNo, existingSubBillNos = []) {
  const base = stripSubBillSuffix(parentBillNo);
  const taken = new Set(
    existingSubBillNos.filter(Boolean).map((value) => String(value).trim())
  );

  for (let index = 0; index < 26; index += 1) {
    const candidate = `${base}-${nextSubBillSuffix(index)}`;
    if (!taken.has(candidate)) return candidate;
  }

  throw new Error(`Bill ${base} already has the maximum number of sub-bills`);
}

/**
 * Entry number for a cancellation document. It keeps the parent bill number and
 * only the system suffix changes, so the reservation and its cancellation share
 * one bill number and stay traceable.
 */
function nextCancellationEntryNo(parentEntryNo, existingEntryNos = []) {
  const base = stripSubBillSuffix(String(parentEntryNo || '').trim());
  if (!base) throw new Error('Cannot derive cancellation number without a bill number');

  const taken = new Set(
    existingEntryNos.filter(Boolean).map((value) => String(value).trim())
  );

  for (let index = 1; index <= 999; index += 1) {
    const candidate = `${base}-C${index}`;
    if (candidate.length > 30) {
      throw new Error(`Bill number ${base} is too long to derive a cancellation entry number`);
    }
    if (!taken.has(candidate)) return candidate;
  }

  throw new Error(`Bill ${base} already has the maximum number of cancellation documents`);
}

module.exports = {
  DEFAULTS,
  getFinancialYearLabel,
  getNumberingConfig,
  formatBillNumber,
  issueBillNumber,
  nextSubBillSuffix,
  nextSubBillNumber,
  nextCancellationEntryNo,
  stripSubBillSuffix
};
