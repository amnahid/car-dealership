'use client';

import { useState, useEffect } from 'react';

interface ZatcaConfig {
  _id?: string;
  sellerName: string;
  sellerNameAr: string;
  trn: string;
  address: {
    buildingNumber: string;
    streetName: string;
    district: string;
    city: string;
    postalCode: string;
    countryCode: string;
  };
  environment: 'sandbox' | 'production';
  complianceCsid?: string;
  productionCsid?: string;
  publicKey?: string;
  pih?: string;
  isActive?: boolean;
}

const defaultConfig: ZatcaConfig = {
  sellerName: '',
  sellerNameAr: '',
  trn: '',
  address: {
    buildingNumber: '',
    streetName: '',
    district: '',
    city: '',
    postalCode: '',
    countryCode: 'SA',
  },
  environment: 'sandbox',
};

export default function ZatcaSettingsPage() {
  const [config, setConfig] = useState<ZatcaConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'onboarding' | 'status'>('config');
  const [onboardAction, setOnboardAction] = useState('');
  const [onboardInput, setOnboardInput] = useState('');
  const [onboardResult, setOnboardResult] = useState<string>('');
  const [onboardLoading, setOnboardLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch('/api/zatca/config');
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
      }
    } catch {
      // no config yet
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const method = config._id ? 'PUT' : 'POST';
      const res = await fetch('/api/zatca/config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Save failed' });
        return;
      }
      setConfig(data.config);
      setMessage({ type: 'success', text: 'ZATCA configuration saved successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleOnboardAction(action: string) {
    setOnboardLoading(true);
    setOnboardResult('');
    try {
      const body: Record<string, string> = { action };
      if (action === 'request_compliance_csid') body.csr = onboardInput;
      if (action === 'request_production_csid') body.complianceRequestId = onboardInput;

      const res = await fetch('/api/zatca/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setOnboardResult(JSON.stringify(data, null, 2));
      if (res.ok) await fetchConfig();
    } catch (err) {
      setOnboardResult(`Error: ${err}`);
    } finally {
      setOnboardLoading(false);
    }
  }

  const statusColor = {
    sandbox: 'bg-yellow-100 text-yellow-800',
    production: 'bg-green-100 text-green-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ZATCA E-Invoicing Settings</h1>
          <p className="text-sm text-gray-500 mt-1">إعدادات منظومة الفوترة الإلكترونية — هيئة الزكاة والضريبة والجمارك</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[config.environment]}`}>
          {config.environment === 'sandbox' ? 'Sandbox (Dev)' : 'Production'}
        </span>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-6">
          {(['config', 'onboarding', 'status'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'config' ? 'Company Config' : tab === 'onboarding' ? 'Onboarding / CSID' : 'Status & PIH'}
            </button>
          ))}
        </nav>
      </div>

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Seller Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Company Name (English)</label>
                <input
                  type="text"
                  value={config.sellerName}
                  onChange={e => setConfig({ ...config, sellerName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                  placeholder="Al Amyal Car Dealership"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Company Name (Arabic) / اسم الشركة</label>
                <input
                  type="text"
                  dir="rtl"
                  value={config.sellerNameAr}
                  onChange={e => setConfig({ ...config, sellerNameAr: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                  placeholder="معرض الأميال للسيارات"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tax Registration Number (TRN) — 15 digits
                </label>
                <input
                  type="text"
                  value={config.trn}
                  onChange={e => setConfig({ ...config, trn: e.target.value })}
                  maxLength={15}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none font-mono"
                  placeholder="300000000000003"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Environment</label>
                <select
                  value={config.environment}
                  onChange={e => setConfig({ ...config, environment: e.target.value as 'sandbox' | 'production' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                >
                  <option value="sandbox">Sandbox (Development)</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Business Address</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'buildingNumber', label: 'Building Number' },
                { key: 'streetName', label: 'Street Name' },
                { key: 'district', label: 'District / Neighborhood' },
                { key: 'city', label: 'City' },
                { key: 'postalCode', label: 'Postal Code' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="text"
                    value={config.address[key as keyof typeof config.address]}
                    onChange={e => setConfig({
                      ...config,
                      address: { ...config.address, [key]: e.target.value },
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Country Code</label>
                <input
                  type="text"
                  value="SA"
                  disabled
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}

      {/* Onboarding Tab */}
      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <strong>Phase 2 Onboarding Steps:</strong>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Generate EC key pair (Step 1)</li>
              <li>Use the openssl command to generate a ZATCA-compliant CSR</li>
              <li>Submit CSR to ZATCA → get Compliance CSID (Step 2)</li>
              <li>Run compliance check with test invoices (Step 3)</li>
              <li>Request Production CSID (Step 4)</li>
            </ol>
          </div>

          {[
            { action: 'generate_keys', label: 'Step 1: Generate EC Key Pair', needsInput: false },
            { action: 'request_compliance_csid', label: 'Step 2: Request Compliance CSID', needsInput: true, placeholder: 'Paste base64-encoded CSR here' },
            { action: 'compliance_check', label: 'Step 3: Run Compliance Check', needsInput: false },
            { action: 'request_production_csid', label: 'Step 4: Request Production CSID', needsInput: true, placeholder: 'Enter compliance requestId from Step 2 result' },
          ].map(step => (
            <div key={step.action} className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-medium text-gray-700 mb-3">{step.label}</h3>
              {step.needsInput && (
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono mb-3 focus:ring-2 focus:ring-teal-400 outline-none"
                  placeholder={step.placeholder}
                  value={onboardAction === step.action ? onboardInput : ''}
                  onChange={e => { setOnboardAction(step.action); setOnboardInput(e.target.value); }}
                />
              )}
              <button
                onClick={() => { setOnboardAction(step.action); handleOnboardAction(step.action); }}
                disabled={onboardLoading}
                className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {onboardLoading && onboardAction === step.action ? 'Processing...' : 'Execute'}
              </button>
            </div>
          ))}

          {onboardResult && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-medium text-gray-500 mb-2">Result:</h3>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">{onboardResult}</pre>
            </div>
          )}
        </div>
      )}

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">ZATCA Configuration Status</h2>
            <div className="space-y-3 text-sm">
              <StatusRow label="Environment" value={config.environment} />
              <StatusRow label="Compliance CSID" value={config.complianceCsid ? '✓ Configured' : '✗ Not configured'} ok={!!config.complianceCsid} />
              <StatusRow label="Production CSID" value={config.productionCsid ? '✓ Configured' : '✗ Not configured'} ok={!!config.productionCsid} />
              <StatusRow label="Public Key" value={config.publicKey ? '✓ Generated' : '✗ Not generated'} ok={!!config.publicKey} />
              {config.pih && (
                <div>
                  <span className="text-gray-500">Previous Invoice Hash (PIH):</span>
                  <code className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded font-mono break-all">{config.pih}</code>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-3">Retry Failed Submissions</h2>
            <p className="text-sm text-gray-500 mb-4">Retry all failed ZATCA invoice submissions (requires Phase 2 CSID).</p>
            <button
              onClick={async () => {
                const res = await fetch('/api/zatca/retry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                const data = await res.json();
                setMessage({ type: res.ok ? 'success' : 'error', text: JSON.stringify(data) });
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Retry All Failed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-100">
      <span className="text-gray-500">{label}</span>
      <span className={ok === undefined ? 'text-gray-700' : ok ? 'text-green-600 font-medium' : 'text-red-500'}>{value}</span>
    </div>
  );
}
