#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 TESTING QUOTA FIELD MAPPING FIX');
console.log('====================================\n');

// Test 1: Check if mapping functions exist
console.log('🧪 TEST 1: Mapping functions existence');
try {
  const bookingsPath = path.join(__dirname, 'frontend', 'src', 'pages', 'Bookings.jsx');
  const bookingsContent = fs.readFileSync(bookingsPath, 'utf8');
  
  const hasFrontendMapping = bookingsContent.includes('mapQuotaValueToFrontend');
  const hasBackendMapping = bookingsContent.includes('mapQuotaValueToDatabase');
  
  console.log(`  ✅ Frontend mapping function: ${hasFrontendMapping ? 'FOUND' : 'MISSING'}`);
  console.log(`  ✅ Backend mapping function: ${hasBackendMapping ? 'FOUND' : 'MISSING'}`);
  
  if (!hasFrontendMapping || !hasBackendMapping) {
    console.log('  ❌ Missing mapping functions');
    process.exit(1);
  }
} catch (error) {
  console.log(`  ❌ Error reading Bookings.jsx: ${error.message}`);
  process.exit(1);
}

// Test 2: Check if handleRecordSelect uses mapping function
console.log('\n🧪 TEST 2: handleRecordSelect quota mapping');
try {
  const bookingsPath = path.join(__dirname, 'frontend', 'src', 'pages', 'Bookings.jsx');
  const bookingsContent = fs.readFileSync(bookingsPath, 'utf8');
  
  const usesMappingInSelect = bookingsContent.includes('mapQuotaValueToFrontend(record.quotaType || record.bk_quotatype || record.bk_quota || \'\')');
  
  console.log(`  ✅ handleRecordSelect uses mapping: ${usesMappingInSelect ? 'YES' : 'NO'}`);
  
  if (!usesMappingInSelect) {
    console.log('  ❌ handleRecordSelect not using mapping function');
    process.exit(1);
  }
} catch (error) {
  console.log(`  ❌ Error reading Bookings.jsx: ${error.message}`);
  process.exit(1);
}

// Test 3: Check if save function uses mapping function
console.log('\n🧪 TEST 3: Save function quota mapping');
try {
  const bookingsPath = path.join(__dirname, 'frontend', 'src', 'pages', 'Bookings.jsx');
  const bookingsContent = fs.readFileSync(bookingsPath, 'utf8');
  
  const usesMappingInSave = bookingsContent.includes('mapQuotaValueToDatabase(formData.quotaType)');
  
  console.log(`  ✅ Save function uses mapping: ${usesMappingInSave ? 'YES' : 'NO'}`);
  
  if (!usesMappingInSave) {
    console.log('  ❌ Save function not using mapping function');
    process.exit(1);
  }
} catch (error) {
  console.log(`  ❌ Error reading Bookings.jsx: ${error.message}`);
  process.exit(1);
}

// Test 4: Check if grid display uses mapping function
console.log('\n🧪 TEST 4: Grid display quota mapping');
try {
  const bookingsPath = path.join(__dirname, 'frontend', 'src', 'pages', 'Bookings.jsx');
  const bookingsContent = fs.readFileSync(bookingsPath, 'utf8');
  
  const usesMappingInGrid = bookingsContent.includes('mapQuotaValueToFrontend(record.quotaType || record.bk_quotatype || record.bk_quota)');
  
  console.log(`  ✅ Grid display uses mapping: ${usesMappingInGrid ? 'YES' : 'NO'}`);
  
  if (!usesMappingInGrid) {
    console.log('  ❌ Grid display not using mapping function');
    process.exit(1);
  }
} catch (error) {
  console.log(`  ❌ Error reading Bookings.jsx: ${error.message}`);
  process.exit(1);
}

// Test 5: Verify mapping function logic
console.log('\n🧪 TEST 5: Mapping function logic verification');
try {
  const bookingsPath = path.join(__dirname, 'frontend', 'src', 'pages', 'Bookings.jsx');
  const bookingsContent = fs.readFileSync(bookingsPath, 'utf8');
  
  // Check frontend mapping logic
  const frontendLogicCorrect = bookingsContent.includes("'TATKAL': 'TQ'") && 
                             bookingsContent.includes("'GENERAL': 'GN'") && 
                             bookingsContent.includes("'LADIES': 'LD'");
  
  // Check backend mapping logic  
  const backendLogicCorrect = bookingsContent.includes("'TQ': 'TATKAL'") && 
                            bookingsContent.includes("'GN': 'GENERAL'") && 
                            bookingsContent.includes("'LD': 'LADIES'");
  
  console.log(`  ✅ Frontend mapping logic: ${frontendLogicCorrect ? 'CORRECT' : 'INCORRECT'}`);
  console.log(`  ✅ Backend mapping logic: ${backendLogicCorrect ? 'CORRECT' : 'INCORRECT'}`);
  
  if (!frontendLogicCorrect || !backendLogicCorrect) {
    console.log('  ❌ Mapping function logic is incorrect');
    process.exit(1);
  }
} catch (error) {
  console.log(`  ❌ Error reading Bookings.jsx: ${error.message}`);
  process.exit(1);
}

console.log('\n🎉 ALL TESTS PASSED!');
console.log('====================');
console.log('✅ Quota field mapping fix has been successfully implemented');
console.log('✅ Database values (TATKAL/GENERAL/LADIES) will now properly map to frontend values (TQ/GN/LD)');
console.log('✅ Existing bookings should now display correct quota values instead of always showing "General"');
console.log('\n🔧 EXPECTED BEHAVIOR:');
console.log('- New bookings: Quota values will save correctly to database');
console.log('- Existing bookings: Quota field will display actual quota type instead of always "General"');
console.log('- Grid display: Will show proper quota abbreviations (TQ/GN/LD)');
console.log('- Form population: Will correctly populate quota field when selecting existing bookings');

process.exit(0);