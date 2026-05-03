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
const subDays = (date: Date, days: number): Date => {
  const r = new Date(date);
  r.setDate(r.getDate() - days);
  return r;
};

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });
  dotenv.config({ path: '.env' });

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car_dealership';
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
  const salesId = OID();

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
      _id: salesId,
      name: 'Khalid Al-Ghamdi',
      email: 'sales-person@amyalcar.com',
      password: await bcrypt.hash('SalesPerson@123', BCRYPT_ROUNDS),
      role: 'Sales Person',
      phone: '+966501110004',
      isActive: true,
      passwordVersion: 1,
    },
  ]);

  // ─── 2. EMPLOYEES ──────────────────────────────────────────────────────────
  console.log('👷 Seeding employees…');

  const empIds = Array.from({ length: 10 }, () => OID());
  const employees = [
    { _id: empIds[0], employeeId: 'EMP-0001', name: 'Khalid Al-Ghamdi', phone: '+966501110004', email: 'sales-person@amyalcar.com', designation: 'Sales Manager', department: 'Sales', baseSalary: 12000, commissionRate: 2, joiningDate: d(2022, 1, 1), isActive: true, createdBy: adminId },
    { _id: empIds[1], employeeId: 'EMP-0002', name: 'Omar Al-Shehri', phone: '+966501110005', email: 'omar@amyalcar.com', designation: 'Sales Executive', department: 'Sales', baseSalary: 8500, commissionRate: 1.5, joiningDate: d(2023, 3, 1), isActive: true, createdBy: adminId },
    { _id: empIds[2], employeeId: 'EMP-0003', name: 'Fatima Al-Zahrani', phone: '+966501110003', email: 'accountant@amyalcar.com', designation: 'Chief Accountant', department: 'Finance', baseSalary: 15000, joiningDate: d(2022, 6, 10), isActive: true, createdBy: adminId },
    { _id: empIds[3], employeeId: 'EMP-0004', name: 'Mohammed Al-Harbi', phone: '+966501110006', email: 'mharbi@amyalcar.com', designation: 'Senior Mechanic', department: 'Service', baseSalary: 9000, joiningDate: d(2021, 9, 20), isActive: true, createdBy: adminId },
    { _id: empIds[4], employeeId: 'EMP-0005', name: 'Sara Al-Qahtani', phone: '+966501110007', email: 'sara@amyalcar.com', designation: 'Logistics Coordinator', department: 'Operations', baseSalary: 7500, joiningDate: d(2023, 7, 5), isActive: true, createdBy: adminId },
    { _id: empIds[5], employeeId: 'EMP-0006', name: 'Fahad Al-Dosari', phone: '+966501110008', email: 'fahad@amyalcar.com', designation: 'Sales Agent', department: 'Sales', baseSalary: 6500, commissionRate: 1.0, joiningDate: d(2024, 1, 15), isActive: true, createdBy: adminId },
    { _id: empIds[6], employeeId: 'EMP-0007', name: 'Noura Al-Mutairi', phone: '+966501110009', email: 'noura@amyalcar.com', designation: 'Customer Service', department: 'Sales', baseSalary: 6000, joiningDate: d(2024, 2, 1), isActive: true, createdBy: adminId },
    { _id: empIds[7], employeeId: 'EMP-0008', name: 'Abdullah Al-Anazi', phone: '+966501110010', email: 'abdullah@amyalcar.com', designation: 'Junior Accountant', department: 'Finance', baseSalary: 7000, joiningDate: d(2024, 3, 10), isActive: true, createdBy: adminId },
    { _id: empIds[8], employeeId: 'EMP-0009', name: 'Waleed Al-Otaibi', phone: '+966501110011', email: 'waleed@amyalcar.com', designation: 'Mechanic', department: 'Service', baseSalary: 5500, joiningDate: d(2023, 11, 20), isActive: true, createdBy: adminId },
    { _id: empIds[9], employeeId: 'EMP-0010', name: 'Hessa Al-Subaie', phone: '+966501110012', email: 'hessa@amyalcar.com', designation: 'Admin Assistant', department: 'Operations', baseSalary: 6000, joiningDate: d(2024, 4, 1), isActive: true, createdBy: adminId },
  ];
  await Employee.insertMany(employees);

  // ─── 3. CUSTOMERS ──────────────────────────────────────────────────────────
  console.log('👥 Seeding customers…');

  const customerIds = Array.from({ length: 30 }, () => OID());
  const customerNames = [
    'Abdul Rahman Al-Dosari', 'Tariq Al-Mutairi', 'Nasser Al-Qahtani', 'Saad Al-Anazi', 'Faisal Al-Harbi',
    'Khalid Al-Otaibi', 'Bandar Al-Shammari', 'Al-Faris Trading Co.', 'Gulf Auto Group', 'Najd Motors LLC',
    'Yasser Al-Qahtani', 'Majed Abdullah', 'Sami Al-Jaber', 'Mohammad Al-Sahlawi', 'Salem Al-Dawsari',
    'Salman Al-Faraj', 'Yasir Al-Shahrani', 'Fahad Al-Muwallad', 'Hattan Bahebri', 'Abdullah Otayf',
    'Ziyad Al-Sahafi', 'Mohammed Al-Breik', 'Ali Al-Bulaihi', 'Abdulelah Al-Amri', 'Sultan Al-Ghannam',
    'Modern Transport Solutions', 'Red Sea Logistics', 'Desert Oasis Rentals', 'Riyadh Business Hub', 'Elite Car Services'
  ];

  const customers = customerNames.map((name, i) => ({
    _id: customerIds[i],
    customerId: `CUS-${String(i + 1).padStart(4, '0')}`,
    fullName: name,
    phone: `+96651200${String(i + 1).padStart(4, '0')}`,
    email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`,
    customerType: i >= 25 ? 'Business' : 'Individual',
    vatRegistrationNumber: i >= 25 ? `3${Math.floor(Math.random() * 100000000000000)}` : undefined,
    buildingNumber: `${1000 + i}`,
    streetName: i % 2 === 0 ? 'King Fahd Road' : 'Takhassusi Street',
    district: i % 3 === 0 ? 'Al-Olaya' : (i % 3 === 1 ? 'Al-Malaz' : 'Al-Nakheel'),
    city: 'Riyadh',
    postalCode: `${12000 + i}`,
    countryCode: 'SA',
    createdBy: adminId,
  }));
  await Customer.insertMany(customers);

  // ─── 4. SUPPLIERS ──────────────────────────────────────────────────────────
  console.log('🏭 Seeding suppliers…');

  const supplierIds = Array.from({ length: 5 }, () => OID());
  const suppliers = [
    { _id: supplierIds[0], supplierId: 'SUP-0001', companyName: 'Toyota Arabia', companyNumber: 'CR-1010123456', email: 'sales@toyota-arabia.com', phone: '+966112345601', address: 'Riyadh Industrial Area, Riyadh', status: 'active', salesAgent: { name: 'Ahmad Bin Said', phone: '+966551110001', email: 'ahmad@toyota-arabia.com', designation: 'Fleet Sales Manager' }, createdBy: adminId },
    { _id: supplierIds[1], supplierId: 'SUP-0002', companyName: 'BMW Middle East', companyNumber: 'CR-2020234567', email: 'info@bmw-me.com', phone: '+966112345602', address: 'King Fahd Road, Riyadh', status: 'active', salesAgent: { name: 'Stefan Mueller', phone: '+966551110002', email: 'stefan@bmw-me.com', designation: 'Corporate Sales' }, createdBy: adminId },
    { _id: supplierIds[2], supplierId: 'SUP-0003', companyName: 'Gulf Auto Traders', companyNumber: 'CR-3030345678', email: 'trade@gulfauto.sa', phone: '+966112345603', address: 'Al-Khobar Industrial', status: 'active', salesAgent: { name: 'Yousuf Al-Khalid', phone: '+966551110003', email: 'yousuf@gulfauto.sa', designation: 'Sales Representative' }, createdBy: adminId },
    { _id: supplierIds[3], supplierId: 'SUP-0004', companyName: 'Hyundai Saudi', companyNumber: 'CR-4040456789', email: 'fleet@hyundai.sa', phone: '+966112345604', address: 'Jeddah Coastal Road', status: 'active', salesAgent: { name: 'Ibrahim Al-Fayed', phone: '+966551110004', email: 'ibrahim@hyundai.sa', designation: 'Regional Sales' }, createdBy: adminId },
    { _id: supplierIds[4], supplierId: 'SUP-0005', companyName: 'Mercedes-Benz Riyadh', companyNumber: 'CR-5050567890', email: 'sales@mercedes-riyadh.com', phone: '+966112345605', address: 'Dammam Highway', status: 'active', salesAgent: { name: 'Hans Gruber', phone: '+966551110005', email: 'hans@mercedes.com', designation: 'Showroom Manager' }, createdBy: adminId },
  ];
  await Supplier.insertMany(suppliers);

  // ─── 5. CARS ───────────────────────────────────────────────────────────────
  console.log('🚗 Seeding cars…');

  const carIds = Array.from({ length: 40 }, () => OID());
  const carBrands = ['Toyota', 'BMW', 'Audi', 'Hyundai', 'Kia', 'Mercedes', 'Nissan', 'Ford', 'Chevrolet', 'Lexus'];
  const carModels: Record<string, string[]> = {
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Hilux'],
    'BMW': ['320i', '520i', 'X5', '740li', 'X3'],
    'Audi': ['A4', 'A6', 'Q5', 'Q7', 'A8'],
    'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent'],
    'Kia': ['Optima', 'Sportage', 'Sorento', 'K5', 'Cerato'],
    'Mercedes': ['C200', 'E300', 'S450', 'GLE', 'GLC'],
    'Nissan': ['Sunny', 'Altima', 'Patrol', 'X-Terra', 'Maxima'],
    'Ford': ['Taurus', 'Mustang', 'Explorer', 'Expedition', 'F-150'],
    'Chevrolet': ['Malibu', 'Tahoe', 'Suburban', 'Camaro', 'Captiva'],
    'Lexus': ['ES350', 'LS500', 'LX600', 'RX350', 'IS300']
  };

  const statuses: string[] = ['In Stock', 'In Stock', 'In Stock', 'In Stock', 'Sold', 'Sold', 'Sold', 'Rented', 'Under Repair', 'Reserved'];
  const colors = ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red', 'Brown'];

  const carDocs = carIds.map((id, i) => {
    const brand = carBrands[i % carBrands.length];
    const models = carModels[brand];
    const model = models[i % models.length];
    const status = i < 15 ? 'In Stock' : (i < 30 ? 'Sold' : (i < 35 ? 'Rented' : (i < 38 ? 'Under Repair' : 'Reserved')));
    
    return {
      _id: id,
      carId: `CAR-${String(i + 1).padStart(3, '0')}`,
      brand,
      model,
      year: 2020 + (i % 5),
      chassisNumber: `VIN${Math.floor(Math.random() * 10000000000000000)}`,
      engineNumber: `ENG${Math.floor(Math.random() * 100000000)}`,
      sequenceNumber: `SEQ-${String(i + 1).padStart(3, '0')}`,
      color: colors[i % colors.length],
      status,
      purchasePrice: 50000 + (Math.floor(Math.random() * 150) * 1000),
      totalRepairCost: status === 'Under Repair' ? 2000 + (i * 100) : 0,
      createdBy: adminId,
    };
  });
  await Car.insertMany(carDocs);

  // ─── 6. CAR PURCHASES ──────────────────────────────────────────────────────
  console.log('🛒 Seeding car purchases…');

  const purchaseDocs = carDocs.map((car, i) => {
    const supplier = suppliers[i % suppliers.length];
    const pId = OID();
    const txnId = OID();
    const pDate = subDays(new Date(), 30 + (i * 5));

    return {
      _id: pId,
      car: car._id,
      supplier: supplier._id,
      supplierName: supplier.companyName,
      supplierContact: supplier.phone,
      purchasePrice: car.purchasePrice,
      purchaseDate: pDate,
      isNewCar: i % 3 === 0,
      transactionId: txnId,
      createdBy: adminId,
    };
  });

  const purchaseTxns = purchaseDocs.map(p => ({
    _id: p.transactionId,
    transactionId: nextTxnId(),
    date: p.purchaseDate,
    type: 'Expense',
    category: 'Car Purchase',
    amount: p.purchasePrice,
    description: `Car purchase — ${p.supplierName} (${carDocs.find(c => c._id.equals(p.car))?.carId})`,
    referenceId: p._id.toString(),
    referenceType: 'CarPurchase',
    isAutoGenerated: true,
    createdBy: adminId,
  }));

  await Transaction.insertMany(purchaseTxns);
  await CarPurchase.insertMany(purchaseDocs);
  
  for (const p of purchaseDocs) {
    await Car.updateOne({ _id: p.car }, { $set: { purchase: p._id } });
  }

  // ─── 7. VEHICLE DOCUMENTS ──────────────────────────────────────────────────
  console.log('📄 Seeding vehicle documents…');

  const today = new Date();
  const allDocs: any[] = [];

  carDocs.forEach((car, i) => {
    // 3 documents per car
    const types: Array<'Insurance' | 'Road Permit' | 'Registration Card'> = ['Insurance', 'Registration Card', 'Road Permit'];
    
    types.forEach((type, j) => {
      // Some documents expiring soon to test alerts
      let expiryDays = 30 + (i * 10) + (j * 5);
      if (i === 0) expiryDays = 5; // CAR-001 has doc expiring in 5 days
      if (i === 1) expiryDays = 25; // CAR-002 has doc expiring in 25 days

      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + expiryDays);
      
      const issueDate = new Date(expiryDate);
      issueDate.setFullYear(expiryDate.getFullYear() - 1);

      allDocs.push({
        _id: OID(),
        car: car._id,
        carId: car.carId,
        documentType: type,
        issueDate,
        expiryDate,
        alertSent30: expiryDays < 30,
        alertSent15: expiryDays < 15,
        alertSent7: expiryDays < 7,
        createdBy: adminId,
      });
    });
  });
  await VehicleDocument.insertMany(allDocs);

  // ─── 8. SALES (Cash & Installments) ────────────────────────────────────────
  console.log('💰 Seeding sales…');

  const soldCars = carDocs.filter(c => c.status === 'Sold');
  const cashSales: any[] = [];
  const installmentSales: any[] = [];
  const salesTxns: any[] = [];

  soldCars.forEach((car, i) => {
    const customer = customers[i % customers.length];
    const agent = employees.filter(e => e.department === 'Sales')[i % 3];
    const saleDate = subDays(new Date(), 10 + i);
    const salePrice = car.purchasePrice + 5000 + (Math.floor(Math.random() * 10) * 1000);
    const vatRate = 15;
    const vatAmount = salePrice * 0.15;
    const finalPriceWithVat = salePrice + vatAmount;

    if (i % 2 === 0) {
      // Cash Sale
      const saleId = OID();
      const txnId = OID();
      cashSales.push({
        _id: saleId,
        saleId: `CSH-${String(cashSales.length + 1).padStart(4, '0')}`,
        car: car._id, carId: car.carId,
        customer: customer._id, customerName: customer.fullName, customerPhone: customer.phone,
        salePrice, finalPrice: salePrice, vatRate, vatAmount, finalPriceWithVat,
        agentName: agent.name, agentCommission: agent.commissionRate || 0,
        saleDate, status: 'Active',
        invoiceType: customer.customerType === 'Business' ? 'Standard' : 'Simplified',
        zatcaStatus: 'Reported',
        zatcaQRCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkAQMAAABKLAcXAAAABlBMVEUAAAD///+l2Z/dAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gYFDBIWKyE9bAAAABlJREFUOMtjYBgFo2AUjIJRMApGwSgYBaMAAAAByAABp76S7gAAAABJRU5ErkJggg==',
        createdBy: adminId,
      });
      salesTxns.push({
        _id: txnId, transactionId: nextTxnId(), date: saleDate, type: 'Income', category: 'Cash Sale', amount: finalPriceWithVat, description: `Cash sale — ${car.carId}`, referenceId: saleId.toString(), referenceType: 'CashSale', isAutoGenerated: true, createdBy: adminId
      });
    } else {
      // Installment Sale
      const saleId = OID();
      const downPayment = Math.floor(salePrice * 0.2);
      const principal = salePrice - downPayment;
      const interestRate = 10;
      const totalInterest = principal * (interestRate / 100);
      const loanAmount = principal + totalInterest;
      
      const tenure = 12 + (i % 3) * 12;
      const monthly = Math.round(loanAmount / tenure);
      
      installmentSales.push({
        _id: saleId,
        saleId: `INS-${String(installmentSales.length + 1).padStart(4, '0')}`,
        car: car._id, carId: car.carId,
        customer: customer._id, customerName: customer.fullName, customerPhone: customer.phone,
        totalPrice: salePrice, downPayment, loanAmount, monthlyPayment: monthly,
        interestRate, tenureMonths: tenure, startDate: saleDate,
        totalPaid: downPayment + monthly * 2, remainingAmount: loanAmount - (monthly * 2),
        nextPaymentDate: addMonths(saleDate, 3), nextPaymentAmount: monthly,
        finalPriceWithVat,
        agentName: agent.name, agentCommission: agent.commissionRate || 0,
        status: 'Active',
        zatcaStatus: 'Reported',
        zatcaQRCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkAQMAAABKLAcXAAAABlBMVEUAAAD///+l2Z/dAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gYFDBIWKyE9bAAAABlJREFUOMtjYBgFo2AUjIJRMApGwSgYBaMAAAAByAABp76S7gAAAABJRU5ErkJggg==',
        paymentSchedule: Array.from({ length: tenure }, (_, j) => ({
          installmentNumber: j + 1,
          dueDate: addMonths(saleDate, j + 1),
          amount: monthly,
          status: j < 2 ? 'Paid' : (j === 2 && i === 1 ? 'Overdue' : 'Pending'), // Make some overdue
          paidDate: j < 2 ? addMonths(saleDate, j + 1) : undefined,
          paidAmount: j < 2 ? monthly : undefined,
          lateFee: j === 2 && i === 1 ? 200 : 0
        })),
        monthlyLateFee: 200,
        createdBy: adminId,
      });

      // Down payment txn
      salesTxns.push({
        _id: OID(), transactionId: nextTxnId(), date: saleDate, type: 'Income', category: 'Installment Payment', amount: downPayment, description: `Down payment — ${car.carId}`, referenceId: saleId.toString(), referenceType: 'InstallmentSale', isAutoGenerated: true, createdBy: adminId
      });
      // Paid installments txns
      salesTxns.push({
        _id: OID(), transactionId: nextTxnId(), date: addMonths(saleDate, 1), type: 'Income', category: 'Installment Payment', amount: monthly, description: `Installment #1 — ${car.carId}`, referenceId: saleId.toString(), referenceType: 'InstallmentSale', isAutoGenerated: true, createdBy: adminId
      });
      salesTxns.push({
        _id: OID(), transactionId: nextTxnId(), date: addMonths(saleDate, 2), type: 'Income', category: 'Installment Payment', amount: monthly, description: `Installment #2 — ${car.carId}`, referenceId: saleId.toString(), referenceType: 'InstallmentSale', isAutoGenerated: true, createdBy: adminId
      });
    }
  });

  await CashSale.insertMany(cashSales);
  await InstallmentSale.insertMany(installmentSales);
  await Transaction.insertMany(salesTxns);

  // ─── 9. RENTALS ────────────────────────────────────────────────────────────
  console.log('🚙 Seeding rentals…');

  const rentalCars = carDocs.filter(c => c.status === 'Rented' || (c.status === 'In Stock' && Math.random() > 0.7));
  const rentals: any[] = [];
  const rentalTxns: any[] = [];

  rentalCars.forEach((car, i) => {
    const customer = customers[10 + i];
    const rentalId = OID();
    const startDate = subDays(new Date(), 5 + i);
    const endDate = addMonths(startDate, 1);
    const dailyRate = 200 + (i * 50);
    const totalAmount = dailyRate * 30;
    const vatAmount = totalAmount * 0.15;
    const totalWithVat = totalAmount + vatAmount;

    rentals.push({
      _id: rentalId,
      rentalId: `RNT-${String(i + 1).padStart(4, '0')}`,
      car: car._id, carId: car.carId,
      customer: customer._id, customerName: customer.fullName, customerPhone: customer.phone,
      startDate, endDate, dailyRate, totalAmount, vatRate: 15, vatAmount, totalAmountWithVat: totalWithVat,
      securityDeposit: 1000,
      status: i % 3 === 0 ? 'Completed' : (i % 3 === 1 ? 'Overdue' : 'Active'),
      zatcaStatus: 'Reported',
      zatcaQRCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkAQMAAABKLAcXAAAABlBMVEUAAAD///+l2Z/dAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gYFDBIWKyE9bAAAABlJREFUOMtjYBgFo2AUjIJRMApGwSgYBaMAAAAByAABp76S7gAAAABJRU5ErkJggg==',
      actualReturnDate: i % 3 === 0 ? endDate : undefined,
      createdBy: adminId,
    });

    if (i % 3 === 0) {
      rentalTxns.push({
        _id: OID(), transactionId: nextTxnId(), date: endDate, type: 'Income', category: 'Rental Income', amount: totalWithVat, description: `Rental payment — ${car.carId}`, referenceId: rentalId.toString(), referenceType: 'Rental', isAutoGenerated: true, createdBy: adminId
      });
    }
  });
  await Rental.insertMany(rentals);
  await Transaction.insertMany(rentalTxns);

  // ─── 10. REPAIRS ───────────────────────────────────────────────────────────
  console.log('🔧 Seeding repairs…');
  
  const repairDocs: any[] = [];
  const repairTxns: any[] = [];

  carDocs.filter(c => c.totalRepairCost > 0 || c.status === 'Under Repair').forEach((car, i) => {
    const repId = OID();
    const repDate = subDays(new Date(), 5 + i);
    const labor = 500 + (i * 100);
    const parts = car.totalRepairCost > 0 ? car.totalRepairCost - labor : 1500;
    const total = labor + parts;

    repairDocs.push({
      _id: repId,
      car: car._id, carId: car.carId,
      repairDescription: i % 2 === 0 ? 'Regular Maintenance & Oil Change' : 'Suspension and Brake repair',
      partsReplaced: i % 2 === 0 ? 'Oil Filter, Air Filter, Synthetic Oil' : 'Brake Pads, Shock Absorbers',
      laborCost: labor, repairCost: parts, totalCost: total,
      repairDate: repDate,
      status: car.status === 'Under Repair' ? 'In Progress' : 'Completed',
      createdBy: adminId,
    });

    if (car.status !== 'Under Repair') {
      repairTxns.push({
        _id: OID(), transactionId: nextTxnId(), date: repDate, type: 'Expense', category: 'Car Repair', amount: total, description: `Repair cost — ${car.carId}`, referenceId: repId.toString(), referenceType: 'Repair', isAutoGenerated: true, createdBy: adminId
      });
    }
  });
  await Repair.insertMany(repairDocs);
  await Transaction.insertMany(repairTxns);

  // ─── 11. SALARY PAYMENTS ───────────────────────────────────────────────────
  console.log('💵 Seeding salary payments…');

  const salaryPayments: any[] = [];
  const salaryTxns: any[] = [];

  for (let m = 1; m <= 4; m++) {
    employees.forEach((emp, i) => {
      const salId = OID();
      const payDate = d(2026, m, 28);
      const pId = `SAL-${m}-${String(i + 1).padStart(3, '0')}`;

      salaryPayments.push({
        _id: salId,
        paymentId: pId,
        employee: emp._id,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        amount: emp.baseSalary,
        paymentDate: payDate,
        month: m, year: 2026,
        paymentType: 'Monthly',
        status: 'Active',
        createdBy: adminId,
      });

      salaryTxns.push({
        _id: OID(), transactionId: nextTxnId(), date: payDate, type: 'Expense', category: 'Salary Payment', amount: emp.baseSalary, description: `Salary — ${emp.name} (${pId})`, referenceId: salId.toString(), referenceType: 'SalaryPayment', isAutoGenerated: true, createdBy: adminId
      });
    });
  }
  await SalaryPayment.insertMany(salaryPayments);
  await Transaction.insertMany(salaryTxns);

  // ─── 12. ZATCA CONFIG ──────────────────────────────────────────────────────
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

  // ─── DONE ───────────────────────────────────────────────────────────────────
  await mongoose.disconnect();

  console.log('\n' + '═'.repeat(60));
  console.log('✅ COMPREHENSIVE SEED COMPLETE');
  console.log('═'.repeat(60));
  console.log('\n🔑 Login Credentials:');
  console.log('  Admin:           admin@amyalcar.com       / Admin@123');
  console.log('  Sales Person:    sales-person@amyalcar.com/ SalesPerson@123');
  console.log('\n📊 Data Summary:');
  console.log(`  Users: 4  |  Employees: 10  |  Customers: 30  |  Suppliers: 5`);
  console.log(`  Cars: 40  |  Cash Sales: ${cashSales.length}  |  Installments: ${installmentSales.length}`);
  console.log(`  Rentals: ${rentals.length}  |  Repairs: ${repairDocs.length}  |  Salaries: ${salaryPayments.length}`);
  console.log(`  Transactions: ${txnSeq}`);
  console.log('═'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
