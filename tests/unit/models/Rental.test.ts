import Rental from '@/models/Rental';
import mongoose from 'mongoose';

describe('Rental Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const rental = new Rental({});

    let err: any;
    try {
      await rental.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.car).toBeDefined();
    expect(err.errors.carId).toBeDefined();
    expect(err.errors.customer).toBeDefined();
    expect(err.errors.customerName).toBeDefined();
    expect(err.errors.customerPhone).toBeDefined();
    expect(err.errors.startDate).toBeDefined();
    expect(err.errors.endDate).toBeDefined();
    expect(err.errors.dailyRate).toBeDefined();
    expect(err.errors.totalAmount).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default values for status, vatRate, and rateType', async () => {
    const rental = new Rental({
      car: new mongoose.Types.ObjectId(),
      carId: 'CAR-001',
      customer: new mongoose.Types.ObjectId(),
      customerName: 'John Doe',
      customerPhone: '123456789',
      startDate: new Date(),
      endDate: new Date(),
      dailyRate: 100,
      totalAmount: 100,
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(rental.status).toBe('Active');
    expect(rental.vatRate).toBe(15);
    expect(rental.rateType).toBe('Daily');
    expect(rental.isDeleted).toBe(false);
  });
});
