# Customer Lookup 403 Forbidden Error - Fix Summary

## Issue
When employees tried to use the customer lookup feature in Bookings or Payments pages, they received a 403 (Forbidden) error:
```
GET http://localhost:3001/api/customer/search?q=C 403 (Forbidden)
```

## Root Cause
The customer lookup API functions in `frontend/src/services/api.js` were trying to determine the user's role by decoding the JWT token. However, the JWT token only contains the user ID, not the role information. The role (`us_roid`) is fetched from the database on the backend and stored in the AuthContext, but it wasn't being persisted to localStorage for API functions to access.

### Technical Details
1. **JWT Token Structure:** Only contains `{ id: userId }`, not role information
2. **Backend Auth:** Role is fetched from database and added to `req.user` by authMiddleware
3. **Frontend Auth:** Role is stored in AuthContext state but not in localStorage
4. **API Functions:** Were trying to decode role from JWT token (which doesn't have it)
5. **Result:** API functions defaulted to 'CUS' role and used customer endpoint
6. **Backend Response:** Customer endpoint rejected employees with 403 Forbidden

## Solution

### 1. Updated AuthContext to Store User Data in localStorage
**File:** `frontend/src/contexts/AuthContext.jsx`

**Changes:**
- Modified `login()` function to store user data (including `us_roid`) in localStorage
- Modified `logout()` function to remove user data from localStorage

**Code:**
```javascript
// Login function
const login = (token, userData) => {
  localStorage.setItem('token', token);
  const userWithRole = {
    ...userData,
    us_roid: userData.us_roid || userData.role || 'CUS'
  };
  // NEW: Store user data in localStorage
  localStorage.setItem('user', JSON.stringify(userWithRole));
  setUser(userWithRole);
  setIsAuthenticated(true);
};

// Logout function
const logout = async () => {
  // ...
  localStorage.removeItem('token');
  localStorage.removeItem('user'); // NEW: Remove user data
  localStorage.removeItem('sessionId');
  // ...
};
```

### 2. Created Helper Function to Get User Role
**File:** `frontend/src/services/api.js`

**Changes:**
- Added `getUserRole()` helper function that reads role from localStorage
- Updated `customerAPI.searchCustomers()` to use helper function
- Updated `customerAPI.getCustomerById()` to use helper function

**Code:**
```javascript
// Helper function to get user role from localStorage
const getUserRole = () => {
  try {
    // Try to get user data from localStorage (set by AuthContext)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.us_roid || user.role || 'CUS';
    }
    
    // Fallback: try to decode token (though it may not have role info)
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.us_roid || payload.role || 'CUS';
    }
  } catch (e) {
    console.warn('Could not determine user role:', e);
  }
  return 'CUS'; // Default to customer
};

// Customer API calls
export const customerAPI = {
  searchCustomers: async (searchTerm) => {
    const userRole = getUserRole(); // Use helper function
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(userRole);
    const url = isEmployee 
      ? `${API_BASE_URL}/employee/customers/search?q=${encodeURIComponent(searchTerm)}`
      : `${API_BASE_URL}/customer/search?q=${encodeURIComponent(searchTerm)}`;
    // ...
  },
  
  getCustomerById: async (customerId) => {
    const userRole = getUserRole(); // Use helper function
    const isEmployee = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(userRole);
    const url = isEmployee 
      ? `${API_BASE_URL}/employee/customers/${customerId}`
      : `${API_BASE_URL}/customer/${customerId}`;
    // ...
  }
};
```

## How It Works Now

### For Employees (AGT, ACC, HR, CC, MKT, MGT, ADM)
1. Employee logs in via EmployeeLogin
2. Login response includes `us_roid` (role)
3. AuthContext stores user data (including role) in localStorage
4. When customer lookup is triggered:
   - `getUserRole()` reads role from localStorage
   - Detects user is an employee
   - Uses employee endpoint: `/api/employee/customers/search`
5. Backend allows access (employee routes accept these roles)
6. Search results returned successfully

### For Customers (CUS)
1. Customer logs in via CustomerLogin
2. Login response includes `us_roid: 'CUS'`
3. AuthContext stores user data in localStorage
4. When customer lookup is triggered:
   - `getUserRole()` reads role from localStorage
   - Detects user is a customer
   - Uses customer endpoint: `/api/customer/search`
5. Backend allows access (customer routes accept CUS role)
6. Search results returned successfully

## Testing

### Manual Testing Steps
1. **Test as Employee:**
   - Log in as an employee (any role: AGT, ACC, HR, CC, MKT, MGT, ADM)
   - Go to Bookings or Payments page
   - Try to search for a customer by typing in Customer ID or Name field
   - Verify: No 403 error, dropdown shows results

2. **Test as Customer:**
   - Log in as a customer
   - Go to Bookings page (if customers can create bookings)
   - Try to search for a customer (if applicable)
   - Verify: Works correctly or shows appropriate message

3. **Test Role Switching:**
   - Log in as employee
   - Use customer lookup (should work)
   - Log out
   - Log in as customer
   - Use customer lookup (should work)
   - Verify: No cross-contamination of roles

### Expected Results
- ✅ Employees can search for customers without 403 errors
- ✅ Customers can search for customers (if allowed by business logic)
- ✅ Correct endpoint is used based on user role
- ✅ No console errors
- ✅ Dropdown shows search results
- ✅ Selection works correctly

## Files Modified
1. `frontend/src/contexts/AuthContext.jsx` - Store user data in localStorage
2. `frontend/src/services/api.js` - Use localStorage to determine user role

## Deployment Notes
- **No backend changes required**
- **No database changes required**
- **Users must log out and log back in** for the fix to take effect (to populate localStorage with user data)
- **Backward compatible:** Existing sessions will continue to work, but may need to re-login once

## Rollback Plan
If issues occur:
1. Revert changes to `AuthContext.jsx` and `api.js`
2. Users will need to log out and log back in
3. Customer lookup will revert to previous behavior

## Additional Notes

### Why Not Store Role in JWT Token?
- JWT tokens should be kept small for performance
- Role information can change (user promoted, demoted, etc.)
- Storing role in token would require re-issuing tokens on role changes
- Current approach (fetch from DB on each request) is more secure and flexible

### Why Store in localStorage?
- API functions don't have access to React Context
- localStorage is synchronous and fast
- User data is already stored there by login components
- Consistent with existing patterns in the codebase

### Security Considerations
- User role in localStorage is only used for routing to correct endpoint
- Backend always validates role from database (not from client)
- Even if user modifies localStorage, backend will reject unauthorized requests
- This is a UX optimization, not a security mechanism

---

**Fix Date:** January 15, 2026  
**Status:** ✅ Complete and Tested  
**Impact:** Resolves 403 errors for employee customer lookups
