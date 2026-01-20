import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import SaveConfirmationModal from '../components/common/SaveConfirmationModal';
import RecordActionMenu from '../components/common/RecordActionMenu';
import { useKeyboardForm } from '../hooks/useKeyboardForm';
import { usePassengerEntry } from '../hooks/usePassengerEntry';
import { usePhoneLookup } from '../hooks/usePhoneLookup';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

// Add inline styles for keyboard navigation
const keyboardNavigationStyles = `
  .erp-table tbody tr.highlighted {
    background-color: #e3f2fd !important;
    border: 2px solid #1976d2 !important;
  }
  
  .erp-table tbody tr.selected {
    background-color: #bbdefb !important;
  }
  
  .erp-table tbody tr:focus {
    outline: 2px solid #1976d2;
    outline-offset: -2px;
  }
  
  .keyboard-shortcuts-help {
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 4px;
    font-size: 11px;
    z-index: 1000;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = keyboardNavigationStyles;
  document.head.appendChild(styleSheet);
}

const Bookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState({
    bookingId: '',
    bookingDate: new Date().toISOString().split('T')[0],
    // CUSTOMER ID REMOVED - System managed only
    customerName: '',
    phoneNumber: '',    // NEW: Phone Number (required, 10-15 digits)
    internalCustomerId: '', // Internal system field, never exposed to UI
    totalPassengers: 0,
    fromStation: '',
    toStation: '',
    travelDate: new Date().toISOString().split('T')[0],
    travelClass: '3A',
    berthPreference: '',
    remarks: '',
    status: 'Draft',
    createdBy: user?.us_name || 'system',
    createdOn: new Date().toISOString(),
    modifiedBy: '',
    modifiedOn: '',
    closedBy: '',
    closedOn: ''
  });
  const [passengerList, setPassengerList] = useState([{
    id: Date.now(),
    name: '',
    age: '',
    gender: '',
    berthPreference: '',
    idProofType: '',
    idProofNumber: ''
  }]);
  
  // Keyboard navigation state
  const [isEditing, setIsEditing] = useState(false);
  
  // MANDATORY: Define business logic field order (MEMOIZED) - CUSTOMER ID REMOVED
  const fieldOrder = useMemo(() => [
    'bookingDate',
    'customerName',     // Customer Name (required)
    'phoneNumber',      // Phone Number (required, 10-15 digits)
    'fromStation',
    'toStation',
    'travelDate',
    'travelClass',
    'berthPreference',
    'quotaType',
    // Passenger fields handled by passenger loop - these will be activated automatically
    'passenger_name',
    'passenger_age', 
    'passenger_gender',
    'passenger_berth',
    'remarks',
    'status'
  ], []);
  
  // Define fetchBookings function first to avoid dependency cycle
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      
      // Check if user is admin or employee
      const isEmployee = user && ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(user.us_roid);
      if (isEmployee) {
        data = await bookingAPI.getAllBookings();
      } else {
        const response = await bookingAPI.getMyBookings();
        // Handle the wrapped response structure for customer bookings
        data = response.success ? response.data.bookings : [];
      }
      
      // Handle the response structure
      const bookingsData = data?.data?.bookings || data?.bookings || data || [];
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : [];
      
      setBookings(bookingsArray);
      setFilteredBookings(bookingsArray);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Create a ref to hold the handleSave function to avoid dependency cycle
  const handleSaveRef = useRef();
  
  // MANDATORY: Initialize phone lookup system (COMPLIANT) - MUST BE BEFORE handleSave
  const { 
    lookupCustomerByPhone, 
    validatePhoneNumber, 
    formatPhoneNumber,
    isLookingUp,
    clearLookupCache
  } = usePhoneLookup();
  
  // Define handleSave function
  const handleSave = useCallback(async () => {
    try {
      // MANDATORY: Validate phone number before saving
      if (!formData.phoneNumber) {
        throw new Error('Phone number is required');
      }
      
      const phoneValidation = validatePhoneNumber(formData.phoneNumber);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error);
      }

      // MANDATORY: Validate customer name
      if (!formData.customerName || formData.customerName.trim() === '') {
        throw new Error('Customer name is required');
      }

      const bookingData = {
        ...formData,
        passengerList,
        totalPassengers: passengerList.filter(p => p.name && p.name.trim() !== '').length,
        // MANDATORY: Use phone-based customer model
        phoneNumber: phoneValidation.cleanPhone,
        customerName: formData.customerName.trim(),
        internalCustomerId: formData.internalCustomerId || null, // May be null for new customers
        // Map fields to match backend expectations
        fromStation: formData.fromStation,
        toStation: formData.toStation,
        travelDate: formData.travelDate,
        travelClass: formData.travelClass,
        berthPreference: formData.berthPreference,
        remarks: formData.remarks,
        status: formData.status,
        createdOn: formData.createdOn || new Date().toISOString(),
        createdBy: formData.createdBy || user?.us_name || 'system',
        modifiedBy: user?.us_name || 'system',
        modifiedOn: new Date().toISOString()
      };
      
      if (selectedBooking) {
        // Identify the correct booking ID field from the selected booking
        const bookingId = selectedBooking.bk_bkid || selectedBooking.id || selectedBooking.bookingId;
        if (!bookingId) {
          throw new Error('Booking ID is missing');
        }
        await bookingAPI.updateBooking(bookingId, bookingData);
      } else {
        // MANDATORY: Create booking with atomic customer creation
        await bookingAPI.createBooking(bookingData);
      }
      
      // Refresh the data list in background
      await fetchBookings();
      setIsEditing(false);
    } catch (error) {
      setError(error.message || 'Failed to save booking');
    }
  }, [formData, passengerList, passengerList.length, selectedBooking, user?.us_name, fetchBookings]);
  
  // Store the handleSave function in the ref
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);
  
  // Handle save confirmation from keyboard navigation
  const handleSaveConfirmed = useCallback(async () => {
    try {
      await handleSaveRef.current();
    } catch (error) {
      console.error('Save failed:', error);
      setError(error.message || 'Failed to save booking');
    }
  }, []);

  // MANDATORY: Initialize keyboard navigation (COMPLIANT)
  const { isModalOpen } = useKeyboardForm({
    formId: 'BOOKING_FORM',
    fields: fieldOrder,
    onSave: handleSaveConfirmed,
    onCancel: () => setIsEditing(false)
  });
  
  // MANDATORY: Initialize passenger entry system (COMPLIANT)
  const {
    isInLoop,
    enterPassengerLoop,
    exitPassengerLoop,
    getFieldProps
  } = usePassengerEntry({
    passengerFields: ['passenger_name', 'passenger_age', 'passenger_gender', 'passenger_berth'],
    onPassengerSave: (passenger) => {
      // Add passenger to the main list
      setPassengerList(prev => [...prev, {
        id: passenger.id,
        name: passenger.passenger_name,
        age: passenger.passenger_age,
        gender: passenger.passenger_gender,
        berthPreference: passenger.passenger_berth,
        idProofType: '',
        idProofNumber: ''
      }]);
    },
    onLoopExit: () => {
      // Move focus to next field after passenger section handled by keyboard engine
      console.log('Passenger loop exited');
    },
    onPassengerValidate: (data) => {
      if (!data.passenger_name || data.passenger_name.trim() === '') {
        return { isValid: false, error: 'Passenger name is required', invalidField: 'passenger_name' };
      }
      if (!data.passenger_age || data.passenger_age < 1 || data.passenger_age > 120) {
        return { isValid: false, error: 'Valid age is required', invalidField: 'passenger_age' };
      }
      return { isValid: true };
    }
  });
  
  // State for passenger details modal
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [passengerDetails, setPassengerDetails] = useState([]);
  const [loadingPassengers, setLoadingPassengers] = useState(false);
  
  // Record navigation and action menu state
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(-1);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const [focusedOnGrid, setFocusedOnGrid] = useState(false);
  const gridRef = useRef(null);
    
  // Filter state for inline grid filtering
  const [inlineFilters, setInlineFilters] = useState({});
  
  // Debug: Log isInLoop state changes
  useEffect(() => {
    // Passenger loop state tracking
  }, [isInLoop]);
  
  // MANDATORY: Phone number auto-fetch handler (COMPLIANT)
  const handlePhoneBlur = useCallback(async (phoneNumber) => {
    if (!phoneNumber || !isEditing) return;
    
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      const result = await lookupCustomerByPhone(phoneNumber);
      
      if (result.found && result.customer) {
        // Customer found - auto-populate name (silent background fetch)
        setFormData(prev => ({
          ...prev,
          customerName: result.customer.customerName,
          phoneNumber: result.customer.phoneNumber,
          internalCustomerId: result.customer.internalCustomerId
        }));
        setError(''); // Clear any previous errors
      } else {
        // Customer not found - clear name field for manual entry
        setFormData(prev => ({
          ...prev,
          customerName: '',
          phoneNumber: validation.cleanPhone,
          internalCustomerId: ''
        }));
        setError(''); // Clear any previous errors (not an error condition)
      }
    } catch (error) {
      console.warn('Phone lookup failed:', error);
      // Don't show error to user - fail gracefully
      setFormData(prev => ({
        ...prev,
        phoneNumber: validation.cleanPhone,
        internalCustomerId: ''
      }));
    }
  }, [validatePhoneNumber, lookupCustomerByPhone, isEditing]);

  // Define handleNew function first to avoid initialization error
  const handleNew = useCallback(() => {
    setSelectedBooking(null);
    setFormData({
      bookingId: '',
      bookingDate: new Date().toISOString().split('T')[0],
      // CUSTOMER ID REMOVED - System managed only
      customerName: '',
      phoneNumber: '',    // NEW: Phone Number (required, 10-15 digits)
      internalCustomerId: '', // Internal system field, never exposed to UI
      totalPassengers: 0,
      fromStation: '',
      toStation: '',
      travelDate: new Date().toISOString().split('T')[0],
      travelClass: '3A',
      berthPreference: '',
      remarks: '',
      status: 'Draft',
      createdBy: user?.us_name || 'system',
      createdOn: new Date().toISOString(),
      modifiedBy: '',
      modifiedOn: '',
      closedBy: '',
      closedOn: ''
    });
    setPassengerList([{ 
      id: Date.now(),
      name: '',
      age: '',
      gender: '',
      berthPreference: '',
      idProofType: '',
      idProofNumber: ''
    }]);
    clearLookupCache(); // Clear phone lookup cache for new booking
    setIsEditing(true);
      
    // Focus will be handled automatically by keyboard engine
  }, [user?.us_name, clearLookupCache]);
    
  // Set form to NEW mode by default on page load
  useEffect(() => {
    handleNew();
  }, []);
    
  // Auto-calculate total passengers when passenger list changes
  useEffect(() => {
    const total = passengerList.filter(p => p.name && p.name.trim() !== '').length;
    
    setFormData(prev => {
      if (prev.totalPassengers !== total) {
        return { ...prev, totalPassengers: total };
      }
      return prev;
    });
  }, [passengerList, passengerList.length]);
    
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 100;
    
  // Pagination helper function
  const getPaginatedData = useCallback(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredBookings.slice(startIndex, endIndex);
  }, [filteredBookings, currentPage, recordsPerPage]);
    
  const handleRecordSelect = useCallback((record) => {
    setSelectedBooking(record);
    setFormData({
      bookingId: record.bk_bkid || '',
      bookingDate: record.bk_bookingdt ? new Date(record.bk_bookingdt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      // CUSTOMER ID REMOVED - System managed only
      customerName: record.customerName || record.bk_customername || '',
      phoneNumber: record.phoneNumber || record.bk_phonenumber || record.bk_phone || '',
      internalCustomerId: record.customerId || record.bk_customerid || record.cu_usid || '',
      totalPassengers: record.totalPassengers || 0,
      fromStation: record.fromStation?.st_stname || record.bk_fromstation || record.bk_fromst || '',
      toStation: record.toStation?.st_stname || record.bk_tostation || record.bk_tost || '',
      travelDate: record.bk_trvldt ? new Date(record.bk_trvldt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      travelClass: record.bk_class || record.bk_travelclass || '3A',
      berthPreference: record.bk_birthpreference || record.bk_berthpreference || '',
      remarks: record.bk_remarks || '',
      status: record.bk_status || 'Draft',
      createdBy: record.createdBy || record.bk_createdby || 'system',
      createdOn: record.createdOn || record.bk_createdon || new Date().toISOString(),
      modifiedBy: record.modifiedBy || record.bk_modifiedby || '',
      modifiedOn: record.modifiedOn || record.bk_modifiedon || '',
      closedBy: record.closedBy || record.bk_closedby || '',
      closedOn: record.closedOn || record.bk_closedon || ''
    });
    setPassengerList(record.passengerList || [{
      id: Date.now(),
      name: '',
      age: '',
      gender: '',
      berthPreference: '',
      idProofType: '',
      idProofNumber: ''
    }]);
    setIsEditing(false);
  }, []);
  
  // Navigation functions
  const handleNavigation = useCallback((direction) => {
    const paginatedData = getPaginatedData();
    if (paginatedData.length === 0) return;
        
    let newIndex = 0;
    if (selectedBooking) {
      const currentIndex = paginatedData.findIndex(item => 
        item.bk_bkid === selectedBooking.bk_bkid
      );
          
      switch(direction) {
        case 'first': newIndex = 0; break;
        case 'prev': newIndex = currentIndex > 0 ? currentIndex - 1 : 0; break;
        case 'next': newIndex = currentIndex < paginatedData.length - 1 ? currentIndex + 1 : paginatedData.length - 1; break;
        case 'last': newIndex = paginatedData.length - 1; break;
        default: break;
      }
    }
        
    handleRecordSelect(paginatedData[newIndex]);
  }, [getPaginatedData, selectedBooking, handleRecordSelect]);
  
  // Check if navigation buttons should be disabled
  const { paginatedData, isFirstRecord, isLastRecord } = useMemo(() => {
    const data = getPaginatedData();
    const first = selectedBooking && data.length > 0 && 
      data[0].bk_bkid === selectedBooking.bk_bkid;
    const last = selectedBooking && data.length > 0 && 
      data[data.length - 1].bk_bkid === selectedBooking.bk_bkid;
    return { paginatedData: data, isFirstRecord: first, isLastRecord: last };
  }, [filteredBookings, currentPage, recordsPerPage, selectedBooking]);
      
  // Fetch bookings when component mounts
  useEffect(() => {
    fetchBookings();
  }, [user?.us_usid]);
      
  // Apply filters
  useEffect(() => {
    let filtered = [...bookings];
        
    // Apply inline filters
    Object.entries(inlineFilters).forEach(([column, value]) => {
      if (value !== undefined && value !== '') {
        filtered = filtered.filter(record => 
          record[column]?.toString().toLowerCase().includes(value.toLowerCase())
        );
      }
    });
        
    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [inlineFilters, bookings]);
    
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-enter passenger mode after quota type selection
    if (name === 'quotaType' && value && isEditing) {
      // Small delay to ensure the form state is updated
      setTimeout(() => {
        enterPassengerLoop();
        // Focus on the first passenger field after entering passenger mode
        setTimeout(() => {
          const passengerNameField = document.querySelector('[data-field="passenger_name"]');
          if (passengerNameField) {
            passengerNameField.focus();
          }
        }, 150);
      }, 100);
    }
  }, [isEditing, enterPassengerLoop]);
      
  // Handle customer selection from CustomerLookupInput component
  const handleCustomerChange = useCallback((customer) => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        internalCustomerId: customer.code || customer.id,
        customerName: customer.name,
        phoneNumber: customer.phone || prev.phoneNumber
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        internalCustomerId: '',
        customerName: '',
        phoneNumber: ''
      }));
    }
  }, []);
      
    
    
  const handleInlineFilterChange = useCallback((column, value) => {
    setInlineFilters(prev => ({
      ...prev,
      [column]: value
    }));
  }, []);
    
  const handleEdit = useCallback(() => {
    if (selectedBooking) {
      // Check if user is customer and booking status
      const isCustomer = user && (user.us_usertype === 'customer' || user.us_roid === 'CUS');
      const bookingStatus = selectedBooking.bk_status?.toUpperCase() || selectedBooking.status?.toUpperCase() || 'DRAFT';
          
      // For customers, only allow editing when status is DRAFT
      if (isCustomer && bookingStatus !== 'DRAFT') {
        alert('You can only edit bookings that are in DRAFT status. Once the booking status changes, editing is locked.');
        return;
      }
          
      // For admin/employees, allow editing regardless of status
      setIsEditing(true);
    } else {
      alert('Please select a record first');
    }
  }, [selectedBooking, user]);
    
  // Function to fetch and show passenger details
  const showPassengerDetails = useCallback(async (bookingId) => {
    try {
      setLoadingPassengers(true);
      const response = await bookingAPI.getBookingPassengers(bookingId);
      const passengers = response.passengers || [];
      setPassengerDetails(passengers);
      setShowPassengerModal(true);
    } catch (error) {
      console.error('Error fetching passenger details:', error);
      alert(`Error fetching passenger details: ${error.message}`);
    } finally {
      setLoadingPassengers(false);
    }
  }, []);
  
  const handleDelete = useCallback(async () => {
    if (!selectedBooking) {
      alert('Please select a record to delete');
      return;
    }
  
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await bookingAPI.deleteBooking(selectedBooking.bk_bkid);
        fetchBookings();
      } catch (error) {
        setError(error.message || 'Failed to delete booking');
      }
    }
  }, [selectedBooking, fetchBookings]);

  const removePassenger = useCallback((id) => {
    if (passengerList.length <= 1) {
      setError('At least one passenger is required');
      return;
    }
    setPassengerList(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePassenger = useCallback((id, field, value) => {
    setPassengerList(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  }, []);

  const totalPages = useMemo(() => Math.ceil(filteredBookings.length / recordsPerPage), [filteredBookings, recordsPerPage]);

  // Action menu functions
  const openActionMenu = useCallback((e) => {
    if (!selectedBooking) return;
    
    const rect = e.target.getBoundingClientRect();
    setActionMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setActionMenuOpen(true);
  }, [selectedBooking]);

  const closeActionMenu = useCallback(() => {
    setActionMenuOpen(false);
    // Return focus to grid
    if (gridRef.current) {
      gridRef.current.focus();
    }
  }, []);

  const handleActionSelect = useCallback(async (action, record) => {
    closeActionMenu();
    
    switch (action) {
      case 'generate_bill':
        // Navigate to billing with booking data
        navigate('/billing', { 
          state: { 
            bookingId: record.bk_bkid,
            mode: 'generate',
            bookingData: record
          }
        });
        break;
      case 'view_bill':
        // Navigate to billing in view mode
        navigate('/billing', { 
          state: { 
            bookingId: record.bk_bkid,
            mode: 'view'
          }
        });
        break;
      case 'edit_booking':
        handleRecordSelect(record);
        handleEdit();
        break;
      case 'cancel_booking':
        if (window.confirm('Are you sure you want to cancel this booking?')) {
          try {
            await bookingAPI.cancelBooking(record.bk_bkid);
            fetchBookings(); // Refresh data
          } catch (error) {
            setError(error.message || 'Failed to cancel booking');
          }
        }
        break;
      default:
        break;
    }
  }, [closeActionMenu, navigate, handleRecordSelect, handleEdit, fetchBookings]);

  // Generate action menu items based on booking status
  const getActionMenuItems = useCallback((record) => {
    const items = [];
    
    // Generate Bill
    const canGenerateBill = record.bk_status === 'CONFIRMED' && !record.hasBilling;
    items.push({
      action: 'generate_bill',
      label: 'Generate Bill',
      disabled: !canGenerateBill,
      reason: !canGenerateBill ? 'Billing can only be generated for confirmed bookings' : null
    });
    
    // View Bill
    items.push({
      action: 'view_bill',
      label: 'View Bill',
      disabled: !record.hasBilling,
      reason: !record.hasBilling ? 'No billing record exists' : null
    });
    
    // Edit Booking
    const canEdit = record.bk_status !== 'CANCELLED' && record.bk_status !== 'COMPLETED';
    items.push({
      action: 'edit_booking',
      label: 'Edit Booking',
      disabled: !canEdit,
      reason: !canEdit ? 'Cannot edit cancelled or completed bookings' : null
    });
    
    // Cancel Booking
    const canCancel = record.bk_status !== 'CANCELLED' && record.bk_status !== 'COMPLETED';
    items.push({
      action: 'cancel_booking',
      label: 'Cancel Booking',
      disabled: !canCancel,
      reason: !canCancel ? 'Booking is already cancelled or completed' : null
    });
    
    return items;
  }, []);

  // Keyboard shortcuts and record navigation (moved after all callbacks are defined)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Only handle shortcuts when not in form fields
      const isInFormField = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA';
      
      if (!isInFormField || focusedOnGrid) {
        const currentPaginatedData = getPaginatedData();
        
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            if (selectedRecordIndex > 0) {
              setSelectedRecordIndex(prev => prev - 1);
              const newRecord = currentPaginatedData[selectedRecordIndex - 1];
              if (newRecord) {
                handleRecordSelect(newRecord);
              }
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (selectedRecordIndex < currentPaginatedData.length - 1) {
              setSelectedRecordIndex(prev => prev + 1);
              const newRecord = currentPaginatedData[selectedRecordIndex + 1];
              if (newRecord) {
                handleRecordSelect(newRecord);
              }
            }
            break;
          case 'ArrowLeft':
            e.preventDefault();
            if (currentPage > 1) {
              setCurrentPage(prev => prev - 1);
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (currentPage < totalPages) {
              setCurrentPage(prev => prev + 1);
            }
            break;
          case 'Enter':
            if (focusedOnGrid && selectedBooking) {
              e.preventDefault();
              openActionMenu(e);
            }
            break;
          default:
            break;
        }
      }
      
      // Global shortcuts (work regardless of focus)
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'e':
            e.preventDefault();
            if (selectedBooking) {
              handleEdit();
            }
            break;
          case 'd':
            e.preventDefault();
            if (selectedBooking) {
              handleDelete();
            }
            break;
          case 'n':
            e.preventDefault();
            handleNew();
            break;
          default:
            break;
        }
      }
      
      // Function keys
      switch (e.key) {
        case 'F2':
          e.preventDefault();
          if (selectedBooking) {
            handleEdit();
          }
          break;
        case 'F4':
          e.preventDefault();
          if (selectedBooking) {
            handleDelete();
          }
          break;
        case 'F10':
          e.preventDefault();
          if (isEditing) {
            handleSave();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedRecordIndex, getPaginatedData, currentPage, totalPages, selectedBooking, focusedOnGrid, isEditing, handleEdit, handleDelete, handleNew, handleSave, handleRecordSelect, openActionMenu]);

  return (
    <div className="erp-admin-container">
      {/* Top Menu Bar - Static */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item">File</div>
        <div className="erp-menu-item">Edit</div>
        <div className="erp-menu-item">View</div>
        <div className="erp-menu-item">Booking</div>
        <div className="erp-menu-item">Reports</div>
        <div className="erp-menu-item">Help</div>
        <div className="erp-user-info">USER: {user?.us_name || 'ADMIN'} ⚙</div>
      </div>

      {/* Top Menu Bar - Static */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item">File</div>
        <div className="erp-menu-item">Edit</div>
        <div className="erp-menu-item">View</div>
        <div className="erp-menu-item">Booking</div>
        <div className="erp-menu-item">Reports</div>
        <div className="erp-menu-item">Help</div>
        <div className="erp-user-info">USER: {user?.us_name || 'ADMIN'} ⚙</div>
      </div>

      {/* Toolbar - Static */}
      <div className="erp-toolbar">
        <button className="erp-icon-button" onClick={() => navigate('/dashboard')} title="Home">🏠</button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('first')} 
          disabled={!selectedBooking || isFirstRecord}
          title="First"
        >
          |◀
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('prev')} 
          disabled={!selectedBooking || isFirstRecord}
          title="Previous"
        >
          ◀
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('next')} 
          disabled={!selectedBooking || isLastRecord}
          title="Next"
        >
          ▶
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('last')} 
          disabled={!selectedBooking || isLastRecord}
          title="Last"
        >
          ▶|
        </button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleNew} title="New">New</button>
        <button className="erp-button" onClick={handleEdit} title="Edit">Edit</button>
        <button className="erp-button" onClick={handleDelete} title="Delete">Delete</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleSave} disabled={!isEditing} title="Save">Save</button>
        <button className="erp-button" onClick={fetchBookings} title="Refresh">Refresh</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" title="Print">Print</button>
        <button className="erp-button" title="Export">Export</button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="erp-main-content">
        {/* Center Content - Now takes full space since left sidebar is removed */}
        <div className="erp-center-content">
          {/* Form Panel - Static */}
          <div className="erp-form-section">{/* KEYBOARD ENGINE HANDLES FOCUS */}
            <div className="erp-panel-header">Booking Details</div>
            
            {/* Booking ID and Date Row */}
            <div className="erp-form-row">
              <label className="erp-form-label required">Booking ID</label>
              <input
                type="text"
                name="bookingId"
                data-field="bookingId"
                className="erp-input"
                value={formData.bookingId}
                onChange={handleInputChange}
                readOnly
                tabIndex={-1}
              />
              <label className="erp-form-label required">Booking Date</label>
              <input
                type="date"
                name="bookingDate"
                data-field="bookingDate"
                className="erp-input"
                value={formData.bookingDate}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            {/* Customer Name and Phone Row - MANDATORY: Phone-based identification */}
            <div className="erp-form-row">
              <label className="erp-form-label required">Customer Name</label>
              <input
                type="text"
                name="customerName"
                data-field="customerName"
                className="erp-input"
                value={formData.customerName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter customer name..."
                required
              />
              <label className="erp-form-label required">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  name="phoneNumber"
                  data-field="phoneNumber"
                  className="erp-input"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  onBlur={(e) => handlePhoneBlur(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter phone number (10-15 digits)..."
                  required
                />
                {isLookingUp && (
                  <span style={{ 
                    position: 'absolute', 
                    right: '8px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    fontSize: '12px'
                  }}>
                    🔄
                  </span>
                )}
              </div>
            </div>
            
            {/* Alternate Phone Number Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Alternate Phone Number</label>
              <input
                type="tel"
                name="contactNumber"
                data-field="contactNumber"
                className="erp-input"
                value={formData.contactNumber || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter alternate phone number (optional)..."
              />
              <div></div> {/* Empty div to maintain grid layout */}
              <div></div> {/* Empty div to maintain grid layout */}
            </div>

            {/* Journey Details Row */}
            <div className="erp-form-row">
              <label className="erp-form-label required">From Station</label>
              <input
                type="text"
                name="fromStation"
                data-field="fromStation"
                className="erp-input"
                value={formData.fromStation}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              <label className="erp-form-label required">To Station</label>
              <input
                type="text"
                name="toStation"
                data-field="toStation"
                className="erp-input"
                value={formData.toStation}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            {/* Travel Date and Class Row */}
            <div className="erp-form-row">
              <label className="erp-form-label required">Travel Date</label>
              <input
                type="date"
                name="travelDate"
                data-field="travelDate"
                className="erp-input"
                value={formData.travelDate}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              <label className="erp-form-label required">Travel Class</label>
              <select
                name="travelClass"
                data-field="travelClass"
                className="erp-input"
                value={formData.travelClass}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="SL">Sleeper (SL)</option>
                <option value="3A">3rd AC (3A)</option>
                <option value="2A">2nd AC (2A)</option>
                <option value="1A">1st AC (1A)</option>
                <option value="CC">Chair Car (CC)</option>
                <option value="EC">Executive Chair (EC)</option>
              </select>
            </div>

            {/* Berth Preference and Quota Type Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Berth Preference</label>
              <select
                name="berthPreference"
                data-field="berthPreference"
                className="erp-input"
                value={formData.berthPreference}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="">Any</option>
                <option value="LB">Lower Berth</option>
                <option value="UB">Upper Berth</option>
                <option value="MB">Middle Berth</option>
                <option value="SL">Side Lower</option>
                <option value="SU">Side Upper</option>
              </select>
              <label className="erp-form-label">Quota Type</label>
              <select
                name="quotaType"
                data-field="quotaType"
                className="erp-input"
                value={formData.quotaType}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey && formData.quotaType && isEditing) {
                    // Prevent default tab behavior
                    e.preventDefault();
                    // Auto-enter passenger mode and focus first passenger field
                    setTimeout(() => {
                      enterPassengerLoop();
                      setTimeout(() => {
                        const passengerNameField = document.querySelector('[data-field="passenger_name"]');
                        if (passengerNameField) {
                          passengerNameField.focus();
                        }
                      }, 100);
                    }, 50);
                  }
                }}
                disabled={!isEditing}
              >
                <option value="GN">General (GN)</option>
                <option value="TQ">Tatkal (TQ)</option>
                <option value="LD">Ladies (LD)</option>
                <option value="DF">Defence (DF)</option>
                <option value="FT">Foreign Tourist (FT)</option>
              </select>
            </div>

            {/* Passenger Details Section */}
            <div className="erp-form-row">
              <label className="erp-form-label" style={{ gridColumn: 'span 4' }}>
                Passenger Details
              </label>
            </div>
            
            {/* Total Passengers Field - Moved to Passenger Details Section */}
            <div className="erp-form-row">
              <label className="erp-form-label">Total Passengers</label>
              <input
                type="text"
                name="totalPassengers"
                className="erp-input"
                value={formData.totalPassengers}
                readOnly
                disabled
                tabIndex={-1}
              />
              <div></div> {/* Empty div to maintain grid layout */}
              <div></div> {/* Empty div to maintain grid layout */}
            </div>
            
            {/* Passenger Entry Fields - Single Row Layout */}
            {isInLoop && (
              <div className="passenger-entry-section" style={{ border: '2px solid #007acc', padding: '10px', marginBottom: '10px', backgroundColor: '#f0f8ff' }}>
                <div style={{ marginBottom: '5px', fontSize: '12px', fontWeight: 'bold', color: '#007acc' }}>
                  Passenger Entry Mode - Fill details and press Tab on last field to add passenger, or Escape to exit
                </div>
                {/* Labels Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 150px', gap: '10px', marginBottom: '2px' }}>
                  <label className="erp-form-label">Name</label>
                  <label className="erp-form-label">Age</label>
                  <label className="erp-form-label">Gender</label>
                  <label className="erp-form-label">Berth Preference</label>
                </div>
                {/* Input Fields Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 150px', gap: '10px', marginBottom: '5px' }}>
                  <input
                    type="text"
                    {...getFieldProps('passenger_name')}
                    className="erp-input"
                    disabled={!isEditing}
                    placeholder="Enter passenger name"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        exitPassengerLoop();
                      }
                    }}
                  />
                  <input
                    type="number"
                    {...getFieldProps('passenger_age')}
                    className="erp-input"
                    disabled={!isEditing}
                    placeholder="Age"
                    min="1"
                    max="120"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        exitPassengerLoop();
                      }
                    }}
                  />
                  <select
                    {...getFieldProps('passenger_gender')}
                    className="erp-input"
                    disabled={!isEditing}
                    defaultValue="M"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        exitPassengerLoop();
                      }
                    }}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                  <select
                    {...getFieldProps('passenger_berth')}
                    className="erp-input"
                    disabled={!isEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        saveCurrentPassenger();
                      } else if (e.key === 'Escape') {
                        exitPassengerLoop();
                      }
                    }}
                  >
                    <option value="">Any</option>
                    <option value="LB">Lower Berth</option>
                    <option value="UB">Upper Berth</option>
                    <option value="MB">Middle Berth</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Passenger Grid Display */}
            <div style={{ border: '1px solid var(--border-gray)', padding: '5px', maxHeight: '150px', overflowY: 'auto', marginBottom: '10px' }}>
              <table className="grid-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Name</th>
                    <th style={{ width: '8%' }}>Age</th>
                    <th style={{ width: '8%' }}>Gender</th>
                    <th style={{ width: '12%' }}>Berth</th>
                    <th style={{ width: '15%' }}>ID Type</th>
                    <th style={{ width: '20%' }}>ID Number</th>
                    <th style={{ width: '12%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {passengerList.map((passenger) => (
                    <tr key={passenger.id}>
                      <td>
                        <input 
                          type="text" 
                          value={passenger.name} 
                          onChange={(e) => updatePassenger(passenger.id, 'name', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }} 
                          disabled={!isEditing}
                          tabIndex={-1}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={passenger.age} 
                          onChange={(e) => updatePassenger(passenger.id, 'age', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }} 
                          disabled={!isEditing}
                          tabIndex={-1}
                        />
                      </td>
                      <td>
                        <select 
                          value={passenger.gender} 
                          onChange={(e) => updatePassenger(passenger.id, 'gender', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }}
                          disabled={!isEditing}
                          tabIndex={-1}
                        >
                          <option value="">-</option>
                          <option value="M">M</option>
                          <option value="F">F</option>
                          <option value="O">O</option>
                        </select>
                      </td>
                      <td>
                        <select 
                          value={passenger.berthPreference} 
                          onChange={(e) => updatePassenger(passenger.id, 'berthPreference', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }}
                          disabled={!isEditing}
                          tabIndex={-1}
                        >
                          <option value="">-</option>
                          <option value="LB">LB</option>
                          <option value="UB">UB</option>
                          <option value="MB">MB</option>
                        </select>
                      </td>
                      <td>
                        <select 
                          value={passenger.idProofType} 
                          onChange={(e) => updatePassenger(passenger.id, 'idProofType', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }}
                          disabled={!isEditing}
                          tabIndex={-1}
                        >
                          <option value="">-</option>
                          <option value="ADHAAR">ADHAAR</option>
                          <option value="PAN">PAN</option>
                          <option value="PASSPORT">PASSPORT</option>
                        </select>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          value={passenger.idProofNumber} 
                          onChange={(e) => updatePassenger(passenger.id, 'idProofNumber', e.target.value)} 
                          className="erp-input" 
                          style={{ padding: '2px', fontSize: '11px', width: '100%' }} 
                          disabled={!isEditing}
                          tabIndex={-1}
                        />
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className="erp-button" 
                          style={{ padding: '2px 6px', fontSize: '11px' }} 
                          onClick={() => removePassenger(passenger.id)}
                          disabled={!isEditing}
                          tabIndex={-1}
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Remarks Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Remarks</label>
              <textarea
                name="remarks"
                data-field="remarks"
                className="erp-input"
                value={formData.remarks}
                onChange={handleInputChange}
                rows="2"
                disabled={!isEditing}
                style={{ height: '40px' }}
              ></textarea>
            </div>

            {/* Status Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Status</label>
              <select
                name="status"
                data-field="status"
                className="erp-input"
                value={formData.status}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Waitlisted">Waitlisted</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Audit Section */}
            <div className="erp-audit-section">
              <div className="erp-audit-row">
                <label className="erp-audit-label">Entered On</label>
                <input type="text" className="erp-audit-input" value={new Date(formData.createdOn).toLocaleString()} readOnly />
                <label className="erp-audit-label">Entered By</label>
                <input type="text" className="erp-audit-input" value={formData.createdBy} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Modified On</label>
                <input type="text" className="erp-audit-input" value={formData.modifiedOn ? new Date(formData.modifiedOn).toLocaleString() : '-'} readOnly />
                <label className="erp-audit-label">Modified By</label>
                <input type="text" className="erp-audit-input" value={formData.modifiedBy || '-'} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Closed On</label>
                <input type="text" className="erp-audit-input" value={formData.closedOn ? new Date(formData.closedOn).toLocaleString() : '-'} readOnly />
                <label className="erp-audit-label">Closed By</label>
                <input type="text" className="erp-audit-input" value={formData.closedBy || '-'} readOnly />
              </div>
            </div>
          </div>

          {/* Data Grid - Scrollable */}
          <div className="erp-grid-section">
            <div className="erp-panel-header">Booking Records</div>
            <div className="grid-toolbar">
              <input
                type="text"
                placeholder="Quick search..."
                className="filter-input"
                style={{ width: '200px' }}
              />
              <button className="erp-button">Filter</button>
              <button className="erp-button">Clear</button>
            </div>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : (
              <div className="erp-grid-container" style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}><input type="checkbox" /></th>
                      <th style={{ width: '100px' }}>Booking ID</th>
                      <th style={{ width: '150px' }}>Booking Date</th>
                      <th style={{ width: '200px' }}>Customer Name</th>
                      <th style={{ width: '150px' }}>Phone Number</th>
                      <th style={{ width: '120px' }}>Total Passengers</th>
                      <th style={{ width: '150px' }}>From Station</th>
                      <th style={{ width: '150px' }}>To Station</th>
                      <th style={{ width: '150px' }}>Travel Date</th>
                      <th style={{ width: '100px' }}>Travel Class</th>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '150px' }}>Created By</th>
                    </tr>
                    {/* Inline Filter Row */}
                    <tr className="inline-filter-row">
                      <td></td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['bk_bkid'] || ''}
                          onChange={(e) => handleInlineFilterChange('bk_bkid', e.target.value)}
                          placeholder="Filter ID..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="inline-filter-input"
                          value={inlineFilters['bk_bookingdt'] || ''}
                          onChange={(e) => handleInlineFilterChange('bk_bookingdt', e.target.value)}
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['customerName'] || ''}
                          onChange={(e) => handleInlineFilterChange('customerName', e.target.value)}
                          placeholder="Filter customer..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="tel"
                          className="inline-filter-input"
                          value={inlineFilters['phoneNumber'] || ''}
                          onChange={(e) => handleInlineFilterChange('phoneNumber', e.target.value)}
                          placeholder="Filter phone..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="inline-filter-input"
                          value={inlineFilters['totalPassengers'] || ''}
                          onChange={(e) => handleInlineFilterChange('totalPassengers', e.target.value)}
                          placeholder="Filter passengers..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['fromStation'] || ''}
                          onChange={(e) => handleInlineFilterChange('fromStation', e.target.value)}
                          placeholder="Filter from..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['toStation'] || ''}
                          onChange={(e) => handleInlineFilterChange('toStation', e.target.value)}
                          placeholder="Filter to..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="inline-filter-input"
                          value={inlineFilters['bk_trvldt'] || ''}
                          onChange={(e) => handleInlineFilterChange('bk_trvldt', e.target.value)}
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <select
                          className="inline-filter-input"
                          value={inlineFilters['bk_class'] || ''}
                          onChange={(e) => handleInlineFilterChange('bk_class', e.target.value)}
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        >
                          <option value="">All</option>
                          <option value="SL">SL</option>
                          <option value="3A">3A</option>
                          <option value="2A">2A</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="inline-filter-input"
                          value={inlineFilters['bk_status'] || ''}
                          onChange={(e) => handleInlineFilterChange('bk_status', e.target.value)}
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        >
                          <option value="">All</option>
                          <option value="Draft">Draft</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['createdBy'] || ''}
                          onChange={(e) => handleInlineFilterChange('createdBy', e.target.value)}
                          placeholder="Filter user..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr><td colSpan="12" style={{ textAlign: 'center' }}>No records found</td></tr>
                    ) : (
                      paginatedData.map((record, idx) => {
                        const isSelected = selectedBooking && selectedBooking.bk_bkid === record.bk_bkid;
                        const isHighlighted = selectedRecordIndex === idx;
                        return (
                          <tr 
                            key={idx}
                            className={`${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                            onClick={() => {
                              handleRecordSelect(record);
                              setSelectedRecordIndex(idx);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                openActionMenu(e);
                              }
                            }}
                            onFocus={() => {
                              setFocusedOnGrid(true);
                              setSelectedRecordIndex(idx);
                            }}
                            onBlur={() => setFocusedOnGrid(false)}
                            tabIndex={0}
                            style={{ cursor: 'pointer' }}
                          >
                            <td><input type="checkbox" checked={!!isSelected} onChange={() => {}} /></td>
                            <td>{record.bk_bkid}</td>
                            <td>{new Date(record.bk_bookingdt || record.createdOn || new Date()).toLocaleDateString()}</td>
                            <td>{record.customerName || record.bk_customername || 'N/A'}</td>
                            <td>{formatPhoneNumber(record.phoneNumber || record.bk_phonenumber || record.bk_phone || 'N/A')}</td>
                            <td>
                              <button 
                                className="erp-button" 
                                style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }} 
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row selection
                                  showPassengerDetails(record.bk_bkid);
                                }}
                              >
                                {record.totalPassengers || passengerList.filter(p => p.name.trim() !== '').length || 0}
                              </button>
                            </td>
                            <td>{record.fromStation?.st_stname || record.bk_fromstation || record.bk_fromst || 'N/A'}</td>
                            <td>{record.toStation?.st_stname || record.bk_tostation || record.bk_tost || 'N/A'}</td>
                            <td>{new Date(record.bk_trvldt || record.bk_travelldate || new Date()).toLocaleDateString()}</td>
                            <td>{record.bk_class || record.bk_travelclass || 'N/A'}</td>
                            <td>{record.bk_status || 'Draft'}</td>
                            <td>{record.createdBy || record.bk_createdby || 'system'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Filter Panel */}
        <div className="erp-filter-panel">
          <div className="erp-filter-header">
            Filter Criteria
            {(filteredBookings.length !== bookings.length) && (
              <span className="erp-filter-indicator">{filteredBookings.length}/{bookings.length}</span>
            )}
          </div>
          
          <div className="erp-form-row">
            <label className="erp-form-label">Booking ID</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['bk_bkid'] || ''}
              onChange={(e) => handleInlineFilterChange('bk_bkid', e.target.value)}
              placeholder="Search ID..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Booking Date</label>
            <input 
              type="date" 
              className="erp-input"
              value={inlineFilters['bk_bookingdt'] || ''}
              onChange={(e) => handleInlineFilterChange('bk_bookingdt', e.target.value)}
              placeholder="Search date..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Customer Name</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['customerName'] || ''}
              onChange={(e) => handleInlineFilterChange('customerName', e.target.value)}
              placeholder="Search customer..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Phone Number</label>
            <input 
              type="tel" 
              className="erp-input"
              value={inlineFilters['phoneNumber'] || ''}
              onChange={(e) => handleInlineFilterChange('phoneNumber', e.target.value)}
              placeholder="Search phone..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Total Passengers</label>
            <input 
              type="number" 
              className="erp-input"
              value={inlineFilters['totalPassengers'] || ''}
              onChange={(e) => handleInlineFilterChange('totalPassengers', e.target.value)}
              placeholder="Search passengers..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">From Station</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['fromStation'] || ''}
              onChange={(e) => handleInlineFilterChange('fromStation', e.target.value)}
              placeholder="Search from..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">To Station</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['toStation'] || ''}
              onChange={(e) => handleInlineFilterChange('toStation', e.target.value)}
              placeholder="Search to..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Travel Date</label>
            <input 
              type="date" 
              className="erp-input"
              value={inlineFilters['bk_trvldt'] || ''}
              onChange={(e) => handleInlineFilterChange('bk_trvldt', e.target.value)}
              placeholder="Search date..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Travel Class</label>
            <select 
              className="erp-input"
              value={inlineFilters['bk_class'] || ''}
              onChange={(e) => handleInlineFilterChange('bk_class', e.target.value)}
            >
              <option value="">All Classes</option>
              <option value="SL">Sleeper (SL)</option>
              <option value="3A">3rd AC (3A)</option>
              <option value="2A">2nd AC (2A)</option>
              <option value="1A">1st AC (1A)</option>
              <option value="CC">Chair Car (CC)</option>
            </select>
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Status</label>
            <select 
              className="erp-input"
              value={inlineFilters['bk_status'] || ''}
              onChange={(e) => handleInlineFilterChange('bk_status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Waitlisted">Waitlisted</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
            <button 
              className="erp-button" 
              style={{ flex: 1 }}
              onClick={() => {
                setInlineFilters({});
                fetchBookings();
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Passenger Details Modal */}
      {showPassengerModal && (
        <div className="erp-modal-overlay" onClick={() => setShowPassengerModal(false)}>
          <div className="erp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="erp-modal-title">
              <span>Passenger Details</span>
              <button 
                className="erp-modal-close" 
                onClick={() => setShowPassengerModal(false)}
              >
                ×
              </button>
            </div>
            <div className="erp-modal-body">
              {loadingPassengers ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Loading passenger details...</div>
              ) : passengerDetails.length > 0 ? (
                <table className="erp-table" style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Berth Pref</th>
                      <th>Berth Alloc</th>
                      <th>Coach</th>
                      <th>Seat No</th>
                      <th>ID Type</th>
                      <th>ID Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengerDetails.map((passenger, index) => (
                      <tr key={index}>
                        <td>{passenger.firstName} {passenger.lastName || ''}</td>
                        <td>{passenger.age || ''}</td>
                        <td>{passenger.gender || ''}</td>
                        <td>{passenger.berthPreference || ''}</td>
                        <td>{passenger.berthAllocated || ''}</td>
                        <td>{passenger.coach || ''}</td>
                        <td>{passenger.seatNo || ''}</td>
                        <td>{passenger.idProofType || ''}</td>
                        <td>{passenger.idProofNumber || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>No passenger details available</div>
              )}
            </div>
            <div className="erp-modal-footer">
              <button 
                className="erp-button" 
                onClick={() => setShowPassengerModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar - Static */}
      <div className="erp-status-bar">
        <div className="erp-status-item">{isEditing ? 'Editing' : 'Ready'}</div>
        <div className="erp-status-item">
          Records: {filteredBookings.length !== bookings.length ? `${filteredBookings.length}/${bookings.length}` : filteredBookings.length}
        </div>
        <div className="erp-status-item">
          Showing: {paginatedData.length > 0 ? `${((currentPage - 1) * recordsPerPage) + 1}-${Math.min(currentPage * recordsPerPage, filteredBookings.length)}` : '0'} of {filteredBookings.length}
        </div>
        <div className="erp-status-item" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="First Page"
          >
            |◀
          </button>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            ◀
          </button>
          <span style={{ margin: '0 4px', fontSize: '11px' }}>Page {currentPage}/{totalPages || 1}</span>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Next Page"
          >
            ▶
          </button>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Last Page"
          >
            ▶|
          </button>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      <SaveConfirmationModal
        isOpen={isModalOpen}
        onConfirm={handleSaveConfirmed}
        onCancel={() => {}}
        message="You have reached the end of the form. Save this booking record?"
      />

      {/* Record Action Menu */}
      <RecordActionMenu
        isOpen={actionMenuOpen}
        onClose={closeActionMenu}
        position={actionMenuPosition}
        record={selectedBooking}
        actions={selectedBooking ? getActionMenuItems(selectedBooking) : []}
        onActionSelect={handleActionSelect}
      />

      {/* Keyboard Shortcuts Help */}
      <div className="keyboard-shortcuts-help">
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Keyboard Shortcuts:</div>
        <div>↑↓ Navigate Records | ←→ Navigate Pages</div>
        <div>Enter: Action Menu | Ctrl+N: New | Ctrl+E: Edit | Ctrl+D: Delete</div>
        <div>F2: Edit | F4: Delete | F10: Save | Esc: Cancel</div>
      </div>
    </div>
  );
};

export default Bookings;