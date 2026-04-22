'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyLogo: '',
    companyNumber: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
    notes: '',
    salesAgent: {
      name: '',
      phone: '',
      email: '',
      photo: '',
      designation: '',
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('salesAgent.')) {
      const field = name.replace('salesAgent.', '');
      setFormData(prev => ({
        ...prev,
        salesAgent: { ...prev.salesAgent, [field]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoChange = (url: string) => {
    setFormData(prev => ({ ...prev, companyLogo: url }));
  };

  const handleAgentPhotoChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      salesAgent: { ...prev.salesAgent, photo: url },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create supplier');
      }

      router.push('/dashboard/cars/suppliers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 className="page-title" style={{ margin: '0 0 8px 0' }}>Add New Supplier</h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Enter supplier company details</p>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        {error && (
          <div style={{ padding: '12px 16px', background: '#f8d7da', color: '#721c24', borderRadius: '6px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2b2d5d', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
              Company Information
            </h3>
            
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                  Company Logo
                </label>
                <div style={{ 
                  padding: '16px', 
                  background: '#f8f9fa', 
                  borderRadius: '12px', 
                  border: '2px dashed #dee2e6',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  <ImageUpload
                    value={formData.companyLogo}
                    onChange={handleLogoChange}
                    folder="suppliers"
                    label="Logo"
                    size={120}
                  />
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>JPG, PNG up to 10MB</p>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                      Company Name <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      placeholder="Enter company name"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                      Company Number <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="companyNumber"
                      value={formData.companyNumber}
                      onChange={handleChange}
                      required
                      placeholder="e.g., C-12345"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                      Phone <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+880 1XX XXX XXXX"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="company@example.com"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Full address"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2b2d5d', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
              Sales Agent Information
            </h3>
            
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                  Agent Photo
                </label>
                <div style={{ 
                  padding: '16px', 
                  background: '#f8f9fa', 
                  borderRadius: '12px', 
                  border: '2px dashed #dee2e6',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  <ImageUpload
                    value={formData.salesAgent.photo}
                    onChange={handleAgentPhotoChange}
                    folder="suppliers/agents"
                    label="Agent"
                    size={120}
                  />
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>JPG, PNG up to 10MB</p>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                      Agent Name
                    </label>
                    <input
                      type="text"
                      name="salesAgent.name"
                      value={formData.salesAgent.name}
                      onChange={handleChange}
                      placeholder="Full name"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                      Designation
                    </label>
                    <input
                      type="text"
                      name="salesAgent.designation"
                      value={formData.salesAgent.designation}
                      onChange={handleChange}
                      placeholder="e.g., Sales Manager"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                      Agent Phone
                    </label>
                    <input
                      type="tel"
                      name="salesAgent.phone"
                      value={formData.salesAgent.phone}
                      onChange={handleChange}
                      placeholder="+880 1XX XXX XXXX"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
                      Agent Email
                    </label>
                    <input
                      type="email"
                      name="salesAgent.email"
                      value={formData.salesAgent.email}
                      onChange={handleChange}
                      placeholder="agent@company.com"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#2b2d5d' }}>
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes about this supplier..."
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '14px', resize: 'vertical', background: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #eee' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ padding: '10px 20px', background: '#fff', color: '#6c757d', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '10px 24px', background: '#28aaa9', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '14px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating...' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}