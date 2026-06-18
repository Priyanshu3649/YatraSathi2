import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLedger from './admin/CustomerLedger';
import { customerAPI } from '../services/api';

const CustomerLedgerPage = () => {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (term) => {
    setSearch(term);
    if (term.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await customerAPI.searchCustomers(term);
      setResults(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch (err) {
      console.error('Customer search error:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const selectCustomer = useCallback((c) => {
    setCustomerId(c.cu_usid || c.id || c.usid);
    setCustomerName(c.cu_name || c.name || '');
    setSearch('');
    setResults([]);
  }, []);

  const clearSelection = useCallback(() => {
    setCustomerId(null);
    setCustomerName('');
    setSearch('');
    setResults([]);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f5ecd7', fontFamily: 'Georgia, "Times New Roman", serif' }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: '#5c4a2a', color: '#f5ecd7',
        borderBottom: '3px double #8b7355', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'transparent', border: '1px solid #8b7355', color: '#f5ecd7',
              padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
              borderRadius: '3px'
            }}
          >
            ← Dashboard
          </button>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>
            Customer Ledger
          </h1>
        </div>
        {customerId && (
          <button
            onClick={clearSelection}
            style={{
              background: '#8b7355', border: 'none', color: '#fff',
              padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '13px', borderRadius: '3px'
            }}
          >
            Change Customer
          </button>
        )}
      </div>

      {/* Search Bar */}
      {!customerId && (
        <div style={{ maxWidth: '600px', margin: '60px auto 0', padding: '0 20px' }}>
          <div style={{
            background: '#fff', border: '2px solid #8b7355', borderRadius: '6px',
            padding: '30px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📒</div>
            <h2 style={{ margin: '0 0 6px', color: '#5c4a2a', fontSize: '22px' }}>
              Customer Ledger
            </h2>
            <p style={{ color: '#8b7355', margin: '0 0 20px', fontSize: '14px' }}>
              Search for a customer to view their complete accounting ledger
            </p>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by name, phone, or customer ID..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '12px 16px', fontSize: '15px',
                  border: '2px solid #8b7355', borderRadius: '4px',
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
                }}
              />
              {searching && (
                <div style={{ padding: '12px', color: '#888', fontSize: '13px' }}>Searching...</div>
              )}
              {results.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: '#fff', border: '1px solid #8b7355',
                  borderRadius: '0 0 4px 4px', maxHeight: '300px', overflowY: 'auto',
                  zIndex: 1000, boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                  textAlign: 'left'
                }}>
                  {results.map((c) => (
                    <div
                      key={c.cu_usid || c.id || c.usid}
                      onClick={() => selectCustomer(c)}
                      style={{
                        padding: '10px 16px', cursor: 'pointer',
                        borderBottom: '1px solid #eee', fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5ecd7'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ fontWeight: 'bold', color: '#5c4a2a' }}>
                        {c.cu_name || c.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        <span>{c.cu_usid || c.id || c.usid}</span>
                        {c.cu_phone && <span style={{ marginLeft: '12px' }}>{c.cu_phone}</span>}
                        {c.cu_email && <span style={{ marginLeft: '12px' }}>{c.cu_email}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ledger View */}
      {customerId && (
        <div style={{ padding: '16px 20px' }}>
          {/* Customer Banner */}
          <div style={{
            background: '#fff', border: '2px solid #8b7355', borderRadius: '4px',
            padding: '10px 20px', marginBottom: '12px',
            display: 'flex', alignItems: 'center', gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontSize: '24px' }}>👤</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#5c4a2a' }}>
                {customerName}
              </div>
              <div style={{ fontSize: '12px', color: '#8b7355' }}>
                ID: {customerId}
              </div>
            </div>
          </div>

          {/* Ledger Component */}
          <CustomerLedger customerId={customerId} />
        </div>
      )}
    </div>
  );
};

export default CustomerLedgerPage;
