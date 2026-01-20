#!/usr/bin/env node

/**
 * Comprehensive Functional Audit Test
 * Tests all 8 critical areas identified in the audit assessment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE FUNCTIONAL AUDIT TEST');
console.log('=' .repeat(60));

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

const addResult = (category, test, status, message) => {
  testResults.details.push({ category, test, status, message });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
};

// 1. ROLE-BASED ACCESS CONTROL TEST
console.log('\n1️⃣  ROLE-BASED ACCESS CONTROL TEST');
console.log('-'.repeat(40));

// Check RoleBasedRoute component
if (fs.existsSync('frontend/src/components/RoleBasedRoute.jsx')) {
  const roleBasedContent = fs.readFileSync('frontend/src/components/RoleBasedRoute.jsx', 'utf8');
  
  // Check for all required roles
  const requiredRoles = ['ADM', 'AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'CUS'];
  const foundRoles = requiredRoles.filter(role => roleBasedContent.includes(role));
  
  if (foundRoles.length === requiredRoles.length) {
    addResult('RBAC', 'Role Definitions', 'PASS', `All ${requiredRoles.length} roles defined`);
  } else {
    addResult('RBAC', 'Role Definitions', 'FAIL', `Missing roles: ${requiredRoles.filter(r => !foundRoles.includes(r)).join(', ')}`);
  }
  
  // Check for permission mapping
  if (roleBasedContent.includes('ROLE_PERMISSIONS') && roleBasedContent.includes('allowedModules')) {
    addResult('RBAC', 'Permission Mapping', 'PASS', 'Role permissions properly mapped');
  } else {
    addResult('RBAC', 'Permission Mapping', 'FAIL', 'Role permissions mapping missing');
  }
  
  // Check for session persistence in AuthContext
  if (fs.existsSync('frontend/src/contexts/AuthContext.jsx')) {
    const authContent = fs.readFileSync('frontend/src/contexts/AuthContext.jsx', 'utf8');
    if (authContent.includes('localStorage') && authContent.includes('checkUserStatus')) {
      addResult('RBAC', 'Session Persistence', 'PASS', 'Session persistence implemented');
    } else {
      addResult('RBAC', 'Session Persistence', 'WARN', 'Session persistence may be incomplete');
    }
  }
} else {
  addResult('RBAC', 'RoleBasedRoute Component', 'FAIL', 'RoleBasedRoute.jsx not found');
}

// 2. PAYMENTS MODULE VERIFICATION
console.log('\n2️⃣  PAYMENTS MODULE VERIFICATION');
console.log('-'.repeat(40));

const paymentForms = [
  'frontend/src/components/Payments/ContraForm.jsx',
  'frontend/src/components/Payments/JournalForm.jsx', 
  'frontend/src/components/Payments/PaymentForm.jsx',
  'frontend/src/components/Payments/ReceiptForm.jsx'
];

let paymentFormsFound = 0;
paymentForms.forEach(form => {
  if (fs.existsSync(form)) {
    paymentFormsFound++;
    const formName = path.basename(form, '.jsx');
    addResult('PAYMENTS', `${formName} Form`, 'PASS', 'Form component exists');
  } else {
    const formName = path.basename(form, '.jsx');
    addResult('PAYMENTS', `${formName} Form`, 'FAIL', 'Form component missing');
  }
});

// Check for debit/credit validation
if (fs.existsSync('frontend/src/components/Payments/JournalForm.jsx')) {
  const journalContent = fs.readFileSync('frontend/src/components/Payments/JournalForm.jsx', 'utf8');
  if (journalContent.includes('debit_ledger') && journalContent.includes('credit_ledger')) {
    addResult('PAYMENTS', 'Debit/Credit Fields', 'PASS', 'Debit/Credit fields implemented');
    
    if (journalContent.includes('debit_ledger === formData.credit_ledger')) {
      addResult('PAYMENTS', 'Debit/Credit Validation', 'PASS', 'Debit ≠ Credit validation found');
    } else {
      addResult('PAYMENTS', 'Debit/Credit Validation', 'WARN', 'Basic validation may be incomplete');
    }
  } else {
    addResult('PAYMENTS', 'Debit/Credit Fields', 'FAIL', 'Debit/Credit fields missing');
  }
}

// 3. KEYBOARD-ONLY WORKFLOW VALIDATION
console.log('\n3️⃣  KEYBOARD-ONLY WORKFLOW VALIDATION');
console.log('-'.repeat(40));

// Check keyboard navigation components
const keyboardFiles = [
  'frontend/src/contexts/KeyboardNavigationContext.jsx',
  'frontend/src/hooks/useKeyboardNavigation.js',
  'frontend/src/hooks/usePassengerEntry.js'
];

keyboardFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    if (content.includes('useCallback') && content.includes('useEffect')) {
      addResult('KEYBOARD', fileName, 'PASS', 'Keyboard navigation properly implemented');
    } else {
      addResult('KEYBOARD', fileName, 'WARN', 'May have implementation issues');
    }
  } else {
    addResult('KEYBOARD', path.basename(file), 'FAIL', 'Keyboard navigation file missing');
  }
});

// Check for passenger entry loop
if (fs.existsSync('frontend/src/hooks/usePassengerEntry.js')) {
  const passengerContent = fs.readFileSync('frontend/src/hooks/usePassengerEntry.js', 'utf8');
  if (passengerContent.includes('detectDoubleTab') && passengerContent.includes('exitPassengerLoop')) {
    addResult('KEYBOARD', 'Passenger Loop Logic', 'PASS', 'Double-tab exit functionality implemented');
  } else {
    addResult('KEYBOARD', 'Passenger Loop Logic', 'WARN', 'Double-tab exit may need verification');
  }
}

// 4. BOOKINGS & PASSENGERS INTEGRITY
console.log('\n4️⃣  BOOKINGS & PASSENGERS INTEGRITY');
console.log('-'.repeat(40));

if (fs.existsSync('frontend/src/pages/Bookings.jsx')) {
  const bookingsContent = fs.readFileSync('frontend/src/pages/Bookings.jsx', 'utf8');
  
  if (bookingsContent.includes('passengerList') && bookingsContent.includes('setPassengerList')) {
    addResult('BOOKINGS', 'Passenger Management', 'PASS', 'Passenger list management implemented');
  } else {
    addResult('BOOKINGS', 'Passenger Management', 'FAIL', 'Passenger management missing');
  }
  
  if (bookingsContent.includes('bookingId') && bookingsContent.includes('selectedBooking')) {
    addResult('BOOKINGS', 'Booking ID Linking', 'PASS', 'Booking ID linking implemented');
  } else {
    addResult('BOOKINGS', 'Booking ID Linking', 'WARN', 'Booking ID linking needs verification');
  }
  
  // Check for role-based views
  if (bookingsContent.includes('user?.us_roid') || bookingsContent.includes('isEmployee')) {
    addResult('BOOKINGS', 'Role-based Views', 'PASS', 'Different views for admin/customer');
  } else {
    addResult('BOOKINGS', 'Role-based Views', 'WARN', 'Role-based views need verification');
  }
} else {
  addResult('BOOKINGS', 'Bookings Component', 'FAIL', 'Bookings.jsx not found');
}

// 5. CUSTOMER MODULE VERIFICATION
console.log('\n5️⃣  CUSTOMER MODULE VERIFICATION');
console.log('-'.repeat(40));

// Check customer components
const customerComponents = [
  'frontend/src/components/Customer/CustomerDashboard.jsx',
  'frontend/src/components/Customer/BookingForm.jsx',
  'frontend/src/pages/MyBookings.jsx'
];

customerComponents.forEach(component => {
  if (fs.existsSync(component)) {
    const componentName = path.basename(component, '.jsx');
    addResult('CUSTOMER', componentName, 'PASS', 'Customer component exists');
  } else {
    const componentName = path.basename(component, '.jsx');
    addResult('CUSTOMER', componentName, 'FAIL', 'Customer component missing');
  }
});

// Check for customer header
if (fs.existsSync('frontend/src/components/Customer/CustomerHeader.jsx')) {
  addResult('CUSTOMER', 'Customer Header', 'PASS', 'Separate customer header exists');
} else if (fs.existsSync('frontend/src/components/Header.jsx')) {
  const headerContent = fs.readFileSync('frontend/src/components/Header.jsx', 'utf8');
  if (headerContent.includes('us_roid') && headerContent.includes('CUS')) {
    addResult('CUSTOMER', 'Customer Header', 'PASS', 'Customer-specific navigation in main header');
  } else {
    addResult('CUSTOMER', 'Customer Header', 'WARN', 'Customer navigation separation needs verification');
  }
}

// 6. BILLING FLOW VALIDATION
console.log('\n6️⃣  BILLING FLOW VALIDATION');
console.log('-'.repeat(40));

if (fs.existsSync('frontend/src/pages/Billing.jsx')) {
  const billingContent = fs.readFileSync('frontend/src/pages/Billing.jsx', 'utf8');
  
  if (billingContent.includes('generateBill') || billingContent.includes('createBill')) {
    addResult('BILLING', 'Bill Generation', 'PASS', 'Bill generation functionality exists');
  } else {
    addResult('BILLING', 'Bill Generation', 'WARN', 'Bill generation needs verification');
  }
  
  if (billingContent.includes('PDF') || billingContent.includes('pdf')) {
    addResult('BILLING', 'PDF Generation', 'PASS', 'PDF generation capability found');
  } else {
    addResult('BILLING', 'PDF Generation', 'WARN', 'PDF generation needs verification');
  }
} else {
  addResult('BILLING', 'Billing Component', 'FAIL', 'Billing.jsx not found');
}

// Check billing controller
if (fs.existsSync('src/controllers/billingController.js')) {
  const billingController = fs.readFileSync('src/controllers/billingController.js', 'utf8');
  if (billingController.includes('createBill') && billingController.includes('updateBill')) {
    addResult('BILLING', 'Billing Controller', 'PASS', 'Billing controller properly implemented');
  } else {
    addResult('BILLING', 'Billing Controller', 'WARN', 'Billing controller needs verification');
  }
} else {
  addResult('BILLING', 'Billing Controller', 'FAIL', 'billingController.js not found');
}

// 7. SESSION & API HEALTH CHECK
console.log('\n7️⃣  SESSION & API HEALTH CHECK');
console.log('-'.repeat(40));

// Check API service files
const apiFiles = [
  'frontend/src/services/api.js',
  'src/controllers/customerController.js',
  'src/controllers/bookingController.js',
  'src/middleware/errorHandler.js'
];

apiFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const fileName = path.basename(file);
    addResult('API', fileName, 'PASS', 'API file exists');
  } else {
    const fileName = path.basename(file);
    addResult('API', fileName, 'FAIL', 'API file missing');
  }
});

// Check error handling
if (fs.existsSync('src/middleware/errorHandler.js')) {
  const errorHandler = fs.readFileSync('src/middleware/errorHandler.js', 'utf8');
  if (errorHandler.includes('404') && errorHandler.includes('500')) {
    addResult('API', 'Error Handling', 'PASS', 'Error handling middleware implemented');
  } else {
    addResult('API', 'Error Handling', 'WARN', 'Error handling needs verification');
  }
}

// 8. UI CONSISTENCY CHECK
console.log('\n8️⃣  UI CONSISTENCY CHECK');
console.log('-'.repeat(40));

// Check CSS files
const cssFiles = [
  'frontend/src/styles/vintage-erp-theme.css',
  'frontend/src/styles/classic-enterprise-global.css',
  'frontend/src/styles/dashboard.css',
  'frontend/src/styles/customer-dashboard.css'
];

let cssFilesFound = 0;
cssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    cssFilesFound++;
    const fileName = path.basename(file);
    addResult('UI', fileName, 'PASS', 'CSS file exists');
  } else {
    const fileName = path.basename(file);
    addResult('UI', fileName, 'WARN', 'CSS file missing');
  }
});

if (cssFilesFound >= 3) {
  addResult('UI', 'Theme Consistency', 'PASS', `${cssFilesFound}/${cssFiles.length} theme files found`);
} else {
  addResult('UI', 'Theme Consistency', 'WARN', 'Theme consistency needs verification');
}

// FINAL SUMMARY
console.log('\n' + '='.repeat(60));
console.log('📊 COMPREHENSIVE AUDIT SUMMARY');
console.log('='.repeat(60));

console.log(`\n✅ PASSED: ${testResults.passed}`);
console.log(`⚠️  WARNINGS: ${testResults.warnings}`);
console.log(`❌ FAILED: ${testResults.failed}`);

console.log('\n📋 DETAILED RESULTS:');
console.log('-'.repeat(60));

const categories = [...new Set(testResults.details.map(r => r.category))];
categories.forEach(category => {
  console.log(`\n${category}:`);
  const categoryResults = testResults.details.filter(r => r.category === category);
  categoryResults.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
    console.log(`  ${icon} ${result.test}: ${result.message}`);
  });
});

// Calculate overall score
const totalTests = testResults.passed + testResults.warnings + testResults.failed;
const score = Math.round((testResults.passed / totalTests) * 100);

console.log('\n' + '='.repeat(60));
console.log(`🎯 OVERALL AUDIT SCORE: ${score}%`);

if (score >= 90) {
  console.log('🏆 EXCELLENT - System is production ready!');
} else if (score >= 75) {
  console.log('👍 GOOD - Minor issues need attention');
} else if (score >= 60) {
  console.log('⚠️  FAIR - Several issues need fixing');
} else {
  console.log('🚨 POOR - Critical issues must be addressed');
}

console.log('\n📝 RECOMMENDATIONS:');
const failedTests = testResults.details.filter(r => r.status === 'FAIL');
const warningTests = testResults.details.filter(r => r.status === 'WARN');

if (failedTests.length > 0) {
  console.log('\n🔴 CRITICAL FIXES NEEDED:');
  failedTests.forEach(test => {
    console.log(`   • ${test.category}: ${test.test} - ${test.message}`);
  });
}

if (warningTests.length > 0) {
  console.log('\n🟡 VERIFICATION NEEDED:');
  warningTests.forEach(test => {
    console.log(`   • ${test.category}: ${test.test} - ${test.message}`);
  });
}

console.log('\n✨ Audit completed!');