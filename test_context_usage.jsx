// Test component to verify context usage
import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { useBooking } from './contexts/BookingContext';
import { usePayment } from './contexts/PaymentContext';
import { useReport } from './contexts/ReportContext';

const TestContextComponent = () => {
  const { user, isAuthenticated } = useAuth();
  const { bookings, loading: bookingLoading } = useBooking();
  const { payments, loading: paymentLoading } = usePayment();
  const { reports, loading: reportLoading } = useReport();

  return (
    <div>
      <h2>Context Usage Test</h2>
      <div>
        <h3>Auth Context</h3>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        {user && <p>User: {user.us_fname} {user.us_lname}</p>}
      </div>
      
      <div>
        <h3>Booking Context</h3>
        <p>Loading: {bookingLoading ? 'Yes' : 'No'}</p>
        <p>Bookings Count: {bookings.length}</p>
      </div>
      
      <div>
        <h3>Payment Context</h3>
        <p>Loading: {paymentLoading ? 'Yes' : 'No'}</p>
        <p>Payments Count: {payments.length}</p>
      </div>
      
      <div>
        <h3>Report Context</h3>
        <p>Loading: {reportLoading ? 'Yes' : 'No'}</p>
        <p>Reports Available: {reports ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default TestContextComponent;