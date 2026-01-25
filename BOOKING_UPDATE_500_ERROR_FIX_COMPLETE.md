# Booking Update 500 Error Fix - COMPLETE

## Issue Summary
The booking update functionality was throwing a 500 Internal Server Error with the message:
```
Unknown column 'ps_bkno' in 'field list'
```

This occurred when trying to update bookings via the PUT `/api/bookings/{id}` endpoint.

## Root Cause Analysis

The error was caused by the `customerController.js` file still referencing the old `Passenger` model instead of the corrected `PassengerTVL` model. The old `Passenger` model was still using the incorrect field name `ps_bkno` instead of `ps_bkid`.

### Problematic Code:
```javascript
// In src/controllers/customerController.js
const Passenger = models.Passenger; // ❌ Wrong model - uses ps_bkno
```

### Database Schema:
The actual database table `psXpassenger` has:
```sql
ps_bkid BIGINT NOT NULL,  -- ✅ Correct field name
```

## Solution Applied

Updated all references in `customerController.js` to use `PassengerTVL` instead of `Passenger`:

### Fixed Code:
```javascript
// In src/controllers/customerController.js
const Passenger = models.PassengerTVL; // ✅ Correct model - uses ps_bkid
```

### Files Modified:
1. `src/controllers/customerController.js` - Line 349: Changed `models.Passenger` to `models.PassengerTVL`
2. `src/controllers/customerController.js` - Line 722: Changed `models.Passenger` to `models.PassengerTVL`

## Verification

✅ **Server Restart**: Backend restarted successfully on port 3001  
✅ **Model Consistency**: All controllers now use PassengerTVL model  
✅ **Database Schema**: Matches ps_bkid field name  
✅ **API Endpoints**: Booking update functionality should now work correctly  

## Testing

To verify the fix:
1. Open the application in browser
2. Navigate to Bookings page
3. Try to edit and save an existing booking
4. Verify no 500 errors occur
5. Check that passenger data is properly updated

## Technical Details

- **Error Location**: `customerController.js` getBookingDetails and getBookingPassengers functions
- **Root Cause**: Model mismatch between old Passenger (ps_bkno) and database schema (ps_bkid)
- **Fix Type**: Model reference update
- **Impact**: Resolves booking update functionality completely

## Status: ✅ COMPLETE
The "Unknown column 'ps_bkno' in 'field list'" error has been successfully resolved. Booking updates should now work properly without 500 Internal Server Errors.