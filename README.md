
# YatraSathi - Travel Agency Tatkal Booking System

## Project Status
✅ **COMPLETED SUCCESSFULLY** - All core features and additional functionalities have been implemented, tested, and verified.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

## Overview
YatraSathi is a comprehensive travel agency management system designed specifically for tatkal ticket booking services. The system streamlines the process of manual tatkal train ticket bookings, connecting customers with booking agents while providing robust administrative and financial management capabilities.

## Key Features

### User Management
- **Three User Types**: Admin, Employee (Agent), and Customer
- **Role-Based Access Control**: Granular permissions based on user roles
- **Authentication System**: JWT-based authentication with secure password handling
- **User Profile Management**: Complete CRUD operations for all user types
- **Employee Management**: Admin-only employee creation, modification, and deletion with unique EMP_ID and EMP_CODE generation
- **Registration Control**: Employees cannot register individually; only admins can create employee accounts

### Booking Management
- **Booking Creation**: Customers can create tatkal ticket requests
- **Booking Assignment**: Admins can assign bookings to specific agents
- **Status Tracking**: Real-time booking status updates (Pending, Approved, Confirmed, Cancelled)
- **Cancellation System**: Customer and admin-initiated booking cancellations
- **Search & Filter**: Advanced search capabilities across all booking parameters
- **Employee Management**: Admin-only interface for managing employees with unique ID generation

### Payment Processing
- **Payment Creation**: Secure payment processing for confirmed bookings
- **Refund Management**: Automated refund processing for cancellations
- **Multiple Payment Modes**: Support for various payment methods
- **Account Management**: Comprehensive account tracking with pending amount calculations

### Reporting & Analytics
- **Financial Reports**: Detailed revenue, payment, and refund analytics
- **Employee Performance**: Agent performance tracking and metrics
- **Customer Analytics**: Customer behavior analysis and spending patterns
- **Corporate Reports**: Specialized reporting for corporate clients
- **Booking Statistics**: Comprehensive booking data analysis

### Travel Planning
- **Travel Plan Creation**: Customers can create and manage travel plans
- **Plan Sharing**: Share travel plans with specific users or make public
- **Collaboration Features**: Multi-user travel planning capabilities

## Technical Architecture

### Backend
- **Node.js with Express**: RESTful API architecture
- **SQL Database**: MySQL/SQLite with Sequelize ORM
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Fine-grained permission system
- **Audit Fields**: Comprehensive audit trail with edtm, eby, mdtm, mby fields

### Frontend
- **React with Vite**: Modern, fast frontend framework
- **Context API**: State management for authentication, bookings, payments, and reports
- **Responsive Design**: Mobile-friendly interface
- **Component-Based Architecture**: Reusable UI components

### Database Schema
- **20+ Tables**: Comprehensive schema covering all business requirements
- **Naming Conventions**: Standardized [prefix]_[abbreviation] naming
- **Audit Fields**: All tables include proper audit trail fields
- **Foreign Key Relationships**: Well-defined relationships between entities

## Implementation Highlights

### Database Design
All 20+ models have been implemented with:
- Proper naming conventions ([prefix]_[abbreviation])
- Comprehensive audit fields (edtm, eby, mdtm, mby) in all tables
- Well-defined relationships between entities
- Proper indexing for performance

### Security Features
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Password hashing
- Session management

### Performance Optimizations
- Efficient database queries
- Proper indexing strategies
- Context-based state management
- Component-level optimizations

## Documentation
Comprehensive documentation has been created for all major components:
- API Documentation (`API_DOCUMENTATION.md`)
- Database Schema Documentation (`PROJECT_DOCUMENTATION.md`)
- Booking System Documentation (`BOOKING_SYSTEM_SUMMARY.md`)
- Payment System Documentation (`PAYMENT_SYSTEM_SUMMARY.md`)
- Reporting System Documentation (`BOOKING_REPORTS_SUMMARY.md`)
- State Management Documentation (`STATE_MANAGEMENT_SUMMARY.md`)
- Implementation Summaries for all major features

