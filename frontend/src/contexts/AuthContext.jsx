import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { authAPI, sessionAPI } from '../services/api';

// Create Auth Context
const AuthContext = createContext();

/**
 * Compute current financial year label using April 1 rollover (India standard).
 * e.g. July 2026 → "2026-27", Jan 2027 → "2026-27", April 2027 → "2027-28"
 */
const computeCurrentFYLabel = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  const endYear = (startYear + 1) % 100;
  return `${startYear}-${String(endYear).padStart(2, '0')}`;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(localStorage.getItem('financialYear') || null);
  const [availableFinancialYears, setAvailableFinancialYears] = useState([]);

  // Guard against React 18 Strict Mode double-invocation
  const initRan = useRef(false);

  // Check if user is logged in on initial load
  useEffect(() => {
    if (initRan.current) return; // Skip second call in Strict Mode
    initRan.current = true;

    const checkUserStatus = async () => {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      // Use stored user data immediately so UI isn't blank
      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.warn('Failed to parse stored user data:', error);
        }
      }
      
      if (token) {
        try {
          const profile = await authAPI.getProfile();
          if (import.meta.env.DEV) {
            console.log('Profile data received');
          }
          
          // Create user object with the correct field names
          // Handle the actual API response structure from getUserProfile
          const profileData = profile.data || profile;
          
          // Preserve existing role if API doesn't return it properly
          const existingUser = storedUser ? JSON.parse(storedUser) : {};
          
          const userObject = {
            us_usid: profileData.id || profileData.us_usid || existingUser.us_usid,
            us_fname: profileData.firstName || profileData.us_fname || existingUser.us_fname || '',
            us_lname: profileData.lastName || profileData.us_lname || existingUser.us_lname || '',
            us_email: profileData.email || profileData.us_email || existingUser.us_email,
            us_usertype: profileData.us_usertype || profileData.userType || profileData.usertype || existingUser.us_usertype || 'customer',
            // CRITICAL FIX: Preserve existing role if API doesn't return it, don't default to CUS
            us_roid: profileData.us_roid || profileData.role || existingUser.us_roid || 'CUS',
            us_coid: profileData.us_coid || profileData.companyId || existingUser.us_coid || 'TRV',
            us_phone: profileData.phone || profileData.us_phone || existingUser.us_phone || '',
            us_active: profileData.us_active || profileData.isActive || existingUser.us_active || 1,
            us_addr1: profileData.us_addr1 || profileData.address1 || existingUser.us_addr1 || '',
            us_city: profileData.us_city || profileData.city || existingUser.us_city || '',
            us_state: profileData.us_state || profileData.state || existingUser.us_state || '',
            us_pin: profileData.us_pin || profileData.pin || existingUser.us_pin || '',
            us_aadhaar: profileData.us_aadhaar || profileData.aadhaar || existingUser.us_aadhaar || '',
            us_pan: profileData.us_pan || profileData.pan || existingUser.us_pan || ''
          };
          
          if (import.meta.env.DEV) {
            console.log('User object synced from API');
          }
          setUser(userObject);
          setIsAuthenticated(true);
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(userObject));

          // Auto-initialize financial year if not already set
          const storedFY = localStorage.getItem('financialYear');
          if (!storedFY) {
            try {
              const fyRes = await sessionAPI.getAvailableYears();
              if (fyRes.success && fyRes.data?.length > 0) {
                // Use server-recommended current FY, or compute locally, or take last in list
                const serverFY = fyRes.currentFY;
                const localFY = computeCurrentFYLabel();
                const match = fyRes.data.find(f => f.fy_name === (serverFY || localFY))
                  || fyRes.data[fyRes.data.length - 1];
                if (match) {
                  await sessionAPI.selectYear(match.fy_name);
                  localStorage.setItem('financialYear', match.fy_name);
                  setSelectedFinancialYear(match.fy_name);
                  setAvailableFinancialYears(fyRes.data);
                }
              }
            } catch (fyErr) {
              console.warn('Could not auto-initialize financial year:', fyErr.message);
            }
          } else {
            // Populate available years in background for the session switcher in header
            try {
              const fyRes = await sessionAPI.getAvailableYears();
              if (fyRes.success && fyRes.data?.length > 0) {
                setAvailableFinancialYears(fyRes.data);
              }
            } catch (_) { /* non-critical */ }
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          // If API fails but we have stored user data, keep using it
          if (storedUser) {
            console.log('API failed, keeping stored user data');
            // Don't clear the user data immediately, let them stay logged in
            // Only clear if the error indicates invalid token (401/403)
            if (error.message && (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized'))) {
              console.log('Token is invalid, clearing stored data');
              localStorage.removeItem('token');
              localStorage.removeItem('sessionId');
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
            }
            // For other errors (network issues, etc.), keep user logged in
          } else {
            // No stored user data, clear everything
            localStorage.removeItem('token');
            localStorage.removeItem('sessionId');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        // No token found, ensure clean state
        setUser(null);
        setIsAuthenticated(false);
      }
      
      // Always set loading to false at the end
      setLoading(false);
    };

    checkUserStatus();
  }, []);

  // Login function
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    // Ensure us_roid is set properly for role-based routing
    const userWithRole = {
      ...userData,
      us_roid: userData.us_roid || userData.role || 'CUS' // Default to CUS for customers
    };
    // Store user data in localStorage for API functions to access
    localStorage.setItem('user', JSON.stringify(userWithRole));
    setUser(userWithRole);
    setIsAuthenticated(true);
    setLoading(false); // Ensure loading is false after login
  };

  // Logout function
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Call the logout API endpoint
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('financialYear');
      setUser(null);
      setIsAuthenticated(false);
      setSelectedFinancialYear(null);
      setAvailableFinancialYears([]);
      setLoading(false); // Ensure loading is false after logout
    }
  };

  // Auth context value
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    selectedFinancialYear,
    setSelectedFinancialYear,
    availableFinancialYears,
    setAvailableFinancialYears,
    selectFinancialYear: (fy) => {
      localStorage.setItem('financialYear', fy);
      setSelectedFinancialYear(fy);
    },
    clearFinancialYear: () => {
      localStorage.removeItem('financialYear');
      setSelectedFinancialYear(null);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;