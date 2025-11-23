# Sample Data Guide

## Overview
The database has been populated with comprehensive sample data across all tables. This guide shows you where to find and view this data in the application.

## Sample Data Summary

### Users (4 total)
1. **Admin User**
   - Email: `admin@example.com`
   - Password: `admin123`
   - Role: System Administrator
   - Access: Full system access

2. **Booking Agent**
   - Email: `employee@example.com`
   - Password: `employee123`
   - Role: Booking Agent
   - Department: AGENT

3. **Accounts Executive**
   - Email: `accounts@example.com`
   - Password: `accounts123`
   - Role: Accounts Team
   - Department: ACCOUNTS

4. **Customer**
   - Email: `customer@example.com`
   - Password: `customer123`
   - Role: Customer
   - Type: Individual & Corporate (Tech Solutions Pvt Ltd)

### Railway Data
- **4 Stations**: Mumbai CSMT, New Delhi, Bangalore, Chennai
- **2 Trains**: 
  - Mumbai Rajdhani Express (12951)
  - Karnataka Express (12629)

### Bookings (4 total)
1. **BK2025001** - Mumbai to Delhi (CONFIRMED)
   - Travel Date: Dec 1, 2025
   - Class: 3A
   - Passengers: 2 (John Doe, Jane Doe)
   - Amount: ₹5,000

2. **BK2025002** - Delhi to Bangalore (PENDING)
   - Travel Date: Dec 15, 2025
   - Class: 2A
   - Passengers: 1 (John Doe)
   - Amount: ₹1,000

3. **BK2025003** - Mumbai to Delhi (CANCELLED)
   - Travel Date: Nov 20, 2025
   - Class: SL
   - Passengers: 3 (Robert, Mary, Tommy Smith)
   - Amount: ₹2,400 (Refunded)

4. **BK2025004** - Bangalore to Chennai (CONFIRMED)
   - Travel Date: Dec 20, 2025
   - Class: 1A
   - Passengers: 2 (Sarah & Michael Johnson)
   - Amount: ₹8,000

### Passengers (8 total)
All passengers have complete details including:
- First and last names
- Age and gender
- Berth preferences
- Seat allocations (for confirmed bookings)

### PNR Records (3 total)
- **1234567890** - Confirmed (Mumbai to Delhi)
- **9876543210** - Waitlisted (Delhi to Bangalore)
- **5555666677** - Confirmed (Bangalore to Chennai)

### Accounts & Payments (4 each)
All bookings have corresponding accounts and payment records:
- 3 payments received (₹5,000 + ₹1,000 + ₹8,000 = ₹14,000)
- 1 refund processed (₹2,400)
- Payment modes: Online, Cash, Bank Transfer

### Travel Plans (3 total)
1. **Mumbai to Delhi Business Trip**
   - Dates: Dec 1-5, 2025
   - Budget: ₹25,000
   - Activities: Conference, Client Meetings, Sightseeing
   - Status: Private

2. **Bangalore Tech Summit**
   - Dates: Dec 15-18, 2025
   - Budget: ₹18,000
   - Activities: Tech Summit, Workshops, Networking
   - Status: Public

3. **Chennai Holiday Trip**
   - Dates: Jan 10-15, 2026
   - Budget: ₹30,000
   - Activities: Beach, Temple Visit, Shopping, Food Tour
   - Status: Private

### Corporate Customer
- Company: Tech Solutions Pvt Ltd
- GST: 27AABCT1234A1Z5
- Credit Limit: ₹1,00,000
- Credit Used: ₹5,000
- Payment Terms: NET30

## Where to View Data in the Application

### 1. Dashboard
**URL**: `/dashboard`

**Admin View** (login as admin@example.com):
- Total Users: 4
- Total Bookings: 4
- Total Revenue: ₹14,000
- Booking Status: 2 Confirmed, 1 Pending, 1 Cancelled
- Employee Performance metrics

**Employee View** (login as employee@example.com):
- Personal booking statistics
- Revenue generated
- Recent activity

**Customer View** (login as customer@example.com):
- Total Bookings: 4
- Confirmed: 2, Pending: 1, Cancelled: 1
- Total Paid: ₹14,000
- Corporate credit information

### 2. Bookings Page
**URL**: `/bookings`

View all bookings with:
- Booking details (from/to stations, dates, class)
- Status indicators (color-coded)
- Search and filter options
- Actions (cancel, delete for authorized users)

### 3. Payments Page
**URL**: `/payments`

View all payments with:
- Payment amounts and modes
- Transaction references
- Payment dates
- Status (Received/Refunded)
- Refund processing (for authorized users)

### 4. Reports Page
**URL**: `/reports`

**Available Reports** (Admin only):
- **Booking Reports**: Filterable by date, status, station
- **Employee Performance**: Bookings, revenue, success rate
- **Financial Summary**: Revenue, payments by mode, bookings by class
- **Customer Analytics**: Active customers, booking frequency, top spenders
- **Corporate Customers**: Credit limits, usage, outstanding amounts

### 5. Travel Plans Page
**URL**: `/travel-plans`

View all travel plans with:
- Trip details and destinations
- Budget information
- Activity lists
- Public/Private status
- Edit and delete options

### 6. Employee Management
**URL**: `/employees` (Admin only)

View all employees with:
- Employee details
- Department and designation
- Contact information
- Performance metrics

## Testing the Data

### Quick Test Steps:

1. **Login as Admin**
   ```
   Email: admin@example.com
   Password: admin123
   ```
   - Check Dashboard for overview statistics
   - Navigate to Reports → Financial Summary
   - View Employee Performance report

2. **Login as Customer**
   ```
   Email: customer@example.com
   Password: customer123
   ```
   - Check Dashboard for personal statistics
   - View Bookings page (should see 4 bookings)
   - View Payments page (should see 4 payments)
   - View Travel Plans (should see 3 plans)

3. **Login as Booking Agent**
   ```
   Email: employee@example.com
   Password: employee123
   ```
   - Check Dashboard for agent statistics
   - View assigned bookings
   - Create new bookings

4. **Login as Accounts Executive**
   ```
   Email: accounts@example.com
   Password: accounts123
   ```
   - View all payments
   - Process refunds
   - View financial reports

## Data Relationships

All data is properly linked:
- Bookings → Passengers (1 to many)
- Bookings → PNR Records (1 to 1)
- Bookings → Accounts (1 to 1)
- Accounts → Payments (1 to many)
- Users → Bookings (1 to many)
- Users → Travel Plans (1 to many)
- Stations → Trains (many to many via from/to)

## Re-seeding the Database

To clear and re-seed all data:
```bash
node src/scripts/seed.js
```

This will:
1. Clear all existing data
2. Create fresh sample data
3. Maintain referential integrity
4. Display a summary of created records

## Notes

- All monetary values are in Indian Rupees (₹)
- Dates are set for future travel (December 2025 - January 2026)
- All passwords are hashed using bcrypt
- Foreign key relationships are properly maintained
- Audit fields (created by, modified by) are populated
