import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB, DatabaseConnectionError, runInTransaction } from '@/lib/db';
import Car from '@/models/Car';
import CarPurchase from '@/models/CarPurchase';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Supplier from '@/models/Supplier';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { getTafweedStatus } from '@/lib/tafweed';
import { syncPurchaseDocuments } from '@/lib/syncDocuments';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['Admin', 'Car Manager', 'Sales Person', 'Accountant', 'Finance Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const brand = searchParams.get('brand');
    const plateNumber = searchParams.get('plateNumber');
    const model = searchParams.get('model');
    const year = searchParams.get('year');
    const color = searchParams.get('color');
    const status = searchParams.get('status');
    const q = searchParams.get('q');

    const query: Record<string, unknown> = {
      isDeleted: { $ne: true }
    };
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (plateNumber) query.plateNumber = { $regex: plateNumber, $options: 'i' };
    if (model) query.model = { $regex: model, $options: 'i' };
    if (year) query.year = parseInt(year);
    if (color) query.color = { $regex: color, $options: 'i' };
    if (status) query.status = status;

    if (q) {
      query.$or = [
        { carId: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { model: { $regex: q, $options: 'i' } },
        { plateNumber: { $regex: q, $options: 'i' } },
        { chassisNumber: { $regex: q, $options: 'i' } },
        { engineNumber: { $regex: q, $options: 'i' } },
        { sequenceNumber: { $regex: q, $options: 'i' } },
      ];
    }

    const [total, cars] = await Promise.all([
      Car.countDocuments(query),
      Car.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-documents')
        .populate('createdBy', 'name email')
        .populate('purchase', 'supplier supplierName supplierContact purchasePrice purchaseDate isNewCar conditionImages insuranceUrl insuranceExpiry registrationUrl registrationExpiry roadPermitUrl roadPermitExpiry documentUrl notes')
        .populate('purchase.supplier', 'companyName companyLogo phone email')
        .lean(),
    ]);

    const carsWithTafweedStatus = (cars as Array<Record<string, unknown>>).map((car) => ({
      ...car,
      tafweedStatus: getTafweedStatus((car.tafweedExpiryDate as Date | string | null | undefined) ?? null),
    }));

    return NextResponse.json({
      cars: carsWithTafweedStatus,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get cars error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['Admin', 'Car Manager', 'Sales Person', 'Accountant', 'Finance Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const [colors, years, brands, models] = await Promise.all([
      Car.distinct('color'),
      Car.distinct('year'),
      Car.distinct('brand'),
      Car.distinct('model'),
    ]);

    return NextResponse.json({
      colors: colors.filter((c: string) => c && c.trim()).sort(),
      years: years.filter((y: number) => y).sort((a: number, b: number) => Number(b) - Number(a)),
      brands: brands.filter((b: string) => b && b.trim()).sort(),
      models: models.filter((m: string) => m && m.trim()).sort(),
    });
  } catch (error) {
    console.error('Get car options error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['Admin', 'Car Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { purchase, ...carData } = body;

    const car = await runInTransaction(async (session) => {
      const cars = await Car.create([{ ...carData, createdBy: auth.userId }], { session });
      const c = cars[0];

      if (purchase && purchase.purchasePrice > 0) {
        const supplierId = purchase.supplier;
        
        const transactions = await Transaction.create([{
          date: new Date(purchase.purchaseDate),
          type: 'Expense',
          category: 'Car Purchase',
          amount: purchase.purchasePrice,
          description: `Purchase: ${c.brand} ${c.model} (${c.carId}) from ${purchase.supplierName}`,
          referenceId: c.carId,
          referenceType: 'CarPurchase',
          isAutoGenerated: true,
          createdBy: auth.userId,
        }], { session });
        
        const transaction = transactions[0];

        const carPurchases = await CarPurchase.create([{
          car: c._id,
          supplier: supplierId || undefined,
          supplierName: purchase.supplierName,
          supplierContact: purchase.supplierContact,
          purchasePrice: purchase.purchasePrice,
          purchaseDate: purchase.purchaseDate,
          isNewCar: purchase.isNewCar ?? true,
          conditionImages: purchase.conditionImages || [],
          insuranceUrl: purchase.insuranceUrl,
          insuranceExpiry: purchase.insuranceExpiry,
          registrationUrl: purchase.registrationUrl,
          registrationExpiry: purchase.registrationExpiry,
          roadPermitUrl: purchase.roadPermitUrl,
          roadPermitExpiry: purchase.roadPermitExpiry,
          documentUrl: purchase.documentUrl,
          notes: purchase.notes,
          transactionId: transaction._id,
          createdBy: auth.userId,
        }], { session });
        
        const carPurchase = carPurchases[0];

        c.purchase = carPurchase._id;
        await c.save({ session });

        // Sync documents to VehicleDocument collection
        await syncPurchaseDocuments(c.carId, c._id, purchase, auth.userId, session);
      }

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Created car ${c.carId}`,
        module: 'Cars',
        targetId: c._id.toString(),
        details: `${c.brand} ${c.model} (${c.year})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return c;
    });

    return NextResponse.json({ car }, { status: 201 });
  } catch (error: any) {
    console.error('Create car error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
