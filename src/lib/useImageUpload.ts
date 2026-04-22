'use client';

import { useState, useCallback } from 'react';
import { uploadImage, deleteFile } from './uploadClient';

interface UseImageUploadOptions {
  folder: string;
  maxCount?: number;
}

export function useImageUpload({ folder, maxCount = 10 }: UseImageUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const uploadFiles = useCallback(async (files: FileList | File[], currentImages: string[] = []) => {
    const fileArray = files instanceof FileList ? Array.from(files) : files;
    const remaining = maxCount - currentImages.length;
    
    if (remaining <= 0) {
      setError(`Maximum ${maxCount} images allowed`);
      return currentImages;
    }

    const filesToUpload = fileArray.slice(0, remaining);
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

    setUploading(false);
    setProgress('');
    
    return [...currentImages, ...newImages];
  }, [folder, maxCount]);

  const removeImage = useCallback(async (url: string, currentImages: string[]) => {
    if (url && !url.startsWith('blob:')) {
      try {
        await deleteFile(url);
      } catch {
        // ignore
      }
    }
    return currentImages.filter((img) => img !== url);
  }, []);

  const clearError = useCallback(() => setError(''), []);

  return {
    uploadFiles,
    removeImage,
    uploading,
    progress,
    error,
    clearError,
  };
}