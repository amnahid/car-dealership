import mongoose, { Schema, Document, Model } from 'mongoose';
import { LEGACY_USER_ROLES, USER_ROLES, type KnownUserRole } from '@/lib/rbac';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: KnownUserRole;
  isActive: boolean;
  isDeleted: boolean;
  resetToken?: string;
  resetTokenExpiry?: Date;
  passwordVersion: number;
  device_id?: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    avatar: { type: String, trim: true },
    role: {
      type: String,
      enum: [...USER_ROLES, ...LEGACY_USER_ROLES],
      default: 'Sales Person',
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    passwordVersion: { type: Number, default: 1 },
    device_id: { type: String, sparse: true },
  },
  { timestamps: true }
);

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
