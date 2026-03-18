import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLogDocument extends Document {
  user: mongoose.Types.ObjectId;
  userName: string;
  action: string;
  module: string;
  targetId: string;
  details: string;
  ipAddress: string;
}

const ActivityLogSchema = new Schema<IActivityLogDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    targetId: { type: String },
    details: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// Only keep createdAt, not updatedAt
ActivityLogSchema.set('timestamps', { createdAt: true, updatedAt: false });

const ActivityLog: Model<IActivityLogDocument> =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLogDocument>('ActivityLog', ActivityLogSchema);

export default ActivityLog;
