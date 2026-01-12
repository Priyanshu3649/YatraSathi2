import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Define role permissions mapping based on backend operation IDs
const ROLE_PERMISSIONS = {
  // Accountant permissions
  ACC: {
    allowedModules: ['payments', 'billing', 'reports'],
    allowedOperations: {
      payments: ['PYMT_VIEW', 'PYMT_NEW', 'PYMT_EDIT', 'PYMT_APPROVE', 'PYMT_SEARCH'],
      billing: ['BILL_VIEW', 'BILL_GEN', 'BILL_PRINT'],
      reports: ['RPT_REV', 'RPT_PYMT']
    },
    restrictedModules: ['employee', 'role', 'permission', 'config']
  },
  
  // Manager permissions
  MGR: {
    allowedModules: ['dashboard', 'bookings', 'payments', 'travel-plans', 'reports'],
    allowedOperations: {
      dashboard: ['DASH_VIEW'],
      bookings: ['BKNG_VIEW', 'BKNG_SEARCH', 'BKNG_APPROVE'],
      payments: ['PYMT_VIEW', 'PYMT_APPROVE'],
      travelPlans: ['TPLN_VIEW', 'TPLN_APPROVE'],
      reports: ['RPT_ALL']
    },
    restrictedModules: ['delete_records'] // Cannot delete records
  },
  
  // Administration Executive permissions
  ADX: {
    allowedModules: ['application', 'module', 'operation', 'role', 'user', 'role-permission', 'user-permission', 'customer', 'employee'],
    allowedOperations: {
      application: ['APP_LIST'],
      module: ['MOD_LIST'],
      operation: ['OP_LIST'],
      role: ['ROLE_LIST'],
      user: ['USR_LIST'],
      rolePermission: ['ROLE_PERM', 'USR_PERM'],
      userPermission: ['USR_PERM'],
      customer: ['CUST_LIST'],
      employee: ['EMPL_MGT', 'EMPL_CRUD', 'EMPL_NEW', 'EMPL_EDIT', 'EMPL_DELETE', 'EMPL_SEARCH', 'EMPL_ACT']
    },
    restrictedModules: [] // No restrictions for admin exec
  },
  
  // Sales Agent permissions
  SAG: {
    allowedModules: ['customer', 'booking', 'travel-plans'],
    allowedOperations: {
      customer: ['CUST_VIEW', 'CUST_NEW', 'CUST_EDIT'],
      booking: ['BKNG_NEW', 'BKNG_EDIT', 'BKNG_VIEW', 'BKNG_SEARCH'],
      travelPlans: ['TPLN_VIEW']
    },
    restrictedModules: ['delete_booking', 'approve_payment', 'reports']
  },
  
  // Operations Manager permissions
  OPM: {
    allowedModules: ['booking', 'travel-plans', 'reports'],
    allowedOperations: {
      booking: ['BKNG_VIEW', 'BKNG_EDIT', 'BKNG_CONFIRM', 'BKNG_CANCEL'],
      travelPlans: ['TPLN_NEW', 'TPLN_EDIT', 'TPLN_DELETE'],
      reports: ['RPT_BKNG', 'RPT_OP']
    },
    restrictedModules: [] // Has special operational rights
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
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState(null);

  useEffect(() => {
    if (loading) return;

    let access = true;

    // Check role-based access
    if (requiredRole) {
      if (Array.isArray(requiredRole)) {
        access = requiredRole.includes(user?.us_roid);
      } else {
        access = user?.us_roid === requiredRole;
      }
    }

    // Check module-based access
    if (access && requiredModule) {
      access = hasModuleAccess(user?.us_roid, requiredModule, requiredOperation);
    }

    // Check if module is restricted
    if (access && requiredModule) {
      access = !isModuleRestrictedByRole(user?.us_roid, requiredModule);
    }

    setHasAccess(access);
  }, [user, isAuthenticated, loading, requiredRole, requiredModule, requiredOperation]);

  if (loading) {
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

  if (!isAuthenticated) {
    return <Navigate to="/auth/employee-login" state={{ from: location }} replace />;
  }

  if (hasAccess === false) {
    return <Navigate to={fallbackPath} replace />;
  }

  return hasAccess ? children : null;
};

// Component to conditionally render UI elements based on role/permissions
export const RoleBasedElement = ({ allowedRoles, allowedModule, allowedOperation, children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  let isVisible = true;

  // Check role-based visibility
  if (allowedRoles) {
    if (Array.isArray(allowedRoles)) {
      isVisible = allowedRoles.includes(user?.us_roid);
    } else {
      isVisible = user?.us_roid === allowedRoles;
    }
  }

  // Check module-based visibility
  if (isVisible && allowedModule) {
    isVisible = hasModuleAccess(user?.us_roid, allowedModule, allowedOperation);
  }

  return isVisible ? children : null;
};

// Hook to get user permissions
export const usePermissions = () => {
  const { user } = useAuth();
  
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
    userRole: user?.us_roid
  };
};

export default RoleBasedRoute;