# Booking Workflow Fixes - Implementation Guide

## Quick Reference: Code Changes Required

### 1. STATUS FIELD FIX (CRITICAL)

#### File: `src/controllers/bookingController.js`
**Change**: Accept status from request body instead of hardcoding to 'DRAFT'

```javascript
// BEFORE (Line 130)
bk_status: 'DRAFT',

// AFTER
bk_status: req.body.status || 'DRAFT',
```

#### File: `frontend/src/pages/Bookings.jsx`
**Change**: Normalize status values before sending to backend

```javascript
// ADD this function before handleSave (around line 250)
const normalizeStatus = (status) => {
  const statusMap = {
    'Draft': 'DRAFT',
    'Confirmed': 'CONFIRMED',
    'Waitlisted': 'PENDING',
    'Cancelled': 'CANCELLED'
  };
  return statusMap[status] || 'DRAFT';
};

// MODIFY handleSave() around line 269
const bookingData = {
  ...formData,
  passengerList: activePassengers,
  totalPassengers: activePassengers.length,
  phoneNumber: phoneValidation.cleanPhone,
  customerName: formData.customerName.trim(),
  internalCustomerId: formData.internalCustomerId || null,
  fromStation: formData.fromStation,
  toStation: formData.toStation,
  travelDate: formData.travelDate,
  travelClass: formData.travelClass,
  berthPreference: formData.berthPreference,
  quotaType: formData.quotaType,
  remarks: formData.remarks,
  status: normalizeStatus(formData.status),  // ✓ ADD THIS LINE
  createdOn: formData.createdOn || new Date().toISOString(),
  createdBy: formData.createdBy || user?.us_name || 'system',
  modifiedBy: user?.us_name || 'system',
  modifiedOn: new Date().toISOString()
};
```

#### File: `frontend/src/pages/Bookings.jsx`
**Change**: Update status select options to match backend values

```javascript
// BEFORE (Line 1848-1852)
<select
  name="status"
  data-field="status"
  className="erp-input"
  value={formData.status}
  onChange={handleInputChange}
  onFocus={() => handleFieldFocus('status')}
  onKeyDown={(e) => handleEnhancedTabNavigation(e, 'status')}
  disabled={!isEditing}
>
  <option value="Draft">Draft</option>
  <option value="Confirmed">Confirmed</option>
  <option value="Waitlisted">Waitlisted</option>
  <option value="Cancelled">Cancelled</option>
</select>

// AFTER - Update initial state and select options
// In formData initialization (around line 100):
status: 'DRAFT',  // Change from 'Draft' to 'DRAFT'

// In select element:
<select
  name="status"
  data-field="status"
  className="erp-input"
  value={formData.status}
  onChange={handleInputChange}
  onFocus={() => handleFieldFocus('status')}
  onKeyDown={(e) => handleEnhancedTabNavigation(e, 'status')}
  disabled={!isEditing}
>
  <option value="DRAFT">Draft</option>
  <option value="CONFIRMED">Confirmed</option>
  <option value="PENDING">Pending</option>
  <option value="CANCELLED">Cancelled</option>
</select>
```

---

### 2. PASSENGER BATCH INSERT (HIGH PRIORITY)

#### File: `src/models/Passenger.js`
**Change**: Replace sequential loop with batch insert

