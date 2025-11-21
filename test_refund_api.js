const axios = require('axios');

// Test refund API functionality
async function testRefundAPI() {
  try {
    // First, login as customer to get auth token
    console.log('Attempting customer login...');
    const customerLoginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'customer@example.com',
      password: 'customer123'
    });
    
    const customerToken = customerLoginResponse.data.token;
    console.log('Customer login successful');
    
    // Create a booking as customer
    console.log('Creating a booking...');
    const bookingData = {
      fromStation: 'ST001',
      toStation: 'ST002',
      travelDate: '2023-12-25',
      travelClass: '3A',
      berthPreference: 'LB',
      totalPassengers: 2,
      remarks: 'Test booking for refund'
    };
    
    const createBookingResponse = await axios.post('http://localhost:5003/api/bookings', bookingData, {
      headers: {
        'Authorization': `Bearer ${customerToken}`
      }
    });
    
    const bookingId = createBookingResponse.data.bk_bkid;
    console.log('Booking created with ID:', bookingId);
    
    // Login as admin to assign the booking to an employee
    console.log('Attempting admin login...');
    const adminLoginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const adminToken = adminLoginResponse.data.token;
    console.log('Admin login successful');
    
    // Assign booking to employee
    console.log('Assigning booking to employee...');
    const assignBookingResponse = await axios.post('http://localhost:5003/api/bookings/assign', 
      { bookingId: bookingId, employeeId: 'EMP001' },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );
    
    console.log('Booking assigned to employee');
    
    // Login as accounts team member to test payment creation
    console.log('Attempting accounts team login...');
    const accountsLoginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'accounts@example.com',
      password: 'accounts123'
    });
    
    const accountsToken = accountsLoginResponse.data.token;
    console.log('Accounts team login successful');
    
    // Test creating a payment
    const paymentData = {
      bookingId: bookingId,
      amount: 5000.00,
      mode: 'ONLINE',
      transactionId: 'TXN123456789',
      paymentDate: '2023-12-01',
      remarks: 'Test payment for refund'
    };
    
    console.log('Creating payment...');
    const createPaymentResponse = await axios.post('http://localhost:5003/api/payments', paymentData, {
      headers: {
        'Authorization': `Bearer ${accountsToken}`
      }
    });
    
    const paymentId = createPaymentResponse.data.pt_ptid;
    console.log('Payment created with ID:', paymentId);
    
    // Test refunding the payment
    console.log('Refunding payment...');
    const refundData = {
      refundAmount: 2000.00,
      remarks: 'Partial refund test'
    };
    
    const refundPaymentResponse = await axios.post(`http://localhost:5003/api/payments/${paymentId}/refund`, refundData, {
      headers: {
        'Authorization': `Bearer ${accountsToken}`
      }
    });
    
    console.log('Refund processed:', refundPaymentResponse.data.message);
    console.log('Refund payment ID:', refundPaymentResponse.data.refundPayment.pt_ptid);
    
    // Test getting all payments (admin)
    console.log('Fetching all payments...');
    const getAllPaymentsResponse = await axios.get('http://localhost:5003/api/payments', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('Total payments:', getAllPaymentsResponse.data.length);
    
    // Test getting customer payments
    console.log('Fetching customer payments...');
    const getCustomerPaymentsResponse = await axios.get('http://localhost:5003/api/payments/my-payments', {
      headers: {
        'Authorization': `Bearer ${customerToken}`
      }
    });
    
    console.log('Customer payments:', getCustomerPaymentsResponse.data.length);
    
    console.log('All refund tests completed successfully!');
    
  } catch (error) {
    console.error('Error testing refund API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testRefundAPI();