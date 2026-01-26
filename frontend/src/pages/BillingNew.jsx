/**
 * BILLING PAGE - BOOKING → BILLING INTEGRATION
 * 
 * FEATURES:
 * - Opens in NEW MODE when coming from booking
 * - All fields prefilled from booking data
 * - Keyboard-first navigation
 * - Auto-calculation of total amount
 * - Split bill functionality
 * - Cannot be created manually - must originate from booking
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKeyboardForm } from '../hooks/useKeyboardForm';
import { enhancedFocusManager, announceToScreenReader } from '../utils/focusManager';
import SaveConfirmationModal from '../components/common/SaveConfirmationModal';
import '../styles/vintage-erp-theme.css';

const BillingNew = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if coming from booking (NEW MODE)
    const isFromBooking = location.state?.mode === 'generate';
    const bookingId = location.state?.bookingId;
    const bookingData = location.state?.bookingData;
    
    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(isFromBooking); // Auto-edit mode when from booking
    const [showSaveModal, setShowSaveModal] = useState(false);
    
    // Form data with all required fields
    const [formData, setFormData] = useState({
        // System fields
        entryNo: '',
        billingDate: new Date().toISOString().split('T')[0],
        bookingNo: '',
        billNo: '',
        subBillNo: '',
        
        // Customer information
        customerName: '',
        phoneNumber: '',
        
        // Station Boy (NEW FIELD)
        stationBoy: '',
        
        // Journey details
        fromStation: '',
        toStation: '',
        journeyDate: '',
        trainNumber: '',
        class: '',
        pnrNumber: '',
        seatsReserved: '',
        
        // Financial fields (all default to 0)
        railwayFare: 0,
        stationBoyIncentive: 0,
        gst: 0,
        miscCharges: 0,
        platformFee: 0,
        serviceCharge: 0,
        deliveryCharge: 0,
        cancellationCharge: 0,
        surcharge: 0,
        discount: 0,
        
        // GST configuration
        gstType: 'EXCLUSIVE',
        
        // Total amount (auto-calculated)
        totalAmount: 0,
        
        // Split bill
        isSplit: false
    });
    
    // Field order for keyboard navigation (STRICT ORDER)
    const fieldOrder = useMemo(() => [
        'billingDate',
        'billNo',
        'subBillNo',
        'customerName',
        'phoneNumber',
        'stationBoy',
        'fromStation',
        'toStation',
        'journeyDate',
        'trainNumber',
        'class',
        'pnrNumber',
        'seatsReserved',
        'railwayFare',
        'stationBoyIncentive',
        'gst',
        'miscCharges',
        'platformFee',
        'serviceCharge',
        'deliveryCharge',
        'cancellationCharge',
        'gstType',
        'surcharge',
        'discount'
    ], []);
    
    // Initialize keyboard navigation
    const { isModalOpen, handleManualFocus } = useKeyboardForm({
        formId: 'BILLING_FORM',
        fields: fieldOrder,
        onSave: handleSaveConfirmed,
        onCancel: () => setIsEditing(false)
    });
    
    // Initialize focus manager
    useEffect(() => {
        try {
            enhancedFocusManager.initializeFieldOrder(fieldOrder);
            
            if (process.env.NODE_ENV === 'development') {
                console.log('🎯 Billing focus manager initialized');
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Billing focus manager init failed:', error.message);
            }
        }
        
        return () => {
            try {
                enhancedFocusManager.reset();
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Billing focus cleanup failed:', error.message);
                }
            }
        };
    }, [fieldOrder]);
    
    // Load billing data from booking when component mounts
    useEffect(() => {
        if (isFromBooking && bookingId) {
            loadBillingFromBooking();
        }
    }, [isFromBooking, bookingId]);
    
    // Auto-focus on billing date when page loads
    useEffect(() => {
        if (isEditing) {
            setTimeout(() => {
                enhancedFocusManager.focusField('billingDate');
            }, 100);
        }
    }, [isEditing]);
    
    /**
     * Load prefilled billing data from booking
     */
    const loadBillingFromBooking = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await fetch(`/api/billing/from-booking/${bookingId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            // Prefill form with booking data
            setFormData(prev => ({
                ...prev,
                ...result.data,
                billingDate: result.data.billingDate || new Date().toISOString().split('T')[0]
            }));
            
            announceToScreenReader('Billing form prefilled from booking data');
            
        } catch (error) {
            console.error('Error loading billing from booking:', error);
            setError(error.message || 'Failed to load billing data from booking');
        } finally {
            setLoading(false);
        }
    };
    
    /**
     * Calculate total amount based on all charges
     * Formula: total = railwayFare + miscCharges + platformFee + serviceCharge + 
     *                 deliveryCharge + surcharge + gst - discount - cancellationCharge
     */
    const calculateTotalAmount = useCallback((data = formData) => {
        const railwayFare = parseFloat(data.railwayFare || 0);
        const miscCharges = parseFloat(data.miscCharges || 0);
        const platformFee = parseFloat(data.platformFee || 0);
        const serviceCharge = parseFloat(data.serviceCharge || 0);
        const deliveryCharge = parseFloat(data.deliveryCharge || 0);
        const surcharge = parseFloat(data.surcharge || 0);
        const gst = parseFloat(data.gst || 0);
        const discount = parseFloat(data.discount || 0);
        const cancellationCharge = parseFloat(data.cancellationCharge || 0);
        
        const total = railwayFare + miscCharges + platformFee + serviceCharge + 
                     deliveryCharge + surcharge + gst - discount - cancellationCharge;
        
        return Math.max(0, total); // Ensure total is never negative
    }, [formData]);
    
    /**
     * Handle input changes with auto-calculation
     */
    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            
            // Auto-calculate total for numeric fields
            if (['railwayFare', 'stationBoyIncentive', 'gst', 'miscCharges', 
                 'platformFee', 'serviceCharge', 'deliveryCharge', 
                 'cancellationCharge', 'surcharge', 'discount'].includes(name)) {
                newData.totalAmount = calculateTotalAmount(newData);
            }
            
            return newData;
        });
    }, [calculateTotalAmount]);
    
    /**
     * Handle field focus for keyboard navigation
     */
    const handleFieldFocus = useCallback((fieldName) => {
        if (process.env.NODE_ENV === 'production') {
            return;
        }
        
        try {
            enhancedFocusManager.trackManualFocus(fieldName);
            if (handleManualFocus) {
                handleManualFocus(fieldName);
            }
        } catch (error) {
            console.warn('Focus tracking failed:', error.message);
        }
    }, [handleManualFocus]);
    
    /**
     * Enhanced Tab navigation handler
     */
    const handleEnhancedTabNavigation = useCallback((event, currentFieldName) => {
        if (event.key !== 'Tab') return false;
        
        event.preventDefault();
        event.stopPropagation();
        
        try {
            enhancedFocusManager.trackManualFocus(currentFieldName);
            
            const direction = event.shiftKey ? 'backward' : 'forward';
            const success = enhancedFocusManager.handleTabNavigation(direction);
            
            // Show save modal when reaching end of form
            if (!success && direction === 'forward' && isEditing) {
                setShowSaveModal(true);
            }
            
            return success;
        } catch (error) {
            console.warn('Tab navigation failed:', error.message);
            return false;
        }
    }, [isEditing]);
    
    /**
     * Save billing record
     */
    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Validate required fields
            if (!formData.customerName.trim()) {
                throw new Error('Customer name is required');
            }
            
            if (!formData.phoneNumber.trim()) {
                throw new Error('Phone number is required');
            }
            
            const response = await fetch(`/api/billing/from-booking/${bookingId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            announceToScreenReader('Billing record saved successfully');
            
            // Check authentication before navigation
            if (!isAuthenticated) {
                console.warn('User not authenticated, redirecting to login');
                navigate('/login');
                return;
            }
            
            // Navigate back to bookings or billing list
            navigate('/billing', { 
                state: { 
                    message: 'Billing record created successfully',
                    billingId: result.data.bl_id 
                }
            });
            
        } catch (error) {
            console.error('Error saving billing:', error);
            setError(error.message || 'Failed to save billing record');
        } finally {
            setLoading(false);
        }
    };
    
    /**
     * Handle save confirmation
     */
    const handleSaveConfirmed = async () => {
        setShowSaveModal(false);
        await handleSave();
    };
    
    /**
     * Handle save cancellation
     */
    const handleSaveCancel = useCallback(() => {
        setShowSaveModal(false);
        // Return focus to the last field (discount)
        setTimeout(() => {
            enhancedFocusManager.focusField('discount');
        }, 100);
    }, []);
    
    // Prevent manual billing creation - must come from booking
    if (!isFromBooking) {
        return (
            <div className="booking-layout">
                <div className="layout-header">
                    <div className="erp-panel-header">Billing - Access Denied</div>
                </div>
                <div className="layout-content-wrapper">
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <h3>Manual Billing Creation Not Allowed</h3>
                        <p>Billing records can only be created from confirmed bookings.</p>
                        <p>Please go to the Bookings page and select "Generate Bill" from a confirmed booking.</p>
                        <button 
                            className="erp-button erp-button-primary"
                            onClick={() => navigate('/bookings')}
                        >
                            Go to Bookings
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="booking-layout">
                <div className="layout-header">
                    <div className="erp-panel-header">Loading Billing Data...</div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="booking-layout">
            {/* Header */}
            <div className="layout-header">
                <div className="erp-menu-bar">
                    <div className="erp-menu-item">File</div>
                    <div className="erp-menu-item">Edit</div>
                    <div className="erp-menu-item">View</div>
                    <div className="erp-menu-item">Billing</div>
                    <div className="erp-menu-item">Reports</div>
                    <div className="erp-menu-item">Help</div>
                    <div className="erp-user-info">
                        USER: {user?.us_name?.toUpperCase() || 'UNKNOWN'}
                    </div>
                </div>
            </div>
            
            {/* Action Bar */}
            <div className="layout-action-bar">
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="erp-tool-button" title="New (Ctrl+N)" disabled>
                        New
                    </button>
                    <button 
                        className="erp-tool-button" 
                        title="Save (Ctrl+S)"
                        onClick={() => setShowSaveModal(true)}
                        disabled={!isEditing || loading}
                    >
                        Save
                    </button>
                    <button 
                        className="erp-tool-button" 
                        title="Cancel"
                        onClick={() => navigate('/bookings')}
                    >
                        Cancel
                    </button>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                    EDIT MODE | Records: 1
                </div>
            </div>
            
            {/* Main Content */}
            <div className="layout-content-wrapper">
                <div className="layout-main-column">
                    {/* Billing Form */}
                    <div className="layout-form-section">
                        <div className="erp-form-section section" style={{ width: '100%', overflowY: 'auto' }}>
                            <div className="erp-panel-header">Billing Details</div>
                            <div style={{ padding: '8px' }}>
                                
                                {/* Error Display */}
                                {error && (
                                    <div style={{ 
                                        background: '#ffebee', 
                                        border: '1px solid #f44336', 
                                        padding: '8px', 
                                        marginBottom: '8px',
                                        color: '#d32f2f',
                                        fontSize: '11px'
                                    }}>
                                        {error}
                                    </div>
                                )}
                                
                                {/* Entry No & Billing Date */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div className="field">
                                        <label className="label">Entry No</label>
                                        <input
                                            type="text"
                                            name="entryNo"
                                            className="erp-input"
                                            value={formData.entryNo}
                                            readOnly
                                            tabIndex={-1}
                                        />
                                    </div>
                                    <div className="field">
                                        <label className="label">Billing Date</label>
                                        <input
                                            type="date"
                                            name="billingDate"
                                            data-field="billingDate"
                                            className="erp-input"
                                            value={formData.billingDate}
                                            onChange={handleInputChange}
                                            onFocus={() => handleFieldFocus('billingDate')}
                                            onKeyDown={(e) => handleEnhancedTabNavigation(e, 'billingDate')}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                                
                                {/* Booking No & Bill No */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div className="field">
                                        <label className="label">Booking No</label>
                                        <input
                                            type="text"
                                            name="bookingNo"
                                            className="erp-input"
                                            value={formData.bookingNo}
                                            readOnly
                                            tabIndex={-1}
                                        />
                                    </div>
                                    <div className="field">
                                        <label className="label">Bill No</label>
                                        <input
                                            type="text"
                                            name="billNo"
                                            data-field="billNo"
                                            className="erp-input"
                                            value={formData.billNo}
                                            onChange={handleInputChange}
                                            onFocus={() => handleFieldFocus('billNo')}
                                            onKeyDown={(e) => handleEnhancedTabNavigation(e, 'billNo')}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                                
                                {/* Total Amount (READ-ONLY) */}
                                <div className="field" style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #ccc' }}>
                                    <label className="label" style={{ fontWeight: 'bold', fontSize: '12px' }}>
                                        Total Amount
                                    </label>
                                    <input
                                        type="number"
                                        name="totalAmount"
                                        className="erp-input"
                                        value={formData.totalAmount}
                                        readOnly
                                        tabIndex={-1}
                                        style={{ 
                                            fontWeight: 'bold', 
                                            fontSize: '14px',
                                            background: '#f0f0f0',
                                            color: '#000'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Save Confirmation Modal */}
            {showSaveModal && (
                <SaveConfirmationModal
                    isOpen={showSaveModal}
                    onConfirm={handleSaveConfirmed}
                    onCancel={handleSaveCancel}
                    title="Save Billing Record?"
                    message="Do you want to save this billing record?"
                />
            )}
        </div>
    );
};

export default BillingNew;