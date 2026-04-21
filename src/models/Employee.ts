import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployeeDocument extends Document {
  employeeId: string;
  name: string;
  phone: string;
  email?: string;
  designation: string;
  department: string;
  baseSalary: number;
  joiningDate: Date;
  isActive: boolean;
  photo?: string;
  createdBy: mongoose.Types.ObjectId;
}

const EmployeeSchema = new Schema<IEmployeeDocument>(
  {
    employeeId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    baseSalary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    photo: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

EmployeeSchema.pre('save', async function (this: IEmployeeDocument) {
  if (!this.isNew || this.employeeId) return;
  const count = await mongoose.model('Employee').countDocuments();
  this.employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;
});

const Employee: Model<IEmployeeDocument> =
  mongoose.models.Employee || mongoose.model<IEmployeeDocument>('Employee', EmployeeSchema);

export default Employee;