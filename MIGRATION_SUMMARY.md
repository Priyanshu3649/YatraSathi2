# Migration Summary: MongoDB to SQL Database

## Overview
This document summarizes the migration from MongoDB/Mongoose to SQL (MySQL) database for the YatraSathi travel agency application, following the database schema provided in the requirements.

## Changes Made

### 1. Dependencies Updated
- Removed `mongoose` dependency
- Added `mysql2` and `sequelize` dependencies
- Updated package.json accordingly

### 2. Database Configuration
- Replaced MongoDB connection with MySQL connection using Sequelize ORM
- Updated config/db.js to use Sequelize
- Updated .env.example with MySQL configuration variables

### 3. Models Migration
All models have been migrated from Mongoose schemas to Sequelize models following the exact schema specifications:

#### Core System Tables
- **Company** (`coCompany`) - Organization details
- **Role** (`urRole`) - User roles with departments
- **Permission** (`prPermission`) - System permissions
- **RolePermission** (`rpRolePermission`) - Role-permission mappings

#### User Management Tables
- **User** (`usUser`) - Main user table
- **Login** (`lgLogin`) - Login credentials with password hashing
- **Employee** (`emEmployee`) - Employee details
- **Customer** (`cuCustomer`) - Customer details
- **CorporateCustomer** (`cuCorporateCustomer`) - Specialized corporate customer model
- **CustomerContact** (`ccCustContact`) - Contact persons for corporate customers

#### Booking Management Tables
- **Station** (`stStation`) - Railway station master data
- **Train** (`trTrain`) - Train master data
- **Booking** (`bkBooking`) - Booking requests
- **Passenger** (`psPassenger`) - Passenger details
- **Pnr** (`pnPnr`) - PNR details (multiple PNRs per booking)

#### Financial Management Tables
- **Account** (`acAccount`) - Account master for bookings
- **Payment** (`ptPayment`) - Payment transactions
- **PaymentAlloc** (`paPaymentAlloc`) - PNR-wise payment allocation

#### System Tables
- **Session** (`ssSession`) - Session management
- **Audit** (`auAudit`) - Audit trail
- **Config** (`cfConfig`) - System configuration
- **TravelPlan** (`tpTravelPlan`) - Travel plans

### 4. Naming Conventions
All tables follow the specified naming convention:
- Prefix pattern: [two-letter prefix]_[TableName] (e.g., `coCompany`, `urRole`)
- Field names follow the pattern: [prefix]_[abbreviation] (e.g., `co_coid`, `ur_roid`)

### 5. Audit Fields Implementation
All models include the required audit fields:
- `edtm` - Entered Date Time
- `eby` - Entered By
- `mdtm` - Modified Date Time
- `mby` - Modified By
- Additional fields where specified (e.g., `co_cdtm`, `co_cby` for Company)

### 6. Associations
Proper relationships have been established between models using Sequelize associations:
- One-to-One, One-to-Many, and Many-to-Many relationships
- Proper foreign key constraints
- Unique aliases to avoid conflicts

### 7. Controllers Update
- Updated authController to work with SQL models
- Password hashing with bcrypt
- Proper user authentication flow

### 8. Scripts
- Created testModels.js for testing model functionality
- Created seed.js for initial data population
- Updated package.json with new scripts

## Database Setup
1. Install MySQL 8.0+
2. Create database and user as described in SETUP_DATABASE.md
3. Update .env file with database credentials
4. Run `npm run test-models` to verify connection
5. Run `npm run seed` to populate with initial data

## Next Steps
1. Set up the MySQL database as described in SETUP_DATABASE.md
2. Test the database connection
3. Run the seed script to populate initial data
4. Continue implementing remaining controllers to work with SQL models
5. Update all API endpoints to use SQL queries instead of MongoDB operations