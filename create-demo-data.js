#!/usr/bin/env node

const { createDemoData } = require('./src/scripts/demo-data-seed');
const { connectDB } = require('./config/db');

async function main() {
  try {
    console.log('🚀 Starting demo data creation...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully!\n');
    
    // Create demo data
    await createDemoData();
    
    console.log('\n🎉 Demo data creation completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Build frontend: cd frontend && npm run build');
    console.log('3. Visit: http://localhost:5003');
    console.log('4. Try different portals with the credentials above');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();