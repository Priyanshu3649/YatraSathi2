import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import '../styles/print-booking.css';

const PrintBooking = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleClose = useCallback(() => {
    const returnTo = location.state?.returnTo;
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate('/bookings');
    }
  }, [navigate, location.state]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await bookingAPI.getBookingById(bookingId);
        if (res && res.success) {
          setBooking(res.data);
        } else {
          setError(res?.message || 'Failed to load booking details');
        }
      } catch (err) {
        console.error('Print load error:', err);
        setError('Failed to fetch booking details');
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) {
      loadData();
    }
  }, [bookingId]);

  if (loading) return <div className="print-loading">Loading booking details...</div>;
  if (error) return <div className="print-error">{error}<button onClick={handleClose}>Back</button></div>;
  if (!booking) return <div className="print-error">Booking not found<button onClick={handleClose}>Back</button></div>;

  return (
    <div className="print-booking-container a5-portrait">
      <div className="print-controls no-print">
        <button onClick={() => window.print()} className="btn-print">🖨️ Print Booking</button>
        <button onClick={handleClose} className="btn-close">Close</button>
      </div>

      <div className="print-page">
        <div className="print-header">
          <h2>BOOKING SLIP</h2>
          <div className="booking-meta">
            <div><strong>Booking ID:</strong><br/>{booking.bk_bkid}</div>
            <div><strong>Date:</strong><br/>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : (booking.bk_date ? new Date(booking.bk_date).toLocaleDateString() : 'N/A')}</div>
          </div>
        </div>

        <div className="print-section">
          <h3>Customer Details</h3>
          <div className="details-grid">
            <div><strong>Customer Name:</strong><br/>{booking.customer ? `${booking.customer.cs_fname || ''} ${booking.customer.cs_lname || ''}`.trim() : (booking.customer_name_snapshot || 'N/A')}</div>
            <div><strong>Phone Number:</strong><br/>{booking.customer?.cs_phone || booking.customer_phone_snapshot || 'N/A'}</div>
            <div><strong>PNR Number:</strong><br/>{booking.bk_pnr || 'PNR will be populated after billing'}</div>
            <div><strong>From Station:</strong><br/>{booking.bk_fromstation || booking.fromStation?.st_stname || booking.bk_fromst || 'N/A'}</div>
            <div><strong>To Station:</strong><br/>{booking.bk_tostation || booking.toStation?.st_stname || booking.bk_tost || 'N/A'}</div>
            <div><strong>Travel Date:</strong><br/>{booking.bk_trvldt ? new Date(booking.bk_trvldt).toLocaleDateString() : 'N/A'}</div>
            <div><strong>Class:</strong><br/>{booking.bk_class || 'N/A'}</div>
            <div><strong>Quota:</strong><br/>{booking.bk_quota || 'N/A'}</div>
          </div>
        </div>

        {booking.passengers && booking.passengers.length > 0 && (
          <div className="print-section">
            <h3>Passenger Details</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Berth</th>
                </tr>
              </thead>
              <tbody>
                {booking.passengers.map((p, i) => (
                  <tr key={i}>
                    <td>{p.ps_fname} {p.ps_lname}</td>
                    <td>{p.ps_age}</td>
                    <td>{p.ps_gender}</td>
                    <td>{p.ps_berthalloc || p.ps_berthpref || 'Any'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {booking.bk_remarks && (
          <div className="print-section">
            <h3>Remarks</h3>
            <p>{booking.bk_remarks}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintBooking;
