# YatraSathi - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Installation and Setup](#installation-and-setup)
4. [Project Architecture](#project-architecture)
5. [Frontend Components](#frontend-components)
6. [Backend Components](#backend-components)
7. [Database Models](#database-models)
8. [Specific Features](#specific-features)
9. [Development Process](#development-process)
10. [Usage Instructions](#usage-instructions)

## 🎯 Project Overview

### Description and Purpose
YatraSathi is a comprehensive Travel Management System designed for enterprise-level travel planning, booking, and accounting. The system provides a complete solution for managing travel plans, passenger bookings, billing, payments, and financial reporting with role-based access control.

### Key Features
- **Multi-role Access**: Admin, Employee, and Customer portals with distinct permissions
- **Travel Planning**: Comprehensive travel plan creation and management
- **Booking Management**: Advanced booking system with passenger details
- **Payment Processing**: Four-section payment system (Contra, Payment, Receipt, Journal Entry)
- **Billing Integration**: Complete billing workflow with accounting entries
- **Reporting System**: ERP-grade JESPR (Journal Entry, Sales, Purchase, Receipt) reporting
- **Keyboard Navigation**: Full keyboard-first accessibility compliance
- **Audit Trail**: Comprehensive logging and tracking of all operations

## ⚙️ Technology Stack

### Backend Technologies
- **Runtime**: Node.js v18+
- **Framework**: Express.js v5.1.0
- **Database**: MySQL 8.0+ with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **Validation**: express-validator
- **File Upload**: multer
- **Caching**: node-cache
- **Real-time**: socket.io
- **Reporting**: excel4node, exceljs, pdfkit

### Frontend Technologies
- **Framework**: React v18.2.0
- **Routing**: React Router v6.21.0
- **Build Tool**: Vite v5.0.8
- **HTTP Client**: axios v1.13.2
- **Styling**: CSS3 with modular approach
- **Charts**: chart.js v4.5.0

### Development Tools
- **Package Manager**: npm
- **Process Manager**: nodemon (development)
- **Code Quality**: ESLint
- **Environment**: dotenv

## 🚀 Installation and Setup

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- npm v9+

### Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd YatraSathi

# Install backend dependencies
npm install

# Create environment file
cp .env.example .env
# Update .env with your database credentials

# Setup database
npm run setup-mysql

# Seed initial data
npm run seed

# Start development server
npm run dev
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables
```env
NODE_ENV=development
PORT=5010
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=TVL_001
DB_NAME_TVL=TVL_001
JWT_SECRET=your_jwt_secret
```

## 🏗️ Project Architecture

### Folder Structure
```
YatraSathi/
├── config/                 # Database configuration
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   └── styles/        # CSS stylesheets
├── public/                # Static assets
├── scripts/               # Setup and utility scripts
├── src/                   # Backend source code
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── tests/                 # Test files
└── package.json           # Project dependencies
```

### Architecture Patterns
- **MVC Pattern**: Model-View-Controller separation
- **Context API**: State management for React components
- **Middleware Chain**: Express middleware for authentication and validation
- **Repository Pattern**: Database abstraction through Sequelize models
- **Service Layer**: Business logic separation from controllers

## 🖥️ Frontend Components

### Core Pages

#### 1. Authentication Pages
- **Login.jsx**: User authentication with role-based login
- **Register.jsx**: New user registration
- **ForgotPassword.jsx**: Password reset request
- **ResetPassword.jsx**: Password reset functionality

#### 2. Dashboard Pages
- **Dashboard.jsx**: Main admin dashboard with analytics
- **AdminDashboard.jsx**: Administrative control panel
- **EmployeeDashboard.jsx**: Employee-specific dashboard
- **CustomerDashboard.jsx**: Customer portal dashboard

#### 3. Booking System
- **Bookings.jsx**: Main booking management interface
- **MyBookings.jsx**: Customer view of their bookings
- **CustomerBookingDetails.jsx**: Detailed booking information
- **BookingForm.jsx**: Customer booking creation form

#### 4. Payment System
- **Payments.jsx**: Main payment module entry point
- **PaymentForm.jsx**: Payment processing (money going out)
- **ReceiptForm.jsx**: Receipt processing (money coming in)
- **ContraForm.jsx**: Contra transfers (cash to bank/bank to cash)
- **JournalForm.jsx**: Journal entries and adjustments

#### 5. Billing System
- **Billing.jsx**: Main billing interface
- **BillingNew.jsx**: New billing creation
- **BillsPayments.jsx**: Customer bills and payments view

#### 6. Travel Management
- **TravelPlans.jsx**: Travel plan management
- **TravelPlanDetail.jsx**: Detailed travel plan view
- **EditTravelPlan.jsx**: Travel plan editing interface

#### 7. Customer Portal
- **CustomerProfile.jsx**: Customer profile management
- **MasterPassengerList.jsx**: Master passenger management
- **MasterPassengerListML.jsx**: Master list management

#### 8. Administration
- **EmployeeManagement.jsx**: Employee administration
- **Profile.jsx**: User profile management
- **Reports.jsx**: Reporting interface
- **PassengerList.jsx**: Passenger management

### Core Components

#### Authentication Components
- **Header.jsx**: Main navigation header
- **CustomerHeader.jsx**: Customer-specific header
- **Footer.jsx**: Page footer
- **ProtectedRoute.jsx**: Route protection wrapper
- **RoleBasedRoute.jsx**: Role-based route access control

#### UI Components
- **DynamicAdminPanel.jsx**: Dynamic admin interface
- **MessageDisplay.jsx**: System message notifications
- **Modal.jsx**: Reusable modal component
- **ShareTravelPlanModal.jsx**: Travel plan sharing functionality

#### Context Providers
- **AuthContext.jsx**: Authentication state management
- **BookingContext.jsx**: Booking-related state
- **PaymentContext.jsx**: Payment processing state
- **ReportContext.jsx**: Reporting data management
- **KeyboardNavigationContext.jsx**: Keyboard navigation system

### Custom Hooks

#### 1. useKeyboardNavigation.js
Implements comprehensive keyboard-first navigation system:
- Tab navigation with custom order
- Enter key handling for form submission
- Escape key for cancellation
- F10 for save confirmation
- Focus management and trap handling

#### 2. useKeyboardForm.js
Form-specific keyboard navigation:
- Field registration and ordering
- Form-level keyboard event handling
- Save confirmation modal integration

#### 3. useCustomerLookup.js
Customer search and lookup functionality:
- Real-time customer search
- Phone number-based lookup
- Customer data validation
- Financial information display

#### 4. usePhoneLookup.js
Phone number validation and lookup:
- Format validation
- Duplicate checking
- Customer identification

#### 5. usePassengerEntry.js
Passenger data entry system:
- Tab-based passenger entry
- Passenger list management
- Validation and error handling

### Styling System

#### CSS Framework Approach
- **Modular CSS**: Component-specific stylesheets
- **Utility Classes**: Reusable styling utilities
- **Theme System**: Vintage and modern theme support
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance

#### Key Style Files
- **App.css**: Global application styles
- **index.css**: Base styling and resets
- **dense.css**: Compact UI styling
- **dashboard.css**: Dashboard-specific styles
- **vintage-theme.css**: Vintage theme implementation

## ⚙️ Backend Components

### Controllers

#### 1. Authentication Controllers
- **authController.js**: User authentication and session management
- **profileController.js**: User profile operations
- **securityController.js**: Security and permission management

#### 2. Booking Controllers
- **bookingController.js**: Booking creation, modification, and management
- **passengerController.js**: Passenger data handling
- **masterPassengerController.js**: Master passenger management
- **masterPassengerListController.js**: Master passenger list operations

#### 3. Payment Controllers
- **paymentController.js**: Payment processing
- **receiptController.js**: Receipt management
- **contraController.js**: Contra transfer operations
- **journalController.js**: Journal entry handling
- **employeePaymentController.js**: Employee payment operations

#### 4. Billing Controllers
- **billingController.js**: Billing creation and management
- **billingIntegrationController.js**: Billing system integration
- **accountingController.js**: Accounting entry management

#### 5. Customer Controllers
- **customerController.js**: Customer management and operations
- **corporateCustomerController.js**: Corporate customer handling

#### 6. Reporting Controllers
- **reportController.js**: Report generation and management
- **genericReportController.js**: Generic reporting functionality
- **statisticsController.js**: Statistical data generation

#### 7. Administrative Controllers
- **employeeController.js**: Employee management
- **dashboardController.js**: Dashboard data aggregation
- **adminController.js**: Administrative operations
- **configController.js**: System configuration

#### 8. Utility Controllers
- **auditController.js**: Audit trail management
- **notificationController.js**: Notification system
- **searchController.js**: Search functionality
- **healthController.js**: System health monitoring

### Middleware

#### 1. Authentication Middleware
- **authMiddleware.js**: JWT token validation
- **sessionMiddleware.js**: Session management

#### 2. Authorization Middleware
- **rbacMiddleware.js**: Role-Based Access Control
- **bookingAuthorization.js**: Booking-specific permissions
- **departmentAccessControl.js**: Department-level access control
- **reportRBAC.js**: Report access control
- **reportValidation.js**: Report data validation

#### 3. Utility Middleware
- **errorHandler.js**: Global error handling
- **uploadMiddleware.js**: File upload handling

### Routes

#### API Route Structure
```
/api/
├── auth/              # Authentication endpoints
├── bookings/          # Booking management
├── payments/          # Payment processing
├── receipts/          # Receipt operations
├── contra/            # Contra transfers
├── journal/           # Journal entries
├── billing/           # Billing operations
├── customers/         # Customer management
├── employees/         # Employee operations
├── reports/           # Reporting endpoints
├── dashboard/         # Dashboard data
├── search/            # Search functionality
├── config/            # Configuration
└── health/            # Health checks
```

## 🗄️ Database Models

### Core Models

#### 1. User Management
- **User.js**: User account information
- **Employee.js**: Employee details and hierarchy
- **Customer.js**: Customer information
- **CorporateCustomer.js**: Corporate customer data
- **Role.js**: User roles and permissions
- **Permission.js**: Permission definitions

#### 2. Booking System
- **Booking.js**: Booking master data
- **Passenger.js**: Passenger information
- **Pnr.js**: PNR (Passenger Name Record) management
- **TravelPlan.js**: Travel plan details

#### 3. Payment System
- **Payment.js**: Payment transactions
- **Receipt.js**: Receipt records
- **Contra.js**: Contra transfer records
- **Journal.js**: Journal entries
- **PaymentEntry.js**: Payment entry details
- **ReceiptEntry.js**: Receipt entry details
- **ContraEntry.js**: Contra entry details
- **JournalEntry.js**: Journal entry details

#### 4. Billing System
- **BillingMaster.js**: Billing master records
- **AccountingEntry.js**: Accounting ledger entries
- **Ledger.js**: Ledger management
- **LedgerMaster.js**: Ledger master data

#### 5. Customer Management
- **CustomerContact.js**: Customer contact information
- **CustomerAdvance.js**: Customer advance payments
- **CustomerMasterPassenger.js**: Customer master passenger data

#### 6. Audit and Logging
- **Audit.js**: Audit trail records
- **Login.js**: Login session tracking
- **Session.js**: User session management

#### 7. Configuration
- **Config.js**: System configuration
- **Station.js**: Railway station data
- **Train.js**: Train information
- **Company.js**: Company details
- **ModuleTVL.js**: Module tracking

### Model Relationships
- **One-to-Many**: Users to Bookings, Customers to Bookings
- **Many-to-Many**: Users to Roles, Roles to Permissions
- **Self-Referencing**: Employees to Employees (hierarchy)
- **Polymorphic**: Audit trails for multiple entity types

## 🎯 Specific Features

### 4 Payment Sections Implementation

#### 1. Payment Section (PaymentForm.jsx)
**Purpose**: Process outgoing payments (money going out)
**Features**:
- Customer search and selection
- Account selection (Cash, Bank, Customer Account)
- Amount validation and processing
- Debit/Credit amount calculation
- Audit trail with created/modified details
- Real-time financial summary display

#### 2. Receipt Section (ReceiptForm.jsx)
**Purpose**: Process incoming payments (money coming in)
**Features**:
- Customer identification and validation
- Payment method selection
- Credit amount processing
- Reference number tracking
- Balance calculation and display

#### 3. Contra Section (ContraForm.jsx)
**Purpose**: Handle cash to bank and bank to cash transfers
**Features**:
- Transfer type selection (Cash → Bank / Bank → Cash)
- Account balance validation
- Transfer amount verification
- Dual entry accounting (debit and credit)

#### 4. Journal Section (JournalForm.jsx)
**Purpose**: Process adjustments and other accounting entries
**Features**:
- Debit and credit account selection
- Journal entry categorization
- Adjustment reason documentation
- Multi-account entry support

### Two-Section Structure Implementation

#### Payment Form Section
**Components**:
- Form fields with proper validation
- Customer search functionality
- Financial data display (balance, totals)
- Audit information (created by, modified by)
- Save and reset functionality

#### Payment Records Section
**Features**:
- Grouped payment records by customer
- Debit/Credit column logic implementation
- Date-based sorting and filtering
- Detailed transaction information
- Export and print capabilities

### Customer Search Functionality

#### Search Implementation
- **Real-time Search**: Instant results as user types
- **Multiple Criteria**: Search by name, phone, or ID
- **Smart Matching**: Fuzzy search and partial matches
- **Financial Data**: Display customer balance and history
- **Quick Selection**: Click-to-select functionality

#### Data Management
- **Cache System**: Optimized search performance
- **Validation**: Phone number and data integrity checks
- **Duplicate Prevention**: Smart duplicate detection
- **History Tracking**: Search history and preferences

### Authentication and Authorization

#### Multi-Role System
- **Admin (ADM)**: Full system access
- **Employee (EMP)**: Operational access
- **Customer (CUS)**: Limited customer portal access
- **Agent (AGT)**: Agent-specific operations

#### Security Features
- **JWT Tokens**: Secure session management
- **Role-Based Access Control**: Granular permission system
- **Session Tracking**: Login/logout monitoring
- **Password Security**: bcrypt hashing with salt
- **Audit Logging**: Comprehensive access tracking

### Error Handling and Debugging

#### Error Management
- **Global Error Handler**: Centralized error processing
- **Validation Errors**: Field-specific error messages
- **Database Errors**: Connection and query error handling
- **User-Friendly Messages**: Clear error communication

#### Debugging Tools
- **Console Logging**: Detailed operation tracking
- **Audit Trails**: Comprehensive action logging
- **Performance Monitoring**: Query performance tracking
- **Health Checks**: System status monitoring

## 🛠️ Development Process

### Major Fixes and Improvements

#### 1. Performance Optimizations
- **Query Optimization**: Database query performance improvements
- **Component Memoization**: React component optimization
- **State Management**: Efficient context usage
- **Memory Management**: Reduced memory footprint
- **Loading States**: Improved user experience during operations

#### 2. UI/UX Improvements
- **Responsive Design**: Mobile-friendly interface
- **Keyboard Navigation**: Full keyboard accessibility
- **Visual Hierarchy**: Improved information architecture
- **Consistent Styling**: Unified design system
- **Error Handling**: Better user feedback

#### 3. Bug Fixes
- **Infinite Loop Resolution**: Fixed keyboard navigation loops
- **State Management**: Resolved context-related issues
- **Data Validation**: Enhanced input validation
- **Race Conditions**: Fixed asynchronous operation issues
- **Memory Leaks**: Addressed component lifecycle issues

#### 4. Feature Enhancements
- **Payment System**: Complete payment processing workflow
- **Billing Integration**: Seamless billing and accounting
- **Reporting System**: Advanced reporting capabilities
- **Search Functionality**: Enhanced search and filtering
- **Audit System**: Comprehensive tracking and logging

### Testing and Verification

#### Automated Testing
- **Unit Tests**: Component and function testing
- **Integration Tests**: API and workflow testing
- **End-to-End Tests**: Complete user journey testing
- **Performance Tests**: Load and stress testing

#### Manual Verification
- **User Acceptance Testing**: Business requirement validation
- **Accessibility Testing**: WCAG compliance verification
- **Cross-Browser Testing**: Browser compatibility
- **Mobile Testing**: Responsive design validation

## 📖 Usage Instructions

### Running the Application

#### Development Mode
```bash
# Start backend server
npm run dev

# Start frontend development server
cd frontend && npm run dev
```

#### Production Deployment
```bash
# Build frontend
cd frontend && npm run build

# Start production server
npm start
```

### Navigation and User Roles

#### Admin Access
- **Dashboard**: System overview and analytics
- **User Management**: Employee and customer administration
- **Booking Management**: Complete booking system access
- **Payment Processing**: All payment types
- **Reporting**: Advanced reporting tools
- **System Configuration**: Application settings

#### Employee Access
- **Employee Dashboard**: Personal workspace
- **Booking Creation**: Customer booking assistance
- **Payment Processing**: Payment handling
- **Customer Management**: Customer interaction
- **Reporting**: Department-specific reports

#### Customer Access
- **Customer Dashboard**: Personal travel overview
- **Booking Creation**: Self-service booking
- **My Bookings**: Booking history and management
- **Payment Portal**: Bill payment and history
- **Profile Management**: Personal information

### Keyboard Navigation Shortcuts

#### Global Shortcuts
- **Tab**: Move to next focusable element
- **Shift+Tab**: Move to previous focusable element
- **Enter**: Activate current element
- **Escape**: Cancel/close current operation
- **F10**: Save current form

#### Form Navigation
- **Arrow Keys**: Navigate within form elements
- **Space**: Toggle checkboxes and radio buttons
- **Ctrl+S**: Quick save (when supported)

#### Special Features
- **Double Tab**: Exit passenger entry loop
- **Context Menu**: Right-click or Shift+F10 for actions
- **Quick Search**: Start typing in search fields

### Special Features and Functionality

#### Advanced Search
- **Multi-criteria Search**: Search by multiple parameters
- **Smart Filters**: Dynamic filtering options
- **Saved Searches**: Bookmark frequently used searches
- **Export Results**: Export search results to various formats

#### Reporting System
- **Custom Reports**: Create personalized reports
- **Scheduled Reports**: Automated report generation
- **Export Options**: PDF, Excel, CSV formats
- **Dashboard Widgets**: Real-time data visualization

#### Integration Features
- **API Integration**: Third-party system connectivity
- **Data Import/Export**: Bulk data operations
- **Notification System**: Real-time alerts and updates
- **Audit Trail**: Comprehensive activity logging

---

*This documentation provides a comprehensive overview of the YatraSathi Travel Management System. For specific implementation details, refer to individual component files and inline code documentation.*