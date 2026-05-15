import InstallmentSale from '@/models/InstallmentSale';
import mongoose from 'mongoose';

describe('InstallmentSale Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const sale = new InstallmentSale({});

    let err: any;
    try {
      await sale.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.car).toBeDefined();
    expect(err.errors.carId).toBeDefined();
    expect(err.errors.customer).toBeDefined();
    expect(err.errors.customerName).toBeDefined();
    expect(err.errors.customerPhone).toBeDefined();
    expect(err.errors.totalPrice).toBeDefined();
    expect(err.errors.downPayment).toBeDefined();
    expect(err.errors.loanAmount).toBeDefined();
    expect(err.errors.monthlyPayment).toBeDefined();
    expect(err.errors.tenureMonths).toBeDefined();
    expect(err.errors.startDate).toBeDefined();
    expect(err.errors.nextPaymentDate).toBeDefined();
    expect(err.errors.nextPaymentAmount).toBeDefined();
    expect(err.errors.remainingAmount).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default values', async () => {
    const sale = new InstallmentSale({
      car: new mongoose.Types.ObjectId(),
      carId: 'CAR-001',
      customer: new mongoose.Types.ObjectId(),
      customerName: 'John Doe',
      customerPhone: '123456789',
      totalPrice: 100000,
      downPayment: 20000,
      loanAmount: 80000,
      monthlyPayment: 2000,
      tenureMonths: 48,
      startDate: new Date(),
      nextPaymentDate: new Date(),
      nextPaymentAmount: 2000,
      remainingAmount: 80000,
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(sale.status).toBe('Active');
    expect(sale.interestRate).toBe(0);
    expect(sale.totalPaid).toBe(0);
    expect(sale.deliveryThresholdPercent).toBe(30);
    expect(sale.monthlyLateFee).toBe(200);
    expect(sale.otherFees).toBe(0);
    expect(sale.isDeleted).toBe(false);
  });

  it('should save otherFees', async () => {
    const sale = new InstallmentSale({
      car: new mongoose.Types.ObjectId(),
      carId: 'CAR-001',
      customer: new mongoose.Types.ObjectId(),
      customerName: 'John Doe',
      customerPhone: '123456789',
      totalPrice: 100000,
      downPayment: 20000,
      loanAmount: 80000,
      monthlyPayment: 2000,
      tenureMonths: 48,
      startDate: new Date(),
      nextPaymentDate: new Date(),
      nextPaymentAmount: 2000,
      remainingAmount: 80000,
      createdBy: new mongoose.Types.ObjectId(),
      otherFees: 1500,
    });

    expect(sale.otherFees).toBe(1500);
  });
});
