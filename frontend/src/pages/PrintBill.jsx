import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { billingAPI } from '../services/api';
import '../styles/print-bill.css';

const fmtDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const fmt = (value) => {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const PrintBill = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleClose = useCallback(() => {
    const returnTo = location.state?.returnTo;
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate('/billing');
    }
  }, [navigate, location.state]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await billingAPI.getPrintableBill(billId);
        if (response && response.data) {
          setPrintData(response.data);
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

  if (loading) return <div className="print-bill-state">Generating printable invoice...</div>;
  if (error || !printData) {
    return (
      <div className="print-bill-state">
        <div className="print-bill-error">
          <h1>System Error</h1>
          <p>{error || 'Unable to retrieve bill.'}</p>
          <button onClick={handleClose} className="btn-close">Back to Billing</button>
        </div>
      </div>
    );
  }

  const {
    company = {},
    bill = {},
    customer = {},
    booking = {},
    passengers = [],
    financials = {},
    gst = {},
    cancellation = {}
  } = printData || {};

  const isCancel = Boolean(cancellation?.isCancelled || bill.is_cancelled || bill.bl_status === 'CAN' || bill.status === 'CAN');

  const agencyName = (company.name || 'ANMOL TRAVELS').toUpperCase();
  const agencyAddress = company.address && company.address !== 'Address unavailable'
    ? company.address
    : '3173/32 Beadon Pura Karolbagh, Delhi-110005';
  const panNo = company.pan || 'BAZPC3421R';
  const gstinNo = company.gst && company.gst !== 'N/A' ? company.gst : '07BAZPC3421R2Z2';
  const stateCode = company.stateCode || '07';
  const stateName = (company.state || 'DELHI').toUpperCase();
  const sacCode = company.sacCode || '998555';

  const custName = (customer.name || bill.bl_customer_name || 'CUSTOMER').toUpperCase();
  const custAddr = customer.address && customer.address !== 'Address unavailable'
    ? customer.address
    : (customer.city ? `${customer.city}, ${customer.state || ''}` : 'NEW DELHI-110005 INDIA');
  const custStateCode = customer.stateCode || '07';
  const custState = (customer.state || 'DELHI').toUpperCase();
  const custGstin = customer.gstNo || 'Unregistered';
  const custPhone = customer.phone || bill.bl_customer_phone || '';

  const billNoVal = bill.billNumber || bill.bl_entry_no || bill.bl_bill_no || `BILL-${bill.bl_id}`;
  const billDateVal = fmtDate(bill.date || bill.bl_billing_date || bill.bl_date || new Date());
  const orderByVal = (booking.stationBoy || bill.stationBoy || 'STAFF').toUpperCase();
  const posVal = (customer.state || bill.placeOfSupply || 'DELHI').toUpperCase();

  const fromStn = (booking.fromStation || bill.bl_from_station || '').toUpperCase();
  const toStn = (booking.toStation || bill.bl_to_station || '').toUpperCase();
  const sectorStr = fromStn && toStn ? `${fromStn}-${toStn}` : (fromStn || toStn || '-');
  const jDateStr = fmtDate(booking.journeyDate || bill.bl_journey_date);
  const trainNoStr = booking.trainNumber || bill.bl_train_no || '-';
  const classStr = (booking.reservationClass || bill.bl_class || '3A').toUpperCase();
  const pnrStr = booking.pnr || bill.bl_pnr || '-';
  const statusStr = (bill.bl_pnrStatus || 'CNF').toUpperCase();

  const fareAmt = Number(financials.railwayFare || bill.bl_railway_fare || 0);
  const srvCharge = Number(financials.serviceCharges || bill.bl_service_charge || 0);
  const cancelCharge = Number(financials.cancellationCharges || bill.total_cancel_charges || 0);
  const gstAmt = Number(financials.gst || gst.igst || (gst.cgst * 2) || bill.bl_gst || 0);
  const totalAmt = Number(financials.total || bill.bl_total_amount || 0);
  const words = (financials.amountInWords || 'ZERO').toUpperCase();

  const paxList = passengers.length > 0
    ? passengers
    : [{ name: bill.bl_customer_name || 'Passenger 1', age: '41', gender: 'M' }];

  return (
    <div className="print-bill-page">
      <nav className="print-controls no-print">
        <div className="btn-group">
          <button onClick={handleDownloadPDF} disabled={downloading} className="btn-close">
            {downloading ? 'Processing...' : '💾 Download PDF'}
          </button>
          <button onClick={() => window.print()} className="btn-print">🖨️ Print Bill (Ctrl+P)</button>
          <button onClick={handleClose} className="btn-close">✕ Close</button>
        </div>
      </nav>

      <div className="print-bill-container">
        <div className="dot-matrix-bill-sheet">
          {/* Header */}
          <div className="dmb-header">
            <h2 className="dmb-doc-title">{isCancel ? 'CREDIT NOTE' : 'TAX INVOICE'}</h2>
            <h1 className="dmb-company-name">{agencyName}</h1>
            <p className="dmb-company-addr">{agencyAddress}</p>
            <p className="dmb-company-tax">PAN NO:{panNo}/GSTIN: {gstinNo}</p>
            <p className="dmb-company-tax">STATE CODE: {stateCode}({stateName})L/SAC CODE:{sacCode}</p>
          </div>

          <div className="dmb-divider"></div>

          {/* Meta 2-Columns */}
          <div className="dmb-meta-grid">
            <div className="dmb-meta-left">
              <p className="dmb-cust-name">M/S {custName}</p>
              <p className="dmb-cust-line">{custAddr}</p>
              <p className="dmb-cust-line">STATE CODE:{custStateCode}({custState})</p>
              <p className="dmb-cust-line">GSTIN:{custGstin}</p>
              {custPhone && <p className="dmb-cust-line">PH.{custPhone}</p>}
            </div>

            <div className="dmb-meta-right">
              <div className="dmb-row"><span className="dmb-lbl">{isCancel ? 'CREDIT NO.' : 'BILL NO.'}</span><span>: {billNoVal}{isCancel ? ' (C)' : ''}</span></div>
              <div className="dmb-row"><span className="dmb-lbl">DATE</span><span>: {billDateVal}</span></div>
              <div className="dmb-row"><span className="dmb-lbl">ORDER BY</span><span>: {orderByVal}</span></div>
              {isCancel && <div className="dmb-row"><span className="dmb-lbl">Agnst B.No.</span><span>: {bill.bl_original_bill_no || bill.originalBillNo || '-'}</span></div>}
              <div className="dmb-row"><span className="dmb-lbl">POS</span><span>: {posVal}</span></div>
              <div className="dmb-row"><span className="dmb-lbl">Doc No.</span><span>: {bill.specialId || '-'}</span></div>
            </div>
          </div>

          <div className="dmb-divider"></div>

          {/* Passengers & Ticket Particulars */}
          <div className="dmb-ticket-grid">
            <div className="dmb-pax-column">
              <table className="dmb-pax-table">
                <thead>
                  <tr>
                    <th style={{ width: '35px' }}>SNO</th>
                    <th>PASSENGER NAME</th>
                    <th style={{ width: '45px' }}>SEX</th>
                    <th style={{ width: '45px' }}>AGE</th>
                  </tr>
                </thead>
                <tbody>
                  {paxList.slice(0, 6).map((p, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{(p.name || '-').toUpperCase()}</td>
                      <td>{(p.gender || 'M').toUpperCase().substring(0, 1)}</td>
                      <td>{p.age || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dmb-particulars-column">
              <div className="dmb-part-header">TICKET PARTICULARS</div>
              <div className="dmb-part-body">
                <div className="dmb-row"><span className="dmb-lbl">SECTOR</span><span>: {sectorStr}</span></div>
                <div className="dmb-row"><span className="dmb-lbl">JOURNEY DATE</span><span>: {jDateStr}</span></div>
                <div className="dmb-row"><span className="dmb-lbl">TRAIN NO</span><span>: {trainNoStr}</span></div>
                <div className="dmb-row"><span className="dmb-lbl">CLASS</span><span>: {classStr}</span></div>
                <div className="dmb-row"><span className="dmb-lbl">P.N.R. NO.</span><span>: {pnrStr}</span></div>
                <div className="dmb-row"><span className="dmb-lbl">STATUS</span><span>: {statusStr}</span></div>
              </div>
            </div>
          </div>

          <div className="dmb-divider"></div>

          {/* Financials Breakdown */}
          <div className="dmb-fin-container">
            <div className="dmb-fin-box">
              {fareAmt > 0 && <div className="dmb-row"><span className="dmb-lbl">RAILWAY FARE</span><span className="dmb-val">: {fmt(fareAmt)}</span></div>}
              {isCancel && cancelCharge > 0 && <div className="dmb-row"><span className="dmb-lbl">RAIL CANCL.</span><span className="dmb-val">: {fmt(cancelCharge)}</span></div>}
              {srvCharge > 0 && <div className="dmb-row"><span className="dmb-lbl">SERV.CHARGE</span><span className="dmb-val">: {fmt(srvCharge)}</span></div>}
              {gstAmt > 0 && <div className="dmb-row"><span className="dmb-lbl">IGST 18%</span><span className="dmb-val">: {fmt(gstAmt)}</span></div>}
              <div className="dmb-row"><span className="dmb-lbl">ROUND_OFF</span><span className="dmb-val">: 0.00</span></div>
              <div className="dmb-divider-sub"></div>
              <div className="dmb-row dmb-total-row">
                <span className="dmb-lbl">{isCancel ? 'NET CR. IN A/C' : 'NET DR IN A/C'}</span>
                <span className="dmb-val">: {fmt(totalAmt)}</span>
              </div>
            </div>
          </div>

          <div className="dmb-divider"></div>

          {/* Amount In Words */}
          <div className="dmb-words-box">
            <span>TOTAL INDIAN RS. {words}</span>
          </div>

          <div className="dmb-divider"></div>

          {/* Footer Terms & Signatures */}
          <div className="dmb-footer-grid">
            <div className="dmb-jurisdiction">E & O.E. (Subject to Delhi Jurisdiction)</div>
            <div className="dmb-auth-sign">
              <p>for {agencyName}</p>
              <div className="dmb-sign-space"></div>
              <p>Auth. Signatory</p>
            </div>
          </div>

          <div className="dmb-terms-box">
            <p className="dmb-terms-title">TERMS & CONDITIONS :</p>
            <p>1. Printed official Receipt must be obtained against any cash payment of Bill.</p>
            <p>2. All cheques should be drawn in favour of '{agencyName}' and crossed 'A/c Payee Only'</p>
            <p>3. In case of Cheque Bounce will charge Rs.500/- Bank Charges</p>
            <p>4. Interest @ 24% per annum will be charged on all outstanding Bills after due date.</p>
            <p>5. Kindly check all ticket details carefully to avoid un-necessary complications.</p>
            <p>6. We are not responsible for any type of loss after the delivery of Ticket.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintBill;
