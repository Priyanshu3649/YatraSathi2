# Passenger Count Display Fix - Complete

## Problem Summary
The `totalPassengers` field in booking records displayed incorrectly in the UI grid:
- Initially showed 0 for all records
- Only showed correct count for the currently selected/focused record
- Reverted to 0 when another record was selected

## Root Cause Analysis

### Backend Behavior (Correct)
The backend (`src/controllers/bookingController.js` - `getAllBookings` function) correctly:
1. Batch fetches passenger counts from the `PassengerTVL` table
2. Counts only active passengers (`ps_active = 1`)
3. Sets the count in the `bk_pax` field of each booking record

```javascript
// Backend code (CORRECT)
const passengerCount = passengerCounts[booking.bk_bkid] || 0;
return {
  ...booking.toJSON(),
  bk_pax: passengerCount  // ✓ Backend sends count in bk_pax field
};
```

### Frontend Behavior (INCORRECT)
The frontend (`frontend/src/pages/Bookings.jsx`) had three issues:

#### Issue 1: Record Selection Mapping (Line 595)
When selecting a record, the frontend only checked `record.totalPassengers`:
```javascript
// BEFORE (INCORRECT)
totalPassengers: record.totalPassengers || 0,  // ✗ Missing bk_pax fallback
```

#### Issue 2: Grid Display Logic (Line 2211)
The grid display only checked `record.totalPassengers`:
```javascript
// BEFORE (INCORRECT)
{isSelected 
  ? (passengerList.filter(p => p.name.trim() !== '').length || record.totalPassengers || 0) 
  : (record.totalPassengers || 0)  // ✗ Missing bk_pax fallback
}
```

#### Issue 3: Search Filter Logic (Line 1122)
The search filter only checked `record.totalPassengers` and `record.bk_totalpass`:
```javascript
// BEFORE (INCORRECT)
const pax = record.totalPassengers || record.bk_totalpass || 0;  // ✗ Missing bk_pax
```

## Solution Implemented

### Fix 1: Record Selection Mapping
Added `bk_pax` and `bk_totalpass` as fallbacks:
```javascript
// AFTER (CORRECT)
totalPassengers: record.totalPassengers || record.bk_pax || record.bk_totalpass || 0,
```

### Fix 2: Grid Display Logic
Added `bk_pax` and `bk_totalpass` as fallbacks for both selected and non-selected records:
```javascript
// AFTER (CORRECT)
{isSelected 
  ? (passengerList.filter(p => p.name.trim() !== '').length || record.totalPassengers || record.bk_pax || record.bk_totalpass || 0) 
  : (record.totalPassengers || record.bk_pax || record.bk_totalpass || 0)
}
```

### Fix 3: Search Filter Logic
Added `bk_pax` as a fallback:
```javascript
// AFTER (CORRECT)
const pax = record.totalPassengers || record.bk_pax || record.bk_totalpass || 0;
```

## Field Name Mapping

The system uses multiple field names for passenger count across different layers:

| Layer | Field Name | Description |
|-------|-----------|-------------|
| Database | `bk_totalpass` | Original database column |
| Backend API | `bk_pax` | Calculated from PassengerTVL table |
| Frontend State | `totalPassengers` | React state field name |
| Legacy | `bk_totalpass` | Backward compatibility |

## Testing Checklist

- [x] All booking records in grid show correct passenger count on initial load
- [x] Passenger count remains correct when selecting different records
- [x] Passenger count updates correctly when passengers are added/removed
- [x] Search by passenger count works correctly
- [x] No console errors related to passenger count
- [x] Backward compatibility maintained with legacy field names

## Files Modified

1. `frontend/src/pages/Bookings.jsx`
   - Line 595: Record selection mapping
   - Line 1122: Search filter logic
   - Line 2211: Grid display logic

## Impact

- **Before**: Only the selected record showed correct passenger count
- **After**: All records in the grid show correct passenger count at all times
- **Performance**: No impact - uses existing data from backend
- **Compatibility**: Maintains backward compatibility with all field name variations

## Related Issues

This fix resolves the inconsistent passenger count display that was caused by:
1. Backend using `bk_pax` field name
2. Frontend expecting `totalPassengers` field name
3. Missing fallback logic to check alternative field names

The fix ensures the frontend checks all possible field names in the correct priority order.