```javascript
// REPLACE the entire createMultiple() method (lines 180-210)

static async createMultiple(bookingId, passengers, createdBy) {
  if (!passengers || passengers.length === 0) {
    return { success: true, count: 0 };
  }

  // Filter valid passengers
  const validPassengers = passengers.filter(p => p.name && p.name.trim() !== '');
  if (validPassengers.length === 0) {
    return { success: true, count: 0 };
  }

  // Prepare batch data
  const passengerDataBatch = validPassengers.map(passenger => ({
    ps_bkid: bookingId,
    ps_fname: passenger.name || passenger.firstName || '',
    ps_lname: null,
    ps_age: parseInt(passenger.age) || 0,
    ps_gender: passenger.gender || 'M',
    ps_berthpref: passenger.berthPreference || passenger.berth || null,
    ps_berthalloc: null,
    ps_seatno: null,
    ps_coach: null,
    ps_active: 1,
    eby: createdBy || 'system',
    mby: createdBy || 'system'
  }));

  try {
    // Build batch insert query
    const placeholders = passengerDataBatch.map(() => 
      '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?)'
    ).join(',');

    const query = `
      INSERT INTO psXpassenger (
        ps_bkid, ps_fname, ps_lname, ps_age, ps_gender, 
        ps_berthpref, ps_berthalloc, ps_seatno, ps_coach, 
        ps_active, edtm, eby, mdtm, mby
      ) VALUES ${placeholders}
    `;

    // Flatten values array
    const values = passengerDataBatch.flatMap(p => [
      p.ps_bkid, p.ps_fname, p.ps_lname, p.ps_age, p.ps_gender,
      p.ps_berthpref, p.ps_berthalloc, p.ps_seatno, p.ps_coach,
      p.ps_active, p.eby, p.mby
    ]);

    // Execute batch insert
    const [result] = await db.execute(query, values);

    return {
      success: true,
      count: result.affectedRows,
      message: `${result.affectedRows} passengers created successfully`
    };
  } catch (error) {
    console.error('Error batch creating passengers:', error);
    throw new Error('Failed to create passengers: ' + error.message);
  }
}
```

---

### 3. LAZY LOAD PASSENGERS (HIGH PRIORITY)

#### File: `frontend/src/pages/Bookings.jsx`
**Change**: Add loading state and lazy load passengers

```javascript
// ADD near other state declarations (around line 450)
const [loadingPassengers, setLoadingPassengers] = useState(false);

// MODIFY handleRecordSelect() function (around line 520)
const handleRecordSelect = useCallback(async (record) => {
  setSelectedBooking(record);
  setFormData({
    bookingId: record.bk_bkid || '',
    bookingDate: record.bk_bookingdt ? new Date(record.bk_bookingdt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    customerName: record.customerName || record.bk_customername || '',
    phoneNumber: record.phoneNumber || record.bk_phonenumber || record.bk_phone || '',
    internalCustomerId: record.customerId || record.bk_customerid || record.cu_usid || '',
    totalPassengers: record.totalPassengers || 0,
    fromStation: record.fromStation?.st_stname || record.bk_fromstation || record.bk_fromst || '',
    toStation: record.toStation?.st_stname || record.bk_tostation || record.bk_tost || '',
    travelDate: record.bk_trvldt ? new Date(record.bk_trvldt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    travelClass: record.bk_class || record.bk_travelclass || '3A',
    berthPreference: record.bk_birthpreference || record.bk_berthpreference || '',
    quotaType: record.quotaType || record.bk_quotatype || '',
    remarks: record.bk_remarks || '',
    status: record.bk_status || 'DRAFT',
    createdBy: record.createdBy || record.bk_createdby || 'system',
    createdOn: record.createdOn || record.bk_createdon || new Date().toISOString(),
    modifiedBy: record.modifiedBy || record.bk_modifiedby || '',
    modifiedOn: record.modifiedOn || record.bk_modifiedon || '',
    closedBy: record.closedBy || record.bk_closedby || '',
    closedOn: record.closedOn || record.bk_closedon || ''
  });
  
  // Initialize with empty list first
  setPassengerList([]);
  setLoadingPassengers(true);  // ✓ ADD THIS
  setIsEditing(false);

  // Fetch passengers asynchronously
  bookingAPI.getBookingPassengers(record.bk_bkid || record.id)
    .then(response => {
      if (response.success && response.passengers) {
        const mappedPassengers = response.passengers.map(p => ({
          id: p.ps_psid,
          name: (p.ps_fname + ' ' + (p.ps_lname || '')).trim(),
          age: p.ps_age,
          gender: p.ps_gender,
          berthPreference: p.ps_berthpref
        }));
        setPassengerList(mappedPassengers);
      }
    })
    .catch(error => {
      console.warn('Failed to fetch passengers for selected record:', error);
    })
    .finally(() => {
      setLoadingPassengers(false);  // ✓ ADD THIS
    });
}, []);
```

