# Security Module Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend server running on port 5003
2. TVL_001 database connected
3. User logged in with admin privileges

### Test Sequence

#### Phase 1: Basic Module Access
1. **Login to Admin Panel**
   - Navigate to http://localhost:5003/admin
   - Login with admin credentials

2. **Verify Navigation**
   - Click on "Security" section in left sidebar
   - Verify all 7 modules are visible:
     - ✓ Application
     - ✓ Module
     - ✓ Operation
     - ✓ Role List
     - ✓ User List
     - ✓ Role Permission
     - ✓ User Permission

3. **Verify Top Menu Bar**
   - All 7 modules should be clickable in top menu
   - Clicking should switch active module

---

#### Phase 2: Application Module Testing

**Test 1: View Applications**
1. Click "Application" in navigation
2. Verify table loads with existing applications
3. Check columns: ID, Short Name, Description, Active, Entered On, Modified On

**Test 2: Create New Application**
1. Click "New" button
2. Enter:
   - Application ID: `YS` (max 4 chars)
   - Short Name: `YatraSathi`
   - Description: `YatraSathi Travel Management System`
   - Check "Active"
3. Click "Save"
4. Verify record appears in table
5. Verify audit trail shows "Entered By" with your user ID

**Test 3: Edit Application**
1. Select the application you just created
2. Click "Edit"
3. Modify Description
4. Click "Save"
5. Verify "Modified On" and "Modified By" are updated

**Test 4: Filter Applications**
1. Enter text in "Short Name" filter
2. Verify table filters in real-time
3. Select "Active" status filter
4. Verify only active records show
5. Click "Clear Filters"

---

#### Phase 3: Module Testing (with Cascading)

**Test 1: Create Module**
1. Click "Module" in navigation
2. Click "New"
3. Select Application from dropdown (should show "YS - YatraSathi")
4. Enter:
   - Module ID: `BK` (max 4 chars)
   - Short Name: `Bookings`
   - Description: `Booking Management Module`
   - Group: `Operations`
   - Check "Ready" and "Active"
5. Click "Save"

**Test 2: Verify Cascading Filter**
1. Use "Application" filter in right panel
2. Select "YS"
3. Verify only modules for YS application show

---

#### Phase 4: Operation Testing (with Double Cascading)

**Test 1: Create Operation**
1. Click "Operation" in navigation
2. Click "New"
3. Select Application: `YS`
4. Module dropdown should now show only YS modules
5. Select Module: `BK`
6. Enter:
   - Operation ID: `01` (max 4 chars)
   - Short Name: `View Bookings`
   - Description: `View booking list`
   - Check "Ready", "Secure", and "Active"
7. Click "Save"
8. Note the computed Full Operation ID: `YSBK01`

**Test 2: Create More Operations**
Create these operations for testing permissions:
- `YSBK02` - New Booking
- `YSBK03` - Edit Booking
- `YSBK04` - Delete Booking

---

#### Phase 5: Role List Testing

**Test 1: Create Roles**
1. Click "Role List" in navigation
2. Create these roles:
   - Role ID: `SALES`, Short Name: `Sales Manager`
   - Role ID: `OPSTL`, Short Name: `Operations Team Lead`
   - Role ID: `AGENT`, Short Name: `Travel Agent`

---

#### Phase 6: User List Testing

**Test 1: Create Test User**
1. Click "User List" in navigation
2. Click "New"
3. Enter:
   - User ID: `TEST01`
   - Email: `test@yatrasathi.com`
   - User Name: `Test User`
   - Job Title: `Test Agent`
   - Phone: `9876543210`
   - Check "Active"
4. Click "Save"

**Test 2: Create Admin User**
1. Create another user
2. Check "Is Application Administrator"
3. Verify admin flag is set

---

#### Phase 7: Role Permission Testing

**Test 1: Assign Permissions to Role**
1. Click "Role Permission" in navigation
2. Click "New"
3. Select Role: `SALES - Sales Manager`
4. Select Operation: `YSBK01 - View Bookings`
5. Check "Allow"
6. Check "Active"
7. Click "Save"
8. **Verify:** Permission shows in GREEN with "Allow"

**Test 2: Create Deny Permission**
1. Click "New"
2. Select Role: `AGENT - Travel Agent`
3. Select Operation: `YSBK04 - Delete Booking`
4. UNCHECK "Allow" (to deny)
5. Check "Active"
6. Click "Save"
7. **Verify:** Permission shows in RED with "Deny"

**Test 3: Assign Multiple Permissions**
Create these for SALES role:
- YSBK01 - Allow (View)
- YSBK02 - Allow (New)
- YSBK03 - Allow (Edit)
- YSBK04 - Deny (Delete)

---

#### Phase 8: User Permission Testing

**Test 1: Override Role Permission**
1. Click "User Permission" in navigation
2. Click "New"
3. Select User: `TEST01 - Test User`
4. Select Operation: `YSBK04 - Delete Booking`
5. Check "Allow" (overriding role deny)
6. Check "Active"
7. Click "Save"
8. **Verify:** Shows in GREEN

