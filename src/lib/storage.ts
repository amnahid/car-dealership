import { put, del, head } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const USE_VERCEL_BLOB = process.env.USE_VERCEL_BLOB === 'true';
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

function getUploadDir(): string {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string
): Promise<UploadResult> {
  if (USE_VERCEL_BLOB && BLOB_TOKEN) {
    return uploadToVercelBlob(buffer, originalName, contentType, folder);
  }
  return uploadToLocal(buffer, originalName, contentType, folder);
}

export async function deleteFile(url: string): Promise<{ success: boolean; error?: string }> {
  if (USE_VERCEL_BLOB && BLOB_TOKEN) {
    return deleteFromVercelBlob(url);
  }
  return deleteFromLocal(url);
}

export function isUsingVercelBlob(): boolean {
  return USE_VERCEL_BLOB && !!BLOB_TOKEN;
}

async function uploadToVercelBlob(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string
): Promise<UploadResult> {
  try {
    let ext = path.extname(originalName);
    let baseName = path.basename(originalName, ext);
    
    if (!baseName || baseName === 'blob' || !ext) {
      ext = contentType.includes('pdf') ? '.pdf' : '.jpg';
      baseName = `document_${Date.now()}`;
    }
    
    const timestamp = Date.now();
    const safeName = `${timestamp}-${sanitizeFilename(baseName)}${ext}`;
    const blobPath = `${folder}/${safeName}`;

    const blob = await put(blobPath, buffer, {
      contentType,
      access: 'public',
      token: BLOB_TOKEN,
    });

    return {
      success: true,
      url: blob.url,
      filename: safeName,
    };
  } catch (error) {
    console.error('Vercel Blob upload error:', error);
    return { success: false, error: 'Failed to upload to Vercel Blob' };
  }
}

async function deleteFromVercelBlob(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    await del(url, { token: BLOB_TOKEN });
    return { success: true };
  } catch (error) {
    console.error('Vercel Blob delete error:', error);
    return { success: false, error: 'Failed to delete from Vercel Blob' };
  }
}

async function uploadToLocal(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string
): Promise<UploadResult> {
  try {
    const uploadDir = getUploadDir();
    const targetDir = path.join(uploadDir, folder);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let ext = path.extname(originalName);
    let baseName = path.basename(originalName, ext);
    
    if (!baseName || baseName === 'blob' || !ext) {
      ext = contentType.includes('pdf') ? '.pdf' : '.jpg';
      baseName = `document_${Date.now()}`;
    }
    
    const safeName = `${Date.now()}-${sanitizeFilename(baseName)}${ext}`;
    const filePath = path.join(targetDir, safeName);

    fs.writeFileSync(filePath, buffer);

    return {
      success: true,
      url: `/uploads/${folder}/${safeName}`,
      filename: safeName,
    };
  } catch (error) {
    console.error('Local file save error:', error);
    return { success: false, error: 'Failed to save file locally' };
  }
}

async function deleteFromLocal(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const relativePath = url.replace('/uploads/', '');
    const filePath = path.join(getUploadDir(), relativePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }

    return { success: false, error: 'File not found' };
  } catch (error) {
    console.error('Local file delete error:', error);
    return { success: false, error: 'Failed to delete file' };
  }
}
