import mongoose, { Schema, Document, Model } from 'mongoose';

export type PurchaseReturnStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';

export interface IPurchaseReturnDocument extends Document {
  returnId: string;
  originalSale: mongoose.Types.ObjectId;
  originalSaleId: string;
  saleType: 'Cash' | 'Installment' | 'Rental';
  car: mongoose.Types.ObjectId;
  carId: string;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  originalPrice: number;
  refundAmount: number;
  penaltyAmount: number;
  conditionNotes?: string;
  returnDate: Date;
  status: PurchaseReturnStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}

const PurchaseReturnSchema = new Schema<IPurchaseReturnDocument>(
  {
    returnId: { type: String, unique: true },
    originalSale: { type: Schema.Types.ObjectId, refPath: 'saleType', required: true },
    originalSaleId: { type: String, required: true },
    saleType: { type: String, enum: ['Cash', 'Installment', 'Rental'], required: true },
    car: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    carId: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    originalPrice: { type: Number, required: true, min: 0 },
    refundAmount: { type: Number, required: true, min: 0 },
    penaltyAmount: { type: Number, default: 0, min: 0 },
    conditionNotes: { type: String },
    returnDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
      default: 'Pending',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

PurchaseReturnSchema.index({ status: 1 });
PurchaseReturnSchema.index({ car: 1 });
PurchaseReturnSchema.index({ customer: 1 });
PurchaseReturnSchema.index({ returnDate: -1 });

PurchaseReturnSchema.pre('save', async function (this: IPurchaseReturnDocument) {
  if (!this.isNew || this.returnId) return;
  const count = await mongoose.model('PurchaseReturn').countDocuments();
  this.returnId = `RET-${String(count + 1).padStart(4, '0')}`;
});

const PurchaseReturn: Model<IPurchaseReturnDocument> =
  mongoose.models.PurchaseReturn || mongoose.model<IPurchaseReturnDocument>('PurchaseReturn', PurchaseReturnSchema);

export default PurchaseReturn;