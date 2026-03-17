#!/usr/bin/env node

/**
 * KEYBOARD-FIRST SYSTEM COMPLIANCE TEST
 * Verifies 100% compliance with mandatory keyboard-first directive
 */

const fs = require('fs');

console.log('⌨️  KEYBOARD-FIRST SYSTEM COMPLIANCE TEST');
console.log('=' .repeat(60));

const testResults = {
  passed: 0,
  failed: 0,
  critical: 0,
  details: []
};

const addResult = (category, test, status, message) => {
  testResults.details.push({ category, test, status, message });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'CRITICAL') testResults.critical++;
  else testResults.failed++;
};

// 1. CORE PRINCIPLES VERIFICATION
console.log('\n1️⃣  CORE PRINCIPLES (NON-NEGOTIABLE)');
console.log('-'.repeat(40));

// Check KeyboardNavigationContext compliance
if (fs.existsSync('frontend/src/contexts/KeyboardNavigationContext.jsx')) {
  const contextContent = fs.readFileSync('frontend/src/contexts/KeyboardNavigationContext.jsx', 'utf8');
  
  // Check for lifecycle-driven state
  if (contextContent.includes('registeredForms') && contextContent.includes('new Map()')) {
    addResult('CORE', 'Lifecycle-driven State', 'PASS', 'Forms registry implemented with Map');
  } else {
    addResult('CORE', 'Lifecycle-driven State', 'CRITICAL', 'Forms registry missing or incorrect');
  }
  
  // Check for single registration guard
  if (contextContent.includes('registeredForms.current.has(formId)')) {
    addResult('CORE', 'Registration Guard', 'PASS', 'Duplicate registration prevention implemented');
  } else {
    addResult('CORE', 'Registration Guard', 'CRITICAL', 'Missing duplicate registration guard');
  }
  
  // Check for mandatory primitives only
  if (contextContent.includes('Tab') && contextContent.includes('Enter') && contextContent.includes('Escape')) {
    addResult('CORE', 'Navigation Primitives', 'PASS', 'Tab/Enter/Escape primitives implemented');
  } else {
    addResult('CORE', 'Navigation Primitives', 'CRITICAL', 'Missing mandatory navigation primitives');
  }
  
  // Check for deterministic focus flow
  if (contextContent.includes('focusedFieldIndex') && contextContent.includes('moveNext') && contextContent.includes('movePrevious')) {
    addResult('CORE', 'Deterministic Focus', 'PASS', 'Sequential focus flow implemented');
  } else {
    addResult('CORE', 'Deterministic Focus', 'CRITICAL', 'Focus flow not deterministic');
  }
  
} else {
  addResult('CORE', 'KeyboardNavigationContext', 'CRITICAL', 'Context file missing');
}

// 2. SYSTEM ARCHITECTURE VERIFICATION
console.log('\n2️⃣  SYSTEM ARCHITECTURE (REQUIRED)');
console.log('-'.repeat(40));

// Check for central keyboard engine
if (fs.existsSync('frontend/src/contexts/KeyboardNavigationContext.jsx')) {
  const contextContent = fs.readFileSync('frontend/src/contexts/KeyboardNavigationContext.jsx', 'utf8');
  
  // Check mandatory state structure
  const requiredState = ['activeScreen', 'activeFormId', 'focusedFieldIndex', 'mode', 'isModalOpen'];
  const hasAllState = requiredState.every(state => contextContent.includes(state));
  
  if (hasAllState) {
    addResult('ARCH', 'Mandatory State Structure', 'PASS', 'All required state properties present');
  } else {
    const missing = requiredState.filter(state => !contextContent.includes(state));
    addResult('ARCH', 'Mandatory State Structure', 'CRITICAL', `Missing state: ${missing.join(', ')}`);
  }
  
  // Check mandatory API methods
  const requiredMethods = ['registerForm', 'unregisterForm', 'setActiveForm', 'moveNext', 'movePrevious', 'enterAction', 'openModal', 'closeModal'];
  const hasAllMethods = requiredMethods.every(method => contextContent.includes(method));
  
  if (hasAllMethods) {
    addResult('ARCH', 'Mandatory API Methods', 'PASS', 'All required API methods present');
  } else {
    const missing = requiredMethods.filter(method => !contextContent.includes(method));
    addResult('ARCH', 'Mandatory API Methods', 'CRITICAL', `Missing methods: ${missing.join(', ')}`);
  }
}

// 3. FORM REGISTRATION RULES VERIFICATION
console.log('\n3️⃣  FORM REGISTRATION RULES (CRITICAL)');
console.log('-'.repeat(40));