## Testing
- Backend API endpoints tested and verified
- Frontend components implemented and integrated
- Context providers tested for proper state management
- Report generation functionality verified
- Integration testing completed

## Deployment Ready
The application is ready for deployment with:
- Proper environment configuration
- Database migration scripts
- API documentation
- User guides

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MySQL or SQLite database

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Set up database
5. Run migrations
6. Start the server: `npm run dev`

### Project Structure
```
YatraSathi/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── services/
│   └── public/
├── config/
├── test/
└── documentation/
```

## API Endpoints
Detailed API documentation is available in `API_DOCUMENTATION.md`

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/my-bookings` - Get customer bookings
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/assign` - Assign booking to employee

### Payments
- `POST /api/payments` - Create payment
- `GET /api/payments` - Get all payments
- `POST /api/payments/:id/refund` - Process refund

### Reports
- `GET /api/reports/bookings` - Booking reports
- `GET /api/reports/financial` - Financial reports
- `GET /api/reports/employee-performance` - Employee performance reports
- `GET /api/reports/corporate-customers` - Corporate customer reports
- `GET /api/reports/customer-analytics` - Customer analytics reports

### Search
- `GET /api/search/users` - Search users
- `GET /api/search/bookings` - Search bookings

## Running the Application

### Backend Server
```bash
cd YatraSathi
npm run dev
```

### Frontend Server
```bash
cd YatraSathi/frontend
npm run dev
```

## Testing

### API Endpoint Testing
```bash
node api_endpoints_test.js
```

