import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import '../styles/my-bookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      // Use the bookingAPI service which calls /api/bookings/my-bookings
      const data = await bookingAPI.getMyBookings();
      
      if (data.success) {
        setBookings(data.data.bookings || []);
      } else {
        setError(data.error?.message || 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Bookings fetch error:', error);
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'DRAFT': '#FFA500',
      'REQUESTED': '#1E90FF',
      'PENDING': '#FFA500',
      'CONFIRMED': '#32CD32',
      'CANCELLED': '#DC143C',
      'CLOSED': '#696969'
    };
    return statusColors[status] || '#696969';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const handleViewDetails = (bookingId) => {
    navigate(`/customer/bookings/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="my-bookings-loading">
        <div className="loading-spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-bookings-error">
        <h3>Error Loading Bookings</h3>
        <p>{error}</p>
        <button onClick={fetchBookings} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="my-bookings-container">
      <div className="page-header">
        <h1>My Bookings</h1>
        <button 
          onClick={() => navigate('/customer/booking/new')} 
          className="btn-primary"
        >
          New Booking
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎫</div>
          <h3>No Bookings Yet</h3>
          <p>You haven't made any bookings yet.</p>
          <button 
            onClick={() => navigate('/customer/booking/new')} 
            className="btn-primary"
          >
            Create Your First Booking
          </button>
        </div>
      ) : (
        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Journey</th>
                <th>Date</th>
                <th>Passengers</th>
                <th>Status</th>
                <th>Assigned Employee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => (
                <tr 
                  key={booking.bk_bkid} 
                  className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                >
                  <td className="booking-id">
                    <strong>{booking.bk_bkid}</strong>
                  </td>
                  <td className="journey">
                    <span className="from">{booking.bk_from}</span>
                    <i className="arrow">→</i>
                    <span className="to">{booking.bk_to}</span>
                  </td>
                  <td className="date">
                    {formatDate(booking.bk_jdate)}
                  </td>
                  <td className="passengers">
                    {booking.bk_pax} passengers
                  </td>
                  <td className="status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(booking.bk_status) }}
                    >
                      {booking.bk_status}
                    </span>
                  </td>
                  <td className="employee">
                    {booking.assignedEmployee || 'N/A'}
                  </td>
                  <td className="actions">
                    <button 
                      onClick={() => handleViewDetails(booking.bk_bkid)}
                      className="btn-sm btn-outline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyBookings;