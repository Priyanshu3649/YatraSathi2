import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkUserStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const profile = await authAPI.getProfile();
          console.log('Profile data received:', profile);
          
          // Create user object with the correct field names
          // Handle the actual API response structure from getUserProfile
          const profileData = profile.data || profile;
          const userObject = {
            us_usid: profileData.id || profileData.us_usid,
            us_fname: profileData.firstName || profileData.us_fname || '',
            us_lname: profileData.lastName || profileData.us_lname || '',
            us_email: profileData.email || profileData.us_email,
            us_usertype: profileData.us_usertype || profileData.userType || profileData.usertype || 'customer',
            us_roid: profileData.us_roid || profileData.role || profileData.us_roid || 'CUS',
            us_coid: profileData.us_coid || profileData.companyId || 'TRV',
            us_phone: profileData.phone || profileData.us_phone || '',
            us_active: profileData.us_active || profileData.isActive || 1,
            us_addr1: profileData.us_addr1 || profileData.address1 || '',
            us_city: profileData.us_city || profileData.city || '',
            us_state: profileData.us_state || profileData.state || '',
            us_pin: profileData.us_pin || profileData.pin || '',
            us_aadhaar: profileData.us_aadhaar || profileData.aadhaar || '',
            us_pan: profileData.us_pan || profileData.pan || ''
          };
          
          console.log('User object created:', userObject);
          setUser(userObject);
          setIsAuthenticated(true);
          // Also store user in localStorage for immediate access
          localStorage.setItem('user', JSON.stringify(userObject));
        } catch (error) {
          console.error('Token validation failed:', error);
          // Try to get user data from localStorage as fallback
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              let userObject = JSON.parse(storedUser);
              
              // Ensure role fields are properly set
              if (!userObject.us_roid && userObject.role) {
                userObject.us_roid = userObject.role;
              }
              if (!userObject.us_roid) {
                userObject.us_roid = 'CUS';
              }
              if (!userObject.us_usertype && userObject.userType) {
                userObject.us_usertype = userObject.userType;
              }
              if (!userObject.us_usertype) {
                userObject.us_usertype = 'customer';
              }
              
              setUser(userObject);
              setIsAuthenticated(true);
              console.log('Restored user from localStorage:', userObject);
            } else {
              // Token is invalid and no stored user, remove it and reset auth state
              localStorage.removeItem('token');
              localStorage.removeItem('sessionId');
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (fallbackError) {
            console.error('Failed to restore user from localStorage:', fallbackError);
            localStorage.removeItem('token');
            localStorage.removeItem('sessionId');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        // No token found, ensure clean state
        setUser(null);
        setIsAuthenticated(false);
      }
      
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
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Auth context value
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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