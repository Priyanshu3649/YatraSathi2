import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { billingAPI } from '../services/api';
import '../styles/print-bill.css';

const formatCurrency = (value) => {
  const amount = Number.parseFloat(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const PrintBill = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const handleClose = useCallback(() => {
    const returnTo = location.state?.returnTo;
    if (typeof returnTo === 'string' && returnTo.length > 0) {
      navigate(returnTo);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/billing');
  }, [navigate, location.state]);

  useEffect(() => {
    let isMounted = true;

    const loadBill = async () => {
      try {
        setLoading(true);
        const response = await billingAPI.getPrintableBill(billId);
        if (isMounted) {
          setPrintData(response.data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Failed to load printable bill');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBill();

    return () => {
      isMounted = false;
    };
  }, [billId]);

  useEffect(() => {
    if (!printData) {
      return undefined;
    }

    document.title = `Bill ${printData.bill.billNumber}`;
    return undefined;
  }, [printData]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        window.print();
      }

      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      await billingAPI.downloadBillPDF(billId, printData?.bill?.billNumber);
    } catch (err) {
      setDownloadError(err.message || 'PDF download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="print-bill-state">Preparing print document...</div>;
  }

  if (error || !printData) {
    return (
      <div className="print-bill-state print-bill-error">
        <h1>Bill not available</h1>
        <p>{error || 'The printable bill could not be generated.'}</p>
        <div className="print-bill-actions no-print" style={{ marginTop: '16px' }}>
          <button type="button" onClick={handleClose}>Back</button>
        </div>
      </div>
    );
  }

  const { company, bill, customer, booking, passengers, financials, cancellation, audit, jespr } = printData;

  return (
    <div className="print-bill-page">
      {cancellation.isCancelled ? <div className="print-bill-watermark">CANCELLED</div> : null}

      <div className="print-bill-actions no-print">
        <button
          type="button"
          className="print-bill-btn print-bill-btn-download"
          onClick={handleDownloadPDF}
          disabled={downloading}
          title="Download bill as PDF (Ctrl+D)"
        >
          {downloading ? '⏳ Generating PDF…' : '⬇ Download PDF'}
        </button>
        <button
          type="button"
          className="print-bill-btn"
          onClick={() => window.print()}
          title="Print bill (Ctrl+P)"
        >
          🖨 Print
        </button>
        <button
          type="button"
          className="print-bill-btn print-bill-btn-close"
          onClick={handleClose}
        >
          ✕ Close
        </button>
      </div>

      {downloadError && (
        <div className="print-bill-download-error no-print">
          ⚠ {downloadError}
        </div>
      )}

      <article className="print-bill-sheet">
        <header className="print-bill-header">
          <div>
            <p className="print-bill-kicker">Tax Invoice</p>
            <h1>{company.name}</h1>
            <p>{company.address}</p>
            <p>Phone: {company.phone} | GST: {company.gst}</p>
          </div>
          <div className="print-bill-meta">
            <div><span>Bill No</span><strong>{bill.billNumber}</strong></div>
            <div><span>Bill ID</span><strong>{bill.billId}</strong></div>
            <div><span>Date</span><strong>{formatDate(bill.date)}</strong></div>
            <div><span>Status</span><strong>{bill.status}</strong></div>
          </div>
        </header>

        <section className="print-bill-grid">
          <div className="print-bill-card">
            <h2>Customer</h2>
            <p><strong>{customer.name}</strong></p>
            <p>{customer.phone || 'N/A'}</p>
          </div>
          <div className="print-bill-card">
            <h2>Booking</h2>
            <p>Booking ID: {booking.bookingId || 'N/A'}</p>
            <p>Booking No: {booking.bookingNumber || 'N/A'}</p>
            <p>{booking.travelDetails || 'Travel details unavailable'}</p>
            <p>Journey: {formatDate(booking.journeyDate)}</p>
            <p>Train: {booking.trainNumber || 'N/A'} | Class: {booking.reservationClass || 'N/A'}</p>
          </div>
        </section>

        <section className="print-bill-section">
          <div className="print-bill-section-title">
            <h2>Passengers</h2>
            <span>{passengers.length} traveller(s)</span>
          </div>
          <table className="print-bill-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Coach</th>
                <th>Seat</th>
                <th>Berth</th>
              </tr>
            </thead>
            <tbody>
              {passengers.length > 0 ? passengers.map((passenger, index) => (
                <tr key={passenger.id || `${passenger.name}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{passenger.name}</td>
                  <td>{passenger.age}</td>
                  <td>{passenger.gender}</td>
                  <td>{passenger.coach}</td>
                  <td>{passenger.seatNo}</td>
                  <td>{passenger.berth}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="print-bill-empty">No passenger data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="print-bill-section print-bill-break-avoid">
          <div className="print-bill-section-title">
            <h2>Charges</h2>
          </div>
          <div className="print-bill-summary">
            <div><span>Base Amount</span><strong>{formatCurrency(financials.baseAmount)}</strong></div>
            <div><span>Tax</span><strong>{formatCurrency(financials.tax)}</strong></div>
            <div><span>Total</span><strong>{formatCurrency(financials.total)}</strong></div>
            <div><span>Paid</span><strong>{formatCurrency(financials.paid)}</strong></div>
            <div><span>Balance</span><strong>{formatCurrency(financials.balance)}</strong></div>
            {cancellation.isCancelled ? (
              <>
                <div><span>Cancellation Charges</span><strong>{formatCurrency(cancellation.charges)}</strong></div>
                <div><span>Refund Amount</span><strong>{formatCurrency(cancellation.refundAmount)}</strong></div>
              </>
            ) : null}
          </div>
        </section>

        <section className="print-bill-section">
          <div className="print-bill-section-title">
            <h2>JESPR</h2>
          </div>

          <div className="print-bill-jespr-block print-bill-break-avoid">
            <h3>Sales Entry</h3>
            <div className="print-bill-summary compact">
              <div><span>Entry No</span><strong>{jespr.sales.entryNo}</strong></div>
              <div><span>Date</span><strong>{formatDate(jespr.sales.date)}</strong></div>
              <div><span>Account</span><strong>{jespr.sales.account}</strong></div>
              <div><span>Amount</span><strong>{formatCurrency(jespr.sales.amount)}</strong></div>
            </div>
            <p className="print-bill-note">{jespr.sales.narration}</p>
          </div>

          <div className="print-bill-jespr-block">
            <h3>Receipts</h3>
            <table className="print-bill-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Reference</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {jespr.receipts.length > 0 ? jespr.receipts.map((receipt) => (
                  <tr key={receipt.receiptNo}>
                    <td>{receipt.receiptNo}</td>
                    <td>{formatDate(receipt.date)}</td>
                    <td>{receipt.mode}</td>
                    <td>{receipt.reference || '-'}</td>
                    <td>{formatCurrency(receipt.amount)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="print-bill-empty">No linked receipts found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="print-bill-jespr-block">
            <h3>Journal Entries</h3>
            <table className="print-bill-table">
              <thead>
                <tr>
                  <th>Entry No</th>
                  <th>Date</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {jespr.journal.length > 0 ? jespr.journal.map((entry) => (
                  <tr key={entry.entryNo}>
                    <td>{entry.entryNo}</td>
                    <td>{formatDate(entry.date)}</td>
                    <td>{entry.account}</td>
                    <td>{entry.type}</td>
                    <td>{formatCurrency(entry.amount)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="print-bill-empty">No journal adjustments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="print-bill-section print-bill-break-avoid">
          <div className="print-bill-section-title">
            <h2>Audit</h2>
          </div>
          <div className="print-bill-summary compact">
            <div><span>Entered By</span><strong>{audit.enteredBy || 'N/A'}</strong></div>
            <div><span>Entered On</span><strong>{formatDate(audit.enteredOn)}</strong></div>
            <div><span>Modified By</span><strong>{audit.modifiedBy || 'N/A'}</strong></div>
            <div><span>Modified On</span><strong>{formatDate(audit.modifiedOn)}</strong></div>
            <div><span>Closed By</span><strong>{audit.closedBy || 'N/A'}</strong></div>
            <div><span>Closed On</span><strong>{formatDate(audit.closedOn)}</strong></div>
          </div>
        </section>

        
        <div className="print-bill-signatures print-bill-break-avoid">
          <div className="print-bill-signature-box">
            <p>Customer Signature</p>
          </div>
          <div className="print-bill-signature-box">
            <p>Authorized Signatory</p>
            <p className="print-bill-company-name">{company.name}</p>
          </div>
        </div>

        <footer className="print-bill-footer">
          <p>E.& O.E. | This is a computer-generated tax invoice and does not require a physical signature.</p>
          <p>Generated on {new Date().toLocaleString('en-IN')}</p>
        </footer>

      </article>
    </div>
  );
};

export default PrintBill;
