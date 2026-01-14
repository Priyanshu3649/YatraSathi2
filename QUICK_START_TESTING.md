# Quick Start Testing Guide - Login Redesign & Forgot Password

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Servers

**Terminal 1 - Backend:**
```bash
node src/server.js
```
Wait for: `✅ Server running on http://127.0.0.1:5003`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Wait for: `Local: http://localhost:3002/`

### Step 2: Open Browser
```
http://localhost:3002/login
```

### Step 3: Test New Login Page
- ✅ See vintage ERP theme
- ✅ See title bar with controls
- ✅ See menu bar
- ✅ See info panels
- ✅ See status bar
- ✅ See "Forgot your password?" link

### Step 4: Test Forgot Password
1. Click "Forgot your password?" link
2. Enter: `admin@example.com`
3. Click "Send Reset Link"
4. Copy the reset token shown
5. Click "Reset Password Now"

### Step 5: Test Reset Password
1. Paste the token
2. Enter new password: `NewPassword123`
3. Confirm password: `NewPassword123`
4. Click "Reset Password"
5. Wait for auto-redirect (3 seconds)

### Step 6: Test Login with New Password
1. Email: `admin@example.com`
2. Password: `NewPassword123`
3. Click "Login"
4. ✅ Should login successfully

---

## 🧪 Automated Testing

### Run Test Script
```bash
node test-password-reset.js
```

**Expected Output:**
```
✓ Backend server is running
✓ Password reset request successful
✓ Password reset successful
✓ Login successful with new password
✓ Token reuse blocked (Expected behavior)
✓ Invalid token rejected (Expected behavior)
✓ Invalid email rejected (Expected behavior)
✓ All password reset tests completed successfully!
```

---

## 📋 Manual Testing Checklist

### Login Page Visual Test
- [ ] Title bar displays correctly
- [ ] Menu bar shows File, Edit, View, Help
- [ ] Form panel has proper styling
- [ ] Info panel shows system information
- [ ] Status bar displays at bottom
- [ ] Buttons have 3D effect
- [ ] Inputs have inset borders
- [ ] Links are blue and underline on hover
- [ ] Responsive on mobile

### Forgot Password Test
- [ ] Navigate to /forgot-password
- [ ] Page has vintage ERP theme
- [ ] Email input works
- [ ] Submit button works
- [ ] Error shows for invalid email
- [ ] Success message displays
- [ ] Reset token shown (dev mode)
- [ ] Info panels display help
- [ ] Links work correctly

### Reset Password Test
- [ ] Navigate to /reset-password
- [ ] Page has vintage ERP theme
- [ ] Token input works
- [ ] Password inputs work
- [ ] Validation works (min 6 chars)
- [ ] Password match validation works
- [ ] Submit button works
- [ ] Success message displays
- [ ] Auto-redirect works (3 seconds)
- [ ] Info panels show requirements

### Error Handling Test
- [ ] Invalid email shows error
- [ ] Invalid token shows error
- [ ] Expired token shows error
- [ ] Password mismatch shows error
- [ ] Short password shows error
- [ ] Empty fields show error
- [ ] Server errors handled gracefully

### Security Test
- [ ] Token expires after 1 hour
- [ ] Token can only be used once
- [ ] Password is hashed
- [ ] Token is hashed in database
- [ ] Old password doesn't work
- [ ] New password works

---

## 🎯 Test Scenarios

### Scenario 1: Happy Path
```
1. Go to login page
2. Click "Forgot your password?"
3. Enter valid email
4. Get reset token
5. Go to reset password page
6. Enter token and new password
7. Submit form
8. Get redirected to login
9. Login with new password
✅ Success
```

### Scenario 2: Invalid Email
```
1. Go to forgot password page
2. Enter: nonexistent@example.com
3. Submit form
❌ Error: "User not found"
```

### Scenario 3: Invalid Token
```
1. Go to reset password page
2. Enter: invalid_token_123
3. Enter new password
4. Submit form
❌ Error: "Invalid or expired reset token"
```

### Scenario 4: Password Mismatch
```
1. Go to reset password page
2. Enter valid token
3. Password: Password123
4. Confirm: DifferentPassword
5. Submit form
❌ Error: "Passwords do not match"
```

### Scenario 5: Short Password
```
1. Go to reset password page
2. Enter valid token
3. Password: 12345
4. Confirm: 12345
5. Submit form
❌ Error: "Password must be at least 6 characters long"
```

### Scenario 6: Token Reuse
```
1. Complete password reset successfully
2. Try to use same token again
❌ Error: "Invalid or expired reset token"
```

---

## 🔍 Visual Inspection