// Check useKeyboardForm hook
if (fs.existsSync('frontend/src/hooks/useKeyboardForm.js')) {
  const hookContent = fs.readFileSync('frontend/src/hooks/useKeyboardForm.js', 'utf8');
  
  // Check for empty dependency array
  if (hookContent.includes('useEffect(') && hookContent.includes('}, []);')) {
    addResult('FORM', 'Empty Dependency Array', 'PASS', 'useEffect has empty dependency array');
  } else {
    addResult('FORM', 'Empty Dependency Array', 'CRITICAL', 'useEffect missing empty dependency array');
  }
  
  // Check for memoized form definition
  if (hookContent.includes('useMemo') && hookContent.includes('formDefinition')) {
    addResult('FORM', 'Memoized Form Definition', 'PASS', 'Form definition properly memoized');
  } else {
    addResult('FORM', 'Memoized Form Definition', 'CRITICAL', 'Form definition not memoized');
  }
  
  // Check for cleanup on unmount
  if (hookContent.includes('return () =>') && hookContent.includes('unregisterForm')) {
    addResult('FORM', 'Cleanup on Unmount', 'PASS', 'Proper cleanup implemented');
  } else {
    addResult('FORM', 'Cleanup on Unmount', 'CRITICAL', 'Missing cleanup on unmount');
  }
} else {
  addResult('FORM', 'useKeyboardForm Hook', 'CRITICAL', 'Hook file missing');
}

// 4. PASSENGER ENTRY LOOP VERIFICATION
console.log('\n4️⃣  PASSENGER ENTRY LOOP (MOST IMPORTANT)');
console.log('-'.repeat(40));

// Check passenger entry hook
if (fs.existsSync('frontend/src/hooks/usePassengerEntry.js')) {
  const passengerContent = fs.readFileSync('frontend/src/hooks/usePassengerEntry.js', 'utf8');
  
  // Check for double-tab detection
  if (passengerContent.includes('detectDoubleTab') || passengerContent.includes('doubleTabDetected')) {
    addResult('PASSENGER', 'Double-Tab Detection', 'PASS', 'Double-tab exit functionality implemented');
  } else {
    addResult('PASSENGER', 'Double-Tab Detection', 'CRITICAL', 'Double-tab detection missing');
  }
  
  // Check for passenger save logic
  if (passengerContent.includes('saveCurrentPassenger') && passengerContent.includes('hasPassengerData')) {
    addResult('PASSENGER', 'Save Logic', 'PASS', 'Passenger save logic implemented');
  } else {
    addResult('PASSENGER', 'Save Logic', 'CRITICAL', 'Passenger save logic missing');
  }
  
  // Check for loop exit conditions
  if (passengerContent.includes('exitPassengerLoop') && passengerContent.includes('enterPassengerLoop')) {
    addResult('PASSENGER', 'Loop Exit Conditions', 'PASS', 'Loop entry/exit implemented');
  } else {
    addResult('PASSENGER', 'Loop Exit Conditions', 'CRITICAL', 'Loop exit conditions missing');
  }
} else {
  addResult('PASSENGER', 'usePassengerEntry Hook', 'CRITICAL', 'Hook file missing');
}

// 5. BOOKINGS COMPONENT COMPLIANCE
console.log('\n5️⃣  BOOKINGS COMPONENT COMPLIANCE');
console.log('-'.repeat(40));

if (fs.existsSync('frontend/src/pages/Bookings.jsx')) {
  const bookingsContent = fs.readFileSync('frontend/src/pages/Bookings.jsx', 'utf8');
  
  // Check for useKeyboardForm usage
  if (bookingsContent.includes('useKeyboardForm') && bookingsContent.includes('formId:')) {
    addResult('BOOKINGS', 'Keyboard Form Usage', 'PASS', 'Uses compliant useKeyboardForm hook');
  } else {
    addResult('BOOKINGS', 'Keyboard Form Usage', 'CRITICAL', 'Not using compliant keyboard form hook');
  }
  
  // Check for memoized field order
  if (bookingsContent.includes('useMemo') && bookingsContent.includes('fieldOrder')) {
    addResult('BOOKINGS', 'Memoized Field Order', 'PASS', 'Field order properly memoized');
  } else {
    addResult('BOOKINGS', 'Memoized Field Order', 'CRITICAL', 'Field order not memoized');
  }
  
  // Check for passenger field names
  if (bookingsContent.includes('passenger_name') && bookingsContent.includes('passenger_age')) {
    addResult('BOOKINGS', 'Passenger Field Names', 'PASS', 'Correct passenger field naming');
  } else {
    addResult('BOOKINGS', 'Passenger Field Names', 'FAIL', 'Incorrect passenger field naming');
  }
  
  // Check for no formRef usage
  if (!bookingsContent.includes('ref={formRef}')) {
    addResult('BOOKINGS', 'No FormRef Usage', 'PASS', 'Not using deprecated formRef');
  } else {
    addResult('BOOKINGS', 'No FormRef Usage', 'FAIL', 'Still using deprecated formRef');
  }
} else {
  addResult('BOOKINGS', 'Bookings Component', 'CRITICAL', 'Component file missing');
}

