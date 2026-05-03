import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Rental from '@/models/Rental';
import EditRequest from '@/models/EditRequest';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { generateInvoice } from '@/lib/invoiceGenerator';
import { generateRentalAgreement } from '@/lib/agreementGenerator';
import { processZatcaInvoice, calculateVat, ZATCA_VAT_RATE } from '@/lib/zatca/invoiceService';
import { getTafweedStatus, validateTafweedAuthorization } from '@/lib/tafweed';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Sales Person'].includes(user.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const rental = await Rental.findById(id).lean();
    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    return NextResponse.json({ rental });
  } catch (error) {
    console.error('Get rental error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Sales Person'].includes(user.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid rental ID' }, { status: 400 });
    }

    const rental = await Rental.findById(id);
    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (rental.status === 'Cancelled') {
      return NextResponse.json({ error: 'Cannot update cancelled rental' }, { status: 400 });
    }

    const body = await request.json();
    const {
      dailyRate, securityDeposit, returnDate, actualReturnDate, notes, status, invoiceType, buyerTrn, agentName, agentCommission,
      tafweedAuthorizedTo, tafweedDriverIqama, tafweedExpiryDate, tafweedDurationMonths,
    } = body;

    // INTERCEPTION: If not Admin, queue for approval
    if (user.normalizedRole !== 'Admin') {
      await EditRequest.create({
        targetModel: 'Rental',
        targetId: id,
        requestedBy: user.userId,
        proposedChanges: body,
        status: 'Pending'
      });

      await logActivity({
        userId: user.userId,
        userName: user.name,
        action: `Requested update for rental: ${id}`,
        module: 'Sales',
        targetId: id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ 
        message: 'Edit request submitted for admin approval', 
        isPending: true 
      });
    }

    if (status !== undefined && (status === 'Completed' || status === 'Cancelled')) {
      const currentStatus = (rental.status as string) || 'Active';
      if (currentStatus === 'Completed' || currentStatus === 'Cancelled') {
        return NextResponse.json({ error: 'Rental already closed' }, { status: 400 });
      }

      rental.status = status;
      if (status === 'Completed') {
        const returnD = actualReturnDate ? new Date(actualReturnDate) : new Date();
        rental.actualReturnDate = returnD;

        // Calculate late fee if returned after end date
        const endD = new Date(rental.endDate);
        const diffTime = returnD.getTime() - endD.getTime();
        
        if (diffTime > 0) {
          // Normalize to start of day or count full 24-hour periods
          // Here we use simple day difference
          const extraDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (extraDays > 0) {
            const extraCharge = extraDays * rental.dailyRate;
            rental.lateFee = (rental.lateFee || 0) + extraCharge;
            
            // Re-calculate totals
            const totalWithVat = rental.totalAmountWithVat + extraCharge * (1 + (rental.vatRate || 15) / 100);
            rental.totalAmountWithVat = Math.round(totalWithVat * 100) / 100;
            
            // Generate a transaction for the late fee
            await Transaction.create({
              date: returnD,
              type: 'Income',
              category: 'Rental Income',
              amount: extraCharge,
              description: `Late return fee for rental ${rental.rentalId} (${extraDays} extra days)`,
              referenceId: rental._id.toString(),
              referenceType: 'Rental',
              isAutoGenerated: true,
              createdBy: user.userId,
            });
          }
        }
      }
      await rental.save();

      // Update car back to In Stock when rental is completed or cancelled
      // Clear Tafweed info as well
      await Car.findByIdAndUpdate(rental.car, { 
        status: 'In Stock',
        tafweedStatus: 'None',
        tafweedAuthorizedTo: '',
        tafweedDriverIqama: '',
        tafweedDurationMonths: null,
        tafweedExpiryDate: null
      });

      // Only soft delete transaction if cancelled. Completed rentals should keep their revenue.
      if (status === 'Cancelled') {
        await Transaction.findOneAndUpdate(
          { referenceId: rental._id.toString(), referenceType: 'Rental', isAutoGenerated: true },
          { isDeleted: true }
        );
      }

      await logActivity({
        userId: user.userId,
        userName: user.name,
        action: `${status === 'Completed' ? 'Closed' : 'Cancelled'} rental: ${rental.rentalId}`,
        module: 'Rental',
        targetId: rental._id.toString(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ rental });
    }

    if (dailyRate !== undefined) rental.dailyRate = dailyRate;
    if (securityDeposit !== undefined) rental.securityDeposit = securityDeposit;
    if (returnDate !== undefined) rental.returnDate = new Date(returnDate);
    if (actualReturnDate !== undefined) rental.actualReturnDate = new Date(actualReturnDate);
    if (
      tafweedAuthorizedTo !== undefined ||
      tafweedDriverIqama !== undefined ||
      tafweedExpiryDate !== undefined ||
      tafweedDurationMonths !== undefined
    ) {
      let validated;
      try {
        validated = validateTafweedAuthorization({
          startDate: rental.startDate,
          customerName: rental.customerName,
          tafweedAuthorizedTo: tafweedAuthorizedTo ?? rental.tafweedAuthorizedTo,
          tafweedDriverIqama: tafweedDriverIqama ?? rental.tafweedDriverIqama,
          tafweedExpiryDate: tafweedExpiryDate ?? rental.tafweedExpiryDate,
          tafweedDurationMonths: tafweedDurationMonths ?? rental.tafweedDurationMonths,
          allowExpired: true,
        });
      } catch (validationError) {
        return NextResponse.json(
          { error: validationError instanceof Error ? validationError.message : 'Invalid Tafweed details' },
          { status: 400 }
        );
      }

      rental.tafweedAuthorizedTo = validated.authorizedTo;
      rental.tafweedDriverIqama = validated.driverIqama;
      rental.tafweedDurationMonths = validated.durationMonths;
      rental.tafweedExpiryDate = validated.expiryDate;
      (rental as any).tafweedStatus = getTafweedStatus(validated.expiryDate);
    }
    if (notes !== undefined) rental.notes = notes;
    if (agentName !== undefined) (rental as any).agentName = agentName;
    if (agentCommission !== undefined) (rental as any).agentCommission = agentCommission;

    const zatcaFieldChanged = invoiceType !== undefined || buyerTrn !== undefined;
    if (invoiceType !== undefined) rental.invoiceType = invoiceType;
    if (buyerTrn !== undefined) (rental as any).buyerTrn = buyerTrn;

    await rental.save();

    // Sync Tafweed info to car if updated
    if (
      tafweedAuthorizedTo !== undefined ||
      tafweedDriverIqama !== undefined ||
      tafweedExpiryDate !== undefined ||
      tafweedDurationMonths !== undefined
    ) {
      await Car.findByIdAndUpdate(rental.car, {
        tafweedAuthorizedTo: rental.tafweedAuthorizedTo,
        tafweedDriverIqama: rental.tafweedDriverIqama,
        tafweedDurationMonths: rental.tafweedDurationMonths,
        tafweedExpiryDate: rental.tafweedExpiryDate,
        tafweedStatus: getTafweedStatus(rental.tafweedExpiryDate as Date | string | null),
      });
    }

    // Re-run ZATCA if invoiceType or buyerTrn changed
    if (zatcaFieldChanged) {
      try {
        const [customerDoc, carDoc] = await Promise.all([
          Customer.findById(rental.customer).lean(),
          Car.findById(rental.car).lean(),
        ]);
        const diffTime = Math.abs(new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime());
        const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const vatInfo = calculateVat(rental.totalAmount, ZATCA_VAT_RATE);
        const rentalDesc = carDoc
          ? `Rental - ${carDoc.brand} ${carDoc.model} (${days} days)`.trim()
          : `Rental - ${rental.carId} (${days} days)`;
        const zatcaResult = await processZatcaInvoice({
          referenceId: rental._id.toString(),
          referenceType: 'Rental',
          saleId: rental.rentalId,
          invoiceType: (rental.invoiceType as 'Standard' | 'Simplified') || 'Simplified',
          issueDate: new Date(rental.startDate),
          supplyDate: new Date(rental.startDate),
          buyer: {
            name: rental.customerName,
            trn: (rental as any).buyerTrn || '',
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
            unitPrice: rental.dailyRate,
            vatRate: ZATCA_VAT_RATE,
            vatAmount: vatInfo.vatAmount,
            totalAmount: vatInfo.totalWithVat,
          }],
          subtotal: vatInfo.subtotal,
          vatTotal: vatInfo.vatAmount,
          totalWithVat: vatInfo.totalWithVat,
          notes: rental.notes,
          createdBy: user.userId,
        });
        await Rental.findByIdAndUpdate(rental._id, {
          zatcaUUID: zatcaResult.uuid,
          zatcaQRCode: zatcaResult.qrCode,
          zatcaHash: zatcaResult.xmlHash,
          zatcaStatus: zatcaResult.status,
          zatcaResponse: zatcaResult.zatcaResponse,
          vatAmount: vatInfo.vatAmount,
        });
      } catch (zatcaError) {
        console.error('ZATCA reprocessing failed:', zatcaError);
      }
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Updated rental: ${rental.rentalId}`,
      module: 'Rental',
      targetId: rental._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ rental });
  } catch (error) {
    console.error('Update rental error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthPayload(request);
    if (!user || user.normalizedRole !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid rental ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'generate-invoice') {
      const rental = await Rental.findById(id);
      if (!rental) {
        return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
      }

      const [carData, customerData] = await Promise.all([
        Car.findById(rental.car).lean() as any,
        Customer.findById(rental.customer).lean() as any,
      ]);

      const invoiceUrl = await generateInvoice({
        saleId: rental.rentalId,
        saleDate: rental.startDate.toString(),
        carId: rental.carId,
        carBrand: carData?.brand,
        carModel: carData?.carModel,
        customerName: rental.customerName,
        customerPhone: rental.customerPhone,
        customerAddress: customerData ? `${customerData.buildingNumber} ${customerData.streetName}, ${customerData.district}, ${customerData.city} ${customerData.postalCode}` : '',
        salePrice: rental.totalAmount,
        discountAmount: 0,
        finalPrice: rental.totalAmount,
        vatRate: rental.vatRate || 15,
        vatAmount: rental.vatAmount || 0,
        finalPriceWithVat: rental.totalAmountWithVat || 0,
        agentName: rental.agentName,
        agentCommission: rental.agentCommission,
        zatcaQRCode: rental.zatcaQRCode,
        zatcaUUID: rental.zatcaUUID,
        invoiceType: rental.invoiceType || 'Simplified',
      });

      rental.invoiceUrl = `${invoiceUrl}?t=${Date.now()}`;
      await rental.save();

      await logActivity({
        userId: user.userId,
        userName: user.name,
        action: `Regenerated invoice for rental: ${rental.rentalId}`,
        module: 'Sales',
        targetId: rental._id.toString(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ invoiceUrl, rental });
    }

    if (action === 'generate-agreement') {
      const rental = await Rental.findById(id);
      if (!rental) {
        return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
      }

      const carData = await Car.findById(rental.car).lean() as any;

      const agreementUrl = await generateRentalAgreement({
        saleId: rental.rentalId,
        date: rental.startDate.toString(),
        customerName: rental.customerName,
        customerPhone: rental.customerPhone,
        carId: rental.carId,
        carBrand: carData?.brand || '',
        carModel: carData?.model || '',
        carYear: carData?.year || 0,
        carPlate: carData?.plateNumber || '',
        carVin: carData?.chassisNumber || '',
        startDate: rental.startDate.toString(),
        endDate: rental.endDate.toString(),
        dailyRate: rental.dailyRate,
        totalAmount: rental.totalAmount,
        securityDeposit: rental.securityDeposit,
      });

      rental.agreementUrl = agreementUrl;
      await rental.save();

      await logActivity({
        userId: user.userId,
        userName: user.name,
        action: `Regenerated agreement for rental: ${rental.rentalId}`,
        module: 'Sales',
        targetId: rental._id.toString(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ agreementUrl, rental });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Patch rental error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Sales Person'].includes(user.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid rental ID' }, { status: 400 });
    }

    const rental = await Rental.findById(id);
    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (rental.status === 'Cancelled') {
      return NextResponse.json({ error: 'Rental already cancelled' }, { status: 400 });
    }

    // Soft delete
    await Rental.findByIdAndUpdate(id, { isDeleted: true });
    
    await Promise.all([
      Car.findByIdAndUpdate(rental.car, {
        status: 'In Stock',
        tafweedStatus: 'None',
        tafweedAuthorizedTo: '',
        tafweedDriverIqama: '',
        tafweedDurationMonths: null,
        tafweedExpiryDate: null,
      }),
      Transaction.updateMany(
        { referenceId: rental._id.toString(), referenceType: 'Rental', isAutoGenerated: true },
        { isDeleted: true }
      ),
    ]);

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Deleted rental: ${rental.rentalId}`,
      module: 'Rental',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'Rental deleted successfully' });
  } catch (error) {
    console.error('Delete rental error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