### Desktop (> 768px)
- [ ] Two-column layout
- [ ] Main panel on left
- [ ] Info panel on right
- [ ] Proper spacing
- [ ] All elements visible

### Tablet (768px - 480px)
- [ ] Single column layout
- [ ] Info panel on top
- [ ] Main panel below
- [ ] Proper spacing
- [ ] All elements visible

### Mobile (< 480px)
- [ ] Single column layout
- [ ] Compact spacing
- [ ] Stacked buttons
- [ ] Readable text
- [ ] Touch-friendly

---

## 🎨 Style Verification

### Colors
- [ ] Title bar: Blue gradient
- [ ] Window: Beige (#ece9d8)
- [ ] Panels: Light grey (#f0f0f0)
- [ ] Inputs: White
- [ ] Primary button: Royal blue
- [ ] Error box: Red border
- [ ] Success box: Green border

### Typography
- [ ] Font: Segoe UI/Tahoma
- [ ] Title: 18px bold
- [ ] Labels: 12px bold
- [ ] Inputs: 12px
- [ ] Buttons: 12px bold
- [ ] Menu: 11px
- [ ] Status: 11px

### Layout
- [ ] No rounded corners
- [ ] Inset borders on inputs
- [ ] 3D effect on buttons
- [ ] Hard shadows (4px offset)
- [ ] Proper spacing
- [ ] Dense layout

---

## 🐛 Common Issues & Solutions

### Issue: Styling not showing
**Solution:**
```bash
# Clear browser cache
Ctrl + Shift + R (hard refresh)

# Or clear cache in DevTools
F12 → Network → Disable cache
```

### Issue: Backend not responding
**Solution:**
```bash
# Check if server is running
curl http://localhost:5003/api/auth/test

# Restart server
Ctrl + C
node src/server.js
```

### Issue: Frontend not loading
**Solution:**
```bash
# Restart frontend
Ctrl + C
cd frontend
npm run dev
```

### Issue: Token not working
**Solution:**
- Check token hasn't expired (1 hour)
- Ensure token copied correctly
- Request new reset link

### Issue: Database error
**Solution:**
```bash
# Check database connection
# Verify .env file has correct credentials
# Restart MySQL service
```

---

## 📊 Performance Check

### Page Load Time
- [ ] Login page loads < 1 second
- [ ] Forgot password page loads < 1 second
- [ ] Reset password page loads < 1 second

### API Response Time
- [ ] Login API responds < 500ms
- [ ] Reset request API responds < 500ms
- [ ] Reset password API responds < 500ms

### Build Time
- [ ] Frontend builds in < 1 minute
- [ ] No build errors
- [ ] No console warnings

---

## ✅ Acceptance Criteria

### Must Have
- [x] Login page has vintage ERP theme
- [x] Forgot password link works
- [x] Password reset flow works
- [x] Token validation works
- [x] Error handling works
- [x] Success feedback works
- [x] Responsive design works
- [x] Security measures work

### Should Have
- [x] Info panels with help
- [x] Status bar with info
- [x] Menu bar for consistency
- [x] Title bar with controls
- [x] Field hints
- [x] Loading states
- [x] Auto-redirect

### Nice to Have
- [ ] Email integration (future)
- [ ] Rate limiting (future)
- [ ] Email templates (future)
- [ ] 2FA support (future)

---

## 🎯 Test Results Template

```
Date: _______________
Tester: _______________

Login Page Visual:        [ ] Pass  [ ] Fail
Forgot Password Flow:     [ ] Pass  [ ] Fail
Reset Password Flow:      [ ] Pass  [ ] Fail
Error Handling:           [ ] Pass  [ ] Fail
Security Measures:        [ ] Pass  [ ] Fail
Responsive Design:        [ ] Pass  [ ] Fail
Performance:              [ ] Pass  [ ] Fail

Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Notes:
___________________________________________________
___________________________________________________
___________________________________________________

Overall Status:  [ ] Approved  [ ] Needs Work
```

---

## 📞 Support

### Need Help?
- Check `FORGOT_PASSWORD_IMPLEMENTATION.md` for details
- Check `LOGIN_REDESIGN_SUMMARY.md` for overview
- Check `VISUAL_COMPARISON.md` for design details
- Run `node test-password-reset.js` for automated tests

### Report Issues
- Document the issue
- Include screenshots
- Note browser and OS
- Provide steps to reproduce

---

## 🎉 Success!

If all tests pass, you're ready to:
1. ✅ Deploy to staging
2. ✅ Conduct user acceptance testing
3. ✅ Integrate email service
4. ✅ Deploy to production

---

**Testing Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Ready for Testing

