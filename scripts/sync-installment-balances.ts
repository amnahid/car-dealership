import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import InstallmentSale from '../src/models/InstallmentSale';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config();

async function syncInstallmentBalances() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    const sales = await InstallmentSale.find({ isDeleted: { $ne: true } });
    console.log(`Found ${sales.length} installment sales to sync.`);

    let updatedCount = 0;
    for (const sale of sales) {
      const calculatedRemaining = Math.max(0, (sale.loanAmount || 0) - (sale.totalPaid || 0));

      if (sale.remainingAmount !== calculatedRemaining) {
        console.log(`Syncing ${sale.saleId}: Loan=${sale.loanAmount}, Paid=${sale.totalPaid}, OldRemaining=${sale.remainingAmount}, NewRemaining=${calculatedRemaining}`);
        
        sale.remainingAmount = calculatedRemaining;
        await sale.save();
        updatedCount++;
      }
    }

    console.log(`Successfully synced ${updatedCount} installment sales.`);
  } catch (error) {
    console.error('Sync error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

syncInstallmentBalances();
