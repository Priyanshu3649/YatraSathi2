const { User, Employee, Customer, CorporateCustomer, Login, UserTVL, EmployeeTVL, CustomerTVL, LoginTVL } = require('../models');
const { Op } = require('sequelize');

// Get user-specific profile based on role
const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } 
      });
    }

    const user = req.user;
    
    // Determine the user type and fetch role-specific data
    let profileData = {
      id: user.us_usid,
      firstName: user.us_fname,
      lastName: user.us_lname,
      email: user.us_email,
      phone: user.us_phone,
      userType: user.us_usertype,
      roleId: user.us_roid,
      companyId: user.us_coid,
      isActive: user.us_active,
      createdAt: user.us_cdtm,
      updatedAt: user.us_mdtm,
      createdBy: user.us_eby,
      updatedBy: user.us_mby,
      address: user.us_addr1,
      city: user.us_city,
      state: user.us_state,
      pincode: user.us_pin,
      aadhaar: user.us_aadhaar,
      pan: user.us_pan
    };

    // Add role-specific data based on user type
    if (user.us_usertype === 'employee') {
      // Fetch employee-specific data
      let employee;
      
      try {
        // Try TVL first
        employee = await EmployeeTVL.findOne({ 
          where: { em_usid: user.us_usid }
        });
      } catch (tvLError) {
        console.log('TVL Employee model not available, trying regular model');
        try {
          // If TVL fails, try regular Employee table
          employee = await Employee.findOne({ 
            where: { em_usid: user.us_usid }
          });
        } catch (regularError) {
          console.log('Regular Employee model query failed:', regularError.message);
          employee = null;
        }
      }
      
      if (employee) {
        const empData = employee.toJSON();
        profileData = {
          ...profileData,
          photo: empData.em_photo || empData.us_photo || user.us_photo,
          employee: {
            id: empData.em_usid,
            employeeNumber: empData.em_empno,
            department: empData.em_dept,
            salary: empData.em_salary,
            joinDate: empData.em_joindt,
            status: empData.em_status,
            managerId: empData.em_manager,
            address: empData.em_address,
            city: empData.em_city,
            state: empData.em_state,
            pincode: empData.em_pincode,
            photo: empData.em_photo || empData.us_photo || user.us_photo
          }
        };
      } else {
        // If no employee record found, still add photo from user
        profileData = {
          ...profileData,
          photo: user.us_photo
        };
      }
    } else if (user.us_usertype === 'customer') {
      // Fetch customer-specific data
      let customer;
      
      try {
        // Try TVL first
        customer = await CustomerTVL.findOne({ 
          where: { cu_usid: user.us_usid }
        });
      } catch (tvLError) {
        console.log('TVL Customer model not available, trying regular model');
        try {
          // If TVL fails, try regular Customer table
          customer = await Customer.findOne({ 
            where: { cu_usid: user.us_usid }
          });
        } catch (regularError) {
          console.log('Regular Customer model query failed:', regularError.message);
          customer = null;
        }
      }
      
      if (customer) {
        const custData = customer.toJSON();
        profileData = {
          ...profileData,
          photo: custData.cu_photo || user.us_photo,
          customer: {
            id: custData.cu_usid,
            customerNumber: custData.cu_custno,
            customerType: custData.cu_custtype,
            companyName: custData.cu_company,
            gstNumber: custData.cu_gst,
            creditLimit: custData.cu_creditlimit,
            creditUsed: custData.cu_creditused,
            paymentTerms: custData.cu_paymentterms,
            status: custData.cu_status,
            panNumber: custData.cu_panno
          }
        };
      } else {
        // If no customer record found, still add photo from user
        profileData = {
          ...profileData,
          photo: user.us_photo
        };
      }
    } else if (user.us_usertype === 'admin') {
      // Admin-specific data
      profileData = {
        ...profileData,
        photo: user.us_photo,
        admin: {
          isAdmin: true
        }
      };
    }

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } 
      });
    }

    const { firstName, lastName, email, phone, address, city, state, pincode, aadhaar, pan } = req.body;
    const userId = req.user.us_usid;

    // Update user information
    const updateData = {};
    if (firstName) updateData.us_fname = firstName;
    if (lastName) updateData.us_lname = lastName;
    if (email) updateData.us_email = email;
    if (phone) updateData.us_phone = phone;
    if (address) updateData.us_addr1 = address;
    if (city) updateData.us_city = city;
    if (state) updateData.us_state = state;
    if (pincode) updateData.us_pin = pincode;
    if (aadhaar) updateData.us_aadhaar = aadhaar;
    if (pan) updateData.us_pan = pan;
    
    updateData.mby = req.user.us_usid;
    updateData.us_mdtm = new Date();

    // Try updating in TVL first, then regular table
    let updatedUser;
    try {
      updatedUser = await UserTVL.update(updateData, {
        where: { us_usid: userId },
        returning: true
      });
    } catch (tvLError) {
      updatedUser = await User.update(updateData, {
        where: { us_usid: userId },
        returning: true
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
  }
};

// Update employee profile
const updateEmployeeProfile = async (req, res) => {
  try {
    if (!req.user || req.user.us_usertype !== 'employee') {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } 
      });
    }

    const { address, city, state, pincode } = req.body;
    const userId = req.user.us_usid;

    if (req.user.us_usertype === 'employee') {
      // Try updating employee in TVL first
      try {
        await EmployeeTVL.update({
          em_address: address,
          em_city: city,
          em_state: state,
          em_pincode: pincode,
          mby: req.user.us_usid,
          mdtm: new Date()
        }, {
          where: { em_usid: userId }
        });
      } catch (tvLError) {
        // If TVL fails, try regular Employee table
        await Employee.update({
          em_address: address,
          em_city: city,
          em_state: state,
          em_pincode: pincode,
          mby: req.user.us_usid,
          us_mdtm: new Date()
        }, {
          where: { em_usid: userId }
        });
      }
    }

    res.json({
      success: true,
      message: 'Employee profile updated successfully'
    });
  } catch (error) {
    console.error('Error in updateEmployeeProfile:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
  }
};

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'BAD_REQUEST', message: 'No file uploaded' } 
      });
    }

    const userId = req.user.us_usid;
    const imagePath = `/uploads/profiles/${req.file.filename}`;

    // Try updating in TVL first, then regular table
    try {
      await UserTVL.update({
        us_photo: imagePath,
        mby: req.user.us_usid,
        mdtm: new Date()
      }, {
        where: { us_usid: userId }
      });
    } catch (tvLError) {
      await User.update({
        us_photo: imagePath,
        mby: req.user.us_usid,
        us_mdtm: new Date()
      }, {
        where: { us_usid: userId }
      });
    }

    // If user is employee, also update employee table
    if (req.user.us_usertype === 'employee') {
      try {
        await EmployeeTVL.update({
          em_photo: imagePath,
          mby: req.user.us_usid,
          mdtm: new Date()
        }, {
          where: { em_usid: userId }
        });
      } catch (empError) {
        await Employee.update({
          em_photo: imagePath,
          mby: req.user.us_usid,
          us_mdtm: new Date()
        }, {
          where: { em_usid: userId }
        });
      }
    } else if (req.user.us_usertype === 'customer') {
      // If user is customer, update customer table
      try {
        await CustomerTVL.update({
          cu_photo: imagePath,
          mby: req.user.us_usid,
          mdtm: new Date()
        }, {
          where: { cu_usid: userId }
        });
      } catch (custError) {
        await Customer.update({
          cu_photo: imagePath,
          mby: req.user.us_usid,
          us_mdtm: new Date()
        }, {
          where: { cu_usid: userId }
        });
      }
    }

    res.json({
      success: true,
      data: { imageUrl: imagePath },
      message: 'Profile image uploaded successfully'
    });
  } catch (error) {
    console.error('Error in uploadProfileImage:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateEmployeeProfile,
  uploadProfileImage
};