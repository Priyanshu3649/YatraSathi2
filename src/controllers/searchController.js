const { User, Booking, Payment, CorporateCustomer, Employee } = require('../models');
const { Op } = require('sequelize');

// Search across all entities
const searchAll = async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const searchResults = {};
    
    // Search users (admin only for all users, employees can search customers)
    if (!type || type === 'users') {
      let userQuery = {
        [Op.or]: [
          { us_fname: { [Op.like]: `%${query}%` } },
          { us_lname: { [Op.like]: `%${query}%` } },
          { us_email: { [Op.like]: `%${query}%` } },
          { us_phone: { [Op.like]: `%${query}%` } }
        ]
      };
      
      // Filter based on user permissions
      if (req.user.us_usertype === 'employee') {
        userQuery.us_usertype = 'customer';
      }
      
      const users = await User.findAll({
        where: userQuery,
        limit: 20
      });
      
      searchResults.users = users;
    }
    
    // Search bookings
    if (!type || type === 'bookings') {
      let bookingQuery = {
        [Op.or]: [
          { bk_origin: { [Op.like]: `%${query}%` } },
          { bk_destination: { [Op.like]: `%${query}%` } }
        ]
      };
      
      // Filter based on user permissions
      if (req.user.us_usertype === 'customer') {
        bookingQuery.bk_cuid = req.user.us_usid;
      } else if (req.user.us_usertype === 'employee') {
        bookingQuery.bk_euid = req.user.us_usid;
      }
      
      const bookings = await Booking.findAll({
        where: bookingQuery,
        limit: 20
      });
      
      searchResults.bookings = bookings;
    }
    
    // Search payments (accounts team and admin)
    if ((!type || type === 'payments') && 
        (req.user.us_usertype === 'admin' || req.user.us_usertype === 'employee')) {
      const paymentQuery = {
        [Op.or]: [
          { pt_transid: { [Op.like]: `%${query}%` } },
          { pt_remarks: { [Op.like]: `%${query}%` } }
        ]
      };
      
      const payments = await Payment.findAll({
        where: paymentQuery,
        limit: 20
      });
      
      searchResults.payments = payments;
    }
    
    // Search corporate customers (admin and relationship managers)
    if ((!type || type === 'corporate') && 
        (req.user.us_usertype === 'admin')) {
      const corporateQuery = {
        [Op.or]: [
          { cu_company: { [Op.like]: `%${query}%` } }
        ]
      };
      
      const corporateCustomers = await CorporateCustomer.findAll({
        where: corporateQuery,
        include: [{
          model: User,
          attributes: ['us_fname', 'us_lname', 'us_email', 'us_phone']
        }],
        limit: 20
      });
      
      searchResults.corporateCustomers = corporateCustomers;
    }
    
    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { query, userType, department } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    let searchQuery = {
      [Op.or]: [
        { us_fname: { [Op.like]: `%${query}%` } },
        { us_lname: { [Op.like]: `%${query}%` } },
        { us_email: { [Op.like]: `%${query}%` } },
        { us_phone: { [Op.like]: `%${query}%` } }
      ]
    };
    
    // Add filters
    if (userType) {
      searchQuery.us_usertype = userType;
    }
    
    // Filter based on user permissions
    if (req.user.us_usertype === 'employee') {
      searchQuery.us_usertype = 'customer';
    }
    
    const users = await User.findAll({
      where: searchQuery,
      limit: 50
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search bookings
const searchBookings = async (req, res) => {
  try {
    const { query, status, startDate, endDate } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    let searchQuery = {
      [Op.or]: [
        { bk_origin: { [Op.like]: `%${query}%` } },
        { bk_destination: { [Op.like]: `%${query}%` } }
      ]
    };
    
    // Add filters
    if (status) {
      searchQuery.bk_status = status;
    }
    
    // Add date range filter
    if (startDate || endDate) {
      searchQuery.bk_traveldate = {};
      if (startDate) {
        searchQuery.bk_traveldate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        searchQuery.bk_traveldate[Op.lte] = new Date(endDate);
      }
    }
    
    // Filter based on user permissions
    if (req.user.us_usertype === 'customer') {
      searchQuery.bk_cuid = req.user.us_usid;
    } else if (req.user.us_usertype === 'employee') {
      searchQuery.bk_euid = req.user.us_usid;
    }
    
    const bookings = await Booking.findAll({
      where: searchQuery,
      limit: 50
    });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search payments
const searchPayments = async (req, res) => {
  try {
    // Check permissions
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { query, mode, status, startDate, endDate } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    let searchQuery = {
      [Op.or]: [
        { pt_transid: { [Op.like]: `%${query}%` } },
        { pt_remarks: { [Op.like]: `%${query}%` } }
      ]
    };
    
    // Add filters
    if (mode) {
      searchQuery.pt_mode = mode;
    }
    
    if (status) {
      searchQuery.pt_status = status;
    }
    
    // Add date range filter
    if (startDate || endDate) {
      searchQuery.pt_paydt = {};
      if (startDate) {
        searchQuery.pt_paydt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        searchQuery.pt_paydt[Op.lte] = new Date(endDate);
      }
    }
    
    const payments = await Payment.findAll({
      where: searchQuery,
      limit: 50
    });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search customers specifically
const searchCustomers = async (req, res) => {
  try {
    const { query, customerType, status } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Only admin and employees can search customers
    if (req.user.us_usertype !== 'admin' && req.user.us_usertype !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Build search query for users with customer type
    let userSearchQuery = {
      us_usertype: 'customer',
      [Op.or]: [
        { us_fname: { [Op.like]: `%${query}%` } },
        { us_lname: { [Op.like]: `%${query}%` } },
        { us_email: { [Op.like]: `%${query}%` } },
        { us_phone: { [Op.like]: `%${query}%` } },
        { us_aadhaar: { [Op.like]: `%${query}%` } }
      ]
    };
    
    // Add filters
    if (status) {
      userSearchQuery.us_active = status === 'active' ? 1 : 0;
    }
    
    const users = await User.findAll({
      where: userSearchQuery,
      limit: 50
    });
    
    // If searching for corporate customers, also get corporate details
    let customersWithDetails = users;
    if (customerType === 'corporate') {
      const corporateDetails = await CorporateCustomer.findAll({
        where: {
          cu_usid: {
            [Op.in]: users.map(user => user.us_usid)
          }
        },
        include: [{
          model: User,
          attributes: ['us_fname', 'us_lname', 'us_email', 'us_phone']
        }]
      });
      
      // Merge user data with corporate details
      customersWithDetails = users.map(user => {
        const corpDetail = corporateDetails.find(cd => cd.cu_usid === user.us_usid);
        return {
          ...user.toJSON(),
          corporateDetails: corpDetail || null
        };
      });
    }
    
    res.json(customersWithDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search employees specifically
const searchEmployees = async (req, res) => {
  try {
    const { query, department, designation, status } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Only admin can search employees
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Build search query for users with employee type
    let userSearchQuery = {
      us_usertype: 'employee',
      [Op.or]: [
        { us_fname: { [Op.like]: `%${query}%` } },
        { us_lname: { [Op.like]: `%${query}%` } },
        { us_email: { [Op.like]: `%${query}%` } },
        { us_phone: { [Op.like]: `%${query}%` } }
      ]
    };
    
    // Get users first
    const users = await User.findAll({
      where: userSearchQuery,
      include: [{
        model: Employee,
        required: false
      }],
      limit: 50
    });
    
    // If we have department or employee status filters, we need to filter the results
    let filteredUsers = users;
    if (department || status) {
      filteredUsers = users.filter(user => {
        // Check department filter
        if (department && (!user.employee || user.employee.em_dept !== department)) {
          return false;
        }
        
        // Note: designation filter is no longer supported as the field was removed
        // The designation field has been removed from the employee table
        // This filter is now skipped to avoid errors
        
        // Check status filter
        if (status && (!user.employee || user.employee.em_status.toLowerCase() !== status.toLowerCase())) {
          return false;
        }
        
        return true;
      });
    }
    
    res.json(filteredUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchAll,
  searchUsers,
  searchBookings,
  searchPayments,
  searchCustomers,
  searchEmployees
};