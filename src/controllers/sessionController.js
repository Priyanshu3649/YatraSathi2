const { sequelize } = require('../../config/db');
const dbContext = require('../utils/dbContext');

/**
 * Compute the current financial year label based on today's date.
 * In India the FY runs April 1 – March 31.
 * e.g. today = 2026-07-13 → "2026-27"
 *      today = 2027-01-10 → "2026-27"
 *      today = 2027-04-01 → "2027-28"
 */
const computeCurrentFYLabel = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-based
  const startYear = month >= 4 ? year : year - 1;
  const endYear = (startYear + 1) % 100; // last two digits
  return `${startYear}-${String(endYear).padStart(2, '0')}`;
};

/**
 * Get all available financial years for the authenticated user
 */
const getAvailableYears = async (req, res) => {
  try {
    const userId = req.user.us_usid;
    const userRole = req.user.us_roid || req.user.role?.fn_fnid;
    const userType = req.user.us_usertype || req.user.usertype;

    const masterDb = process.env.DB_NAME_TVL || 'TVL_001';
    let rows;
    
    // Admins have access to all active financial years
    if (userRole === 'ADM' || userType === 'admin') {
      rows = await sequelize.query(
        `SELECT fy_id, fy_label AS fy_name, fy_code AS fy_desc FROM \`${masterDb}\`.financial_years WHERE is_active = 1 ORDER BY fy_label ASC`,
        { type: sequelize.QueryTypes.SELECT }
      );
    } else {
      // Regular users only have access to mapped financial years
      rows = await sequelize.query(
        `SELECT fy.fy_id, fy.fy_label AS fy_name, fy.fy_code AS fy_desc FROM \`${masterDb}\`.user_financial_years ufy
         JOIN \`${masterDb}\`.financial_years fy ON ufy.ufy_fyid = fy.fy_id
         WHERE ufy.ufy_usid = ? AND fy.is_active = 1
         ORDER BY fy.fy_label ASC`,
        { replacements: [userId], type: sequelize.QueryTypes.SELECT }
      );
    }

    // Compute the current FY label (e.g. "2026-27") and find it in the rows
    const currentFYLabel = computeCurrentFYLabel();
    // Best match: exact fy_name match; fallback to the last row (latest year)
    const currentFY = rows.find(r => r.fy_name === currentFYLabel) || rows[rows.length - 1] || null;

    res.json({
      success: true,
      data: rows,
      currentFY: currentFY ? currentFY.fy_name : (rows[rows.length - 1]?.fy_name || null)
    });
  } catch (error) {
    console.error('Error fetching available financial years:', error.message);
    res.status(500).json({
      success: false,
      error: { 
        code: 'SERVER_ERROR', 
        message: 'Failed to fetch available financial years',
        details: error.message,
        stack: error.stack
      }
    });
  }
};

/**
 * Validate and select a financial year for the session
 */
const selectYear = async (req, res) => {
  try {
    const { financialYear } = req.body;
    const userId = req.user.us_usid;

    if (!financialYear) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Financial year is required' }
      });
    }

    // 1. Resolve the database name
    const dbName = await dbContext.getDbNameForFY(financialYear);
    if (!dbName) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_FY', message: `Financial year ${financialYear} is not configured or active.` }
      });
    }

    // 2. Validate user permission for the selected financial year
    const hasPermission = await dbContext.checkUserFYPermission(userId, financialYear);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this financial year.' }
      });
    }

    // 3. Confirm database exists by performing a test connection or query
    try {
      await sequelize.query(`SELECT 1 FROM \`${dbName}\`.usXuser LIMIT 1`, { type: sequelize.QueryTypes.SELECT });
    } catch (dbError) {
      console.error(`Database ${dbName} exists check failed:`, dbError.message);
      return res.status(500).json({
        success: false,
        error: { code: 'DB_NOT_FOUND', message: `Database for financial year ${financialYear} is not initialized or accessible.` }
      });
    }

    res.json({
      success: true,
      data: {
        financialYear,
        databaseName: dbName,
        message: `Successfully switched to session: ${financialYear}`
      }
    });
  } catch (error) {
    console.error('Error selecting financial year:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to select financial year' }
    });
  }
};

module.exports = {
  getAvailableYears,
  selectYear
};
