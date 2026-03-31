import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import { billingAPI } from '../services/api';
import '../styles/print-bill.css';

const PrintBill = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyType, setCopyType] = useState('both'); // 'customer', 'office', 'both'
  const [upiQr, setUpiQr] = useState('');
  const [gstQr, setGstQr] = useState('');
  const [downloading, setDownloading] = useState(false);

  const qrRefs = useRef({ upi: null, gst: null });

  const handleClose = useCallback(() => {
    const returnTo = location.state?.returnTo;
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate('/billing');
    }
  }, [navigate, location.state]);

  const generateQRs = async (data) => {
    if (!data) return;
    try {
      if (data.upi?.upiString) {
        const upiUrl = await QRCode.toDataURL(data.upi.upiString, { margin: 1, scale: 4 });
        setUpiQr(upiUrl);
      }

      if (data.company?.gst) {
        const gstString = `GSTIN:${data.company.gst},Inv:${data.bill?.billNumber},Amt:${data.financials?.total},Date:${data.bill?.date}`;
        const gstUrl = await QRCode.toDataURL(gstString, { margin: 1, scale: 4 });
        setGstQr(gstUrl);
      }
    } catch (err) {
      console.error('QR generation failed', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await billingAPI.getPrintableBill(billId);
        if (response && response.data) {
          setPrintData(response.data);
          await generateQRs(response.data);
        } else {
          throw new Error('Invalid bill data received from server');
        }
      } catch (err) {
        setError(err.message || 'Failed to load bill data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [billId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await billingAPI.downloadBillPDF(billId, printData?.bill?.billNumber);
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="print-bill-state">Generating professional invoice...</div>;
  if (error || !printData) {
    return (
      <div className="print-bill-state">
        <div className="print-bill-error">
          <h1>System Error</h1>
          <p>{error || 'Unable to retrieve tax invoice.'}</p>
          <button onClick={handleClose} className="btn-close">Back to Billing</button>
        </div>
      </div>
    );
  }

  const renderInvoiceSheet = (type) => {
    const isOffice = type === 'office';
    const { 
      company = {}, 
      bill = {}, 
      customer = {}, 
      booking = {}, 
      passengers = [], 
      financials = {}, 
      gst = {}, 
      signature = {}, 
      irn = {}, 
      cancellation = {}, 
      audit = {}, 
      jespr = {} 
    } = printData || {};

    return (
      <div className={`print-bill-sheet ${isOffice ? 'office-copy' : 'customer-copy'}`}>
        {/* Watermark */}
        <div className={`watermark ${cancellation?.isCancelled ? 'cancelled' : ''}`}>
          {cancellation?.isCancelled ? 'CANCELLED' : (company?.name?.toUpperCase() || 'ANMOL TRAVELS')}
        </div>

        {/* Header */}
        <header className="bill-header">
          <div className="company-info">
            <div className="logo-placeholder" style={{ marginBottom: '10px' }}>
              <img src="/assets/logo.png" alt="" style={{ height: '50px', display: 'block' }} 
                   onError={(e) => e.target.style.display = 'none'} />
              <h1 style={{fontSize: '24px', letterSpacing: '1px'}}>{company?.name || 'Anmol Travels'}</h1>
            </div>
            <p>{company?.address}</p>
            <p><strong>GSTIN:</strong> {company?.gst} | <strong>State:</strong> {company?.state} ({company?.stateCode})</p>
          </div>
          <div className="invoice-title">
            <h2>TAX INVOICE</h2>
            <div className="copy-type">{isOffice ? 'Office Copy' : 'Customer Copy'}</div>
          </div>
        </header>

        {/* Details Grid */}
        <div className="details-grid">
          <div className="details-box">
            <h3>Invoice Details</h3>
            <div className="details-row"><label>Invoice No:</label> <span>{bill?.billNumber}</span></div>
            <div className="details-row"><label>Date:</label> <span>{bill?.date ? new Date(bill.date).toLocaleDateString('en-IN') : 'N/A'}</span></div>
            <div className="details-row"><label>Place of Supply:</label> <span>{bill?.placeOfSupply}</span></div>
            <div className="details-row"><label>Reverse Charge:</label> <span>{bill?.reverseCharge}</span></div>
          </div>
          <div className="details-box customer-info">
            <h3>Bill To (Customer)</h3>
            <p><strong>{customer?.name}</strong></p>
            <p style={{ fontSize: '11px', color: '#666' }}>{customer?.address}</p>
            <div className="details-row" style={{ marginTop: '5px' }}><label>GSTIN:</label> <span>{customer?.gstNo}</span></div>
            <div className="details-row"><label>State:</label> <span>{customer?.state}</span></div>
          </div>
        </div>

        {/* Service Table */}
        <div className="bill-table-section">
          <table className="bill-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Description of Service</th>
                <th>SAC</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Travel Booking Service</strong><br/>
                  <small style={{ color: '#666' }}>{booking?.travelDetails} | JDate: {booking?.journeyDate ? new Date(booking.journeyDate).toLocaleDateString('en-IN') : 'N/A'}</small>
                </td>
                <td>998551</td>
                <td>1.00</td>
                <td className="text-right">{(financials?.baseAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="text-right">{(financials?.baseAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Passengers */}
        <div className="bill-table-section">
          <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#777', margin: '0 0 5px 0' }}>Passengers</h4>
          <table className="bill-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Passenger Name</th>
                <th>Age/Sex</th>
                <th>Coach/Seat</th>
                <th>PNR</th>
              </tr>
            </thead>
            <tbody>
              {passengers && passengers.length > 0 ? passengers.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.age}/{p.gender}</td>
                  <td>{p.coach}/{p.seatNo}</td>
                  <td>{booking?.pnr}</td>
                </tr>
              )) : (
                <tr><td colSpan="5">No passenger list available</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals & Tax */}
        <div className="totals-section">
          <div className="amount-words">
            <p>Amount in Words:</p>
            <p>{financials?.amountInWords}</p>
            
            {/* JESPR Context */}
            {jespr?.sales && (
              <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #EEE', borderRadius: '4px' }}>
                <h5 style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#999' }}>JESPR ACCOUNTING CONTEXT</h5>
                <p style={{ fontSize: '9px', margin: '2px 0' }}><strong>Sales Ref:</strong> {jespr.sales.entryNo}</p>
                <p style={{ fontSize: '9px', margin: '2px 0' }}><strong>Linked Receipts:</strong> {jespr.receipts?.map(r => r.receiptNo).join(', ') || 'NONE'}</p>
              </div>
            )}
          </div>
          <div>
            <div className="totals-table">
              <div className="total-row"><label>Taxable Value</label> <span>{(financials?.baseAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              {gst?.isIntraState ? (
                <>
                  <div className="total-row"><label>CGST (9%)</label> <span>{(gst.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="total-row"><label>SGST (9%)</label> <span>{(gst.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                </>
              ) : (
                <div className="total-row"><label>IGST (18%)</label> <span>{(gst?.igst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              )}
              <div className="total-row grand-total"><label>Total Invoice Value</label> <span>{(financials?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              <div className="total-row" style={{ color: '#27ae60', fontWeight: 'bold' }}><label>Amount Paid</label> <span>{(financials?.paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              <div className="total-row" style={{ color: (financials?.balance || 0) > 0 ? '#e74c3c' : '#27ae60' }}><label>Balance Due</label> <span>{(financials?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            </div>
          </div>
        </div>

        {/* IRN Section */}
        {irn?.irn && (
          <div style={{ background: '#F9F9F9', border: '1px solid #DDD', padding: '10px', marginBottom: '20px', fontSize: '10px' }}>
            <p><strong>IRN:</strong> {irn.irn}</p>
            <p><strong>Ack No:</strong> {irn.ackNo} | <strong>Date:</strong> {irn.ackDate}</p>
          </div>
        )}

        {/* Footer Grid */}
        <footer className="footer-grid">
          <div className="qr-codes">
            {upiQr && (
              <div className="qr-item">
                <img src={upiQr} alt="UPI QR" />
                <p>Scan to Pay (UPI)</p>
              </div>
            )}
            {gstQr && (
              <div className="qr-item">
                <img src={gstQr} alt="GST QR" />
                <p>Verify Invoice</p>
              </div>
            )}
          </div>
          <div className="signature-section">
            <p>For {company?.name || 'Anmol Travels'}</p>
            <div className="sig-space"></div>
            <p>Authorised Signatory</p>
            {signature?.hash && (
              <div className="digital-sig-info">
                Digitally Signed Hash: {signature.hash.substring(0, 32)}...<br/>
                Signed On: {signature.signedOn ? new Date(signature.signedOn).toLocaleString('en-IN') : 'N/A'}
              </div>
            )}
          </div>
        </footer>

        <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px solid #EEE', paddingTop: '10px', fontSize: '9px', color: '#999' }}>
          E. & O.E. | This is a computer-generated tax invoice and does not require a physical signature.
        </div>
      </div>
    );
  };

  return (
    <div className="print-bill-page">
      <nav className="print-controls">
        <div className="copy-selector">
          <label>Select Copy Type:</label>
          <select value={copyType} onChange={(e) => setCopyType(e.target.value)}>
            <option value="customer">Customer Copy Only</option>
            <option value="office">Office Copy Only</option>
            <option value="both">Both (Multi-Copy)</option>
          </select>
        </div>
        <div className="btn-group">
          <button onClick={handleDownloadPDF} disabled={downloading} className="btn-close">
            {downloading ? 'Processing...' : 'Download PDF'}
          </button>
          <button onClick={() => window.print()} className="btn-print">Print Invoice (Ctrl+P)</button>
          <button onClick={handleClose} className="btn-close">✕ Close</button>
        </div>
      </nav>

      <div className="print-bill-container">
        {(copyType === 'customer' || copyType === 'both') && renderInvoiceSheet('customer')}
        {copyType === 'both' && <div className="page-break"></div>}
        {(copyType === 'office' || copyType === 'both') && renderInvoiceSheet('office')}
      </div>
    </div>
  );
};

export default PrintBill;
