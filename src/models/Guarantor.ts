import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGuarantorDocument extends Document {
  guarantorId: string;
  fullName: string;
  phone: string;
  email?: string;
  nationalId: string;
  employer?: string;
  salary?: number;
  buildingNumber: string;
  streetName: string;
  district: string;
  city: string;
  postalCode: string;
  countryCode: string;
  documents: string[]; // URLs for ID copy, salary cert, etc.
  profilePhoto?: string;
  notes?: string;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const GuarantorSchema = new Schema<IGuarantorDocument>(
  {
    guarantorId: { type: String, unique: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    nationalId: { type: String, required: true, trim: true },
    employer: { type: String, trim: true },
    salary: { type: Number, min: 0 },
    buildingNumber: { type: String, required: true, trim: true },
    streetName: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    countryCode: { type: String, default: 'SA' },
    documents: [{ type: String }],
    profilePhoto: { type: String },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

GuarantorSchema.index({ isDeleted: 1 });
GuarantorSchema.index({ createdAt: -1 });
GuarantorSchema.index({ phone: 1 });
GuarantorSchema.index({ nationalId: 1 });

GuarantorSchema.pre('save', async function (this: IGuarantorDocument) {
  if (!this.isNew || this.guarantorId) return;

  const count = await mongoose.model('Guarantor').countDocuments();
  this.guarantorId = `GUA-${String(count + 1).padStart(4, '0')}`;
});

const Guarantor: Model<IGuarantorDocument> =
  mongoose.models.Guarantor || mongoose.model<IGuarantorDocument>('Guarantor', GuarantorSchema);

export default Guarantor;
