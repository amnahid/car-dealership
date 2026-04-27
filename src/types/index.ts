import { Types } from 'mongoose';
import { type UserRole } from '@/lib/rbac';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICar {
  _id: Types.ObjectId;
  carId: string;
  supplierName: string;
  supplierContact: string;
  purchasePrice: number;
  purchaseDate: Date;
  brand: string;
  model: string;
  year: number;
  engineNumber: string;
  chassisNumber: string;
  color: string;
  status: 'In Stock' | 'Under Repair' | 'Reserved' | 'Sold' | 'Rented';
  images: string[];
  documents: string[];
  notes: string;
  totalRepairCost: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRepair {
  _id: Types.ObjectId;
  car: Types.ObjectId;
  carId: string;
  repairDescription: string;
  partsReplaced: string;
  laborCost: number;
  repairCost: number;
  totalCost: number;
  repairDate: Date;
  beforeImages: string[];
  afterImages: string[];
  status: 'Pending' | 'In Progress' | 'Completed';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocument {
  _id: Types.ObjectId;
  car: Types.ObjectId;
  carId: string;
  documentType: 'Insurance' | 'Road Permit' | 'Registration Card';
  issueDate: Date;
  expiryDate: Date;
  fileUrl: string;
  fileName: string;
  notes: string;
  alertSent30: boolean;
  alertSent15: boolean;
  alertSent7: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityLog {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  userName: string;
  action: string;
  module: string;
  targetId: string;
  details: string;
  ipAddress: string;
  createdAt: Date;
}

export type CarStatus = 'In Stock' | 'Under Repair' | 'Reserved' | 'Sold' | 'Rented';
export type DocumentType = 'Insurance' | 'Road Permit' | 'Registration Card';
export type RepairStatus = 'Pending' | 'In Progress' | 'Completed';
export type SaleType = 'Cash' | 'Installment' | 'Rental';
export type InstallmentPaymentStatus = 'Pending' | 'Paid' | 'Overdue' | 'Failed';
export type RentalStatus = 'Active' | 'Completed' | 'Cancelled';

export interface ICustomer {
  _id: Types.ObjectId;
  customerId: string;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  nationalId?: string;
  drivingLicense?: string;
  profilePhoto?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICashSale {
  _id: Types.ObjectId;
  saleId: string;
  car: Types.ObjectId;
  carId: string;
  customer: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  salePrice: number;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  discountAmount: number;
  finalPrice: number;
  agentName?: string;
  agentCommission?: number;
  saleDate: Date;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface IInstallmentSale {
  _id: Types.ObjectId;
  saleId: string;
  car: Types.ObjectId;
  carId: string;
  customer: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  interestRate: number;
  tenureMonths: number;
  startDate: Date;
  paymentSchedule: Array<{
    installmentNumber: number;
    dueDate: Date;
    amount: number;
    status: InstallmentPaymentStatus;
    paidDate?: Date;
    paidAmount?: number;
  }>;
  nextPaymentDate: Date;
  nextPaymentAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: 'Active' | 'Completed' | 'Defaulted';
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface IRental {
  _id: Types.ObjectId;
  rentalId: string;
  car: Types.ObjectId;
  carId: string;
  customer: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  startDate: Date;
  endDate: Date;
  dailyRate: number;
  totalAmount: number;
  securityDeposit: number;
  status: RentalStatus;
  returnDate?: Date;
  actualReturnDate?: Date;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}
