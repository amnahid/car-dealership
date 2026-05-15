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
  method?: string;
  voucherNumber?: string;
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
  monthlyLateFee: number;
  lateFeeCharged: number;
  applyVat: boolean;
  vatRate: number;
  vatAmount: number;
  vatInclusive: boolean;
  finalPriceWithVat: number;
  otherFees?: number;
  paymentMethod?: string;
  paymentReference?: string;
  voucherNumber?: string;
  agreementDocument?: string;
  agreementUrl?: string;
  // ZATCA fields
  invoiceType: ZatcaInvoiceType;
  buyerTrn?: string;
  zatcaUUID?: string;
  zatcaQRCode?: string;
  zatcaStatus: ZatcaStatus;
  zatcaHash?: string;
  zatcaResponse?: object;
  zatcaErrorMessage?: string;
  agentName?: string;
  agentCommission?: number;
  agentCommissionType?: 'percentage' | 'flat';
  agentCommissionValue?: number;
  invoiceUrl?: string;
  reportUrl?: string;
  guarantor?: mongoose.Types.ObjectId;
  guarantorName?: string;
  guarantorPhone?: string;
  status: InstallmentSaleStatus;
  isDeleted: boolean;
  tafweedStatus?: 'Active' | 'Expired' | 'None';
  tafweedAuthorizedTo?: string;
  tafweedDriverIqama?: string;
  tafweedDurationMonths?: number;
  tafweedExpiryDate?: Date;
  driverLicenseExpiryDate?: Date;
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
      method: { type: String },
      voucherNumber: { type: String, trim: true },
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
    monthlyLateFee: { type: Number, default: 200, min: 0 },
    lateFeeCharged: { type: Number, default: 0, min: 0 },
    applyVat: { type: Boolean, default: true },
    vatRate: { type: Number, default: 15, min: 0 },
    vatAmount: { type: Number, default: 0, min: 0 },
    vatInclusive: { type: Boolean, default: false },
    finalPriceWithVat: { type: Number, default: 0, min: 0 },
    otherFees: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String },
    paymentReference: { type: String },
    voucherNumber: { type: String, trim: true },
    agreementDocument: { type: String },
    agreementUrl: { type: String },
    invoiceType: { type: String, enum: ['Standard', 'Simplified'], default: 'Simplified' },
    buyerTrn: { type: String },
    zatcaUUID: { type: String, sparse: true },
    zatcaQRCode: { type: String },
    zatcaStatus: { type: String, enum: ['Pending', 'Cleared', 'Reported', 'Failed', 'NotRequired'], default: 'Pending' },
    zatcaHash: { type: String },
    zatcaResponse: { type: Schema.Types.Mixed },
    zatcaErrorMessage: { type: String },
    agentName: { type: String, trim: true },
    agentCommission: { type: Number, default: 0, min: 0 },
    agentCommissionType: { type: String, enum: ['percentage', 'flat'], default: 'flat' },
    agentCommissionValue: { type: Number, default: 0, min: 0 },
    invoiceUrl: { type: String },
    reportUrl: { type: String },
    guarantor: { type: Schema.Types.ObjectId, ref: 'Guarantor' },
    guarantorName: { type: String, trim: true },
    guarantorPhone: { type: String, trim: true },
    status: { type: String, enum: ['Active', 'Completed', 'Defaulted', 'Cancelled'], default: 'Active' },
    isDeleted: { type: Boolean, default: false },
    tafweedStatus: { type: String, enum: ['Active', 'Expired', 'None'], default: 'Active' },
    tafweedAuthorizedTo: { type: String, trim: true },
    tafweedDriverIqama: { type: String, trim: true },
    tafweedDurationMonths: { type: Number, min: 1 },
    tafweedExpiryDate: { type: Date },
    driverLicenseExpiryDate: { type: Date },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

InstallmentSaleSchema.index({ status: 1 });
InstallmentSaleSchema.index({ isDeleted: 1 });
InstallmentSaleSchema.index({ car: 1 });
InstallmentSaleSchema.index({ customer: 1 });
InstallmentSaleSchema.index({ startDate: -1 });
InstallmentSaleSchema.index({ 'paymentSchedule.dueDate': 1 });
InstallmentSaleSchema.index({ 'paymentSchedule.status': 1 });

InstallmentSaleSchema.pre('save', async function (this: IInstallmentSaleDocument) {
  // Recalculate remaining amount whenever loan or paid amount changes
  if (this.loanAmount !== undefined || this.totalPaid !== undefined) {
    const principalPaid = Math.max(0, (this.totalPaid || 0) - (this.lateFeeCharged || 0));
    this.remainingAmount = Math.max(0, (this.loanAmount || 0) - principalPaid);
  }

  if (!this.isNew || this.saleId) return;

  const count = await mongoose.model('InstallmentSale').countDocuments();
  this.saleId = `INS-${String(count + 1).padStart(4, '0')}`;
});

const InstallmentSale: Model<IInstallmentSaleDocument> =
  mongoose.models.InstallmentSale || mongoose.model<IInstallmentSaleDocument>('InstallmentSale', InstallmentSaleSchema);

export default InstallmentSale;
