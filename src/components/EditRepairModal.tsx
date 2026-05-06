import { useState } from 'react';

interface Repair {
  _id: string;
  carId: string;
  repairDescription: string;
  partsReplaced: string;
  laborCost: number;
  repairCost: number;
  totalCost: number;
  repairDate: string;
  status: string;
  beforeImages: string[];
  afterImages: string[];
}

interface EditRepairModalProps {
  repair: Repair;
  cars: { _id: string; carId: string; brand: string; model: string; year: number; color?: string; plateNumber?: string }[];
  onClose: () => void;
  onSave: (data: Partial<Repair>) => void;
}

export default function EditRepairModal({ repair, cars, onClose, onSave }: EditRepairModalProps) {
  const [form, setForm] = useState({
    carId: repair.carId,
    repairDescription: repair.repairDescription || '',
    partsReplaced: repair.partsReplaced || '',
    laborCost: repair.laborCost?.toString() || '0',
    repairCost: repair.repairCost?.toString() || '0',
    repairDate: repair.repairDate?.split('T')[0] || '',
    status: repair.status || 'Pending',
    beforeImages: repair.beforeImages || [],
    afterImages: repair.afterImages || [],
  });
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'beforeImages' | 'afterImages') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        [field]: [...prev[field], reader.result as string]
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (field: 'beforeImages' | 'afterImages', index: number) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_: string, i: number) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const laborCost = parseFloat(form.laborCost) || 0;
      const repairCost = parseFloat(form.repairCost) || 0;
      await onSave({
        carId: form.carId,
        repairDescription: form.repairDescription,
        partsReplaced: form.partsReplaced,
        laborCost,
        repairCost,
        totalCost: laborCost + repairCost,
        repairDate: form.repairDate,
        status: form.status,
        beforeImages: form.beforeImages,
        afterImages: form.afterImages,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '600px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>Edit Repair - {repair.carId}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Car ID *</label>
              <input required value={form.carId} onChange={(e) => setForm({ ...form, carId: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} list="carIds" />
              <datalist id="carIds">
                {cars.map(car => (
                  <option 
                    key={car._id} 
                    value={car.plateNumber || car.carId} 
                    label={`${car.brand} ${car.model} (${car.year})${car.color ? ` - ${car.color}` : ''}`}
                  />
                ))}
              </datalist>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Repair Date *</label>
              <input required type="date" value={form.repairDate} onChange={(e) => setForm({ ...form, repairDate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Labor Cost</label>
              <input type="number" value={form.laborCost} onChange={(e) => setForm({ ...form, laborCost: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Parts/Repair Cost</label>
              <input type="number" value={form.repairCost} onChange={(e) => setForm({ ...form, repairCost: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Repair Description *</label>
            <textarea required value={form.repairDescription} onChange={(e) => setForm({ ...form, repairDescription: e.target.value })} style={{ width: '100%', height: '80px', fontSize: '14px', borderRadius: '0', padding: '12px', border: '1px solid #ced4da' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Parts Replaced</label>
            <textarea value={form.partsReplaced} onChange={(e) => setForm({ ...form, partsReplaced: e.target.value })} style={{ width: '100%', height: '60px', fontSize: '14px', borderRadius: '0', padding: '12px', border: '1px solid #ced4da' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Before Images</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {form.beforeImages.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img} alt={`Before ${i + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ced4da' }} />
                  <button type="button" onClick={() => removeImage('beforeImages', i)} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', borderRadius: '50%', background: '#ec4561', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', lineHeight: '1' }}>×</button>
                </div>
              ))}
            </div>
            <label style={{ display: 'inline-block', padding: '8px 16px', fontSize: '14px', border: '1px solid #28aaa9', borderRadius: '3px', color: '#28aaa9', cursor: 'pointer' }}>
              + Add Before Image
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'beforeImages')} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>After Images</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {form.afterImages.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img} alt={`After ${i + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ced4da' }} />
                  <button type="button" onClick={() => removeImage('afterImages', i)} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', borderRadius: '50%', background: '#ec4561', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', lineHeight: '1' }}>×</button>
                </div>
              ))}
            </div>
            <label style={{ display: 'inline-block', padding: '8px 16px', fontSize: '14px', border: '1px solid #28aaa9', borderRadius: '3px', color: '#28aaa9', cursor: 'pointer' }}>
              + Add After Image
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'afterImages')} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
