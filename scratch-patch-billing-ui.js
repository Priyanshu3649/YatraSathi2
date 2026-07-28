const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Billing.jsx', 'utf8');

// 1. Imports
if (!code.includes('SplitBillDialog')) {
  code = code.replace(
    "import SaveConfirmationModal from '../components/common/SaveConfirmationModal';",
    "import SaveConfirmationModal from '../components/common/SaveConfirmationModal';\nimport SplitBillDialog from '../components/Billing/Dialogs/SplitBillDialog';\nimport CancelBillDialog from '../components/Billing/Dialogs/CancelBillDialog';"
  );
}

// 2. State definitions
if (!code.includes('showSplitModal')) {
  code = code.replace(
    "const [showCancelModal, setShowCancelModal] = useState(false);",
    "const [showCancelModal, setShowCancelModal] = useState(false);\n  const [showSplitModal, setShowSplitModal] = useState(false);"
  );
}
if (!code.includes('specialId:')) {
  code = code.replace(
    "subBillNo: '',",
    "subBillNo: '',\n    specialId: '',"
  );
}
if (!code.includes('bill.bl_special_id')) {
  code = code.replace(
    "subBillNo: bill.bl_sub_bill_no || bill.subBillNo || '',",
    "subBillNo: bill.bl_sub_bill_no || bill.subBillNo || '',\n        specialId: bill.bl_special_id || bill.specialId || '',"
  );
  code = code.replace(
    "subBillNo: billData.subBillNo || '',",
    "subBillNo: billData.subBillNo || '',\n        specialId: billData.specialId || '',"
  );
}

// 3. Handlers
const handlersCode = `
  const handleFetchBooking = async () => {
    if (!formData.pnrNumbers && !formData.bookingId) {
      toast.error('Please enter a PNR number or Booking ID to fetch data');
      return;
    }
    
    try {
      const id = formData.pnrNumbers || formData.bookingId;
      const data = await billingAPI.fetchBookingForBilling(id);
      
      setFormData(prev => ({
        ...prev,
        bookingId: data.bl_booking_id,
        pnrNumbers: data.bl_pnr,
        customerName: data.bl_customer_name || prev.customerName,
        phoneNumber: data.bl_customer_phone || prev.phoneNumber,
        fromStation: data.bl_from_station || prev.fromStation,
        toStation: data.bl_to_station || prev.toStation,
        trainNumber: data.bl_train_no || prev.trainNumber,
        reservationClass: data.bl_class || prev.reservationClass,
        journeyDate: data.bl_journey_date || prev.journeyDate
      }));
      toast.success('Booking data fetched successfully');
    } catch (error) {
      console.error('Fetch booking error:', error);
      toast.error(error.message || 'Failed to fetch booking data');
    }
  };

  const handleSplitBillConfirm = async (splits) => {
    try {
      await billingAPI.splitBill(selectedBill.bl_id || selectedBill.id, splits);
      toast.success('Bill split successfully');
      setShowSplitModal(false);
      fetchBills();
      setSelectedBill(null);
      setShowForm(false);
    } catch (error) {
      toast.error(error.message || 'Failed to split bill');
    }
  };

  const handleCancelBillConfirm = async (cancelData) => {
    try {
      await billingAPI.cancelBill(selectedBill.bl_id || selectedBill.id, cancelData);
      toast.success('Bill cancelled successfully');
      setShowCancelModal(false);
      fetchBills();
      setSelectedBill(null);
      setShowForm(false);
    } catch (error) {
      toast.error(error.message || 'Failed to cancel bill');
    }
  };

  const handleDeleteBill = async () => {
    if (!selectedBill) return;
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await billingAPI.deleteBill(selectedBill.bl_id || selectedBill.id);
        toast.success('Bill deleted successfully');
        fetchBills();
        setSelectedBill(null);
        setShowForm(false);
      } catch (error) {
        toast.error(error.message || 'Failed to delete bill');
      }
    }
  };
`;

if (!code.includes('handleFetchBooking')) {
  code = code.replace('const handleCancelBill = async () => {', handlersCode + '\n  const handleCancelBill = async () => {');
}

