# YatraSathi - Complete Project Documentation

## 🎯 Project Overview

YatraSathi is a comprehensive Railway Booking Management System with Enterprise Resource Planning (ERP) capabilities, built with Node.js, Express, MySQL, and React.

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Configuration](#database-configuration)
3. [Security & RBAC](#security--rbac)
4. [Admin Panel Features](#admin-panel-features)
5. [UI/UX Implementation](#uiux-implementation)
6. [API Documentation](#api-documentation)
7. [Setup & Deployment](#setup--deployment)
8. [Testing Guide](#testing-guide)

---

## 1. System Architecture

### Backend Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (Sequelize ORM)
- **Authentication:** JWT + Session Management
- **Port:** 5003

### Frontend Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Classic Enterprise Theme (Vintage ERP)
- **Port:** 3002

### Key Directories
```
├── src/
│   ├── controllers/     # Business logic
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation
│   └── scripts/         # Database setup & seeding
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   └── styles/      # CSS files
└── config/
    └── db.js            # Database configuration
```

---

## 2. Database Configuration

### MySQL Connection
**Location:** `config/db.js`

```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'yatrasathi',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);
```

### Environment Variables (.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=yatrasathi
JWT_SECRET=your_jwt_secret
PORT=5003
```

### Database Setup Scripts

**Setup MySQL:** `src/scripts/setup-mysql.js`
- Creates database and tables
- Sets up relationships
- Initializes indexes

**Seed Data:** `src/scripts/seed.js`
- Creates sample data
- Sets up admin user
- Populates security tables

**Run Setup:**
```bash
node src/scripts/setup-mysql.js
node src/scripts/seed.js
```

---

## 3. Security & RBAC

### Role-Based Access Control (RBAC)

**Security Tables:**
- `apApplicationTVL` - Applications
- `moModuleTVL` - Modules
- `opPermissionTVL` - Operations/Permissions
- `fnRoleTVL` - Roles
- `usUserTVL` - Users
- `fpRolePermissionTVL` - Role-Permission mapping
- `upUserPermissionTVL` - User-Permission mapping

### Security Modules (Admin Panel)

1. **Application** - Define applications (e.g., TRVL, ADMN)
2. **Module** - Define modules within applications
3. **Operation** - Define operations/permissions
4. **Role List** - Manage user roles
5. **User List** - Manage system users
6. **Role Permission** - Assign permissions to roles
7. **User Permission** - Assign permissions to users
8. **Customer List** - View customer data

### Authentication Flow

**Login:** `src/controllers/authController.js`
```javascript
// JWT token generation
const token = jwt.sign(
  { userId: user.us_usid, userType: user.us_usertype },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Session creation
await Session.create({
  ss_usid: user.us_usid,
  ss_token: token,
  ss_ipaddr: req.ip,
  ss_active: 1
});
```

**Middleware:** `src/middleware/authMiddleware.js`
- Validates JWT token
- Checks session status
- Attaches user to request

---

## 4. Admin Panel Features

### Dynamic Admin Panel
**Location:** `frontend/src/components/DynamicAdminPanel.jsx`

**Features:**
- ✅ 8 Security modules with full CRUD operations
- ✅ Master data management (Stations, Trains, Companies)
- ✅ Vintage ERP theme with classic enterprise styling
- ✅ Keyboard navigation (Arrow keys, Enter, Escape)
- ✅ Advanced filtering with live search (500ms debounce)
- ✅ Pagination (100 records per page)
- ✅ Audit trail tracking (Created/Modified by/on)
- ✅ Form validation
- ✅ Dropdown cascading (Application → Module → Operation)

### Filter Functionality

**Module-Specific Filters:**

1. **Application:** ID, Short Name
2. **Module:** Application, Module ID, Short Name, Group
3. **Operation:** Application, Module, Operation ID, Short Name
4. **Role List:** Role ID, Role Name
5. **User List:** User ID, Username, Email, Title
6. **Role Permission:** Role, Operation ID, Allow/Deny
7. **User Permission:** User, Operation ID, Allow/Deny
8. **Customer List:** Customer No, Name, Email, Type, Status

**Filter Features:**
- Live search with 500ms debounce
- Highlighted inputs (yellow background when active)
- Record count indicator (filtered/total)
- Clear filters button
- Sticky filter panel

### Styling Theme

**Classic Enterprise (Vintage ERP):**
- Dark grey header (#3a3a3a) with black bold text
- Light blue panels (#e8f4f8)
- Pale blue tables (#f0f8ff)
- Cream input fields (#fffef5)
- Royal blue headers (#4169E1)
- Yellow row selection (#ffffcc)
- No rounded corners or shadows
- Dense layout (12px font, compact spacing)

---

## 5. UI/UX Implementation

### Main Pages

1. **Dashboard** - Overview with statistics
2. **Bookings** - Manage train bookings
3. **Travel Plans** - Plan and share itineraries
4. **Payments** - Payment processing and refunds
5. **Reports** - Booking, Financial, Customer analytics
6. **Employees** - Employee management (admin only)
7. **Admin Panel** - Security and master data management
8. **Profile** - User profile management

### Header Navigation
**Location:** `frontend/src/components/Header.jsx`

- Dark grey background (#3a3a3a)
- Black bold text (15px for links, 18px for logo)
- Dropdown menu for Reports
- Role-based menu items
- Logout functionality

### Global Styling
**Location:** `frontend/src/styles/classic-enterprise-global.css`

- Consistent enterprise theme across all pages
- Classic button gradients
- Vintage table styling
- Form field standardization
- Status badges and alerts

---

## 6. API Documentation

### Base URL
```
http://localhost:5003/api
```

### Authentication Endpoints

**POST /auth/register**
- Register new user
- Body: `{ us_usname, us_email, us_password, us_phone, us_usertype }`

**POST /auth/login**
- User login
- Body: `{ us_email, us_password }`
- Returns: JWT token

**POST /auth/logout**
- Logout user
- Headers: `Authorization: Bearer <token>`

### Security Endpoints

**GET /security/applications** - Get all applications
**POST /security/applications** - Create application
**PUT /security/applications/:id** - Update application
**DELETE /security/applications/:id** - Delete application

**GET /security/modules** - Get all modules
**POST /security/modules** - Create module

**GET /security/users** - Get all users
**POST /security/users** - Create user

**GET /security/customers** - Get all customers

**GET /security/role-permissions** - Get role permissions
**POST /security/role-permissions** - Assign role permission
**POST /security/role-permissions/bulk** - Bulk assign permissions

**GET /security/user-permissions** - Get user permissions
**POST /security/user-permissions** - Assign user permission
**GET /security/user-permissions/effective/:userId** - Get effective permissions

### Booking Endpoints

**GET /bookings** - Get user bookings
**POST /bookings** - Create booking
**PUT /bookings/:id** - Update booking
**DELETE /bookings/:id** - Cancel booking

**GET /bookings/search** - Search bookings
**POST /bookings/:id/assign** - Assign employee

### Payment Endpoints

**GET /payments** - Get payments
**POST /payments** - Create payment
**POST /payments/:id/refund** - Process refund

### Report Endpoints

**GET /reports/bookings** - Booking report
**GET /reports/employee-performance** - Employee performance
**GET /reports/financial** - Financial summary
**GET /reports/customer-analytics** - Customer analytics
**GET /reports/corporate-customers** - Corporate customers

---

## 7. Setup & Deployment

### Initial Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd yatrasathi
```

2. **Install Dependencies**
```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

4. **Setup Database**
```bash
# Create database and tables
node src/scripts/setup-mysql.js

# Seed sample data
node src/scripts/seed.js
```

5. **Start Servers**
```bash
# Backend (Terminal 1)
node src/server.js

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### Default Admin Credentials
```
Email: admin@example.com
Password: Admin@123
```

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start src/server.js --name yatrasathi-backend
```

---

## 8. Testing Guide

### Manual Testing

**Security Modules:**
1. Login as admin
2. Navigate to Admin Panel
3. Test each module (Application, Module, Operation, etc.)
4. Test CRUD operations
5. Test filters
6. Test keyboard navigation

**Booking Flow:**
1. Login as customer
2. Create new booking
3. Make payment
4. View booking in dashboard
5. Test cancellation and refund

### Test Files

Located in root directory:
- `test_auth.js` - Authentication tests
- `test_security_data.js` - Security module tests
- `test_booking_api.js` - Booking API tests
- `test_payment_api.js` - Payment tests
- `test_rbac.js` - RBAC tests

**Run Tests:**
```bash
node test_auth.js
node test_security_data.js
```

---

## 9. Key Features Summary

### ✅ Completed Features

**Security & Access Control:**
- Complete RBAC implementation
- 8 security modules with full CRUD
- Role and user permission management
- Session management with JWT
- Audit trail tracking

**Admin Panel:**
- Dynamic module system
- Advanced filtering (7 module-specific filters)
- Live search with debounce
- Keyboard navigation
- Pagination
- Vintage ERP theme

**Booking System:**
- Train booking management
- Payment processing
- Refund functionality
- Booking reports
- Employee assignment

**UI/UX:**
- Classic enterprise theme
- Dark grey header with black text
- Responsive design
- Consistent styling across all pages
- Status badges and alerts

**Reports:**
- Booking reports with filters
- Employee performance metrics
- Financial summary
- Customer analytics
- Corporate customer reports

---

## 10. MySQL Data Saving Code Locations

### Model Definitions
**Location:** `src/models/`

Each model defines the table structure and uses Sequelize ORM:

```javascript
// Example: src/models/ApplicationTVL.js
const ApplicationTVL = sequelize.define('apApplicationTVL', {
  ap_apid: {
    type: DataTypes.STRING(4),
    primaryKey: true,
    allowNull: false
  },
  ap_apshort: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  // ... other fields
}, {
  tableName: 'apApplicationTVL',
  timestamps: false
});
```

### Controller Save Operations
**Location:** `src/controllers/securityController.js`

**Create (INSERT):**
```javascript
const createApplication = async (req, res) => {
  try {
    const { ap_apid, ap_apshort, ap_apdesc, ap_rmrks } = req.body;
    
    const application = await ApplicationTVL.create({
      ap_apid,
      ap_apshort,
      ap_apdesc,
      ap_rmrks,
      ap_active,
      ap_eby: req.user?.us_usid || 'SYSTEM',
      ap_edtm: new Date()
    });
    
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**Update (UPDATE):**
```javascript
const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      ap_mby: req.user?.us_usid || 'SYSTEM',
      ap_mdtm: new Date()
    };
    
    await ApplicationTVL.update(updateData, {
      where: { ap_apid: id }
    });
    
    const updated = await ApplicationTVL.findByPk(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**Delete (DELETE):**
```javascript
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    
    await ApplicationTVL.destroy({
      where: { ap_apid: id }
    });
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### Frontend Save Handler
**Location:** `frontend/src/components/DynamicAdminPanel.jsx`

```javascript
const handleSave = async () => {
  try {
    const token = localStorage.getItem('token');
    const method = selectedRecord ? 'PUT' : 'POST';
    const url = selectedRecord 
      ? `http://localhost:5003${modules[activeModule].endpoint}/${selectedRecord[modules[activeModule].columns[0]]}`
      : `http://localhost:5003${modules[activeModule].endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      await fetchData(); // Reload data
      setIsEditing(false);
      alert('Record saved successfully');
    }
  } catch (error) {
    alert('Error saving record: ' + error.message);
  }
};
```

### Database Connection
**Location:** `config/db.js`

Sequelize handles all MySQL operations:
- Connection pooling
- Query building
- Transaction management
- Model synchronization

---

## 11. Troubleshooting

### Common Issues

**Database Connection Error:**
- Check MySQL is running
- Verify credentials in .env
- Ensure database exists

**Port Already in Use:**
- Backend: Change PORT in .env
- Frontend: Vite will auto-select next available port

**Authentication Fails:**
- Clear browser localStorage
- Check JWT_SECRET in .env
- Verify session table has records

**Filter Not Working:**
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for errors
- Verify filter fields match model fields

---

## 12. Future Enhancements

- [ ] Email notifications
- [ ] SMS integration
- [ ] Payment gateway integration
- [ ] Mobile app
- [ ] Advanced analytics dashboard
- [ ] Export to Excel/PDF
- [ ] Multi-language support
- [ ] Dark mode theme

---

## 📞 Support

For issues or questions, refer to:
- API Documentation: `API_DOCUMENTATION.md`
- Security Guide: `SECURITY_QUICK_REFERENCE.md`
- Setup Guide: `MYSQL_MIGRATION_GUIDE.md`

---

**Last Updated:** November 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
