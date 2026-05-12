import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWhatsAppConfigDocument extends Document {
  accessToken: string;
  phoneNumberId: string;
  adminPhone: string;
  isActive: boolean;
  updatedBy: mongoose.Types.ObjectId;
}

const WhatsAppConfigSchema = new Schema<IWhatsAppConfigDocument>(
  {
    accessToken: { type: String, required: true, trim: true },
    phoneNumberId: { type: String, required: true, trim: true },
    adminPhone: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const WhatsAppConfig: Model<IWhatsAppConfigDocument> =
  mongoose.models.WhatsAppConfig || mongoose.model<IWhatsAppConfigDocument>('WhatsAppConfig', WhatsAppConfigSchema);

export default WhatsAppConfig;
