import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import InstallmentSale from '@/models/InstallmentSale';
import Car from '@/models/Car';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person', 'Car Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const sale = await InstallmentSale.findById(id);
    if (!sale || sale.isDeleted) {
      return NextResponse.json({ error: 'Installment sale not found' }, { status: 404 });
    }

    if (!sale.car) {
      return NextResponse.json({ error: 'No car associated with this installment sale' }, { status: 400 });
    }

    const updatedSale = await InstallmentSale.findByIdAndUpdate(
      sale._id,
      { status: 'Handed' },
      { new: true }
    );

    const car = await Car.findByIdAndUpdate(
      sale.car,
      { status: 'Handed' },
      { new: true }
    );

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: 'Car Handed Over',
      module: 'InstallmentSales',
      targetId: sale.saleId,
      details: `Car ${car.brand} ${car.model} (${car.plateNumber || car.carId}) marked as Handed to customer ${sale.customerName}.`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Car marked as Handed successfully',
      carStatus: 'Handed',
    });
  } catch (error) {
    console.error('Handover error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
