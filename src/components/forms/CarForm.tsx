'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CarStatus } from '@/types';
import { uploadImage, deleteFile } from '@/lib/uploadClient';
import SearchableSelect from '@/components/SearchableSelect';
import { MultiImageUpload } from '@/components/ImageUpload';

interface Supplier {
  _id: string;
  supplierId: string;
  companyName: string;
  companyLogo?: string;
  phone: string;
  email?: string;
}

interface PurchaseData {
  supplier: string;
  supplierName: string;
  supplierContact: string;
  purchasePrice: string;
  purchaseDate: string;
  isNewCar: boolean;
  conditionImages: string[];
  insuranceUrl?: string;
  insuranceExpiry?: string;
  registrationUrl?: string;
  registrationExpiry?: string;
  roadPermitUrl?: string;
  roadPermitExpiry?: string;
  documentUrl?: string;
  notes: string;
}

interface CarFormData {
  brand: string;
  model: string;
  year: string;
  engineNumber: string;
  chassisNumber: string;
  color: string;
  status: CarStatus;
  notes: string;
  images: string[];
  purchase: PurchaseData;
}

interface CarFormProps {
  initialData?: Partial<CarFormData> & { _id?: string; purchase?: PurchaseData };
  mode: 'create' | 'edit';
}

const emptyPurchase: PurchaseData = {
  supplier: '',
  supplierName: '',
  supplierContact: '',
  purchasePrice: '',
  purchaseDate: '',
  isNewCar: true,
  conditionImages: [],
  insuranceUrl: '',
  insuranceExpiry: '',
  registrationUrl: '',
  registrationExpiry: '',
  roadPermitUrl: '',
  roadPermitExpiry: '',
  documentUrl: '',
  notes: '',
};