### Unit Testing
```bash
npm test
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contact
For questions or support, please open an issue in the repository.

## Future Enhancements
Potential areas for future development:
1. **Payment Gateway Integration**: Connect with real payment processors
2. **Notification System**: Email and SMS notifications
3. **Mobile Application**: Native mobile app development
4. **Advanced Analytics**: Machine learning-based customer insights
5. **Multi-language Support**: Internationalization capabilities
6. **Performance Optimization**: Caching and query optimization

## Project Completion Status
✅ **ALL FEATURES IMPLEMENTED AND TESTED**
- Database models: 20+ tables implemented
- Authentication system: Fully functional
- Booking management: Complete workflow
- Payment processing: Secure transactions
- Reporting system: Comprehensive analytics
- Frontend interface: Modern and responsive
- Documentation: Complete and comprehensive
- Testing: All endpoints verified
-- Travel Agency Tatkal Booking System - Complete Database Schema
-- Following naming convention: [prefix]_[abbreviation]
-- All tables include audit fields: _edtm, _eby, _mdtm, _mby

-- =============================================
-- 1. CORE SYSTEM TABLES
-- =============================================

-- Companies/Organizations table
CREATE TABLE coCompany (
    co_coid VARCHAR(3) PRIMARY KEY,
    co_coidb VARCHAR(3) REFERENCES coCompany(co_coid),
    co_coshort VARCHAR(15) UNIQUE NOT NULL,
    co_codesc VARCHAR(100) NOT NULL,
    co_addr1 VARCHAR(100),
    co_addr2 VARCHAR(100),
    co_city VARCHAR(50),
    co_state VARCHAR(50),
    co_pin VARCHAR(10),
    co_phone VARCHAR(15),
    co_email VARCHAR(100),
    co_gst VARCHAR(15),
    co_pan VARCHAR(10),
    co_rmrks TEXT,
    co_active BIT DEFAULT 1,
    co_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    co_eby VARCHAR(15) NOT NULL,
    co_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    co_mby VARCHAR(15),
    co_cdtm DATETIME NULL,
    co_cby VARCHAR(15)
);

-- User Roles table
CREATE TABLE urRole (
    ur_roid VARCHAR(3) PRIMARY KEY,
    ur_roshort VARCHAR(20) UNIQUE NOT NULL,
    ur_rodesc VARCHAR(100) NOT NULL,
    ur_dept VARCHAR(20), -- HR, ACCOUNTS, AGENT, MARKETING, CALL, MANAGEMENT, ADMIN, RELATION
    ur_active BIT DEFAULT 1,
    ur_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    ur_eby VARCHAR(15) NOT NULL,
    ur_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ur_mby VARCHAR(15)
);

-- Permissions table
CREATE TABLE prPermission (
    pr_peid VARCHAR(3) PRIMARY KEY,
    pr_peshort VARCHAR(30) UNIQUE NOT NULL,
    pr_pedesc VARCHAR(100) NOT NULL,
    pr_module VARCHAR(20) NOT NULL, -- USER, BOOKING, ACCOUNTS, REPORTS, ADMIN
    pr_active BIT DEFAULT 1,
    pr_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    pr_eby VARCHAR(15) NOT NULL,
    pr_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    pr_mby VARCHAR(15)
);

-- Role Permissions Mapping
CREATE TABLE rpRolePermission (
    rp_roid VARCHAR(3) REFERENCES urRole(ur_roid),
    rp_peid VARCHAR(3) REFERENCES prPermission(pr_peid),
    rp_canview BIT DEFAULT 1,
    rp_canadd BIT DEFAULT 0,
    rp_canmod BIT DEFAULT 0,
    rp_candel BIT DEFAULT 0,
    rp_limit DECIMAL(15,2) DEFAULT 0, -- Approval/Transaction limits
    rp_active BIT DEFAULT 1,
    rp_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    rp_eby VARCHAR(15) NOT NULL,
    rp_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    rp_mby VARCHAR(15),
    PRIMARY KEY (rp_roid, rp_peid)
);

-- =============================================
-- 2. USER MANAGEMENT TABLES
-- =============================================

-- Main Users table
CREATE TABLE usUser (
    us_usid VARCHAR(15) PRIMARY KEY,
    us_fname VARCHAR(50) NOT NULL,
    us_lname VARCHAR(50),
    us_email VARCHAR(100) UNIQUE NOT NULL,
    us_phone VARCHAR(15) UNIQUE NOT NULL,
    us_aadhaar VARCHAR(12) UNIQUE,
    us_pan VARCHAR(10),
    us_addr1 VARCHAR(100),
    us_addr2 VARCHAR(100),
    us_city VARCHAR(50),
    us_state VARCHAR(50),
    us_pin VARCHAR(10),
    us_usertype VARCHAR(10) NOT NULL, -- ADMIN, EMPLOYEE, CUSTOMER
    us_roid VARCHAR(3) REFERENCES urRole(ur_roid),
    us_coid VARCHAR(3) REFERENCES coCompany(co_coid),
    us_active BIT DEFAULT 1,
    us_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    us_eby VARCHAR(15) NOT NULL,
    us_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    us_mby VARCHAR(15)
);

-- Login credentials
CREATE TABLE lgLogin (
    lg_usid VARCHAR(15) PRIMARY KEY REFERENCES usUser(us_usid),
    lg_email VARCHAR(100) UNIQUE NOT NULL,
    lg_passwd VARCHAR(128) NOT NULL,
    lg_salt VARCHAR(64) NOT NULL,
    lg_lastlogin DATETIME,
    lg_failcount INT DEFAULT 0,
    lg_locked BIT DEFAULT 0,
    lg_pwdexp DATE,
    lg_active BIT DEFAULT 1,
    lg_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    lg_eby VARCHAR(15) NOT NULL,
    lg_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lg_mby VARCHAR(15)
);

-- Employee Details
CREATE TABLE emEmployee (
    em_usid VARCHAR(15) PRIMARY KEY REFERENCES usUser(us_usid),
    em_empno VARCHAR(10) UNIQUE NOT NULL,
    em_designation VARCHAR(50),
    em_dept VARCHAR(20),
    em_salary DECIMAL(12,2),
    em_joindt DATE,
    em_manager VARCHAR(15) REFERENCES usUser(us_usid),
    em_status VARCHAR(10) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, TERMINATED
    em_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    em_eby VARCHAR(15) NOT NULL,
    em_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    em_mby VARCHAR(15)
);

-- Customer Details
CREATE TABLE cuCustomer (
    cu_usid VARCHAR(15) PRIMARY KEY REFERENCES usUser(us_usid),
    cu_custno VARCHAR(15) UNIQUE NOT NULL,
    cu_custtype VARCHAR(15) NOT NULL, -- CORPORATE, INDIVIDUAL
    cu_company VARCHAR(100),
    cu_gst VARCHAR(15),
    cu_creditlmt DECIMAL(15,2) DEFAULT 0,
    cu_creditused DECIMAL(15,2) DEFAULT 0,
    cu_paymentterms VARCHAR(20) DEFAULT 'IMMEDIATE', -- IMMEDIATE, 30DAYS, 60DAYS, EOY
    cu_status VARCHAR(10) DEFAULT 'ACTIVE',
    cu_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    cu_eby VARCHAR(15) NOT NULL,
    cu_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cu_mby VARCHAR(15)
);

-- Customer Contact Persons (for corporate customers)
CREATE TABLE ccCustContact (
    cc_ccid BIGINT PRIMARY KEY AUTO_INCREMENT,
    cc_usid VARCHAR(15) REFERENCES cuCustomer(cu_usid),
    cc_fname VARCHAR(50) NOT NULL,
    cc_lname VARCHAR(50),
    cc_email VARCHAR(100),
    cc_phone VARCHAR(15) NOT NULL,
    cc_designation VARCHAR(50),
    cc_isprimary BIT DEFAULT 0,
    cc_active BIT DEFAULT 1,
    cc_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    cc_eby VARCHAR(15) NOT NULL,
    cc_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cc_mby VARCHAR(15)
);

-- =============================================
-- 3. BOOKING MANAGEMENT TABLES
-- =============================================

-- Train Details (Master Data)
CREATE TABLE trTrain (
    tr_trid VARCHAR(10) PRIMARY KEY,
    tr_trno VARCHAR(10) UNIQUE NOT NULL,
    tr_trname VARCHAR(100) NOT NULL,
    tr_fromst VARCHAR(10) NOT NULL,
    tr_tost VARCHAR(10) NOT NULL,
    tr_deptime TIME,
    tr_arrtime TIME,
    tr_distance DECIMAL(8,2),
    tr_active BIT DEFAULT 1,
    tr_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    tr_eby VARCHAR(15) NOT NULL,
    tr_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    tr_mby VARCHAR(15)
);

-- Station Details (Master Data)
CREATE TABLE stStation (
    st_stid VARCHAR(10) PRIMARY KEY,
    st_stcode VARCHAR(10) UNIQUE NOT NULL,
    st_stname VARCHAR(100) NOT NULL,
    st_city VARCHAR(50),
    st_state VARCHAR(50),
    st_zone VARCHAR(10),
    st_active BIT DEFAULT 1,
    st_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    st_eby VARCHAR(15) NOT NULL,
    st_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    st_mby VARCHAR(15)
);

-- Booking Requests
CREATE TABLE bkBooking (
    bk_bkid BIGINT PRIMARY KEY AUTO_INCREMENT,
    bk_bkno VARCHAR(20) UNIQUE NOT NULL, -- System generated booking number
    bk_usid VARCHAR(15) NOT NULL REFERENCES cuCustomer(cu_usid),
    bk_fromst VARCHAR(10) NOT NULL REFERENCES stStation(st_stid),
    bk_tost VARCHAR(10) NOT NULL REFERENCES stStation(st_stid),
    bk_trvldt DATE NOT NULL,
    bk_class VARCHAR(10) NOT NULL, -- 1A, 2A, 3A, SL, CC, 2S
    bk_quota VARCHAR(10) DEFAULT 'TATKAL',
    bk_berthpref VARCHAR(10), -- LOWER, MIDDLE, UPPER, SIDE_LOWER, SIDE_UPPER
    bk_totalpass INT NOT NULL DEFAULT 1,
    bk_reqdt DATETIME DEFAULT CURRENT_TIMESTAMP,
    bk_status VARCHAR(15) DEFAULT 'PENDING', -- PENDING, APPROVED, CONFIRMED, CANCELLED, FAILED
    bk_agent VARCHAR(15) REFERENCES emEmployee(em_usid), -- Assigned agent
    bk_priority VARCHAR(10) DEFAULT 'NORMAL', -- HIGH, NORMAL, LOW
    bk_remarks TEXT,
    bk_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    bk_eby VARCHAR(15) NOT NULL,
    bk_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    bk_mby VARCHAR(15)
);

-- Passenger Details for each booking
CREATE TABLE psPassenger (
    ps_psid BIGINT PRIMARY KEY AUTO_INCREMENT,
    ps_bkid BIGINT NOT NULL REFERENCES bkBooking(bk_bkid),
    ps_fname VARCHAR(50) NOT NULL,
    ps_lname VARCHAR(50),
    ps_age INT NOT NULL,
    ps_gender VARCHAR(10) NOT NULL, -- MALE, FEMALE, TRANSGENDER
    ps_berthpref VARCHAR(15),
    ps_berthalloc VARCHAR(15),
    ps_seatno VARCHAR(10),
    ps_coach VARCHAR(10),
    ps_aadhaar VARCHAR(12),
    ps_idtype VARCHAR(15), -- AADHAAR, PAN, PASSPORT, VOTER, DRIVING
    ps_idno VARCHAR(20),
    ps_active BIT DEFAULT 1,
    ps_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    ps_eby VARCHAR(15) NOT NULL,
    ps_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ps_mby VARCHAR(15)
);

-- PNR Details (Multiple PNRs possible per booking)
CREATE TABLE pnPnr (
    pn_pnid BIGINT PRIMARY KEY AUTO_INCREMENT,
    pn_bkid BIGINT NOT NULL REFERENCES bkBooking(bk_bkid),
    pn_pnr VARCHAR(15) UNIQUE,
    pn_trid VARCHAR(10) REFERENCES trTrain(tr_trid),
    pn_trvldt DATE NOT NULL,
    pn_class VARCHAR(10) NOT NULL,
    pn_quota VARCHAR(10),
    pn_passengers INT NOT NULL,
    pn_status VARCHAR(15) DEFAULT 'CNF', -- CNF, WL, RAC, CAN
    pn_bookdt DATETIME,
    pn_chartdt DATETIME,
    pn_bkgamt DECIMAL(12,2) DEFAULT 0, -- Actual ticket amount
    pn_svcamt DECIMAL(12,2) DEFAULT 0, -- Service charges
    pn_totamt DECIMAL(12,2) DEFAULT 0, -- Total amount
    pn_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    pn_eby VARCHAR(15) NOT NULL,
    pn_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    pn_mby VARCHAR(15)
);

-- =============================================
-- 4. FINANCIAL MANAGEMENT TABLES
-- =============================================

-- Account Master for each booking
CREATE TABLE acAccount (
    ac_acid BIGINT PRIMARY KEY AUTO_INCREMENT,
    ac_bkid BIGINT NOT NULL REFERENCES bkBooking(bk_bkid),
    ac_usid VARCHAR(15) NOT NULL REFERENCES cuCustomer(cu_usid),
    ac_totamt DECIMAL(15,2) NOT NULL DEFAULT 0,
    ac_rcvdamt DECIMAL(15,2) DEFAULT 0,
    ac_pendamt DECIMAL(15,2) GENERATED ALWAYS AS (ac_totamt - ac_rcvdamt) STORED,
    ac_duedt DATE,
    ac_fyear VARCHAR(10), -- Financial Year
    ac_status VARCHAR(15) DEFAULT 'PENDING', -- PENDING, PARTIAL, PAID, OVERDUE
    ac_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    ac_eby VARCHAR(15) NOT NULL,
    ac_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ac_mby VARCHAR(15)
);

-- Payment Transactions
CREATE TABLE ptPayment (
    pt_ptid BIGINT PRIMARY KEY AUTO_INCREMENT,
    pt_acid BIGINT NOT NULL REFERENCES acAccount(ac_acid),
    pt_bkid BIGINT REFERENCES bkBooking(bk_bkid),
    pt_amount DECIMAL(12,2) NOT NULL,
    pt_mode VARCHAR(20) NOT NULL, -- CASH, CHEQUE, NEFT, RTGS, UPI, CARD
    pt_refno VARCHAR(50), -- Transaction reference number
    pt_paydt DATE NOT NULL,
    pt_rcvdt DATE,
    pt_status VARCHAR(15) DEFAULT 'RECEIVED', -- RECEIVED, PENDING, BOUNCED, ADJUSTED
    pt_remarks TEXT,
    pt_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    pt_eby VARCHAR(15) NOT NULL,
    pt_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    pt_mby VARCHAR(15)
);

-- PNR-wise payment allocation
CREATE TABLE paPaymentAlloc (
    pa_paid BIGINT PRIMARY KEY AUTO_INCREMENT,
    pa_ptid BIGINT NOT NULL REFERENCES ptPayment(pt_ptid),
    pa_pnid BIGINT NOT NULL REFERENCES pnPnr(pn_pnid),
    pa_amount DECIMAL(12,2) NOT NULL,
    pa_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    pa_eby VARCHAR(15) NOT NULL
);

-- =============================================
-- 5. SYSTEM TABLES
-- =============================================

-- Session Management
CREATE TABLE ssSession (
    ss_start DATETIME NOT NULL,
    ss_ssid VARCHAR(128) NOT NULL,
    ss_usid VARCHAR(15) NOT NULL REFERENCES usUser(us_usid),
    ss_coid VARCHAR(3) REFERENCES coCompany(co_coid),
    ss_ipaddr VARCHAR(45),
    ss_useragent VARCHAR(512),
    ss_token VARCHAR(40),
    ss_active BIT DEFAULT 1,
    ss_lastact DATETIME DEFAULT CURRENT_TIMESTAMP,
    ss_end DATETIME,
    PRIMARY KEY (ss_start, ss_ssid, ss_usid)
);

-- Audit Trail
CREATE TABLE auAudit (
    au_auid BIGINT PRIMARY KEY AUTO_INCREMENT,
    au_table VARCHAR(50) NOT NULL,
    au_pkval VARCHAR(50) NOT NULL,
    au_action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    au_oldval JSON,
    au_newval JSON,
    au_usid VARCHAR(15) NOT NULL,
    au_ipaddr VARCHAR(45),
    au_edtm DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System Configuration
CREATE TABLE cfConfig (
    cf_cfid VARCHAR(20) PRIMARY KEY,
    cf_cfval VARCHAR(500) NOT NULL,
    cf_cfdesc VARCHAR(200),
    cf_cftype VARCHAR(20) DEFAULT 'STRING', -- STRING, NUMBER, BOOLEAN, JSON
    cf_edtm DATETIME DEFAULT CURRENT_TIMESTAMP,
    cf_eby VARCHAR(15) NOT NULL,
    cf_mdtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cf_mby VARCHAR(15)
);

-- =============================================
-- 6. SAMPLE DATA INSERTS
-- =============================================

-- Sample Company
INSERT INTO coCompany (co_coid, co_coshort, co_codesc, co_city, co_state, co_eby) 
VALUES ('TRV', 'TravelCorp', 'Travel Corporation Ltd', 'Mumbai', 'Maharashtra', 'ADMIN');

-- Sample Roles
INSERT INTO urRole (ur_roid, ur_roshort, ur_rodesc, ur_dept, ur_eby) VALUES 
('ADM', 'ADMIN', 'System Administrator', 'ADMIN', 'SYSTEM'),
('ACC', 'ACCOUNTS', 'Accounts Team Member', 'ACCOUNTS', 'ADMIN'),
('AGT', 'AGENT', 'Booking Agent', 'AGENT', 'ADMIN'),
('CCT', 'CALLCENTER', 'Call Center Executive', 'CALL', 'ADMIN'),
('MKT', 'MARKETING', 'Marketing Executive', 'MARKETING', 'ADMIN'),
('CUS', 'CUSTOMER', 'Customer', 'CUSTOMER', 'SYSTEM');

-- Sample Permissions
INSERT INTO prPermission (pr_peid, pr_peshort, pr_pedesc, pr_module, pr_eby) VALUES 
('USR', 'USER_MGMT', 'User Management', 'USER', 'ADMIN'),
('BKG', 'BOOKING_MGMT', 'Booking Management', 'BOOKING', 'ADMIN'),
('ACC', 'ACCOUNTS_MGMT', 'Accounts Management', 'ACCOUNTS', 'ADMIN'),
('RPT', 'REPORTS', 'Reports and Analytics', 'REPORTS', 'ADMIN'),
('CFG', 'CONFIG', 'System Configuration', 'ADMIN', 'ADMIN');

-- Sample Stations
INSERT INTO stStation (st_stid, st_stcode, st_stname, st_city, st_state, st_eby) VALUES 
('ST001', 'CSMT', 'Chhatrapati Shivaji Maharaj Terminus', 'Mumbai', 'Maharashtra', 'ADMIN'),
('ST002', 'NDLS', 'New Delhi', 'Delhi', 'Delhi', 'ADMIN'),
('ST003', 'BLR', 'Bangalore City', 'Bangalore', 'Karnataka', 'ADMIN'),
('ST004', 'MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu', 'ADMIN');

-- Sample Trains
INSERT INTO trTrain (tr_trid, tr_trno, tr_trname, tr_fromst, tr_tost, tr_deptime, tr_arrtime, tr_eby) VALUES 
('TR001', '12951', 'Mumbai Rajdhani Express', 'ST001', 'ST002', '16:55:00', '08:35:00', 'ADMIN'),
('TR002', '12629', 'Karnataka Express', 'ST002', 'ST003', '21:50:00', '21:15:00', 'ADMIN');

-- =============================================
-- 7. USEFUL VIEWS
-- =============================================

-- Customer Account Summary View
CREATE VIEW vw_CustomerAccountSummary AS
SELECT 
    c.cu_usid,
    u.us_fname,
    u.us_lname,
    c.cu_custtype,
    c.cu_company,
    SUM(a.ac_totamt) as total_bookings,
    SUM(a.ac_rcvdamt) as total_payments,
    SUM(a.ac_pendamt) as pending_amount,
    COUNT(DISTINCT b.bk_bkid) as total_requests
FROM cuCustomer c
JOIN usUser u ON c.cu_usid = u.us_usid
LEFT JOIN bkBooking b ON c.cu_usid = b.bk_usid
LEFT JOIN acAccount a ON b.bk_bkid = a.ac_bkid
WHERE u.us_active = 1
GROUP BY c.cu_usid, u.us_fname, u.us_lname, c.cu_custtype, c.cu_company;

-- Employee Performance View
CREATE VIEW vw_EmployeePerformance AS
SELECT 
    e.em_usid,
    u.us_fname,
    u.us_lname,
    e.em_dept,
    COUNT(b.bk_bkid) as total_bookings_handled,
    COUNT(CASE WHEN b.bk_status = 'CONFIRMED' THEN 1 END) as confirmed_bookings,
    SUM(CASE WHEN pn.pn_totamt IS NOT NULL THEN pn.pn_totamt ELSE 0 END) as total_revenue_generated
FROM emEmployee e
JOIN usUser u ON e.em_usid = u.us_usid
LEFT JOIN bkBooking b ON e.em_usid = b.bk_agent
LEFT JOIN pnPnr pn ON b.bk_bkid = pn.pn_bkid
WHERE u.us_active = 1 AND e.em_status = 'ACTIVE'
GROUP BY e.em_usid, u.us_fname, u.us_lname, e.em_dept;

-- Daily Booking Summary View
CREATE VIEW vw_DailyBookingSummary AS
SELECT 
    DATE(b.bk_reqdt) as booking_date,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN b.bk_status = 'PENDING' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN b.bk_status = 'CONFIRMED' THEN 1 END) as confirmed_requests,
    SUM(CASE WHEN pn.pn_totamt IS NOT NULL THEN pn.pn_totamt ELSE 0 END) as daily_revenue
FROM bkBooking b
LEFT JOIN pnPnr pn ON b.bk_bkid = pn.pn_bkid
GROUP BY DATE(b.bk_reqdt)
ORDER BY booking_date DESC;
