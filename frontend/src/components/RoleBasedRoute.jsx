import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Define role permissions mapping based on backend operation IDs
const ROLE_PERMISSIONS = {
  // Administrator permissions - full access
  ADM: {
    allowedModules: ['dashboard', 'bookings', 'payments', 'billing', 'reports', 'travel-plans', 'admin', 'employee', 'customer', 'config', 'application', 'module', 'operation', 'role', 'user', 'role-permission', 'user-permission'],
    allowedOperations: {
      dashboard: ['DASH_VIEW', 'DASH_ADMIN'],
      bookings: ['BKNG_VIEW', 'BKNG_NEW', 'BKNG_EDIT', 'BKNG_DELETE', 'BKNG_SEARCH', 'BKNG_APPROVE'],
      payments: ['PYMT_VIEW', 'PYMT_NEW', 'PYMT_EDIT', 'PYMT_DELETE', 'PYMT_APPROVE', 'PYMT_SEARCH'],
      billing: ['BILL_VIEW', 'BILL_NEW', 'BILL_EDIT', 'BILL_DELETE', 'BILL_GEN', 'BILL_PRINT', 'BILL_SEARCH'],
      reports: ['RPT_ALL', 'RPT_REV', 'RPT_PYMT', 'RPT_BKNG', 'RPT_OP'],
      travelPlans: ['TPLN_VIEW', 'TPLN_NEW', 'TPLN_EDIT', 'TPLN_DELETE', 'TPLN_APPROVE', 'TPLN_SEARCH'],
      admin: ['ADMIN_ALL'],
      employee: ['EMPL_MGT', 'EMPL_CRUD', 'EMPL_NEW', 'EMPL_EDIT', 'EMPL_DELETE', 'EMPL_SEARCH', 'EMPL_ACT'],
      customer: ['CUST_VIEW', 'CUST_NEW', 'CUST_EDIT', 'CUST_DELETE', 'CUST_SEARCH'],
      config: ['CFG_VIEW', 'CFG_EDIT']
    },
    restrictedModules: [] // Admin has no restrictions
  },
  
  // Employee Agent permissions
  AGT: {
    allowedModules: ['bookings', 'customer', 'travel-plans'],
    allowedOperations: {
      bookings: ['BKNG_VIEW', 'BKNG_NEW', 'BKNG_EDIT', 'BKNG_SEARCH'], // Can view/edit but not approve/delete
      customer: ['CUST_VIEW', 'CUST_NEW', 'CUST_EDIT'],
      travelPlans: ['TPLN_VIEW']
    },
    restrictedModules: ['dashboard', 'payments', 'billing', 'admin', 'reports', 'config', 'employee', 'delete_booking', 'approve_payment']
  },
  
  // Employee Accounts permissions
  ACC: {
    allowedModules: ['bookings', 'payments', 'billing', 'reports'],
    allowedOperations: {
      bookings: ['BKNG_VIEW', 'BKNG_SEARCH'], // Read-only for bookings
      payments: ['PYMT_VIEW', 'PYMT_NEW', 'PYMT_EDIT', 'PYMT_APPROVE', 'PYMT_SEARCH'],
      billing: ['BILL_VIEW', 'BILL_NEW', 'BILL_EDIT', 'BILL_DELETE', 'BILL_GEN', 'BILL_PRINT', 'BILL_SEARCH'],
      reports: ['RPT_REV', 'RPT_PYMT']
    },
    restrictedModules: ['admin', 'travel-plans', 'customer', 'employee', 'config']
  },
  
  // Employee HR permissions
  HR: {
    allowedModules: ['employee', 'customer', 'reports'],
    allowedOperations: {
      employee: ['EMPL_MGT', 'EMPL_NEW', 'EMPL_EDIT', 'EMPL_SEARCH'],
      customer: ['CUST_VIEW', 'CUST_SEARCH'],
      reports: ['RPT_HR', 'RPT_EMP']
    },
    restrictedModules: ['dashboard', 'bookings', 'payments', 'billing', 'admin', 'travel-plans', 'config', 'delete_employee']
  },
  
  // Employee Customer Care permissions
  CC: {
    allowedModules: ['customer', 'bookings', 'reports'],
    allowedOperations: {
      customer: ['CUST_VIEW', 'CUST_NEW', 'CUST_EDIT', 'CUST_SEARCH'],
      bookings: ['BKNG_VIEW', 'BKNG_SEARCH'],
      reports: ['RPT_CUST', 'RPT_SUPPORT']
    },
    restrictedModules: ['dashboard', 'payments', 'billing', 'admin', 'travel-plans', 'employee', 'config']
  },
  
  // Employee Marketing permissions
  MKT: {
    allowedModules: ['customer', 'bookings', 'reports', 'travel-plans'],
    allowedOperations: {
      customer: ['CUST_VIEW', 'CUST_NEW', 'CUST_EDIT', 'CUST_SEARCH'],
      bookings: ['BKNG_VIEW', 'BKNG_SEARCH'],
      reports: ['RPT_MKT', 'RPT_CAMPAIGN'],
      travelPlans: ['TPLN_VIEW', 'TPLN_NEW', 'TPLN_EDIT', 'TPLN_SEARCH']
    },
    restrictedModules: ['dashboard', 'payments', 'billing', 'admin', 'employee', 'config']
  },
  
  // Employee Management permissions
  MGT: {
    allowedModules: ['dashboard', 'bookings', 'reports', 'travel-plans', 'employee', 'customer'],
    allowedOperations: {
      dashboard: ['DASH_VIEW'],
      bookings: ['BKNG_VIEW', 'BKNG_SEARCH', 'BKNG_APPROVE'],
      reports: ['RPT_ALL'],
      travelPlans: ['TPLN_VIEW', 'TPLN_APPROVE'],
      employee: ['EMPL_MGT', 'EMPL_SEARCH'],
      customer: ['CUST_VIEW', 'CUST_SEARCH']
    },
    restrictedModules: ['admin', 'payments', 'billing', 'config', 'delete_records']
  },
  
  // Customer role permissions
  CUS: {
    allowedModules: ['dashboard', 'bookings', 'payments', 'billing', 'travel-plans'],
    allowedOperations: {
      dashboard: ['DASH_VIEW'],
      bookings: ['BKNG_VIEW', 'BKNG_NEW', 'BKNG_CANCEL', 'BKNG_SEARCH'],
      payments: ['PYMT_VIEW', 'PYMT_NEW'],
      billing: ['BILL_VIEW'],
      travelPlans: ['TPLN_VIEW']
    },
    restrictedModules: ['admin', 'employee', 'reports', 'delete_booking', 'approve_payment']
  }
};

