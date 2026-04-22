'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Invoice {
  _id: string;
  uuid: string;
  saleId: string;
  referenceType: 'CashSale' | 'InstallmentSale' | 'Rental';
  invoiceType: 'Standard' | 'Simplified';
  issueDate: string;
  status: 'Cleared' | 'Pending' | 'Failed' | 'Reported' | 'NotRequired';
  qrCode?: string;
  createdBy?: { name: string };
}

interface Stats {
  total: number;
  thisMonth: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Stats>({ total: 0, thisMonth: 0, byStatus: {}, byType: {} });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState<Invoice | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);

    try {
      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
      setTotalPages(data.pagination?.pages || 1);
      setStats(data.stats || { total: 0, thisMonth: 0, byStatus: {}, byType: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map(inv => inv._id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDownload = () => {
    selectedIds.forEach(id => {
      const inv = invoices.find(i => i._id === id);
      if (inv) {
        window.open(`/invoices/invoice-${inv.saleId}.pdf`, '_blank');
      }
    });
  };

  const openSendModal = (invoice: Invoice) => {
    setSendingInvoice(invoice);
    setShowSendModal(true);
  };

  const handleSendEmail = async () => {
    if (!sendingInvoice || !email) return;
    setSending(true);
    try {
      const res = await fetch(`/api/invoices/${sendingInvoice._id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        alert('Invoice sent successfully!');
        setShowSendModal(false);
        setEmail('');
        setSendingInvoice(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send email');
      }
    } catch (err) {
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Cleared': return '#42ca7f';
      case 'Reported': return '#28aaa9';
      case 'Pending': return '#f5a623';
      case 'Failed': return '#ec4561';
      default: return '#9ca8b3';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CashSale': return 'Cash';
      case 'InstallmentSale': return 'Installment';
      case 'Rental': return 'Rental';
      default: return type;
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="page-title">Invoice Manager</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #28aaa9' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Total Invoices</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '4px 0 0' }}>{stats.total}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #42ca7f' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>This Month</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0' }}>{stats.thisMonth}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #42ca7f' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Cleared</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0' }}>{stats.byStatus?.Cleared || 0}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f5a623' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Pending</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#f5a623', margin: '4px 0 0' }}>{stats.byStatus?.Pending || 0}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        <input type="text" placeholder="Search by invoice ID or UUID..." value={search} onChange={(e) => handleSearch(e.target.value)} style={{ width: '250px', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}>
          <option value="">All Status</option>
          <option value="Cleared">Cleared</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
          <option value="Reported">Reported</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} style={{ height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}>
          <option value="">All Types</option>
          <option value="CashSale">Cash Sale</option>
          <option value="InstallmentSale">Installment</option>
          <option value="Rental">Rental</option>
        </select>
        {selectedIds.size > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#525f80' }}>{selectedIds.size} selected</span>
            <button onClick={handleBulkDownload} style={{ background: '#28aaa9', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '3px', cursor: 'pointer', fontSize: '14px' }}>
              Download Selected ({selectedIds.size})
            </button>
            <button style={{ background: '#f5a623', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '3px', cursor: 'pointer', fontSize: '14px' }}>
              Regenerate Selected
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No invoices found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '900px' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', width: '40px' }}>
                    <input type="checkbox" checked={selectedIds.size === invoices.length && invoices.length > 0} onChange={handleSelectAll} />
                  </th>
                  {['Invoice ID', 'Type', 'UUID', 'Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {invoices.map((inv) => (
                  <tr key={inv._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px' }}>
                      <input type="checkbox" checked={selectedIds.has(inv._id)} onChange={() => handleSelect(inv._id)} />
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9', fontWeight: 600 }}>{inv.saleId}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: '#f0f0f0', color: '#525f80' }}>
                        {getTypeLabel(inv.referenceType)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#9ca8b3', fontFamily: 'monospace' }}>{inv.uuid?.slice(0, 18)}...</td>
                    <td style={{ padding: '12px', color: '#525f80' }}>{new Date(inv.issueDate).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: getStatusColor(inv.status) + '20', color: getStatusColor(inv.status) }}>{inv.status}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={`/invoices/invoice-${inv.saleId}.pdf`} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', textDecoration: 'none' }}>Download</a>
                        <button onClick={() => openSendModal(inv)} style={{ background: 'none', border: 'none', color: '#28aaa9', cursor: 'pointer', padding: 0, fontSize: '14px' }}>Send</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ padding: '8px 12px', border: '1px solid #ced4da', background: page === p ? '#28aaa9' : '#fff', color: page === p ? '#fff' : '#525f80', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      )}

      {showSendModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowSendModal(false)}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '4px', width: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Send Invoice Email</h3>
            <p style={{ fontSize: '14px', color: '#525f80', marginBottom: '16px' }}>Send invoice <strong>{sendingInvoice?.saleId}</strong> to customer</p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Customer Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSendModal(false)} style={{ background: '#fff', color: '#525f80', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #ced4da', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSendEmail} disabled={sending || !email} style={{ background: '#28aaa9', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Sending...' : 'Send Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}