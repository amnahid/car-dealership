import mongoose, { Schema, Document, Model } from 'mongoose';

export type ZatcaInvoiceType = 'Standard' | 'Simplified';
export type ZatcaSubmissionStatus = 'Pending' | 'Cleared' | 'Reported' | 'Failed' | 'NotRequired';

export interface IZatcaInvoiceDocument extends Document {
  uuid: string;
  invoiceType: ZatcaInvoiceType;
  referenceId: string;       // CashSale / InstallmentSale / Rental _id
  referenceType: string;     // 'CashSale' | 'InstallmentSale' | 'Rental'
  saleId: string;            // Human-readable sale ID (CSH-0001 etc.)
  issueDate: Date;
  xml: string;               // Full UBL 2.1 XML
  xmlHash: string;           // SHA-256 of canonical XML (base64)
  pih: string;               // Previous Invoice Hash used
  qrCode: string;            // Base64 QR code image
  status: ZatcaSubmissionStatus;
  zatcaResponse?: object;    // Raw ZATCA API response
  errorMessage?: string;
  clearedXml?: string;       // XML returned from ZATCA after clearance (B2B)
  submittedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
}

const ZatcaInvoiceSchema = new Schema<IZatcaInvoiceDocument>(
  {
    uuid: { type: String, required: true, unique: true },
    invoiceType: { type: String, enum: ['Standard', 'Simplified'], required: true },
    referenceId: { type: String, required: true },
    referenceType: { type: String, required: true },
    saleId: { type: String, required: true },
    issueDate: { type: Date, required: true },
    xml: { type: String, required: true },
    xmlHash: { type: String, required: true },
    pih: { type: String, required: true },
    qrCode: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Cleared', 'Reported', 'Failed', 'NotRequired'],
      default: 'Pending',
    },
    zatcaResponse: { type: Schema.Types.Mixed },
    errorMessage: { type: String },
    clearedXml: { type: String },
    submittedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ZatcaInvoiceSchema.index({ referenceId: 1, referenceType: 1 });
ZatcaInvoiceSchema.index({ status: 1 });

const ZatcaInvoice: Model<IZatcaInvoiceDocument> =
  mongoose.models.ZatcaInvoice || mongoose.model<IZatcaInvoiceDocument>('ZatcaInvoice', ZatcaInvoiceSchema);

export default ZatcaInvoice;
