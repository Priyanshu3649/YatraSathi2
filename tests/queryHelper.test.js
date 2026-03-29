const queryHelper = require('../src/utils/queryHelper');
const { Op } = require('sequelize');

describe('QueryHelper', () => {
  describe('buildWhereClause', () => {
    it('should build date range filter', () => {
      const query = { startDate: '2023-01-01', endDate: '2023-01-31' };
      const filterMap = { dateColumn: 'created_at' };
      const where = queryHelper.buildWhereClause(query, filterMap);
      
      expect(where.created_at).toBeDefined();
      expect(where.created_at[Op.between]).toBeDefined();
    });

    it('should build amount range filter', () => {
      const query = { minAmount: '100', maxAmount: '500' };
      const filterMap = { amountColumn: 'total' };
      const where = queryHelper.buildWhereClause(query, filterMap);
      
      expect(where.total).toBeDefined();
      expect(where.total[Op.between]).toEqual([100, 500]);
    });

    it('should build search filter', () => {
      const query = { search: 'test' };
      const filterMap = { searchColumns: ['name', 'phone'] };
      const where = queryHelper.buildWhereClause(query, filterMap);
      
      expect(where[Op.or]).toHaveLength(2);
      expect(where[Op.or][0].name[Op.like]).toBe('%test%');
    });
  });

  describe('getPaginationOptions', () => {
    it('should return correct limit and offset', () => {
      const query = { page: '2', limit: '10' };
      const options = queryHelper.getPaginationOptions(query);
      
      expect(options.limit).toBe(10);
      expect(options.offset).toBe(10);
    });
  });

  describe('convertToCSV', () => {
    it('should convert data to CSV string', () => {
      const data = [{ id: 1, name: 'John' }, { id: 2, name: 'Doe' }];
      const columns = [{ label: 'ID', key: 'id' }, { label: 'Name', key: 'name' }];
      const csv = queryHelper.convertToCSV(data, columns);
      
      expect(csv).toContain('ID,Name');
      expect(csv).toContain('1,John');
      expect(csv).toContain('2,Doe');
    });
  });
});
