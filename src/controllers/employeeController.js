const { User, Employee, Booking, CorporateCustomer, Sequelize } = require('../models');

// Get all employees (admin only)
const getAllEmployees = async (req, res) => {
  try {
    // Only admin can get all employees
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const employees = await User.findAll({ 
      where: { us_usertype: 'employee' },
      include: [{
        model: Employee,
        required: false
      }],
      order: [['edtm', 'DESC']]
    });
    
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee by ID (admin only)
const getEmployeeById = async (req, res) => {
  try {
    // Only admin can get employee details
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const employee = await User.findByPk(req.params.id, {
      include: [{
        model: Employee,
        required: false
      }]
    });
    
    if (!employee || employee.us_usertype !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create employee (admin only)
const createEmployee = async (req, res) => {
  try {
    // Only admin can create employees
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const {
      name,
      email,
      phone,
      password,
      department,
      designation,
      aadhaarNumber,
      salary,
      joinDate,
      address,
      city,
      state,
      pincode
    } = req.body;
    
    // Check if employee already exists
    const existingEmployee = await User.findOne({ 
      where: {
        [Sequelize.Op.or]: [
          { us_email: email },
          { us_phone: phone },
          { us_aadhaar: aadhaarNumber }
        ]
      }
    });
    
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email, phone, or aadhaar already exists' });
    }
    
    // Generate unique employee ID and employee number
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const employeeId = `EMP${timestamp}`;
    const employeeNumber = `E${Math.floor(1000 + Math.random() * 9000)}${timestamp.slice(-3)}`; // E + 4 digit number + 3 digits from timestamp
    
    // Create new user
    const user = await User.create({
      us_usid: employeeId,
      us_fname: name,
      us_email: email,
      us_phone: phone,
      us_aadhaar: aadhaarNumber,
      us_usertype: 'employee',
      us_active: 1,
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    
    // Create employee record
    const employee = await Employee.create({
      em_usid: employeeId,
      em_empno: employeeNumber,
      em_designation: designation,
      em_dept: department,
      em_salary: salary,
      em_joindt: joinDate ? new Date(joinDate) : new Date(),
      em_status: 'ACTIVE',
      em_address: address,
      em_city: city,
      em_state: state,
      em_pincode: pincode,
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    
    res.status(201).json({
      user,
      employee
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update employee (admin only)
const updateEmployee = async (req, res) => {
  try {
    // Only admin can update employees
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findByPk(req.params.id);
    
    if (!user || user.us_usertype !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Find employee record
    const employee = await Employee.findOne({ where: { em_usid: req.params.id } });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee record not found' });
    }
    
    const {
      name,
      email,
      phone,
      department,
      designation,
      aadhaarNumber,
      salary,
      joinDate,
      status,
      address,
      city,
      state,
      pincode,
      isActive
    } = req.body;
    
    // Update user fields if provided
    if (name) user.us_fname = name;
    if (email) user.us_email = email;
    if (phone) user.us_phone = phone;
    if (aadhaarNumber) user.us_aadhaar = aadhaarNumber;
    if (isActive !== undefined) user.us_active = isActive ? 1 : 0;
    
    user.mby = req.user.us_usid;
    await user.save();
    
    // Update employee fields if provided
    if (designation) employee.em_designation = designation;
    if (department) employee.em_dept = department;
    if (salary !== undefined) employee.em_salary = salary;
    if (joinDate) employee.em_joindt = new Date(joinDate);
    if (status) employee.em_status = status;
    if (address) employee.em_address = address;
    if (city) employee.em_city = city;
    if (state) employee.em_state = state;
    if (pincode) employee.em_pincode = pincode;
    
    employee.mby = req.user.us_usid;
    await employee.save();
    
    res.json({
      user,
      employee
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete employee (admin only)
const deleteEmployee = async (req, res) => {
  try {
    // Only admin can delete employees
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findByPk(req.params.id);
    
    if (!user || user.us_usertype !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Delete employee record first
    await Employee.destroy({ where: { em_usid: req.params.id } });
    
    // Delete user
    await user.destroy();
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee's assigned bookings
const getEmployeeBookings = async (req, res) => {
  try {
    // Check if user is employee or admin
    if (req.user.us_usertype !== 'employee' && req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // If employee, they can only see their own bookings
    // If admin, they can see all bookings
    const query = req.user.us_usertype === 'employee' 
      ? { where: { bk_euid: req.user.us_usid } }
      : {};
    
    const bookings = await Booking.findAll({ 
      ...query,
      order: [['edtm', 'DESC']]
    });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get corporate customers (for relationship managers)
const getCorporateCustomers = async (req, res) => {
  try {
    // Check if user is employee (relationship manager) or admin
    if (req.user.us_usertype !== 'employee' && req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Relationship managers and admins can view corporate customers
    const corporateCustomers = await CorporateCustomer.findAll({
      include: [{
        model: User,
        attributes: ['us_fname', 'us_email', 'us_phone']
      }]
    });
    
    res.json(corporateCustomers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeBookings,
  getCorporateCustomers
};