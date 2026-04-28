import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import CashSale from '@/models/CashSale';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
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

    if (!['Admin', 'Sales Person'].includes(user.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customer');

    let query: Record<string, unknown> = { isDeleted: { $ne: true } };

    if (customerId) {
      query.customer = new mongoose.Types.ObjectId(customerId);
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { carId: { $regex: search, $options: 'i' } },
        { saleId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [sales, total, totalRevenueAgg] = await Promise.all([
      CashSale.find(query)
        .sort({ saleDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('car', 'carId brand model images')
        .populate('customer', 'fullName phone profilePhoto')
        .lean(),
      CashSale.countDocuments(query),
      CashSale.aggregate([
        { $match: query },
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

    if (!['Admin', 'Sales Person'].includes(user.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      carId, car, customer, customerName, customerPhone,
      salePrice, discountType = 'flat', discountValue = 0, agentName, agentCommission,
      saleDate, notes,
      invoiceType = 'Simplified',
      buyerTrn,
    } = body;

    if (!carId || !car || !customer || !customerName || !customerPhone || !salePrice || !saleDate) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const computedDiscountAmount = discountType === 'percentage'
      ? Math.round(salePrice * (discountValue || 0) / 100 * 100) / 100
      : (discountValue || 0);
    const finalPrice = salePrice - computedDiscountAmount;
    const { vatAmount, totalWithVat } = calculateVat(finalPrice, ZATCA_VAT_RATE);

    const session = await mongoose.startSession();
    let sale;
    let customerData;
    let carData;

    try {
      await session.withTransaction(async () => {
        const carCheck = await Car.findById(car).session(session);
        if (!carCheck) throw new Error('Car not found');
        if (carCheck.status !== 'In Stock') throw new Error('Car is not available for sale');

        const sales = await CashSale.create([{
          car: car,
          carId,
          customer,
          customerName,
          customerPhone,
          salePrice,
          discountType,
          discountValue: discountValue || 0,
          discountAmount: computedDiscountAmount,
          finalPrice,
          vatRate: ZATCA_VAT_RATE,
          vatAmount,
          finalPriceWithVat: totalWithVat,
          agentName,
          agentCommission: agentCommission || 0,
          saleDate,
          notes,
          invoiceType,
          zatcaStatus: 'Pending',
          createdBy: user.userId,
        }], { session });
        
        sale = sales[0];

        await Car.findByIdAndUpdate(car, { status: 'Sold' }, { session });
        
        await Transaction.create([{
          date: new Date(saleDate),
          type: 'Income',
          category: 'Cash Sale',
          amount: finalPrice,
          description: `Cash sale ${sale.saleId} - Car ${carId}`,
          referenceId: sale._id.toString(),
          referenceType: 'CashSale',
          isAutoGenerated: true,
          createdBy: user.userId,
        }], { session });

        customerData = await Customer.findById(customer).session(session).lean();
        carData = await Car.findById(car).session(session).lean();

        await logActivity({
          userId: user.userId,
          userName: user.name,
          action: `Created cash sale: ${sale.saleId} for car ${carId}`,
          module: 'Sales',
          targetId: sale._id.toString(),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });
      });
    } catch (txError) {
      console.error('Transaction failed:', txError);
      throw txError;
    } finally {
      await session.endSession();
    }

    if (!sale) {
      throw new Error('Failed to create sale');
    }

    // Process ZATCA invoice
    let invoiceUrl = '';
    let zatcaResult;
    try {
      zatcaResult = await processZatcaInvoice({
        referenceId: (sale as any)._id.toString(),
        referenceType: 'CashSale',
        saleId: (sale as any).saleId,
        invoiceType,
        issueDate: new Date(saleDate),
        supplyDate: new Date(saleDate),
        buyer: {
          name: customerName,
          trn: buyerTrn,
          buildingNumber: (customerData as any)?.buildingNumber,
          streetName: (customerData as any)?.streetName,
          district: (customerData as any)?.district,
          city: (customerData as any)?.city,
          postalCode: (customerData as any)?.postalCode,
          countryCode: (customerData as any)?.countryCode || 'SA',
          otherId: (customerData as any)?.otherId ? {
            id: (customerData as any).otherId,
            type: (customerData as any).otherIdType || 'CRN'
          } : undefined
        },
        lineItems: [{
          name: `${(carData as any)?.brand || ''} ${(carData as any)?.model || ''} (${carId})`.trim(),
          quantity: 1,
          unitPrice: finalPrice,
          vatRate: ZATCA_VAT_RATE,
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
        updatedSale.zatcaStatus = zatcaResult.status as 'Pending' | 'Cleared' | 'Reported' | 'Failed' | 'NotRequired';
        updatedSale.zatcaHash = zatcaResult.xmlHash;
        updatedSale.zatcaResponse = zatcaResult.zatcaResponse;
        if (zatcaResult.errorMessage) updatedSale.zatcaErrorMessage = zatcaResult.errorMessage;
        await updatedSale.save();
        sale = updatedSale;
      }
    } catch (zatcaError) {
      console.error('ZATCA processing failed:', zatcaError);
    }

    try {
      invoiceUrl = await generateInvoice({
        saleId: (sale as any).saleId,
        saleDate: (sale as any).saleDate.toString(),
        carId: (sale as any).carId,
        carBrand: (carData as any)?.brand,
        carModel: (carData as any)?.model,
        customerName: (sale as any).customerName,
        customerPhone: (sale as any).customerPhone,
        customerAddress: (customerData as any) ? `${(customerData as any).buildingNumber} ${(customerData as any).streetName}, ${(customerData as any).district}, ${(customerData as any).city} ${(customerData as any).postalCode}` : '',
        salePrice: (sale as any).salePrice,
        discountType: (sale as any).discountType,
        discountValue: (sale as any).discountValue,
        discountAmount: (sale as any).discountAmount,
        finalPrice: (sale as any).finalPrice,
        vatRate: (sale as any).vatRate,
        vatAmount: (sale as any).vatAmount,
        finalPriceWithVat: (sale as any).finalPriceWithVat,
        agentName: (sale as any).agentName,
        agentCommission: (sale as any).agentCommission,
        zatcaQRCode: zatcaResult?.qrCode,
        zatcaUUID: zatcaResult?.uuid,
        invoiceType,
      });

      const finalSale = await CashSale.findById((sale as any)._id);
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
    await sendSaleThankYouNotifications(
      {
        name: customerName,
        phone: customerPhone,
        email: (customerData as any)?.email,
      },
      {
        saleId: (sale as any).saleId,
        carId: (sale as any).carId,
        carBrand: (carData as any)?.brand,
        carModel: (carData as any)?.model,
        salePrice: (sale as any).salePrice,
        discountType: (sale as any).discountType as 'flat' | 'percentage',
        discountValue: (sale as any).discountValue,
        discountAmount: (sale as any).discountAmount,
        finalPrice: (sale as any).finalPrice,
        vatRate: (sale as any).vatRate,
        vatAmount: (sale as any).vatAmount,
        finalPriceWithVat: (sale as any).finalPriceWithVat,
      }
    );
  } catch (notifyError) {
    console.error('Customer notification failed:', notifyError);
  }

    return NextResponse.json({ sale, invoiceUrl, zatcaStatus: zatcaResult?.status }, { status: 201 });
  } catch (error) {
    console.error('Create cash sale error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
