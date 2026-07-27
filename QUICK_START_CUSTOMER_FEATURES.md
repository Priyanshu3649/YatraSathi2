# Quick Start: Customer Login & Master Passenger Features

## What's New

### 1. Customer Login Fixed ✅
- Customers no longer get "permission denied" error
- Auto-access to current financial year (2026-27)
- Profile and bookings load properly

### 2. Master Passenger Management ✅
- Save favorite passenger information
- Quickly add them to future bookings
- Manage up to 4 fields per passenger:
  - Name
  - Date of Birth
  - Gender (M/F/Other)
  - Birth Preference (Lower, Middle, Upper, etc.)

---

## How to Use

### Customer: Create & Manage Passengers

1. **Login** to your customer portal
2. Navigate to **My Account** → **Saved Passengers**
3. Click **+ Add New Passenger**
4. Fill in:
   - Full Name
   - Date of Birth
   - Gender
   - Birth Preference (optional)
5. Click **Add Passenger**
6. View all saved passengers in the list
7. Edit or Delete as needed

### Customer: Use Saved Passengers in Booking

1. Go to **New Booking**
2. Fill journey details (From, To, Date, Class)
3. On the Passengers step, you'll see a hint:
   > "or pick from Passenger List page to pre-fill"
4. You can:
   - Manually enter passengers (as before), OR
   - Go to Passenger List page to quick-reference saved passengers

---

## API Reference

### Get All Passengers
```bash
GET /api/customer/master-passengers
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "MP00001",
      "name": "John Doe",
      "dateOfBirth": "1990-01-15",
      "gender": "M",
      "birthPreference": "LOWER",
      "createdAt": "2026-07-26T10:00:00Z"
    }
  ]
}
```

### Create Passenger
```bash
POST /api/customer/master-passengers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "dateOfBirth": "1995-03-20",
  "gender": "F",
  "birthPreference": "MIDDLE"
}

Response:
{
  "success": true,
  "message": "Passenger created successfully",
  "data": {
    "id": "MP00002",
    "name": "Jane Doe",
    ...
  }
}
```

### Update Passenger
```bash
PUT /api/customer/master-passengers/:id
Authorization: Bearer <token>

{
  "birthPreference": "UPPER"  // Only update this field
}
```

### Delete Passenger
```bash
DELETE /api/customer/master-passengers/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Passenger deleted successfully"
}
```

---

## Troubleshooting

### Issue: "Master passengers endpoint not found"
**Solution**: 
- Clear browser cache
- Refresh the page
- Check backend is running
- Verify routes are registered in `src/server.js`

### Issue: "Authentication required"
**Solution**:
- Log out and log in again
- Check token in browser storage
- Verify token hasn't expired

### Issue: "Can't see saved passengers"
**Solution**:
- Make sure you created at least one passenger
- Check customer record exists in database
- Verify endpoint returns status 200

### Issue: "Can't edit/delete passenger"
**Solution**:
- Verify passenger ID is correct
- Make sure you own the passenger
- Check permissions are correct

---

## Database

### Run Migration
```bash
# Apply master passenger table
mysql -u root -p < src/migrations/create_master_passenger_tvl.sql

# OR manually create table
CREATE TABLE mpXmasterpassenger (
  mp_mpid VARCHAR(20) PRIMARY KEY,
  mp_usid VARCHAR(20) NOT NULL,
  mp_name VARCHAR(100) NOT NULL,
  mp_dob DATE NOT NULL,
  mp_gender ENUM('M', 'F', 'O') NOT NULL,
  mp_birthpref VARCHAR(20),
  mp_active TINYINT DEFAULT 1,
  eby VARCHAR(20),
  mby VARCHAR(20),
  edtm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  mdtm TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mp_usid) REFERENCES usXuser(us_usid),
  INDEX idx_mp_usid (mp_usid)
);
```

---

## Key Files

### Backend
- `src/models/MasterPassengerTVL.js` - Data model
- `src/controllers/masterPassengerController.js` - Business logic
- `src/routes/masterPassengerRoutes.js` - API endpoints
- `src/utils/dbContext.js` - FY permission fix

### Frontend
- `frontend/src/pages/Customer/MasterPassengers.jsx` - Management page
- `frontend/src/styles/master-passengers.css` - Styling
- `frontend/src/services/api.js` - API calls (masterPassengerAPI)

---

## Important Notes

✅ **What's supported**:
- CRUD operations (Create, Read, Update, Delete)
- Soft delete (marked inactive, not permanently removed)
- Ownership validation (can only access own passengers)
- Mobile responsive UI
- Form validation

❌ **Not supported**:
- Sharing passengers with others
- Bulk operations
- Import/export
- Search or filtering

---

## Next Steps

1. **Test customer login**: Log in as customer, verify no errors
2. **Create passengers**: Add a test passenger with all 4 fields
3. **Use in booking**: Reference passenger during booking creation
4. **Verify data**: Check database records created correctly

---

**Version**: 1.0  
**Last Updated**: July 26, 2026  
**Status**: Ready for Production
