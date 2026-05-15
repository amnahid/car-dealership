import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISalesAgentDocument extends Document {
  agentId: string;
  fullName: string;
  phone: string;
  email?: string;
  passportNumber?: string;
  address?: string;
  passportDocument?: string;
  passportExpiryDate?: Date;
  drivingLicenseDocument?: string;
  iqamaDocument?: string;
  profilePhoto?: string;
  notes?: string;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const SalesAgentSchema = new Schema<ISalesAgentDocument>(
  {
    agentId: { type: String, unique: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    passportNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    passportDocument: { type: String },
    passportExpiryDate: { type: Date },
    drivingLicenseDocument: { type: String },
    iqamaDocument: { type: String },
    profilePhoto: { type: String },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

SalesAgentSchema.index({ isDeleted: 1 });
SalesAgentSchema.index({ createdAt: -1 });
SalesAgentSchema.index({ phone: 1 });
SalesAgentSchema.index({ fullName: 1 });

SalesAgentSchema.pre('save', async function (this: ISalesAgentDocument) {
  if (!this.isNew || this.agentId) return;

  const count = await mongoose.model('SalesAgent').countDocuments();
  this.agentId = `AGT-${String(count + 1).padStart(4, '0')}`;
});

const SalesAgent: Model<ISalesAgentDocument> =
  mongoose.models.SalesAgent || mongoose.model<ISalesAgentDocument>('SalesAgent', SalesAgentSchema);

export default SalesAgent;