// Map module names to operation prefixes
const getOperationPrefix = (module) => {
  const mapping = {
    'dashboard': 'DASH_',
    'bookings': 'BKNG_',
    'payments': 'PYMT_',
    'billing': 'BILL_',
    'reports': 'RPT_',
    'travel-plans': 'TPLN_',
    'customer': 'CUST_',
    'employee': 'EMPL_',
    'application': 'APP_',
    'module': 'MOD_',
    'operation': 'OP_',
    'role': 'ROLE_',
    'user': 'USR_',
    'rolePermission': 'ROLE_PERM_',
    'userPermission': 'USR_PERM_'
  };
  return mapping[module] || '';
};

// Map operation names to backend operation codes
const getOperationCode = (module, operation) => {
  const prefix = getOperationPrefix(module);
  if (!prefix) return operation; // Return as-is if no mapping found
  
  const operationMapping = {
    'NEW': `${prefix}NEW`,
    'EDIT': `${prefix}EDIT`,
    'DELETE': `${prefix}DELETE`,
    'VIEW': `${prefix}VIEW`,
    'SEARCH': `${prefix}SEARCH`,
    'APPROVE': `${prefix}APPROVE`,
    'SAVE': `${prefix}EDIT`, // SAVE uses same permission as EDIT
    'CONFIRM': `${prefix}CONFIRM`,
    'CANCEL': `${prefix}CANCEL`,
    'GENERATE': `${prefix}GEN`,
    'PRINT': `${prefix}PRINT`,
    'ALL': 'ALL'
  };
  
  return operationMapping[operation] || operation;
};

