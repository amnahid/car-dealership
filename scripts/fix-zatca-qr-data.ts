
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import QRCode from 'qrcode';

dotenv.config({ path: '.env.local' });

async function fixData() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('MONGODB_URI not found');

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const collections = ['installmentsales', 'cashsales', 'rentals', 'zatcainvoices'];
    
    for (const collName of collections) {
      if (!mongoose.connection.db) throw new Error('Database connection not established');
      const collection = mongoose.connection.db.collection(collName);
      const query = { 
        $or: [
          { zatcaQRCode: { $regex: /^[A-Za-z0-9+/=]+$/, $options: 'm' } },
          { qrCode: { $regex: /^[A-Za-z0-9+/=]+$/, $options: 'm' } }
        ]
      };
      
      const docs = await collection.find(query).toArray();
      console.log(`Checking ${collName}: Found ${docs.length} docs with potentially raw TLV QR.`);

      for (const doc of docs) {
        const rawQR = doc.zatcaQRCode || doc.qrCode;
        if (rawQR && !rawQR.startsWith('data:image')) {
          console.log(`- Fixing doc ${doc._id} in ${collName}...`);
          try {
            const visualQR = await QRCode.toDataURL(rawQR);
            const updateField = doc.zatcaQRCode ? 'zatcaQRCode' : 'qrCode';
            await collection.updateOne({ _id: doc._id }, { $set: { [updateField]: visualQR } });
          } catch (qrErr: any) {
            console.error(`  Failed to convert QR for ${doc._id}:`, qrErr.message || qrErr);
          }
        }
      }
    }

    console.log('Data fix complete!');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

fixData();
