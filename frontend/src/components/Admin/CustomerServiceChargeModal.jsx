import React, { useState, useEffect, useRef } from 'react';
import { serviceChargeAPI } from '../../services/api';
import './CustomerServiceChargeModal.css';

const CLASSES = ['1AC', '2AC', '3AC', 'EC', 'CC', 'FC', 'SL', '2S'];

const emptyRow = () => ({
  type: 'FLAT',
  pax: [0, 0, 0, 0, 0, 0]
});

const generateEmptyMatrix = () => {
  const reservation = {};
  const cancellation = {};
  CLASSES.forEach(cls => {
    reservation[cls] = emptyRow();
    cancellation[cls] = emptyRow();
  });
  return {
    reservation,
    cancellation,
    remarks: '',
    deliveryCharge: 0
  };
};

const CustomerServiceChargeModal = ({ isOpen, onClose, customerId, customerName, customerNo }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [headerData, setHeaderData] = useState({
    customerNo: customerNo || '',
    customerName: customerName || '',
    remarks: '',
    deliveryCharge: 0
  });

  const [matrix, setMatrix] = useState(generateEmptyMatrix());
  const modalRef = useRef(null);

  // Load customer service charges when modal opens
  useEffect(() => {
    if (!isOpen || !customerId) return;

    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await serviceChargeAPI.getCustomerConfig(customerId);
        if (res.success && res.data) {
          setHeaderData({
            customerNo: res.data.customerNo || customerNo || customerId || '',
            customerName: res.data.customerName || customerName || '',
            remarks: res.data.config?.remarks || '',
            deliveryCharge: res.data.config?.deliveryCharge || 0
          });

          if (res.data.config) {
            const rawConfig = res.data.config;
            const newMatrix = generateEmptyMatrix();

            ['reservation', 'cancellation'].forEach(typeKey => {
              if (rawConfig[typeKey]) {
                CLASSES.forEach(cls => {
                  if (rawConfig[typeKey][cls]) {
                    newMatrix[typeKey][cls] = {
                      type: rawConfig[typeKey][cls].type || 'FLAT',
                      pax: Array.isArray(rawConfig[typeKey][cls].pax)
                        ? [...rawConfig[typeKey][cls].pax]
                        : [0, 0, 0, 0, 0, 0]
                    };
                    while (newMatrix[typeKey][cls].pax.length < 6) {
                      newMatrix[typeKey][cls].pax.push(0);
                    }
                  }
                });
              }
            });

            newMatrix.remarks = rawConfig.remarks || '';
            newMatrix.deliveryCharge = rawConfig.deliveryCharge || 0;
            setMatrix(newMatrix);
          }
        }
      } catch (err) {
        console.error('Failed to load service charge config:', err);
        setError(err.message || 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [isOpen, customerId, customerNo, customerName]);

  // Handle global shortcuts (Escape, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, matrix, headerData]);

  const handleCellChange = (section, cls, paxIndex, value) => {
    const numVal = value === '' ? '' : parseFloat(value) || 0;
    setMatrix(prev => {
      const nextPax = [...prev[section][cls].pax];
      nextPax[paxIndex] = numVal;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [cls]: {
            ...prev[section][cls],
            pax: nextPax
          }
        }
      };
    });
  };

  const handleTypeChange = (section, cls, type) => {
    setMatrix(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [cls]: {
          ...prev[section][cls],
          type
        }
      }
    }));
  };

  // Row fill: replicates the first non-zero/non-empty value across all 6 columns of this row
  const handleFillRow = (section, cls) => {
    const rawRow = matrix[section][cls].pax;
    let fillVal = 0;
    for (let i = 0; i < 6; i++) {
      const v = rawRow[i];
      if (v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) && Number(v) !== 0) {
        fillVal = Number(v);
        break;
      }
    }
    if (fillVal === 0 && rawRow[0] !== '' && rawRow[0] !== null && rawRow[0] !== undefined) {
      fillVal = Number(rawRow[0]) || 0;
    }

    setMatrix(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [cls]: {
          ...prev[section][cls],
          pax: [fillVal, fillVal, fillVal, fillVal, fillVal, fillVal]
        }
      }
    }));
  };

  // Column fill: replicates the column's value down all 8 classes
  const handleFillColumn = (section, colIdx) => {
    let fillVal = 0;
    for (const c of CLASSES) {
      const v = matrix[section][c].pax[colIdx];
      if (v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) && Number(v) !== 0) {
        fillVal = Number(v);
        break;
      }
    }
    if (fillVal === 0) {
      const topV = matrix[section][CLASSES[0]].pax[colIdx];
      if (topV !== '' && topV !== null && topV !== undefined) {
        fillVal = Number(topV) || 0;
      }
    }

    setMatrix(prev => {
      const updated = { ...prev[section] };
      CLASSES.forEach(cls => {
        const nextPax = [...updated[cls].pax];
        nextPax[colIdx] = fillVal;
        updated[cls] = { ...updated[cls], pax: nextPax };
      });
      return { ...prev, [section]: updated };
    });
  };

  const handleCopyReservationToCancellation = () => {
    setMatrix(prev => ({
      ...prev,
      cancellation: JSON.parse(JSON.stringify(prev.reservation))
    }));
    setSuccess('Copied Reservation charges to Cancellation charges');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSetAllClassType = (section, type) => {
    setMatrix(prev => {
      const updated = { ...prev[section] };
      CLASSES.forEach(cls => {
        updated[cls] = { ...updated[cls], type };
      });
      return { ...prev, [section]: updated };
    });
  };

  // Grid Keyboard / Tab Navigation
  const handleGridKeyDown = (e, section, clsIdx, paxIdx) => {
    const isShift = e.shiftKey;

    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      if (!isShift) {
        // Move forward
        if (paxIdx < 5) {
          focusCell(section, clsIdx, paxIdx + 1);
        } else if (clsIdx < CLASSES.length - 1) {
          focusCell(section, clsIdx + 1, 0);
        } else if (section === 'reservation') {
          focusCell('cancellation', 0, 0);
        } else {
          document.getElementById('sc-btn-save-main')?.focus();
        }
      } else {
        // Move backward (Shift+Tab)
        if (paxIdx > 0) {
          focusCell(section, clsIdx, paxIdx - 1);
        } else if (clsIdx > 0) {
          focusCell(section, clsIdx - 1, 5);
        } else if (section === 'cancellation') {
          focusCell('reservation', CLASSES.length - 1, 5);
        } else {
          document.getElementById('sc-delivery-charge-input')?.focus();
        }
      }
    } else if (e.key === 'ArrowRight') {
      if (e.target.selectionStart === e.target.value.length || e.target.value === '') {
        if (paxIdx < 5) {
          e.preventDefault();
          focusCell(section, clsIdx, paxIdx + 1);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      if (e.target.selectionStart === 0 || e.target.value === '') {
        if (paxIdx > 0) {
          e.preventDefault();
          focusCell(section, clsIdx, paxIdx - 1);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (clsIdx < CLASSES.length - 1) {
        focusCell(section, clsIdx + 1, paxIdx);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (clsIdx > 0) {
        focusCell(section, clsIdx - 1, paxIdx);
      }
    }
  };

  const focusCell = (section, clsIdx, paxIdx) => {
    const el = document.getElementById(`sc-cell-${section}-${clsIdx}-${paxIdx}`);
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payloadConfig = {
        reservation: {},
        cancellation: {},
        remarks: headerData.remarks,
        deliveryCharge: parseFloat(headerData.deliveryCharge) || 0
      };

      ['reservation', 'cancellation'].forEach(section => {
        CLASSES.forEach(cls => {
          const row = matrix[section][cls];
          payloadConfig[section][cls] = {
            type: row.type || 'FLAT',
            pax: row.pax.map(p => parseFloat(p) || 0)
          };
        });
      });

      const res = await serviceChargeAPI.saveCustomerConfig(customerId, payloadConfig);
      if (res.success) {
        setSuccess('✅ Service charges saved permanently in database!');
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to save service charges:', err);
      setError(err.message || 'Failed to save service charges');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const renderTable = (section, title, themeClass) => (
    <div className={`sc-table-card ${themeClass}`}>
      <div className="sc-card-header">
        <span className="sc-card-title">{title}</span>
        <div className="sc-quick-type">
          <span className="sc-quick-label">Set All:</span>
          <button
            type="button"
            className="sc-pill-btn"
            onClick={() => handleSetAllClassType(section, 'FLAT')}
          >
            FLAT
          </button>
          <button
            type="button"
            className="sc-pill-btn"
            onClick={() => handleSetAllClassType(section, 'PERCENTAGE')}
          >
            % (Percent)
          </button>
        </div>
      </div>

      <div className="sc-table-responsive">
        <table className="sc-erp-table">
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '12.33%' }} />
            <col style={{ width: '12.33%' }} />
            <col style={{ width: '12.33%' }} />
            <col style={{ width: '12.33%' }} />
            <col style={{ width: '12.33%' }} />
            <col style={{ width: '12.33%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>TYPE</th>
              <th>CLASS</th>
              {[0, 1, 2, 3, 4, 5].map((paxIdx) => (
                <th key={paxIdx}>
                  <div className="sc-th-header-cell">
                    <span>CHRG {paxIdx + 1}</span>
                    <button
                      type="button"
                      className="sc-col-fill-btn"
                      title={`Copy value down entire column for Chrg ${paxIdx + 1}`}
                      onClick={() => handleFillColumn(section, paxIdx)}
                    >
                      ⬇️
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLASSES.map((cls, clsIdx) => {
              const rowData = matrix[section]?.[cls] || emptyRow();
              const isPercentage = rowData.type === 'PERCENTAGE';

              return (
                <tr key={`${section}-${cls}`}>
                  <td className="text-center">
                    <select
                      className={`sc-type-dropdown ${isPercentage ? 'is-pct' : 'is-flat'}`}
                      value={rowData.type}
                      onChange={(e) => handleTypeChange(section, cls, e.target.value)}
                    >
                      <option value="FLAT">FLAT</option>
                      <option value="PERCENTAGE">%</option>
                    </select>
                  </td>
                  <td className="text-center">
                    <div className="sc-class-tag-wrapper">
                      <span className="sc-class-tag">{cls}</span>
                      <button
                        type="button"
                        className="sc-row-fill-mini"
                        title={`Replicate Chrg 1 across all columns for ${cls}`}
                        onClick={() => handleFillRow(section, cls)}
                      >
                        ⚡
                      </button>
                    </div>
                  </td>
                  {[0, 1, 2, 3, 4, 5].map((paxIdx) => (
                    <td key={paxIdx}>
                      <div className="sc-cell-wrapper">
                        <input
                          id={`sc-cell-${section}-${clsIdx}-${paxIdx}`}
                          type="number"
                          step={isPercentage ? '0.5' : '1'}
                          min="0"
                          className="sc-val-input"
                          value={rowData.pax[paxIdx] === 0 ? '' : rowData.pax[paxIdx]}
                          placeholder="0"
                          onChange={(e) => handleCellChange(section, cls, paxIdx, e.target.value)}
                          onKeyDown={(e) => handleGridKeyDown(e, section, clsIdx, paxIdx)}
                        />
                        {isPercentage && <span className="sc-pct-icon">%</span>}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="sc-backdrop" onClick={onClose}>
      <div
        className="sc-window"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ERP Blue Bar */}
        <div className="sc-window-header">
          <div className="sc-header-left">
            <span className="sc-header-icon">⚙️</span>
            <h2>Service Charge Detail</h2>
          </div>
          <div className="sc-header-actions">
            <button
              type="button"
              className="sc-header-save-btn"
              onClick={handleSave}
              disabled={saving || loading}
            >
              💾 {saving ? 'Saving...' : 'Save Service Charges'}
            </button>
            <button className="sc-btn-close" onClick={onClose} title="Close (Esc)">
              ✕
            </button>
          </div>
        </div>

        {/* Customer Header Information */}
        <div className="sc-info-panel">
          <div className="sc-field-item">
            <span className="sc-field-label">Account Code</span>
            <span className="sc-field-value code">{headerData.customerNo || customerId}</span>
          </div>

          <div className="sc-field-item grow">
            <span className="sc-field-label">Account Name</span>
            <span className="sc-field-value name">{headerData.customerName || 'N/A'}</span>
          </div>

          <div className="sc-field-item">
            <span className="sc-field-label">Remarks</span>
            <input
              id="sc-remarks-input"
              type="text"
              className="sc-text-input"
              value={headerData.remarks}
              placeholder="e.g. TS-500"
              onChange={(e) => setHeaderData(prev => ({ ...prev, remarks: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  document.getElementById('sc-delivery-charge-input')?.focus();
                }
              }}
            />
          </div>

          <div className="sc-field-item">
            <span className="sc-field-label">Delivery Charge (₹)</span>
            <input
              id="sc-delivery-charge-input"
              type="number"
              min="0"
              className="sc-text-input num"
              value={headerData.deliveryCharge || ''}
              placeholder="0"
              onChange={(e) => setHeaderData(prev => ({ ...prev, deliveryCharge: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  focusCell('reservation', 0, 0);
                }
              }}
            />
          </div>

          <div className="sc-field-item action">
            <button
              type="button"
              className="sc-copy-btn"
              onClick={handleCopyReservationToCancellation}
              title="Copy all Reservation values to Cancellation"
            >
              📋 Copy Res ➔ Canc
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {error && <div className="sc-msg-box sc-msg-error">{error}</div>}
        {success && <div className="sc-msg-box sc-msg-success">{success}</div>}

        {/* Main Content Area */}
        <div className="sc-window-body">
          {loading ? (
            <div className="sc-loading-box">
              <div className="sc-loading-spinner"></div>
              <span>Loading service charges...</span>
            </div>
          ) : (
            <div className="sc-grid-layout">
              {renderTable('reservation', 'Reservation Charges', 'theme-reservation')}
              {renderTable('cancellation', 'Cancellation Charges', 'theme-cancellation')}
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="sc-window-footer">
          <div className="sc-footer-tip">
            <span>💡 <strong>Tab / Arrows</strong>: Navigate cells | <strong>⬇️</strong>: Fill Column | <strong>⚡</strong>: Fill Row | <strong>Ctrl+S</strong>: Save</span>
          </div>
          <div className="sc-footer-buttons">
            <button
              type="button"
              className="sc-action-btn sc-btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              id="sc-btn-save-main"
              type="button"
              className="sc-action-btn sc-btn-save"
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving ? 'Saving...' : '💾 Save Service Charges (Permanently)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerServiceChargeModal;
