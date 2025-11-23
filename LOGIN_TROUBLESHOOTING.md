# Login Troubleshooting Guide

## Issue
Unable to login with default admin credentials (admin@example.com / admin123)

## Verification Steps

### 1. Check Database
```bash
# Verify admin user exists
sqlite3 database.sqlite "SELECT us_usid, us_fname, us_email, us_usertype, us_active FROM usUser WHERE us_email = 'admin@example.com';"
# Expected: ADM001|Admin|admin@example.com|admin|1

# Verify login credentials exist
sqlite3 database.sqlite "SELECT lg_usid, lg_email, lg_active FROM lgLogin WHERE lg_email = 'admin@example.com';"
# Expected: ADM001|admin@example.com|1
```

**Status**: ✅ Database records exist and are correct

### 2. Check Backend Server
```bash
# Test login endpoint directly
curl -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Expected Response**:
```json
{
  "id": "ADM001",
  "name": "Admin",
  "email": "admin@example.com",
  "us_usertype": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionId": "...",
  "message": "Login successful"
}
```

**Status**: ✅ Backend API is working correctly

### 3. Check Frontend Configuration
```javascript
// frontend/src/services/api.js
const API_BASE_URL = 'http://localhost:5003/api';
```

**Status**: ✅ Frontend is configured to connect to correct backend URL

### 4. Check CORS Configuration
```javascript
// src/server.js
app.use(cors()); // Allows all origins
```

**Status**: ✅ CORS is enabled for all origins

## Common Issues & Solutions

### Issue 1: Backend Server Not Running
**Symptoms**: Network error, "Failed to fetch"
**Solution**:
```bash
cd /path/to/YatraSathi
npm start
```

### Issue 2: Frontend Server Not Running
**Symptoms**: Cannot access http://localhost:5173
**Solution**:
```bash
cd /path/to/YatraSathi/frontend
npm run dev
```

### Issue 3: Wrong Port
**Symptoms**: Connection refused
**Check**:
- Backend should run on port 5003
- Frontend should run on port 5173 (Vite default)

### Issue 4: Browser Cache
**Symptoms**: Old code running, changes not reflected
**Solution**:
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Clear browser cache
- Open in incognito/private window

### Issue 5: Token Issues
**Symptoms**: Login appears successful but redirects back to login
**Solution**:
```javascript
// Clear localStorage
localStorage.clear();
// Try logging in again
```

### Issue 6: Password Mismatch
**Symptoms**: "Invalid credentials" error
**Solution**:
```bash
# Reset admin password in database
sqlite3 database.sqlite
# Then run seed script
node src/scripts/seed.js
```

## Testing Login Flow

### Method 1: Use Test HTML File
1. Open `test_frontend_login.html` in browser
2. Click "Test Login" button
3. Check if login is successful

### Method 2: Use Browser Console
```javascript
// Open browser console (F12)
// Paste this code:

fetch('http://localhost:5003/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  })
})
.then(res => res.json())
.then(data => console.log('Login response:', data))
.catch(err => console.error('Login error:', err));
```

### Method 3: Use Frontend Application
1. Navigate to http://localhost:5173/login
2. Enter credentials:
   - Email: admin@example.com
   - Password: admin123
3. Click "Login" button
4. Check browser console (F12) for errors

## Debugging Steps

### 1. Check Browser Console
- Open Developer Tools (F12)
- Go to Console tab
- Look for errors (red text)
- Check Network tab for failed requests

### 2. Check Backend Logs
```bash
# Backend logs show all incoming requests
# Look for POST /api/auth/login
# Check for any error messages
```

### 3. Check Network Requests
- Open Developer Tools (F12)
- Go to Network tab
- Try logging in
- Look for `/api/auth/login` request
- Check:
  - Request URL
  - Request Method (should be POST)
  - Request Headers
  - Request Payload
  - Response Status
  - Response Data

### 4. Verify Environment
```bash
# Check if both servers are running
ps aux | grep node

# Check ports
lsof -i :5003  # Backend
lsof -i :5173  # Frontend
```

## Current Status

### ✅ Working Components
- Database has correct admin user
- Backend API responds correctly to login requests
- Frontend code is correct
- CORS is properly configured

### ❓ Possible Issues
1. **Browser Issue**: Try different browser or incognito mode
2. **Cache Issue**: Clear browser cache and localStorage
3. **Network Issue**: Check if localhost is accessible
4. **Port Conflict**: Ensure ports 5003 and 5173 are not blocked

## Quick Fix Steps

### Step 1: Restart Everything
```bash
# Stop all processes
# Ctrl+C in both terminal windows

# Start backend
cd /path/to/YatraSathi
npm start

# Start frontend (in new terminal)
cd /path/to/YatraSathi/frontend
npm run dev
```

### Step 2: Clear Browser Data
1. Open browser
2. Press Ctrl+Shift+Delete (Windows/Linux) or Cmd+Shift+Delete (Mac)
3. Clear:
   - Cached images and files
   - Cookies and site data
4. Close and reopen browser

### Step 3: Test Login
1. Navigate to http://localhost:5173/login
2. Open Developer Tools (F12)
3. Go to Console tab
4. Enter credentials and click Login
5. Watch for any errors in console

### Step 4: Check Response
If login fails, check:
- Console for JavaScript errors
- Network tab for failed requests
- Backend logs for error messages

## Contact Information

If issue persists after trying all steps:
1. Check browser console for specific error message
2. Check backend logs for error details
3. Verify both servers are running
4. Try test HTML file to isolate issue

## Additional Resources

- Backend API: http://localhost:5003/api
- Frontend App: http://localhost:5173
- Test File: test_frontend_login.html
- Database: database.sqlite

---

**Last Updated**: November 21, 2025
**Status**: Investigating login issue
