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

    // Determine appropriate statuses based on payment schedule
    const now = new Date();
    let allPaid = true;
    let hasOverdue = false;

    if (Array.isArray(sale.paymentSchedule) && sale.paymentSchedule.length > 0) {
      for (const p of sale.paymentSchedule) {
        if (p.status === 'Paid') {
          // paid
        } else {
          allPaid = false;
          const dueDate = new Date(p.dueDate);
          if (p.status === 'Overdue' || dueDate < now) {
            hasOverdue = true;
          }
        }
      }
    } else {
      allPaid = false;
    }

    const remainingAmount = Number(sale.remainingAmount) || 0;

    let newSaleStatus: 'Active' | 'Completed' | 'Defaulted' = 'Active';
    let newCarStatus: 'On Installment' | 'Sold' | 'Defaulted' = 'On Installment';

    if (allPaid || remainingAmount <= 0) {
      newSaleStatus = 'Completed';
      newCarStatus = 'Sold';
    } else if (hasOverdue) {
      newSaleStatus = 'Defaulted';
      newCarStatus = 'Defaulted';
    } else {
      newSaleStatus = 'Active';
      newCarStatus = 'On Installment';
    }

    const updatedSale = await InstallmentSale.findByIdAndUpdate(
      sale._id,
      { status: newSaleStatus },
      { new: true }
    );

    const car = await Car.findByIdAndUpdate(
      sale.car,
      { status: newCarStatus },
      { new: true }
    );

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: 'Handover Reverted',
      module: 'InstallmentSales',
      targetId: sale.saleId,
      details: `Handover status reverted for car ${car.brand} ${car.model} (${car.plateNumber || car.carId}). Sale status updated to ${newSaleStatus}, car status restored to ${newCarStatus}.`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Handover reverted successfully',
      saleStatus: newSaleStatus,
      carStatus: newCarStatus,
    });
  } catch (error) {
    console.error('Revert handover error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
