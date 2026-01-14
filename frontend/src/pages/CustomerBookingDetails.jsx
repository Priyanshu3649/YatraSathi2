import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/customer-booking-details.css';

const CustomerBookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customer/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setBooking(data.data);
      } else {
        setError(data.error?.message || 'Failed to load booking details');
      }
    } catch (error) {
      console.error('Booking details fetch error:', error);
      setError('Network error. Please try again.');
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBack = () => {
    navigate('/customer/bookings');
  };

  if (loading) {
    return (
      <div className="booking-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-details-error">
        <h3>Error Loading Booking</h3>
        <p>{error}</p>
        <button onClick={fetchBookingDetails} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="booking-details-not-found">
        <h3>Booking Not Found</h3>
        <p>The requested booking could not be found.</p>
        <button onClick={handleBack} className="btn-primary">
          Back to My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="booking-details-container">
      <div className="page-header">
        <button onClick={handleBack} className="back-btn">
          ← Back to My Bookings
        </button>
        <h1>Booking Details</h1>
      </div>

      <div className="booking-card">
        <div className="booking-header">
          <div className="booking-id">
            Booking ID: <strong>{booking.bk_bkid}</strong>
          </div>
          <div 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(booking.bk_status) }}
          >
            {booking.bk_status}
          </div>
        </div>

        <div className="booking-summary">
          <div className="journey-info">
            <div className="route">
              <div className="station from-station">
                <div className="station-name">{booking.bk_from}</div>
                <div className="station-code">FROM</div>
              </div>
              <div className="journey-arrow">→</div>
              <div className="station to-station">
                <div className="station-name">{booking.bk_to}</div>
                <div className="station-code">TO</div>
              </div>
            </div>
            <div className="journey-date">
              <div className="date">{formatDate(booking.bk_jdate)}</div>
              <div className="class-info">{booking.bk_class}</div>
            </div>
          </div>

          <div className="booking-stats">
            <div className="stat-item">
              <span className="stat-label">Passengers:</span>
              <span className="stat-value">{booking.bk_pax}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Amount:</span>
              <span className="stat-value">₹{booking.bk_amount?.toLocaleString() || '0'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Created:</span>
              <span className="stat-value">{booking.edtm ? new Date(booking.edtm).toLocaleDateString('en-IN') : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="booking-details-section">
          <h3>Passenger Details</h3>
          <div className="passengers-list">
            {booking.passengers && booking.passengers.length > 0 ? (
              booking.passengers.map((passenger, index) => (
                <div key={index} className="passenger-item">
                  <div className="passenger-number">Passenger {index + 1}</div>
                  <div className="passenger-info">
                    <div className="info-item">
                      <span className="label">Name:</span>
                      <span className="value">{passenger.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Age:</span>
                      <span className="value">{passenger.age}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Gender:</span>
                      <span className="value">{passenger.gender === 'M' ? 'Male' : passenger.gender === 'F' ? 'Female' : 'Other'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-passengers">No passenger details available</div>
            )}
          </div>
        </div>

        <div className="booking-details-section">
          <h3>Booking Timeline</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-title">Booking Requested</div>
                <div className="timeline-date">
                  {booking.edtm ? new Date(booking.edtm).toLocaleString('en-IN') : 'N/A'}
                </div>
                <div className="timeline-status">Booking submitted for processing</div>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-title">Booking Status</div>
                <div className="timeline-date">
                  {booking.mdtm ? new Date(booking.mdtm).toLocaleString('en-IN') : 'N/A'}
                </div>
                <div className="timeline-status">Current status: {booking.bk_status}</div>
              </div>
            </div>
            {booking.bk_status === 'CONFIRMED' && (
              <div className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-title">PNR Generated</div>
                  <div className="timeline-date">N/A</div>
                  <div className="timeline-status">PNR will be generated by the system</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="booking-details-section">
          <h3>Assigned Employee</h3>
          <div className="employee-info">
            <div className="employee-name">
              {booking.assignedEmployee || 'Agent will be assigned soon'}
            </div>
            <div className="employee-contact">
              {booking.employeeContact || 'Contact information will be shared once assigned'}
            </div>
          </div>
        </div>

        <div className="booking-actions">
          {booking.bk_status === 'PENDING' || booking.bk_status === 'DRAFT' ? (
            <button className="btn-outline" disabled>
              Cancel Booking
            </button>
          ) : (
            <button className="btn-outline" disabled={booking.bk_status === 'CANCELLED'}>
              {booking.bk_status === 'CANCELLED' ? 'Already Cancelled' : 'Cannot Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerBookingDetails;