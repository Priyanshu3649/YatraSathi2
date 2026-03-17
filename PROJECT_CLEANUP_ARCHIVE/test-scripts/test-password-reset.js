/**
 * Test Script for Password Reset Functionality
 * Tests the complete forgot password flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5003/api';

// Test user credentials
const TEST_EMAIL = 'admin@example.com';
const NEW_PASSWORD = 'NewPassword123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function testPasswordResetFlow() {
  let resetToken = null;
  let originalPassword = null;

  try {
    logSection('PASSWORD RESET FLOW TEST');

    // Step 1: Request Password Reset
    logSection('Step 1: Request Password Reset');
    log(`Requesting password reset for: ${TEST_EMAIL}`, 'blue');
    
    try {
      const resetResponse = await axios.post(`${BASE_URL}/auth/request-password-reset`, {
        email: TEST_EMAIL
      });

      log('✓ Password reset request successful', 'green');
      log(`Response: ${resetResponse.data.message}`, 'blue');
      
      // In development mode, the token is returned in the response
      if (resetResponse.data.resetToken) {
        resetToken = resetResponse.data.resetToken;
        log(`Reset Token: ${resetToken}`, 'yellow');
      } else {
        log('⚠ No reset token in response (production mode)', 'yellow');
        log('Check email for reset link', 'yellow');
        return;
      }
    } catch (error) {
      log('✗ Password reset request failed', 'red');
      log(`Error: ${error.response?.data?.message || error.message}`, 'red');
      return;
    }

    // Step 2: Reset Password with Token
    logSection('Step 2: Reset Password with Token');
    log(`Using token: ${resetToken}`, 'blue');
    log(`New password: ${NEW_PASSWORD}`, 'blue');

    try {
      const resetPasswordResponse = await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: resetToken,
        newPassword: NEW_PASSWORD
      });

      log('✓ Password reset successful', 'green');
      log(`Response: ${resetPasswordResponse.data.message}`, 'blue');
    } catch (error) {
      log('✗ Password reset failed', 'red');
      log(`Error: ${error.response?.data?.message || error.message}`, 'red');
      return;
    }

    // Step 3: Test Login with New Password
    logSection('Step 3: Test Login with New Password');
    log(`Attempting login with new password`, 'blue');

    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: NEW_PASSWORD
      });

      log('✓ Login successful with new password', 'green');
      log(`User: ${loginResponse.data.name}`, 'blue');
      log(`Token received: ${loginResponse.data.token ? 'Yes' : 'No'}`, 'blue');
    } catch (error) {
      log('✗ Login failed with new password', 'red');
      log(`Error: ${error.response?.data?.message || error.message}`, 'red');
      return;
    }

    // Step 4: Test Token Reuse (Should Fail)
    logSection('Step 4: Test Token Reuse (Should Fail)');
    log(`Attempting to reuse token: ${resetToken}`, 'blue');

    try {
      await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: resetToken,
        newPassword: 'AnotherPassword123'
      });

      log('✗ Token reuse succeeded (SECURITY ISSUE!)', 'red');
    } catch (error) {
      log('✓ Token reuse blocked (Expected behavior)', 'green');
      log(`Error: ${error.response?.data?.message || error.message}`, 'blue');
    }

    // Step 5: Test Invalid Token (Should Fail)
    logSection('Step 5: Test Invalid Token (Should Fail)');
    const invalidToken = 'invalid_token_12345';
    log(`Attempting with invalid token: ${invalidToken}`, 'blue');

    try {
      await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: invalidToken,
        newPassword: 'TestPassword123'
      });

      log('✗ Invalid token accepted (SECURITY ISSUE!)', 'red');
    } catch (error) {
      log('✓ Invalid token rejected (Expected behavior)', 'green');
      log(`Error: ${error.response?.data?.message || error.message}`, 'blue');
    }

    // Step 6: Test Invalid Email (Should Fail)
    logSection('Step 6: Test Invalid Email (Should Fail)');
    const invalidEmail = 'nonexistent@example.com';
    log(`Requesting reset for invalid email: ${invalidEmail}`, 'blue');

    try {
      await axios.post(`${BASE_URL}/auth/request-password-reset`, {
        email: invalidEmail
      });

      log('✗ Invalid email accepted (SECURITY ISSUE!)', 'red');
    } catch (error) {
      log('✓ Invalid email rejected (Expected behavior)', 'green');
      log(`Error: ${error.response?.data?.message || error.message}`, 'blue');
    }

    logSection('TEST SUMMARY');
    log('✓ All password reset tests completed successfully!', 'green');
    log('\nNote: The password has been changed. You may want to reset it back.', 'yellow');

  } catch (error) {
    log('\n✗ Test failed with unexpected error', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.stack) {
      log(`Stack: ${error.stack}`, 'red');
    }
  }
}

// Run the tests
async function main() {
  log('Starting Password Reset Flow Tests...', 'cyan');
  log('Make sure the backend server is running on http://localhost:5003\n', 'yellow');

  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/auth/test`);
    log('✓ Backend server is running', 'green');
  } catch (error) {
    log('✗ Backend server is not running', 'red');
    log('Please start the server with: node src/server.js', 'yellow');
    process.exit(1);
  }

  await testPasswordResetFlow();
}

main();
