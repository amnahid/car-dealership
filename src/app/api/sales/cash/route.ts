import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError, runInTransaction } from '@/lib/db';
import CashSale, { ICashSaleDocument } from '@/models/CashSale';
import Car, { ICarRaw } from '@/models/Car';
import Customer, { ICustomerDocument } from '@/models/Customer';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { generateInvoice } from '@/lib/invoiceGenerator';
import { sendSaleThankYouNotifications } from '@/lib/saleNotifications';
import { processZatcaInvoice, calculateVat, ZATCA_VAT_RATE } from '@/lib/zatca/invoiceService';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const customerId = searchParams.get('customer');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = { isDeleted: { $ne: true } };

    // Default: Hide cancelled sales unless specifically requested or searching
    if (!status && !search) {
      query.status = { $ne: 'Cancelled' };
    }

    if (customerId) {
      query.customer = new mongoose.Types.ObjectId(customerId);
    }

    if (startDate || endDate) {
      const dateQuery: any = {};
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      query.saleDate = dateQuery;
    }

    if (search) {
      const matchingCars = await Car.find({ plateNumber: { $regex: search, $options: 'i' } }).select('_id').lean();
      const matchingCarIds = matchingCars.map(c => c._id);

      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { carId: { $regex: search, $options: 'i' } },
        { saleId: { $regex: search, $options: 'i' } },
        { car: { $in: matchingCarIds } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const [sales, total, totalRevenueAgg] = await Promise.all([
      CashSale.find(query)
        .sort({ saleDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('car', 'carId brand model images plateNumber')
        .populate('customer', 'fullName phone profilePhoto')
        .lean(),
      CashSale.countDocuments(query),
      CashSale.aggregate([
        { $match: { ...query, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$finalPrice' } } },
      ]),
    ]);

    return NextResponse.json({
      sales,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      totalRevenue: totalRevenueAgg[0]?.total || 0,
    });
  } catch (error) {
    console.error('Get cash sales error:', error);
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

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      carId, car, customer, customerName, customerPhone,
      salePrice, discountType = 'flat', discountValue = 0, agentName, agentCommission,
      agentCommissionType, agentCommissionValue,
      saleDate, notes,
      invoiceType = 'Simplified',
      buyerTrn,
      registrationDriverName,
      registrationDriverIqama,
      applyVat = true,
      vatInclusive = false,
      vatRate = ZATCA_VAT_RATE,
    } = body;

    if (!carId || !car || !salePrice || !saleDate) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const computedDiscountAmount = discountType === 'percentage'
      ? Math.round(salePrice * (discountValue || 0) / 100 * 100) / 100
      : (discountValue || 0);
    const finalPrice = salePrice - computedDiscountAmount;
    const effectiveApplyVat = Boolean(applyVat);
    const effectiveVatRate = effectiveApplyVat ? Number(vatRate) || ZATCA_VAT_RATE : 0;
    const effectiveVatInclusive = effectiveApplyVat ? Boolean(vatInclusive) : false;
    const { subtotal, vatAmount, totalWithVat } = calculateVat(finalPrice, effectiveVatRate, effectiveVatInclusive);

    let sale: any = null;
    let customerData: any = null;
    let carData: any = null;

    const result = await runInTransaction(async (session) => {
      const carCheck = await Car.findById(car).session(session);
      if (!carCheck) throw new Error('Car not found');
      if (carCheck.status !== 'In Stock') throw new Error('Car is not available for sale');

      const customerDocInTx = customer 
        ? await Customer.findById(customer).session(session).lean() as unknown as ICustomerDocument
        : null;

      const sales = await CashSale.create([{
        car: car,
        carId,
        customer: customer || undefined,
        customerName: customerName || 'Cash Customer',
        customerPhone: customerPhone || '',
        salePrice,
        discountType,
        discountValue: discountValue || 0,
        discountAmount: computedDiscountAmount,
        finalPrice: subtotal,
        applyVat: effectiveApplyVat,
        vatRate: effectiveVatRate,
        vatAmount,
        vatInclusive: effectiveVatInclusive,
        finalPriceWithVat: totalWithVat,
        agentName,
        agentCommission: agentCommission || 0,
        agentCommissionType: agentCommissionType || 'flat',
        agentCommissionValue: agentCommissionValue || 0,
        saleDate,
        notes,        invoiceType,
        zatcaStatus: 'Pending',
        registrationDriverName: registrationDriverName || customerName || agentName || '',
        registrationDriverIqama: registrationDriverIqama || '',
        registrationDriverLicenseExpiryDate: customerDocInTx?.licenseExpiryDate
          ? new Date(customerDocInTx.licenseExpiryDate)
          : undefined,
        createdBy: user.userId,
      }], { session, ordered: true });
      
      const s = sales[0];

      await Car.findByIdAndUpdate(car, {
        status: 'Sold',
        tafweedStatus: 'None',
        tafweedAuthorizedTo: registrationDriverName || customerName || agentName || '',
        tafweedDriverIqama: registrationDriverIqama || '',
        tafweedDurationMonths: undefined,
        tafweedExpiryDate: undefined,
        driverLicenseExpiryDate: customerDocInTx?.licenseExpiryDate
          ? new Date(customerDocInTx.licenseExpiryDate)
          : undefined,
      }, { session });
      
      await Transaction.create([{
        date: new Date(saleDate),
        type: 'Income',
        category: 'Cash Sale',
        amount: finalPrice,
        description: `Cash sale ${s.saleId} - Car ${carId}`,
        referenceId: s._id.toString(),
        referenceType: 'CashSale',
        isAutoGenerated: true,
        createdBy: user.userId,
      }], { session, ordered: true });

      return {
        sale: s,
        customerData: customerDocInTx,
        carData: await Car.findById(car).session(session).lean() as unknown as ICarRaw
      };
    });

    sale = result.sale;
    customerData = result.customerData;
    carData = result.carData;

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Created cash sale: ${sale.saleId} for car ${carId}`,
      module: 'Sales',
      targetId: sale._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    if (!sale) {
      throw new Error('Failed to create sale');
    }

    // Process ZATCA invoice
    let invoiceUrl = '';
    let zatcaResult;
    try {
      zatcaResult = await processZatcaInvoice({
        referenceId: (sale as ICashSaleDocument)._id.toString(),
        referenceType: 'CashSale',
        saleId: (sale as ICashSaleDocument).saleId,
        invoiceType,
        issueDate: new Date(saleDate),
        supplyDate: new Date(saleDate),
        buyer: {
          name: customerName || 'Cash Customer',
          trn: buyerTrn,
          buildingNumber: customerData?.buildingNumber,
          streetName: customerData?.streetName,
          district: customerData?.district,
          city: customerData?.city,
          postalCode: customerData?.postalCode,
          countryCode: customerData?.countryCode || 'SA',
          otherId: customerData?.otherId ? {
            id: customerData.otherId,
            type: customerData.otherIdType || 'CRN'
          } : undefined
        },
        lineItems: [{
          name: `${carData?.brand || ''} ${carData?.carModel || (carData as any)?.model || ''} - Plate: ${carData?.plateNumber || '-'} - VIN: ${carData?.chassisNumber || '-'}`.trim(),
          quantity: 1,
          unitPrice: finalPrice,
          vatRate: effectiveVatRate,
          vatAmount,
          totalAmount: totalWithVat,
        }],
        subtotal: finalPrice,
        vatTotal: vatAmount,
        totalWithVat,
        discountAmount: computedDiscountAmount,
        notes,
        createdBy: user.userId,
      });

      const updatedSale = await CashSale.findById((sale as any)._id);
      if (updatedSale) {
        updatedSale.zatcaUUID = zatcaResult.uuid;
        updatedSale.zatcaQRCode = zatcaResult.qrCode;
        updatedSale.zatcaStatus = zatcaResult.status as any;
        updatedSale.zatcaHash = zatcaResult.xmlHash;
        updatedSale.zatcaResponse = zatcaResult.zatcaResponse;
        if (zatcaResult.errorMessage) updatedSale.zatcaErrorMessage = zatcaResult.errorMessage;
        
        try {
          await updatedSale.save();
          sale = updatedSale;
        } catch (saveError) {
          console.error('Failed to update CashSale with ZATCA status:', saveError);
        }
      }
    } catch (zatcaError) {
      console.error('ZATCA processing failed:', zatcaError);
      try {
        await CashSale.updateOne(
          { _id: (sale as ICashSaleDocument)._id },
          { 
            $set: { 
              zatcaStatus: 'Failed', 
              zatcaErrorMessage: zatcaError instanceof Error ? zatcaError.message : 'Unknown ZATCA error' 
            } 
          }
        );
      } catch (updateError) {
        console.error('Failed to update CashSale with ZATCA failure:', updateError);
      }
    }

    try {
      const s = sale as ICashSaleDocument;
      invoiceUrl = await generateInvoice({
        saleId: s.saleId,
        saleDate: s.saleDate.toString(),
        carId: s.carId,
        carBrand: carData?.brand,
        carModel: (carData as any)?.carModel || (carData as any)?.model,
        carYear: carData?.year,
        carPlate: carData?.plateNumber,
        carVin: carData?.chassisNumber,
        carEngineNumber: carData?.engineNumber,
        carSequenceNumber: carData?.sequenceNumber,
        carColor: carData?.color,
        customerName: s.customerName || 'Cash Customer',
        customerPhone: s.customerPhone || '',
        customerId: (customerData as any)?.otherId || (customerData as any)?.customerId || '',
        customerAddress: customerData ? `${customerData.buildingNumber || ''} ${customerData.streetName || ''}, ${customerData.district || ''}, ${customerData.city || ''} ${customerData.postalCode || ''}`.trim() : '',
        salePrice: s.salePrice,
        discountType: s.discountType,
        discountValue: s.discountValue,
        discountAmount: s.discountAmount,
        finalPrice: s.finalPrice,
        vatRate: s.vatRate,
        vatAmount: s.vatAmount,
        finalPriceWithVat: s.finalPriceWithVat,
        agentName: s.agentName,
        agentCommission: s.agentCommission,
        zatcaQRCode: sale.zatcaQRCode,
        zatcaUUID: sale.zatcaUUID,
        invoiceType: s.invoiceType || 'Simplified',
      });


      const finalSale = await CashSale.findById(s._id);
      if (finalSale) {
        finalSale.invoiceUrl = invoiceUrl;
        await finalSale.save();
        sale = finalSale;
      }
    } catch (invoiceError) {
      console.error('Invoice generation failed:', invoiceError);
    }

    // Send thank-you notifications to customer
    try {
      const s = sale as ICashSaleDocument;
      await sendSaleThankYouNotifications(
        {
          name: customerName || 'Customer',
          phone: customerPhone || '',
          email: customerData?.email,
        },
        {
          saleId: s.saleId,
          carId: s.carId,
          carBrand: carData?.brand,
          carModel: carData?.carModel,
          salePrice: s.salePrice,
          discountType: s.discountType,
          discountValue: s.discountValue,
          discountAmount: s.discountAmount,
          finalPrice: s.finalPrice,
          vatRate: s.vatRate,
          vatAmount: s.vatAmount,
          finalPriceWithVat: s.finalPriceWithVat,
        }
      );
    } catch (notifyError) {
      console.error('Customer notification failed:', notifyError);
    }

    return NextResponse.json({ sale, invoiceUrl, zatcaStatus: zatcaResult?.status }, { status: 201 });
  } catch (error: any) {
    console.error('Create cash sale error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
