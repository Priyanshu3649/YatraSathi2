const { AsyncLocalStorage } = require('async_hooks');

const dbStore = new AsyncLocalStorage();
let fyCache = null; // In-memory cache for financial year database mapping

const getStore = () => {
  return dbStore.getStore();
};

const run = (dbName, callback) => {
  return dbStore.run(dbName, callback);
};

const cacheFYs = async () => {
  try {
    // Lazily require sequelize to avoid circular dependencies
    const { sequelize } = require('../../config/db');
    const masterDb = process.env.DB_NAME_TVL || 'YATRASATHI_MASTER';
    
    // Fetch active financial years from master database context
    const rows = await sequelize.query(
      `SELECT fy_label AS fy_name, db_name AS fy_dbname FROM \`${masterDb}\`.financial_years WHERE is_active = 1`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const cache = {};
    for (const row of rows) {
      cache[row.fy_name] = row.fy_dbname;
    }
    
    fyCache = cache;
    console.log('✅ Financial years cache populated:', fyCache);
    return fyCache;
  } catch (error) {
    console.error('⚠️ Failed to cache financial years (table might not exist yet):', error.message);
    fyCache = {};
    return fyCache;
  }
};

const getDbNameForFY = async (fy) => {
  if (!fyCache) {
    await cacheFYs();
  }
  return fyCache[fy] || null;
};

const checkUserFYPermission = async (userId, fy) => {
  try {
    const { sequelize } = require('../../config/db');
    const masterDb = process.env.DB_NAME_TVL || 'YATRASATHI_MASTER';
    
    // First, check if the user is an admin. Admins have access to all financial years.
    const [user] = await sequelize.query(
      'SELECT us_usertype, us_roid FROM usXuser WHERE us_usid = ?',
      { replacements: [userId], type: sequelize.QueryTypes.SELECT }
    );
    
    if (user && (user.us_usertype === 'admin' || user.us_roid === 'ADM')) {
      return true;
    }

    // Customers automatically get access to the current financial year (2026-27)
    if (user && user.us_usertype === 'customer') {
      // Check if requested FY is the current FY (2026-27)
      const [currentFY] = await sequelize.query(
        `SELECT 1 FROM \`${masterDb}\`.financial_years WHERE fy_label = ? AND is_active = 1`,
        { replacements: [fy], type: sequelize.QueryTypes.SELECT }
      );
      if (currentFY) {
        return true; // Auto-grant customers access to active FY
      }
    }

    // For employees/others, check explicit mapping in user_financial_years
    const rows = await sequelize.query(
      `SELECT 1 FROM \`${masterDb}\`.user_financial_years ufy
       JOIN \`${masterDb}\`.financial_years fy ON ufy.ufy_fyid = fy.fy_id
       WHERE ufy.ufy_usid = ? AND fy.fy_label = ? AND fy.is_active = 1`,
      { replacements: [userId, fy], type: sequelize.QueryTypes.SELECT }
    );
    
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking user financial year permission:', error.message);
    return false;
  }
};

module.exports = {
  getStore,
  run,
  cacheFYs,
  getDbNameForFY,
  checkUserFYPermission,
  get fyCache() { return fyCache; }
};
