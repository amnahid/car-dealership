import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB, runInTransaction } from '@/lib/db';
import Car, { ICarRaw } from '@/models/Car';
import CarPurchase from '@/models/CarPurchase';
import Repair from '@/models/Repair';
import VehicleDocument from '@/models/Document';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Supplier from '@/models/Supplier';
import EditRequest from '@/models/EditRequest';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { getTafweedStatus } from '@/lib/tafweed';
import { syncPurchaseDocuments } from '@/lib/syncDocuments';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(_request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!auth.normalizedRoles.some(r => ['Admin', 'Car Manager', 'Sales Person', 'Accountant', 'Finance Manager'].includes(r))) {
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

    const carWithTafweedStatus = {
      ...car,
      tafweedStatus: getTafweedStatus((car as unknown as ICarRaw).tafweedExpiryDate ?? null),
    };

    return NextResponse.json({ car: carWithTafweedStatus, repairs, documents });
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

    if (!auth.normalizedRoles.some(r => ['Admin', 'Car Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { purchase, ...carData } = body;

    // INTERCEPTION: If not Admin, queue for approval
    if (!auth.normalizedRoles.includes('Admin')) {
      await EditRequest.create({
        targetModel: 'Car',
        targetId: id,
        requestedBy: auth.userId,
        proposedChanges: body, // Store the full body including purchase info
        status: 'Pending'
      });

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Requested update for car: ${id}`,
        module: 'Cars',
        targetId: id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ 
        message: 'Edit request submitted for admin approval', 
        isPending: true 
      });
    }

    const updatedCar = await runInTransaction(async (session) => {
      const car = await Car.findById(id).session(session);
      if (!car) throw new Error('Car not found');

      // Prevent manual status changes for critical states
      if (carData.status && carData.status !== car.status) {
        const protectedStatuses = ['Sold', 'Rented', 'Defaulted', 'On Installment', 'Reserved', 'Under Repair'];
        if (protectedStatuses.includes(car.status)) {
          throw new Error(`Cannot manually change status of a ${car.status} car. Use the appropriate sale, rental, or repair workflow.`);
        }
        if (protectedStatuses.includes(carData.status)) {
          throw new Error(`Cannot manually set status to ${carData.status}. Use the appropriate sale, rental, or repair workflow.`);
        }
      }

      if (Object.keys(carData).length > 0) {
        Object.assign(car, carData);
        await car.save({ session });
      }

      if (purchase) {
        if (car.purchase) {
          const existingPurchase = await CarPurchase.findById(car.purchase).session(session);
          const oldTransaction = await Transaction.findOne({ 
            referenceId: car.carId, 
            referenceType: 'CarPurchase' 
          }).session(session);

          if (existingPurchase && existingPurchase.purchasePrice !== purchase.purchasePrice) {
            if (oldTransaction) {
              oldTransaction.amount = purchase.purchasePrice;
              oldTransaction.description = `Purchase: ${car.brand} ${car.model} (${car.carId}) from ${purchase.supplierName}`;
              await oldTransaction.save({ session });
              purchase.transactionId = oldTransaction._id;
            } else {
              const transactions = await Transaction.create([{
                date: purchase.purchaseDate || new Date(),
                type: 'Expense',
                category: 'Car Purchase',
                amount: purchase.purchasePrice,
                description: `Purchase: ${car.brand} ${car.model} (${car.carId}) from ${purchase.supplierName}`,
                referenceId: car.carId,
                referenceType: 'CarPurchase',
                createdBy: auth.userId,
              }], { session, ordered: true });
              purchase.transactionId = transactions[0]._id;
            }
          }

          await CarPurchase.findByIdAndUpdate(car.purchase, purchase, { session });
        } else {
          const transactions = await Transaction.create([{
            date: purchase.purchaseDate || new Date(),
            type: 'Expense',
            category: 'Car Purchase',
            amount: purchase.purchasePrice,
            description: `Purchase: ${car.brand} ${car.model} (${car.carId}) from ${purchase.supplierName}`,
            referenceId: car.carId,
            referenceType: 'CarPurchase',
            createdBy: auth.userId,
          }], { session, ordered: true });
          
          const carPurchases = await CarPurchase.create([{
            car: car._id,
            ...purchase,
            transactionId: transactions[0]._id,
            createdBy: auth.userId,
          }], { session, ordered: true });
          
          car.purchase = carPurchases[0]._id;
          await car.save({ session });
        }

        // Sync documents to VehicleDocument collection
        await syncPurchaseDocuments(car.carId, car._id, purchase, auth.userId, session);
      }

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Updated car ${car.carId}`,
        module: 'Cars',
        targetId: car._id.toString(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return await Car.findById(id).session(session).populate('createdBy', 'name email').populate('purchase');
    });

    return NextResponse.json({ car: updatedCar });
  } catch (error: any) {
    console.error('Update car error:', error);
    if (error.message === 'Car not found') return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 });
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

    // Check for active sales or rentals
    const [activeCash, activeInstallment, activeRental] = await Promise.all([
      (await import('@/models/CashSale')).default.findOne({ car: id, status: 'Active' }),
      (await import('@/models/InstallmentSale')).default.findOne({ car: id, status: { $in: ['Active', 'Defaulted'] } }),
      (await import('@/models/Rental')).default.findOne({ car: id, status: 'Active' }),
    ]);

    if (activeCash || activeInstallment || activeRental) {
      return NextResponse.json({ 
        error: 'Cannot delete car with an active sale or rental. Cancel the sale/rental first.' 
      }, { status: 400 });
    }

    const car = await Car.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    // Soft delete associated data to keep reports clean
    await Promise.all([
      Repair.updateMany({ car: id }, { isDeleted: true }),
      VehicleDocument.deleteMany({ car: id }), // Documents don't have isDeleted, so we remove them or they linger
      Transaction.updateMany({ referenceId: car.carId, referenceType: 'CarPurchase' }, { isDeleted: true })
    ]);

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Deleted car ${car.carId}`,
      module: 'Cars',
      targetId: car._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Delete car error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
