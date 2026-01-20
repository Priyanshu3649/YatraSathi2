const jwt = require('jsonwebtoken');
const models = require('../src/models');
const { User, UserTVL, Role, RoleTVL, BookingTVL } = models;

// Mock database methods
const originalUserFindByPk = User.findByPk;
const originalUserTVLFindByPk = UserTVL.findByPk;
const originalRoleFindByPk = Role.findByPk;
const originalRoleTVLFindByPk = RoleTVL.findByPk;
const originalBookingTVLFindByPk = BookingTVL.findByPk;

// Helper to reset mocks
const resetMocks = () => {
  User.findByPk = originalUserFindByPk;
  UserTVL.findByPk = originalUserTVLFindByPk;
  Role.findByPk = originalRoleFindByPk;
  RoleTVL.findByPk = originalRoleTVLFindByPk;
  BookingTVL.findByPk = originalBookingTVLFindByPk;
};

// Mock response object
const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

// Tests
const runTests = async () => {
  console.log('Running Middleware Tests...');
  const authMiddleware = require('../src/middleware/authMiddleware');
  const { canEditBooking } = require('../src/middleware/bookingAuthorization');

  try {
    // --- Test authMiddleware ---
    console.log('\nTesting authMiddleware...');

    // Test 1: TVL User
    console.log('Test 1: TVL User Authentication');
    const tvlToken = jwt.sign({ id: 'ADM001' }, process.env.JWT_SECRET || 'default_secret');
    const req1 = {
      header: () => `Bearer ${tvlToken}`
    };
    const res1 = mockRes();
    
    // Mock UserTVL found
    UserTVL.findByPk = async (id) => {
      if (id === 'ADM001') return { 
        us_usid: 'ADM001', 
        us_roid: 'ADM', 
        us_usertype: 'admin',
        toJSON: () => ({ us_usid: 'ADM001' }) 
      };
      return null;
    };
    
    // Mock RoleTVL found
    RoleTVL.findByPk = async (id) => {
      if (id === 'ADM') return { fn_fnid: 'ADM', fn_fnshort: 'Admin' };
      return null;
    };

    await authMiddleware(req1, res1, () => {
      console.log('  PASS: Next called');
      if (req1.user && req1.user.us_usid === 'ADM001' && req1.user.role.fn_fnshort === 'Admin') {
        console.log('  PASS: User and Role attached correctly');
      } else {
        console.error('  FAIL: User or Role not attached correctly', req1.user);
      }
    });

    // --- Test bookingAuthorization ---
    console.log('\nTesting bookingAuthorization...');

    // Test 2: Customer editing own DRAFT booking
    console.log('Test 2: Customer editing own DRAFT booking');
    const req2 = {
      params: { id: 'BK001' },
      user: { us_usid: 'CUS001', us_roid: 'CUS' }
    };
    const res2 = mockRes();

    // Mock BookingTVL found
    BookingTVL.findByPk = async (id) => {
      if (id === 'BK001') return { bk_bkid: 'BK001', bk_usid: 'CUS001', bk_status: 'DRAFT' };
      return null;
    };

    await canEditBooking(req2, res2, () => {
      console.log('  PASS: Next called for valid customer edit');
    });

    // Test 3: Customer editing someone else's booking
    console.log('Test 3: Customer editing other booking');
    const req3 = {
      params: { id: 'BK001' },
      user: { us_usid: 'CUS002', us_roid: 'CUS' }
    };
    const res3 = mockRes();

    await canEditBooking(req3, res3, () => {
      console.error('  FAIL: Next called for invalid customer edit');
    });
    
    if (res3.statusCode === 403) {
      console.log('  PASS: Access denied (403) as expected');
    } else {
      console.error('  FAIL: Unexpected status code:', res3.statusCode);
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    resetMocks();
    // Force exit because Sequelize keeps connection open
    process.exit(0);
  }
};

runTests();
