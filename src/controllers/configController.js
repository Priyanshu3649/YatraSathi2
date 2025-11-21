// Simple in-memory configuration (in production, this would be stored in a database)
let systemConfig = {
  // General settings
  appName: 'YatraSathi',
  appVersion: '1.0.0',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  
  // Booking settings
  maxPassengersPerPNR: 6,
  tatkalBookingWindow: 30, // minutes
  serviceChargePercentage: 10,
  
  // Financial settings
  financialYearStart: '04-01',
  taxPercentage: 18,
  
  // Email settings
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  
  // Notification settings
  enableEmailNotifications: true,
  enableSMSNotifications: true,
  
  // Security settings
  passwordMinLength: 8,
  sessionTimeout: 3600, // seconds
  maxLoginAttempts: 5
};

// Get all configuration settings (admin only)
const getConfig = async (req, res) => {
  try {
    // Only admin can get configuration
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(systemConfig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update configuration settings (admin only)
const updateConfig = async (req, res) => {
  try {
    // Only admin can update configuration
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const updates = req.body;
    
    // Update configuration
    Object.keys(updates).forEach(key => {
      if (systemConfig.hasOwnProperty(key)) {
        systemConfig[key] = updates[key];
      }
    });
    
    res.json({
      message: 'Configuration updated successfully',
      config: systemConfig
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get specific configuration value
const getConfigValue = async (req, res) => {
  try {
    const { key } = req.params;
    
    // Allow all users to get public configuration values
    // Admin can get all values
    const publicKeys = [
      'appName', 'appVersion', 'timezone', 'currency', 
      'maxPassengersPerPNR', 'tatkalBookingWindow'
    ];
    
    if (!publicKeys.includes(key) && req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (!systemConfig.hasOwnProperty(key)) {
      return res.status(404).json({ message: 'Configuration key not found' });
    }
    
    res.json({
      key,
      value: systemConfig[key]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset configuration to defaults (admin only)
const resetConfig = async (req, res) => {
  try {
    // Only admin can reset configuration
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Reset to default configuration
    systemConfig = {
      // General settings
      appName: 'YatraSathi',
      appVersion: '1.0.0',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      
      // Booking settings
      maxPassengersPerPNR: 6,
      tatkalBookingWindow: 30, // minutes
      serviceChargePercentage: 10,
      
      // Financial settings
      financialYearStart: '04-01',
      taxPercentage: 18,
      
      // Email settings
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      
      // Notification settings
      enableEmailNotifications: true,
      enableSMSNotifications: true,
      
      // Security settings
      passwordMinLength: 8,
      sessionTimeout: 3600, // seconds
      maxLoginAttempts: 5
    };
    
    res.json({
      message: 'Configuration reset to defaults',
      config: systemConfig
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConfig,
  updateConfig,
  getConfigValue,
  resetConfig
};