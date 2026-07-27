# YatraSathi Testing Guide

## Quick Start Testing

### Prerequisites
- Backend running on `http://localhost:5004` (Express server)
- Frontend running on `http://localhost:3001` (Vite dev server)
- Node.js 16+ installed
- Valid test account with role 'CUS' (Customer)

---

## Manual Testing Workflow

### 1. Customer Booking Workflow

#### Step 1: Login
1. Navigate to http://localhost:3001/
2. Login with customer credentials
3. Verify you land on Customer Dashboard

#### Step 2: Navigate to Book Ticket
1. Click "Book a Ticket" or navigate to `/customer/book-ticket`
2. Should see Step 1 (Journey Details) form

#### Step 3: Test Tab Navigation (Step 1)
1. In "From Station" field, enter: "New Delhi"
2. Press Tab → Should move to "To Station" field
3. Enter: "Mumbai Central"
4. Press Tab → Should move to "Journey Date" field
5. Select a date 2+ days in the future
6. Press Tab → Should move to "Class" field
7. Select "Sleeper (SL)"
8. Press Tab → Should move to "Train Preferences" field
9. Enter: "12345, 67890"
10. Press Tab → Should focus "Next" button (no page change)
11. Press Enter on "Next" button → Should move to Step 2 (Passenger Details)

#### Step 4: Test Tab Navigation (Step 2)
1. Should see auto-focused "Full Name" field
2. Enter: "John Doe"
3. Press Tab → Move to "Age" field
4. Enter: "30"
5. Press Tab → Move to "Gender" field
6. Select "Male"
7. Press Tab → Move to "Berth Preference" field
8. Select "Lower Berth"
9. Press Tab → Focus "Add Another Passenger" button
10. Press Enter → Passenger record created, focus back on "Full Name" for next entry
11. Enter another passenger OR
12. Press Tab on "Add Another Passenger" → Move to Step 3 (Review & Submit)

#### Step 5: Test Submission (Step 3)
1. Review booking details
2. Press Enter on "Submit Booking" button → Booking submitted
3. Should navigate to `/customer/bookings` with success message
4. Booking should appear in list with status "Draft (DRF)"

---

## API Testing (curl commands)

### 1. Authenticate
```bash
# Get a valid token (use actual credentials)
curl -X POST http://localhost:5004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "password123"
  }' | jq '.data.token'
```

Store the token in a variable:
```bash
TOKEN="<token_from_above>"
```

### 2. Create a Booking
```bash
curl -X POST http://localhost:5004/api/customer/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Financial-Year: 2026" \
  -d '{
    "fromStation": "New Delhi",
    "toStation": "Mumbai Central",
    "travelDate": "2026-08-20",
    "travelClass": "SL",
    "totalPassengers": 1,
    "passengerList": [{
      "name": "Test User",
      "age": 30,
      "gender": "M",
      "berthPreference": "NO_PREF"
    }],
    "customerName": "Test Customer",
    "phoneNumber": "9876543210",
    "status": "DRF"
  }'
```

Expected Response (201):
```json
{
  "success": true,
  "data": {
    "bk_bkid": "BK123456",
    "bk_bkno": "BK-260726-1234",
    "bk_status": "DRF",
    "message": "Booking created successfully..."
  }
}
```

### 3. Get Customer Bookings
```bash
curl -X GET "http://localhost:5004/api/customer/bookings?limit=10&page=1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Financial-Year: 2026"
```

Expected Response (200):
```json
{
  "success": true,
  "count": 1,
  "page": 1,
  "pageSize": 10,
  "data": {
    "bookings": [
      {
        "bk_bkid": "BK123456",
        "bk_bkno": "BK-260726-1234",
        "bk_status": "DRF",
        "bk_from": "New Delhi",
        "bk_to": "Mumbai Central",
        "bk_travelldate": "2026-08-20",
        "bk_travelclass": "SL",
        "bk_pax": 1
      }
    ]
  }
}
```

### 4. Get Customer Bills
```bash
curl -X GET "http://localhost:5004/api/customer/bills?limit=10&page=1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Financial-Year: 2026"
```

### 5. Get Customer Payments
```bash
curl -X GET "http://localhost:5004/api/customer/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Financial-Year: 2026"
```

---

## Testing Checklist

