import { compressImage } from './imageUtils';

export async function uploadFile(
  file: File,
  folder: string = 'general'
): Promise<{ url?: string; success?: boolean; error?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || 'Upload failed' };
    }

    return { url: data.url, success: true };
  } catch {
    return { error: 'Network error during upload' };
  }
}

export async function uploadImage(
  file: File,
  folder: string = 'images'
): Promise<{ url?: string; success?: boolean; error?: string }> {
  try {
    const compressed = await compressImage(file, 1);
    return uploadFile(compressed, folder);
  } catch {
    return { error: 'Image compression failed' };
  }
}

export async function uploadPdf(
  file: File,
  folder: string = 'documents'
): Promise<{ url?: string; error?: string }> {
  return uploadFile(file, folder);
}

export async function deleteFile(url: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/upload?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || 'Delete failed' };
    }

    return { success: true };
  } catch (error) {
    return { error: 'Network error during delete' };
  }
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  return imageExtensions.includes(getFileExtension(filename));
}

export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename) === 'pdf';
}