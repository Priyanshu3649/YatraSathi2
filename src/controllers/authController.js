const { Login, User } = require('../models');
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

    // Check if user exists
    const userExists = await User.findOne({ where: { us_email: email } });
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

    // Create user - Generate shorter ID
    const timestamp = Date.now().toString().slice(-9); // Last 9 digits
    const user = await User.create({
      us_usid: `U${timestamp}`, // Generate unique user ID (max 10 chars)
      us_fname: name,
      us_email: email,
      us_phone: phone,
      us_usertype: 'customer', // Default user type
      us_active: 1,
      us_roid: 'CUS', // Default customer role
      us_coid: 'TRV', // Default company
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Create login credentials
    await Login.create({
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
    res.status(500).json({ message: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find login by email
    const login = await Login.findOne({ 
      where: { lg_email: email }
    });

    if (login && await bcrypt.compare(password, login.lg_passwd)) {
      // Get user details
      const user = await User.findByPk(login.lg_usid);
      
      // Create session for the user
      const session = await SessionService.createSession(user, req);
      
      res.json({
        id: login.lg_usid,
        name: user.us_fname,
        email: login.lg_email,
        us_usertype: user.us_usertype,
        token: generateToken(login.lg_usid),
        sessionId: session.ss_ssid,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    
    const user = await User.findByPk(req.user.us_usid);
    console.log('User found in database:', user ? user.toJSON() : 'User not found');
    
    if (user) {
      res.json({
        id: user.us_usid,
        name: user.us_fname,
        email: user.us_email,
        us_usertype: user.us_usertype
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { us_email: email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find login credentials
    const login = await Login.findOne({ where: { lg_usid: user.us_usid } });
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
    res.status(500).json({ message: error.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token for comparison
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find login with this reset token
    const login = await Login.findOne({ 
      where: { 
        lg_reset_token: resetTokenHash,
        lg_reset_token_expiry: {
          [Sequelize.Op.gt]: new Date()
        }
      }
    });

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
    res.status(500).json({ message: error.message });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token for comparison
    const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find login with this verification token
    const login = await Login.findOne({ 
      where: { 
        lg_verification_token: verificationTokenHash,
        lg_verification_token_expiry: {
          [Sequelize.Op.gt]: new Date()
        }
      }
    });

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
    res.status(500).json({ message: error.message });
  }
};

// Logout user
const logoutUser = async (req, res) => {
  try {
    // Get session ID from request
    const sessionId = req.body.sessionId || req.query.sessionId || req.header('X-Session-Token');
    const userId = req.user ? req.user.us_usid : null;
    
    if (!sessionId || !userId) {
      return res.status(400).json({ message: 'Session ID and User ID are required' });
    }
    
    // End the session
    const success = await SessionService.endSession(sessionId, userId);
    
    if (success) {
      // Clear session cookie
      res.clearCookie('sessionId');
      res.json({ message: 'Logout successful' });
    } else {
      res.status(404).json({ message: 'Session not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user sessions
const getUserSessions = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const sessions = await SessionService.getUserSessions(req.user.us_usid);
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout from all devices
const logoutAllDevices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const count = await SessionService.endAllUserSessions(req.user.us_usid);
    
    // Clear session cookie
    res.clearCookie('sessionId');
    
    res.json({ 
      message: `Logged out from all devices. ${count} sessions ended.`,
      sessionsEnded: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  logoutUser,
  getUserSessions,
  logoutAllDevices
};