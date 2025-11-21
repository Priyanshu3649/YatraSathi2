# Role-Based Access Control (RBAC) Implementation

## Overview
This document describes the implementation of Role-Based Access Control (RBAC) for the YatraSathi travel agency system. The RBAC system provides fine-grained access control based on user roles and permissions.

## Components

### 1. Core Models
- **Role**: Defines user roles (Admin, Accounts, Agent, etc.)
- **Permission**: Defines system permissions (User Management, Booking Management, etc.)
- **RolePermission**: Maps roles to permissions with specific action controls

### 2. Middleware
Three middleware functions provide different levels of access control:

#### requireRole(roles)
Checks if the authenticated user has one of the specified roles.

```javascript
// Example: Require admin or agent role
app.get('/api/route', authMiddleware, requireRole(['ADM', 'AGT']), (req, res) => {
  // Route logic here
});
```

#### requirePermission(permissions)
Checks if the authenticated user's role has been granted specific permissions.

```javascript
// Example: Require user management permission
app.get('/api/users', authMiddleware, requirePermission(['USR', 'USER_MGMT']), (req, res) => {
  // Route logic here
});
```

#### requirePermissionAction(permission, action)
Checks if the authenticated user's role has been granted a specific action (view, add, modify, delete) for a permission.

```javascript
// Example: Require view action for booking management
app.get('/api/bookings', authMiddleware, requirePermissionAction('BKG', 'view'), (req, res) => {
  // Route logic here
});
```

## Implementation Details

### Role Structure
Roles are defined with:
- Role ID (ur_roid): Unique identifier (e.g., 'ADM')
- Role Short Name (ur_roshort): Human-readable name (e.g., 'ADMIN')
- Role Description (ur_rodesc): Detailed description
- Department (ur_dept): Department association

### Permission Structure
Permissions are defined with:
- Permission ID (pr_peid): Unique identifier (e.g., 'USR')
- Permission Short Name (pr_peshort): Human-readable name (e.g., 'USER_MGMT')
- Permission Description (pr_pedesc): Detailed description
- Module (pr_module): System module association

### Role-Permission Mapping
Each role-permission mapping includes:
- Can View (rp_canview): View access (1 = allowed, 0 = denied)
- Can Add (rp_canadd): Create access (1 = allowed, 0 = denied)
- Can Modify (rp_canmod): Update access (1 = allowed, 0 = denied)
- Can Delete (rp_candel): Delete access (1 = allowed, 0 = denied)
- Transaction Limit (rp_limit): Optional transaction limit

## Available Roles
1. **ADM (ADMIN)**: System Administrator
2. **ACC (ACCOUNTS)**: Accounts Team Member
3. **AGT (AGENT)**: Booking Agent
4. **CCT (CALLCENTER)**: Call Center Executive
5. **MKT (MARKETING)**: Marketing Executive
6. **CUS (CUSTOMER)**: Customer

## Available Permissions
1. **USR (USER_MGMT)**: User Management
2. **BKG (BOOKING_MGMT)**: Booking Management
3. **ACC (ACCOUNTS_MGMT)**: Accounts Management
4. **RPT (REPORTS)**: Reports and Analytics
5. **CFG (CONFIG)**: System Configuration

## Usage Examples

### Protecting Routes
```javascript
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole, requirePermission, requirePermissionAction } = require('../middleware/rbacMiddleware');

// Role-based access
router.get('/admin', authMiddleware, requireRole('ADM'), (req, res) => {
  res.json({ message: 'Admin only area' });
});

// Permission-based access
router.get('/users', authMiddleware, requirePermission('USR'), (req, res) => {
  res.json({ message: 'User management area' });
});

// Action-based access
router.post('/bookings', authMiddleware, requirePermissionAction('BKG', 'add'), (req, res) => {
  res.json({ message: 'Create booking area' });
});
```

## Testing
Comprehensive tests have been created to verify all RBAC functionality:
- Role-based access control
- Permission-based access control
- Action-based access control

All tests pass successfully, confirming the RBAC system is working correctly.

## Security Considerations
- All access control checks happen after authentication
- Proper error handling prevents information leakage
- Role and permission data is loaded efficiently
- Middleware is designed to be lightweight and fast