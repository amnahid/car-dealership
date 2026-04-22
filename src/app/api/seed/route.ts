import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import User from '@/models/User';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import Employee from '@/models/Employee';
import Supplier from '@/models/Supplier';
import CarPurchase from '@/models/CarPurchase';
import Rental from '@/models/Rental';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import Repair from '@/models/Repair';
import Transaction from '@/models/Transaction';
import { hashPassword } from '@/lib/auth';
import mongoose from 'mongoose';

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Accounts Officer' | 'Sales Agent';
}

const DEFAULT_USERS: SeedUser[] = [
  { name: 'System Admin', email: 'admin@amyalcar.com', password: 'Admin@123', role: 'Admin' },
  { name: 'Manager User', email: 'manager@amyalcar.com', password: 'Manager@123', role: 'Manager' },
  { name: 'Accounts Officer', email: 'accounts@amyalcar.com', password: 'Accounts@123', role: 'Accounts Officer' },
  { name: 'Sales Agent', email: 'agent@amyalcar.com', password: 'Agent@123', role: 'Sales Agent' },
];

const SAMPLE_CARS = [
  { brand: 'Toyota', model: 'Camry', year: 2023, color: 'Silver', chassisNumber: 'CH-Toy-001', engineNumber: 'ENG-Toy-001', status: 'In Stock' as const, purchasePrice: 2500000 },
  { brand: 'Honda', model: 'Civic', year: 2022, color: 'White', chassisNumber: 'CH-Hon-002', engineNumber: 'ENG-Hon-002', status: 'Rented' as const, purchasePrice: 2200000 },
  { brand: 'Toyota', model: 'Corolla', year: 2023, color: 'Black', chassisNumber: 'CH-Toy-003', engineNumber: 'ENG-Toy-003', status: 'In Stock' as const, purchasePrice: 2100000 },
  { brand: 'Hyundai', model: 'Elantra', year: 2022, color: 'Red', chassisNumber: 'CH-Hyu-004', engineNumber: 'ENG-Hyu-004', status: 'Sold' as const, purchasePrice: 1800000 },
  { brand: 'Kia', model: 'Sportage', year: 2023, color: 'Blue', chassisNumber: 'CH-Kia-005', engineNumber: 'ENG-Kia-005', status: 'Under Repair' as const, purchasePrice: 2800000 },
  { brand: 'Toyota', model: 'RAV4', year: 2023, color: 'Gray', chassisNumber: 'CH-Toy-006', engineNumber: 'ENG-Toy-006', status: 'In Stock' as const, purchasePrice: 3200000 },
  { brand: 'Honda', model: 'Accord', year: 2022, color: 'White', chassisNumber: 'CH-Hon-007', engineNumber: 'ENG-Hon-007', status: 'Rented' as const, purchasePrice: 2600000 },
  { brand: 'Nissan', model: 'Altima', year: 2023, color: 'Black', chassisNumber: 'CH-Nis-008', engineNumber: 'ENG-Nis-008', status: 'In Stock' as const, purchasePrice: 2400000 },
  { brand: 'Hyundai', model: 'Tucson', year: 2022, color: 'Silver', chassisNumber: 'CH-Hyu-009', engineNumber: 'ENG-Hyu-009', status: 'Sold' as const, purchasePrice: 2700000 },
  { brand: 'Kia', model: 'Seltos', year: 2023, color: 'Red', chassisNumber: 'CH-Kia-010', engineNumber: 'ENG-Kia-010', status: 'In Stock' as const, purchasePrice: 2000000 },
];

