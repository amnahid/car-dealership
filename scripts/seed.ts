/**
 * Comprehensive seed script for Car Dealership & Rental Management System
 *
 * Usage:
 *   npm run seed              — seed without dropping existing data
 *   npm run seed -- --fresh   — drop all collections first, then seed
 *
 * Credentials printed at end of run.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Models ────────────────────────────────────────────────────────────────
import User from '../src/models/User';
import Employee from '../src/models/Employee';
import Customer from '../src/models/Customer';
import Supplier from '../src/models/Supplier';
import Car from '../src/models/Car';
import CarPurchase from '../src/models/CarPurchase';
import VehicleDocument from '../src/models/Document';
import CashSale from '../src/models/CashSale';
import InstallmentSale from '../src/models/InstallmentSale';
import Rental from '../src/models/Rental';
import Repair from '../src/models/Repair';
import SalaryPayment from '../src/models/SalaryPayment';
import Transaction from '../src/models/Transaction';
import ZatcaConfig from '../src/models/ZatcaConfig';
import ActivityLog from '../src/models/ActivityLog';

// ─── ID helpers ─────────────────────────────────────────────────────────────
const OID = () => new mongoose.Types.ObjectId();

let txnSeq = 0;
const nextTxnId = () => `TXN-${String(++txnSeq).padStart(6, '0')}`;

let salSeq = 0;
const nextSalId = () => `SAL-${String(++salSeq).padStart(4, '0')}`;

// ─── Date helpers ────────────────────────────────────────────────────────────
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const addMonths = (date: Date, months: number): Date => {
  const r = new Date(date);
  r.setMonth(r.getMonth() + months);
  return r;
};

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // Load env before connecting (avoids module-load-time hoisting issue with db.ts)
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });
  dotenv.config({ path: '.env' });

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car-dealership';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  if (process.argv.includes('--fresh')) {
    await mongoose.connection.dropDatabase();
    console.log('🗑️  Database dropped (--fresh)');
  }

  // ─── 1. USERS ──────────────────────────────────────────────────────────────
  console.log('👤 Seeding users…');

  const BCRYPT_ROUNDS = 10;
  const adminId = OID();
  const managerId = OID();
  const accountsId = OID();
  const khalidUserId = OID();
  const omarUserId = OID();

  await User.insertMany([
    {
      _id: adminId,
      name: 'Ahmed Al-Rashidi',
      email: 'admin@amyalcar.com',
      password: await bcrypt.hash('Admin@123', BCRYPT_ROUNDS),
      role: 'Admin',
      phone: '+966501110001',
      isActive: true,
      passwordVersion: 1,
    },
    {
      _id: managerId,
      name: 'Mohammed Al-Otaibi',
      email: 'car-manager@amyalcar.com',
      password: await bcrypt.hash('CarManager@123', BCRYPT_ROUNDS),
      role: 'Car Manager',
      phone: '+966501110002',
      isActive: true,
      passwordVersion: 1,
    },
    {
      _id: accountsId,
      name: 'Fatima Al-Zahrani',
      email: 'accountant@amyalcar.com',
      password: await bcrypt.hash('Accountant@123', BCRYPT_ROUNDS),
      role: 'Accountant',
      phone: '+966501110003',
      isActive: true,
      passwordVersion: 1,
    },
    {
      _id: khalidUserId,
      name: 'Khalid Al-Ghamdi',
      email: 'sales-person@amyalcar.com',
      password: await bcrypt.hash('SalesPerson@123', BCRYPT_ROUNDS),
      role: 'Sales Person',
      phone: '+966501110004',
      isActive: true,
      passwordVersion: 1,
    },
  ]);
  console.log('  ✓ 4 users');

  // ─── 2. EMPLOYEES ──────────────────────────────────────────────────────────
  console.log('👷 Seeding employees…');

  const emp1Id = OID(); // Khalid Al-Ghamdi — Sales, 2% commission
  const emp2Id = OID(); // Omar Al-Shehri    — Sales, 1.5% commission
  const emp3Id = OID(); // Fatima Al-Zahrani  — Accounts
  const emp4Id = OID(); // Mohammed Al-Harbi  — Mechanic
  const emp5Id = OID(); // Sara Al-Qahtani    — Logistics

  await Employee.insertMany([
    {
      _id: emp1Id,
      employeeId: 'EMP-0001',
      name: 'Khalid Al-Ghamdi',
      phone: '+966501110004',
      email: 'sales-person@amyalcar.com',
      designation: 'Sales Agent',
      department: 'Sales',
      baseSalary: 8000,
      commissionRate: 2,
      joiningDate: d(2023, 1, 15),
      isActive: true,
      createdBy: adminId,
    },
    {
      _id: emp2Id,
      employeeId: 'EMP-0002',
      name: 'Omar Al-Shehri',
      phone: '+966501110005',
      email: 'omar@amyalcar.com',
      designation: 'Sales Agent',
      department: 'Sales',
      baseSalary: 7500,
      commissionRate: 1.5,
      joiningDate: d(2023, 3, 1),
      isActive: true,
      createdBy: adminId,
    },
    {
      _id: emp3Id,
      employeeId: 'EMP-0003',
      name: 'Fatima Al-Zahrani',
      phone: '+966501110003',
      email: 'accountant@amyalcar.com',
      designation: 'Accounts Officer',
      department: 'Finance',
      baseSalary: 9000,
      joiningDate: d(2022, 6, 10),
      isActive: true,
      createdBy: adminId,
    },
    {
      _id: emp4Id,
      employeeId: 'EMP-0004',
      name: 'Mohammed Al-Harbi',
      phone: '+966501110006',
      email: 'mharbi@carsaudi.com',
      designation: 'Senior Mechanic',
      department: 'Service',
      baseSalary: 6000,
      joiningDate: d(2021, 9, 20),
      isActive: true,
      createdBy: adminId,
    },
    {
      _id: emp5Id,
      employeeId: 'EMP-0005',
      name: 'Sara Al-Qahtani',
      phone: '+966501110007',
      email: 'sara@carsaudi.com',
      designation: 'Logistics Coordinator',
      department: 'Operations',
      baseSalary: 7000,
      joiningDate: d(2023, 7, 5),
      isActive: true,
      createdBy: adminId,
    },
  ]);
  console.log('  ✓ 5 employees (EMP-0001..0005)');

  // ─── 3. CUSTOMERS ──────────────────────────────────────────────────────────
  console.log('👥 Seeding customers…');

  const cus1Id = OID();
  const cus2Id = OID();
  const cus3Id = OID();
  const cus4Id = OID();
  const cus5Id = OID();
  const cus6Id = OID();
  const cus7Id = OID();
  const cus8Id = OID();
  const cus9Id = OID();
  const cus10Id = OID();

  await Customer.insertMany([
    { _id: cus1Id, customerId: 'CUS-0001', fullName: 'Abdul Rahman Al-Dosari', phone: '+966512000001', address: 'Al-Olaya District, Riyadh', customerType: 'Individual', createdBy: adminId },
    { _id: cus2Id, customerId: 'CUS-0002', fullName: 'Tariq Al-Mutairi', phone: '+966512000002', address: 'Al-Malaz District, Riyadh', customerType: 'Individual', createdBy: adminId },
    { _id: cus3Id, customerId: 'CUS-0003', fullName: 'Nasser Al-Qahtani', phone: '+966512000003', address: 'Al-Nakheel District, Riyadh', customerType: 'Individual', createdBy: adminId },
    { _id: cus4Id, customerId: 'CUS-0004', fullName: 'Saad Al-Anazi', phone: '+966512000004', address: 'Al-Rawdah District, Riyadh', customerType: 'Individual', createdBy: adminId },
    { _id: cus5Id, customerId: 'CUS-0005', fullName: 'Faisal Al-Harbi', phone: '+966512000005', address: 'Al-Sulaimaniyah, Riyadh', customerType: 'Individual', createdBy: adminId },
    { _id: cus6Id, customerId: 'CUS-0006', fullName: 'Khalid Al-Otaibi', phone: '+966512000006', address: 'Al-Wazarat District, Riyadh', customerType: 'Individual', createdBy: adminId },
    { _id: cus7Id, customerId: 'CUS-0007', fullName: 'Bandar Al-Shammari', phone: '+966512000007', address: 'Hittin District, Riyadh', customerType: 'Individual', createdBy: adminId },
    { _id: cus8Id, customerId: 'CUS-0008', fullName: 'Al-Faris Trading Co.', phone: '+966512000008', address: 'King Fahd Road, Riyadh', customerType: 'Business', vatRegistrationNumber: '310000000000003', createdBy: adminId },
    { _id: cus9Id, customerId: 'CUS-0009', fullName: 'Gulf Auto Group', phone: '+966512000009', address: 'King Abdulaziz Road, Jeddah', customerType: 'Business', vatRegistrationNumber: '311111111111115', createdBy: adminId },
    { _id: cus10Id, customerId: 'CUS-0010', fullName: 'Najd Motors LLC', phone: '+966512000010', address: 'Takhassusi Street, Riyadh', customerType: 'Business', vatRegistrationNumber: '300000000000003', createdBy: adminId },
  ]);
  console.log('  ✓ 10 customers (CUS-0001..0010)');

  // ─── 4. SUPPLIERS ──────────────────────────────────────────────────────────
  console.log('🏭 Seeding suppliers…');

  const sup1Id = OID();
  const sup2Id = OID();
  const sup3Id = OID();

  await Supplier.insertMany([
    {
      _id: sup1Id,
      supplierId: 'SUP-0001',
      companyName: 'Toyota Arabia',
      companyNumber: 'CR-1010123456',
      email: 'sales@toyota-arabia.com',
      phone: '+966112345601',
      address: 'Riyadh Industrial Area, Riyadh',
      status: 'active',
      salesAgent: { name: 'Ahmad Bin Said', phone: '+966551110001', email: 'ahmad@toyota-arabia.com', designation: 'Fleet Sales Manager' },
      createdBy: adminId,
    },
    {
      _id: sup2Id,
      supplierId: 'SUP-0002',
      companyName: 'BMW Middle East',
      companyNumber: 'CR-2020234567',
      email: 'info@bmw-me.com',
      phone: '+966112345602',
      address: 'King Fahd Road, Riyadh',
      status: 'active',
      salesAgent: { name: 'Stefan Mueller', phone: '+966551110002', email: 'stefan@bmw-me.com', designation: 'Corporate Sales' },
      createdBy: adminId,
    },
    {
      _id: sup3Id,
      supplierId: 'SUP-0003',
      companyName: 'Gulf Auto Traders',
      companyNumber: 'CR-3030345678',
      email: 'trade@gulfauto.sa',
      phone: '+966112345603',
      address: 'Al-Khobar Industrial, Eastern Province',
      status: 'active',
      salesAgent: { name: 'Yousuf Al-Khalid', phone: '+966551110003', email: 'yousuf@gulfauto.sa', designation: 'Sales Representative' },
      createdBy: adminId,
    },
  ]);
  console.log('  ✓ 3 suppliers (SUP-0001..0003)');

  // ─── 5. CARS ───────────────────────────────────────────────────────────────
  console.log('🚗 Seeding cars…');

  const car1Id = OID();  // In Stock   — Toyota Camry
  const car2Id = OID();  // In Stock   — BMW 520i
  const car3Id = OID();  // In Stock   — Audi A6
  const car4Id = OID();  // In Stock   — Hyundai Sonata
  const car5Id = OID();  // In Stock   — Kia Optima
  const car6Id = OID();  // Under Repair — Chevrolet Malibu
  const car7Id = OID();  // Under Repair — Ford Mustang
  const car8Id = OID();  // Reserved   — Nissan Patrol
  const car9Id = OID();  // Sold (Cash CSH-0001) — Toyota Corolla
  const car10Id = OID(); // Sold (Cash CSH-0002) — BMW 320i
  const car11Id = OID(); // Sold (Cash CSH-0003) — Audi Q5
  const car12Id = OID(); // Sold (Installment INS-0001) — Hyundai Elantra
  const car13Id = OID(); // Sold (Installment INS-0002) — Mercedes C200
  const car14Id = OID(); // Rented Active (RNT-0001) — Toyota RAV4
  const car15Id = OID(); // Rented Completed → back In Stock (RNT-0002) — Kia Sportage

  const cars = [
    { _id: car1Id,  carId: 'CAR-001', brand: 'Toyota',    model: 'Camry',    year: 2023, chassisNumber: 'JT2BF1FK0P0001001', engineNumber: '2GRFE001', sequenceNumber: 'SEQ-001', color: 'White',      status: 'In Stock',    totalRepairCost: 1700, createdBy: adminId },
    { _id: car2Id,  carId: 'CAR-002', brand: 'BMW',       model: '520i',     year: 2023, chassisNumber: 'WBA5A5C51KA001002', engineNumber: 'B48A002', sequenceNumber: 'SEQ-002', color: 'Black',      status: 'In Stock',    totalRepairCost: 0,    createdBy: adminId },
    { _id: car3Id,  carId: 'CAR-003', brand: 'Audi',      model: 'A6',       year: 2022, chassisNumber: 'WAUZZZ4G1KN001003', engineNumber: 'CYPA003', sequenceNumber: 'SEQ-003', color: 'Silver',     status: 'In Stock',    totalRepairCost: 3000, createdBy: adminId },
    { _id: car4Id,  carId: 'CAR-004', brand: 'Hyundai',   model: 'Sonata',   year: 2024, chassisNumber: '5NPE24AA1KH001004', engineNumber: 'G4NA004', sequenceNumber: 'SEQ-004', color: 'Pearl White', status: 'In Stock',   totalRepairCost: 0,    createdBy: adminId },
    { _id: car5Id,  carId: 'CAR-005', brand: 'Kia',       model: 'Optima',   year: 2023, chassisNumber: '5XXGN4A7XDG001005', engineNumber: 'G4KD005', sequenceNumber: 'SEQ-005', color: 'Blue',       status: 'In Stock',    totalRepairCost: 0,    createdBy: adminId },
    { _id: car6Id,  carId: 'CAR-006', brand: 'Chevrolet', model: 'Malibu',   year: 2021, chassisNumber: '1G1ZB5ST5JF001006', engineNumber: 'LTG006',  sequenceNumber: 'SEQ-006', color: 'Gray',       status: 'Under Repair', totalRepairCost: 0,   createdBy: adminId },
    { _id: car7Id,  carId: 'CAR-007', brand: 'Ford',      model: 'Mustang',  year: 2022, chassisNumber: '1FA6P8TH3J5001007', engineNumber: 'VOODOO007', sequenceNumber: 'SEQ-007', color: 'Red',     status: 'Under Repair', totalRepairCost: 0,   createdBy: adminId },
    { _id: car8Id,  carId: 'CAR-008', brand: 'Nissan',    model: 'Patrol',   year: 2024, chassisNumber: 'JN1TANS61Z0001008', engineNumber: 'VK56008', sequenceNumber: 'SEQ-008', color: 'White',      status: 'Reserved',    totalRepairCost: 0,    createdBy: adminId },
    { _id: car9Id,  carId: 'CAR-009', brand: 'Toyota',    model: 'Corolla',  year: 2022, chassisNumber: '2T1BURHEXKC001009', engineNumber: '2ZRFE009', sequenceNumber: 'SEQ-009', color: 'Silver',    status: 'Sold',        totalRepairCost: 0,    createdBy: adminId },
    { _id: car10Id, carId: 'CAR-010', brand: 'BMW',       model: '320i',     year: 2023, chassisNumber: 'WBA5A5C55KA001010', engineNumber: 'B48B010', sequenceNumber: 'SEQ-010', color: 'Black',      status: 'Sold',        totalRepairCost: 0,    createdBy: adminId },
    { _id: car11Id, carId: 'CAR-011', brand: 'Audi',      model: 'Q5',       year: 2023, chassisNumber: 'WA1BNAFY4K2001011', engineNumber: 'DETA011', sequenceNumber: 'SEQ-011', color: 'Gray',       status: 'Sold',        totalRepairCost: 0,    createdBy: adminId },
    { _id: car12Id, carId: 'CAR-012', brand: 'Hyundai',   model: 'Elantra',  year: 2023, chassisNumber: 'KMHD04LA5KU001012', engineNumber: 'G4FG012', sequenceNumber: 'SEQ-012', color: 'Blue',       status: 'Sold',        totalRepairCost: 0,    createdBy: adminId },
    { _id: car13Id, carId: 'CAR-013', brand: 'Mercedes',  model: 'C200',     year: 2022, chassisNumber: 'WDD2050032A001013', engineNumber: 'M274013', sequenceNumber: 'SEQ-013', color: 'White',      status: 'Sold',        totalRepairCost: 0,    createdBy: adminId },
    { _id: car14Id, carId: 'CAR-014', brand: 'Toyota',    model: 'RAV4',     year: 2024, chassisNumber: '2T3RFREV0LW001014', engineNumber: 'A25014',  sequenceNumber: 'SEQ-014', color: 'Silver',     status: 'Rented',      totalRepairCost: 0,    createdBy: adminId },
    { _id: car15Id, carId: 'CAR-015', brand: 'Kia',       model: 'Sportage', year: 2023, chassisNumber: 'KNDPCCAC6H7001015', engineNumber: 'G4FJ015', sequenceNumber: 'SEQ-015', color: 'White',      status: 'In Stock',    totalRepairCost: 0,    createdBy: adminId },
  ];

  await Car.insertMany(cars);
  console.log('  ✓ 15 cars (CAR-001..015)');

  // ─── 6. CAR PURCHASES + EXPENSE TRANSACTIONS ───────────────────────────────
  console.log('🛒 Seeding car purchases…');

  // Pre-assign transaction IDs for car purchases (TXN-000001..000015)
  const purTxnIds = Array.from({ length: 15 }, () => OID());
  const purchaseIds = Array.from({ length: 15 }, () => OID());

  const purchaseData = [
    { carId: car1Id,  carIdStr: 'CAR-001', supplierId: sup1Id, supplierName: 'Toyota Arabia',      supplierContact: '+966112345601', price: 62000,  date: d(2025, 8,  5),  isNew: true },
    { carId: car2Id,  carIdStr: 'CAR-002', supplierId: sup2Id, supplierName: 'BMW Middle East',     supplierContact: '+966112345602', price: 118000, date: d(2025, 9,  12), isNew: true },
    { carId: car3Id,  carIdStr: 'CAR-003', supplierId: sup3Id, supplierName: 'Gulf Auto Traders',   supplierContact: '+966112345603', price: 98000,  date: d(2025, 10, 8),  isNew: false },
    { carId: car4Id,  carIdStr: 'CAR-004', supplierId: sup1Id, supplierName: 'Toyota Arabia',       supplierContact: '+966112345601', price: 72000,  date: d(2025, 11, 3),  isNew: true },
    { carId: car5Id,  carIdStr: 'CAR-005', supplierId: sup3Id, supplierName: 'Gulf Auto Traders',   supplierContact: '+966112345603', price: 58000,  date: d(2025, 12, 1),  isNew: true },
    { carId: car6Id,  carIdStr: 'CAR-006', supplierId: sup3Id, supplierName: 'Gulf Auto Traders',   supplierContact: '+966112345603', price: 48000,  date: d(2025, 7,  15), isNew: false },
    { carId: car7Id,  carIdStr: 'CAR-007', supplierId: sup3Id, supplierName: 'Gulf Auto Traders',   supplierContact: '+966112345603', price: 85000,  date: d(2025, 6,  20), isNew: false },
    { carId: car8Id,  carIdStr: 'CAR-008', supplierId: sup1Id, supplierName: 'Toyota Arabia',       supplierContact: '+966112345601', price: 178000, date: d(2026, 1,  10), isNew: true },
    { carId: car9Id,  carIdStr: 'CAR-009', supplierId: sup1Id, supplierName: 'Toyota Arabia',       supplierContact: '+966112345601', price: 55000,  date: d(2025, 10, 25), isNew: false },
    { carId: car10Id, carIdStr: 'CAR-010', supplierId: sup2Id, supplierName: 'BMW Middle East',     supplierContact: '+966112345602', price: 112000, date: d(2025, 11, 18), isNew: false },
    { carId: car11Id, carIdStr: 'CAR-011', supplierId: sup3Id, supplierName: 'Gulf Auto Traders',   supplierContact: '+966112345603', price: 128000, date: d(2025, 9,  5),  isNew: false },
    { carId: car12Id, carIdStr: 'CAR-012', supplierId: sup1Id, supplierName: 'Toyota Arabia',       supplierContact: '+966112345601', price: 63000,  date: d(2025, 5,  10), isNew: false },
    { carId: car13Id, carIdStr: 'CAR-013', supplierId: sup3Id, supplierName: 'Gulf Auto Traders',   supplierContact: '+966112345603', price: 155000, date: d(2025, 8,  30), isNew: false },
    { carId: car14Id, carIdStr: 'CAR-014', supplierId: sup1Id, supplierName: 'Toyota Arabia',       supplierContact: '+966112345601', price: 88000,  date: d(2026, 2,  14), isNew: true },
    { carId: car15Id, carIdStr: 'CAR-015', supplierId: sup3Id, supplierName: 'Gulf Auto Traders',   supplierContact: '+966112345603', price: 67000,  date: d(2026, 1,  22), isNew: true },
  ];

  const purchaseTxns = purchaseData.map((p, i) => ({
    _id: purTxnIds[i],
    transactionId: nextTxnId(),
    date: p.date,
    type: 'Expense',
    category: 'Car Purchase',
    amount: p.price,
    description: `Car purchase — ${p.supplierName} (${p.carIdStr})`,
    referenceId: purchaseIds[i].toString(),
    referenceType: 'CarPurchase',
    isAutoGenerated: true,
    isDeleted: false,
    createdBy: adminId,
  }));

  await Transaction.insertMany(purchaseTxns);

  const purchases = purchaseData.map((p, i) => ({
    _id: purchaseIds[i],
    car: p.carId,
    supplier: p.supplierId,
    supplierName: p.supplierName,
    supplierContact: p.supplierContact,
    purchasePrice: p.price,
    purchaseDate: p.date,
    isNewCar: p.isNew,
    conditionImages: [],
    transactionId: purTxnIds[i],
    createdBy: adminId,
  }));

  await CarPurchase.insertMany(purchases);

  // Update each car with its purchase ref
  await Promise.all(
    purchases.map((p, i) =>
      Car.updateOne({ _id: purchaseData[i].carId }, { $set: { purchase: purchaseIds[i] } })
    )
  );
  console.log('  ✓ 15 car purchases + 15 expense transactions (TXN-000001..000015)');

  // ─── 7. VEHICLE DOCUMENTS ──────────────────────────────────────────────────
  console.log('📄 Seeding vehicle documents…');

  const today = d(2026, 4, 20); // Reference "today" for expiry alerts

  // Helper: build 3 docs for a car
  // alertDays: days from today when each doc expires (positive = future, negative = expired)
  const makeDocs = (
    carOid: mongoose.Types.ObjectId,
    carIdStr: string,
    insuranceDays: number,
    regCardDays: number,
    roadPermitDays: number
  ) => {
    const expiryFromToday = (days: number) => {
      const d2 = new Date(today);
      d2.setDate(d2.getDate() + days);
      return d2;
    };
    const issueFromExpiry = (expiry: Date, validYears: number) => {
      const i = new Date(expiry);
      i.setFullYear(i.getFullYear() - validYears);
      return i;
    };
    const types: Array<'Insurance' | 'Road Permit' | 'Registration Card'> = [
      'Insurance', 'Registration Card', 'Road Permit',
    ];
    const daysList = [insuranceDays, regCardDays, roadPermitDays];
    return types.map((docType, idx) => {
      const expiry = expiryFromToday(daysList[idx]);
      const issue = issueFromExpiry(expiry, 1);
      return {
        _id: OID(),
        car: carOid,
        carId: carIdStr,
        documentType: docType,
        issueDate: issue,
        expiryDate: expiry,
        fileUrl: '',
        fileName: '',
        notes: '',
        alertSent30: false,
        alertSent15: false,
        alertSent7: false,
        createdBy: adminId,
      };
    });
  };

  const allDocs = [
    ...makeDocs(car1Id,  'CAR-001', 420, 390, 360),  // In Stock — valid
    ...makeDocs(car2Id,  'CAR-002', 450, 420, 395),
    ...makeDocs(car3Id,  'CAR-003', 380, 365, 340),
    ...makeDocs(car4Id,  'CAR-004', 500, 480, 460),
    ...makeDocs(car5Id,  'CAR-005', 410, 395, 370),
    ...makeDocs(car6Id,  'CAR-006', 20,  45,  60),    // Under Repair — Insurance expiring in 20 days (alert!)
    ...makeDocs(car7Id,  'CAR-007', 55,  6,   30),    // Under Repair — Reg Card expiring in 6 days (urgent alert!)
    ...makeDocs(car8Id,  'CAR-008', 300, 280, 260),   // Reserved — valid
    ...makeDocs(car9Id,  'CAR-009', 250, 230, 210),   // Sold — valid
    ...makeDocs(car10Id, 'CAR-010', 280, 260, 240),
    ...makeDocs(car11Id, 'CAR-011', 320, 300, 280),
    ...makeDocs(car12Id, 'CAR-012', 200, 185, 170),
    ...makeDocs(car13Id, 'CAR-013', 240, 220, 200),
    ...makeDocs(car14Id, 'CAR-014', 350, 330, 310),   // Rented — valid
    ...makeDocs(car15Id, 'CAR-015', 290, 270, 250),   // Rented (completed) — valid
  ];

  await VehicleDocument.insertMany(allDocs);
  console.log('  ✓ 45 vehicle documents (3 per car; CAR-006 insurance ~20d, CAR-007 reg card ~6d)');

  // ─── 8. CASH SALES + INCOME TRANSACTIONS ───────────────────────────────────
  console.log('💰 Seeding cash sales…');

  // CSH-0001: Toyota Corolla, Abdul Rahman (Individual), flat discount
  //   salePrice=70000, discountType=flat, discountValue=2000 → discountAmount=2000
  //   finalPrice=68000, vat=10200, finalPriceWithVat=78200
  const csh1Id = OID();
  const csh1TxnId = OID();
  // CSH-0002: BMW 320i, Al-Faris Trading (Business, Standard, B2B), percentage discount
  //   salePrice=138000, discountType=percentage, discountValue=3 → discountAmount=4140
  //   finalPrice=133860, vat=20079, finalPriceWithVat=153939
  const csh2Id = OID();
  const csh2TxnId = OID();
  // CSH-0003: Audi Q5, Tariq Al-Mutairi (Individual), flat discount
  //   salePrice=155000, discountType=flat, discountValue=5000 → discountAmount=5000
  //   finalPrice=150000, vat=22500, finalPriceWithVat=172500
  const csh3Id = OID();
  const csh3TxnId = OID();

  await Transaction.insertMany([
    { _id: csh1TxnId, transactionId: nextTxnId(), date: d(2026, 1, 15), type: 'Income', category: 'Cash Sale', amount: 78200,  description: 'Cash sale — CSH-0001 Toyota Corolla', referenceId: csh1Id.toString(), referenceType: 'CashSale', isAutoGenerated: true, isDeleted: false, createdBy: adminId },
    { _id: csh2TxnId, transactionId: nextTxnId(), date: d(2026, 2, 20), type: 'Income', category: 'Cash Sale', amount: 153939, description: 'Cash sale — CSH-0002 BMW 320i',        referenceId: csh2Id.toString(), referenceType: 'CashSale', isAutoGenerated: true, isDeleted: false, createdBy: adminId },
    { _id: csh3TxnId, transactionId: nextTxnId(), date: d(2026, 3, 10), type: 'Income', category: 'Cash Sale', amount: 172500, description: 'Cash sale — CSH-0003 Audi Q5',         referenceId: csh3Id.toString(), referenceType: 'CashSale', isAutoGenerated: true, isDeleted: false, createdBy: adminId },
  ]);

  await CashSale.insertMany([
    {
      _id: csh1Id,
      saleId: 'CSH-0001',
      car: car9Id, carId: 'CAR-009',
      customer: cus1Id, customerName: 'Abdul Rahman Al-Dosari', customerPhone: '+966512000001',
      salePrice: 70000, discountType: 'flat', discountValue: 2000, discountAmount: 2000,
      finalPrice: 68000, vatRate: 15, vatAmount: 10200, finalPriceWithVat: 78200,
      agentName: 'Khalid Al-Ghamdi', agentCommission: 2,
      saleDate: d(2026, 1, 15), status: 'Active',
      invoiceType: 'Simplified', zatcaStatus: 'Pending',
      createdBy: adminId,
    },
    {
      _id: csh2Id,
      saleId: 'CSH-0002',
      car: car10Id, carId: 'CAR-010',
      customer: cus8Id, customerName: 'Al-Faris Trading Co.', customerPhone: '+966512000008',
      salePrice: 138000, discountType: 'percentage', discountValue: 3, discountAmount: 4140,
      finalPrice: 133860, vatRate: 15, vatAmount: 20079, finalPriceWithVat: 153939,
      agentName: 'Omar Al-Shehri', agentCommission: 1.5,
      saleDate: d(2026, 2, 20), status: 'Active',
      invoiceType: 'Standard', buyerTrn: '310000000000003', zatcaStatus: 'Pending',
      createdBy: adminId,
    },
    {
      _id: csh3Id,
      saleId: 'CSH-0003',
      car: car11Id, carId: 'CAR-011',
      customer: cus2Id, customerName: 'Tariq Al-Mutairi', customerPhone: '+966512000002',
      salePrice: 155000, discountType: 'flat', discountValue: 5000, discountAmount: 5000,
      finalPrice: 150000, vatRate: 15, vatAmount: 22500, finalPriceWithVat: 172500,
      agentName: 'Khalid Al-Ghamdi', agentCommission: 2,
      saleDate: d(2026, 3, 10), status: 'Active',
      invoiceType: 'Simplified', zatcaStatus: 'Pending',
      createdBy: adminId,
    },
  ]);
  console.log('  ✓ 3 cash sales (CSH-0001..0003) + 3 income transactions');

  // ─── 9. INSTALLMENT SALES + TRANSACTIONS ───────────────────────────────────
  console.log('📋 Seeding installment sales…');

  // INS-0001: Hyundai Elantra, Saad Al-Anazi, 24 months, 5% interest, 8 paid
  //   totalPrice=85000, down=17000, loan=68000
  //   total interest = 68000 * 0.05 * 2 = 6800, total repayment=74800
  //   monthly = round(74800/24) = 3117
  //   startDate = 2025-07-01, months 1–8 paid (Jul–Feb 2026)
  //   paidInstallments = 8 * 3117 = 24936
  //   totalPaid = 17000 + 24936 = 41936
  //   remainingAmount = 85000 - 41936 = 43064
  //   nextPayment = #9 = 2026-03-01
  //   vatAmount = 85000 * 0.15 = 12750, finalPriceWithVat = 97750
  const ins1Id = OID();
  const ins1StartDate = d(2025, 7, 1);
  const ins1Monthly = 3117;
  const ins1PaidCount = 8;

  const ins1Schedule = Array.from({ length: 24 }, (_, i) => {
    const num = i + 1;
    const dueDate = addMonths(ins1StartDate, num);
    const isPaid = num <= ins1PaidCount;
    return {
      installmentNumber: num,
      dueDate,
      amount: ins1Monthly,
      status: isPaid ? 'Paid' : 'Pending',
      paidDate: isPaid ? dueDate : undefined,
      paidAmount: isPaid ? ins1Monthly : undefined,
      lateFee: 0,
    };
  });

  // INS-0002: Mercedes C200, Faisal Al-Harbi, 12 months, 6% interest, 3 paid
  //   totalPrice=178000, down=45000, loan=133000
  //   total interest = 133000 * 0.06 * 1 = 7980, total repayment=140980
  //   monthly = round(140980/12) = 11748
  //   startDate = 2026-01-01, months 1–3 paid (Jan–Mar 2026)
  //   paidInstallments = 3 * 11748 = 35244
  //   totalPaid = 45000 + 35244 = 80244
  //   remainingAmount = 178000 - 80244 = 97756
  //   nextPayment = #4 = 2026-04-01
  //   vatAmount = 178000 * 0.15 = 26700, finalPriceWithVat = 204700
  const ins2Id = OID();
  const ins2StartDate = d(2026, 1, 1);
  const ins2Monthly = 11748;
  const ins2PaidCount = 3;

  const ins2Schedule = Array.from({ length: 12 }, (_, i) => {
    const num = i + 1;
    const dueDate = addMonths(ins2StartDate, num);
    const isPaid = num <= ins2PaidCount;
    return {
      installmentNumber: num,
      dueDate,
      amount: ins2Monthly,
      status: isPaid ? 'Paid' : 'Pending',
      paidDate: isPaid ? dueDate : undefined,
      paidAmount: isPaid ? ins2Monthly : undefined,
      lateFee: 0,
    };
  });

  // Transactions: down payments + paid installments
  const ins1DownTxnId = OID();
  const ins2DownTxnId = OID();

  const ins1InstTxnIds = Array.from({ length: ins1PaidCount }, () => OID());
  const ins2InstTxnIds = Array.from({ length: ins2PaidCount }, () => OID());

  await Transaction.insertMany([
    // Down payments
    { _id: ins1DownTxnId, transactionId: nextTxnId(), date: ins1StartDate, type: 'Income', category: 'Installment Payment', amount: 17000, description: 'Down payment — INS-0001 Hyundai Elantra', referenceId: ins1Id.toString(), referenceType: 'InstallmentSale', isAutoGenerated: true, isDeleted: false, createdBy: adminId },
    { _id: ins2DownTxnId, transactionId: nextTxnId(), date: ins2StartDate, type: 'Income', category: 'Installment Payment', amount: 45000, description: 'Down payment — INS-0002 Mercedes C200',   referenceId: ins2Id.toString(), referenceType: 'InstallmentSale', isAutoGenerated: true, isDeleted: false, createdBy: adminId },
    // INS-0001 paid installments
    ...ins1InstTxnIds.map((id, i) => ({
      _id: id,
      transactionId: nextTxnId(),
      date: addMonths(ins1StartDate, i + 1),
      type: 'Income',
      category: 'Installment Payment',
      amount: ins1Monthly,
      description: `Installment #${i + 1} — INS-0001 Hyundai Elantra`,
      referenceId: ins1Id.toString(),
      referenceType: 'InstallmentSale',
      isAutoGenerated: true,
      isDeleted: false,
      createdBy: adminId,
    })),
    // INS-0002 paid installments
    ...ins2InstTxnIds.map((id, i) => ({
      _id: id,
      transactionId: nextTxnId(),
      date: addMonths(ins2StartDate, i + 1),
      type: 'Income',
      category: 'Installment Payment',
      amount: ins2Monthly,
      description: `Installment #${i + 1} — INS-0002 Mercedes C200`,
      referenceId: ins2Id.toString(),
      referenceType: 'InstallmentSale',
      isAutoGenerated: true,
      isDeleted: false,
      createdBy: adminId,
    })),
  ]);

  await InstallmentSale.insertMany([
    {
      _id: ins1Id,
      saleId: 'INS-0001',
      car: car12Id, carId: 'CAR-012',
      customer: cus4Id, customerName: 'Saad Al-Anazi', customerPhone: '+966512000004',
      totalPrice: 85000,
      downPayment: 17000,
      loanAmount: 68000,
      monthlyPayment: ins1Monthly,
      interestRate: 5,
      tenureMonths: 24,
      startDate: ins1StartDate,
      paymentSchedule: ins1Schedule,
      nextPaymentDate: addMonths(ins1StartDate, ins1PaidCount + 1),
      nextPaymentAmount: ins1Monthly,
      totalPaid: 17000 + ins1PaidCount * ins1Monthly,
      remainingAmount: 85000 - (17000 + ins1PaidCount * ins1Monthly),
      deliveryThresholdPercent: 30,
      lateFeePercent: 2,
      lateFeeCharged: 0,
      vatRate: 15,
      vatAmount: 12750,
      finalPriceWithVat: 97750,
      invoiceType: 'Simplified',
      zatcaStatus: 'Pending',
      agentName: 'Khalid Al-Ghamdi',
      agentCommission: 2,
      status: 'Active',
      createdBy: adminId,
    },
    {
      _id: ins2Id,
      saleId: 'INS-0002',
      car: car13Id, carId: 'CAR-013',
      customer: cus5Id, customerName: 'Faisal Al-Harbi', customerPhone: '+966512000005',
      totalPrice: 178000,
      downPayment: 45000,
      loanAmount: 133000,
      monthlyPayment: ins2Monthly,
      interestRate: 6,
      tenureMonths: 12,
      startDate: ins2StartDate,
      paymentSchedule: ins2Schedule,
      nextPaymentDate: addMonths(ins2StartDate, ins2PaidCount + 1),
      nextPaymentAmount: ins2Monthly,
      totalPaid: 45000 + ins2PaidCount * ins2Monthly,
      remainingAmount: 178000 - (45000 + ins2PaidCount * ins2Monthly),
      deliveryThresholdPercent: 30,
      lateFeePercent: 2,
      lateFeeCharged: 0,
      vatRate: 15,
      vatAmount: 26700,
      finalPriceWithVat: 204700,
      invoiceType: 'Simplified',
      zatcaStatus: 'Pending',
      agentName: 'Omar Al-Shehri',
      agentCommission: 1.5,
      status: 'Active',
      createdBy: adminId,
    },
  ]);
  console.log('  ✓ 2 installment sales (INS-0001..0002) + 13 income transactions');

  // ─── 10. RENTALS + TRANSACTIONS ────────────────────────────────────────────
  console.log('🚙 Seeding rentals…');

  // RNT-0001: Toyota RAV4, Khalid Al-Otaibi, Active
  //   Apr 15–30, 2026 (15 days), dailyRate=350
  //   totalAmount=5250, vat=787.50, totalAmountWithVat=6037.50
  const rnt1Id = OID();
  // RNT-0002: Kia Sportage, Bandar Al-Shammari, Completed
  //   Mar 1–15, 2026 (14 days), dailyRate=250
  //   totalAmount=3500, vat=525, totalAmountWithVat=4025
  const rnt2Id = OID();
  const rnt2TxnId = OID();

  await Transaction.insertMany([
    {
      _id: rnt2TxnId,
      transactionId: nextTxnId(),
      date: d(2026, 3, 15),
      type: 'Income',
      category: 'Rental Income',
      amount: 4025,
      description: 'Rental income — RNT-0002 Kia Sportage',
      referenceId: rnt2Id.toString(),
      referenceType: 'Rental',
      isAutoGenerated: true,
      isDeleted: false,
      createdBy: adminId,
    },
  ]);

  await Rental.insertMany([
    {
      _id: rnt1Id,
      rentalId: 'RNT-0001',
      car: car14Id, carId: 'CAR-014',
      customer: cus6Id, customerName: 'Khalid Al-Otaibi', customerPhone: '+966512000006',
      startDate: d(2026, 4, 15),
      endDate: d(2026, 4, 30),
      dailyRate: 350,
      totalAmount: 5250,
      vatRate: 15,
      vatAmount: 787.5,
      totalAmountWithVat: 6037.5,
      securityDeposit: 2000,
      status: 'Active',
      invoiceType: 'Simplified',
      zatcaStatus: 'Pending',
      agentName: 'Omar Al-Shehri',
      agentCommission: 1.5,
      createdBy: adminId,
    },
    {
      _id: rnt2Id,
      rentalId: 'RNT-0002',
      car: car15Id, carId: 'CAR-015',
      customer: cus7Id, customerName: 'Bandar Al-Shammari', customerPhone: '+966512000007',
      startDate: d(2026, 3, 1),
      endDate: d(2026, 3, 15),
      dailyRate: 250,
      totalAmount: 3500,
      vatRate: 15,
      vatAmount: 525,
      totalAmountWithVat: 4025,
      securityDeposit: 1500,
      status: 'Completed',
      returnDate: d(2026, 3, 15),
      actualReturnDate: d(2026, 3, 15),
      lateFee: 0,
      invoiceType: 'Simplified',
      zatcaStatus: 'Pending',
      agentName: 'Khalid Al-Ghamdi',
      agentCommission: 2,
      createdBy: adminId,
    },
  ]);
  console.log('  ✓ 2 rentals (RNT-0001..0002) + 1 income transaction');

  // ─── 11. REPAIRS + EXPENSE TRANSACTIONS ────────────────────────────────────
  console.log('🔧 Seeding repairs…');

  // Repair 1: CAR-006 Chevrolet Malibu — Engine overhaul, In Progress
  const rep1Id = OID();
  // Repair 2: CAR-007 Ford Mustang — Transmission repair, Pending
  const rep2Id = OID();
  // Repair 3: CAR-001 Toyota Camry — AC compressor, Completed → Expense TXN
  const rep3Id = OID();
  const rep3TxnId = OID();
  // Repair 4: CAR-003 Audi A6 — Suspension, Completed → Expense TXN
  const rep4Id = OID();
  const rep4TxnId = OID();

  await Transaction.insertMany([
    { _id: rep3TxnId, transactionId: nextTxnId(), date: d(2026, 2, 15), type: 'Expense', category: 'Repair', amount: 1700, description: 'Repair cost — CAR-001 Toyota Camry (AC compressor)', referenceId: rep3Id.toString(), referenceType: 'Repair', isAutoGenerated: true, isDeleted: false, createdBy: adminId },
    { _id: rep4TxnId, transactionId: nextTxnId(), date: d(2026, 3,  5), type: 'Expense', category: 'Repair', amount: 3000, description: 'Repair cost — CAR-003 Audi A6 (suspension)',         referenceId: rep4Id.toString(), referenceType: 'Repair', isAutoGenerated: true, isDeleted: false, createdBy: adminId },
  ]);

  await Repair.insertMany([
    {
      _id: rep1Id,
      car: car6Id, carId: 'CAR-006',
      repairDescription: 'Engine overhaul — pistons and valves replacement',
      partsReplaced: 'Pistons, valve seals, head gasket',
      laborCost: 2000, repairCost: 2700, totalCost: 4700,
      repairDate: d(2026, 4, 10),
      beforeImages: [], afterImages: [],
      status: 'In Progress',
      isDeleted: false,
      createdBy: adminId,
    },
    {
      _id: rep2Id,
      car: car7Id, carId: 'CAR-007',
      repairDescription: 'Transmission overhaul — gearbox rebuild',
      partsReplaced: 'Gearbox clutch pack, solenoids',
      laborCost: 3000, repairCost: 4500, totalCost: 7500,
      repairDate: d(2026, 4, 20),
      beforeImages: [], afterImages: [],
      status: 'Pending',
      isDeleted: false,
      createdBy: adminId,
    },
    {
      _id: rep3Id,
      car: car1Id, carId: 'CAR-001',
      repairDescription: 'AC compressor replacement',
      partsReplaced: 'AC compressor, refrigerant',
      laborCost: 500, repairCost: 1200, totalCost: 1700,
      repairDate: d(2026, 2, 15),
      beforeImages: [], afterImages: [],
      status: 'Completed',
      isDeleted: false,
      createdBy: adminId,
    },
    {
      _id: rep4Id,
      car: car3Id, carId: 'CAR-003',
      repairDescription: 'Front suspension repair — struts and bearings',
      partsReplaced: 'Front struts, wheel bearings, tie rod ends',
      laborCost: 800, repairCost: 2200, totalCost: 3000,
      repairDate: d(2026, 3, 5),
      beforeImages: [], afterImages: [],
      status: 'Completed',
      isDeleted: false,
      createdBy: adminId,
    },
  ]);
  console.log('  ✓ 4 repairs + 2 expense transactions');

  // ─── 12. SALARY PAYMENTS + EXPENSE TRANSACTIONS ────────────────────────────
  console.log('💵 Seeding salary payments…');

  const employees = [
    { id: emp1Id, empId: 'EMP-0001', name: 'Khalid Al-Ghamdi',  salary: 8000 },
    { id: emp2Id, empId: 'EMP-0002', name: 'Omar Al-Shehri',    salary: 7500 },
    { id: emp3Id, empId: 'EMP-0003', name: 'Fatima Al-Zahrani', salary: 9000 },
    { id: emp4Id, empId: 'EMP-0004', name: 'Mohammed Al-Harbi', salary: 6000 },
    { id: emp5Id, empId: 'EMP-0005', name: 'Sara Al-Qahtani',   salary: 7000 },
  ];

  const salaryMonths = [
    { month: 2, year: 2026, day: 28 },
    { month: 3, year: 2026, day: 31 },
    { month: 4, year: 2026, day: 15 }, // current month, mid-month
  ];

  const salaryPayments: object[] = [];
  const salaryTxns: object[] = [];

  for (const monthDef of salaryMonths) {
    for (const emp of employees) {
      const salId = OID();
      const salTxnId = OID();
      const payDate = d(monthDef.year, monthDef.month, monthDef.day);
      const paymentId = nextSalId();

      salaryTxns.push({
        _id: salTxnId,
        transactionId: nextTxnId(),
        date: payDate,
        type: 'Expense',
        category: 'Salary Payment',
        amount: emp.salary,
        description: `Salary — ${emp.name} (${paymentId}) ${monthDef.month}/${monthDef.year}`,
        referenceId: salId.toString(),
        referenceType: 'SalaryPayment',
        isAutoGenerated: true,
        isDeleted: false,
        createdBy: adminId,
      });

      salaryPayments.push({
        _id: salId,
        paymentId,
        employee: emp.id,
        employeeId: emp.empId,
        employeeName: emp.name,
        amount: emp.salary,
        paymentDate: payDate,
        month: monthDef.month,
        year: monthDef.year,
        paymentType: 'Monthly',
        status: 'Active',
        createdBy: adminId,
      });
    }
  }

  await Transaction.insertMany(salaryTxns);
  await SalaryPayment.insertMany(salaryPayments);
  console.log('  ✓ 15 salary payments (5 emps × 3 months) + 15 expense transactions');

  // ─── 13. MANUAL TRANSACTIONS ───────────────────────────────────────────────
  console.log('📊 Seeding manual transactions…');

  await Transaction.insertMany([
    // Office Expenses
    { _id: OID(), transactionId: nextTxnId(), date: d(2026, 2, 1),  type: 'Expense', category: 'Office Expense', amount: 15000, description: 'Office rent — February 2026',          isAutoGenerated: false, isDeleted: false, createdBy: adminId },
    { _id: OID(), transactionId: nextTxnId(), date: d(2026, 3, 1),  type: 'Expense', category: 'Office Expense', amount: 15000, description: 'Office rent — March 2026',             isAutoGenerated: false, isDeleted: false, createdBy: adminId },
    { _id: OID(), transactionId: nextTxnId(), date: d(2026, 4, 1),  type: 'Expense', category: 'Office Expense', amount: 15000, description: 'Office rent — April 2026',             isAutoGenerated: false, isDeleted: false, createdBy: adminId },
    { _id: OID(), transactionId: nextTxnId(), date: d(2026, 2, 5),  type: 'Expense', category: 'Office Expense', amount: 1200,  description: 'Electricity & water bill — Feb 2026',  isAutoGenerated: false, isDeleted: false, createdBy: adminId },
    { _id: OID(), transactionId: nextTxnId(), date: d(2026, 3, 5),  type: 'Expense', category: 'Office Expense', amount: 1100,  description: 'Electricity & water bill — Mar 2026',  isAutoGenerated: false, isDeleted: false, createdBy: adminId },
    { _id: OID(), transactionId: nextTxnId(), date: d(2026, 2, 10), type: 'Expense', category: 'Office Expense', amount: 800,   description: 'Internet & phone subscription',        isAutoGenerated: false, isDeleted: false, createdBy: adminId },
    // Other Income
    { _id: OID(), transactionId: nextTxnId(), date: d(2026, 2, 28), type: 'Income',  category: 'Other Income',   amount: 2500,  description: 'Referral commission from Gulf Motors',  isAutoGenerated: false, isDeleted: false, createdBy: adminId },
    { _id: OID(), transactionId: nextTxnId(), date: d(2026, 3, 20), type: 'Income',  category: 'Other Income',   amount: 1800,  description: 'Scrap parts sale — old inventory',      isAutoGenerated: false, isDeleted: false, createdBy: adminId },
  ]);
  console.log('  ✓ 8 manual transactions (6 expense, 2 income)');

  // ─── 14. ZATCA CONFIG ──────────────────────────────────────────────────────
  console.log('🧾 Seeding ZATCA config…');

  await ZatcaConfig.insertMany([
    {
      _id: OID(),
      sellerName: 'Saudi Auto Dealership Co.',
      sellerNameAr: 'شركة السيارات السعودية',
      trn: '311111111111111',
      address: {
        buildingNumber: '1234',
        streetName: 'King Fahd Road',
        district: 'Al-Olaya',
        city: 'Riyadh',
        postalCode: '12211',
        countryCode: 'SA',
      },
      environment: 'sandbox',
      pih: 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjOTljMmYxN2ZiNTVkMzRlYzYzMDMzNjE5YTM0ZGY4YjEwNw==',
      isActive: true,
      updatedBy: adminId,
    },
  ]);
  console.log('  ✓ 1 ZATCA config (sandbox, TRN=311111111111111, Riyadh)');

  // ─── 15. ACTIVITY LOG ──────────────────────────────────────────────────────
  console.log('📝 Seeding activity log…');

  await ActivityLog.insertMany([
    { _id: OID(), user: adminId,     userName: 'Ahmed Al-Rashidi',   action: 'LOGIN',   module: 'Auth',        targetId: '',          details: 'Admin logged in',                         ipAddress: '192.168.1.1' },
    { _id: OID(), user: adminId,     userName: 'Ahmed Al-Rashidi',   action: 'CREATE',  module: 'Cars',        targetId: 'CAR-001',   details: 'Created car Toyota Camry 2023',           ipAddress: '192.168.1.1' },
    { _id: OID(), user: khalidUserId, userName: 'Khalid Al-Ghamdi',  action: 'CREATE',  module: 'Sales',       targetId: 'CSH-0001',  details: 'Created cash sale CSH-0001',              ipAddress: '192.168.1.10' },
    { _id: OID(), user: managerId,   userName: 'Mohammed Al-Otaibi', action: 'UPDATE',  module: 'Employees',   targetId: 'EMP-0001',  details: 'Updated employee commission rate',        ipAddress: '192.168.1.2' },
    { _id: OID(), user: adminId,     userName: 'Ahmed Al-Rashidi',   action: 'UPDATE',  module: 'ZatcaConfig', targetId: '',          details: 'Configured ZATCA sandbox environment',    ipAddress: '192.168.1.1' },
  ]);
  console.log('  ✓ 5 activity log entries');

  // ─── DONE ───────────────────────────────────────────────────────────────────
  await mongoose.disconnect();

  console.log('\n' + '═'.repeat(60));
  console.log('✅ SEED COMPLETE');
  console.log('═'.repeat(60));
  console.log('\n🔑 Login Credentials:');
  console.log('  Admin:           admin@amyalcar.com       / Admin@123');
  console.log('  Car Manager:     car-manager@amyalcar.com / CarManager@123');
  console.log('  Accountant:      accountant@amyalcar.com  / Accountant@123');
  console.log('  Sales Person:    sales-person@amyalcar.com/ SalesPerson@123');
  console.log('\n📊 Data Summary:');
  console.log(`  Users: 4  |  Employees: 5  |  Customers: 10  |  Suppliers: 3`);
  console.log(`  Cars: 15  |  Car Purchases: 15  |  Vehicle Docs: 45`);
  console.log(`  Cash Sales: 3  |  Installments: 2  |  Rentals: 2  |  Repairs: 4`);
  console.log(`  Salary Payments: 15  |  Transactions: ${txnSeq}  |  Activity Logs: 5`);
  console.log(`  ⚠️  Alert docs: CAR-006 Insurance (~20d), CAR-007 Reg Card (~6d)`);
  console.log('═'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
