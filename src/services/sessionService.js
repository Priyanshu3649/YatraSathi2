const Session = require('../models/Session');
const User = require('../models/User');
const Company = require('../models/Company');
const crypto = require('crypto');

class SessionService {
  /**
   * Create a new user session
   * @param {Object} user - The user object
   * @param {Object} req - The request object
   * @returns {Object} The created session
   */
  static async createSession(user, req) {
    try {
      // Generate a unique session ID
      const sessionId = crypto.randomBytes(32).toString('hex');
      
      // Get user's company if exists
      let companyId = null;
      if (user.us_coid) {
        const company = await Company.findByPk(user.us_coid);
        if (company) {
          companyId = company.co_coid;
        }
      }
      
      // Get IP address and user agent
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      // Create session record
      const session = await Session.create({
        ss_start: new Date(),
        ss_ssid: sessionId,
        ss_usid: user.us_usid,
        ss_coid: companyId,
        ss_ipaddr: ipAddress,
        ss_useragent: userAgent,
        ss_token: sessionId, // Using session ID as token for simplicity
        ss_active: 1,
        ss_lastact: new Date(),
        eby: user.us_usid,
        mby: user.us_usid
      });
      
      return session;
    } catch (error) {
      console.error('Error creating session:', error.message);
      throw error;
    }
  }
  
  /**
   * Validate an existing session
   * @param {string} sessionId - The session ID to validate
   * @param {string} userId - The user ID associated with the session
   * @returns {Object|null} The validated session or null if invalid
   */
  static async validateSession(sessionId, userId) {
    try {
      // Find active session
      const session = await Session.findOne({
        where: {
          ss_ssid: sessionId,
          ss_usid: userId,
          ss_active: 1
        }
      });
      
      if (!session) {
        return null;
      }
      
      // Check if session has expired (e.g., 24 hours)
      const now = new Date();
      const sessionStart = new Date(session.ss_start);
      const hoursDiff = Math.abs(now - sessionStart) / 36e5; // Convert milliseconds to hours
      
      if (hoursDiff > 24) {
        // Expire the session
        await session.update({
          ss_active: 0,
          ss_end: now,
          mby: 'SYSTEM'
        });
        return null;
      }
      
      // Update last activity
      await session.update({
        ss_lastact: now,
        mby: userId
      });
      
      return session;
    } catch (error) {
      console.error('Error validating session:', error.message);
      throw error;
    }
  }
  
  /**
   * End a user session
   * @param {string} sessionId - The session ID to end
   * @param {string} userId - The user ID associated with the session
   * @returns {boolean} True if session was ended successfully
   */
  static async endSession(sessionId, userId) {
    try {
      const session = await Session.findOne({
        where: {
          ss_ssid: sessionId,
          ss_usid: userId
        }
      });
      
      if (session) {
        await session.update({
          ss_active: 0,
          ss_end: new Date(),
          mby: userId
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error ending session:', error.message);
      throw error;
    }
  }
  
  /**
   * Get all active sessions for a user
   * @param {string} userId - The user ID
   * @returns {Array} Array of active sessions
   */
  static async getUserSessions(userId) {
    try {
      const sessions = await Session.findAll({
        where: {
          ss_usid: userId,
          ss_active: 1
        },
        order: [['ss_start', 'DESC']]
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting user sessions:', error.message);
      throw error;
    }
  }
  
  /**
   * End all sessions for a user (e.g., on logout from all devices)
   * @param {string} userId - The user ID
   * @returns {number} Number of sessions ended
   */
  static async endAllUserSessions(userId) {
    try {
      const [updatedRows] = await Session.update({
        ss_active: 0,
        ss_end: new Date(),
        mby: userId
      }, {
        where: {
          ss_usid: userId,
          ss_active: 1
        }
      });
      
      return updatedRows;
    } catch (error) {
      console.error('Error ending all user sessions:', error.message);
      throw error;
    }
  }
  
  /**
   * Clean up expired sessions (to be run periodically)
   * @returns {number} Number of sessions cleaned up
   */
  static async cleanupExpiredSessions() {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      
      const [updatedRows] = await Session.update({
        ss_active: 0,
        ss_end: now,
        mby: 'SYSTEM'
      }, {
        where: {
          ss_active: 1,
          ss_start: {
            [require('sequelize').Op.lt]: oneDayAgo
          }
        }
      });
      
      return updatedRows;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error.message);
      throw error;
    }
  }
}

module.exports = SessionService;