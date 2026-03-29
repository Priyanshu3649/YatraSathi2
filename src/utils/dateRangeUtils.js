/**
 * Utility to generate date ranges for various period types
 * Supporting Indian Financial Year (Apr-Mar)
 */

const getDateRange = (periodType, customStartDate, customEndDate) => {
  const now = new Date();
  let startDate, endDate;

  switch (periodType) {
    case 'DAILY':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;

    case 'MONTHLY':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case 'QUARTERLY':
      const currentMonth = now.getMonth(); // 0-indexed
      let quarterStartMonth;
      
      if (currentMonth >= 3 && currentMonth <= 5) quarterStartMonth = 3; // Q1: Apr-Jun
      else if (currentMonth >= 6 && currentMonth <= 8) quarterStartMonth = 6; // Q2: Jul-Sep
      else if (currentMonth >= 9 && currentMonth <= 11) quarterStartMonth = 9; // Q3: Oct-Dec
      else quarterStartMonth = 0; // Q4: Jan-Mar
      
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
      break;

    case 'ANNUAL':
      const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      startDate = new Date(fyYear, 3, 1); // Apr 1st
      endDate = new Date(fyYear + 1, 2, 31, 23, 59, 59, 999); // Mar 31st
      break;

    case 'CUSTOM':
      startDate = customStartDate ? new Date(customStartDate) : new Date();
      endDate = customEndDate ? new Date(customEndDate) : new Date();
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
  }

  return { 
    startDate: startDate.toISOString().split('T')[0], 
    endDate: endDate.toISOString().split('T')[0] 
  };
};

module.exports = { getDateRange };
