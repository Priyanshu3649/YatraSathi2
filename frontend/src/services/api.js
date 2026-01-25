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
    const response = await fetch(`${API_BASE_URL}/profile`, {
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
    // Only send sessionId if it exists, backend will handle TVL users appropriately
    const requestBody = sessionId ? { sessionId } : {};
    
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Logout failed');
    }
    
    return data;
  },
  
  // Update user profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    
    return data;
  },
  
  // Upload profile image
  uploadProfileImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/profile/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload image');
    }
    
    return data;
  },

  // Customer Login
  customerLogin: async (email, password) => {
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

  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to request password reset');
    }
    
    return data;
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token, newPassword })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }
    
    return data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify email');
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
    console.time('API_BOOKING_CREATE');
    try {
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
    } finally {
      console.timeEnd('API_BOOKING_CREATE');
    }
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
  
  // Get all bookings (admin and employees) - accepts user role to avoid localStorage inconsistencies
  getAllBookings: async (userRole = null) => {
    // If user role is passed in, use it directly
    let effectiveUserRole = userRole;
    
    // Otherwise, get user data from localStorage as fallback
    if (!effectiveUserRole) {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          effectiveUserRole = userData.us_roid || userData.role || 'customer';
        }
      } catch (e) {
        console.warn('Could not get user data to determine role');
      }
    }
      
    // Use employee-specific endpoint for employee roles
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(effectiveUserRole);
    const url = isEmployee 
      ? `${API_BASE_URL}/employee/bookings`
      : `${API_BASE_URL}/bookings`;
      
    const response = await fetch(url, {
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
    console.time('API_BOOKING_UPDATE');
    try {
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
    } finally {
      console.timeEnd('API_BOOKING_UPDATE');
    }
  },
  
  // Update booking status
  updateBookingStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ status })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update booking status');
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
  
  // Get passengers for a specific booking
  getBookingPassengers: async (bookingId) => {
    // Determine user role to use correct endpoint
    let userRole = 'CUS'; // default to customer
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userRole = user.us_roid || user.role || 'CUS';
      }
    } catch (e) {
      console.warn('Could not determine user role for passenger endpoint');
    }
    
    // Use appropriate endpoint based on user role
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(userRole);
    const url = isEmployee 
      ? `${API_BASE_URL}/employee/bookings/${bookingId}/passengers`  // Employee/Admin route
      : `${API_BASE_URL}/customer/bookings/${bookingId}/passengers`; // Customer route
    
    console.log(`Fetching passengers for booking ${bookingId} using ${isEmployee ? 'employee' : 'customer'} endpoint: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get booking passengers');
    }
    
    console.log('Passenger data received:', data);
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
  
  // Get all payments (admin and employees)
  getAllPayments: async (params = {}) => {
    const token = localStorage.getItem('token');
    // Try to decode token to check user role
    let userRole = 'customer'; // default
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = payload.role || 'customer';
      } catch (e) {
        console.warn('Could not decode token to determine role');
      }
    }
      
    // Use employee-specific endpoint for employee roles
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(userRole);
    const queryParams = new URLSearchParams(params).toString();
    const baseUrl = isEmployee 
      ? `${API_BASE_URL}/employee/payments`
      : `${API_BASE_URL}/payments`;
    const url = queryParams 
      ? `${baseUrl}?${queryParams}`
      : baseUrl;
      
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
  },

  // Get payment history for a specific payment (using allocations as history)
  getPaymentHistory: async (paymentId) => {
    // Using the existing allocations endpoint as payment history
    return await paymentAPI.getPaymentAllocations(paymentId);
  },

  // Search customers for dropdown
  searchCustomers: async (searchTerm) => {
    const token = localStorage.getItem('token');
    // Try to decode token to check user role
    let userRole = 'CUS'; // default to customer
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = payload.us_roid || payload.role || 'CUS'; // Look for us_roid first, then role, default to CUS
      } catch (e) {
        console.warn('Could not decode token to determine role');
      }
    }
    
    // Use employee-specific endpoint for non-customer roles
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(userRole);
    const url = isEmployee 
      ? `${API_BASE_URL}/employee/customers/search?q=${encodeURIComponent(searchTerm)}`
      : `${API_BASE_URL}/customer/search?q=${encodeURIComponent(searchTerm)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to search customers');
    }
    
    return data;
  },

  // Get customer by ID
  getCustomerById: async (customerId) => {
    const token = localStorage.getItem('token');
    // Try to decode token to check user role
    let userRole = 'CUS'; // default to customer
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = payload.us_roid || payload.role || 'CUS'; // Look for us_roid first, then role, default to CUS
      } catch (e) {
        console.warn('Could not decode token to determine role');
      }
    }
    
    // Use employee-specific endpoint for non-customer roles
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(userRole);
    const url = isEmployee 
      ? `${API_BASE_URL}/employee/customers/${customerId}`
      : `${API_BASE_URL}/customer/${customerId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get customer by ID');
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
  
  // Create employee (admin only) - handles both regular data and file uploads
  createEmployee: async (employeeData) => {
    const formData = new FormData();
    
    // Append all fields to FormData for multipart upload
    Object.keys(employeeData).forEach(key => {
      if (employeeData[key] !== null && employeeData[key] !== undefined) {
        formData.append(key, employeeData[key]);
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type header - let browser set it with boundary
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create employee');
    }
    
    return data;
  },
  
  // Update employee (admin only) - handles both regular data and file uploads
  updateEmployee: async (id, employeeData) => {
    const formData = new FormData();
    
    // Append all fields to FormData for multipart upload
    Object.keys(employeeData).forEach(key => {
      if (employeeData[key] !== null && employeeData[key] !== undefined) {
        formData.append(key, employeeData[key]);
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: {
        // Don't set Content-Type header - let browser set it with boundary
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
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
    const token = localStorage.getItem('token');
    // Try to decode token to check user role
    let userRole = 'customer'; // default
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = payload.role || 'customer';
      } catch (e) {
        console.warn('Could not decode token to determine role');
      }
    }
      
    // Use employee-specific endpoint for employee roles
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(userRole);
    const url = isEmployee 
      ? `${API_BASE_URL}/employee/billing`
      : `${API_BASE_URL}/billing/my-bills`;
      
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get bills');
    }
    
    return data;
  },
  
  // Get all bills (admin and employees)
  // Get all bills (admin and employees)
  getAllBills: async () => {
    const userRole = getUserRole();
    
    // Use employee-specific endpoint for employee roles
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(userRole);
    const url = isEmployee 
      ? `${API_BASE_URL}/employee/billing`
      : `${API_BASE_URL}/billing`;
      
    const response = await fetch(url, {
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

// Helper function to get user role from localStorage
const getUserRole = () => {
  try {
    // Try to get user data from localStorage (set by AuthContext)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.us_roid || user.role || 'CUS';
    }
    
    // Fallback: try to decode token (though it may not have role info)
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.us_roid || payload.role || 'CUS';
    }
  } catch (e) {
    console.warn('Could not determine user role:', e);
  }
  return 'CUS'; // Default to customer
};

// Customer API calls
export const customerAPI = {
  // Search customers (accessible to admin and employees)
  searchCustomers: async (searchTerm) => {
    const userRole = getUserRole();
    
    // Use employee-specific endpoint for non-customer roles
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(userRole);
    const url = isEmployee 
      ? `${API_BASE_URL}/employee/customers/search?q=${encodeURIComponent(searchTerm)}`
      : `${API_BASE_URL}/customer/search?q=${encodeURIComponent(searchTerm)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to search customers');
    }
    
    return data;
  },

  // MANDATORY: Find customer by phone number (for booking auto-fetch)
  findByPhone: async (phoneNumber) => {
    const userRole = getUserRole();
    
    // Use employee-specific endpoint for non-customer roles
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(userRole);
    const url = isEmployee 
      ? `${API_BASE_URL}/employee/customers/phone/${encodeURIComponent(phoneNumber)}`
      : `${API_BASE_URL}/customer/phone/${encodeURIComponent(phoneNumber)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Return not found instead of throwing error for graceful handling
      if (response.status === 404) {
        return { success: false, data: null, message: 'Customer not found' };
      }
      throw new Error(data.message || 'Failed to lookup customer by phone');
    }
    
    return data;
  },

  // Get customer by ID
  getCustomerById: async (customerId) => {
    const userRole = getUserRole();
    
    // Use employee-specific endpoint for non-customer roles
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(userRole);
    const url = isEmployee 
      ? `${API_BASE_URL}/employee/customers/${customerId}`
      : `${API_BASE_URL}/customer/${customerId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get customer by ID');
    }
    
    return data;
  }
};

