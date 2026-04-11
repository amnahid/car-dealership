import mongoose, { Schema, Document, Model } from 'mongoose';

export type InstallmentPaymentStatus = 'Pending' | 'Paid' | 'Overdue' | 'Failed';
export type InstallmentSaleStatus = 'Active' | 'Completed' | 'Defaulted';

export interface IInstallmentPayment {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  status: InstallmentPaymentStatus;
  paidDate?: Date;
  paidAmount?: number;
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
      notes: { type: String },
    }],
    nextPaymentDate: { type: Date, required: true },
    nextPaymentAmount: { type: Number, required: true, min: 0 },
    totalPaid: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Defaulted'],
      default: 'Active',
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

InstallmentSaleSchema.pre('save', async function (this: IInstallmentSaleDocument) {
  if (!this.isNew || this.saleId) return;

  const count = await mongoose.model('InstallmentSale').countDocuments();
  this.saleId = `INS-${String(count + 1).padStart(4, '0')}`;
});

const InstallmentSale: Model<IInstallmentSaleDocument> =
  mongoose.models.InstallmentSale || mongoose.model<IInstallmentSaleDocument>('InstallmentSale', InstallmentSaleSchema);

export default InstallmentSale;