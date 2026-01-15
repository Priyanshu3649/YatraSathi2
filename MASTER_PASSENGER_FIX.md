# Master Passenger Endpoint Fix

## Issue
The `/api/customer/master-passengers` endpoint was returning 404 errors when accessed from the frontend.

## Root Causes

### 1. Express Route Order Conflict
In Express.js, route registration order matters. The routes were registered in this order:
```javascript
app.use('/api/customer', customerRoutes);  // General route
app.use('/api/customer/master-passengers', masterPassengerRoutes);  // Specific route
```

When a request came to `/api/customer/master-passengers`, Express matched it against `/api/customer` first and handled it with `customerRoutes`, which didn't have a `master-passengers` sub-route, resulting in a 404.

### 2. Missing Database Table
The `cmpXmasterpassenger` table didn't exist in the TVL_001 database, causing a SequelizeDatabaseError when the endpoint tried to query the data.

## Solutions

### Solution 1: Reorder Route Registration
Reordered the route registration to register more specific routes BEFORE general routes:

```javascript
// BEFORE (incorrect order)
app.use('/api/customer', customerRoutes);
app.use('/api/customer/master-passengers', masterPassengerRoutes);
app.use('/api/customer/master-list', masterPassengerListRoutes);

// AFTER (correct order)
app.use('/api/customer/master-passengers', masterPassengerRoutes);
app.use('/api/customer/master-list', masterPassengerListRoutes);
app.use('/api/customer', customerRoutes);
```

### Solution 2: Create Database Table
Created the `cmpXmasterpassenger` table in TVL_001 database with the following structure:

```sql
CREATE TABLE `cmpXmasterpassenger` (
  `cmp_cmpid` VARCHAR(20) NOT NULL PRIMARY KEY,
  `cmp_cuid` VARCHAR(15) NOT NULL,
  `cmp_firstname` VARCHAR(50) NOT NULL,
  `cmp_lastname` VARCHAR(50) DEFAULT NULL,
  `cmp_age` INT NOT NULL,
  `cmp_gender` ENUM('M', 'F', 'O') NOT NULL,
  `cmp_berthpref` VARCHAR(20) DEFAULT NULL,
  `cmp_idtype` VARCHAR(20) DEFAULT NULL,
  `cmp_idnumber` VARCHAR(50) DEFAULT NULL,
  `cmp_aadhaar` VARCHAR(12) DEFAULT NULL,
  `cmp_active` TINYINT NOT NULL DEFAULT 1,
  `cmp_created_by` VARCHAR(20) DEFAULT NULL,
  `cmp_modified_by` VARCHAR(20) DEFAULT NULL,
  `cmp_created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cmp_modified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cmp_cuid` (`cmp_cuid`),
  INDEX `idx_cmp_active` (`cmp_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Added sample data for testing:
- 3 master passengers for customer CUS002
- Various passenger types (Male, Female, different berth preferences)
- Different ID types (Aadhaar, PAN, Passport)

## Files Modified
- `src/server.js` - Reordered route registration (lines 78-83)
- `src/models/CustomerMasterPassenger.js` - Updated cmp_cuid field length from VARCHAR(20) to VARCHAR(15) to match database
- `create-master-passenger-table.sql` - SQL script to create table and insert sample data

## Verification
1. Backend server restarted successfully on port 5004
2. Database table created with sample data
3. Endpoint now responds correctly with passenger data
4. Frontend should now be able to access master passengers

## Testing
To test the fix:
1. Log in as a customer (customer@example.com / customer123 OR pandeypriyanshu53@gmail.com)
2. Navigate to the Master Passengers section
3. The list should load with 3 sample passengers
4. You should be able to create, edit, and delete passengers

## Related Files
- **Route Definition**: `src/routes/masterPassengerRoutes.js`
- **Controller**: `src/controllers/masterPassengerController.js`
- **Model**: `src/models/CustomerMasterPassenger.js`
- **Frontend API**: `frontend/src/services/api.js` (masterPassengerAPI)
- **Frontend Component**: `frontend/src/components/Customer/MasterPassengerList.jsx`

## API Endpoints Now Working
- `GET /api/customer/master-passengers` - Get all master passengers
- `POST /api/customer/master-passengers` - Create new master passenger
- `GET /api/customer/master-passengers/:id` - Get specific master passenger
- `PUT /api/customer/master-passengers/:id` - Update master passenger
- `DELETE /api/customer/master-passengers/:id` - Delete (deactivate) master passenger

All endpoints require customer authentication (role: CUS).

## Sample Data
The following test passengers are available for customer CUS002:
1. **Rajesh Kumar** - Male, 35, Lower berth, Aadhaar ID
2. **Priya Sharma** - Female, 28, Upper berth, PAN ID
3. **Amit Patel** - Male, 42, Middle berth, Passport ID
