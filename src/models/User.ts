import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: 'Admin' | 'Manager' | 'Accounts Officer' | 'Sales Agent';
  isActive: boolean;
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
      enum: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'],
      default: 'Sales Agent',
    },
    isActive: { type: Boolean, default: true },
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
