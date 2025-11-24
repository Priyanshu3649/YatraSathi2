const ApplicationTVL = require('./src/models/ApplicationTVL');
const ModuleTVL = require('./src/models/ModuleTVL');
const RoleTVL = require('./src/models/RoleTVL');
const PermissionTVL = require('./src/models/PermissionTVL');
const UserTVL = require('./src/models/UserTVL');
const { connectDB } = require('./config/db');

async function testSecurityData() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('\n=== Testing Security Module Data ===\n');
    
    // Test Applications
    console.log('1. Testing Applications (apXapplication):');
    const apps = await ApplicationTVL.findAll({ raw: true });
    console.log(`   Found ${apps.length} applications`);
    if (apps.length > 0) {
      console.log('   Sample:', apps[0]);
    }
    
    // Test Modules
    console.log('\n2. Testing Modules (moXmodule):');
    const modules = await ModuleTVL.findAll({ raw: true });
    console.log(`   Found ${modules.length} modules`);
    if (modules.length > 0) {
      console.log('   Sample:', modules[0]);
    }
    
    // Test Roles
    console.log('\n3. Testing Roles (fnXfunction):');
    const roles = await RoleTVL.findAll({ raw: true });
    console.log(`   Found ${roles.length} roles`);
    if (roles.length > 0) {
      console.log('   Sample:', roles[0]);
    }
    
    // Test Permissions/Operations
    console.log('\n4. Testing Operations (opXoperation):');
    const operations = await PermissionTVL.findAll({ raw: true });
    console.log(`   Found ${operations.length} operations`);
    if (operations.length > 0) {
      console.log('   Sample:', operations[0]);
    }
    
    // Test Users
    console.log('\n5. Testing Users (usXuser):');
    const users = await UserTVL.findAll({ raw: true });
    console.log(`   Found ${users.length} users`);
    if (users.length > 0) {
      console.log('   Sample:', users[0]);
    }
    
    console.log('\n=== Summary ===');
    console.log(`Applications: ${apps.length}`);
    console.log(`Modules: ${modules.length}`);
    console.log(`Roles: ${roles.length}`);
    console.log(`Operations: ${operations.length}`);
    console.log(`Users: ${users.length}`);
    
    if (apps.length === 0 && modules.length === 0 && roles.length === 0 && operations.length === 0) {
      console.log('\n⚠️  WARNING: No data found in any security tables!');
      console.log('The tables exist but are empty. You need to seed data.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing security data:', error);
    process.exit(1);
  }
}

testSecurityData();
