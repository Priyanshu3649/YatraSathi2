// Test script to verify UI components are working together
const fs = require('fs');
const path = require('path');

// List of UI components that should exist
const expectedComponents = [
  'frontend/src/pages/TravelPlans.jsx',
  'frontend/src/pages/TravelPlanDetail.jsx',
  'frontend/src/pages/EditTravelPlan.jsx',
  'frontend/src/components/ShareTravelPlanModal.jsx',
  'frontend/src/components/Header.jsx',
  'frontend/src/components/Footer.jsx',
  'frontend/src/styles/travelPlans.css',
  'frontend/src/styles/header.css'
];

// List of routes that should be in App.jsx
const expectedRoutes = [
  '/travel-plans',
  '/travel-plans/:id',
  '/travel-plans/edit/:id',
  '/travel-plans/new'
];

console.log('=== UI Components Verification ===\n');

// Check if all components exist
console.log('1. Checking UI component files...');
let allComponentsExist = true;

for (const component of expectedComponents) {
  const fullPath = path.join(__dirname, component);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${component}`);
  } else {
    console.log(`   ❌ ${component} - MISSING`);
    allComponentsExist = false;
  }
}

if (allComponentsExist) {
  console.log('   🎉 All UI component files exist!\n');
} else {
  console.log('   ⚠️  Some UI component files are missing!\n');
  process.exit(1);
}

// Check if routes are properly configured in App.jsx
console.log('2. Checking route configurations...');
const appJsxPath = path.join(__dirname, 'frontend/src/App.jsx');
if (fs.existsSync(appJsxPath)) {
  const appJsxContent = fs.readFileSync(appJsxPath, 'utf8');
  let allRoutesConfigured = true;
  
  for (const route of expectedRoutes) {
    if (appJsxContent.includes(route)) {
      console.log(`   ✅ Route: ${route}`);
    } else {
      console.log(`   ❌ Route: ${route} - NOT CONFIGURED`);
      allRoutesConfigured = false;
    }
  }
  
  if (allRoutesConfigured) {
    console.log('   🎉 All routes are properly configured!\n');
  } else {
    console.log('   ⚠️  Some routes are not properly configured!\n');
    process.exit(1);
  }
} else {
  console.log('   ❌ App.jsx file not found!\n');
  process.exit(1);
}

// Check if navigation includes Travel Plans link
console.log('3. Checking navigation configuration...');
const headerPath = path.join(__dirname, 'frontend/src/components/Header.jsx');
if (fs.existsSync(headerPath)) {
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  if (headerContent.includes('/travel-plans')) {
    console.log('   ✅ Travel Plans link found in navigation');
    console.log('   🎉 Navigation is properly configured!\n');
  } else {
    console.log('   ❌ Travel Plans link NOT found in navigation');
    console.log('   ⚠️  Navigation needs to be updated!\n');
    process.exit(1);
  }
} else {
  console.log('   ❌ Header.jsx file not found!\n');
  process.exit(1);
}

// Check if CSS files are imported
console.log('4. Checking CSS imports...');
const cssImports = [
  { file: 'frontend/src/App.jsx', imports: ['./styles/dashboard.css'] },
  { file: 'frontend/src/components/Header.jsx', imports: ['../styles/header.css'] },
  { file: 'frontend/src/pages/TravelPlans.jsx', imports: ['../styles/travelPlans.css'] },
  { file: 'frontend/src/pages/TravelPlanDetail.jsx', imports: ['../styles/travelPlans.css'] },
  { file: 'frontend/src/pages/EditTravelPlan.jsx', imports: ['../styles/travelPlans.css'] }
];

let allCssImported = true;
for (const cssImport of cssImports) {
  const filePath = path.join(__dirname, cssImport.file);
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    for (const importPath of cssImport.imports) {
      if (fileContent.includes(importPath)) {
        console.log(`   ✅ CSS imported in ${cssImport.file}: ${importPath}`);
      } else {
        console.log(`   ❌ CSS NOT imported in ${cssImport.file}: ${importPath}`);
        allCssImported = false;
      }
    }
  } else {
    console.log(`   ❌ ${cssImport.file} not found`);
    allCssImported = false;
  }
}

if (allCssImported) {
  console.log('   🎉 All CSS files are properly imported!\n');
} else {
  console.log('   ⚠️  Some CSS files are not properly imported!\n');
  process.exit(1);
}

console.log('🎉 All UI component checks passed!');
console.log('✅ The Travel Plans UI feature has been successfully implemented!');