import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingAPI, paymentAPI, billingAPI } from '../services/api';
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
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]); // Add missing filteredBills state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'ledger'
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  
  // Editing state (MOVED TO TOP to avoid TDZ)
  const [isEditing, setIsEditing] = useState(false);
  const [isPassengerSectionOpen, setIsPassengerSectionOpen] = useState(false);
  
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
    'totalAmount',
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

  // Inline filters
  const [inlineFilters, setInlineFilters] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 100;

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
      setCustomerLookup([]);
      setShowCustomerDropdown(false);
    }
  };
  
  // Handle customer selection from dropdown
  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name
    }));
    setShowCustomerDropdown(false);
    fetchCustomerDetails(customer.id); // Fetch detailed customer info
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
      
      // Calculate subtotal (base fare + all charges)
      const subtotal = railwayFare + serviceCharges + platformFees + stationBoyIncentive + miscCharges + deliveryCharges + cancellationCharges;
      
      // Calculate GST
      const gstRate = parseFloat(formData.gst) || 0;
      const surcharge = parseFloat(formData.surcharge) || 0;
      
      // Calculate tax based on GST type
      let taxAmount = 0;
      let grandTotal = 0;
      
      if (formData.gstType === 'EXCLUSIVE') {
        taxAmount = (subtotal * gstRate) / 100;
        grandTotal = subtotal + taxAmount + surcharge;
      } else if (formData.gstType === 'INCLUSIVE') {
        // If GST is inclusive, the GST is already included in the subtotal
        taxAmount = (subtotal * gstRate) / (100 + gstRate);
        grandTotal = subtotal + surcharge;
      } else { // C type
        taxAmount = (subtotal * gstRate) / 100;
        grandTotal = subtotal + taxAmount + surcharge;
      }
      
      // Calculate balance due (assuming amount received is tracked separately)
      const amountReceived = parseFloat(formData.amountReceived) || 0;
      const balanceDue = grandTotal - amountReceived;
      
      // Update form data with calculated values
      setFormData(prev => ({
        ...prev,
        totalAmount: Math.round(grandTotal * 100) / 100 // Round to 2 decimal places
      }));
    }
  }, [formData.railwayFare, formData.serviceCharges, formData.platformFees, formData.stationBoyIncentive, formData.miscCharges, formData.deliveryCharges, formData.cancellationCharges, formData.gst, formData.gstType, formData.surcharge, formData.amountReceived, isEditing]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      let data;
      
      // Check if user is admin or employee
      const isEmployee = user && ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(user.us_roid);
      if (isEmployee) {
        data = await billingAPI.getAllBills();
      } else {
        // For customers, get user-specific bills
        data = await billingAPI.getMyBills();
      }
      
      // Handle the response structure
      const billsData = data?.data?.bills || data?.bills || data || [];
      // Ensure numeric fields are properly converted to numbers and map database field names
      const processedBills = Array.isArray(billsData) ? billsData.map(bill => ({
        ...bill,
        // Map database field names to frontend field names
        id: bill.bl_id || bill.id,
        billNo: bill.bl_bill_no || bill.billNo, // Add bill number mapping
        billDate: bill.bl_billing_date || bill.billDate,
        bookingId: bill.bl_booking_id || bill.bookingId,
        subBillNo: bill.bl_sub_bill_no || bill.subBillNo,
        customerName: bill.bl_customer_name || bill.customerName,
        phoneNumber: bill.bl_customer_phone || bill.phoneNumber,
        stationBoy: bill.bl_station_boy || bill.stationBoy,
        fromStation: bill.bl_from_station || bill.fromStation,
        toStation: bill.bl_to_station || bill.toStation,
        journeyDate: bill.bl_journey_date || bill.journeyDate,
        trainNumber: bill.bl_train_no || bill.trainNumber,
        reservationClass: bill.bl_class || bill.reservationClass,
        ticketType: bill.bl_ticket_type || bill.ticketType || 'NORMAL',
        pnrNumbers: bill.bl_pnr || bill.pnrNumbers,
        // Seat allocation field mapping
        seatsReserved: bill.bl_seats_reserved || bill.seatsReserved || bill.seatsAlloted,
        // Financial fields
        railwayFare: bill.bl_railway_fare ? Number(bill.bl_railway_fare) : (bill.railwayFare ? Number(bill.railwayFare) : 0),
        serviceCharges: bill.bl_service_charge ? Number(bill.bl_service_charge) : (bill.serviceCharges ? Number(bill.serviceCharges) : 0),
        platformFees: bill.bl_platform_fee ? Number(bill.bl_platform_fee) : (bill.platformFees ? Number(bill.platformFees) : 0),
        stationBoyIncentive: bill.bl_sb_incentive ? Number(bill.bl_sb_incentive) : (bill.stationBoyIncentive ? Number(bill.stationBoyIncentive) : 0),
        miscCharges: bill.bl_misc_charges ? Number(bill.bl_misc_charges) : (bill.miscCharges ? Number(bill.miscCharges) : 0),
        deliveryCharges: bill.bl_delivery_charge ? Number(bill.bl_delivery_charge) : (bill.deliveryCharges ? Number(bill.deliveryCharges) : 0),
        cancellationCharges: bill.bl_cancellation_charge ? Number(bill.bl_cancellation_charge) : (bill.cancellationCharges ? Number(bill.cancellationCharges) : 0),
        gst: bill.bl_gst ? Number(bill.bl_gst) : (bill.gst ? Number(bill.gst) : 0),
        surcharge: bill.bl_surcharge ? Number(bill.bl_surcharge) : (bill.surcharge ? Number(bill.surcharge) : 0),
        discount: bill.bl_discount ? Number(bill.bl_discount) : (bill.discount ? Number(bill.discount) : 0),
        gstType: bill.bl_gst_type || bill.gstType || 'EXCLUSIVE',
        totalAmount: bill.bl_total_amount ? Number(bill.bl_total_amount) : (bill.totalAmount ? Number(bill.totalAmount) : 0),
        paidAmount: bill.paidAmount ? Number(bill.paidAmount) : 0,
        // Status and audit fields
        status: bill.status || 'DRAFT',
        remarks: bill.remarks || '',
        createdOn: bill.bl_created_at || bill.createdOn,
        createdBy: bill.bl_created_by || bill.createdBy,
        modifiedOn: bill.modifiedOn || '',
        modifiedBy: bill.modifiedBy || '',
        closedOn: bill.closedOn || '',
        closedBy: bill.closedBy || ''
      })) : [];
      setBills(processedBills);
      setFilteredBills(processedBills);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch bills');
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

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
      // Get available draft bookings for billing
      // In a real implementation, you'd want to:
      // 1. Show a dropdown of available draft bookings
      // 2. Or create a proper workflow for linking bills to bookings
      const bookingId = await getAvailableDraftBookingId();
      
      console.log('Using existing booking ID:', bookingId);

      // Create the bill using the existing booking ID
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

  const handleExportBill = async (billId) => {
    try {
      const blob = await billingAPI.exportBill(billId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill_${billId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError(error.message);
    }
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
    
    // Skip expensive focus management in production
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    try {
      // Check if we're at the last field (remarks)
      if (currentFieldName === 'remarks' && !event.shiftKey && isEditing) {
        setShowSaveModal(true);
        return true;
      }
      
      // Default tab navigation
      return false;
    } catch (error) {
      console.warn('Tab navigation failed:', error.message);
      return false;
    }
  }, [isEditing]);

  // Handle navigation
  const handleNavigation = (direction) => {
    const paginatedData = getPaginatedData();
    if (paginatedData.length === 0) return;
    
    let newIndex = 0;
    if (selectedBill) {
      const currentIndex = paginatedData.findIndex(item => 
        item.id === selectedBill.id
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
  };

  // Pagination
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return bills.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(bills.length / recordsPerPage);
  const paginatedData = getPaginatedData();

  // Check if navigation buttons should be disabled
  const isFirstRecord = selectedBill && paginatedData.length > 0 && 
    paginatedData[0].id === selectedBill.id;
  const isLastRecord = selectedBill && paginatedData.length > 0 && 
    paginatedData[paginatedData.length - 1].id === selectedBill.id;

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
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
      case 'Tab':
        // Handle tab navigation within form
        // Note: Default browser tab behavior will be used
        break;
      case 'Enter':
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
  }, [showForm, isEditing]);

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
            handleDeleteBill(selectedBill.id);
          }
        }} title="Delete">Delete</button>
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
        <button className="erp-button" onClick={() => {
          if (selectedBill) {
            // Print bill functionality
            window.print();
          } else {
            alert('Please select a bill to print');
          }
        }} title="Print" disabled={!selectedBill}>Print</button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="layout-content-wrapper">
        {/* Center Content */}
        <div className="layout-main-column">
          {/* Form Panel - Static */}
          <div className="layout-form-section">
            {/* Row 1: Bill ID, Bill Date, Booking ID, Sub Bill No (4 fields) */}
            <div className="erp-form-row-compact-4">
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
                tabIndex={billingMode === 'generate' ? -1 : undefined}
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
                tabIndex={billingMode === 'generate' ? -1 : undefined}
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
                tabIndex={1}
                placeholder="Enter station boy name"
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
                tabIndex={billingMode === 'generate' ? -1 : undefined}
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
                tabIndex={billingMode === 'generate' ? -1 : undefined}
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
                tabIndex={billingMode === 'generate' ? -1 : undefined}
              />
              <label className="erp-form-label required">Train Number</label>
              <input 
                type="text" 
                name="trainNumber" 
                className="erp-input" 
                value={formData.trainNumber || ''} 
                onChange={(e) => setFormData({...formData, trainNumber: e.target.value})}
                disabled={!isEditing}
                placeholder="Enter train number"
              />
              <label className="erp-form-label required">Reservation Class</label>
              <select 
                name="reservationClass" 
                className="erp-input" 
                value={formData.reservationClass || '3A'} 
                onChange={(e) => setFormData({...formData, reservationClass: e.target.value})}
                disabled={!isEditing || billingMode === 'generate'}
                tabIndex={billingMode === 'generate' ? -1 : undefined}
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
                tabIndex={billingMode === 'generate' ? -1 : undefined}
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
                placeholder="Enter PNR numbers separated by commas"
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
                tabIndex={2}
                placeholder="Enter seats alloted"
              />
              <label className="erp-form-label">Railway Fare</label>
              <input 
                type="number" 
                name="railwayFare" 
                className="erp-input" 
                value={formData.railwayFare || ''} 
                onChange={(e) => setFormData({...formData, railwayFare: e.target.value})}
                disabled={!isEditing}
                tabIndex={3}
                placeholder="Enter railway fare"
              />
              <label className="erp-form-label">Service Charges</label>
              <input 
                type="number" 
                name="serviceCharges" 
                className="erp-input" 
                value={formData.serviceCharges || ''} 
                onChange={(e) => setFormData({...formData, serviceCharges: e.target.value})}
                disabled={!isEditing}
                tabIndex={4}
              />
              <label className="erp-form-label">Platform Fees</label>
              <input 
                type="number" 
                name="platformFees" 
                className="erp-input" 
                value={formData.platformFees || ''} 
                onChange={(e) => setFormData({...formData, platformFees: e.target.value})}
                disabled={!isEditing}
                tabIndex={5}
              />
              <label className="erp-form-label">Station Boy Incentive</label>
              <input 
                type="number" 
                name="stationBoyIncentive" 
                className="erp-input" 
                value={formData.stationBoyIncentive || ''} 
                onChange={(e) => setFormData({...formData, stationBoyIncentive: e.target.value})}
                disabled={!isEditing}
                tabIndex={6}
                placeholder="Enter station boy incentive"
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
                tabIndex={7}
              />
              <label className="erp-form-label">Delivery Charges</label>
              <input 
                type="number" 
                name="deliveryCharges" 
                className="erp-input" 
                value={formData.deliveryCharges || ''} 
                onChange={(e) => setFormData({...formData, deliveryCharges: e.target.value})}
                disabled={!isEditing}
                tabIndex={8}
              />
              <label className="erp-form-label">Cancellation Charges</label>
              <input 
                type="number" 
                name="cancellationCharges" 
                className="erp-input" 
                value={formData.cancellationCharges || ''} 
                onChange={(e) => setFormData({...formData, cancellationCharges: e.target.value})}
                disabled={!isEditing}
                tabIndex={9}
              />
              <label className="erp-form-label">GST</label>
              <input 
                type="number" 
                name="gst" 
                className="erp-input" 
                value={formData.gst || ''} 
                onChange={(e) => setFormData({...formData, gst: e.target.value})}
                disabled={!isEditing}
                tabIndex={10}
              />
              <label className="erp-form-label">Surcharge</label>
              <input 
                type="number" 
                name="surcharge" 
                className="erp-input" 
                value={formData.surcharge || ''} 
                onChange={(e) => setFormData({...formData, surcharge: e.target.value})}
                disabled={!isEditing}
                tabIndex={11}
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
                tabIndex={12}
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
                tabIndex={13}
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
                tabIndex={14}
                placeholder="Enter special requests or remarks"
                onKeyDown={(e) => handleEnhancedTabNavigation(e, 'remarks')}
              />
            </div>
            
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
          <div className="layout-grid-section">
            <div className="erp-panel-header">Billing Records</div>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : (
              <div className="erp-grid-container" style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
                <table className="erp-table">
                  <thead>
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
                      <th style={{ width: '120px' }}>Total amount</th>
                      <th style={{ width: '120px' }}>Passenger Count</th>
                      <th style={{ width: '150px' }}>Special Request/Remarks</th>
                      <th style={{ width: '120px' }}>Entered on,by</th>
                      <th style={{ width: '120px' }}>Modified on,by</th>
                      <th style={{ width: '120px' }}>Closed on, by</th>
                    </tr>
                    {/* Inline Filter Row */}
                    <tr className="inline-filter-row">
                      <td></td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.billId || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, billId: e.target.value})}
                          placeholder="Filter Bill ID..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="inline-filter-input"
                          value={inlineFilters.billDate || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, billDate: e.target.value})}
                          placeholder="Filter Date..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.bookingId || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, bookingId: e.target.value})}
                          placeholder="Filter Booking ID..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.subBillNo || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, subBillNo: e.target.value})}
                          placeholder="Filter Sub Bill No..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.customerName || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, customerName: e.target.value})}
                          placeholder="Filter Name..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.phoneNumber || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, phoneNumber: e.target.value})}
                          placeholder="Filter Phone..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.stationBoy || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, stationBoy: e.target.value})}
                          placeholder="Filter Station Boy..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.fromStation || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, fromStation: e.target.value})}
                          placeholder="Filter From Station..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.toStation || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, toStation: e.target.value})}
                          placeholder="Filter To Station..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="inline-filter-input"
                          value={inlineFilters.journeyDate || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, journeyDate: e.target.value})}
                          placeholder="Filter Journey Date..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.trainNumber || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, trainNumber: e.target.value})}
                          placeholder="Filter Train Number..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <select
                          className="inline-filter-input"
                          value={inlineFilters.reservationClass || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, reservationClass: e.target.value})}
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
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
                          value={inlineFilters.ticketType || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, ticketType: e.target.value})}
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
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
                          value={inlineFilters.pnrNumbers || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, pnrNumbers: e.target.value})}
                          placeholder="Filter PNR Numbers..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="inline-filter-input"
                          value={inlineFilters.totalAmount || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, totalAmount: e.target.value})}
                          placeholder="Filter Amount..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.passengerCount || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, passengerCount: e.target.value})}
                          placeholder="Filter Passengers..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.remarks || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, remarks: e.target.value})}
                          placeholder="Filter Remarks..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.enteredInfo || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, enteredInfo: e.target.value})}
                          placeholder="Filter Entered..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.modifiedInfo || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, modifiedInfo: e.target.value})}
                          placeholder="Filter Modified..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters.closedInfo || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, closedInfo: e.target.value})}
                          placeholder="Filter Closed..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr><td colSpan={21} style={{ textAlign: 'center' }}>No records found</td></tr>
                    ) : (
                      paginatedData.map((bill, idx) => {
                        const isSelected = selectedBill && selectedBill.id === bill.id;
                        const balanceDue = (Number(bill.totalAmount) || 0) - (Number(bill.paidAmount) || 0);
                        return (
                          <tr 
                            key={bill.id || idx}
                            className={isSelected ? 'selected' : ''}
                            onClick={() => handleRecordSelect(bill)}
                          >
                            <td><input type="checkbox" checked={!!isSelected} onChange={() => {}} /></td>
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
                            <td>{bill.totalAmount ? Number(bill.totalAmount).toFixed(2) : '0.00'}</td>
                            <td>{bill.passengerList ? bill.passengerList.length : '0'} passengers</td>
                            <td>{bill.remarks || 'N/A'}</td>
                            <td>{bill.createdOn ? `${new Date(bill.createdOn).toLocaleDateString()} by ${bill.createdBy || 'N/A'}` : 'N/A'}</td>
                            <td>{bill.modifiedOn ? `${new Date(bill.modifiedOn).toLocaleDateString()} by ${bill.modifiedBy || 'N/A'}` : 'N/A'}</td>
                            <td>{bill.closedOn ? `${new Date(bill.closedOn).toLocaleDateString()} by ${bill.closedBy || 'N/A'}` : 'N/A'}</td>
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
        <div className="layout-right-sidebar">
          <div className="layout-header">
            Filter Criteria
            {(bills.length !== getPaginatedData().length) && (
              <span className="erp-filter-count">{getPaginatedData().length}/{bills.length}</span>
            )}
          </div>
          <div className="layout-filters-content">
          
          <div className="erp-filter-section">
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Bill ID</label>
                <input 
                  type="text" 
                  name="billId" 
                  className="erp-filter-input" 
                  value={filters.billId || ''} 
                  onChange={(e) => setFilters({...filters, billId: e.target.value})}
                  placeholder="Search bill ID..."
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Customer ID</label>
                <input 
                  type="text" 
                  name="customerId" 
                  className="erp-filter-input" 
                  value={filters.customerId || ''} 
                  onChange={(e) => setFilters({...filters, customerId: e.target.value})}
                  placeholder="Search customer ID..."
                />
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Customer Name</label>
                <input 
                  type="text" 
                  name="customerName" 
                  className="erp-filter-input" 
                  value={filters.customerName || ''} 
                  onChange={(e) => setFilters({...filters, customerName: e.target.value})}
                  placeholder="Search customer name..."
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">PNR Number</label>
                <input 
                  type="text" 
                  name="pnrNumber" 
                  className="erp-filter-input" 
                  value={filters.pnrNumber || ''} 
                  onChange={(e) => setFilters({...filters, pnrNumber: e.target.value})}
                  placeholder="Search PNR number..."
                />
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Bill Date From</label>
                <input 
                  type="date" 
                  name="billDateFrom" 
                  className="erp-filter-input" 
                  value={filters.billDateFrom || ''} 
                  onChange={(e) => setFilters({...filters, billDateFrom: e.target.value})}
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Bill Date To</label>
                <input 
                  type="date" 
                  name="billDateTo" 
                  className="erp-filter-input" 
                  value={filters.billDateTo || ''} 
                  onChange={(e) => setFilters({...filters, billDateTo: e.target.value})}
                />
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Status</label>
                <select 
                  name="status" 
                  className="erp-filter-select" 
                  value={filters.status || ''} 
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All</option>
                  <option value="DRAFT">Draft</option>
                  <option value="FINAL">Final</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Amount Range From</label>
                <input 
                  type="number" 
                  name="amountFrom" 
                  className="erp-filter-input" 
                  value={filters.amountFrom || ''} 
                  onChange={(e) => setFilters({...filters, amountFrom: e.target.value})}
                  placeholder="Min amount"
                />
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Amount Range To</label>
                <input 
                  type="number" 
                  name="amountTo" 
                  className="erp-filter-input" 
                  value={filters.amountTo || ''} 
                  onChange={(e) => setFilters({...filters, amountTo: e.target.value})}
                  placeholder="Max amount"
                />
              </div>
            </div>
            
            <div className="erp-filter-row">
              <div className="erp-filter-field">
                <label className="erp-filter-label">Reservation Class</label>
                <select 
                  name="reservationClass" 
                  className="erp-filter-select" 
                  value={filters.reservationClass || ''} 
                  onChange={(e) => setFilters({...filters, reservationClass: e.target.value})}
                >
                  <option value="">All</option>
                  <option value="SL">SL</option>
                  <option value="3A">3A</option>
                  <option value="2A">2A</option>
                  <option value="1A">1A</option>
                  <option value="CC">CC</option>
                </select>
              </div>
              
              <div className="erp-filter-field">
                <label className="erp-filter-label">Ticket Type</label>
                <select 
                  name="ticketType" 
                  className="erp-filter-select" 
                  value={filters.ticketType || ''} 
                  onChange={(e) => setFilters({...filters, ticketType: e.target.value})}
                >
                  <option value="">All</option>
                  <option value="NORMAL">Normal</option>
                  <option value="TATKAL">Tatkal</option>
                  <option value="PREMIUM_TATKAL">Premium Tatkal</option>
                </select>
              </div>
            </div>
            
            <div className="erp-checkbox-group">
              <div className="erp-checkbox-item">
                <input
                  type="checkbox"
                  id="balanceDueOnly"
                  name="balanceDueOnly"
                  checked={filters.balanceDueOnly || false}
                  onChange={(e) => setFilters({...filters, balanceDueOnly: e.target.checked})}
                />
                <label htmlFor="balanceDueOnly">Balance Due Only</label>
              </div>
            </div>
          </div>
          
          <div className="erp-filter-actions" style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
            <button 
              className="erp-button erp-filter-btn erp-filter-btn-primary" 
              style={{ flex: 1 }}
              onClick={() => {
                // Apply filters logic here
                console.log('Filters applied:', filters);
                // Here we would typically filter the data based on the selected criteria
                // For now, we'll just log the filters
                alert('Filters applied: ' + JSON.stringify(filters, null, 2));
              }}
              title="Apply filter criteria"
            >
              Apply Filters
            </button>
            <button 
              className="erp-button erp-filter-btn erp-filter-btn-clear" 
              style={{ flex: 1 }}
              onClick={() => {
                setFilters({
                  billId: '',
                  customerId: '',
                  customerName: '',
                  pnrNumber: '',
                  billDateFrom: '',
                  billDateTo: '',
                  status: '',
                  amountFrom: '',
                  amountTo: '',
                  reservationClass: '',
                  ticketType: '',
                  balanceDueOnly: false
                });
                // Reset inline filters
                setInlineFilters({});
                // Reload data
                fetchBills();
              }}
              title="Clear all filters and reload data"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Status Bar - Static */}
      <div className="erp-status-bar">
        <div className="erp-status-item">{isEditing ? 'Editing' : 'Ready'}</div>
        <div className="erp-status-item">
          Records: {bills.length}
        </div>
        <div className="erp-status-item">
          Showing: {paginatedData.length > 0 ? `${((currentPage - 1) * recordsPerPage) + 1}-${Math.min(currentPage * recordsPerPage, bills.length)}` : '0'} of {bills.length}
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
          <span style={{ margin: '0 4px', fontSize: '12px' }}>Page {currentPage}/{totalPages || 1}</span>
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
      {showSaveModal && (
        <SaveConfirmationModal 
          isOpen={true}
          onConfirm={handleSaveConfirmed}
          onCancel={handleSaveCancel}
          message="Save Bill?"
        />
      )}
    </div>
  );
};

export default Billing;