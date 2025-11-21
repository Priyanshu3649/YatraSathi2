import React, { createContext, useState, useContext, useEffect } from 'react';
import { bookingAPI } from '../services/api';

// Create Booking Context
const BookingContext = createContext();

// Booking Provider Component
export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all bookings
  const fetchBookings = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await bookingAPI.getBookings(filters);
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch booking by ID
  const fetchBookingById = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const booking = await bookingAPI.getBookingById(id);
      // Update or add to bookings list
      setBookings(prev => {
        const existingIndex = prev.findIndex(b => b.bk_bkid === id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = booking;
          return updated;
        }
        return [...prev, booking];
      });
      return booking;
    } catch (err) {
      setError(err.message || 'Failed to fetch booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create new booking
  const createBooking = async (bookingData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newBooking = await bookingAPI.createBooking(bookingData);
      setBookings(prev => [...prev, newBooking]);
      return newBooking;
    } catch (err) {
      setError(err.message || 'Failed to create booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update booking
  const updateBooking = async (id, bookingData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedBooking = await bookingAPI.updateBooking(id, bookingData);
      setBookings(prev => 
        prev.map(booking => 
          booking.bk_bkid === id ? updatedBooking : booking
        )
      );
      return updatedBooking;
    } catch (err) {
      setError(err.message || 'Failed to update booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete booking
  const deleteBooking = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await bookingAPI.deleteBooking(id);
      setBookings(prev => prev.filter(booking => booking.bk_bkid !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Booking context value
  const value = {
    bookings,
    loading,
    error,
    fetchBookings,
    fetchBookingById,
    createBooking,
    updateBooking,
    deleteBooking,
    clearError
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

// Custom hook to use booking context
export const useBooking = () => {
  const context = useContext(BookingContext);
  
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  
  return context;
};

export default BookingContext;