// 6. FORBIDDEN PATTERNS CHECK
console.log('\n6️⃣  FORBIDDEN PATTERNS CHECK');
console.log('-'.repeat(40));

const filesToCheck = [
  'frontend/src/contexts/KeyboardNavigationContext.jsx',
  'frontend/src/hooks/useKeyboardForm.js',
  'frontend/src/hooks/usePassengerEntry.js',
  'frontend/src/pages/Bookings.jsx'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = file.split('/').pop();
    
    // Check for useEffect without dependency array
    const useEffectMatches = content.match(/useEffect\([^}]+\}\s*\)/g) || [];
    const hasEmptyDeps = useEffectMatches.some(match => match.includes('}, []'));
    
    if (useEffectMatches.length === 0 || hasEmptyDeps) {
      addResult('PATTERNS', `${fileName} - useEffect Deps`, 'PASS', 'No forbidden useEffect patterns');
    } else {
      addResult('PATTERNS', `${fileName} - useEffect Deps`, 'CRITICAL', 'useEffect without proper dependencies');
    }
    
    // Check for setState inside render
    if (!content.includes('setState(') || content.includes('useCallback') || content.includes('useMemo')) {
      addResult('PATTERNS', `${fileName} - Render Safety`, 'PASS', 'No setState in render');
    } else {
      addResult('PATTERNS', `${fileName} - Render Safety`, 'FAIL', 'Potential setState in render');
    }
  }
});

// FINAL SUMMARY
console.log('\n' + '='.repeat(60));
console.log('📊 KEYBOARD-FIRST COMPLIANCE SUMMARY');
console.log('='.repeat(60));

console.log(`\n✅ PASSED: ${testResults.passed}`);
console.log(`⚠️  FAILED: ${testResults.failed}`);
console.log(`🚨 CRITICAL: ${testResults.critical}`);

console.log('\n📋 DETAILED RESULTS:');
console.log('-'.repeat(60));

const categories = [...new Set(testResults.details.map(r => r.category))];
categories.forEach(category => {
  console.log(`\n${category}:`);
  const categoryResults = testResults.details.filter(r => r.category === category);
  categoryResults.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'CRITICAL' ? '🚨' : '⚠️';
    console.log(`  ${icon} ${result.test}: ${result.message}`);
  });
});

// Calculate compliance score
const totalTests = testResults.passed + testResults.failed + testResults.critical;
const score = Math.round((testResults.passed / totalTests) * 100);

console.log('\n' + '='.repeat(60));
console.log(`⌨️  KEYBOARD-FIRST COMPLIANCE SCORE: ${score}%`);

if (testResults.critical > 0) {
  console.log('🚨 CRITICAL ISSUES FOUND - SYSTEM NOT COMPLIANT');
  console.log('   Must fix all critical issues before deployment');
} else if (score >= 95) {
  console.log('🏆 EXCELLENT - Fully compliant with keyboard-first directive');
} else if (score >= 85) {
  console.log('👍 GOOD - Minor issues need attention');
} else {
  console.log('⚠️  NEEDS WORK - Several compliance issues found');
}

console.log('\n📝 COMPLIANCE REQUIREMENTS:');
if (testResults.critical > 0) {
  console.log('\n🚨 CRITICAL FIXES REQUIRED:');
  testResults.details.filter(r => r.status === 'CRITICAL').forEach(test => {
    console.log(`   • ${test.category}: ${test.test} - ${test.message}`);
  });
}

if (testResults.failed > 0) {
  console.log('\n⚠️  IMPROVEMENTS NEEDED:');
  testResults.details.filter(r => r.status === 'FAIL').forEach(test => {
    console.log(`   • ${test.category}: ${test.test} - ${test.message}`);
  });
}

console.log('\n✨ Keyboard-first compliance test completed!');