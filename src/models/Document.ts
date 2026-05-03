import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDocumentDocument extends Document {
  car: mongoose.Types.ObjectId;
  carId: string;
  documentType: 'Insurance' | 'Road Permit' | 'Registration Card' | 'Purchase Document';
  issueDate: Date;
  expiryDate: Date;
  fileUrl: string;
  fileName: string;
  notes: string;
  alertSent30: boolean;
  alertSent15: boolean;
  alertSent7: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const DocumentSchema = new Schema<IDocumentDocument>(
  {
    car: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    carId: { type: String, required: true },
    documentType: {
      type: String,
      enum: ['Insurance', 'Road Permit', 'Registration Card', 'Purchase Document'],
      required: true,
    },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    fileUrl: { type: String },
    fileName: { type: String },
    notes: { type: String },
    alertSent30: { type: Boolean, default: false },
    alertSent15: { type: Boolean, default: false },
    alertSent7: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

DocumentSchema.index({ car: 1 });
DocumentSchema.index({ carId: 1 });
DocumentSchema.index({ expiryDate: 1 });
DocumentSchema.index({ expiryDate: 1, alertSent30: 1 });
DocumentSchema.index({ car: 1, documentType: 1 });
DocumentSchema.index({ documentType: 1, expiryDate: 1 });

const VehicleDocument: Model<IDocumentDocument> =
  mongoose.models.VehicleDocument ||
  mongoose.model<IDocumentDocument>('VehicleDocument', DocumentSchema);

export default VehicleDocument;
