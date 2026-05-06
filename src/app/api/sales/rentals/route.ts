import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError, runInTransaction } from '@/lib/db';
import Rental from '@/models/Rental';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { generateInvoice } from '@/lib/invoiceGenerator';
import { generateRentalAgreement } from '@/lib/agreementGenerator';
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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const query: Record<string, any> = { isDeleted: { $ne: true } };

    if (customerId) {
      query.customer = new mongoose.Types.ObjectId(customerId);
    }

    if (startDateParam || endDateParam) {
      const dateQuery: Record<string, any> = {};
      if (startDateParam) dateQuery.$gte = new Date(startDateParam);
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      query.startDate = dateQuery;
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
      applyVat = true,
      vatInclusive = false,
      vatRate = ZATCA_VAT_RATE,
      rateType = 'Daily',
      advancePayment = 0,
      paymentMethod = 'Cash',
      paymentReference = '',
    } = body;

    if (!carId || !car || !customer || !customerName || !customerPhone || !startDate || !endDate || !dailyRate) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    let totalAmount = 0;
    if (rateType === 'Monthly') {
      const months = Math.ceil(days / 30);
      totalAmount = months * dailyRate; // in this case dailyRate is actually monthly rate
    } else {
      totalAmount = days * dailyRate;
    }

    const effectiveApplyVat = Boolean(applyVat);
    const effectiveVatRate = effectiveApplyVat ? Number(vatRate) || ZATCA_VAT_RATE : 0;
    const effectiveVatInclusive = effectiveApplyVat ? Boolean(vatInclusive) : false;
    const vatInfo = calculateVat(totalAmount, effectiveVatRate, effectiveVatInclusive);
    
    const paid = Number(advancePayment) || 0;
    const remaining = vatInfo.totalWithVat - paid;

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

    let rental: any = null;
    let customerDoc: any = null;
    let carDoc: any = null;

    const result = await runInTransaction(async (session) => {
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
        rateType,
        totalAmount: vatInfo.subtotal,
        securityDeposit: securityDeposit || 0,
        paidAmount: paid,
        remainingAmount: remaining,
        payments: paid > 0 ? [{
          amount: paid,
          date: new Date(),
          method: paymentMethod,
          reference: paymentReference,
          note: 'Advance Payment'
        }] : [],
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
        applyVat: effectiveApplyVat,
        vatRate: effectiveVatRate,
        vatAmount: vatInfo.vatAmount,
        vatInclusive: effectiveVatInclusive,
        totalAmountWithVat: vatInfo.totalWithVat,
        invoiceType: invoiceType || 'Simplified',
        createdBy: user.userId,
      }], { session });

      const r = rentals[0];

      await Car.findByIdAndUpdate(car, { 
        status: 'Rented',
        tafweedStatus: tafweedData.status,
        tafweedAuthorizedTo: tafweedData.authorizedTo,
        tafweedDriverIqama: tafweedData.driverIqama,
        tafweedDurationMonths: tafweedData.durationMonths,
        tafweedExpiryDate: tafweedData.expiryDate,
        driverLicenseExpiryDate: (customerDocInTx as any).licenseExpiryDate ? new Date((customerDocInTx as any).licenseExpiryDate) : undefined,
      }, { session });

      if (paid > 0) {
        await Transaction.create([{
          date: new Date(startDate),
          type: 'Income',
          category: 'Rental Income',
          amount: paid,
          description: `Rental Advance ${r.rentalId} - Car ${carId}`,
          referenceId: r._id.toString(),
          referenceType: 'Rental',
          isAutoGenerated: true,
          createdBy: user.userId,
        }], { session });
      }

      return {
        rental: r,
        customerDoc: customerDocInTx,
        carDoc: await Car.findById(car).session(session).lean()
      };
    });

    rental = result.rental;
    customerDoc = result.customerDoc;
    carDoc = result.carDoc;

    if (!rental) {
      throw new Error('Failed to create rental');
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Created rental: ${rental.rentalId} for car ${carId}`,
      module: 'Rental',
      targetId: rental._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

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
          vatRate: effectiveVatRate,
          vatAmount: vatInfo.vatAmount,
          totalAmount: vatInfo.totalWithVat,
        }],
        subtotal: vatInfo.subtotal,
        vatTotal: vatInfo.vatAmount,
        totalWithVat: vatInfo.totalWithVat,
        notes,
        createdBy: user.userId,
      });
      const updatedRental = await Rental.findById((rental as any)._id);
      if (updatedRental) {
        updatedRental.zatcaUUID = zatcaResult.uuid;
        updatedRental.zatcaQRCode = zatcaResult.qrCode;
        updatedRental.zatcaStatus = zatcaResult.status as any;
        updatedRental.zatcaHash = zatcaResult.xmlHash;
        updatedRental.zatcaResponse = zatcaResult.zatcaResponse;
        if (zatcaResult.errorMessage) updatedRental.zatcaErrorMessage = zatcaResult.errorMessage;
        
        try {
          await updatedRental.save();
          rental = updatedRental;
        } catch (saveError) {
          console.error('Failed to update Rental with ZATCA status:', saveError);
        }
      }
    } catch (zatcaError) {
      console.error('ZATCA processing failed:', zatcaError);
      try {
        await Rental.updateOne(
          { _id: (rental as any)._id },
          { 
            $set: { 
              zatcaStatus: 'Failed', 
              zatcaErrorMessage: zatcaError instanceof Error ? zatcaError.message : 'Unknown ZATCA error' 
            } 
          }
        );
      } catch (updateError) {
        console.error('Failed to update Rental with ZATCA failure:', updateError);
      }
    }

    try {
      const r = rental as any;
      const invoiceUrl = await generateInvoice({
        saleId: r.rentalId,
        saleDate: r.startDate.toString(),
        carId: r.carId,
        carBrand: carDoc?.brand,
        carModel: (carDoc as any)?.model || (carDoc as any)?.carModel,
        carYear: carDoc?.year,
        carPlate: carDoc?.plateNumber,
        carVin: carDoc?.chassisNumber,
        carEngineNumber: carDoc?.engineNumber,
        carSequenceNumber: carDoc?.sequenceNumber,
        carColor: carDoc?.color,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        customerId: (customerDoc as any)?.otherId || (customerDoc as any)?.customerId,
        customerAddress: customerDoc ? `${customerDoc.buildingNumber || ''} ${customerDoc.streetName || ''}, ${customerDoc.district || ''}, ${customerDoc.city || ''} ${customerDoc.postalCode || ''}`.trim() : '',
        salePrice: r.totalAmount,
        discountAmount: 0,
        finalPrice: r.totalAmount,
        vatRate: r.vatRate,
        vatAmount: r.vatAmount,
        finalPriceWithVat: r.totalAmountWithVat,
        startDate: r.startDate.toString(),
        endDate: r.endDate.toString(),
        agentName: r.agentName,
        agentCommission: r.agentCommission,
        zatcaQRCode: rental.zatcaQRCode,
        zatcaUUID: rental.zatcaUUID,
        invoiceType: r.invoiceType || 'Simplified',
      });

      const finalRental = await Rental.findById(r._id);
      if (finalRental) {
        finalRental.invoiceUrl = invoiceUrl;
        await finalRental.save();
        rental = finalRental;
      }
    } catch (invoiceError) {
      console.error('Invoice generation failed:', invoiceError);
    }

    // Auto-generate Agreement
    try {
      const r = rental as any;
      const agreementUrl = await generateRentalAgreement({
        saleId: r.rentalId,
        date: r.startDate.toString(),
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        carId: r.carId,
        carBrand: carDoc?.brand || '',
        carModel: carDoc?.model || '',
        carYear: carDoc?.year || 0,
        carPlate: carDoc?.plateNumber || '',
        carVin: carDoc?.chassisNumber || '',
        startDate: r.startDate.toString(),
        endDate: r.endDate.toString(),
        dailyRate: r.dailyRate,
        totalAmount: r.totalAmount,
        securityDeposit: r.securityDeposit,
      });

      const finalRental = await Rental.findById(r._id);
      if (finalRental) {
        finalRental.agreementUrl = agreementUrl;
        await finalRental.save();
        rental = finalRental;
      }
    } catch (agreementError) {
      console.error('Agreement generation failed:', agreementError);
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
  } catch (error: any) {
    console.error('Create rental error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
