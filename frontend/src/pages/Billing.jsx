import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { bookingAPI, paymentAPI, billingAPI } from '../services/api';
import { usePagination } from '../hooks/usePagination';
import useERPFilters from '../hooks/useERPFilters';
import PaginationControls from '../components/common/PaginationControls';
import { useKeyboardNavigation } from '../contexts/KeyboardNavigationContext';
import SaveConfirmationModal from '../components/common/SaveConfirmationModal';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';
import '../styles/bookings.css';
import '../dense.css';

// Add inline styles for keyboard navigation and compact form layout
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
  
  /* Compact form layout styles */
  .erp-form-row-compact {
    display: grid;
    grid-template-columns: 100px 1fr 100px 1fr;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
  }
  
  .erp-form-row-compact-3 {
    display: grid;
    grid-template-columns: 100px 1fr 100px 1fr 100px 1fr;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
  }
  
  .erp-form-row-compact-4 {
    display: grid;
    grid-template-columns: 100px 1fr 100px 1fr 100px 1fr 100px 1fr;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
  }
  
  .erp-form-row-compact-5 {
    display: grid;
    grid-template-columns: 100px 1fr 100px 1fr 100px 1fr 100px 1fr 100px 1fr;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
  }
  
  .erp-form-row-compact .erp-form-label {
    text-align: right;
    font-size: 11px;
    font-weight: normal;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .erp-form-row-compact .erp-input {
    width: 100%;
    min-width: 0;
    padding: 2px 4px;
    font-size: 11px;
  }
  
  .erp-form-row-compact .erp-input:focus {
    outline: 1px solid #005fcc;
  }
  
  .erp-form-row-compact select.erp-input {
    padding: 1px 2px;
  }
  
  .erp-form-row-compact textarea.erp-input {
    padding: 2px 4px;
    font-size: 11px;
    resize: vertical;
  }
  
  .erp-status-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  .status-cancelled, .status-can {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ef9a9a;
  }
  
  .status-confirmed, .status-cnf, .status-final {
    background-color: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #a5d6a7;
  }
  
  .status-draft {
    background-color: #e3f2fd;
    color: #1565c0;
    border: 1px solid #90caf9;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = keyboardNavigationStyles;
  document.head.appendChild(styleSheet);
}

// Import billing components
import BillCreationForm from '../components/Billing/BillCreationForm';
import BillList from '../components/Billing/BillList';
import BillDetails from '../components/Billing/BillDetails';
import CustomerLedger from '../components/Billing/CustomerLedger';

const Billing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    registerForm,
    unregisterForm,
    setActiveForm,
    moveNext,
    movePrevious,
    enterAction,
    openModal,
    closeModal,
    focusField,
    handleManualFocus
  } = useKeyboardNavigation();
  const [bills, setBills] = useState([]); // Add missing bills state
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false); // background fetch — no table unmount
  const [error, setError] = useState('');
  const [aggregates, setAggregates] = useState({ 
    totalAmount: 0, 
    totalFare: 0, 
    totalServiceCharges: 0, 
    totalSBIncentive: 0, 
    totalGST: 0, 
    count: 0 
  });
  
  // Pagination state - 50 records per page with server-side support
  const {
    page,
    limit,
    pagination,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    changeLimit,
    updatePagination
  } = usePagination(1, 50);
  
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'ledger'
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewBill, setPreviewBill] = useState(null);
  
  // Editing state (MOVED TO TOP to avoid TDZ)
  const [isEditing, setIsEditing] = useState(false);
  const [isPassengerSectionOpen, setIsPassengerSectionOpen] = useState(false);
  
  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelFormData, setCancelFormData] = useState({
    railwayCharges: 0,
    agentCharges: 0,
    reason: '',
    cancellationDate: '',
    approverUserId: '',
    approverName: ''
  });
  const cancelModalRef = useRef(null);
  
  // Booking integration state
  const [bookingData, setBookingData] = useState(null);
  const [billingMode, setBillingMode] = useState('list'); // 'list', 'generate', 'view'
  
  // Save confirmation state
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  // Hard lock to prevent duplicate draft booking creation
  const isCreatingDraftRef = useRef(false);
  
  // Audit data for the form
  const [auditData, setAuditData] = useState({
    enteredOn: '',
    enteredBy: user?.us_usid || 'ADMIN',
    modifiedOn: '',
    modifiedBy: user?.us_usid || 'ADMIN',
    closedOn: '',
    closedBy: ''
  });
  
  // MANDATORY: Define business logic field order (MEMOIZED) - MATCHES REQUIRED KEYBOARD NAVIGATION SEQUENCE
  const fieldOrder = useMemo(() => [
    'stationBoy',
    'trainNumber',
    'pnrNumbers',
    'seatsAlloted',
    'railwayFare',
    'serviceCharges',
    'platformFees',
    'stationBoyIncentive',
    'miscCharges',
    'deliveryCharges',
    'cancellationCharges',
    'gst',
    'surcharge',
    'gstType',
    'status',
    'remarks'
  ], []);
  
  const [formData, setFormData] = useState({
    id: '',
    billDate: new Date().toISOString().split('T')[0],
    bookingId: '', // Read-only when populated from booking
    subBillNo: '',
    customerName: '',
    phoneNumber: '',
    stationBoy: '',
    fromStation: '',
    toStation: '',
    journeyDate: '',
    trainNumber: '',
    reservationClass: '3A',
    ticketType: 'NORMAL',
    pnrNumbers: '',
    seatsAlloted: '',
    railwayFare: '',
    stationBoyIncentive: '',
    serviceCharges: '',
    platformFees: '',
    miscCharges: '',
    deliveryCharges: '',
    cancellationCharges: '',
    gst: '',
    surcharge: '',
    gstType: 'EXCLUSIVE',
    totalAmount: 0, // Auto-calculated and rounded off
    passengerList: [],
    remarks: '',
    status: 'DRAFT'
  });

  // Initialize keyboard navigation
  useEffect(() => {
    try {
      registerForm('billing', fieldOrder);
      
      // Set active form
      setActiveForm('billing');
      
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Keyboard navigation initialized for billing form');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Keyboard navigation init failed:', error.message);
      }
    }
    
    return () => {
      try {
        unregisterForm('billing');
      } catch (error) {
        // Silent cleanup in production
        if (process.env.NODE_ENV === 'development') {
          console.warn('Keyboard navigation cleanup failed:', error.message);
        }
      }
    };
  }, [fieldOrder, registerForm, unregisterForm, setActiveForm]);

  // Handle initial focus when entering edit mode from booking generation
  useEffect(() => {
    if (isEditing && billingMode === 'generate') {
      // Delay focus to ensure DOM is ready
      setTimeout(() => {
        const stationBoyField = document.querySelector('input[name="stationBoy"]');
        if (stationBoyField) {
          stationBoyField.focus();
          stationBoyField.select(); // Select all text for easy editing
        }
      }, 100);
    }
  }, [isEditing, billingMode]);

  // Monitor formData changes for debugging and validation
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Form data updated:', {
        journeyDate: formData.journeyDate,
        journeyDateValid: formData.journeyDate && /^\d{4}-\d{2}-\d{2}$/.test(formData.journeyDate),
        customerName: formData.customerName,
        fromStation: formData.fromStation,
        toStation: formData.toStation,
        bookingId: formData.bookingId
      });
      
      // Check if journeyDate input exists in DOM
      const journeyDateInput = document.querySelector('input[name="journeyDate"]');
      if (journeyDateInput) {
        console.log('🔍 Journey date input found in DOM, value:', journeyDateInput.value);
      } else {
        console.log('❌ Journey date input NOT found in DOM');
      }
    }
    
    // Validate journey date format
    if (formData.journeyDate && !/^\d{4}-\d{2}-\d{2}$/.test(formData.journeyDate)) {
      console.warn('⚠️ Invalid journey date format:', formData.journeyDate);
    }
  }, [formData.journeyDate, formData.customerName, formData.fromStation, formData.toStation, formData.bookingId]);
  
  // Handle booking integration from location state
  useEffect(() => {
    if (location.state) {
      const { bookingId, mode, bookingData: passedBookingData } = location.state;
      
      if (bookingId && mode) {
        setBillingMode(mode);
        setBookingData(passedBookingData);
        
        if (mode === 'generate' && passedBookingData) {
          // Comprehensive journey date extraction with multiple fallbacks
          const extractJourneyDate = (bookingData) => {
            // Check all possible date field names in order of preference
            const dateFields = [
              bookingData.bk_trvldt,        // Primary booking date field
              bookingData.bk_jdate,         // Alternative date field
              bookingData.bk_travelldate,   // Transformed date field
              bookingData.travelDate,       // Direct travel date
              bookingData.journeyDate,      // Journey date field
              bookingData.bk_traveldate     // Another variation
            ];
            
            // Find the first valid date value
            let dateValue = '';
            for (const field of dateFields) {
              if (field) {
                dateValue = field;
                break;
              }
            }
            
            // Convert to proper yyyy-MM-dd format if needed
            if (dateValue) {
              try {
                // Handle different input formats
                if (typeof dateValue === 'string') {
                  // Already in yyyy-MM-dd format
                  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                    return dateValue;
                  }
                  // Convert from ISO string
                  if (dateValue.includes('T')) {
                    return new Date(dateValue).toISOString().split('T')[0];
                  }
                  // Try to parse as date string
                  const parsedDate = new Date(dateValue);
                  if (!isNaN(parsedDate.getTime())) {
                    return parsedDate.toISOString().split('T')[0];
                  }
                } else if (dateValue instanceof Date) {
                  return dateValue.toISOString().split('T')[0];
                }
              } catch (error) {
                console.warn('Failed to parse journey date:', dateValue, error);
              }
            }
            
            return '';
          };
          
          // Extract journey date
          const journeyDateValue = extractJourneyDate(passedBookingData);
          
          console.log('📥 Booking data received for billing:', {
            bookingId: bookingId,
            customerName: passedBookingData.bk_customername || passedBookingData.customerName,
            journeyDateRaw: {
              bk_trvldt: passedBookingData.bk_trvldt,
              bk_jdate: passedBookingData.bk_jdate,
              bk_travelldate: passedBookingData.bk_travelldate,
              travelDate: passedBookingData.travelDate,
              journeyDate: passedBookingData.journeyDate
            },
            journeyDateProcessed: journeyDateValue
          });
          
          // Fetch passenger list for this booking
          const fetchPassengers = async () => {
            try {
              const passengerResponse = await bookingAPI.getBookingPassengers(bookingId);
              const passengers = passengerResponse?.data?.passengers || passengerResponse?.passengers || [];
              
              console.log('📋 Passengers fetched for billing:', passengers);
              
              // Map passengers to the format expected by the billing form
              const mappedPassengers = passengers.map(p => ({
                name: `${p.ps_fname || ''} ${p.ps_lname || ''}`.trim() || p.name || '',
                age: p.ps_age || p.age || '',
                gender: p.ps_gender || p.gender || 'M',
                berthPreference: p.ps_berthpref || p.berthPreference || ''
              }));
              
              return mappedPassengers;
            } catch (error) {
              console.error('Failed to fetch passengers:', error);
              return [];
            }
          };
          
          // Load passengers and update form data
          fetchPassengers().then(passengers => {
            setFormData(prev => ({
              ...prev,
              bookingId: bookingId,
              customerName: passedBookingData.bk_customername || passedBookingData.customerName || '',
              phoneNumber: passedBookingData.bk_phonenumber || passedBookingData.phoneNumber || '',
              fromStation: passedBookingData.bk_fromst || passedBookingData.fromStation || '',
              toStation: passedBookingData.bk_tost || passedBookingData.toStation || '',
              journeyDate: journeyDateValue,
              trainNumber: passedBookingData.bk_trno || passedBookingData.trainNumber || '',
              reservationClass: passedBookingData.bk_class || passedBookingData.reservationClass || '3A',
              ticketType: passedBookingData.bk_tickettype || passedBookingData.ticketType || 'NORMAL',
              pnrNumbers: passedBookingData.bk_pnr || passedBookingData.pnrNumber || '',
              passengerList: passengers // Add passenger list
              // EXCLUDE financial fields - leave them empty for manual entry
            }));
          });
          
          setActiveView('create');
          setShowForm(true);
          setIsEditing(true); // Set editing mode to true for new billing from booking
        } else if (mode === 'view') {
          // Load existing bill for this booking
          loadBillForBooking(bookingId);
        }
      }
    }
  }, [location.state]);

  const loadBillForBooking = async (bookingId) => {
    try {
      setLoading(true);
      const response = await billingAPI.getBillByBookingId(bookingId);
      if (response.success && response.data) {
        setSelectedBill(response.data);
        setShowBillDetails(true);
        setActiveView('view');
      } else {
        setError('No billing record found for this booking');
      }
    } catch (error) {
      setError(error.message || 'Failed to load billing record');
    } finally {
      setLoading(false);
    }
  };

  // Filter state
  const [filters, setFilters] = useState({
    billId: '',
    customerId: '',
    customerName: '',
    pnrNumber: '',
    status: '',
    dateRange: '',
    balanceDueOnly: false
  });

  // Inline filters - Enable real-time filtering with 500ms debounce
  // NOTE: do NOT call setPage(1) here — that extra state update causes a re-render
  // that steals focus from the filter input. Page reset is handled inside fetchBills.
  const handleFilterApply = useCallback(() => {
    // intentionally empty — fetchBills reacts to activeFilters changing
  }, []);

  const { 
    draftFilters: inlineFilters, 
    activeFilters, 
    handleFilterChange: handleInlineFilterChange, 
    applyFiltersManual: applyFilters, 
    clearFiltersManual: clearFilters 
  } = useERPFilters({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  }, handleFilterApply, { 
    realTime: true, 
    debounceMs: 500 
  });

  // Date range validation
  useEffect(() => {
    if (inlineFilters.startDate && inlineFilters.endDate) {
      if (new Date(inlineFilters.endDate) < new Date(inlineFilters.startDate)) {
        setError('End Date cannot be earlier than Start Date');
      } else {
        setError('');
      }
    }
  }, [inlineFilters.startDate, inlineFilters.endDate]);

  // Customer lookup state
  const [customerLookup, setCustomerLookup] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  // Fetch customer details
  const fetchCustomerDetails = async (customerId) => {
    try {
      // In a real implementation, this would call the customer API
      // For now, we'll simulate the response
      const customer = {
        id: customerId,
        name: customerId === 'CUS001' ? 'Anil Gupta' : 
              customerId === 'CUS002' ? 'Priya Mehra' : 
              `${customerId} Name`,
        gstin: '27AABCU9603RZ6',
        billingAddress: 'Mumbai, Maharashtra'
      };
      
      setFormData(prev => ({
        ...prev,
        customerName: customer.name,
        customerGstin: customer.gstin,
        customerBillingAddress: customer.billingAddress
      }));
    } catch (err) {
      console.error('Error fetching customer details:', err);
    }
  };
  
  // Fetch customer details by name
  const fetchCustomerDetailsByName = async (customerName) => {
    try {
      // In a real implementation, this would call the customer API
      // For now, we'll simulate the response
      const mockCustomers = [
        { id: 'CUS001', name: 'Anil Gupta' },
        { id: 'CUS002', name: 'Priya Mehra' },
        { id: 'CUS003', name: 'Rajesh Kumar' },
        { id: 'CUS004', name: 'Sunita Sharma' },
        { id: 'CUS005', name: 'Vikram Singh' }
      ];
      
      const customer = mockCustomers.find(c => c.name.toLowerCase() === customerName.toLowerCase()) || 
                      { id: `CUST_${customerName.replace(/\s+/g, '')}`, name: customerName };
      
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerGstin: '27AABCU9603RZ6',
        customerBillingAddress: 'Mumbai, Maharashtra'
      }));
    } catch (err) {
      console.error('Error fetching customer details by name:', err);
    }
  };
  
  // Fetch customer lookup
  const fetchCustomerLookup = async (searchTerm) => {
    try {
      // In a real implementation, this would call the customer API with search term
      // For now, we'll simulate the response
      const mockCustomers = [
        { id: 'CUS001', name: 'Anil Gupta' },
        { id: 'CUS002', name: 'Priya Mehra' },
        { id: 'CUS003', name: 'Rajesh Kumar' },
        { id: 'CUS004', name: 'Sunita Sharma' },
        { id: 'CUS005', name: 'Vikram Singh' }
      ];
      
      const filtered = mockCustomers.filter(customer => 
        customer.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setCustomerLookup(filtered);
      setShowCustomerDropdown(true);
    } catch (err) {
      console.error('Error fetching customer lookup:', err);
      setCustomerLookup([]);
      setShowCustomerDropdown(false);
    }
  };
  
  // Handle customer ID change
  const handleCustomerIdChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      customerId: value,
      customerName: '', // Clear customer name when ID changes
      customerGstin: '',
      customerBillingAddress: ''
    }));
    
    if (value.length >= 3) {
      fetchCustomerLookup(value);
    } else {
      setCustomerLookup([]);
      setShowCustomerDropdown(false);
    }
  };
  
  // Handle customer name change
  const handleCustomerNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      customerName: value,
      customerId: '', // Clear customer ID when name changes
      customerGstin: '',
      customerBillingAddress: ''
    }));
    
    if (value.length >= 3) {
      fetchCustomerLookup(value);
    } else {
    }
  };

  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name || (customer.us_fname + ' ' + (customer.us_lname || '')),
      phoneNumber: customer.phone || customer.us_phone || '',
      id: customer.id || customer.cu_cusid
    }));
    setShowCustomerLookup(false);
    fetchCustomerDetails(customer.id || customer.cu_cusid); // Fetch detailed customer info
  };
  
  // Fetch bills when component mounts
  useEffect(() => {
    fetchBills();
  }, []); // Remove user dependency to ensure initial load
  
  // Calculate totals when form data changes
  useEffect(() => {
    if (isEditing) {
      // Calculate subtotal
      const railwayFare = parseFloat(formData.railwayFare) || 0;
      const serviceCharges = parseFloat(formData.serviceCharges) || 0;
      const platformFees = parseFloat(formData.platformFees) || 0;
      const stationBoyIncentive = parseFloat(formData.stationBoyIncentive) || 0;
      const miscCharges = parseFloat(formData.miscCharges) || 0;
      const deliveryCharges = parseFloat(formData.deliveryCharges) || 0;
      const cancellationCharges = parseFloat(formData.cancellationCharges) || 0;
      
      // Calculate subtotal (base fare + all charges before GST)
      const subtotal = railwayFare + serviceCharges + platformFees + stationBoyIncentive + miscCharges + deliveryCharges + cancellationCharges;
      
      // Auto-calculate GST (5% of subtotal) if it's empty or subtotal changed and it's 0
      // We check if the field was empty to avoid overriding manual input constantly
      let currentGstRate = parseFloat(formData.gst);
      
      // If GST is empty or 0, or if we want to force auto-calc on subtotal change
      // Here we choose to only auto-calculate if it's empty or 0 to allow manual override
      if (isNaN(currentGstRate) || currentGstRate === 0) {
        currentGstRate = 5; // Default 5% for travel services
      }
      
      const surcharge = parseFloat(formData.surcharge) || 0;
      
      // Calculate tax based on GST type
      let taxAmount = 0;
      let grandTotal = 0;
      
      if (formData.gstType === 'EXCLUSIVE') {
        taxAmount = (subtotal * currentGstRate) / 100;
        grandTotal = subtotal + taxAmount + surcharge;
      } else if (formData.gstType === 'INCLUSIVE') {
        // If GST is inclusive, the GST is already included in the subtotal
        taxAmount = (subtotal * currentGstRate) / (100 + currentGstRate);
        grandTotal = subtotal + surcharge;
      } else { // C type
        taxAmount = (subtotal * currentGstRate) / 100;
        grandTotal = subtotal + taxAmount + surcharge;
      }
      
      // Update form data with calculated values
      setFormData(prev => {
        // Only update if values actually changed to prevent loops
        const newTotal = Math.round(grandTotal * 100) / 100;
        const updates = {};
        
        if (prev.totalAmount !== newTotal) {
          updates.totalAmount = newTotal;
        }
        
        // Auto-fill GST field if it was empty/zero
        if ((!prev.gst || parseFloat(prev.gst) === 0) && currentGstRate !== 0) {
          updates.gst = currentGstRate.toString();
        }
        
        if (Object.keys(updates).length > 0) {
          return { ...prev, ...updates };
        }
        return prev;
      });
    }
  }, [formData.railwayFare, formData.serviceCharges, formData.platformFees, formData.stationBoyIncentive, formData.miscCharges, formData.deliveryCharges, formData.cancellationCharges, formData.gst, formData.gstType, formData.surcharge, isEditing]);

  // Track previous activeFilters ref to detect filter changes vs page changes
  const prevActiveFiltersRef = useRef(activeFilters);

  const fetchBills = useCallback(async () => {
    // Detect whether this is a filter change (background fetch) or initial/page load
    const isFilterChange = prevActiveFiltersRef.current !== activeFilters;
    prevActiveFiltersRef.current = activeFilters;

    // On filter change: use isFetching (no table unmount, no focus loss)
    // On initial load or page change: use loading (shows spinner)
    if (isFilterChange) {
      setIsFetching(true);
    } else {
      setLoading(true);
    }

    try {
      const isEmployee = user && (
        ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(user.us_roid) ||
        user.us_usertype === 'admin' ||
        user.usertype === 'admin'
      );

      // When filters change, always fetch from page 1
      const effectivePage = isFilterChange ? 1 : page;

      const params = {
        page: effectivePage,
        limit: limit,
        ...activeFilters
      };

      let response;
      if (isEmployee) {
        response = await billingAPI.getAllBills(params);
      } else {
        response = await billingAPI.getMyBills(params);
      }

      const billsArray = response?.data?.bills || response?.data || [];
      const paginationData = response?.pagination || response?.data?.pagination || null;
      const responseAggregates = response?.aggregates || null;

      const billsData = Array.isArray(billsArray) ? billsArray : [];

      const processedBills = billsData.map(bill => ({
        ...bill,
        id: bill.bl_id || bill.id,
        billNo: bill.bl_bill_no || bill.billNo || bill.bl_entry_no,
        billDate: bill.bl_billing_date || bill.billDate,
        bookingId: bill.bl_booking_id || bill.bookingId,
        subBillNo: bill.bl_sub_bill_no || bill.subBillNo,
        customerName: bill.bl_customer_name || bill.customerName,
        phoneNumber: bill.bl_customer_phone || bill.customerPhone || bill.phoneNumber || bill.phone,
        stationBoy: bill.bl_station_boy || bill.stationBoy,
        fromStation: bill.bl_from_station || bill.fromStation,
        toStation: bill.bl_to_station || bill.toStation,
        journeyDate: bill.bl_journey_date || bill.journeyDate,
        trainNumber: bill.bl_train_no || bill.trainNumber || bill.trainNo,
        reservationClass: bill.bl_class || bill.reservationClass || bill.class,
        ticketType: bill.bl_ticket_type || bill.ticketType || 'NORMAL',
        pnrNumbers: bill.bl_pnr || bill.pnrNumber || bill.pnrNumbers || bill.pnr,
        status: bill.bl_status || bill.status || 'DRAFT',
        totalAmount: Number(bill.bl_total_amount || bill.totalAmount || 0),
        paidAmount: Number(bill.paidAmount || 0)
      }));

      setBills(processedBills);

      if (paginationData) {
        updatePagination(paginationData);
        // Sync page state to page 1 when filters changed
        if (isFilterChange) setPage(1);
      } else {
        updatePagination({
          currentPage: effectivePage,
          totalPages: Math.ceil(processedBills.length / limit) || 1,
          totalRecords: processedBills.length,
        });
        if (isFilterChange) setPage(1);
      }

      if (responseAggregates) {
        setAggregates(responseAggregates);
      } else {
        const billsToAggregate = processedBills;
        setAggregates({
          totalAmount: billsToAggregate.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0),
          totalFare: billsToAggregate.reduce((sum, b) => sum + (parseFloat(b.railwayFare) || 0), 0),
          totalServiceCharges: billsToAggregate.reduce((sum, b) => sum + (parseFloat(b.serviceCharges) || 0), 0),
          totalSBIncentive: billsToAggregate.reduce((sum, b) => sum + (parseFloat(b.stationBoyIncentive) || 0), 0),
          totalGST: billsToAggregate.reduce((sum, b) => sum + (parseFloat(b.gst) || 0), 0),
          count: billsToAggregate.length
        });
      }

      setError('');
    } catch (error) {
      console.error('Error fetching bills:', error);
      setError('Failed to load billing records');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [user, page, limit, activeFilters, updatePagination, setPage]);
  
  // Refetch when page or limit changes
  useEffect(() => {
    fetchBills();
  }, [page, limit, activeFilters, fetchBills]);

  

  // Helper function to get an available draft booking for testing
  const getAvailableDraftBookingId = async () => {
    try {
      // First try to get bookings from API
      const response = await fetch('/api/bookings?status=DRAFT', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.bookings && data.data.bookings.length > 0) {
          return data.data.bookings[0].bk_bkid;
        }
      }
      
      // Fallback: return a default booking ID that should exist
      // In production, this should be replaced with proper booking selection
      console.warn('No draft bookings found via API, using fallback booking ID');
      return 1; // Assuming booking ID 1 exists
      
    } catch (error) {
      console.error('Error getting available booking:', error);
      // Return a safe default
      return 1;
    }
  };

  const handleCreateBill = async (billData) => {
    // HARD LOCK: Prevent duplicate draft booking creation
    if (isCreatingDraftRef.current) {
      console.warn('Draft booking creation already in progress');
      return;
    }
    
    isCreatingDraftRef.current = true;
    
    try {
      // Use bookingId from billData if available, otherwise get an available draft booking
      // Priority: 1) billData.bookingId, 2) getAvailableDraftBookingId()
      let bookingId = billData.bookingId;
      
      if (!bookingId) {
        // Get available draft bookings for billing
        // In a real implementation, you'd want to:
        // 1. Show a dropdown of available draft bookings
        // 2. Or create a proper workflow for linking bills to bookings
        bookingId = await getAvailableDraftBookingId();
        console.log('No bookingId in formData, fetched available booking ID:', bookingId);
      } else {
        console.log('Using bookingId from formData:', bookingId);
      }
      
      console.log('Using booking ID for bill creation:', bookingId);

      // Create the bill using the booking ID
      const billPayload = {
        bookingId: bookingId,
        customerName: billData.customerName || '',
        phoneNumber: billData.phoneNumber || '',
        stationBoy: billData.stationBoy || '',
        fromStation: billData.fromStation || '',
        toStation: billData.toStation || '',
        journeyDate: billData.journeyDate || '',
        trainNumber: billData.trainNumber || '',
        reservationClass: billData.reservationClass || '3A',
        ticketType: billData.ticketType || 'NORMAL',
        pnrNumbers: billData.pnrNumbers || '',
        seatsAlloted: billData.seatsReserved || '',
        railwayFare: billData.railwayFare || 0,
        stationBoyIncentive: billData.stationBoyIncentive || 0,
        serviceCharges: billData.serviceCharges || 0,
        platformFees: billData.platformFees || 0,
        miscCharges: billData.miscCharges || 0,
        deliveryCharges: billData.deliveryCharges || 0,
        cancellationCharges: billData.cancellationCharges || 0,
        gst: billData.gst || 0,
        surcharge: billData.surcharge || 0,
        discount: billData.discount || 0,
        gstType: billData.gstType || 'EXCLUSIVE',
        totalAmount: billData.totalAmount || 0,
        billDate: billData.billDate || new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        remarks: billData.remarks || ''
      };

      console.log('Creating bill with payload:', billPayload);
      const newBill = await billingAPI.createBill(billPayload);
      console.log('New bill created:', newBill);
      
      // Show success message
      alert('Bill created successfully!');

      setShowForm(false);
      setActiveView('list');
      await fetchBills(); // Wait for fetch to complete
    } catch (error) {
      console.error('Error creating bill:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to create bill';
      
      if (error.message.includes('Booking not found')) {
        errorMessage = 'No valid booking found. Please create a booking first.';
      } else if (error.message.includes('Failed to create bill')) {
        errorMessage = 'Unable to create bill. Please check all required fields are filled correctly.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      alert(errorMessage); // Show alert to user
    } finally {
      // ALWAYS release the lock
      isCreatingDraftRef.current = false;
    }
  };

  const handleUpdateBill = async (billId, billData) => {
    try {
      // Transform the bill data to match the backend field names
      const transformedBillData = {
        customerName: billData.customerName || '',
        phoneNumber: billData.phoneNumber || '',
        stationBoy: billData.stationBoy || '',
        fromStation: billData.fromStation || '',
        toStation: billData.toStation || '',
        journeyDate: billData.journeyDate || '',
        trainNumber: billData.trainNumber || '',
        reservationClass: billData.reservationClass || '3A',
        ticketType: billData.ticketType || 'NORMAL',
        pnrNumbers: billData.pnrNumbers || '',
        seatsAlloted: billData.seatsReserved || '',
        railwayFare: billData.railwayFare || 0,
        stationBoyIncentive: billData.stationBoyIncentive || 0,
        serviceCharges: billData.serviceCharges || 0,
        platformFees: billData.platformFees || 0,
        miscCharges: billData.miscCharges || 0,
        deliveryCharges: billData.deliveryCharges || 0,
        cancellationCharges: billData.cancellationCharges || 0,
        gst: billData.gst || 0,
        surcharge: billData.surcharge || 0,
        discount: billData.discount || 0,
        gstType: billData.gstType || 'EXCLUSIVE',
        totalAmount: billData.totalAmount || 0,
        billDate: billData.billDate || new Date().toISOString().split('T')[0],
        status: billData.status || 'DRAFT',
        remarks: billData.remarks || ''
      };
      
      const updatedBill = await billingAPI.updateBill(billId, transformedBillData);
      console.log('Bill updated:', updatedBill);
      setShowForm(false);
      setActiveView('list');
      await fetchBills(); // Wait for fetch to complete
    } catch (error) {
      console.error('Error updating bill:', error);
      setError(error.message || 'Failed to update bill');
    }
  };

  const handleDeleteBill = async (billId) => {
    if (window.confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      try {
        await billingAPI.deleteBill(billId);
        setBills(bills.filter(bill => bill.id !== billId));
        fetchBills();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleFinalizeBill = async (billId) => {
    try {
      await billingAPI.finalizeBill(billId);
      fetchBills();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancelBill = () => {
    if (selectedBill) {
      if (selectedBill.status === 'CANCELLED' || selectedBill.bl_status === 'CANCELLED') {
        alert('This bill is already cancelled.');
        return;
      }
      const ps = (selectedBill.payment_status || '').toUpperCase();
      if (ps === 'FULLY_PAID' || ps === 'PARTIALLY_PAID') {
        alert('Cannot cancel: bill shows payments recorded. Reconcile receipts first.');
        return;
      }
      const st = (selectedBill.bl_status || selectedBill.status || '').toUpperCase();
      if (st === 'PAID' || st === 'FINAL') {
        alert('Cannot cancel: bill is paid or finalized.');
        return;
      }
      setCancelFormData({
        railwayCharges: 0,
        agentCharges: 0,
        reason: '',
        cancellationDate: new Date().toISOString().slice(0, 10),
        approverUserId: user?.us_usid || '',
        approverName: [user?.us_fname, user?.us_lname].filter(Boolean).join(' ').trim() || user?.us_usid || ''
      });
      setShowCancelModal(true);
      // Focus will be handled by useEffect
    } else {
      alert('Please select a bill to cancel');
    }
  };

  const handleCancelSave = async () => {
    setCancelError('');
    if (!cancelFormData.reason) {
      setCancelError('Cancellation reason is required');
      return;
    }
    if (!cancelFormData.cancellationDate) {
      setCancelError('Cancellation date is required');
      return;
    }
    if (!cancelFormData.approverUserId || !String(cancelFormData.approverUserId).trim()) {
      setCancelError('Approver user id is required');
      return;
    }
    if (!cancelFormData.approverName || !String(cancelFormData.approverName).trim()) {
      setCancelError('Approver name is required');
      return;
    }

    const totalCharges = (parseFloat(cancelFormData.railwayCharges) || 0) + (parseFloat(cancelFormData.agentCharges) || 0);
    if (totalCharges > selectedBill.totalAmount) {
      setCancelError('Total cancellation charges cannot exceed bill amount');
      return;
    }

    try {
      setIsCancelling(true);
      await billingAPI.cancelBill(selectedBill.id, cancelFormData);
      setShowCancelModal(false);
      alert('Bill cancelled successfully');
      fetchBills();
    } catch (error) {
      setCancelError('Error cancelling bill: ' + error.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExportBill = async (billId) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 Exporting bill as PDF:', billId);
      }
      setLoading(true); // Show a brief loading indicator if possible, or just use the local state
      const billNo = selectedBill?.billNo || selectedBill?.bl_bill_no || `BILL-${billId}`;
      await billingAPI.downloadBillPDF(billId, billNo);
    } catch (error) {
      console.error('❌ PDF Export failed:', error);
      setError('PDF Export failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = (billOrId) => {
    const id =
      billOrId && typeof billOrId === 'object'
        ? (billOrId.id || billOrId.bl_id)
        : billOrId;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🖨️ HandlePrintBill called with:', { billOrId, resolvedId: id });
    }

    if (!id) {
      setError('Please select a valid bill to print');
      return;
    }

    navigate(`/print/bill/${encodeURIComponent(id)}`, {
      state: { returnTo: `${location.pathname}${location.search || ''}` }
    });
  };

  // Handle record selection
  const handleRecordSelect = (bill) => {
    setSelectedBill(bill);
    
    // Map bill data to form data structure with proper field names
    setFormData({
      id: bill.id,
      billDate: bill.billDate || '',
      bookingId: bill.bookingId || '',
      subBillNo: bill.subBillNo || '',
      customerName: bill.customerName || '',
      phoneNumber: bill.phoneNumber || '',
      stationBoy: bill.stationBoy || '',
      fromStation: bill.fromStation || '',
      toStation: bill.toStation || '',
      journeyDate: bill.journeyDate || '',
      trainNumber: bill.trainNumber || '',
      reservationClass: bill.reservationClass || '3A',
      ticketType: bill.ticketType || 'NORMAL',
      pnrNumbers: bill.pnrNumbers || '',
      // Seat allocation field
      seatsReserved: bill.seatsReserved || '',
      // Passenger list - CRITICAL: Include passenger data from bill
      passengerList: bill.passengerList || [],
      // Financial fields
      railwayFare: bill.railwayFare || '',
      serviceCharges: bill.serviceCharges || '',
      platformFees: bill.platformFees || '',
      stationBoyIncentive: bill.stationBoyIncentive || '',
      miscCharges: bill.miscCharges || '',
      deliveryCharges: bill.deliveryCharges || '',
      cancellationCharges: bill.cancellationCharges || '',
      gst: bill.gst || '',
      surcharge: bill.surcharge || '',
      discount: bill.discount || '',
      gstType: bill.gstType || 'EXCLUSIVE',
      amountReceived: bill.amountReceived || '',
      totalAmount: bill.totalAmount || '',
      status: bill.status || 'DRAFT',
      remarks: bill.remarks || ''
    });
    
    setIsEditing(false);
    
    // Set audit data from the selected bill
    setAuditData({
      enteredOn: bill.createdOn || '',
      enteredBy: bill.createdBy || '',
      modifiedOn: bill.modifiedOn || '',
      modifiedBy: bill.modifiedBy || '',
      closedOn: bill.closedOn || '',
      closedBy: bill.closedBy || ''
    });
  };

  // Handle new bill
  const handleNew = () => {
    setSelectedBill(null);
    setFormData({
      customerId: user?.us_usertype === 'customer' ? user.us_usid : '',
      customerName: '',
      phoneNumber: '',
      stationBoy: '',
      fromStation: '',
      toStation: '',
      journeyDate: '', // Will be set from booking data if available
      trainNumber: '',
      reservationClass: '3A',
      ticketType: 'NORMAL',
      pnrNumbers: '',
      // Seat allocation field
      seatsReserved: '',
      // Financial fields
      railwayFare: '',
      serviceCharges: '',
      platformFees: '',
      stationBoyIncentive: '',
      miscCharges: '',
      deliveryCharges: '',
      cancellationCharges: '',
      gst: '',
      surcharge: '',
      discount: '',
      gstType: 'EXCLUSIVE',
      amountReceived: '',
      totalAmount: '',
      billDate: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      remarks: ''
    });
    setIsEditing(true);
    
    setAuditData({
      enteredOn: '',
      enteredBy: user?.us_usid || 'ADMIN',
      modifiedOn: '',
      modifiedBy: '',
      closedOn: '',
      closedBy: ''
    });
  };

  // Handle edit
  const handleEdit = () => {
    if (selectedBill) {
      if (selectedBill.bl_status === 'CANCELLED' || selectedBill.status === 'CANCELLED') {
        alert('Cancelled bills are read-only and cannot be edited.');
        return;
      }
      setIsEditing(true);
    } else {
      alert('Please select a record first');
    }
  };

  // Handle save
  const handleSave = async () => {
    if (selectedBill) {
      // Update existing bill
      await handleUpdateBill(selectedBill.id, formData);
    } else {
      // Create new bill
      await handleCreateBill(formData);
    }
    setIsEditing(false);
  };
  
  // Save confirmation handlers
  const handleSaveConfirmed = async () => {
    setShowSaveModal(false);
    await handleSave();
    
    // Focus back to the form or reset focus
    if (billingMode === 'generate') {
      setTimeout(() => {
        const stationBoyField = document.querySelector('input[name="stationBoy"]');
        if (stationBoyField) {
          stationBoyField.focus();
        }
      }, 100);
    }
  };
  
  const handleSaveCancel = useCallback(() => {
    setShowSaveModal(false);
    // Return focus to the last field (remarks)
    setTimeout(() => {
      const remarksField = document.querySelector('input[name="remarks"]');
      if (remarksField) {
        remarksField.focus();
      }
    }, 100);
  }, []);
  
  // Enhanced tab navigation handler
  const handleEnhancedTabNavigation = useCallback((event, currentFieldName) => {
    if (event.key !== 'Tab') return false;
    
    event.preventDefault();
    event.stopPropagation();
    
    try {
      // Check if we're at the last field (remarks)
      if (currentFieldName === 'remarks' && !event.shiftKey && isEditing) {
        setShowSaveModal(true);
        return true;
      }
      
      // Find current field index in the field order
      const currentIndex = fieldOrder.indexOf(currentFieldName);
      if (currentIndex === -1) {
        return false;
      }
      
      // Calculate next or previous index based on shift key
      let nextIndex;
      if (event.shiftKey) {
        // Navigate backwards
        nextIndex = currentIndex > 0 ? currentIndex - 1 : fieldOrder.length - 1;
      } else {
        // Navigate forwards
        nextIndex = currentIndex < fieldOrder.length - 1 ? currentIndex + 1 : 0;
      }
      
      // Find the next field name
      const nextFieldName = fieldOrder[nextIndex];
      
      // Focus the next field
      const nextField = document.querySelector(`input[name="${nextFieldName}"], select[name="${nextFieldName}"]`);
      if (nextField && nextField.offsetParent !== null) { // Check if field is visible
        nextField.focus();
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Tab navigation failed:', error.message);
      return false;
    }
  }, [isEditing, fieldOrder]);

  // Handle navigation
  const handleNavigation = (direction) => {
    if (bills.length === 0) return;
    
    let newIndex = 0;
    if (selectedBill) {
      const currentIndex = bills.findIndex(item => 
        item.id === selectedBill.id
      );
      
      switch(direction) {
        case 'first': newIndex = 0; break;
        case 'prev': newIndex = currentIndex > 0 ? currentIndex - 1 : 0; break;
        case 'next': newIndex = currentIndex < bills.length - 1 ? currentIndex + 1 : bills.length - 1; break;
        case 'last': newIndex = bills.length - 1; break;
        default: break;
      }
    }
    
    handleRecordSelect(bills[newIndex]);
  };

  // Check if navigation buttons should be disabled
  const isFirstRecord = selectedBill && bills.length > 0 && 
    bills[0].id === selectedBill.id;
  const isLastRecord = selectedBill && bills.length > 0 && 
    bills[bills.length - 1].id === selectedBill.id;

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    // Global shortcuts that work even if form is not in edit mode
    if (e.ctrlKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      if (selectedBill && (selectedBill.id != null || selectedBill.bl_id != null)) {
        handlePrintBill(selectedBill);
      } else {
        setError('Please select a bill to print');
      }
      return;
    }

    if (e.key === 'F6') {
      e.preventDefault();
      handleCancelBill();
      return;
    }

    if (showCancelModal) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCancelModal(false);
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleCancelSave();
      }
      return;
    }
    
    if (!showForm || !isEditing) return;
    
    switch(e.key) {
      case 'Escape':
        e.preventDefault();
        // Close form without saving
        setShowForm(false);
        setActiveView('view');
        break;
      case 'F2':
        e.preventDefault();
        // Toggle edit mode
        setIsEditing(!isEditing);
        break;
      case 'F3':
        e.preventDefault();
        // Save form
        if (isEditing) {
          handleSave();
        }
        break;
      case 'F4':
        e.preventDefault();
        // New form
        handleNew();
        break;
      case 'F5':
        e.preventDefault();
        // Refresh data
        fetchBills();
        break;
      case 'F10':
        e.preventDefault();
        if (isEditing) {
          handleSave();
        }
        break;
      case 'Tab':
        // Handle tab navigation within form
        // Note: Default browser tab behavior will be used
        break;
      case 'Enter':
        // If we are in the cancellation modal, don't trigger general save
        if (showCancelModal) return;

        e.preventDefault();
        // Save form on Enter
        if (isEditing) {
          handleSave();
        }
        break;
      default:
        break;
    }
  };

  // Add event listener for keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showForm, isEditing, selectedBill, showCancelModal]);

  // Handle keyboard navigation in the cancellation modal
  const handleCancelModalKeyDown = (e) => {
    if (e.key === 'Tab') {
      const focusableElements = cancelModalRef.current.querySelectorAll(
        'input:not([disabled]), textarea:not([disabled]), button:not([disabled])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    } else if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const focusableElements = Array.from(cancelModalRef.current.querySelectorAll(
        'input:not([disabled]), textarea:not([disabled]), button:not([disabled])'
      ));
      const currentIndex = focusableElements.indexOf(document.activeElement);
      if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
        focusableElements[currentIndex + 1].focus();
      } else if (currentIndex === focusableElements.length - 1) {
        handleCancelSave();
      }
    }
  };

  // Focus Railway Charges when modal opens
  useEffect(() => {
    if (showCancelModal && cancelModalRef.current) {
      const firstInput = cancelModalRef.current.querySelector('input[name="railwayCharges"]');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [showCancelModal]);

  if (loading) {
    return (
      <div className="erp-admin-container">
        <div className="erp-loading">Loading billing records...</div>
      </div>
    );
  }

  return (
    <div className="erp-admin-container booking-layout">
      {/* Toolbar - Static */}
      <div className="erp-toolbar">
        <button className="erp-icon-button" onClick={() => navigate('/dashboard')} title="Home">🏠</button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('first')} 
          disabled={!selectedBill || isFirstRecord}
          title="First"
        >
          |◀
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('prev')} 
          disabled={!selectedBill || isFirstRecord}
          title="Previous"
        >
          ◀
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('next')} 
          disabled={!selectedBill || isLastRecord}
          title="Next"
        >
          ▶
        </button>
        <button 
          className="erp-icon-button" 
          onClick={() => handleNavigation('last')} 
          disabled={!selectedBill || isLastRecord}
          title="Last"
        >
          ▶|
        </button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleNew} title="New">New</button>
        <button className="erp-button" onClick={handleEdit} title="Edit">Edit</button>
        <button className="erp-button" onClick={() => {
          if (selectedBill) {
            if (selectedBill.bl_status === 'CANCELLED' || selectedBill.status === 'CANCELLED') {
              alert('Cancelled bills cannot be deleted for audit reasons.');
              return;
            }
            handleDeleteBill(selectedBill.id);
          } else {
            alert('Please select a bill to delete');
          }
        }} title="Delete" disabled={!selectedBill || selectedBill.bl_status === 'CANCELLED'}>Delete</button>
        <button className="erp-button" onClick={handleCancelBill} title="Cancel Bill (F6)" disabled={!selectedBill || selectedBill.bl_status === 'CANCELLED' || selectedBill.status === 'CANCELLED'}>Cancel Bill</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleSave} disabled={!isEditing}>Save</button>
        <button className="erp-button" onClick={fetchBills} title="Refresh">Refresh</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={() => {
          if (selectedBill) {
            // Export bill functionality
            handleExportBill(selectedBill.id);
          } else {
            alert('Please select a bill to export');
          }
        }} title="Export" disabled={!selectedBill}>Export</button>
        {selectedBill ? (
          <Link
            className="erp-button"
            to={`/print/bill/${encodeURIComponent(selectedBill.id || selectedBill.bl_id)}`}
            state={{ returnTo: `${location.pathname}${location.search || ''}` }}
            title="Print invoice (same tab)"
            onClick={() => {
              if (process.env.NODE_ENV === 'development') {
                console.log('🖱️ Print Link clicked for bill ID:', selectedBill.id || selectedBill.bl_id);
              }
            }}
          >
            Print
          </Link>
        ) : (
          <button type="button" className="erp-button" disabled title="Print">
            Print
          </button>
        )}
        <Link className="erp-button" to="/billing/cancellations" title="Cancellation history">
          Cancellations
        </Link>
        
        <div style={{ flex: 1 }}></div>
        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
            {isEditing ? 'EDIT MODE' : 'READY'} | Total Records: {pagination.totalRecords || bills.length} | Total Pages: {pagination.totalPages || 1}
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="layout-content-wrapper" style={{ display: 'flex', height: 'calc(100vh - 110px)', overflow: 'hidden' }}>
        {/* Center Content */}
        <div className="layout-main-column" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: '100%' }}>
          {/* Form Panel - Static */}
          <div className="layout-form-section">
            {/* Row 1: Bill ID, Bill Date, Booking ID, Sub Bill No, Status (5 fields) */}
            <div className="erp-form-row-compact-5">
              <label className="erp-form-label required">Bill ID</label>
              <input 
                type="text" 
                className="erp-input" 
                value={formData.id || ''} 
                readOnly 
                disabled={!isEditing}
              />
              <label className="erp-form-label required">Bill Date</label>
              <input 
                type="date" 
                name="billDate" 
                className="erp-input" 
                value={formData.billDate || ''} 
                onChange={(e) => setFormData({...formData, billDate: e.target.value})}
                disabled={!isEditing}
              />
              <label className="erp-form-label required">Booking ID</label>
              <input 
                type="text" 
                name="bookingId" 
                className="erp-input" 
                value={formData.bookingId || ''} 
                readOnly 
                disabled={true}
              />
              <label className="erp-form-label">Sub Bill No</label>
              <input 
                type="text" 
                name="subBillNo" 
                className="erp-input" 
                value={formData.subBillNo || ''} 
                onChange={(e) => setFormData({...formData, subBillNo: e.target.value})}
                disabled={!isEditing}
              />
              <label className="erp-form-label">Status</label>
              <input 
                type="text" 
                className={`erp-input status-${(formData.status || 'DRAFT').toLowerCase()}`} 
                value={formData.status || 'DRAFT'} 
                readOnly 
                disabled={true}
                style={{ fontWeight: 'bold' }}
              />
            </div>
            
            {/* Row 2: Customer Name, Phone Number, Station Boy Name, From Station, To Station (5 fields) */}
            <div className="erp-form-row-compact-5">
              <label className="erp-form-label required">Customer Name</label>
              <input 
                type="text" 
                name="customerName" 
                className="erp-input" 
                value={formData.customerName || ''} 
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                disabled={!isEditing}
                readOnly={billingMode === 'generate'}
                tabIndex={billingMode === 'generate' ? -1 : 0}
                placeholder="Enter customer name"
              />
              <label className="erp-form-label required">Phone Number</label>
              <input 
                type="text" 
                name="phoneNumber" 
                className="erp-input" 
                value={formData.phoneNumber || ''} 
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                disabled={!isEditing}
                readOnly={billingMode === 'generate'}
                tabIndex={billingMode === 'generate' ? -1 : 1}
                placeholder="Enter phone number"
              />
              <label className="erp-form-label">Station Boy Name</label>
              <input 
                type="text" 
                name="stationBoy" 
                className="erp-input" 
                value={formData.stationBoy || ''}
                onChange={(e) => setFormData({...formData, stationBoy: e.target.value})}
                disabled={!isEditing}
                tabIndex={0}
                placeholder="Enter station boy name"
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'stationBoy')}
              />
              <label className="erp-form-label required">From Station</label>
              <input 
                type="text" 
                name="fromStation" 
                className="erp-input" 
                value={formData.fromStation || ''}
                onChange={(e) => setFormData({...formData, fromStation: e.target.value})}
                disabled={!isEditing}
                readOnly={billingMode === 'generate'}
                tabIndex={billingMode === 'generate' ? -1 : 3}
                placeholder="Enter from station"
              />
              <label className="erp-form-label required">To Station</label>
              <input 
                type="text" 
                name="toStation" 
                className="erp-input" 
                value={formData.toStation || ''}
                onChange={(e) => setFormData({...formData, toStation: e.target.value})}
                disabled={!isEditing}
                readOnly={billingMode === 'generate'}
                tabIndex={billingMode === 'generate' ? -1 : 4}
                placeholder="Enter to station"
              />
            </div>
            
            {/* Row 3: Journey Date, Train Number, Reservation Class, Ticket Type, PNR Number (5 fields) */}
            <div className="erp-form-row-compact-5">
              <label className="erp-form-label required">Journey Date</label>
              <input 
                type="date" 
                name="journeyDate" 
                className="erp-input" 
                value={formData.journeyDate || ''}
                onChange={(e) => setFormData({...formData, journeyDate: e.target.value})}
                disabled={!isEditing}
                readOnly={billingMode === 'generate'}
                tabIndex={billingMode === 'generate' ? -1 : 5}
              />
              <label className="erp-form-label required">Train Number</label>
              <input 
                type="text" 
                name="trainNumber" 
                className="erp-input" 
                value={formData.trainNumber || ''} 
                onChange={(e) => setFormData({...formData, trainNumber: e.target.value})}
                disabled={!isEditing}
                tabIndex={1}
                placeholder="Enter train number"
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'trainNumber')}
              />
              <label className="erp-form-label required">Reservation Class</label>
              <select 
                name="reservationClass" 
                className="erp-input" 
                value={formData.reservationClass || '3A'} 
                onChange={(e) => setFormData({...formData, reservationClass: e.target.value})}
                disabled={!isEditing || billingMode === 'generate'}
                tabIndex={billingMode === 'generate' ? -1 : 6}
              >
                <option value="SL">SL</option>
                <option value="3A">3A</option>
                <option value="2A">2A</option>
                <option value="1A">1A</option>
                <option value="CC">CC</option>
                <option value="EC">EC</option>
              </select>
              <label className="erp-form-label required">Ticket Type</label>
              <select 
                name="ticketType" 
                className="erp-input" 
                value={formData.ticketType || 'NORMAL'} 
                onChange={(e) => setFormData({...formData, ticketType: e.target.value})}
                disabled={!isEditing || billingMode === 'generate'}
                tabIndex={billingMode === 'generate' ? -1 : 7}
              >
                <option value="NORMAL">NORMAL</option>
                <option value="TATKAL">TATKAL</option>
                <option value="PREMIUM_TATKAL">PREMIUM TATKAL</option>
              </select>
              <label className="erp-form-label required">PNR Number(s)</label>
              <input 
                type="text" 
                name="pnrNumbers" 
                className="erp-input" 
                value={formData.pnrNumbers || ''} 
                onChange={(e) => setFormData({...formData, pnrNumbers: e.target.value})}
                disabled={!isEditing}
                tabIndex={2}
                placeholder="Enter PNR numbers separated by commas"
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'pnrNumbers')}
              />
            </div>
            
            {/* Row 4: Seat(s) Alloted, Railway Fare, Service Charges, Platform Fees, Station Boy Incentive (5 fields) */}
            <div className="erp-form-row-compact-5">
              <label className="erp-form-label">Seat(s) Alloted</label>
              <input 
                type="text" 
                name="seatsAlloted" 
                className="erp-input" 
                value={formData.seatsAlloted || ''}
                onChange={(e) => setFormData({...formData, seatsAlloted: e.target.value})}
                disabled={!isEditing}
                tabIndex={3}
                placeholder="Enter seats alloted"
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'seatsAlloted')}
              />
              <label className="erp-form-label">Railway Fare</label>
              <input 
                type="number" 
                name="railwayFare" 
                className="erp-input" 
                value={formData.railwayFare || ''} 
                onChange={(e) => setFormData({...formData, railwayFare: e.target.value})}
                disabled={!isEditing}
                tabIndex={4}
                placeholder="Enter railway fare"
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'railwayFare')}
              />
              <label className="erp-form-label">Service Charges</label>
              <input 
                type="number" 
                name="serviceCharges" 
                className="erp-input" 
                value={formData.serviceCharges || ''} 
                onChange={(e) => setFormData({...formData, serviceCharges: e.target.value})}
                disabled={!isEditing}
                tabIndex={5}
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'serviceCharges')}
              />
              <label className="erp-form-label">Platform Fees</label>
              <input 
                type="number" 
                name="platformFees" 
                className="erp-input" 
                value={formData.platformFees || ''} 
                onChange={(e) => setFormData({...formData, platformFees: e.target.value})}
                disabled={!isEditing}
                tabIndex={6}
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'platformFees')}
              />
              <label className="erp-form-label">Station Boy Incentive</label>
              <input 
                type="number" 
                name="stationBoyIncentive" 
                className="erp-input" 
                value={formData.stationBoyIncentive || ''} 
                onChange={(e) => setFormData({...formData, stationBoyIncentive: e.target.value})}
                disabled={!isEditing}
                tabIndex={7}
                placeholder="Enter station boy incentive"
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'stationBoyIncentive')}
              />
            </div>
            
            {/* Row 5: Misc Charges, Delivery Charges, Cancellation Charges, GST, Surcharge (5 fields) */}
            <div className="erp-form-row-compact-5">
              <label className="erp-form-label">Misc. Charges</label>
              <input 
                type="number" 
                name="miscCharges" 
                className="erp-input" 
                value={formData.miscCharges || ''} 
                onChange={(e) => setFormData({...formData, miscCharges: e.target.value})}
                disabled={!isEditing}
                tabIndex={8}
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'miscCharges')}
              />
              <label className="erp-form-label">Delivery Charges</label>
              <input 
                type="number" 
                name="deliveryCharges" 
                className="erp-input" 
                value={formData.deliveryCharges || ''} 
                onChange={(e) => setFormData({...formData, deliveryCharges: e.target.value})}
                disabled={!isEditing}
                tabIndex={9}
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'deliveryCharges')}
              />
              <label className="erp-form-label">Cancellation Charges</label>
              <input 
                type="number" 
                name="cancellationCharges" 
                className="erp-input" 
                value={formData.cancellationCharges || ''} 
                onChange={(e) => setFormData({...formData, cancellationCharges: e.target.value})}
                disabled={!isEditing}
                tabIndex={10}
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'cancellationCharges')}
              />
              <label className="erp-form-label">GST</label>
              <input 
                type="number" 
                name="gst" 
                className="erp-input" 
                value={formData.gst || ''} 
                onChange={(e) => setFormData({...formData, gst: e.target.value})}
                disabled={!isEditing}
                tabIndex={11}
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'gst')}
              />
              <label className="erp-form-label">Surcharge</label>
              <input 
                type="number" 
                name="surcharge" 
                className="erp-input" 
                value={formData.surcharge || ''} 
                onChange={(e) => setFormData({...formData, surcharge: e.target.value})}
                disabled={!isEditing}
                tabIndex={12}
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'surcharge')}
              />
            </div>
            
            {/* Row 6: GST Type, Total Amount, Status, Special Request/Remarks (4 fields) */}
            <div className="erp-form-row-compact-4">
              <label className="erp-form-label">GST Type</label>
              <select 
                name="gstType" 
                className="erp-input" 
                value={formData.gstType || 'EXCLUSIVE'} 
                onChange={(e) => setFormData({...formData, gstType: e.target.value})}
                disabled={!isEditing}
                tabIndex={13}
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'gstType')}
              >
                <option value="EXCLUSIVE">EXCLUSIVE</option>
                <option value="INCLUSIVE">INCLUSIVE</option>
                <option value="C">C</option>
              </select>
              <label className="erp-form-label">Total Amount</label>
              <input 
                type="number" 
                name="totalAmount" 
                className="erp-input" 
                value={formData.totalAmount ? Number(formData.totalAmount).toFixed(2) : '0.00'} 
                readOnly 
                disabled={true}
                tabIndex={-1}
              />
              <label className="erp-form-label">Status</label>
              <select 
                name="status" 
                className="erp-input" 
                value={formData.status || 'DRAFT'} 
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                disabled={!isEditing}
                tabIndex={14}
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'status')}
              >
                <option value="DRAFT">Draft</option>
                <option value="FINAL">Final</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <label className="erp-form-label">Special Request/Remarks</label>
              <input 
                type="text" 
                name="remarks" 
                className="erp-input" 
                value={formData.remarks || ''} 
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                disabled={!isEditing}
                tabIndex={15}
                placeholder="Enter special requests or remarks"
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'remarks')}
              />
            </div>
            
            {/* Row 7: Cancellation Charges & Refund (Only visible when cancelled) */}
            {(formData.status === 'CANCELLED' || selectedBill?.bl_status === 'CANCELLED') && (
              <div className="erp-form-row-compact-4" style={{ background: '#fff3cd', padding: '4px', border: '1px solid #ffeeba', borderRadius: '4px', marginTop: '10px' }}>
                <label className="erp-form-label" style={{ color: '#856404', fontWeight: 'bold' }}>Railway Cancel Charge</label>
                <input 
                  type="number" 
                  className="erp-input" 
                  value={selectedBill?.bl_railway_cancellation_charge || 0} 
                  readOnly 
                  disabled={true}
                />
                <label className="erp-form-label" style={{ color: '#856404', fontWeight: 'bold' }}>Agent Cancel Charge</label>
                <input 
                  type="number" 
                  className="erp-input" 
                  value={selectedBill?.bl_agent_cancellation_charge || 0} 
                  readOnly 
                  disabled={true}
                />
                <label className="erp-form-label" style={{ color: '#d32f2f', fontWeight: 'bold' }}>Total Cancel Charge</label>
                <input 
                  type="number" 
                  className="erp-input" 
                  value={selectedBill?.total_cancel_charges || 0} 
                  readOnly 
                  disabled={true}
                  style={{ color: '#d32f2f', fontWeight: 'bold' }}
                />
                <label className="erp-form-label" style={{ color: '#2e7d32', fontWeight: 'bold' }}>Refund Amount</label>
                <input 
                  type="number" 
                  className="erp-input" 
                  value={selectedBill?.refund_amount || 0} 
                  readOnly 
                  disabled={true}
                  style={{ color: '#2e7d32', fontWeight: 'bold' }}
                />
              </div>
            )}
            
            {/* Passenger List - Expandable Section */}
            <div className="layout-grid-container">
              <div className="erp-expandable-section">
                <div className="erp-section-header" onClick={() => setIsPassengerSectionOpen(!isPassengerSectionOpen)}>
                  <h4>Passenger List</h4>
                  <span className="erp-toggle-icon">{isPassengerSectionOpen ? '−' : '+'}</span>
                </div>
                {isPassengerSectionOpen && (
                  <div className="erp-section-content">
                    <div className="erp-grid-container" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', margin: '5px 0' }}>
                      <table className="erp-table" style={{ fontSize: '11px' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '30px' }}>Sr</th>
                            <th style={{ width: '120px' }}>Name</th>
                            <th style={{ width: '80px' }}>Age</th>
                            <th style={{ width: '80px' }}>Gender</th>
                            <th style={{ width: '100px' }}>Berth</th>
                            <th style={{ width: '100px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.passengerList && formData.passengerList.length > 0 ? (
                            formData.passengerList.map((passenger, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{passenger.name || ''}</td>
                                <td>{passenger.age || ''}</td>
                                <td>{passenger.gender || ''}</td>
                                <td>{passenger.berth || ''}</td>
                                <td>
                                  <button 
                                    className="erp-button" 
                                    style={{ padding: '2px 6px', fontSize: '10px' }}
                                    onClick={() => {
                                      if (isEditing) {
                                        const updatedPassengers = [...formData.passengerList];
                                        updatedPassengers.splice(index, 1);
                                        setFormData({
                                          ...formData,
                                          passengerList: updatedPassengers
                                        });
                                      }
                                    }}
                                    disabled={!isEditing}
                                  >
                                    Del
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center' }}>No passengers added</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  
                  {isEditing && (
                    <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                      <input 
                        type="text" 
                        name="newPassengerName" 
                        className="erp-input" 
                        value={formData.newPassengerName || ''} 
                        onChange={(e) => setFormData({...formData, newPassengerName: e.target.value})}
                        placeholder="Name"
                        style={{ flex: 1, padding: '2px', fontSize: '11px' }}
                      />
                      <input 
                        type="number" 
                        name="newPassengerAge" 
                        className="erp-input" 
                        value={formData.newPassengerAge || ''} 
                        onChange={(e) => setFormData({...formData, newPassengerAge: e.target.value})}
                        placeholder="Age"
                        style={{ flex: 1, padding: '2px', fontSize: '11px' }}
                      />
                      <select 
                        name="newPassengerGender" 
                        className="erp-input" 
                        value={formData.newPassengerGender || ''} 
                        onChange={(e) => setFormData({...formData, newPassengerGender: e.target.value})}
                        style={{ flex: 1, padding: '2px', fontSize: '11px' }}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <input 
                        type="text" 
                        name="newPassengerBerth" 
                        className="erp-input" 
                        value={formData.newPassengerBerth || ''} 
                        onChange={(e) => setFormData({...formData, newPassengerBerth: e.target.value})}
                        placeholder="Berth"
                        style={{ flex: 1, padding: '2px', fontSize: '11px' }}
                      />
                      <button 
                        className="erp-button" 
                        style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}
                        onClick={() => {
                          if (formData.newPassengerName) {
                            const newPassenger = {
                              name: formData.newPassengerName,
                              age: formData.newPassengerAge,
                              gender: formData.newPassengerGender,
                              berth: formData.newPassengerBerth
                            };
                            
                            setFormData({
                              ...formData,
                              passengerList: [...(formData.passengerList || []), newPassenger],
                              newPassengerName: '',
                              newPassengerAge: '',
                              newPassengerGender: '',
                              newPassengerBerth: ''
                            });
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
            
            {/* Audit Section */}
            <div className="erp-audit-section">
              <div className="erp-audit-row">
                <label className="erp-audit-label">Entered On</label>
                <input type="text" className="erp-audit-input" value={auditData.enteredOn || ''} readOnly />
                <label className="erp-audit-label">Entered By</label>
                <input type="text" className="erp-audit-input" value={auditData.enteredBy || ''} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Modified On</label>
                <input type="text" className="erp-audit-input" value={auditData.modifiedOn || ''} readOnly />
                <label className="erp-audit-label">Modified By</label>
                <input type="text" className="erp-audit-input" value={auditData.modifiedBy || ''} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Closed On</label>
                <input type="text" className="erp-audit-input" value={auditData.closedOn || ''} readOnly />
                <label className="erp-audit-label">Closed By</label>
                <input type="text" className="erp-audit-input" value={auditData.closedBy || ''} readOnly />
              </div>
            </div>
          </div>

          {/* Data Grid - Scrollable */}
          <div className="layout-grid-section" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
            <div className="erp-panel-header">
              Billing Records
              {isFetching && <span style={{ marginLeft: '10px', fontSize: '10px', color: '#adb5bd', fontWeight: 'normal' }}>fetching…</span>}
            </div>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : (
              /* Table fills all space; footer is position:fixed so it always shows */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--erp-border)', background: '#fff', minHeight: 0 }}>
                {/* Scrollable table — paddingBottom reserves space for the two fixed footer bars */}
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', backgroundColor: '#fff', paddingBottom: '58px' }}>
                  <table className="erp-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--erp-bg-panel)' }}>
                      <tr>
                        <th style={{ width: '30px' }}></th>
                        <th style={{ width: '100px' }}>Bill ID</th>
                        <th style={{ width: '100px' }}>Bill Date</th>
                        <th style={{ width: '100px' }}>Booking ID</th>
                        <th style={{ width: '100px' }}>Sub bill number</th>
                        <th style={{ width: '150px' }}>Customer Name</th>
                        <th style={{ width: '120px' }}>Phone number</th>
                        <th style={{ width: '120px' }}>Station boy name</th>
                        <th style={{ width: '120px' }}>From station</th>
                        <th style={{ width: '120px' }}>To station</th>
                        <th style={{ width: '100px' }}>Journey date</th>
                        <th style={{ width: '100px' }}>Train Number</th>
                        <th style={{ width: '120px' }}>Reservation Class</th>
                        <th style={{ width: '100px' }}>Ticket Type</th>
                        <th style={{ width: '150px' }}>PNR Number(s)</th>
                        <th style={{ width: '100px' }}>Railway Fare</th>
                        <th style={{ width: '100px' }}>Service Chg</th>
                        <th style={{ width: '100px' }}>SB Inc.</th>
                        <th style={{ width: '120px' }}>Status</th>
                        <th style={{ width: '120px' }}>Total amount</th>
                        <th style={{ width: '120px' }}>Passenger Count</th>
                        <th style={{ width: '150px' }}>Special Request/Remarks</th>
                      </tr>
                      {/* Inline Filter Row */}
                      <tr className="inline-filter-row" style={{ position: 'sticky', top: '24px', zIndex: 10, backgroundColor: '#f0f0f0' }}>
                        <td></td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.bl_bill_no || ''}
                            onChange={(e) => handleInlineFilterChange('bl_bill_no', e.target.value)}
                            placeholder="Filter Bill ID..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="inline-filter-input"
                            value={inlineFilters.bl_billing_date || ''}
                            onChange={(e) => handleInlineFilterChange('bl_billing_date', e.target.value)}
                            placeholder="Filter Date..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.bl_booking_id || ''}
                            onChange={(e) => handleInlineFilterChange('bl_booking_id', e.target.value)}
                            placeholder="Filter Booking ID..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.bl_sub_bill_no || ''}
                            onChange={(e) => handleInlineFilterChange('bl_sub_bill_no', e.target.value)}
                            placeholder="Filter Sub Bill No..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.bl_customer_name || ''}
                            onChange={(e) => handleInlineFilterChange('bl_customer_name', e.target.value)}
                            placeholder="Filter Name..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.bl_customer_phone || ''}
                            onChange={(e) => handleInlineFilterChange('bl_customer_phone', e.target.value)}
                            placeholder="Filter Phone..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.bl_station_boy || ''}
                            onChange={(e) => handleInlineFilterChange('bl_station_boy', e.target.value)}
                            placeholder="Filter Station Boy..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.bl_from_station || ''}
                            onChange={(e) => handleInlineFilterChange('bl_from_station', e.target.value)}
                            placeholder="Filter From Station..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.bl_to_station || ''}
                            onChange={(e) => handleInlineFilterChange('bl_to_station', e.target.value)}
                            placeholder="Filter To Station..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="inline-filter-input"
                            value={inlineFilters.bl_journey_date || ''}
                            onChange={(e) => handleInlineFilterChange('bl_journey_date', e.target.value)}
                            placeholder="Filter Journey Date..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.bl_train_no || ''}
                            onChange={(e) => handleInlineFilterChange('bl_train_no', e.target.value)}
                            placeholder="Filter Train Number..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <select
                            className="inline-filter-input"
                            value={inlineFilters.bl_class || ''}
                            onChange={(e) => handleInlineFilterChange('bl_class', e.target.value)}
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          >
                            <option value="">All</option>
                            <option value="SL">SL</option>
                            <option value="3A">3A</option>
                            <option value="2A">2A</option>
                            <option value="1A">1A</option>
                            <option value="CC">CC</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="inline-filter-input"
                            value={inlineFilters.bl_ticket_type || ''}
                            onChange={(e) => handleInlineFilterChange('bl_ticket_type', e.target.value)}
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          >
                            <option value="">All</option>
                            <option value="NORMAL">NORMAL</option>
                            <option value="TATKAL">TATKAL</option>
                            <option value="PREMIUM_TATKAL">PREMIUM_TATKAL</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.bl_pnr || ''}
                            onChange={(e) => handleInlineFilterChange('bl_pnr', e.target.value)}
                            placeholder="Filter PNR Numbers..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <select
                            className="inline-filter-input"
                            value={inlineFilters.bl_status || ''}
                            onChange={(e) => handleInlineFilterChange('bl_status', e.target.value)}
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          >
                            <option value="">All</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="FINAL">FINAL</option>
                            <option value="PAID">PAID</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="inline-filter-input"
                            value={inlineFilters.bl_total_amount || ''}
                            onChange={(e) => handleInlineFilterChange('bl_total_amount', e.target.value)}
                            placeholder="Filter Amount..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.passengerCount || ''}
                            onChange={(e) => handleInlineFilterChange('passengerCount', e.target.value)}
                            placeholder="Filter Passengers..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="inline-filter-input"
                            value={inlineFilters.bl_remarks || ''}
                            onChange={(e) => handleInlineFilterChange('bl_remarks', e.target.value)}
                            placeholder="Filter Remarks..."
                            style={{ width: '100%', padding: '2px', fontSize: '12px' }}
                          />
                        </td>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.length === 0 ? (
                        <tr><td colSpan={19} style={{ textAlign: 'center', padding: '20px' }}>No records found</td></tr>
                      ) : (
                        bills.map((bill, idx) => {
                          const isSelected = selectedBill && selectedBill.id === bill.id;
                          return (
                            <tr 
                              key={bill.id || idx}
                              className={isSelected ? 'selected' : ''}
                              onClick={() => handleRecordSelect(bill)}
                              style={{ cursor: 'pointer' }}
                            >
                              <td>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <input type="checkbox" checked={!!isSelected} onChange={() => {}} />
                                  <button 
                                    className="erp-button small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewBill(bill);
                                      setShowPreview(true);
                                    }}
                                    title="Inline Preview"
                                    style={{ padding: '0 4px', height: '18px', fontSize: '10px' }}
                                  >
                                    👁️
                                  </button>
                                </div>
                              </td>
                              <td>{bill.bl_bill_no || bill.billNo || bill.id || 'N/A'}</td>
                              <td>{bill.billDate || 'N/A'}</td>
                              <td>{bill.bookingId || 'N/A'}</td>
                              <td>{bill.subBillNo || 'N/A'}</td>
                              <td>{bill.customerName || 'N/A'}</td>
                              <td>{bill.phoneNumber || 'N/A'}</td>
                              <td>{bill.stationBoy || 'N/A'}</td>
                              <td>{bill.fromStation || 'N/A'}</td>
                              <td>{bill.toStation || 'N/A'}</td>
                              <td>{bill.journeyDate || 'N/A'}</td>
                              <td>{bill.trainNumber || 'N/A'}</td>
                              <td>{bill.reservationClass || 'N/A'}</td>
                              <td>{bill.ticketType || 'N/A'}</td>
                              <td>{bill.pnrNumbers || 'N/A'}</td>
                              <td style={{ textAlign: 'right' }}>{bill.railwayFare || '0.00'}</td>
                              <td style={{ textAlign: 'right' }}>{bill.serviceCharges || '0.00'}</td>
                              <td style={{ textAlign: 'right' }}>{bill.stationBoyIncentive || '0.00'}</td>
                              <td>
                                <span className={`erp-status-badge status-${(bill.bl_status || bill.status || 'CNF').toLowerCase()}`}>
                                  {bill.bl_status || bill.status || 'CNF'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{bill.totalAmount ? Number(bill.totalAmount).toFixed(2) : '0.00'}</td>
                              <td style={{ textAlign: 'center' }}>{bill.passengerList ? bill.passengerList.length : '0'}</td>
                              <td>{bill.remarks || ''}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {/* ── end scrollable table container ── */}

                {/* ── FIXED FOOTER: always visible at bottom of viewport ── */}
                <div style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 200,
                }}>
                  {/* Totals summary bar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '3px 12px',
                    backgroundColor: '#5a6268',
                    borderTop: '2px solid #495057',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                  }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <span>TOTAL RECORDS: <span style={{ color: '#ffcc00' }}>{aggregates?.count ?? bills.length}</span></span>
                      <span>DISPLAYED: <span style={{ color: '#ffcc00' }}>{bills.length}</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <span>FARE: <span style={{ color: '#ffcc00' }}>₹{Number(aggregates?.totalFare || 0).toLocaleString()}</span></span>
                      <span>SRV: <span style={{ color: '#ffcc00' }}>₹{Number(aggregates?.totalServiceCharges || 0).toLocaleString()}</span></span>
                      <span>SBI: <span style={{ color: '#ffcc00' }}>₹{Number(aggregates?.totalSBIncentive || 0).toLocaleString()}</span></span>
                      <span style={{ marginLeft: '10px' }}>NET TOTAL:</span>
                      <div style={{
                        backgroundColor: '#343a40',
                        padding: '2px 10px',
                        border: '1px inset #212529',
                        minWidth: '120px',
                        textAlign: 'right',
                        color: '#00ff00',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                      }}>
                        ₹{Number(aggregates?.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Pagination bar */}
                  <PaginationControls
                    pagination={pagination}
                    onPageChange={setPage}
                    limit={limit}
                    onLimitChange={changeLimit}
                    recordCount={bills.length}
                  />
                </div>
                {/* ── end fixed footer ── */}

              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Filters */}
        <div className="layout-right-sidebar" style={{ overflowY: 'auto', height: '100%' }}>
          <div className="layout-filters-content">
             <div className="section-title">FILTERS</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                   <label style={{ fontSize: '11px', textAlign: 'right' }}>Bill ID:</label>
                   <input type="text" className="erp-input inline-filter-input" value={inlineFilters['bl_bill_no']||''} onChange={(e)=>handleInlineFilterChange('bl_bill_no', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                   <label style={{ fontSize: '11px', textAlign: 'right' }}>Date:</label>
                   <input type="date" className="erp-input inline-filter-input" value={inlineFilters['bl_billing_date']||''} onChange={(e)=>handleInlineFilterChange('bl_billing_date', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                   <label style={{ fontSize: '11px', textAlign: 'right' }}>Customer:</label>
                   <input type="text" className="erp-input inline-filter-input" value={inlineFilters['bl_customer_name']||''} onChange={(e)=>handleInlineFilterChange('bl_customer_name', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                   <label style={{ fontSize: '11px', textAlign: 'right' }}>Phone:</label>
                   <input type="text" className="erp-input inline-filter-input" value={inlineFilters['bl_customer_phone']||''} onChange={(e)=>handleInlineFilterChange('bl_customer_phone', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                   <label style={{ fontSize: '11px', textAlign: 'right' }}>From:</label>
                   <input type="text" className="erp-input inline-filter-input" value={inlineFilters['bl_from_station']||''} onChange={(e)=>handleInlineFilterChange('bl_from_station', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                   <label style={{ fontSize: '11px', textAlign: 'right' }}>To:</label>
                   <input type="text" className="erp-input inline-filter-input" value={inlineFilters['bl_to_station']||''} onChange={(e)=>handleInlineFilterChange('bl_to_station', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                   <label style={{ fontSize: '11px', textAlign: 'right' }}>Status:</label>
                   <input type="text" className="erp-input inline-filter-input" value={inlineFilters['bl_status']||''} onChange={(e)=>handleInlineFilterChange('bl_status', e.target.value)} />
                </div>
                
                <div className="section-subtitle" style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '4px' }}>DATE RANGE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                   <label style={{ fontSize: '11px', textAlign: 'right' }}>Start Date:</label>
                   <input type="date" className="erp-input inline-filter-input" value={inlineFilters['startDate']||''} onChange={(e)=>handleInlineFilterChange('startDate', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                   <label style={{ fontSize: '11px', textAlign: 'right' }}>End Date:</label>
                   <input type="date" className="erp-input inline-filter-input" value={inlineFilters['endDate']||''} onChange={(e)=>handleInlineFilterChange('endDate', e.target.value)} />
                </div>

                <div className="section-subtitle" style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '4px' }}>AMOUNT RANGE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                   <label style={{ fontSize: '11px', textAlign: 'right' }}>Min Amt:</label>
                   <input type="number" step="0.01" className="erp-input inline-filter-input" placeholder="0.00" value={inlineFilters['minAmount']||''} onChange={(e)=>handleInlineFilterChange('minAmount', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                   <label style={{ fontSize: '11px', textAlign: 'right' }}>Max Amt:</label>
                   <input type="number" step="0.01" className="erp-input inline-filter-input" placeholder="0.00" value={inlineFilters['maxAmount']||''} onChange={(e)=>handleInlineFilterChange('maxAmount', e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', gap: '4px' }}>
                    <button onClick={clearFilters} className="erp-button small">Clear (ESC)</button>
                </div>
             </div>
             <div style={{ flex: 1 }}></div>
             <div style={{ padding: '4px', borderTop: '1px solid #ccc' }}>
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  className="filter-input" 
                  style={{ width: '100%' }} 
                />
             </div>
          </div>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      {showSaveModal && (
        <SaveConfirmationModal 
          isOpen={true}
          onConfirm={handleSaveConfirmed}
          onCancel={handleSaveCancel}
          message="Save Bill?"
        />
      )}

      {/* Cancellation Modal - Fully Accessible */}
      {showCancelModal && selectedBill && (
        <div 
          className="erp-modal-overlay" 
          onClick={(e) => e.target === e.currentTarget && setShowCancelModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowCancelModal(false)}
        >
          <div 
            className="erp-modal" 
            style={{ maxWidth: '550px' }} 
            ref={cancelModalRef} 
            onKeyDown={handleCancelModalKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
          >
            <div className="erp-modal-header">
              <h3 id="cancel-modal-title">🚫 Cancel Bill - {selectedBill.billNo || selectedBill.id}</h3>
              <button 
                className="erp-modal-close" 
                onClick={() => setShowCancelModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="erp-modal-body">
              {cancelError && (
                <div className="erp-error-message" style={{ margin: '0 0 15px 0', padding: '10px', background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a', borderRadius: '4px' }}>
                  {cancelError}
                </div>
              )}
              {/* Summary Section (Read-only) */}
              <div className="erp-container" style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa' }}>
                <div className="erp-form-row-compact-2">
                  <div>
                    <label className="erp-form-label">Booking ID</label>
                    <div className="erp-value-text">{selectedBill.bookingId}</div>
                  </div>
                  <div>
                    <label className="erp-form-label">Customer</label>
                    <div className="erp-value-text">{selectedBill.customerName}</div>
                  </div>
                </div>
                <div className="erp-form-row-compact-2" style={{ marginTop: '8px' }}>
                  <div>
                    <label className="erp-form-label">Total Amount</label>
                    <div className="erp-value-text">₹{parseFloat(selectedBill.totalAmount).toFixed(2)}</div>
                  </div>
                  <div>
                    <label className="erp-form-label">Amount Paid</label>
                    <div className="erp-value-text">₹{parseFloat(selectedBill.amountReceived || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Editable Charges Section */}
              <div className="erp-form-section">
                <div className="erp-form-group" style={{ marginBottom: '12px' }}>
                  <label className="erp-form-label required">Cancellation date</label>
                  <input
                    type="date"
                    className="erp-input"
                    value={cancelFormData.cancellationDate}
                    onChange={(e) => setCancelFormData({ ...cancelFormData, cancellationDate: e.target.value })}
                    disabled={isCancelling}
                    required
                  />
                </div>
                <div className="erp-form-group" style={{ marginBottom: '12px' }}>
                  <label className="erp-form-label required">Approver user id</label>
                  <input
                    type="text"
                    className="erp-input"
                    value={cancelFormData.approverUserId}
                    onChange={(e) => setCancelFormData({ ...cancelFormData, approverUserId: e.target.value })}
                    disabled={isCancelling}
                    placeholder="e.g. ADM001"
                    required
                  />
                </div>
                <div className="erp-form-group" style={{ marginBottom: '12px' }}>
                  <label className="erp-form-label required">Approver name</label>
                  <input
                    type="text"
                    className="erp-input"
                    value={cancelFormData.approverName}
                    onChange={(e) => setCancelFormData({ ...cancelFormData, approverName: e.target.value })}
                    disabled={isCancelling}
                    placeholder="Authorizing manager / accounts lead"
                    required
                  />
                </div>
                <div className="erp-form-group" style={{ marginBottom: '12px' }}>
                  <label className="erp-form-label required">Railway Cancellation Charge (₹)</label>
                  <input
                    type="number"
                    name="railwayCharges"
                    className="erp-input"
                    value={cancelFormData.railwayCharges}
                    onChange={(e) => setCancelFormData({...cancelFormData, railwayCharges: e.target.value})}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={isCancelling}
                    autoFocus
                    required
                  />
                </div>
                <div className="erp-form-group" style={{ marginBottom: '12px' }}>
                  <label className="erp-form-label required">Agent Cancellation Charge (₹)</label>
                  <input
                    type="number"
                    name="agentCharges"
                    className="erp-input"
                    value={cancelFormData.agentCharges}
                    onChange={(e) => setCancelFormData({...cancelFormData, agentCharges: e.target.value})}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={isCancelling}
                    required
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label required">Cancellation Reason</label>
                  <textarea
                    className="erp-input"
                    value={cancelFormData.reason}
                    onChange={(e) => setCancelFormData({...cancelFormData, reason: e.target.value})}
                    placeholder="Provide reason for cancellation..."
                    rows="3"
                    disabled={isCancelling}
                    required
                  />
                </div>
              </div>

              {/* Auto Calculations Section */}
              <div style={{ marginTop: '15px', padding: '12px', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Total Charges:</span>
                  <span style={{ fontSize: '14px', color: '#d32f2f', fontWeight: 'bold' }}>
                    ₹{((parseFloat(cancelFormData.railwayCharges) || 0) + (parseFloat(cancelFormData.agentCharges) || 0)).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Refundable Amount:</span>
                  <span style={{ fontSize: '16px', color: '#2e7d32', fontWeight: 'bold' }}>
                    ₹{Math.max(0, parseFloat(selectedBill.totalAmount) - ((parseFloat(cancelFormData.railwayCharges) || 0) + (parseFloat(cancelFormData.agentCharges) || 0))).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="erp-modal-footer">
              <button 
                className="erp-button erp-button-secondary" 
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                title="Cancel and close (Esc)"
              >
                Cancel (Esc)
              </button>
              <button 
                className="erp-button erp-button-primary" 
                onClick={handleCancelSave}
                style={{ marginLeft: '10px' }}
                disabled={isCancelling}
                title="Save cancellation (F10 or Enter)"
              >
                {isCancelling ? 'Processing...' : 'Confirm Cancellation (F10)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Preview Modal */}
      {showPreview && previewBill && (
        <div className="erp-modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="erp-modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3>📋 Bill Preview: {previewBill.billNo}</h3>
              <button className="erp-modal-close" onClick={() => setShowPreview(false)}>×</button>
            </div>
            <div className="erp-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="erp-form-section">
                <div className="erp-form-row-compact-3">
                  <div><label className="erp-form-label">Customer</label><div className="erp-value-text">{previewBill.customerName}</div></div>
                  <div><label className="erp-form-label">Phone</label><div className="erp-value-text">{previewBill.phoneNumber}</div></div>
                  <div><label className="erp-form-label">Status</label><span className={`erp-status-badge status-${(previewBill.status || 'DRAFT').toLowerCase()}`}>{previewBill.status}</span></div>
                </div>
                <div className="erp-form-row-compact-3" style={{ marginTop: '10px' }}>
                  <div><label className="erp-form-label">From</label><div className="erp-value-text">{previewBill.fromStation}</div></div>
                  <div><label className="erp-form-label">To</label><div className="erp-value-text">{previewBill.toStation}</div></div>
                  <div><label className="erp-form-label">Journey Date</label><div className="erp-value-text">{previewBill.journeyDate}</div></div>
                </div>
                <div className="erp-form-row-compact-3" style={{ marginTop: '10px' }}>
                  <div><label className="erp-form-label">PNR</label><div className="erp-value-text">{previewBill.pnrNumbers}</div></div>
                  <div><label className="erp-form-label">Total Amount</label><div className="erp-value-text" style={{ fontSize: '16px', fontWeight: 'bold', color: '#005fcc' }}>₹{Number(previewBill.totalAmount).toFixed(2)}</div></div>
                  <div><label className="erp-form-label">Remarks</label><div className="erp-value-text">{previewBill.remarks || '-'}</div></div>
                </div>
              </div>
            </div>
            <div className="erp-modal-footer">
              <button className="erp-button erp-button-secondary" onClick={() => setShowPreview(false)}>Close</button>
              <button className="erp-button erp-button-primary" onClick={() => { setShowPreview(false); handlePrintBill(previewBill); }}>Print PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
