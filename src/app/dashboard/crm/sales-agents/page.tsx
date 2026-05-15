'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import SalesAgentModal, { SalesAgent } from '@/components/forms/SalesAgentModal';
import { useTranslations, useLocale } from 'next-intl';

export default function SalesAgentsPage() {
  const t = useTranslations('SalesAgents');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SalesAgent | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (debouncedSearch) params.set('search', debouncedSearch);

    try {
      const res = await fetch(`/api/crm/sales-agents?${params}`);
      const data = await res.json();
      setAgents(data.agents || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/crm/sales-agents/${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      fetchAgents();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">{t('title')}</h2>
        <button
          onClick={() => { setEditingAgent(null); setShowModal(true); }}
          style={{
            background: '#28aaa9',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
            padding: '10px 16px',
            borderRadius: '3px',
            textDecoration: 'none',
            border: '1px solid #28aaa9',
            cursor: 'pointer',
          }}
        >
          + {t('addNew')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '300px',
            height: '40px',
            fontSize: '14px',
            borderRadius: '0',
            padding: '0 12px',
            border: '1px solid #ced4da',
            background: '#ffffff',
            textAlign: isRtl ? 'right' : 'left'
          }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
        ) : agents.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noAgentsFound')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '1000px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('agentId')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('fullName')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('phone')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('email')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{commonT('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent._id} style={{ borderBottom: '1px solid #f5f5f5', direction: isRtl ? 'rtl' : 'ltr' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{agent.agentId}</td>
                    <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                            {agent.profilePhoto && <img src={agent.profilePhoto} style={{ width: '24px', height: '24px', borderRadius: '50%' }} alt="" />}
                            {agent.fullName}
                        </div>
                    </td>
                    <td style={{ padding: '12px' }}>{agent.phone}</td>
                    <td style={{ padding: '12px' }}>{agent.email || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <button onClick={() => { setEditingAgent(agent); setShowModal(true); }} style={{ color: '#f8b425', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{commonT('edit')}</button>
                        <button onClick={() => handleDelete(agent._id)} style={{ color: '#ec4561', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{commonT('delete')}</button>
                        <Link href={`/dashboard/crm/sales-agents/${agent._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>{commonT('view')}</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <SalesAgentModal
          agent={editingAgent}
          onClose={() => { setShowModal(false); setEditingAgent(null); }}
          onSave={() => { setShowModal(false); setEditingAgent(null); fetchAgents(); }}
        />
      )}
    </div>
  );
}
