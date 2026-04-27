import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Car from '@/models/Car';
import CarPurchase from '@/models/CarPurchase';
import Repair from '@/models/Repair';
import VehicleDocument from '@/models/Document';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Supplier from '@/models/Supplier';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(_request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['Admin', 'Car Manager', 'Sales Person', 'Accountant', 'Finance Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const car = await Car.findById(id)
      .populate('createdBy', 'name email')
      .populate('purchase', 'supplier supplierName supplierContact purchasePrice purchaseDate isNewCar conditionImages insuranceUrl insuranceExpiry registrationUrl registrationExpiry roadPermitUrl roadPermitExpiry documentUrl notes')
      .populate('purchase.supplier', 'companyName companyLogo phone email')
      .lean();
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    const [repairs, documents] = await Promise.all([
      Repair.find({ car: id }).sort({ repairDate: -1 }).lean(),
      VehicleDocument.find({ car: id }).sort({ expiryDate: 1 }).lean(),
    ]);

    return NextResponse.json({ car, repairs, documents });
  } catch (error) {
    console.error('Get car error:', error);
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

    if (!['Admin', 'Car Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { purchase, ...carData } = body;

    const car = await Car.findById(id);
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    if (Object.keys(carData).length > 0) {
      Object.assign(car, carData);
      await car.save();
    }

    if (purchase) {
      if (car.purchase) {
        const [existingPurchase, oldTransaction] = await Promise.all([
          CarPurchase.findById(car.purchase),
          Transaction.findOne({ referenceId: car.carId, referenceType: 'CarPurchase' }),
        ]);

        if (existingPurchase && existingPurchase.purchasePrice !== purchase.purchasePrice) {
          if (oldTransaction) {
            oldTransaction.amount = purchase.purchasePrice;
            oldTransaction.description = `Purchase: ${car.brand} ${car.model} (${car.carId}) from ${purchase.supplierName}`;
            await oldTransaction.save();
            purchase.transactionId = oldTransaction._id;
          } else {
            const transaction = await Transaction.create({
              date: purchase.purchaseDate || new Date(),
              type: 'Expense',
              category: 'Car Purchase',
              amount: purchase.purchasePrice,
              description: `Purchase: ${car.brand} ${car.model} (${car.carId}) from ${purchase.supplierName}`,
              referenceId: car.carId,
              referenceType: 'CarPurchase',
              createdBy: auth.userId,
            });
            purchase.transactionId = transaction._id;
          }
        }

        await CarPurchase.findByIdAndUpdate(car.purchase, purchase);
      } else {
        const transaction = await Transaction.create({
          date: purchase.purchaseDate || new Date(),
          type: 'Expense',
          category: 'Car Purchase',
          amount: purchase.purchasePrice,
          description: `Purchase: ${car.brand} ${car.model} (${car.carId}) from ${purchase.supplierName}`,
          referenceId: car.carId,
          referenceType: 'CarPurchase',
          createdBy: auth.userId,
        });
        
        const newPurchase = await CarPurchase.create({
          car: car._id,
          ...purchase,
          transactionId: transaction._id,
          createdBy: auth.userId,
        });
        car.purchase = newPurchase._id;
        await car.save();
      }
    }

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Updated car ${car.carId}`,
      module: 'Cars',
      targetId: car._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    const updatedCar = await Car.findById(id)
      .populate('createdBy', 'name email')
      .populate('purchase');

    return NextResponse.json({ car: updatedCar });
  } catch (error) {
    console.error('Update car error:', error);
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

    if (!['Admin', 'Car Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const car = await Car.findByIdAndUpdate(id, { status: 'Sold' }, { new: true });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Archived car ${car.carId}`,
      module: 'Cars',
      targetId: car._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'Car archived successfully' });
  } catch (error) {
    console.error('Delete car error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
