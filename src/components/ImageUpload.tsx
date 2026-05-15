'use client';

import { useRef, useState, useEffect } from 'react';
import { uploadImage, uploadFile, deleteFile } from '@/lib/uploadClient';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onDelete?: () => void;
  folder?: 'avatars' | 'employees' | 'customers' | 'suppliers' | 'suppliers/agents' | 'cars' | 'cars/condition' | 'repairs/before' | 'repairs/after' | 'documents' | 'guarantors' | 'sales-agents';
  label?: string;
  size?: number;
}

interface MultiImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  maxCount?: number;
  gridSize?: number;
}

export function ImageUpload({
  value,
  onChange,
  onDelete,
  folder = 'avatars',
  label = 'Photo',
  size = 120,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return;
    }

    setError('');
    setUploading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const result = await uploadImage(file, folder);
      if (result.success && result.url) {
        onChange(result.url);
      } else {
        setError(result.error || 'Upload failed');
        setPreview(value || null);
      }
    } catch {
      setError('Upload failed');
      setPreview(value || null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove this photo?')) return;

    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }

    if (onDelete) {
      onDelete();
    } else if (value) {
      try {
        await deleteFile(value);
      } catch {
        // ignore
      }
    }

    setPreview(null);
  };

  const initials = label && label !== 'Photo'
    ? label.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '2px dashed #e5e5e5',
          background: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          cursor: !uploading ? 'pointer' : 'default',
          opacity: uploading ? 0.6 : 1,
        }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading && (
          <span style={{ fontSize: '12px', color: '#9ca8b3' }}>Uploading...</span>
        )}
        {!uploading && preview ? (
          <img
            src={preview}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setPreview(null)}
          />
        ) : !uploading ? (
          <span
            style={{
              fontSize: size * 0.35,
              fontWeight: 600,
              color: '#9ca8b3',
              textAlign: 'center',
              lineHeight: 1,
            }}
          >
            {initials}
          </span>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {error && (
        <p style={{ color: '#ec4561', fontSize: '12px', margin: 0 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            fontSize: '12px',
            padding: '4px 12px',
            background: '#fff',
            color: '#28aaa9',
            border: '1px solid #28aaa9',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {value ? 'Change' : 'Upload'}
        </button>
        {value && (
          <button
            type="button"
            onClick={handleDelete}
            style={{
              fontSize: '12px',
              padding: '4px 12px',
              background: '#fff',
              color: '#ec4561',
              border: '1px solid #ec4561',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export function MultiImageUpload({
  value = [],
  onChange,
  folder = 'cars',
  label = 'Images',
  maxCount = 10,
  gridSize = 100,
}: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxCount - value.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxCount} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setError('');
    setUploading(true);

    const newImages: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) continue;

      setProgress(`Uploading ${i + 1}/${filesToUpload.length}...`);
      
      const result = await uploadImage(file, folder);
      if (result.url) {
        newImages.push(result.url);
      }
    }

    onChange([...value, ...newImages]);
    setUploading(false);
    setProgress('');
    
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = async (index: number) => {
    const urlToRemove = value[index];
    
    if (urlToRemove && !urlToRemove.startsWith('blob:')) {
      try {
        await deleteFile(urlToRemove);
      } catch {
        // ignore
      }
    }

    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#2a3142',
          marginBottom: '8px',
        }}
      >
        {label} {maxCount && `(${value.length}/${maxCount})`}
      </label>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}px, 1fr))`,
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        {value.map((url, index) => (
          <div
            key={index}
            style={{
              width: gridSize,
              height: gridSize,
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid #e5e5e5',
            }}
          >
            <img
              src={url}
              alt={`${label} ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              title="Remove image"
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ec4561',
                color: '#fff',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        ))}

        {value.length < maxCount && (
          <div
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.borderColor = '#28aaa9';
                e.currentTarget.style.background = '#f0f8f8';
              }
            }}
            onMouseLeave={(e) => {
              if (!uploading) {
                e.currentTarget.style.borderColor = '#ced4da';
                e.currentTarget.style.background = '#f8f9fa';
              }
            }}
            onClick={() => !uploading && inputRef.current?.click()}
            style={{
              width: gridSize,
              height: gridSize,
              borderRadius: '4px',
              border: '2px dashed #ced4da',
              background: '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {uploading ? (
              <span style={{ fontSize: '10px', color: '#9ca8b3' }}>{progress}</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca8b3" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <span style={{ fontSize: '10px', color: '#9ca8b3' }}>Upload</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={uploading}
      />

      {error && (
        <p style={{ color: '#ec4561', fontSize: '12px', margin: 0 }}>{error}</p>
      )}
    </div>
  );
}

