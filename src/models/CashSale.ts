import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICashSaleDocument extends Document {
  saleId: string;
  car: mongoose.Types.ObjectId;
  carId: string;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  salePrice: number;
  discountAmount: number;
  finalPrice: number;
  agentName?: string;
  agentCommission?: number;
  saleDate: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}

const CashSaleSchema = new Schema<ICashSaleDocument>(
  {
    saleId: { type: String, unique: true },
    car: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    carId: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    salePrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
    agentName: { type: String, trim: true },
    agentCommission: { type: Number, default: 0, min: 0 },
    saleDate: { type: Date, required: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CashSaleSchema.pre('save', async function (this: ICashSaleDocument) {
  if (!this.isNew || this.saleId) return;

  const count = await mongoose.model('CashSale').countDocuments();
  this.saleId = `CSH-${String(count + 1).padStart(4, '0')}`;
});

const CashSale: Model<ICashSaleDocument> =
  mongoose.models.CashSale || mongoose.model<ICashSaleDocument>('CashSale', CashSaleSchema);

export default CashSale;