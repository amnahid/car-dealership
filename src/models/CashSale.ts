import mongoose, { Schema, Document, Model } from 'mongoose';

export type ZatcaInvoiceType = 'Standard' | 'Simplified';
export type ZatcaStatus = 'Pending' | 'Cleared' | 'Reported' | 'Failed' | 'NotRequired';

export interface ICashSaleDocument extends Document {
  saleId: string;
  car: mongoose.Types.ObjectId;
  carId: string;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  salePrice: number;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  discountAmount: number;
  finalPrice: number;
  vatRate: number;
  vatAmount: number;
  finalPriceWithVat: number;
  agentName?: string;
  agentCommission?: number;
  saleDate: Date;
  status: 'Active' | 'Cancelled';
  invoiceUrl?: string;
  // ZATCA fields
  invoiceType: ZatcaInvoiceType;
  buyerTrn?: string;
  zatcaUUID?: string;
  zatcaQRCode?: string;
  zatcaStatus: ZatcaStatus;
  zatcaHash?: string;
  zatcaResponse?: object;
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
    discountType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
    discountValue: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
    vatRate: { type: Number, default: 15, min: 0 },
    vatAmount: { type: Number, default: 0, min: 0 },
    finalPriceWithVat: { type: Number, default: 0, min: 0 },
    agentName: { type: String, trim: true },
    agentCommission: { type: Number, default: 0, min: 0 },
    saleDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Cancelled'], default: 'Active' },
    invoiceUrl: { type: String },
    invoiceType: { type: String, enum: ['Standard', 'Simplified'], default: 'Simplified' },
    buyerTrn: { type: String },
    zatcaUUID: { type: String, sparse: true },
    zatcaQRCode: { type: String },
    zatcaStatus: { type: String, enum: ['Pending', 'Cleared', 'Reported', 'Failed', 'NotRequired'], default: 'Pending' },
    zatcaHash: { type: String },
    zatcaResponse: { type: Schema.Types.Mixed },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CashSaleSchema.index({ status: 1, saleDate: -1 });
CashSaleSchema.index({ car: 1 });
CashSaleSchema.index({ customer: 1 });
CashSaleSchema.index({ saleDate: -1 });
CashSaleSchema.index({ agentName: 1 });

CashSaleSchema.pre('save', async function (this: ICashSaleDocument) {
  if (!this.isNew || this.saleId) return;

  const count = await mongoose.model('CashSale').countDocuments();
  this.saleId = `CSH-${String(count + 1).padStart(4, '0')}`;
});

const CashSale: Model<ICashSaleDocument> =
  mongoose.models.CashSale || mongoose.model<ICashSaleDocument>('CashSale', CashSaleSchema);

export default CashSale;