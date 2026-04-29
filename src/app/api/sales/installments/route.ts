import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import InstallmentSale, { IInstallmentPayment } from '@/models/InstallmentSale';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { sendInstallmentConfirmationNotifications } from '@/lib/saleNotifications';
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
        { saleId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const [sales, total, totalStatsAgg] = await Promise.all([
      InstallmentSale.find(query)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('car', 'carId brand model images')
        .populate('customer', 'fullName phone profilePhoto')
        .lean(),
      InstallmentSale.countDocuments(query),
      InstallmentSale.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$totalPrice' },
            totalPaid: { $sum: '$totalPaid' },
            totalRemaining: { $sum: '$remainingAmount' },
          },
        },
      ]),
    ]);

    const salesWithDeliver = sales.map((s) => {
      const schedule = (s as any).paymentSchedule || [];
      const nextPending = schedule.find((p: any) => p.status !== 'Paid');
      
      let currentInstallmentStatus = 'N/A';
      if (nextPending) {
        const dueDate = new Date(nextPending.dueDate);
        const now = new Date();
        if (dueDate < now && nextPending.status !== 'Paid') {
          currentInstallmentStatus = 'Overdue';
        } else {
          currentInstallmentStatus = nextPending.status || 'Pending';
        }
      } else if (s.status === 'Completed') {
        currentInstallmentStatus = 'Paid';
      }

      return {
        ...s,
        currentInstallmentStatus,
        canDeliver: s.totalPrice > 0 ? ((s.totalPaid / s.totalPrice) * 100 >= (s.deliveryThresholdPercent ?? 30)) : false,
      };
    });

    return NextResponse.json({
      sales: salesWithDeliver,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      totalValue: totalStatsAgg[0]?.totalValue || 0,
      totalPaid: totalStatsAgg[0]?.totalPaid || 0,
      totalRemaining: totalStatsAgg[0]?.totalRemaining || 0,
    });
  } catch (error) {
    console.error('Get installment sales error:', error);
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
      totalPrice, downPayment, interestRate, tenureMonths, startDate, notes,
      deliveryThresholdPercent, lateFeePercent,
      invoiceType, buyerTrn,
      agentName, agentCommission,
      tafweedAuthorizedTo, tafweedDriverIqama, tafweedExpiryDate, tafweedDurationMonths,
    } = body;

    if (!carId || !car || !customer || !customerName || !customerPhone || !totalPrice || !downPayment || !tenureMonths || !startDate) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const loanAmount = totalPrice - downPayment;
    const monthlyPayment = loanAmount / tenureMonths;
    const remainingAmount = loanAmount;

    const vatInfo = calculateVat(totalPrice, ZATCA_VAT_RATE);

    const start = new Date(startDate);
    const paymentSchedule: IInstallmentPayment[] = [];
    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + i);
      paymentSchedule.push({
        installmentNumber: i,
        dueDate,
        amount: Math.round(monthlyPayment * 100) / 100,
        status: 'Pending' as const,
      });
    }

    const nextPaymentDate = new Date(start);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

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
    let sale;
    let customerDoc;
    let carDoc;

    try {
      await session.withTransaction(async () => {
        const carCheck = await Car.findById(car).session(session);
        if (!carCheck) throw new Error('Car not found');
        if (carCheck.status !== 'In Stock') throw new Error('Car is not available for sale');

        const customerDocInTx = await Customer.findById(customer).session(session).lean();
        if (!customerDocInTx) throw new Error('Customer not found');

        const sales = await InstallmentSale.create([{
          car: car,
          carId,
          customer,
          customerName,
          customerPhone,
          totalPrice,
          downPayment,
          loanAmount,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          interestRate: interestRate || 0,
          tenureMonths,
          startDate,
          paymentSchedule,
          nextPaymentDate,
          nextPaymentAmount: Math.round(monthlyPayment * 100) / 100,
          totalPaid: 0,
          remainingAmount,
          deliveryThresholdPercent: deliveryThresholdPercent ?? 30,
          lateFeePercent: lateFeePercent ?? 2,
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
          finalPriceWithVat: vatInfo.totalWithVat,
          invoiceType: invoiceType || 'Simplified',
          createdBy: user.userId,
        }], { session });
        
        sale = sales[0];

        await Car.findByIdAndUpdate(car, { 
          status: 'On Installment',
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
          category: 'Installment Payment',
          amount: downPayment,
          description: `Down payment for installment sale ${sale.saleId} - Car ${carId}`,
          referenceId: sale._id.toString(),
          referenceType: 'InstallmentSale',
          isAutoGenerated: true,
          createdBy: user.userId,
        }], { session });

        customerDoc = customerDocInTx;
        carDoc = await Car.findById(car).session(session).lean();

        await logActivity({
          userId: user.userId,
          userName: user.name,
          action: `Created installment sale: ${sale.saleId} for car ${carId}`,
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
      throw new Error('Failed to create installment sale');
    }

    // Process ZATCA invoice
    try {
      const zatcaResult = await processZatcaInvoice({
        referenceId: (sale as any)._id.toString(),
        referenceType: 'InstallmentSale',
        saleId: (sale as any).saleId,
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
          name: carDoc ? `${(carDoc as any).brand} ${(carDoc as any).model} (${carId})`.trim() : carId,
          quantity: 1,
          unitPrice: vatInfo.subtotal,
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
      await InstallmentSale.findByIdAndUpdate((sale as any)._id, {
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
      await sendInstallmentConfirmationNotifications(
        {
          name: customerName,
          phone: customerPhone,
          email: (customerDoc as any)?.email,
        },
        {
          saleId: (sale as any).saleId,
          carId: (sale as any).carId,
          carBrand: (carDoc as any)?.brand,
          carModel: (carDoc as any)?.model,
          totalPrice: (sale as any).totalPrice,
          downPayment: (sale as any).downPayment,
          monthlyPayment: (sale as any).monthlyPayment,
          tenureMonths: (sale as any).tenureMonths,
          vatRate: (sale as any).vatRate,
          vatAmount: (sale as any).vatAmount,
          finalPriceWithVat: (sale as any).finalPriceWithVat,
          paymentSchedule: ((sale as any).paymentSchedule || []).map((p: any) => ({
            installmentNumber: p.installmentNumber,
            dueDate: p.dueDate.toString(),
            amount: p.amount,
          })),
        }
      );
    } catch (notifyError) {
      console.error('Customer notification failed:', notifyError);
    }

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    console.error('Create installment sale error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
