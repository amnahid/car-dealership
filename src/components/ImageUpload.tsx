'use client';

import { useRef, useState, useEffect } from 'react';
import { uploadImage, deleteFile } from '@/lib/uploadClient';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onDelete?: () => void;
  folder: 'avatars' | 'employees' | 'customers';
  label?: string;
  size?: number;
}

export default function ImageUpload({
  value,
  onChange,
  onDelete,
  folder,
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