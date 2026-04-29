import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Rental from '@/models/Rental';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { sendRentalConfirmationNotifications } from '@/lib/saleNotifications';
import { processZatcaInvoice, calculateVat, ZATCA_VAT_RATE } from '@/lib/zatca/invoiceService';
import { validateTafweedAuthorization } from '@/lib/tafweed';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Sales Person'].includes(user.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const customerId = searchParams.get('customer');

    const query: Record<string, unknown> = { isDeleted: { $ne: true } };

    if (customerId) {
      query.customer = new mongoose.Types.ObjectId(customerId);
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { carId: { $regex: search, $options: 'i' } },
        { rentalId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const [rentals, total, totalStatsAgg] = await Promise.all([
      Rental.find(query)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('car', 'carId brand model images')
        .populate('customer', 'fullName phone profilePhoto')
        .lean(),
      Rental.countDocuments(query),
      Rental.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const rentalsWithStatus = rentals.map((r) => {
      let currentStatus = (r as any).status;
      if (currentStatus === 'Active') {
        const endDate = new Date((r as any).endDate);
        if (endDate < new Date()) {
          currentStatus = 'Overdue';
        }
      }
      return { ...r, currentStatus };
    });

    return NextResponse.json({
      rentals: rentalsWithStatus,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      totalRevenue: totalStatsAgg[0]?.total || 0,
    });
  } catch (error) {
    console.error('Get rentals error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Sales Person'].includes(user.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      carId, car, customer, customerName, customerPhone,
      startDate, endDate, dailyRate, securityDeposit, notes,
      invoiceType, buyerTrn,
      agentName, agentCommission,
      tafweedAuthorizedTo, tafweedDriverIqama, tafweedExpiryDate, tafweedDurationMonths,
    } = body;

    if (!carId || !car || !customer || !customerName || !customerPhone || !startDate || !endDate || !dailyRate) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalAmount = days * dailyRate;
    const vatInfo = calculateVat(totalAmount, ZATCA_VAT_RATE);
    let tafweedData;
    try {
      tafweedData = validateTafweedAuthorization({
        startDate,
        customerName,
        tafweedAuthorizedTo,
        tafweedDriverIqama,
        tafweedExpiryDate,
        tafweedDurationMonths,
      });
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : 'Invalid Tafweed details' },
        { status: 400 }
      );
    }

    const session = await mongoose.startSession();
    let rental;
    let customerDoc;
    let carDoc;

    try {
      await session.withTransaction(async () => {
        const carCheck = await Car.findById(car).session(session);
        if (!carCheck) throw new Error('Car not found');
        if (carCheck.status !== 'In Stock') throw new Error('Car is not available for rent');

        const customerDocInTx = await Customer.findById(customer).session(session).lean();
        if (!customerDocInTx) throw new Error('Customer not found');

        const rentals = await Rental.create([{
          car: car,
          carId,
          customer,
          customerName,
          customerPhone,
          startDate,
          endDate,
          dailyRate,
          totalAmount,
          securityDeposit: securityDeposit || 0,
          agentName: agentName || '',
          agentCommission: agentCommission || 0,
          status: 'Active',
          tafweedStatus: tafweedData.status,
          tafweedAuthorizedTo: tafweedData.authorizedTo,
          tafweedDriverIqama: tafweedData.driverIqama,
          tafweedDurationMonths: tafweedData.durationMonths,
          tafweedExpiryDate: tafweedData.expiryDate,
          driverLicenseExpiryDate: (customerDocInTx as any).licenseExpiryDate ? new Date((customerDocInTx as any).licenseExpiryDate) : undefined,
          notes,
          vatRate: ZATCA_VAT_RATE,
          vatAmount: vatInfo.vatAmount,
          invoiceType: invoiceType || 'Simplified',
          createdBy: user.userId,
        }], { session });

        rental = rentals[0];

        await Car.findByIdAndUpdate(car, { 
          status: 'Rented',
          tafweedStatus: tafweedData.status,
          tafweedAuthorizedTo: tafweedData.authorizedTo,
          tafweedDriverIqama: tafweedData.driverIqama,
          tafweedDurationMonths: tafweedData.durationMonths,
          tafweedExpiryDate: tafweedData.expiryDate,
          driverLicenseExpiryDate: (customerDocInTx as any).licenseExpiryDate ? new Date((customerDocInTx as any).licenseExpiryDate) : undefined,
        }, { session });

        await Transaction.create([{
          date: new Date(startDate),
          type: 'Income',
          category: 'Rental Income',
          amount: totalAmount,
          description: `Rental ${rental.rentalId} - Car ${carId}`,
          referenceId: rental._id.toString(),
          referenceType: 'Rental',
          isAutoGenerated: true,
          createdBy: user.userId,
        }], { session });

        customerDoc = customerDocInTx;
        carDoc = await Car.findById(car).session(session).lean();

        await logActivity({
          userId: user.userId,
          userName: user.name,
          action: `Created rental: ${rental.rentalId} for car ${carId}`,
          module: 'Rental',
          targetId: rental._id.toString(),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });
      });
    } catch (txError) {
      console.error('Rental transaction failed:', txError);
      throw txError;
    } finally {
      await session.endSession();
    }

    if (!rental) {
      throw new Error('Failed to create rental');
    }

    // Process ZATCA invoice
    try {
      const rentalDesc = carDoc
        ? `Rental - ${(carDoc as any).brand} ${(carDoc as any).model} (${days} days)`.trim()
        : `Rental - ${carId} (${days} days)`;
      const zatcaResult = await processZatcaInvoice({
        referenceId: (rental as any)._id.toString(),
        referenceType: 'Rental',
        saleId: (rental as any).rentalId,
        invoiceType: (invoiceType as 'Standard' | 'Simplified') || 'Simplified',
        issueDate: new Date(startDate),
        supplyDate: new Date(startDate),
        buyer: {
          name: customerName,
          trn: buyerTrn,
          buildingNumber: (customerDoc as any)?.buildingNumber,
          streetName: (customerDoc as any)?.streetName,
          district: (customerDoc as any)?.district,
          city: (customerDoc as any)?.city,
          postalCode: (customerDoc as any)?.postalCode,
          countryCode: (customerDoc as any)?.countryCode || 'SA',
          otherId: (customerDoc as any)?.otherId ? {
            id: (customerDoc as any).otherId,
            type: (customerDoc as any).otherIdType || 'CRN'
          } : undefined
        },
        lineItems: [{
          name: rentalDesc,
          quantity: days,
          unitPrice: dailyRate,
          vatRate: ZATCA_VAT_RATE,
          vatAmount: vatInfo.vatAmount,
          totalAmount: vatInfo.totalWithVat,
        }],
        subtotal: vatInfo.subtotal,
        vatTotal: vatInfo.vatAmount,
        totalWithVat: vatInfo.totalWithVat,
        notes,
        createdBy: user.userId,
      });
      await Rental.findByIdAndUpdate((rental as any)._id, {
        zatcaUUID: zatcaResult.uuid,
        zatcaQRCode: zatcaResult.qrCode,
        zatcaHash: zatcaResult.xmlHash,
        zatcaStatus: zatcaResult.status,
        zatcaResponse: zatcaResult.zatcaResponse,
        ...(zatcaResult.errorMessage && { zatcaErrorMessage: zatcaResult.errorMessage }),
      });
    } catch (zatcaError) {
      console.error('ZATCA processing failed:', zatcaError);
    }

    // Send confirmation notifications to customer
    try {
      await sendRentalConfirmationNotifications(
        {
          name: customerName,
          phone: customerPhone,
          email: (customerDoc as any)?.email,
        },
        {
          rentalId: (rental as any).rentalId,
          carId: (rental as any).carId,
          carBrand: (carDoc as any)?.brand,
          carModel: (carDoc as any)?.model,
          startDate: (rental as any).startDate.toString(),
          endDate: (rental as any).endDate.toString(),
          totalAmount: (rental as any).totalAmount,
          dailyRate: (rental as any).dailyRate,
          vatRate: (rental as any).vatRate,
          vatAmount: (rental as any).vatAmount,
          finalPriceWithVat: (rental as any).totalAmountWithVat,
        }
      );
    } catch (notifyError) {
      console.error('Customer notification failed:', notifyError);
    }

    return NextResponse.json({ rental }, { status: 201 });
  } catch (error) {
    console.error('Create rental error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