#### File: `frontend/src/pages/Bookings.jsx`
**Change**: Add loading indicator in passenger grid

```javascript
// FIND the passenger grid section (around line 1750) and ADD loading indicator

// BEFORE the passenger grid:
{loadingPassengers && (
  <div style={{ 
    padding: '20px', 
    textAlign: 'center', 
    color: '#666',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '4px'
  }}>
    <div style={{ marginBottom: '10px' }}>Loading passenger details...</div>
    <div style={{ fontSize: '12px', color: '#999' }}>Please wait...</div>
  </div>
)}

{!loadingPassengers && (
  <div className="passenger-grid-container" style={{ /* existing styles */ }}>
    {/* existing passenger grid code */}
  </div>
)}
```

---

### 4. ADD STATUS UPDATE ENDPOINT (HIGH PRIORITY)

#### File: `src/controllers/bookingController.js`
**Add**: New function to update booking status

```javascript
// ADD this new function at the end of the file (before module.exports)

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['DRAFT', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'INVALID_STATUS', message: 'Invalid status value' } 
      });
    }
    
    // Find booking
    const booking = await BookingTVL.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'Booking not found' } 
      });
    }
    
    // Permission check
    if (req.user.us_roid !== 'ADM' && booking.bk_usid !== req.user.us_usid) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'Access denied' } 
      });
    }
    
    // Update status
    await booking.update({ 
      bk_status: status,
      mby: req.user.us_usid,
      mdtm: new Date()
    });
    
    res.json({ 
      success: true, 
      data: booking,
      message: `Booking status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: error.message } 
    });
  }
};

// MODIFY module.exports to include new function
module.exports = {
  createBooking,
  getCustomerBookings,
  getAllBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,  // ✓ ADD THIS
  cancelBooking,
  deleteBooking,
  assignBooking,
  approveBooking,
  confirmBooking,
  getBookingsByStatus,
  getBookingPassengers,
  searchBookings
};
```

#### File: `src/routes/bookingRoutes.js`
**Add**: Route for status update

```javascript
// ADD this route (find the PUT route section and add after updateBooking)

// Update booking status
router.put('/:id/status', authenticateToken, bookingController.updateBookingStatus);
```

---

### 5. ADD API METHOD (HIGH PRIORITY)

#### File: `frontend/src/services/api.js`
**Add**: Method to update booking status

```javascript
// FIND the bookingAPI object and ADD this method

// In bookingAPI object (around line 300):

// Update booking status
updateBookingStatus: async (id, status) => {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify({ status })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update booking status');
  }
  
  return data;
},
```

---

### 6. ADD LOADING STATE TO HEADER (MEDIUM PRIORITY)

#### File: `frontend/src/components/Header.jsx`
**Change**: Add error handling and loading state

```javascript
// MODIFY the handleLogout function

const [isLoggingOut, setIsLoggingOut] = useState(false);
const [logoutError, setLogoutError] = useState('');

const handleLogout = async () => {
  try {
    setIsLoggingOut(true);
    setLogoutError('');
    await logout();
    navigate('/login');
  } catch (error) {
    console.error('Logout failed:', error);
    setLogoutError('Logout failed. Please try again.');
  } finally {
    setIsLoggingOut(false);
  }
};

// MODIFY the logout button

<button 
  onClick={handleLogout} 
  className="btn btn-primary" 
  style={{ marginLeft: '10px' }}
  disabled={isLoggingOut}
