
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ZatcaInvoice from '../src/models/ZatcaInvoice';
import InstallmentSale from '../src/models/InstallmentSale';
import CashSale from '../src/models/CashSale';
import Rental from '../src/models/Rental';

dotenv.config({ path: '.env.local' });

async function checkZatca() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('MONGODB_URI not found');

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const pendingInvoices = await ZatcaInvoice.find({ status: 'Pending' });
    console.log(`Found ${pendingInvoices.length} Pending ZATCA Invoices`);

    for (const inv of pendingInvoices) {
      console.log(`- UUID: ${inv.uuid}, Type: ${inv.referenceType}, SaleID: ${inv.saleId}, Date: ${inv.issueDate}`);
    }

    const failedInvoices = await ZatcaInvoice.find({ status: 'Failed' });
    console.log(`Found ${failedInvoices.length} Failed ZATCA Invoices`);
    for (const inv of failedInvoices) {
      console.log(`- FAILED: UUID: ${inv.uuid}, SaleID: ${inv.saleId}, Error: ${inv.errorMessage}`);
    }

    console.log('\nInstallment Sales ZATCA status:');
    const installmentSales = await InstallmentSale.find({ zatcaStatus: { $exists: true } }).select('saleId zatcaStatus zatcaErrorMessage');
    installmentSales.forEach(s => console.log(`- ${s.saleId}: ${s.zatcaStatus} ${s.zatcaErrorMessage || ''}`));

    console.log('\nCash Sales ZATCA status:');
    const cashSales = await CashSale.find({ zatcaStatus: { $exists: true } }).select('saleId zatcaStatus zatcaErrorMessage');
    cashSales.forEach(s => console.log(`- ${s.saleId}: ${s.zatcaStatus} ${s.zatcaErrorMessage || ''}`));

    console.log('\nRentals ZATCA status:');
    const rentals = await Rental.find({ zatcaStatus: { $exists: true } }).select('rentalId zatcaStatus zatcaErrorMessage');
    rentals.forEach(s => console.log(`- ${s.rentalId}: ${s.zatcaStatus} ${s.zatcaErrorMessage || ''}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkZatca();
