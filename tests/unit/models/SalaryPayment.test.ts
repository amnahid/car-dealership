import SalaryPayment from '@/models/SalaryPayment';
import mongoose from 'mongoose';

describe('SalaryPayment Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const payment = new SalaryPayment({});

    let err: any;
    try {
      await payment.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.employee).toBeDefined();
    expect(err.errors.employeeId).toBeDefined();
    expect(err.errors.employeeName).toBeDefined();
    expect(err.errors.amount).toBeDefined();
    expect(err.errors.paymentDate).toBeDefined();
    expect(err.errors.month).toBeDefined();
    expect(err.errors.year).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default values for paymentType, status, and isDeleted', () => {
    const payment = new SalaryPayment({
      employee: new mongoose.Types.ObjectId(),
      employeeId: 'EMP-001',
      employeeName: 'John Staff',
      amount: 3000,
      paymentDate: new Date(),
      month: 5,
      year: 2024,
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(payment.paymentType).toBe('Monthly');
    expect(payment.status).toBe('Active');
    expect(payment.isDeleted).toBe(false);
  });

  it('should fail validation if month is out of range', async () => {
    const payment = new SalaryPayment({
      employee: new mongoose.Types.ObjectId(),
      employeeId: 'EMP-001',
      employeeName: 'John Staff',
      amount: 3000,
      paymentDate: new Date(),
      month: 13,
      year: 2024,
      createdBy: new mongoose.Types.ObjectId(),
    });

    let err: any;
    try {
      await payment.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.month).toBeDefined();
    expect(err.errors.month.kind).toBe('max');
  });
});
