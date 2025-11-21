const SessionService = require('../services/sessionService');
const { User } = require('../models');

/**
 * Middleware to validate user sessions
 * Checks for session token in cookies or headers
 */
const sessionAuth = async (req, res, next) => {
  try {
    console.log('=== Session Auth Middleware Execution ===');
    
    // Get session token from cookies or headers
    let sessionToken = null;
    
    // Check cookies first
    if (req.cookies && req.cookies.sessionId) {
      sessionToken = req.cookies.sessionId;
      console.log('Session token from cookies:', sessionToken);
    }
    
    // Check headers if no cookie found
    if (!sessionToken && req.header('X-Session-Token')) {
      sessionToken = req.header('X-Session-Token');
      console.log('Session token from headers:', sessionToken);
    }
    
    // Check query params if still not found
    if (!sessionToken && req.query.sessionId) {
      sessionToken = req.query.sessionId;
      console.log('Session token from query params:', sessionToken);
    }
    
    if (!sessionToken) {
      console.log('No session token provided');
      return res.status(401).json({ message: 'Access denied. No session token provided.' });
    }
    
    // Get user ID from JWT token (assuming it's still used for initial auth)
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid JWT token provided');
      return res.status(401).json({ message: 'Access denied. No valid authentication token provided.' });
    }
    
    // For simplicity, we'll assume the user ID is available in req.user
    // In a real implementation, you would decode the JWT token here
    if (!req.user) {
      console.log('No user information available');
      return res.status(401).json({ message: 'Access denied. No user information available.' });
    }
    
    // Validate session
    const session = await SessionService.validateSession(sessionToken, req.user.us_usid);
    
    if (!session) {
      console.log('Invalid or expired session');
      return res.status(401).json({ message: 'Access denied. Invalid or expired session.' });
    }
    
    // Attach session information to request
    req.session = session;
    console.log('Session validation successful, calling next()');
    next();
  } catch (error) {
    console.error('Session auth error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to create a new session after successful login
 * This should be used after the JWT authentication middleware
 */
const createSession = async (req, res, next) => {
  try {
    console.log('=== Creating New Session ===');
    
    // Check if user is authenticated
    if (!req.user) {
      console.log('No user authenticated');
      return res.status(401).json({ message: 'Access denied. No user authenticated.' });
    }
    
    // Create new session
    const session = await SessionService.createSession(req.user, req);
    
    // Attach session to request
    req.session = session;
    
    // Also set cookie for frontend
    res.cookie('sessionId', session.ss_ssid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    console.log('Session created successfully, calling next()');
    next();
  } catch (error) {
    console.error('Session creation error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  sessionAuth,
  createSession
};