
require('dotenv').config();
const { connectDB } = require('./config/db');
const { UserTVL, LoginTVL, CompanyTVL } = require('./src/models');

async function test() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected!');

    console.log('Testing models...');
    console.log('UserTVL:', !!UserTVL);
    console.log('LoginTVL:', !!LoginTVL);
    console.log('CompanyTVL:', !!CompanyTVL);

    console.log('Testing CompanyTVL findAll...');
    const companies = await CompanyTVL.findAll();
    console.log('Found companies:', companies.length);
    if (companies.length > 0) {
      console.log('First company:', companies[0].toJSON());
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

test();