const SAMPLE_CUSTOMERS = [
  { fullName: 'Ahmed Hassan', phone: '+8801711123456', address: 'Dhaka, Bangladesh', nationalId: '1234567890', email: 'ahmed@example.com' },
  { fullName: 'Fatema Begum', phone: '+8801711234567', address: 'Chittagong, Bangladesh', nationalId: '2345678901', email: 'fatema@example.com' },
  { fullName: 'Karim Islam', phone: '+8801711345678', address: 'Sylhet, Bangladesh', nationalId: '3456789012', email: 'karim@example.com' },
  { fullName: 'Nusrat Jahan', phone: '+8801711456789', address: 'Dhaka, Bangladesh', nationalId: '4567890123', email: 'nusrat@example.com' },
  { fullName: 'Rahim Uddin', phone: '+8801711567890', address: 'Khulna, Bangladesh', nationalId: '5678901234', email: 'rahim@example.com' },
  { fullName: 'Sania Ahmed', phone: '+8801711678901', address: 'Rajshahi, Bangladesh', nationalId: '6789012345', email: 'sania@example.com' },
  { fullName: 'Tariq Mahmud', phone: '+8801711789012', address: 'Dhaka, Bangladesh', nationalId: '7890123456', email: 'tariq@example.com' },
  { fullName: 'Lina Khan', phone: '+8801711890123', address: 'Chittagong, Bangladesh', nationalId: '8901234567', email: 'lina@example.com' },
];

const SAMPLE_EMPLOYEES = [
  { name: 'Mr. Khan', phone: '+8801911111111', email: 'khan@amyalcar.com', designation: 'Sales Manager', department: 'Sales', baseSalary: 50000 },
  { name: 'Md. Hasan', phone: '+8801911222222', email: 'hasan@amyalcar.com', designation: 'Sales Executive', department: 'Sales', baseSalary: 30000 },
  { name: 'Ali Ahmed', phone: '+8801911333333', email: 'ali@amyalcar.com', designation: 'Mechanic', department: 'Service', baseSalary: 25000 },
  { name: 'Sarah Begum', phone: '+8801911444444', email: 'sarah@amyalcar.com', designation: 'Accountant', department: 'Accounts', baseSalary: 35000 },
  { name: 'Jamal Hossain', phone: '+8801911555555', email: 'jamal@amyalcar.com', designation: 'Driver', department: 'Operations', baseSalary: 20000 },
];

