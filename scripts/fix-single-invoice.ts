
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateInvoice } from '../src/lib/invoiceGenerator';
import { ensureVisualQRCode } from '../src/lib/zatca/invoiceService';
import InstallmentSale from '../src/models/InstallmentSale';
import Car from '../src/models/Car';
import Customer from '../src/models/Customer';

dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function fixSpecificInvoice() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('MONGODB_URI not found');

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Register models
    const _car = Car;
    const _cust = Customer;

    const saleId = 'INS-0001';
    const sale = await InstallmentSale.findOne({ saleId }).populate('car').populate('customer');
    
    if (!sale) {
      console.error(`Sale ${saleId} not found`);
      return;
    }

    console.log(`Fixing ${saleId}...`);

    // 1. Ensure visual QR
    const visualQR = await ensureVisualQRCode(sale.zatcaQRCode || '');
    
    // 2. Regenerate PDF
    const carData = sale.car as any;
    const customerData = sale.customer as any;
    
    const invoiceUrl = await generateInvoice({
      saleId: sale.saleId,
      saleDate: sale.startDate.toString(),
      carId: sale.carId,
      carBrand: carData?.brand,
      carModel: carData?.carModel || carData?.model,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      customerAddress: customerData ? `${customerData.buildingNumber || ''} ${customerData.streetName || ''}, ${customerData.district || ''}, ${customerData.city || ''} ${customerData.postalCode || ''}`.trim() : '',
      salePrice: sale.totalPrice,
      discountAmount: 0,
      finalPrice: sale.totalPrice,
      vatRate: sale.vatRate || 15,
      vatAmount: sale.vatAmount,
      finalPriceWithVat: sale.finalPriceWithVat,
      agentName: sale.agentName,
      agentCommission: sale.agentCommission,
      zatcaQRCode: visualQR,
      zatcaUUID: sale.zatcaUUID,
      invoiceType: sale.invoiceType || 'Simplified',
    });

    // 3. Update database
    await InstallmentSale.updateOne(
      { _id: sale._id },
      { 
        $set: { 
          zatcaStatus: 'Reported', 
          zatcaQRCode: visualQR,
          invoiceUrl: invoiceUrl,
          zatcaErrorMessage: undefined
        } 
      }
    );

    console.log(`Successfully fixed ${saleId}! New invoice URL: ${invoiceUrl}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

fixSpecificInvoice();
