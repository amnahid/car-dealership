import mongoose, { Schema, Model } from 'mongoose';

export interface ICarPurchase {
  _id: mongoose.Types.ObjectId;
  car: mongoose.Types.ObjectId;
  supplierName: string;
  supplierContact: string;
  purchasePrice: number;
  purchaseDate: Date;
  documentUrl?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ICarPurchaseDocument = mongoose.HydratedDocument<ICarPurchase>;

const CarPurchaseSchema = new Schema(
  {
    car: { type: Schema.Types.ObjectId, ref: 'Car', required: true, unique: true },
    supplierName: { type: String, required: true, trim: true },
    supplierContact: { type: String, trim: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, required: true },
    documentUrl: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const CarPurchase: Model<ICarPurchaseDocument> =
  mongoose.models.CarPurchase || mongoose.model('CarPurchase', CarPurchaseSchema);

export default CarPurchase;