export function FileUpload({
  value,
  onChange,
  accept = '.pdf,.jpg,.jpeg,.png',
}: {
  value?: string;
  onChange: (url: string, fileName: string) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus('Uploading...');

    const result = await uploadImage(file, 'documents');
    
    if (result.success && result.url) {
      onChange(result.url, file.name);
    } else {
      setStatus(result.error || 'Upload failed');
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={uploading}
        style={{
          width: '100%',
          height: '40px',
          fontSize: '14px',
          borderRadius: '0',
          padding: '0 12px',
          border: '1px dashed #ced4da',
          background: '#f8f9fa',
        }}
      />
      <p style={{ fontSize: '12px', color: '#9ca8b3', marginTop: '4px' }}>
        {uploading ? status : 'Accepted formats: PDF, JPG, JPEG, PNG.'}
      </p>
    </div>
  );
}

export function DocumentUpload({
  value,
  onChange,
  label = 'Document',
  folder = 'customers',
}: {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file, folder);
      if (result.success && result.url) {
        setTimeout(() => onChange(result.url || ''), 0);
      }
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', height: '40px', background: '#f0fdf4', border: '1px solid #42ca7f', borderRadius: '4px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#42ca7f" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: '13px', color: '#2a3142', textDecoration: 'none' }}>{label}</a>
        <button type="button" onClick={() => onChange('')} style={{ background: '#ec4561', color: '#fff', border: 'none', borderRadius: '3px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>Remove</button>
      </div>
    );
  }

  return (
    <div onClick={() => inputRef.current?.click()} style={{ padding: '8px 12px', height: '40px', border: '2px dashed #ced4da', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px', borderRadius: '4px' }}>
      {uploading ? (
        <span style={{ fontSize: '11px', color: '#28aaa9' }}>Uploading...</span>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca8b3" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span style={{ fontSize: '10px', color: '#9ca8b3' }}>Click to upload</span>
        </>
      )}
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
    </div>
  );
}

export function MultiDocumentUpload({
  values = [],
  onChange,
  folder = 'documents',
  label = 'Documents',
}: {
  values?: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls = [...values];

    for (const file of Array.from(files)) {
      try {
        const result = await uploadFile(file, folder);
        if (result.success && result.url) {
          newUrls.push(result.url);
        }
      } catch (err) {
        console.error(err);
      }
    }

    onChange(newUrls);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (index: number) => {
    const newUrls = values.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      {values.map((url, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', height: '40px', background: '#f0fdf4', border: '1px solid #42ca7f', borderRadius: '4px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#42ca7f" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: '13px', color: '#2a3142', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url.split('/').pop() || label}
          </a>
          <button type="button" onClick={() => handleRemove(index)} style={{ background: '#ec4561', color: '#fff', border: 'none', borderRadius: '3px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>Remove</button>
        </div>
      ))}
      <div onClick={() => !uploading && inputRef.current?.click()} style={{ padding: '8px 12px', height: '40px', border: '2px dashed #ced4da', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'not-allowed' : 'pointer', gap: '4px', borderRadius: '4px', opacity: uploading ? 0.6 : 1 }}>
        {uploading ? (
          <span style={{ fontSize: '11px', color: '#28aaa9' }}>Uploading...</span>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca8b3" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: '10px', color: '#9ca8b3' }}>Click to upload document</span>
          </>
        )}
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

export function PdfUpload({
  value,
  onChange,
  label = 'PDF Document',
}: {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(file, 'agreements');
      if (result.success && result.url) {
        setTimeout(() => onChange(result.url || ''), 0);
      }
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', height: '40px', background: '#f0fdf4', border: '1px solid #42ca7f', borderRadius: '4px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#42ca7f" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: '13px', color: '#2a3142', textDecoration: 'none' }}>{label}</a>
        <button type="button" onClick={() => onChange('')} style={{ background: '#ec4561', color: '#fff', border: 'none', borderRadius: '3px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>Remove</button>
      </div>
    );
  }

  return (
    <div onClick={() => inputRef.current?.click()} style={{ padding: '8px 12px', height: '40px', border: '2px dashed #ced4da', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px', borderRadius: '4px' }}>
      {uploading ? (
        <span style={{ fontSize: '11px', color: '#28aaa9' }}>Uploading...</span>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca8b3" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span style={{ fontSize: '10px', color: '#9ca8b3' }}>Click to upload PDF</span>
        </>
      )}
      <input ref={inputRef} type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
    </div>
  );
}

export default ImageUpload;