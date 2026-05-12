import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationLogDocument extends Document {
  notificationId: string;
  channel: 'whatsapp' | 'email';
  type: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  subject: string;
  content: string;
  referenceId?: string;
  referenceType?: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  sentAt?: Date;
  metadata?: Record<string, unknown>;
}

const NotificationLogSchema = new Schema<INotificationLogDocument>(
  {
    notificationId: { type: String, unique: true },
    channel: { type: String, enum: ['whatsapp', 'email'], required: true },
    type: { type: String, required: true },
    recipientName: { type: String, required: true },
    recipientPhone: { type: String },
    recipientEmail: { type: String },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    referenceId: { type: String },
    referenceType: { type: String },
    status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
    errorMessage: { type: String },
    sentAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationLogSchema.index({ channel: 1 });
NotificationLogSchema.index({ status: 1 });
NotificationLogSchema.index({ createdAt: -1 });
NotificationLogSchema.index({ referenceId: 1, referenceType: 1 });

NotificationLogSchema.pre('save', async function (this: INotificationLogDocument) {
  if (!this.isNew || this.notificationId) return;
  const count = await mongoose.model('NotificationLog').countDocuments();
  this.notificationId = `NTF-${String(count + 1).padStart(6, '0')}`;
});

const NotificationLog: Model<INotificationLogDocument> =
  mongoose.models.NotificationLog || mongoose.model<INotificationLogDocument>('NotificationLog', NotificationLogSchema);

export default NotificationLog;