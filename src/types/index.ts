import { Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Accounts Officer' | 'Sales Agent';
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

export type UserRole = 'Admin' | 'Manager' | 'Accounts Officer' | 'Sales Agent';
export type CarStatus = 'In Stock' | 'Under Repair' | 'Reserved' | 'Sold' | 'Rented';
export type DocumentType = 'Insurance' | 'Road Permit' | 'Registration Card';
export type RepairStatus = 'Pending' | 'In Progress' | 'Completed';
