// Date and timezone utilities

// Get current date in specified timezone
const getCurrentDateInTimezone = (timezone = 'Asia/Kolkata') => {
  return new Date().toLocaleString('en-US', { timeZone: timezone });
};

// Format date for display
const formatDisplayDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format datetime for display
const formatDisplayDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Get financial year for a date
const getFinancialYear = (date) => {
  const d = new Date(date);
  const month = d.getMonth() + 1; // Months are 0-indexed
  const year = d.getFullYear();
  
  // Financial year starts from April 1st
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Get start and end dates of financial year
const getFinancialYearDates = (financialYear) => {
  if (!financialYear) {
    financialYear = getFinancialYear(new Date());
  }
  
  const [startYear, endYear] = financialYear.split('-');
  
  return {
    startDate: new Date(`${startYear}-04-01`),
    endDate: new Date(`${endYear}-03-31`)
  };
};

// Add days to a date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Calculate difference in days between two dates
const daysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Reset time part to compare only dates
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Check if date is in the past
const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
};

// Check if date is in the future
const isFutureDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate > today;
};

// Get start of day
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get end of day
const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Get start of month
const startOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get end of month
const endOfMonth = (date) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Format duration in hours and minutes
const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  } else {
    return `${mins}m`;
  }
};

module.exports = {
  getCurrentDateInTimezone,
  formatDisplayDate,
  formatDisplayDateTime,
  getFinancialYear,
  getFinancialYearDates,
  addDays,
  daysDifference,
  isPastDate,
  isFutureDate,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  formatDuration
};