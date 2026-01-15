// Role-based permissions configuration
export const ROLE_PERMISSIONS = {
  // Admin has full access
  ADM: {
    canViewDashboard: true,
    canViewBookings: true,
    canViewTravelPlans: true,
    canViewPayments: true,
    canViewBilling: true,
    canViewReports: true,
    canViewAdminPanel: true,
    canViewEmployeeDashboard: false,
    canApproveBookings: true,
    canModifyFinancialValues: true,
    canDeleteBookings: true,
    canGenerateBills: true,
    canProcessPayments: true,
    canModifySystemSettings: true
  },
  
  // Agent employee - focused on bookings and customer interactions
  AGT: {
    canViewDashboard: false, // Agents should not see admin dashboard
    canViewBookings: true,
    canViewTravelPlans: false,
    canViewPayments: false,
    canViewBilling: false,
    canViewReports: false, // Limit reports access
    canViewAdminPanel: false,
    canViewEmployeeDashboard: true,
    canApproveBookings: false, // Limited approval based on assignment
    canModifyFinancialValues: false,
    canDeleteBookings: false,
    canGenerateBills: false,
    canProcessPayments: false,
    canModifySystemSettings: false
  },
  
  // Accounts employee - focused on billing and payments
  ACC: {
    canViewDashboard: false, // Accounts should not see admin dashboard
    canViewBookings: true, // Read-only access to bookings
    canViewTravelPlans: false,
    canViewPayments: true,
    canViewBilling: true,
    canViewReports: true, // Financial reports
    canViewAdminPanel: false,
    canViewEmployeeDashboard: true,
    canApproveBookings: false, // No booking approval
    canModifyFinancialValues: true, // Financial operations
    canDeleteBookings: false,
    canGenerateBills: true,
    canProcessPayments: true,
    canModifySystemSettings: false
  },
  
  // HR employee - focused on employee management
  HR: {
    canViewDashboard: false, // HR should not see admin dashboard
    canViewBookings: false,
    canViewTravelPlans: false,
    canViewPayments: false,
    canViewBilling: false,
    canViewReports: true, // HR reports
    canViewAdminPanel: false,
    canViewEmployeeDashboard: true,
    canApproveBookings: false,
    canModifyFinancialValues: false,
    canDeleteBookings: false,
    canGenerateBills: false,
    canProcessPayments: false,
    canModifySystemSettings: false
  },
  
  // Customer Care/Support employee
  CC: {
    canViewDashboard: false, // CC should not see admin dashboard
    canViewBookings: true, // Read-only access to bookings
    canViewTravelPlans: false,
    canViewPayments: false,
    canViewBilling: false,
    canViewReports: true, // Support reports
    canViewAdminPanel: false,
    canViewEmployeeDashboard: true,
    canApproveBookings: false,
    canModifyFinancialValues: false,
    canDeleteBookings: false,
    canGenerateBills: false,
    canProcessPayments: false,
    canModifySystemSettings: false
  },
  
  // Marketing employee
  MKT: {
    canViewDashboard: false, // Marketing should not see admin dashboard
    canViewBookings: true, // Read-only access to bookings
    canViewTravelPlans: true, // Can view travel plans
    canViewPayments: false,
    canViewBilling: false,
    canViewReports: true, // Marketing reports
    canViewAdminPanel: false,
    canViewEmployeeDashboard: true,
    canApproveBookings: false,
    canModifyFinancialValues: false,
    canDeleteBookings: false,
    canGenerateBills: false,
    canProcessPayments: false,
    canModifySystemSettings: false
  },
  
  // Management employee
  MGT: {
    canViewDashboard: true, // Management can see management dashboard
    canViewBookings: true,
    canViewTravelPlans: true,
    canViewPayments: true, // Read-only
    canViewBilling: true, // Read-only
    canViewReports: true,
    canViewAdminPanel: false, // Management should not see admin panel
    canViewEmployeeDashboard: true,
    canApproveBookings: true, // With assignment restrictions
    canModifyFinancialValues: false, // Limited financial changes
    canDeleteBookings: false,
    canGenerateBills: false, // Only accounts can generate bills
    canProcessPayments: false, // Only accounts can process payments
    canModifySystemSettings: false
  },
  
  // Default employee permissions (fallback)
  employee: {
    canViewDashboard: false,
    canViewBookings: true,
    canViewTravelPlans: false,
    canViewPayments: false,
    canViewBilling: false,
    canViewReports: false,
    canViewAdminPanel: false,
    canViewEmployeeDashboard: true,
    canApproveBookings: false,
    canModifyFinancialValues: false,
    canDeleteBookings: false,
    canGenerateBills: false,
    canProcessPayments: false,
    canModifySystemSettings: false
  }
};