export default function CarForm({ initialData, mode }: CarFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ companyName: '', companyNumber: '', phone: '', email: '' });

  const [form, setForm] = useState<CarFormData>({
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    engineNumber: '',
    chassisNumber: '',
    color: '',
    status: 'In Stock',
    notes: '',
    images: [],
    purchase: { ...emptyPurchase },
  });

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        year: initialData.year?.toString() || new Date().getFullYear().toString(),
        purchase: initialData.purchase ? {
          ...emptyPurchase,
          supplier: initialData.purchase.supplier || '',
          supplierName: initialData.purchase.supplierName || '',
          supplierContact: initialData.purchase.supplierContact || '',
          purchasePrice: initialData.purchase.purchasePrice?.toString() || '',
          purchaseDate: initialData.purchase.purchaseDate?.toString() || '',
          isNewCar: initialData.purchase.isNewCar ?? true,
          conditionImages: initialData.purchase.conditionImages || [],
          insuranceUrl: initialData.purchase.insuranceUrl || '',
          insuranceExpiry: initialData.purchase.insuranceExpiry?.toString() || '',
          registrationUrl: initialData.purchase.registrationUrl || '',
          registrationExpiry: initialData.purchase.registrationExpiry?.toString() || '',
          roadPermitUrl: initialData.purchase.roadPermitUrl || '',
          roadPermitExpiry: initialData.purchase.roadPermitExpiry?.toString() || '',
          documentUrl: initialData.purchase.documentUrl || '',
          notes: initialData.purchase.notes || '',
        } : { ...emptyPurchase },
      }));
    }
    // initialData is only used to populate the form on mount/edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?._id]);

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await fetch('/api/suppliers?list=true');
      const data = await res.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSupplierChange = (supplierId: string) => {
    if (supplierId === '__new__') {
      setShowSupplierModal(true);
      return;
    }
    
    const selectedSupplier = suppliers.find(s => s._id === supplierId);
    
    setForm(prev => ({
      ...prev,
      purchase: {
        ...prev.purchase,
        supplier: supplierId,
        supplierName: selectedSupplier?.companyName || '',
        supplierContact: selectedSupplier?.phone || '',
      }
    }));
  };

  const handleNewSupplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({ ...prev, [name.replace('newSupplier.', '')]: value }));
  };

  const saveNewSupplier = async () => {
    if (!newSupplier.companyName || !newSupplier.companyNumber || !newSupplier.phone) {
      alert('Please fill required fields');
      return;
    }
    
    setSavingSupplier(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: newSupplier.companyName,
          companyNumber: newSupplier.companyNumber,
          phone: newSupplier.phone,
          email: newSupplier.email,
          address: '',
          status: 'active',
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.supplier) {
        await fetchSuppliers();
        setForm(prev => ({
          ...prev,
          purchase: {
            ...prev.purchase,
            supplier: data.supplier._id,
            supplierName: data.supplier.companyName,
            supplierContact: data.supplier.phone,
          }
        }));
        setShowSupplierModal(false);
        setNewSupplier({ companyName: '', companyNumber: '', phone: '', email: '' });
      } else {
        alert(data.error || 'Failed to create supplier');
      }
    } catch {
      alert('Failed to create supplier');
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith('purchase.')) {
      const field = name.replace('purchase.', '');
      setForm((prev) => ({
        ...prev,
        purchase: { ...prev.purchase, [field]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    setUploadProgress(`Uploading 0/${files.length}...`);

    const newImages: string[] = [];
    let uploaded = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1}/${files.length}...`);
      
      const result = await uploadImage(file, 'cars');
      if (result.url) {
        newImages.push(result.url);
      } else {
        alert(`Failed to upload ${file.name}: ${result.error}`);
      }
      uploaded = i + 1;
      setUploadProgress(`Uploading ${uploaded}/${files.length}...`);
    }

    setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
    setUploading(false);
    setUploadProgress('');
  };

  const handleConditionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    setUploadProgress(`Uploading 0/${files.length}...`);

    const newImages: string[] = [];
    let uploaded = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1}/${files.length}...`);
      
      const result = await uploadImage(file, 'cars/condition');
      if (result.url) {
        newImages.push(result.url);
      } else {
        alert(`Failed to upload ${file.name}: ${result.error}`);
      }
      uploaded = i + 1;
      setUploadProgress(`Uploading ${uploaded}/${files.length}...`);
    }

    setForm((prev) => ({
      ...prev,
      purchase: { ...prev.purchase, conditionImages: [...prev.purchase.conditionImages, ...newImages] },
    }));
    setUploading(false);
    setUploadProgress('');
  };

  const handleConditionImageRemove = async (index: number) => {
    const imageUrl = form.purchase.conditionImages[index];
    if (imageUrl.startsWith('/uploads/')) {
      await deleteFile(imageUrl);
    }
    setForm((prev) => ({
      ...prev,
      purchase: {
        ...prev.purchase,
        conditionImages: prev.purchase.conditionImages.filter((_, i) => i !== index),
      },
    }));
  };

  const handleInsuranceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file, 'cars/documents');
      if (result.url) {
        setForm((prev) => ({
          ...prev,
          purchase: { ...prev.purchase, insuranceUrl: result.url },
        }));
      } else {
        alert(`Failed to upload: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRegistrationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file, 'cars/documents');
      if (result.url) {
        setForm((prev) => ({
          ...prev,
          purchase: { ...prev.purchase, registrationUrl: result.url },
        }));
      } else {
        alert(`Failed to upload: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRoadPermitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file, 'cars/documents');
      if (result.url) {
        setForm((prev) => ({
          ...prev,
          purchase: { ...prev.purchase, roadPermitUrl: result.url },
        }));
      } else {
        alert(`Failed to upload: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handlePurchaseDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file, 'cars/purchase');
      if (result.url) {
        setForm((prev) => ({
          ...prev,
          purchase: { ...prev.purchase, documentUrl: result.url },
        }));
      } else {
        alert(`Failed to upload: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = form.images[index];
    if (imageUrl.startsWith('/uploads/')) {
      await deleteFile(imageUrl);
    }
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        year: parseInt(form.year),
        purchase: {
          ...form.purchase,
          purchasePrice: parseFloat(form.purchase.purchasePrice),
        },
      };

      const url = mode === 'edit' && initialData?._id ? `/api/cars/${initialData._id}` : '/api/cars';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save car');
        return;
      }

      router.push('/dashboard/cars');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    fontSize: '14px',
    borderRadius: '0',
    padding: '0.375rem 1rem',
    border: '1px solid #ced4da',
    background: '#ffffff',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#2a3142',
    marginBottom: '4px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2a3142',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e9ecef',
  };

  const fileInputStyle: React.CSSProperties = {
    ...inputStyle,
    height: 'auto',
    padding: '8px',
    border: '1px dashed #ced4da',
    background: '#f8f9fa',
    cursor: 'pointer',
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
      {error && (
        <div
          style={{
            background: 'rgba(236, 69, 97, 0.1)',
            border: '1px solid #ec4561',
            borderRadius: '3px',
            padding: '12px',
            marginBottom: '20px',
          }}
        >
          <p style={{ color: '#ec4561', fontSize: '14px', margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={sectionTitleStyle}>Purchase Information</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <SearchableSelect
              label="Supplier"
              value={form.purchase.supplier}
              onChange={handleSupplierChange}
              options={[
                { value: '__new__', label: '+ Add New Supplier' },
                ...suppliers.map(s => ({ value: s._id, label: `${s.companyName} (${s.supplierId})` }))
              ]}
              placeholder="Search supplier..."
              disabled={loadingSuppliers}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowSupplierModal(true)}
            style={{
              height: '40px',
              padding: '0 12px',
              background: '#fff',
              border: '1px solid #ced4da',
              borderRadius: '3px',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              color: '#28aaa9',
            }}
          >
            + Add New
          </button>
        </div>
        {showSupplierModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#2b2d5d' }}>Add New Supplier</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input
                  name="companyName"
                  value={newSupplier.companyName}
                  onChange={(e) => setNewSupplier({ ...newSupplier, companyName: e.target.value })}
                  style={inputStyle}
                  placeholder="Company Name"
                  autoFocus
                />
              </div>
              <div>
                <label style={labelStyle}>Company Number *</label>
                <input
                  name="companyNumber"
                  value={newSupplier.companyNumber}
                  onChange={(e) => setNewSupplier({ ...newSupplier, companyNumber: e.target.value })}
                  style={inputStyle}
                  placeholder="e.g., ABC-1234"
                />
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input
                  name="phone"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  style={inputStyle}
                  placeholder="+8801XXXXXXXXX"
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  name="email"
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  style={inputStyle}
                  placeholder="email@supplier.com"
                />
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowSupplierModal(false);
                  setNewSupplier({ companyName: '', companyNumber: '', phone: '', email: '' });
                  setForm((prev) => ({ ...prev, purchase: { ...prev.purchase, supplier: '' } }));
                }}
                style={{
                  padding: '10px 16px',
                  background: '#fff',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveNewSupplier}
                disabled={savingSupplier}
                style={{
                  padding: '10px 16px',
                  background: '#28aaa9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '14px',
                  cursor: savingSupplier ? 'not-allowed' : 'pointer',
                  opacity: savingSupplier ? 0.6 : 1,
                }}
              >
                {savingSupplier ? 'Saving...' : 'Save Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
        <div>
          <label style={labelStyle}>Purchase Price *</label>
          <input
            name="purchase.purchasePrice"
            type="number"
            required
            min="0"
            step="0.01"
            value={form.purchase.purchasePrice}
            onChange={handleChange}
            style={inputStyle}
            placeholder="25000"
          />
        </div>
        <div>
          <label style={labelStyle}>Purchase Date *</label>
          <input
            name="purchase.purchaseDate"
            type="date"
            required
            value={form.purchase.purchaseDate}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Car Type</label>
          <select
            name="purchase.isNewCar"
            value={form.purchase.isNewCar.toString()}
            onChange={(e) => setForm((prev) => ({
              ...prev,
              purchase: { ...prev.purchase, isNewCar: e.target.value === 'true' }
            }))}
            style={{ ...inputStyle, background: '#fff' }}
          >
            <option value="true">New Car</option>
            <option value="false">Used Car</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <MultiImageUpload
          label="Condition Images"
          value={form.purchase.conditionImages}
          onChange={(imgs) => setForm(prev => ({ ...prev, purchase: { ...prev.purchase, conditionImages: imgs } }))}
          folder="cars/condition"
          maxCount={10}
          gridSize={120}
        />
      </div>

      <div style={sectionTitleStyle}>Vehicle Documents</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Insurance Document</label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleInsuranceUpload}
            disabled={uploading}
            style={fileInputStyle}
          />
          {form.purchase.insuranceUrl && (
            <div style={{ marginTop: '8px' }}>
              <a href={form.purchase.insuranceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', fontSize: '14px' }}>
                View Document
              </a>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, purchase: { ...prev.purchase, insuranceUrl: '' } }))}
                style={{ marginLeft: '12px', color: '#ec4561', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Insurance Expiry Date</label>
          <input
            name="purchase.insuranceExpiry"
            type="date"
            value={form.purchase.insuranceExpiry}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Registration Card</label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleRegistrationUpload}
            disabled={uploading}
            style={fileInputStyle}
          />
          {form.purchase.registrationUrl && (
            <div style={{ marginTop: '8px' }}>
              <a href={form.purchase.registrationUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', fontSize: '14px' }}>
                View Document
              </a>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, purchase: { ...prev.purchase, registrationUrl: '' } }))}
                style={{ marginLeft: '12px', color: '#ec4561', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Registration Expiry Date</label>
          <input
            name="purchase.registrationExpiry"
            type="date"
            value={form.purchase.registrationExpiry}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Road Permit</label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleRoadPermitUpload}
            disabled={uploading}
            style={fileInputStyle}
          />
          {form.purchase.roadPermitUrl && (
            <div style={{ marginTop: '8px' }}>
              <a href={form.purchase.roadPermitUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', fontSize: '14px' }}>
                View Document
              </a>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, purchase: { ...prev.purchase, roadPermitUrl: '' } }))}
                style={{ marginLeft: '12px', color: '#ec4561', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Road Permit Expiry Date</label>
          <input
            name="purchase.roadPermitExpiry"
            type="date"
            value={form.purchase.roadPermitExpiry}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Purchase Document</label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handlePurchaseDocUpload}
            disabled={uploading}
            style={fileInputStyle}
          />
          {form.purchase.documentUrl && (
            <div style={{ marginTop: '8px' }}>
              <a
                href={form.purchase.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#28aaa9', fontSize: '14px' }}
              >
                View Uploaded Document
              </a>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, purchase: { ...prev.purchase, documentUrl: '' } }))}
                style={{ marginLeft: '12px', color: '#ec4561', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Purchase Notes</label>
          <textarea
            name="purchase.notes"
            value={form.purchase.notes}
            onChange={handleChange}
            rows={2}
            style={{ ...inputStyle, height: 'auto', padding: '8px 1rem' }}
            placeholder="Additional notes about the purchase..."
          />
        </div>
      </div>

      <div style={sectionTitleStyle}>Vehicle Information</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Brand *</label>
          <input
            name="brand"
            required
            value={form.brand}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Toyota"
          />
        </div>
        <div>
          <label style={labelStyle}>Model *</label>
          <input
            name="model"
            required
            value={form.model}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Camry"
          />
        </div>
        <div>
          <label style={labelStyle}>Year *</label>
          <input
            name="year"
            type="number"
            required
            min="1900"
            max={new Date().getFullYear() + 1}
            value={form.year}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <input
            name="color"
            value={form.color}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Silver"
          />
        </div>
        <div>
          <label style={labelStyle}>Engine Number</label>
          <input
            name="engineNumber"
            value={form.engineNumber}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Chassis Number *</label>
          <input
            name="chassisNumber"
            required
            value={form.chassisNumber}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            style={inputStyle}
          >
            {['In Stock', 'Under Repair', 'Reserved', 'Sold', 'Rented'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          style={{ ...inputStyle, height: 'auto', padding: '8px 1rem' }}
          placeholder="Additional notes..."
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <MultiImageUpload
          label="Images"
          value={form.images}
          onChange={(imgs) => setForm(prev => ({ ...prev, images: imgs }))}
          folder="cars"
          maxCount={10}
          gridSize={120}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#2a3142',
            background: '#ffffff',
            border: '1px solid #ced4da',
            borderRadius: '3px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#ffffff',
            background: '#28aaa9',
            border: '1px solid #28aaa9',
            borderRadius: '3px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Saving...' : mode === 'edit' ? 'Update Car' : 'Add Car'}
        </button>
      </div>
    </form>
  );
}