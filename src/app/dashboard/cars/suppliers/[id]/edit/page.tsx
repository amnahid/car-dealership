'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';

interface Supplier {
  _id: string;
  supplierId: string;
  companyName: string;
  companyLogo?: string;
  companyNumber: string;
  email?: string;
  phone: string;
  address?: string;
  salesAgent?: {
    name: string;
    phone: string;
    email?: string;
    photo?: string;
    designation?: string;
  };
  status: 'active' | 'inactive';
  notes?: string;
}

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await fetch(`/api/suppliers/${params.id}`);
        const data = await res.json();
        if (res.ok && data.supplier) {
          setFormData({
            companyName: data.supplier.companyName || '',
            companyLogo: data.supplier.companyLogo || '',
            companyNumber: data.supplier.companyNumber || '',
            email: data.supplier.email || '',
            phone: data.supplier.phone || '',
            address: data.supplier.address || '',
            status: data.supplier.status || 'active',
            notes: data.supplier.notes || '',
            salesAgent: data.supplier.salesAgent || {
              name: '',
              phone: '',
              email: '',
              photo: '',
              designation: '',
            },
          });
        }
      } catch (error) {
        console.error('Failed to fetch supplier:', error);
      } finally {
        setFetching(false);
      }
    };

    if (params.id) fetchSupplier();
  }, [params.id]);

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
      const res = await fetch(`/api/suppliers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update supplier');
      }

      router.push(`/dashboard/cars/suppliers/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 className="page-title" style={{ margin: '0 0 8px 0' }}>Edit Supplier</h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Update supplier details</p>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}