const SAMPLE_SUPPLIERS = [
  { companyName: 'Auto Import Ltd', companyNumber: 'AIL-001', phone: '+8801911000001', email: 'info@autoimport.com', address: 'Dhaka, Bangladesh', status: 'active' as const, salesAgent: { name: 'Mr. Rahman', phone: '+8801711000001', email: 'rahman@autoimport.com', designation: 'Sales Executive' } },
  { companyName: 'Motor World Inc', companyNumber: 'MWI-002', phone: '+8801911000002', email: 'sales@motorworld.com', address: 'Chittagong, Bangladesh', status: 'active' as const, salesAgent: { name: 'Md. Kamal', phone: '+8801711000002', email: 'kamal@motorworld.com', designation: 'Regional Manager' } },
  { companyName: 'Global Auto Traders', companyNumber: 'GAT-003', phone: '+8801911000003', email: 'contact@globalauto.com', address: 'Sylhet, Bangladesh', status: 'active' as const, salesAgent: { name: 'Ahmed Hassan', phone: '+8801711000003', email: 'hassan@globalauto.com', designation: 'Sales Manager' } },
  { companyName: 'Premier Car Supplies', companyNumber: 'PCS-004', phone: '+8801911000004', email: 'info@premiercars.com', address: 'Khulna, Bangladesh', status: 'inactive' as const, salesAgent: { name: 'Karim Ahmed', phone: '+8801711000004', email: 'karim@premiercars.com', designation: 'Account Manager' } },
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function clearAllCollections() {
  const collections = ['transactions', 'installmentsales', 'cashsales', 'rentals', 'repairs', 'carpurchases', 'employees', 'customers', 'cars', 'suppliers', 'users'];
  for (const name of collections) {
    try {
      await mongoose.connection.collection(name).deleteMany({});
    } catch (e) {
      console.log(`Warning: Could not clear collection ${name}:`, e instanceof Error ? e.message : String(e));
    }
  }
}

async function seedUsers(force: boolean) {
  const created: string[] = [];
  const existing: string[] = [];

  if (force) {
    const deleteResult = await User.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} users`);
  }

  for (const userData of DEFAULT_USERS) {
    let existingUser;
    try {
      existingUser = await User.findOne({ email: userData.email });
    } catch {
      existingUser = null;
    }
    
    if (existingUser) {
      existing.push(userData.email);
    } else {
      try {
        const hashedPassword = await hashPassword(userData.password);
        await User.create({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          isActive: true,
        });
        created.push(userData.email);
      } catch (e) {
        if (e instanceof Error && e.message.includes('E11000')) {
          existing.push(userData.email);
        } else {
          throw e;
        }
      }
    }
  }

  return { created, existing };
}

async function seedCars(
  adminUserId: mongoose.Types.ObjectId,
  suppliers: Awaited<ReturnType<typeof seedSuppliers>>
) {
  const cars = [];
  for (const carData of SAMPLE_CARS) {
    const car = await Car.create({
      ...carData,
      status: carData.status,
      createdBy: adminUserId,
    });
    cars.push(car);

    if (carData.status === 'In Stock' || carData.status === 'Under Repair') {
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const purchaseDate = getRandomDate(90);
      const isNewCar = Math.random() > 0.5;

      const transaction = await Transaction.create({
        date: purchaseDate,
        type: 'Expense',
        category: 'Car Purchase',
        amount: carData.purchasePrice,
        description: `Purchase: ${carData.brand} ${carData.model} (${car.carId}) from ${supplier.companyName}`,
        referenceId: car.carId,
        referenceType: 'CarPurchase',
        createdBy: adminUserId,
      });

      const purchase = await CarPurchase.create({
        car: car._id,
        supplier: supplier._id,
        supplierName: supplier.companyName,
        supplierContact: supplier.phone,
        purchasePrice: carData.purchasePrice,
        purchaseDate,
        isNewCar,
        conditionImages: [],
        insuranceExpiry: getRandomDate(365),
        registrationExpiry: getRandomDate(365),
        roadPermitExpiry: getRandomDate(180),
        transactionId: transaction._id,
        createdBy: adminUserId,
      });
      car.purchase = purchase._id;
      await car.save();
    }
  }
  return cars;
}

async function seedCustomers(adminUserId: mongoose.Types.ObjectId) {
  const customers = [];
  for (const customerData of SAMPLE_CUSTOMERS) {
    const customer = await Customer.create({
      ...customerData,
      createdBy: adminUserId,
    });
    customers.push(customer);
  }
  return customers;
}

async function seedSuppliers(adminUserId: mongoose.Types.ObjectId) {
  const suppliers = [];
  for (const supplierData of SAMPLE_SUPPLIERS) {
    const supplier = await Supplier.create({
      ...supplierData,
      createdBy: adminUserId,
    });
    suppliers.push(supplier);
  }
  return suppliers;
}

async function seedEmployees(adminUserId: mongoose.Types.ObjectId) {
  const employees = [];
  for (const empData of SAMPLE_EMPLOYEES) {
    const employee = await Employee.create({
      ...empData,
      joiningDate: getRandomDate(365),
      isActive: true,
      createdBy: adminUserId,
    });
    employees.push(employee);
  }
  return employees;
}

async function seedRentals(cars: Awaited<ReturnType<typeof seedCars>>, customers: Awaited<ReturnType<typeof seedCustomers>>, adminUserId: mongoose.Types.ObjectId) {
  const rentedCars = cars.filter(c => c.status === 'Rented');

  const rentalData = [
    { carIdx: 0, customerIdx: 0, dailyRate: 2500, days: 7, status: 'Completed' as const, returnDaysAgo: 30 },
    { carIdx: 1, customerIdx: 1, dailyRate: 2200, days: 5, status: 'Active' as const, returnDaysAgo: null },
    { carIdx: 0, customerIdx: 2, dailyRate: 2500, days: 3, status: 'Cancelled' as const, returnDaysAgo: null },
    { carIdx: 1, customerIdx: 3, dailyRate: 2200, days: 10, status: 'Completed' as const, returnDaysAgo: 15 },
    { carIdx: 0, customerIdx: 4, dailyRate: 2500, days: 14, status: 'Active' as const, returnDaysAgo: null },
  ];

  const rentals = [];
  for (const r of rentalData) {
    const car = rentedCars[r.carIdx % rentedCars.length];
    const customer = customers[r.customerIdx];
    const startDate = getRandomDate(60);
    const endDate = addDays(startDate, r.days);

    const rental = await Rental.create({
      car: car._id,
      carId: car.carId,
      customer: customer._id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      startDate,
      endDate,
      dailyRate: r.dailyRate,
      totalAmount: r.dailyRate * r.days,
      securityDeposit: 5000,
      status: r.status,
      returnDate: r.status === 'Completed' ? endDate : undefined,
      actualReturnDate: r.returnDaysAgo ? addDays(new Date(), -r.returnDaysAgo) : undefined,
      createdBy: adminUserId,
    });
    rentals.push(rental);
  }
  return rentals;
}

async function seedCashSales(cars: Awaited<ReturnType<typeof seedCars>>, customers: Awaited<ReturnType<typeof seedCustomers>>, adminUserId: mongoose.Types.ObjectId) {
  const soldCars = cars.filter(c => c.status === 'Sold');

  const salesData = [
    { carIdx: 0, customerIdx: 3, salePrice: 2100000, discount: 50000, agentCommission: 20000, agentName: 'Mr. Hasan' },
    { carIdx: 1, customerIdx: 5, salePrice: 2900000, discount: 100000, agentCommission: 30000, agentName: 'Md. Hasan' },
    { carIdx: 2, customerIdx: 7, salePrice: 2800000, discount: 0, agentCommission: 25000, agentName: 'Mr. Khan' },
  ];

  const sales = [];
  for (const s of salesData) {
    const car = soldCars[s.carIdx % soldCars.length];
    const customer = customers[s.customerIdx];
    const finalPrice = s.salePrice - s.discount;

    const sale = await CashSale.create({
      car: car._id,
      carId: car.carId,
      customer: customer._id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      salePrice: s.salePrice,
      discountAmount: s.discount,
      finalPrice,
      agentName: s.agentName,
      agentCommission: s.agentCommission,
      saleDate: getRandomDate(90),
      status: 'Active',
      createdBy: adminUserId,
    });
    sales.push(sale);
  }
  return sales;
}

async function seedInstallmentSales(cars: Awaited<ReturnType<typeof seedCars>>, customers: Awaited<ReturnType<typeof seedCustomers>>, adminUserId: mongoose.Types.ObjectId) {
  const inStockCars = cars.filter(c => c.status === 'In Stock').slice(0, 3);

  const installmentData = [
    { carIdx: 0, customerIdx: 0, totalPrice: 2800000, downPayment: 560000, tenureMonths: 36, monthsAgo: 10 },
    { carIdx: 1, customerIdx: 2, totalPrice: 3200000, downPayment: 640000, tenureMonths: 48, monthsAgo: 24 },
    { carIdx: 2, customerIdx: 4, totalPrice: 2400000, downPayment: 480000, tenureMonths: 24, monthsAgo: 20 },
  ];

  const sales = [];
  for (const ins of installmentData) {
    const car = inStockCars[ins.carIdx];
    const customer = customers[ins.customerIdx];
    const loanAmount = ins.totalPrice - ins.downPayment;
    const monthlyPayment = loanAmount / ins.tenureMonths;
    const startDate = addDays(new Date(), -(ins.monthsAgo * 30));

    const paymentSchedule = [];
    let totalPaid = 0;
    for (let i = 1; i <= ins.tenureMonths; i++) {
      const dueDate = addDays(startDate, i * 30);
      const isPaid = i <= ins.monthsAgo;
      const status = isPaid ? 'Paid' as const : (dueDate < new Date() ? 'Overdue' as const : 'Pending' as const);

      paymentSchedule.push({
        installmentNumber: i,
        dueDate,
        amount: monthlyPayment,
        status,
        paidDate: isPaid ? dueDate : undefined,
        paidAmount: isPaid ? monthlyPayment : undefined,
      });

      if (isPaid) totalPaid += monthlyPayment;
    }

    const sale = await InstallmentSale.create({
      car: car._id,
      carId: car.carId,
      customer: customer._id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      totalPrice: ins.totalPrice,
      downPayment: ins.downPayment,
      loanAmount,
      monthlyPayment,
      interestRate: 0,
      tenureMonths: ins.tenureMonths,
      startDate,
      paymentSchedule,
      nextPaymentDate: addDays(startDate, (ins.monthsAgo + 1) * 30),
      nextPaymentAmount: monthlyPayment,
      totalPaid,
      remainingAmount: loanAmount - totalPaid,
      status: totalPaid >= loanAmount ? 'Completed' as const : 'Active' as const,
      createdBy: adminUserId,
    });
    sales.push(sale);
  }
  return sales;
}

async function seedRepairs(cars: Awaited<ReturnType<typeof seedCars>>, adminUserId: mongoose.Types.ObjectId) {
  const repairCars = cars.slice(0, 4);

  const repairData = [
    { carIdx: 0, laborCost: 5000, repairCost: 15000, status: 'Completed' as const, daysAgo: 45 },
    { carIdx: 1, laborCost: 3000, repairCost: 8000, status: 'Completed' as const, daysAgo: 30 },
    { carIdx: 2, laborCost: 8000, repairCost: 25000, status: 'In Progress' as const, daysAgo: 5 },
    { carIdx: 3, laborCost: 2000, repairCost: 5000, status: 'Pending' as const, daysAgo: 0 },
  ];

  const repairs = [];
  for (const r of repairData) {
    const car = repairCars[r.carIdx];
    const repair = await Repair.create({
      car: car._id,
      carId: car.carId,
      repairDescription: 'General maintenance and inspection',
      partsReplaced: 'Oil filter, air filter',
      laborCost: r.laborCost,
      repairCost: r.repairCost,
      repairDate: addDays(new Date(), -r.daysAgo),
      status: r.status,
      createdBy: adminUserId,
    });
    repairs.push(repair);
  }
  return repairs;
}

async function seedTransactions(
  cars: any[],
  rentals: any[],
  cashSales: any[],
  installmentSales: any[],
  repairs: any[],
  employees: any[],
  adminUserId: mongoose.Types.ObjectId
) {
  const transactions = [];

  for (const car of cars) {
    if (car.status === 'In Stock' || car.status === 'Under Repair') {
      const purchase = await CarPurchase.findOne({ car: car._id });
      if (purchase) {
        transactions.push(await Transaction.create({
          date: purchase.purchaseDate,
          type: 'Expense',
          category: 'Car Purchase',
          amount: purchase.purchasePrice,
          description: `Car purchase: ${car.brand} ${car.model}`,
          referenceId: car.carId,
          referenceType: 'Car',
          isAutoGenerated: true,
          createdBy: adminUserId,
        }));
      }
    }
  }

  for (const rental of rentals) {
    transactions.push(await Transaction.create({
      date: rental.startDate,
      type: 'Income',
      category: 'Rental Income',
      amount: rental.totalAmount,
      description: `Rental income: ${rental.carId} - ${rental.customerName}`,
      referenceId: rental.rentalId,
      referenceType: 'Rental',
      isAutoGenerated: true,
      createdBy: adminUserId,
    }));

    if (rental.securityDeposit > 0) {
      transactions.push(await Transaction.create({
        date: rental.startDate,
        type: 'Income',
        category: 'Rental Income',
        amount: rental.securityDeposit,
        description: `Security deposit: ${rental.carId}`,
        referenceId: rental.rentalId,
        referenceType: 'Rental',
        isAutoGenerated: true,
        createdBy: adminUserId,
      }));
    }
  }

  for (const sale of cashSales) {
    transactions.push(await Transaction.create({
      date: sale.saleDate,
      type: 'Income',
      category: 'Cash Sale',
      amount: sale.finalPrice,
      description: `Cash sale: ${sale.carId} - ${sale.customerName}`,
      referenceId: sale.saleId,
      referenceType: 'CashSale',
      isAutoGenerated: true,
      createdBy: adminUserId,
    }));

    if (sale.agentCommission && sale.agentCommission > 0) {
      transactions.push(await Transaction.create({
        date: sale.saleDate,
        type: 'Expense',
        category: 'Other Expense',
        amount: sale.agentCommission,
        description: `Agent commission: ${sale.agentName}`,
        referenceId: sale.saleId,
        referenceType: 'CashSale',
        isAutoGenerated: true,
        createdBy: adminUserId,
      }));
    }
  }

  for (const sale of installmentSales) {
    transactions.push(await Transaction.create({
      date: sale.startDate,
      type: 'Income',
      category: 'Installment Payment',
      amount: sale.downPayment,
      description: `Down payment: ${sale.carId} - ${sale.customerName}`,
      referenceId: sale.saleId,
      referenceType: 'InstallmentSale',
      isAutoGenerated: true,
      createdBy: adminUserId,
    }));
  }

  for (const repair of repairs) {
    transactions.push(await Transaction.create({
      date: repair.repairDate,
      type: 'Expense',
      category: 'Car Repair',
      amount: repair.totalCost,
      description: `Repair: ${repair.carId}`,
      referenceId: repair.carId,
      referenceType: 'Repair',
      isAutoGenerated: true,
      createdBy: adminUserId,
    }));
  }

  for (const emp of employees) {
    transactions.push(await Transaction.create({
      date: addDays(new Date(), -15),
      type: 'Expense',
      category: 'Salary Payment',
      amount: emp.baseSalary,
      description: `Salary: ${emp.name} - ${emp.designation}`,
      referenceId: emp.employeeId,
      referenceType: 'Employee',
      isAutoGenerated: true,
      createdBy: adminUserId,
    }));
  }

  transactions.push(await Transaction.create({
    date: getRandomDate(30),
    type: 'Expense',
    category: 'Office Expense',
    amount: 15000,
    description: 'Office supplies and utilities',
    createdBy: adminUserId,
  }));

  transactions.push(await Transaction.create({
    date: getRandomDate(30),
    type: 'Income',
    category: 'Other Income',
    amount: 5000,
    description: 'Miscellaneous income',
    createdBy: adminUserId,
  }));

  return transactions;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (force) {
      await clearAllCollections();
    }

const { created: usersCreated, existing: usersExisting } = await seedUsers(force);

    const adminUser = await User.findOne({ email: 'admin@amyalcar.com' });
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 500 });
    }
    const adminUserId = adminUser._id as mongoose.Types.ObjectId;

    const suppliers = await seedSuppliers(adminUserId);
    const cars = await seedCars(adminUserId, suppliers);
    const customers = await seedCustomers(adminUserId);
    const employees = await seedEmployees(adminUserId);
    const rentals = await seedRentals(cars, customers, adminUserId);
    const cashSales = await seedCashSales(cars, customers, adminUserId);
    const installmentSales = await seedInstallmentSales(cars, customers, adminUserId);
    const repairs = await seedRepairs(cars, adminUserId);
    const transactions = await seedTransactions(cars, rentals, cashSales, installmentSales, repairs, employees, adminUserId);

    return NextResponse.json({
      message: 'Database seeded successfully',
      data: {
        users: { created: usersCreated.length, existing: usersExisting.length },
        suppliers: suppliers.length,
        cars: cars.length,
        customers: customers.length,
        employees: employees.length,
        rentals: rentals.length,
        cashSales: cashSales.length,
        installmentSales: installmentSales.length,
        repairs: repairs.length,
        transactions: transactions.length,
      },
      defaultCredentials: {
        admin: { email: 'admin@amyalcar.com', password: 'Admin@123' },
        manager: { email: 'manager@amyalcar.com', password: 'Manager@123' },
        accounts: { email: 'accounts@amyalcar.com', password: 'Accounts@123' },
        agent: { email: 'agent@amyalcar.com', password: 'Agent@123' },
      },
      hint: 'Use ?force=true to clear and reseed everything',
    }, { status: 201 });
  } catch (error) {
    console.error('Seed error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();

    const [users, suppliers, cars, customers, employees, rentals, cashSales, installmentSales, repairs, transactions] = await Promise.all([
      User.countDocuments(),
      Supplier.countDocuments(),
      Car.countDocuments(),
      Customer.countDocuments(),
      Employee.countDocuments(),
      Rental.countDocuments(),
      CashSale.countDocuments(),
      InstallmentSale.countDocuments(),
      Repair.countDocuments(),
      Transaction.countDocuments({ isDeleted: false }),
    ]);

    return NextResponse.json({
      message: 'Database statistics',
      data: { users, suppliers, cars, customers, employees, rentals, cashSales, installmentSales, repairs, transactions },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}