### Booking Form Tab Navigation
- [ ] Step 1: Tab moves through all fields correctly
- [ ] Step 1: Tab on last field focuses Next button
- [ ] Step 1: Enter on Next button advances to Step 2
- [ ] Step 2: Auto-focus on Full Name when page loads
- [ ] Step 2: Tab moves through all fields correctly
- [ ] Step 2: Enter on "Add Another Passenger" creates record
- [ ] Step 2: Tab on "Add Another Passenger" advances to Step 3
- [ ] Step 3: Auto-focus on Submit button when page loads
- [ ] Step 3: Enter on Submit button submits booking
- [ ] Step 3: Tab on Submit button submits booking

### API Endpoints
- [ ] POST /api/customer/bookings - Creates booking
- [ ] GET /api/customer/bookings - Retrieves customer's bookings
- [ ] GET /api/customer/bookings/:id - Retrieves single booking
- [ ] GET /api/customer/bills - Retrieves customer's bills
- [ ] GET /api/customer/payments - Retrieves payment history
- [ ] GET /api/customer/dashboard - Retrieves dashboard stats

### Train Classes
- [ ] SL (Sleeper) available
- [ ] 3A (3rd AC) available
- [ ] 2A (2nd AC) available
- [ ] 1A (1st AC) available
- [ ] CC (Chair Car) available
- [ ] 2S (2nd Sitting) available
- [ ] EC (Executive Chair) available
- [ ] 3E (3rd AC Economy) available
- [ ] FC (First Class) available
- [ ] GN (General) available

### Error Handling
- [ ] MasterPassengerList doesn't crash on empty data
- [ ] Proper error messages on validation failure
- [ ] Auth errors (401) on missing token
- [ ] Permission errors (403) on unauthorized access
- [ ] 404 errors for non-existent resources

### Database Context
- [ ] Payment creation doesn't throw 500 error
- [ ] Receipt creation doesn't throw 500 error
- [ ] Journal creation doesn't throw 500 error
- [ ] Booking creation uses correct financial year DB

---

## Troubleshooting

### Issue: "Cannot read properties of undefined (reading 'length')"
**Solution**: MasterPassengerList should handle empty data gracefully.
Check: `frontend/src/components/Customer/MasterPassengerList.jsx` line 40+

### Issue: Tab navigation doesn't work in BookingForm
**Solution**: Ensure refs are properly set and callbacks are invoked.
Check:
- `handleStep1Tab` callback (line ~219)
- `handleAddPassengerKey` callback (line ~252)
- Ref assignments on input fields

### Issue: 500 error on /api/payments POST
**Solution**: MASTER_ONLY_PATHS might not be properly configured.
Check: `src/server.js` line 41 (MASTER_ONLY_PATHS constant)

### Issue: Routes return 404
**Solution**: Route order matters - specific routes must come before wildcards.
Check: `src/routes/customerRoutes.js` line 12+ (comment "All literal routes MUST come before...")

### Issue: Bookings not visible in MyBookings
**Solution**: Ensure X-Financial-Year header is being sent.
Check: `frontend/src/services/api.js` getHeaders() function

---

## Performance Testing

### Load Test: 100 Bookings Creation
```bash
for i in {1..100}; do
  curl -X POST http://localhost:5004/api/customer/bookings \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "...booking_data..." &
done
wait
echo "Created 100 bookings"
```

### Database Query Performance
Check logs for query times:
- Booking creation should complete in < 500ms
- Passenger list retrieval should complete in < 100ms
- Bill fetching should complete in < 200ms

---

## Production Readiness Checklist

- [ ] All routes tested with valid authentication
- [ ] Error messages don't expose internal details
- [ ] Database connections are pooled
- [ ] Queries use parameterized statements
- [ ] CORS headers are properly configured
- [ ] Rate limiting is implemented
- [ ] Request logging is in place
- [ ] Error tracking (Sentry/CloudWatch) configured
- [ ] Database backups are scheduled
- [ ] SSL/TLS certificates installed
- [ ] Environment variables properly set
- [ ] Secret keys rotated before production

---

## Support & Documentation

Refer to these files for detailed information:
- Implementation Details: `IMPLEMENTATION_COMPLETION_SUMMARY.md`
- API Documentation: `API_ROUTES.md` (if available)
- Database Schema: `DATABASE_SCHEMA.md` (if available)
- Frontend Components: `frontend/src/components/Customer/` directory

