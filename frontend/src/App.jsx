import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { ReportProvider } from './contexts/ReportContext';
import './App.css';
import './styles/dashboard.css';
import './styles/vintage-theme.css';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import DynamicAdminPanel from './components/DynamicAdminPanel';
import MessageDisplay from './components/MessageDisplay';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import RoleBasedRoute from './components/RoleBasedRoute';

// Import customer components
import CustomerHeader from './components/Customer/CustomerHeader';

// Import auth components

// Import employee components
import EmployeeDashboard from './components/Employee/EmployeeDashboard';

// Import customer components
import CustomerDashboard from './components/Customer/SimpleCustomerDashboard';
import BookingForm from './components/Customer/BookingForm';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import TravelPlans from './pages/TravelPlans';
import TravelPlanDetail from './pages/TravelPlanDetail';
import EditTravelPlan from './pages/EditTravelPlan';
import Billing from './pages/Billing';

// Import customer pages
import MyBookings from './pages/MyBookings';
import BillsPayments from './pages/BillsPayments';
import CustomerProfile from './pages/CustomerProfile';
import CustomerBookingDetails from './pages/CustomerBookingDetails';

function App() {
  const UnauthorizedPage = () => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h1 style={{
            color: '#dc2626',
            fontSize: '2rem',
            marginBottom: '15px'
          }}>
            Access Denied
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            marginBottom: '20px'
          }}>
            You don't have permission to access this page.
          </p>
          <div style={{
            marginTop: '20px'
          }}>
            <Link 
              to="/dashboard" 
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
                marginRight: '10px',
                display: 'inline-block'
              }}
            >
              Go to Dashboard
            </Link>
            <Link 
              to="/" 
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Conditional Header component
  const ConditionalHeader = () => {
    const { user } = useAuth();
    
    // Show customer header only for customers, otherwise show regular header
    if (user && (user.us_roid === 'CUS')) {
      return <CustomerHeader />;
    }
    return <Header />;
  };

  return (
    <AuthProvider>
      <BookingProvider>
        <PaymentProvider>
          <ReportProvider>
            <Router future={{ 
              v7_startTransition: true,
              v7_relativeSplatPath: true 
            }}>
              <div className="App">
                <MessageDisplay />
                <ConditionalHeader />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    
                    {/* Authentication Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    
                    {/* Employee Portal Routes */}
                    <Route path="/employee/*" element={<EmployeeDashboard />} />
                    
                    {/* Legacy Routes */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/travel-plans" element={<TravelPlans />} />
                    <Route path="/travel-plans/:id" element={<TravelPlanDetail />} />
                    <Route path="/travel-plans/edit/:id" element={<EditTravelPlan />} />
                    <Route path="/travel-plans/new" element={<EditTravelPlan />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/profile" element={<Profile />} />
                    
                    {/* Unauthorized Access Route */}
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                    
                    {/* Admin Routes with Role-Based Access Control */}
                    <Route path="/admin-dashboard" element={<RoleBasedRoute requiredRole="ADM"><DynamicAdminPanel /></RoleBasedRoute>} />
                    <Route path="/admin/*" element={<RoleBasedRoute requiredRole="ADM"><DynamicAdminPanel /></RoleBasedRoute>} />
                    
                    {/* Employee Routes with Role-Based Access Control */}
                    <Route path="/employee/dashboard" element={<RoleBasedRoute requiredModule="employee"><EmployeeDashboard /></RoleBasedRoute>} />
                    <Route path="/employee/*" element={<RoleBasedRoute requiredModule="employee"><EmployeeDashboard /></RoleBasedRoute>} />
                    
                    {/* Customer Portal Routes */}
                    <Route path="/customer/booking/new" element={<BookingForm />} />
                    
                    {/* Customer Routes with Role-Based Access Control */}
                    <Route path="/customer/dashboard" element={<RoleBasedRoute requiredRole="CUS"><CustomerDashboard /></RoleBasedRoute>} />
                    <Route path="/customer/booking/new" element={<RoleBasedRoute requiredRole="CUS"><BookingForm /></RoleBasedRoute>} />
                    <Route path="/customer/bookings" element={<RoleBasedRoute requiredRole="CUS"><MyBookings /></RoleBasedRoute>} />
                    <Route path="/customer/bookings/:bookingId" element={<RoleBasedRoute requiredRole="CUS"><CustomerBookingDetails /></RoleBasedRoute>} />
                    <Route path="/customer/bills-payments" element={<RoleBasedRoute requiredRole="CUS"><BillsPayments /></RoleBasedRoute>} />
                    <Route path="/customer/profile" element={<RoleBasedRoute requiredRole="CUS"><CustomerProfile /></RoleBasedRoute>} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </ReportProvider>
        </PaymentProvider>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;