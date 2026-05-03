import mongoose, { Schema, Document, Model } from 'mongoose';

export type RentalStatus = 'Active' | 'Completed' | 'Cancelled' | 'Overdue';
export type ZatcaInvoiceType = 'Standard' | 'Simplified';
export type ZatcaStatus = 'Pending' | 'Cleared' | 'Reported' | 'Failed' | 'NotRequired';

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
  vatRate: number;
  vatAmount: number;
  totalAmountWithVat: number;
  securityDeposit: number;
  status: RentalStatus;
  isDeleted: boolean;
  tafweedStatus?: 'Active' | 'Expired';
  tafweedAuthorizedTo?: string;
  tafweedDriverIqama?: string;
  tafweedDurationMonths?: number;
  tafweedExpiryDate?: Date;
  driverLicenseExpiryDate?: Date;
  returnDate?: Date;
  actualReturnDate?: Date;
  lateFee?: number;
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
  invoiceUrl?: string;
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
    vatRate: { type: Number, default: 15, min: 0 },
    vatAmount: { type: Number, default: 0, min: 0 },
    totalAmountWithVat: { type: Number, default: 0, min: 0 },
    securityDeposit: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['Active', 'Completed', 'Cancelled', 'Overdue'], default: 'Active' },
    isDeleted: { type: Boolean, default: false },
    tafweedStatus: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
    tafweedAuthorizedTo: { type: String, trim: true },
    tafweedDriverIqama: { type: String, trim: true },
    tafweedDurationMonths: { type: Number, min: 1 },
    tafweedExpiryDate: { type: Date },
    driverLicenseExpiryDate: { type: Date },
    returnDate: { type: Date },
    actualReturnDate: { type: Date },
    lateFee: { type: Number, default: 0, min: 0 },
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
    invoiceUrl: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

RentalSchema.index({ status: 1 });
RentalSchema.index({ isDeleted: 1 });
RentalSchema.index({ car: 1 });
RentalSchema.index({ customer: 1 });
RentalSchema.index({ startDate: -1 });
RentalSchema.index({ status: 1, createdAt: -1 });

RentalSchema.pre('save', async function (this: IRentalDocument) {
  if (!this.isNew || this.rentalId) return;

  const count = await mongoose.model('Rental').countDocuments();
  this.rentalId = `RNT-${String(count + 1).padStart(4, '0')}`;
});

const Rental: Model<IRentalDocument> =
  mongoose.models.Rental || mongoose.model<IRentalDocument>('Rental', RentalSchema);

export default Rental;