>
  {isLoggingOut ? 'Logging out...' : 'Logout'}
</button>

{logoutError && (
  <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
    {logoutError}
  </div>
)}
```

---

## Testing Steps

### Test 1: Status Field Saving
```
1. Open Bookings page
2. Click "New Booking"
3. Fill in all required fields
4. Select Status = "CONFIRMED"
5. Add at least one passenger
6. Click Save
7. Verify: Booking appears in grid with status "CONFIRMED"
8. Select the booking again
9. Verify: Status field shows "CONFIRMED"
```

### Test 2: Passenger Creation Performance
```
1. Open Bookings page
2. Click "New Booking"
3. Fill in required fields
4. Add 5 passengers
5. Click Save
6. Measure time: Should complete in < 3 seconds
7. Verify: All 5 passengers appear in grid
```

### Test 3: Lazy Loading
```
1. Open Bookings page
2. Click on a booking with passengers
3. Verify: "Loading passenger details..." appears briefly
4. Verify: Passengers load without blocking form
5. Verify: Can interact with form while loading
```

### Test 4: Billing Integration
```
1. Create booking with status "CONFIRMED"
2. Navigate to Billing page
3. Select the booking
4. Click "Generate Bill"
5. Verify: Bill generation succeeds
6. Verify: Bill appears in list
```

### Test 5: Status Update
```
1. Create booking with status "DRAFT"
2. Click "Edit" on the booking
3. Change status to "CONFIRMED"
4. Click Save
5. Verify: Status updates in grid
6. Verify: Can now generate bill for this booking
```

---

## Rollback Plan

If issues occur, revert changes in this order:

1. **Revert Status Changes**
   - Restore `bk_status: 'DRAFT'` in bookingController.js
   - Restore status options in Bookings.jsx

2. **Revert Passenger Batch Insert**
   - Restore original createMultiple() method in Passenger.js

3. **Revert Lazy Loading**
   - Remove loadingPassengers state
   - Restore synchronous passenger loading

4. **Revert Status Update Endpoint**
   - Remove updateBookingStatus function
   - Remove route from bookingRoutes.js

---

## Performance Verification

After implementation, verify improvements:

```javascript
// Add to Bookings.jsx for performance monitoring
const measurePerformance = (label, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  return result;
};

// Use in handleSave
const savedBooking = await measurePerformance('Booking Save', () => 
  handleSaveRef.current()
);

// Use in handleRecordSelect
await measurePerformance('Passenger Load', () =>
  bookingAPI.getBookingPassengers(record.bk_bkid)
);
```

Expected results:
- Booking save: 2-3 seconds (was 15-20s)
- Passenger load: 0.5-1 second (was 2-3s)
- Status save: ✓ Working (was ❌ Not working)

---

## Deployment Checklist

- [ ] All code changes reviewed
- [ ] Tests pass locally
- [ ] Database migrations run (if needed)
- [ ] API endpoints tested with Postman
- [ ] Frontend tested in Chrome, Firefox, Safari
- [ ] Mobile responsiveness verified
- [ ] Performance metrics verified
- [ ] Billing workflow tested end-to-end
- [ ] Rollback plan documented
- [ ] Team notified of changes
- [ ] Monitoring alerts configured
- [ ] Deployment completed
- [ ] Post-deployment verification done

---

## Support & Troubleshooting

### Issue: Status not saving
**Solution**: Verify normalizeStatus() function is called in handleSave()

### Issue: Passengers still loading slowly
**Solution**: Verify batch insert query is correct, check database indexes

### Issue: Billing still blocked
**Solution**: Verify status is saved as "CONFIRMED" (uppercase), check billing controller

### Issue: UI freezing during passenger load
**Solution**: Verify lazy loading is implemented, check for missing finally() block

---

## Questions?

Refer to the main analysis document: `BOOKING_WORKFLOW_ANALYSIS.md`
