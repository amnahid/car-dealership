import mongoose, { Schema, Model } from 'mongoose';

export interface ICarPurchase {
  _id: mongoose.Types.ObjectId;
  car: mongoose.Types.ObjectId;
  supplier?: mongoose.Types.ObjectId;
  supplierName: string;
  supplierContact: string;
  purchasePrice: number;
  purchaseDate: Date;
  isNewCar: boolean;
  conditionImages: string[];
  insuranceUrl?: string;
  insuranceExpiry?: Date;
  registrationUrl?: string;
  registrationExpiry?: Date;
  roadPermitUrl?: string;
  roadPermitExpiry?: Date;
  documentUrl?: string;
  notes?: string;
  transactionId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ICarPurchaseDocument = mongoose.HydratedDocument<ICarPurchase>;

const CarPurchaseSchema = new Schema(
  {
    car: { type: Schema.Types.ObjectId, ref: 'Car', required: true, unique: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String, required: true, trim: true },
    supplierContact: { type: String, trim: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, required: true },
    isNewCar: { type: Boolean, default: true },
    conditionImages: [{ type: String }],
    insuranceUrl: { type: String },
    insuranceExpiry: { type: Date },
    registrationUrl: { type: String },
    registrationExpiry: { type: Date },
    roadPermitUrl: { type: String },
    roadPermitExpiry: { type: Date },
    documentUrl: { type: String },
    notes: { type: String },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CarPurchaseSchema.index({ supplier: 1 });
CarPurchaseSchema.index({ purchaseDate: -1 });

const CarPurchase: Model<ICarPurchaseDocument> =
  mongoose.models.CarPurchase || mongoose.model('CarPurchase', CarPurchaseSchema);

export default CarPurchase;