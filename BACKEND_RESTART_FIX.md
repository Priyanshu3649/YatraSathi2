# Backend Restart Fix - Employee Creation

## Date: November 23, 2025

## Issue
After fixing the `Sequelize.Op` import error in the code, the error persisted:
```
Cannot read properties of undefined (reading 'Op')
POST http://localhost:5003/api/employees 500 (Internal Server Error)
```

## Root Cause
**Node.js caches required modules**. Even though the code was fixed, the backend server was still running with the old cached version of the module.

## Solution
**Restart the backend server** to reload all modules with the updated code.

### Steps Taken
1. Stopped the backend process (processId: 8)
2. Waited for clean shutdown
3. Started a new backend process (processId: 9)
4. Verified server started successfully
5. Tested employee creation - **SUCCESS!**

## Test Results

### Before Restart
```
❌ Error: Cannot read properties of undefined (reading 'Op')
❌ Status: 500 Internal Server Error
```

### After Restart
```
✅ Employee created successfully!
✅ Status: 200 OK
✅ Response:
{
  "user": {
    "us_usid": "EMP395133",
    "us_fname": "Test Employee",
    "us_email": "test.employee@example.com",
    "us_phone": "1234567890",
    "us_aadhaar": "123456789012",
    "us_usertype": "employee",
    "us_roid": "AGT",
    "us_coid": "TRV",
    "us_active": 1
  },
  "employee": {
    "em_usid": "EMP395133",
    "em_empno": "E6930133",
    "em_designation": "Executive",
    "em_dept": "Operations",
    "em_salary": 50000,
    "em_joindt": "2025-01-01T00:00:00.000Z",
    "em_status": "ACTIVE",
    "em_address": "Test Address",
    "em_city": "Mumbai",
    "em_state": "Maharashtra",
    "em_pincode": "400001"
  }
}
```

## Why Restart Was Needed

### Node.js Module Caching
Node.js caches modules when they are first `require()`d:
1. First time: Module is loaded and cached
2. Subsequent times: Cached version is returned
3. File changes: Cache is NOT automatically updated
4. Server restart: Cache is cleared, modules reloaded

### The Fix Applied
```javascript
// BEFORE (in employeeController.js)
const { User, Employee, Booking, CorporateCustomer, Login, Sequelize } = require('../models');
// Later in code:
[Sequelize.Op.or]: [...]  // ❌ Sequelize was undefined

// AFTER
const { User, Employee, Booking, CorporateCustomer, Login } = require('../models');
const { Op } = require('sequelize');
// Later in code:
[Op.or]: [...]  // ✅ Op is properly imported
```

### Why Old Code Kept Running
1. Code was fixed in the file
2. But server was still running
3. Server had cached the old module
4. New code wasn't loaded until restart

## Important Lesson

### Always Restart After Backend Changes
When you modify backend code, you must restart the server:

```bash
# Method 1: Stop and start manually
# Press Ctrl+C in the terminal running the server
npm start

# Method 2: Use nodemon for auto-restart (recommended for development)
npm install -g nodemon
nodemon src/server.js

# Method 3: Use npm script with nodemon
# In package.json:
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js"
}
# Then run:
npm run dev
```

## When to Restart

### Backend Changes That Require Restart
- ✅ Modifying controller files
- ✅ Modifying route files
- ✅ Modifying middleware files
- ✅ Modifying model files
- ✅ Modifying utility files
- ✅ Changing environment variables
- ✅ Installing new npm packages

### Frontend Changes (No Restart Needed)
- ❌ React components (Vite hot-reloads automatically)
- ❌ CSS files (Vite hot-reloads automatically)
- ❌ JSX files (Vite hot-reloads automatically)

## Verification Steps

### 1. Check Server is Running
```bash
# Check if process is running
ps aux | grep node

# Check if port is listening
lsof -i :5003
```

### 2. Test Employee Creation
```bash
curl -X POST http://localhost:5003/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Employee",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "employee123",
    "aadhaarNumber": "123456789012",
    "department": "Operations",
    "designation": "Executive",
    "salary": 50000,
    "joinDate": "2025-01-01",
    "address": "Test Address",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }'
```

### 3. Check Response
- Status should be 200 or 201
- Response should contain user and employee objects
- No error messages

## Recommended Development Setup

### Use Nodemon for Auto-Restart
```bash
# Install nodemon globally
npm install -g nodemon

# Or install as dev dependency
npm install --save-dev nodemon

# Update package.json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}

# Run in development mode
npm run dev
```

### Benefits of Nodemon
- ✅ Automatically restarts server on file changes
- ✅ No manual restart needed
- ✅ Faster development workflow
- ✅ Catches errors immediately

## Current Status

### ✅ All Systems Working
1. Backend server restarted successfully
2. Employee creation working correctly
3. Sequelize.Op error resolved
4. Department and Designation dropdowns working
5. Navigation text color fixed to black
6. Travel Plans API fixed

### Test Employee Created
- **ID**: EMP395133
- **Name**: Test Employee
- **Email**: test.employee@example.com
- **Department**: Operations
- **Designation**: Executive
- **Status**: ACTIVE

## Conclusion

The code fix was correct, but the server needed to be restarted to load the updated code. Always remember to restart the backend server after making changes to backend files.

For a better development experience, consider using `nodemon` to automatically restart the server on file changes.

---

**Status**: ✅ Complete  
**Backend**: Running on port 5003  
**Employee Creation**: Working  
**Issue**: Resolved
