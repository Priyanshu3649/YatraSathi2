// Simple in-memory audit log (in production, this would be stored in a database)
let auditLogs = [];

// Log an action
const logAction = (action, userId, details) => {
  const logEntry = {
    id: auditLogs.length + 1,
    action,
    userId,
    details,
    timestamp: new Date()
  };
  
  auditLogs.push(logEntry);
  
  // Keep only the last 1000 logs to prevent memory issues
  if (auditLogs.length > 1000) {
    auditLogs = auditLogs.slice(-1000);
  }
  
  return logEntry;
};

// Get all audit logs (admin only)
const getAuditLogs = async (req, res) => {
  try {
    // Only admin can get audit logs
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Filter logs based on query parameters
    const { userId, action, startDate, endDate } = req.query;
    
    let filteredLogs = [...auditLogs];
    
    // Apply filters
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }
    
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    
    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
    }
    
    // Sort by timestamp descending
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      totalLogs: filteredLogs.length,
      logs: filteredLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get audit logs for a specific user
const getUserAuditLogs = async (req, res) => {
  try {
    // Users can only see their own logs, admin can see all
    const userId = req.user.userType === 'admin' 
      ? req.params.userId || req.user._id
      : req.user._id;
    
    const userLogs = auditLogs.filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      userId,
      totalLogs: userLogs.length,
      logs: userLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clear audit logs (admin only)
const clearAuditLogs = async (req, res) => {
  try {
    // Only admin can clear audit logs
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const count = auditLogs.length;
    auditLogs = [];
    
    res.json({ message: `Cleared ${count} audit logs` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  logAction,
  getAuditLogs,
  getUserAuditLogs,
  clearAuditLogs
};