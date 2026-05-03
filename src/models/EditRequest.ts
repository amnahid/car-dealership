import mongoose, { Schema, Document, Model } from 'mongoose';

export type EditRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface IEditRequestDocument extends Document {
  targetModel: string;
  targetId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  proposedChanges: Record<string, any>;
  status: EditRequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EditRequestSchema = new Schema(
  {
    targetModel: { type: String, required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    proposedChanges: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

const EditRequest: Model<IEditRequestDocument> =
  mongoose.models.EditRequest || mongoose.model<IEditRequestDocument>('EditRequest', EditRequestSchema);

export default EditRequest;
