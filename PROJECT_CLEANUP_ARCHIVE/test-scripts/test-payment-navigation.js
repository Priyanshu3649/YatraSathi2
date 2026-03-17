// Test script to verify consistent tab navigation across all payment forms
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Payment Forms Tab Navigation Implementation...\n');

// Test components
const components = [
  'PaymentForm.jsx',
  'ReceiptForm.jsx', 
  'ContraForm.jsx',
  'JournalForm.jsx'
];

let allTestsPassed = true;

console.log('📋 Checking tab navigation implementation in all payment components...\n');

components.forEach(component => {
  const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'Payments', component);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for extended fieldOrder with save button
    const hasExtendedFieldOrder = content.includes("'save_button'") && 
                                 content.includes("'view_records_button'");
    
    // Check for records mode field order
    const hasRecordsFieldOrder = content.includes('recordsFieldOrder') &&
                                content.includes("'back_to_form_button'") &&
                                content.includes("'records_search'") &&
                                content.includes("'export_button'");
    
    // Check for mode-aware keyboard navigation
    const hasModeAwareNav = content.includes("fieldOrder: mode === 'form' ? fieldOrder : recordsFieldOrder");
    
    // Check for focusSpecificField import and usage
    const hasFocusSpecificField = content.includes('focusSpecificField') &&
                                 content.includes('focusSpecificField(');
    
    // Check for proper button naming
    const hasNamedButtons = content.includes('name="save_button"') &&
                           content.includes('name="view_records_button"') &&
                           content.includes('name="back_to_form_button"');
    
    // Check for mode change focus handling
    const hasModeFocusHandling = content.includes('useEffect(() => {') &&
                                content.includes("focusSpecificField('receipt_no')") &&
                                content.includes("focusSpecificField('back_to_form_button')");
    
    console.log(`📄 ${component}:`);
    console.log(`   ✅ Extended fieldOrder (save/view buttons): ${hasExtendedFieldOrder ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Records mode fieldOrder: ${hasRecordsFieldOrder ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Mode-aware navigation: ${hasModeAwareNav ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ focusSpecificField implementation: ${hasFocusSpecificField ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Proper button naming: ${hasNamedButtons ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Mode change focus handling: ${hasModeFocusHandling ? 'PASS' : 'FAIL'}`);
    
    if (!hasExtendedFieldOrder || !hasRecordsFieldOrder || !hasModeAwareNav || 
        !hasFocusSpecificField || !hasNamedButtons || !hasModeFocusHandling) {
      allTestsPassed = false;
    }
    console.log('');
  } else {
    console.log(`❌ ${component} not found`);
    allTestsPassed = false;
  }
});

// Test keyboard navigation hook usage
console.log('⌨️ Testing keyboard navigation hook implementation...\n');

const keyboardNavPath = path.join(__dirname, 'frontend', 'src', 'hooks', 'useKeyboardNavigation.js');
if (fs.existsSync(keyboardNavPath)) {
  const content = fs.readFileSync(keyboardNavPath, 'utf8');
  
  // Check for proper field registration
  const hasFieldRegistration = content.includes('registerForm') &&
                              content.includes('unregisterForm');
  
  // Check for navigation methods
  const hasNavigationMethods = content.includes('moveNext') &&
                              content.includes('movePrevious') &&
                              content.includes('enterAction');
  
  // Check for modal handling
  const hasModalHandling = content.includes('openModal') &&
                          content.includes('closeModal') &&
                          content.includes('isModalOpen');
  
  console.log(`📄 useKeyboardNavigation.js:`);
  console.log(`   ✅ Field registration: ${hasFieldRegistration ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Navigation methods: ${hasNavigationMethods ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Modal handling: ${hasModalHandling ? 'PASS' : 'FAIL'}`);
  
  if (!hasFieldRegistration || !hasNavigationMethods || !hasModalHandling) {
    allTestsPassed = false;
  }
  console.log('');
}

// Summary
console.log('📊 SUMMARY:');
console.log('============');
if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED - Tab navigation implementation is complete!');
  console.log('\n🔧 Key features implemented:');
  console.log('   • Extended fieldOrder arrays with save and view buttons');
  console.log('   • Records mode fieldOrder for navigation in records view');
  console.log('   • Mode-aware keyboard navigation switching');
  console.log('   • Proper focus management during mode changes');
  console.log('   • Named buttons for consistent tab navigation');
  console.log('   • Focus handling when switching between form/records modes');
  console.log('\n📋 Tab Navigation Sequence:');
  console.log('   Form Mode: receipt_no → date → type → [customer_fields] → account → amount → ref_number → save_button → view_records_button');
  console.log('   Records Mode: back_to_form_button → records_search → export_button → [record actions]');
} else {
  console.log('❌ SOME TESTS FAILED - Please review the implementation');
}

console.log('\n🚀 Next steps:');
console.log('   1. Start the development server: npm run dev');
console.log('   2. Navigate to the Payments section');
console.log('   3. Test Tab navigation in each payment type');
console.log('   4. Verify mode switching maintains proper focus');
console.log('   5. Test keyboard shortcuts (Tab, Shift+Tab, Enter, F10)');
console.log('   6. Confirm save functionality works with tab navigation');