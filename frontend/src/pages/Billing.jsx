import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingAPI, paymentAPI, billingAPI } from '../services/api';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';
import '../dense.css';

// Import billing components
import BillCreationForm from '../components/Billing/BillCreationForm';
import BillList from '../components/Billing/BillList';
import BillDetails from '../components/Billing/BillDetails';
import CustomerLedger from '../components/Billing/CustomerLedger';

const Billing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
  
  const [formData, setFormData] = useState({
    id: '',
    billDate: new Date().toISOString().split('T')[0],
    customerId: user?.us_usertype === 'customer' ? user.us_usid : '',
    customerName: '',
    customerGstin: '',
    customerBillingAddress: '',
    bookingId: '', // NEW: Link to booking
    pnrNumbers: [],
    trainNumber: '',
    reservationClass: '3A',
    ticketType: 'NORMAL',
    netFare: '',
    serviceCharges: '',
    platformFees: '',
    agentFees: '',
    extraCharges: [],
    discounts: [],
    totalAmount: 0, // Auto-calculated
    taxAmount: 0,   // Auto-calculated
    grandTotal: 0,  // Auto-calculated
    status: 'DRAFT',
    remarks: ''
  });

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
            customerId: passedBookingData.bk_usid || passedBookingData.customerId,
            customerName: passedBookingData.customerName || passedBookingData.bk_customername,
            trainNumber: passedBookingData.trainNumber || '',
            reservationClass: passedBookingData.bk_class || '3A',
            // Auto-calculate amounts based on booking
            netFare: calculateNetFare(passedBookingData),
            serviceCharges: calculateServiceCharges(passedBookingData),
            platformFees: calculatePlatformFees(passedBookingData),
            agentFees: calculateAgentFees(passedBookingData)
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
      const netFare = parseFloat(formData.netFare) || 0;
      const serviceCharges = parseFloat(formData.serviceCharges) || 0;
      const platformFees = parseFloat(formData.platformFees) || 0;
      const agentFees = parseFloat(formData.agentFees) || 0;
      
      // Calculate extra charges total
      const extraChargesTotal = formData.extraCharges?.reduce((sum, charge) => {
        return sum + (parseFloat(charge.amount) || 0);
      }, 0) || 0;
      
      // Calculate subtotal (base fare + all charges)
      const subtotal = netFare + serviceCharges + platformFees + agentFees + extraChargesTotal;
      
      // Calculate discount total
      const discountTotal = formData.discounts?.reduce((sum, disc) => {
        return sum + (parseFloat(disc.amount) || 0);
      }, 0) || 0;
      
      // Calculate tax (assuming 5% GST for demonstration)
      const taxRate = 0.05; // 5% GST
      const taxableAmount = subtotal - discountTotal;
      const taxAmount = taxableAmount * taxRate;
      
      // Calculate grand total
      const grandTotal = taxableAmount + taxAmount;
      
      // Calculate balance due (assuming amount received is tracked separately)
      const amountReceived = parseFloat(formData.amountReceived) || 0;
      const balanceDue = grandTotal - amountReceived;
      
      // Update form data with calculated values
      setFormData(prev => ({
        ...prev,
        calculatedSubtotal: subtotal,
        calculatedDiscountTotal: discountTotal,
        calculatedTaxAmount: taxAmount,
        calculatedGrandTotal: grandTotal,
        calculatedBalanceDue: balanceDue
      }));
    }
  }, [formData.netFare, formData.serviceCharges, formData.platformFees, formData.agentFees, formData.extraCharges, formData.discounts, formData.amountReceived, isEditing]);

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
      setBills(Array.isArray(billsData) ? billsData : []);
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

  // Enhanced navigation with keyboard support
  const handleKeyDown = (e) => {
    if (!selectedBill) return;
    
    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        handleNavigation('prev');
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleNavigation('next');
        break;
      case 'Home':
        e.preventDefault();
        handleNavigation('first');
        break;
      case 'End':
        e.preventDefault();
        handleNavigation('last');
        break;
      case 'Enter':
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
          e.preventDefault();
          // Could open action menu here
        }
        break;
      default:
        break;
    }
  };

  // Focus the container for keyboard navigation
  useEffect(() => {
    const container = document.querySelector('.layout-content-wrapper');
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      container.setAttribute('tabindex', '0');
      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedBill]);

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

  if (loading) {
    return (
      <div className="erp-admin-container">
        <div className="erp-loading">Loading billing records...</div>
      </div>
    );
  }

  return (
    <div className="booking-layout">
      {/* 1. Header Row */}
      <div className="layout-header">
        <div className="erp-menu-bar">
          <div className="erp-menu-item">File</div>
          <div className="erp-menu-item">Edit</div>
          <div className="erp-menu-item">View</div>
          <div className="erp-menu-item">Billing</div>
          <div className="erp-menu-item">Reports</div>
          <div className="erp-menu-item">Help</div>
          <div className="erp-user-info">USER: {user?.us_name || 'ADMIN'} ⚙</div>
        </div>
      </div>
      
      {/* 2. Action Bar & Navigation */}
      <div className="layout-action-bar">
         <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             <button className="erp-button primary" onClick={handleNew} title="New (Ctrl+N)">New</button>
             <button className="erp-button" onClick={() => selectedBill && handleEdit()} disabled={!selectedBill} title="Edit (F2)">Edit</button>
             <button className="erp-button" onClick={handleSave} disabled={!isEditing} title="Save (F10)">Save</button>
             <button className="erp-button danger" onClick={() => selectedBill && handleDeleteBill(selectedBill.id)} disabled={!selectedBill} title="Delete (F4)">Delete</button>
             <button className="erp-button" onClick={() => setIsEditing(false)} title="Cancel (Esc)">Cancel</button>
             <div className="action-divider" style={{ borderLeft: '1px solid #ccc', margin: '0 8px', height: '20px' }}></div>
             <button className="erp-button" onClick={() => handleNavigation('first')} disabled={isFirstRecord} title="First">|&lt;</button>
             <button className="erp-button" onClick={() => handleNavigation('prev')} disabled={isFirstRecord} title="Prev">&lt;</button>
             <button className="erp-button" onClick={() => handleNavigation('next')} disabled={isLastRecord} title="Next">&gt;</button>
             <button className="erp-button" onClick={() => handleNavigation('last')} disabled={isLastRecord} title="Last">&gt;|</button>
         </div>
         <div style={{ flex: 1 }}></div>
         <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
             {isEditing ? 'EDIT MODE' : 'READY'} | Records: {bills.length}
         </div>
      </div>

      {/* 3. Content Wrapper */}
      <div className="layout-content-wrapper">
          <div className="layout-main-column">
              <div className="layout-form-section">
          <div className="erp-form-section section" style={{ width: '100%', overflowY: 'auto' }}>
            <div className="erp-panel-header">Bill Details</div>
            <div style={{ padding: '4px' }}>
              {/* Bill ID & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="field">
                      <label className="label">Bill ID</label>
                      <input
                        type="text"
                        name="id"
                        className="erp-input"
                        value={formData.id || ''}
                        readOnly
                        tabIndex={-1}
                      />
                  </div>
                  <div className="field">
                      <label className="label">Bill Date</label>
                      <input
                        type="date"
                        name="billDate"
                        className="erp-input"
                        value={formData.billDate || ''}
                        onChange={(e) => setFormData({...formData, billDate: e.target.value})}
                        disabled={!isEditing}
                      />
                  </div>
              </div>
              
              {/* Customer Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <div className="field">
                      <label className="label">Customer ID</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          name="customerId"
                          className="erp-input"
                          value={formData.customerId || ''}
                          onChange={handleCustomerIdChange}
                          disabled={!isEditing}
                          placeholder="Enter customer ID"
                        />
                        {showCustomerDropdown && (
                          <div className="erp-dropdown" style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            zIndex: 1000,
                            maxHeight: '150px',
                            overflowY: 'auto',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                          }}>
                            {customerLookup.map(customer => (
                              <div 
                                key={customer.id}
                                className="erp-dropdown-item"
                                style={{
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #eee'
                                }}
                                onMouseDown={() => handleCustomerSelect(customer)}
                              >
                                {customer.id} - {customer.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                  </div>
                  <div className="field">
                      <label className="label">Customer Name</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          name="customerName"
                          className="erp-input"
                          value={formData.customerName || ''}
                          onChange={handleCustomerNameChange}
                          disabled={!isEditing}
                          placeholder="Enter customer name"
                        />
                        {showCustomerDropdown && (
                          <div className="erp-dropdown" style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            zIndex: 1000,
                            maxHeight: '150px',
                            overflowY: 'auto',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                          }}>
                            {customerLookup.map(customer => (
                              <div 
                                key={customer.id}
                                className="erp-dropdown-item"
                                style={{
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #eee'
                                }}
                                onMouseDown={() => handleCustomerSelect(customer)}
                              >
                                {customer.id} - {customer.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                  </div>
              </div>
            
              {/* Journey Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <div className="field">
                      <label className="label">Train Number</label>
                      <input
                        type="text"
                        name="trainNumber"
                        className="erp-input"
                        value={formData.trainNumber || ''}
                        onChange={(e) => setFormData({...formData, trainNumber: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Enter train number"
                      />
                  </div>
                  <div className="field">
                      <label className="label">Reservation Class</label>
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
                      </select>
                  </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <div className="field">
                      <label className="label">Ticket Type</label>
                      <select
                        name="ticketType"
                        className="erp-input"
                        value={formData.ticketType || 'NORMAL'}
                        onChange={(e) => setFormData({...formData, ticketType: e.target.value})}
                        disabled={!isEditing}
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="TATKAL">Tatkal</option>
                        <option value="PREMIUM_TATKAL">Premium Tatkal</option>
                      </select>
                  </div>
                  <div className="field">
                      <label className="label">PNR Number(s)</label>
                      <input
                        type="text"
                        name="pnrNumbers"
                        className="erp-input"
                        value={formData.pnrNumbers?.join(', ') || ''}
                        onChange={(e) => setFormData({...formData, pnrNumbers: e.target.value.split(',').map(pnr => pnr.trim())})}
                        disabled={!isEditing}
                        placeholder="Enter PNR numbers separated by commas"
                      />
                  </div>
              </div>
            
              {/* Charge Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <div className="field">
                      <label className="label">Net Journey Fare</label>
                      <input
                        type="number"
                        name="netFare"
                        className="erp-input"
                        value={formData.netFare || ''}
                        onChange={(e) => setFormData({...formData, netFare: e.target.value})}
                        disabled={!isEditing}
                      />
                  </div>
                  <div className="field">
                      <label className="label">Service Charges</label>
                      <input
                        type="number"
                        name="serviceCharges"
                        className="erp-input"
                        value={formData.serviceCharges || ''}
                        onChange={(e) => setFormData({...formData, serviceCharges: e.target.value})}
                        disabled={!isEditing}
                      />
                  </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <div className="field">
                      <label className="label">Platform Fees</label>
                      <input
                        type="number"
                        name="platformFees"
                        className="erp-input"
                        value={formData.platformFees || ''}
                        onChange={(e) => setFormData({...formData, platformFees: e.target.value})}
                        disabled={!isEditing}
                      />
                  </div>
                  <div className="field">
                      <label className="label">Agent Fees</label>
                      <input
                        type="number"
                        name="agentFees"
                        className="erp-input"
                        value={formData.agentFees || ''}
                        onChange={(e) => setFormData({...formData, agentFees: e.target.value})}
                        disabled={!isEditing}
                      />
                  </div>
              </div>
            
              {/* Real-time Totals */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <div className="field">
                      <label className="label">Subtotal</label>
                      <input
                        type="number"
                        className="erp-input"
                        value={formData.calculatedSubtotal ? formData.calculatedSubtotal.toFixed(2) : '0.00'}
                        readOnly
                      />
                  </div>
                  <div className="field">
                      <label className="label">(-) Discounts</label>
                      <input
                        type="number"
                        className="erp-input"
                        value={formData.calculatedDiscountTotal ? formData.calculatedDiscountTotal.toFixed(2) : '0.00'}
                        readOnly
                      />
                  </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <div className="field">
                      <label className="label">(+) Taxes</label>
                      <input
                        type="number"
                        className="erp-input"
                        value={formData.calculatedTaxAmount ? formData.calculatedTaxAmount.toFixed(2) : '0.00'}
                        readOnly
                      />
                  </div>
                  <div className="field">
                      <label className="label">Grand Total</label>
                      <input
                        type="number"
                        className="erp-input"
                        value={formData.calculatedGrandTotal ? formData.calculatedGrandTotal.toFixed(2) : '0.00'}
                        readOnly
                      />
                  </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <div className="field">
                      <label className="label">Amount Received</label>
                      <input
                        type="number"
                        name="amountReceived"
                        className="erp-input"
                        value={formData.amountReceived || 0}
                        onChange={(e) => setFormData({...formData, amountReceived: e.target.value})}
                        disabled={!isEditing}
                      />
                  </div>
                  <div className="field">
                      <label className="label">Balance Due</label>
                      <input
                        type="number"
                        className="erp-input"
                        value={formData.calculatedBalanceDue ? formData.calculatedBalanceDue.toFixed(2) : '0.00'}
                        readOnly
                      />
                  </div>
              </div>
              
              {/* Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '8px' }}>
                  <div className="field">
                      <label className="label">Status</label>
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
                  </div>
              </div>
            
              {/* Audit Section - Outside focus flow */}
              <div className="erp-audit-section" tabIndex={-1}>
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
          </div>
      </div>
      
              <div className="layout-grid-section">
                <div className="erp-panel-header">Bill Records</div>
                <div className="navigation-hint" style={{ padding: '4px 8px', backgroundColor: '#f0f0f0', fontSize: '11px', borderBottom: '1px solid #ccc' }}>
                  🔍 Click a row to select • ↑↓ Navigate records • Enter to select • Home/End for first/last
                </div>
                <div className="erp-grid-container">
                  <BillList 
                    bills={paginatedData}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDeleteBill}
                    onFinalize={handleFinalizeBill}
                    onExport={handleExportBill}
                    onView={(bill) => {
                      setSelectedBill(bill);
                      setShowBillDetails(true);
                      setActiveView('view');
                    }}
                    user={user}
                    selectedBill={selectedBill}
                    onSelect={handleRecordSelect}
                  />
                </div>
              </div>
      </div>

      {/* Right Sidebar: Filters */}
      <div className="layout-right-sidebar">
         <div className="layout-filters-content">
             <div className="section-title">FILTERS</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="field small-label">
                   <label className="label">Bill ID</label>
                   <input type="text" className="erp-input" value={inlineFilters['billId']||''} onChange={(e)=>setInlineFilters(prev => ({...prev, billId: e.target.value}))} />
                </div>
                <div className="field small-label">
                   <label className="label">Customer ID</label>
                   <input type="text" className="erp-input" value={inlineFilters['customerId']||''} onChange={(e)=>setInlineFilters(prev => ({...prev, customerId: e.target.value}))} />
                </div>
                <div className="field small-label">
                   <label className="label">Customer Name</label>
                   <input type="text" className="erp-input" value={inlineFilters['customerName']||''} onChange={(e)=>setInlineFilters(prev => ({...prev, customerName: e.target.value}))} />
                </div>
                <div className="field small-label">
                   <label className="label">PNR Number</label>
                   <input type="text" className="erp-input" value={inlineFilters['pnrNumber']||''} onChange={(e)=>setInlineFilters(prev => ({...prev, pnrNumber: e.target.value}))} />
                </div>
                <div className="field small-label">
                   <label className="label">Status</label>
                   <select className="erp-input" value={inlineFilters['status']||''} onChange={(e)=>setInlineFilters(prev => ({...prev, status: e.target.value}))}>
                     <option value="">All</option>
                     <option value="DRAFT">Draft</option>
                     <option value="FINAL">Final</option>
                     <option value="CANCELLED">Cancelled</option>
                   </select>
                </div>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                <button className="erp-button" style={{ width: '100%' }} onClick={fetchBills}>Apply Filters</button>
                <button className="erp-button" style={{ width: '100%' }} onClick={() => {
                  setInlineFilters({});
                  setFilters({
                    billId: '',
                    customerId: '',
                    customerName: '',
                    pnrNumber: '',
                    status: '',
                    dateRange: '',
                    balanceDueOnly: false
                  });
                  fetchBills();
                }}>Clear Filters</button>
             </div>
         </div>
      </div>
      </div>

      {/* 4. Status Bar */}
      <div className="layout-footer">
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
    </div>
  );
};

export default Billing;