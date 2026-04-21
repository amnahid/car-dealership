import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

async function saveFile(file: File, subfolder: string): Promise<UploadResult> {
  try {
    const uploadDir = getUploadDir();
    const targetDir = path.join(uploadDir, subfolder);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > MAX_FILE_SIZE) {
      return { success: false, error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext);
    const timestamp = Date.now();
    const safeName = `${timestamp}-${sanitizeFilename(baseName)}${ext}`;
    const filePath = path.join(targetDir, safeName);

    fs.writeFileSync(filePath, buffer);

    return {
      success: true,
      url: `/uploads/${subfolder}/${safeName}`,
      filename: safeName,
    };
  } catch (error) {
    console.error('File save error:', error);
    return { success: false, error: 'Failed to save file' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `File type not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    const result = await saveFile(file, folder);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json({ error: 'No file URL provided' }, { status: 400 });
    }

    const relativePath = fileUrl.replace('/uploads/', '');
    const filePath = path.join(getUploadDir(), relativePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ success: true, message: 'File deleted' });
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}