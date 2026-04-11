import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomerDocument extends Document {
  customerId: string;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  nationalId?: string;
  drivingLicense?: string;
  profilePhoto?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    customerId: { type: String, unique: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    nationalId: { type: String, trim: true },
    drivingLicense: { type: String, trim: true },
    profilePhoto: { type: String },
    emergencyContactName: { type: String, trim: true },
    emergencyContactPhone: { type: String, trim: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CustomerSchema.pre('save', async function (this: ICustomerDocument) {
  if (!this.isNew || this.customerId) return;

  const count = await mongoose.model('Customer').countDocuments();
  this.customerId = `CUS-${String(count + 1).padStart(4, '0')}`;
});

const Customer: Model<ICustomerDocument> =
  mongoose.models.Customer || mongoose.model<ICustomerDocument>('Customer', CustomerSchema);

export default Customer;