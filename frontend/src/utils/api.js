// API utility functions

const API_BASE_URL = '/api';

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, config);
    
    // Handle different response status codes
    if (response.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  getProfile: () => apiRequest('/auth/profile', {
    method: 'GET'
  }),
  
  updateProfile: (profileData) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  })
};

// Booking API functions
export const bookingAPI = {
  createBooking: (bookingData) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData)
  }),
  
  getMyBookings: () => apiRequest('/bookings/my-bookings', {
    method: 'GET'
  }),
  
  getBookingById: (id) => apiRequest(`/bookings/${id}`, {
    method: 'GET'
  }),
  
  updateBooking: (id, bookingData) => apiRequest(`/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(bookingData)
  }),
  
  deleteBooking: (id) => apiRequest(`/bookings/${id}`, {
    method: 'DELETE'
  })
};

// Payment API functions
export const paymentAPI = {
  createPayment: (paymentData) => apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  }),
  
  getMyPayments: () => apiRequest('/payments/my-payments', {
    method: 'GET'
  }),
  
  getPaymentById: (id) => apiRequest(`/payments/${id}`, {
    method: 'GET'
  }),
  
  updatePayment: (id, paymentData) => apiRequest(`/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(paymentData)
  }),
  
  deletePayment: (id) => apiRequest(`/payments/${id}`, {
    method: 'DELETE'
  })
};

// Dashboard API functions
export const dashboardAPI = {
  getDashboard: () => apiRequest('/dashboard', {
    method: 'GET'
  }),
  
  getAdminDashboard: () => apiRequest('/dashboard/admin', {
    method: 'GET'
  }),
  
  getEmployeeDashboard: () => apiRequest('/dashboard/employee', {
    method: 'GET'
  }),
  
  getCustomerDashboard: () => apiRequest('/dashboard/customer', {
    method: 'GET'
  })
};

export default apiRequest;