import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError, runInTransaction } from '@/lib/db';
import InstallmentSale, { IInstallmentSaleDocument, IInstallmentPayment } from '@/models/InstallmentSale';
import Car, { ICarRaw } from '@/models/Car';
import Customer, { ICustomerDocument } from '@/models/Customer';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { generateInvoice } from '@/lib/invoiceGenerator';
import { generateInstallmentAgreement } from '@/lib/agreementGenerator';
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

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person'].includes(r))) {
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
    const [sales, total, totalStatsAgg] = await Promise.all([
      InstallmentSale.find(query)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('car', 'carId brand model images plateNumber')
        .populate('customer', 'fullName phone profilePhoto')
        .lean(),
      InstallmentSale.countDocuments(query),
      InstallmentSale.aggregate([
        { $match: { ...query, status: { $ne: 'Cancelled' } } },
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

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      carId, car, customer, customerName, customerPhone,
      totalPrice, downPayment, interestRate, tenureMonths, startDate, notes,
      deliveryThresholdPercent, monthlyLateFee, otherFees,
      invoiceType, buyerTrn,
      agentName, agentCommission,
      agentCommissionType, agentCommissionValue,
      guarantor, guarantorName, guarantorPhone,
      tafweedAuthorizedTo, tafweedDriverIqama, tafweedExpiryDate, tafweedDurationMonths,
      applyVat = true,
      vatInclusive = false,
      vatRate = ZATCA_VAT_RATE,
      paymentMethod = 'Cash',
      paymentReference = '',
      voucherNumber,
    } = body;

    if (!carId || !car || !customer || !customerName || !customerPhone || !totalPrice || !downPayment || !tenureMonths || !startDate) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const principalAmount = totalPrice - downPayment;
    const totalInterest = principalAmount * ((interestRate || 0) / 100);
    const loanAmount = principalAmount + totalInterest;
    const monthlyPayment = loanAmount / tenureMonths;
    const remainingAmount = loanAmount;

    const effectiveApplyVat = Boolean(applyVat);
    const effectiveVatRate = effectiveApplyVat ? Number(vatRate) || ZATCA_VAT_RATE : 0;
    const effectiveVatInclusive = effectiveApplyVat ? Boolean(vatInclusive) : false;
    const vatInfo = calculateVat(totalPrice, effectiveVatRate, effectiveVatInclusive);

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

    let sale: IInstallmentSaleDocument | null = null;
    let customerDoc: ICustomerDocument | null = null;
    let carDoc: ICarRaw | null = null;

    const result = await runInTransaction(async (session) => {
      const carCheck = await Car.findById(car).session(session);
      if (!carCheck) throw new Error('Car not found');
      if (carCheck.status !== 'In Stock') throw new Error('Car is not available for sale');

      const customerDocInTx = await Customer.findById(customer).session(session).lean() as ICustomerDocument | null;
      if (!customerDocInTx) throw new Error('Customer not found');

      const sales = await InstallmentSale.create([{
        car: car,
        carId,
        customer,
        customerName,
        customerPhone,
        totalPrice: vatInfo.subtotal,
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
        monthlyLateFee: monthlyLateFee ?? 200,
        otherFees: otherFees ?? 0,
        agentName: agentName || '',
        agentCommission: agentCommission || 0,
        agentCommissionType: agentCommissionType || 'flat',
        agentCommissionValue: agentCommissionValue || 0,
        guarantor: (guarantor ? new mongoose.Types.ObjectId(guarantor) : undefined),
        guarantorName: guarantorName || '',
        guarantorPhone: guarantorPhone || '',
        status: 'Active',
        tafweedStatus: tafweedData.status,
        tafweedAuthorizedTo: tafweedData.authorizedTo,
        tafweedDriverIqama: tafweedData.driverIqama,
        tafweedDurationMonths: tafweedData.durationMonths,
        tafweedExpiryDate: tafweedData.expiryDate,
        driverLicenseExpiryDate: customerDocInTx.licenseExpiryDate ? new Date(customerDocInTx.licenseExpiryDate) : undefined,
        notes,
        applyVat: effectiveApplyVat,
        vatRate: effectiveVatRate,
        vatAmount: vatInfo.vatAmount,
        vatInclusive: effectiveVatInclusive,
        finalPriceWithVat: vatInfo.totalWithVat,
        invoiceType: invoiceType || 'Simplified',
        paymentMethod,
        paymentReference,
        voucherNumber,
        createdBy: user.userId,
      }], { session, ordered: true });
      
      const s = sales[0];

      await Car.findByIdAndUpdate(car, { 
        status: 'On Installment',
        tafweedStatus: tafweedData.status,
        tafweedAuthorizedTo: tafweedData.authorizedTo,
        tafweedDriverIqama: tafweedData.driverIqama,
        tafweedDurationMonths: tafweedData.durationMonths,
        tafweedExpiryDate: tafweedData.expiryDate,
        driverLicenseExpiryDate: customerDocInTx.licenseExpiryDate ? new Date(customerDocInTx.licenseExpiryDate) : undefined,
      }, { session });
      
      await Transaction.create([{
        date: new Date(startDate),
        type: 'Income',
        category: 'Installment Payment',
        amount: downPayment,
        description: `Down payment for installment sale ${s.saleId} - Car ${carId}`,
        referenceId: s._id.toString(),
        referenceType: 'InstallmentSale',
        isAutoGenerated: true,
        createdBy: user.userId,
      }], { session, ordered: true });

      return {
        sale: s,
        customerDoc: customerDocInTx,
        carDoc: await Car.findById(car).session(session).lean()
      };
    });

    sale = result.sale;
    customerDoc = result.customerDoc;
    carDoc = result.carDoc;

    if (!sale) {
      throw new Error('Failed to create installment sale');
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Created installment sale: ${sale.saleId} for car ${carId}`,
      module: 'Sales',
      targetId: sale._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    // Process ZATCA invoice
    try {
      const zatcaResult = await processZatcaInvoice({
        referenceId: sale._id.toString(),
        referenceType: 'InstallmentSale',
        saleId: sale.saleId,
        invoiceType: (invoiceType as 'Standard' | 'Simplified') || 'Simplified',
        issueDate: new Date(startDate),
        supplyDate: new Date(startDate),
        buyer: {
          name: customerName,
          trn: buyerTrn,
          buildingNumber: customerDoc?.buildingNumber || '',
          streetName: customerDoc?.streetName || '',
          district: customerDoc?.district || '',
          city: customerDoc?.city || '',
          postalCode: customerDoc?.postalCode || '',
          countryCode: customerDoc?.countryCode || 'SA',
          otherId: customerDoc?.otherId ? {
            id: customerDoc.otherId,
            type: customerDoc.otherIdType || 'CRN'
          } : undefined
        },
        lineItems: [{
          name: carDoc ? `${carDoc.brand} ${carDoc.carModel} (${carId})`.trim() : carId,
          quantity: 1,
          unitPrice: vatInfo.subtotal,
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
      const updatedSale = await InstallmentSale.findById((sale as any)._id);
      if (updatedSale) {
        updatedSale.zatcaUUID = zatcaResult.uuid;
        updatedSale.zatcaQRCode = zatcaResult.qrCode;
        updatedSale.zatcaHash = zatcaResult.xmlHash;
        updatedSale.zatcaStatus = zatcaResult.status as any;
        updatedSale.zatcaResponse = zatcaResult.zatcaResponse;
        if (zatcaResult.errorMessage) updatedSale.zatcaErrorMessage = zatcaResult.errorMessage;
        
        try {
          await updatedSale.save();
          sale = updatedSale;
        } catch (saveError) {
          console.error('Failed to update InstallmentSale with ZATCA status:', saveError);
        }
      }
    } catch (zatcaError) {
      console.error('ZATCA processing failed:', zatcaError);
      try {
        await InstallmentSale.updateOne(
          { _id: (sale as any)._id },
          { 
            $set: { 
              zatcaStatus: 'Failed', 
              zatcaErrorMessage: zatcaError instanceof Error ? zatcaError.message : 'Unknown ZATCA error' 
            } 
          }
        );
      } catch (updateError) {
        console.error('Failed to update InstallmentSale with ZATCA failure:', updateError);
      }
    }

    try {
      const s = sale as any;
      const invoiceUrl = await generateInvoice({
        saleId: s.saleId,
        saleDate: s.startDate.toString(),
        carId: s.carId,
        carBrand: carDoc?.brand,
        carModel: (carDoc as any)?.model || (carDoc as any)?.carModel,
        carYear: carDoc?.year,
        carPlate: carDoc?.plateNumber,
        carVin: carDoc?.chassisNumber,
        carEngineNumber: (carDoc as any)?.engineNumber,
        carSequenceNumber: (carDoc as any)?.sequenceNumber,
        carColor: (carDoc as any)?.color,
        customerName: s.customerName,
        customerPhone: s.customerPhone,
        customerId: (customerDoc as any)?.otherId || (customerDoc as any)?.customerId,
        customerAddress: customerDoc ? `${customerDoc.buildingNumber || ''} ${customerDoc.streetName || ''}, ${customerDoc.district || ''}, ${customerDoc.city || ''} ${customerDoc.postalCode || ''}`.trim() : '',
        salePrice: s.totalPrice,
        discountAmount: 0,
        finalPrice: s.totalPrice,
        vatRate: s.vatRate,
        vatAmount: s.vatAmount,
        finalPriceWithVat: s.finalPriceWithVat,
        downPayment: s.downPayment,
        loanAmount: s.loanAmount,
        monthlyPayment: s.monthlyPayment,
        tenureMonths: s.tenureMonths,
        startDate: s.startDate.toString(),
        agentName: s.agentName,
        agentCommission: s.agentCommission,
        zatcaQRCode: s.zatcaQRCode,
        zatcaUUID: s.zatcaUUID,
        invoiceType: s.invoiceType || 'Simplified',
      });

      const finalSale = await InstallmentSale.findById(s._id);
      if (finalSale) {
        finalSale.invoiceUrl = invoiceUrl;
        await finalSale.save();
        sale = finalSale;
      }
    } catch (invoiceError) {
      console.error('Invoice generation failed:', invoiceError);
    }

    // Auto-generate Agreement
    try {
      const s = sale as any;
      const agreementUrl = await generateInstallmentAgreement({
        saleId: s.saleId,
        date: s.startDate.toString(),
        customerName: s.customerName,
        customerPhone: s.customerPhone,
        carId: s.carId,
        carBrand: carDoc?.brand || '',
        carModel: carDoc?.carModel || '',
        carYear: carDoc?.year || 0,
        carPlate: carDoc?.plateNumber || '',
        carVin: carDoc?.chassisNumber || '',
        carEngineNumber: carDoc?.engineNumber,
        carSequenceNumber: carDoc?.sequenceNumber,
        carColor: carDoc?.color,
        totalPrice: s.totalPrice,
        downPayment: s.downPayment,
        loanAmount: s.loanAmount,
        monthlyPayment: s.monthlyPayment,
        tenureMonths: s.tenureMonths,
      });

      const finalSale = await InstallmentSale.findById(s._id);
      if (finalSale) {
        finalSale.agreementUrl = agreementUrl;
        await finalSale.save();
        sale = finalSale;
      }
    } catch (agreementError) {
      console.error('Agreement generation failed:', agreementError);
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
  } catch (error: any) {
    console.error('Create installment sale error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
