import React, { createContext, useState, useContext, useEffect } from 'react';
import { paymentAPI } from '../services/api';

// Create Payment Context
const PaymentContext = createContext();

// Payment Provider Component
export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all payments
  const fetchPayments = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await paymentAPI.getPayments(filters);
      // Handle standardized paginated response
      const paymentsArray = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      setPayments(paymentsArray);
    } catch (err) {
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment by ID
  const fetchPaymentById = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await paymentAPI.getPaymentById(id);
      const payment = response?.data || response;
      // Update or add to payments list
      setPayments(prev => {
        const existingIndex = prev.findIndex(p => p.pt_ptid === id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = payment;
          return updated;
        }
        return [...prev, payment];
      });
      return payment;
    } catch (err) {
      setError(err.message || 'Failed to fetch payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create new payment
  const createPayment = async (paymentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await paymentAPI.createPayment(paymentData);
      const newPayment = response?.data || response;
      setPayments(prev => [...prev, newPayment]);
      return newPayment;
    } catch (err) {
      setError(err.message || 'Failed to create payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Process refund
  const processRefund = async (paymentId, refundData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await paymentAPI.processRefund(paymentId, refundData);
      const refund = response?.data || response;
      // Add refund to payments list
      setPayments(prev => [...prev, refund]);
      return refund;
    } catch (err) {
      setError(err.message || 'Failed to process refund');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Payment context value
  const value = {
    payments,
    loading,
    error,
    fetchPayments,
    fetchPaymentById,
    createPayment,
    processRefund,
    clearError
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

// Custom hook to use payment context
export const usePayment = () => {
  const context = useContext(PaymentContext);
  
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  
  return context;
};

export default PaymentContext;