import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { bookingAPI, paymentAPI, billingAPI } from '../services/api';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

// Import billing components
import BillCreationForm from '../components/Billing/BillCreationForm';
import BillList from '../components/Billing/BillList';
import BillDetails from '../components/Billing/BillDetails';
import CustomerLedger from '../components/Billing/CustomerLedger';

const Billing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'ledger'
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    billDate: new Date().toISOString().split('T')[0],
    customerId: user?.us_usertype === 'customer' ? user.us_usid : '',
    customerName: '',
    customerGstin: '',
    customerBillingAddress: '',
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
    status: 'DRAFT',
    remarks: ''
  });

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
      if (user && (user.us_usertype === 'admin' || user.us_roid !== 'CUS')) {
        data = await billingAPI.getAllBills();
      } else {
        // For non-admin users, get user-specific bills
        data = await billingAPI.getMyBills();
      }
      
      setBills(Array.isArray(data) ? data : (data.bills || []));
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

  if (loading) {
    return (
      <div className="erp-admin-container">
        <div className="erp-loading">Loading billing records...</div>
      </div>
    );
  }

  return (
    <div className="erp-admin-container">
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
      <div className="erp-main-content">
        {/* Center Content */}
        <div className="erp-center-content">
          {/* Form Panel - Static */}
          <div className="erp-form-section">
            {/* Bill Header Fields - Row 1 */}
            <div className="erp-form-row">
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
            </div>
            
            {/* Customer Details - Row 2 */}
            <div className="erp-form-row">
              <label className="erp-form-label required">Customer ID</label>
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
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
              <label className="erp-form-label required">Customer Name</label>
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
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
            
            {/* Bill Charges - Row 3 */}
            <div className="erp-form-row">
              <label className="erp-form-label required">PNR Number(s)</label>
              <input 
                type="text" 
                name="pnrNumbers" 
                className="erp-input" 
                value={formData.pnrNumbers?.join(', ') || ''} 
                onChange={(e) => setFormData({...formData, pnrNumbers: e.target.value.split(',').map(pnr => pnr.trim())})}
                disabled={!isEditing}
                placeholder="Enter PNR numbers separated by commas"
              />
              <label className="erp-form-label required">Net Journey Fare</label>
              <input 
                type="number" 
                name="netFare" 
                className="erp-input" 
                value={formData.netFare || ''} 
                onChange={(e) => setFormData({...formData, netFare: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            
            <div className="erp-form-row">
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
            </div>
            
            <div className="erp-form-row">
              <label className="erp-form-label">Agent Fees</label>
              <input 
                type="number" 
                name="agentFees" 
                className="erp-input" 
                value={formData.agentFees || ''} 
                onChange={(e) => setFormData({...formData, agentFees: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            
            {/* Journey & Ticket Details */}
            <div className="erp-form-row">
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
              </select>
            </div>
            
            <div className="erp-form-row">
              <label className="erp-form-label required">Ticket Type</label>
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
            
            {/* Additional Charges & Discounts - Row 4 */}
            <div className="erp-form-row">
              <div style={{ flex: 1, marginRight: '10px' }}>
                <div className="erp-grid-container" style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #ccc', margin: '5px 0' }}>
                  <table className="erp-table" style={{ fontSize: '11px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '100px' }}>Type</th>
                        <th style={{ width: '70px' }}>Amount</th>
                        <th style={{ width: '40px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.extraCharges && formData.extraCharges.length > 0 ? (
                        formData.extraCharges.map((charge, index) => (
                          <tr key={index}>
                            <td>{charge.type || ''}</td>
                            <td>{charge.amount || ''}</td>
                            <td>
                              <button 
                                className="erp-button" 
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                                onClick={() => {
                                  if (isEditing) {
                                    const updatedCharges = [...formData.extraCharges];
                                    updatedCharges.splice(index, 1);
                                    setFormData({
                                      ...formData,
                                      extraCharges: updatedCharges
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
                          <td colSpan="3" style={{ textAlign: 'center' }}></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {isEditing && (
                  <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <input 
                      type="text" 
                      name="newChargeType" 
                      className="erp-input" 
                      value={formData.newChargeType || ''} 
                      onChange={(e) => setFormData({...formData, newChargeType: e.target.value})}
                      placeholder="Type"
                      style={{ flex: 1, padding: '2px', fontSize: '11px' }}
                    />
                    <input 
                      type="number" 
                      name="newChargeAmount" 
                      className="erp-input" 
                      value={formData.newChargeAmount || ''} 
                      onChange={(e) => setFormData({...formData, newChargeAmount: e.target.value})}
                      placeholder="Amt"
                      style={{ flex: 1, padding: '2px', fontSize: '11px' }}
                    />
                    <button 
                      className="erp-button" 
                      style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}
                      onClick={() => {
                        if (formData.newChargeType && formData.newChargeAmount) {
                          const newCharge = {
                            type: formData.newChargeType,
                            amount: formData.newChargeAmount
                          };
                          
                          setFormData({
                            ...formData,
                            extraCharges: [...(formData.extraCharges || []), newCharge],
                            newChargeType: '',
                            newChargeAmount: ''
                          });
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <div className="erp-grid-container" style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #ccc', margin: '5px 0' }}>
                  <table className="erp-table" style={{ fontSize: '11px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '70px' }}>Type</th>
                        <th style={{ width: '70px' }}>Value</th>
                        <th style={{ width: '70px' }}>Amt</th>
                        <th style={{ width: '40px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.discounts && formData.discounts.length > 0 ? (
                        formData.discounts.map((discount, index) => (
                          <tr key={index}>
                            <td>{discount.type || ''}</td>
                            <td>{discount.value || ''}</td>
                            <td>{discount.amount || ''}</td>
                            <td>
                              <button 
                                className="erp-button" 
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                                onClick={() => {
                                  if (isEditing) {
                                    const updatedDiscounts = [...formData.discounts];
                                    updatedDiscounts.splice(index, 1);
                                    setFormData({
                                      ...formData,
                                      discounts: updatedDiscounts
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
                          <td colSpan="4" style={{ textAlign: 'center' }}></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {isEditing && (
                  <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <select 
                      name="newDiscountType" 
                      className="erp-input" 
                      value={formData.newDiscountType || ''} 
                      onChange={(e) => setFormData({...formData, newDiscountType: e.target.value})}
                      style={{ flex: 1, padding: '2px', fontSize: '11px' }}
                    >
                      <option value="FIXED">Fixed</option>
                      <option value="PERCENTAGE">%</option>
                    </select>
                    <input 
                      type="number" 
                      name="newDiscountValue" 
                      className="erp-input" 
                      value={formData.newDiscountValue || ''} 
                      onChange={(e) => setFormData({...formData, newDiscountValue: e.target.value})}
                      placeholder="Value"
                      style={{ flex: 1, padding: '2px', fontSize: '11px' }}
                    />
                    <button 
                      className="erp-button" 
                      style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}
                      onClick={() => {
                        if (formData.newDiscountType && formData.newDiscountValue) {
                          const newDiscount = {
                            type: formData.newDiscountType,
                            value: formData.newDiscountValue,
                            amount: formData.newDiscountType === 'PERCENTAGE' ? 
                              (parseFloat(formData.netFare || 0) * parseFloat(formData.newDiscountValue)) / 100 : 
                              formData.newDiscountValue
                          };
                          
                          setFormData({
                            ...formData,
                            discounts: [...(formData.discounts || []), newDiscount],
                            newDiscountType: '',
                            newDiscountValue: ''
                          });
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Bill Total Summary */}
            
            {/* Bill Total Summary with calculated values */}
            <div className="erp-form-row">
              <label className="erp-form-label">Subtotal</label>
              <input 
                type="number" 
                className="erp-input" 
                value={formData.calculatedSubtotal ? formData.calculatedSubtotal.toFixed(2) : '0.00'} 
                readOnly 
              />
              <label className="erp-form-label">(-) Discounts</label>
              <input 
                type="number" 
                className="erp-input" 
                value={formData.calculatedDiscountTotal ? formData.calculatedDiscountTotal.toFixed(2) : '0.00'} 
                readOnly 
              />
            </div>
            
            <div className="erp-form-row">
              <label className="erp-form-label">(+) Taxes</label>
              <input 
                type="number" 
                className="erp-input" 
                value={formData.calculatedTaxAmount ? formData.calculatedTaxAmount.toFixed(2) : '0.00'} 
                readOnly 
              />
              <label className="erp-form-label">Grand Total</label>
              <input 
                type="number" 
                className="erp-input" 
                value={formData.calculatedGrandTotal ? formData.calculatedGrandTotal.toFixed(2) : '0.00'} 
                readOnly 
              />
            </div>
            
            <div className="erp-form-row">
              <label className="erp-form-label">Amount Received</label>
              <input 
                type="number" 
                name="amountReceived" 
                className="erp-input" 
                value={formData.amountReceived || 0} 
                onChange={(e) => setFormData({...formData, amountReceived: e.target.value})}
                disabled={!isEditing}
              />
              <label className="erp-form-label">Balance Due</label>
              <input 
                type="number" 
                className="erp-input" 
                value={formData.calculatedBalanceDue ? formData.calculatedBalanceDue.toFixed(2) : '0.00'} 
                readOnly 
              />
            </div>
            
            {/* Audit Details */}
            
            <div className="erp-form-row">
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
          <div className="erp-grid-section">
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
                      <th style={{ width: '150px' }}>Bill Date</th>
                      <th style={{ width: '200px' }}>Customer Name</th>
                      <th style={{ width: '150px' }}>PNR(s)</th>
                      <th style={{ width: '120px' }}>Net Fare</th>
                      <th style={{ width: '120px' }}>Service Charges</th>
                      <th style={{ width: '120px' }}>Platform Fees</th>
                      <th style={{ width: '120px' }}>Agent Fees</th>
                      <th style={{ width: '120px' }}>Total Amount</th>
                      <th style={{ width: '120px' }}>Paid Amount</th>
                      <th style={{ width: '120px' }}>Balance Due</th>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '150px' }}>Entered On</th>
                      <th style={{ width: '150px' }}>Modified On</th>
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
                          value={inlineFilters.pnr || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, pnr: e.target.value})}
                          placeholder="Filter PNR..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="inline-filter-input"
                          value={inlineFilters.netFare || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, netFare: e.target.value})}
                          placeholder="Filter Amount..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="inline-filter-input"
                          value={inlineFilters.serviceCharges || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, serviceCharges: e.target.value})}
                          placeholder="Filter Amount..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="inline-filter-input"
                          value={inlineFilters.platformFees || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, platformFees: e.target.value})}
                          placeholder="Filter Amount..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="inline-filter-input"
                          value={inlineFilters.agentFees || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, agentFees: e.target.value})}
                          placeholder="Filter Amount..."
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
                          type="number"
                          className="inline-filter-input"
                          value={inlineFilters.paidAmount || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, paidAmount: e.target.value})}
                          placeholder="Filter Paid..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="inline-filter-input"
                          value={inlineFilters.balanceDue || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, balanceDue: e.target.value})}
                          placeholder="Filter Balance..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <select
                          className="inline-filter-input"
                          value={inlineFilters.status || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, status: e.target.value})}
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        >
                          <option value="">All</option>
                          <option value="DRAFT">Draft</option>
                          <option value="FINAL">Final</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          className="inline-filter-input"
                          value={inlineFilters.enteredOn || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, enteredOn: e.target.value})}
                          placeholder="Filter Date..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="inline-filter-input"
                          value={inlineFilters.modifiedOn || ''}
                          onChange={(e) => setInlineFilters({...inlineFilters, modifiedOn: e.target.value})}
                          placeholder="Filter Date..."
                          style={{ width: '100%', padding: '2px', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr><td colSpan={15} style={{ textAlign: 'center' }}>No records found</td></tr>
                    ) : (
                      paginatedData.map((bill, idx) => {
                        const isSelected = selectedBill && selectedBill.id === bill.id;
                        const balanceDue = (bill.totalAmount || 0) - (bill.paidAmount || 0);
                        return (
                          <tr 
                            key={bill.id || idx}
                            className={isSelected ? 'selected' : ''}
                            onClick={() => handleRecordSelect(bill)}
                          >
                            <td><input type="checkbox" checked={!!isSelected} onChange={() => {}} /></td>
                            <td>{bill.id || 'N/A'}</td>
                            <td>{bill.billDate || 'N/A'}</td>
                            <td>{bill.customerName || 'N/A'}</td>
                            <td>{bill.pnrNumbers?.join(', ') || 'N/A'}</td>
                            <td>{bill.netFare || 0}</td>
                            <td>{bill.serviceCharges || 0}</td>
                            <td>{bill.platformFees || 0}</td>
                            <td>{bill.agentFees || 0}</td>
                            <td>{bill.totalAmount || 0}</td>
                            <td>{bill.paidAmount || 0}</td>
                            <td>{balanceDue}</td>
                            <td>{bill.status || 'DRAFT'}</td>
                            <td>{bill.createdOn || 'N/A'}</td>
                            <td>{bill.modifiedOn || 'N/A'}</td>
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
            <div className="erp-filter-title">
              Filter Criteria
              {(bills.length !== getPaginatedData().length) && (
                <span className="erp-filter-count">{getPaginatedData().length}/{bills.length}</span>
              )}
            </div>
          </div>
          
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