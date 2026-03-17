// Test script for the new Accounting Module
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5004';

// Test data
const testUser = {
  username: 'admin',
  password: 'admin123'
};

const testContraEntry = {
  entry_date: '2025-01-18',
  ledger_from: 'Cash in Hand',
  ledger_to: 'Bank Account - SBI',
  amount: 10000,
  narration: 'Cash deposit to bank',
  total_debit: 10000,
  total_credit: 10000,
  ledger_entries: [
    {
      account_name: 'Bank Account - SBI',
      debit_amount: 10000,
      credit_amount: 0
    },
    {
      account_name: 'Cash in Hand',
      debit_amount: 0,
      credit_amount: 10000
    }
  ]
};

async function testAccountingModule() {
  try {
    console.log('🧪 Testing Accounting Module...\n');
    
    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test Chart of Accounts
    console.log('\n2. Testing Chart of Accounts...');
    const accountsResponse = await axios.get(`${BASE_URL}/api/accounting/accounts`, { headers });
    console.log(`✅ Retrieved ${accountsResponse.data.data.length} accounts`);
    console.log('Sample accounts:', accountsResponse.data.data.slice(0, 3).map(acc => `${acc.account_code} - ${acc.account_name}`));
    
    // Step 3: Test Account Search
    console.log('\n3. Testing Account Search...');
    const searchResponse = await axios.get(`${BASE_URL}/api/accounting/accounts/search?q=cash`, { headers });
    console.log(`✅ Found ${searchResponse.data.data.length} accounts matching 'cash'`);
    
    // Step 4: Test Contra Entry Creation
    console.log('\n4. Testing Contra Entry Creation...');
    const contraResponse = await axios.post(`${BASE_URL}/api/accounting/contra`, testContraEntry, { headers });
    console.log('✅ Contra entry created successfully');
    console.log('Voucher Number:', contraResponse.data.data.voucher_no);
    console.log('Entry ID:', contraResponse.data.data.id);
    
    // Step 5: Test Contra Entry Retrieval
    console.log('\n5. Testing Contra Entry Retrieval...');
    const contraListResponse = await axios.get(`${BASE_URL}/api/accounting/contra`, { headers });
    console.log(`✅ Retrieved ${contraListResponse.data.data.length} contra entries`);
    
    // Step 6: Test Contra Entry by ID
    const contraId = contraResponse.data.data.id;
    console.log('\n6. Testing Contra Entry by ID...');
    const contraByIdResponse = await axios.get(`${BASE_URL}/api/accounting/contra/${contraId}`, { headers });
    console.log('✅ Retrieved contra entry by ID');
    console.log('Voucher:', contraByIdResponse.data.data.voucher_no);
    console.log('Amount:', contraByIdResponse.data.data.amount);
    console.log('Ledger Entries:', contraByIdResponse.data.data.ledger_entries.length);
    
    console.log('\n🎉 All tests passed! Accounting module is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('💡 This might be due to authentication. Make sure the admin user exists.');
    }
  }
}

// Run the test
testAccountingModule();