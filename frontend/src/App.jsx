import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import TravelPlans from './pages/TravelPlans';
import TravelPlanDetail from './pages/TravelPlanDetail';
import EditTravelPlan from './pages/EditTravelPlan';
import EmployeeManagement from './pages/EmployeeManagement';

function App() {
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
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/travel-plans" element={<TravelPlans />} />
                    <Route path="/travel-plans/:id" element={<TravelPlanDetail />} />
                    <Route path="/travel-plans/edit/:id" element={<EditTravelPlan />} />
                    <Route path="/travel-plans/new" element={<EditTravelPlan />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/employees" element={<EmployeeManagement />} />
                    <Route path="/admin-dashboard" element={<DynamicAdminPanel />} />
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