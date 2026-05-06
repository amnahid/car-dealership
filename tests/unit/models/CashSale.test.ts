import CashSale from '@/models/CashSale';
import mongoose from 'mongoose';

describe('CashSale Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const sale = new CashSale({});

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
    expect(err.errors.salePrice).toBeDefined();
    expect(err.errors.finalPrice).toBeDefined();
    expect(err.errors.saleDate).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default values for status, vatRate, and applyVat', async () => {
    const sale = new CashSale({
      car: new mongoose.Types.ObjectId(),
      carId: 'CAR-001',
      customer: new mongoose.Types.ObjectId(),
      customerName: 'John Doe',
      customerPhone: '123456789',
      salePrice: 10000,
      finalPrice: 10000,
      saleDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(sale.status).toBe('Active');
    expect(sale.vatRate).toBe(15);
    expect(sale.applyVat).toBe(true);
    expect(sale.isDeleted).toBe(false);
    expect(sale.zatcaStatus).toBe('Pending');
  });

  it('should fail validation if status is not in enum', async () => {
    const sale = new CashSale({
      car: new mongoose.Types.ObjectId(),
      carId: 'CAR-001',
      customer: new mongoose.Types.ObjectId(),
      customerName: 'John Doe',
      customerPhone: '123456789',
      salePrice: 10000,
      finalPrice: 10000,
      saleDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
      status: 'InvalidStatus' as any,
    });

    let err: any;
    try {
      await sale.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.status).toBeDefined();
    expect(err.errors.status.kind).toBe('enum');
  });
});
