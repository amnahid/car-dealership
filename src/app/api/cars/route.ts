import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Car from '@/models/Car';
import CarPurchase from '@/models/CarPurchase';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    const year = searchParams.get('year');
    const color = searchParams.get('color');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (model) query.model = { $regex: model, $options: 'i' };
    if (year) query.year = parseInt(year);
    if (color) query.color = { $regex: color, $options: 'i' };
    if (status) query.status = status;

    const total = await Car.countDocuments(query);
    const cars = await Car.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('purchase', 'supplier supplierName supplierContact purchasePrice purchaseDate isNewCar conditionImages insuranceUrl insuranceExpiry registrationUrl registrationExpiry roadPermitUrl roadPermitExpiry documentUrl notes')
      .populate('purchase.supplier', 'companyName companyLogo phone email')
      .lean();

    return NextResponse.json({
      cars,
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

    await connectDB();

    // Get unique colors from cars collection
    const colors = await Car.distinct('color').lean();
    const validColors = colors.filter(c => c && c.trim()).sort();

    // Get year range
    const years = await Car.distinct('year').lean();
    const validYears = years.filter(y => y).sort((a, b) => Number(b) - Number(a));

    // Get unique brands
    const brands = await Car.distinct('brand').lean();
    const validBrands = brands.filter(b => b && b.trim()).sort();

    // Get unique models
    const models = await Car.distinct('model').lean();
    const validModels = models.filter(m => m && m.trim()).sort();

    return NextResponse.json({
      colors: validColors,
      years: validYears,
      brands: validBrands,
      models: validModels,
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

    await connectDB();
    const body = await request.json();
    const { purchase, ...carData } = body;

    const car = await Car.create({ ...carData, createdBy: auth.userId });

    if (purchase && purchase.purchasePrice > 0) {
      const supplierId = purchase.supplier;
      
      const transaction = await Transaction.create({
        date: new Date(purchase.purchaseDate),
        type: 'Expense',
        category: 'Car Purchase',
        amount: purchase.purchasePrice,
        description: `Purchase: ${car.brand} ${car.model} (${car.carId}) from ${purchase.supplierName}`,
        referenceId: car.carId,
        referenceType: 'CarPurchase',
        createdBy: auth.userId,
      });

      const carPurchase = await CarPurchase.create({
        car: car._id,
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
      });

      car.purchase = carPurchase._id;
      await car.save();
    }

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Created car ${car.carId}`,
      module: 'Cars',
      targetId: car._id.toString(),
      details: `${car.brand} ${car.model} (${car.year})`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ car }, { status: 201 });
  } catch (error) {
    console.error('Create car error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
