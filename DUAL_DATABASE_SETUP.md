# Dual Database Setup Complete ✅

## Configuration

The application now uses TWO databases:

1. **yatrasathi** - Main database for all existing functionality
2. **TVL_001** - Separate database for Roles and Permissions only

## Database Connections

### Main Database (yatrasathi)
- Used for: Users, Bookings, Stations, Trains, Companies, etc.
- All existing models continue to use this database

### TVL Database (TVL_001)
- Used for: Roles (fnXfunction) and Permissions (opXoperation)
- New models: RoleTVL and PermissionTVL

## Files Modified

### 1. `.env`
```
DB_NAME=yatrasathi          # Main database
DB_NAME_TVL=TVL_001         # TVL database for roles/permissions
```

### 2. `config/db.js`
- Added `sequelizeTVL` connection for TVL_001 database
- Both connections tested on startup
- Exports: `{ sequelize, sequelizeTVL, connectDB }`

### 3. New Models Created

**src/models/RoleTVL.js**
- Connects to TVL_001.fnXfunction table
- Fields: fn_fnid, fn_fnshort, fn_fndesc, fn_rmrks, fn_active, audit fields

**src/models/PermissionTVL.js**
- Connects to TVL_001.opXoperation table
- Fields: op_apid, op_moid, op_opid, op_opshort, op_opdesc, op_active, audit fields

### 4. `src/controllers/permissionController.js`
- Updated to use RoleTVL and PermissionTVL models
- All CRUD operations now work with TVL_001 database

### 5. `frontend/src/components/DynamicAdminPanel.jsx`
- Updated field names to match TVL_001 tables:
  - Roles: fn_fnid, fn_fnshort, fn_fndesc, fn_active
  - Permissions: op_apid, op_moid, op_opid, op_opshort, op_opdesc
- Updated audit field references
- Removed department filter (not in fnXfunction table)

## Table Structures

### TVL_001.fnXfunction (Roles)
```sql
fn_fnid      VARCHAR(6)   PRIMARY KEY
fn_fnshort   VARCHAR(30)  UNIQUE
fn_fndesc    VARCHAR(60)
fn_rmrks     LONGTEXT
fn_active    TINYINT
fn_edtm      DATETIME
fn_eby       VARCHAR(30)
fn_mdtm      DATETIME
fn_mby       VARCHAR(30)
fn_cdtm      DATETIME
fn_cby       VARCHAR(30)
```

### TVL_001.opXoperation (Permissions)
```sql
op_apid      VARCHAR(4)   PRIMARY KEY
op_moid      VARCHAR(4)   PRIMARY KEY
op_opid      VARCHAR(4)   PRIMARY KEY
op_opshort   VARCHAR(30)
op_opdesc    VARCHAR(60)
op_appop     TINYINT
op_avail     TINYINT
op_ready     TINYINT
op_rmrks     LONGTEXT
op_active    TINYINT
op_edtm      DATETIME
op_eby       VARCHAR(30)
op_mdtm      DATETIME
op_mby       VARCHAR(30)
op_cdtm      DATETIME
op_cby       VARCHAR(30)
op_secure    TINYINT
```

## API Endpoints

### Roles (using TVL_001)
- GET    `/api/permissions/roles` - Get all roles
- POST   `/api/permissions/roles` - Create role
- GET    `/api/permissions/roles/:id` - Get role by ID
- PUT    `/api/permissions/roles/:id` - Update role
- DELETE `/api/permissions/roles/:id` - Delete role

### Permissions (using TVL_001)
- GET    `/api/permissions` - Get all permissions
- POST   `/api/permissions` - Create permission

## Server Startup

```
🔧 Configuring MySQL database connections...
  Main Database: yatrasathi
  TVL Database: TVL_001
  Host: localhost
  User: root
  Password: ✅ Configured

🔌 Connecting to MySQL databases...
✅ Main database connected successfully!
   Connected to: yatrasathi@localhost
✅ TVL database connected successfully!
   Connected to: TVL_001@localhost

🔄 Synchronizing database models...
✅ All models synchronized successfully!

Server running on http://127.0.0.1:5003
```

## Benefits

1. **Separation of Concerns**: Roles and permissions in dedicated TVL_001 database
2. **No Migration Needed**: Existing yatrasathi data remains untouched
3. **Dual Connection**: Both databases accessible simultaneously
4. **Clean Architecture**: New TVL models separate from legacy models
5. **Easy Maintenance**: Clear separation makes updates easier

## Testing

1. **Access Admin Panel**: http://localhost:3001/admin-dashboard
2. **Navigate to Role List**: Should show roles from TVL_001.fnXfunction
3. **Navigate to Permissions**: Should show permissions from TVL_001.opXoperation
4. **All other modules**: Continue to use yatrasathi database

## Data Population

To populate roles in TVL_001:
```sql
INSERT INTO TVL_001.fnXfunction 
(fn_fnid, fn_fnshort, fn_fndesc, fn_active, fn_eby, fn_edtm)
VALUES
('ADMIN', 'Admin', 'System Administrator', 1, 'SYSTEM', NOW()),
('CUST', 'Customer', 'Customer User', 1, 'SYSTEM', NOW()),
('EMP', 'Employee', 'Employee User', 1, 'SYSTEM', NOW());
```

To populate permissions in TVL_001:
```sql
INSERT INTO TVL_001.opXoperation 
(op_apid, op_moid, op_opid, op_opshort, op_opdesc, op_active, op_eby, op_edtm)
VALUES
('YS', 'USR', 'VIEW', 'View Users', 'View user list', 1, 'SYSTEM', NOW()),
('YS', 'USR', 'ADD', 'Add Users', 'Create new users', 1, 'SYSTEM', NOW()),
('YS', 'BKG', 'VIEW', 'View Bookings', 'View booking list', 1, 'SYSTEM', NOW());
```

## Troubleshooting

### If roles don't show up:
1. Check TVL_001 database has data: `SELECT * FROM TVL_001.fnXfunction;`
2. Check fn_active = 1
3. Check server logs for connection errors

### If permissions don't show up:
1. Check TVL_001 database has data: `SELECT * FROM TVL_001.opXoperation;`
2. Check op_active = 1
3. Verify composite primary key values are set

### Connection Issues:
- Ensure both databases exist
- Check user has permissions for both databases
- Verify .env has both DB_NAME and DB_NAME_TVL set

## Next Steps

1. Populate TVL_001 tables with actual role and permission data
2. Test CRUD operations in Admin Panel
3. Verify filtering and pagination work correctly
4. Consider migrating other security-related tables to TVL_001 if needed