// Function to check if a user has access to a specific module and operation
const hasModuleAccess = (role, module, operation = null) => {
  const rolePermissions = ROLE_PERMISSIONS[role];
  if (!rolePermissions) return false;

  // Check if module is allowed
  const isModuleAllowed = rolePermissions.allowedModules.includes(module);
  if (!isModuleAllowed) return false;

  // If operation is specified, convert to backend operation code and check if it's allowed
  if (operation && rolePermissions.allowedOperations[module]) {
    const operationCode = getOperationCode(module, operation);
    const allowedOps = rolePermissions.allowedOperations[module];
    return allowedOps.includes(operationCode) || allowedOps.includes('ALL');
  }

  return true;
};

// Function to check if a user is restricted from a module
const isModuleRestrictedByRole = (role, module) => {
  const rolePermissions = ROLE_PERMISSIONS[role];
  if (!rolePermissions) return false;
  
  return rolePermissions.restrictedModules.includes(module);
};

const RoleBasedRoute = ({ children, requiredRole, requiredModule, requiredOperation, fallbackPath = '/unauthorized' }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState({ user: null, isAuthenticated: false, loading: true });
  const [hasAccess, setHasAccess] = useState(null);

  useEffect(() => {
    // Safely get auth context
    try {
      const authContext = useAuth();
      setAuthState({
        user: authContext.user,
        isAuthenticated: authContext.isAuthenticated,
        loading: authContext.loading
      });
    } catch (error) {
      console.warn('Auth context not available in RoleBasedRoute:', error);
      setAuthState({ user: null, isAuthenticated: false, loading: false });
    }
  }, []);

  useEffect(() => {
    if (authState.loading) return;

    let access = true;

    // Check role-based access
    if (requiredRole) {
      if (Array.isArray(requiredRole)) {
        access = requiredRole.includes(authState.user?.us_roid);
      } else {
        access = authState.user?.us_roid === requiredRole;
      }
    }

    // Check module-based access
    if (access && requiredModule) {
      access = hasModuleAccess(authState.user?.us_roid, requiredModule, requiredOperation);
    }

    // Check if module is restricted
    if (access && requiredModule) {
      access = !isModuleRestrictedByRole(authState.user?.us_roid, requiredModule);
    }

    setHasAccess(access);
  }, [authState, requiredRole, requiredModule, requiredOperation]);

  if (authState.loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    // Redirect to unified login page for all users
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (hasAccess === false) {
    return <Navigate to={fallbackPath} replace />;
  }

  return hasAccess ? children : null;
};

// Component to conditionally render UI elements based on role/permissions
export const RoleBasedElement = ({ allowedRoles, allowedModule, allowedOperation, children }) => {
  const [authState, setAuthState] = useState({ user: null, loading: true });

  useEffect(() => {
    try {
      const authContext = useAuth();
      setAuthState({
        user: authContext.user,
        loading: authContext.loading
      });
    } catch (error) {
      console.warn('Auth context not available in RoleBasedElement:', error);
      setAuthState({ user: null, loading: false });
    }
  }, []);

  if (authState.loading) return null;

  let isVisible = true;

  // Check role-based visibility
  if (allowedRoles) {
    if (Array.isArray(allowedRoles)) {
      isVisible = allowedRoles.includes(authState.user?.us_roid);
    } else {
      isVisible = authState.user?.us_roid === allowedRoles;
    }
  }

  // Check module-based visibility
  if (isVisible && allowedModule) {
    isVisible = hasModuleAccess(authState.user?.us_roid, allowedModule, allowedOperation);
  }

  return isVisible ? children : null;
};

// Hook to get user permissions
export const usePermissions = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    try {
      const authContext = useAuth();
      setUser(authContext.user);
      setLoading(false);
    } catch (error) {
      console.warn('Auth context not available in usePermissions hook:', error);
      setUser(null);
      setLoading(false);
    }
  }, []);
  
  const canAccessModule = (module, operation = null) => {
    return hasModuleAccess(user?.us_roid, module, operation);
  };
  
  const isModuleRestricted = (module) => {
    return isModuleRestrictedByRole(user?.us_roid, module);
  };
  
  const getUserPermissions = () => {
    return ROLE_PERMISSIONS[user?.us_roid] || { allowedModules: [], allowedOperations: {}, restrictedModules: [] };
  };

  return {
    canAccessModule,
    isModuleRestricted,
    getUserPermissions,
    userRole: user?.us_roid,
    loading
  };
};

export default RoleBasedRoute;