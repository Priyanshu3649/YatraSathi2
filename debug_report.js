const ReportEngineService = require('./src/services/reportEngineService');

async function debug() {
  try {
    console.log('Testing Billing Report...');
    const result = await ReportEngineService.generateReport({
      module: 'billing',
      filters: {
        startDate: '2020-01-01',
        endDate: '2026-12-31',
        status: 'OPEN'
      },
      groupBy: [],
      metrics: ['SUM:amount']
    });
    console.log('Success!', JSON.stringify(result, null, 2).substring(0, 500) + '...');
  } catch (error) {
    console.error('FAILED WITH ERROR:');
    console.error(error);
  }
}

debug();
