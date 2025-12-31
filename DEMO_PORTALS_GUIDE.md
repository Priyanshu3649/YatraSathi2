# 🚀 YatraSathi Demo Portals Guide

## 🎯 Quick Access

**Main Demo Page:** http://localhost:5003/
**Password for all accounts:** `demo123`

## 👥 Employee Portal Access

**URL:** http://localhost:5003/auth/employee-login

### Available Employee Accounts:

| Role | Name | Email | Dashboard Features |
|------|------|-------|-------------------|
| **Agent** | Rajesh Kumar | `rajesh.agent@yatrasathi.com` | Booking management, performance metrics, customer assignments |
| **Accounts** | Priya Sharma | `priya.accounts@yatrasathi.com` | Payment processing, aging reports, financial reconciliation |
| **HR** | Amit Singh | `amit.hr@yatrasathi.com` | Employee roster, department analytics, recent joiners |
| **Support** | Sunita Patel | `sunita.support@yatrasathi.com` | Customer inquiries, ticket management, support metrics |
| **Marketing** | Vikram Gupta | `vikram.marketing@yatrasathi.com` | Corporate clients, campaign analytics, lead management |
| **Management** | Deepak Agarwal | `deepak.manager@yatrasathi.com` | Executive overview, financial summary, performance leaderboards |
| **Agent** | Neha Joshi | `neha.agent@yatrasathi.com` | Junior agent dashboard with assigned bookings |
| **Agent** | Rohit Verma | `rohit.agent@yatrasathi.com` | Junior agent dashboard with training metrics |

## 👤 Customer Portal Access

**URL:** http://localhost:5003/auth/login

### Available Customer Accounts:

| Name | Email | Profile | Booking History |
|------|-------|---------|-----------------|
| **Arjun Mehta** | `arjun.mehta@gmail.com` | Bangalore-based frequent traveler | Multiple confirmed bookings |
| **Kavya Reddy** | `kavya.reddy@yahoo.com` | Mumbai-based business traveler | Recent bookings and payments |
| **Ravi Iyer** | `ravi.iyer@hotmail.com` | Delhi-based family traveler | Mixed booking statuses |

## 📊 Demo Data Overview

### Employee Dashboard Features:
- **Agent Dashboard:** 
  - 15+ bookings assigned across agents
  - Performance metrics and conversion rates
  - Recent booking management
  - Customer search functionality

- **Accounts Dashboard:**
  - ₹19,700+ in total payments
  - 3 pending payments worth ₹5,000
  - Payment processing workflows
  - Aging reports and reconciliation

- **HR Dashboard:**
  - 8 active employees across departments
  - Department breakdown (Booking, Accounts, HR, Support, Marketing, Management)
  - Recent joiners tracking
  - Employee roster management

- **Support Dashboard:**
  - 2 open tickets/inquiries
  - Customer assistance workflows
  - Response time tracking
  - Knowledge base access

- **Marketing Dashboard:**
  - 3 corporate clients (TechCorp, Global Industries, Innovative Systems)
  - Client relationship management
  - Campaign analytics
  - Lead conversion tracking

- **Management Dashboard:**
  - Complete business overview
  - ₹19,700+ total revenue
  - 8 bookings this month
  - Top performer leaderboards
  - Executive action center

### Customer Portal Features:
- **Dashboard:**
  - Booking statistics and history
  - Active booking tracking
  - Payment history
  - Quick action buttons

- **Booking System:**
  - Multi-step booking form (Journey → Passengers → Review)
  - Real-time validation
  - Multiple passenger support (up to 6)
  - Class and berth preference selection

- **Travel History:**
  - Complete booking timeline
  - Status tracking (Pending, Confirmed, Cancelled)
  - Payment integration
  - Booking details and modifications

## 🎨 UI/UX Features Demonstrated

### Employee Portal:
- **Dynamic Sidebar:** Auto-generated navigation based on user role
- **Role-based Dashboards:** Each role sees relevant metrics and tools
- **Real-time Data:** Live statistics and performance indicators
- **Responsive Design:** Works on desktop and mobile devices
- **Professional Styling:** Enterprise-grade UI with vintage ERP theme

### Customer Portal:
- **Modern Interface:** Clean, user-friendly design
- **Step-by-step Booking:** Intuitive multi-step form
- **Visual Feedback:** Progress indicators and status badges
- **Mobile Responsive:** Optimized for all device sizes
- **Error Handling:** User-friendly error messages and validation

## 🔧 Technical Features

### Authentication:
- **JWT-based Authentication:** Secure token management
- **Role-based Access Control:** Different permissions per role
- **Session Management:** Automatic logout and session tracking
- **Password Security:** Bcrypt hashing with salt

### Backend Architecture:
- **RESTful APIs:** Standardized API responses
- **Database Integration:** MySQL with Sequelize ORM
- **Error Handling:** Comprehensive error parsing and user-friendly messages
- **Audit Logging:** Complete audit trail for all operations
- **Data Validation:** Server-side validation for all inputs

### Frontend Architecture:
- **React Router:** Client-side routing with protected routes
- **Component Architecture:** Reusable, modular components
- **State Management:** Context-based state management
- **CSS Architecture:** Modular CSS with responsive design
- **Form Handling:** Advanced form validation and submission

## 🚀 Getting Started

1. **Start the Server:**
   ```bash
   npm start
   ```

2. **Access Demo Page:**
   Visit http://localhost:5003/

3. **Try Different Roles:**
   - Login with different employee accounts to see role-specific dashboards
   - Login as customers to experience the booking flow
   - Create new bookings and see them appear in agent dashboards

4. **Explore Features:**
   - Navigate through different dashboard sections
   - Try creating a new booking as a customer
   - Check how data flows between different user roles

## 📈 Business Workflow Demonstration

### Complete Booking Workflow:
1. **Customer** creates booking via customer portal
2. **Agent** receives assignment and processes booking
3. **Accounts** handles payment processing and reconciliation
4. **Support** assists with any customer inquiries
5. **Management** monitors overall performance and metrics

### Data Flow:
- Customer bookings appear in agent dashboards
- Payments flow through accounts dashboard
- All activities are tracked in management overview
- Support can access customer information for assistance

## 🎯 Key Demonstration Points

1. **Role-based Security:** Each user sees only relevant data and functions
2. **Real-time Updates:** Data changes reflect across different dashboards
3. **Professional UI:** Enterprise-grade interface with consistent styling
4. **Complete Workflows:** End-to-end business process implementation
5. **Scalable Architecture:** Modular design supporting multiple user types
6. **Mobile Responsive:** Works seamlessly across all device types

## 🔍 What to Look For

- **Dashboard Personalization:** Each role has unique metrics and tools
- **Data Relationships:** How bookings, payments, and users interconnect
- **User Experience:** Smooth navigation and intuitive interfaces
- **Error Handling:** Graceful error messages and validation feedback
- **Performance Metrics:** Real-time statistics and KPI tracking
- **Responsive Design:** Consistent experience across devices

---

**Enjoy exploring the YatraSathi demo portals!** 🎉