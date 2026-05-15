import mongoose, { Schema, Document, Model } from 'mongoose';

export type ZatcaInvoiceType = 'Standard' | 'Simplified';
export type ZatcaStatus = 'Pending' | 'Cleared' | 'Reported' | 'Failed' | 'NotRequired';

export interface ICashSaleDocument extends Document {
  saleId: string;
  car: mongoose.Types.ObjectId;
  carId: string;
  customer?: mongoose.Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  salePrice: number;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  discountAmount: number;
  finalPrice: number;
  applyVat: boolean;
  vatRate: number;
  vatAmount: number;
  vatInclusive: boolean;
  finalPriceWithVat: number;
  agentName?: string;
  agentCommission?: number;
  agentCommissionType?: 'percentage' | 'flat';
  agentCommissionValue?: number;
  saleDate: Date;
  status: 'Active' | 'Cancelled';
  isDeleted: boolean;
  registrationDriverName?: string;
  registrationDriverIqama?: string;
  registrationDriverLicenseExpiryDate?: Date;
  invoiceUrl?: string;
  // ZATCA fields
  invoiceType: ZatcaInvoiceType;
  buyerTrn?: string;
  zatcaUUID?: string;
  zatcaQRCode?: string;
  zatcaStatus: ZatcaStatus;
  zatcaHash?: string;
  zatcaResponse?: object;
  zatcaErrorMessage?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}

const CashSaleSchema = new Schema<ICashSaleDocument>(
  {
    saleId: { type: String, unique: true },
    car: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    carId: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: false },
    customerName: { type: String, required: false },
    customerPhone: { type: String, required: false },
    salePrice: { type: Number, required: true, min: 0 },
    discountType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
    discountValue: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
    applyVat: { type: Boolean, default: true },
    vatRate: { type: Number, default: 15, min: 0 },
    vatAmount: { type: Number, default: 0, min: 0 },
    vatInclusive: { type: Boolean, default: false },
    finalPriceWithVat: { type: Number, default: 0, min: 0 },
    agentName: { type: String, trim: true },
    agentCommission: { type: Number, default: 0, min: 0 },
    agentCommissionType: { type: String, enum: ['percentage', 'flat'], default: 'flat' },
    agentCommissionValue: { type: Number, default: 0, min: 0 },
    saleDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Cancelled'], default: 'Active' },
    isDeleted: { type: Boolean, default: false },
    registrationDriverName: { type: String, trim: true },
    registrationDriverIqama: { type: String, trim: true },
    registrationDriverLicenseExpiryDate: { type: Date },
    invoiceUrl: { type: String },
    invoiceType: { type: String, enum: ['Standard', 'Simplified'], default: 'Simplified' },
    buyerTrn: { type: String },
    zatcaUUID: { type: String, sparse: true },
    zatcaQRCode: { type: String },
    zatcaStatus: { type: String, enum: ['Pending', 'Cleared', 'Reported', 'Failed', 'NotRequired'], default: 'Pending' },
    zatcaHash: { type: String },
    zatcaResponse: { type: Schema.Types.Mixed },
    zatcaErrorMessage: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CashSaleSchema.index({ status: 1, saleDate: -1 });
CashSaleSchema.index({ isDeleted: 1 });
CashSaleSchema.index({ car: 1 });
CashSaleSchema.index({ customer: 1 });
CashSaleSchema.index({ saleDate: -1 });
CashSaleSchema.index({ agentName: 1 });

CashSaleSchema.pre('save', async function (this: ICashSaleDocument) {
  if (!this.isNew || this.saleId) return;

  const count = await mongoose.model('CashSale').countDocuments();
  this.saleId = `CSH-${String(count + 1).padStart(4, '0')}`;
});

// Force re-compilation of the model to handle schema changes in development
if (mongoose.models.CashSale) {
  delete mongoose.models.CashSale;
}

const CashSale: Model<ICashSaleDocument> = mongoose.model<ICashSaleDocument>('CashSale', CashSaleSchema);

export default CashSale;
