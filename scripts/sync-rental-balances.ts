import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import Rental from '../src/models/Rental';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config();

async function syncRentalBalances() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    const rentals = await Rental.find({ isDeleted: { $ne: true } });
    console.log(`Found ${rentals.length} rentals to sync.`);

    let updatedCount = 0;
    for (const rental of rentals) {
      // Logic from pre-save hook
      const total = rental.totalAmountWithVat || rental.totalAmount || 0;
      const calculatedRemaining = Math.max(0, total - (rental.paidAmount || 0));

      // Only update if there is a discrepancy
      if (rental.remainingAmount !== calculatedRemaining || (rental.totalAmountWithVat === 0 && rental.totalAmount > 0)) {
        console.log(`Syncing ${rental.rentalId}: Total=${total}, Paid=${rental.paidAmount}, OldRemaining=${rental.remainingAmount}, NewRemaining=${calculatedRemaining}`);
        
        // If totalAmountWithVat is missing, set it to totalAmount (as a reasonable default)
        if (!rental.totalAmountWithVat && rental.totalAmount > 0) {
            rental.totalAmountWithVat = rental.totalAmount;
        }
        
        rental.remainingAmount = calculatedRemaining;
        await rental.save();
        updatedCount++;
      }
    }

    console.log(`Successfully synced ${updatedCount} rentals.`);
  } catch (error) {
    console.error('Sync error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

syncRentalBalances();
