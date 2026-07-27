const queryHelper = require('./src/utils/queryHelper');
const { Op } = require('sequelize');

const filterMap = {
  dateColumn: 'bk_trvldt',
  statusColumn: 'bk_status',
  searchColumns: ['bk_bkno', 'bk_customername', 'bk_phonenumber', 'bk_pnr'],
  customFilters: {
    fromStation: 'bk_fromst',
    toStation: 'bk_tost',
    travelClass: 'bk_class'
  }
};

const query = {};
const where = queryHelper.buildWhereClause(query, filterMap);
console.log('Generated Where Clause:', where);
