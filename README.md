# YatraSathi - Railway Booking Management System

A comprehensive enterprise-level railway ticket booking and management system built with modern web technologies.

## 🚀 Overview

YatraSathi is a full-featured railway booking management system that serves multiple user roles including customers, employees, and administrators. The system provides end-to-end functionality for railway ticket booking, billing, payment processing, and financial management.

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js + Express.js
- **Frontend**: React 18 + Vite
- **Database**: MySQL (TVL_001)
- **ORM**: Sequelize
- **Authentication**: JWT
- **Styling**: Custom CSS with vintage ERP themes

### System Architecture
```
├── Backend (Node.js/Express)
│   ├── Controllers (Business Logic)
│   ├── Models (Database Schema)
│   ├── Routes (API Endpoints)
│   └── Middleware (Auth, Error Handling)
│
├── Frontend (React/Vite)
│   ├── Components (UI Elements)
│   ├── Pages (Views)
│   ├── Contexts (State Management)
│   └── Services (API Integration)
│
└── Database (MySQL)
    ├── Users & Roles
    ├── Bookings & Passengers
    ├── Payments & Billing
    └── Financial Records
```

## 🎯 Key Features

### User Management
- Multi-role system (Customer, Employee, Admin)
- Role-based access control
- User authentication and session management
- Profile management

### Booking System
- Railway ticket booking management
- Passenger details handling
- PNR (Passenger Name Record) management
- Station and train information
- Booking status tracking (Draft, Confirmed, Cancelled)

### Billing & Accounting
- Automated bill generation from bookings
- Payment processing and allocation
- Ledger management
- Financial reporting
- GST and tax calculations

### Payment System
- Multiple payment modes (Cash, Bank, Cheque, Draft)
- Payment allocation to bookings
- Receipt and contra voucher management
- Journal entries for adjustments

### Customer Portal
- Self-service booking
- Master passenger list management
- Booking history and details
- Bill and payment tracking

### Employee Portal
- Agent dashboard
- Booking management
- Customer service tools
- Reporting capabilities

### Admin Panel
- System configuration
- User and role management
- Permission management
- Audit trails
- System monitoring

### Spreadsheet Reporting (JESPR-inspired)
- Interactive spreadsheet-like interface
- Column sorting and row filtering
- Data export to CSV and Excel
- Cell editing capabilities
- Custom column formatting
- Demo available in Reports section

## 📁 Project Structure

```
YatraSathi/
├── config/                 # Database and app configuration
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   └── styles/        # CSS stylesheets
│   └── package.json
├── src/                   # Backend source code
│   ├── controllers/       # Route handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── server.js          # Main server file
├── public/                # Static assets
├── scripts/               # Utility scripts
├── tests/                 # Test files
├── .env                   # Environment variables
└── package.json           # Project dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- npm or yarn package manager

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd YatraSathi
```

2. **Install backend dependencies:**
```bash
npm install
```

3. **Install frontend dependencies:**
```bash
cd frontend
npm install
cd ..
```

4. **Configure environment variables:**
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5010
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=TVL_001
DB_NAME_TVL=TVL_001
JWT_SECRET=your_jwt_secret_key
```

5. **Set up the database:**
```bash
npm run setup-mysql
```

6. **Start the development servers:**

Backend server:
```bash
npm run dev
```

Frontend server (in a new terminal):
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000 (or 3001/3002)
- Backend API: http://localhost:5010

## 📊 Database Schema

The system uses MySQL with the following key tables:
- **Users**: User accounts and authentication
- **Bookings**: Railway ticket bookings
- **Passengers**: Passenger details
- **Payments**: Payment transactions
- **Bills**: Generated invoices
- **Ledgers**: Financial records
- **Stations**: Railway stations
- **Trains**: Train information

## 🔧 Development

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run setup-mysql` - Set up MySQL database
- `npm run seed` - Seed database with sample data

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Structure Guidelines

- **Backend**: Follow MVC pattern with controllers, models, and routes
- **Frontend**: Component-based architecture with React hooks
- **Database**: Use Sequelize ORM for database operations
- **API**: RESTful endpoints with consistent response formats

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- SQL injection protection (Sequelize ORM)
- CORS configuration
- Secure password handling (bcrypt)

## 📱 User Roles

### Customer (CUS)
- Book tickets
- Manage bookings
- View bills and payments
- Maintain passenger lists

### Employee (AGT, ACC, HR, etc.)
- Manage customer bookings
- Process payments
- Generate bills
- Access reports

### Admin (ADM)
- Full system access
- User management
- System configuration
- Audit trails

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error:**
- Verify MySQL server is running
- Check database credentials in `.env`
- Ensure database exists

**Port Conflicts:**
- Change PORT in `.env` file
- Kill processes using the port

**Authentication Issues:**
- Verify JWT_SECRET is set
- Check token expiration
- Clear browser storage

### Debugging

Enable detailed logging:
```bash
# Backend logs
NODE_ENV=development npm run dev

# Database queries
# Set logging: true in db.js sequelize configuration
```

## 📈 Performance

- Database connection pooling
- API response caching
- Frontend code splitting
- Lazy loading components
- Optimized database queries

## 🧪 Testing

The project includes comprehensive test suites:
```bash
# Run all tests
npm test

# Run specific test categories
npm run test-auth
npm run test-booking
npm run test-billing
```

## 📚 Documentation

- API Documentation: Available in `src/routes/`
- Component Documentation: Inline JSDoc comments
- Business Logic: Controller files contain detailed comments
- Database Schema: Model files define structure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check existing documentation
- Review test files for examples
- Open an issue on the repository

## 📄 License

This project is proprietary software for railway booking management.

## 🔄 Recent Updates

- Fixed keyboard navigation issues
- Enhanced billing integration
- Improved error handling
- Added comprehensive test coverage
- Updated UI components with ERP styling

---

*YatraSathi - Your trusted railway booking companion*