// Get permissions based on user role
export const getUserPermissions = (user) => {
  if (!user) return ROLE_PERMISSIONS.employee;
  
  // First check the role code (us_roid) which takes precedence
  const roleCode = user.us_roid?.toUpperCase();
  if (roleCode && ROLE_PERMISSIONS[roleCode]) {
    return ROLE_PERMISSIONS[roleCode];
  }
  
  // Fallback to user type
  const userType = user.us_usertype?.toLowerCase();
  
  // Handle specific user types
  if (userType === 'admin') {
    return ROLE_PERMISSIONS.ADM;
  } else if (userType === 'employee') {
    // If no specific role code found for employee, return default employee permissions
    return ROLE_PERMISSIONS.employee;
  }
  
  // Return permissions based on user type
  return ROLE_PERMISSIONS[userType] || ROLE_PERMISSIONS.employee;
};

// Navigation menu configuration based on permissions
export const getNavigationConfig = (user) => {
  const permissions = getUserPermissions(user);
  
  const navItems = [];
  
  // Conditional navigation items based on permissions
  if (permissions.canViewDashboard) {
    navItems.push({ path: '/dashboard', label: 'Dashboard', allowed: true });
  }
  
  if (permissions.canViewBookings) {
    navItems.push({ path: '/bookings', label: 'Bookings', allowed: true });
  }
  
  if (permissions.canViewTravelPlans) {
    navItems.push({ path: '/travel-plans', label: 'Travel Plans', allowed: true });
  }
  
  if (permissions.canViewPayments) {
    navItems.push({ path: '/payments', label: 'Payments', allowed: true });
  }
  
  if (permissions.canViewBilling) {
    navItems.push({ path: '/billing', label: 'Billing', allowed: true });
  }
  
  if (permissions.canViewReports) {
    navItems.push({ path: '/reports', label: 'Reports', allowed: true });
  }
  
  if (permissions.canViewAdminPanel) {
    navItems.push({ path: '/admin-dashboard', label: 'Admin Panel', allowed: true });
  }
  
  if (permissions.canViewEmployeeDashboard) {
    navItems.push({ path: '/employee', label: 'Employee Dashboard', allowed: true });
  }
  
  // Profile is always available
  navItems.push({ 
    path: user?.us_usertype === 'employee' ? '/employee/profile' : '/profile', 
    label: 'Profile', 
    allowed: true 
  });
  
  return navItems;
};

// Check if user can access specific route
export const canUserAccessRoute = (user, route) => {
  const permissions = getUserPermissions(user);
  
  switch (route) {
    case '/dashboard':
      return permissions.canViewDashboard;
    case '/bookings':
      return permissions.canViewBookings;
    case '/travel-plans':
      return permissions.canViewTravelPlans;
    case '/payments':
      return permissions.canViewPayments;
    case '/billing':
      return permissions.canViewBilling;
    case '/reports':
      return permissions.canViewReports;
    case '/admin-dashboard':
      return permissions.canViewAdminPanel;
    case '/employee':
    case '/employee/profile':
      return permissions.canViewEmployeeDashboard;
    default:
      // For other routes, check if user has general access
      return true;
  }
};