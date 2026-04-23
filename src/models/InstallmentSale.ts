import mongoose, { Schema, Document, Model } from 'mongoose';

export type InstallmentPaymentStatus = 'Pending' | 'Paid' | 'Overdue' | 'Failed';
export type InstallmentSaleStatus = 'Active' | 'Completed' | 'Defaulted' | 'Cancelled';
export type ZatcaInvoiceType = 'Standard' | 'Simplified';
export type ZatcaStatus = 'Pending' | 'Cleared' | 'Reported' | 'Failed' | 'NotRequired';

export interface IInstallmentPayment {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  status: InstallmentPaymentStatus;
  paidDate?: Date;
  paidAmount?: number;
  lateFee?: number;
  notes?: string;
}

export interface IInstallmentSaleDocument extends Document {
  saleId: string;
  car: mongoose.Types.ObjectId;
  carId: string;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  interestRate: number;
  tenureMonths: number;
  startDate: Date;
  paymentSchedule: IInstallmentPayment[];
  nextPaymentDate: Date;
  nextPaymentAmount: number;
  totalPaid: number;
  remainingAmount: number;
  deliveryThresholdPercent: number;
  lateFeePercent: number;
  lateFeeCharged: number;
  vatRate: number;
  vatAmount: number;
  finalPriceWithVat: number;
  agreementDocument?: string;
  // ZATCA fields
  invoiceType: ZatcaInvoiceType;
  buyerTrn?: string;
  zatcaUUID?: string;
  zatcaQRCode?: string;
  zatcaStatus: ZatcaStatus;
  zatcaHash?: string;
  zatcaResponse?: object;
  agentName?: string;
  agentCommission?: number;
  status: InstallmentSaleStatus;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}

const InstallmentSaleSchema = new Schema<IInstallmentSaleDocument>(
  {
    saleId: { type: String, unique: true },
    car: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    carId: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    downPayment: { type: Number, required: true, min: 0 },
    loanAmount: { type: Number, required: true, min: 0 },
    monthlyPayment: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, default: 0, min: 0, max: 100 },
    tenureMonths: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    paymentSchedule: [{
      installmentNumber: { type: Number, required: true },
      dueDate: { type: Date, required: true },
      amount: { type: Number, required: true },
      status: { type: String, enum: ['Pending', 'Paid', 'Overdue', 'Failed'], default: 'Pending' },
      paidDate: { type: Date },
      paidAmount: { type: Number },
      lateFee: { type: Number, default: 0 },
      notes: { type: String },
    }],
    nextPaymentDate: { type: Date, required: true },
    nextPaymentAmount: { type: Number, required: true, min: 0 },
    totalPaid: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    deliveryThresholdPercent: { type: Number, default: 30, min: 0, max: 100 },
    lateFeePercent: { type: Number, default: 2, min: 0, max: 100 },
    lateFeeCharged: { type: Number, default: 0, min: 0 },
    vatRate: { type: Number, default: 15, min: 0 },
    vatAmount: { type: Number, default: 0, min: 0 },
    finalPriceWithVat: { type: Number, default: 0, min: 0 },
    agreementDocument: { type: String },
    invoiceType: { type: String, enum: ['Standard', 'Simplified'], default: 'Simplified' },
    buyerTrn: { type: String },
    zatcaUUID: { type: String, sparse: true },
    zatcaQRCode: { type: String },
    zatcaStatus: { type: String, enum: ['Pending', 'Cleared', 'Reported', 'Failed', 'NotRequired'], default: 'Pending' },
    zatcaHash: { type: String },
    zatcaResponse: { type: Schema.Types.Mixed },
    agentName: { type: String, trim: true },
    agentCommission: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['Active', 'Completed', 'Defaulted', 'Cancelled'], default: 'Active' },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

InstallmentSaleSchema.index({ status: 1 });
InstallmentSaleSchema.index({ car: 1 });
InstallmentSaleSchema.index({ customer: 1 });
InstallmentSaleSchema.index({ startDate: -1 });

InstallmentSaleSchema.pre('save', async function (this: IInstallmentSaleDocument) {
  if (!this.isNew || this.saleId) return;

  const count = await mongoose.model('InstallmentSale').countDocuments();
  this.saleId = `INS-${String(count + 1).padStart(4, '0')}`;
});

const InstallmentSale: Model<IInstallmentSaleDocument> =
  mongoose.models.InstallmentSale || mongoose.model<IInstallmentSaleDocument>('InstallmentSale', InstallmentSaleSchema);

export default InstallmentSale;