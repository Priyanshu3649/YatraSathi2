// API service for making HTTP requests to the backend
const API_BASE_URL = '/api';

// Create headers for requests
const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Authentication API calls
export const authAPI = {
  // Login user
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    return data;
  },

  // Employee Login
  employeeLogin: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/employee-login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }
    
    return data;
  },
  
  // Register user
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    return data;
  },
  
  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get profile');
    }
    
    return data;
  },
  
  // Logout user
  logout: async () => {
    const sessionId = localStorage.getItem('sessionId');
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ sessionId })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Logout failed');
    }
    
    return data;
  }
};

// Dashboard API calls
export const dashboardAPI = {
  // Get admin dashboard stats
  getAdminStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/admin`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get admin stats');
    }
    
    return data;
  },

  // Role-specific dashboards
  getAgentDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/employee/agent/dashboard`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get dashboard');
    return data;
  },

  getAccountsDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/employee/accounts/dashboard`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get dashboard');
    return data;
  },

  getHRDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/employee/hr/dashboard`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get dashboard');
    return data;
  },

  getCallCenterDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/employee/callcenter/dashboard`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get dashboard');
    return data;
  },

  getMarketingDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/employee/marketing/dashboard`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get dashboard');
    return data;
  },

  getManagementDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/employee/management/dashboard`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get dashboard');
    return data;
  },
  
  // Get employee dashboard stats
  getEmployeeStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/employee`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get employee stats');
    }
    
    return data;
  },
  
  // Get customer dashboard stats
  getCustomerStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/customer`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get customer stats');
    }
    
    return data;
  }
};

// Booking API calls
export const bookingAPI = {
  // Create a new booking
  createBooking: async (bookingData) => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(bookingData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create booking');
    }
    
    return data;
  },
  
  // Get all bookings for current user
  getMyBookings: async () => {
    const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get bookings');
    }
    
    return data;
  },
  
  // Get all bookings (admin only)
  getAllBookings: async () => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get all bookings');
    }
    
    return data;
  },
  
  // Get booking by ID
  getBookingById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get booking');
    }
    
    return data;
  },
  
  // Update booking
  updateBooking: async (id, bookingData) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(bookingData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update booking');
    }
    
    return data;
  },
  
  // Cancel booking
  cancelBooking: async (id) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel booking');
    }
    
    return data;
  },
  
  // Delete booking
  deleteBooking: async (id) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete booking');
    }
    
    return data;
  },
  
  // Assign booking to employee
  assignBooking: async (bookingId, employeeId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/assign`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ bookingId, employeeId })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to assign booking');
    }
    
    return data;
  },
  
  // Get bookings by status
  getBookingsByStatus: async (status) => {
    const response = await fetch(`${API_BASE_URL}/bookings/status/${status}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get bookings by status');
    }
    
    return data;
  },
  
  // Search bookings
  searchBookings: async (searchParams) => {
    const queryParams = new URLSearchParams(searchParams).toString();
    const response = await fetch(`${API_BASE_URL}/bookings/search?${queryParams}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to search bookings');
    }
    
    return data;
  },
  
  // Get bookings by status
  getBookingsByStatus: async (status) => {
    const response = await fetch(`${API_BASE_URL}/bookings/status/${status}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get bookings by status');
    }
    
    return data;
  }
};

// Payment API calls
export const paymentAPI = {
  // Create a new payment (updated to match new backend API)
  createPayment: async (paymentData) => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        customerId: paymentData.customerId,
        amount: paymentData.amount,
        mode: paymentData.mode,
        refNo: paymentData.refNo || paymentData.transactionId || null,
        paymentDate: paymentData.paymentDate,
        remarks: paymentData.remarks || null,
        autoAllocate: paymentData.autoAllocate || false,
        allocations: paymentData.allocations || []
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create payment');
    }
    
    return data;
  },
  
  // Get all payments for current user
  getMyPayments: async () => {
    const response = await fetch(`${API_BASE_URL}/payments/my-payments`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get payments');
    }
    
    return data;
  },
  
  // Get payments by booking ID
  getPaymentsByBookingId: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/payments/booking/${bookingId}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get payments for booking');
    }
    
    return data;
  },
  
  // Get all payments (admin only)
  getAllPayments: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams 
      ? `${API_BASE_URL}/payments?${queryParams}`
      : `${API_BASE_URL}/payments`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get all payments');
    }
    
    return data;
  },
  
  // Get payment by ID
  getPaymentById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get payment');
    }
    
    return data;
  },
  
  // Get customer payments
  getCustomerPayments: async (customerId) => {
    const response = await fetch(`${API_BASE_URL}/payments/customer/${customerId}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get customer payments');
    }
    
    return data;
  },
  
  // Get payment allocations
  getPaymentAllocations: async (paymentId) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/allocations`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get payment allocations');
    }
    
    return data;
  },
  
  // Allocate payment to PNRs
  allocatePayment: async (paymentId, allocationData) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/allocate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(allocationData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to allocate payment');
    }
    
    return data;
  },
  
  // Get PNR payment history
  getPNRPayments: async (pnrNumber) => {
    const response = await fetch(`${API_BASE_URL}/payments/pnr/${pnrNumber}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get PNR payment history');
    }
    
    return data;
  },
  
  // Get customer pending PNRs
  getCustomerPendingPNRs: async (customerId) => {
    const response = await fetch(`${API_BASE_URL}/payments/customer/${customerId}/pending-pnrs`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get customer pending PNRs');
    }
    
    return data;
  },
  
  // Get customer advance balance
  getCustomerAdvance: async (customerId, fyear = null) => {
    const params = fyear ? `?fyear=${fyear}` : '';
    const response = await fetch(`${API_BASE_URL}/payments/customer/${customerId}/advance${params}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get customer advance');
    }
    
    return data;
  },
  
  // Update payment
  updatePayment: async (id, paymentData) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(paymentData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update payment');
    }
    
    return data;
  },
  
  // Process refund (updated to match new backend API)
  refundPayment: async (paymentId, refundData) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        refundAmount: refundData.refundAmount,
        pnrNumber: refundData.pnrNumber,
        remarks: refundData.remarks || null
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to process refund');
    }
    
    return data;
  },
  
  // Delete payment
  deletePayment: async (id) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete payment');
    }
    
    return data;
  }
};

// Report API calls
export const reportAPI = {
  // Get booking report
  getBookingReport: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams 
      ? `${API_BASE_URL}/reports/bookings?${queryParams}`
      : `${API_BASE_URL}/reports/bookings`;
      
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get booking report');
    }
    
    return data;
  },
  
  // Get employee performance report
  getEmployeePerformanceReport: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/employee-performance`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get employee performance report');
    }
    
    return data;
  },
  
  // Get financial report
  getFinancialReport: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams 
      ? `${API_BASE_URL}/reports/financial?${queryParams}`
      : `${API_BASE_URL}/reports/financial`;
      
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get financial report');
    }
    
    return data;
  },
  
  // Get corporate customer report
  getCorporateCustomerReport: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/corporate-customers`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get corporate customer report');
    }
    
    return data;
  },
  
  // Get customer analytics report
  getCustomerAnalyticsReport: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams 
      ? `${API_BASE_URL}/reports/customer-analytics?${queryParams}`
      : `${API_BASE_URL}/reports/customer-analytics`;
      
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get customer analytics report');
    }
    
    return data;
  }
};

// Employee API calls
export const employeeAPI = {
  // Get all employees (admin only)
  getAllEmployees: async () => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get employees');
    }
    
    return data;
  },
  
  // Get employee by ID (admin only)
  getEmployeeById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get employee');
    }
    
    return data;
  },
  
  // Create employee (admin only)
  createEmployee: async (employeeData) => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(employeeData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create employee');
    }
    
    return data;
  },
  
  // Update employee (admin only)
  updateEmployee: async (id, employeeData) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(employeeData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update employee');
    }
    
    return data;
  },
  
  // Delete employee (admin only)
  deleteEmployee: async (id) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete employee');
    }
    
    return data;
  }
};

// Billing API calls
export const billingAPI = {
  // Create a new bill
  createBill: async (billData) => {
    const response = await fetch(`${API_BASE_URL}/billing`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(billData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create bill');
    }
    
    return data;
  },
  
  // Get all bills for current user
  getMyBills: async () => {
    const response = await fetch(`${API_BASE_URL}/billing/my-bills`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get bills');
    }
    
    return data;
  },
  
  // Get all bills (admin only)
  getAllBills: async () => {
    const response = await fetch(`${API_BASE_URL}/billing`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get all bills');
    }
    
    return data;
  },
  
  // Get bill by ID
  getBillById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/billing/${id}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get bill');
    }
    
    return data;
  },
  
  // Update bill
  updateBill: async (id, billData) => {
    const response = await fetch(`${API_BASE_URL}/billing/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(billData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update bill');
    }
    
    return data;
  },
  
  // Finalize bill
  finalizeBill: async (id) => {
    const response = await fetch(`${API_BASE_URL}/billing/${id}/finalize`, {
      method: 'PUT',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to finalize bill');
    }
    
    return data;
  },
  
  // Delete bill
  deleteBill: async (id) => {
    const response = await fetch(`${API_BASE_URL}/billing/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete bill');
    }
    
    return data;
  },
  
  // Export bill as PDF
  exportBill: async (id) => {
    const response = await fetch(`${API_BASE_URL}/billing/${id}/export`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to export bill');
    }
    
    return response.blob();
  },
  
  // Get customer ledger
  getCustomerLedger: async (customerId) => {
    const response = await fetch(`${API_BASE_URL}/billing/customer/${customerId}/ledger`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get customer ledger');
    }
    
    return data;
  },
  
  // Get customer balance
  getCustomerBalance: async (customerId) => {
    const response = await fetch(`${API_BASE_URL}/billing/customer/${customerId}/balance`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get customer balance');
    }
    
    return data;
  },
  
  // Search bills
  searchBills: async (searchParams) => {
    const queryParams = new URLSearchParams(searchParams).toString();
    const response = await fetch(`${API_BASE_URL}/billing/search?${queryParams}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to search bills');
    }
    
    return data;
  }
};

export default {
  authAPI,
  dashboardAPI,
  bookingAPI,
  paymentAPI,
  reportAPI,
  employeeAPI,
  billingAPI
};