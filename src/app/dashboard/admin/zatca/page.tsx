'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

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
  certificate?: string;
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
  const t = useTranslations('Zatca');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [config, setConfig] = useState<ZatcaConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'onboarding' | 'status'>('config');
  const [onboardAction, setOnboardAction] = useState('');
  const [onboardInput, setOnboardInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
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
        setMessage({ type: 'error', text: data.error || t('errorSave') });
        return;
      }
      setConfig(data.config);
      setMessage({ type: 'success', text: t('successSave') });
    } catch {
      setMessage({ type: 'error', text: commonT('errors.networkError') });
    } finally {
      setSaving(false);
    }
  }

  async function handleOnboardAction(action: string) {
    setOnboardLoading(true);
    setOnboardResult('');
    try {
      const body: Record<string, string> = { action };
      if (action === 'auto_onboard') {
        body.otp = otpInput;
      }
      if (action === 'request_compliance_csid') {
        body.csr = onboardInput;
        if (otpInput) body.otp = otpInput;
      }
      if (action === 'request_production_csid') body.complianceRequestId = onboardInput;

      const res = await fetch('/api/zatca/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setOnboardResult(JSON.stringify(data, null, 2));
      if (res.ok) await fetchConfig();
      if (data.csrB64 && action === 'generate_csr') {
        setOnboardInput(data.csrB64);
        setMessage({ type: 'success', text: 'CSR generated! Pasted into Step 2 input — click Step 2 to continue.' });
      }
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
    <div className={`max-w-4xl mx-auto p-6 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[config.environment]}`}>
          {config.environment === 'sandbox' ? t('sandbox') : t('production')}
        </span>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className={`flex -mb-px ${isRtl ? 'space-x-reverse space-x-6' : 'space-x-6'}`}>
          {(['config', 'onboarding', 'status'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">{t('sellerInfo')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('companyNameEn')}</label>
                <input
                  type="text"
                  value={config.sellerName}
                  onChange={e => setConfig({ ...config, sellerName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                  placeholder="Al Amyal Car Dealership"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('companyNameAr')}</label>
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
                  {t('trn')}
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
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('environment')}</label>
                <select
                  value={config.environment}
                  onChange={e => setConfig({ ...config, environment: e.target.value as 'sandbox' | 'production' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                >
                  <option value="sandbox">{t('sandbox')}</option>
                  <option value="production">{t('production')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">{t('businessAddress')}</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'buildingNumber', label: t('buildingNumber') },
                { key: 'streetName', label: t('streetName') },
                { key: 'district', label: t('district') },
                { key: 'city', label: t('city') },
                { key: 'postalCode', label: t('postalCode') },
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
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('countryCode')}</label>
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
            {saving ? commonT('saving') : t('saveConfig')}
          </button>
        </div>
      )}

      {/* Onboarding Tab */}
      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          <div className={`bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800`}>
            <strong>{t('onboardingSteps.title')}</strong>
            <ol className={`list-decimal ${isRtl ? 'mr-4' : 'ml-4'} mt-2 space-y-1`}>
              <li>{t('onboardingSteps.step1')}</li>
              <li>{t('onboardingSteps.step2')}</li>
              <li>{t('onboardingSteps.step3')}</li>
              <li>{t('onboardingSteps.step4')}</li>
              <li>{t('onboardingSteps.step5')}</li>
            </ol>
          </div>

          {/* Quick path: steps 1 + 1.5 + 2 in one click */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <h3 className="font-semibold text-teal-800 mb-1">{t('quickOnboard')}</h3>
            <p className="text-xs text-teal-700 mb-3">{t('quickOnboardDesc')}</p>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('otp')} <span className="text-red-500">*</span>{' '}
                <span className="text-gray-400 font-normal">{t('otpHint')}</span>
              </label>
              <input
                type="text"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value)}
                placeholder="e.g. 123456"
                maxLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-400 outline-none"
              />
            </div>
            <button
              onClick={() => { setOnboardAction('auto_onboard'); handleOnboardAction('auto_onboard'); }}
              disabled={onboardLoading || !otpInput}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {onboardLoading && onboardAction === 'auto_onboard' ? commonT('loading') : `⚡ ${t('autoOnboardBtn')}`}
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-400 mb-3">{t('manualSteps')}</p>
          </div>

          {[
            { action: 'generate_keys', label: 'Step 1: Generate EC Key Pair', needsInput: false },
            { action: 'generate_csr', label: 'Step 1.5: Generate CSR (Automated)', needsInput: false },
            { action: 'request_compliance_csid', label: 'Step 2: Request Compliance CSID', needsInput: true, placeholder: 'Paste base64-encoded CSR here (or click Step 1.5 to auto-generate)' },
            { action: 'compliance_check', label: 'Step 3: Run Compliance Check', needsInput: false },
            { action: 'request_production_csid', label: 'Step 4: Request Production CSID', needsInput: true, placeholder: 'Enter compliance requestId from Step 2 result' },
          ].map(step => (
            <div key={step.action} className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-medium text-gray-700 mb-3">{step.label}</h3>
              {step.needsInput && (
                <>
                  {step.action === 'request_compliance_csid' && (
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {t('otp')} <span className="text-red-500">*</span>{' '}
                        <span className="text-gray-400 font-normal">{t('otpHint')}</span>
                      </label>
                      <input
                        type="text"
                        value={otpInput}
                        onChange={e => setOtpInput(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-teal-400 outline-none"
                        maxLength={6}
                        required
                      />
                    </div>
                  )}
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono mb-3 focus:ring-2 focus:ring-teal-400 outline-none"
                    placeholder={step.placeholder}
                    value={onboardAction === step.action ? onboardInput : ''}
                    onChange={e => { setOnboardAction(step.action); setOnboardInput(e.target.value); }}
                  />
                </>
              )}
              <button
                onClick={() => { setOnboardAction(step.action); handleOnboardAction(step.action); }}
                disabled={onboardLoading}
                className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {onboardLoading && onboardAction === step.action ? commonT('loading') : commonT('save')}
              </button>
            </div>
          ))}

          {onboardResult && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-medium text-gray-500 mb-2">Result:</h3>
              <pre className={`text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-64 ${isRtl ? 'text-left' : 'text-left'}`} dir="ltr">{onboardResult}</pre>
            </div>
          )}
        </div>
      )}

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">{t('statusTitle')}</h2>
            <div className="space-y-3 text-sm">
              <StatusRow label={t('environment')} value={config.environment} isRtl={isRtl} />
              <TokenRow label="Compliance CSID" value={config.complianceCsid} t={t} isRtl={isRtl} />
              <TokenRow label="Production CSID" value={config.productionCsid} t={t} isRtl={isRtl} />
              <TokenRow label="Public Key" value={config.publicKey} t={t} isRtl={isRtl} />
              {config.pih && (
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Previous Invoice Hash (PIH):</span>
                  <code className={`${isRtl ? 'mr-2' : 'ml-2'} text-xs bg-gray-100 px-2 py-0.5 rounded font-mono break-all`} dir="ltr">{config.pih}</code>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-3">{t('retryFailed')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('retryDesc')}</p>
            <button
              onClick={async () => {
                const res = await fetch('/api/zatca/retry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                const data = await res.json();
                setMessage({ type: res.ok ? 'success' : 'error', text: JSON.stringify(data) });
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {t('retryBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusRow({ label, value, ok, isRtl }: { label: string; value: string; ok?: boolean; isRtl: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-100">
      <span className="text-gray-500">{label}</span>
      <span className={ok === undefined ? 'text-gray-700' : ok ? 'text-green-600 font-medium' : 'text-red-500'}>{value}</span>
    </div>
  );
}

function TokenRow({ label, value, t, isRtl }: { label: string; value?: string; t: any; isRtl: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!value) {
    return (
      <div className="flex items-center justify-between py-1 border-b border-gray-100">
        <span className="text-gray-500">{label}</span>
        <span className="text-red-500">✗ {t('notConfigured')}</span>
      </div>
    );
  }

  const preview = value.length > 32 ? `${value.slice(0, 16)}…${value.slice(-12)}` : value;

  async function copy() {
    await navigator.clipboard.writeText(value!);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="py-2 border-b border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500">{label}</span>
        <div className={`flex items-center ${isRtl ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
          <button
            onClick={() => setRevealed(r => !r)}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            {revealed ? t('hide') : t('show')}
          </button>
          <button
            onClick={copy}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      </div>
      <code className="block text-[11px] bg-gray-100 px-2 py-1.5 rounded font-mono break-all text-gray-700 max-h-40 overflow-auto" dir="ltr">
        {revealed ? value : preview}
      </code>
    </div>
  );
}
