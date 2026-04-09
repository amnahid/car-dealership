import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRepairDocument extends Document {
  car: mongoose.Types.ObjectId;
  carId: string;
  repairDescription: string;
  partsReplaced: string;
  laborCost: number;
  repairCost: number;
  totalCost: number;
  repairDate: Date;
  beforeImages: string[];
  afterImages: string[];
  status: 'Pending' | 'In Progress' | 'Completed';
  createdBy: mongoose.Types.ObjectId;
}

const RepairSchema = new Schema<IRepairDocument>(
  {
    car: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    carId: { type: String, required: true },
    repairDescription: { type: String, required: true },
    partsReplaced: { type: String },
    laborCost: { type: Number, default: 0, min: 0 },
    repairCost: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    repairDate: { type: Date, required: true },
    beforeImages: [{ type: String }],
    afterImages: [{ type: String }],
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Calculate totalCost before save
// eslint-disable-next-line @typescript-eslint/no-explicit-any
RepairSchema.pre('save', function (this: any) {
  this.totalCost = (this.laborCost || 0) + (this.repairCost || 0);
});

const Repair: Model<IRepairDocument> =
  mongoose.models.Repair || mongoose.model<IRepairDocument>('Repair', RepairSchema);

export default Repair;