// Master Passenger API calls
export const masterPassengerAPI = {
  // Functions for cmpXmasterpassenger table

  // Get all master passengers for current customer
  getMasterPassengers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/master-passengers`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle different error statuses
        if (response.status === 401) {
          // Unauthorized - likely token issue
          throw new Error(data.message || 'Authentication required. Please log in again.');
        } else if (response.status === 403) {
          // Forbidden - access denied
          throw new Error(data.message || 'Access forbidden. Insufficient permissions.');
        } else if (response.status === 404) {
          // Not found - likely endpoint doesn't exist
          throw new Error(data.message || 'Master passengers endpoint not found. Please contact support.');
        } else {
          // Other error
          throw new Error(data.message || `Failed to get master passengers (${response.status}). Please try again.`);
        }
      }
      
      return data;
    } catch (error) {
      // Handle network errors or other exceptions
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
      }
      throw error;
    }
  },
  
  // Create a new master passenger
  createMasterPassenger: async (passengerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/master-passengers`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(passengerData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || 'Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error(data.message || 'Access forbidden. Insufficient permissions.');
        } else if (response.status === 400) {
          throw new Error(data.message || 'Invalid data provided. Please check your inputs.');
        } else {
          throw new Error(data.message || `Failed to create master passenger (${response.status}). Please try again.`);
        }
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
      }
      throw error;
    }
  },
  
  // Get master passenger by ID
  getMasterPassengerById: async (passengerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/master-passengers/${passengerId}`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || 'Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error(data.message || 'Access forbidden. Insufficient permissions.');
        } else if (response.status === 404) {
          throw new Error(data.message || 'Master passenger not found.');
        } else {
          throw new Error(data.message || `Failed to get master passenger (${response.status}). Please try again.`);
        }
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
      }
      throw error;
    }
  },
  
  // Update master passenger
  updateMasterPassenger: async (passengerId, passengerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/master-passengers/${passengerId}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(passengerData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || 'Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error(data.message || 'Access forbidden. Insufficient permissions.');
        } else if (response.status === 400) {
          throw new Error(data.message || 'Invalid data provided. Please check your inputs.');
        } else if (response.status === 404) {
          throw new Error(data.message || 'Master passenger not found.');
        } else {
          throw new Error(data.message || `Failed to update master passenger (${response.status}). Please try again.`);
        }
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
      }
      throw error;
    }
  },
  
  // Delete (deactivate) master passenger
  deleteMasterPassenger: async (passengerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/master-passengers/${passengerId}`, {
        method: 'DELETE',
        headers: getHeaders(true)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || 'Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error(data.message || 'Access forbidden. Insufficient permissions.');
        } else if (response.status === 404) {
          throw new Error(data.message || 'Master passenger not found.');
        } else {
          throw new Error(data.message || `Failed to delete master passenger (${response.status}). Please try again.`);
        }
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
      }
      throw error;
    }
  },
  
  // Functions for mlXmasterlist table
  getMasterPassengersML: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/master-list`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || 'Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error(data.message || 'Access forbidden. Insufficient permissions.');
        } else if (response.status === 404) {
          throw new Error(data.message || 'Master passengers endpoint not found. Please contact support.');
        } else {
          throw new Error(data.message || `Failed to get master passengers (${response.status}). Please try again.`);
        }
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
      }
      throw error;
    }
  },
  
  createMasterPassengerML: async (passengerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/master-list`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(passengerData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || 'Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error(data.message || 'Access forbidden. Insufficient permissions.');
        } else if (response.status === 400) {
          throw new Error(data.message || 'Invalid data provided. Please check your inputs.');
        } else {
          throw new Error(data.message || `Failed to create master passenger (${response.status}). Please try again.`);
        }
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
      }
      throw error;
    }
  },
  
  getMasterPassengerByIdML: async (passengerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/master-list/${passengerId}`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || 'Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error(data.message || 'Access forbidden. Insufficient permissions.');
        } else if (response.status === 404) {
          throw new Error(data.message || 'Master passenger not found.');
        } else {
          throw new Error(data.message || `Failed to get master passenger (${response.status}). Please try again.`);
        }
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
      }
      throw error;
    }
  },
  
  updateMasterPassengerML: async (passengerId, passengerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/master-list/${passengerId}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(passengerData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || 'Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error(data.message || 'Access forbidden. Insufficient permissions.');
        } else if (response.status === 400) {
          throw new Error(data.message || 'Invalid data provided. Please check your inputs.');
        } else if (response.status === 404) {
          throw new Error(data.message || 'Master passenger not found.');
        } else {
          throw new Error(data.message || `Failed to update master passenger (${response.status}). Please try again.`);
        }
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
      }
      throw error;
    }
  },
  
  deleteMasterPassengerML: async (passengerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/master-list/${passengerId}`, {
        method: 'DELETE',
        headers: getHeaders(true)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || 'Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error(data.message || 'Access forbidden. Insufficient permissions.');
        } else if (response.status === 404) {
          throw new Error(data.message || 'Master passenger not found.');
        } else {
          throw new Error(data.message || `Failed to delete master passenger (${response.status}). Please try again.`);
        }
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
      }
      throw error;
    }
  }
};

export default {
  authAPI,
  dashboardAPI,
  bookingAPI,
  paymentAPI,
  reportAPI,
  employeeAPI,
  billingAPI,
  customerAPI,
  masterPassengerAPI
};