import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISupplierSalesAgent {
  name: string;
  phone: string;
  email?: string;
  photo?: string;
  designation?: string;
}

export interface ISupplierDocument extends Document {
  supplierId: string;
  companyName: string;
  companyLogo?: string;
  companyNumber: string;
  email?: string;
  phone: string;
  address?: string;
  salesAgent?: ISupplierSalesAgent;
  status: 'active' | 'inactive';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}

const SupplierSalesAgentSchema = new Schema<ISupplierSalesAgent>({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  photo: { type: String },
  designation: { type: String, trim: true },
}, { _id: false });

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    supplierId: { type: String, unique: true },
    companyName: { type: String, required: true, trim: true },
    companyLogo: { type: String },
    companyNumber: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    salesAgent: { type: SupplierSalesAgentSchema },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

SupplierSchema.pre('save', async function (this: ISupplierDocument) {
  if (!this.isNew || this.supplierId) return;

  const count = await mongoose.model('Supplier').countDocuments();
  this.supplierId = `SUP-${String(count + 1).padStart(4, '0')}`;
});

const Supplier: Model<ISupplierDocument> =
  mongoose.models.Supplier || mongoose.model<ISupplierDocument>('Supplier', SupplierSchema);

export default Supplier;