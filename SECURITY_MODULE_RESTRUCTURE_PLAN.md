# Security Module Restructure - Implementation Plan

## Overview
Complete restructuring of the Security section in YatraSathi Admin Panel to align with TVL_001 database schema.

## Phase 1: Remove Old Modules ✅
- Keep database tables (for data migration)
- Remove old UI components from navigation

## Phase 2: New Security Module Structure

### Navigation Hierarchy
```
▼ Security
  ├── Application
  ├── Module  
  ├── Operation
  ├── Role List
  ├── User List
  ├── Role Permission
  └── User Permission
```

## Phase 3: Module Specifications

### 1. APPLICATION (apXapplication)
**Endpoint**: `/api/security/applications`
**Primary Key**: ap_apid (VARCHAR(4))
**Fields**:
- ap_apid* - Application ID
- ap_apshort* - Short Name
- ap_apdesc - Description
- ap_rmrks - Remarks (textarea)
- ap_active - Active (checkbox)

**Table Columns**: ap_apid, ap_apshort, ap_apdesc, ap_active, ap_edtm, ap_mdtm
**Filters**: Application ID, Short Name, Active Status

### 2. MODULE (moXmodule)
**Endpoint**: `/api/security/modules`
**Primary Key**: mo_apid + mo_moid
**Fields**:
- mo_apid* - Application ID (dropdown from apXapplication)
- mo_moid* - Module ID
- mo_moshort* - Short Name
- mo_modesc - Description
- mo_group - Group
- mo_grsrl - Group Serial (number)
- mo_mhint - Module Hint
- mo_isform - Is Form? (checkbox)
- mo_ready - Ready? (checkbox)
- mo_rmrks - Remarks (textarea)
- mo_active - Active (checkbox)

**Table Columns**: mo_apid, mo_moid, mo_moshort, mo_modesc, mo_group, mo_ready, mo_active, mo_edtm
**Filters**: Application ID (dropdown), Module ID, Short Name, Group, Active Status

### 3. OPERATION (opXoperation) ✅ Already Implemented
**Endpoint**: `/api/permissions` (already exists)
**Primary Key**: op_apid + op_moid + op_opid
**Additional Features Needed**:
- Computed field: Full Operation ID = op_apid + op_moid + op_opid
- Cascading dropdowns (Module filtered by Application)

### 4. ROLE LIST (fnXfunction) ✅ Already Implemented
**Endpoint**: `/api/permissions/roles` (already exists)
**Primary Key**: fn_fnid (VARCHAR(6))

### 5. USER LIST (usXuser)
**Endpoint**: `/api/security/users`
**Primary Key**: us_usid (VARCHAR(15))
**Fields**:
- us_usid* - User ID
- us_email* - Email (unique)
- us_usname* - User Name
- us_title - Job Title
- us_phone - Phone
- us_admin - Is Application Administrator? (checkbox)
- us_security - Is Security Administrator? (checkbox)
- us_limit - Authorization Limit (decimal)
- us_rmrks - Remarks (textarea)
- us_active - Active (checkbox)

**Table Columns**: us_usid, us_usname, us_email, us_title, us_phone, us_admin, us_active, us_edtm
**Filters**: User ID, Name, Email, Title, Active Status, Is Admin
**Special**: Create corresponding lgXlogin entry

### 6. ROLE PERMISSION (fpXfuncperm)
**Endpoint**: `/api/security/role-permissions`
**Primary Key**: fp_fnid + fp_opid
**Fields**:
- fp_fnid* - Function/Role (dropdown from fnXfunction)
- fp_opid* - Operation ID (dropdown showing full operation)
- fp_allow - Allow? (checkbox)
- fp_rmrks - Remarks (textarea)
- fp_active - Active (checkbox)

**Table Columns**: fp_fnid, Role Name, fp_opid, Operation Name, fp_allow, fp_active, fp_edtm
**Filters**: Role (dropdown), Operation, Permission Type (Allow/Deny), Active Status
**Special Features**:
- Bulk Permission Assignment
- Display as "Application > Module > Operation"
- Color coding: Green (Allow), Red (Deny)

### 7. USER PERMISSION (upXusrperm)
**Endpoint**: `/api/security/user-permissions`
**Primary Key**: up_usid + up_opid
**Fields**:
- up_usid* - User ID (dropdown from usXuser)
- up_opid* - Operation ID (dropdown showing full operation)
- up_allow - Allow? (checkbox)
- up_rmrks - Remarks (textarea)
- up_active - Active (checkbox)

