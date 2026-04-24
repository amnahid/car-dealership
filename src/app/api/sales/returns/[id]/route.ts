import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import PurchaseReturn from '@/models/PurchaseReturn';
import Customer from '@/models/Customer';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const returnItem = await PurchaseReturn.findById(id)
      .populate('car', 'carId brand model images')
      .populate('customer', 'fullName phone profilePhoto')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .lean();

    if (!returnItem) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    return NextResponse.json({ return: returnItem });
  } catch (error) {
    console.error('Purchase Return GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch return' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, penaltyAmount, conditionNotes, notes } = body;

    await connectDB();

    const returnItem = await PurchaseReturn.findById(id);
    if (!returnItem) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === 'Approved' || status === 'Rejected') {
        updateData.approvedBy = new mongoose.Types.ObjectId(auth.userId);
        updateData.approvedAt = new Date();
      }
      if (status === 'Completed') {
        updateData.status = 'Completed';
      }
    }
    if (penaltyAmount !== undefined) updateData.penaltyAmount = penaltyAmount;
    if (conditionNotes !== undefined) updateData.conditionNotes = conditionNotes;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await PurchaseReturn.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate('car', 'carId brand model images')
      .populate('customer', 'fullName phone profilePhoto')
      .lean();

    return NextResponse.json({ return: updated });
  } catch (error) {
    console.error('Purchase Return PUT error:', error);
    return NextResponse.json({ error: 'Failed to update return' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const returnItem = await PurchaseReturn.findById(id);
    if (!returnItem) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    if (returnItem.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Can only delete pending returns' },
        { status: 400 }
      );
    }

    await PurchaseReturn.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Purchase Return DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete return' }, { status: 500 });
  }
}