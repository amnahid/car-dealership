import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import VehicleDocument from '@/models/Document';
import EditRequest from '@/models/EditRequest';
import Car from '@/models/Car';
import { getAuthPayload } from '@/lib/apiAuth';
import { sendDocumentRenewalNotifications } from '@/lib/documentNotifications';
import { logActivity } from '@/lib/activityLogger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!auth.normalizedRoles.some(r => ['Admin', 'Car Manager', 'Sales Person'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const document = await VehicleDocument.findById(id).populate('car', 'carId brand model').lean();
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
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

    if (!auth.normalizedRoles.some(r => ['Admin', 'Car Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    
    // INTERCEPTION: If not Admin, queue for approval
    if (!auth.normalizedRoles.includes('Admin')) {
      await EditRequest.create({
        targetModel: 'Document',
        targetId: id,
        requestedBy: auth.userId,
        proposedChanges: body,
        status: 'Pending'
      });

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Requested update for document: ${id}`,
        module: 'Document',
        targetId: id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ 
        message: 'Edit request submitted for admin approval', 
        isPending: true 
      });
    }
    
    // Get the old document to check if expiryDate changed
    const oldDocument = await VehicleDocument.findById(id);
    if (!oldDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    const oldExpiryDate = oldDocument.expiryDate;
    const newExpiryDate = body.expiryDate;
    
    const document = await VehicleDocument.findByIdAndUpdate(id, body, { new: true }).populate('car', 'carId brand model');
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Check if expiry date was extended to a later date
    const oldExpiry = new Date(oldExpiryDate);
    const newExpiry = new Date(newExpiryDate);
    const wasRenewed = newExpiry > oldExpiry;
    
    if (wasRenewed) {
      try {
        const carInfo = (document as unknown as { car: { carId: string; brand: string; model: string } }).car;
        await sendDocumentRenewalNotifications({
          documentId: (document as unknown as { _id: string })._id?.toString() || id,
          carId: carInfo?.carId || '',
          carBrand: carInfo?.brand,
          carModel: carInfo?.model,
          documentType: document.documentType,
          oldExpiryDate: oldExpiryDate,
          newExpiryDate: newExpiryDate,
          renewedDate: new Date(),
        });
      } catch (notifyError) {
        console.error('Document renewal notification failed:', notifyError);
      }
    }

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: 'Updated document',
      module: 'Document',
      targetId: id,
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

    if (!auth.normalizedRoles.some(r => ['Admin', 'Car Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await connectDB();
    const { id } = await params;
    
    const document = await VehicleDocument.findByIdAndDelete(id);
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
