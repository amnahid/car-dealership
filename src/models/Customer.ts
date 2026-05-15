import mongoose, { Schema, Document, Model } from 'mongoose';

export type CustomerType = 'Individual' | 'Business';

export interface ICustomerDocument extends Document {
  customerId: string;
  fullName: string;
  phone: string;
  email?: string;
  passportNumber?: string;
  buildingNumber: string;
  streetName: string;
  district: string;
  city: string;
  postalCode: string;
  countryCode: string;
  passportDocument?: string;
  passportExpiryDate?: Date;
  drivingLicenseDocument?: string;
  iqamaDocument?: string;
  profilePhoto?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  licenseExpiryDate?: Date;
  customerType: CustomerType;
  vatRegistrationNumber?: string; // TRN (15-digit)
  otherId?: string;               // Secondary ID (e.g., CRN)
  otherIdType?: 'CRN' | 'MOM' | 'MLSD' | 'SAGIA' | 'OTH';
  notes?: string;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    customerId: { type: String, unique: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    passportNumber: { type: String, trim: true },
    buildingNumber: { type: String, trim: true },
    streetName: { type: String, trim: true },
    district: { type: String, trim: true },
    city: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    countryCode: { type: String, default: 'SA' },
    passportDocument: { type: String },
    passportExpiryDate: { type: Date },
    drivingLicenseDocument: { type: String },
    iqamaDocument: { type: String },
    profilePhoto: { type: String },
    emergencyContactName: { type: String, trim: true },
    emergencyContactPhone: { type: String, trim: true },
    licenseExpiryDate: { type: Date },
    customerType: { type: String, enum: ['Individual', 'Business'], default: 'Individual' },
    vatRegistrationNumber: { type: String, trim: true },
    otherId: { type: String, trim: true },
    otherIdType: { type: String, enum: ['CRN', 'MOM', 'MLSD', 'SAGIA', 'OTH'], default: 'CRN' },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CustomerSchema.index({ isDeleted: 1 });
CustomerSchema.index({ customerType: 1 });
CustomerSchema.index({ createdAt: -1 });
CustomerSchema.index({ phone: 1 });

CustomerSchema.pre('save', async function (this: ICustomerDocument) {
  if (!this.isNew || this.customerId) return;

  const count = await mongoose.model('Customer').countDocuments();
  this.customerId = `CUS-${String(count + 1).padStart(4, '0')}`;
});

const Customer: Model<ICustomerDocument> =
  mongoose.models.Customer || mongoose.model<ICustomerDocument>('Customer', CustomerSchema);

export default Customer;
