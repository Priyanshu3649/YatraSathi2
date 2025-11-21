# YatraSathi Travel Agency System

## Project Overview

YatraSathi is a comprehensive web application designed for travel agencies specializing in Tatkal train ticket booking services. The system manages the end-to-end process from customer requests to payment reconciliation, supporting three distinct user types with role-based access control.

## Business Requirements

### Problem Statement
Travel agencies that specialize in Tatkal ticket booking face several challenges:
1. Manual processing of customer requests
2. Complex payment handling for corporate clients
3. Multiple PNR management for single bookings
4. Payment allocation across multiple PNRs
5. Credit limit management for corporate customers
6. Employee performance tracking
7. Financial reporting and analytics

### Solution
YatraSathi addresses these challenges by providing:
1. Automated booking request management
2. Role-based access control for different departments
3. Multi-PNR support for single booking requests
4. Payment splitting and allocation across PNRs
5. Corporate credit limit tracking
6. Employee performance analytics
7. Comprehensive financial reporting

## System Architecture

### Technology Stack

#### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - SQL database
- **Sequelize** - ORM for MySQL
- **JWT** - Authentication
- **Socket.IO** - Real-time communication
- **PDFKit** - PDF generation
- **ExcelJS** - Excel report generation

#### Frontend
- **React** - Frontend library
- **Vite** - Build tool
- **React Router** - Client-side routing

#### Infrastructure
- **RESTful API** - Backend API
- **WebSocket** - Real-time notifications
- **MySQL** - Primary database

### Database Design

The system uses MySQL with the following tables, following the exact schema specification:

1. **coCompany** - Companies/Organizations
2. **urRole** - User Roles
3. **prPermission** - Permissions
4. **rpRolePermission** - Role Permissions Mapping
5. **usUser** - Main Users
6. **lgLogin** - Login credentials
7. **emEmployee** - Employee Details
8. **cuCustomer** - Customer Details
9. **ccCustContact** - Customer Contact Persons
10. **trTrain** - Train Details (Master Data)
11. **stStation** - Station Details (Master Data)
12. **bkBooking** - Booking Requests
13. **psPassenger** - Passenger Details
14. **pnPnr** - PNR Details
15. **acAccount** - Account Master
16. **ptPayment** - Payment Transactions
17. **paPaymentAlloc** - PNR-wise payment allocation
18. **ssSession** - Session Management
19. **auAudit** - Audit Trail
20. **cfConfig** - System Configuration

### Naming Convention
All database entities follow a systematic naming convention:
- `co_` = Company/Organization
- `ur_` = User Roles
- `pr_` = Permissions
- `us_` = Users
- `em_` = Employees
- `cu_` = Customers
- `bk_` = Bookings
- `pn_` = PNR
- `ac_` = Accounts
- `pt_` = Payments

### Audit Fields
Every entity includes mandatory audit fields:
- `edtm` = Entry Date Time
- `eby` = Entry By (User ID)
- `mdtm` = Modified Date Time
- `mby` = Modified By (User ID)
- `cdtm` = Closed Date Time (where applicable)
- `cby` = Closed By (User ID)

## User Types and Roles

### 1. Admin
**Permissions:**
- Full system access
- Create, delete, and modify employees
- View comprehensive analytics and reports
- Manage system configuration
- Monitor employee performance
- Access all financial data and reconciliation

### 2. Employees
Employees are organized by departments with specific permissions:

#### Accounts Team
- View and add bill amounts for confirmed tickets
- Record payment receipts with transaction details
- Link payments to specific PNR numbers
- Generate invoices and receipts
- Manage payment reconciliation

#### Agent Team
- View assigned ticket requests
- Contact customers for confirmation
- Approve/reject ticket requests
- Manually book tickets and enter PNR details
- Confirm ticket booking and amounts

#### HR Team
- Employee onboarding and management
- Role assignment and modifications
- Performance tracking and evaluation

#### Call Center Team
- Customer query management
- Ticket status updates
- Complaint resolution

#### Marketing Team
- Customer relationship management
- Promotional campaign management

#### Management Team
- Departmental oversight
- Performance analytics
- Strategic decision support

### 3. Customers

#### Individual Customers
- Submit ticket requests
- Track request status
- Make payments
- Download receipts and tickets

#### Corporate Customers
- Bulk ticket booking requests
- Employee master list management
- Credit limit utilization
- Consolidated billing and payments
- Multi-year financial tracking

## Core Features

### 1. User Management System
- Role-based access control with granular permissions
- Employee hierarchy and reporting structure
- Department-wise functionality segregation
- Real-time user activity monitoring
- Bulk user import/export capabilities

