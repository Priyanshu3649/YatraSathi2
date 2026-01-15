const { Login, User, Employee, LoginTVL, UserTVL, EmployeeTVL } = require('../models');
const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const SessionService = require('../services/sessionService');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret', {
    expiresIn: '30d'
  });
};

// Register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists in regular database
    let userExists = await User.findOne({ where: { us_email: email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Check if user exists in TVL database
    const { UserTVL, LoginTVL } = require('../models');
    userExists = await UserTVL.findOne({ where: { us_email: email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user in TVL database (for customer registration)
    const timestamp = Date.now().toString().slice(-9); // Last 9 digits
    const user = await UserTVL.create({
      us_usid: `CUS${timestamp}`, // Generate unique user ID for customer
      us_fname: name,
      us_email: email,
      us_phone: phone,
      us_usertype: 'customer', // Default user type
      us_roid: 'CUS', // Default customer role
      us_coid: 'TRV', // Default company
      us_active: 1,
      us_appadmin: 0,
      us_security: 0,
      us_limit: 0.00,
      us_edtm: new Date(),
      us_eby: 'SYSTEM',
      us_mdtm: new Date(),
      us_mby: 'SYSTEM'
    });

    // Create login credentials in TVL database
    await LoginTVL.create({
      lg_usid: user.us_usid,
      lg_email: email,
      lg_passwd: hashedPassword,
      lg_salt: salt,
      lg_active: 1,
      lg_email_verified: 0, // Not verified initially
      lg_verification_token: verificationTokenHash,
      lg_verification_token_expiry: verificationTokenExpiry,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // TODO: Send verification email (mock implementation for now)
    console.log(`Verification token for ${email}: ${verificationToken}`);

    if (user) {
      res.status(201).json({
        id: user.us_usid,
        name: user.us_fname,
        email: user.us_email,
        us_usertype: user.us_usertype,
        token: generateToken(user.us_usid),
        message: 'Registration successful. Please check your email for verification.'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Employee Login
const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } 
      });
    }
    
    // Sanitize and trim inputs
    let sanitizedEmail = email.trim().toLowerCase();
    let sanitizedPassword = password.trim();

    // Check if this is a TVL user by looking for both regular and TVL login records
    let login = await Login.findOne({ 
      where: { lg_email: sanitizedEmail, lg_active: 1 }
    });
    
    let isTVLUser = false;
    let user, employee = null;
    
    if (login) {
      // Regular user found
      isTVLUser = false;
      
      // Get user details
      user = await User.findOne({
        where: { 
          us_usid: login.lg_usid, 
          us_usertype: { [Sequelize.Op.in]: ['employee', 'admin'] }
        }
      });
      
      if (user) {
        employee = await Employee.findOne({
          where: { em_usid: user.us_usid }
        });
      }
    } else {
      // Check TVL database
      login = await LoginTVL.findOne({ 
        where: { lg_email: email, lg_active: 1 }
      });
      
      if (login) {
        isTVLUser = true;
        
        // Get TVL user details
        user = await UserTVL.findByPk(login.lg_usid);
        
        // Get employee details separately since association might not be set up
        if (user && (user.us_usertype === 'employee' || user.us_usertype === 'admin')) {
          employee = await EmployeeTVL.findOne({
            where: { em_usid: user.us_usid }
          });
        }
      }
    }
    
    if (!login || !user) {
      console.log(`Login failed for email: ${sanitizedEmail} - User not found`);
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } 
      });
    }

    // Verify password
    if (!login.lg_passwd) {
      console.log(`Login failed for email: ${sanitizedEmail} - No password hash found`);
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } 
      });
    }
    
    const isPasswordValid = await bcrypt.compare(sanitizedPassword, login.lg_passwd);
    if (!isPasswordValid) {
      console.log(`Login failed for email: ${sanitizedEmail} - Invalid password`);
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } 
      });
    }

    // Check if employee is active (only for employee accounts)
    if (user.us_usertype === 'employee' && employee && employee.em_status !== 'ACTIVE') {
      console.log(`Login blocked for email: ${sanitizedEmail} - Employee account is ${employee.em_status}`);
      return res.status(403).json({ 
        success: false, 
        error: { code: 'EMPLOYEE_INACTIVE', message: `Employee account is ${employee.em_status.toLowerCase()}` } 
      });
    }

    // Handle session creation for TVL users
    let session = null;
    if (isTVLUser) {
      // This is a TVL user - skip session creation to avoid foreign key constraint
      console.log(`TVL employee user login detected: ${user.us_usid} (${sanitizedEmail})`);
    } else {
      // Create session for the employee
      try {
        session = await SessionService.createSession(user, req);
        console.log(`Session created for user: ${user.us_usid} (${sanitizedEmail})`);
      } catch (sessionError) {
        console.error('Session creation failed for user', user.us_usid, ':', sessionError.message);
        // Continue login process even if session creation fails
        session = null;
      }
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.us_usid,
          name: user.us_fname,
          email: user.us_email,
          role: user.us_roid,
          department: employee?.em_dept || 'ADMIN',
          employeeNumber: employee?.em_empno || 'ADMIN001',
          us_usertype: user.us_usertype
        },
        token: generateToken(user.us_usid),
        sessionId: session ? session.ss_ssid : null
      }
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Internal server error' } 
    });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for login in both regular and TVL databases
    let login = await Login.findOne({ 
      where: { lg_email: email.trim().toLowerCase() }
    });
    
    let isTVLUser = false;
    let user;
    
    if (login) {
      // Regular login found
      isTVLUser = false;
      user = await User.findByPk(login.lg_usid);
    } else {
      // Check TVL database
      login = await LoginTVL.findOne({ 
        where: { lg_email: email.trim().toLowerCase() }
      });
      
      if (login) {
        isTVLUser = true;
        user = await UserTVL.findByPk(login.lg_usid);
      }
    }

    if (login && user && login.lg_passwd && await bcrypt.compare(password, login.lg_passwd)) {
      
      // For TVL users, we need to handle session creation differently
      // Check if this is a TVL user (has TVL-specific properties)
      let sessionId = null;
      if (isTVLUser) {
        // This is a TVL user - skip session creation to avoid foreign key constraint
        console.log(`TVL user login detected: ${user.us_usid}`);
      } else {
        // Create session for the user (only for non-TVL users to avoid foreign key constraint)
        try {
          const session = await SessionService.createSession(user, req);
          sessionId = session.ss_ssid;
        } catch (sessionError) {
          console.error('Session creation failed:', sessionError.message);
          // Continue login process even if session creation fails
          sessionId = null;
        }
      }
      
      res.json({
        id: login.lg_usid,
        name: user.us_fname,
        email: login.lg_email,
        us_usertype: user.us_usertype,
        token: generateToken(user.us_usid),
        sessionId: sessionId,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  console.log('=== getUserProfile called ===');
  console.log('User from request:', req.user);
  try {
    if (!req.user) {
      console.log('No user in request object');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Use the user from the request object that was already fetched by middleware
    const user = req.user;
    
    console.log('User from middleware:', user ? user.toJSON() : 'User not found');
    
    // Return complete user profile data similar to profileController
    res.json({
      success: true,
      data: {
        id: user.us_usid,
        us_usid: user.us_usid,
        firstName: user.us_fname,
        us_fname: user.us_fname,
        lastName: user.us_lname || '',
        us_lname: user.us_lname || '',
        email: user.us_email,
        us_email: user.us_email,
        phone: user.us_phone || '',
        us_phone: user.us_phone || '',
        us_usertype: user.us_usertype,
        us_roid: user.us_roid,
        us_coid: user.us_coid || 'TRV',
        us_active: user.us_active || 1,
        us_addr1: user.us_addr1 || '',
        us_city: user.us_city || '',
        us_state: user.us_state || '',
        us_pin: user.us_pin || '',
        us_aadhaar: user.us_aadhaar || '',
        us_pan: user.us_pan || '',
        role: user.us_roid || (user.role ? user.role.ro_name : null),
        userType: user.us_usertype
      }
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email - need to check both regular and TVL databases
    let user = await User.findOne({ where: { us_email: email } });
    let login;
    
    if (user) {
      // Found in regular database
      login = await Login.findOne({ where: { lg_usid: user.us_usid } });
    } else {
      // Check TVL database
      user = await UserTVL.findOne({ where: { us_email: email } });
      if (user) {
        login = await LoginTVL.findOne({ where: { lg_usid: user.us_usid } });
      }
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!login) {
      return res.status(404).json({ message: 'Login credentials not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token expiry (1 hour)
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    // Update login with reset token
    await login.update({
      lg_reset_token: resetTokenHash,
      lg_reset_token_expiry: resetTokenExpiry,
      mby: 'SYSTEM'
    });

    // TODO: Send email with reset token (mock implementation for now)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({ 
      message: 'Password reset link sent to your email',
      // In production, don't send the token in the response
      // This is just for testing purposes
      resetToken: resetToken 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token for comparison
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find login with this reset token - need to check both regular and TVL databases
    let login = await Login.findOne({ 
      where: { 
        lg_reset_token: resetTokenHash,
        lg_reset_token_expiry: {
          [Sequelize.Op.gt]: new Date()
        }
      }
    });
    
    if (!login) {
      // Check TVL database
      login = await LoginTVL.findOne({ 
        where: { 
          lg_reset_token: resetTokenHash,
          lg_reset_token_expiry: {
            [Sequelize.Op.gt]: new Date()
          }
        }
      });
    }

    if (!login) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await login.update({
      lg_passwd: hashedPassword,
      lg_salt: salt,
      lg_reset_token: null,
      lg_reset_token_expiry: null,
      mby: 'SYSTEM'
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token for comparison
    const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find login with this verification token - need to check both regular and TVL databases
    let login = await Login.findOne({ 
      where: { 
        lg_verification_token: verificationTokenHash,
        lg_verification_token_expiry: {
          [Sequelize.Op.gt]: new Date()
        }
      }
    });
    
    if (!login) {
      // Check TVL database
      login = await LoginTVL.findOne({ 
        where: { 
          lg_verification_token: verificationTokenHash,
          lg_verification_token_expiry: {
            [Sequelize.Op.gt]: new Date()
          }
        }
      });
    }

    if (!login) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update user as verified and clear verification token
    await login.update({
      lg_email_verified: 1,
      lg_verification_token: null,
      lg_verification_token_expiry: null,
      mby: 'SYSTEM'
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Logout user
const logoutUser = async (req, res) => {
  try {
    console.log('=== Logout function called ===');
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);
    
    // Get session ID from request
    const sessionId = req.body.sessionId || req.query.sessionId || req.header('X-Session-Token');
    const userId = req.user ? req.user.us_usid : null;
    
    console.log('Session ID from request:', sessionId);
    console.log('User ID from request:', userId);
    
    if (!userId) {
      console.log('No user ID found in request');
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if this is a TVL user to handle session differently
    const isTVLUser = userId && (userId.startsWith('ADM') || userId.startsWith('EMP') || 
                      userId.startsWith('ACC') || userId.startsWith('CUS'));
    
    console.log('Is TVL user:', isTVLUser);
    
    let success = false;
    if (isTVLUser) {
      // For TVL users, we don't have sessions in the main database due to foreign key constraints
      // So we'll just return success without trying to end a session
      console.log(`TVL user logout detected: ${userId}, skipping session termination`);
      success = true;
    } else {
      // For non-TVL users, session ID is required
      if (!sessionId) {
        console.log('Session ID is required for non-TVL user but not provided');
        return res.status(400).json({ message: 'Session ID is required for non-TVL users' });
      }
      console.log('Attempting to end session:', sessionId);
      // End the session for non-TVL users
      success = await SessionService.endSession(sessionId, userId);
    }
    
    if (success) {
      // Clear session cookie
      res.clearCookie('sessionId');
      console.log('Logout successful');
      res.json({ message: 'Logout successful' });
    } else {
      console.log('Session not found');
      res.status(404).json({ message: 'Session not found' });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user sessions
const getUserSessions = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if this is a TVL user
    const isTVLUser = req.user.us_usid && (req.user.us_usid.startsWith('ADM') || req.user.us_usid.startsWith('EMP') || 
                      req.user.us_usid.startsWith('ACC') || req.user.us_usid.startsWith('CUS'));
    
    if (isTVLUser) {
      // For TVL users, return empty sessions array since they don't have sessions in main database
      console.log(`TVL user session request detected: ${req.user.us_usid}, returning empty sessions`);
      res.json({ sessions: [] });
    } else {
      const sessions = await SessionService.getUserSessions(req.user.us_usid);
      res.json({ sessions });
    }
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Logout from all devices
const logoutAllDevices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if this is a TVL user
    const isTVLUser = req.user.us_usid && (req.user.us_usid.startsWith('ADM') || req.user.us_usid.startsWith('EMP') || 
                      req.user.us_usid.startsWith('ACC') || req.user.us_usid.startsWith('CUS'));
    
    let count = 0;
    if (isTVLUser) {
      // For TVL users, we don't have sessions in the main database
      console.log(`TVL user logout all devices detected: ${req.user.us_usid}, no sessions to end`);
      count = 0; // No sessions to end
    } else {
      count = await SessionService.endAllUserSessions(req.user.us_usid);
    }
    
    // Clear session cookie
    res.clearCookie('sessionId');
    
    res.json({ 
      message: `Logged out from all devices. ${count} sessions ended.`,
      sessionsEnded: count
    });
  } catch (error) {
    console.error('Logout all devices error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  employeeLogin,
  getUserProfile,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  logoutUser,
  getUserSessions,
  logoutAllDevices
};