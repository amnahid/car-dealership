import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import VehicleDocument from '@/models/Document';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const document = await VehicleDocument.findById(id)
      .populate('car', 'carId brand model')
      .populate('createdBy', 'name');
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    return NextResponse.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const document = await VehicleDocument.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Updated document for car ${document.carId}`,
      module: 'Documents',
      targetId: document._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const document = await VehicleDocument.findByIdAndDelete(id);
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Deleted document for car ${document.carId}`,
      module: 'Documents',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