### 2. Booking Management System
- Customer request intake and processing
- Agent assignment and workload distribution
- Multi-PNR support for single booking requests
- Payment splitting across multiple PNRs
- Real-time status tracking and notifications

### 3. Financial Management System
- Comprehensive accounts receivable management
- Payment allocation and reconciliation
- Corporate credit limit monitoring
- Financial year-wise reporting
- Automated invoice generation
- Outstanding amount tracking

### 4. Analytics and Reporting
- Employee performance metrics
- Revenue analysis (spent vs earned vs pending)
- Customer payment behavior analysis
- Department-wise productivity reports
- Financial trend analysis

## Migration Notice

This project has been migrated from MongoDB to SQL (MySQL) following the database schema defined in README.md. All models have been implemented using Sequelize ORM.

See MIGRATION_SUMMARY.md for detailed information about the migration process.

## Key Workflows

### Ticket Booking Process
1. Customer submits ticket request through web interface
2. System auto-assigns to available agent based on workload
3. Agent contacts customer for confirmation and additional details
4. Agent approves request and updates status to "APPROVED"
5. Agent manually visits railway counter to book tickets
6. Agent enters PNR details, actual amounts, and service charges
7. System notifies accounts team for billing
8. Accounts team generates invoice and sends to customer
9. Customer makes payment through preferred mode
10. Accounts team records payment and allocates to PNRs
11. System automatically updates all related accounts

### Corporate Payment Handling
1. Corporate customer submits bulk requests
2. System generates multiple PNRs for group booking
3. Consolidated billing created for all related PNRs
4. Corporate makes single payment for multiple bookings
5. Accounts team distributes payment across individual PNRs
6. System tracks credit utilization against approved limits
7. Financial year-end processing for carry-forward amounts

### Multi-PNR Payment Allocation
When a single payment covers multiple PNRs:
1. Accounts team enters total payment amount
2. System displays all pending PNRs for the customer
3. Team allocates payment portions to specific PNRs
4. System automatically calculates remaining balances
5. Updates account status for each affected PNR

## Security Features

### Authentication
- JWT-based session management
- Password encryption with bcrypt
- Session timeout mechanisms
- Account lockout after failed attempts

### Authorization
- Role-based access control
- Department-specific permissions
- Resource ownership validation
- Granular permission levels

### Data Protection
- Encrypted password storage
- Secure payment information handling
- Regular security audits
- GDPR compliance measures

### Access Control
- Multi-factor authentication for admin users
- IP whitelisting for sensitive operations
- Regular password policy enforcement
- Session monitoring and management

## Implementation Phases

### Phase 1: Core System (4-6 weeks)
- User management and authentication
- Basic booking request system
- Employee assignment workflow
- Simple payment recording

### Phase 2: Financial Management (3-4 weeks)
- Comprehensive accounts system
- Payment allocation mechanisms
- Corporate customer features
- Basic reporting

### Phase 3: Analytics and Reporting (2-3 weeks)
- Advanced reporting capabilities
- Performance analytics
- Financial dashboards
- Export functionalities

### Phase 4: System Enhancement (2-3 weeks)
- Advanced search and filtering
- Bulk operations
- System optimization
- Mobile responsiveness

## Success Metrics

### Operational Efficiency
- Reduction in manual booking time
- Improved payment reconciliation accuracy
- Enhanced customer satisfaction scores
- Decreased employee workload

### Financial Management
- Faster payment collection cycles
- Reduced outstanding amounts
- Improved cash flow visibility
- Better corporate customer retention

## API Documentation

The system provides a comprehensive RESTful API for all functionality. Detailed API documentation is available in `API_DOCUMENTATION.md`.

## Frontend Documentation

The React frontend provides a responsive user interface for all user types. Detailed frontend documentation is available in `frontend/README.md`.

## Deployment

### Backend Deployment
1. Install Node.js and MongoDB
2. Clone the repository
3. Install dependencies: `npm install`
4. Configure environment variables
5. Start the server: `npm start`

### Frontend Deployment
1. Navigate to frontend directory
2. Install dependencies: `npm install`
3. Build for production: `npm run build`
4. Deploy the `dist` folder

## Environment Variables

### Backend
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/yatrasathi
JWT_SECRET=your_jwt_secret_key_here
```

### Frontend
```
VITE_API_URL=http://localhost:5000/api
```

## Testing

The system includes:
- Unit tests for critical functions
- Integration tests for API endpoints
- End-to-end tests for key workflows
- Performance tests for high-load scenarios

## Maintenance

Regular maintenance tasks include:
- Database backups
- Security updates
- Performance monitoring
- Log analysis
- User support

## Support

For support, contact the development team or refer to the documentation.