// 4. Update existing handleCancelBill and handleMergeBills and handleSplitBill
code = code.replace(/const handleCancelBill = async \(\) => \{[\s\S]*?catch \(error\) \{[\s\S]*?\}[\s\S]*?\};/, 
  `const handleCancelBill = async () => {
    setShowCancelModal(true);
  };`);

code = code.replace(/const handleSplitBill = async \(\) => \{[\s\S]*?toast\.error\('Split implementation coming soon'\);[\s\S]*?\};/,
  `const handleSplitBill = () => {
    setShowSplitModal(true);
  };`);

code = code.replace(/const handleMergeBills = async \(\) => \{[\s\S]*?console\.log\('Merging bills:', selectedBillIdsForMerge\);[\s\S]*?setSelectedBillIdsForMerge\(\[\]\);[\s\S]*?\};/,
  `const handleMergeBills = async () => {
    if (selectedBillIdsForMerge.length < 2) {
      toast.error('Please select at least 2 bills to merge');
      return;
    }
    try {
      await billingAPI.mergeBills(selectedBillIdsForMerge);
      toast.success('Bills merged successfully');
      setSelectedBillIdsForMerge([]);
      fetchBills();
    } catch (error) {
      toast.error(error.message || 'Failed to merge bills');
    }
  };`);

// 5. Add UI Buttons
const toolbarButtons = `
        <button className="erp-button" onClick={handleSplitBill} title="Split Bill" disabled={!selectedBill || selectedBill.bl_is_split || selectedBill.bl_status === 'CANCELLED'}>Split</button>
        <button className="erp-button" onClick={handleDeleteBill} title="Delete Bill" disabled={!selectedBill || selectedBill.bl_status === 'CANCELLED'} style={{ background: '#d32f2f', color: '#fff' }}>Delete</button>
`;
if (!code.includes('Split Bill" disabled')) {
  code = code.replace(
    '<button className="erp-button" onClick={handleMergeBills} title="Merge Bills">Merge</button>',
    `<button className="erp-button" onClick={handleMergeBills} title="Merge Bills">Merge</button>\n${toolbarButtons}`
  );
}

// 6. Form Fields
// PNR + Fetch Data
const fetchBtnStr = `
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="erp-form-label required">PNR Number(s)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    name="pnrNumbers" 
                    className="erp-input" 
                    value={formData.pnrNumbers || ''} 
                    onChange={(e) => setFormData({...formData, pnrNumbers: e.target.value})}
                    disabled={!isEditing}
                    tabIndex={2}
                    placeholder="Enter PNR"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleFetchBooking} disabled={!isEditing} style={{ padding: '0 12px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Fetch
                  </button>
                </div>
              </div>`;

code = code.replace(/<label className="erp-form-label required">PNR Number\(s\)<\/label>[\s\S]*?<\/div>\s*\{\/\* Row 4/m, 
  `${fetchBtnStr}\n            </div>\n            \n            {/* Row 4`);

// Add Special ID to Row 1
code = code.replace(
  '<label className="erp-form-label">Sub Bill No</label>',
  '<label className="erp-form-label">Special ID</label>\n              <input \n                type="text" \n                name="specialId" \n                className="erp-input" \n                value={formData.specialId || \'\'} \n                onChange={(e) => setFormData({...formData, specialId: e.target.value})}\n                disabled={!isEditing}\n              />\n              <label className="erp-form-label">Sub Bill No</label>'
);

// 7. Modals rendering
const modalsToRender = `
        {showSplitModal && selectedBill && (
          <SplitBillDialog 
            bill={selectedBill} 
            onClose={() => setShowSplitModal(false)} 
            onConfirm={handleSplitBillConfirm} 
          />
        )}
        {showCancelModal && selectedBill && (
          <CancelBillDialog 
            bill={selectedBill} 
            onClose={() => setShowCancelModal(false)} 
            onConfirm={handleCancelBillConfirm} 
          />
        )}
`;

if (!code.includes('<SplitBillDialog')) {
  code = code.replace(
    '{showSaveModal && (',
    `${modalsToRender}\n        {showSaveModal && (`
  );
}

fs.writeFileSync('frontend/src/pages/Billing.jsx', code);
