import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import EditRequest from '@/models/EditRequest';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

// Import all models that might be subject to approval
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import Rental from '@/models/Rental';
import Transaction from '@/models/Transaction';
import Document from '@/models/Document';

const modelMap: Record<string, mongoose.Model<any>> = {
  Car,
  Customer,
  CashSale,
  InstallmentSale,
  Rental,
  Transaction,
  Document,
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || !user.normalizedRoles.includes('Admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notes } = body; // action: 'Approve' | 'Reject'

    const editReq = await EditRequest.findById(id);
    if (!editReq) {
      return NextResponse.json({ error: 'Edit request not found' }, { status: 404 });
    }

    if (editReq.status !== 'Pending') {
      return NextResponse.json({ error: 'Edit request already processed' }, { status: 400 });
    }

    if (action === 'Approve') {
      const TargetModel = modelMap[editReq.targetModel];
      if (!TargetModel) {
        return NextResponse.json({ error: `Invalid target model: ${editReq.targetModel}` }, { status: 400 });
      }

      // Apply changes
      const updatedDoc = await TargetModel.findByIdAndUpdate(
        editReq.targetId,
        { $set: editReq.proposedChanges },
        { new: true }
      );

      if (!updatedDoc) {
        return NextResponse.json({ error: 'Target document not found. It may have been deleted.' }, { status: 404 });
      }

      editReq.status = 'Approved';
      editReq.reviewedBy = new mongoose.Types.ObjectId(user.userId);
      editReq.reviewedAt = new Date();
      editReq.reviewNotes = notes;
      await editReq.save();

      await logActivity({
        userId: user.userId,
        userName: user.name,
        action: `Approved edit for ${editReq.targetModel}: ${editReq.targetId}`,
        module: 'Admin',
        targetId: editReq.targetId.toString(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ message: 'Edit request approved and applied successfully' });
    } else if (action === 'Reject') {
      editReq.status = 'Rejected';
      editReq.reviewedBy = new mongoose.Types.ObjectId(user.userId);
      editReq.reviewedAt = new Date();
      editReq.reviewNotes = notes;
      await editReq.save();

      await logActivity({
        userId: user.userId,
        userName: user.name,
        action: `Rejected edit for ${editReq.targetModel}: ${editReq.targetId}`,
        module: 'Admin',
        targetId: editReq.targetId.toString(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ message: 'Edit request rejected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Process edit request error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
