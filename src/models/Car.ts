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
  isDeleted: boolean;
  purchase?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  gpsProvider?: 'WhatsGPS' | 'iTrack' | 'Mock';
  gpsImei?: string;
  gpsApiKey?: string;
  gpsApiSecret?: string;
  gpsCachedPosition?: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    timestamp: Date;
    ignitionStatus?: 'ON' | 'OFF' | 'UNKNOWN';
    positionType?: 'GPS' | 'LBS' | 'WIFI';
    isStale?: boolean;
  };
  gpsLastUpdate?: Date;
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
    isDeleted: { type: Boolean, default: false },
    purchase: { type: Schema.Types.ObjectId, ref: 'CarPurchase' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gpsProvider: {
      type: String,
      enum: ['WhatsGPS', 'iTrack', 'Mock'],
    },
    gpsImei: { type: String },
    gpsApiKey: { type: String },
    gpsApiSecret: { type: String },
    gpsCachedPosition: {
      latitude: { type: Number },
      longitude: { type: Number },
      speed: { type: Number },
      heading: { type: Number },
      timestamp: { type: Date },
      ignitionStatus: { type: String },
      positionType: { type: String },
      isStale: { type: Boolean },
    },
    gpsLastUpdate: { type: Date },
  },
  { timestamps: true }
);

// Auto-generate carId before saving
// Using 'any' due to TypeScript limitation with `model` field name conflict
// eslint-disable-next-line @typescript-eslint/no-explicit-any
CarSchema.index({ status: 1 });
CarSchema.index({ createdAt: -1 });
CarSchema.index({ brand: 1 });
CarSchema.index({ year: 1 });
CarSchema.index({ model: 1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
CarSchema.pre('save', async function (this: any) {
  if (!this.isNew || this.carId) return;

  const count = await mongoose.model('Car').countDocuments();
  this.carId = `CAR-${String(count + 1).padStart(3, '0')}`;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Car: Model<any> = mongoose.models.Car || mongoose.model('Car', CarSchema);

export default Car;
