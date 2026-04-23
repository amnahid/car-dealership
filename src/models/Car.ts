import mongoose, { Schema, Model } from 'mongoose';

// Raw interface for the document data (no model field conflict)
export interface ICarRaw {
  _id: mongoose.Types.ObjectId;
  carId: string;
  brand: string;
  carModel: string;
  year: number;
  engineNumber: string;
  chassisNumber: string;
  color: string;
  status: 'In Stock' | 'Under Repair' | 'Reserved' | 'Sold' | 'Rented';
  images: string[];
  documents: string[];
  notes: string;
  totalRepairCost: number;
  purchase?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ICarDocument = mongoose.HydratedDocument<ICarRaw>;

const CarSchema = new Schema(
  {
    carId: { type: String, unique: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    engineNumber: { type: String, trim: true },
    chassisNumber: { type: String, required: true, unique: true, trim: true },
    color: { type: String, trim: true },
    status: {
      type: String,
      enum: ['In Stock', 'Under Repair', 'Reserved', 'Sold', 'Rented'],
      default: 'In Stock',
    },
    images: [{ type: String }],
    documents: [{ type: String }],
    notes: { type: String },
    totalRepairCost: { type: Number, default: 0 },
    purchase: { type: Schema.Types.ObjectId, ref: 'CarPurchase' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Auto-generate carId before saving
// Using 'any' due to TypeScript limitation with `model` field name conflict
// eslint-disable-next-line @typescript-eslint/no-explicit-any
CarSchema.index({ status: 1 });
CarSchema.index({ createdAt: -1 });
CarSchema.index({ brand: 1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
CarSchema.pre('save', async function (this: any) {
  if (!this.isNew || this.carId) return;

  const count = await mongoose.model('Car').countDocuments();
  this.carId = `CAR-${String(count + 1).padStart(3, '0')}`;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Car: Model<any> = mongoose.models.Car || mongoose.model('Car', CarSchema);

export default Car;