**Test 2: Verify Color Coding**
- Allow permissions should be GREEN
- Deny permissions should be RED
- Table should show "Allow" or "Deny" text

---

#### Phase 9: Filter Testing

**Test Each Module's Filters:**

1. **Application Module**
   - Application ID filter (text search)
   - Short Name filter (text search)
   - Active Status filter (dropdown)

2. **Module Module**
   - Application filter (dropdown - cascading)
   - Module ID filter
   - Short Name filter
   - Group filter
   - Active Status filter

3. **Operation Module**
   - Application filter (dropdown)
   - Module filter (dropdown - cascading)
   - Operation ID filter
   - Short Name filter
   - Active Status filter

4. **Role Permission Module**
   - Permission Type filter (All/Allow/Deny)
   - Active Status filter

5. **User Permission Module**
   - Permission Type filter (All/Allow/Deny)
   - Active Status filter

---

#### Phase 10: Navigation Testing

**Test Record Navigation:**
1. Select any module with multiple records
2. Select first record
3. Click "Next" button - should move to next record
4. Click "Last" button - should jump to last record
5. Click "Previous" button - should move back
6. Click "First" button - should jump to first record
7. Verify buttons are disabled at boundaries

**Test Page Navigation:**
1. If more than 100 records exist
2. Use page navigation in status bar
3. Verify "Page X/Y" display
4. Test First Page, Previous, Next, Last Page buttons

---

#### Phase 11: Audit Trail Testing

**Verify Audit Fields:**
1. Create a new record in any module
2. Check bottom of form shows:
   - Entered On: Current date/time
   - Entered By: Your user ID
3. Edit the record
4. Check:
   - Modified On: Updated date/time
   - Modified By: Your user ID
5. Verify all fields are read-only

---

#### Phase 12: Data Validation Testing

**Test Required Fields:**
1. Click "New" in any module
2. Try to save without filling required fields (marked with *)
3. Verify validation errors

**Test Field Lengths:**
1. Try entering more than max length in:
   - Application ID (4 chars)
   - Module ID (4 chars)
   - Operation ID (4 chars)
   - Role ID (6 chars)
2. Verify maxLength attribute prevents over-entry

**Test Email Validation:**
1. In User List, enter invalid email
2. Verify HTML5 validation

---

## Expected Results Summary

### ✅ All Tests Should Pass:
- [x] All 7 modules load without errors
- [x] Forms display all fields correctly
- [x] Dropdowns populate with data
- [x] Cascading dropdowns filter properly
- [x] CRUD operations work (Create, Read, Update, Delete)
- [x] Filters work in real-time
- [x] Color coding displays (Green=Allow, Red=Deny)
- [x] Audit trail auto-populates
- [x] Navigation buttons work
- [x] Pagination works
- [x] No console errors
- [x] UI matches existing admin panel style

---

## Common Issues & Solutions

### Issue: Dropdowns are empty
**Solution:** Check that backend endpoints are returning data. Verify:
- `/api/security/applications`
- `/api/security/modules`
- `/api/permissions`
- `/api/permissions/roles`
- `/api/security/users`

### Issue: Cascading dropdown not filtering
**Solution:** Verify parent dropdown has a value selected first. Module dropdown only filters when Application is selected.

### Issue: Save button disabled
**Solution:** Click "New" or "Edit" first to enable editing mode.

### Issue: Audit trail not showing
**Solution:** Verify database records have audit fields populated (edtm, eby, mdtm, mby).

### Issue: Color coding not showing
**Solution:** Check that fp_allow or up_allow fields are present in the data and are 0 or 1.

### Issue: Filters not working
**Solution:** Verify filter field names match the data field names. Check console for errors.

---

## Performance Testing

### Load Testing:
1. Create 100+ records in a module
2. Verify pagination works
3. Test filter performance with large dataset
4. Verify table scrolling is smooth

### Concurrent Testing:
1. Open multiple browser tabs
2. Edit different records simultaneously
3. Verify no data conflicts

---

## Browser Compatibility

Test in:
- [x] Chrome/Edge (Chromium)
- [x] Firefox
- [x] Safari (if on Mac)

---

## Final Verification

Before marking complete, verify:
1. All 7 modules accessible
2. All CRUD operations work
3. All filters work
4. All dropdowns populate
5. Cascading works correctly
6. Color coding displays
7. Audit trail populates
8. No console errors
9. No network errors
10. UI is responsive and matches theme

---

## Success Criteria

✅ **PASS:** All tests complete without errors
✅ **PASS:** All features work as specified
✅ **PASS:** UI matches existing admin panel style
✅ **PASS:** No console errors or warnings
✅ **PASS:** Performance is acceptable

---

## Report Issues

If any test fails, document:
1. Module name
2. Test step number
3. Expected result
4. Actual result
5. Console errors (if any)
6. Network errors (if any)
7. Screenshots (if applicable)

---

**Testing Status:** Ready for User Acceptance Testing (UAT)
**Estimated Testing Time:** 30-45 minutes for complete test suite