**Table Columns**: up_usid, User Name, up_opid, Operation Name, up_allow, up_active, up_edtm
**Filters**: User (dropdown), Operation, Permission Type (Allow/Deny), Active Status
**Special Features**:
- Show Effective Permissions button
- Permission Override Indicator
- Color coding: Green (Allow), Red (Deny), Blue (Override)

## Phase 4: Backend Implementation

### Models to Create
1. ApplicationTVL.js - apXapplication
2. ModuleTVL.js - moXmodule
3. OperationTVL.js - opXoperation (update existing PermissionTVL)
4. UserTVL.js - usXuser
5. RolePermissionTVL.js - fpXfuncperm
6. UserPermissionTVL.js - upXusrperm

### Controllers to Create
1. securityController.js - Handle all security module operations

### Routes to Create
1. securityRoutes.js - All security endpoints

## Phase 5: Permission Logic

```javascript
function hasPermission(user, operation) {
  // 1. Check if admin
  if (user.us_admin || user.us_security) return true;
  
  // 2. Check user-specific permission
  const userPerm = upXusrperm.find(user.us_usid, operation);
  if (userPerm && userPerm.up_active) return userPerm.up_allow;
  
  // 3. Check role permissions
  const userRoles = ufXusrfunc.getRoles(user.us_usid);
  for (const role of userRoles) {
    const rolePerm = fpXfuncperm.find(role.uf_fnid, operation);
    if (rolePerm && rolePerm.fp_active && rolePerm.fp_allow) return true;
  }
  
  // 4. Default deny
  return false;
}
```

## Phase 6: UI/UX Standards

### Layout
- Left Panel (30%): Form fields
- Right Panel (70%): Filters + Data table
- Scrollable grid, static header/footer

### Visual Standards
- Required fields: Red asterisk (*)
- Audit trail: Bottom of form, green/grey text
- Table: Alternating rows, hover highlight
- Selected row: Yellow/blue highlight
- Checkboxes: ☑ (checked), ☐ (unchecked)

### Form Behavior
- New: Clear fields, enable editing
- Edit: Enable editing of selected record
- Save: Validate, save, auto-populate audit fields
- Delete: Show confirmation dialog
- Navigation: Move through filtered results

## Phase 7: Implementation Order

1. ✅ Database connections (already done)
2. ✅ Role List module (already done)
3. ✅ Operation module (already done)
4. Create Application module
5. Create Module module
6. Update User List module
7. Create Role Permission module
8. Create User Permission module
9. Update navigation structure
10. Test all CRUD operations
11. Implement permission logic
12. Test permission checking

## Files to Create/Modify

### Backend
- [ ] src/models/ApplicationTVL.js
- [ ] src/models/ModuleTVL.js
- [ ] src/models/UserTVL.js
- [ ] src/models/RolePermissionTVL.js
- [ ] src/models/UserPermissionTVL.js
- [ ] src/controllers/securityController.js
- [ ] src/routes/securityRoutes.js
- [x] src/models/RoleTVL.js (done)
- [x] src/models/PermissionTVL.js (done)
- [x] src/controllers/permissionController.js (done)

### Frontend
- [ ] frontend/src/components/DynamicAdminPanel.jsx (major update)
- [ ] Add all 7 module configurations
- [ ] Update navigation structure
- [ ] Add cascading dropdowns
- [ ] Add bulk operations
- [ ] Add color coding

## Testing Checklist
- [ ] All 7 modules visible in Security navigation
- [ ] Each module loads with correct form and table layout
- [ ] All fields display and save correctly
- [ ] Dropdowns populate from correct tables
- [ ] Filters work and update table results
- [ ] CRUD operations work for all modules
- [ ] Audit trail fields auto-populate
- [ ] Permission logic correctly allows/denies access
- [ ] Bulk permission assignment works
- [ ] Effective permission calculation works
- [ ] Navigation buttons work correctly
- [ ] UI matches existing admin panel styling

## Next Steps
1. Create remaining TVL models
2. Create security controller
3. Create security routes
4. Update DynamicAdminPanel with all 7 modules
5. Test each module individually
6. Implement permission checking logic
7. Final integration testing
