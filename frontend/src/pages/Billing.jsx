import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingAPI, paymentAPI, billingAPI } from '../services/api';
import { useKeyboardNavigation } from '../contexts/KeyboardNavigationContext';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'ledger'
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  
  // Booking integration state
  const [bookingData, setBookingData] = useState(null);
  const [billingMode, setBillingMode] = useState('list'); // 'list', 'generate', 'view'
  
  // MANDATORY: Define business logic field order (MEMOIZED) - MATCHES UI LAYOUT
  const fieldOrder = useMemo(() => [
    'billDate',
    'bookingId',
    'subBillNo',
    'customerName',
    'phoneNumber',
    'stationBoy',
    'fromStation',
    'toStation',
    'journeyDate',
    'trainNumber',
    'reservationClass',
    'ticketType',
    'pnrNumbers',
    'seatsAlloted',
    'railwayFare',
    'stationBoyIncentive',
    'serviceCharges',
    'platformFees',
    'miscCharges',
    'deliveryCharges',
    'cancellationCharges',
    'gst',
    'surcharge',
    'totalAmount',
    'passenger_name',
    'passenger_age', 
    'passenger_gender',
    'passenger_berth',
    'remarks',
    'status'
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

  // Handle booking integration from location state
  useEffect(() => {
    if (location.state) {
      const { bookingId, mode, bookingData: passedBookingData } = location.state;
      
      if (bookingId && mode) {
        setBillingMode(mode);
        setBookingData(passedBookingData);
        
        if (mode === 'generate' && passedBookingData) {
          // Auto-populate form with booking data
          setFormData(prev => ({
            ...prev,
            bookingId: bookingId,
            customerName: passedBookingData.bk_customername || passedBookingData.customerName || '',
            phoneNumber: passedBookingData.bk_phonenumber || passedBookingData.phoneNumber || '',
            fromStation: passedBookingData.bk_fromst || passedBookingData.fromStation || '',
            toStation: passedBookingData.bk_tost || passedBookingData.toStation || '',
            journeyDate: passedBookingData.bk_trvldt || passedBookingData.journeyDate || '',
            trainNumber: passedBookingData.bk_trno || passedBookingData.trainNumber || '',
            reservationClass: passedBookingData.bk_class || passedBookingData.reservationClass || '3A',
            ticketType: passedBookingData.bk_tickettype || passedBookingData.ticketType || 'NORMAL',
            pnrNumbers: passedBookingData.bk_pnr || passedBookingData.pnrNumber || '',
            seatsAlloted: passedBookingData.bk_totalpass || passedBookingData.seatsAlloted || '',
            // Auto-calculate amounts based on booking
            railwayFare: calculateNetFare(passedBookingData),
            serviceCharges: calculateServiceCharges(passedBookingData),
            platformFees: calculatePlatformFees(passedBookingData)
          }));
          
          setActiveView('create');
          setShowForm(true);
        } else if (mode === 'view') {
          // Load existing bill for this booking
          loadBillForBooking(bookingId);
        }
      }
    }
  }, [location.state]);

  // Billing calculation functions
  const calculateNetFare = (booking) => {
    // Base fare calculation logic
    const baseRate = getBaseRateForClass(booking.bk_class);
    const passengers = booking.totalPassengers || 1;
    return baseRate * passengers;
  };

  const calculateServiceCharges = (booking) => {
    // Service charges (configurable percentage)
    const netFare = calculateNetFare(booking);
    return Math.round(netFare * 0.05); // 5% service charge
  };

  const calculatePlatformFees = (booking) => {
    // Platform fees (fixed amount per booking)
    return 20; // Fixed ₹20 platform fee
  };

  const calculateAgentFees = (booking) => {
    // Agent fees (configurable)
    const netFare = calculateNetFare(booking);
    return Math.round(netFare * 0.02); // 2% agent fee
  };

  const getBaseRateForClass = (travelClass) => {
    const rates = {
      'SL': 500,
      '3A': 800,
      '2A': 1200,
      '1A': 2000,
      'CC': 600,
      'EC': 1000
    };
    return rates[travelClass] || 500;
  };

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

  // Audit data for the form
  const [auditData, setAuditData] = useState({
    enteredOn: '',
    enteredBy: user?.us_usid || 'ADMIN',
    modifiedOn: '',
    modifiedBy: user?.us_usid || 'ADMIN',
    closedOn: '',
    closedBy: ''
  });

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

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isPassengerSectionOpen, setIsPassengerSectionOpen] = useState(false);

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
  }, [user]);
  
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
      // Ensure numeric fields are properly converted to numbers
      const processedBills = Array.isArray(billsData) ? billsData.map(bill => ({
        ...bill,
        totalAmount: bill.totalAmount ? Number(bill.totalAmount) : 0,
        paidAmount: bill.paidAmount ? Number(bill.paidAmount) : 0,
        railwayFare: bill.railwayFare ? Number(bill.railwayFare) : 0,
        serviceCharges: bill.serviceCharges ? Number(bill.serviceCharges) : 0,
        platformFees: bill.platformFees ? Number(bill.platformFees) : 0,
        stationBoyIncentive: bill.stationBoyIncentive ? Number(bill.stationBoyIncentive) : 0,
        miscCharges: bill.miscCharges ? Number(bill.miscCharges) : 0,
        deliveryCharges: bill.deliveryCharges ? Number(bill.deliveryCharges) : 0,
        cancellationCharges: bill.cancellationCharges ? Number(bill.cancellationCharges) : 0,
        gst: bill.gst ? Number(bill.gst) : 0,
        surcharge: bill.surcharge ? Number(bill.surcharge) : 0
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

  const handleCreateBill = async (billData) => {
    try {
      const newBill = await billingAPI.createBill(billData);
      setBills([...bills, newBill]);
      setShowForm(false);
      setActiveView('list');
      fetchBills();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateBill = async (billId, billData) => {
    try {
      const updatedBill = await billingAPI.updateBill(billId, billData);
      setBills(bills.map(bill => bill.id === billId ? updatedBill : bill));
      setShowForm(false);
      setActiveView('list');
      fetchBills();
    } catch (error) {
      setError(error.message);
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
    setFormData(bill);
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
      trainNumber: '',
      reservationClass: '3A',
      ticketType: 'NORMAL',
      pnrNumbers: [],
      netFare: '',
      serviceCharges: '',
      platformFees: '',
      agentFees: '',
      extraCharges: [],
      discounts: [],
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
                disabled={!isEditing}
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
                disabled={!isEditing}
              >
                <option value="NORMAL">NORMAL</option>
                <option value="TATKAL">TATKAL</option>
                <option value="PREMIUM_TATKAL">PREMIUM TATKAL</option>
              </select>
              <label className="erp-form-label">PNR Number(s)</label>
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
              />
              <label className="erp-form-label">Platform Fees</label>
              <input 
                type="number" 
                name="platformFees" 
                className="erp-input" 
                value={formData.platformFees || ''} 
                onChange={(e) => setFormData({...formData, platformFees: e.target.value})}
                disabled={!isEditing}
              />
              <label className="erp-form-label">Station Boy Incentive</label>
              <input 
                type="number" 
                name="stationBoyIncentive" 
                className="erp-input" 
                value={formData.stationBoyIncentive || ''} 
                onChange={(e) => setFormData({...formData, stationBoyIncentive: e.target.value})}
                disabled={!isEditing}
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
              />
              <label className="erp-form-label">Delivery Charges</label>
              <input 
                type="number" 
                name="deliveryCharges" 
                className="erp-input" 
                value={formData.deliveryCharges || ''} 
                onChange={(e) => setFormData({...formData, deliveryCharges: e.target.value})}
                disabled={!isEditing}
              />
              <label className="erp-form-label">Cancellation Charges</label>
              <input 
                type="number" 
                name="cancellationCharges" 
                className="erp-input" 
                value={formData.cancellationCharges || ''} 
                onChange={(e) => setFormData({...formData, cancellationCharges: e.target.value})}
                disabled={!isEditing}
              />
              <label className="erp-form-label">GST</label>
              <input 
                type="number" 
                name="gst" 
                className="erp-input" 
                value={formData.gst || ''} 
                onChange={(e) => setFormData({...formData, gst: e.target.value})}
                disabled={!isEditing}
              />
              <label className="erp-form-label">Surcharge</label>
              <input 
                type="number" 
                name="surcharge" 
                className="erp-input" 
                value={formData.surcharge || ''} 
                onChange={(e) => setFormData({...formData, surcharge: e.target.value})}
                disabled={!isEditing}
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
              />
              <label className="erp-form-label">Status</label>
              <select 
                name="status" 
                className="erp-input" 
                value={formData.status || 'DRAFT'} 
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                disabled={!isEditing}
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
                placeholder="Enter special requests or remarks"
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
                      <th style={{ width: '150px' }}>Passenger List</th>
                      <th style={{ width: '150px' }}>Special Request/Remarks</th>
                      <th style={{ width: '150px' }}>Audit details</th>
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
                          value={inlineFilters.passengerList || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, passengerList: e.target.value})}
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
                          value={inlineFilters.auditDetails || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, auditDetails: e.target.value})}
                          placeholder="Filter Audit..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr><td colSpan={19} style={{ textAlign: 'center' }}>No records found</td></tr>
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
                            <td>{bill.id || 'N/A'}</td>
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
                            <td>{bill.passengerList ? bill.passengerList.length + ' passengers' : '0'}</td>
                            <td>{bill.remarks || 'N/A'}</td>
                            <td>{bill.status || 'N/A'}</td>
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
    </div>
  );
};

export default Billing;