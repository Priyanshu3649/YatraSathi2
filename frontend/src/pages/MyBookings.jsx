import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import Modal from '../components/Modal';
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
      
      console.log('Fetched bookings data:', data); // Debug log
      
      if (data.success) {
        const bookingsData = data.data.bookings || [];
        console.log('Bookings array:', bookingsData); // Debug log
        
        // Log first booking to see structure
        if (bookingsData.length > 0) {
          console.log('First booking structure:', bookingsData[0]);
          console.log('Date fields:', {
            bk_jdate: bookingsData[0].bk_jdate,
            bk_trvldt: bookingsData[0].bk_trvldt,
            bk_travelldate: bookingsData[0].bk_travelldate,
            booking_travel_date: bookingsData[0].booking_travel_date
          });
        }
        
        setBookings(bookingsData);
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

  const getStatusLabel = (status) => {
    const statusLabels = {
      'DRAFT': 'Draft',
      'REQUESTED': 'Pending',
      'PENDING': 'Pending',
      'CONFIRMED': 'Confirmed',
      'CANCELLED': 'Cancelled',
      'CLOSED': 'Closed'
    };
    return statusLabels[status] || status;
  };

  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [selectedPassengers, setSelectedPassengers] = useState([]);
  const [loadingPassengers, setLoadingPassengers] = useState(false);

  const openPassengerModal = async (passengers, bookingId) => {
    setLoadingPassengers(true);
    try {
      // Fetch passenger data from the backend
      const passengerData = await bookingAPI.getBookingPassengers(bookingId);
      setSelectedPassengers(passengerData.passengers || []);
    } catch (error) {
      console.error('Error fetching passengers:', error);
      setSelectedPassengers([]); // Set empty array on error
    } finally {
      setLoadingPassengers(false);
      setShowPassengerModal(true);
    }
  };

  const closePassengerModal = () => {
    setShowPassengerModal(false);
    setSelectedPassengers([]);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Invalid Date' || dateString === '') return '—';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const handleViewDetails = (bookingId) => {
    navigate(`/customer/bookings/${bookingId}`);
  };

  const renderPassengerModal = () => {
    if (!showPassengerModal) return null;
    
    return (
      <Modal 
        isOpen={true}
        onClose={closePassengerModal}
        title="Passenger List"
      >
        <div className="passenger-list-modal">
          {loadingPassengers ? (
            <div className="loading-passengers">
              <div className="loading-spinner"></div>
              <p>Loading passenger details...</p>
            </div>
          ) : (
            selectedPassengers.length > 0 ? (
              <table className="passenger-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Berth Preference</th>
                    <th>Seat / Coach</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPassengers.map((passenger, index) => (
                    <tr key={index}>
                      <td>{passenger.firstName} {passenger.lastName || ''}</td>
                      <td>{passenger.age}</td>
                      <td>
                        {passenger.gender === 'M' ? 'Male' : 
                         passenger.gender === 'F' ? 'Female' : 
                         passenger.gender}
                      </td>
                      <td>
                        {passenger.berthPreference === 'NO_PREF' ? 'No Preference' :
                         passenger.berthPreference === 'LOWER' ? 'Lower Berth' :
                         passenger.berthPreference === 'MIDDLE' ? 'Middle Berth' :
                         passenger.berthPreference === 'UPPER' ? 'Upper Berth' :
                         passenger.berthPreference === 'SIDE_LOWER' ? 'Side Lower' :
                         passenger.berthPreference === 'SIDE_UPPER' ? 'Side Upper' :
                         passenger.berthPreference}
                      </td>
                      <td>
                        {passenger.seatNo ? `Seat No: ${passenger.seatNo}` : '—'}<br />
                        {passenger.coach ? `Coach: ${passenger.coach}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No passenger details found for this booking.</p>
            )
          )}
        </div>
      </Modal>
    );
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
        <div>
          <h1>My Bookings</h1>
          <p>View and track your ticket requests</p>
        </div>
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
                <th>Source</th>
                <th>Destination</th>
                <th>Passengers</th>
                <th>Current Status</th>
                <th>PNR</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => {
                // Determine status color
                const statusClass = 
                  booking.bk_status === 'DRAFT' ? 'status-draft' :
                  booking.bk_status === 'PENDING' || booking.bk_status === 'REQUESTED' ? 'status-pending' :
                  booking.bk_status === 'CONFIRMED' ? 'status-confirmed' :
                  booking.bk_status === 'CANCELLED' ? 'status-cancelled' :
                  'status-default';
                
                return (
                  <tr 
                    key={booking.bk_bkid} 
                    className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                  >
                    <td className="source">
                      <span className="station-name">{booking.bk_fromst || booking.bk_fromstation || booking.bk_from || '—'}</span>
                    </td>
                    <td className="destination">
                      <span className="station-name">{booking.bk_tost || booking.bk_tostation || booking.bk_to || '—'}</span>
                    </td>
                    <td className="passengers">
                      <button 
                        onClick={() => openPassengerModal(booking.passengers, booking.bk_bkid)}
                        className="passenger-link"
                        title="Click to view passenger details"
                      >
                        {booking.bk_pax || booking.totalPassengers || booking.bk_totalpass || 0} Passenger{(booking.bk_pax || booking.totalPassengers || booking.bk_totalpass || 0) !== 1 ? 's' : ''}
                      </button>
                    </td>
                    <td className="status">
                      <span 
                        className={`status-badge ${statusClass}`}
                      >
                        {getStatusLabel(booking.bk_status)}
                      </span>
                    </td>
                    <td className="pnr">
                      {booking.bk_pnr || booking.pnr_number || '—'}
                    </td>
                    <td className="actions">
                      <button 
                        onClick={() => handleViewDetails(booking.bk_bkid)}
                        className="btn-sm btn-outline"
                        title="View booking details"
                      >
                        View Details
                      </button>
                      {(booking.bk_status !== 'CONFIRMED' && booking.bk_status !== 'CANCELLED' && booking.bk_status !== 'CLOSED') && (
                        <button 
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to cancel this booking?')) {
                              try {
                                await bookingAPI.cancelBooking(booking.bk_bkid);
                                // Refresh the bookings list
                                fetchBookings();
                              } catch (error) {
                                console.error('Error cancelling booking:', error);
                                alert('Failed to cancel booking: ' + error.message);
                              }
                            }
                          }}
                          className="btn-sm btn-danger"
                          title="Cancel this booking"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {renderPassengerModal()}
    </div>
  );
};

export default MyBookings;