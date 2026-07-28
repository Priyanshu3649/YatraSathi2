const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Billing.jsx', 'utf8');

const handlersCode = `  const handleFetchBooking = async () => {
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

const searchStr = '  return (\n    <div className="erp-admin-container booking-layout">';
const replaceIndex = code.indexOf(searchStr);

if (replaceIndex !== -1) {
  code = code.substring(0, replaceIndex) + handlersCode + '\n' + code.substring(replaceIndex);
  fs.writeFileSync('frontend/src/pages/Billing.jsx', code);
  console.log("Handlers successfully injected before the main return statement.");
} else {
  console.log("Could not find the main return statement.");
}
