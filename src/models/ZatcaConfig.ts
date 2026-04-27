import mongoose, { Schema, Document, Model } from 'mongoose';

export type ZatcaEnvironment = 'sandbox' | 'production';

export interface IZatcaAddress {
  buildingNumber: string;
  streetName: string;
  district: string;
  city: string;
  postalCode: string;
  countryCode: string; // Always 'SA'
}

export interface IZatcaConfigDocument extends Document {
  sellerName: string;        // English
  sellerNameAr: string;      // Arabic
  trn: string;               // 15-digit Tax Registration Number
  address: IZatcaAddress;
  environment: ZatcaEnvironment;
  complianceCsid?: string;
  complianceCsidSecret?: string;
  productionCsid?: string;
  productionCsidSecret?: string;
  privateKey?: string;       // ECDSA private key (store encrypted)
  publicKey?: string;        // ECDSA public key
  csr?: string;              // Certificate Signing Request
  certificate?: string;      // X.509 certificate (base64)
  // Previous Invoice Hash — maintains audit chain
  pih: string;
  isActive: boolean;
  updatedBy: mongoose.Types.ObjectId;
}

const ZatcaAddressSchema = new Schema<IZatcaAddress>(
  {
    buildingNumber: {
      type: String, required: true, trim: true,
      validate: { validator: (v: string) => v.trim().length > 0, message: 'Building number is required' },
    },
    streetName: {
      type: String, required: true, trim: true,
      validate: { validator: (v: string) => v.trim().length > 0, message: 'Street name is required' },
    },
    district: {
      type: String, required: true, trim: true,
      validate: { validator: (v: string) => v.trim().length > 0, message: 'District is required' },
    },
    city: {
      type: String, required: true, trim: true,
      validate: { validator: (v: string) => v.trim().length > 0, message: 'City is required' },
    },
    postalCode: {
      type: String, required: true, trim: true,
      validate: { validator: (v: string) => v.trim().length > 0, message: 'Postal code is required' },
    },
    countryCode: { type: String, default: 'SA' },
  },
  { _id: false }
);

const ZatcaConfigSchema = new Schema<IZatcaConfigDocument>(
  {
    sellerName: { type: String, required: true, trim: true },
    sellerNameAr: { type: String, required: true, trim: true },
    trn: {
      type: String, required: true, trim: true,
      minlength: 15, maxlength: 15,
      unique: true,
      validate: { validator: (v: string) => /^\d{15}$/.test(v), message: 'TRN must be exactly 15 digits' },
    },
    address: { type: ZatcaAddressSchema, required: true },
    environment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
    complianceCsid: { type: String },
    complianceCsidSecret: { type: String },
    productionCsid: { type: String },
    productionCsidSecret: { type: String },
    privateKey: { type: String },
    publicKey: { type: String },
    certificate: { type: String },
    pih: { type: String, default: 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjOTljMmYxN2ZiNTVkMzRlYzYzMDMzNjE5YTM0ZGY4YjEwNw==' },
    isActive: { type: Boolean, default: true, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);



const ZatcaConfig: Model<IZatcaConfigDocument> =
  mongoose.models.ZatcaConfig || mongoose.model<IZatcaConfigDocument>('ZatcaConfig', ZatcaConfigSchema);

export default ZatcaConfig;
