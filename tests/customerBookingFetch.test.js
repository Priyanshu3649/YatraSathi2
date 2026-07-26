const { getCustomerBookings } = require('../src/controllers/bookingController');
const { BookingTVL, PassengerTVL: Passenger, StationTVL: Station } = require('../src/models');
const { Sequelize } = require('sequelize');

// Mock Sequelize and models
jest.mock('../src/models', () => {
  return {
    BookingTVL: {
      findAndCountAll: jest.fn()
    },
    PassengerTVL: {
      findAll: jest.fn()
    },
    StationTVL: {
      findAll: jest.fn()
    }
  };
});

describe('Customer Booking Fetch Workflow Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Express Request
    req = {
      user: {
        us_usid: 'CUS001',
        us_roid: 'CUS',
        us_usertype: 'customer'
      },
      query: {
        page: 1,
        limit: 10
      }
    };

    // Mock Express Response
    res = {
      statusCode: 200,
      status: jest.fn().mockImplementation(function(code) {
        this.statusCode = code;
        return this;
      }),
      json: jest.fn().mockImplementation(function(data) {
        this.body = data;
        return this;
      })
    };
  });

  it('should successfully fetch bookings for authenticated customer and format stations/passengers', async () => {
    const mockBookings = [
      {
        bk_bkid: 101,
        bk_bkno: 'BK-260708-1055',
        bk_usid: 'CUS001',
        bk_fromst: 'NDLS',
        bk_tost: 'PNBE',
        bk_trvldt: '2026-08-15T00:00:00.000Z',
        bk_class: 'SL',
        bk_quota: 'GENERAL',
        bk_status: 'DRF',
        toJSON: function() {
          return {
            bk_bkid: this.bk_bkid,
            bk_bkno: this.bk_bkno,
            bk_usid: this.bk_usid,
            bk_fromst: this.bk_fromst,
            bk_tost: this.bk_tost,
            bk_trvldt: this.bk_trvldt,
            bk_class: this.bk_class,
            bk_quota: this.bk_quota,
            bk_status: this.bk_status
          };
        }
      }
    ];

    BookingTVL.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: mockBookings
    });

    Passenger.findAll.mockResolvedValue([
      {
        ps_bkid: 101,
        dataValues: { count: 2 }
      }
    ]);

    Station.findAll.mockResolvedValue([
      { st_stcode: 'NDLS', st_stname: 'New Delhi' },
      { st_stcode: 'PNBE', st_stname: 'Patna Junction' }
    ]);

    await getCustomerBookings(req, res);

    expect(BookingTVL.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          bk_usid: 'CUS001',
          bk_status: { [Sequelize.Op.ne]: 'INA' }
        }
      })
    );

    expect(res.json).toHaveBeenCalled();
    const responseBody = res.body;
    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toHaveLength(1);
    expect(responseBody.data[0].bk_bkid).toBe(101);
    expect(responseBody.data[0].bk_from).toBe('New Delhi');
    expect(responseBody.data[0].bk_to).toBe('Patna Junction');
    expect(responseBody.data[0].bk_pax).toBe(2);
  });

  it('should gracefully handle empty bookings list', async () => {
    BookingTVL.findAndCountAll.mockResolvedValue({
      count: 0,
      rows: []
    });

    Passenger.findAll.mockResolvedValue([]);
    Station.findAll.mockResolvedValue([]);

    await getCustomerBookings(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('should handle database errors and log them appropriately', async () => {
    const dbError = new Error('Database connection failed');
    BookingTVL.findAndCountAll.mockRejectedValue(dbError);

    // Spy on console.error to avoid cluttered test outputs
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getCustomerBookings(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'SERVER_ERROR',
          message: 'Database connection failed'
        })
      })
    );

    consoleErrorSpy.mockRestore();
  });
});
