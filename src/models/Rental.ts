import mongoose, { Schema, Document, Model } from 'mongoose';

export type RentalStatus = 'Active' | 'Completed' | 'Cancelled';

export interface IRentalDocument extends Document {
  rentalId: string;
  car: mongoose.Types.ObjectId;
  carId: string;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  startDate: Date;
  endDate: Date;
  dailyRate: number;
  totalAmount: number;
  securityDeposit: number;
  status: RentalStatus;
  returnDate?: Date;
  actualReturnDate?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}

const RentalSchema = new Schema<IRentalDocument>(
  {
    rentalId: { type: String, unique: true },
    car: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    carId: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dailyRate: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Cancelled'],
      default: 'Active',
    },
    returnDate: { type: Date },
    actualReturnDate: { type: Date },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

RentalSchema.pre('save', async function (this: IRentalDocument) {
  if (!this.isNew || this.rentalId) return;

  const count = await mongoose.model('Rental').countDocuments();
  this.rentalId = `RNT-${String(count + 1).padStart(4, '0')}`;
});

const Rental: Model<IRentalDocument> =
  mongoose.models.Rental || mongoose.model<IRentalDocument>('Rental', RentalSchema);

export default Rental;