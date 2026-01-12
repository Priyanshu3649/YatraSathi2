// Test script to verify the update payment functionality
const axios = require('axios');

async function testUpdatePayment() {
  try {
    // Use a test token (you'll need to replace this with a valid token from your system)
    const token = process.env.TEST_TOKEN || 'your_valid_jwt_token_here';
    
    if (!token) {
      console.log('❌ Please provide a valid JWT token for testing');
      return;
    }

    // Test update of payment ID 1
    const paymentId = 1;
    const updateData = {
      customerId: 'TEST_CUST_001',
      amount: 7500.00,
      mode: 'CARD',
      refNo: 'CARD-UPDATE-TEST',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'ADJUSTED',
      remarks: 'Updated via test script'
    };

    console.log('Testing PUT /api/payments/:id endpoint...');
    console.log('Payment ID:', paymentId);
    console.log('Update Data:', updateData);

    const response = await axios.put(
      `http://localhost:5000/api/payments/${paymentId}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Update successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Update failed with status:', error.response.status);
      console.log('Error data:', error.response.data);
    } else {
      console.log('❌ Network error or other error:', error.message);
    }
  }
}

// Run the test
testUpdatePayment();