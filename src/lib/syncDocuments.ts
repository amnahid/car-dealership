import mongoose from 'mongoose';
import VehicleDocument from '@/models/Document';

interface PurchaseData {
  purchaseDate?: string | Date;
  insuranceUrl?: string;
  insuranceExpiry?: string | Date;
  registrationUrl?: string;
  registrationExpiry?: string | Date;
  roadPermitUrl?: string;
  roadPermitExpiry?: string | Date;
  documentUrl?: string;
}

export async function syncPurchaseDocuments(
  carId: string,
  carObjectId: string | mongoose.Types.ObjectId,
  purchase: PurchaseData,
  userId: string | mongoose.Types.ObjectId,
  session?: mongoose.ClientSession
) {
  const docsToSync = [
    {
      type: 'Insurance' as const,
      url: purchase.insuranceUrl,
      expiry: purchase.insuranceExpiry,
    },
    {
      type: 'Registration Card' as const,
      url: purchase.registrationUrl,
      expiry: purchase.registrationExpiry,
    },
    {
      type: 'Road Permit' as const,
      url: purchase.roadPermitUrl,
      expiry: purchase.roadPermitExpiry,
    },
    {
      type: 'Purchase Document' as const,
      url: purchase.documentUrl,
      expiry: purchase.insuranceExpiry || purchase.purchaseDate || new Date(), // Purchase doc doesn't have an expiry usually, but model requires it. Using purchase date or insurance expiry as proxy.
    },
  ];

  for (const doc of docsToSync) {
    if (doc.url) {
      const expiryDate = doc.expiry ? new Date(doc.expiry) : new Date(new Date().setFullYear(new Date().getFullYear() + 100)); // 100 years for non-expiring
      
      await VehicleDocument.findOneAndUpdate(
        { car: carObjectId, documentType: doc.type },
        {
          car: carObjectId,
          carId,
          documentType: doc.type,
          fileUrl: doc.url,
          expiryDate,
          issueDate: new Date(),
          createdBy: userId,
        },
        { upsert: true, session, new: true }
      );
    }
  }
}
