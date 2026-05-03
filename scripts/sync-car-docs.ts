import mongoose from 'mongoose';
import Car from '../src/models/Car';
import CarPurchase from '../src/models/CarPurchase';
import VehicleDocument from '../src/models/Document';
import { syncPurchaseDocuments } from '../src/lib/syncDocuments';

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const purchases = await CarPurchase.find().populate('car');
  console.log(`Found ${purchases.length} car purchases to sync.`);

  for (const purchase of purchases) {
    const car = purchase.car as any;
    if (!car) {
      console.warn(`No car found for purchase ${purchase._id}`);
      continue;
    }

    console.log(`Syncing documents for car ${car.carId}...`);
    await syncPurchaseDocuments(
      car.carId,
      car._id,
      purchase as any,
      purchase.createdBy
    );
  }

  console.log('Migration complete.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
