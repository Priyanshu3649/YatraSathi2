# 🚀 Deployment Quick Reference

## ⚠️ CRITICAL FIRST STEP

### Restart the Backend Server
```bash
npm stop
npm start
# or
pm2 restart app
```

**Why?** Changes to middleware (`authMiddleware.js`) and routing (`server.js`) require a server restart to take effect.

**Verify**: Check logs for:
```
✅ Financial years cache populated: {...}
Server listening on port 3001
```

---

## 🔍 Quick Test Commands

```bash
# 1. Test Profile (should be 200, not 403)
curl -X GET http://localhost:3001/api/profile \
  -H "Authorization: Bearer <token>"

# 2. Test Master Passengers (should be 200, not 403)
curl -X GET http://localhost:3001/api/customer/master-passengers \
  -H "Authorization: Bearer <token>"

# 3. Test Booking Creation (should be 201, not 403/500)
curl -X POST http://localhost:3001/api/customer/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fromStation":"Delhi","toStation":"Mumbai","travelDate":"2026-08-01","travelClass":"SL","totalPassengers":1,"passengerList":[{"name":"Test","age":30,"gender":"M"}]}'
```

---

## 📋 What Was Changed

| File | Change | Why |
|------|--------|-----|
| `src/server.js` | Added `/api/profile` and `/api/customer/master-passengers` to MASTER_ONLY_PATHS | Profile & master passengers shouldn't switch databases |
| `src/middleware/authMiddleware.js` | Skip FY checks for user-specific endpoints | Profile & master passengers don't need FY permission |
| `src/utils/dbContext.js` | Auto-grant customers current FY | Customers should have access to 2026-27 FY |

---

## ✅ Verification Checklist

After restart, verify:

- [ ] Server started without errors
- [ ] Profile endpoint returns 200 OK (not 403)
- [ ] Master passengers endpoint returns 200 OK (not 403)
- [ ] Booking creation works (not 403 anymore)
- [ ] Customer dashboard loads
- [ ] No 500 errors in logs

---

## 🆘 If You Get Errors

### Error: 403 Forbidden
**Check**: Did you restart the server? (This is required)

### Error: Master Passengers endpoint not found
**Check**: 
1. Restart backend
2. Check that the route files exist
3. Look at server logs

### Error: Database table doesn't exist
**Check**: Run the migration if using master passengers feature
```bash
mysql -u root -p < src/migrations/create_master_passenger_tvl.sql
```

---

## 📊 Files Created/Modified

### NEW FILES (Don't delete these)
- `src/models/MasterPassengerTVL.js`
- `src/controllers/masterPassengerController.js`
- `src/routes/masterPassengerRoutes.js`
- `src/migrations/create_master_passenger_tvl.sql`
- `frontend/src/pages/Customer/MasterPassengers.jsx`
- `frontend/src/styles/master-passengers.css`

### MODIFIED FILES (Check version control)
- `src/server.js`
- `src/middleware/authMiddleware.js`
- `src/utils/dbContext.js`
- `src/models/index.js`

---

## 🎯 Expected Results

### Before Deployment
```
❌ GET /api/profile → 403 Forbidden
❌ GET /api/customer/master-passengers → 403 Forbidden
❌ POST /api/customer/bookings → 403 Forbidden
```

### After Deployment
```
✅ GET /api/profile → 200 OK
✅ GET /api/customer/master-passengers → 200 OK
✅ POST /api/customer/bookings → 201 Created
```

---

## 📞 Support Resources

- **Technical Docs**: `CUSTOMER_LOGIN_AND_MASTER_PASSENGER_FIX.md`
- **403 Fix Details**: `FIX_403_FORBIDDEN_ERRORS.md`
- **API Reference**: `QUICK_START_CUSTOMER_FEATURES.md`
- **Full Status**: `IMPLEMENTATION_FINAL_STATUS.md`

---

## ⏱️ Timeline

- **Restart Backend**: 5-30 seconds
- **Run Tests**: 5-10 minutes
- **Full QA**: 2-4 hours
- **Production Deployment**: When QA approves

---

## ✨ That's It!

The implementation is complete. Just:
1. Restart your backend server
2. Test the endpoints
3. Deploy to production

**Questions?** Check the documentation files.

---

**Status**: ✅ Ready for Deployment  
**Risk Level**: LOW  
**Estimated Downtime**: <1 minute (restart)
