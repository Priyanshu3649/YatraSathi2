// Finance utilities

// Format currency for display
const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined) return '0.00';
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Format as currency
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

// Calculate service charge
const calculateServiceCharge = (amount, percentage = 10) => {
  return (amount * percentage) / 100;
};

// Calculate tax amount
const calculateTax = (amount, taxPercentage = 18) => {
  return (amount * taxPercentage) / 100;
};

// Calculate total amount including service charge and tax
const calculateTotalAmount = (baseAmount, serviceChargePercentage = 10, taxPercentage = 18) => {
  const serviceCharge = calculateServiceCharge(baseAmount, serviceChargePercentage);
  const amountWithServiceCharge = baseAmount + serviceCharge;
  const taxAmount = calculateTax(amountWithServiceCharge, taxPercentage);
  const totalAmount = amountWithServiceCharge + taxAmount;
  
  return {
    baseAmount,
    serviceCharge,
    taxAmount,
    totalAmount
  };
};

// Calculate pending amount
const calculatePendingAmount = (totalAmount, paidAmount) => {
  return Math.max(0, totalAmount - paidAmount);
};

// Check if payment is overdue
const isPaymentOverdue = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  
  // Reset time part for date comparison
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  return due < today;
};

// Calculate credit utilization percentage
const calculateCreditUtilization = (used, limit) => {
  if (limit <= 0) return 0;
  return (used / limit) * 100;
};

// Check if credit limit is exceeded
const isCreditLimitExceeded = (used, limit) => {
  return used > limit;
};

// Calculate payment allocation
const calculatePaymentAllocation = (paymentAmount, pnrs) => {
  // Simple allocation: distribute equally among PNRs
  // In a real implementation, you might want more sophisticated allocation logic
  
  if (!pnrs || pnrs.length === 0) {
    return [];
  }
  
  const allocationPerPNR = paymentAmount / pnrs.length;
  const allocations = [];
  
  pnrs.forEach(pnr => {
    allocations.push({
      pnrId: pnr._id || pnr.id,
      pnrNumber: pnr.pnrNumber,
      allocatedAmount: parseFloat(allocationPerPNR.toFixed(2))
    });
  });
  
  // Adjust for rounding differences
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
  const difference = paymentAmount - totalAllocated;
  
  if (Math.abs(difference) > 0.01 && allocations.length > 0) {
    // Add difference to the first PNR
    allocations[0].allocatedAmount += difference;
  }
  
  return allocations;
};

// Format financial summary
const formatFinancialSummary = (summary) => {
  return {
    totalBookings: formatCurrency(summary.totalBookings),
    totalPayments: formatCurrency(summary.totalPayments),
    totalPending: formatCurrency(summary.totalPending),
    totalRevenue: formatCurrency(summary.totalRevenue)
  };
};

// Calculate profit/loss
const calculateProfitLoss = (revenue, expenses) => {
  return revenue - expenses;
};

// Calculate profit/loss percentage
const calculateProfitLossPercentage = (revenue, expenses) => {
  if (revenue === 0) return 0;
  return ((revenue - expenses) / revenue) * 100;
};

module.exports = {
  formatCurrency,
  calculateServiceCharge,
  calculateTax,
  calculateTotalAmount,
  calculatePendingAmount,
  isPaymentOverdue,
  calculateCreditUtilization,
  isCreditLimitExceeded,
  calculatePaymentAllocation,
  formatFinancialSummary,
  calculateProfitLoss,
  calculateProfitLossPercentage
};